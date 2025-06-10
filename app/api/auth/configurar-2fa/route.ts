import { NextRequest, NextResponse } from 'next/server';
import authService from '@/lib/services/authService';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { erro: 'Token não fornecido' },
        { status: 401 }
      );
    }

    const token = authHeader.startsWith('Bearer ') 
      ? authHeader.substring(7) 
      : authHeader;

    const decoded = await authService.validarToken(token);

    if (!decoded) {
      return NextResponse.json(
        { erro: 'Token inválido' },
        { status: 401 }
      );
    }

    const { ativar } = await request.json();

    if (typeof ativar !== 'boolean') {
      return NextResponse.json(
        { erro: 'Parâmetro "ativar" deve ser booleano' },
        { status: 400 }
      );
    }

    await authService.ativarDesativar2FA(decoded.usuarioId, ativar);

    return NextResponse.json({
      mensagem: ativar 
        ? 'Autenticação de dois fatores ativada com sucesso' 
        : 'Autenticação de dois fatores desativada com sucesso'
    });
  } catch (error) {
    console.error('Erro ao configurar 2FA:', error);
    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}