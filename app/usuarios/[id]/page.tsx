'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/Modal';
import { useModal } from '@/hooks/useModal';
import {
  FaUser,
  FaArrowLeft,
  FaEnvelope,
  FaBuilding,
  FaLock,
  FaEdit,
  FaSave,
  FaTimes,
  FaEye,
  FaEyeSlash,
  FaToggleOn,
  FaToggleOff,
  FaUserShield
} from 'react-icons/fa';

interface Empresa {
  empresa_id: string;
  nome_fantasia: string;
  endereco_cidade: string;
  endereco_estado_uf: string;
}

interface PerfilAcesso {
  perfil_id: string;
  nome_perfil: string;
  descricao_perfil: string;
}

interface Usuario {
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

export default function EditarUsuarioPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { modalState, hideModal, showSuccess, showError } = useModal();
  const [loading, setLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState({
    nome_usuario: '',
    email: '',
    empresa_principal_id: '',
    perfil_acesso_id: '',
    status_conta: '',
    nova_senha: '',
    confirmarSenha: ''
  });
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);
  const [perfis, setPerfis] = useState<PerfilAcesso[]>([]);
  const [loadingPerfis, setLoadingPerfis] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changePassword, setChangePassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [userId, setUserId] = useState<string>('');

  const fetchUsuario = useCallback(async (id: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const response = await fetch(`/api/usuarios/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Usuário não encontrado');
      }

      const userData = await response.json();
      setUsuario(userData);
      setFormData({
        nome_usuario: userData.nome_usuario,
        email: userData.email,
        empresa_principal_id: userData.empresa_principal_id,
        perfil_acesso_id: userData.perfil_acesso_id,
        status_conta: userData.status_conta,
        nova_senha: '',
        confirmarSenha: ''
      });
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
      showError('Erro', 'Falha ao carregar dados do usuário');
      router.push('/usuarios');
    } finally {
      setLoadingUser(false);
    }
  }, [router, showError]);

  const fetchEmpresas = useCallback(async () => {
    try {
      const response = await fetch('/api/empresas/simples');
      if (response.ok) {
        const data = await response.json();
        setEmpresas(data.empresas);
      } else {
        console.error('Erro ao carregar empresas');
      }
    } catch (error) {
      console.error('Erro ao carregar empresas:', error);
    } finally {
      setLoadingEmpresas(false);
    }
  }, []);

  const fetchPerfis = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/perfis', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPerfis(data.perfis || []);
      } else {
        console.error('Erro ao carregar perfis');
      }
    } catch (error) {
      console.error('Erro ao carregar perfis:', error);
    } finally {
      setLoadingPerfis(false);
    }
  }, []);

  useEffect(() => {
    const initializePage = async () => {
      const resolvedParams = await params;
      setUserId(resolvedParams.id);
      await Promise.all([
        fetchUsuario(resolvedParams.id),
        fetchEmpresas(),
        fetchPerfis()
      ]);
    };
    
    initializePage();
  }, [params, fetchUsuario, fetchEmpresas, fetchPerfis]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    
    if (password.length < 8) {
      errors.push('A senha deve ter pelo menos 8 caracteres');
    }
    if (!/[A-Z]/.test(password)) {
      errors.push('A senha deve conter pelo menos uma letra maiúscula');
    }
    if (!/[a-z]/.test(password)) {
      errors.push('A senha deve conter pelo menos uma letra minúscula');
    }
    if (!/[0-9]/.test(password)) {
      errors.push('A senha deve conter pelo menos um número');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('A senha deve conter pelo menos um caractere especial');
    }
    
    return errors;
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.nome_usuario.trim()) {
      newErrors.nome_usuario = 'Nome de usuário é obrigatório';
    } else if (formData.nome_usuario.length < 3) {
      newErrors.nome_usuario = 'Nome de usuário deve ter pelo menos 3 caracteres';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'E-mail inválido';
    }

    if (!formData.empresa_principal_id) {
      newErrors.empresa_principal_id = 'Selecione uma empresa';
    }

    if (!formData.perfil_acesso_id) {
      newErrors.perfil_acesso_id = 'Selecione um perfil';
    }

    if (!formData.status_conta) {
      newErrors.status_conta = 'Selecione um status';
    }

    if (changePassword) {
      if (!formData.nova_senha) {
        newErrors.nova_senha = 'Nova senha é obrigatória';
      } else {
        const passwordErrors = validatePassword(formData.nova_senha);
        if (passwordErrors.length > 0) {
          newErrors.nova_senha = passwordErrors[0];
        }
      }

      if (!formData.confirmarSenha) {
        newErrors.confirmarSenha = 'Confirmação de senha é obrigatória';
      } else if (formData.nova_senha !== formData.confirmarSenha) {
        newErrors.confirmarSenha = 'As senhas não coincidem';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showError('Erro de Validação', 'Por favor, corrija os erros no formulário');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/login');
        return;
      }

      const updateData: Record<string, unknown> = {
        nome_usuario: formData.nome_usuario,
        email: formData.email,
        empresa_principal_id: formData.empresa_principal_id,
        perfil_acesso_id: formData.perfil_acesso_id,
        status_conta: formData.status_conta
      };

      if (changePassword && formData.nova_senha) {
        updateData.nova_senha = formData.nova_senha;
      }

      const response = await fetch(`/api/usuarios/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updateData),
      });

      if (response.status === 401) {
        localStorage.removeItem('token');
        router.push('/login');
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        showError('Erro', data.error || 'Falha ao atualizar usuário');
        return;
      }

      showSuccess(
        'Sucesso!',
        'Usuário atualizado com sucesso!',
        () => router.push('/usuarios')
      );

    } catch (error) {
      console.error('Erro:', error);
      showError('Erro', 'Falha ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Ativa': return 'text-green-600 bg-green-100';
      case 'Inativa': return 'text-gray-600 bg-gray-100';
      case 'Bloqueada': return 'text-red-600 bg-red-100';
      case 'Pendente': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case 'Ativa': return 'Ativo';
      case 'Inativa': return 'Inativo';
      case 'Bloqueada': return 'Bloqueado';
      case 'Pendente': return 'Pendente';
      default: return status;
    }
  };

  if (loadingUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados do usuário...</p>
        </div>
      </div>
    );
  }

  if (!usuario) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">Usuário não encontrado</p>
          <button
            onClick={() => router.push('/usuarios')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Voltar para Usuários
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/usuarios')}
                className="p-2 rounded-lg bg-white shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <FaArrowLeft className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <FaEdit className="mr-3 text-blue-600" />
                  Editar Usuário
                </h1>
                <p className="text-gray-600 mt-2">Edite as informações do usuário {usuario.nome_usuario}</p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(usuario.status_conta)}`}>
              {getStatusDisplay(usuario.status_conta)}
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Dados do Usuário */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-blue-100 rounded-lg mr-4">
                <FaUser className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Dados do Usuário</h2>
                <p className="text-gray-600">Informações básicas de identificação</p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <FaUser className="mr-2 text-gray-400" />
                  Nome de Usuário *
                </label>
                <input
                  type="text"
                  value={formData.nome_usuario}
                  onChange={(e) => handleInputChange('nome_usuario', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ${
                    errors.nome_usuario ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Digite o nome de usuário"
                />
                {errors.nome_usuario && (
                  <p className="text-red-500 text-xs mt-1">{errors.nome_usuario}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <FaEnvelope className="mr-2 text-gray-400" />
                  E-mail *
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Digite o e-mail"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <FaBuilding className="mr-2 text-gray-400" />
                  Empresa *
                </label>
                {loadingEmpresas ? (
                  <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                    Carregando empresas...
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={formData.empresa_principal_id}
                      onChange={(e) => handleInputChange('empresa_principal_id', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 appearance-none bg-white ${
                        errors.empresa_principal_id ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Selecione uma empresa</option>
                      {empresas.map((empresa) => (
                        <option key={empresa.empresa_id} value={empresa.empresa_id}>
                          {empresa.nome_fantasia} - {empresa.endereco_cidade}/{empresa.endereco_estado_uf}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                )}
                {errors.empresa_principal_id && (
                  <p className="text-red-500 text-xs mt-1">{errors.empresa_principal_id}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <FaUserShield className="mr-2 text-gray-400" />
                  Perfil de Acesso *
                </label>
                {loadingPerfis ? (
                  <div className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                    Carregando perfis...
                  </div>
                ) : (
                  <div className="relative">
                    <select
                      value={formData.perfil_acesso_id}
                      onChange={(e) => handleInputChange('perfil_acesso_id', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 appearance-none bg-white ${
                        errors.perfil_acesso_id ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">Selecione um perfil</option>
                      {perfis.map((perfil) => (
                        <option key={perfil.perfil_id} value={perfil.perfil_id}>
                          {perfil.nome_perfil}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                )}
                {errors.perfil_acesso_id && (
                  <p className="text-red-500 text-xs mt-1">{errors.perfil_acesso_id}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  Status da Conta *
                </label>
                <div className="relative">
                  <select
                    value={formData.status_conta}
                    onChange={(e) => handleInputChange('status_conta', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 appearance-none bg-white ${
                      errors.status_conta ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Selecione um status</option>
                    <option value="Ativa">Ativo</option>
                    <option value="Inativa">Inativo</option>
                    <option value="Bloqueada">Bloqueado</option>
                    <option value="Pendente">Pendente</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {errors.status_conta && (
                  <p className="text-red-500 text-xs mt-1">{errors.status_conta}</p>
                )}
              </div>
            </div>
          </div>

          {/* Alteração de Senha */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg mr-4">
                  <FaLock className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">Alterar Senha</h2>
                  <p className="text-gray-600">Configure uma nova senha para o usuário</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setChangePassword(!changePassword)}
                className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
              >
                {changePassword ? <FaToggleOn className="text-2xl" /> : <FaToggleOff className="text-2xl" />}
                <span>{changePassword ? 'Ativo' : 'Inativo'}</span>
              </button>
            </div>
            
            {changePassword && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    <FaLock className="mr-2 text-gray-400" />
                    Nova Senha *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.nova_senha}
                      onChange={(e) => handleInputChange('nova_senha', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 pr-12 ${
                        errors.nova_senha ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Digite a nova senha"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {errors.nova_senha && (
                    <p className="text-red-500 text-xs mt-1">{errors.nova_senha}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                    <FaLock className="mr-2 text-gray-400" />
                    Confirmar Nova Senha *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmarSenha}
                      onChange={(e) => handleInputChange('confirmarSenha', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 pr-12 ${
                        errors.confirmarSenha ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Confirme a nova senha"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {errors.confirmarSenha && (
                    <p className="text-red-500 text-xs mt-1">{errors.confirmarSenha}</p>
                  )}
                </div>

                {formData.nova_senha && (
                  <div className="lg:col-span-2">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="font-medium text-blue-900 mb-2">Requisitos da Senha:</p>
                      <ul className="text-sm space-y-1">
                        <li className={`flex items-center ${formData.nova_senha.length >= 8 ? 'text-green-600' : 'text-gray-600'}`}>
                          <span className="mr-2">{formData.nova_senha.length >= 8 ? '✓' : '•'}</span>
                          Pelo menos 8 caracteres
                        </li>
                        <li className={`flex items-center ${/[A-Z]/.test(formData.nova_senha) ? 'text-green-600' : 'text-gray-600'}`}>
                          <span className="mr-2">{/[A-Z]/.test(formData.nova_senha) ? '✓' : '•'}</span>
                          Uma letra maiúscula
                        </li>
                        <li className={`flex items-center ${/[a-z]/.test(formData.nova_senha) ? 'text-green-600' : 'text-gray-600'}`}>
                          <span className="mr-2">{/[a-z]/.test(formData.nova_senha) ? '✓' : '•'}</span>
                          Uma letra minúscula
                        </li>
                        <li className={`flex items-center ${/[0-9]/.test(formData.nova_senha) ? 'text-green-600' : 'text-gray-600'}`}>
                          <span className="mr-2">{/[0-9]/.test(formData.nova_senha) ? '✓' : '•'}</span>
                          Um número
                        </li>
                        <li className={`flex items-center ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.nova_senha) ? 'text-green-600' : 'text-gray-600'}`}>
                          <span className="mr-2">{/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.nova_senha) ? '✓' : '•'}</span>
                          Um caractere especial
                        </li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push('/usuarios')}
              className="inline-flex items-center px-6 py-3 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors"
            >
              <FaTimes className="mr-2" />
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg shadow-lg hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <FaSave className="mr-2" />
                  Salvar Alterações
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Modal */}
      <Modal
        isOpen={modalState.isOpen}
        onClose={hideModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        onConfirm={modalState.onConfirm}
        confirmText={modalState.confirmText}
        cancelText={modalState.cancelText}
        showCancel={modalState.showCancel}
      />
    </div>
  );
}