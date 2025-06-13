import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import mysql from '@/lib/db/mysql';
import { XMLImportData } from '@/types/documento';

export async function POST(request: NextRequest) {
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

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ erro: 'Arquivo XML não fornecido' }, { status: 400 });
    }

    // Validar se é XML
    if (!file.type.includes('xml') && !file.name.toLowerCase().endsWith('.xml')) {
      return NextResponse.json({ erro: 'Arquivo deve ser um XML válido' }, { status: 400 });
    }

    const xmlContent = await file.text();

    // Parse básico do XML (seria melhor usar uma biblioteca como xml2js)
    const xmlData = parseXMLBasic(xmlContent);

    if (!xmlData) {
      return NextResponse.json({ erro: 'XML inválido ou formato não reconhecido' }, { status: 400 });
    }

    // Tentar encontrar fornecedor pelo CNPJ
    let fornecedor_id = null;
    if (xmlData.fornecedor_cnpj) {
      const [fornecedorResult] = await mysql.execute(
        'SELECT fornecedor_id FROM Fornecedor WHERE cnpj = ? AND empresa_id = ?',
        [xmlData.fornecedor_cnpj, decoded.empresaId]
      );

      if ((fornecedorResult as any[]).length > 0) {
        fornecedor_id = (fornecedorResult as any[])[0].fornecedor_id;
      }
    }

    return NextResponse.json({
      xmlData: {
        ...xmlData,
        fornecedor_id
      },
      fornecedor_encontrado: !!fornecedor_id,
      message: fornecedor_id 
        ? 'XML processado com sucesso. Fornecedor encontrado automaticamente.'
        : 'XML processado com sucesso. Selecione o fornecedor manualmente.'
    });

  } catch (error) {
    console.error('Erro ao processar XML:', error);
    return NextResponse.json({ erro: 'Erro ao processar XML' }, { status: 500 });
  }
}

function parseXMLBasic(xmlContent: string): XMLImportData | null {
  try {
    // Parse simples para NFe - em produção usar xml2js ou similar
    const numeroMatch = xmlContent.match(/<nNF>(\d+)<\/nNF>/);
    const dataEmissaoMatch = xmlContent.match(/<dhEmi>([^<]+)<\/dhEmi>/);
    const dataVencimentoMatch = xmlContent.match(/<dVenc>([^<]+)<\/dVenc>/);
    const valorMatch = xmlContent.match(/<vNF>([^<]+)<\/vNF>/);
    const cnpjMatch = xmlContent.match(/<CNPJ>(\d+)<\/CNPJ>/);
    const descricaoMatch = xmlContent.match(/<xProd>([^<]+)<\/xProd>/);

    if (!numeroMatch || !dataEmissaoMatch || !valorMatch || !cnpjMatch) {
      return null;
    }

    // Extrair data de emissão (formato ISO para YYYY-MM-DD)
    const dataEmissao = dataEmissaoMatch[1].split('T')[0];
    
    // Extrair data de vencimento se disponível, senão usar data de emissão + 30 dias
    let dataVencimento;
    if (dataVencimentoMatch) {
      dataVencimento = dataVencimentoMatch[1].split('T')[0];
    } else {
      // Se não tem data de vencimento no XML, adiciona 30 dias à data de emissão
      const emissaoDate = new Date(dataEmissao);
      emissaoDate.setDate(emissaoDate.getDate() + 30);
      dataVencimento = emissaoDate.toISOString().split('T')[0];
    }

    // Parse do valor com tratamento de vírgula decimal brasileira
    const valorString = valorMatch[1].replace(',', '.');
    const valorBruto = parseFloat(valorString);

    if (isNaN(valorBruto)) {
      console.warn('Valor inválido no XML:', valorMatch[1]);
      return null;
    }

    return {
      fornecedor_cnpj: cnpjMatch[1],
      numero_documento: numeroMatch[1],
      data_emissao: dataEmissao,
      data_vencimento: dataVencimento,
      valor_bruto: valorBruto,
      descricao_historico: descricaoMatch ? descricaoMatch[1] : 'Importado via XML'
    };

  } catch (error) {
    console.error('Erro no parse do XML:', error);
    return null;
  }
}