// components/HistoricalChart.tsx
"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface HistoricalData {
  date: string;
  bcv: number;
  paralelo: number;
  euro: number;
  diferencial: number;
}

interface HistoricalChartProps {
  data: HistoricalData[];
}

// Tooltip personalizado con Euro incluido
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-900 dark:bg-gray-800 p-3 rounded-lg border border-gray-700 dark:border-gray-600 shadow-xl">
        <p className="text-white font-semibold mb-2 text-sm">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="text-xs font-medium">
            {entry.name}: {entry.value.toFixed(2)}
            {entry.name.includes("%") ? "%" : " Bs"}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function HistoricalChart({ data }: HistoricalChartProps) {
  const chartData = Array.isArray(data) ? data : [];

  if (chartData.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-muted-foreground">No hay datos históricos disponibles</p>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-6">
        {/* Versión móvil - Altura reducida */}
        <div className="block md:hidden">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
              <XAxis
                dataKey="date"
                stroke="#6b7280"
                tick={{ fontSize: 10 }}
                interval="preserveStartEnd"
                className="dark:stroke-gray-400"
              />
              <YAxis
                yAxisId="left"
                stroke="#ef4444"
                tick={{ fontSize: 10 }}
                width={40}
                className="dark:stroke-red-400"
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#3b82f6"
                tick={{ fontSize: 10 }}
                width={45}
                className="dark:stroke-blue-400"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ fontSize: "10px" }}
                iconSize={8}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="diferencial"
                stroke="#ef4444"
                strokeWidth={2}
                name="Diferencial (%)"
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="bcv"
                stroke="#10b981"
                strokeWidth={2}
                name="Tasa BCV"
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="euro"
                stroke="#f59e0b"
                strokeWidth={2}
                name="Tasa Euro"
                dot={false}
                activeDot={{ r: 4 }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="paralelo"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Tasa Paralelo"
                dot={false}
                activeDot={{ r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Versión escritorio - Altura completa */}
        <div className="hidden md:block">
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:opacity-20" />
              <XAxis
                dataKey="date"
                stroke="#6b7280"
                style={{ fontSize: "12px" }}
                className="dark:stroke-gray-400"
              />
              <YAxis
                yAxisId="left"
                stroke="#6b7280"
                style={{ fontSize: "12px" }}
                label={{
                  value: "Diferencial (%)",
                  angle: -90,
                  position: "insideLeft",
                  style: { fontSize: "12px" },
                }}
                className="dark:stroke-gray-400"
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#6b7280"
                style={{ fontSize: "12px" }}
                label={{
                  value: "Tasa (Bs)",
                  angle: 90,
                  position: "insideRight",
                  style: { fontSize: "12px" },
                }}
                className="dark:stroke-gray-400"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="diferencial"
                stroke="#ef4444"
                strokeWidth={2}
                name="Diferencial (%)"
                dot={{ fill: "#ef4444" }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="bcv"
                stroke="#10b981"
                strokeWidth={2}
                name="Tasa BCV"
                dot={{ fill: "#10b981" }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="euro"
                stroke="#f59e0b"
                strokeWidth={2}
                name="Tasa Euro"
                dot={{ fill: "#f59e0b" }}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="paralelo"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Tasa Paralelo"
                dot={{ fill: "#3b82f6" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }