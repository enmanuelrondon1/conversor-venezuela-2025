// test-subscription.js
// Ejecuta: node test-subscription.js

async function testSubscription() {
  console.log('🧪 PRUEBA DE SUSCRIPCIÓN\n');
  console.log('=' .repeat(50) + '\n');

  // Cambiar este chatId por uno de prueba
  const testChatId = '6954027211'; //  ⚠️ Reemplaza con un Chat ID real de prueba
  const testUsername = 'usuario_prueba';

  try {
    console.log('1️⃣ Intentando suscribir nuevo usuario...\n');
    console.log(`   Chat ID: ${testChatId}`);
    console.log(`   Username: ${testUsername}\n`);

    const response = await fetch('http://localhost:3000/api/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chatId: testChatId,
        username: testUsername
      })
    });

    console.log(`📊 Status: ${response.status} ${response.statusText}\n`);

    const data = await response.json();
    
    console.log('📋 Respuesta del servidor:');
    console.log(JSON.stringify(data, null, 2));
    console.log('\n');

    if (response.ok) {
      console.log('✅ SUSCRIPCIÓN EXITOSA\n');
      
      // Verificar en la base de datos
      console.log('2️⃣ Verificando en la base de datos...\n');
      
      const checkResponse = await fetch('http://localhost:3000/api/subscribe/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chatId: testChatId })
      });

      const checkData = await checkResponse.json();
      console.log('Estado en la BD:', checkData);
      
    } else {
      console.log('❌ ERROR EN LA SUSCRIPCIÓN\n');
      console.log('Detalles del error:');
      console.log(`   Mensaje: ${data.error || data.message || 'Error desconocido'}`);
      
      // Si el error es que ya existe, intentar verificar
      if (data.error && data.error.includes('ya está suscrito')) {
        console.log('\n⚠️ El usuario ya está suscrito. Verificando estado...\n');
        
        const checkResponse = await fetch('http://localhost:3000/api/subscribe/check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ chatId: testChatId })
        });

        const checkData = await checkResponse.json();
        console.log('Estado actual:', checkData);
      }
    }

    console.log('\n' + '=' .repeat(50));
    console.log('✅ Prueba completada\n');

  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
    console.error('\nDetalles:', error.message);
    
    if (error.cause) {
      console.error('Causa:', error.cause);
    }
  }
}

// Ejecutar prueba
testSubscription();