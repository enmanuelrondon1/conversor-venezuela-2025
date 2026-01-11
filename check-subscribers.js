const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSubscribers() {
  console.log('🔍 Verificando suscriptores en PostgreSQL...\n');
  
  const subscribers = await prisma.subscriber.findMany({
    orderBy: { createdAt: 'desc' }
  });
  
  console.log(`Total de suscriptores: ${subscribers.length}\n`);
  
  subscribers.forEach((sub, index) => {
    console.log(`${index + 1}. Chat ID: ${sub.chatId}`);
    console.log(`   Nombre: ${sub.nombre || 'Sin nombre'}`);
    console.log(`   Activo: ${sub.activo ? '✅' : '❌'}`);
    console.log(`   Creado: ${sub.createdAt}`);
    console.log('');
  });
  
  const activos = subscribers.filter(s => s.activo);
  console.log(`Suscriptores activos: ${activos.length}`);
  console.log('IDs activos:', activos.map(s => s.chatId));
}

checkSubscribers()
  .then(() => process.exit(0))
  .catch(console.error);
