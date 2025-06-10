import { NextResponse } from 'next/server';
import pool from '@/lib/db/mysql';
import { validarCEP, validarEmail, validarTelefone } from '@/lib/utils/validators';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

// GET - Obter detalhes de uma empresa
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let connection;
  
  try {
    const { id } = await params;
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    try {
      jwt.verify(token, process.env.JWT_SECRET!);
    } catch (tokenError: any) {
      if (tokenError.name === 'TokenExpiredError') {
        return NextResponse.json({ 
          error: 'Sessão expirada. Faça login novamente.',
          code: 'TOKEN_EXPIRED'
        }, { status: 401 });
      }
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }
    
    connection = await pool.getConnection();
    
    const [empresas] = await connection.execute(
      `SELECT 
        e.*,
        p.nome_plano,
        u.nome_usuario as usuario_criador
      FROM Empresa e
      LEFT JOIN PlanoAssinatura p ON e.plano_assinatura_id = p.plano_id
      LEFT JOIN Usuario u ON e.usuario_criador_id = u.usuario_id
      WHERE e.empresa_id = ?`,
      [id]
    ) as any;
    
    if (empresas.length === 0) {
      return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 });
    }
    
    const empresa = empresas[0];
    empresa.cnpj = empresa.cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    
    return NextResponse.json(empresa);
    
  } catch (error: any) {
    console.error('Erro ao buscar empresa:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }
    
    return NextResponse.json({ 
      error: 'Erro ao buscar empresa' 
    }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// PUT - Editar empresa
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let connection;
  
  try {
    const { id } = await params;
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    } catch (tokenError: any) {
      if (tokenError.name === 'TokenExpiredError') {
        return NextResponse.json({ 
          error: 'Sessão expirada. Faça login novamente.',
          code: 'TOKEN_EXPIRED'
        }, { status: 401 });
      }
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }
    
    const body = await request.json();
    const {
      nome_fantasia,
      razao_social,
      endereco_logradouro,
      endereco_numero,
      endereco_complemento,
      endereco_bairro,
      endereco_cidade,
      endereco_estado_uf,
      endereco_cep,
      telefone_contato,
      email_contato,
      plano_assinatura_id
    } = body;

    // Validações
    if (!nome_fantasia || !razao_social || !endereco_logradouro || 
        !endereco_numero || !endereco_bairro || !endereco_cidade || 
        !endereco_estado_uf || !endereco_cep || !telefone_contato || 
        !email_contato || !plano_assinatura_id) {
      return NextResponse.json({ 
        error: 'Todos os campos obrigatórios devem ser preenchidos' 
      }, { status: 400 });
    }

    // Validar CEP
    if (!validarCEP(endereco_cep)) {
      return NextResponse.json({ error: 'CEP inválido' }, { status: 400 });
    }

    // Validar Email
    if (!validarEmail(email_contato)) {
      return NextResponse.json({ error: 'Email inválido' }, { status: 400 });
    }

    // Validar Telefone
    if (!validarTelefone(telefone_contato)) {
      return NextResponse.json({ error: 'Telefone inválido' }, { status: 400 });
    }

    connection = await pool.getConnection();

    // Verificar se empresa existe
    const [empresaExistente] = await connection.execute(
      'SELECT * FROM Empresa WHERE empresa_id = ?',
      [id]
    ) as any;

    if (empresaExistente.length === 0) {
      return NextResponse.json({ 
        error: 'Empresa não encontrada' 
      }, { status: 404 });
    }

    const dadosAntigos = empresaExistente[0];

    // Verificar se o plano existe
    const [planoExiste] = await connection.execute(
      'SELECT plano_id FROM PlanoAssinatura WHERE plano_id = ?',
      [plano_assinatura_id]
    ) as any;

    if (planoExiste.length === 0) {
      return NextResponse.json({ 
        error: 'Plano de assinatura inválido' 
      }, { status: 400 });
    }

    // Atualizar empresa
    const updateParams = [
      nome_fantasia || '',
      razao_social || '',
      endereco_logradouro || '',
      endereco_numero || '',
      endereco_complemento || null,
      endereco_bairro || '',
      endereco_cidade || '',
      (endereco_estado_uf || '').toUpperCase(),
      (endereco_cep || '').replace(/[^\d]/g, ''),
      telefone_contato || '',
      email_contato || '',
      plano_assinatura_id || '',
      id
    ];

    console.log('Update params:', updateParams);

    await connection.execute(
      `UPDATE Empresa SET
        nome_fantasia = ?,
        razao_social = ?,
        endereco_logradouro = ?,
        endereco_numero = ?,
        endereco_complemento = ?,
        endereco_bairro = ?,
        endereco_cidade = ?,
        endereco_estado_uf = ?,
        endereco_cep = ?,
        telefone_contato = ?,
        email_contato = ?,
        plano_assinatura_id = ?
      WHERE empresa_id = ?`,
      updateParams
    );

    // Registrar na auditoria
    await connection.execute(
      `INSERT INTO AuditoriaLog (
        log_id,
        tabela_afetada,
        id_registro_afetado,
        usuario_id,
        tipo_acao,
        dados_antigos,
        dados_novos
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        'Empresa',
        id,
        decoded.usuarioId || decoded.userId || 'sistema',
        'UPDATE',
        JSON.stringify({
          nome_fantasia: dadosAntigos.nome_fantasia || '',
          email_contato: dadosAntigos.email_contato || '',
          plano_assinatura_id: dadosAntigos.plano_assinatura_id || ''
        }),
        JSON.stringify({
          nome_fantasia: nome_fantasia || '',
          email_contato: email_contato || '',
          plano_assinatura_id: plano_assinatura_id || ''
        })
      ]
    );

    return NextResponse.json({ 
      message: 'Empresa atualizada com sucesso' 
    });

  } catch (error: any) {
    console.error('Erro ao atualizar empresa:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }
    
    return NextResponse.json({ 
      error: 'Erro ao atualizar empresa' 
    }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

// PATCH - Ativar/Desativar empresa
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  let connection;
  
  try {
    const { id } = await params;
    
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    } catch (tokenError: any) {
      if (tokenError.name === 'TokenExpiredError') {
        return NextResponse.json({ 
          error: 'Sessão expirada. Faça login novamente.',
          code: 'TOKEN_EXPIRED'
        }, { status: 401 });
      }
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }
    
    const { status } = await request.json();
    
    if (!status || !['Ativa', 'Inativa'].includes(status)) {
      return NextResponse.json({ 
        error: 'Status inválido. Use "Ativa" ou "Inativa"' 
      }, { status: 400 });
    }
    
    connection = await pool.getConnection();
    
    // Verificar se empresa existe
    const [empresaExistente] = await connection.execute(
      'SELECT status_empresa FROM Empresa WHERE empresa_id = ?',
      [id]
    ) as any;

    if (empresaExistente.length === 0) {
      return NextResponse.json({ 
        error: 'Empresa não encontrada' 
      }, { status: 404 });
    }
    
    const statusAnterior = empresaExistente[0].status_empresa;
    
    // Atualizar status
    await connection.execute(
      'UPDATE Empresa SET status_empresa = ? WHERE empresa_id = ?',
      [status, id]
    );
    
    // Registrar na auditoria
    const acao = status === 'Ativa' ? 'ACTIVATED' : 'DEACTIVATED';
    await connection.execute(
      `INSERT INTO AuditoriaLog (
        log_id,
        tabela_afetada,
        id_registro_afetado,
        usuario_id,
        tipo_acao,
        dados_antigos,
        dados_novos
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        'Empresa',
        id,
        decoded.usuarioId || decoded.userId || 'sistema',
        acao,
        JSON.stringify({ status_empresa: statusAnterior || '' }),
        JSON.stringify({ status_empresa: status || '' })
      ]
    );
    
    return NextResponse.json({ 
      message: `Empresa ${status === 'Ativa' ? 'ativada' : 'desativada'} com sucesso` 
    });
    
  } catch (error: any) {
    console.error('Erro ao alterar status da empresa:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }
    
    return NextResponse.json({ 
      error: 'Erro ao alterar status da empresa' 
    }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}