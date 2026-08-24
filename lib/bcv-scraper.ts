// lib/bcv-scraper.ts

import { Agent } from 'undici';
import { BCV_CA_BUNDLE } from './bcv-ca-bundle';

export interface BCVRate {
  usd: number;
  eur: number | null;
  date: string; 
  source: 'bcv';
}

// Agent de undici que confía en el certificado intermedio correcto del BCV.
// El servidor de bcv.org.ve manda un intermedio desactualizado (bug de ellos,
// tras la migración de Sectigo de junio 2025), así que la verificación TLS
// estándar de Node lo rechaza. Este agente confía SOLO en la cadena real
// del BCV, sin desactivar la verificación SSL global de la app.
const bcvAgent = new Agent({
  connect: {
    ca: BCV_CA_BUNDLE,
  },
});

/**
 * Hace scraping directo de la página del BCV
 * Extrae la tasa USD y la fecha de actualización
 */
export async function scrapeBCV(): Promise<BCVRate | null> {
  try {
    console.log('🔍 Iniciando scraping del BCV...');
    
    // Intentar múltiples estrategias
    let html: string | null = null;
    
    // Estrategia 1: Fetch directo con configuración robusta
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const response = await fetch('https://www.bcv.org.ve/', {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'es-VE,es;q=0.9,en;q=0.8',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1',
        },
        signal: controller.signal,
        // @ts-ignore - Next.js specific
        cache: 'no-store',
        // @ts-ignore - undici specific, confía en el cert real del BCV
        dispatcher: bcvAgent,
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        html = await response.text();
        console.log('✅ HTML obtenido, tamaño:', html.length, 'caracteres');
      } else {
        console.warn('⚠️ BCV response status:', response.status);
      }
    } catch (fetchError) {
      console.warn('⚠️ Estrategia 1 falló:', fetchError instanceof Error ? fetchError.message : 'Error desconocido');
    }
    
    // Estrategia 2: Intentar con http:// si https:// falla
    if (!html) {
      try {
        console.log('🔄 Intentando con HTTP...');
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        const response = await fetch('http://www.bcv.org.ve/', {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
          signal: controller.signal,
          // @ts-ignore
          cache: 'no-store',
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          html = await response.text();
          console.log('✅ HTML obtenido via HTTP');
        }
      } catch (httpError) {
        console.warn('⚠️ Estrategia 2 (HTTP) falló:', httpError instanceof Error ? httpError.message : 'Error desconocido');
      }
    }
    
    if (!html) {
      console.error('❌ No se pudo obtener el HTML del BCV');
      return null;
    }

    // Parsear el HTML
    // Buscar patrones más flexibles
    
    // Patrón 1: USD seguido de números (más común)
    let usdMatch = html.match(/USD[^\d]*(\d+[,.]?\d+)/i);
    
    // Patrón 2: Buscar en estructura de tabla
    if (!usdMatch) {
      usdMatch = html.match(/<strong[^>]*>USD<\/strong>[^<]*<strong[^>]*>([0-9,.]+)<\/strong>/i);
    }
    
    // Patrón 3: Buscar cualquier número después de "USD"
    if (!usdMatch) {
      usdMatch = html.match(/USD.*?([0-9]{2,3}[,.][0-9]{2,})/i);
    }
    
    // Extraer EUR (opcional)
    let eurMatch = html.match(/EUR[^\d]*(\d+[,.]?\d+)/i);
    if (!eurMatch) {
      eurMatch = html.match(/EUR.*?([0-9]{2,3}[,.][0-9]{2,})/i);
    }
    
    // Extraer fecha
    const dateMatch = html.match(/Fecha Valor:\s*([^<\n]+)/i);
    
    if (!usdMatch || !usdMatch[1]) {
      console.error('❌ No se pudo extraer USD del HTML');
      // Log de una muestra del HTML para debugging
      const sample = html.substring(0, 1000);
      console.log('📄 Muestra del HTML:', sample);
      return null;
    }

    // Convertir "273,58610000" a 273.58610000
    const usdString = usdMatch[1].replace(',', '.');
    const usd = parseFloat(usdString);
    
    const eurString = eurMatch ? eurMatch[1].replace(',', '.') : null;
    const eur = eurString ? parseFloat(eurString) : null;
    
    const date = dateMatch ? dateMatch[1].trim() : new Date().toISOString();
    
    // Validar que la tasa sea razonable
    if (isNaN(usd) || usd < 1 || usd > 10000) {
      console.error('❌ Tasa USD fuera de rango razonable:', usd);
      return null;
    }
    
    console.log('✅ BCV scraped successfully:', { usd, eur, date });
    
    return {
      usd,
      eur,
      date,
      source: 'bcv'
    };
    
  } catch (error) {
    if (error instanceof Error) {
      console.error('❌ Error scraping BCV:', error.message);
      console.error('Stack:', error.stack);
    } else {
      console.error('❌ Error desconocido scraping BCV:', error);
    }
    return null;
  }
}

/**
 * Valida que la tasa del BCV sea razonable
 * Previene errores de parsing
 */
export function isValidBCVRate(rate: number): boolean {
  // La tasa debe estar entre 1 y 10000 Bs/$
  return !isNaN(rate) && rate >= 1 && rate <= 10000;
}