// components/CurrencyConverter.tsx

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeftRight, Calculator, Copy, Check } from "lucide-react";
import { useState } from "react";

interface CurrencyConverterProps {
  amount: string;
  setAmount: (value: string) => void;
  fromCurrency: string;
  setFromCurrency: (value: string) => void;
  toCurrency: string;
  setToCurrency: (value: string) => void;
  selectedRate: string;
  setSelectedRate: (value: string) => void;
  result: number;
  swapCurrencies: () => void;
  lastUpdate: string;
}

export default function CurrencyConverter({
  amount,
  setAmount,
  fromCurrency,
  setFromCurrency,
  toCurrency,
  setToCurrency,
  selectedRate,
  setSelectedRate,
  result,
  swapCurrencies,
  lastUpdate,
}: CurrencyConverterProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(result.toFixed(2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000); // Reset after 2 seconds
  };

  return (
    <Card className="shadow-xl border-0">
      <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-6 h-6" />
          Calculadora de Conversión
        </CardTitle>
        <CardDescription className="text-white/80">
          Convierte entre dólares y bolívares usando diferentes tasas
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Selector de tasa */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">
            Tipo de tasa:
          </label>
          <Select value={selectedRate} onValueChange={setSelectedRate}>
            <SelectTrigger className="bg-white border-gray-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="oficial">💵 Dólar BCV Oficial</SelectItem>
              <SelectItem value="paralelo">📈 Dólar Paralelo</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* De */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">De:</label>
          <div className="flex gap-3">
            <Select value={fromCurrency} onValueChange={setFromCurrency}>
              <SelectTrigger className="w-32 bg-white border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD 🇺🇸</SelectItem>
                <SelectItem value="VES">VES 🇻🇪</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-white border-gray-300 text-lg"
              placeholder="Cantidad"
            />
          </div>
        </div>

        {/* Botón de intercambio */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="icon"
            onClick={swapCurrencies}
            className="bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0 hover:from-blue-600 hover:to-purple-600 shadow-md"
          >
            <ArrowLeftRight className="h-5 w-5" />
          </Button>
        </div>

        {/* A */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">A:</label>
          <div className="relative flex items-center gap-3">
            <Select value={toCurrency} onValueChange={setToCurrency}>
              <SelectTrigger className="w-32 bg-white border-gray-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD 🇺🇸</SelectItem>
                <SelectItem value="VES">VES 🇻🇪</SelectItem>
              </SelectContent>
            </Select>
            <Input
              type="text"
              value={result.toFixed(2)}
              readOnly
              className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-300 font-bold text-2xl text-blue-600 pr-10"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleCopy}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-gray-500 hover:bg-gray-200"
            >
              {copied ? (
                <Check className="h-5 w-5 text-green-500" />
              ) : (
                <Copy className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Info actualización */}
        {lastUpdate && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Última actualización:</strong> {lastUpdate}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}