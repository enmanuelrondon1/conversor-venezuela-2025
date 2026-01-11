// diagnostic-check.ts
// Ejecuta: npx ts-node diagnostic-check.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function diagnosticCheck() {
  console.log('🔍 DIAGNÓSTICO DEL SISTEMA\n');
  console.log('=' .repeat(50) + '\n');

  try {
    // 1. Verificar estructura de la base de datos
    console.log('📊 1. VERIFICANDO BASE DE DATOS...\n');
    
    const subscribers = await prisma.subscriber.findMany();
    console.log(`   Total de suscriptores: ${subscribers.length}`);
    console.log('   Detalles:');
    subscribers.forEach((sub, i) => {
      console.log(`   ${i + 1}. Chat ID: ${sub.chatId} - Activo: ${sub.activo}`);
    });

    const activeCount = subscribers.filter(s => s.activo).length;
    console.log(`\n   ✅ Suscriptores activos: ${activeCount}`);
    console.log(`   ⛔ Suscriptores inactivos: ${subscribers.length - activeCount}\n`);

    // 2. Verificar registros históricos
    console.log('📈 2. VERIFICANDO HISTORIAL DE TASAS...\n');
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const lastRecord = await prisma.rateHistory.findFirst({
      where: { fecha: { lt: today } },
      orderBy: { fecha: 'desc' }
    });

    if (lastRecord) {
      console.log('   Último registro (pre-hoy):');
      console.log(`   Fecha: ${lastRecord.fecha.toLocaleDateString()}`);
      console.log(`   BCV: ${lastRecord.bcv}`);
      console.log(`   Paralelo: ${lastRecord.paralelo}`);
      console.log(`   Euro: ${lastRecord.euro}\n`);
    } else {
      console.log('   ⚠️ No hay registros históricos\n');
    }

    // 3. Verificar variables de entorno
    console.log('🔐 3. VERIFICANDO CONFIGURACIÓN...\n');
    
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
    
    console.log(`   TELEGRAM_BOT_TOKEN: ${botToken ? '✅ Configurado' : '❌ NO configurado'}`);
    console.log(`   NEXT_PUBLIC_BASE_URL: ${baseUrl || '❌ NO configurado (usando localhost)'}\n`);

    // 4. Probar obtención de tasas
    console.log('💱 4. PROBANDO API DE TASAS...\n');
    
    try {
      const ratesResponse = await fetch(
        `${baseUrl || 'http://localhost:3000'}/api/rates`,
        { cache: 'no-store' }
      );
      
      if (ratesResponse.ok) {
        const rates = await ratesResponse.json();
        console.log('   ✅ API de tasas funciona correctamente');
        console.log('   Tasas actuales:');
        rates.forEach((rate: any) => {
          console.log(`   - ${rate.nombre}: ${rate.promedio} Bs`);
        });
      } else {
        console.log('   ❌ Error en API de tasas:', ratesResponse.status);
      }
    } catch (error) {
      console.log('   ❌ No se pudo conectar a la API de tasas');
      console.log('   Error:', error);
    }

    console.log('\n' + '=' .repeat(50));
    console.log('🎯 RESUMEN:\n');
    
    const issues: string[] = [];
    
    if (subscribers.length === 0) {
      issues.push('❌ No hay suscriptores en la base de datos');
    } else if (activeCount === 0) {
      issues.push('⚠️ Hay suscriptores pero ninguno está activo');
    }
    
    if (!lastRecord) {
      issues.push('❌ No hay registros históricos para comparar cambios');
    }
    
    if (!botToken) {
      issues.push('❌ Token de Telegram no configurado');
    }

    if (issues.length > 0) {
      console.log('   Problemas detectados:');
      issues.forEach(issue => console.log(`   ${issue}`));
    } else {
      console.log('   ✅ Sistema configurado correctamente');
    }

  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error);
  } finally {
    await prisma.$disconnect();
  }
}

diagnosticCheck();