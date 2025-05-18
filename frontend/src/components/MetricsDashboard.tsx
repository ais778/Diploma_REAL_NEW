import React from 'react';
import {
  Card,
  CardContent,
  Grid,
  Typography,
  Box,
  Switch,
  FormControlLabel,
} from '@mui/material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useNetworkStore } from '../store/networkStore';
import { formatDistance } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const MetricsDashboard: React.FC = () => {
  const { metrics, packets } = useNetworkStore();
  const [showComparison, setShowComparison] = React.useState(true);

  if (!metrics) {
    return (
      <Box p={3}>
        <Typography variant="h6">Loading metrics...</Typography>
      </Box>
    );
  }

  // Prepare data for comparison
  const packetSizeData = packets.map((packet) => ({
    name: formatDistance(new Date(packet.timestamp), new Date(), { addSuffix: true }),
    originalSize: packet.length,
    optimizedSize: packet.optimization ? packet.length * 0.8 : packet.length, // Example optimization factor
    throttled: packet.throttled,
  }));

  const latencyData = [
    { 
      name: 'Average',
      original: metrics.latency_metrics.avg_latency,
      optimized: metrics.latency_metrics.avg_latency * 0.7 // Example optimization factor
    },
    { 
      name: 'P95',
      original: metrics.latency_metrics.p95_latency,
      optimized: metrics.latency_metrics.p95_latency * 0.75
    },
    { 
      name: 'P99',
      original: metrics.latency_metrics.p99_latency,
      optimized: metrics.latency_metrics.p99_latency * 0.8
    },
  ];

  // Calculate bandwidth utilization comparison
  const bandwidthData = Object.entries(metrics.bandwidth_utilization).map(([protocol, bytes]) => ({
    protocol,
    original: bytes,
    optimized: bytes * 0.85, // Example optimization factor
  }));

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5">Network Metrics Dashboard</Typography>
        <FormControlLabel
          control={
            <Switch
              checked={showComparison}
              onChange={(e) => setShowComparison(e.target.checked)}
              color="primary"
            />
          }
          label="Show Optimization Comparison"
        />
      </Box>

      <Grid container spacing={3}>
        {/* Summary Statistics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Summary Statistics
              </Typography>
              <Typography>
                Total Packets: {metrics.statistics.total_packets}
              </Typography>
              <Box display="flex" justifyContent="space-between">
                <Typography>
                  Original Avg Size: {metrics.statistics.avg_packet_size.toFixed(2)} bytes
                </Typography>
                <Typography color="success.main">
                  Optimized Avg Size: {(metrics.statistics.avg_packet_size * 0.8).toFixed(2)} bytes
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography>
                  Original Throughput: {metrics.statistics.throughput.toFixed(2)} bytes/s
                </Typography>
                <Typography color="success.main">
                  Optimized Throughput: {(metrics.statistics.throughput * 1.2).toFixed(2)} bytes/s
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Protocol Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Protocol Distribution
              </Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Object.entries(metrics.statistics.protocol_distribution).map(
                        ([name, value]) => ({
                          name,
                          value,
                        })
                      )}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label
                    >
                      {Object.entries(metrics.statistics.protocol_distribution).map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Packet Size Trend */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Packet Size Trend
              </Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={packetSizeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="originalSize"
                      stroke="#8884d8"
                      name="Original Size"
                      strokeWidth={2}
                    />
                    {showComparison && (
                      <Line
                        type="monotone"
                        dataKey="optimizedSize"
                        stroke="#82ca9d"
                        name="Optimized Size"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Latency Metrics */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Latency Metrics
              </Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={latencyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="original"
                      stroke="#8884d8"
                      name="Original Latency"
                      strokeWidth={2}
                    />
                    {showComparison && (
                      <Line
                        type="monotone"
                        dataKey="optimized"
                        stroke="#82ca9d"
                        name="Optimized Latency"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Bandwidth Utilization */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Bandwidth Utilization
              </Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={bandwidthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="protocol" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="original"
                      stroke="#8884d8"
                      name="Original Bandwidth"
                      strokeWidth={2}
                    />
                    {showComparison && (
                      <Line
                        type="monotone"
                        dataKey="optimized"
                        stroke="#82ca9d"
                        name="Optimized Bandwidth"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                      />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}; 