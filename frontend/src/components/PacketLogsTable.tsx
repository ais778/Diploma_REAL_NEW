import React, { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Card,
  CardContent,
  FormGroup,
  FormControlLabel,
  Switch,
  Box,
  Tooltip,
  IconButton,
  Divider,
  TextField,
  InputAdornment,
  Chip,
  Alert,
  LinearProgress,
  Collapse,
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import SearchIcon from "@mui/icons-material/Search";
import FilterListIcon from "@mui/icons-material/FilterList";
import CloseIcon from "@mui/icons-material/Close";
import SortIcon from "@mui/icons-material/Sort";
import DownloadIcon from "@mui/icons-material/Download";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { Packet } from "../api/networkApi";

interface Props {
  packets: Packet[];
}

interface OptimizationSettings {
  headerCompression: boolean;
  contentCompression: boolean;
  maliciousFilter: boolean;
  trafficRouting: boolean;
  caching: boolean;
}

type SortField = "time" | "size" | "protocol";
type SortOrder = "asc" | "desc";

const PacketLogsTable: React.FC<Props> = ({ packets }) => {
  const [settings, setSettings] = useState<OptimizationSettings>({
    headerCompression: false,
    contentCompression: false,
    maliciousFilter: false,
    trafficRouting: false,
    caching: false,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProtocol, setSelectedProtocol] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(true);
  const [sortField, setSortField] = useState<SortField>("time");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(
    null
  );

  const handleSettingChange = (setting: keyof OptimizationSettings) => {
    setSettings((prev) => ({
      ...prev,
      [setting]: !prev[setting],
    }));
  };

  const getOptimizedSize = (pkt: Packet): number => {
    let size = pkt.length;
    if (settings.headerCompression) size = Math.round(size * 0.95);
    if (settings.contentCompression) size = Math.round(size * 0.85);
    if (settings.caching) size = Math.round(size * 0.9);
    return size;
  };

  // Фильтруем пакеты один раз
  const filteredPackets = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return packets.filter((pkt) => {
      // Малишес фильтр
      if (settings.maliciousFilter && pkt.length > 1500) return false;

      // Фильтр по протоколу
      if (selectedProtocol && !pkt.protocols.includes(selectedProtocol))
        return false;

      // Поиск по тексту
      if (q) {
        const match =
          pkt.src.toLowerCase().includes(q) ||
          pkt.dst.toLowerCase().includes(q) ||
          pkt.protocols.some((p) => p.toLowerCase().includes(q)) ||
          pkt.summary.toLowerCase().includes(q);
        if (!match) return false;
      }

      return true;
    });
  }, [packets, settings.maliciousFilter, searchQuery, selectedProtocol]);

  // Сортируем пакеты
  const sortedPackets = useMemo(() => {
    return [...filteredPackets].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case "time":
          comparison =
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
          break;
        case "size":
          comparison = a.length - b.length;
          break;
        case "protocol":
          comparison = (a.protocols[0] || "").localeCompare(
            b.protocols[0] || ""
          );
          break;
      }
      return sortOrder === "asc" ? comparison : -comparison;
    });
  }, [filteredPackets, sortField, sortOrder]);

  // Статистика
  const stats = useMemo(() => {
    const totalSize = filteredPackets.reduce((sum, pkt) => sum + pkt.length, 0);
    const optimizedSize = filteredPackets.reduce(
      (sum, pkt) => sum + getOptimizedSize(pkt),
      0
    );
    const savings = totalSize - optimizedSize;
    const savingsPercentage = totalSize > 0 ? (savings / totalSize) * 100 : 0;

    return {
      totalPackets: filteredPackets.length,
      totalSize,
      optimizedSize,
      savings,
      savingsPercentage,
    };
  }, [filteredPackets]);

  // Уникальные протоколы
  const uniqueProtocols = useMemo(() => {
    const protocols = new Set<string>();
    packets.forEach((pkt) => pkt.protocols.forEach((p) => protocols.add(p)));
    return Array.from(protocols).sort();
  }, [packets]);

  const handleExportCSV = () => {
    const headers = [
      "Time",
      "Source",
      "Destination",
      "Protocol",
      "Size",
      "Summary",
    ];
    const csvContent = [
      headers.join(","),
      ...sortedPackets.map((pkt) =>
        [
          new Date(pkt.timestamp).toLocaleString(),
          pkt.src,
          pkt.dst,
          pkt.protocols.join(";"),
          pkt.length,
          pkt.summary,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `packet-logs-${new Date().toISOString()}.csv`;
    link.click();
  };

  return (
    <Card>
      <CardContent>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
          flexWrap="wrap"
          gap={1}
        >
          <Typography variant="h6" component="h2">
            Packet Logs
          </Typography>
          <Box display="flex" gap={1} alignItems="center">
            <TextField
              size="small"
              placeholder="Search packets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
                endAdornment: searchQuery && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setSearchQuery("")}
                      aria-label="Clear search"
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
                "aria-label": "Search packets",
              }}
              sx={{ width: 220, minWidth: 160 }}
            />
            <Tooltip title="Sort packets">
              <IconButton
                size="small"
                onClick={(e) => setSortMenuAnchor(e.currentTarget)}
                aria-label="Sort packets"
              >
                <SortIcon />
              </IconButton>
            </Tooltip>
            <Menu
              anchorEl={sortMenuAnchor}
              open={Boolean(sortMenuAnchor)}
              onClose={() => setSortMenuAnchor(null)}
            >
              <MenuItem
                onClick={() => {
                  setSortField("time");
                  setSortOrder(
                    sortField === "time" && sortOrder === "asc" ? "desc" : "asc"
                  );
                  setSortMenuAnchor(null);
                }}
              >
                <ListItemText primary="Time" />
                {sortField === "time" && (
                  <ListItemIcon>
                    {sortOrder === "asc" ? (
                      <ExpandLessIcon />
                    ) : (
                      <ExpandMoreIcon />
                    )}
                  </ListItemIcon>
                )}
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setSortField("size");
                  setSortOrder(
                    sortField === "size" && sortOrder === "asc" ? "desc" : "asc"
                  );
                  setSortMenuAnchor(null);
                }}
              >
                <ListItemText primary="Size" />
                {sortField === "size" && (
                  <ListItemIcon>
                    {sortOrder === "asc" ? (
                      <ExpandLessIcon />
                    ) : (
                      <ExpandMoreIcon />
                    )}
                  </ListItemIcon>
                )}
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setSortField("protocol");
                  setSortOrder(
                    sortField === "protocol" && sortOrder === "asc"
                      ? "desc"
                      : "asc"
                  );
                  setSortMenuAnchor(null);
                }}
              >
                <ListItemText primary="Protocol" />
                {sortField === "protocol" && (
                  <ListItemIcon>
                    {sortOrder === "asc" ? (
                      <ExpandLessIcon />
                    ) : (
                      <ExpandMoreIcon />
                    )}
                  </ListItemIcon>
                )}
              </MenuItem>
            </Menu>
            <Tooltip title="Clear protocol filter">
              <span>
                <IconButton
                  size="small"
                  color={selectedProtocol ? "primary" : "default"}
                  disabled={!selectedProtocol}
                  onClick={() => setSelectedProtocol(null)}
                  aria-label="Clear protocol filter"
                >
                  <FilterListIcon />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Export to CSV">
              <IconButton
                size="small"
                onClick={handleExportCSV}
                aria-label="Export to CSV"
              >
                <DownloadIcon />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {selectedProtocol && (
          <Alert
            severity="info"
            sx={{ mb: 2, display: "flex", alignItems: "center" }}
            action={
              <IconButton
                size="small"
                aria-label="Clear protocol filter"
                onClick={() => setSelectedProtocol(null)}
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            }
          >
            Filtering by protocol: <strong>{selectedProtocol}</strong>
          </Alert>
        )}

        <Box sx={{ mb: 2 }}>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            onClick={() => setShowSettings(!showSettings)}
            sx={{ cursor: "pointer" }}
          >
            <Typography variant="subtitle2" color="text.secondary">
              Optimization Settings
            </Typography>
            <IconButton size="small">
              {showSettings ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
          <Collapse in={showSettings}>
            <FormGroup
              row
              sx={{
                gap: 3,
                flexWrap: "wrap",
                justifyContent: "flex-start",
                mt: 1,
              }}
            >
              {[
                {
                  name: "headerCompression",
                  label: "Header Compression",
                  tooltip:
                    "Reduce packet header size by optimizing protocol headers",
                },
                {
                  name: "contentCompression",
                  label: "Content Compression",
                  tooltip: "Compress packet payload to reduce overall size",
                },
                {
                  name: "maliciousFilter",
                  label: "Malicious Filter",
                  tooltip: "Filter out potentially malicious or spam packets",
                },
                {
                  name: "trafficRouting",
                  label: "Traffic Routing",
                  tooltip: "Route traffic through less congested channels",
                },
                {
                  name: "caching",
                  label: "Caching",
                  tooltip: "Cache frequently used data to reduce network load",
                },
              ].map((control) => {
                const checked =
                  settings[control.name as keyof OptimizationSettings];
                return (
                  <Box
                    key={control.name}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      backgroundColor: checked
                        ? "rgba(34, 197, 94, 0.15)"
                        : "rgba(0,0,0,0.04)",
                      borderRadius: 2,
                      px: 2,
                      py: 0.5,
                      boxShadow: checked
                        ? "0 0 6px rgba(34, 197, 94, 0.25)"
                        : "none",
                      transition: "all 0.3s ease",
                      cursor: "default",
                      "&:hover": {
                        boxShadow: checked
                          ? "0 0 8px rgba(34, 197, 94, 0.35)"
                          : "0 0 4px rgba(0,0,0,0.1)",
                      },
                    }}
                  >
                    <FormControlLabel
                      control={
                        <Switch
                          checked={checked}
                          onChange={() =>
                            handleSettingChange(
                              control.name as keyof OptimizationSettings
                            )
                          }
                          size="medium"
                          color="success"
                          sx={{ cursor: "pointer" }}
                          inputProps={{ "aria-label": control.label }}
                        />
                      }
                      label={control.label}
                      sx={{ userSelect: "none", mr: 0, cursor: "default" }}
                    />

                    <Tooltip title={control.tooltip} arrow>
                      <IconButton
                        size="small"
                        sx={{ ml: 0.5, cursor: "pointer" }}
                        aria-label={`Info about ${control.label}`}
                      >
                        <InfoIcon fontSize="small" color="action" />
                      </IconButton>
                    </Tooltip>
                  </Box>
                );
              })}
            </FormGroup>
          </Collapse>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Protocol Filter
          </Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            {uniqueProtocols.map((protocol) => (
              <Chip
                key={protocol}
                label={protocol}
                onClick={() => setSelectedProtocol(protocol)}
                color={selectedProtocol === protocol ? "primary" : "default"}
                variant={selectedProtocol === protocol ? "filled" : "outlined"}
                sx={{ cursor: "pointer" }}
                aria-pressed={selectedProtocol === protocol}
                aria-label={`Filter by protocol ${protocol}`}
              />
            ))}
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Optimization Statistics
          </Typography>
          <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
            <StatItem
              label="Total Packets"
              value={stats.totalPackets.toLocaleString()}
            />
            <StatItem
              label="Total Size"
              value={`${stats.totalSize.toLocaleString()} bytes`}
            />
            <StatItem
              label="Optimized Size"
              value={`${stats.optimizedSize.toLocaleString()} bytes`}
              color="success.main"
            />
            <StatItem
              label="Savings"
              value={`${stats.savings.toLocaleString()} bytes (${stats.savingsPercentage.toFixed(
                1
              )}%)`}
              color="success.main"
            />
          </Box>
          <LinearProgress
            variant="determinate"
            value={stats.savingsPercentage}
            sx={{
              mt: 1,
              height: 8,
              borderRadius: 4,
              backgroundColor: "rgba(34, 197, 94, 0.1)",
              "& .MuiLinearProgress-bar": {
                backgroundColor: "success.main",
              },
            }}
            aria-label="Optimization savings progress"
          />
        </Box>

        <Divider sx={{ my: 2 }} />

        <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
          <Table stickyHeader size="small" aria-label="Packet logs table">
            <TableHead>
              <TableRow>
                <TableCell>Time</TableCell>
                <TableCell>Source</TableCell>
                <TableCell>Destination</TableCell>
                <TableCell>Protocol(s)</TableCell>
                <TableCell align="right">Original Size</TableCell>
                <TableCell align="right">Optimized Size</TableCell>
                <TableCell>Summary</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedPackets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                    No packets found matching the criteria.
                  </TableCell>
                </TableRow>
              ) : (
                sortedPackets.map((pkt, idx) => {
                  const optimizedSize = getOptimizedSize(pkt);
                  return (
                    <TableRow key={idx} hover tabIndex={-1}>
                      <TableCell>
                        {new Date(pkt.timestamp).toLocaleTimeString()}
                      </TableCell>
                      <TableCell>{pkt.src}</TableCell>
                      <TableCell>{pkt.dst}</TableCell>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}
                        >
                          {pkt.protocols.map((protocol, i) => (
                            <Chip
                              key={i}
                              label={protocol}
                              size="small"
                              variant="outlined"
                              onClick={() => setSelectedProtocol(protocol)}
                              sx={{ cursor: "pointer" }}
                              aria-label={`Filter by protocol ${protocol}`}
                            />
                          ))}
                        </Box>
                      </TableCell>
                      <TableCell align="right">
                        {pkt.length.toLocaleString()}
                      </TableCell>
                      <TableCell align="right" sx={{ color: "#22c55e" }}>
                        {optimizedSize.toLocaleString()}
                      </TableCell>
                      <TableCell>{pkt.summary}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

interface StatItemProps {
  label: string;
  value: string | number;
  color?: string;
}

const StatItem: React.FC<StatItemProps> = ({ label, value, color }) => (
  <Box sx={{ flex: 1, minWidth: 200 }}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="h6" sx={{ color }}>
      {value}
    </Typography>
  </Box>
);

export default PacketLogsTable;
