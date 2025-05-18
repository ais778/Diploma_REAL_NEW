import { create } from 'zustand';
import { NetworkMetrics, Packet, QoSRule } from '../api/networkApi';

interface NetworkStore {
  // Real-time data
  packets: Packet[];
  metrics: NetworkMetrics | null;
  
  // QoS Rules
  qosRules: QoSRule[];
  
  // Actions
  setPackets: (packets: Packet[]) => void;
  addPackets: (packets: Packet[]) => void;
  setMetrics: (metrics: NetworkMetrics) => void;
  setQoSRules: (rules: QoSRule[]) => void;
  addQoSRule: (rule: QoSRule) => void;
  
  // Filters
  protocolFilter: string | null;
  setProtocolFilter: (protocol: string | null) => void;
}

type SetState = (
  partial: NetworkStore | Partial<NetworkStore> | ((state: NetworkStore) => NetworkStore | Partial<NetworkStore>),
  replace?: boolean
) => void;

export const useNetworkStore = create<NetworkStore>((set: SetState) => ({
  // Initial state
  packets: [],
  metrics: null,
  qosRules: [],
  protocolFilter: null,
  
  // Actions
  setPackets: (packets: Packet[]) => set({ packets }),
  addPackets: (newPackets: Packet[]) => 
    set((state: NetworkStore) => ({
      packets: [...state.packets.slice(-1000), ...newPackets] // Keep last 1000 packets
    })),
  setMetrics: (metrics: NetworkMetrics) => set({ metrics }),
  setQoSRules: (rules: QoSRule[]) => set({ qosRules: rules }),
  addQoSRule: (rule: QoSRule) =>
    set((state: NetworkStore) => ({
      qosRules: [...state.qosRules, rule]
    })),
  setProtocolFilter: (protocol: string | null) => set({ protocolFilter: protocol }),
})); 