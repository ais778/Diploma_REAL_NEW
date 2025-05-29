import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Snackbar,
  Alert,
} from "@mui/material";
import { networkApi, Packet, QoSRule } from "../api/networkApi";
import { useNetworkStore } from "../store/networkStore";

// Те же самые протоколы, что и в QoSConfig!
const PROTOCOLS = ["TCP", "UDP", "ICMP", "HTTP", "HTTPS", "DNS"];

function getQosRuleMap(qosRules: QoSRule[]) {
  const map: Record<string, QoSRule> = {};
  qosRules.forEach((rule) => {
    map[rule.protocol] = rule;
  });
  return map;
}

const TrafficTable: React.FC = () => {
  const [rows, setRows] = useState<Packet[]>([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info" as "success" | "error" | "info" | "warning",
  });

  const qosRules = useNetworkStore((s) => s.qosRules);
  const qosMap = getQosRuleMap(qosRules);

  useEffect(() => {
    const unsubscribe = networkApi.subscribe(({ packets }) => {
      setRows((prev) => [...prev.slice(-500), ...packets]);
    });
    return unsubscribe;
  }, []);

  // Ищем первый протокол из списка PROTOCOLS в pkt.protocols
  function getMainQosProtocol(protocols?: string[]): string {
    if (!protocols || protocols.length === 0) return "—";
    const found = PROTOCOLS.find((p) => protocols.includes(p));
    return found || protocols.find((p) => p !== "Ethernet") || protocols[0] || "—";
  }

  return (
      <>
        <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
          <Table stickyHeader size="small">
            <TableHead>
              <TableRow>
                <TableCell>Source</TableCell>
                <TableCell>Destination</TableCell>
                <TableCell>Protocol</TableCell>
                <TableCell align="right">Size (bytes)</TableCell>
                <TableCell align="right">Priority</TableCell>
                <TableCell align="right">Limit (bytes)</TableCell>
                <TableCell align="center">Throttled</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((pkt, idx) => {
                const mainProtocol = getMainQosProtocol(pkt.protocols);
                const rule = qosMap[mainProtocol];
                const limit = rule?.bandwidth_limit ?? null;
                const isThrottled = pkt.throttled ? "Yes" : "No";
                return (
                    <TableRow key={idx} hover>
                      <TableCell>{pkt.src}</TableCell>
                      <TableCell>{pkt.dst}</TableCell>
                      <TableCell>{mainProtocol}</TableCell>
                      <TableCell align="right">{pkt.length}</TableCell>
                      <TableCell align="right">{pkt.qos?.priority ?? rule?.priority ?? "—"}</TableCell>
                      <TableCell align="right">{limit !== undefined && limit !== null ? limit : "—"}</TableCell>
                      <TableCell align="center">{isThrottled}</TableCell>
                    </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>

        <Snackbar
            open={snackbar.open}
            autoHideDuration={3000}
            onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        >
          <Alert severity={snackbar.severity} sx={{ width: "100%" }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </>
  );
};

export default TrafficTable;
