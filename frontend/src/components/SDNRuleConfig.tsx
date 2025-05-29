import React, { useState } from "react";
import {
    Card, CardContent, Typography, Grid, TextField, Button, Snackbar, Alert
} from "@mui/material";
import { useNetworkStore } from "../store/networkStore";
import CircularProgress from "@mui/material/CircularProgress";

const defaultRule = {
    source_ip: "",
    destination_ip: "",
    action: "Allow",
};

const actions = ["Allow", "Drop", "Forward"];

const SDNRuleConfig: React.FC = () => {
    const [rule, setRule] = useState(defaultRule);
    const [loading, setLoading] = useState(false);
    const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "success" | "error" }>({ open: false, message: "", severity: "success" });

    const setSDNRule = useNetworkStore((s) => s.setSDNRule);
    const refreshSDNRules = useNetworkStore((s) => s.refreshSDNRules);

    const handleApply = async () => {
        setLoading(true);
        try {
            await setSDNRule(rule);
            await refreshSDNRules();
            setSnackbar({ open: true, message: "SDN rule applied successfully", severity: "success" });
            setRule(defaultRule);
        } catch {
            setSnackbar({ open: true, message: "Failed to apply SDN rule", severity: "error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Card>
                <CardContent>
                    <Typography variant="h6" gutterBottom>
                        SDN Rule Configuration
                    </Typography>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={6}>
                            <TextField label="Source IP" size="small" fullWidth value={rule.source_ip}
                                       onChange={(e) => setRule({ ...rule, source_ip: e.target.value })} />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField label="Destination IP" size="small" fullWidth value={rule.destination_ip}
                                       onChange={(e) => setRule({ ...rule, destination_ip: e.target.value })} />
                        </Grid>
                        <Grid item xs={12}>
                            <TextField label="Action" size="small" select fullWidth value={rule.action}
                                       onChange={(e) => setRule({ ...rule, action: e.target.value })} SelectProps={{ native: true }}>
                                {actions.map((action) => (
                                    <option key={action} value={action}>{action}</option>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12}>
                            <Button
                                variant="contained"
                                fullWidth
                                onClick={handleApply}
                                color="primary"
                                disabled={loading}
                                startIcon={loading ? <CircularProgress color="inherit" size={20} /> : null}
                            >
                                {loading ? "Applying..." : "Apply SDN Rule"}
                            </Button>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>
            <Snackbar open={snackbar.open} autoHideDuration={3000} onClose={() => setSnackbar((s) => ({ ...s, open: false }))}>
                <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
            </Snackbar>
        </>
    );
};

export default SDNRuleConfig;
