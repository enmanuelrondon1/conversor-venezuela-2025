// app/api/admin/verify/route.ts
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
    
    if (!ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Contraseña de admin no configurada' },
        { status: 500 }
      );
    }

    if (password === ADMIN_PASSWORD) {
      return NextResponse.json({ 
        valid: true,
        message: 'Autenticación exitosa' 
      });
    }

    return NextResponse.json(
      { valid: false, message: 'Contraseña incorrecta' },
      { status: 401 }
    );

  } catch (error) {
    console.error('Error en verificación:', error);
    return NextResponse.json(
      { error: 'Error al verificar contraseña' },
      { status: 500 }
    );
  }
}
