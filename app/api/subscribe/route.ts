// app/api/subscribe/route.ts

import { NextResponse } from 'next/server';
import { addSubscriber, isSubscribed } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { chatId, username } = await request.json();
    
    if (!chatId) {
      return NextResponse.json(
        { error: 'Chat ID requerido' },
        { status: 400 }
      );
    }

    // Verificar si ya está suscrito
    const alreadySubscribed = await isSubscribed(chatId);
    
    if (alreadySubscribed) {
      return NextResponse.json(
        { error: 'Este Chat ID ya está suscrito' },
        { status: 400 }
      );
    }

    // Agregar a la base de datos
    const added = await addSubscriber(chatId, username);
    
    if (!added) {
      return NextResponse.json(
        { error: 'Error al guardar suscriptor' },
        { status: 500 }
      );
    }

    // Enviar mensaje de bienvenida
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
    
    if (!TELEGRAM_BOT_TOKEN) {
      return NextResponse.json(
        { error: 'Bot no configurado' },
        { status: 500 }
      );
    }

    const welcomeMessage = `
🎉 *¡Bienvenido a Conversor Venezuela!*

Te has suscrito exitosamente a las notificaciones de tasas de cambio.

📊 Recibirás:
- 🔔 Alertas cuando el dólar cambie ±1%
- 🌅 Resumen diario a las 8:00 AM

💵 Tasas actuales disponibles en:
https://conversor-venezuela.vercel.app

¡Gracias por suscribirte! 🇻🇪
    `.trim();

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: welcomeMessage,
          parse_mode: 'Markdown'
        })
      }
    );

    if (!telegramResponse.ok) {
      const errorData = await telegramResponse.json();
      console.error('Error de Telegram:', errorData);
      // No falla la suscripción si falla Telegram
    }

    return NextResponse.json({
      success: true,
      message: 'Suscripción exitosa',
      chatId,
      username
    });

  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}