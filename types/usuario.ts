export interface Usuario {
  usuario_id: string;
  nome_usuario: string;
  email: string;
  empresa_principal_id: string;
  perfil_acesso_id: string;
  status_conta: string;
  data_ultimo_login: string | null;
  tentativas_login_falhas: number;
  empresa_nome: string;
  perfil_nome: string;
}

export interface UsuarioPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}