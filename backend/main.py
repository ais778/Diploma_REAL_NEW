from fastapi import FastAPI, WebSocket, HTTPException, WebSocketDisconnect, Depends
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
from prometheus_client import make_asgi_app
from pydantic import BaseModel
from scapy.all import IFACES
import time
from sqlalchemy.orm import Session
from database import get_db, SessionLocal
from models import QoSRuleHistory
import crud

# QoS Rule Models
class QoSRule(BaseModel):
    protocol: str
    priority: int
    bandwidth_limit: Optional[float] = None

class QoSRuleRequest(BaseModel):
    protocol: str
    priority: int
    bandwidth_limit: Optional[float] = None

# SDN Rule Models
class SDNRuleRequest(BaseModel):
    source_ip: str
    destination_ip: str
    action: str

class SDNRuleResponse(BaseModel):
    id: int
    source_ip: str
    destination_ip: str
    action: str
    priority: int
    status: str
    created_at: datetime
    updated_at: datetime

app = FastAPI(title="Network Traffic Optimization System")

metrics_app = make_asgi_app()
app.mount("/metrics", metrics_app)

# CORS config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # поидее не безопасно нужно локалхост фронта написать 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
optimizer = TrafficOptimizer()
metrics_collector = NetworkMetricsCollector()
active_connections: Set[WebSocket] = set()
raw_packets = []
packet_buffer = []
last_send_time = time.time()
SEND_INTERVAL = 2.0
MAX_PACKETS_PER_BATCH = 50

# QoS Endpoints
@app.get("/api/qos/rules", response_model=List[QoSRule])
async def get_qos_rules(db: Session = Depends(get_db)):
    rules = crud.get_qos_rules(db)
    return [
        QoSRule(
            protocol=r.protocol,
            priority=r.priority,
            bandwidth_limit=r.bandwidth_bps
        ) for r in rules
    ]

@app.post("/api/qos/rules")
async def set_qos_rule(rule: QoSRuleRequest, db: Session = Depends(get_db)):
    print(f"📝 Setting QoS rule: {rule}")
    try:
        db_rule = crud.update_qos_rule(db, rule.protocol, rule.priority, rule.bandwidth_limit)
        optimizer.set_qos_rule(
            protocol=rule.protocol,
            priority=rule.priority,
            bandwidth_limit=rule.bandwidth_limit
        )
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
        print(f" Error setting QoS rule: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/qos/rules/{protocol}")
async def delete_qos_rule(protocol: str, db: Session = Depends(get_db)):
    print(f"🗑️ Deleting QoS rule for protocol: {protocol}")
    try:
        if not crud.delete_qos_rule(db, protocol):
            print(f" No rule found for {protocol}")
            raise HTTPException(status_code=404, detail=f"No rule found for {protocol}")
        optimizer.remove_qos_rule(protocol)
        print(f"✅ Rule deleted from database and optimizer")
        return {"message": f"QoS rule deleted for {protocol}", "status": "success"}
    except HTTPException:
        raise
    except Exception as e:
        print(f" Error deleting QoS rule: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# SDN Endpoints
@app.get("/api/sdn/rules", response_model=List[SDNRuleResponse])
async def get_sdn_rules(db: Session = Depends(get_db)):
    rules = crud.get_sdn_rules(db)
    return rules

@app.post("/api/sdn/rules", response_model=SDNRuleResponse)
async def add_sdn_rule(rule: SDNRuleRequest, db: Session = Depends(get_db)):
    db_rule = crud.create_sdn_rule(db, rule.source_ip, rule.destination_ip, rule.action)
    return db_rule

@app.delete("/api/sdn/rules/{rule_id}")
async def delete_sdn_rule(rule_id: int, db: Session = Depends(get_db)):
    deleted = crud.delete_sdn_rule(db, rule_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Rule not found")
    return {"message": "SDN rule deleted", "status": "success"}

# Metrics Endpoint
@app.get("/api/metrics/current")
async def get_current_metrics():
    """Get current network metrics (original + optimized stats)"""
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
    try:
        metrics_collector.clear_history()
        return {"message": "Metrics history cleared", "status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def packet_to_dict(pkt: Packet) -> dict:
    """Convert Scapy packet to dictionary format"""
    try:
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

        if TCP in pkt:
            packet_dict["tcp_info"] = {
                "sport": pkt[TCP].sport,
                "dport": pkt[TCP].dport,
                "flags": str(pkt[TCP].flags),
                "window": pkt[TCP].window
            }
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
    """WebSocket endpoint for real-time traffic monitoring (with both stats)"""
    await websocket.accept()
    active_connections.add(websocket)
    print(f"📡 WebSocket client connected: {websocket.client}")

    try:
        while True:
            await asyncio.sleep(1)
            try:
                global last_send_time
                now = time.time()
                if raw_packets:
                    packet_buffer.extend(raw_packets)
                    raw_packets.clear()

                if now - last_send_time >= SEND_INTERVAL and packet_buffer:
                    print(f"⚙️ Processing {len(packet_buffer)} packets (batch) ...")

                    packets_to_process = packet_buffer[-MAX_PACKETS_PER_BATCH:]
                    packet_dicts = [packet_to_dict(pkt) for pkt in packets_to_process]
                    packet_dicts = [pkt for pkt in packet_dicts if pkt]

                    for packet in packet_dicts:
                        metrics_collector.record_packet(packet, optimized=False)

                    optimized_packets = optimize_packets(packet_dicts)
                    for packet in optimized_packets:
                        metrics_collector.record_packet(packet, optimized=True)

                    metrics = await get_current_metrics()

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

                    response = {
                        "packets": optimized_packets[-MAX_PACKETS_PER_BATCH:],
                        "metrics": metrics,
                        "aggregation": protocol_aggregation,
                        "timestamp": datetime.now().isoformat()
                    }
                    await websocket.send_json(response)
                    packet_buffer.clear()
                    last_send_time = now
                else:
                    metrics = await get_current_metrics()
                    response = {
                        "packets": [],
                        "metrics": metrics,
                        "timestamp": datetime.now().isoformat()
                    }
                    await websocket.send_json(response)
            except WebSocketDisconnect:
                print(f"Client disconnected normally: {websocket.client}")
                break
            except Exception as e:
                print(f" WebSocket loop error: {e}")
                break
    finally:
        active_connections.discard(websocket)
        print(f"❌ Client disconnected: {websocket.client}")

@app.on_event("shutdown")
async def shutdown_event():
    print("🔄 Shutting down server...")
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

threading.Thread(target=start_sniff, daemon=True).start()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
