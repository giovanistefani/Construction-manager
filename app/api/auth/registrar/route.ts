import { NextRequest, NextResponse } from 'next/server';
import authService from '@/lib/services/authService';
import { CriarUsuarioDTO } from '@/types/auth';
import mysql from '@/lib/db/mysql';

export async function POST(request: NextRequest) {
  try {
    const body: CriarUsuarioDTO = await request.json();

    // Validações básicas
    if (!body.email || !body.nome_usuario || !body.senha || !body.empresa_principal_id) {
      return NextResponse.json(
        { erro: 'Email, nome de usuário, senha e empresa são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar se a empresa existe
    const [empresaExists] = await mysql.execute(
      'SELECT empresa_id FROM Empresa WHERE empresa_id = ? AND status_empresa = "Ativa"',
      [body.empresa_principal_id]
    );

    if ((empresaExists as any[]).length === 0) {
      return NextResponse.json(
        { erro: 'Empresa não encontrada ou inativa' },
        { status: 400 }
      );
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return NextResponse.json(
        { erro: 'Email inválido' },
        { status: 400 }
      );
    }

    // Validar tamanho do nome de usuário
    if (body.nome_usuario.length < 3) {
      return NextResponse.json(
        { erro: 'Nome de usuário deve ter pelo menos 3 caracteres' },
        { status: 400 }
      );
    }

    // Validar força da senha
    const validacaoSenha = authService.validarForcaSenha(body.senha);
    if (!validacaoSenha.valida) {
      return NextResponse.json(
        { 
          erro: 'Senha não atende aos requisitos',
          detalhes: validacaoSenha.erros 
        },
        { status: 400 }
      );
    }

    const usuarioId = await authService.criarUsuario(body);
    
    return NextResponse.json(
      { 
        mensagem: 'Usuário criado com sucesso', 
        usuarioId 
      },
      { status: 201 }
    );
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') {
      return NextResponse.json(
        { erro: 'Email ou nome de usuário já existe' },
        { status: 409 }
      );
    }
    
    console.error('Erro no registro:', error);
    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}