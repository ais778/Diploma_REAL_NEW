import React, { useEffect, useState } from "react";
import { Box, Typography, Grid, Paper } from "@mui/material";
import TrafficTable from "../components/TrafficTable";
import QoSConfig from "../components/QoSConfig";
import QoSRulesStatus, { QoSRuleStatus } from "../components/QoSRulesStatus";
import { useNetworkStore } from "../store/networkStore";

const LiveTraffic: React.FC = () => {
  const qosRules = useNetworkStore((s) => s.qosRules);
  const metrics = useNetworkStore((s) => s.metrics);
  const setQoSRule = useNetworkStore((s) => s.setQoSRule);

  const [qosStatus, setQosStatus] = useState<Record<string, QoSRuleStatus>>({});

  // Update QoS status whenever rules or metrics change
  useEffect(() => {
    const now = new Date().toLocaleTimeString();
    const total = metrics?.bandwidth_utilization
        ? Object.values(metrics.bandwidth_utilization).reduce((a, b) => a + b, 0)
        : 0;

    const status: Record<string, QoSRuleStatus> = {};

    qosRules.forEach((r) => {
      const used = metrics?.bandwidth_utilization?.[r.protocol] || 0;
      status[r.protocol] = {
        protocol: r.protocol,
        active: true,
        lastApplied: now,
        effectiveness: total > 0 ? (used / total) * 100 : 0,
        priority: r.priority,
        bandwidthLimit: r.bandwidth_limit ?? null,
      };
    });

    setQosStatus(status);
  }, [metrics, qosRules]);

  const handleDeleteRule = (protocol: string) => {
    setQoSRule(protocol, null, null).catch(() =>
        alert("Failed to delete rule")
    );
    setQosStatus((prev) => {
      const copy = { ...prev };
      delete copy[protocol];
      return copy;
    });
  };

  return (
      <Box p={3}>
        <Typography variant="h5" gutterBottom>
          Live Network Traffic Monitor
        </Typography>

        {/* --- ВЕРХНЯЯ СТРОКА: QoS Config и Status --- */}
        <Grid container spacing={2} mb={3}>
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <QoSConfig />
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper elevation={3} sx={{ p: 2 }}>
              <QoSRulesStatus
                  statuses={qosStatus}
                  onDelete={handleDeleteRule}
              />
            </Paper>
          </Grid>
        </Grid>

        {/* --- НИЖНЯЯ СТРОКА: Traffic Table на всю ширину --- */}
        <Paper elevation={3} sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            Traffic Table
          </Typography>
          <TrafficTable />
        </Paper>
      </Box>
  );
};

export default LiveTraffic;
