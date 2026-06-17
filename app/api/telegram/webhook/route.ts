// app/api/telegram/webhook/route.ts

import { NextResponse } from "next/server";
import { addSubscriber, deactivateSubscriber, isSubscribed } from "@/lib/db";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

const TELEGRAM_API = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

// Función para enviar mensaje
async function sendMessage(chatId: string, text: string) {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "Markdown",
      disable_web_page_preview: true,
    }),
  });
}

// Obtener tasas actuales
async function getRates() {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BASE_URL}/api/rates`,
    { cache: "no-store" }
  );
  if (!response.ok) throw new Error("Error al obtener tasas");
  return await response.json();
}

// Hora Venezuela
function getVenezuelaTime() {
  const now = new Date();
  return new Date(now.toLocaleString("en-US", { timeZone: "America/Caracas" }));
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const message = body?.message;

    // Ignorar si no hay mensaje o no hay texto
    if (!message || !message.text) {
      return NextResponse.json({ ok: true });
    }

    const chatId = message.chat.id.toString();
    const username = message.from?.username || message.from?.first_name || null;
    const text = message.text.trim().toLowerCase();

    // =====================
    // COMANDO /start
    // =====================
    if (text === "/start") {
      const already = await isSubscribed(chatId);

      if (already) {
        await sendMessage(
          chatId,
          `👋 ¡Hola${username ? ` *${username}*` : ""}! Ya estás suscrito a las notificaciones.\n\nEscribe /ayuda para ver los comandos disponibles.`
        );
      } else {
        await addSubscriber(chatId, username || undefined);
        await sendMessage(
          chatId,
          `🎉 *¡Bienvenido a Monitor de Divisas Venezuela!*\n\n✅ Te has suscrito exitosamente.\n\n📊 *Recibirás:*\n- 🔔 Alertas cuando el dólar cambie ±1%\n- 🌅 Resumen diario a las 8:00 AM\n- 💶 Notificaciones del Euro\n\n🌐 *Web:* https://conversor-venezuela-2025.vercel.app\n\nEscribe /tasa para ver las tasas actuales.`
        );
      }
      return NextResponse.json({ ok: true });
    }

    // =====================
    // COMANDO /tasa
    // =====================
    if (text === "/tasa" || text === "/tasas") {
      const data = await getRates();

      const oficial = data.find((r: any) => r.fuente === "oficial");
      const paralelo = data.find((r: any) => r.fuente === "paralelo");
      const euro = data.find((r: any) => r.fuente === "euro");

      const venezuelaTime = getVenezuelaTime();
      const diferencial = ((paralelo.promedio / oficial.promedio - 1) * 100).toFixed(2);

      await sendMessage(
        chatId,
        `💱 *Tasas de Cambio - Venezuela*\n\n💵 *Dólar BCV Oficial*\n${oficial.promedio.toFixed(2)} Bs/$\n\n💸 *Dólar Paralelo*\n${paralelo.promedio.toFixed(2)} Bs/$\n\n💶 *Euro*\n${euro.promedio.toFixed(2)} Bs/€\n\n📊 *Diferencial BCV-Paralelo:* ${diferencial}%\n\n⏰ ${venezuelaTime.toLocaleTimeString("es-VE", { hour: "2-digit", minute: "2-digit" })} - ${venezuelaTime.toLocaleDateString("es-VE", { weekday: "long", day: "numeric", month: "long" })}`
      );
      return NextResponse.json({ ok: true });
    }

    // =====================
    // COMANDO /cancelar
    // =====================
    if (text === "/cancelar" || text === "/unsuscribir" || text === "/baja") {
      const already = await isSubscribed(chatId);

      if (!already) {
        await sendMessage(
          chatId,
          `ℹ️ No tienes una suscripción activa.\n\nEscribe /start para suscribirte.`
        );
      } else {
        await deactivateSubscriber(chatId);
        await sendMessage(
          chatId,
          `👋 *Suscripción cancelada*\n\nHas sido eliminado de las notificaciones.\n\nPuedes volver cuando quieras escribiendo /start.`
        );
      }
      return NextResponse.json({ ok: true });
    }

    // =====================
    // COMANDO /estado
    // =====================
    if (text === "/estado") {
      const subscribed = await isSubscribed(chatId);
      const subscriber = await prisma.subscriber.findUnique({
        where: { chatId },
      });

      if (!subscribed) {
        await sendMessage(
          chatId,
          `❌ *No estás suscrito*\n\nEscribe /start para activar las notificaciones.`
        );
      } else {
        const since = subscriber?.createdAt
          ? new Date(subscriber.createdAt).toLocaleDateString("es-VE", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })
          : "desconocida";

        await sendMessage(
          chatId,
          `✅ *Suscripción Activa*\n\n👤 Usuario: ${username || "Sin nombre"}\n🆔 Chat ID: \`${chatId}\`\n📅 Suscrito desde: ${since}\n\n🔔 Recibes alertas de cambios ≥1%\n🌅 Resumen diario a las 8:00 AM`
        );
      }
      return NextResponse.json({ ok: true });
    }

    // =====================
    // COMANDO /ayuda
    // =====================
    if (text === "/ayuda" || text === "/help") {
      await sendMessage(
        chatId,
        `🤖 *Comandos disponibles:*\n\n/start — Suscribirte a notificaciones\n/tasa — Ver tasas actuales\n/estado — Ver tu suscripción\n/cancelar — Cancelar notificaciones\n/ayuda — Ver esta lista\n\n🌐 *Web:* https://conversor-venezuela-2025.vercel.app`
      );
      return NextResponse.json({ ok: true });
    }

    // Comando no reconocido
    await sendMessage(
      chatId,
      `❓ No entiendo ese comando.\n\nEscribe /ayuda para ver los comandos disponibles.`
    );

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error en webhook:", error);
    return NextResponse.json({ ok: true }); // Siempre 200 para Telegram
  }
}