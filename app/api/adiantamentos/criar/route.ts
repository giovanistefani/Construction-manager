import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import mysql from '@/lib/db/mysql';
import { v4 as uuidv4 } from 'uuid';
import { CreateAdiantamentoData } from '@/types/documento';

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ erro: 'Token de acesso requerido' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { usuario_id: string; empresa_id: string };

    const data: CreateAdiantamentoData = await request.json();

    // Validações básicas
    if (!data.fornecedor_id || !data.data_adiantamento || !data.valor_adiantamento || !data.descricao_historico) {
      return NextResponse.json({ erro: 'Campos obrigatórios não preenchidos' }, { status: 400 });
    }

    if (data.valor_adiantamento <= 0) {
      return NextResponse.json({ erro: 'Valor do adiantamento deve ser maior que zero' }, { status: 400 });
    }

    // Verificar se fornecedor existe e pertence à empresa
    const [fornecedorCheck] = await mysql.execute(
      'SELECT fornecedor_id FROM Fornecedor WHERE fornecedor_id = ? AND empresa_id = ?',
      [data.fornecedor_id, decoded.empresa_id]
    );

    if ((fornecedorCheck as unknown[]).length === 0) {
      return NextResponse.json({ erro: 'Fornecedor não encontrado' }, { status: 404 });
    }

    const adiantamento_id = uuidv4();

    await mysql.execute(
      `INSERT INTO AdiantamentoFornecedor (
        adiantamento_id, empresa_id, fornecedor_id, data_adiantamento,
        valor_adiantamento, saldo_restante, descricao_historico, status_adiantamento
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Ativo')`,
      [
        adiantamento_id,
        decoded.empresa_id,
        data.fornecedor_id,
        data.data_adiantamento,
        data.valor_adiantamento,
        data.valor_adiantamento, // saldo inicial = valor total
        data.descricao_historico
      ]
    );

    return NextResponse.json({
      adiantamento_id,
      message: 'Adiantamento registrado com sucesso'
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao criar adiantamento:', error);
    return NextResponse.json({ erro: 'Erro interno do servidor' }, { status: 500 });
  }
}