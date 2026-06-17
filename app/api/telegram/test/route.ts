// app/api/telegram/test/route.ts
// ⚠️ SOLO PARA PRUEBAS - Envía notificación forzada a todos los suscriptores

import { NextResponse } from "next/server";
import { getActiveSubscribers } from "@/lib/db";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

    if (!TELEGRAM_BOT_TOKEN) {
      return NextResponse.json(
        { error: "TELEGRAM_BOT_TOKEN no configurado" },
        { status: 500 }
      );
    }

    // Obtener tasas actuales
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/api/rates`,
      { cache: "no-store" }
    );

    if (!response.ok) {
      throw new Error("Error al obtener tasas");
    }

    const data = await response.json();

    const oficialRate = data.find((r: any) => r.fuente === "oficial");
    const paraleloRate = data.find((r: any) => r.fuente === "paralelo");
    const euroRate = data.find((r: any) => r.fuente === "euro");

    if (!oficialRate || !paraleloRate || !euroRate) {
      throw new Error("No se encontraron las tasas necesarias");
    }

    // Hora Venezuela
    const now = new Date();
    const venezuelaTime = new Date(
      now.toLocaleString("en-US", { timeZone: "America/Caracas" })
    );

    const message = `
🧪 *Mensaje de Prueba - Conversor Venezuela*

✅ Las notificaciones están funcionando correctamente.

💵 *Dólar BCV Oficial*
${oficialRate.promedio.toFixed(2)} Bs/$

💸 *Dólar Paralelo*
${paraleloRate.promedio.toFixed(2)} Bs/$

💶 *Euro*
${euroRate.promedio.toFixed(2)} Bs/€

📊 *Diferencia BCV-Paralelo:* ${(
      (paraleloRate.promedio / oficialRate.promedio - 1) * 100
    ).toFixed(2)}%

⏰ ${venezuelaTime.toLocaleTimeString("es-VE", {
      hour: "2-digit",
      minute: "2-digit",
    })} - ${venezuelaTime.toLocaleDateString("es-VE", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })}
    `.trim();

    // Obtener suscriptores activos
    const chatIds = await getActiveSubscribers();

    if (chatIds.length === 0) {
      return NextResponse.json({
        success: false,
        message: "No hay suscriptores activos en la base de datos",
        rates: {
          oficial: oficialRate.promedio,
          paralelo: paraleloRate.promedio,
          euro: euroRate.promedio,
        },
      });
    }

    // Enviar a todos
    const results = await Promise.allSettled(
      chatIds.map(async (chatId) => {
        const res = await fetch(
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

        const responseData = await res.json();

        if (!res.ok) {
          throw new Error(
            `Error para ${chatId}: ${responseData.description || "Unknown"}`
          );
        }

        return { chatId, status: "sent" };
      })
    );

    const sent = results.filter(
      (r) => r.status === "fulfilled"
    ).length;
    const failed = results.filter(
      (r) => r.status === "rejected"
    ).length;

    const errors = results
      .filter((r) => r.status === "rejected")
      .map((r) => (r as PromiseRejectedResult).reason?.message);

    return NextResponse.json({
      success: true,
      message: `Prueba completada: ${sent} enviados, ${failed} fallidos`,
      sent,
      failed,
      total: chatIds.length,
      chatIds,
      errors: errors.length > 0 ? errors : undefined,
      rates: {
        oficial: oficialRate.promedio,
        paralelo: paraleloRate.promedio,
        euro: euroRate.promedio,
      },
    });
  } catch (error) {
    console.error("Error en prueba:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}