import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import mysql from '@/lib/db/mysql';
import { v4 as uuidv4 } from 'uuid';
import { CreateDocumentoCobrancaData } from '@/types/documento';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ erro: 'Token de acesso requerido' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    // Normalizar campos do token
    const empresa_id = decoded.empresa_id || decoded.empresaId || decoded.empresa_principal_id;
    const usuario_id = decoded.usuario_id || decoded.usuarioId;

    const data: CreateDocumentoCobrancaData = await request.json();

    // Validações básicas
    if (!data.fornecedor_id || !data.tipo_documento || !data.numero_documento || 
        !data.data_emissao || !data.data_vencimento || !data.valor_bruto || 
        !data.descricao_historico) {
      return NextResponse.json({ erro: 'Campos obrigatórios não preenchidos' }, { status: 400 });
    }

    if (data.valor_bruto <= 0) {
      return NextResponse.json({ erro: 'Valor bruto deve ser maior que zero' }, { status: 400 });
    }

    if (new Date(data.data_vencimento) < new Date(data.data_emissao)) {
      return NextResponse.json({ erro: 'Data de vencimento deve ser igual ou posterior à data de emissão' }, { status: 400 });
    }

    // Verificar se fornecedor existe e pertence à empresa
    const [fornecedorCheck] = await mysql.execute(
      'SELECT fornecedor_id FROM Fornecedor WHERE fornecedor_id = ? AND empresa_id = ?',
      [data.fornecedor_id, empresa_id]
    );

    if ((fornecedorCheck as unknown[]).length === 0) {
      return NextResponse.json({ erro: 'Fornecedor não encontrado' }, { status: 404 });
    }

    // Verificar duplicidade
    const [duplicateCheck] = await mysql.execute(
      `SELECT documento_id FROM DocumentoCobranca 
       WHERE fornecedor_id = ? AND numero_documento = ? AND valor_bruto = ? 
       AND status_documento != 'Cancelado'`,
      [data.fornecedor_id, data.numero_documento, data.valor_bruto]
    );

    let isDuplicate = false;
    if ((duplicateCheck as unknown[]).length > 0) {
      isDuplicate = true;
    }

    const documento_id = uuidv4();

    await mysql.execute(
      `INSERT INTO DocumentoCobranca (
        documento_id, empresa_id, fornecedor_id, tipo_documento, numero_documento,
        data_emissao, data_vencimento, valor_bruto, descricao_historico,
        status_documento, usuario_registro_id, codigo_barras_boleto, linha_digitavel_boleto
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Registrado', ?, ?, ?)`,
      [
        documento_id,
        empresa_id,
        data.fornecedor_id,
        data.tipo_documento,
        data.numero_documento,
        data.data_emissao,
        data.data_vencimento,
        data.valor_bruto,
        data.descricao_historico,
        usuario_id,
        data.codigo_barras_boleto || null,
        data.linha_digitavel_boleto || null
      ]
    );

    return NextResponse.json({
      documento_id,
      isDuplicate,
      message: isDuplicate 
        ? 'Documento criado com sucesso. Possível duplicidade detectada.' 
        : 'Documento criado com sucesso'
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar documento:', error);
    return NextResponse.json({ erro: 'Erro interno do servidor' }, { status: 500 });
  }
}