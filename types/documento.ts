export interface DocumentoCobranca {
  documento_id: string;
  empresa_id: string;
  fornecedor_id: string;
  tipo_documento: TipoDocumento;
  numero_documento: string;
  data_emissao: string;
  data_vencimento: string;
  valor_bruto: number;
  valor_liquido?: number;
  descricao_historico: string;
  status_documento: StatusDocumento;
  data_registro: string;
  usuario_registro_id: string;
  codigo_barras_boleto?: string;
  linha_digitavel_boleto?: string;
}

export type TipoDocumento = 
  | 'Fatura'
  | 'Recibo' 
  | 'Boleto'
  | 'Guia de Imposto'
  | 'Taxa de Condomínio'
  | 'Outros';

export type StatusDocumento = 
  | 'Registrado'
  | 'Aprovado'
  | 'Aprovado para Pagamento'
  | 'Parcialmente Pago'
  | 'Pago'
  | 'Vencido'
  | 'Cancelado';

export interface AdiantamentoFornecedor {
  adiantamento_id: string;
  empresa_id: string;
  fornecedor_id: string;
  data_adiantamento: string;
  valor_adiantamento: number;
  saldo_restante?: number;
  descricao_historico: string;
  status_adiantamento: StatusAdiantamento;
}

export type StatusAdiantamento = 'Ativo' | 'Utilizado' | 'Cancelado';

export interface AnexoDocumento {
  anexo_id: string;
  documento_id: string;
  nome_arquivo: string;
  tipo_arquivo: TipoArquivo;
  caminho_armazenamento: string;
  tamanho_arquivo_mb?: number;
  data_upload: string;
  usuario_upload_id: string;
}

export type TipoArquivo = 'PDF' | 'JPG' | 'PNG' | 'XML';

export interface DocumentoCobrancaComDados extends DocumentoCobranca {
  fornecedor_nome?: string;
  usuario_nome?: string;
  anexos?: AnexoDocumento[];
}

export interface CreateDocumentoCobrancaData {
  fornecedor_id: string;
  tipo_documento: TipoDocumento;
  numero_documento: string;
  data_emissao: string;
  data_vencimento: string;
  valor_bruto: number;
  descricao_historico: string;
  codigo_barras_boleto?: string;
  linha_digitavel_boleto?: string;
}

export interface CreateAdiantamentoData {
  fornecedor_id: string;
  data_adiantamento: string;
  valor_adiantamento: number;
  descricao_historico: string;
}

export interface DocumentosFilter {
  fornecedor_id?: string;
  tipo_documento?: TipoDocumento;
  status_documento?: StatusDocumento;
  data_emissao_inicio?: string;
  data_emissao_fim?: string;
  data_vencimento_inicio?: string;
  data_vencimento_fim?: string;
  numero_documento?: string;
}

export interface XMLImportData {
  fornecedor_cnpj: string;
  numero_documento: string;
  data_emissao: string;
  valor_bruto: number;
  descricao_historico: string;
}