from typing import List, Dict
from collections import defaultdict
import time
from scapy.all import IP, TCP, UDP
import queue
import numpy as np
from sklearn.cluster import KMeans
from datetime import datetime

def optimize_packets(packets: List[Dict]) -> List[Dict]:
    """Main optimization function"""
    optimizer = TrafficOptimizer()
    
    # Set default QoS rules
    optimizer.set_qos_rule("TCP", priority=2)
    optimizer.set_qos_rule("UDP", priority=1)
    optimizer.set_qos_rule("ICMP", priority=0)
    
    # Apply optimizations
    packets = optimizer.apply_traffic_shaping(packets)
    packets = optimizer.optimize_bandwidth(packets)
    
    # Analyze patterns
    patterns = optimizer.analyze_traffic_patterns(packets)
    
    # Add optimization metadata
    for packet in packets:
        packet["optimization"] = {
            "patterns": patterns,
            "timestamp": datetime.now().isoformat()
        }
    
    return packets

class TrafficOptimizer:
    def __init__(self):
        self.rate_limits = {}  # IP -> rate limit
        self.packet_queues = {}  # IP -> Queue
        self.last_sent_time = {}  # IP -> last packet sent time
        self.qos_rules = defaultdict(lambda: {"priority": 0, "bandwidth_limit": None})
        self.traffic_history = []
        
    def optimize_traffic(self, packet, recommendations: Dict) -> bool:
        """
        Apply optimization strategies based on recommendations.
        Returns True if packet should be forwarded, False if it should be dropped/delayed.
        """
        if not recommendations.get('optimization_needed'):
            return True

        src_ip = packet[IP].src if IP in packet else None
        if not src_ip:
            return True

        # Initialize structures for this IP if needed
        if src_ip not in self.packet_queues:
            self.packet_queues[src_ip] = queue.Queue()
            self.last_sent_time[src_ip] = time.time()

        for action in recommendations['actions']:
            if action['type'] == 'rate_limit':
                return self._apply_rate_limiting(src_ip, packet, action['target_rate'])
            elif action['type'] == 'packet_size_optimization':
                return self._optimize_packet_size(packet, action['target_size'])
            elif action['type'] == 'latency_optimization':
                return self._optimize_latency(src_ip, packet)
            elif action['type'] == 'protocol_suggestion':
                self._suggest_protocol_optimization(packet)

        return True

    def _apply_rate_limiting(self, src_ip: str, packet, target_rate: float) -> bool:
        """
        Implement token bucket rate limiting.
        """
        current_time = time.time()
        time_diff = current_time - self.last_sent_time.get(src_ip, 0)
        
        # Calculate allowed packets in this time window
        allowed_packets = target_rate * time_diff
        
        if allowed_packets >= 1:
            self.last_sent_time[src_ip] = current_time
            return True
        else:
            # Queue packet for later transmission
            self.packet_queues[src_ip].put(packet)
            return False

    def _optimize_packet_size(self, packet, target_size: int) -> bool:
        """
        Implement packet size optimization.
        """
        if len(packet) > target_size:
            print(f"⚠️ Packet size ({len(packet)} bytes) exceeds optimal size ({target_size} bytes)")
            # In a real implementation, this would fragment the packet
            return False
        return True

    def _optimize_latency(self, src_ip: str, packet) -> bool:
        """
        Implement latency optimization strategies.
        """
        if TCP in packet:
            # Prioritize interactive traffic
            if packet[TCP].flags & 0x08:  # PSH flag
                return True
            # Implement delayed ACK for non-interactive traffic
            if packet[TCP].flags & 0x10:  # ACK flag
                return self._apply_rate_limiting(src_ip, packet, 100)  # Lower rate for ACKs
        return True

    def _suggest_protocol_optimization(self, packet) -> None:
        """
        Analyze and suggest protocol optimizations.
        """
        if TCP in packet:
            window_size = packet[TCP].window
            if window_size < 65535:
                print(f"💡 Suggestion: Consider increasing TCP window size for better throughput")
            
            if packet[TCP].flags & 0x02:  # SYN flag
                print("💡 Suggestion: Consider TCP Fast Open for connection optimization")

    def process_queued_packets(self) -> List:
        """
        Process and return any queued packets that can now be sent.
        """
        packets_to_send = []
        current_time = time.time()

        for src_ip, queue in self.packet_queues.items():
            while not queue.empty():
                if self._apply_rate_limiting(src_ip, None, self.rate_limits.get(src_ip, 1000)):
                    packets_to_send.append(queue.get())
                else:
                    break

        return packets_to_send

    def set_qos_rule(self, protocol: str, priority: int, bandwidth_limit: float = None):
        """Set QoS rules for specific protocols"""
        self.qos_rules[protocol] = {
            "priority": priority,
            "bandwidth_limit": bandwidth_limit
        }
    
    def analyze_traffic_patterns(self, packets: List[Dict]) -> Dict:
        """Analyze traffic patterns using machine learning"""
        if not packets:
            return {}
            
        # Extract features for analysis
        features = np.array([[
            len(pkt.get("protocols", [])),
            pkt.get("length", 0)
        ] for pkt in packets])
        
        # Determine optimal number of clusters (max 3)
        n_samples = len(features)
        n_clusters = min(3, max(1, n_samples // 10))  # At least 10 samples per cluster
        
        # Perform clustering
        if len(features) >= n_clusters:
            model = KMeans(n_clusters=n_clusters, n_init=10)
            clusters = model.fit_predict(features)
            return {
                "clusters": clusters.tolist(),
                "cluster_centers": model.cluster_centers_.tolist(),
                "n_clusters": n_clusters,
                "samples_per_cluster": [int(sum(clusters == i)) for i in range(n_clusters)]
            }
        return {}

    def apply_traffic_shaping(self, packets: List[Dict]) -> List[Dict]:
        """Apply traffic shaping based on QoS rules"""
        shaped_packets = []
        
        for packet in packets:
            protocols = packet.get("protocols", [])
            
            # Calculate packet priority based on protocols
            max_priority = 0
            for protocol in protocols:
                priority = self.qos_rules[protocol]["priority"]
                max_priority = max(max_priority, priority)
            
            # Add QoS metadata
            packet["qos"] = {
                "priority": max_priority,
                "timestamp": datetime.now().isoformat()
            }
            
            shaped_packets.append(packet)
        
        # Sort packets by priority
        shaped_packets.sort(key=lambda x: x["qos"]["priority"], reverse=True)
        return shaped_packets

    def optimize_bandwidth(self, packets: List[Dict]) -> List[Dict]:
        """Optimize bandwidth allocation"""
        protocol_usage = defaultdict(int)
        
        # Calculate bandwidth usage per protocol
        for packet in packets:
            for protocol in packet.get("protocols", []):
                protocol_usage[protocol] += packet.get("length", 0)
        
        # Apply bandwidth limits
        optimized_packets = []
        for packet in packets:
            protocols = packet.get("protocols", [])
            should_throttle = False
            
            for protocol in protocols:
                limit = self.qos_rules[protocol]["bandwidth_limit"]
                if limit and protocol_usage[protocol] > limit:
                    should_throttle = True
                    break
            
            packet["throttled"] = should_throttle
            optimized_packets.append(packet)
        
        return optimized_packets
