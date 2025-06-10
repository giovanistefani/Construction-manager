import { NextRequest, NextResponse } from 'next/server';
import authService from '@/lib/services/authService';

export async function POST(request: NextRequest) {
  try {
    const { token, novaSenha } = await request.json();

    if (!token || !novaSenha) {
      return NextResponse.json(
        { erro: 'Token e nova senha são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar força da senha
    const validacaoSenha = authService.validarForcaSenha(novaSenha);
    if (!validacaoSenha.valida) {
      return NextResponse.json(
        { 
          erro: 'Senha não atende aos requisitos',
          detalhes: validacaoSenha.erros 
        },
        { status: 400 }
      );
    }

    // Redefinir senha
    const sucesso = await authService.redefinirSenha(token, novaSenha);

    if (!sucesso) {
      return NextResponse.json(
        { erro: 'Token inválido ou expirado' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      mensagem: 'Senha redefinida com sucesso'
    });
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    return NextResponse.json(
      { erro: 'Erro ao redefinir senha' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { valido: false },
        { status: 400 }
      );
    }

    const valido = await authService.verificarTokenRecuperacao(token);

    return NextResponse.json({ valido });
  } catch (error) {
    console.error('Erro ao verificar token:', error);
    return NextResponse.json(
      { valido: false },
      { status: 500 }
    );
  }
}