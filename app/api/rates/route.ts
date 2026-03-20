// app/api/rates/route.ts
// VERSIÓN MEJORADA: Combina scraper BCV + ExchangeRate-API + DolarApi

import { NextResponse } from 'next/server';
import { saveRateToHistory } from "@/lib/rate-history-service";
import { scrapeBCV } from "@/lib/bcv-scraper";

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
 * ESTRATEGIA 1: Intentar obtener del BCV directamente (scraping)
 */
async function fetchFromBCVScraper(): Promise<{ bcv: ExchangeRate | null, euro: ExchangeRate | null }> {
  try {
    console.log('🔍 Intentando scraper del BCV...');
    
    const bcvData = await scrapeBCV();
    
    if (!bcvData || !bcvData.usd) {
      console.log('⚠️ Scraper BCV no devolvió datos');
      return { bcv: null, euro: null };
    }
    
    const bcvRate: ExchangeRate = {
      fuente: 'oficial',
      nombre: 'Dólar BCV Oficial',
      compra: null,
      venta: null,
      promedio: bcvData.usd,
      fechaActualizacion: bcvData.date
    };
    
    const euroRate: ExchangeRate | null = bcvData.eur ? {
      fuente: 'euro',
      nombre: 'Euro',
      compra: null,
      venta: null,
      promedio: bcvData.eur,
      fechaActualizacion: bcvData.date
    } : null;
    
    console.log('✅ BCV Scraper exitoso - USD:', bcvData.usd.toFixed(2), 'Bs/$');
    if (bcvData.eur) {
      console.log('✅ EUR desde BCV:', bcvData.eur.toFixed(2), 'Bs/€');
    }
    
    return { bcv: bcvRate, euro: euroRate };
    
  } catch (error) {
    console.error('❌ Error en scraper BCV:', error);
    return { bcv: null, euro: null };
  }
}

/**
 * ESTRATEGIA 2: Fallback a ExchangeRate-API
 */
async function fetchFromExchangeRateAPI(): Promise<{ bcv: ExchangeRate | null, euro: ExchangeRate | null }> {
  try {
    console.log('🔍 Usando ExchangeRate-API como fallback...');
    
    // 1. Obtener USD/VES
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
    
    // 2. Obtener EUR/VES
    const eurUrl = `https://v6.exchangerate-api.com/v6/${EXCHANGERATE_API_KEY}/latest/EUR`;
    const eurResponse = await fetch(eurUrl, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10000)
    });
    
    let eurToVes = usdToVes * 1.17; // Valor por defecto
    
    if (eurResponse.ok) {
      const eurData = await eurResponse.json();
      const eurVesRate = eurData.conversion_rates?.VES;
      
      if (eurVesRate) {
        eurToVes = eurVesRate;
      }
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
 * Obtiene las tasas oficiales usando estrategia híbrida:
 * 1. Intenta scraper BCV primero (más actualizado)
 * 2. Si falla, usa ExchangeRate-API como fallback
 */
async function fetchOfficialRates(): Promise<{ bcv: ExchangeRate | null, euro: ExchangeRate | null }> {
  // Intentar scraper primero
  const scraperResult = await fetchFromBCVScraper();
  
  if (scraperResult.bcv) {
    console.log('✅ Usando datos del scraper BCV');
    return scraperResult;
  }
  
  // Fallback a ExchangeRate-API
  console.log('⚠️ Scraper BCV falló, usando ExchangeRate-API');
  return await fetchFromExchangeRateAPI();
}

/**
 * Obtiene TODAS las tasas desde DolarApi (oficial, paralelo, etc.)
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
    
    // Mostrar todas las tasas obtenidas
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
 * Obtiene todas las tasas con sistema de caché
 */
async function fetchAllRates(): Promise<ExchangeRate[]> {
  const now = Date.now();
  
  // Si el caché es válido, retornarlo
  if (cachedRates && (now - lastFetchTime) < CACHE_DURATION) {
    const cacheAge = Math.round((now - lastFetchTime) / 1000);
    console.log(`📦 Usando caché (edad: ${cacheAge}s / ${CACHE_DURATION/1000}s)`);
    return cachedRates;
  }
  
  console.log('🔄 Caché expirado, obteniendo datos frescos...');
  
  const rates: ExchangeRate[] = [];
  
  // 1. Obtener tasas desde DolarApi (oficial, paralelo, etc.)
  const dolarApiRates = await fetchFromDolarApi();
  rates.push(...dolarApiRates);
// 2. Obtener Euro desde ExchangeRate-API siempre
const hasEuro = rates.some(r => r.fuente === 'euro');

if (!hasEuro) {
  try {
    const oficialBs = rates.find(r => r.fuente === 'oficial')?.promedio;
    const eurUrl = `https://v6.exchangerate-api.com/v6/${EXCHANGERATE_API_KEY}/latest/EUR`;
    const eurResponse = await fetch(eurUrl, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10000)
    });

    if (eurResponse.ok) {
      const eurData = await eurResponse.json();
      const eurToVes = eurData.conversion_rates?.VES;

      if (eurToVes) {
        rates.push({
          fuente: 'euro',
          nombre: 'Euro',
          compra: null,
          venta: null,
          promedio: eurToVes,
          fechaActualizacion: new Date(eurData.time_last_update_unix * 1000).toISOString()
        });
        console.log('✅ EUR desde ExchangeRate-API:', eurToVes.toFixed(2), 'Bs/€');
      }
    }
  } catch (e) {
    console.warn('⚠️ No se pudo obtener EUR:', e);
  }
}
  
  // Validar que tengamos al menos el oficial
  if (rates.length === 0) {
    console.warn('⚠️ DolarApi falló, intentando ExchangeRate-API como fallback...');
    const { bcv, euro } = await fetchFromExchangeRateAPI();
    if (bcv) rates.push(bcv);
    if (euro) rates.push(euro);
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
  
  // Actualizar caché
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
    
    // Invalidar caché
    cachedRates = null;
    lastFetchTime = 0;
    
    // Obtener datos frescos
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