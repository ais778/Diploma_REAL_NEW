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
import { networkApi, Packet } from "../api/networkApi";

const TrafficTable: React.FC = () => {
  const [rows, setRows] = useState<Packet[]>([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "info" as "success" | "error" | "info" | "warning",
  });

  useEffect(() => {
    const unsubscribe = networkApi.subscribe(({ packets }) => {
      setRows((prev) => [...prev.slice(-500), ...packets]); // не больше 500 строк
    });
    return unsubscribe;
  }, []);

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
                <TableCell align="center">Throttled?</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((pkt, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell>{pkt.src}</TableCell>
                    <TableCell>{pkt.dst}</TableCell>
                    <TableCell>{pkt.protocols?.[0] || "—"}</TableCell>
                    <TableCell align="right">{pkt.length}</TableCell>
                    <TableCell align="right">{pkt.qos?.priority ?? "—"}</TableCell>
                    <TableCell align="center">
                      {pkt.throttled ? "🔴" : "🟢"}
                    </TableCell>
                  </TableRow>
              ))}
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
