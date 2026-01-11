// app/api/historical/route.ts
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = 'force-dynamic'; 

interface HistoricalRecord {
  id: string;
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

// =====================================================
// SISTEMA DE CACHÉ
// =====================================================
let cachedData: FormattedData[] | null = null;
let cacheTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos en milisegundos

function isCacheValid(): boolean {
  return cachedData !== null && (Date.now() - cacheTime) < CACHE_DURATION;
}

function updateCache(data: FormattedData[]): void {
  cachedData = data;
  cacheTime = Date.now();
  console.log('📦 Caché del historial actualizado');
}

function getCacheAge(): number {
  return Math.floor((Date.now() - cacheTime) / 1000); // En segundos
}

// =====================================================
// ENDPOINT GET - CON CACHÉ
// =====================================================
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");
    
    // 1. Verificar si hay caché válido
    if (isCacheValid()) {
      const age = getCacheAge();
      console.log(`📦 Usando caché del historial (edad: ${age}s)`);
      return NextResponse.json(cachedData, {
        headers: {
          'X-Cache': 'HIT',
          'X-Cache-Age': age.toString()
        }
      });
    }

    // 2. Si no hay caché válido, obtener datos frescos
    console.log('🔄 Caché expirado, obteniendo datos históricos frescos...');
    
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

    // 3. Formatear los datos para el gráfico
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

    // 4. Guardar en caché
    updateCache(formattedData);

    console.log(`✅ ${formattedData.length} registros históricos obtenidos y cacheados`);

    return NextResponse.json(formattedData, {
      headers: {
        'X-Cache': 'MISS',
        'X-Cache-Age': '0'
      }
    });
  } catch (error) {
    console.error("❌ Error fetching historical data:", error);
    
    // Si hay error pero tenemos caché, devolverlo aunque esté expirado
    if (cachedData) {
      console.log('⚠️ Error en consulta, usando caché antiguo como fallback');
      return NextResponse.json(cachedData, {
        headers: {
          'X-Cache': 'STALE',
          'X-Cache-Age': getCacheAge().toString()
        }
      });
    }
    
    return NextResponse.json(
      { error: "Error al obtener datos históricos" },
      { status: 500 }
    );
  }
}

// =====================================================
// ENDPOINT POST - GUARDA Y LIMPIA CACHÉ
// =====================================================
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

    // 🔥 IMPORTANTE: Invalidar caché después de crear nuevo registro
    cachedData = null;
    cacheTime = 0;
    console.log('🗑️ Caché del historial invalidado (nuevo registro creado)');

    return NextResponse.json({
      success: true,
      data: newRecord,
      message: 'Registro guardado y caché invalidado'
    });
  } catch (error) {
    console.error("❌ Error saving historical data:", error);
    return NextResponse.json(
      { error: "Error al guardar datos históricos" },
      { status: 500 }
    );
  }
}