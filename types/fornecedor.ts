export interface Fornecedor {
  fornecedor_id: string;
  tipo_pessoa: 'PJ' | 'PF';
  razao_social_nome?: string;  // Campo obrigatório do banco
  razao_social?: string;
  nome_completo?: string;
  nome_fantasia?: string;
  cnpj_cpf?: string;  // Campo único obrigatório do banco
  cnpj?: string;
  cpf?: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  regime_tributario: string;
  endereco_logradouro: string;
  endereco_numero: string;
  endereco_complemento?: string;
  endereco_bairro: string;
  endereco_cidade: string;
  endereco_estado_uf: string;
  endereco_cep: string;
  telefone_principal: string;
  telefone_secundario?: string;
  email_principal: string;
  email_secundario?: string;
  banco?: string;
  agencia?: string;
  conta_corrente?: string;
  tipo_conta?: 'Corrente' | 'Poupança';
  chave_pix?: string;
  tipo_fornecedor: string;
  status_fornecedor: 'Ativo' | 'Inativo';
  data_criacao: string;
  data_atualizacao?: string;
}

export interface FornecedorFormData {
  tipo_pessoa: 'PJ' | 'PF';
  razao_social?: string;
  nome_completo?: string;
  nome_fantasia?: string;
  cnpj?: string;
  cpf?: string;
  inscricao_estadual?: string;
  inscricao_municipal?: string;
  regime_tributario: string;
  endereco_logradouro: string;
  endereco_numero: string;
  endereco_complemento?: string;
  endereco_bairro: string;
  endereco_cidade: string;
  endereco_estado_uf: string;
  endereco_cep: string;
  telefone_principal: string;
  telefone_secundario?: string;
  email_principal: string;
  email_secundario?: string;
  banco?: string;
  agencia?: string;
  conta_corrente?: string;
  tipo_conta?: 'Corrente' | 'Poupança';
  chave_pix?: string;
  tipo_fornecedor: string;
}

export interface FornecedorPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const TIPOS_FORNECEDOR = [
  'Material',
  'Serviço',
  'Corretor',
  'Concessionária',
  'Transportadora',
  'Consultoria',
  'Outros'
] as const;

export const REGIMES_TRIBUTARIOS = [
  'Simples Nacional',
  'Lucro Presumido',
  'Lucro Real',
  'MEI',
  'Isento'
] as const;

export const TIPOS_CONTA = [
  'Corrente',
  'Poupança'
] as const;

export const ESTADOS_BRASIL = [
  { value: 'AC', label: 'Acre' },
  { value: 'AL', label: 'Alagoas' },
  { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' },
  { value: 'BA', label: 'Bahia' },
  { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' },
  { value: 'ES', label: 'Espírito Santo' },
  { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' },
  { value: 'MT', label: 'Mato Grosso' },
  { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' },
  { value: 'PA', label: 'Pará' },
  { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' },
  { value: 'PE', label: 'Pernambuco' },
  { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' },
  { value: 'RN', label: 'Rio Grande do Norte' },
  { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' },
  { value: 'RR', label: 'Roraima' },
  { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' },
  { value: 'SE', label: 'Sergipe' },
  { value: 'TO', label: 'Tocantins' }
] as const;