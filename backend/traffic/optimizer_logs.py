import math
import random

def js_round(n: float) -> int:
    """
    Mimics JavaScript's Math.round behavior for positive numbers.
    """
    return math.floor(n + 0.5)

MIN_COMPRESSIBLE_SIZE = 64

def get_optimized_size(packet_length: int, protocols: list[str], settings: dict) -> int:
 
    current_size = float(packet_length)
    total_reduction_bytes = 0.0

    PROTOCOL_OPTIMIZATION_EFFECTS = {
        "HTTP": {"header_reduction_per_kb": (10, 20), "content_reduction_per_kb": (500, 700)}, # Bytes reduction per KB of packet_length
        "TCP": {"header_reduction_per_kb": (3, 7), "content_reduction_per_kb": (50, 150)}, # Bytes reduction per KB of packet_length
        "UDP": {"header_reduction_per_kb": (1, 5), "content_reduction_per_kb": (20, 80)}, # Bytes reduction per KB of packet_length
        "ETHERNET": {"header_reduction_per_kb": (0, 2), "content_reduction_per_kb": (0, 0)}, # Very little to no compression
        "IP": {"header_reduction_per_kb": (1, 3), "content_reduction_per_kb": (0, 0)}, # Very little to no compression
        "TLS": {"header_reduction_per_kb": (0, 1), "content_reduction_per_kb": (1, 20)}, # Very low due to encryption
        "DNS": {"header_reduction_per_kb": (3, 7), "content_reduction_per_kb": (3, 7)}, # Small, often non-compressible
    }

    base_reduction_range = (0, 0) 
    if packet_length < 100:
        base_reduction_range = (1, 3) 
    elif packet_length < 500:
        base_reduction_range = (10, 50) 
    else:
        base_reduction_range = (50, 200) 

    total_reduction_bytes += random.uniform(base_reduction_range[0], base_reduction_range[1])

    if packet_length >= MIN_COMPRESSIBLE_SIZE:
        for protocol in protocols:
            proto_effects = PROTOCOL_OPTIMIZATION_EFFECTS.get(protocol.upper(), {
                "header_reduction_per_kb": (0, 0), "content_reduction_per_kb": (0, 0)
            })

            scale_factor = packet_length / 1000.0 

            if settings.get("headerCompression", False):
                min_h, max_h = proto_effects["header_reduction_per_kb"]
                reduction = random.uniform(min_h, max_h) * scale_factor
                total_reduction_bytes += reduction
            
            if settings.get("contentCompression", False):
                min_c, max_c = proto_effects["content_reduction_per_kb"]
                reduction = random.uniform(min_c, max_c) * scale_factor
                total_reduction_bytes += reduction

    if settings.get("caching", False):
        caching_reduction_percentage = random.uniform(0.02, 0.10) 
        total_reduction_bytes += current_size * caching_reduction_percentage
    
    current_size = max(0, current_size - total_reduction_bytes) 

    min_allowed_size = js_round(packet_length * 0.65)
    max_allowed_size = js_round(packet_length * 0.90)
    
    final_optimized_size = max(min_allowed_size, min(max_allowed_size, current_size))

    return int(final_optimized_size)

if __name__ == "__main__":
    print("--- Test Cases (More Realistic Optimization) ---")


    pkt_1 = (50, ["HTTP", "TCP", "IP"], {})
    optimized_1 = get_optimized_size(pkt_1[0], pkt_1[1], pkt_1[2])
    print(f"Original: {pkt_1[0]}, Protocols: {pkt_1[1]}, Settings: {pkt_1[2]}, Optimized: {optimized_1}")

    pkt_2 = (300, ["TCP", "IP"], {"headerCompression": True})
    optimized_2 = get_optimized_size(pkt_2[0], pkt_2[1], pkt_2[2])
    print(f"Original: {pkt_2[0]}, Protocols: {pkt_2[1]}, Settings: {pkt_2[2]}, Optimized: {optimized_2}")

    pkt_3 = (1500, ["HTTP", "TCP", "IP"], {"headerCompression": True, "contentCompression": True, "caching": True})
    optimized_3 = get_optimized_size(pkt_3[0], pkt_3[1], pkt_3[2])
    print(f"Original: {pkt_3[0]}, Protocols: {pkt_3[1]}, Settings: {pkt_3[2]}, Optimized: {optimized_3}")

    pkt_4 = (1000, ["TLS", "TCP", "IP"], {"headerCompression": True, "contentCompression": True, "caching": True})
    optimized_4 = get_optimized_size(pkt_4[0], pkt_4[1], pkt_4[2])
    print(f"Original: {pkt_4[0]}, Protocols: {pkt_4[1]}, Settings: {pkt_4[2]}, Optimized: {optimized_4}")

    pkt_5 = (MIN_COMPRESSIBLE_SIZE, ["HTTP", "TCP", "IP"], {"headerCompression": True, "contentCompression": True})
    optimized_5 = get_optimized_size(pkt_5[0], pkt_5[1], pkt_5[2])
    print(f"Original: {pkt_5[0]}, Protocols: {pkt_5[1]}, Settings: {pkt_5[2]}, Optimized: {optimized_5}")