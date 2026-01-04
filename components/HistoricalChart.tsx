// components/HistoricalChart.tsx

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
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

export default function HistoricalChart({ data }: HistoricalChartProps) {
  const chartData = Array.isArray(data) ? data : [];

  if (chartData.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-xl border-0 mb-8">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-6 h-6" />
          Historial del Diferencial
        </CardTitle>
        <CardDescription className="text-white/80">
          Evolución de las tasas BCV y Paralelo, y su diferencial porcentual
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              stroke="#6b7280"
              style={{ fontSize: "12px" }}
            />
            <YAxis
              yAxisId="left"
              stroke="#6b7280"
              style={{ fontSize: "12px" }}
              label={{
                value: "Diferencial (%)",
                angle: -90,
                position: "insideLeft",
              }}
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
              }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1f2937",
                border: "none",
                borderRadius: "8px",
                color: "white",
              }}
            />
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
              dataKey="paralelo"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Tasa Paralelo"
              dot={{ fill: "#3b82f6" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}