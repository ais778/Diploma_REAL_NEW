import React, { useEffect, useState } from "react";
import TrafficTable from "../components/TrafficTable";
import TrafficGraph from "../components/TrafficGraph";

type Traffic = {
    id?: number;
    src: string;
    dst: string;
    protocol: string;
    length: number;
};

const Dashboard: React.FC = () => {
    const [traffic, setTraffic] = useState<Traffic[]>([]);
    const [ip, setIP] = useState<string>("");

    useEffect(() => {
        console.log("🚀 Попытка подключения к WebSocket...");

        const socket = new WebSocket("ws://127.0.0.1:8000/ws/traffic");

        socket.onopen = () => {
            console.log("🟢 WebSocket connected");
            console.log("🔎 Состояние:", socket.readyState);
        };

        socket.onmessage = (event) => {
            const payload = JSON.parse(event.data) as { packets: Traffic[]; metrics: any };
            setTraffic((prev) => [...prev, ...payload.packets]);
            // Если нужно, можно сохранить metrics в Zustand или React-state
        };

        socket.onerror = (error) => {
            console.error("❌ WebSocket error!", error);
            console.warn("🛑 Текущее состояние соединения:", socket.readyState);
        };

        socket.onclose = (event) => {
            console.warn("🔴 WebSocket disconnected");
            console.log("🔍 Код закрытия:", event.code, "| Причина:", event.reason || "(не указана)");
            console.log("🛑 Состояние соединения:", socket.readyState);
        };

        return () => {
            console.log("⛔ Закрытие WebSocket при размонтировании компонента");
            socket.close();
        };
    }, []);

    const filteredTraffic = traffic.filter((pkt) => {
        return ip === "" || pkt.src.includes(ip) || pkt.dst.includes(ip);
    });

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <h1 className="text-3xl font-bold text-center mb-6 text-indigo-600">
                Network traffic
            </h1>

            <div className="flex flex-wrap gap-4 mb-6 justify-center">
                <input
                    type="text"
                    placeholder="Filter by IP"
                    value={ip}
                    onChange={(e) => setIP(e.target.value)}
                    className="bg-white text-black w-full md:w-1/3 lg:w-1/4 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            <TrafficGraph />
            <br/>
            <TrafficTable traffic={filteredTraffic} />
        </div>
    );
};

export default Dashboard;
