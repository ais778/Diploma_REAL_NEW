// src/pages/LiveTraffic.tsx
import React from 'react';
import { useNetworkStore } from '../store/networkStore';
import {
    Box,
    Typography,
    Paper,
    Table,
    TableContainer,
    TableHead,
    TableRow,
    TableCell,
    TableBody
} from '@mui/material';

const LiveTraffic: React.FC = () => {
    // берём массив пакетов из Zustand
    const packets = useNetworkStore(state => state.packets);

    return (
        <Box p={3}>
            <Typography variant="h5" gutterBottom>
                Live Network Traffic
            </Typography>
            <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
                <Table stickyHeader>
                    <TableHead>
                        <TableRow>
                            <TableCell>Источник</TableCell>
                            <TableCell>Назначение</TableCell>
                            <TableCell>Протокол</TableCell>
                            <TableCell align="right">Размер (байт)</TableCell>
                            <TableCell align="right">Приоритет</TableCell>
                            <TableCell align="center">Ограничен?</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {packets.map((pkt, idx) => (
                            <TableRow key={idx} hover>
                                <TableCell>{pkt.src}</TableCell>
                                <TableCell>{pkt.dst}</TableCell>
                                <TableCell>{pkt.protocols?.[0] || '—'}</TableCell>
                                <TableCell align="right">{pkt.length}</TableCell>
                                <TableCell align="right">{pkt.qos?.priority ?? '—'}</TableCell>
                                <TableCell align="center">
                                    {pkt.throttled ? '🔴' : '🟢'}
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
};

export default LiveTraffic;
