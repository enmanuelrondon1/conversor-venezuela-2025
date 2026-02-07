// app/api/subscribers/toggle/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function PATCH(request: Request) {
  try {
    const { chatId, activo } = await request.json();
    
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

    // Actualizar estado
    const updated = await prisma.subscriber.update({
      where: { chatId },
      data: { 
        activo: activo ?? !subscriber.activo,
        updatedAt: new Date()
      }
    });

    console.log(`🔄 Usuario ${updated.activo ? 'activado' : 'desactivado'}:`, chatId);

    return NextResponse.json({
      success: true,
      message: `Usuario ${updated.activo ? 'activado' : 'desactivado'} exitosamente`,
      subscriber: updated
    });

  } catch (error) {
    console.error('❌ Error actualizando usuario:', error);
    return NextResponse.json(
      { error: 'Error al actualizar usuario' },
      { status: 500 }
    );
  }
}
