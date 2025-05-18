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
        # Получаем все слои пакета
        layers = []
        current = pkt
        while current:
            layers.append(current.name)
            current = current.payload

        return {
            "src": pkt[IP].src if IP in pkt else None,
            "dst": pkt[IP].dst if IP in pkt else None,
            "protocols": layers,  # Список всех протоколов в пакете
            "length": len(pkt),
            "summary": pkt.summary()  # Добавляем полное описание пакета
        }
    except Exception as e:
        print(f"❌ Error converting packet: {e}")
        return None
