import { create } from "zustand";
import { NetworkMetrics, Packet, QoSRule } from "../api/networkApi";
import { networkApi } from "../api/networkApi";

interface NetworkStore {
  // Real-time data
  packets: Packet[];
  metrics: NetworkMetrics | null;
  protocolAggregation: Record<string, {
    count: number;
    total_size: number;
    packets: Packet[];
  }>;

  // QoS Rules
  qosRules: QoSRule[];
  protocolFilter: string | null;

  // Actions
  addPackets: (packets: Packet[]) => void;
  clearPackets: () => void;
  setMetrics: (metrics: NetworkMetrics) => void;
  setProtocolAggregation: (aggregation: Record<string, any>) => void;
  setQoSRules: (rules: QoSRule[]) => void;
  setProtocolFilter: (protocol: string | null) => void;
  setQoSRule: (
      protocol: string,
      priority: number | null,
      bandwidthLimit: number | null
  ) => Promise<void>;
  refreshQoSRules: () => Promise<void>;

}

type SetState = (
    partial:
        | NetworkStore
        | Partial<NetworkStore>
        | ((state: NetworkStore) => NetworkStore | Partial<NetworkStore>),
    replace?: boolean
) => void;

export const useNetworkStore = create<NetworkStore>((set, get) => {
  // Auto-subscribe to incoming WebSocket batches
  networkApi.subscribe(({ packets, metrics, aggregation }) => {
    set((state) => ({
      // Keep last 100 packets, then append new batch
      packets: [...state.packets.slice(-100), ...packets],
      metrics,
      // update aggregation if provided
      protocolAggregation: aggregation || state.protocolAggregation,
    }));
  });

  return {
    packets: [],
    metrics: null,
    protocolAggregation: {},
    qosRules: [],
    protocolFilter: null,

    // Append new packets (kept for manual use if needed)
    addPackets: (newPackets: Packet[]) =>
        set((state) => ({
          packets: [...state.packets.slice(-100), ...newPackets],
        })),
    clearPackets: () => set({ packets: [] }),
    setMetrics: (metrics: NetworkMetrics) => set({ metrics }),
    setProtocolAggregation: (aggregation) =>
        set({ protocolAggregation: aggregation || {} }),
    setQoSRules: (rules: QoSRule[]) => set({ qosRules: rules }),
    setProtocolFilter: (protocol) => set({ protocolFilter: protocol }),

    // Unified QoS rule setter/deleter
    setQoSRule: async (
        protocol: string,
        priority: number | null,
        bandwidthLimit: number | null
    ) => {
      try {
        if (priority === null && bandwidthLimit === null) {
          await networkApi.deleteQoSRule(protocol);
        } else {
          await networkApi.setQoSRule({
            protocol,
            priority: priority || 0,
            bandwidth_limit: bandwidthLimit || undefined,
          });
        }
      } catch (error) {
        console.error("Error in setQoSRule:", error);
        throw error;
      }
    },
    refreshQoSRules: async () => {
      try {
        const rules = await networkApi.getQoSRules(); // такой метод должен быть в api
        set({ qosRules: rules });
      } catch (error) {
        console.error("Failed to refresh QoS rules", error);
      }
    },

  };
});
