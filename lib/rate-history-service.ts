// lib/rate-history-service.ts

import prisma from "@/lib/prisma";

interface RateData {
  bcv: number;
  paralelo: number;
  euro?: number;
}

/**
 * Guarda las tasas actuales en el histórico
 * Solo guarda una vez por día para evitar duplicados
 */
export async function saveRateToHistory(rates: RateData) {
  try {
    // Verificar si ya existe un registro de hoy
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingRecord = await prisma.rateHistory.findFirst({
      where: {
        fecha: {
          gte: today,
        },
      },
    });

    // Si ya existe un registro de hoy, actualizar en lugar de crear uno nuevo
    if (existingRecord) {
      console.log("Ya existe un registro de hoy, actualizando...");
      
      const bcvChange = rates.bcv - existingRecord.bcv;
      const paraleloChange = rates.paralelo - existingRecord.paralelo;
      const euroChange = rates.euro && existingRecord.euro 
        ? rates.euro - existingRecord.euro 
        : 0;
      const diferencial = ((rates.paralelo - rates.bcv) / rates.bcv) * 100;

      return await prisma.rateHistory.update({
        where: { id: existingRecord.id },
        data: {
          bcv: rates.bcv,
          paralelo: rates.paralelo,
          euro: rates.euro,
          bcvChange,
          paraleloChange,
          euroChange,
          diferencial,
        },
      });
    }

    // Obtener el último registro (de ayer o antes) para calcular cambios
    const lastRecord = await prisma.rateHistory.findFirst({
      orderBy: {
        fecha: "desc",
      },
    });

    const bcvChange = lastRecord ? rates.bcv - lastRecord.bcv : 0;
    const paraleloChange = lastRecord ? rates.paralelo - lastRecord.paralelo : 0;
    const euroChange = lastRecord && rates.euro 
      ? rates.euro - (lastRecord.euro || 0) 
      : 0;

    // Calcular diferencial
    const diferencial = ((rates.paralelo - rates.bcv) / rates.bcv) * 100;

    // Crear nuevo registro
    const newRecord = await prisma.rateHistory.create({
      data: {
        bcv: rates.bcv,
        paralelo: rates.paralelo,
        euro: rates.euro,
        bcvChange,
        paraleloChange,
        euroChange,
        diferencial,
        fuente: "API Automática",
      },
    });

    console.log("✅ Tasas guardadas en histórico:", newRecord);
    return newRecord;
  } catch (error) {
    console.error("❌ Error guardando tasas en histórico:", error);
    throw error;
  }
}

/**
 * Obtiene el histórico de los últimos N días
 */
export async function getHistoricalRates(days: number = 30) {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const records = await prisma.rateHistory.findMany({
      where: {
        fecha: {
          gte: startDate,
        },
      },
      orderBy: {
        fecha: "asc",
      },
    });

    return records;
  } catch (error) {
    console.error("Error obteniendo histórico:", error);
    throw error;
  }
}

/**
 * Limpia registros antiguos (más de 1 año)
 */
export async function cleanOldRecords() {
  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

    const result = await prisma.rateHistory.deleteMany({
      where: {
        fecha: {
          lt: oneYearAgo,
        },
      },
    });

    console.log(`🗑️ Eliminados ${result.count} registros antiguos`);
    return result;
  } catch (error) {
    console.error("Error limpiando registros antiguos:", error);
    throw error;
  }
}