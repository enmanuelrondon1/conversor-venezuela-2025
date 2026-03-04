// test-current-rates.js
const EXCHANGERATE_API_KEY = 'fe961c28fac21978f7abd47e';

async function testExchangeRateAPI() {
  console.log('🧪 PRUEBA 1: ExchangeRate-API (USD/VES)');
  console.log('='.repeat(60));
  
  try {
    const url = `https://v6.exchangerate-api.com/v6/${EXCHANGERATE_API_KEY}/latest/USD`;
    const response = await fetch(url);
    const data = await response.json();
    
    console.log('Estado:', response.status);
    console.log('USD/VES:', data.conversion_rates?.VES || 'No disponible');
    console.log('Última actualización:', new Date(data.time_last_update_unix * 1000).toLocaleString('es-VE'));
    console.log('Próxima actualización:', new Date(data.time_next_update_unix * 1000).toLocaleString('es-VE'));
    console.log('');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function testDolarAPI() {
  console.log('🧪 PRUEBA 2: DolarApi (Paralelo)');
  console.log('='.repeat(60));
  
  try {
    const response = await fetch('https://ve.dolarapi.com/v1/dolares');
    const data = await response.json();
    
    console.log('Estado:', response.status);
    console.log('Tasas disponibles:');
    data.forEach(rate => {
      console.log(`  - ${rate.nombre} (${rate.fuente}): ${rate.promedio} Bs`);
    });
    console.log('');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

async function runTests() {
  console.log('\n🚀 PRUEBAS DE TASAS');
  console.log('Fecha:', new Date().toLocaleString('es-VE'));
  console.log('');
  
  await testExchangeRateAPI();
  await testDolarAPI();
  
  console.log('✅ COMPLETADO');
}

runTests();