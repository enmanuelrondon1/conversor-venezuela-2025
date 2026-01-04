// components/DifferentialCard.tsx

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface DifferentialCardProps {
  differential: string;
}

export default function DifferentialCard({
  differential,
}: DifferentialCardProps) {
  return (
    <Card className="bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-xl mb-8 border-0">
      <CardContent className="p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp className="w-8 h-8" />
              <h3 className="text-2xl font-bold">
                Diferencial BCV vs. Paralelo
              </h3>
            </div>
            <p className="text-sm opacity-90 mb-4">
              Diferencia porcentual entre la tasa oficial y el mercado paralelo
            </p>
            <p className="text-6xl font-bold mb-3">{differential}%</p>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="w-4 h-4" />
              <span>Variación en tiempo real</span>
            </div>
          </div>
        </div>
        <div className="mt-6 p-4 bg-orange-600/30 rounded-lg backdrop-blur-sm">
          <p className="text-sm flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <span>
              Alta volatilidad en el mercado cambiario. Se recomienda
              precaución en operaciones.
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}