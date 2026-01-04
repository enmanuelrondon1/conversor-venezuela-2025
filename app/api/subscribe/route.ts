// app/api/subscribe/route.ts

import { NextResponse } from 'next/server';

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
https://conversor-venezuela-2025.vercel.app

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
      return NextResponse.json(
        { error: 'Error al enviar mensaje de Telegram' },
        { status: 500 }
      );
    }

    // En desarrollo, solo registra el intento
    console.log('✅ Suscripción procesada:', { chatId, username });

    return NextResponse.json({
      success: true,
      message: 'Suscripción exitosa',
      chatId,
      username,
      note: 'En producción se guardará en la base de datos'
    });

  } catch (error) {
    console.error('Error completo:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}