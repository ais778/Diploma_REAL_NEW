import { create } from "zustand";
import { NetworkMetrics, Packet, QoSRule } from "../api/networkApi";
import { networkApi } from "../api/networkApi";

interface NetworkStore {
  // Real-time data
  packets: Packet[];
  metrics: NetworkMetrics | null;
  protocolAggregation: {
    [key: string]: {
      count: number;
      total_size: number;
      packets: Packet[];
    };
  };

  // QoS Rules
  qosRules: QoSRule[];

  // Actions
  setPackets: (packets: Packet[]) => void;
  addPackets: (packets: Packet[]) => void;
  setMetrics: (metrics: NetworkMetrics) => void;
  setProtocolAggregation: (aggregation: any) => void;
  setQoSRules: (rules: QoSRule[]) => void;
  addQoSRule: (rule: QoSRule) => void;
  removeQoSRule: (rule: QoSRule) => void;
  setQoSRule: (
    protocol: string,
    priority: number | null,
    bandwidthLimit: number | null
  ) => Promise<void>;

  // Filters
  protocolFilter: string | null;
  setProtocolFilter: (protocol: string | null) => void;
}

type SetState = (
  partial:
    | NetworkStore
    | Partial<NetworkStore>
    | ((state: NetworkStore) => NetworkStore | Partial<NetworkStore>),
  replace?: boolean
) => void;

export const useNetworkStore = create<NetworkStore>((set: SetState) => ({
  // Initial state
  packets: [],
  metrics: null,
  protocolAggregation: {},
  qosRules: [],
  protocolFilter: null,

  // Actions
  setPackets: (packets: Packet[]) => set({ packets }),
  addPackets: (newPackets: Packet[]) =>
    set((state: NetworkStore) => ({
      packets: [...state.packets.slice(-100), ...newPackets], // Keep last 100 packets
    })),
  setMetrics: (metrics: NetworkMetrics) => set({ metrics }),
  setProtocolAggregation: (aggregation: any) =>
    set({ protocolAggregation: aggregation || {} }), // Ensure we always have an object
  setQoSRules: (rules: QoSRule[]) => set({ qosRules: rules }),
  addQoSRule: (rule: QoSRule) =>
    set((state: NetworkStore) => ({
      qosRules: [...state.qosRules, rule],
    })),
  removeQoSRule: (rule: QoSRule) =>
    set((state: NetworkStore) => ({
      qosRules: state.qosRules.filter(
        (r) =>
          r.protocol !== rule.protocol ||
          r.priority !== rule.priority ||
          r.bandwidth_limit !== rule.bandwidth_limit
      ),
    })),
  setQoSRule: async (
    protocol: string,
    priority: number | null,
    bandwidthLimit: number | null
  ) => {
    try {
      if (priority === null && bandwidthLimit === null) {
        // This is a deletion request
        await networkApi.deleteQoSRule(protocol);
      } else {
        // This is a rule setting request
        await networkApi.setQoSRule({
          protocol,
          priority: priority || 0,
          bandwidth_limit: bandwidthLimit || null,
        });
      }
    } catch (error) {
      console.error("Error in setQoSRule:", error);
      throw error;
    }
  },
  setProtocolFilter: (protocol: string | null) =>
    set({ protocolFilter: protocol }),
}));
