import { NextRequest, NextResponse } from 'next/server';
import authService from '@/lib/services/authService';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { erro: 'Token não fornecido' },
        { status: 400 }
      );
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;

    await authService.logout(token);
    
    return NextResponse.json({ mensagem: 'Logout realizado com sucesso' });
  } catch (error) {
    console.error('Erro no logout:', error);
    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}