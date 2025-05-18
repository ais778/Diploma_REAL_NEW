from fastapi import FastAPI, WebSocket, HTTPException, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import threading
from traffic.sniffer import start_sniffing
from traffic.optimizer import TrafficOptimizer, optimize_packets
from traffic.metrics import NetworkMetricsCollector
import asyncio
from scapy.layers.inet import IP, TCP, UDP
from scapy.packet import Packet
from typing import Dict, List, Optional, Set
from datetime import datetime
import json
from prometheus_client import make_asgi_app
from pydantic import BaseModel

# Define request model for QoS rules
class QoSRuleRequest(BaseModel):
    protocol: str
    priority: int
    bandwidth_limit: Optional[float] = None

app = FastAPI(title="Network Traffic Optimization System")

# Add prometheus metrics endpoint
metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances
optimizer = TrafficOptimizer()
metrics_collector = NetworkMetricsCollector()
active_connections: Set[WebSocket] = set()
raw_packets = []

# QoS configuration endpoints
@app.post("/api/qos/rules")
async def set_qos_rule(rule: QoSRuleRequest):
    """Set QoS rules for a specific protocol"""
    try:
        optimizer.set_qos_rule(rule.protocol, rule.priority, rule.bandwidth_limit)
        return {
            "message": f"QoS rule set for {rule.protocol}",
            "status": "success",
            "rule": {
                "protocol": rule.protocol,
                "priority": rule.priority,
                "bandwidth_limit": rule.bandwidth_limit
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/api/metrics/current")
async def get_current_metrics():
    """Get current network metrics"""
    try:
        stats = metrics_collector.calculate_statistics()
        bandwidth = metrics_collector.get_bandwidth_utilization()
        latency = metrics_collector.get_latency_metrics()
        
        return {
            "statistics": stats,
            "bandwidth_utilization": bandwidth,
            "latency_metrics": latency
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/metrics/clear")
async def clear_metrics_history():
    """Clear metrics history"""
    try:
        metrics_collector.clear_history()
        return {"message": "Metrics history cleared", "status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def packet_to_dict(pkt: Packet) -> dict:
    """Convert Scapy packet to dictionary format"""
    try:
        # Get all layers in packet
        layers = []
        current = pkt
        while current:
            layers.append(current.name)
            current = current.payload

        packet_dict = {
            "src": pkt[IP].src if IP in pkt else None,
            "dst": pkt[IP].dst if IP in pkt else None,
            "protocols": layers,
            "length": len(pkt),
            "timestamp": datetime.now().isoformat(),
            "summary": pkt.summary()
        }

        # Add TCP-specific information
        if TCP in pkt:
            packet_dict["tcp_info"] = {
                "sport": pkt[TCP].sport,
                "dport": pkt[TCP].dport,
                "flags": pkt[TCP].flags,
                "window": pkt[TCP].window
            }

        # Add UDP-specific information
        if UDP in pkt:
            packet_dict["udp_info"] = {
                "sport": pkt[UDP].sport,
                "dport": pkt[UDP].dport,
                "len": pkt[UDP].len
            }

        return packet_dict
    except Exception as e:
        print(f"❌ Error converting packet: {e}")
        return None

@app.websocket("/ws/traffic")
async def traffic_ws(websocket: WebSocket):
    """WebSocket endpoint for real-time traffic monitoring"""
    await websocket.accept()
    active_connections.add(websocket)
    print(f"📡 WebSocket client connected: {websocket.client}")
    
    try:
        while True:
            try:
                await asyncio.sleep(1)
                if raw_packets:
                    try:
                        print(f"⚙️ Processing {len(raw_packets)} packets...")
                        
                        # Convert packets to dictionary format
                        packet_dicts = [packet_to_dict(pkt) for pkt in raw_packets]
                        packet_dicts = [pkt for pkt in packet_dicts if pkt]
                        
                        # Apply optimization
                        optimized_packets = optimize_packets(packet_dicts)
                        
                        # Record metrics
                        for packet in optimized_packets:
                            metrics_collector.record_packet(packet)
                        
                        # Get current metrics
                        metrics = await get_current_metrics()
                        
                        # Prepare response
                        response = {
                            "packets": optimized_packets,
                            "metrics": metrics,
                            "timestamp": datetime.now().isoformat()
                        }
                        
                        if websocket in active_connections:  # Check if still connected
                            print(f"📤 Sending data to client...")
                            await websocket.send_json(response)
                        raw_packets.clear()
                        
                    except Exception as e:
                        print(f"❌ Error processing packets: {e}")
                        
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"⚠️ WebSocket loop error: {e}")
                break
                
    except WebSocketDisconnect:
        print(f"❌ Client disconnected normally: {websocket.client}")
    except Exception as e:
        print(f"⚠️ WebSocket error: {e}")
    finally:
        active_connections.discard(websocket)
        print(f"❌ Client disconnected: {websocket.client}")

@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on server shutdown"""
    print("🔄 Shutting down server...")
    # Close all active WebSocket connections
    for connection in active_connections.copy():
        try:
            await connection.close()
        except Exception as e:
            print(f"Error closing connection: {e}")
    active_connections.clear()
    print("✅ Server shutdown complete")

def start_sniff():
    """Start packet sniffer in background thread"""
    print("🚀 Starting network sniffer...")

    def packet_callback(pkt):
        print(f"📥 Captured packet: {pkt.summary()}")
        raw_packets.append(pkt)

    try:
        start_sniffing(packet_callback)
    except Exception as e:
        print(f"❌ Sniffer error: {e}")

# Start sniffer in background thread
threading.Thread(target=start_sniff, daemon=True).start()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
