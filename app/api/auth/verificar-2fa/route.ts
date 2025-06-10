import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import authService from '@/lib/services/authService';

export async function POST(request: NextRequest) {
  try {
    const { usuarioId, codigo } = await request.json();

    if (!usuarioId || !codigo) {
      return NextResponse.json(
        { erro: 'ID do usuário e código são obrigatórios' },
        { status: 400 }
      );
    }

    // Verificar código 2FA
    const codigoValido = await authService.verificarCodigo2FA(usuarioId, codigo);

    if (!codigoValido) {
      return NextResponse.json(
        { erro: 'Código inválido ou expirado' },
        { status: 401 }
      );
    }

    // Obter dados do usuário
    const usuario = await authService.obterStatusUsuario(usuarioId);

    if (!usuario) {
      return NextResponse.json(
        { erro: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Gerar token JWT
    const token = jwt.sign(
      { 
        usuarioId: usuario.id, 
        empresaId: usuario.empresaId,
        email: usuario.email,
        nomeUsuario: usuario.nomeUsuario 
      },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    return NextResponse.json({
      mensagem: 'Verificação 2FA realizada com sucesso',
      token,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nomeUsuario: usuario.nomeUsuario,
        empresaId: usuario.empresaId
      }
    });
  } catch (error) {
    console.error('Erro na verificação 2FA:', error);
    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}