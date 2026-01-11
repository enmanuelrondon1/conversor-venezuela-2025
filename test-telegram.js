// test-telegram.js
// Ejecuta: node test-telegram.js

const TELEGRAM_BOT_TOKEN = "8473925376:AAHZtIHs2bozd6w5qU6_AlGW3mYMexSYyEc"; // ⚠️ Reemplaza con tu token real
const CHAT_ID = "1962172372"; // ⚠️ Reemplaza con tu chat ID

const testMessage = `
🧪 *PRUEBA DE BOT*

Este es un mensaje de prueba.
Si lo recibes, el bot funciona correctamente.

✅ Conexión exitosa
⏰ ${new Date().toLocaleString('es-VE')}
`;

async function testTelegram() {
  try {
    console.log('📤 Enviando mensaje de prueba...');
    
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: testMessage,
          parse_mode: 'Markdown'
        })
      }
    );
    
    const data = await response.json();
    
    if (data.ok) {
      console.log('✅ Mensaje enviado exitosamente!');
      console.log('Respuesta:', JSON.stringify(data, null, 2));
    } else {
      console.error('❌ Error al enviar mensaje:');
      console.error(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ Error de conexión:', error);
  }
}

testTelegram();