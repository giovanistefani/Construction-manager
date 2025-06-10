import { NextRequest, NextResponse } from 'next/server';
import authService from '@/lib/services/authService';
import { LoginDTO } from '@/types/auth';

export async function POST(request: NextRequest) {
  try {
    const body: LoginDTO = await request.json();

    if (!body.nome_usuario || !body.senha) {
      return NextResponse.json(
        { erro: 'Nome de usuário e senha são obrigatórios' },
        { status: 400 }
      );
    }

    const resultado = await authService.login(body);

    if (resultado.mensagem === 'Credenciais inválidas' || resultado.mensagem.includes('Conta bloqueada')) {
      return NextResponse.json(
        { erro: resultado.mensagem },
        { status: resultado.mensagem.includes('bloqueada') ? 423 : 401 }
      );
    }

    return NextResponse.json(resultado);
  } catch (error: any) {
    console.error('Erro no login:', error);
    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}