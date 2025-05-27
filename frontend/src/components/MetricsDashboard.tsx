import React from "react";
import {
  Card,
  CardContent,
  Grid,
  Typography,
  Box,
  Switch,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Tooltip,
  Chip,
  LinearProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import WarningIcon from "@mui/icons-material/Warning";
import CloseIcon from "@mui/icons-material/Close";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { useNetworkStore } from "../store/networkStore";
import { format } from "date-fns";
import { networkApi } from "../api/networkApi";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8"];

interface QoSRule {
  protocol: string;
  priority: number;
  bandwidth_limit: number | null;
}

interface BucketData {
  count: number;
  total: number;
  optimizedTotal: number;
}

interface Buckets {
  [key: number]: BucketData;
}

interface TrendDataPoint {
  name: string;
  originalSize: number;
  optimizedSize: number;
}

interface QoSRuleStatus {
  active: boolean;
  lastApplied: string;
  effectiveness: number;
  priority: number;
  bandwidthLimit: number | null;
}

export const MetricsDashboard: React.FC = () => {
  const {
    metrics,
    packets,
    protocolAggregation,
    setQoSRule,
    setProtocolAggregation,
  } = useNetworkStore();
  const [showComparison, setShowComparison] = React.useState(true);
  const [trendData, setTrendData] = React.useState<TrendDataPoint[]>([]);
  const [selectedProtocol, setSelectedProtocol] = React.useState<string>("TCP");
  const [priority, setPriority] = React.useState<number>(1);
  const [bandwidthLimit, setBandwidthLimit] = React.useState<number | null>(
    null
  );
  const [ruleEffectiveness, setRuleEffectiveness] = React.useState<{
    [key: string]: number;
  }>({});
  const [qosStatus, setQosStatus] = React.useState<{
    [key: string]: QoSRuleStatus;
  }>({});
  const [snackbar, setSnackbar] = React.useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });
  const intervalMs = 3000;

  // Memoize protocol list to prevent unnecessary re-renders
  const protocols = React.useMemo(
    () => ["TCP", "UDP", "ICMP", "HTTP", "HTTPS", "DNS"],
    []
  );

  const handleApplyRule = async () => {
    try {
      console.log("Applying filter:", {
        protocol: selectedProtocol,
        priority,
        bandwidthLimit,
      });
      await setQoSRule(selectedProtocol, priority, bandwidthLimit);
      console.log("Filter applied successfully");

      // Update QoS status
      setQosStatus((prev) => ({
        ...prev,
        [selectedProtocol]: {
          active: true,
          lastApplied: new Date().toLocaleTimeString(),
          effectiveness: calculateRuleEffectiveness(selectedProtocol),
          priority,
          bandwidthLimit,
        },
      }));

      // Show success message
      setSnackbar({
        open: true,
        message: `QoS rule successfully applied for ${selectedProtocol}`,
        severity: "success",
      });

      // Update rule effectiveness
      const effectiveness = calculateRuleEffectiveness(selectedProtocol);
      setRuleEffectiveness((prev) => ({
        ...prev,
        [selectedProtocol]: effectiveness,
      }));
    } catch (error) {
      console.error(`Error applying filter for ${selectedProtocol}:`, error);

      // Show error message
      setSnackbar({
        open: true,
        message: `Failed to apply QoS rule for ${selectedProtocol}`,
        severity: "error",
      });

      // Update QoS status to show error
      setQosStatus((prev) => ({
        ...prev,
        [selectedProtocol]: {
          active: false,
          lastApplied: new Date().toLocaleTimeString(),
          effectiveness: 0,
          priority,
          bandwidthLimit,
        },
      }));
    }
  };

  const calculateRuleEffectiveness = (protocol: string): number => {
    if (!metrics || !metrics.bandwidth_utilization) return 0;

    const protocolBytes = metrics.bandwidth_utilization[protocol] || 0;
    const totalBytes = Object.values(metrics.bandwidth_utilization).reduce(
      (a, b) => a + b,
      0
    );

    return totalBytes > 0 ? (protocolBytes / totalBytes) * 100 : 0;
  };

  const getPriorityColor = (priority: number): string => {
    const colors = [
      "#ff0000", // 1
      "#ff3300", // 2
      "#ff6600", // 3
      "#ff9900", // 4
      "#ffcc00", // 5
      "#ffff00", // 6
      "#ccff00", // 7
      "#99ff00", // 8
      "#66ff00", // 9
      "#00ff00", // 10
    ];
    return colors[priority - 1] || colors[0];
  };

  const handleDeleteRule = async (protocol: string) => {
    try {
      await networkApi.deleteQoSRule(protocol);

      // Update QoS status
      setQosStatus((prev) => {
        const newStatus = { ...prev };
        delete newStatus[protocol];
        return newStatus;
      });

      // Update rule effectiveness
      setRuleEffectiveness((prev) => {
        const newEffectiveness = { ...prev };
        delete newEffectiveness[protocol];
        return newEffectiveness;
      });
    } catch (error) {
      console.error(`Error deleting rule for ${protocol}:`, error);
      alert(`Failed to delete QoS rule for ${protocol}. Please try again.`);
    }
  };

  // Update trend data less frequently
  React.useEffect(() => {
    if (!packets || packets.length === 0) return;

    const buckets: Buckets = {};
    packets.forEach((packet) => {
      const t = new Date(packet.timestamp).getTime();
      const bucket = Math.floor(t / intervalMs) * intervalMs;
      if (!buckets[bucket]) {
        buckets[bucket] = { count: 0, total: 0, optimizedTotal: 0 };
      }
      buckets[bucket].count += 1;
      buckets[bucket].total += packet.length;
      buckets[bucket].optimizedTotal += packet.optimization
        ? packet.length * 0.8
        : packet.length;
    });

    const latestBucket = Object.entries(buckets).sort(
      ([a], [b]) => Number(b) - Number(a)
    )[0];

    if (latestBucket) {
      const [bucketTime, bucketData] = latestBucket as [string, BucketData];
      const newPoint: TrendDataPoint = {
        name: format(new Date(Number(bucketTime)), "HH:mm:ss"),
        originalSize: bucketData.count
          ? bucketData.total / bucketData.count
          : 0,
        optimizedSize: bucketData.count
          ? bucketData.optimizedTotal / bucketData.count
          : 0,
      };
      setTrendData((prev) => {
        if (prev.length > 0 && prev[prev.length - 1].name === newPoint.name)
          return prev;
        const updated = [...prev, newPoint];
        return updated.slice(-20); // Keep only last 20 points
      });
    }
  }, [packets, intervalMs]);

  // Update protocol aggregation when new data arrives
  React.useEffect(() => {
    if (packets && packets.length > 0) {
      const newAggregation = packets.reduce((acc, packet) => {
        const protocol = packet.protocols?.[0] || "Unknown";
        if (!acc[protocol]) {
          acc[protocol] = {
            count: 0,
            total_size: 0,
            packets: [],
          };
        }
        acc[protocol].count += 1;
        acc[protocol].total_size += packet.length || 0;
        acc[protocol].packets.push(packet);
        return acc;
      }, {} as typeof protocolAggregation);

      setProtocolAggregation(newAggregation);
    }
  }, [packets, setProtocolAggregation]);

  // Filter important protocols for distribution
  const getFilteredProtocolDistribution = () => {
    if (!metrics?.statistics?.protocol_distribution) return [];

    const importantProtocols = [
      "TCP",
      "UDP",
      "HTTP",
      "HTTPS",
      "DNS",
      "ICMP",
      "IP",
    ];
    const distribution = metrics.statistics.protocol_distribution;

    return Object.entries(distribution)
      .filter(([protocol]) => importantProtocols.includes(protocol))
      .map(([name, value]) => ({
        name,
        value,
      }));
  };

  // Filter service protocols for distribution
  const getServiceProtocolDistribution = () => {
    if (!metrics?.statistics?.protocol_distribution) return [];

    const serviceProtocols = [
      "Ethernet",
      "Raw",
      "Padding",
      "IP in ICMP",
      "ICMP in ICMP",
    ];
    const distribution = metrics.statistics.protocol_distribution;

    return Object.entries(distribution)
      .filter(([protocol]) => serviceProtocols.includes(protocol))
      .map(([name, value]) => ({
        name,
        value,
      }));
  };

  if (!metrics) {
    return (
      <Box p={3}>
        <Typography variant="h6">Loading metrics...</Typography>
      </Box>
    );
  }

  const latencyData = [
    {
      name: "Average",
      original: metrics.latency_metrics.avg_latency,
      optimized: metrics.latency_metrics.avg_latency * 0.7, // Example optimization factor
    },
    {
      name: "P95",
      original: metrics.latency_metrics.p95_latency,
      optimized: metrics.latency_metrics.p95_latency * 0.75,
    },
    {
      name: "P99",
      original: metrics.latency_metrics.p99_latency,
      optimized: metrics.latency_metrics.p99_latency * 0.8,
    },
  ];

  // Calculate bandwidth utilization comparison
  const bandwidthData = Object.entries(metrics.bandwidth_utilization).map(
    ([protocol, bytes]) => ({
      protocol,
      original: bytes,
      optimized: bytes * 0.85, // Example optimization factor
    })
  );

  // Y-axis amplitude logic
  const maxPacketSize = Math.max(
    0,
    ...trendData.map((d) => d.originalSize || 0),
    ...trendData.map((d) => d.optimizedSize || 0)
  );
  const yAxisMax = maxPacketSize > 1000 ? 1500 : 1000;

  return (
    <Box p={3}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
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
        {/* QoS Status Indicators */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                QoS Rules Status
              </Typography>
              <Box display="flex" flexWrap="wrap" gap={2}>
                {Object.entries(qosStatus).map(([protocol, status]) => {
                  return (
                    <Box
                      key={protocol}
                      sx={{
                        p: 2,
                        border: 1,
                        borderColor: "divider",
                        borderRadius: 1,
                        minWidth: 200,
                        position: "relative",
                      }}
                    >
                      <Box
                        sx={{
                          position: "absolute",
                          top: 8,
                          right: 8,
                        }}
                      >
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteRule(protocol)}
                          sx={{ color: "error.main" }}
                        >
                          <CloseIcon />
                        </IconButton>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <Typography variant="subtitle1">{protocol}</Typography>
                        {status.active ? (
                          <CheckCircleIcon color="success" />
                        ) : (
                          <ErrorIcon color="error" />
                        )}
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        Last Applied: {status.lastApplied}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Priority: {status.priority}
                      </Typography>
                      {status.bandwidthLimit && (
                        <Typography variant="body2" color="text.secondary">
                          Bandwidth Limit: {status.bandwidthLimit} Mbps
                        </Typography>
                      )}
                      <Box mt={1}>
                        <Typography variant="body2" gutterBottom>
                          Effectiveness: {status.effectiveness.toFixed(1)}%
                        </Typography>
                        <LinearProgress
                          variant="determinate"
                          value={status.effectiveness}
                          sx={{
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: "grey.200",
                            "& .MuiLinearProgress-bar": {
                              backgroundColor: status.active
                                ? "success.main"
                                : "error.main",
                            },
                          }}
                        />
                      </Box>
                    </Box>
                  );
                })}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* QoS Configuration */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Accordion>
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon />}
                  aria-controls="qos-config-content"
                  id="qos-config-header"
                >
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="h6">QoS Configuration</Typography>
                    {Object.values(qosStatus).some(
                      (status) => status.active
                    ) ? (
                      <Chip
                        icon={<CheckCircleIcon />}
                        label="Active"
                        color="success"
                        size="small"
                      />
                    ) : (
                      <Chip
                        icon={<WarningIcon />}
                        label="No Active Rules"
                        color="warning"
                        size="small"
                      />
                    )}
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box mb={2}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs={12}>
                        <Typography variant="subtitle1" mb={2}>
                          Traffic Filter
                        </Typography>
                      </Grid>

                      {/* Protocol Selection */}
                      <Grid item xs={12} md={4}>
                        <FormControl fullWidth>
                          <InputLabel>Protocol</InputLabel>
                          <Select
                            value={selectedProtocol}
                            label="Protocol"
                            onChange={(e) =>
                              setSelectedProtocol(e.target.value)
                            }
                          >
                            {protocols.map((protocol) => (
                              <MenuItem key={protocol} value={protocol}>
                                {protocol}
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>
                      </Grid>

                      {/* Priority Selection */}
                      <Grid item xs={12} md={4}>
                        <Box>
                          <Typography variant="body2" gutterBottom>
                            Priority
                          </Typography>
                          <Box display="flex" alignItems="center" gap={1}>
                            <input
                              type="range"
                              min="1"
                              max="10"
                              value={priority}
                              onChange={(e) =>
                                setPriority(parseInt(e.target.value))
                              }
                              style={{
                                flex: 1,
                                accentColor: getPriorityColor(priority),
                              }}
                            />
                            <Typography
                              variant="body2"
                              sx={{ minWidth: "30px" }}
                            >
                              {priority}
                            </Typography>
                          </Box>
                        </Box>
                      </Grid>

                      {/* Bandwidth Limit */}
                      <Grid item xs={12} md={4}>
                        <TextField
                          label="Bandwidth Limit (Mbps)"
                          type="number"
                          value={bandwidthLimit || ""}
                          onChange={(e) =>
                            setBandwidthLimit(
                              e.target.value ? parseFloat(e.target.value) : null
                            )
                          }
                          fullWidth
                        />
                      </Grid>

                      {/* Apply Button */}
                      <Grid item xs={12}>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={handleApplyRule}
                          fullWidth
                        >
                          Apply Filter
                        </Button>
                      </Grid>
                    </Grid>
                  </Box>
                </AccordionDetails>
              </Accordion>
            </CardContent>
          </Card>
        </Grid>

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
                  Original Avg Size:{" "}
                  {metrics.statistics.avg_packet_size.toFixed(2)} bytes
                </Typography>
                <Typography color="success.main">
                  Optimized Avg Size:{" "}
                  {(metrics.statistics.avg_packet_size * 0.8).toFixed(2)} bytes
                </Typography>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <Typography>
                  Original Throughput:{" "}
                  {metrics.statistics.throughput.toFixed(2)} bytes/s
                </Typography>
                <Typography color="success.main">
                  Optimized Throughput:{" "}
                  {(metrics.statistics.throughput * 1.2).toFixed(2)} bytes/s
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Protocol Distribution */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Protocol Distribution
              </Typography>
              <Grid container spacing={2}>
                {/* Main Protocols */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Main Protocols
                  </Typography>
                  <Box height={300}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getFilteredProtocolDistribution()}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label
                        >
                          {getFilteredProtocolDistribution().map(
                            (entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            )
                          )}
                        </Pie>
                        <RechartsTooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </Grid>

                {/* Service Protocols */}
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" gutterBottom>
                    Service Protocols
                  </Typography>
                  <Box height={300}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={getServiceProtocolDistribution()}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={80}
                          label
                        >
                          {getServiceProtocolDistribution().map(
                            (entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[(index + 6) % COLORS.length]}
                              />
                            )
                          )}
                        </Pie>
                        <RechartsTooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                </Grid>
              </Grid>
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
                  <AreaChart
                    data={trendData}
                    margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient
                        id="colorOriginal"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#8884d8"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#8884d8"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorOptimized"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#82ca9d"
                          stopOpacity={0.8}
                        />
                        <stop
                          offset="95%"
                          stopColor="#82ca9d"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, yAxisMax]} />
                    <RechartsTooltip />
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
                    <RechartsTooltip />
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
                    <RechartsTooltip />
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

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
export default MetricsDashboard;