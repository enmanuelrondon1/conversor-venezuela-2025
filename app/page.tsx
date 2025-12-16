// app/page.tsx

"use client";

import { useState, useEffect } from "react";
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
import { ArrowLeftRight, RefreshCw, Download } from "lucide-react";

interface ExchangeRate {
  fuente: string;
  nombre: string;
  compra: number | null;
  venta: number | null;
  promedio: number;
  fechaActualizacion: string;
}

export default function Home() {
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [amount, setAmount] = useState<string>("1");
  const [fromCurrency, setFromCurrency] = useState<string>("USD");
  const [toCurrency, setToCurrency] = useState<string>("VES");
  const [selectedRate, setSelectedRate] = useState<string>("oficial");
  const [result, setResult] = useState<number>(0);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  // Detectar si se puede instalar como PWA
  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setShowInstallButton(false);
    }

    setDeferredPrompt(null);
  };

  const fetchRates = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/rates");
      const data = await response.json();
      console.log("Datos recibidos:", data);
      setRates(data);
    } catch (error) {
      console.error("Error fetching rates:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRates();
  }, []);

  useEffect(() => {
    calculateConversion();
  }, [amount, fromCurrency, toCurrency, selectedRate, rates]);

  const calculateConversion = () => {
    if (!amount || rates.length === 0) return;

    const rate = rates.find((r) => r.fuente === selectedRate);
    if (!rate || !rate.promedio) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return;

    if (fromCurrency === "USD" && toCurrency === "VES") {
      setResult(numAmount * rate.promedio);
    } else if (fromCurrency === "VES" && toCurrency === "USD") {
      setResult(numAmount / rate.promedio);
    }
  };

  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const oficialRate = rates.find((r) => r.fuente === "oficial");
  const paraleloRate = rates.find((r) => r.fuente === "paralelo");

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            🇻🇪 Conversor Venezuela
          </h1>
          <p className="text-slate-300">Tasas en tiempo real</p>

          {/* Botones de acción */}
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            <Button
              onClick={() => (window.location.href = "/subscribe")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold"
            >
              📱 Suscribirme a notificaciones
            </Button>

            {showInstallButton && (
              <Button
                onClick={handleInstallClick}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold"
              >
                <Download className="h-4 w-4 mr-2" />
                Instalar App
              </Button>
            )}
          </div>
        </div>

        {/* Tasas principales */}
        {!loading && (
          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-blue-950/50 border-blue-800">
              <CardHeader>
                <CardTitle className="text-white">
                  💵 Dólar BCV Oficial
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Banco Central de Venezuela
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-green-400">
                  {oficialRate?.promedio
                    ? oficialRate.promedio.toFixed(2)
                    : "---"}{" "}
                  Bs/$
                </p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">💸 Dólar Paralelo</CardTitle>
                <CardDescription className="text-slate-300">
                  Mercado P2P / Criptomonedas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-blue-400">
                  {paraleloRate?.promedio
                    ? paraleloRate.promedio.toFixed(2)
                    : "---"}{" "}
                  Bs/$
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Convertidor */}
        <Card className="bg-slate-800/80 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              Convertidor de Divisas
              <Button
                variant="outline"
                size="icon"
                onClick={fetchRates}
                disabled={loading}
                className="bg-slate-700 border-slate-600"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Selector de tasa */}
            <div className="space-y-2">
              <label className="text-sm text-slate-300">Tipo de tasa:</label>
              <Select value={selectedRate} onValueChange={setSelectedRate}>
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="oficial">Dólar BCV Oficial</SelectItem>
                  <SelectItem value="paralelo">Dólar Paralelo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* De */}
            <div className="space-y-2">
              <label className="text-sm text-slate-300">De:</label>
              <div className="flex gap-2">
                <Select value={fromCurrency} onValueChange={setFromCurrency}>
                  <SelectTrigger className="w-32 bg-slate-700 border-slate-600 text-white">
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
                  className="bg-slate-700 border-slate-600 text-white"
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
                className="bg-slate-700 border-slate-600 hover:bg-slate-600"
              >
                <ArrowLeftRight className="h-4 w-4" />
              </Button>
            </div>

            {/* A */}
            <div className="space-y-2">
              <label className="text-sm text-slate-300">A:</label>
              <div className="flex gap-2">
                <Select value={toCurrency} onValueChange={setToCurrency}>
                  <SelectTrigger className="w-32 bg-slate-700 border-slate-600 text-white">
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
                  className="bg-slate-900 border-slate-600 text-white font-bold text-lg"
                />
              </div>
            </div>

            {/* Info actualización */}
            {oficialRate && (
              <p className="text-xs text-slate-400 text-center">
                Actualizado:{" "}
                {new Date(oficialRate.fechaActualizacion).toLocaleString(
                  "es-VE"
                )}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Todas las tasas */}
        <Card className="bg-slate-800/80 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">📊 Todas las Tasas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-3">
              {rates.map((rate) => {
                const uniqueKey = `${rate.fuente}-${rate.nombre}`;

                return (
                  <div
                    key={uniqueKey}
                    className="bg-slate-700/50 p-3 rounded-lg border border-slate-600"
                  >
                    <p className="text-sm font-semibold text-white">
                      {rate.nombre}
                    </p>
                    <p className="text-xs text-slate-400">{rate.fuente}</p>
                    <p className="text-lg font-bold text-green-400 mt-1">
                      {rate.promedio ? rate.promedio.toFixed(2) : "---"} Bs
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
