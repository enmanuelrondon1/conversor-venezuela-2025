// test-notifications.js
// Ejecuta: node test-notifications.js

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testNotifications() {
  try {
    console.log('🧪 Iniciando prueba de notificaciones...\n');

    // 1. Obtener el registro de AYER
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = await prisma.rateHistory.findFirst({
      where: {
        fecha: {
          lt: today
        }
      },
      orderBy: { fecha: 'desc' }
    });

    if (!yesterday) {
      console.error('❌ No hay registros históricos para probar');
      return;
    }

    console.log('📊 Registro actual de ayer:');
    console.log(`   BCV: ${yesterday.bcv}`);
    console.log(`   Paralelo: ${yesterday.paralelo}`);
    console.log(`   Euro: ${yesterday.euro}\n`);

    // 2. Guardar valores originales
    const originalValues = {
      bcv: yesterday.bcv,
      paralelo: yesterday.paralelo,
      euro: yesterday.euro
    };

    // 3. Modificar con valores que generen cambios >1%
    console.log('🔧 Modificando valores para simular cambios...\n');
    
    await prisma.rateHistory.update({
      where: { id: yesterday.id },
      data: {
        bcv: 320.00,      // -3% del actual
        paralelo: 600.00, // +10% del actual
        euro: 370.00      // -4% del actual
      }
    });

    console.log('✅ Valores modificados:');
    console.log('   BCV: 320.00 (para simular subida)');
    console.log('   Paralelo: 600.00 (para simular bajada)');
    console.log('   Euro: 370.00 (para simular subida)\n');

    // 4. Ejecutar el endpoint de notificaciones
    console.log('📤 Ejecutando endpoint de notificaciones...\n');
    
    const response = await fetch('http://localhost:3000/api/telegram');
    const result = await response.json();

    console.log('📋 Resultado:');
    console.log(JSON.stringify(result, null, 2));

    if (result.notified && result.significantChanges) {
      console.log('\n✅ PRUEBA EXITOSA!');
      console.log(`   Cambios detectados: ${result.significantChanges.join(', ')}`);
      console.log('   Revisa tu Telegram para ver las notificaciones\n');
    } else {
      console.log('\n⚠️ No se enviaron notificaciones');
      console.log('   Razón:', result.message);
    }

    // 5. Restaurar valores originales
    console.log('🔄 Restaurando valores originales...\n');
    
    await prisma.rateHistory.update({
      where: { id: yesterday.id },
      data: {
        bcv: originalValues.bcv,
        paralelo: originalValues.paralelo,
        euro: originalValues.euro
      }
    });

    console.log('✅ Valores restaurados correctamente\n');
    console.log('🎉 Prueba completada');

  } catch (error) {
    console.error('❌ Error en la prueba:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testNotifications();