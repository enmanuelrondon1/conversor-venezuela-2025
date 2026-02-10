// components/HistoricalCalendar.tsx
"use client";

import { useState, useMemo } from "react";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { TrendingUp, TrendingDown, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface HistoricalData {
  date: string;
  bcv: number;
  paralelo: number;
  euro: number;
  diferencial: number;
}

interface HistoricalCalendarProps {
  data: HistoricalData[];
}

export default function HistoricalCalendar({ data }: HistoricalCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Organizar datos por fecha
  const dataMap = useMemo(() => {
    const map = new Map<string, HistoricalData>();
    data.forEach((item) => {
      // Convertir formato dd/mm/yy a yyyy-mm-dd para comparación
      const parts = item.date.split("/");
      const day = parts[0].padStart(2, "0");
      const month = parts[1].padStart(2, "0");
      const year = `20${parts[2]}`;
      const dateKey = `${year}-${month}-${day}`;
      map.set(dateKey, item);
    });
    return map;
  }, [data]);

  // Obtener datos del día seleccionado
  const selectedDayData = useMemo(() => {
    if (!selectedDate) return null;
    const dateKey = format(selectedDate, "yyyy-MM-dd");
    return dataMap.get(dateKey) || null;
  }, [selectedDate, dataMap]);

  // Función para obtener el color según el diferencial
  const getDifferentialColor = (diferencial: number) => {
    if (diferencial >= 40) return "text-red-600 dark:text-red-400";
    if (diferencial >= 30) return "text-orange-600 dark:text-orange-400";
    if (diferencial >= 20) return "text-yellow-600 dark:text-yellow-400";
    return "text-green-600 dark:text-green-400";
  };

  const getDifferentialBgColor = (diferencial: number) => {
    if (diferencial >= 40) return "bg-red-100 dark:bg-red-950";
    if (diferencial >= 30) return "bg-orange-100 dark:bg-orange-950";
    if (diferencial >= 20) return "bg-yellow-100 dark:bg-yellow-950";
    return "bg-green-100 dark:bg-green-950";
  };

  // Modificadores para aplicar estilos personalizados a los días
  const modifiers = useMemo(() => {
    const highDiff = (date: Date) => {
      const dateKey = format(date, "yyyy-MM-dd");
      const dayData = dataMap.get(dateKey);
      return dayData ? dayData.diferencial >= 40 : false;
    };

    const mediumHighDiff = (date: Date) => {
      const dateKey = format(date, "yyyy-MM-dd");
      const dayData = dataMap.get(dateKey);
      return dayData ? dayData.diferencial >= 30 && dayData.diferencial < 40 : false;
    };

    const mediumDiff = (date: Date) => {
      const dateKey = format(date, "yyyy-MM-dd");
      const dayData = dataMap.get(dateKey);
      return dayData ? dayData.diferencial >= 20 && dayData.diferencial < 30 : false;
    };

    const lowDiff = (date: Date) => {
      const dateKey = format(date, "yyyy-MM-dd");
      const dayData = dataMap.get(dateKey);
      return dayData ? dayData.diferencial < 20 : false;
    };

    return {
      highDiff,
      mediumHighDiff,
      mediumDiff,
      lowDiff,
    };
  }, [dataMap]);

  const modifiersClassNames = {
    highDiff: "bg-red-100 dark:bg-red-950 text-red-900 dark:text-red-100 hover:bg-red-200 dark:hover:bg-red-900 font-bold border-2 border-red-500",
    mediumHighDiff: "bg-orange-100 dark:bg-orange-950 text-orange-900 dark:text-orange-100 hover:bg-orange-200 dark:hover:bg-orange-900 font-bold border-2 border-orange-500",
    mediumDiff: "bg-yellow-100 dark:bg-yellow-950 text-yellow-900 dark:text-yellow-100 hover:bg-yellow-200 dark:hover:bg-yellow-900 font-bold border-2 border-yellow-500",
    lowDiff: "bg-green-100 dark:bg-green-950 text-green-900 dark:text-green-100 hover:bg-green-200 dark:hover:bg-green-900 font-bold border-2 border-green-500",
  };

  const handleDayClick = (date: Date | undefined) => {
    if (!date) return;
    
    const dateKey = format(date, "yyyy-MM-dd");
    if (dataMap.has(dateKey)) {
      setSelectedDate(date);
      setIsDialogOpen(true);
    }
  };

  return (
    <div className="p-3 md:p-6">
      {/* Encabezado */}
      <div className="text-center mb-6">
        <div className="flex items-center justify-center gap-2 mb-2">
          <CalendarIcon className="w-6 h-6 text-primary" />
          <h3 className="text-2xl font-bold text-foreground">
            Calendario Histórico
          </h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Selecciona un día con datos para ver los detalles completos
        </p>
      </div>

      {/* Calendario de shadcn */}
      <div className="flex justify-center mb-6">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDayClick}
          locale={es}
          modifiers={modifiers}
          modifiersClassNames={modifiersClassNames}
          className="rounded-md border shadow-sm"
        />
      </div>

      {/* Leyenda */}
      <div className="mt-6 p-4 bg-card border border-border rounded-lg">
        <h4 className="text-sm font-semibold text-foreground mb-3">
          Leyenda del diferencial:
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-green-500" />
            <span className="text-xs text-foreground">{"< 20%"}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-yellow-500" />
            <span className="text-xs text-foreground">20-30%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-orange-500" />
            <span className="text-xs text-foreground">30-40%</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-red-500" />
            <span className="text-xs text-foreground">{">= 40%"}</span>
          </div>
        </div>
      </div>

      {/* Modal de detalles */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              {selectedDate && format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: es })}
            </DialogTitle>
            <DialogDescription>
              Detalles de las tasas de cambio
            </DialogDescription>
          </DialogHeader>

          {selectedDayData && (
            <div className="space-y-4 py-4">
              {/* Diferencial destacado */}
              <div className={`p-4 rounded-lg ${getDifferentialBgColor(selectedDayData.diferencial)}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Diferencial
                    </p>
                    <p className={`text-3xl font-bold ${getDifferentialColor(selectedDayData.diferencial)}`}>
                      {selectedDayData.diferencial.toFixed(2)}%
                    </p>
                  </div>
                  <div>
                    {selectedDayData.diferencial >= 30 ? (
                      <TrendingUp className="w-12 h-12 text-red-600 dark:text-red-400" />
                    ) : (
                      <TrendingDown className="w-12 h-12 text-green-600 dark:text-green-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Tasas de cambio */}
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-card border border-border rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Tasa BCV
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {selectedDayData.bcv.toFixed(2)} Bs
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      Oficial
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-card border border-border rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Euro
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {selectedDayData.euro.toFixed(2)} Bs
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      EUR/VES
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-card border border-border rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Paralelo
                    </p>
                    <p className="text-2xl font-bold text-foreground">
                      {selectedDayData.paralelo.toFixed(2)} Bs
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      Mercado
                    </p>
                  </div>
                </div>
              </div>

              {/* Información adicional */}
              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground text-center">
                  El diferencial representa la diferencia porcentual entre la tasa oficial (BCV) y la tasa del mercado paralelo
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}