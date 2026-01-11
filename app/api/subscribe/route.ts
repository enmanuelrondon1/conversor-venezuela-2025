// app/api/subscribe/route.ts

import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic'; 

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
- 🌅 Resumen diario a las 8:00 AM
- 💶 Notificaciones del Euro

💵 Tasas actuales disponibles en:
https://conversor-venezuela-2025.vercel.app

¡Gracias por volver! 🇻🇪
        `.trim();
        
        await sendTelegramMessage(chatId, reactivateMessage);
        
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

    if (!sent) {
      // Si falla el envío, eliminar de la base de datos
      await prisma.subscriber.delete({
        where: { id: subscriber.id }
      });
      
      return NextResponse.json(
        { error: 'No se pudo enviar el mensaje de Telegram. Verifica tu Chat ID.' },
        { status: 500 }
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