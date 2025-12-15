// app/api/rates/route.ts

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // API de Venezuela - DolarApi.com
    const response = await fetch('https://ve.dolarapi.com/v1/dolares', {
      next: { revalidate: 300 } // Cache por 5 minutos
    });
    
    if (!response.ok) {
      throw new Error('Error al obtener tasas');
    }
    
    const data = await response.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching rates:', error);
    return NextResponse.json(
      { error: 'Error al obtener las tasas' },
      { status: 500 }
    );
  }
}