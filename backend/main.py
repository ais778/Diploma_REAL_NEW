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
import sys
from scapy.all import IFACES
import time

# Define request model for QoS rules
class QoSRule(BaseModel):
    protocol: str
    priority: int
    bandwidth_limit: Optional[float] = None
    
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
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances
optimizer = TrafficOptimizer()
metrics_collector = NetworkMetricsCollector()
active_connections: Set[WebSocket] = set()
raw_packets = []
packet_buffer = []
last_send_time = time.time()
SEND_INTERVAL = 2.0  # seconds
MAX_PACKETS_PER_BATCH = 50  # Maximum number of packets to send in one batch

# QoS configuration endpoints
@app.get("/api/qos/rules", response_model=List[QoSRule])
async def get_qos_rules():
    try:
        print("QOS_RULES:", optimizer.get_all_qos_rules())  # Вставь сюда
        rules = []
        for protocol, rule in optimizer.get_all_qos_rules().items():
            priority = rule.get("priority", 0)
            bandwidth_limit = rule.get("bandwidth_limit")
            try:
                priority = int(priority)
            except Exception:
                priority = 0
            try:
                bandwidth_limit = float(bandwidth_limit) if bandwidth_limit is not None else None
            except Exception:
                bandwidth_limit = None

            rules.append(QoSRule(protocol=protocol, priority=priority, bandwidth_limit=bandwidth_limit))
        return rules
    except Exception as e:
        print("ERROR in get_qos_rules:", e)
        raise HTTPException(status_code=500, detail=str(e))

    

    
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

@app.delete("/api/qos/rules/{protocol}")
async def delete_qos_rule(protocol: str):
    """Delete QoS rule for a specific protocol"""
    try:
        optimizer.remove_qos_rule(protocol)
        return {
            "message": f"QoS rule deleted for {protocol}",
            "status": "success"
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
                "flags": str(pkt[TCP].flags),
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
            await asyncio.sleep(1)
            try:
                global last_send_time
                now = time.time()
                # Collect packets into buffer
                if raw_packets:
                    packet_buffer.extend(raw_packets)
                    raw_packets.clear()
                # Every SEND_INTERVAL seconds, process and send the batch
                if now - last_send_time >= SEND_INTERVAL and packet_buffer:
                    print(f"⚙️ Processing {len(packet_buffer)} packets (batch) ...")
                    # Limit the number of packets to process
                    packets_to_process = packet_buffer[-MAX_PACKETS_PER_BATCH:]
                    packet_dicts = [packet_to_dict(pkt) for pkt in packets_to_process]
                    packet_dicts = [pkt for pkt in packet_dicts if pkt]
                    
                    # Aggregate packets by protocol
                    protocol_aggregation = {}
                    for pkt in packet_dicts:
                        protocol = pkt.get("protocols", ["Unknown"])[0]
                        if protocol not in protocol_aggregation:
                            protocol_aggregation[protocol] = {
                                "count": 0,
                                "total_size": 0,
                                "packets": []
                            }
                        protocol_aggregation[protocol]["count"] += 1
                        protocol_aggregation[protocol]["total_size"] += pkt.get("length", 0)
                        protocol_aggregation[protocol]["packets"].append(pkt)
                    
                    # Create aggregated response
                    optimized_packets = optimize_packets(packet_dicts)
                    for packet in optimized_packets:
                        metrics_collector.record_packet(packet)
                    metrics = await get_current_metrics()
                    
                    response = {
                        "packets": optimized_packets[-MAX_PACKETS_PER_BATCH:],  # Limit packets in response
                        "metrics": metrics,
                        "aggregation": protocol_aggregation,
                        "timestamp": datetime.now().isoformat()
                    }
                    await websocket.send_json(response)
                    packet_buffer.clear()
                    last_send_time = now
                else:
                    # Send empty packets to keep frontend alive
                    metrics = await get_current_metrics()
                    response = {
                        "packets": [],
                        "metrics": metrics,
                        "timestamp": datetime.now().isoformat()
                    }
                    await websocket.send_json(response)
            except WebSocketDisconnect:
                print(f"❌ Client disconnected normally: {websocket.client}")
                break
            except Exception as e:
                print(f"⚠️ WebSocket loop error: {e}")
                break
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

def choose_interface():
    print("Available network interfaces:")
    iface_list = []
    for i, iface in enumerate(IFACES.values()):
        print(f"[{i}] {iface.name} - {iface.description}")
        iface_list.append(iface.name)
    while True:
        try:
            idx = int(input("Select interface number to sniff (default 0): ") or 0)
            if 0 <= idx < len(iface_list):
                return iface_list[idx]
            else:
                print(f"Invalid selection. Enter a number between 0 and {len(iface_list)-1}.")
        except Exception as e:
            print(f"Invalid input: {e}")

def start_sniff():
    """Start packet sniffer in background thread"""
    print("🚀 Starting network sniffer...")

    def packet_callback(pkt):
        print(f"📥 Captured packet: {pkt.summary()}")
        raw_packets.append(pkt)

    try:
        interface = choose_interface()
        print(f"Using interface: {interface}")
        start_sniffing(packet_callback, interface=interface)
    except Exception as e:
        print(f"❌ Sniffer error: {e}")

# Start sniffer in background thread
threading.Thread(target=start_sniff, daemon=True).start()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
