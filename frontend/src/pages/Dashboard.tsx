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
  const [protocol, setProtocol] = useState<string>("");
  const [ip, setIP] = useState<string>("");
useEffect(() => {
  console.log("🚀 Попытка подключения к WebSocket...");

  // const socket = new WebSocket("ws://localhost:8000/ws/traffic");
 const socket = new WebSocket("ws://127.0.0.1:8000/ws/traffic");

  socket.onopen = () => {
    console.log("🟢 WebSocket connected");
    console.log("🔎 Состояние:", socket.readyState); // 1 = OPEN
  };

  socket.onmessage = (event) => {
    console.log("📨 WebSocket message received", event.data);
    try {
      
      const packets: Traffic[] = JSON.parse(event.data);
      setTraffic((prev) => [...prev, ...packets]);
    } catch (error) {
      console.error("❌ Ошибка парсинга данных WebSocket:", error);
      console.debug("📦 Исходные данные:", event.data);
    }
  };

  socket.onerror = (error) => {
    console.error("❌ WebSocket error!", error);
    console.warn("🛑 Текущее состояние соединения:", socket.readyState); // 3 = CLOSED
  };

  socket.onclose = (event) => {
    console.warn("🔴 WebSocket disconnected");
    console.log("🔍 Код закрытия:", event.code, "| Причина:", event.reason || "(не указана)");
    console.log("🛑 Состояние соединения:", socket.readyState); // 3 = CLOSED
  };

  return () => {
    console.log("⛔ Закрытие WebSocket при размонтировании компонента");
    socket.close();
  };
}, []);

  // Фильтрация по IP и протоколу
  const filteredTraffic = traffic.filter((pkt) => {
    const matchesIP =
      ip === "" || pkt.src.includes(ip) || pkt.dst.includes(ip);
    const matchesProtocol =
      protocol === "" || pkt.protocol.toUpperCase() === protocol;
    return matchesIP && matchesProtocol;
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
        <select
          value={protocol}
          onChange={(e) => setProtocol(e.target.value)}
          className="bg-white text-black w-full md:w-1/3 lg:w-1/4 border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Select protocol</option>
          <option value="TCP">TCP</option>
          <option value="UDP">UDP</option>
          <option value="ICMP">ICMP</option>
        </select>
      </div>

      <TrafficGraph />
        <TrafficTable traffic={filteredTraffic} />
    </div>
  );
};

export default Dashboard;
