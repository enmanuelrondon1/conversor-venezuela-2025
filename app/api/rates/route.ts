// app/api/rates/route.ts
// SOLUCIÓN DEFINITIVA CON EXCHANGERATE-API

import { NextResponse } from 'next/server';
import { saveRateToHistory } from "@/lib/rate-history-service";

export const dynamic = 'force-dynamic'; 

// Tu API key
const EXCHANGERATE_API_KEY = 'fe961c28fac21978f7abd47e';

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
 * Obtiene la tasa oficial del BCV y del Euro desde ExchangeRate-API
 */
async function fetchOfficialRates(): Promise<{ bcv: ExchangeRate | null, euro: ExchangeRate | null }> {
  try {
    console.log('🔍 Obteniendo tasas oficiales desde ExchangeRate-API...');
    
    // 1. Obtener USD/VES (Dólar BCV)
    const usdUrl = `https://v6.exchangerate-api.com/v6/${EXCHANGERATE_API_KEY}/latest/USD`;
    const usdResponse = await fetch(usdUrl, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10000)
    });
    
    if (!usdResponse.ok) {
      console.error('❌ Error obteniendo USD/VES');
      return { bcv: null, euro: null };
    }
    
    const usdData = await usdResponse.json();
    const usdToVes = usdData.conversion_rates?.VES;
    
    if (!usdToVes) {
      console.error('❌ No se encontró VES en USD');
      return { bcv: null, euro: null };
    }
    
    // 2. Obtener EUR/VES (Euro) - Hacer llamada con base EUR
    const eurUrl = `https://v6.exchangerate-api.com/v6/${EXCHANGERATE_API_KEY}/latest/EUR`;
    const eurResponse = await fetch(eurUrl, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10000)
    });
    
    let eurToVes = usdToVes * 1.17; // Valor por defecto si falla
    
    if (eurResponse.ok) {
      const eurData = await eurResponse.json();
      const eurVesRate = eurData.conversion_rates?.VES;
      
      if (eurVesRate) {
        eurToVes = eurVesRate;
        console.log('✅ EUR/VES obtenido directamente:', eurToVes);
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
    
    console.log('✅ USD/VES (BCV):', usdToVes.toFixed(2), 'Bs/$');
    console.log('✅ EUR/VES:', eurToVes.toFixed(2), 'Bs/€');
    
    return { bcv: bcvRate, euro: euroRate };
    
  } catch (error) {
    console.error('❌ Error obteniendo tasas oficiales:', error);
    return { bcv: null, euro: null };
  }
}

/**
 * Obtiene las tasas del mercado paralelo desde DolarApi
 */
async function fetchParaleloRates(): Promise<ExchangeRate[]> {
  try {
    console.log('🔍 Obteniendo tasas del paralelo desde DolarApi...');
    
    const response = await fetch('https://ve.dolarapi.com/v1/dolares', {
      cache: 'no-store',
      signal: AbortSignal.timeout(5000)
    });
    
    if (!response.ok) {
      console.warn('⚠️ DolarApi no disponible');
      return [];
    }
    
    const data: ExchangeRate[] = await response.json();
    
    // Solo tomar el paralelo y otras tasas que NO sean oficial
    const nonOfficialRates = data.filter(r => r.fuente !== 'oficial');
    
    console.log('✅ Tasas del paralelo obtenidas:', nonOfficialRates.length);
    
    return nonOfficialRates;
    
  } catch (error) {
    console.warn('⚠️ Error obteniendo tasas del paralelo:', error);
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
    console.log('📦 Usando caché (edad:', Math.round((now - lastFetchTime) / 1000), 'segundos)');
    return cachedRates;
  }
  
  console.log('🔄 Caché expirado, obteniendo datos frescos...');
  
  const rates: ExchangeRate[] = [];
  
  // 1. Obtener tasas oficiales (BCV y Euro)
  const { bcv, euro } = await fetchOfficialRates();
  if (bcv) rates.push(bcv);
  if (euro) rates.push(euro);
  
  // 2. Obtener tasas del paralelo
  const paraleloRates = await fetchParaleloRates();
  rates.push(...paraleloRates);
  
  // Validar que tengamos al menos el oficial
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