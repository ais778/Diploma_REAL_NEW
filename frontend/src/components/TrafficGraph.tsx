import React, { useEffect, useState, useRef } from "react";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
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
            console.log("🟢 TrafficGraph WebSocket connected");
        };

        socket.onmessage = (event) => {
            try {
                const packets: TrafficPacket[] = JSON.parse(event.data);
                // Добавляем новые пакеты в буфер
                packetsBuffer.current = packetsBuffer.current.concat(packets);
            } catch (err) {
                console.error("❌ Ошибка парсинга данных WebSocket в графике:", err);
            }
        };

        socket.onerror = (error) => {
            console.error("❌ TrafficGraph WebSocket error:", error);
        };

        socket.onclose = () => {
            console.warn("🔴 TrafficGraph WebSocket disconnected");
        };

        // Каждую секунду агрегируем буфер пакетов и обновляем график
        const intervalId = setInterval(() => {
            const now = new Date();
            const timeLabel = now.toLocaleTimeString();

            const buffer = packetsBuffer.current;
            if (buffer.length === 0) return; // если пакетов нет - ничего не делаем

            // Считаем количество пакетов и суммарный length
            const trafficCount = buffer.length;
            const speedSum = buffer.reduce((acc, pkt) => acc + pkt.length, 0);

            // Добавляем точку на график, храним последние 20-30 точек
            setGraphData((prev) => {
                const newData = [...prev, { time: timeLabel, traffic: trafficCount, speed: speedSum }];
                return newData.slice(-30); // максимум 30 точек
            });

            // Очищаем буфер
            packetsBuffer.current = [];
        }, 1000);

        return () => {
            clearInterval(intervalId);
            socket.close();
        };
    }, []);

    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={graphData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="traffic" stroke="#ff7300" name="Пакеты" />
                <Line type="monotone" dataKey="speed" stroke="#387908" name="Суммарный размер" />
            </LineChart>
        </ResponsiveContainer>
    );
};

export default TrafficGraph;
