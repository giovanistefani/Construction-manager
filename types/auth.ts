// Tipos baseados na nova estrutura do banco de dados

export interface Usuario {
  usuario_id: string;
  nome_usuario: string; // Email para login
  senha_hash: string;
  email: string;
  empresa_principal_id: string;
  perfil_acesso_id: string;
  status_conta: 'Ativa' | 'Bloqueada';
  data_ultimo_login?: Date;
  tentativas_login_falhas: number;
  bloqueado_ate?: Date | null;
  dois_fatores_ativo: boolean;
  data_criacao: Date;
  data_atualizacao: Date;
}

export interface Empresa {
  empresa_id: string;
  nome_fantasia: string;
  razao_social: string;
  cnpj: string;
  endereco_logradouro: string;
  endereco_numero: string;
  endereco_complemento?: string;
  endereco_bairro: string;
  endereco_cidade: string;
  endereco_estado_uf: string;
  endereco_cep: string;
  telefone_contato: string;
  email_contato: string;
  status_empresa: 'Ativa' | 'Inativa';
  plano_assinatura_id: string;
  data_criacao: Date;
  usuario_criador_id: string;
}

export interface PerfilAcesso {
  perfil_id: string;
  nome_perfil: string;
  descricao_perfil?: string;
}

export interface PlanoAssinatura {
  plano_id: string;
  nome_plano: string;
  descricao?: string;
  recursos_limites: any; // JSON
}

export interface SessaoUsuario {
  sessao_id: string;
  usuario_id: string;
  access_token: string;
  refresh_token: string;
  access_expira_em: Date;
  refresh_expira_em: Date;
  criado_em: Date;
}

export interface TokenRedefinicaoSenha {
  token_id: string;
  usuario_id: string;
  token: string;
  expira_em: Date;
  usado: boolean;
  criado_em: Date;
}

export interface Codigo2FA {
  codigo_id: string;
  usuario_id: string;
  codigo: string;
  expira_em: Date;
  usado: boolean;
  criado_em: Date;
}

export interface AuditoriaLog {
  log_id: string;
  tabela_afetada: string;
  id_registro_afetado: string;
  data_hora: Date;
  usuario_id: string;
  tipo_acao: string;
  dados_antigos?: any; // JSON
  dados_novos?: any; // JSON
  detalhes_adicionais?: string;
}

// DTOs para requests
export interface CriarUsuarioDTO {
  nome_usuario: string; // Email
  senha: string;
  email: string;
  nome_completo?: string;
  empresa_principal_id: string;
  perfil_acesso_id?: string; // Padrão será usuário comum
}

export interface LoginDTO {
  nome_usuario: string; // Email
  senha: string;
}

export interface UsuarioComEmpresa extends Usuario {
  empresa: Empresa;
  perfil_acesso: PerfilAcesso;
}

// Response types para API
export interface LoginResponse {
  mensagem: string;
  accessToken?: string;
  refreshToken?: string;
  usuario?: {
    usuario_id: string;
    email: string;
    nome_usuario: string;
    empresa_principal_id: string;
    empresa_nome: string;
    perfil_acesso: string;
  };
  requer2FA?: boolean;
}