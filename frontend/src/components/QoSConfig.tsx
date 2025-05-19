import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { useNetworkStore } from '../store/networkStore';
import { networkApi, QoSRule } from '../api/networkApi';
import DeleteIcon from '@mui/icons-material/Delete';

const PROTOCOL_OPTIONS = ['TCP', 'UDP', 'ICMP', 'HTTP', 'HTTPS', 'DNS', 'ARP', 'Other'];

export const QoSConfig: React.FC = () => {
  const { qosRules, addQoSRule, removeQoSRule } = useNetworkStore();
  const [error, setError] = useState<string | null>(null);
  const [newRule, setNewRule] = useState<Partial<QoSRule>>({
    protocol: '',
    priority: 0,
    bandwidth_limit: undefined,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      if (!newRule.protocol || newRule.priority === undefined) {
        throw new Error('Protocol and priority are required');
      }

      const rule: QoSRule = {
        protocol: newRule.protocol,
        priority: Number(newRule.priority),
        bandwidth_limit: newRule.bandwidth_limit ? Number(newRule.bandwidth_limit) : undefined,
      };

      await networkApi.setQoSRule(rule);
      addQoSRule(rule);
      
      // Reset form
      setNewRule({
        protocol: '',
        priority: 0,
        bandwidth_limit: undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add QoS rule');
    }
  };

  // Add a function to handle rule deletion
  const handleDeleteRule = async (rule: QoSRule) => {
    try {
      // Optionally, call backend to remove rule if supported
      // await networkApi.deleteQoSRule(rule); // Uncomment if backend supports
      removeQoSRule(rule);
    } catch (err) {
      setError('Failed to remove QoS rule');
    }
  };

  return (
    <Box p={3}>
      <Typography variant="h5" gutterBottom>
        QoS Configuration
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Add New QoS Rule
          </Typography>
          <Box component="form" onSubmit={handleSubmit}>
            <Autocomplete
              options={PROTOCOL_OPTIONS}
              freeSolo
              value={newRule.protocol || ''}
              onChange={(_, value) => setNewRule({ ...newRule, protocol: value || '' })}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Protocol"
                  fullWidth
                  margin="normal"
                  required
                  placeholder="e.g., TCP, UDP, ICMP"
                  inputProps={{ ...params.inputProps, tabIndex: 0 }}
                />
              )}
            />
            <TextField
              label="Priority"
              type="number"
              value={newRule.priority}
              onChange={(e) => setNewRule({ ...newRule, priority: Number(e.target.value) })}
              fullWidth
              margin="normal"
              required
              inputProps={{ min: 0, max: 10, step: 1 }}
              helperText="0 (lowest) to 10 (highest) — use keyboard arrows or type"
            />
            <TextField
              label="Bandwidth Limit (bytes/s)"
              type="number"
              value={newRule.bandwidth_limit || ''}
              onChange={(e) =>
                setNewRule({
                  ...newRule,
                  bandwidth_limit: e.target.value ? Number(e.target.value) : undefined,
                })
              }
              fullWidth
              margin="normal"
              inputProps={{ min: 0 }}
              helperText="Optional: Set bandwidth limit in bytes per second"
            />
            <Button
              type="submit"
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
            >
              Add Rule
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Active QoS Rules
          </Typography>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Protocol</TableCell>
                  <TableCell align="right">Priority</TableCell>
                  <TableCell align="right">Bandwidth Limit</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {qosRules.map((rule, index) => (
                  <TableRow key={index}>
                    <TableCell>{rule.protocol}</TableCell>
                    <TableCell align="right">{rule.priority}</TableCell>
                    <TableCell align="right">
                      {rule.bandwidth_limit
                        ? `${rule.bandwidth_limit} bytes/s`
                        : 'No limit'}
                    </TableCell>
                    <TableCell align="center">
                      <Button color="error" onClick={() => handleDeleteRule(rule)}>
                        <DeleteIcon />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {qosRules.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} align="center">
                      No QoS rules configured
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </Box>
  );
}; 