from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
import threading
from traffic.sniffer import start_sniffing
from traffic.optimizer import optimize_packets
import asyncio
from scapy.layers.inet import IP  # обязательно!
from scapy.layers.inet import IP, TCP, UDP
from scapy.packet import Packet

app = FastAPI()

# Разрешаем подключение с фронта
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)




clients = []
raw_packets = []

@app.websocket("/ws/traffic")
async def traffic_ws(websocket: WebSocket):
    await websocket.accept()
    clients.append(websocket)
    print(f"📡 WebSocket client connected: {websocket.client}")
    try:
        while True:
            await asyncio.sleep(1)
            if raw_packets:
                try:
                    print(f"⚙️ Optimizing packets... ({len(raw_packets)} raw)")
                    packet_dicts = [packet_to_dict(pkt) for pkt in raw_packets]
                    packet_dicts = [pkt for pkt in packet_dicts if pkt]  # remove None
                    optimized = optimize_packets(packet_dicts)
                    print(f"📤 Sending {len(optimized)} packets to client.")
                    await websocket.send_json(optimized)
                    raw_packets.clear()
                except Exception as e:
                    print(f"❌ Error during optimization or sending: {e}")
    except Exception as e:
        print(f"⚠️ WebSocket error or disconnect: {e}")
    finally:
        clients.remove(websocket)
        print(f"❌ Client disconnected: {websocket.client}")
#test

# Поток сниффера
def start_sniff():
    print("🚀 Sniffer thread starting...")

    def push(pkt):
        print(f"📥 Captured packet: {pkt.summary()}")
        raw_packets.append(pkt)

    try:
        start_sniffing(push)
    except Exception as e:
        print(f"❌ Error in sniffer: {e}")

# Запуск сниффера в фоне
threading.Thread(target=start_sniff, daemon=True).start()

from scapy.layers.inet import IP, TCP, UDP

def packet_to_dict(pkt: Packet) -> dict:
    try:
        if IP in pkt:
            proto = pkt[IP].proto
            proto_name = {
                6: "TCP",
                17: "UDP",
                1: "ICMP"
            }.get(proto, str(proto))

            return {
                "src": pkt[IP].src,
                "dst": pkt[IP].dst,
                "proto": proto_name,
                "length": len(pkt)
            }
        else:
            return None  # Нет IP-уровня
    except Exception as e:
        print(f"❌ Ошибка при преобразовании пакета: {e}")
        return None
