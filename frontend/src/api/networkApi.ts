import axios from 'axios';

const BASE_URL = 'http://localhost:8000';

export interface QoSRule {
  protocol: string;
  priority: number;
  bandwidth_limit?: number;
}

export interface NetworkMetrics {
  statistics: {
    total_packets: number;
    avg_packet_size: number;
    max_packet_size: number;
    min_packet_size: number;
    std_packet_size: number;
    throughput: number;
    protocol_distribution: Record<string, number>;
    moving_avg_size?: number;
  };
  bandwidth_utilization: Record<string, number>;
  latency_metrics: {
    avg_latency: number;
    max_latency: number;
    min_latency: number;
    p95_latency: number;
    p99_latency: number;
  };
}

export interface Packet {
  src: string;
  dst: string;
  protocols: string[];
  length: number;
  timestamp: string;
  summary: string;
  tcp_info?: {
    sport: number;
    dport: number;
    flags: number;
    window: number;
  };
  udp_info?: {
    sport: number;
    dport: number;
    len: number;
  };
  qos?: {
    priority: number;
    timestamp: string;
  };
  throttled?: boolean;
  optimization?: {
    patterns: any;
    timestamp: string;
  };
}

export const networkApi = {
  // QoS Rules
  setQoSRule: async (rule: QoSRule) => {
    const response = await axios.post(`${BASE_URL}/api/qos/rules`, rule);
    return response.data;
  },

  // Metrics
  getCurrentMetrics: async () => {
    const response = await axios.get<NetworkMetrics>(`${BASE_URL}/api/metrics/current`);
    return response.data;
  },

  clearMetricsHistory: async () => {
    const response = await axios.post(`${BASE_URL}/api/metrics/clear`);
    return response.data;
  },

  // WebSocket connection for real-time updates
  connectWebSocket: (onMessage: (data: { packets: Packet[], metrics: NetworkMetrics }) => void) => {
    const ws = new WebSocket(`ws://localhost:8000/ws/traffic`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return ws;
  }
}; 