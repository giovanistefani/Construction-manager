import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import authService from '@/lib/services/authService';

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return NextResponse.json(
        { erro: 'Refresh token é obrigatório' },
        { status: 400 }
      );
    }

    // Validar refresh token
    let decoded: any;
    try {
      decoded = jwt.verify(refreshToken, process.env.JWT_SECRET || 'default-secret');
    } catch {
      return NextResponse.json(
        { erro: 'Refresh token inválido ou expirado' },
        { status: 401 }
      );
    }

    // Verificar se o usuário ainda existe e está ativo
    const usuario = await authService.obterStatusUsuario(decoded.usuarioId);

    if (!usuario) {
      return NextResponse.json(
        { erro: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Gerar novos tokens
    const novoAccessToken = jwt.sign(
      { 
        usuarioId: usuario.id,
        empresaId: usuario.empresaId,
        email: usuario.email,
        nomeUsuario: usuario.nomeUsuario
      },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '1h' } // Access token expira em 1 hora
    );

    const novoRefreshToken = jwt.sign(
      { 
        usuarioId: usuario.id,
        type: 'refresh'
      },
      process.env.JWT_SECRET || 'default-secret',
      { expiresIn: '30d' } // Refresh token expira em 30 dias
    );

    // Log de auditoria para renovação de token
    try {
      await authService.criarLogAuditoriaPublico(
        'Usuario',
        usuario.id,
        usuario.id,
        'Token Renovado',
        null,
        { timestamp: new Date().toISOString() },
        'Token de acesso renovado automaticamente'
      );
    } catch (logError) {
      console.error('Erro ao criar log de auditoria:', logError);
      // Não falhar a renovação por causa do log
    }

    return NextResponse.json({
      mensagem: 'Token renovado com sucesso',
      accessToken: novoAccessToken,
      refreshToken: novoRefreshToken,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nomeUsuario: usuario.nomeUsuario,
        empresaId: usuario.empresaId
      }
    });

  } catch (error) {
    console.error('Erro na renovação do token:', error);
    return NextResponse.json(
      { erro: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}