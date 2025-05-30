import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Typography,
  FormControlLabel,
  Switch,
} from "@mui/material";
import { useNetworkStore } from "../store/networkStore";
import ProtocolDistribution, { ProtocolDatum } from "../components/ProtocolDistribution";
import PacketSizeTrend, { TrendPoint } from "../components/PacketSizeTrend";
import LatencyMetrics, { LatencyPoint } from "../components/LatencyMetrics";
import BandwidthUtilizationChart, { BandwidthPoint } from "../components/BandwidthUtilization";
import SummaryStatistics from "../components/SummaryStatistics";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

const MetricsDashboard: React.FC = () => {
  const metrics = useNetworkStore(s => s.metrics);
  const packets = useNetworkStore(s => s.packets);

  const [showComparison, setShowComparison] = useState<boolean>(true);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);

  useEffect(() => {
    if (!packets || packets.length === 0) return;
    const totalBytes = packets.reduce((sum, p) => sum + p.length, 0);
    const avg = packets.length ? totalBytes / packets.length : 0;
    const now = new Date().toLocaleTimeString();
    setTrendData(prev => [...prev.slice(-19), {
      name: now,
      originalSize: avg,
      optimizedSize: avg * 0.8
    }]);
  }, [packets]);

  if (!metrics) {
    return (
        <Box p={3}>
          <Typography variant="h6" align="center">Loading metrics…</Typography>
        </Box>
    );
  }

  const rawDist: ProtocolDatum[] = Object.entries(metrics.statistics.protocol_distribution)
      .map(([name, value]) => ({ name, value }));
  const mainData = rawDist.filter(d => ["TCP", "UDP", "HTTP", "HTTPS", "DNS", "ICMP", "IP"].includes(d.name));
  const serviceData = rawDist.filter(d => ["Ethernet", "Raw", "Padding", "IP in ICMP", "ICMP in ICMP"].includes(d.name));

  const latencyData: LatencyPoint[] = [
    { name: "Avg", original: metrics.latency_metrics.avg_latency, optimized: metrics.latency_metrics.avg_latency * 0.7 },
    { name: "P95", original: metrics.latency_metrics.p95_latency, optimized: metrics.latency_metrics.p95_latency * 0.75 },
    { name: "P99", original: metrics.latency_metrics.p99_latency, optimized: metrics.latency_metrics.p99_latency * 0.8 },
  ];

  const bwData: BandwidthPoint[] = Object.entries(metrics.bandwidth_utilization).map(
      ([protocol, bytes]) => ({
        name: protocol,
        original: bytes,
        optimized: bytes * 0.85,
      })
  );

  return (
      <Box p={3}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5">Network Metrics Dashboard</Typography>
          <FormControlLabel
              control={<Switch checked={showComparison} onChange={e => setShowComparison(e.target.checked)} />}
              label="Compare with Optimized Values"
          />
        </Box>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <SummaryStatistics />
          </Grid>
          <Grid item xs={12}>
            <ProtocolDistribution mainData={mainData} serviceData={serviceData} colors={COLORS} />
          </Grid>

          <Grid item xs={12}>
            <PacketSizeTrend data={trendData} showComparison={showComparison} />
          </Grid>

          <Grid item xs={12} md={6}>
            <LatencyMetrics data={latencyData} showComparison={showComparison} />
          </Grid>

          <Grid item xs={12} md={6}>
            <BandwidthUtilizationChart data={bwData} showComparison={showComparison} />
          </Grid>
        </Grid>
      </Box>
  );
};

export default MetricsDashboard;
