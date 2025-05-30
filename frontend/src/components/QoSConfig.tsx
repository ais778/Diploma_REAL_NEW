import React from "react";
import {
  Box,
  Grid,
  Typography,
  TextField,
  Button,
  Snackbar,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  Card,
  CardContent,
} from "@mui/material";
import { useNetworkStore } from "../store/networkStore";
import CircularProgress from "@mui/material/CircularProgress";

const PROTOCOLS = ["TCP", "UDP", "ICMP", "HTTP", "HTTPS", "DNS"];

const getPriorityColor = (p: number) => {
  if (p === 6) return "#ff3300";
  if (p >= 4) return "#ffcc00";
  return "#66ff00";
};

const QoSConfig: React.FC = () => {
  const setQoSRule = useNetworkStore((s) => s.setQoSRule);
  const qosRules = useNetworkStore((s) => s.qosRules);
  const refreshQoSRules = useNetworkStore((s) => s.refreshQoSRules);
  const [selectedProtocol, setSelectedProtocol] = React.useState("TCP");
  const [priorityReversed, setPriorityReversed] = React.useState(6); // Слева 6
  const [bandwidthLimit, setBandwidthLimit] = React.useState<number | "">("");
  const [loading, setLoading] = React.useState(false);

  const [snackbar, setSnackbar] = React.useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  const currentPriority = 7 - priorityReversed;

  React.useEffect(() => {
    const existingRule = qosRules.find((r) => r.protocol === selectedProtocol);
    if (existingRule) {
      setPriorityReversed(7 - existingRule.priority);
      setBandwidthLimit(existingRule.bandwidth_limit ?? "");
    } else {
      setPriorityReversed(6);
      setBandwidthLimit("");
    }
  }, [selectedProtocol, qosRules]);

  const handleApply = async () => {
    await new Promise((r) => setTimeout(r, 500));
    setLoading(true);
    try {
      await setQoSRule(selectedProtocol, currentPriority, bandwidthLimit === "" ? null : bandwidthLimit);
      await refreshQoSRules();
      setSnackbar({ open: true, message: "Rule applied successfully", severity: "success" });
    } catch (e) {
      setSnackbar({ open: true, message: "Failed to apply rule", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
      <>
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              QoS Configuration
            </Typography>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12}>
                <Typography variant="body2" mb={1}>
                  Protocol
                </Typography>
                <ToggleButtonGroup
                    value={selectedProtocol}
                    exclusive
                    onChange={(_, val) => val && setSelectedProtocol(val)}
                    size="small"
                    color="primary"
                    fullWidth
                >
                  {PROTOCOLS.map((p) => (
                      <ToggleButton key={p} value={p} sx={{ minWidth: 70 }}>
                        {p}
                      </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box>
                  <Typography variant="body2">Priority</Typography>
                  <Box display="flex" alignItems="center" gap={2}>
                    <input
                        type="range"
                        min={1}
                        max={6}
                        step={1}
                        value={priorityReversed}
                        onChange={(e) => setPriorityReversed(+e.target.value)}
                        style={{
                          flex: 1,
                          accentColor: getPriorityColor(currentPriority),
                        }}
                    />
                    <Typography
                        style={{
                          fontWeight: "bold",
                          minWidth: 18,
                          color: getPriorityColor(currentPriority),
                          fontSize: 20,
                        }}
                    >
                      {currentPriority}
                    </Typography>
                  </Box>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6}>
                <TextField
                    label="Bandwidth Limit (bytes)"
                    size="small"
                    type="number"
                    fullWidth
                    value={bandwidthLimit}
                    onChange={(e) =>
                        setBandwidthLimit(e.target.value === "" ? "" : +e.target.value)
                    }
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                    variant="contained"
                    fullWidth
                    onClick={handleApply}
                    color={
                      qosRules.some((r) => r.protocol === selectedProtocol)
                          ? "secondary"
                          : "primary"
                    }
                    disabled={loading}
                    startIcon={
                      loading ? <CircularProgress color="inherit" size={20} /> : null
                    }
                >
                  {loading
                      ? "Applying..."
                      : qosRules.some((r) => r.protocol === selectedProtocol)
                          ? "Update Rule"
                          : "Create Rule"}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Snackbar
            open={snackbar.open}
            autoHideDuration={3000}
            onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
        </Snackbar>
      </>
  );
};

export default QoSConfig;
