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
  FaUserPlus,
  FaSave,
  FaTimes,
  FaEye,
  FaEyeSlash,
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

export default function NovoUsuarioPage() {
  const router = useRouter();
  const { modalState, hideModal, showSuccess, showError } = useModal();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome_usuario: '',
    email: '',
    senha: '',
    confirmarSenha: '',
    empresa_principal_id: '',
    perfil_acesso_id: ''
  });
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);
  const [perfis, setPerfis] = useState<PerfilAcesso[]>([]);
  const [loadingPerfis, setLoadingPerfis] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
    Promise.all([fetchEmpresas(), fetchPerfis()]);
  }, [fetchEmpresas, fetchPerfis]);


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

    // Validações obrigatórias
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

    if (!formData.senha) {
      newErrors.senha = 'Senha é obrigatória';
    } else {
      const passwordErrors = validatePassword(formData.senha);
      if (passwordErrors.length > 0) {
        newErrors.senha = passwordErrors[0]; // Mostrar primeiro erro
      }
    }

    if (!formData.confirmarSenha) {
      newErrors.confirmarSenha = 'Confirmação de senha é obrigatória';
    } else if (formData.senha !== formData.confirmarSenha) {
      newErrors.confirmarSenha = 'As senhas não coincidem';
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
      const response = await fetch('/api/auth/registrar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          nome_usuario: formData.nome_usuario,
          senha: formData.senha,
          empresa_principal_id: formData.empresa_principal_id,
          perfil_acesso_id: formData.perfil_acesso_id
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.detalhes) {
          showError('Erro', data.detalhes.join('\n'));
        } else {
          showError('Erro', data.erro || 'Falha no registro');
        }
        return;
      }

      showSuccess(
        'Sucesso!',
        'Usuário cadastrado com sucesso!',
        () => router.push('/usuarios')
      );

    } catch (error) {
      console.error('Erro:', error);
      showError('Erro', 'Falha ao conectar com o servidor');
    } finally {
      setLoading(false);
    }
  };

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
                  <FaUserPlus className="mr-3 text-blue-600" />
                  Novo Usuário
                </h1>
                <p className="text-gray-600 mt-2">Cadastre um novo usuário no sistema</p>
              </div>
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
            </div>
          </div>

          {/* Senha */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-green-100 rounded-lg mr-4">
                <FaLock className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Senha de Acesso</h2>
                <p className="text-gray-600">Configure a senha para o usuário</p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <FaLock className="mr-2 text-gray-400" />
                  Senha *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.senha}
                    onChange={(e) => handleInputChange('senha', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 pr-12 ${
                      errors.senha ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Digite a senha"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.senha && (
                  <p className="text-red-500 text-xs mt-1">{errors.senha}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <FaLock className="mr-2 text-gray-400" />
                  Confirmar Senha *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmarSenha}
                    onChange={(e) => handleInputChange('confirmarSenha', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 pr-12 ${
                      errors.confirmarSenha ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Confirme a senha"
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

              <div className="lg:col-span-2">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="font-medium text-blue-900 mb-2">Requisitos da Senha:</p>
                  <ul className="text-sm space-y-1">
                    <li className={`flex items-center ${formData.senha.length >= 8 ? 'text-green-600' : 'text-gray-600'}`}>
                      <span className="mr-2">{formData.senha.length >= 8 ? '✓' : '•'}</span>
                      Pelo menos 8 caracteres
                    </li>
                    <li className={`flex items-center ${/[A-Z]/.test(formData.senha) ? 'text-green-600' : 'text-gray-600'}`}>
                      <span className="mr-2">{/[A-Z]/.test(formData.senha) ? '✓' : '•'}</span>
                      Uma letra maiúscula
                    </li>
                    <li className={`flex items-center ${/[a-z]/.test(formData.senha) ? 'text-green-600' : 'text-gray-600'}`}>
                      <span className="mr-2">{/[a-z]/.test(formData.senha) ? '✓' : '•'}</span>
                      Uma letra minúscula
                    </li>
                    <li className={`flex items-center ${/[0-9]/.test(formData.senha) ? 'text-green-600' : 'text-gray-600'}`}>
                      <span className="mr-2">{/[0-9]/.test(formData.senha) ? '✓' : '•'}</span>
                      Um número
                    </li>
                    <li className={`flex items-center ${/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.senha) ? 'text-green-600' : 'text-gray-600'}`}>
                      <span className="mr-2">{/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(formData.senha) ? '✓' : '•'}</span>
                      Um caractere especial
                    </li>
                  </ul>
                </div>
              </div>
            </div>
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
                  Salvar Usuário
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