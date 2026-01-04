// lib/prisma.ts

import { PrismaClient } from "@prisma/client";

// Declaración global para evitar múltiples instancias en desarrollo
declare global {
  var prisma: PrismaClient | undefined;
}

// Singleton de PrismaClient
export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

export default prisma;