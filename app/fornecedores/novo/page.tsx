'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/Modal';
import { useModal } from '@/hooks/useModal';
import {
  FaTruck,
  FaArrowLeft,
  FaUser,
  FaBuilding,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaIdCard,
  FaUniversity,
  FaCog,
  FaSave,
  FaTimes,
  FaGlobe
} from 'react-icons/fa';
import {
  FornecedorFormData,
  TIPOS_FORNECEDOR,
  REGIMES_TRIBUTARIOS,
  TIPOS_CONTA,
  ESTADOS_BRASIL
} from '@/types/fornecedor';

export default function NovoFornecedorPage() {
  const router = useRouter();
  const { modalState, hideModal, showSuccess, showError } = useModal();
  const [loading, setLoading] = useState(false);
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

  const handleInputChange = (field: keyof FornecedorFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const formatCNPJ = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    return cleanValue.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
  };

  const formatCPF = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    return cleanValue.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
  };

  const formatCEP = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    return cleanValue.replace(/^(\d{5})(\d{3})$/, '$1-$2');
  };

  const formatTelefone = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length === 11) {
      return cleanValue.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
    }
    return cleanValue.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
  };

  const buscarCEPAutomatico = async (cep: string) => {
    if (cep.length !== 8) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();

      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          endereco_logradouro: data.logradouro || '',
          endereco_bairro: data.bairro || '',
          endereco_cidade: data.localidade || '',
          endereco_estado_uf: data.uf || ''
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validações obrigatórias básicas
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
      if (!formData[field as keyof FornecedorFormData] ||
        formData[field as keyof FornecedorFormData]?.toString().trim() === '') {
        newErrors[field] = 'Campo obrigatório';
      }
    });

    // Validações específicas por tipo de pessoa
    if (formData.tipo_pessoa === 'PJ') {
      if (!formData.razao_social || formData.razao_social.trim() === '') {
        newErrors.razao_social = 'Razão Social é obrigatória para Pessoa Jurídica';
      }
      if (!formData.cnpj || formData.cnpj.trim() === '') {
        newErrors.cnpj = 'CNPJ é obrigatório para Pessoa Jurídica';
      } else if (formData.cnpj.replace(/\D/g, '').length !== 14) {
        newErrors.cnpj = 'CNPJ deve ter 14 dígitos';
      }
    } else {
      if (!formData.nome_completo || formData.nome_completo.trim() === '') {
        newErrors.nome_completo = 'Nome Completo é obrigatório para Pessoa Física';
      }
      if (!formData.cpf || formData.cpf.trim() === '') {
        newErrors.cpf = 'CPF é obrigatório para Pessoa Física';
      } else if (formData.cpf.replace(/\D/g, '').length !== 11) {
        newErrors.cpf = 'CPF deve ter 11 dígitos';
      }
    }

    // Validação de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email_principal && !emailRegex.test(formData.email_principal)) {
      newErrors.email_principal = 'Email inválido';
    }
    if (formData.email_secundario && !emailRegex.test(formData.email_secundario)) {
      newErrors.email_secundario = 'Email inválido';
    }

    // Validação de CEP
    if (formData.endereco_cep && formData.endereco_cep.replace(/\D/g, '').length !== 8) {
      newErrors.endereco_cep = 'CEP deve ter 8 dígitos';
    }

    // Validação de telefone
    const phoneClean = formData.telefone_principal?.replace(/\D/g, '') || '';
    if (phoneClean.length < 10 || phoneClean.length > 11) {
      newErrors.telefone_principal = 'Telefone inválido';
    }

    if (formData.telefone_secundario) {
      const phoneSecondaryClean = formData.telefone_secundario.replace(/\D/g, '');
      if (phoneSecondaryClean.length < 10 || phoneSecondaryClean.length > 11) {
        newErrors.telefone_secundario = 'Telefone inválido';
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
      const response = await fetch('/api/fornecedores/criar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao criar fornecedor');
      }

      showSuccess(
        'Sucesso!',
        'Fornecedor cadastrado com sucesso!',
        () => router.push('/fornecedores')
      );

    } catch (error: any) {
      console.error('Erro:', error);
      showError('Erro', error.message || 'Erro ao cadastrar fornecedor');
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
                onClick={() => router.push('/fornecedores')}
                className="p-2 rounded-lg bg-white shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <FaArrowLeft className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <FaTruck className="mr-3 text-blue-600" />
                  Novo Fornecedor
                </h1>
                <p className="text-gray-600 mt-2">Cadastre um novo fornecedor no sistema</p>
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

          {/* Dados Essenciais */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-blue-100 rounded-lg mr-4">
                <FaBuilding className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Dados do Fornecedor</h2>
                <p className="text-gray-600">Informações básicas do fornecedor</p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {formData.tipo_pessoa === 'PJ' ? (
                <>
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                      <FaBuilding className="mr-2 text-gray-400" />
                      Razão Social *
                    </label>
                    <input
                      type="text"
                      value={formData.razao_social || ''}
                      onChange={(e) => handleInputChange('razao_social', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ${errors.razao_social ? 'border-red-500' : 'border-gray-300'
                        }`}
                      placeholder="Digite a razão social"
                    />
                    {errors.razao_social && (
                      <p className="text-red-500 text-xs mt-1">{errors.razao_social}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                      <FaUser className="mr-2 text-gray-400" />
                      Nome Fantasia
                    </label>
                    <input
                      type="text"
                      value={formData.nome_fantasia || ''}
                      onChange={(e) => handleInputChange('nome_fantasia', e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                      placeholder="Digite o nome fantasia (opcional)"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                      <FaIdCard className="mr-2 text-gray-400" />
                      CNPJ *
                    </label>
                    <input
                      type="text"
                      value={formData.cnpj || ''}
                      onChange={(e) => {
                        const formatted = formatCNPJ(e.target.value);
                        if (formatted.replace(/\D/g, '').length <= 14) {
                          handleInputChange('cnpj', formatted);
                        }
                      }}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ${errors.cnpj ? 'border-red-500' : 'border-gray-300'
                        }`}
                      placeholder="00.000.000/0000-00"
                      maxLength={18}
                    />
                    {errors.cnpj && (
                      <p className="text-red-500 text-xs mt-1">{errors.cnpj}</p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                      <FaUser className="mr-2 text-gray-400" />
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      value={formData.nome_completo || ''}
                      onChange={(e) => handleInputChange('nome_completo', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ${errors.nome_completo ? 'border-red-500' : 'border-gray-300'
                        }`}
                      placeholder="Digite o nome completo"
                    />
                    {errors.nome_completo && (
                      <p className="text-red-500 text-xs mt-1">{errors.nome_completo}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                      <FaIdCard className="mr-2 text-gray-400" />
                      CPF *
                    </label>
                    <input
                      type="text"
                      value={formData.cpf || ''}
                      onChange={(e) => {
                        const formatted = formatCPF(e.target.value);
                        if (formatted.replace(/\D/g, '').length <= 11) {
                          handleInputChange('cpf', formatted);
                        }
                      }}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ${errors.cpf ? 'border-red-500' : 'border-gray-300'
                        }`}
                      placeholder="000.000.000-00"
                      maxLength={14}
                    />
                    {errors.cpf && (
                      <p className="text-red-500 text-xs mt-1">{errors.cpf}</p>
                    )}
                  </div>
                </>
              )}

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Inscrição Estadual
                </label>
                <input
                  type="text"
                  value={formData.inscricao_estadual || ''}
                  onChange={(e) => handleInputChange('inscricao_estadual', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  placeholder="Digite a inscrição estadual (opcional)"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Inscrição Municipal
                </label>
                <input
                  type="text"
                  value={formData.inscricao_municipal || ''}
                  onChange={(e) => handleInputChange('inscricao_municipal', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  placeholder="Digite a inscrição municipal (opcional)"
                />
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <FaCog className="mr-2 text-gray-400" />
                  Regime Tributário *
                </label>
                <div className="relative">
                  <select
                    value={formData.regime_tributario}
                    onChange={(e) => handleInputChange('regime_tributario', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 appearance-none bg-white ${errors.regime_tributario ? 'border-red-500' : 'border-gray-300'
                      }`}
                  >
                    <option value="">Selecione o regime tributário</option>
                    {REGIMES_TRIBUTARIOS.map(regime => (
                      <option key={regime} value={regime}>{regime}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {errors.regime_tributario && (
                  <p className="text-red-500 text-xs mt-1">{errors.regime_tributario}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <FaTruck className="mr-2 text-gray-400" />
                  Tipo de Fornecedor *
                </label>
                <div className="relative">
                  <select
                    value={formData.tipo_fornecedor}
                    onChange={(e) => handleInputChange('tipo_fornecedor', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 appearance-none bg-white ${errors.tipo_fornecedor ? 'border-red-500' : 'border-gray-300'
                      }`}
                  >
                    <option value="">Selecione o tipo de fornecedor</option>
                    {TIPOS_FORNECEDOR.map(tipo => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {errors.tipo_fornecedor && (
                  <p className="text-red-500 text-xs mt-1">{errors.tipo_fornecedor}</p>
                )}
              </div>
            </div>
          </div>

          {/* Endereço */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-green-100 rounded-lg mr-4">
                <FaMapMarkerAlt className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Endereço</h2>
                <p className="text-gray-600">Localização do fornecedor</p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <FaMapMarkerAlt className="mr-2 text-gray-400" />
                  CEP * <span className="text-xs text-gray-500 ml-2">(busca automática)</span>
                </label>
                <input
                  type="text"
                  value={formData.endereco_cep}
                  onChange={(e) => {
                    const formatted = formatCEP(e.target.value);
                    if (formatted.replace(/\D/g, '').length <= 8) {
                      handleInputChange('endereco_cep', formatted);
                      // Buscar CEP automaticamente quando completo
                      if (formatted.replace(/\D/g, '').length === 8) {
                        buscarCEPAutomatico(formatted.replace(/\D/g, ''));
                      }
                    }
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ${errors.endereco_cep ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="00000-000"
                  maxLength={9}
                />
                {errors.endereco_cep && (
                  <p className="text-red-500 text-xs mt-1">{errors.endereco_cep}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <FaGlobe className="mr-2 text-gray-400" />
                  Logradouro *
                </label>
                <input
                  type="text"
                  value={formData.endereco_logradouro}
                  onChange={(e) => handleInputChange('endereco_logradouro', e.target.value)}
                  required
                  placeholder="Digite o logradouro"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ${errors.endereco_logradouro ? 'border-red-500' : 'border-gray-300'
                    }`}
                />
                {errors.endereco_logradouro && (
                  <p className="text-red-500 text-xs mt-1">{errors.endereco_logradouro}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Número *
                </label>
                <input
                  type="text"
                  value={formData.endereco_numero}
                  onChange={(e) => handleInputChange('endereco_numero', e.target.value)}
                  required
                  placeholder="Nº"
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ${errors.endereco_numero ? 'border-red-500' : 'border-gray-300'
                    }`}
                />
                {errors.endereco_bairro && (
                  <p className="text-red-500 text-xs mt-1">{errors.endereco_bairro}</p>
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
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.endereco_cidade ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="Cidade"
                />
                {errors.endereco_cidade && (
                  <p className="text-red-500 text-xs mt-1">{errors.endereco_cidade}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado (UF) *
                </label>
                <select
                  value={formData.endereco_estado_uf}
                  onChange={(e) => handleInputChange('endereco_estado_uf', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.endereco_estado_uf ? 'border-red-500' : 'border-gray-300'
                    }`}
                >
                  <option value="">Selecione o estado</option>
                  {ESTADOS_BRASIL.map(estado => (
                    <option key={estado.value} value={estado.value}>{estado.label}</option>
                  ))}
                </select>
                {errors.endereco_estado_uf && (
                  <p className="text-red-500 text-xs mt-1">{errors.endereco_estado_uf}</p>
                )}
              </div>
            </div>
          </div>

          {/* Dados de Contato */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-purple-100 rounded-lg mr-4">
                <FaPhone className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Contato</h2>
                <p className="text-gray-600">Informações de contato do fornecedor</p>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <FaPhone className="mr-2 text-gray-400" />
                  Telefone *
                </label>
                <input
                  type="text"
                  value={formData.telefone_principal}
                  onChange={(e) => {
                    const formatted = formatTelefone(e.target.value);
                    if (formatted.replace(/\D/g, '').length <= 11) {
                      handleInputChange('telefone_principal', formatted);
                    }
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ${errors.telefone_principal ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
                {errors.telefone_principal && (
                  <p className="text-red-500 text-xs mt-1">{errors.telefone_principal}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Telefone Secundário
                </label>
                <input
                  type="text"
                  value={formData.telefone_secundario || ''}
                  onChange={(e) => {
                    const formatted = formatTelefone(e.target.value);
                    if (formatted.replace(/\D/g, '').length <= 11) {
                      handleInputChange('telefone_secundario', formatted);
                    }
                  }}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ${errors.telefone_secundario ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="(00) 00000-0000"
                  maxLength={15}
                />
                {errors.telefone_secundario && (
                  <p className="text-red-500 text-xs mt-1">{errors.telefone_secundario}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <FaEnvelope className="mr-2 text-gray-400" />
                  Email *
                </label>
                <input
                  type="email"
                  value={formData.email_principal}
                  onChange={(e) => handleInputChange('email_principal', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ${errors.email_principal ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="email@fornecedor.com"
                />
                {errors.email_principal && (
                  <p className="text-red-500 text-xs mt-1">{errors.email_principal}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Email Secundário
                </label>
                <input
                  type="email"
                  value={formData.email_secundario || ''}
                  onChange={(e) => handleInputChange('email_secundario', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 ${errors.email_secundario ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="email2@exemplo.com"
                />
                {errors.email_secundario && (
                  <p className="text-red-500 text-xs mt-1">{errors.email_secundario}</p>
                )}
              </div>
            </div>
          </div>

          {/* Dados Bancários */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-yellow-100 rounded-lg mr-4">
                <FaUniversity className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Dados Bancários</h2>
                <p className="text-gray-600">Informações bancárias do fornecedor</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Banco
                </label>
                <input
                  type="text"
                  value={formData.banco || ''}
                  onChange={(e) => handleInputChange('banco', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  placeholder="Nome do banco"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Agência
                </label>
                <input
                  type="text"
                  value={formData.agencia || ''}
                  onChange={(e) => handleInputChange('agencia', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  placeholder="Número da agência"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Conta Corrente/Poupança
                </label>
                <input
                  type="text"
                  value={formData.conta_corrente || ''}
                  onChange={(e) => handleInputChange('conta_corrente', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  placeholder="Número da conta"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Tipo de Conta
                </label>
                <div className="relative">
                  <select
                    value={formData.tipo_conta || ''}
                    onChange={(e) => handleInputChange('tipo_conta', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 appearance-none bg-white"
                  >
                    <option value="">Selecione o tipo</option>
                    {TIPOS_CONTA.map(tipo => (
                      <option key={tipo} value={tipo}>{tipo}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Chave PIX
                </label>
                <input
                  type="text"
                  value={formData.chave_pix || ''}
                  onChange={(e) => handleInputChange('chave_pix', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  placeholder="CPF, CNPJ, telefone, email ou chave aleatória"
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
                  Salvar Fornecedor
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