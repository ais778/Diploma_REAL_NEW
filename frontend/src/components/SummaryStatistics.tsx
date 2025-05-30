import React from "react";
import { Card, CardContent, Typography, Grid } from "@mui/material";
import { useNetworkStore } from "../store/networkStore";

const SummaryStatistics: React.FC = () => {
  const metrics = useNetworkStore((s) => s.metrics);

  const totalPackets = metrics?.statistics?.total_packets ?? 0;
  const originalAvgSize = metrics?.statistics?.original_avg_size ?? 0;
  const optimizedAvgSize = metrics?.statistics?.optimized_avg_size ?? 0;
  const originalThroughput = metrics?.statistics?.original_throughput ?? 0;
  const optimizedThroughput = metrics?.statistics?.optimized_throughput ?? 0;

  return (
      <Card
          sx={{
            bgcolor: "#232326",
            color: "#fff",
            borderRadius: 2,
            boxShadow: 2,
            mb: 2,
            px: 1,
            py: 1,
            maxWidth: 800,
          }}
      >
        <CardContent sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Summary Statistics
          </Typography>

          {/* Total Packets row */}
          <Grid container alignItems="center" sx={{ mb: 0.5 }}>
            <Grid item xs={6}>
              <Typography variant="body1">
                Total Packets: {totalPackets}
              </Typography>
            </Grid>
            <Grid item xs={6} />
          </Grid>

          {/* Avg Size row */}
          <Grid container alignItems="center" sx={{ mb: 0.5 }}>
            <Grid item xs={6}>
              <Typography variant="body1">
                Original Avg Size: {originalAvgSize.toFixed(2)} bytes
              </Typography>
            </Grid>
            <Grid item xs={6} sx={{ textAlign: "right" }}>
              <Typography variant="body1" sx={{ color: "#22c55e" }}>
                Optimized Avg Size: {optimizedAvgSize.toFixed(2)} bytes
              </Typography>
            </Grid>
          </Grid>

          {/* Throughput row */}
          <Grid container alignItems="center">
            <Grid item xs={6}>
              <Typography variant="body1">
                Original Throughput: {originalThroughput.toFixed(2)} bytes/s
              </Typography>
            </Grid>
            <Grid item xs={6} sx={{ textAlign: "right" }}>
              <Typography variant="body1" sx={{ color: "#22c55e" }}>
                Optimized Throughput: {optimizedThroughput.toFixed(2)} bytes/s
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
  );
};

export default SummaryStatistics;
