'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Modal from '@/components/Modal';
import { useModal } from '@/hooks/useModal';
import {
  FaTruck,
  FaArrowLeft,
  FaUser,
  FaBuilding,
  FaMapMarkerAlt,
  FaPhone,
  FaIdCard,
  FaUniversity,
  FaSave,
  FaTimes,
  FaGlobe,
  FaSpinner
} from 'react-icons/fa';
import {
  Fornecedor,
  FornecedorFormData,
  TIPOS_FORNECEDOR,
  REGIMES_TRIBUTARIOS,
  TIPOS_CONTA,
  ESTADOS_BRASIL
} from '@/types/fornecedor';

export default function EditarFornecedorPage() {
  const router = useRouter();
  const params = useParams();
  const fornecedorId = params.id as string;
  const { modalState, hideModal, showSuccess, showError } = useModal();

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [fornecedor, setFornecedor] = useState<Fornecedor | null>(null);
  const [formData, setFormData] = useState<FornecedorFormData>({
    tipo_pessoa: 'PJ',
    regime_tributario: '',
    endereco_logradouro: '',
    endereco_numero: '',
    endereco_bairro: '',
    endereco_cidade: '',
    endereco_estado_uf: '',
    endereco_cep: '',
    telefone_principal: '',
    email_principal: '',
    tipo_fornecedor: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Carregar dados do fornecedor
  useEffect(() => {
    const fetchFornecedor = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/fornecedores/${fornecedorId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            router.push('/login');
            return;
          }
          throw new Error('Erro ao carregar dados do fornecedor');
        }

        const data = await response.json();
        setFornecedor(data.fornecedor);

        // Preencher formulário com dados existentes
        setFormData({
          tipo_pessoa: data.fornecedor.tipo_pessoa,
          razao_social: data.fornecedor.razao_social || '',
          nome_completo: data.fornecedor.nome_completo || '',
          nome_fantasia: data.fornecedor.nome_fantasia || '',
          cnpj: data.fornecedor.cnpj || '',
          cpf: data.fornecedor.cpf || '',
          inscricao_estadual: data.fornecedor.inscricao_estadual || '',
          inscricao_municipal: data.fornecedor.inscricao_municipal || '',
          regime_tributario: data.fornecedor.regime_tributario,
          endereco_logradouro: data.fornecedor.endereco_logradouro,
          endereco_numero: data.fornecedor.endereco_numero,
          endereco_complemento: data.fornecedor.endereco_complemento || '',
          endereco_bairro: data.fornecedor.endereco_bairro,
          endereco_cidade: data.fornecedor.endereco_cidade,
          endereco_estado_uf: data.fornecedor.endereco_estado_uf,
          endereco_cep: data.fornecedor.endereco_cep,
          telefone_principal: data.fornecedor.telefone_principal,
          telefone_secundario: data.fornecedor.telefone_secundario || '',
          email_principal: data.fornecedor.email_principal,
          email_secundario: data.fornecedor.email_secundario || '',
          banco: data.fornecedor.banco || '',
          agencia: data.fornecedor.agencia || '',
          conta_corrente: data.fornecedor.conta_corrente || '',
          tipo_conta: data.fornecedor.tipo_conta || '',
          chave_pix: data.fornecedor.chave_pix || '',
          tipo_fornecedor: data.fornecedor.tipo_fornecedor
        });

      } catch (error) {
        console.error('Erro ao carregar fornecedor:', error);
        showError('Erro', 'Erro ao carregar dados do fornecedor');
        router.push('/fornecedores');
      } finally {
        setLoadingData(false);
      }
    };

    if (fornecedorId) {
      fetchFornecedor();
    }
  }, [fornecedorId, router, showError]);

  const handleInputChange = (field: keyof FornecedorFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Limpar erro do campo quando o usuário começar a digitar
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const formatCNPJ = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '$1.$2')
      .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
      .replace(/\.(\d{3})(\d)/, '.$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2')
      .substring(0, 18);
  };

  const formatCPF = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2')
      .substring(0, 14);
  };

  const formatCEP = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{5})(\d)/, '$1-$2')
      .substring(0, 9);
  };

  const formatTelefone = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/^(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d{4})$/, '$1-$2')
      .substring(0, 15);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validações básicas
    const requiredFields = [
      'regime_tributario',
      'endereco_logradouro',
      'endereco_numero',
      'endereco_bairro',
      'endereco_cidade',
      'endereco_estado_uf',
      'endereco_cep',
      'telefone_principal',
      'email_principal',
      'tipo_fornecedor'
    ];

    requiredFields.forEach(field => {
      if (!formData[field as keyof FornecedorFormData]?.trim()) {
        newErrors[field] = 'Campo obrigatório';
      }
    });

    // Validações específicas por tipo de pessoa
    if (formData.tipo_pessoa === 'PJ') {
      if (!formData.razao_social?.trim()) {
        newErrors.razao_social = 'Razão social é obrigatória para pessoa jurídica';
      }
      if (!formData.cnpj?.trim()) {
        newErrors.cnpj = 'CNPJ é obrigatório para pessoa jurídica';
      } else if (formData.cnpj.replace(/\D/g, '').length !== 14) {
        newErrors.cnpj = 'CNPJ deve ter 14 dígitos';
      }
    } else {
      if (!formData.nome_completo?.trim()) {
        newErrors.nome_completo = 'Nome completo é obrigatório para pessoa física';
      }
      if (!formData.cpf?.trim()) {
        newErrors.cpf = 'CPF é obrigatório para pessoa física';
      } else if (formData.cpf.replace(/\D/g, '').length !== 11) {
        newErrors.cpf = 'CPF deve ter 11 dígitos';
      }
    }

    // Validação de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email_principal)) {
      newErrors.email_principal = 'E-mail inválido';
    }

    // Validação de CEP
    if (formData.endereco_cep.replace(/\D/g, '').length !== 8) {
      newErrors.endereco_cep = 'CEP deve ter 8 dígitos';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      showError('Erro de Validação', 'Por favor, corrija os campos destacados.');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/fornecedores/${fornecedorId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar fornecedor');
      }

      showSuccess(
        'Fornecedor Atualizado!',
        'Os dados do fornecedor foram atualizados com sucesso.',
        () => router.push('/fornecedores')
      );

    } catch (error: any) {
      console.error('Erro ao atualizar fornecedor:', error);
      showError('Erro', error.message || 'Erro ao atualizar fornecedor');
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Carregando dados do fornecedor...</p>
        </div>
      </div>
    );
  }

  if (!fornecedor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaTruck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Fornecedor não encontrado</h3>
          <p className="text-gray-500 mb-4">O fornecedor solicitado não foi encontrado.</p>
          <button
            onClick={() => router.push('/fornecedores')}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaArrowLeft className="mr-2" />
            Voltar para Fornecedores
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
                onClick={() => router.push('/fornecedores')}
                className="p-2 rounded-lg bg-white shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <FaArrowLeft className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <FaTruck className="mr-3 text-blue-600" />
                  Editar Fornecedor
                </h1>
                <p className="text-gray-600 mt-2">
                  Edite as informações do fornecedor: {fornecedor.razao_social_nome || fornecedor.razao_social || fornecedor.nome_completo}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Tipo de Pessoa */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-blue-100 rounded-lg mr-4">
                <FaIdCard className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Tipo de Pessoa</h2>
                <p className="text-gray-600">Selecione o tipo de fornecedor</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                <input
                  type="radio"
                  name="tipo_pessoa"
                  value="PJ"
                  checked={formData.tipo_pessoa === 'PJ'}
                  onChange={(e) => handleInputChange('tipo_pessoa', e.target.value)}
                  className="h-4 w-4 text-blue-600"
                />
                <FaBuilding className="text-blue-600" />
                <span className="font-medium">Pessoa Jurídica</span>
              </label>
              <label className="flex items-center space-x-3 p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-blue-500 transition-colors">
                <input
                  type="radio"
                  name="tipo_pessoa"
                  value="PF"
                  checked={formData.tipo_pessoa === 'PF'}
                  onChange={(e) => handleInputChange('tipo_pessoa', e.target.value)}
                  className="h-4 w-4 text-blue-600"
                />
                <FaUser className="text-green-600" />
                <span className="font-medium">Pessoa Física</span>
              </label>
            </div>
          </div>

          {/* Dados Básicos */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-green-100 rounded-lg mr-4">
                <FaUser className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Dados Básicos</h2>
                <p className="text-gray-600">Informações de identificação do fornecedor</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {formData.tipo_pessoa === 'PJ' ? (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Razão Social *
                    </label>
                    <input
                      type="text"
                      value={formData.razao_social || ''}
                      onChange={(e) => handleInputChange('razao_social', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.razao_social ? 'border-red-500' : 'border-gray-300'
                        }`}
                      placeholder="Digite a razão social"
                    />
                    {errors.razao_social && (
                      <p className="mt-1 text-sm text-red-600">{errors.razao_social}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome Fantasia
                    </label>
                    <input
                      type="text"
                      value={formData.nome_fantasia || ''}
                      onChange={(e) => handleInputChange('nome_fantasia', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      placeholder="Digite o nome fantasia"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CNPJ *
                    </label>
                    <input
                      type="text"
                      value={formatCNPJ(formData.cnpj || '')}
                      onChange={(e) => handleInputChange('cnpj', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.cnpj ? 'border-red-500' : 'border-gray-300'
                        }`}
                      placeholder="00.000.000/0000-00"
                    />
                    {errors.cnpj && (
                      <p className="mt-1 text-sm text-red-600">{errors.cnpj}</p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      value={formData.nome_completo || ''}
                      onChange={(e) => handleInputChange('nome_completo', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.nome_completo ? 'border-red-500' : 'border-gray-300'
                        }`}
                      placeholder="Digite o nome completo"
                    />
                    {errors.nome_completo && (
                      <p className="mt-1 text-sm text-red-600">{errors.nome_completo}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      CPF *
                    </label>
                    <input
                      type="text"
                      value={formatCPF(formData.cpf || '')}
                      onChange={(e) => handleInputChange('cpf', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.cpf ? 'border-red-500' : 'border-gray-300'
                        }`}
                      placeholder="000.000.000-00"
                    />
                    {errors.cpf && (
                      <p className="mt-1 text-sm text-red-600">{errors.cpf}</p>
                    )}
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Inscrição Estadual
                </label>
                <input
                  type="text"
                  value={formData.inscricao_estadual || ''}
                  onChange={(e) => handleInputChange('inscricao_estadual', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Digite a inscrição estadual"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Inscrição Municipal
                </label>
                <input
                  type="text"
                  value={formData.inscricao_municipal || ''}
                  onChange={(e) => handleInputChange('inscricao_municipal', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Digite a inscrição municipal"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Regime Tributário *
                </label>
                <select
                  value={formData.regime_tributario}
                  onChange={(e) => handleInputChange('regime_tributario', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.regime_tributario ? 'border-red-500' : 'border-gray-300'
                    }`}
                >
                  <option value="">Selecione o regime tributário</option>
                  {REGIMES_TRIBUTARIOS.map((regime) => (
                    <option key={regime} value={regime}>
                      {regime}
                    </option>
                  ))}
                </select>
                {errors.regime_tributario && (
                  <p className="mt-1 text-sm text-red-600">{errors.regime_tributario}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Fornecedor *
                </label>
                <select
                  value={formData.tipo_fornecedor}
                  onChange={(e) => handleInputChange('tipo_fornecedor', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.tipo_fornecedor ? 'border-red-500' : 'border-gray-300'
                    }`}
                >
                  <option value="">Selecione o tipo de fornecedor</option>
                  {TIPOS_FORNECEDOR.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
                {errors.tipo_fornecedor && (
                  <p className="mt-1 text-sm text-red-600">{errors.tipo_fornecedor}</p>
                )}
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-orange-100 rounded-lg mr-4">
                <FaMapMarkerAlt className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Endereço</h2>
                <p className="text-gray-600">Localização do fornecedor</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logradouro *
                </label>
                <input
                  type="text"
                  value={formData.endereco_logradouro}
                  onChange={(e) => handleInputChange('endereco_logradouro', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.endereco_logradouro ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="Rua, Avenida, etc."
                />
                {errors.endereco_logradouro && (
                  <p className="mt-1 text-sm text-red-600">{errors.endereco_logradouro}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número *
                </label>
                <input
                  type="text"
                  value={formData.endereco_numero}
                  onChange={(e) => handleInputChange('endereco_numero', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.endereco_numero ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="123"
                />
                {errors.endereco_numero && (
                  <p className="mt-1 text-sm text-red-600">{errors.endereco_numero}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Complemento
                </label>
                <input
                  type="text"
                  value={formData.endereco_complemento || ''}
                  onChange={(e) => handleInputChange('endereco_complemento', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Apto, Sala, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bairro *
                </label>
                <input
                  type="text"
                  value={formData.endereco_bairro}
                  onChange={(e) => handleInputChange('endereco_bairro', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.endereco_bairro ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="Nome do bairro"
                />
                {errors.endereco_bairro && (
                  <p className="mt-1 text-sm text-red-600">{errors.endereco_bairro}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cidade *
                </label>
                <input
                  type="text"
                  value={formData.endereco_cidade}
                  onChange={(e) => handleInputChange('endereco_cidade', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.endereco_cidade ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="Nome da cidade"
                />
                {errors.endereco_cidade && (
                  <p className="mt-1 text-sm text-red-600">{errors.endereco_cidade}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado (UF) *
                </label>
                <select
                  value={formData.endereco_estado_uf}
                  onChange={(e) => handleInputChange('endereco_estado_uf', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.endereco_estado_uf ? 'border-red-500' : 'border-gray-300'
                    }`}
                >
                  <option value="">Selecione o estado</option>
                  {ESTADOS_BRASIL.map((estado) => (
                    <option key={estado.value} value={estado.value}>
                      {estado.label}
                    </option>
                  ))}
                </select>
                {errors.endereco_estado_uf && (
                  <p className="mt-1 text-sm text-red-600">{errors.endereco_estado_uf}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CEP *
                </label>
                <input
                  type="text"
                  value={formatCEP(formData.endereco_cep)}
                  onChange={(e) => handleInputChange('endereco_cep', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.endereco_cep ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="00000-000"
                />
                {errors.endereco_cep && (
                  <p className="mt-1 text-sm text-red-600">{errors.endereco_cep}</p>
                )}
              </div>
            </div>
          </div>

          {/* Contato */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-purple-100 rounded-lg mr-4">
                <FaPhone className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Informações de Contato</h2>
                <p className="text-gray-600">Telefone e e-mail do fornecedor</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone Principal *
                </label>
                <input
                  type="text"
                  value={formatTelefone(formData.telefone_principal)}
                  onChange={(e) => handleInputChange('telefone_principal', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.telefone_principal ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="(00) 00000-0000"
                />
                {errors.telefone_principal && (
                  <p className="mt-1 text-sm text-red-600">{errors.telefone_principal}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone Secundário
                </label>
                <input
                  type="text"
                  value={formatTelefone(formData.telefone_secundario || '')}
                  onChange={(e) => handleInputChange('telefone_secundario', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-mail Principal *
                </label>
                <input
                  type="email"
                  value={formData.email_principal}
                  onChange={(e) => handleInputChange('email_principal', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${errors.email_principal ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="email@exemplo.com"
                />
                {errors.email_principal && (
                  <p className="mt-1 text-sm text-red-600">{errors.email_principal}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  E-mail Secundário
                </label>
                <input
                  type="email"
                  value={formData.email_secundario || ''}
                  onChange={(e) => handleInputChange('email_secundario', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="email2@exemplo.com"
                />
              </div>
            </div>
          </div>

          {/* Dados Bancários */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-indigo-100 rounded-lg mr-4">
                <FaUniversity className="h-6 w-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Dados Bancários</h2>
                <p className="text-gray-600">Informações para pagamentos (opcional)</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Banco
                </label>
                <input
                  type="text"
                  value={formData.banco || ''}
                  onChange={(e) => handleInputChange('banco', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="Nome do banco"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agência
                </label>
                <input
                  type="text"
                  value={formData.agencia || ''}
                  onChange={(e) => handleInputChange('agencia', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="0000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Conta Corrente
                </label>
                <input
                  type="text"
                  value={formData.conta_corrente || ''}
                  onChange={(e) => handleInputChange('conta_corrente', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="00000-0"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Conta
                </label>
                <select
                  value={formData.tipo_conta || ''}
                  onChange={(e) => handleInputChange('tipo_conta', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">Selecione o tipo</option>
                  {TIPOS_CONTA.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chave PIX
                </label>
                <input
                  type="text"
                  value={formData.chave_pix || ''}
                  onChange={(e) => handleInputChange('chave_pix', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="CPF, CNPJ, e-mail, telefone ou chave aleatória"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push('/fornecedores')}
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