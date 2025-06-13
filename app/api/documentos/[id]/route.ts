import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import mysql from '@/lib/db/mysql';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params;
    const [documents] = await mysql.execute(
      `SELECT 
        d.*,
        f.nome_fantasia as fornecedor_nome,
        u.nome_usuario as usuario_nome
      FROM DocumentoCobranca d
      INNER JOIN Fornecedor f ON d.fornecedor_id = f.fornecedor_id
      INNER JOIN Usuario u ON d.usuario_registro_id = u.usuario_id
      WHERE d.documento_id = ? AND d.empresa_id = ?`,
      [resolvedParams.id, decoded.empresaId]
    );

    if ((documents as any[]).length === 0) {
      return NextResponse.json({ erro: 'Documento não encontrado' }, { status: 404 });
    }

    // Buscar anexos
    const [anexos] = await mysql.execute(
      `SELECT * FROM AnexoDocumento WHERE documento_id = ? ORDER BY data_upload DESC`,
      [resolvedParams.id]
    );

    const documento = (documents as any[])[0];
    documento.anexos = anexos;

    return NextResponse.json(documento);

  } catch (error) {
    console.error('Erro ao buscar documento:', error);
    return NextResponse.json({ erro: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const data = await request.json();

    const resolvedParams = await params;
    // Verificar se documento existe e pertence à empresa
    const [existingDoc] = await mysql.execute(
      'SELECT status_documento FROM DocumentoCobranca WHERE documento_id = ? AND empresa_id = ?',
      [resolvedParams.id, decoded.empresaId]
    );

    if ((existingDoc as any[]).length === 0) {
      return NextResponse.json({ erro: 'Documento não encontrado' }, { status: 404 });
    }

    const currentStatus = (existingDoc as any[])[0].status_documento;
    if (currentStatus === 'Pago' || currentStatus === 'Cancelado') {
      return NextResponse.json({ erro: 'Documento não pode ser editado' }, { status: 400 });
    }

    // Validações básicas
    if (data.valor_bruto && data.valor_bruto <= 0) {
      return NextResponse.json({ erro: 'Valor bruto deve ser maior que zero' }, { status: 400 });
    }

    if (data.data_emissao && data.data_vencimento && 
        new Date(data.data_vencimento) < new Date(data.data_emissao)) {
      return NextResponse.json({ erro: 'Data de vencimento deve ser igual ou posterior à data de emissão' }, { status: 400 });
    }

    // Construir query de update dinamicamente
    const updateFields = [];
    const updateValues = [];

    const allowedFields = [
      'tipo_documento', 'numero_documento', 'data_emissao', 'data_vencimento',
      'valor_bruto', 'descricao_historico', 'status_documento',
      'codigo_barras_boleto', 'linha_digitavel_boleto'
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateValues.push(data[field]);
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ erro: 'Nenhum campo para atualizar' }, { status: 400 });
    }

    updateValues.push(resolvedParams.id, decoded.empresaId);

    await mysql.execute(
      `UPDATE DocumentoCobranca SET ${updateFields.join(', ')} 
       WHERE documento_id = ? AND empresa_id = ?`,
      updateValues
    );

    return NextResponse.json({ message: 'Documento atualizado com sucesso' });

  } catch (error) {
    console.error('Erro ao atualizar documento:', error);
    return NextResponse.json({ erro: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const resolvedParams = await params;
    // Verificar se documento existe e pode ser cancelado
    const [existingDoc] = await mysql.execute(
      'SELECT status_documento FROM DocumentoCobranca WHERE documento_id = ? AND empresa_id = ?',
      [resolvedParams.id, decoded.empresaId]
    );

    if ((existingDoc as any[]).length === 0) {
      return NextResponse.json({ erro: 'Documento não encontrado' }, { status: 404 });
    }

    const currentStatus = (existingDoc as any[])[0].status_documento;
    if (currentStatus === 'Pago' || currentStatus === 'Parcialmente Pago') {
      return NextResponse.json({ erro: 'Documento com pagamentos não pode ser cancelado' }, { status: 400 });
    }

    await mysql.execute(
      'UPDATE DocumentoCobranca SET status_documento = "Cancelado" WHERE documento_id = ? AND empresa_id = ?',
      [resolvedParams.id, decoded.empresaId]
    );

    return NextResponse.json({ message: 'Documento cancelado com sucesso' });

  } catch (error) {
    console.error('Erro ao cancelar documento:', error);
    return NextResponse.json({ erro: 'Erro interno do servidor' }, { status: 500 });
  }
}