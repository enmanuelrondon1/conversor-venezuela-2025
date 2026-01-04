// components/RateCards.tsx

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUp } from "lucide-react";
import CopyButton from "./CopyButton";

interface RateCardsProps {
  oficialRate: number;
  paraleloRate: number;
  euroRate: number; // ✅ CAMBIADO DE string A number
}

export default function RateCards({
  oficialRate,
  paraleloRate,
  euroRate,
}: RateCardsProps) {
  return (
    <div className="grid md:grid-cols-3 gap-6 mb-8">
      {/* Tasa BCV */}
      <Card className="relative bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl hover:shadow-2xl transition-all border-0">
        <CopyButton textToCopy={oficialRate.toFixed(2)} />
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-2xl">
              💵
            </div>
            <div>
              <CardTitle className="text-white text-lg">Tasa BCV</CardTitle>
              <CardDescription className="text-white/80 text-xs">
                Tasa del Banco Central
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold mb-2">
            {oficialRate.toFixed(2)} Bs/USD
          </p>
          <div className="flex items-center gap-1 text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>Actualizado</span>
          </div>
          <p className="text-xs mt-3 opacity-75">
            Fuente: Banco Central de Venezuela
          </p>
        </CardContent>
      </Card>

      {/* Tasa Euro */}
      <Card className="relative bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl hover:shadow-2xl transition-all border-0">
        <CopyButton textToCopy={euroRate.toFixed(2)} />
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-2xl">
              💶
            </div>
            <div>
              <CardTitle className="text-white text-lg">Tasa Euro</CardTitle>
              <CardDescription className="text-white/80 text-xs">
                Euro a Bolívares
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold mb-2">
            {euroRate.toFixed(2)} Bs/EUR {/* ✅ AHORA USA EL VALOR REAL */}
          </p>
          <div className="flex items-center gap-1 text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>Actualizado</span> {/* ✅ CAMBIADO DE "Calculado" */}
          </div>
          <p className="text-xs mt-3 opacity-75">
            Fuente: ExchangeRate-API {/* ✅ CAMBIADA LA FUENTE */}
          </p>
        </CardContent>
      </Card>

      {/* Tasa Paralelo */}
      <Card className="relative bg-gradient-to-br from-purple-600 to-pink-600 text-white shadow-xl hover:shadow-2xl transition-all border-0">
        <CopyButton textToCopy={paraleloRate.toFixed(2)} />
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-2xl">
              📈
            </div>
            <div>
              <CardTitle className="text-white text-lg">
                Tasa Paralelo
              </CardTitle>
              <CardDescription className="text-white/80 text-xs">
                Mercado no oficial
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-4xl font-bold mb-2">
            {paraleloRate.toFixed(2)} Bs/USD
          </p>
          <div className="flex items-center gap-1 text-sm">
            <TrendingUp className="w-4 h-4" />
            <span>Actualizado</span>
          </div>
          <p className="text-xs mt-3 opacity-75">Fuente: Monitor Dólar</p>
        </CardContent>
      </Card>
    </div>
  );
}