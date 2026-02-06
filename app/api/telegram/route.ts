// app/api/telegram/route.ts

import { NextResponse } from "next/server";
import { getActiveSubscribers } from "@/lib/db";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

interface ExchangeRate {
  fuente: string;
  nombre: string;
  promedio: number;
  fechaActualizacion: string;
}

export async function GET() {
  try {
    // 1. Obtener tasas actuales desde NUESTRA API
    const response = await fetch(
      `${
        process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"
      }/api/rates`,
      {
        cache: "no-store",
      }
    );

    if (!response.ok) {
      throw new Error("Error al obtener tasas");
    }

    const data: ExchangeRate[] = await response.json();

    const oficialRate = data.find((r) => r.fuente === "oficial");
    const paraleloRate = data.find((r) => r.fuente === "paralelo");
    const euroRate = data.find((r) => r.fuente === "euro");

    if (!oficialRate || !paraleloRate || !euroRate) {
      throw new Error("No se encontraron las tasas necesarias");
    }

    const currentRates = {
      oficial: oficialRate.promedio,
      paralelo: paraleloRate.promedio,
      euro: euroRate.promedio,
    };

    // 2. Obtener último registro ANTERIOR (ignorar el de hoy) para comparar
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const lastRecord = await prisma.rateHistory.findFirst({
      where: {
        fecha: {
          lt: today, // Menor que hoy (lt = less than)
        },
      },
      orderBy: { fecha: "desc" },
    });

    // Verificar si es hora del resumen diario (8:00 AM - 8:30 AM hora de Venezuela)
    const now = new Date();
    const venezuelaTime = new Date(
      now.toLocaleString("en-US", { timeZone: "America/Caracas" })
    );
    const hour = venezuelaTime.getHours();
    const minutes = venezuelaTime.getMinutes();
    const isDailyReportTime = hour === 8 && minutes < 30;

    // 3. Si es la primera ejecución (no hay registros previos)
    if (!lastRecord) {
      const message = `
🚀 *Sistema Iniciado - Conversor Venezuela*

💵 *Dólar BCV Oficial*
${currentRates.oficial.toFixed(2)} Bs/$

💸 *Dólar Paralelo*
${currentRates.paralelo.toFixed(2)} Bs/$

💶 *Euro*
${currentRates.euro.toFixed(2)} Bs/€

📊 *Diferencia BCV-Paralelo:* ${(
        (currentRates.paralelo / currentRates.oficial - 1) *
        100
      ).toFixed(2)}%

✅ Notificaciones activas
📅 ${venezuelaTime.toLocaleDateString("es-VE", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })} - ${venezuelaTime.toLocaleTimeString("es-VE", {
        hour: "2-digit",
        minute: "2-digit",
      })}
      `.trim();

      await sendTelegramMessage(message);

      return NextResponse.json({
        success: true,
        message: "Sistema iniciado - Primera notificación enviada",
        notified: true,
        type: "initial_setup",
        rates: currentRates,
      });
    }

    // 4. Calcular cambio porcentual
    const changePercent = {
      oficial: ((currentRates.oficial - lastRecord.bcv) / lastRecord.bcv) * 100,
      paralelo:
        ((currentRates.paralelo - lastRecord.paralelo) / lastRecord.paralelo) *
        100,
      euro: lastRecord.euro
        ? ((currentRates.euro - lastRecord.euro) / lastRecord.euro) * 100
        : 0,
    };

    // 5. Determinar si hay cambios significativos
    let shouldNotify = isDailyReportTime;
    const significantChanges: string[] = [];

    if (!isDailyReportTime) {
      if (Math.abs(changePercent.oficial) >= 1) {
        significantChanges.push("oficial");
      }
      if (Math.abs(changePercent.paralelo) >= 1) {
        significantChanges.push("paralelo");
      }
      if (Math.abs(changePercent.euro) >= 1) {
        significantChanges.push("euro");
      }

      shouldNotify = significantChanges.length > 0;
    }

    // 6. Si no hay razón para notificar
    if (!shouldNotify) {
      return NextResponse.json({
        success: true,
        message: "Sin cambios significativos",
        notified: false,
        rates: currentRates,
        changePercent,
      });
    }

    // 7. Preparar mensaje
    let message = "";

    if (isDailyReportTime) {
      // RESUMEN DIARIO
      message = `
🌅 *Resumen Diario - Venezuela*

💵 *Dólar BCV Oficial*
${currentRates.oficial.toFixed(2)} Bs/$
${
  changePercent.oficial !== 0
    ? `Cambio: ${
        changePercent.oficial > 0 ? "+" : ""
      }${changePercent.oficial.toFixed(2)}%`
    : ""
}

💸 *Dólar Paralelo*
${currentRates.paralelo.toFixed(2)} Bs/$
${
  changePercent.paralelo !== 0
    ? `Cambio: ${
        changePercent.paralelo > 0 ? "+" : ""
      }${changePercent.paralelo.toFixed(2)}%`
    : ""
}

💶 *Euro*
${currentRates.euro.toFixed(2)} Bs/€
${
  changePercent.euro !== 0
    ? `Cambio: ${changePercent.euro > 0 ? "+" : ""}${changePercent.euro.toFixed(
        2
      )}%`
    : ""
}

📊 *Diferencia BCV-Paralelo:* ${(
        (currentRates.paralelo / currentRates.oficial - 1) *
        100
      ).toFixed(2)}%

📅 ${venezuelaTime.toLocaleDateString("es-VE", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })}
      `.trim();
    } else {
      // ALERTA DE CAMBIO - NUEVO FORMATO MEJORADO
      const hasOficialChange = significantChanges.includes("oficial");
      const hasParaleloChange = significantChanges.includes("paralelo");
      const hasEuroChange = significantChanges.includes("euro");

      // Determinar el título principal basado en qué cambió más
      let mainTitle = "🔔 *¡Cambio Detectado en las Tasas!*";
      
      if (significantChanges.length === 1) {
        if (hasOficialChange) {
          mainTitle = changePercent.oficial > 0 
            ? "🟢 *Dólar BCV SUBIÓ*" 
            : "🔴 *Dólar BCV BAJÓ*";
        } else if (hasParaleloChange) {
          mainTitle = changePercent.paralelo > 0 
            ? "🟢 *Dólar Paralelo SUBIÓ*" 
            : "🔴 *Dólar Paralelo BAJÓ*";
        } else if (hasEuroChange) {
          mainTitle = changePercent.euro > 0 
            ? "🟢 *Euro SUBIÓ*" 
            : "🔴 *Euro BAJÓ*";
        }
      }

      // Construir secciones de cada moneda
      let oficialSection = "";
      let paraleloSection = "";
      let euroSection = "";

      // SECCIÓN DÓLAR BCV
      if (hasOficialChange) {
        const arrow = changePercent.oficial > 0 ? "📈" : "📉";
        const emoji = changePercent.oficial > 0 ? "🟢" : "🔴";
        oficialSection = `
${emoji} *Dólar BCV:* ${lastRecord.bcv.toFixed(2)} → ${currentRates.oficial.toFixed(2)} Bs/$
${arrow} Cambio: ${changePercent.oficial > 0 ? "+" : ""}${changePercent.oficial.toFixed(2)}% (${(currentRates.oficial - lastRecord.bcv).toFixed(2)} Bs)`;
      } else {
        oficialSection = `
💵 *Dólar BCV:* ${currentRates.oficial.toFixed(2)} Bs/$
Sin cambios significativos`;
      }

      // SECCIÓN DÓLAR PARALELO
      if (hasParaleloChange) {
        const arrow = changePercent.paralelo > 0 ? "📈" : "📉";
        const emoji = changePercent.paralelo > 0 ? "🟢" : "🔴";
        paraleloSection = `
${emoji} *Dólar Paralelo:* ${lastRecord.paralelo.toFixed(2)} → ${currentRates.paralelo.toFixed(2)} Bs/$
${arrow} Cambio: ${changePercent.paralelo > 0 ? "+" : ""}${changePercent.paralelo.toFixed(2)}% (${(currentRates.paralelo - lastRecord.paralelo).toFixed(2)} Bs)`;
      } else {
        paraleloSection = `
💸 *Dólar Paralelo:* ${currentRates.paralelo.toFixed(2)} Bs/$
Sin cambios significativos`;
      }

      // SECCIÓN EURO
      if (hasEuroChange && lastRecord.euro) {
        const arrow = changePercent.euro > 0 ? "📈" : "📉";
        const emoji = changePercent.euro > 0 ? "🟢" : "🔴";
        euroSection = `
${emoji} *Euro:* ${lastRecord.euro.toFixed(2)} → ${currentRates.euro.toFixed(2)} Bs/€
${arrow} Cambio: ${changePercent.euro > 0 ? "+" : ""}${changePercent.euro.toFixed(2)}% (${(currentRates.euro - lastRecord.euro).toFixed(2)} Bs)`;
      } else {
        euroSection = `
💶 *Euro:* ${currentRates.euro.toFixed(2)} Bs/€
Sin cambios significativos`;
      }

      message = `
${mainTitle}
${oficialSection}
${paraleloSection}
${euroSection}

📊 *Diferencia BCV-Paralelo:* ${((currentRates.paralelo / currentRates.oficial - 1) * 100).toFixed(2)}%

⏰ ${venezuelaTime.toLocaleTimeString("es-VE", {
        hour: "2-digit",
        minute: "2-digit",
      })}
      `.trim();
    }

    const sendResult = await sendTelegramMessage(message);

    return NextResponse.json({
      success: true,
      message: "Notificación enviada exitosamente",
      notified: true,
      type: isDailyReportTime ? "daily_report" : "change_detected",
      rates: currentRates,
      changePercent,
      significantChanges,
      deliveryReport: sendResult,
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}

// Función para enviar mensajes a TODOS los suscriptores con manejo de errores mejorado
async function sendTelegramMessage(message: string) {
  const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

  if (!TELEGRAM_BOT_TOKEN) {
    throw new Error("Bot token no configurado");
  }

  // Obtener todos los suscriptores activos de la base de datos
  const chatIds = await getActiveSubscribers();

  console.log("🔍 DEBUG - Chat IDs obtenidos:", chatIds);

  if (chatIds.length === 0) {
    console.log("No hay suscriptores activos");
    return {
      sent: 0,
      failed: 0,
      deactivated: 0,
    };
  }

  console.log(`📤 Enviando mensaje a ${chatIds.length} suscriptores`);

  // Enviar a todos y capturar resultados
  const results = await Promise.allSettled(
    chatIds.map(async (chatId) => {
      try {
        const response = await fetch(
          `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              chat_id: chatId,
              text: message,
              parse_mode: "Markdown",
            }),
          }
        );

        const data = await response.json();

        if (!response.ok) {
          // Detectar si el error es porque el usuario no inició conversación con el bot
          if (
            data.error_code === 403 ||
            (data.description &&
              (data.description.includes("bot was blocked") ||
                data.description.includes("user is deactivated") ||
                data.description.includes("bot can't initiate")))
          ) {
            console.warn(
              `⚠️ Usuario ${chatId} no puede recibir mensajes. Desactivando...`
            );

            // Desactivar automáticamente este suscriptor
            await prisma.subscriber.update({
              where: { chatId },
              data: { activo: false, updatedAt: new Date() },
            });

            throw new Error(`DEACTIVATED:${chatId}`);
          }

          throw new Error(
            `Telegram error: ${data.description || "Unknown error"}`
          );
        }

        console.log(`✅ Mensaje enviado a ${chatId}`);
        return { chatId, status: "sent" };
      } catch (error) {
        if (error instanceof Error && error.message.startsWith("DEACTIVATED:")) {
          return { chatId, status: "deactivated" };
        }
        console.error(`❌ Error enviando a ${chatId}:`, error);
        return { chatId, status: "failed" };
      }
    })
  );

  // Contar resultados
  let sent = 0;
  let failed = 0;
  let deactivated = 0;

  results.forEach((result) => {
    if (result.status === "fulfilled") {
      if (result.value.status === "sent") sent++;
      else if (result.value.status === "deactivated") deactivated++;
      else failed++;
    } else {
      failed++;
    }
  });

  console.log(
    `📊 Resultados: ${sent} enviados, ${failed} fallidos, ${deactivated} desactivados`
  );

  if (deactivated > 0) {
    console.log(
      `🔄 Se desactivaron ${deactivated} suscriptores que no pueden recibir mensajes`
    );
  }

  return {
    sent,
    failed,
    deactivated,
    total: chatIds.length,
  };
}