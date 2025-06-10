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
    
    connection = await pool.getConnection();
    
    // Total de empresas
    const [totalEmpresas] = await connection.execute(
      'SELECT COUNT(*) as total FROM Empresa'
    ) as any;
    
    // Empresas ativas vs inativas
    const [statusEmpresas] = await connection.execute(
      'SELECT status_empresa, COUNT(*) as count FROM Empresa GROUP BY status_empresa'
    ) as any;
    
    // Empresas por plano
    const [empresasPorPlano] = await connection.execute(`
      SELECT p.nome_plano, COUNT(e.empresa_id) as count 
      FROM PlanoAssinatura p 
      LEFT JOIN Empresa e ON p.plano_id = e.plano_assinatura_id 
      GROUP BY p.plano_id, p.nome_plano
      ORDER BY count DESC
    `) as any;
    
    // Fornecedores ativos
    const [totalFornecedores] = await connection.execute(
      'SELECT COUNT(*) as total FROM Fornecedor WHERE status_fornecedor = "Ativo"'
    ) as any;
    
    // Documentos por status
    const [documentosPorStatus] = await connection.execute(
      'SELECT status_documento, COUNT(*) as count FROM DocumentoCobranca GROUP BY status_documento'
    ) as any;
    
    // Valor total em documentos
    const [valorDocumentos] = await connection.execute(
      'SELECT SUM(valor_liquido) as total FROM DocumentoCobranca WHERE status_documento != "Cancelado"'
    ) as any;
    
    // Empresas criadas por mês (últimos 6 meses)
    const [empresasPorMes] = await connection.execute(`
      SELECT 
        YEAR(data_criacao) as ano,
        MONTH(data_criacao) as mes,
        COUNT(*) as count
      FROM Empresa 
      WHERE data_criacao >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY YEAR(data_criacao), MONTH(data_criacao)
      ORDER BY ano DESC, mes DESC
    `) as any;
    
    // Empresas por estado
    const [empresasPorEstado] = await connection.execute(`
      SELECT endereco_estado_uf as estado, COUNT(*) as count 
      FROM Empresa 
      GROUP BY endereco_estado_uf 
      ORDER BY count DESC 
      LIMIT 10
    `) as any;
    
    // Últimas empresas criadas
    const [ultimasEmpresas] = await connection.execute(`
      SELECT 
        e.empresa_id,
        e.nome_fantasia,
        e.endereco_cidade,
        e.endereco_estado_uf,
        e.data_criacao,
        p.nome_plano
      FROM Empresa e
      LEFT JOIN PlanoAssinatura p ON e.plano_assinatura_id = p.plano_id
      ORDER BY e.data_criacao DESC
      LIMIT 5
    `) as any;
    
    // Próximos vencimentos (documentos)
    const [proximosVencimentos] = await connection.execute(`
      SELECT 
        d.documento_id,
        d.numero_documento,
        d.data_vencimento,
        d.valor_liquido,
        e.nome_fantasia as empresa,
        f.razao_social_nome as fornecedor
      FROM DocumentoCobranca d
      JOIN Empresa e ON d.empresa_id = e.empresa_id
      JOIN Fornecedor f ON d.fornecedor_id = f.fornecedor_id
      WHERE d.status_documento = 'Registrado' 
        AND d.data_vencimento BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)
      ORDER BY d.data_vencimento ASC
      LIMIT 10
    `) as any;
    
    return NextResponse.json({
      resumo: {
        totalEmpresas: totalEmpresas[0].total,
        totalFornecedores: totalFornecedores[0].total,
        valorDocumentos: valorDocumentos[0].total || 0
      },
      statusEmpresas,
      empresasPorPlano,
      documentosPorStatus,
      empresasPorMes,
      empresasPorEstado,
      ultimasEmpresas,
      proximosVencimentos
    });
    
  } catch (error: any) {
    console.error('Erro ao buscar estatísticas:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }
    
    return NextResponse.json({ 
      error: 'Erro ao buscar estatísticas' 
    }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}