import React, { useEffect, useState, useRef } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from "recharts";

type TrafficPacket = {
    src: string;
    dst: string;
    protocol: string;
    length: number;
};

interface TrafficGraphPoint {
    time: string;
    traffic: number;
    speed: number;
}

const TrafficGraph: React.FC = () => {
    const [graphData, setGraphData] = useState<TrafficGraphPoint[]>([]);
    const packetsBuffer = useRef<TrafficPacket[]>([]);

    useEffect(() => {
        const socket = new WebSocket("ws://127.0.0.1:8000/ws/traffic");

        socket.onopen = () => {
            console.log("TrafficGraph WebSocket connected");
        };

        socket.onmessage = (event) => {
            try {
                const packets: TrafficPacket[] = JSON.parse(event.data);
                packetsBuffer.current = packetsBuffer.current.concat(packets);
            } catch (err) {
                console.error("Ошибка парсинга данных WebSocket:", err);
            }
        };

        socket.onerror = (error) => {
            console.error("TrafficGraph WebSocket error:", error);
        };

        socket.onclose = () => {
            console.warn("TrafficGraph WebSocket disconnected");
        };

        const intervalId = setInterval(() => {
            const now = new Date();
            const timeLabel = now.toLocaleTimeString();

            const buffer = packetsBuffer.current;
            if (buffer.length === 0) return;

            const trafficCount = buffer.length;
            const speedSum = buffer.reduce((acc, pkt) => acc + pkt.length, 0);

            setGraphData((prev) => {
                const newData = [...prev, { time: timeLabel, traffic: trafficCount, speed: speedSum }];
                return newData.slice(-30);
            });

            packetsBuffer.current = [];
        }, 1000);

        return () => {
            clearInterval(intervalId);
            socket.close();
        };
    }, []);

    return (
        <div className="space-y-10 px-2 sm:px-4 md:px-0">
            {/* Первый график */}
            <div className="bg-white rounded-lg shadow p-4 md:p-6">
                <h2 className="text-xl font-semibold mb-4 text-center text-indigo-700">Amount of packets</h2>
                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={graphData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="time"
                            label={{ value: "Time", position: "insideBottom", offset: -5 }}
                            tick={{ fontSize: 10 }}
                        />
                        <YAxis
                            label={{ value: "Packets", angle: -90, position: "insideLeft" }}
                            tick={{ fontSize: 10 }}
                        />
                        <Tooltip />
                        <Legend verticalAlign="top" height={36} />
                        <Line
                            type="monotone"
                            dataKey="traffic"
                            stroke="#ff7300"
                            name="Packets"
                            dot={false}
                            isAnimationActive={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>

            {/* Второй график */}
            <div className="bg-white rounded-lg shadow p-4 md:p-6">
                <h2 className="text-xl font-semibold mb-4 text-center text-green-700">Суммарный размер трафика (байт)</h2>
                <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={graphData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis
                            dataKey="time"
                            label={{ value: "Time", position: "insideBottom", offset: -5 }}
                            tick={{ fontSize: 10 }}
                        />
                        <YAxis
                            label={{ value: "Bytes", angle: -90, position: "insideLeft" }}
                            tick={{ fontSize: 10 }}
                        />
                        <Tooltip />
                        <Legend verticalAlign="top" height={36} />
                        <Line
                            type="monotone"
                            dataKey="speed"
                            stroke="#387908"
                            name="Size"
                            dot={false}
                            isAnimationActive={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default TrafficGraph;
