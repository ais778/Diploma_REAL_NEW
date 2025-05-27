// src/components/TrafficTable.tsx
import React, { useEffect, useState } from "react";
import { networkApi, Packet } from "../api/networkApi";

const getPriorityColor = (p?: number) => {
  if (p === undefined) return "bg-gray-200 text-gray-700";
  if (p >= 8) return "bg-green-200 text-green-800";
  if (p >= 5) return "bg-yellow-200 text-yellow-800";
  return "bg-red-200 text-red-800";
};

const TrafficTable: React.FC = () => {
  const [rows, setRows] = useState<Packet[]>([]);

  useEffect(() => {
    // накапливаем все пришедшие пакеты
    const unsubscribe = networkApi.subscribe(({ packets }) => {
      setRows((prev) => [...prev, ...packets]);
    });
    return unsubscribe;
  }, []);

  return (
      <div className="overflow-x-auto bg-white rounded-lg shadow p-4">
        <table className="min-w-full table-auto">
          <thead className="bg-indigo-600 text-white">
          <tr>
            <th className="px-4 py-2 text-left">Источник</th>
            <th className="px-4 py-2 text-left">Назначение</th>
            <th className="px-4 py-2 text-left">Протокол</th>
            <th className="px-4 py-2 text-left">Размер</th>
            <th className="px-4 py-2 text-left">Приоритет</th>
            <th className="px-4 py-2 text-left">Ограничен?</th>
          </tr>
          </thead>
          <tbody>
          {rows.map((row, i) => (
              <tr
                  key={i}
                  className={`border-b hover:bg-gray-100 ${
                      row.throttled ? "opacity-60" : ""
                  }`}
              >
                <td className="px-4 py-2 break-all">{row.src}</td>
                <td className="px-4 py-2 break-all">{row.dst}</td>
                <td className="px-4 py-2">{row.protocols[0] ?? "—"}</td>
                <td className="px-4 py-2">{row.length}</td>
                <td className="px-4 py-2">
                <span
                    className={`inline-block px-2 py-1 text-sm font-semibold rounded-full ${getPriorityColor(
                        row.qos?.priority
                    )}`}
                >
                  {row.qos?.priority ?? "—"}
                </span>
                </td>
                <td className="px-4 py-2 text-center">
                  {row.throttled ? "🔴" : "🟢"}
                </td>
              </tr>
          ))}
          </tbody>
        </table>
      </div>
  );
};

export default TrafficTable;
