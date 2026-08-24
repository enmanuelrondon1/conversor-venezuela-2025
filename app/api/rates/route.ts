// app/api/rates/route.ts
// VERSIÓN FINAL: DolarApi como única fuente primaria (dólares + euros),
// gratis y sin API key. ExchangeRate-API queda solo como último respaldo
// si DolarApi falla por completo.

import { NextResponse } from 'next/server';
import { saveRateToHistory } from "@/lib/rate-history-service";

export const dynamic = 'force-dynamic'; 

// Tu API key (solo se usa como último recurso)
const EXCHANGERATE_API_KEY = process.env.EXCHANGERATE_API_KEY || '';

interface ExchangeRate {
  fuente: string;
  nombre: string;
  compra: number | null;
  venta: number | null;
  promedio: number;
  fechaActualizacion: string;
}

// ===== CACHÉ EN MEMORIA =====
let cachedRates: ExchangeRate[] | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

/**
 * FUENTE PRIMARIA: DolarApi - dólares (oficial + paralelo)
 */
async function fetchDolaresFromDolarApi(): Promise<ExchangeRate[]> {
  try {
    console.log('🔍 Obteniendo dólares desde DolarApi...');
    
    const response = await fetch('https://ve.dolarapi.com/v1/dolares', {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000)
    });
    
    if (!response.ok) {
      console.warn('⚠️ DolarApi (dólares) no disponible');
      return [];
    }
    
    const data: ExchangeRate[] = await response.json();
    console.log('✅ Dólares obtenidos de DolarApi:', data.length);
    data.forEach(rate => {
      console.log(`   - ${rate.nombre} (${rate.fuente}): ${rate.promedio} Bs`);
    });
    
    return data;
    
  } catch (error) {
    console.warn('⚠️ Error obteniendo dólares de DolarApi:', error);
    return [];
  }
}

/**
 * FUENTE PRIMARIA: DolarApi - euros (oficial + paralelo)
 * Usamos el "oficial" como nuestra tasa 'euro' principal, igual que
 * hacíamos con el BCV directo.
 */
async function fetchEuroFromDolarApi(): Promise<ExchangeRate | null> {
  try {
    console.log('🔍 Obteniendo euro desde DolarApi...');
    
    const response = await fetch('https://ve.dolarapi.com/v1/euros', {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000)
    });
    
    if (!response.ok) {
      console.warn('⚠️ DolarApi (euros) no disponible');
      return null;
    }
    
    const data: Array<{ moneda: string; fuente: string; promedio: number; fechaActualizacion: string }> = await response.json();
    
    const oficial = data.find(r => r.fuente === 'oficial');
    
    if (!oficial || !oficial.promedio) {
      console.warn('⚠️ DolarApi no devolvió euro oficial');
      return null;
    }
    
    console.log('✅ Euro oficial obtenido de DolarApi:', oficial.promedio.toFixed(2), 'Bs/€');
    
    return {
      fuente: 'euro',
      nombre: 'Euro',
      compra: null,
      venta: null,
      promedio: oficial.promedio,
      fechaActualizacion: oficial.fechaActualizacion
    };
    
  } catch (error) {
    console.warn('⚠️ Error obteniendo euro de DolarApi:', error);
    return null;
  }
}

/**
 * ÚLTIMO RECURSO: si DolarApi falla por completo (ni dólares ni euros),
 * usamos ExchangeRate-API para USD + EUR.
 */
async function fetchFromExchangeRateAPI(): Promise<{ bcv: ExchangeRate | null, euro: ExchangeRate | null }> {
  try {
    console.log('🔍 DolarApi falló, usando ExchangeRate-API como último respaldo...');
    
    const usdUrl = `https://v6.exchangerate-api.com/v6/${EXCHANGERATE_API_KEY}/latest/USD`;
    const usdResponse = await fetch(usdUrl, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10000)
    });
    
    if (!usdResponse.ok) {
      console.error('❌ Error obteniendo USD/VES de ExchangeRate-API');
      return { bcv: null, euro: null };
    }
    
    const usdData = await usdResponse.json();
    const usdToVes = usdData.conversion_rates?.VES;
    
    if (!usdToVes) {
      console.error('❌ No se encontró VES en respuesta USD');
      return { bcv: null, euro: null };
    }
    
    const eurUrl = `https://v6.exchangerate-api.com/v6/${EXCHANGERATE_API_KEY}/latest/EUR`;
    const eurResponse = await fetch(eurUrl, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10000)
    });
    
    let eurToVes = usdToVes * 1.17; // Valor por defecto
    
    if (eurResponse.ok) {
      const eurData = await eurResponse.json();
      const eurVesRate = eurData.conversion_rates?.VES;
      if (eurVesRate) eurToVes = eurVesRate;
    }
    
    const lastUpdate = new Date(usdData.time_last_update_unix * 1000).toISOString();
    
    const bcvRate: ExchangeRate = {
      fuente: 'oficial',
      nombre: 'Dólar BCV Oficial',
      compra: null,
      venta: null,
      promedio: usdToVes,
      fechaActualizacion: lastUpdate
    };
    
    const euroRate: ExchangeRate = {
      fuente: 'euro',
      nombre: 'Euro',
      compra: null,
      venta: null,
      promedio: eurToVes,
      fechaActualizacion: lastUpdate
    };
    
    console.log('✅ ExchangeRate-API - USD:', usdToVes.toFixed(2), 'Bs/$');
    console.log('✅ ExchangeRate-API - EUR:', eurToVes.toFixed(2), 'Bs/€');
    
    return { bcv: bcvRate, euro: euroRate };
    
  } catch (error) {
    console.error('❌ Error en ExchangeRate-API:', error);
    return { bcv: null, euro: null };
  }
}

/**
 * Obtiene todas las tasas con sistema de caché.
 *
 * Orden de prioridad:
 * 1. DolarApi -> oficial + paralelo (dólares) + euro oficial. Todo gratis, sin key.
 * 2. ExchangeRate-API -> SOLO si DolarApi falló por completo (ni USD ni EUR)
 */
async function fetchAllRates(): Promise<ExchangeRate[]> {
  const now = Date.now();
  
  if (cachedRates && (now - lastFetchTime) < CACHE_DURATION) {
    const cacheAge = Math.round((now - lastFetchTime) / 1000);
    console.log(`📦 Usando caché (edad: ${cacheAge}s / ${CACHE_DURATION/1000}s)`);
    return cachedRates;
  }
  
  console.log('🔄 Caché expirado, obteniendo datos frescos...');
  
  const rates: ExchangeRate[] = [];
  
  // 1. Dólares (oficial + paralelo) y euro, ambos desde DolarApi, en paralelo
  const [dolaresRates, euroRate] = await Promise.all([
    fetchDolaresFromDolarApi(),
    fetchEuroFromDolarApi()
  ]);
  
  rates.push(...dolaresRates);
  if (euroRate) rates.push(euroRate);
  
  // 2. Último recurso: si no logramos nada de DolarApi, caemos a ExchangeRate-API
  const hasOficial = rates.some(r => r.fuente === 'oficial');
  const hasEuro = rates.some(r => r.fuente === 'euro');
  
  if (!hasOficial || !hasEuro) {
    console.warn('⚠️ DolarApi incompleto, completando con ExchangeRate-API...');
    const { bcv, euro } = await fetchFromExchangeRateAPI();
    if (!hasOficial && bcv) rates.push(bcv);
    if (!hasEuro && euro) rates.push(euro);
  }
  
  if (rates.length === 0) {
    throw new Error('No se pudieron obtener tasas de ninguna fuente');
  }
  
  // 3. Guardar en histórico automáticamente
  const oficialRate = rates.find(r => r.fuente === 'oficial');
  const paraleloRate = rates.find(r => r.fuente === 'paralelo');
  const euroRateData = rates.find(r => r.fuente === 'euro');
  
  if (oficialRate && paraleloRate && euroRateData) {
    try {
      await saveRateToHistory({
        bcv: oficialRate.promedio,
        paralelo: paraleloRate.promedio,
        euro: euroRateData.promedio,
      });
      console.log('✅ Tasas guardadas en histórico');
    } catch (error) {
      console.error('⚠️ Error guardando en histórico:', error);
    }
  }
  
  cachedRates = rates;
  lastFetchTime = now;
  
  console.log('💾 Caché actualizado con', rates.length, 'tasas');
  console.log('💵 Dólar BCV:', rates.find(r => r.fuente === 'oficial')?.promedio.toFixed(2) || 'N/A', 'Bs/$');
  console.log('💶 Euro:', rates.find(r => r.fuente === 'euro')?.promedio.toFixed(2) || 'N/A', 'Bs/€');
  console.log('💸 Paralelo:', rates.find(r => r.fuente === 'paralelo')?.promedio.toFixed(2) || 'N/A', 'Bs/$');
  
  return rates;
}

/**
 * Endpoint GET /api/rates
 */
export async function GET() {
  try {
    const rates = await fetchAllRates();
    
    return NextResponse.json(rates, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      }
    });
    
  } catch (error) {
    console.error('❌ Error en /api/rates:', error);
    
    return NextResponse.json(
      { 
        error: 'Error al obtener las tasas',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}

/**
 * Endpoint POST /api/rates - Forzar actualización del caché
 */
export async function POST() {
  try {
    console.log('🔄 Forzando actualización del caché...');
    
    cachedRates = null;
    lastFetchTime = 0;
    
    const rates = await fetchAllRates();
    
    return NextResponse.json({ 
      success: true,
      message: 'Caché actualizado exitosamente',
      rates 
    });
    
  } catch (error) {
    console.error('❌ Error forzando actualización:', error);
    
    return NextResponse.json(
      { 
        error: 'Error al actualizar el caché',
        message: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}