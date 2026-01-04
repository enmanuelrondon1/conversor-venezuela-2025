// app/page.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Download, BarChart3, Bell, Calculator } from "lucide-react";

// Componentes personalizados
import RateCards from "@/components/RateCards";
import DifferentialCard from "@/components/DifferentialCard";
import HistoricalChart from "@/components/HistoricalChart";
import CurrencyConverter from "@/components/CurrencyConverter";

interface ExchangeRate {
  fuente: string;
  nombre: string;
  compra: number | null;
  venta: number | null;
  promedio: number;
  fechaActualizacion: string;
}

interface HistoricalData {
  date: string;
  bcv: number;
  paralelo: number;
  euro: number;
  diferencial: number;
}

export default function Home() {
  // Estados principales
  const [rates, setRates] = useState<ExchangeRate[]>([]);
  const [historical, setHistorical] = useState<HistoricalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"rates" | "converter">("rates");

  // Estados del convertidor
  const [amount, setAmount] = useState<string>("1");
  const [fromCurrency, setFromCurrency] = useState<string>("USD");
  const [toCurrency, setToCurrency] = useState<string>("VES");
  const [selectedRate, setSelectedRate] = useState<string>("oficial");
  const [result, setResult] = useState<number>(0);

  // Estados PWA
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);

  // PWA Install Handler
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

  // Fetch de datos
  const fetchRates = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/rates");
      const data = await response.json();
      setRates(data);
    } catch (error) {
      console.error("Error fetching rates:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistorical = async () => {
    try {
      const response = await fetch("/api/historical?days=30");
      const data = await response.json();
      setHistorical(data);
    } catch (error) {
      console.error("Error fetching historical:", error);
    }
  };

  useEffect(() => {
    fetchRates();
    fetchHistorical();
    const interval = setInterval(() => {
      fetchRates();
      fetchHistorical();
    }, 300000); // 5 minutos
    return () => clearInterval(interval);
  }, []);

  // Conversión de moneda
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

  // Datos calculados
  const oficialRate = rates.find((r) => r.fuente === "oficial");
  const paraleloRate = rates.find((r) => r.fuente === "paralelo");
  const euroRate = rates.find((r) => r.fuente === "euro"); // ✅ OBTENEMOS EL EURO DEL API

  const calculateDifferential = () => {
    if (!oficialRate || !paraleloRate) return "0";
    const diff = ((paraleloRate.promedio - oficialRate.promedio) / oficialRate.promedio) * 100;
    return diff.toFixed(2);
  };

  const formatDate = () => {
    if (!oficialRate) return "";
    const date = new Date(oficialRate.fechaActualizacion);
    return new Intl.DateTimeFormat("es-VE", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  // Pantalla de carga
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando tasas...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <BarChart3 className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Monitor de Divisas Venezuela
            </h1>
          </div>
          <p className="text-gray-600 mb-2">{formatDate()}</p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <RefreshCw className="w-4 h-4" />
              Datos en tiempo real
            </span>
            <span>• Actualización automática</span>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-wrap gap-3 justify-center mt-6">
            <Button
              onClick={() => (window.location.href = "/subscribe")}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-lg"
            >
              <Bell className="h-4 w-4 mr-2" />
              Suscribirme a notificaciones
            </Button>

            {showInstallButton && (
              <Button
                onClick={handleInstallClick}
                className="bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg"
              >
                <Download className="h-4 w-4 mr-2" />
                Instalar App
              </Button>
            )}

            <Button
              onClick={fetchRates}
              variant="outline"
              className="border-blue-200 hover:bg-blue-50 font-semibold"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <Button
            onClick={() => setActiveTab("rates")}
            className={`flex-1 ${
              activeTab === "rates"
                ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            } shadow-md`}
          >
            <BarChart3 className="w-4 h-4 mr-2" />
            Tasas de Cambio
          </Button>
          <Button
            onClick={() => setActiveTab("converter")}
            className={`flex-1 ${
              activeTab === "converter"
                ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                : "bg-white text-gray-700 hover:bg-gray-100"
            } shadow-md`}
          >
            <Calculator className="w-4 h-4 mr-2" />
            Calculadora
          </Button>
        </div>

        {/* Vista de Tasas */}
        {activeTab === "rates" && (
          <>
            <RateCards
              oficialRate={oficialRate?.promedio || 0}
              paraleloRate={paraleloRate?.promedio || 0}
              euroRate={euroRate?.promedio || 0} // ✅ PASAMOS EL VALOR CORRECTO
            />

            <DifferentialCard differential={calculateDifferential()} />

            <HistoricalChart data={historical} />

            {/* Todas las tasas */}
            <Card className="shadow-xl border-0">
              <CardHeader className="bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Todas las Tasas Disponibles
                </CardTitle>
                <CardDescription className="text-slate-300">
                  Comparativa de diferentes fuentes y casas de cambio
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="grid md:grid-cols-3 gap-4">
                  {rates.map((rate) => (
                    <div
                      key={`${rate.fuente}-${rate.nombre}`}
                      className="bg-gradient-to-br from-slate-50 to-blue-50 p-4 rounded-lg border border-blue-100 hover:border-blue-300 transition-all hover:shadow-md"
                    >
                      <p className="text-sm font-semibold text-slate-800 mb-1">
                        {rate.nombre}
                      </p>
                      <p className="text-xs text-slate-500 mb-2">{rate.fuente}</p>
                      <p className="text-2xl font-bold text-blue-600">
                        {rate.promedio ? rate.promedio.toFixed(2) : "---"} Bs
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {/* Vista Convertidor */}
        {activeTab === "converter" && (
          <CurrencyConverter
            amount={amount}
            setAmount={setAmount}
            fromCurrency={fromCurrency}
            setFromCurrency={setFromCurrency}
            toCurrency={toCurrency}
            setToCurrency={setToCurrency}
            selectedRate={selectedRate}
            setSelectedRate={setSelectedRate}
            result={result}
            swapCurrencies={swapCurrencies}
            lastUpdate={
              oficialRate
                ? new Date(oficialRate.fechaActualizacion).toLocaleString("es-VE")
                : ""
            }
          />
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-600 space-y-2">
          <p>
            Los datos presentados son solo para fines informativos. Las tasas pueden
            variar.
          </p>
          <p>© 2025 Monitor de Divisas Venezuela • Desarrollado con ❤️ para Venezuela</p>
        </div>
      </div>
    </main>
  );
}