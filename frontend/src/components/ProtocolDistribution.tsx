import React from "react";
import { Card, CardContent, Typography, Grid, Box } from "@mui/material";
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
    mainData: ProtocolDatum[];
    serviceData: ProtocolDatum[];
    colors: string[];
}

const ProtocolDistribution: React.FC<Props> = ({
                                                   mainData,
                                                   serviceData,
                                                   colors,
                                               }) => (
    <Card>
        <CardContent>
            <Typography variant="h6" gutterBottom>
                Protocol Distribution
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                        Main Protocols
                    </Typography>
                    <Box height={250}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={mainData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    label
                                >
                                    {mainData.map((_, i) => (
                                        <Cell key={i} fill={colors[i % colors.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                        Service Protocols
                    </Typography>
                    <Box height={250}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={serviceData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    label
                                >
                                    {serviceData.map((_, i) => (
                                        <Cell
                                            key={i}
                                            fill={colors[(i + mainData.length) % colors.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </Box>
                </Grid>
            </Grid>
        </CardContent>
    </Card>
);

export default ProtocolDistribution;
