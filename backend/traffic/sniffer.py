from scapy.all import sniff, conf, IFACES
from typing import Callable
import time

def start_sniffing(callback: Callable):
    def process_packet(packet):
        try:
            print(f"📦 Got packet: {packet.summary()}")
            callback(packet)
        except Exception as e:
            print(f"Error processing packet: {e}")

    # Получаем список всех интерфейсов
    print("\nДоступные сетевые интерфейсы:")
    for iface in IFACES.data.values():
        if hasattr(iface, 'name'):
            print(f"- {iface.name}")

    try:
        print("\nНачинаем захват пакетов на всех интерфейсах...")
        # Захватываем все пакеты без фильтра
        sniff(prn=process_packet, 
              store=0,
              count=0)  # count=0 для бесконечного захвата
    except Exception as e:
        print(f"❌ Ошибка сниффера: {e}")
        time.sleep(1)
        # Перезапускаем захват
        start_sniffing(callback)
