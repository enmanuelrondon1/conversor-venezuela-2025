// app/api/subscribers/list/route.ts

import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const subscribers = await prisma.subscriber.findMany({
      orderBy: { createdAt: "desc" },
    });

    const stats = {
      total: subscribers.length,
      active: subscribers.filter((s) => s.activo).length,
      inactive: subscribers.filter((s) => !s.activo).length,
    };

    return NextResponse.json({
      success: true,
      stats,
      subscribers: subscribers.map((s) => ({
        chatId: s.chatId,
        nombre: s.nombre || "Sin nombre",
        activo: s.activo,
        createdAt: s.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    );
  }
}