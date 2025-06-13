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
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { usuarioId: string; empresaId: string };
    
    // Query simples sem filtros
    const [allDocs] = await mysql.execute(
      'SELECT * FROM DocumentoCobranca'
    );
    
    // Query com empresa_id
    const [companyDocs] = await mysql.execute(
      'SELECT * FROM DocumentoCobranca WHERE empresa_id = ?',
      [decoded.empresaId]
    );
    
    // Contar total
    const [totalCount] = await mysql.execute(
      'SELECT COUNT(*) as total FROM DocumentoCobranca'
    );
    
    return NextResponse.json({
      decoded,
      totalDocuments: (totalCount as any[])[0].total,
      allDocuments: allDocs,
      companyDocuments: companyDocs,
      empresa_id_usado: decoded.empresaId
    });

  } catch (error) {
    console.error('Erro no teste:', error);
    return NextResponse.json({ erro: 'Erro no teste', detalhes: error }, { status: 500 });
  }
}