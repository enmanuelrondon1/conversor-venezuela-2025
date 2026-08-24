// app/api/rates/route.ts
// VERSIÓN SIMPLIFICADA: DolarApi como fuente primaria (oficial + paralelo)
// y ExchangeRate-API solo como respaldo puntual del EUR.
//
// Nota: el scraper directo del BCV (lib/bcv-scraper.ts) queda disponible
// para debug/pruebas locales, pero no se usa en el flujo de producción
// porque bcv.org.ve parece bloquear los fetch desde IPs de datacenter
// (Vercel), devolviendo una página distinta a la real.

import { NextResponse } from 'next/server';
import { saveRateToHistory } from "@/lib/rate-history-service";

export const dynamic = 'force-dynamic'; 

// Tu API key
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
 * FUENTE PRIMARIA: DolarApi (oficial + paralelo). Gratis, sin key, sin límite de cuota.
 */
async function fetchFromDolarApi(): Promise<ExchangeRate[]> {
  try {
    console.log('🔍 Obteniendo tasas desde DolarApi...');
    
    const response = await fetch('https://ve.dolarapi.com/v1/dolares', {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000)
    });
    
    if (!response.ok) {
      console.warn('⚠️ DolarApi no disponible');
      return [];
    }
    
    const data: ExchangeRate[] = await response.json();
    
    console.log('✅ Tasas obtenidas de DolarApi:', data.length);
    data.forEach(rate => {
      console.log(`   - ${rate.nombre} (${rate.fuente}): ${rate.promedio} Bs`);
    });
    
    return data;
    
  } catch (error) {
    console.warn('⚠️ Error obteniendo tasas de DolarApi:', error);
    return [];
  }
}

/**
 * RESPALDO PUNTUAL: solo el EUR desde ExchangeRate-API.
 * Se usa únicamente cuando DolarApi no trajo el euro (que es siempre,
 * porque DolarApi no lo provee) — así que en la práctica esto SÍ se
 * llama en cada refresco de caché, pero solo pide 1 moneda en vez de 2.
 */
async function fetchEuroFromExchangeRateAPI(): Promise<ExchangeRate | null> {
  try {
    console.log('🔍 Buscando EUR en ExchangeRate-API...');
    const eurUrl = `https://v6.exchangerate-api.com/v6/${EXCHANGERATE_API_KEY}/latest/EUR`;
    const eurResponse = await fetch(eurUrl, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10000)
    });

    if (!eurResponse.ok) {
      console.warn('⚠️ ExchangeRate-API no devolvió EUR (posible cuota agotada)');
      return null;
    }

    const eurData = await eurResponse.json();
    const eurToVes = eurData.conversion_rates?.VES;

    if (!eurToVes) return null;

    console.log('✅ EUR desde ExchangeRate-API:', eurToVes.toFixed(2), 'Bs/€');

    return {
      fuente: 'euro',
      nombre: 'Euro',
      compra: null,
      venta: null,
      promedio: eurToVes,
      fechaActualizacion: new Date(eurData.time_last_update_unix * 1000).toISOString()
    };
  } catch (e) {
    console.warn('⚠️ No se pudo obtener EUR:', e);
    return null;
  }
}

/**
 * ÚLTIMO RECURSO: si DolarApi falla por completo (ni siquiera el USD oficial),
 * traemos USD + EUR juntos de ExchangeRate-API.
 */
async function fetchFromExchangeRateAPI(): Promise<{ bcv: ExchangeRate | null, euro: ExchangeRate | null }> {
  try {
    console.log('🔍 DolarApi falló por completo, usando ExchangeRate-API total...');
    
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
 * 1. DolarApi -> oficial + paralelo (gratis, sin límite de cuota)
 * 2. ExchangeRate-API -> solo el EUR (respaldo puntual)
 * 3. ExchangeRate-API total -> SOLO si DolarApi falló por completo
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
  
  // 1. Fuente primaria: DolarApi
  const dolarApiRates = await fetchFromDolarApi();
  rates.push(...dolarApiRates);
  
  // 2. Respaldo puntual del EUR
  const hasEuro = rates.some(r => r.fuente === 'euro');
  if (!hasEuro) {
    const euroBackup = await fetchEuroFromExchangeRateAPI();
    if (euroBackup) rates.push(euroBackup);
  }
  
  // 3. Último recurso: si DolarApi falló por completo
  if (rates.length === 0) {
    console.warn('⚠️ DolarApi falló, intentando ExchangeRate-API como fallback total...');
    const { bcv, euro } = await fetchFromExchangeRateAPI();
    if (bcv) rates.push(bcv);
    if (euro) rates.push(euro);
  }
  
  if (rates.length === 0) {
    throw new Error('No se pudieron obtener tasas de ninguna fuente');
  }
  
  // 4. Guardar en histórico automáticamente
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