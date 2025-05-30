import React, { useEffect, useState } from "react";
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
import { networkApi, Packet } from "../api/networkApi";

interface Point {
    time: string;
    packets: number;
    bytes: number;
}

const COLORS = {
    packets: "#8884d8",
    bytes: "#82ca9d",
};

const TrafficGraph: React.FC = () => {
    const [data, setData] = useState<Point[]>([]);

    useEffect(() => {
        // подписка на WebSocket-данные через networkApi
        const unsubscribe = networkApi.subscribe(({ packets }) => {
            const now = new Date().toLocaleTimeString();
            const pktCount = packets.length;
            // Явно указываем типы sum и p, чтобы TS не ругался
            const byteSum = packets.reduce(
                (sum: number, p: Packet) => sum + p.length,
                0
            );

            setData((d) => [
                ...d.slice(-29),
                { time: now, packets: pktCount, bytes: byteSum },
            ]);
        });

        return unsubscribe;
    }, []);

    return (
        <div className="bg-white rounded-lg shadow p-4">
            <h2 className="text-xl font-semibold mb-2 text-center text-indigo-700">
                Пакеты/с и Байты/с
            </h2>
            <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="time" />
                        <YAxis />
                        <Tooltip />
                        <Legend verticalAlign="top" />
                        <Line
                            type="monotone"
                            dataKey="packets"
                            name="Пакеты/с"
                            stroke={COLORS.packets}
                            dot={false}
                        />
                        <Line
                            type="monotone"
                            dataKey="bytes"
                            name="Байты/с"
                            stroke={COLORS.bytes}
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default TrafficGraph;
