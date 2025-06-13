import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import mysql from '@/lib/db/mysql';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ erro: 'Token de acesso requerido' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Normalizar campos do token
    const empresa_id = decoded.empresa_id || decoded.empresaId || decoded.empresa_principal_id;
    const usuario_id = decoded.usuario_id || decoded.usuarioId;

    const { searchParams } = new URL(request.url);
    const fornecedor_id = searchParams.get('fornecedor_id');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const whereConditions = ['a.empresa_id = ?'];
    const queryParams: (string | number)[] = [empresa_id];

    if (fornecedor_id && fornecedor_id !== '') {
      whereConditions.push('a.fornecedor_id = ?');
      queryParams.push(fornecedor_id);
    }

    if (status && status !== '') {
      whereConditions.push('a.status_adiantamento = ?');
      queryParams.push(status);
    }

    const whereClause = whereConditions.join(' AND ');

    const baseQuery = `
      SELECT 
        a.*,
        COALESCE(f.nome_fantasia, f.razao_social_nome) as fornecedor_nome
      FROM AdiantamentoFornecedor a
      INNER JOIN Fornecedor f ON a.fornecedor_id = f.fornecedor_id
      WHERE ${whereClause}
    `;

    const adiantamentosQuery = `${baseQuery} ORDER BY a.data_adiantamento DESC LIMIT ${limit} OFFSET ${offset}`;
    const countQuery = `SELECT COUNT(*) as total FROM AdiantamentoFornecedor a WHERE ${whereClause}`;

    // Filtrar parâmetros undefined
    const cleanParams = queryParams.filter(param => param !== undefined && param !== null);
    
    const [adiantamentos] = await mysql.execute(adiantamentosQuery, cleanParams);
    const [countResult] = await mysql.execute(countQuery, cleanParams);

    const total = (countResult as { total: number }[])[0].total;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      adiantamentos,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });

  } catch (error) {
    console.error('Erro ao listar adiantamentos:', error);
    return NextResponse.json({ erro: 'Erro interno do servidor' }, { status: 500 });
  }
}