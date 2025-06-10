import { NextRequest, NextResponse } from 'next/server';
import authService from '@/lib/services/authService';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { erro: 'Email é obrigatório' },
        { status: 400 }
      );
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { erro: 'Email inválido' },
        { status: 400 }
      );
    }

    // Solicitar recuperação de senha
    const resultado = await authService.solicitarRecuperacaoSenha(email);

    if (!resultado.sucesso) {
      return NextResponse.json(
        { erro: resultado.mensagem },
        { status: 404 }
      );
    }

    return NextResponse.json({
      mensagem: resultado.mensagem
    });
  } catch (error) {
    console.error('Erro na recuperação de senha:', error);
    return NextResponse.json(
      { erro: 'Erro ao processar solicitação' },
      { status: 500 }
    );
  }
}