import React from "react";
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  LinearProgress,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import CloseIcon from "@mui/icons-material/Close";

export interface QoSRuleStatus {
  protocol: string;
  active: boolean;
  lastApplied: string;
  effectiveness: number;
  priority: number;
  bandwidthLimit: number | null;
}

interface Props {
  statuses: Record<string, QoSRuleStatus>;
  onDelete: (protocol: string) => void;
}

const QoSRulesStatus: React.FC<Props> = ({ statuses, onDelete }) => {
  // Convert statuses object to array and sort by priority
  const sortedStatuses = Object.values(statuses).sort(
    (a, b) => b.priority - a.priority
  );

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          QoS Rules Status
        </Typography>
        <Box display="flex" flexWrap="wrap" gap={2}>
          {sortedStatuses.map((st) => (
            <Box
              key={st.protocol}
              sx={{
                p: 2,
                border: 1,
                borderColor: "divider",
                borderRadius: 1,
                minWidth: 200,
                position: "relative",
                backgroundColor: st.active
                  ? "background.paper"
                  : "action.hover",
              }}
            >
              <IconButton
                size="small"
                onClick={() => onDelete(st.protocol)}
                sx={{ position: "absolute", top: 8, right: 8 }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>

              <Box display="flex" alignItems="center" gap={1} mb={1}>
                <Typography variant="subtitle1">{st.protocol}</Typography>
                {st.active ? (
                  <CheckCircleIcon color="success" />
                ) : (
                  <ErrorIcon color="error" />
                )}
              </Box>

              <Typography variant="body2" color="text.secondary">
                Last Applied: {st.lastApplied}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Priority: {st.priority}
              </Typography>
              {st.bandwidthLimit !== null && (
                <Typography variant="body2" color="text.secondary">
                  Bandwidth: {st.bandwidthLimit} bps
                </Typography>
              )}

              <Box mt={1}>
                <Typography variant="body2" gutterBottom>
                  Effectiveness: {st.effectiveness.toFixed(1)}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={st.effectiveness}
                  sx={{
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: "grey.200",
                    "& .MuiLinearProgress-bar": {
                      backgroundColor: st.active
                        ? "success.main"
                        : "error.main",
                    },
                  }}
                />
              </Box>
            </Box>
          ))}
          {sortedStatuses.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              No QoS rules configured
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

export default QoSRulesStatus;
