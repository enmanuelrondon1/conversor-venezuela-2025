// app/api/subscribe/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic'; 

// ⚠️ CONFIGURACIÓN: Tu Chat ID de administrador
const ADMIN_CHAT_ID = '1962172372'; // Cambia esto si quieres

export async function POST(request: Request) {
  try {
    const { chatId, username } = await request.json();
    
    if (!chatId) {
      return NextResponse.json(
        { error: 'Chat ID requerido' },
        { status: 400 }
      );
    }

    // 1. Verificar si ya existe
    const existing = await prisma.subscriber.findUnique({
      where: { chatId: chatId.toString() }
    });

    if (existing) {
      // Si existe pero está inactivo, reactivarlo
      if (!existing.activo) {
        await prisma.subscriber.update({
          where: { chatId: chatId.toString() },
          data: { 
            activo: true,
            nombre: username || existing.nombre,
            updatedAt: new Date()
          }
        });
        
        const reactivateMessage = `
🎉 *¡Bienvenido de vuelta!*

Tu suscripción ha sido reactivada exitosamente.

📊 Recibirás:
- 🔔 Alertas cuando el dólar cambie ±1%
- 💶 Notificaciones del Euro
- 🌅 Resumen diario a las 8:00 AM

💵 Tasas actuales disponibles en:
https://conversor-venezuela-2025.vercel.app

¡Gracias por volver! 🇻🇪
        `.trim();
        
        await sendTelegramMessage(chatId, reactivateMessage);

        // Notificar al admin de reactivación
        await notifyAdmin('reactivate', chatId, username);
        
        return NextResponse.json({
          success: true,
          message: 'Suscripción reactivada',
          chatId
        });
      }
      
      // Si ya está activo
      return NextResponse.json(
        { error: 'Este Chat ID ya está suscrito y activo' },
        { status: 400 }
      );
    }

    // 2. Crear nuevo suscriptor en la base de datos
    const subscriber = await prisma.subscriber.create({
      data: {
        chatId: chatId.toString(),
        nombre: username || null,
        activo: true
      }
    });

    console.log('✅ Nuevo suscriptor guardado:', subscriber);

    // 3. Enviar mensaje de bienvenida
    const welcomeMessage = `
🎉 *¡Bienvenido a Monitor de Divisas Venezuela!*

Te has suscrito exitosamente a las notificaciones de tasas de cambio.

📊 Recibirás:
- 🔔 Alertas cuando el dólar cambie ±1%
- 💶 Notificaciones de cambios en el Euro
- 🌅 Resumen diario a las 8:00 AM
- 📈 Comparación oficial vs paralelo

💵 Tasas actuales disponibles en:
https://conversor-venezuela-2025.vercel.app

¡Gracias por suscribirte! 🇻🇪
    `.trim();

    const sent = await sendTelegramMessage(chatId, welcomeMessage);

    // 4. Notificar al admin de nueva suscripción
    await notifyAdmin('new', chatId, username);

    // ✅ CAMBIO PRINCIPAL: Guardar usuario aunque Telegram falle
    if (!sent) {
      return NextResponse.json(
        { 
          success: true,
          warning: 'Usuario guardado exitosamente, pero no se pudo enviar el mensaje de bienvenida. Verifica que hayas iniciado conversación con el bot primero: https://t.me/ConversorVenezuelaAlerts_bot',
          chatId,
          username
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Suscripción exitosa',
      chatId,
      username
    });

  } catch (error) {
    console.error('❌ Error en suscripción:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}

// Función auxiliar para enviar mensajes
async function sendTelegramMessage(chatId: string, message: string): Promise<boolean> {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('❌ TELEGRAM_BOT_TOKEN no configurado');
    return false;
  }

  try {
    const response = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: 'Markdown'
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Error de Telegram:', data);
      return false;
    }

    console.log('✅ Mensaje de bienvenida enviado');
    return true;
  } catch (error) {
    console.error('❌ Error al enviar mensaje:', error);
    return false;
  }
}

// Función para notificar al administrador
async function notifyAdmin(type: 'new' | 'reactivate', chatId: string, username?: string) {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!TELEGRAM_BOT_TOKEN || !ADMIN_CHAT_ID) {
    console.log('⚠️ Admin notifications disabled (no admin chat ID configured)');
    return;
  }

  const now = new Date();
  const venezuelaTime = new Date(
    now.toLocaleString("en-US", { timeZone: "America/Caracas" })
  );

  let adminMessage = '';

  if (type === 'new') {
    adminMessage = `
🆕 *Nueva Suscripción*

👤 *Usuario:* ${username ? `@${username}` : 'Sin username'}
🆔 *Chat ID:* \`${chatId}\`
📅 *Fecha:* ${venezuelaTime.toLocaleString('es-VE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}

✅ El usuario ha sido agregado exitosamente
    `.trim();
  } else {
    adminMessage = `
🔄 *Suscripción Reactivada*

👤 *Usuario:* ${username ? `@${username}` : 'Sin username'}
🆔 *Chat ID:* \`${chatId}\`
📅 *Fecha:* ${venezuelaTime.toLocaleString('es-VE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}

✅ El usuario ha sido reactivado
    `.trim();
  }

  try {
    await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: ADMIN_CHAT_ID,
          text: adminMessage,
          parse_mode: 'Markdown'
        })
      }
    );

    console.log('✅ Admin notificado');
  } catch (error) {
    console.error('❌ Error notificando admin:', error);
  }
}