// lib/db.ts

import { kv } from '@vercel/kv';

export interface Subscriber {
  chatId: string;
  username?: string;
  subscribedAt: string;
  active: boolean;
}

// Agregar un suscriptor
export async function addSubscriber(chatId: string, username?: string): Promise<boolean> {
  try {
    const subscriber: Record<string, any> = {
      chatId,
      username,
      subscribedAt: new Date().toISOString(),
      active: true
    };
    
    await kv.hset(`subscriber:${chatId}`, subscriber);
    return true;
  } catch (error) {
    console.error('Error adding subscriber:', error);
    return false;
  }
}

// Obtener todos los suscriptores activos
export async function getActiveSubscribers(): Promise<string[]> {
  try {
    // Obtener todas las keys que empiezan con "subscriber:"
    const keys = await kv.keys('subscriber:*');
    
    if (!keys || keys.length === 0) {
      return [];
    }
    
    // Obtener todos los suscriptores
    const subscribers = await Promise.all(
      keys.map(key => kv.hgetall(key))
    );
    
    // Filtrar solo los activos y devolver sus chatIds
    const activeChatIds = subscribers
      .filter((sub: any) => sub && sub.active === true)
      .map((sub: any) => sub.chatId);
    
    return activeChatIds;
  } catch (error) {
    console.error('Error getting subscribers:', error);
    return [];
  }
}

// Desactivar un suscriptor
export async function deactivateSubscriber(chatId: string): Promise<boolean> {
  try {
    await kv.hset(`subscriber:${chatId}`, { active: false });
    return true;
  } catch (error) {
    console.error('Error deactivating subscriber:', error);
    return false;
  }
}

// Verificar si un chat ID ya está suscrito
export async function isSubscribed(chatId: string): Promise<boolean> {
  try {
    const subscriber = await kv.hgetall(`subscriber:${chatId}`);
    return subscriber !== null && (subscriber as any).active === true;
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
  }
}