import React, { useEffect, useState } from "react";
import { networkApi } from "../api/networkApi";
import { NetworkMetrics } from "../types";

const QoSConfig: React.FC = () => {
  const [metrics, setMetrics] = useState<NetworkMetrics | null>(null);

  useEffect(() => {
    const unsubscribe = networkApi.subscribe(({ metrics }) => {
      setMetrics(metrics);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // ... rest of the component code ...
};
