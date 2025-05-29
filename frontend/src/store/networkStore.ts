import { create } from "zustand";
import { NetworkMetrics, Packet, QoSRule } from "../api/networkApi";
import { networkApi, SDNRule } from "../api/networkApi";

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

  // SDN Rules
  sdnRules: SDNRule[];

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

  // SDN Actions
  setSDNRule: (
      rule: Omit<SDNRule, "id" | "status" | "created_at" | "updated_at">
  ) => Promise<void>;
  deleteSDNRule: (id: number) => Promise<void>;
  refreshSDNRules: () => Promise<void>;
}

export const useNetworkStore = create<NetworkStore>((set, get) => {
  // Auto-subscribe to incoming WebSocket batches
  networkApi.subscribe(({ packets, metrics, aggregation }) => {
    set((state) => ({
      packets: [...state.packets.slice(-100), ...packets],
      metrics,
      protocolAggregation: aggregation || state.protocolAggregation,
    }));
  });

  return {
    packets: [],
    metrics: null,
    protocolAggregation: {},
    qosRules: [],
    protocolFilter: null,
    sdnRules: [],

    // QoS Actions
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
        await get().refreshQoSRules();
      } catch (error) {
        console.error("Error in setQoSRule:", error);
        throw error;
      }
    },
    refreshQoSRules: async () => {
      try {
        const rules = await networkApi.getQoSRules();
        set({ qosRules: rules });
      } catch (error) {
        console.error("Failed to refresh QoS rules", error);
      }
    },

    // SDN Actions
    setSDNRule: async (rule) => {
      try {
        await networkApi.setSDNRule(rule);
        await get().refreshSDNRules();
      } catch (error) {
        console.error("Error in setSDNRule:", error);
        throw error;
      }
    },
    deleteSDNRule: async (id) => {
      try {
        await networkApi.deleteSDNRule(id);
        await get().refreshSDNRules();
      } catch (error) {
        console.error("Error in deleteSDNRule:", error);
        throw error;
      }
    },
    refreshSDNRules: async () => {
      try {
        const rules = await networkApi.getSDNRules();
        set({ sdnRules: rules });
      } catch (error) {
        console.error("Failed to refresh SDN rules", error);
      }
    },
  };
});
