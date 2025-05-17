type Traffic = {
  src: string;
  dst: string;
  protocol: string;
  length: number;
};

type Props = {
  traffic: Traffic[];
};

const TrafficTable: React.FC<Props> = ({ traffic }) => {
  return (
    <div className="overflow-x-auto shadow-lg rounded-lg bg-white p-4">
      <table className="min-w-full table-auto border-collapse">
        <thead className="bg-indigo-600 text-white">
          <tr>
            <th className="px-6 py-3 text-left">Источник</th>
            <th className="px-6 py-3 text-left">Назначение</th>
            <th className="px-6 py-3 text-left">Протокол</th>
            <th className="px-6 py-3 text-left">Размер (байт)</th>
          </tr>
        </thead>
        <tbody>
          {traffic.map((item, index) => (
            <tr key={index} className="border-b hover:bg-gray-100">
              <td className="px-6 py-4">{item.src}</td>
              <td className="px-6 py-4">{item.dst}</td>
              <td className="px-6 py-4">{item.protocol}</td>
              <td className="px-6 py-4">{item.length}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TrafficTable;
