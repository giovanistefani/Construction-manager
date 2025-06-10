import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import mysql from '@/lib/db/mysql';
import { v4 as uuidv4 } from 'uuid';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ erro: 'Token de acesso requerido' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // Verificar se documento existe e pertence à empresa
    const [documentCheck] = await mysql.execute(
      'SELECT documento_id FROM DocumentoCobranca WHERE documento_id = ? AND empresa_id = ?',
      [params.id, decoded.empresa_id]
    );

    if ((documentCheck as any[]).length === 0) {
      return NextResponse.json({ erro: 'Documento não encontrado' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ erro: 'Arquivo não fornecido' }, { status: 400 });
    }

    // Validar tipo de arquivo
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'text/xml', 'application/xml'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ erro: 'Tipo de arquivo não permitido' }, { status: 400 });
    }

    // Validar tamanho (10MB)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json({ erro: 'Arquivo muito grande. Máximo 10MB' }, { status: 400 });
    }

    // Determinar extensão
    const tipoArquivo = file.type === 'application/pdf' ? 'PDF' :
                      file.type === 'image/jpeg' ? 'JPG' :
                      file.type === 'image/png' ? 'PNG' : 'XML';

    // Criar diretório se não existir
    const uploadDir = path.join(process.cwd(), 'uploads', 'documentos', params.id);
    await mkdir(uploadDir, { recursive: true });

    // Gerar nome único para o arquivo
    const anexo_id = uuidv4();
    const fileName = `${anexo_id}.${tipoArquivo.toLowerCase()}`;
    const filePath = path.join(uploadDir, fileName);

    // Salvar arquivo
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Salvar no banco
    const relativePath = `uploads/documentos/${params.id}/${fileName}`;
    const tamanhoMB = file.size / (1024 * 1024);

    await mysql.execute(
      `INSERT INTO AnexoDocumento (
        anexo_id, documento_id, nome_arquivo, tipo_arquivo,
        caminho_armazenamento, tamanho_arquivo_mb, usuario_upload_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        anexo_id,
        params.id,
        file.name,
        tipoArquivo,
        relativePath,
        tamanhoMB,
        decoded.usuario_id
      ]
    );

    return NextResponse.json({
      anexo_id,
      nome_arquivo: file.name,
      tipo_arquivo: tipoArquivo,
      tamanho_arquivo_mb: tamanhoMB,
      message: 'Anexo enviado com sucesso'
    }, { status: 201 });

  } catch (error) {
    console.error('Erro ao fazer upload do anexo:', error);
    return NextResponse.json({ erro: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ erro: 'Token de acesso requerido' }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // Verificar se documento existe e pertence à empresa
    const [documentCheck] = await mysql.execute(
      'SELECT documento_id FROM DocumentoCobranca WHERE documento_id = ? AND empresa_id = ?',
      [params.id, decoded.empresa_id]
    );

    if ((documentCheck as any[]).length === 0) {
      return NextResponse.json({ erro: 'Documento não encontrado' }, { status: 404 });
    }

    const [anexos] = await mysql.execute(
      `SELECT 
        a.*,
        u.nome as usuario_nome
      FROM AnexoDocumento a
      INNER JOIN Usuario u ON a.usuario_upload_id = u.usuario_id
      WHERE a.documento_id = ?
      ORDER BY a.data_upload DESC`,
      [params.id]
    );

    return NextResponse.json({ anexos });

  } catch (error) {
    console.error('Erro ao buscar anexos:', error);
    return NextResponse.json({ erro: 'Erro interno do servidor' }, { status: 500 });
  }
}