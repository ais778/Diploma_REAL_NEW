import React from "react";
import { Card, CardContent, Typography, Grid } from "@mui/material";
import MainProtocol, { ProtocolDatum as MainProtocolDatum } from "./MainProtocol";
import ServiceProtocol, { ProtocolDatum as ServiceProtocolDatum } from "./ServiceProtocol";

interface Props {
    mainData: MainProtocolDatum[];
    serviceData: ServiceProtocolDatum[];
    colors: string[];
}

const ProtocolDistribution: React.FC<Props> = ({ mainData, serviceData, colors }) => (
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
                    <MainProtocol data={mainData} colors={colors} />
                </Grid>
                <Grid item xs={12} md={6}>
                    <Typography variant="subtitle1" gutterBottom>
                        Service Protocols
                    </Typography>
                    <ServiceProtocol data={serviceData} colors={colors} />
                </Grid>
            </Grid>
        </CardContent>
    </Card>
);

export default ProtocolDistribution;
