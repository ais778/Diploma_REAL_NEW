import React from "react";
import { Card, CardContent, Box } from "@mui/material";
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

const ServiceProtocol: React.FC<Props> = ({ data, colors }) => (
    <Box height={250}>
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
);

export default ServiceProtocol;
