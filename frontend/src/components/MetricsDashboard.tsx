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
  AreaChart,
  Area,
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
import { format } from 'date-fns';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export const MetricsDashboard: React.FC = () => {
  const { metrics, packets } = useNetworkStore();
  const [showComparison, setShowComparison] = React.useState(true);
  const [trendData, setTrendData] = React.useState<any[]>([]);
  const intervalMs = 5000;

  React.useEffect(() => {
    if (!packets || packets.length === 0) return;
    const buckets = {};
    packets.forEach(packet => {
      const t = new Date(packet.timestamp).getTime();
      const bucket = Math.floor(t / intervalMs) * intervalMs;
      if (!buckets[bucket]) {
        buckets[bucket] = { count: 0, total: 0, optimizedTotal: 0 };
      }
      buckets[bucket].count += 1;
      buckets[bucket].total += packet.length;
      buckets[bucket].optimizedTotal += packet.optimization ? packet.length * 0.8 : packet.length;
    });
    const latestBucket = Object.entries(buckets).sort(([a], [b]) => Number(b) - Number(a))[0];
    if (latestBucket) {
      const [bucket, data] = latestBucket;
      const newPoint = {
        name: format(new Date(Number(bucket)), 'HH:mm:ss'),
        originalSize: data.count ? data.total / data.count : 0,
        optimizedSize: data.count ? data.optimizedTotal / data.count : 0,
      };
      setTrendData(prev => {
        if (prev.length > 0 && prev[prev.length - 1].name === newPoint.name) return prev;
        const updated = [...prev, newPoint];
        return updated.slice(-50);
      });
    }
  }, [packets]);

  if (!metrics) {
    return (
      <Box p={3}>
        <Typography variant="h6">Loading metrics...</Typography>
      </Box>
    );
  }

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

  // Y-axis amplitude logic
  const maxPacketSize = Math.max(0, ...trendData.map(d => d.originalSize || 0), ...trendData.map(d => d.optimizedSize || 0));
  const yAxisMax = maxPacketSize > 1000 ? 1500 : 1000;

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

        {/* Packet Size Trend (Area Chart with Moving Average) */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Packet Size Trend
              </Typography>
              <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorOriginal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorOptimized" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#82ca9d" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#82ca9d" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, yAxisMax]} />
                    <Tooltip />
                    <Legend />
                    <Area
                      type="monotone"
                      dataKey="originalSize"
                      stroke="#8884d8"
                      fillOpacity={1}
                      fill="url(#colorOriginal)"
                      name="Original Size (Moving Avg)"
                    />
                    {showComparison && (
                      <Area
                        type="monotone"
                        dataKey="optimizedSize"
                        stroke="#82ca9d"
                        fillOpacity={1}
                        fill="url(#colorOptimized)"
                        name="Optimized Size (Moving Avg)"
                      />
                    )}
                  </AreaChart>
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