// app/api/debug-rates/route.ts
// Endpoint temporal para debugging

import { NextResponse } from 'next/server';
import { scrapeBCV } from '@/lib/bcv-scraper';

export const dynamic = 'force-dynamic'; 


export async function GET() {
  const debug: any = {
    timestamp: new Date().toISOString(),
    tests: {}
  };

  // Test 1: Scraping del BCV
  try {
    console.log('🧪 Test 1: Intentando scrapear BCV...');
    const bcvData = await scrapeBCV();
    debug.tests.bcvScraping = {
      success: !!bcvData,
      data: bcvData,
      error: null
    };
    console.log('✅ BCV scraping result:', bcvData);
  } catch (error) {
    debug.tests.bcvScraping = {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
    console.error('❌ BCV scraping error:', error);
  }

  // Test 2: DolarApi
  try {
    console.log('🧪 Test 2: Intentando fetch a DolarApi...');
    const response = await fetch('https://ve.dolarapi.com/v1/dolares', {
      cache: 'no-store'
    });
    const data = await response.json();
    debug.tests.dolarApi = {
      success: response.ok,
      data: data,
      error: null
    };
    console.log('✅ DolarApi result:', data);
  } catch (error) {
    debug.tests.dolarApi = {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
    console.error('❌ DolarApi error:', error);
  }

  // Test 3: Verificar que /api/rates existe
  try {
    console.log('🧪 Test 3: Verificando endpoint /api/rates...');
    const response = await fetch('http://localhost:3000/api/rates', {
      cache: 'no-store'
    });
    const data = await response.json();
    debug.tests.ratesEndpoint = {
      success: response.ok,
      data: data,
      error: null
    };
    console.log('✅ /api/rates result:', data);
  } catch (error) {
    debug.tests.ratesEndpoint = {
      success: false,
      data: null,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
    console.error('❌ /api/rates error:', error);
  }

  return NextResponse.json(debug, {
    headers: {
      'Cache-Control': 'no-store, must-revalidate',
    }
  });
}