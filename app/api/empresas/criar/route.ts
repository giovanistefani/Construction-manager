import { NextResponse } from 'next/server';
import pool from '@/lib/db/mysql';
import { validarCNPJ, validarCEP, validarEmail, validarTelefone } from '@/lib/utils/validators';
import { v4 as uuidv4 } from 'uuid';
import jwt from 'jsonwebtoken';

export async function POST(request: Request) {
  let connection;
  
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Token não fornecido' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      console.log('Token decodificado:', decoded);
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
    console.log('Dados recebidos:', body);
    
    const {
      nome_fantasia,
      razao_social,
      cnpj,
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
    if (!nome_fantasia || !razao_social || !cnpj || !endereco_logradouro || 
        !endereco_numero || !endereco_bairro || !endereco_cidade || 
        !endereco_estado_uf || !endereco_cep || !telefone_contato || 
        !email_contato || !plano_assinatura_id) {
      return NextResponse.json({ 
        error: 'Todos os campos obrigatórios devem ser preenchidos' 
      }, { status: 400 });
    }

    // Validar CNPJ
    const cnpjLimpo = cnpj.replace(/[^\d]/g, '');
    if (!validarCNPJ(cnpjLimpo)) {
      return NextResponse.json({ error: 'CNPJ inválido' }, { status: 400 });
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

    // Verificar se CNPJ já existe
    const [empresaExistente] = await connection.execute(
      'SELECT empresa_id FROM Empresa WHERE cnpj = ?',
      [cnpjLimpo]
    ) as any;

    if (empresaExistente.length > 0) {
      return NextResponse.json({ 
        error: 'CNPJ já cadastrado no sistema' 
      }, { status: 400 });
    }

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

    // Criar empresa
    const empresa_id = uuidv4();
    const usuario_criador_id = decoded.usuarioId || decoded.userId || 'sistema';

    // Garantir que todos os valores estão definidos
    const parametros = [
      empresa_id,
      nome_fantasia || '',
      razao_social || '',
      cnpjLimpo || '',
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
      usuario_criador_id
    ];

    console.log('Parâmetros para inserção:', parametros.map((p, i) => `${i}: ${p}`));

    await connection.execute(
      `INSERT INTO Empresa (
        empresa_id,
        nome_fantasia,
        razao_social,
        cnpj,
        endereco_logradouro,
        endereco_numero,
        endereco_complemento,
        endereco_bairro,
        endereco_cidade,
        endereco_estado_uf,
        endereco_cep,
        telefone_contato,
        email_contato,
        plano_assinatura_id,
        usuario_criador_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      parametros
    );

    // Registrar na auditoria
    await connection.execute(
      `INSERT INTO AuditoriaLog (
        log_id,
        tabela_afetada,
        id_registro_afetado,
        usuario_id,
        tipo_acao,
        dados_novos
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      [
        uuidv4(),
        'Empresa',
        empresa_id,
        usuario_criador_id,
        'CREATE',
        JSON.stringify({
          nome_fantasia: nome_fantasia || '',
          razao_social: razao_social || '',
          cnpj: cnpjLimpo || ''
        })
      ]
    );

    return NextResponse.json({ 
      message: 'Empresa criada com sucesso',
      empresa_id 
    }, { status: 201 });

  } catch (error: any) {
    console.error('Erro ao criar empresa:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }
    
    return NextResponse.json({ 
      error: 'Erro ao criar empresa' 
    }, { status: 500 });
  } finally {
    if (connection) {
      connection.release();
    }
  }
}