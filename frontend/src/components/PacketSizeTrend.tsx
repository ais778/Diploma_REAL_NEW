import React from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

export interface TrendPoint {
  name: string;
  originalSize: number;
  optimizedSize: number;
}

interface Props {
  data: TrendPoint[];
  showComparison: boolean;
}

const PacketSizeTrend: React.FC<Props> = ({ data, showComparison }) => (
  <Card>
    <CardContent>
      <Typography variant="h6" gutterBottom>
        Packet Size Trend
      </Typography>
      <Box height={300}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="gOrig" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gOpt" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#82ca9d" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey="originalSize"
              name="Original (avg)"
              stroke="#8884d8"
              fill="url(#gOrig)"
            />
            {showComparison && (
              <Area
                type="monotone"
                dataKey="optimizedSize"
                name="Optimized (avg)"
                stroke="#82ca9d"
                fill="url(#gOpt)"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </Box>
    </CardContent>
  </Card>
);

export default PacketSizeTrend;
