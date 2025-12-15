// app/api/telegram/route.ts

import { NextResponse } from 'next/server';
import { getActiveSubscribers } from '@/lib/db';

// Variable en memoria para comparar
let lastRates: { oficial: number; paralelo: number } | null = null;

export async function GET() {
  try {
    // Obtener tasas actuales de Venezuela
    const response = await fetch('https://ve.dolarapi.com/v1/dolares', {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error('Error al obtener tasas');
    }
    
    const data = await response.json();
    
    const oficialRate = data.find((r: any) => r.fuente === 'oficial');
    const paraleloRate = data.find((r: any) => r.fuente === 'paralelo');
    
    if (!oficialRate || !paraleloRate) {
      throw new Error('No se encontraron las tasas necesarias');
    }

    const currentRates = {
      oficial: oficialRate.promedio,
      paralelo: paraleloRate.promedio
    };

    // Verificar si es hora del resumen diario (8:00 AM - 8:30 AM hora de Venezuela)
    const now = new Date();
    const venezuelaTime = new Date(now.toLocaleString('en-US', { timeZone: 'America/Caracas' }));
    const hour = venezuelaTime.getHours();
    const minutes = venezuelaTime.getMinutes();
    const isDailyReportTime = hour === 8 && minutes < 30;

    // Si es la primera ejecución
    if (lastRates === null) {
      lastRates = currentRates;
      
      const message = `
🚀 *Sistema Iniciado - Conversor Venezuela*

💵 *Dólar BCV Oficial*
${currentRates.oficial.toFixed(2)} Bs/$

💸 *Dólar Paralelo (P2P/Crypto)*
${currentRates.paralelo.toFixed(2)} Bs/$

📊 *Diferencia:* ${(currentRates.paralelo - currentRates.oficial).toFixed(2)} Bs (${((currentRates.paralelo / currentRates.oficial - 1) * 100).toFixed(2)}%)

✅ Notificaciones activas
📅 ${venezuelaTime.toLocaleDateString('es-VE', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric'
})} - ${venezuelaTime.toLocaleTimeString('es-VE', { 
  hour: '2-digit', 
  minute: '2-digit' 
})}
      `.trim();
      
      await sendTelegramMessage(message);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Sistema iniciado - Primera notificación enviada',
        notified: true,
        type: 'initial_setup',
        rates: currentRates
      });
    }

    // Calcular cambio porcentual
    let shouldNotify = isDailyReportTime;
    const changePercent = {
      oficial: ((currentRates.oficial - lastRates.oficial) / lastRates.oficial) * 100,
      paralelo: ((currentRates.paralelo - lastRates.paralelo) / lastRates.paralelo) * 100
    };
    
    if (!isDailyReportTime) {
      const significantChange = Math.abs(changePercent.oficial) >= 1 || Math.abs(changePercent.paralelo) >= 1;
      shouldNotify = significantChange;
    }

    // Si no hay razón para notificar
    if (!shouldNotify) {
      lastRates = currentRates;
      return NextResponse.json({ 
        success: true, 
        message: 'Sin cambios significativos',
        notified: false,
        rates: currentRates,
        changePercent
      });
    }

    // Preparar mensaje
    let message = '';
    
    if (isDailyReportTime) {
      message = `
🌅 *Resumen Diario - Venezuela*

💵 *Dólar BCV Oficial*
${currentRates.oficial.toFixed(2)} Bs/$

💸 *Dólar Paralelo (P2P/Crypto)*
${currentRates.paralelo.toFixed(2)} Bs/$

📊 *Diferencia:* ${(currentRates.paralelo - currentRates.oficial).toFixed(2)} Bs (${((currentRates.paralelo / currentRates.oficial - 1) * 100).toFixed(2)}%)

📅 ${venezuelaTime.toLocaleDateString('es-VE', { 
  weekday: 'long', 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric'
})}
      `.trim();
    } else {
      const oficialArrow = changePercent.oficial > 0 ? '📈' : '📉';
      const paraleloArrow = changePercent.paralelo > 0 ? '📈' : '📉';
      
      message = `
🔔 *¡Cambio Detectado!*

💵 *Dólar BCV Oficial* ${oficialArrow}
${lastRates.oficial.toFixed(2)} → ${currentRates.oficial.toFixed(2)} Bs
Cambio: ${changePercent.oficial > 0 ? '+' : ''}${changePercent.oficial.toFixed(2)}%

💸 *Dólar Paralelo* ${paraleloArrow}
${lastRates.paralelo.toFixed(2)} → ${currentRates.paralelo.toFixed(2)} Bs
Cambio: ${changePercent.paralelo > 0 ? '+' : ''}${changePercent.paralelo.toFixed(2)}%

⏰ ${venezuelaTime.toLocaleTimeString('es-VE', { 
  hour: '2-digit', 
  minute: '2-digit' 
})}
      `.trim();
    }
    
    lastRates = currentRates;
    
    await sendTelegramMessage(message);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Notificación enviada exitosamente',
      notified: true,
      type: isDailyReportTime ? 'daily_report' : 'change_detected',
      rates: currentRates,
      changePercent
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Error desconocido' },
      { status: 500 }
    );
  }
}

// Función para enviar mensajes a TODOS los suscriptores
async function sendTelegramMessage(message: string) {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  
  if (!TELEGRAM_BOT_TOKEN) {
    throw new Error('Bot token no configurado');
  }
  
  // Obtener todos los suscriptores activos de la base de datos
  const chatIds = await getActiveSubscribers();
  
  if (chatIds.length === 0) {
    console.log('No hay suscriptores activos');
    return;
  }
  
  console.log(`Enviando mensaje a ${chatIds.length} suscriptores`);
  
  // Enviar a todos
  const promises = chatIds.map(chatId =>
    fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown'
      })
    })
  );
  
  const results = await Promise.allSettled(promises);
  
  const errors = results.filter(r => r.status === 'rejected');
  if (errors.length > 0) {
    console.error(`${errors.length} mensajes fallaron:`, errors);
  } else {
    console.log(`✅ Todos los mensajes enviados exitosamente`);
  }
}