// src/components/ServiceProtocolChart.tsx
import React from "react";
import {
    Card,
    CardContent,
    Typography,
    Box,
} from "@mui/material";
import {
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    Tooltip,
    Legend,
} from "recharts";

export interface ProtocolDatum {
    name: string;
    value: number;
}

interface Props {
    data: ProtocolDatum[];
    colors: string[];
}

const ServiceProtocolChart: React.FC<Props> = ({ data, colors }) => (
    <Card>
        <CardContent>
            <Typography variant="h6" gutterBottom>
                Service Protocols
            </Typography>
            <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            dataKey="value"
                            nameKey="name"
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label
                        >
                            {data.map((entry, idx) => (
                                <Cell
                                    key={entry.name}
                                    fill={colors[idx % colors.length]}
                                />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                    </PieChart>
                </ResponsiveContainer>
            </Box>
        </CardContent>
    </Card>
);

export default ServiceProtocolChart;
