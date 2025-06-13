import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import mysql from '@/lib/db/mysql';
import { DocumentosFilter } from '@/types/documento';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ erro: 'Token de acesso requerido' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { usuarioId: string; empresaId: string };
    
    if (!decoded.empresaId) {
      return NextResponse.json({ erro: 'Token inválido: empresaId não encontrado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = (page - 1) * limit;

    const filters: DocumentosFilter = {
      fornecedor_id: (() => {
        const value = searchParams.get('fornecedor_id');
        return value && value.trim() !== '' ? value : undefined;
      })(),
      tipo_documento: (() => {
        const value = searchParams.get('tipo_documento');
        return value && value.trim() !== '' ? value as DocumentosFilter['tipo_documento'] : undefined;
      })(),
      status_documento: (() => {
        const value = searchParams.get('status_documento');
        return value && value.trim() !== '' ? value as DocumentosFilter['status_documento'] : undefined;
      })(),
      data_emissao_inicio: (() => {
        const value = searchParams.get('data_emissao_inicio');
        return value && value.trim() !== '' ? value : undefined;
      })(),
      data_emissao_fim: (() => {
        const value = searchParams.get('data_emissao_fim');
        return value && value.trim() !== '' ? value : undefined;
      })(),
      data_vencimento_inicio: (() => {
        const value = searchParams.get('data_vencimento_inicio');
        return value && value.trim() !== '' ? value : undefined;
      })(),
      data_vencimento_fim: (() => {
        const value = searchParams.get('data_vencimento_fim');
        return value && value.trim() !== '' ? value : undefined;
      })(),
      numero_documento: (() => {
        const value = searchParams.get('numero_documento');
        return value && value.trim() !== '' ? value : undefined;
      })()
    };

    const whereConditions = ['d.empresa_id = ?'];
    const queryParams: unknown[] = [decoded.empresaId];

    if (filters.fornecedor_id) {
      whereConditions.push('d.fornecedor_id = ?');
      queryParams.push(filters.fornecedor_id);
    }

    if (filters.tipo_documento) {
      whereConditions.push('d.tipo_documento = ?');
      queryParams.push(filters.tipo_documento);
    }

    if (filters.status_documento) {
      whereConditions.push('d.status_documento = ?');
      queryParams.push(filters.status_documento);
    }

    if (filters.data_emissao_inicio) {
      whereConditions.push('d.data_emissao >= ?');
      queryParams.push(filters.data_emissao_inicio);
    }

    if (filters.data_emissao_fim) {
      whereConditions.push('d.data_emissao <= ?');
      queryParams.push(filters.data_emissao_fim);
    }

    if (filters.data_vencimento_inicio) {
      whereConditions.push('d.data_vencimento >= ?');
      queryParams.push(filters.data_vencimento_inicio);
    }

    if (filters.data_vencimento_fim) {
      whereConditions.push('d.data_vencimento <= ?');
      queryParams.push(filters.data_vencimento_fim);
    }

    if (filters.numero_documento) {
      whereConditions.push('d.numero_documento LIKE ?');
      queryParams.push(`%${filters.numero_documento}%`);
    }

    const whereClause = whereConditions.join(' AND ');

    const documentsQuery = `
      SELECT 
        d.*,
        f.nome_fantasia as fornecedor_nome,
        u.nome_usuario as usuario_nome
      FROM DocumentoCobranca d
      INNER JOIN Fornecedor f ON d.fornecedor_id = f.fornecedor_id
      INNER JOIN Usuario u ON d.usuario_registro_id = u.usuario_id
      WHERE ${whereClause}
      ORDER BY d.data_registro DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM DocumentoCobranca d
      WHERE ${whereClause}
    `;

    // Ensure all parameters are defined
    const allParams = queryParams;
    const hasUndefined = allParams.some(param => param === undefined);
    const hasNaN = allParams.some(param => typeof param === 'number' && isNaN(param));
    
    
    if (hasUndefined) {
      console.error('Undefined parameters found:', allParams);
      return NextResponse.json({ erro: 'Parâmetros contêm valores undefined' }, { status: 400 });
    }
    
    if (hasNaN) {
      console.error('NaN parameters found:', allParams);
      return NextResponse.json({ erro: 'Parâmetros contêm valores NaN' }, { status: 400 });
    }

    const [documents] = await mysql.execute(documentsQuery, queryParams);
    const [countResult] = await mysql.execute(countQuery, queryParams);

    const total = (countResult as { total: number }[])[0].total;
    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      documentos: documents,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });

  } catch (error) {
    console.error('Erro ao listar documentos:', error);
    return NextResponse.json({ erro: 'Erro interno do servidor' }, { status: 500 });
  }
}