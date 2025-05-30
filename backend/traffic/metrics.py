from typing import Dict, List
import time
from collections import defaultdict
from prometheus_client import Counter, Gauge, Histogram
import pandas as pd
import numpy as np

class NetworkMetricsCollector:
    def __init__(self):
        # Prometheus metrics
        self.packets_total = Counter('network_packets_total', 'Total number of packets', ['protocol'])
        self.bandwidth_usage = Gauge('network_bandwidth_bytes', 'Current bandwidth usage in bytes', ['protocol'])
        self.latency_hist = Histogram('network_latency_seconds', 'Network latency in seconds')

        # Internal metrics storage
        self.metrics_history = defaultdict(list)  # оригинальные
        self.optimized_history = defaultdict(list)  # оптимизированные
        self.start_time = time.time()
        self.optimized_start_time = None  # когда пошли первые оптимизированные пакеты

    def record_packet(self, packet: Dict, optimized: bool = False):
        """Record metrics for a single packet. If optimized=True, save in optimized_history."""
        packet_size = packet.get("length", 0)
        protocols = packet.get("protocols", [])

        for protocol in protocols:
            self.packets_total.labels(protocol=protocol).inc()
            self.bandwidth_usage.labels(protocol=protocol).set(packet_size)

        # Record timestamp for latency calculation
        current_time = time.time()
        latency = current_time - self.start_time
        self.latency_hist.observe(latency)

        # Store detailed metrics
        if optimized:
            # Первая запись — запоминаем время
            if not self.optimized_history["timestamps"]:
                self.optimized_start_time = current_time
            self.optimized_history["packet_sizes"].append(packet_size)
            self.optimized_history["timestamps"].append(current_time)
            self.optimized_history["protocols"].extend(protocols)
        else:
            self.metrics_history["packet_sizes"].append(packet_size)
            self.metrics_history["timestamps"].append(current_time)
            self.metrics_history["protocols"].extend(protocols)

    def calculate_statistics(self) -> Dict:
        """Calculate various network statistics including original and optimized."""
        # ORIGINAL (неоптимизированные)
        stats = {}
        packet_sizes = np.array(self.metrics_history["packet_sizes"])
        timestamps = np.array(self.metrics_history["timestamps"])
        if packet_sizes.size > 0:
            stats.update({
                "total_packets": int(len(packet_sizes)),
                "original_avg_size": float(np.mean(packet_sizes)),
                "original_throughput": float(np.sum(packet_sizes) / (timestamps[-1] - timestamps[0])) if len(timestamps) > 1 else 0,
                "avg_packet_size": float(np.mean(packet_sizes)),
                "max_packet_size": float(np.max(packet_sizes)),
                "min_packet_size": float(np.min(packet_sizes)),
                "std_packet_size": float(np.std(packet_sizes)),
                "throughput": float(np.sum(packet_sizes) / (timestamps[-1] - timestamps[0])) if len(timestamps) > 1 else 0,
            })
            # Protocol distribution
            protocol_counts = pd.Series(self.metrics_history["protocols"]).value_counts()
            stats["protocol_distribution"] = protocol_counts.to_dict()
            # Moving average
            window_size = min(50, len(packet_sizes))
            if window_size > 0:
                stats["moving_avg_size"] = float(
                    pd.Series(packet_sizes).rolling(window=window_size).mean().iloc[-1]
                )
        else:
            stats.update({
                "total_packets": 0,
                "original_avg_size": 0,
                "original_throughput": 0,
                "avg_packet_size": 0,
                "max_packet_size": 0,
                "min_packet_size": 0,
                "std_packet_size": 0,
                "throughput": 0,
                "protocol_distribution": {},
                "moving_avg_size": 0
            })

        # OPTIMIZED
        opt_sizes = np.array(self.optimized_history["packet_sizes"])
        opt_times = np.array(self.optimized_history["timestamps"])
        if opt_sizes.size > 0:
            stats.update({
                "optimized_avg_size": float(np.mean(opt_sizes)),
                "optimized_throughput": float(np.sum(opt_sizes) / (opt_times[-1] - opt_times[0])) if len(opt_times) > 1 else 0,
            })
        else:
            stats.update({
                "optimized_avg_size": 0,
                "optimized_throughput": 0,
            })

        return stats

    def get_bandwidth_utilization(self) -> Dict[str, float]:
        """Calculate bandwidth utilization per protocol"""
        protocol_bandwidth = defaultdict(float)
        for protocol, sizes in zip(self.metrics_history["protocols"], self.metrics_history["packet_sizes"]):
            protocol_bandwidth[protocol] += sizes
        return dict(protocol_bandwidth)

    def get_latency_metrics(self) -> Dict:
        """Get detailed latency metrics"""
        if not self.metrics_history["timestamps"]:
            return {}
        timestamps = np.array(self.metrics_history["timestamps"])
        latencies = np.diff(timestamps)
        if len(latencies) == 0:
            return {}
        return {
            "avg_latency": float(np.mean(latencies)),
            "max_latency": float(np.max(latencies)),
            "min_latency": float(np.min(latencies)),
            "p95_latency": float(np.percentile(latencies, 95)),
            "p99_latency": float(np.percentile(latencies, 99))
        }

    def clear_history(self):
        """Clear metrics history to prevent memory issues"""
        self.metrics_history = defaultdict(list)
        self.optimized_history = defaultdict(list)
        self.start_time = time.time()
        self.optimized_start_time = None
