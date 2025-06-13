import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';
import mysql from '@/lib/db/mysql';

export async function GET(request: NextRequest) {
  try {
    const headersList = await headers();
    const authorization = headersList.get('authorization');

    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de acesso requerido' },
        { status: 401 }
      );
    }

    const token = authorization.split(' ')[1];

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!);
    } catch (error) {
      return NextResponse.json(
        { error: 'Token inválido ou expirado', code: 'TOKEN_EXPIRED' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const empresa = searchParams.get('empresa') || '';
    const orderBy = searchParams.get('orderBy') || 'nome_usuario';
    const orderDir = searchParams.get('orderDir') || 'ASC';

    const offset = (page - 1) * limit;

    let whereConditions = ['1=1'];
    let queryParams: any[] = [];

    if (search) {
      whereConditions.push(`(
        u.nome_usuario LIKE ? OR 
        u.email LIKE ?
      )`);
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm);
    }

    if (status) {
      whereConditions.push('u.status_conta = ?');
      queryParams.push(status);
    }

    if (empresa) {
      whereConditions.push('u.empresa_principal_id = ?');
      queryParams.push(empresa);
    }

    const whereClause = whereConditions.join(' AND ');

    // Validar orderBy para evitar SQL injection
    const allowedOrderBy = [
      'nome_usuario', 'email', 'status_conta', 'data_ultimo_login'
    ];

    const safeOrderBy = allowedOrderBy.includes(orderBy) ? orderBy : 'nome_usuario';
    const safeOrderDir = orderDir.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Query para buscar usuários
    const usuariosQuery = `
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
      WHERE ${whereClause}
      ORDER BY u.${safeOrderBy} ${safeOrderDir}
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countQuery = `
      SELECT COUNT(*) as total 
      FROM Usuario u
      LEFT JOIN Empresa e ON u.empresa_principal_id = e.empresa_id
      LEFT JOIN PerfilAcesso p ON u.perfil_acesso_id = p.perfil_id
      WHERE ${whereClause}
    `;

    const [usuarios] = await mysql.execute(usuariosQuery, queryParams);
    const [countResult] = await mysql.execute(countQuery, queryParams);
    const total = (countResult as any[])[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      usuarios,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });

  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}