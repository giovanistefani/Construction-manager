import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import jwt from 'jsonwebtoken';
import mysql from '@/lib/db/mysql';
import { validarCNPJ, validarCPF, validarEmail, validarTelefone, validarCEP, validarChavePIX } from '@/lib/utils/validators';
import { TIPOS_FORNECEDOR, REGIMES_TRIBUTARIOS } from '@/types/fornecedor';

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const resolvedParams = await params;
    const [fornecedor] = await mysql.execute(
      'SELECT * FROM Fornecedor WHERE fornecedor_id = ? AND empresa_id = ?',
      [resolvedParams.id, empresa_id]
    );

    if ((fornecedor as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Fornecedor não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      fornecedor: (fornecedor as any[])[0]
    });

  } catch (error) {
    console.error('Erro ao buscar fornecedor:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    const resolvedParams = await params;
    const data = await request.json();

    // Verificar se fornecedor existe
    const [fornecedorExists] = await mysql.execute(
      'SELECT fornecedor_id, tipo_pessoa FROM Fornecedor WHERE fornecedor_id = ? AND empresa_id = ?',
      [resolvedParams.id, empresa_id]
    );

    if ((fornecedorExists as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Fornecedor não encontrado' },
        { status: 404 }
      );
    }

    // Validações obrigatórias
    const requiredFields = [
      'tipo_pessoa',
      'regime_tributario',
      'endereco_logradouro',
      'endereco_numero',
      'endereco_bairro',
      'endereco_cidade',
      'endereco_estado_uf',
      'endereco_cep',
      'telefone_principal',
      'email_principal',
      'tipo_fornecedor'
    ];

    for (const field of requiredFields) {
      if (!data[field] || data[field].toString().trim() === '') {
        return NextResponse.json(
          { error: `Campo obrigatório não preenchido: ${field}` },
          { status: 400 }
        );
      }
    }

    // Validações específicas por tipo de pessoa
    if (data.tipo_pessoa === 'PJ') {
      if (!data.razao_social || data.razao_social.trim() === '') {
        return NextResponse.json(
          { error: 'Razão Social é obrigatória para Pessoa Jurídica' },
          { status: 400 }
        );
      }
      if (!data.cnpj || data.cnpj.trim() === '') {
        return NextResponse.json(
          { error: 'CNPJ é obrigatório para Pessoa Jurídica' },
          { status: 400 }
        );
      }
      if (!validarCNPJ(data.cnpj)) {
        return NextResponse.json(
          { error: 'CNPJ inválido' },
          { status: 400 }
        );
      }
    } else if (data.tipo_pessoa === 'PF') {
      if (!data.nome_completo || data.nome_completo.trim() === '') {
        return NextResponse.json(
          { error: 'Nome Completo é obrigatório para Pessoa Física' },
          { status: 400 }
        );
      }
      if (!data.cpf || data.cpf.trim() === '') {
        return NextResponse.json(
          { error: 'CPF é obrigatório para Pessoa Física' },
          { status: 400 }
        );
      }
      if (!validarCPF(data.cpf)) {
        return NextResponse.json(
          { error: 'CPF inválido' },
          { status: 400 }
        );
      }
    }

    // Validar formato de campos
    if (!validarEmail(data.email_principal)) {
      return NextResponse.json(
        { error: 'Email principal inválido' },
        { status: 400 }
      );
    }

    if (data.email_secundario && !validarEmail(data.email_secundario)) {
      return NextResponse.json(
        { error: 'Email secundário inválido' },
        { status: 400 }
      );
    }

    if (!validarTelefone(data.telefone_principal)) {
      return NextResponse.json(
        { error: 'Telefone principal inválido' },
        { status: 400 }
      );
    }

    if (data.telefone_secundario && !validarTelefone(data.telefone_secundario)) {
      return NextResponse.json(
        { error: 'Telefone secundário inválido' },
        { status: 400 }
      );
    }

    if (!validarCEP(data.endereco_cep)) {
      return NextResponse.json(
        { error: 'CEP inválido' },
        { status: 400 }
      );
    }

    if (data.chave_pix && !validarChavePIX(data.chave_pix)) {
      return NextResponse.json(
        { error: 'Chave PIX inválida' },
        { status: 400 }
      );
    }

    // Verificar duplicação de CNPJ/CPF usando o campo cnpj_cpf (excluindo o próprio fornecedor)
    const documentoLimpo = data.tipo_pessoa === 'PJ' 
      ? data.cnpj.replace(/[^\d]/g, '')
      : data.cpf.replace(/[^\d]/g, '');

    const [documentoExists] = await mysql.execute(
      'SELECT fornecedor_id FROM Fornecedor WHERE cnpj_cpf = ? AND fornecedor_id != ? AND empresa_id = ? AND status_fornecedor = "Ativo"',
      [documentoLimpo, resolvedParams.id, empresa_id]
    );
    
    if ((documentoExists as any[]).length > 0) {
      const tipoDoc = data.tipo_pessoa === 'PJ' ? 'CNPJ' : 'CPF';
      return NextResponse.json(
        { error: `${tipoDoc} já cadastrado no sistema` },
        { status: 400 }
      );
    }

    // Preparar dados para atualização
    const razaoSocialNome = data.tipo_pessoa === 'PJ' 
      ? (data.nome_fantasia || data.razao_social)
      : data.nome_completo;

    const cnpjCpf = data.tipo_pessoa === 'PJ' 
      ? data.cnpj.replace(/[^\d]/g, '')
      : data.cpf.replace(/[^\d]/g, '');

    // Atualizar fornecedor
    const updateQuery = `
      UPDATE Fornecedor SET
        tipo_pessoa = ?, razao_social_nome = ?, razao_social = ?, nome_completo = ?, nome_fantasia = ?,
        cnpj_cpf = ?, cnpj = ?, cpf = ?, inscricao_estadual = ?, inscricao_municipal = ?, regime_tributario = ?,
        endereco_logradouro = ?, endereco_numero = ?, endereco_complemento = ?, endereco_bairro = ?,
        endereco_cidade = ?, endereco_estado_uf = ?, endereco_cep = ?,
        telefone_principal = ?, telefone_secundario = ?, email_principal = ?, email_secundario = ?,
        banco = ?, agencia = ?, conta_corrente = ?, tipo_conta = ?, chave_pix = ?,
        tipo_fornecedor = ?
      WHERE fornecedor_id = ? AND empresa_id = ?
    `;

    const updateParams = [
      data.tipo_pessoa,
      razaoSocialNome,
      data.tipo_pessoa === 'PJ' ? data.razao_social : null,
      data.tipo_pessoa === 'PF' ? data.nome_completo : null,
      data.nome_fantasia || null,
      cnpjCpf,
      data.tipo_pessoa === 'PJ' ? data.cnpj.replace(/[^\d]/g, '') : null,
      data.tipo_pessoa === 'PF' ? data.cpf.replace(/[^\d]/g, '') : null,
      data.inscricao_estadual || null,
      data.inscricao_municipal || null,
      data.regime_tributario,
      data.endereco_logradouro,
      data.endereco_numero,
      data.endereco_complemento || null,
      data.endereco_bairro,
      data.endereco_cidade,
      data.endereco_estado_uf,
      data.endereco_cep.replace(/[^\d]/g, ''),
      data.telefone_principal.replace(/[^\d]/g, ''),
      data.telefone_secundario ? data.telefone_secundario.replace(/[^\d]/g, '') : null,
      data.email_principal,
      data.email_secundario || null,
      data.banco || null,
      data.agencia || null,
      data.conta_corrente || null,
      data.tipo_conta || null,
      data.chave_pix || null,
      data.tipo_fornecedor,
      resolvedParams.id,
      empresa_id
    ];

    const [result] = await mysql.execute(updateQuery, updateParams);

    return NextResponse.json(
      { message: 'Fornecedor atualizado com sucesso' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erro ao atualizar fornecedor:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    const resolvedParams = await params;
    const data = await request.json();

    if (!resolvedParams.id || resolvedParams.id === 'undefined') {
      return NextResponse.json(
        { error: 'ID do fornecedor inválido' },
        { status: 400 }
      );
    }

    // Verificar se fornecedor existe
    const [fornecedorExists] = await mysql.execute(
      'SELECT fornecedor_id FROM Fornecedor WHERE fornecedor_id = ? AND empresa_id = ?',
      [resolvedParams.id, empresa_id]
    );

    if ((fornecedorExists as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Fornecedor não encontrado' },
        { status: 404 }
      );
    }

    // Atualizar apenas o status
    if (data.status) {
      const [result] = await mysql.execute(
        'UPDATE Fornecedor SET status_fornecedor = ?, data_atualizacao = NOW() WHERE fornecedor_id = ? AND empresa_id = ?',
        [data.status, resolvedParams.id, empresa_id]
      );

      return NextResponse.json(
        { message: 'Status do fornecedor atualizado com sucesso' },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: 'Nenhum campo válido para atualização' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Erro ao atualizar status do fornecedor:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const resolvedParams = await params;

    // Verificar se fornecedor existe
    const [fornecedorExists] = await mysql.execute(
      'SELECT fornecedor_id FROM Fornecedor WHERE fornecedor_id = ? AND empresa_id = ?',
      [resolvedParams.id, empresa_id]
    );

    if ((fornecedorExists as any[]).length === 0) {
      return NextResponse.json(
        { error: 'Fornecedor não encontrado' },
        { status: 404 }
      );
    }

    // Exclusão lógica - apenas inativar
    const [result] = await mysql.execute(
      'UPDATE Fornecedor SET status_fornecedor = "Inativo", data_atualizacao = NOW() WHERE fornecedor_id = ? AND empresa_id = ?',
      [resolvedParams.id, empresa_id]
    );

    return NextResponse.json(
      { message: 'Fornecedor removido com sucesso' },
      { status: 200 }
    );

  } catch (error) {
    console.error('Erro ao remover fornecedor:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}