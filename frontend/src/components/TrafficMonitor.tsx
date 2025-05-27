import React, { useEffect, useState } from "react";
import { networkApi } from "../api/networkApi";
import { Packet, NetworkMetrics } from "../types";

const TrafficMonitor: React.FC = () => {
  const [traffic, setTraffic] = useState<Packet[]>([]);
  const [metrics, setMetrics] = useState<NetworkMetrics | null>(null);

  useEffect(() => {
    const unsubscribe = networkApi.subscribe(({ packets, metrics }) => {
      setTraffic((prev) => [...prev, ...packets]);
      setMetrics(metrics);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // ... rest of the component code ...
};
