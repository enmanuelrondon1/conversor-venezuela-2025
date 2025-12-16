// app/api/rates/route.ts
// SOLUCIÓN DEFINITIVA CON EXCHANGERATE-API

import { NextResponse } from 'next/server';

// ¡IMPORTANTE! Reemplaza esto con tu API key real
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
 * Obtiene la tasa oficial del BCV desde ExchangeRate-API
 * ¡Esta API tiene el valor correcto y actualizado!
 */
async function fetchBCVOfficial(): Promise<ExchangeRate | null> {
  try {
    console.log('🔍 Obteniendo tasa oficial del BCV desde ExchangeRate-API...');
    
    const url = `https://v6.exchangerate-api.com/v6/${EXCHANGERATE_API_KEY}/latest/USD`;
    
    const response = await fetch(url, {
      cache: 'no-store',
      signal: AbortSignal.timeout(10000)
    });
    
    if (!response.ok) {
      console.error('❌ ExchangeRate-API response not OK:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (data.result !== 'success') {
      console.error('❌ ExchangeRate-API error:', data);
      return null;
    }
    
    const vesRate = data.conversion_rates?.VES;
    
    if (!vesRate) {
      console.error('❌ No se encontró VES en la respuesta');
      return null;
    }
    
    // Convertir el timestamp de la API a fecha legible
    const lastUpdate = new Date(data.time_last_update_unix * 1000).toISOString();
    
    const rate: ExchangeRate = {
      fuente: 'oficial',
      nombre: 'Dólar BCV Oficial',
      compra: null,
      venta: null,
      promedio: vesRate,
      fechaActualizacion: lastUpdate
    };
    
    console.log('✅ Tasa BCV oficial obtenida:', vesRate, 'Bs/$');
    console.log('📅 Última actualización:', new Date(lastUpdate).toLocaleString('es-VE'));
    
    return rate;
    
  } catch (error) {
    console.error('❌ Error obteniendo tasa oficial:', error);
    return null;
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
  
  // 1. Obtener tasa oficial del BCV (ExchangeRate-API)
  const bcvOfficial = await fetchBCVOfficial();
  if (bcvOfficial) {
    rates.push(bcvOfficial);
  }
  
  // 2. Obtener tasas del paralelo (DolarApi)
  const paraleloRates = await fetchParaleloRates();
  rates.push(...paraleloRates);
  
  // Validar que tengamos al menos el oficial
  if (rates.length === 0) {
    throw new Error('No se pudieron obtener tasas de ninguna fuente');
  }
  
  // Actualizar caché
  cachedRates = rates;
  lastFetchTime = now;
  
  console.log('💾 Caché actualizado con', rates.length, 'tasas');
  console.log('💵 Dólar BCV Oficial:', rates.find(r => r.fuente === 'oficial')?.promedio || 'N/A', 'Bs/$');
  console.log('💸 Dólar Paralelo:', rates.find(r => r.fuente === 'paralelo')?.promedio || 'N/A', 'Bs/$');
  
  return rates;
}

/**
 * Endpoint GET /api/rates
 * Retorna todas las tasas con sistema de caché
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
 * Endpoint POST /api/rates
 * Permite forzar actualización del caché
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