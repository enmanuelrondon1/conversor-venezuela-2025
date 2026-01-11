// lib/db.ts
import prisma from '@/lib/prisma';

export interface Subscriber {
  chatId: string;
  username?: string;
  subscribedAt: string;
  active: boolean;
}

// =====================================================
// FUNCIONES USANDO PRISMA (PostgreSQL)
// =====================================================

// Agregar un suscriptor
export async function addSubscriber(chatId: string, username?: string): Promise<boolean> {
  try {
    // Verificar si ya existe
    const existing = await prisma.subscriber.findUnique({
      where: { chatId }
    });

    if (existing) {
      // Si existe pero está inactivo, reactivar
      if (!existing.activo) {
        await prisma.subscriber.update({
          where: { chatId },
          data: { 
            activo: true,
            nombre: username || existing.nombre,
            updatedAt: new Date()
          }
        });
        console.log('✅ Suscriptor reactivado en Prisma:', chatId);
        return true;
      }
      
      console.log('⚠️ Suscriptor ya existe y está activo:', chatId);
      return false;
    }

    // Crear nuevo suscriptor
    await prisma.subscriber.create({
      data: {
        chatId,
        nombre: username || null,
        activo: true
      }
    });
    
    console.log('✅ Suscriptor guardado en Prisma:', chatId);
    return true;
  } catch (error) {
    console.error('❌ Error adding subscriber:', error);
    return false;
  }
}

// Obtener todos los suscriptores activos
export async function getActiveSubscribers(): Promise<string[]> {
  try {
    const subscribers = await prisma.subscriber.findMany({
      where: { activo: true },
      select: { chatId: true }
    });
    
    const chatIds = subscribers.map(sub => sub.chatId);
    
    if (chatIds.length > 0) {
      console.log(`📋 ${chatIds.length} suscriptor(es) activo(s) encontrado(s)`);
    }
    
    return chatIds;
  } catch (error) {
    console.error('❌ Error getting subscribers:', error);
    return [];
  }
}

// Desactivar un suscriptor
export async function deactivateSubscriber(chatId: string): Promise<boolean> {
  try {
    const subscriber = await prisma.subscriber.findUnique({
      where: { chatId }
    });

    if (!subscriber) {
      console.log('⚠️ Suscriptor no encontrado:', chatId);
      return false;
    }

    await prisma.subscriber.update({
      where: { chatId },
      data: { activo: false, updatedAt: new Date() }
    });
    
    console.log('✅ Suscriptor desactivado:', chatId);
    return true;
  } catch (error) {
    console.error('❌ Error deactivating subscriber:', error);
    return false;
  }
}

// Verificar si un chat ID ya está suscrito
export async function isSubscribed(chatId: string): Promise<boolean> {
  try {
    const subscriber = await prisma.subscriber.findUnique({
      where: { chatId }
    });
    
    return subscriber !== null && subscriber.activo === true;
  } catch (error) {
    console.error('❌ Error checking subscription:', error);
    return false;
  }
}

// Obtener información de un suscriptor
export async function getSubscriber(chatId: string): Promise<Subscriber | null> {
  try {
    const subscriber = await prisma.subscriber.findUnique({
      where: { chatId }
    });

    if (!subscriber) return null;

    return {
      chatId: subscriber.chatId,
      username: subscriber.nombre || undefined,
      subscribedAt: subscriber.createdAt.toISOString(),
      active: subscriber.activo
    };
  } catch (error) {
    console.error('❌ Error getting subscriber:', error);
    return null;
  }
}

// Obtener estadísticas de suscriptores
export async function getSubscriberStats() {
  try {
    const total = await prisma.subscriber.count();
    const active = await prisma.subscriber.count({
      where: { activo: true }
    });
    const inactive = total - active;

    return {
      total,
      active,
      inactive
    };
  } catch (error) {
    console.error('❌ Error getting stats:', error);
    return {
      total: 0,
      active: 0,
      inactive: 0
    };
  }
}