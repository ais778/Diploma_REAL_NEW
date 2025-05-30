  import React from "react";
  import { Card, CardContent, Typography, Box } from "@mui/material";
  import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
  } from "recharts";

  export interface LatencyPoint {
    name: string;
    original: number;
    optimized: number;
  }

  interface Props {
    data: LatencyPoint[];
    showComparison: boolean;
  }

  const LatencyMetrics: React.FC<Props> = ({ data, showComparison }) => (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Latency Metrics
        </Typography>
        <Box height={300}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="original"
                name="Original"
                stroke="#8884d8"
              />
              {showComparison && (
                <Line
                  type="monotone"
                  dataKey="optimized"
                  name="Optimized"
                  stroke="#82ca9d"
                  strokeDasharray="5 5"
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </CardContent>
    </Card>
  );

  export default LatencyMetrics;
