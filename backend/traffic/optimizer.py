from typing import List, Dict
from collections import defaultdict

def optimize_packets(packets: List[Dict]) -> List[Dict]:
    print(f"🔍 Оптимизация {len(packets)} пакетов...")

    # Удаляем дубликаты по src/dst/protocols
    seen = set()
    optimized = []

    for pkt in packets:
        key = (pkt.get("src"), pkt.get("dst"), tuple(pkt.get("protocols", [])))
        if key not in seen:
            seen.add(key)
            optimized.append(pkt)

    # Подсчёт статистики по протоколам
    proto_stats = defaultdict(int)
    for pkt in optimized:
        for proto in pkt.get("protocols", []):
            proto_stats[proto] += 1

    print("📊 Протоколы:", dict(proto_stats))

    return optimized
