// app/api/subscribe/check/route.ts

import { NextResponse } from 'next/server';
import { isSubscribed } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');
    
    if (!chatId) {
      return NextResponse.json(
        { error: 'Chat ID requerido' },
        { status: 400 }
      );
    }

    const subscribed = await isSubscribed(chatId);
    
    return NextResponse.json({ 
      subscribed,
      chatId 
    });

  } catch (error) {
    console.error('Error checking subscription:', error);
    return NextResponse.json(
      { error: 'Error al verificar suscripción', subscribed: false },
      { status: 500 }
    );
  }
}