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

    const empresa_id = decoded.empresa_id || decoded.empresaId || decoded.empresa_principal_id;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const tipoPessoa = searchParams.get('tipoPessoa') || '';
    const tipoFornecedor = searchParams.get('tipoFornecedor') || '';
    const orderBy = searchParams.get('orderBy') || 'razao_social';
    const orderDir = searchParams.get('orderDir') || 'ASC';

    const offset = (page - 1) * limit;

    let whereConditions = ['1=1'];
    let queryParams: any[] = [];

    // Always filter by empresa_id
    if (empresa_id) {
      whereConditions.push('f.empresa_id = ?');
      queryParams.push(empresa_id);
    }

    if (search) {
      whereConditions.push(`(
        f.razao_social_nome LIKE ? OR
        f.razao_social LIKE ? OR 
        f.nome_completo LIKE ? OR 
        f.nome_fantasia LIKE ? OR 
        f.cnpj_cpf LIKE ? OR 
        f.cnpj LIKE ? OR 
        f.cpf LIKE ? OR
        f.email_principal LIKE ?
      )`);
      const searchTerm = `%${search}%`;
      queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (status) {
      whereConditions.push('f.status_fornecedor = ?');
      queryParams.push(status);
    }

    if (tipoPessoa) {
      whereConditions.push('f.tipo_pessoa = ?');
      queryParams.push(tipoPessoa);
    }

    if (tipoFornecedor) {
      whereConditions.push('f.tipo_fornecedor = ?');
      queryParams.push(tipoFornecedor);
    }

    const whereClause = whereConditions.join(' AND ');

    // Validar orderBy para evitar SQL injection
    const allowedOrderBy = [
      'razao_social_nome', 'razao_social', 'nome_completo', 'nome_fantasia', 'cnpj_cpf', 'cnpj', 'cpf',
      'endereco_cidade', 'telefone_principal', 'email_principal',
      'tipo_pessoa', 'tipo_fornecedor', 'status_fornecedor', 'data_criacao'
    ];

    const safeOrderBy = allowedOrderBy.includes(orderBy) ? orderBy : 'data_criacao';
    const safeOrderDir = orderDir.toUpperCase() === 'DESC' ? 'DESC' : 'ASC';

    // Query com filtros
    const fornecedoresQuery = `
      SELECT 
        f.fornecedor_id,
        f.tipo_pessoa,
        f.razao_social_nome,
        f.razao_social,
        f.nome_completo,
        f.nome_fantasia,
        f.cnpj_cpf,
        f.cnpj,
        f.cpf,
        f.endereco_cidade,
        f.endereco_estado_uf,
        f.telefone_principal,
        f.email_principal,
        f.tipo_fornecedor,
        f.status_fornecedor,
        f.data_criacao
      FROM Fornecedor f
      WHERE ${whereClause}
      ORDER BY f.${safeOrderBy} ${safeOrderDir}
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countQuery = `SELECT COUNT(*) as total FROM Fornecedor f WHERE ${whereClause}`;

    const [fornecedores] = await mysql.execute(fornecedoresQuery, queryParams);
    const [countResult] = await mysql.execute(countQuery, queryParams);
    const total = (countResult as any[])[0]?.total || 0;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      fornecedores,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });

  } catch (error) {
    console.error('Erro ao buscar fornecedores:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}