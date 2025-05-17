from typing import List, Dict
from collections import defaultdict

def optimize_packets(packets: List[Dict]) -> List[Dict]:
    print(f"🔍 Оптимизация {len(packets)} пакетов...")

    # 1. Удаление дубликатов по src/dst/proto
    seen = set()
    optimized = []

    for pkt in packets:
        key = (pkt.get("src"), pkt.get("dst"), pkt.get("proto"))
        if None in key:
            continue  # пропускаем неполные
        if key not in seen:
            seen.add(key)
            optimized.append(pkt)

    # 2. Подсчёт статистики по протоколам (можно вывести во фронт)
    proto_stats = defaultdict(int)
    for pkt in optimized:
        proto = pkt.get("proto")
        proto_stats[proto] += 1

    print("📊 Протоколы:", dict(proto_stats))

    return optimized
