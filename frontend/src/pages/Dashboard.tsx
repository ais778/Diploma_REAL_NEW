import React, { useEffect, useState } from "react";

type Traffic = {
    src: string;
    dst: string;
    protocols: string[];
    length: number;
    qos?: { priority: number };
    throttled?: boolean;
};

const Dashboard: React.FC = () => {
    const [traffic, setTraffic] = useState<Traffic[]>([]);

    useEffect(() => {
        const socket = new WebSocket("ws://127.0.0.1:8000/ws/traffic");

        socket.onopen = () => {
            console.log("🟢 WebSocket connected");
        };

        socket.onmessage = (event) => {
            try {
                const payload = JSON.parse(event.data);
                // payload.packets — массив наших пакетов
                const packets: Traffic[] = payload.packets;
                // добавляем новые пакеты в конец
                setTraffic((prev) => [...prev, ...packets]);
            } catch (err) {
                console.error("❌ WS parse error:", err);
            }
        };

        socket.onerror = (err) => {
            console.error("❌ WebSocket error", err);
        };

        socket.onclose = () => {
            console.warn("🔴 WebSocket closed");
        };

        return () => {
            socket.close();
        };
    }, []);

    return (
        <div className="p-6 max-w-4xl mx-auto text-white">
            <h1 className="text-2xl font-bold mb-4">Live Network Traffic</h1>
            <div className="overflow-x-auto bg-gray-900 rounded-lg shadow-lg">
                <table className="min-w-full">
                    <thead>
                    <tr className="border-b border-gray-700">
                        <th className="px-4 py-2 text-left">Источник</th>
                        <th className="px-4 py-2 text-left">Назначение</th>
                        <th className="px-4 py-2 text-left">Протокол</th>
                        <th className="px-4 py-2 text-left">Размер (байт)</th>
                        <th className="px-4 py-2 text-left">Приоритет</th>
                        <th className="px-4 py-2 text-left">Ограничен?</th>
                    </tr>
                    </thead>
                    <tbody>
                    {traffic.map((row, i) => (
                        <tr
                            key={i}
                            className="hover:bg-gray-800 transition-colors"
                        >
                            <td className="px-4 py-2">{row.src}</td>
                            <td className="px-4 py-2">{row.dst}</td>
                            <td className="px-4 py-2">{row.protocols[0] || "—"}</td>
                            <td className="px-4 py-2">{row.length}</td>
                            <td className="px-4 py-2">{row.qos?.priority ?? "—"}</td>
                            <td className="px-4 py-2 text-center">
                                {row.throttled ? "🔴" : "🟢"}
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Dashboard;
