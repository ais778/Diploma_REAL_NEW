import React from "react";
import {
    Card, CardContent, Typography, Box, IconButton, Chip
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import CloseIcon from "@mui/icons-material/Close";
import { SDNRule } from "../api/networkApi";

interface Props {
    rules: SDNRule[];
    onDelete: (id: number) => void;
}

const SDNRuleStatus: React.FC<Props> = ({ rules, onDelete }) => (
    <Card>
        <CardContent>
            <Typography variant="h6" gutterBottom>
                SDN Rule Status
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={2}>
                {rules.length === 0 && (
                    <Typography variant="body2" color="text.secondary">
                        No SDN rules configured
                    </Typography>
                )}
                {rules.map((rule) => (
                    <Box key={rule.id}
                         sx={{
                             p: 2, border: 1, borderColor: "divider",
                             borderRadius: 1, minWidth: 220, position: "relative",
                             backgroundColor: rule.status === "ACTIVE" ? "background.paper" : "action.hover"
                         }}>
                        <IconButton
                            size="small"
                            onClick={() => onDelete(rule.id)}
                            sx={{ position: "absolute", top: 8, right: 8 }}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                        <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <Typography variant="subtitle1">{rule.action}</Typography>
                            {rule.status === "ACTIVE"
                                ? <CheckCircleIcon color="success" />
                                : <ErrorIcon color="error" />}
                            <Chip label={rule.status} size="small"
                                  color={rule.status === "ACTIVE" ? "success" : "default"}
                                  sx={{ ml: 1 }}
                            />
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                            Src: {rule.source_ip}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Dst: {rule.destination_ip}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Created: {rule.created_at}
                        </Typography>
                    </Box>
                ))}
            </Box>
        </CardContent>
    </Card>
);

export default SDNRuleStatus;
