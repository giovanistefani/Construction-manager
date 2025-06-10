import { NextRequest, NextResponse } from 'next/server';
import authService from '@/lib/services/authService';

export async function GET(request: NextRequest) {
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

    const usuario = await authService.obterStatusUsuario(decoded.usuarioId);

    if (!usuario) {
      return NextResponse.json(
        { erro: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nomeUsuario: usuario.nomeUsuario,
        empresaId: usuario.empresaId,
        dois_fatores_ativo: usuario.dois_fatores_ativo
      }
    });
  } catch (error) {
    console.error('Erro ao obter dados do usuário:', error);
    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}