// components/HistoricalList.tsx
"use client";

import { useState, useMemo } from "react";
import { TrendingUp, TrendingDown, DollarSign, Euro, Coins, Search, Filter, Calendar, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface HistoricalData {
  date: string;
  bcv: number;
  paralelo: number;
  euro: number;
  diferencial: number;
}

interface HistoricalListProps {
  data: HistoricalData[];
}

type SortOption = "date-desc" | "date-asc" | "diff-desc" | "diff-asc";
type FilterOption = "all" | "high" | "medium" | "low";

export default function HistoricalList({ data }: HistoricalListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [filterBy, setFilterBy] = useState<FilterOption>("all");

  // Función para obtener el color según el diferencial
  const getDifferentialColor = (diferencial: number) => {
    if (diferencial >= 40) return "text-red-600 dark:text-red-400";
    if (diferencial >= 30) return "text-orange-600 dark:text-orange-400";
    if (diferencial >= 20) return "text-yellow-600 dark:text-yellow-400";
    return "text-green-600 dark:text-green-400";
  };

  const getDifferentialBg = (diferencial: number) => {
    if (diferencial >= 40) return "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800";
    if (diferencial >= 30) return "bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800";
    if (diferencial >= 20) return "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800";
    return "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800";
  };

  const getDifferentialBadge = (diferencial: number) => {
    if (diferencial >= 40) return { variant: "destructive" as const, label: "Muy Alto" };
    if (diferencial >= 30) return { variant: "default" as const, label: "Alto", className: "bg-orange-500 hover:bg-orange-600" };
    if (diferencial >= 20) return { variant: "default" as const, label: "Medio", className: "bg-yellow-500 hover:bg-yellow-600" };
    return { variant: "default" as const, label: "Bajo", className: "bg-green-500 hover:bg-green-600" };
  };

  const getDifferentialCategory = (diferencial: number): FilterOption => {
    if (diferencial >= 30) return "high";
    if (diferencial >= 20) return "medium";
    return "low";
  };

  // Filtrar y ordenar datos
  const processedData = useMemo(() => {
    let filtered = [...data];

    // Filtrar por búsqueda
    if (searchTerm) {
      filtered = filtered.filter((item) =>
        item.date.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtrar por categoría
    if (filterBy !== "all") {
      filtered = filtered.filter((item) => getDifferentialCategory(item.diferencial) === filterBy);
    }

    // Ordenar
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date-desc":
          return new Date(b.date.split("/").reverse().join("-")).getTime() - 
                 new Date(a.date.split("/").reverse().join("-")).getTime();
        case "date-asc":
          return new Date(a.date.split("/").reverse().join("-")).getTime() - 
                 new Date(b.date.split("/").reverse().join("-")).getTime();
        case "diff-desc":
          return b.diferencial - a.diferencial;
        case "diff-asc":
          return a.diferencial - b.diferencial;
        default:
          return 0;
      }
    });

    return filtered;
  }, [data, searchTerm, sortBy, filterBy]);

  // Estadísticas rápidas
  const stats = useMemo(() => {
    if (data.length === 0) return null;
    
    const diferenciales = data.map(d => d.diferencial);
    const promedio = diferenciales.reduce((a, b) => a + b, 0) / diferenciales.length;
    const maximo = Math.max(...diferenciales);
    const minimo = Math.min(...diferenciales);

    return { promedio, maximo, minimo, total: data.length };
  }, [data]);

  return (
    <div className="p-4 md:p-6 space-y-4">
      {/* Estadísticas rápidas */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Total Registros</p>
              <p className="text-2xl font-bold text-foreground">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Promedio</p>
              <p className={`text-2xl font-bold ${getDifferentialColor(stats.promedio)}`}>
                {stats.promedio.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Máximo</p>
              <p className={`text-2xl font-bold ${getDifferentialColor(stats.maximo)}`}>
                {stats.maximo.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-xs text-muted-foreground mb-1">Mínimo</p>
              <p className={`text-2xl font-bold ${getDifferentialColor(stats.minimo)}`}>
                {stats.minimo.toFixed(1)}%
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Controles de búsqueda y filtrado */}
      <div className="flex flex-col md:flex-row gap-3">
        {/* Búsqueda */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Buscar por fecha..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtro por diferencial */}
        <Select value={filterBy} onValueChange={(value) => setFilterBy(value as FilterOption)}>
          <SelectTrigger className="w-full md:w-[180px]">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Filtrar por..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="high">Alto (≥30%)</SelectItem>
            <SelectItem value="medium">Medio (20-30%)</SelectItem>
            <SelectItem value="low">Bajo (&lt;20%)</SelectItem>
          </SelectContent>
        </Select>

        {/* Ordenar */}
        <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
          <SelectTrigger className="w-full md:w-[200px]">
            <ArrowUpDown className="w-4 h-4 mr-2" />
            <SelectValue placeholder="Ordenar por..." />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date-desc">Fecha (Reciente)</SelectItem>
            <SelectItem value="date-asc">Fecha (Antigua)</SelectItem>
            <SelectItem value="diff-desc">Diferencial (Mayor)</SelectItem>
            <SelectItem value="diff-asc">Diferencial (Menor)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Resultados */}
      <div className="text-sm text-muted-foreground">
        Mostrando {processedData.length} de {data.length} registros
      </div>

      {/* Lista de datos */}
      <div className="max-h-[600px] overflow-y-auto space-y-3 pr-2">
        {processedData.map((item, index) => {
          const badge = getDifferentialBadge(item.diferencial);
          
          return (
            <Card
              key={`${item.date}-${index}`}
              className={`transition-all hover:shadow-lg cursor-pointer ${getDifferentialBg(item.diferencial)}`}
            >
              <CardContent className="p-4">
                {/* Encabezado */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{item.date}</h4>
                      <p className="text-xs text-muted-foreground">
                        {(() => {
                          try {
                            const [day, month, year] = item.date.split("/");
                            const fullYear = `20${year}`;
                            const date = new Date(`${fullYear}-${month}-${day}`);
                            return date.toLocaleDateString("es-VE", { weekday: "long" });
                          } catch {
                            return "";
                          }
                        })()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge 
                      variant={badge.variant}
                      className={badge.className}
                    >
                      {badge.label}
                    </Badge>
                    <div className={`flex items-center gap-1 font-bold text-lg mt-1 ${getDifferentialColor(item.diferencial)}`}>
                      {item.diferencial >= 30 ? (
                        <TrendingUp className="w-5 h-5" />
                      ) : (
                        <TrendingDown className="w-5 h-5" />
                      )}
                      <span>{item.diferencial.toFixed(2)}%</span>
                    </div>
                  </div>
                </div>

                {/* Tasas en grid */}
                <div className="grid grid-cols-3 gap-2 md:gap-3">
                  {/* BCV */}
                  <div className="bg-emerald-100 dark:bg-emerald-950/50 p-2 md:p-3 rounded-lg border border-emerald-300 dark:border-emerald-700">
                    <div className="flex items-center gap-1 mb-1">
                      <DollarSign className="w-3 h-3 md:w-4 md:h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-[10px] md:text-xs font-semibold text-foreground">BCV</span>
                    </div>
                    <p className="text-sm md:text-lg font-bold text-emerald-700 dark:text-emerald-400">
                      {item.bcv.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Bs/USD</p>
                  </div>

                  {/* Euro */}
                  <div className="bg-blue-100 dark:bg-blue-950/50 p-2 md:p-3 rounded-lg border border-blue-300 dark:border-blue-700">
                    <div className="flex items-center gap-1 mb-1">
                      <Euro className="w-3 h-3 md:w-4 md:h-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-[10px] md:text-xs font-semibold text-foreground">Euro</span>
                    </div>
                    <p className="text-sm md:text-lg font-bold text-blue-700 dark:text-blue-400">
                      {item.euro.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Bs/EUR</p>
                  </div>

                  {/* Paralelo */}
                  <div className="bg-purple-100 dark:bg-purple-950/50 p-2 md:p-3 rounded-lg border border-purple-300 dark:border-purple-700">
                    <div className="flex items-center gap-1 mb-1">
                      <Coins className="w-3 h-3 md:w-4 md:h-4 text-purple-600 dark:text-purple-400" />
                      <span className="text-[10px] md:text-xs font-semibold text-foreground">Paralelo</span>
                    </div>
                    <p className="text-sm md:text-lg font-bold text-purple-700 dark:text-purple-400">
                      {item.paralelo.toFixed(2)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Bs/USD</p>
                  </div>
                </div>

                {/* Barra de diferencial visual */}
                <div className="mt-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-muted-foreground">Diferencial</span>
                    <span className="text-xs font-semibold text-foreground">{item.diferencial.toFixed(2)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        item.diferencial >= 40
                          ? "bg-red-500"
                          : item.diferencial >= 30
                          ? "bg-orange-500"
                          : item.diferencial >= 20
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                      style={{ width: `${Math.min(item.diferencial, 100)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Mensaje si no hay datos */}
      {processedData.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {data.length === 0 
              ? "No hay datos históricos disponibles" 
              : "No se encontraron resultados con los filtros aplicados"}
          </p>
          {data.length > 0 && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => {
                setSearchTerm("");
                setFilterBy("all");
                setSortBy("date-desc");
              }}
            >
              Limpiar filtros
            </Button>
          )}
        </div>
      )}
    </div>
  );
}