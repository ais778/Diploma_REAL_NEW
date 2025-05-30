import React from "react";
import { Card, CardContent, Typography, Grid } from "@mui/material";

interface Props {
  totalPackets: number;
  originalAvgSize: number;
  optimizedAvgSize: number;
  originalThroughput: number;
  optimizedThroughput: number;
}

const SummaryStatistics: React.FC<Props> = ({
  totalPackets,
  originalAvgSize,
  optimizedAvgSize,
  originalThroughput,
  optimizedThroughput,
}) => {
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
        maxWidth: 700,
      }}
    >
      <CardContent>
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
