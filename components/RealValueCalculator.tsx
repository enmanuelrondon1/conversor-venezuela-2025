// components/RealValueCalculator.tsx

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DollarSign, TrendingDown, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";

interface RealValueCalculatorProps {
  oficialRate: number;
  paraleloRate: number;
  euroRate: number;
}

export default function RealValueCalculator({
  oficialRate,
  paraleloRate,
  euroRate,
}: RealValueCalculatorProps) {
  const [amountUSD, setAmountUSD] = useState<string>("100");
  const [selectedConversionRate, setSelectedConversionRate] = useState<string>("paralelo");

  // Resultados calculados
  const [amountReceived, setAmountReceived] = useState<number>(0);
  const [conversionRate, setConversionRate] = useState<number>(0);
  const [realAmount, setRealAmount] = useState<number>(0);
  const [loss, setLoss] = useState<number>(0);
  const [lossPercentage, setLossPercentage] = useState<number>(0);

  // Calcular valores cuando cambian los inputs
  useEffect(() => {
    calculateRealValue();
  }, [amountUSD, selectedConversionRate, oficialRate, paraleloRate, euroRate]);

  const calculateRealValue = () => {
    const usdAmount = parseFloat(amountUSD) || 0;
    
    // PASO 1: SIEMPRE convertir USD a Bs usando la tasa BCV (base de referencia)
    const receivedBs = usdAmount * oficialRate;
    setAmountReceived(receivedBs);

    // PASO 2: Determinar con qué tasa reconvertir esos Bs a USD
    let reconversionRate = 0;
    switch (selectedConversionRate) {
      case "bcv":
        reconversionRate = oficialRate;
        break;
      case "euro":
        reconversionRate = euroRate;
        break;
      case "paralelo":
        reconversionRate = paraleloRate;
        break;
      default:
        reconversionRate = paraleloRate;
    }
    
    setConversionRate(reconversionRate);

    // PASO 3: Reconvertir los Bs a USD usando la tasa seleccionada
    const realUSD = receivedBs / reconversionRate;
    setRealAmount(realUSD);

    // PASO 4: Pérdida en USD (comparando con el monto original)
    const lossUSD = usdAmount - realUSD;
    setLoss(lossUSD);

    // PASO 5: Pérdida porcentual
    const lossPercent = ((lossUSD / usdAmount) * 100);
    setLossPercentage(lossPercent);
  };

  // Calcular valor real para CUALQUIER tasa (para la comparativa)
  const calculateValueForRate = (rateType: 'bcv' | 'euro' | 'paralelo') => {
    const usdAmount = parseFloat(amountUSD) || 0;
    
    // Paso 1: SIEMPRE convertir USD a Bs con tasa BCV
    const bolivares = usdAmount * oficialRate;
    
    // Paso 2: Seleccionar la tasa de reconversión
    let reconversionRate = 0;
    switch (rateType) {
      case 'bcv':
        reconversionRate = oficialRate;
        break;
      case 'euro':
        reconversionRate = euroRate;
        break;
      case 'paralelo':
        reconversionRate = paraleloRate;
        break;
    }
    
    // Paso 3: Reconvertir a USD usando la tasa específica
    const realValue = bolivares / reconversionRate;
    
    // Paso 4: Calcular pérdida
    const lossAmount = usdAmount - realValue;
    const lossPercent = (lossAmount / usdAmount) * 100;

    return {
      value: realValue,
      loss: lossPercent
    };
  };

  const getRateName = (rateType: string): string => {
    switch (rateType) {
      case "bcv":
        return "BCV";
      case "euro":
        return "Euro";
      case "paralelo":
        return "Paralelo";
      default:
        return "Paralelo";
    }
  };

  return (
    <Card className="shadow-xl border-0">
      <CardHeader className="bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="w-6 h-6" />
          Calculadora de Valor Real
        </CardTitle>
        <CardDescription className="text-white/90">
          Calcula cuánto recibes realmente después de una transacción con conversión de divisas
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Input de precio en USD */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Precio en USD
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-semibold">
              $
            </span>
            <Input
              type="number"
              value={amountUSD}
              onChange={(e) => setAmountUSD(e.target.value)}
              className="pl-8 bg-background border-input text-lg font-semibold"
              placeholder="100"
              step="0.01"
            />
          </div>
        </div>

        {/* Selector de tasa para reconvertir a dólares */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Tasa para reconvertir a dólares
          </label>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => setSelectedConversionRate("bcv")}
              className={`p-4 rounded-lg border-2 transition-all text-center ${
                selectedConversionRate === "bcv"
                  ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950 dark:border-emerald-400"
                  : "border-border hover:border-emerald-300 dark:hover:border-emerald-600 bg-card"
              }`}
            >
              <p className="text-xs text-muted-foreground mb-1">BCV</p>
              <p className="text-sm font-bold text-foreground">
                {oficialRate.toFixed(2)} Bs/USD
              </p>
            </button>

            <button
              onClick={() => setSelectedConversionRate("euro")}
              className={`p-4 rounded-lg border-2 transition-all text-center ${
                selectedConversionRate === "euro"
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-950 dark:border-blue-400"
                  : "border-border hover:border-blue-300 dark:hover:border-blue-600 bg-card"
              }`}
            >
              <p className="text-xs text-muted-foreground mb-1">€ Euro</p>
              <p className="text-sm font-bold text-foreground">
                {euroRate.toFixed(2)} Bs/EUR
              </p>
            </button>

            <button
              onClick={() => setSelectedConversionRate("paralelo")}
              className={`p-4 rounded-lg border-2 transition-all text-center ${
                selectedConversionRate === "paralelo"
                  ? "border-purple-500 bg-purple-50 dark:bg-purple-950 dark:border-purple-400"
                  : "border-border hover:border-purple-300 dark:hover:border-purple-600 bg-card"
              }`}
            >
              <p className="text-xs text-muted-foreground mb-1">Paralelo</p>
              <p className="text-sm font-bold text-foreground">
                {paraleloRate.toFixed(2)} Bs/USD
              </p>
            </button>
          </div>
        </div>

        {/* Botón de cálculo */}
        <Button className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold shadow-lg h-12">
          <DollarSign className="w-5 h-5 mr-2" />
          Calcular Monto Real
        </Button>

        {/* Resultados del cálculo */}
        <div className="bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-950 rounded-lg p-6 border-2 border-blue-100 dark:border-blue-900 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h3 className="font-bold text-foreground">Resultados del Cálculo</h3>
          </div>

          {/* Monto en Bs recibido */}
          <div className="flex justify-between items-center py-3 border-b border-border">
            <span className="text-sm text-muted-foreground">Monto en Bs recibido:</span>
            <span className="text-xl font-bold text-foreground">
              {amountReceived.toLocaleString("es-VE", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              Bs
            </span>
          </div>

          {/* Tasa de reconversión */}
          <div className="flex justify-between items-center py-3 border-b border-border">
            <span className="text-sm text-muted-foreground">Tasa de reconversión:</span>
            <span className="text-sm font-semibold text-foreground">
              {getRateName(selectedConversionRate)} ({conversionRate.toFixed(2)} Bs/{selectedConversionRate === "euro" ? "EUR" : "USD"})
            </span>
          </div>

          {/* Monto real recibido */}
          <div className="flex justify-between items-center py-3 border-b border-border">
            <span className="text-sm text-muted-foreground">Monto real recibido:</span>
            <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              ${realAmount.toFixed(2)}
            </span>
          </div>

          {/* Pérdida en esta transacción */}
          <div className="flex justify-between items-center py-3">
            <span className="text-sm text-muted-foreground">Pérdida en esta transacción:</span>
            <span className={`text-xl font-bold ${loss > 0 ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}`}>
              ${loss.toFixed(2)} ({lossPercentage.toFixed(2)}%)
            </span>
          </div>
        </div>

        {/* Comparativa de tasas */}
        <div className="bg-card rounded-lg p-5 border border-border space-y-3">
          <h4 className="font-semibold text-foreground mb-3">Comparativa de tasas:</h4>
          
          <div className="space-y-2">
            {/* BCV */}
            <div className={`flex justify-between items-center p-3 rounded ${
              selectedConversionRate === "bcv" 
                ? "bg-emerald-100 dark:bg-emerald-950 border-2 border-emerald-400 dark:border-emerald-500" 
                : "bg-emerald-50 dark:bg-emerald-950/50"
            }`}>
              <div>
                <p className="text-sm font-semibold text-foreground">BCV</p>
                <p className="text-xs text-muted-foreground">
                  Pérdida: {calculateValueForRate('bcv').loss.toFixed(2)}%
                </p>
              </div>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                ${calculateValueForRate('bcv').value.toFixed(2)}
              </p>
            </div>

            {/* Euro */}
            <div className={`flex justify-between items-center p-3 rounded ${
              selectedConversionRate === "euro" 
                ? "bg-blue-100 dark:bg-blue-950 border-2 border-blue-400 dark:border-blue-500" 
                : "bg-blue-50 dark:bg-blue-950/50"
            }`}>
              <div>
                <p className="text-sm font-semibold text-foreground">€ Euro</p>
                <p className="text-xs text-muted-foreground">
                  Pérdida: {calculateValueForRate('euro').loss.toFixed(2)}%
                </p>
              </div>
              <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                ${calculateValueForRate('euro').value.toFixed(2)}
              </p>
            </div>

            {/* Paralelo */}
            <div className={`flex justify-between items-center p-3 rounded ${
              selectedConversionRate === "paralelo" 
                ? "bg-purple-100 dark:bg-purple-950 border-2 border-purple-400 dark:border-purple-500" 
                : "bg-purple-50 dark:bg-purple-950/50"
            }`}>
              <div>
                <p className="text-sm font-semibold text-foreground">Paralelo</p>
                <p className="text-xs text-muted-foreground">
                  Pérdida: {calculateValueForRate('paralelo').loss.toFixed(2)}%
                </p>
              </div>
              <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                ${calculateValueForRate('paralelo').value.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {/* Advertencia */}
        {lossPercentage > 10 && (
          <div className="bg-red-50 dark:bg-red-950/50 border-l-4 border-red-500 dark:border-red-600 p-4 rounded">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                  Alta volatilidad en el mercado cambiario
                </p>
                <p className="text-xs text-red-700 dark:text-red-400 mt-1">
                  Se recomienda precaución en operaciones. La pérdida estimada es del {lossPercentage.toFixed(2)}%.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}