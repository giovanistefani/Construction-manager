import { NextResponse } from 'next/server';
import mysql from '@/lib/db/mysql';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

// GET - Obter detalhes de um usuário
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    try {
      jwt.verify(token, process.env.JWT_SECRET!);
    } catch (tokenError) {
      return NextResponse.json({ 
        error: 'Sessão expirada. Faça login novamente.',
        code: 'TOKEN_EXPIRED'
      }, { status: 401 });
    }
    
    const query = `
      SELECT 
        u.usuario_id,
        u.nome_usuario,
        u.email,
        u.empresa_principal_id,
        u.perfil_acesso_id,
        u.status_conta,
        u.data_ultimo_login,
        u.tentativas_login_falhas,
        e.nome_fantasia as empresa_nome,
        p.nome_perfil as perfil_nome
      FROM Usuario u
      LEFT JOIN Empresa e ON u.empresa_principal_id = e.empresa_id
      LEFT JOIN PerfilAcesso p ON u.perfil_acesso_id = p.perfil_id
      WHERE u.usuario_id = ?
    `;
    
    const [usuarios] = await mysql.execute(query, [id]);
    
    if (!usuarios || (usuarios as any[]).length === 0) {
      return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 });
    }
    
    return NextResponse.json((usuarios as any[])[0]);
    
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return NextResponse.json({ 
      error: 'Erro ao buscar usuário' 
    }, { status: 500 });
  }
}

// PUT - Editar usuário
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (tokenError) {
      return NextResponse.json({ 
        error: 'Sessão expirada. Faça login novamente.',
        code: 'TOKEN_EXPIRED'
      }, { status: 401 });
    }
    
    const data = await request.json();
    const { 
      nome_usuario, 
      email, 
      empresa_principal_id,
      perfil_acesso_id,
      status_conta,
      nova_senha 
    } = data;

    // Validações
    if (!nome_usuario || nome_usuario.trim() === '') {
      return NextResponse.json({ error: 'Nome de usuário é obrigatório' }, { status: 400 });
    }

    if (!email || email.trim() === '') {
      return NextResponse.json({ error: 'E-mail é obrigatório' }, { status: 400 });
    }

    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 });
    }

    // Verificar se email ou nome de usuário já existe (exceto o atual)
    const [existingUsers] = await mysql.execute(
      'SELECT usuario_id FROM Usuario WHERE (email = ? OR nome_usuario = ?) AND usuario_id != ?',
      [email, nome_usuario, id]
    );

    if (existingUsers && (existingUsers as any[]).length > 0) {
      return NextResponse.json({ 
        error: 'E-mail ou nome de usuário já está em uso' 
      }, { status: 400 });
    }

    // Preparar dados para atualização
    let updateFields = [
      'nome_usuario = ?',
      'email = ?',
      'empresa_principal_id = ?',
      'perfil_acesso_id = ?',
      'status_conta = ?'
    ];
    
    let updateValues = [nome_usuario, email, empresa_principal_id, perfil_acesso_id, status_conta];

    // Se nova senha foi fornecida, incluir na atualização
    if (nova_senha && nova_senha.trim() !== '') {
      // Validar força da senha
      if (nova_senha.length < 8) {
        return NextResponse.json({ error: 'A senha deve ter pelo menos 8 caracteres' }, { status: 400 });
      }
      if (!/[A-Z]/.test(nova_senha)) {
        return NextResponse.json({ error: 'A senha deve conter pelo menos uma letra maiúscula' }, { status: 400 });
      }
      if (!/[a-z]/.test(nova_senha)) {
        return NextResponse.json({ error: 'A senha deve conter pelo menos uma letra minúscula' }, { status: 400 });
      }
      if (!/[0-9]/.test(nova_senha)) {
        return NextResponse.json({ error: 'A senha deve conter pelo menos um número' }, { status: 400 });
      }
      if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(nova_senha)) {
        return NextResponse.json({ error: 'A senha deve conter pelo menos um caractere especial' }, { status: 400 });
      }

      const hashedPassword = await bcrypt.hash(nova_senha, 12);
      updateFields.push('senha = ?');
      updateValues.push(hashedPassword);
    }

    // Atualizar usuário
    const updateQuery = `
      UPDATE Usuario 
      SET ${updateFields.join(', ')}
      WHERE usuario_id = ?
    `;
    
    await mysql.execute(updateQuery, [...updateValues, id]);

    return NextResponse.json({ 
      message: 'Usuário atualizado com sucesso',
      usuario_id: id 
    });
    
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json({ 
      error: 'Erro ao atualizar usuário' 
    }, { status: 500 });
  }
}

// PATCH - Alterar status do usuário
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    try {
      jwt.verify(token, process.env.JWT_SECRET!);
    } catch (tokenError) {
      return NextResponse.json({ 
        error: 'Sessão expirada. Faça login novamente.',
        code: 'TOKEN_EXPIRED'
      }, { status: 401 });
    }
    
    const { status } = await request.json();
    
    if (!status) {
      return NextResponse.json({ error: 'Status é obrigatório' }, { status: 400 });
    }

    await mysql.execute(
      'UPDATE Usuario SET status_conta = ? WHERE usuario_id = ?',
      [status, id]
    );

    return NextResponse.json({ 
      message: 'Status do usuário alterado com sucesso' 
    });
    
  } catch (error) {
    console.error('Erro ao alterar status do usuário:', error);
    return NextResponse.json({ 
      error: 'Erro ao alterar status do usuário' 
    }, { status: 500 });
  }
}