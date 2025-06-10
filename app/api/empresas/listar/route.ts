import { NextResponse } from 'next/server';
import pool from '@/lib/db/mysql';
import jwt from 'jsonwebtoken';

export async function GET(request: Request) {
  let connection;
  
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    jwt.verify(token, process.env.JWT_SECRET!);
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const plano = searchParams.get('plano') || '';
    const orderBy = searchParams.get('orderBy') || 'nome_fantasia';
    const orderDir = searchParams.get('orderDir') || 'ASC';
    
    const offset = (page - 1) * limit;
    
    connection = await pool.getConnection();
    
    // Construir query com filtros
    let whereConditions = [];
    let filterParams = [];
    
    if (search) {
      whereConditions.push('(e.nome_fantasia LIKE ? OR e.razao_social LIKE ? OR e.cnpj LIKE ?)');
      filterParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    if (status) {
      whereConditions.push('e.status_empresa = ?');
      filterParams.push(status);
    }
    
    if (plano) {
      whereConditions.push('e.plano_assinatura_id = ?');
      filterParams.push(plano);
    }
    
    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Query para contar total de registros
    const [countResult] = await connection.execute(
      `SELECT COUNT(*) as total FROM Empresa e ${whereClause}`,
      filterParams
    ) as any;
    
    const total = countResult[0].total;
    
    // Query principal com ordenação e paginação
    const limitNumber = parseInt(limit.toString());
    const offsetNumber = parseInt(offset.toString());
    
    // Construir query final
    let finalQuery = `SELECT 
      e.empresa_id,
      e.nome_fantasia,
      e.razao_social,
      e.cnpj,
      e.endereco_cidade,
      e.endereco_estado_uf,
      e.telefone_contato,
      e.email_contato,
      e.status_empresa,
      e.data_criacao,
      p.nome_plano,
      u.nome_usuario as usuario_criador
    FROM Empresa e
    LEFT JOIN PlanoAssinatura p ON e.plano_assinatura_id = p.plano_id
    LEFT JOIN Usuario u ON e.usuario_criador_id = u.usuario_id
    ${whereClause}
    ORDER BY ${orderBy} ${orderDir}
    LIMIT ${limitNumber} OFFSET ${offsetNumber}`;

    console.log('Final query:', finalQuery);
    console.log('Filter params:', filterParams);
    
    const [empresas] = await connection.execute(finalQuery, filterParams) as any;
    
    // Formatar CNPJ para exibição
    const empresasFormatadas = empresas.map((empresa: any) => ({
      ...empresa,
      cnpj: empresa.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5')
    }));
    
    return NextResponse.json({
      empresas: empresasFormatadas,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
    
  } catch (error: any) {
    console.error('Erro ao listar empresas:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }
    
    return NextResponse.json({ 
      error: 'Erro ao listar empresas' 
    }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}