import React from "react";
import { Card, CardContent, Typography, Box } from "@mui/material";
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
} from "recharts";

interface BWPoint {
    protocol: string;
    original: number;
    optimized: number;
}

interface Props {
    data: BWPoint[];
}

const BandwidthUtilization: React.FC<Props> = ({ data }) => (
    <Card>
        <CardContent>
            <Typography variant="h6" gutterBottom>
                Bandwidth Utilization
            </Typography>
            <Box height={300}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="protocol" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                            type="monotone"
                            dataKey="original"
                            name="Original"
                            stroke="#8884d8"
                        />
                        <Line
                            type="monotone"
                            dataKey="optimized"
                            name="Optimized"
                            stroke="#82ca9d"
                            strokeDasharray="5 5"
                        />
                    </LineChart>
                </ResponsiveContainer>
            </Box>
        </CardContent>
    </Card>
);

export default BandwidthUtilization;
