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

    let whereConditions = ['f.status_fornecedor = "Ativo"'];
    let queryParams: any[] = [];

    // Always filter by empresa_id
    if (empresa_id) {
      whereConditions.push('f.empresa_id = ?');
      queryParams.push(empresa_id);
    } else {
      // Se não tiver empresa_id, retorna erro
      return NextResponse.json(
        { error: 'ID da empresa não encontrado no token' },
        { status: 400 }
      );
    }

    const whereClause = whereConditions.join(' AND ');

    // Query simplificada para select - apenas dados essenciais
    const fornecedoresQuery = `
      SELECT 
        f.fornecedor_id,
        COALESCE(f.nome_fantasia, f.razao_social_nome) as nome_fantasia,
        f.razao_social_nome,
        f.tipo_pessoa
      FROM Fornecedor f
      WHERE ${whereClause}
      ORDER BY COALESCE(f.nome_fantasia, f.razao_social_nome) ASC
    `;

    const [fornecedores] = await mysql.execute(fornecedoresQuery, queryParams);

    return NextResponse.json({
      fornecedores
    });

  } catch (error) {
    console.error('Erro ao buscar fornecedores simples:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}