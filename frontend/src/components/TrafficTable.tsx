import React from "react";

type Traffic = {
  src: string;
  dst: string;
  protocol: string;
  length: number;
  qos?: { priority: number };
  throttled?: boolean;
};

type Props = {
  traffic: Traffic[];
};

// Helper to color-code priority badges
const getPriorityColor = (priority?: number) => {
  if (priority === undefined) return "bg-gray-200 text-gray-700";
  if (priority >= 8) return "bg-green-200 text-green-800";
  if (priority >= 5) return "bg-yellow-200 text-yellow-800";
  return "bg-red-200 text-red-800";
};

const TrafficTable: React.FC<Props> = ({ traffic }) => {
  return (
      <div className="overflow-x-auto shadow-lg rounded-lg bg-white p-4">
        <table className="min-w-full table-auto border-collapse">
          <thead className="bg-indigo-600 text-white">
          <tr>
            <th className="px-4 py-3 text-left">Источник</th>
            <th className="px-4 py-3 text-left">Назначение</th>
            <th className="px-4 py-3 text-left">Протокол</th>
            <th className="px-4 py-3 text-left">Размер (байт)</th>
            <th className="px-4 py-3 text-left">Приоритет</th>
            <th className="px-4 py-3 text-left">Ограничен?</th>
          </tr>
          </thead>
          <tbody>
          {traffic.map((item, index) => (
              <tr
                  key={index}
                  className={`border-b hover:bg-gray-100 transition-opacity duration-200 ${
                      item.throttled ? "opacity-60" : "opacity-100"
                  }`}
              >
                <td className="px-4 py-3 break-all">{item.src}</td>
                <td className="px-4 py-3 break-all">{item.dst}</td>
                <td className="px-4 py-3">{item.protocol}</td>
                <td className="px-4 py-3">{item.length}</td>
                <td className="px-4 py-3">
                <span
                    className={`inline-block px-2 py-1 text-sm font-semibold rounded-full ${
                        getPriorityColor(item.qos?.priority)
                    }`}
                >
                  {item.qos?.priority ?? "—"}
                </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {item.throttled ? (
                      <span className="text-red-500 text-xl">&#x26A0;</span>
                  ) : (
                      <span className="text-green-500 text-xl">&#x2714;</span>
                  )}
                </td>
              </tr>
          ))}
          </tbody>
        </table>
      </div>
  );
};

export default TrafficTable;
