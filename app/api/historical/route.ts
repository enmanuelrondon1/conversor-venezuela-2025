// app/api/historical/route.ts

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

interface HistoricalRecord {
  id: number;
  fecha: Date;
  bcv: number;
  paralelo: number;
  euro: number | null;
  bcvChange: number | null;
  paraleloChange: number | null;
  euroChange: number | null;
  diferencial: number;
  fuente: string | null;
  createdAt: Date;
}

interface FormattedData {
  date: string;
  bcv: number;
  paralelo: number;
  euro: number;
  diferencial: number;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");
    
    // Obtener datos históricos de los últimos X días
    const historicalData = await prisma.rateHistory.findMany({
      where: {
        fecha: {
          gte: new Date(Date.now() - days * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: {
        fecha: "asc",
      },
    });

    // Formatear los datos para el gráfico
    const formattedData: FormattedData[] = historicalData.map((record: HistoricalRecord) => ({
      date: new Intl.DateTimeFormat("es-VE", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      }).format(new Date(record.fecha)),
      bcv: record.bcv,
      paralelo: record.paralelo,
      euro: record.euro || 0,
      diferencial: record.diferencial,
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error("Error fetching historical data:", error);
    return NextResponse.json(
      { error: "Error al obtener datos históricos" },
      { status: 500 }
    );
  }
}

// Endpoint POST para guardar nuevas tasas en el histórico
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { bcv, paralelo, euro } = body;

    if (!bcv || !paralelo) {
      return NextResponse.json(
        { error: "Faltan datos requeridos (bcv, paralelo)" },
        { status: 400 }
      );
    }

    // Obtener el último registro para calcular cambios
    const lastRecord = await prisma.rateHistory.findFirst({
      orderBy: {
        fecha: "desc",
      },
    });

    const bcvChange = lastRecord ? bcv - lastRecord.bcv : 0;
    const paraleloChange = lastRecord ? paralelo - lastRecord.paralelo : 0;
    const euroChange = lastRecord && euro ? euro - (lastRecord.euro || 0) : 0;

    // Calcular diferencial
    const diferencial = ((paralelo - bcv) / bcv) * 100;

    // Guardar en la base de datos
    const newRecord = await prisma.rateHistory.create({
      data: {
        bcv,
        paralelo,
        euro,
        bcvChange,
        paraleloChange,
        euroChange,
        diferencial,
        fuente: "API Automática",
      },
    });

    return NextResponse.json({
      success: true,
      data: newRecord,
    });
  } catch (error) {
    console.error("Error saving historical data:", error);
    return NextResponse.json(
      { error: "Error al guardar datos históricos" },
      { status: 500 }
    );
  }
}