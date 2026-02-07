// check-subscription-flow.ts
import prisma from './lib/prisma';

async function diagnosticCheck() {
  console.log('\n🔍 DIAGNÓSTICO DE SUSCRIPCIONES\n');
  console.log('='.repeat(50));
  
  // 1. Estadísticas generales
  const stats = await prisma.subscriber.count();
  const active = await prisma.subscriber.count({ where: { activo: true }});
  const inactive = stats - active;
  
  console.log('\n📊 ESTADÍSTICAS:');
  console.log(`   Total:    ${stats}`);
  console.log(`   Activos:  ${active}`);
  console.log(`   Inactivos: ${inactive}`);
  
  // 2. Últimos 10 suscriptores
  const recent = await prisma.subscriber.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10
  });
  
  console.log('\n📋 ÚLTIMOS 10 SUSCRIPTORES:');
  recent.forEach((sub, i) => {
    const status = sub.activo ? '✅' : '❌';
    console.log(`   ${i+1}. ${status} ${sub.chatId} - ${sub.nombre || 'Sin nombre'}`);
    console.log(`      Creado: ${sub.createdAt.toLocaleString()}`);
  });
  
  // 3. Verificar duplicados
  const duplicates = await prisma.subscriber.groupBy({
    by: ['chatId'],
    _count: { chatId: true },
    having: { chatId: { _count: { gt: 1 }}}
  });
  
  if (duplicates.length > 0) {
    console.log('\n⚠️  DUPLICADOS ENCONTRADOS:');
    duplicates.forEach(dup => {
      console.log(`   ChatID ${dup.chatId}: ${dup._count.chatId} veces`);
    });
  } else {
    console.log('\n✅ No hay duplicados');
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
}

diagnosticCheck()
  .then(() => process.exit(0))
  .catch(console.error);
