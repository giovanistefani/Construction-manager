import { NextRequest, NextResponse } from 'next/server';
import authService from '@/lib/services/authService';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { valido: false },
        { status: 401 }
      );
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;

    const decoded = await authService.validarToken(token);
    
    return NextResponse.json({ 
      valido: !!decoded,
      usuario: decoded || undefined
    });
  } catch (error) {
    return NextResponse.json(
      { valido: false },
      { status: 401 }
    );
  }
}