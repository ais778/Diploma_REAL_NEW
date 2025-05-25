import axios from "axios";

const BASE_URL = "http://localhost:8000";
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 3000; // 3 seconds

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

class NetworkApi {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private messageHandlers: ((data: {
    packets: Packet[];
    metrics: NetworkMetrics;
  }) => void)[] = [];

  constructor() {
    // Initialize axios with default config
    axios.defaults.baseURL = BASE_URL;
    axios.defaults.timeout = 5000;
    axios.defaults.headers.common["Content-Type"] = "application/json";
  }

  // QoS Rules
  async setQoSRule(rule: QoSRule): Promise<any> {
    try {
      const response = await axios.post("/api/qos/rules", rule);
      return response.data;
    } catch (error) {
      console.error("Error setting QoS rule:", error);
      throw error;
    }
  }

  async deleteQoSRule(protocol: string): Promise<any> {
    try {
      const response = await axios.delete(`/api/qos/rules/${protocol}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting QoS rule:", error);
      throw error;
    }
  }

  // Metrics
  async getCurrentMetrics(): Promise<NetworkMetrics> {
    try {
      const response = await axios.get<NetworkMetrics>("/api/metrics/current");
      return response.data;
    } catch (error) {
      console.error("Error getting metrics:", error);
      throw error;
    }
  }

  async clearMetricsHistory(): Promise<any> {
    try {
      const response = await axios.post("/api/metrics/clear");
      return response.data;
    } catch (error) {
      console.error("Error clearing metrics:", error);
      throw error;
    }
  }

  // WebSocket connection for real-time updates
  connectWebSocket(
    onMessage: (data: { packets: Packet[]; metrics: NetworkMetrics }) => void
  ) {
    this.messageHandlers.push(onMessage);

    if (this.ws) {
      return this.ws;
    }

    this.ws = new WebSocket(`ws://localhost:8000/ws/traffic`);

    this.ws.onopen = () => {
      console.log("WebSocket connected");
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.messageHandlers.forEach((handler) => handler(data));
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    };

    this.ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    this.ws.onclose = () => {
      console.log("WebSocket closed");
      this.ws = null;
      this.attemptReconnect();
    };

    return this.ws;
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.error("Max reconnection attempts reached");
      return;
    }

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      console.log(
        `Attempting to reconnect (${this.reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`
      );
      this.connectWebSocket(this.messageHandlers[0]);
    }, RECONNECT_DELAY);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.messageHandlers = [];
    this.reconnectAttempts = 0;
  }
}

export const networkApi = new NetworkApi();
