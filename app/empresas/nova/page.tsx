'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/Modal';
import { useModal } from '@/hooks/useModal';
import { 
  FaBuilding, 
  FaMapMarkerAlt, 
  FaPhone, 
  FaEnvelope,
  FaIdCard,
  FaCheck,
  FaSpinner,
  FaTimes,
  FaArrowLeft,
  FaGlobe,
  FaUser,
  FaCrown,
  FaSave
} from 'react-icons/fa';

interface PlanoAssinatura {
  plano_id: string;
  nome_plano: string;
  descricao: string;
}

export default function NovaEmpresaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [planos, setPlanos] = useState<PlanoAssinatura[]>([]);
  const { modalState, hideModal, showSuccess, showError, showConfirm } = useModal();
  const [formData, setFormData] = useState({
    nome_fantasia: '',
    razao_social: '',
    cnpj: '',
    endereco_logradouro: '',
    endereco_numero: '',
    endereco_complemento: '',
    endereco_bairro: '',
    endereco_cidade: '',
    endereco_estado_uf: '',
    endereco_cep: '',
    telefone_contato: '',
    email_contato: '',
    plano_assinatura_id: ''
  });

  useEffect(() => {
    fetchPlanos();
  }, []);

  const fetchPlanos = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/planos', {
        headers: token ? {
          'Authorization': `Bearer ${token}`
        } : {}
      });

      if (response.ok) {
        const data = await response.json();
        setPlanos(data);
      } else {
        console.error('Erro ao buscar planos:', response.status);
        // Mesmo com erro, tentar novamente sem token para casos de token expirado
        if (response.status === 401 || response.status === 500) {
          const retryResponse = await fetch('/api/planos');
          if (retryResponse.ok) {
            const data = await retryResponse.json();
            setPlanos(data);
          }
        }
      }
    } catch (error) {
      console.error('Erro ao buscar planos:', error);
      // Fallback: tentar sem autenticação
      try {
        const response = await fetch('/api/planos');
        if (response.ok) {
          const data = await response.json();
          setPlanos(data);
        }
      } catch (fallbackError) {
        console.error('Erro no fallback:', fallbackError);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Formatação automática
    let formattedValue = value;
    
    if (name === 'cnpj') {
      formattedValue = value.replace(/\D/g, '').slice(0, 14);
      if (formattedValue.length === 14) {
        formattedValue = formattedValue.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
      }
    }
    
    if (name === 'endereco_cep') {
      formattedValue = value.replace(/\D/g, '').slice(0, 8);
      if (formattedValue.length === 8) {
        formattedValue = formattedValue.replace(/^(\d{5})(\d{3})$/, '$1-$2');
        // Buscar CEP automaticamente quando completo
        buscarCEPAutomatico(formattedValue.replace(/\D/g, ''));
      }
    }
    
    if (name === 'telefone_contato') {
      formattedValue = value.replace(/\D/g, '').slice(0, 11);
      if (formattedValue.length === 11) {
        formattedValue = formattedValue.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3');
      } else if (formattedValue.length === 10) {
        formattedValue = formattedValue.replace(/^(\d{2})(\d{4})(\d{4})$/, '($1) $2-$3');
      }
    }
    
    setFormData({ ...formData, [name]: formattedValue });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/empresas/criar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const error = await response.json();
        
        // Se o token expirou, redirecionar para login
        if (error.code === 'TOKEN_EXPIRED' || response.status === 401) {
          showError(
            'Sessão Expirada',
            'Sua sessão expirou. Você será redirecionado para o login.',
            () => {
              localStorage.removeItem('token');
              localStorage.removeItem('usuario');
              router.push('/login');
            }
          );
          return;
        }
        
        throw new Error(error.error || 'Erro ao criar empresa');
      }

      showSuccess(
        'Sucesso!',
        'Empresa criada com sucesso!',
        () => router.push('/empresas')
      );
    } catch (error: any) {
      showError('Erro', error.message);
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
                onClick={() => router.push('/empresas')}
                className="p-2 rounded-lg bg-white shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors"
              >
                <FaArrowLeft className="text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                  <FaBuilding className="mr-3 text-blue-600" />
                  Nova Empresa
                </h1>
                <p className="text-gray-600 mt-2">Cadastre uma nova empresa no sistema</p>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Dados da Empresa */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex items-center mb-6">
              <div className="p-3 bg-blue-100 rounded-lg mr-4">
                <FaBuilding className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Dados da Empresa</h2>
                <p className="text-gray-600">Informações básicas da empresa</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <FaUser className="mr-2 text-gray-400" />
                  Nome Fantasia *
                </label>
                <input
                  type="text"
                  name="nome_fantasia"
                  value={formData.nome_fantasia}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  placeholder="Digite o nome fantasia"
                />
              </div>
              
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <FaBuilding className="mr-2 text-gray-400" />
                  Razão Social *
                </label>
                <input
                  type="text"
                  name="razao_social"
                  value={formData.razao_social}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                  placeholder="Digite a razão social"
                />
              </div>
              
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <FaIdCard className="mr-2 text-gray-400" />
                  CNPJ *
                </label>
                <input
                  type="text"
                  name="cnpj"
                  value={formData.cnpj}
                  onChange={handleInputChange}
                  placeholder="00.000.000/0000-00"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                />
              </div>
              
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <FaCrown className="mr-2 text-gray-400" />
                  Plano de Assinatura *
                </label>
                <div className="relative">
                  <select
                    name="plano_assinatura_id"
                    value={formData.plano_assinatura_id}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 appearance-none bg-white"
                  >
                    <option value="">Selecione um plano</option>
                    {planos.map((plano) => (
                      <option key={plano.plano_id} value={plano.plano_id}>
                        {plano.nome_plano} - {plano.descricao}
                      </option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {planos.length === 0 && (
                  <div className="flex items-center text-sm text-gray-500 mt-2">
                    <FaSpinner className="animate-spin mr-2" />
                    Carregando planos disponíveis...
                  </div>
                )}
                {formData.plano_assinatura_id && (
                  <div className="mt-3 p-4 bg-gradient-to-r from-blue-50 to-green-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center">
                      <FaCheck className="text-green-600 mr-2" />
                      <p className="text-sm text-green-800 font-medium">
                        Plano selecionado: <strong>{planos.find(p => p.plano_id === formData.plano_assinatura_id)?.nome_plano}</strong>
                      </p>
                    </div>
                  </div>
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
                <p className="text-gray-600">Localização da empresa</p>
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
                  name="endereco_cep"
                  value={formData.endereco_cep}
                  onChange={handleInputChange}
                  placeholder="00000-000"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                />
              </div>
              
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <FaGlobe className="mr-2 text-gray-400" />
                  Logradouro *
                </label>
                <input
                  type="text"
                  name="endereco_logradouro"
                  value={formData.endereco_logradouro}
                  onChange={handleInputChange}
                  required
                  placeholder="Digite o logradouro"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Número *
                </label>
                <input
                  type="text"
                  name="endereco_numero"
                  value={formData.endereco_numero}
                  onChange={handleInputChange}
                  required
                  placeholder="Nº"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Complemento
                </label>
                <input
                  type="text"
                  name="endereco_complemento"
                  value={formData.endereco_complemento}
                  onChange={handleInputChange}
                  placeholder="Apto, sala, bloco..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Bairro *
                </label>
                <input
                  type="text"
                  name="endereco_bairro"
                  value={formData.endereco_bairro}
                  onChange={handleInputChange}
                  required
                  placeholder="Digite o bairro"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Cidade *
                </label>
                <input
                  type="text"
                  name="endereco_cidade"
                  value={formData.endereco_cidade}
                  onChange={handleInputChange}
                  required
                  placeholder="Digite a cidade"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-semibold text-gray-700 mb-2 block">
                  Estado *
                </label>
                <div className="relative">
                  <select
                    name="endereco_estado_uf"
                    value={formData.endereco_estado_uf}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 appearance-none bg-white"
                  >
                    <option value="">Selecione</option>
                    <option value="AC">AC</option>
                    <option value="AL">AL</option>
                    <option value="AP">AP</option>
                    <option value="AM">AM</option>
                    <option value="BA">BA</option>
                    <option value="CE">CE</option>
                    <option value="DF">DF</option>
                    <option value="ES">ES</option>
                    <option value="GO">GO</option>
                    <option value="MA">MA</option>
                    <option value="MT">MT</option>
                    <option value="MS">MS</option>
                    <option value="MG">MG</option>
                    <option value="PA">PA</option>
                    <option value="PB">PB</option>
                    <option value="PR">PR</option>
                    <option value="PE">PE</option>
                    <option value="PI">PI</option>
                    <option value="RJ">RJ</option>
                    <option value="RN">RN</option>
                    <option value="RS">RS</option>
                    <option value="RO">RO</option>
                    <option value="RR">RR</option>
                    <option value="SC">SC</option>
                    <option value="SP">SP</option>
                    <option value="SE">SE</option>
                    <option value="TO">TO</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
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
                <h2 className="text-xl font-semibold text-gray-900">Contato</h2>
                <p className="text-gray-600">Informações de contato da empresa</p>
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
                  name="telefone_contato"
                  value={formData.telefone_contato}
                  onChange={handleInputChange}
                  placeholder="(00) 00000-0000"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                />
              </div>
              
              <div className="space-y-2">
                <label className="flex items-center text-sm font-semibold text-gray-700 mb-2">
                  <FaEnvelope className="mr-2 text-gray-400" />
                  Email *
                </label>
                <input
                  type="email"
                  name="email_contato"
                  value={formData.email_contato}
                  onChange={handleInputChange}
                  required
                  placeholder="email@empresa.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
                />
              </div>
            </div>
          </div>

          {/* Botões */}
          <div className="flex items-center justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push('/empresas')}
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
                  Salvar Empresa
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