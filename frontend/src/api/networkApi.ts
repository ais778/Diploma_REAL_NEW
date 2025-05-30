import axios from "axios";
import api from "./axios"; // вместо import axios from "axios";
const BASE_URL = api.defaults.baseURL; // можно убрать константу
// const BASE_URL = "http://localhost:8000";


export interface QoSRule {
  protocol: string;
  priority: number;
  bandwidth_limit?: number;
}
export interface SDNRule {
  id: number;
  source_ip: string;
  destination_ip: string;
  action: string;
  status: string;
  created_at: string;
  updated_at: string;
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
    original_avg_size: number;
    optimized_avg_size: number;
    original_throughput: number;
    optimized_throughput:number;
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
  private listeners: Array<(data: any) => void> = [];
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 1000;
  private messageHandlers: ((data: {
    packets: Packet[];
    metrics: NetworkMetrics;
  }) => void)[] = [];

  constructor() {
    // ожидание
    axios.defaults.baseURL = BASE_URL;
    axios.defaults.timeout = 5000;
    axios.defaults.headers.common["Content-Type"] = "application/json";
  }

  // QoS Rules
  async getQoSRules(): Promise<QoSRule[]> {
    try {
      const response = await axios.get<QoSRule[]>("/api/qos/rules");
      return response.data;
    } catch (error) {
      console.error("Error getting QoS rules:", error);
      throw error;
    }
  }

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
  async getSDNRules(): Promise<SDNRule[]> {
    const response = await api.get<SDNRule[]>("/api/sdn/rules");
    return response.data;
  }
  async setSDNRule(rule: Omit<SDNRule, "id" | "status" | "created_at" | "updated_at">): Promise<any> {
    const response = await api.post("/api/sdn/rules", rule);
    return response.data;
  }
  async deleteSDNRule(id: number): Promise<any> {
    const response = await api.delete(`/api/sdn/rules/${id}`);
    return response.data;
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

  // WebSocket connection
  connectWebSocket(
    onMessage: (data: { packets: Packet[]; metrics: NetworkMetrics }) => void
  ) {
    this.messageHandlers.push(onMessage);

    if (this.ws) {
      return this.ws;
    }

    this.subscribe(onMessage);

    return this.ws;
  }

  subscribe(fn: (data: any) => void) {
    this.listeners.push(fn);
    if (!this.ws) {
      this.initWebSocket();
    }
    return () => {
      this.listeners = this.listeners.filter((listener) => listener !== fn);
      if (this.listeners.length === 0) {
        this.closeWebSocket();
      }
    };
  }

  private initWebSocket() {
    try {
      const wsUrl = `${api.defaults.baseURL!.replace("http", "ws")}/ws/traffic`;
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log("WebSocket connection established");
        this.reconnectAttempts = 0;
      };

      this.ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          this.listeners.forEach((cb) => cb(data));
        } catch (error) {
          console.error("Error parsing WebSocket message:", error);
        }
      };

      this.ws.onclose = () => {
        console.log("WebSocket connection closed");
        this.handleReconnect();
      };

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        this.handleReconnect();
      };
    } catch (error) {
      console.error("Error initializing WebSocket:", error);
      this.handleReconnect();
    }
  }

  private handleReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(
        `Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`
      );
      setTimeout(
        () => this.initWebSocket(),
        this.reconnectTimeout * this.reconnectAttempts
      );
    } else {
      console.error("Max reconnection attempts reached");
    }
  }

  private closeWebSocket() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  disconnect() {
    this.messageHandlers = [];
    this.reconnectAttempts = 0;
    this.closeWebSocket();
  }
}

export const networkApi = new NetworkApi();
