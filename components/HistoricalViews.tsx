// components/HistoricalViews.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, Calendar, List } from "lucide-react";
import HistoricalChart from "./HistoricalChart";
import HistoricalCalendar from "./HistoricalCalendar";
import HistoricalList from "./HistoricalList";

interface HistoricalData {
  date: string;
  bcv: number;
  paralelo: number;
  euro: number;
  diferencial: number;
}

interface HistoricalViewsProps {
  data: HistoricalData[];
}

type ViewType = "chart" | "calendar" | "list";

export default function HistoricalViews({ data }: HistoricalViewsProps) {
  const [activeView, setActiveView] = useState<ViewType>("chart");

  if (!data || data.length === 0) {
    return null;
  }

  return (
    <Card className="shadow-xl border-0 mb-8">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
          <BarChart3 className="w-5 h-5 md:w-6 md:h-6" />
          Historial del Diferencial
        </CardTitle>
        <CardDescription className="text-white/80 text-xs md:text-sm">
          Evolución de las tasas BCV, Euro y Paralelo, y su diferencial porcentual
        </CardDescription>
      </CardHeader>

      {/* Tabs para cambiar de vista */}
      <div className="bg-card border-b border-border px-4 py-3">
        <div className="flex flex-wrap gap-2 justify-center md:justify-start">
          <Button
            onClick={() => setActiveView("chart")}
            variant={activeView === "chart" ? "default" : "outline"}
            size="sm"
            className={`${
              activeView === "chart"
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "hover:bg-accent"
            }`}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Gráfico
          </Button>
          <Button
            onClick={() => setActiveView("calendar")}
            variant={activeView === "calendar" ? "default" : "outline"}
            size="sm"
            className={`${
              activeView === "calendar"
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "hover:bg-accent"
            }`}
          >
            <Calendar className="w-4 h-4 mr-2" />
            Calendario
          </Button>
          <Button
            onClick={() => setActiveView("list")}
            variant={activeView === "list" ? "default" : "outline"}
            size="sm"
            className={`${
              activeView === "list"
                ? "bg-blue-600 hover:bg-blue-700 text-white"
                : "hover:bg-accent"
            }`}
          >
            <List className="w-4 h-4 mr-2" />
            Lista
          </Button>
        </div>
      </div>

      {/* Contenido según la vista activa */}
      <CardContent className="p-0">
        {activeView === "chart" && <HistoricalChart data={data} />}
        {activeView === "calendar" && <HistoricalCalendar data={data} />}
        {activeView === "list" && <HistoricalList data={data} />}
      </CardContent>
    </Card>
  );
}