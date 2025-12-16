// lib/db.ts

import { kv } from '@vercel/kv';

export interface Subscriber {
  chatId: string;
  username?: string;
  subscribedAt: string;
  active: boolean;
}

// Verificar si KV está disponible
function isKVAvailable(): boolean {
  return !!(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

// Almacenamiento en memoria para desarrollo local
const localSubscribers = new Map<string, Subscriber>();

// Agregar un suscriptor
export async function addSubscriber(chatId: string, username?: string): Promise<boolean> {
  try {
    const subscriber: Subscriber = {
      chatId,
      username,
      subscribedAt: new Date().toISOString(),
      active: true
    };
    
    if (isKVAvailable()) {
      // Producción: usar Vercel KV
      const subscriberData: Record<string, any> = {
        chatId,
        username,
        subscribedAt: subscriber.subscribedAt,
        active: true
      };
      await kv.hset(`subscriber:${chatId}`, subscriberData);
      console.log('✅ Suscriptor guardado en Vercel KV:', chatId);
    } else {
      // Desarrollo: usar memoria local
      localSubscribers.set(chatId, subscriber);
      console.log('✅ Suscriptor guardado en memoria local:', chatId);
    }
    
    return true;
  } catch (error) {
    console.error('Error adding subscriber:', error);
    return false;
  }
}

// Obtener todos los suscriptores activos
export async function getActiveSubscribers(): Promise<string[]> {
  try {
    if (isKVAvailable()) {
      // Producción: usar Vercel KV
      const keys = await kv.keys('subscriber:*');
      
      if (!keys || keys.length === 0) {
        return [];
      }
      
      const subscribers = await Promise.all(
        keys.map(key => kv.hgetall(key))
      );
      
      const activeChatIds = subscribers
        .filter((sub: any) => sub && sub.active === true)
        .map((sub: any) => sub.chatId);
      
      return activeChatIds;
    } else {
      // Desarrollo: usar memoria local
      const activeSubscribers = Array.from(localSubscribers.values())
        .filter(sub => sub.active)
        .map(sub => sub.chatId);
      
      return activeSubscribers;
    }
  } catch (error) {
    console.error('Error getting subscribers:', error);
    return [];
  }
}

// Desactivar un suscriptor
export async function deactivateSubscriber(chatId: string): Promise<boolean> {
  try {
    if (isKVAvailable()) {
      // Producción: usar Vercel KV
      await kv.hset(`subscriber:${chatId}`, { active: false });
    } else {
      // Desarrollo: usar memoria local
      const subscriber = localSubscribers.get(chatId);
      if (subscriber) {
        subscriber.active = false;
        localSubscribers.set(chatId, subscriber);
      }
    }
    return true;
  } catch (error) {
    console.error('Error deactivating subscriber:', error);
    return false;
  }
}

// Verificar si un chat ID ya está suscrito
export async function isSubscribed(chatId: string): Promise<boolean> {
  try {
    if (isKVAvailable()) {
      // Producción: usar Vercel KV
      const subscriber = await kv.hgetall(`subscriber:${chatId}`);
      return subscriber !== null && (subscriber as any).active === true;
    } else {
      // Desarrollo: usar memoria local
      const subscriber = localSubscribers.get(chatId);
      return subscriber !== undefined && subscriber.active === true;
    }
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
  }
}