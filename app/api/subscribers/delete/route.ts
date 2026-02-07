// app/api/subscribers/delete/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get('chatId');
    
    if (!chatId) {
      return NextResponse.json(
        { error: 'Chat ID requerido' },
        { status: 400 }
      );
    }

    // Verificar que existe
    const subscriber = await prisma.subscriber.findUnique({
      where: { chatId }
    });

    if (!subscriber) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    // Eliminar permanentemente
    await prisma.subscriber.delete({
      where: { chatId }
    });

    console.log('🗑️ Usuario eliminado:', chatId);

    return NextResponse.json({
      success: true,
      message: 'Usuario eliminado exitosamente',
      chatId
    });

  } catch (error) {
    console.error('❌ Error eliminando usuario:', error);
    return NextResponse.json(
      { error: 'Error al eliminar usuario' },
      { status: 500 }
    );
  }
}
