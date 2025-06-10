import { NextRequest, NextResponse } from 'next/server';
import mysql from '@/lib/db/mysql';

export async function GET(request: NextRequest) {
  try {
    // Buscar todas as empresas ativas (sem autenticação para permitir acesso no cadastro)
    const [empresas] = await mysql.execute(`
      SELECT 
        empresa_id,
        nome_fantasia,
        razao_social,
        endereco_cidade,
        endereco_estado_uf
      FROM Empresa 
      WHERE status_empresa = 'Ativa'
      ORDER BY nome_fantasia ASC
    `);

    return NextResponse.json({
      empresas
    });

  } catch (error) {
    console.error('Erro ao buscar empresas:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}