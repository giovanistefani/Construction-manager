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
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { usuario_id: string; empresa_id: string };

    const { searchParams } = new URL(request.url);
    const fornecedor_id = searchParams.get('fornecedor_id');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const whereConditions = ['a.empresa_id = ?'];
    const queryParams: (string | number)[] = [decoded.empresa_id];

    if (fornecedor_id) {
      whereConditions.push('a.fornecedor_id = ?');
      queryParams.push(fornecedor_id);
    }

    if (status) {
      whereConditions.push('a.status_adiantamento = ?');
      queryParams.push(status);
    }

    const whereClause = whereConditions.join(' AND ');

    const adiantamentosQuery = `
      SELECT 
        a.*,
        f.nome_fantasia as fornecedor_nome
      FROM AdiantamentoFornecedor a
      INNER JOIN Fornecedor f ON a.fornecedor_id = f.fornecedor_id
      WHERE ${whereClause}
      ORDER BY a.data_adiantamento DESC
      LIMIT ? OFFSET ?
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM AdiantamentoFornecedor a
      WHERE ${whereClause}
    `;

    // Garantir que não temos undefined nos parâmetros
    const finalQueryParams = [...queryParams, limit, offset];
    
    const [adiantamentos] = await mysql.execute(adiantamentosQuery, finalQueryParams);
    const [countResult] = await mysql.execute(countQuery, queryParams);

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