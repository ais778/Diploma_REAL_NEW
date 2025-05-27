// src/components/QoSConfig.tsx
import React from "react";
import {
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Box,
  Grid,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Chip,
  Switch,
  FormControlLabel,
  IconButton,
  Snackbar,
  Alert,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WarningIcon from "@mui/icons-material/Warning";
import CloseIcon from "@mui/icons-material/Close";
import { useNetworkStore } from "../store/networkStore";

const PROTOCOLS = ["TCP", "UDP", "ICMP", "HTTP", "HTTPS", "DNS"];

const getPriorityColor = (p: number) => {
  if (p >= 8) return "#66ff00";
  if (p >= 5) return "#ffcc00";
  return "#ff3300";
};

const QoSConfig: React.FC = () => {
  const setQoSRule = useNetworkStore((s) => s.setQoSRule);
  const qosRules = useNetworkStore((s) => s.qosRules);
  const [selectedProtocol, setSelectedProtocol] = React.useState("TCP");
  const [priority, setPriority] = React.useState(1);
  const [bandwidthLimit, setBandwidthLimit] = React.useState<number | "">("");
  const [snackbar, setSnackbar] = React.useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  // Update form when selecting an existing rule
  React.useEffect(() => {
    const existingRule = qosRules.find((r) => r.protocol === selectedProtocol);
    if (existingRule) {
      setPriority(existingRule.priority);
      setBandwidthLimit(existingRule.bandwidth_limit ?? "");
    } else {
      setPriority(1);
      setBandwidthLimit("");
    }
  }, [selectedProtocol, qosRules]);

  const handleApply = async () => {
    try {
      await setQoSRule(
        selectedProtocol,
        priority,
        bandwidthLimit === "" ? null : bandwidthLimit
      );
      setSnackbar({
        open: true,
        message: "Rule applied successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Failed to apply rule:", error);
      setSnackbar({
        open: true,
        message: "Failed to apply rule",
        severity: "error",
      });
    }
  };

  return (
    <>
      <Accordion defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Box display="flex" alignItems="center" gap={1}>
            <Typography variant="h6">QoS Configuration</Typography>
            {/* Здесь можно поставить индикатор активности правил */}
          </Box>
        </AccordionSummary>
        <AccordionDetails>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Protocol</InputLabel>
                <Select
                  value={selectedProtocol}
                  label="Protocol"
                  onChange={(e) => setSelectedProtocol(e.target.value)}
                >
                  {PROTOCOLS.map((p) => (
                    <MenuItem key={p} value={p}>
                      {p}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box>
                <Typography variant="body2">Priority</Typography>
                <Box display="flex" alignItems="center" gap={1}>
                  <input
                    type="range"
                    min={1}
                    max={10}
                    value={priority}
                    onChange={(e) => setPriority(+e.target.value)}
                    style={{ flex: 1, accentColor: getPriorityColor(priority) }}
                  />
                  <Typography>{priority}</Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Bandwidth Limit (Mbps)"
                size="small"
                type="number"
                fullWidth
                value={bandwidthLimit}
                onChange={(e) =>
                  setBandwidthLimit(
                    e.target.value === "" ? "" : +e.target.value
                  )
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
              >
                {qosRules.some((r) => r.protocol === selectedProtocol)
                  ? "Update Rule"
                  : "Create Rule"}
              </Button>
            </Grid>
          </Grid>
        </AccordionDetails>
      </Accordion>

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
