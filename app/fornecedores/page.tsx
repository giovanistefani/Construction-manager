'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/Modal';
import { useModal } from '@/hooks/useModal';
import { 
  FaPlus, 
  FaEdit, 
  FaToggleOn, 
  FaToggleOff, 
  FaSearch,
  FaFilter,
  FaTruck,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope,
  FaIdCard,
  FaUser,
  FaBuilding
} from 'react-icons/fa';
import { Fornecedor, FornecedorPagination } from '@/types/fornecedor';

export default function FornecedoresPage() {
  const router = useRouter();
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [pagination, setPagination] = useState<FornecedorPagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tipoPessoaFilter, setTipoPessoaFilter] = useState('');
  const [tipoFornecedorFilter, setTipoFornecedorFilter] = useState('');
  const [orderBy, setOrderBy] = useState('razao_social');
  const [orderDir, setOrderDir] = useState<'ASC' | 'DESC'>('ASC');
  const { modalState, hideModal, showSuccess, showError, showConfirm } = useModal();

  const fetchFornecedores = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: searchTerm,
        status: statusFilter,
        tipoPessoa: tipoPessoaFilter,
        tipoFornecedor: tipoFornecedorFilter,
        orderBy,
        orderDir
      });

      const response = await fetch(`/api/fornecedores/listar?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
          throw new Error('Erro ao buscar fornecedores');
      }

      const data = await response.json();
      setFornecedores(data.fornecedores);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Erro:', error);
      showError('Erro', 'Erro ao carregar fornecedores');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm, statusFilter, tipoPessoaFilter, tipoFornecedorFilter, orderBy, orderDir, router, showError]);

  useEffect(() => {
    fetchFornecedores();
  }, [fetchFornecedores]);

  const handleSort = (column: string) => {
    if (orderBy === column) {
      setOrderDir(orderDir === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setOrderBy(column);
      setOrderDir('ASC');
    }
  };

  const handleStatusChange = (fornecedorId: string, novoStatus: string, nomeFornecedor: string) => {
    showConfirm(
      'Confirmar Alteração',
      `Tem certeza que deseja ${novoStatus === 'Ativo' ? 'ativar' : 'desativar'} o fornecedor "${nomeFornecedor}"?`,
      async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`/api/fornecedores/${fornecedorId}`, {
            method: 'PATCH',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: novoStatus })
          });

          if (!response.ok) {
            throw new Error('Erro ao alterar status');
          }

          showSuccess(
            'Sucesso!',
            `Fornecedor ${novoStatus === 'Ativo' ? 'ativado' : 'desativado'} com sucesso!`
          );
          fetchFornecedores();
        } catch (error) {
          console.error('Erro:', error);
          showError('Erro', 'Erro ao alterar status do fornecedor');
        }
      },
      novoStatus === 'Ativo' ? 'Ativar' : 'Desativar',
      'Cancelar'
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatDocument = (fornecedor: Fornecedor) => {
    if (fornecedor.tipo_pessoa === 'PJ') {
      return fornecedor.cnpj?.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    } else {
      return fornecedor.cpf?.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4');
    }
  };

  const getNomeFornecedor = (fornecedor: Fornecedor) => {
    // Usar o novo campo razao_social_nome se disponível, senão usar a lógica anterior
    return fornecedor.razao_social_nome || 
           (fornecedor.tipo_pessoa === 'PJ' 
             ? (fornecedor.nome_fantasia || fornecedor.razao_social)
             : fornecedor.nome_completo);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <FaTruck className="mr-3 text-blue-600" />
                Fornecedores
              </h1>
              <p className="text-gray-600 mt-2">Gerencie todos os fornecedores do sistema</p>
            </div>
            <button
              onClick={() => router.push('/fornecedores/novo')}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg shadow-lg hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-200"
            >
              <FaPlus className="mr-2" />
              Novo Fornecedor
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaSearch className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Buscar por nome, documento ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200"
              />
            </div>
            
            {/* Status Filter */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FaFilter className="h-5 w-5 text-gray-400" />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg pl-10 pr-8 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 cursor-pointer min-w-[180px]"
              >
                <option value="">Todos os Status</option>
                <option value="Ativo">Fornecedores Ativos</option>
                <option value="Inativo">Fornecedores Inativos</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Tipo Pessoa Filter */}
            <div className="relative">
              <select
                value={tipoPessoaFilter}
                onChange={(e) => setTipoPessoaFilter(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 pr-8 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 cursor-pointer min-w-[150px]"
              >
                <option value="">Tipo Pessoa</option>
                <option value="PJ">Pessoa Jurídica</option>
                <option value="PF">Pessoa Física</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            {/* Tipo Fornecedor Filter */}
            <div className="relative">
              <select
                value={tipoFornecedorFilter}
                onChange={(e) => setTipoFornecedorFilter(e.target.value)}
                className="appearance-none bg-white border border-gray-300 rounded-lg px-4 pr-8 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 cursor-pointer min-w-[150px]"
              >
                <option value="">Tipo Fornecedor</option>
                <option value="Material">Material</option>
                <option value="Serviço">Serviço</option>
                <option value="Corretor">Corretor</option>
                <option value="Concessionária">Concessionária</option>
                <option value="Transportadora">Transportadora</option>
                <option value="Consultoria">Consultoria</option>
                <option value="Outros">Outros</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                <p className="text-gray-600">Carregando fornecedores...</p>
              </div>
            </div>
          ) : fornecedores.length === 0 ? (
            <div className="text-center py-16">
              <FaTruck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum fornecedor encontrado</h3>
              <p className="text-gray-500">Comece criando seu primeiro fornecedor</p>
              <button
                onClick={() => router.push('/fornecedores/novo')}
                className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaPlus className="mr-2" />
                Novo Fornecedor
              </button>
            </div>
          ) : (
            <>
              {/* Cards View for Mobile, Table for Desktop */}
              <div className="hidden lg:block">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th 
                          onClick={() => handleSort('tipo_pessoa')}
                          className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-1">
                            <span>Fornecedor</span>
                            {orderBy === 'tipo_pessoa' && (
                              <span className="text-blue-600">{orderDir === 'ASC' ? '↑' : '↓'}</span>
                            )}
                          </div>
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Contato
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Localização
                        </th>
                        <th 
                          onClick={() => handleSort('tipo_fornecedor')}
                          className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-1">
                            <span>Tipo</span>
                            {orderBy === 'tipo_fornecedor' && (
                              <span className="text-blue-600">{orderDir === 'ASC' ? '↑' : '↓'}</span>
                            )}
                          </div>
                        </th>
                        <th 
                          onClick={() => handleSort('status_fornecedor')}
                          className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-1">
                            <span>Status</span>
                            {orderBy === 'status_fornecedor' && (
                              <span className="text-blue-600">{orderDir === 'ASC' ? '↑' : '↓'}</span>
                            )}
                          </div>
                        </th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {fornecedores.map((fornecedor, index) => (
                        <tr key={`fornecedor-${fornecedor.fornecedor_id || index}`} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                  fornecedor.tipo_pessoa === 'PJ' ? 'bg-blue-100' : 'bg-green-100'
                                }`}>
                                  {fornecedor.tipo_pessoa === 'PJ' ? (
                                    <FaBuilding className={`h-5 w-5 ${fornecedor.tipo_pessoa === 'PJ' ? 'text-blue-600' : 'text-green-600'}`} />
                                  ) : (
                                    <FaUser className="h-5 w-5 text-green-600" />
                                  )}
                                </div>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-semibold text-gray-900">{getNomeFornecedor(fornecedor)}</div>
                                <div className="text-sm text-gray-500">
                                  {fornecedor.tipo_pessoa === 'PJ' ? fornecedor.razao_social : fornecedor.nome_completo}
                                </div>
                                <div className="text-xs text-gray-400 mt-1 flex items-center">
                                  <FaIdCard className="mr-1" />
                                  {formatDocument(fornecedor)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 flex items-center">
                              <FaPhone className="mr-2 text-gray-400" />
                              {fornecedor.telefone_principal?.replace(/^(\d{2})(\d{4,5})(\d{4})$/, '($1) $2-$3')}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center mt-1">
                              <FaEnvelope className="mr-2 text-gray-400" />
                              {fornecedor.email_principal}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 flex items-center">
                              <FaMapMarkerAlt className="mr-2 text-gray-400" />
                              {fornecedor.endereco_cidade}/{fornecedor.endereco_estado_uf}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                              {fornecedor.tipo_fornecedor}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              fornecedor.status_fornecedor === 'Ativo' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                fornecedor.status_fornecedor === 'Ativo' ? 'bg-green-400' : 'bg-red-400'
                              }`}></span>
                              {fornecedor.status_fornecedor}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => {
                                  if (fornecedor.fornecedor_id) {
                                    router.push(`/fornecedores/${fornecedor.fornecedor_id}`);
                                  }
                                }}
                                className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-md hover:bg-blue-200 transition-colors"
                              >
                                <FaEdit className="mr-1" />
                                Editar
                              </button>
                              <button
                                onClick={() => {
                                  if (fornecedor.fornecedor_id) {
                                    handleStatusChange(
                                      fornecedor.fornecedor_id, 
                                      fornecedor.status_fornecedor === 'Ativo' ? 'Inativo' : 'Ativo',
                                      getNomeFornecedor(fornecedor) || ''
                                    );
                                  }
                                }}
                                className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                  fornecedor.status_fornecedor === 'Ativo' 
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                }`}
                              >
                                {fornecedor.status_fornecedor === 'Ativo' ? (
                                  <>
                                    <FaToggleOff className="mr-1" />
                                    Desativar
                                  </>
                                ) : (
                                  <>
                                    <FaToggleOn className="mr-1" />
                                    Ativar
                                  </>
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Cards View */}
              <div className="lg:hidden">
                <div className="space-y-4 p-4">
                  {fornecedores.map((fornecedor, index) => (
                    <div key={`fornecedor-mobile-${fornecedor.fornecedor_id || index}`} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-3 flex-1">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            fornecedor.tipo_pessoa === 'PJ' ? 'bg-blue-100' : 'bg-green-100'
                          }`}>
                            {fornecedor.tipo_pessoa === 'PJ' ? (
                              <FaBuilding className="h-5 w-5 text-blue-600" />
                            ) : (
                              <FaUser className="h-5 w-5 text-green-600" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">{getNomeFornecedor(fornecedor)}</h3>
                            <p className="text-sm text-gray-600">
                              {fornecedor.tipo_pessoa === 'PJ' ? fornecedor.razao_social : fornecedor.nome_completo}
                            </p>
                            <p className="text-xs text-gray-500 mt-1 flex items-center">
                              <FaIdCard className="mr-1" />
                              {formatDocument(fornecedor)}
                            </p>
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          fornecedor.status_fornecedor === 'Ativo' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {fornecedor.status_fornecedor}
                        </span>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <FaMapMarkerAlt className="mr-2 text-gray-400" />
                          {fornecedor.endereco_cidade}/{fornecedor.endereco_estado_uf}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <FaPhone className="mr-2 text-gray-400" />
                          {fornecedor.telefone_principal?.replace(/^(\d{2})(\d{4,5})(\d{4})$/, '($1) $2-$3')}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                            {fornecedor.tipo_fornecedor}
                          </span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            if (fornecedor.fornecedor_id) {
                              router.push(`/fornecedores/${fornecedor.fornecedor_id}`);
                            }
                          }}
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                        >
                          <FaEdit className="mr-1" />
                          Editar
                        </button>
                        <button
                          onClick={() => {
                            if (fornecedor.fornecedor_id) {
                              handleStatusChange(
                                fornecedor.fornecedor_id, 
                                fornecedor.status_fornecedor === 'Ativo' ? 'Inativo' : 'Ativo',
                                getNomeFornecedor(fornecedor) || ''
                              );
                            }
                          }}
                          className={`flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                            fornecedor.status_fornecedor === 'Ativo' 
                              ? 'bg-red-600 text-white hover:bg-red-700' 
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {fornecedor.status_fornecedor === 'Ativo' ? (
                            <>
                              <FaToggleOff className="mr-1" />
                              Desativar
                            </>
                          ) : (
                            <>
                              <FaToggleOn className="mr-1" />
                              Ativar
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Paginação */}
              <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row items-center justify-between">
                  <div className="text-sm text-gray-600 mb-4 sm:mb-0">
                    Mostrando <span className="font-semibold">{((pagination.page - 1) * pagination.limit) + 1 || 0}</span> a{' '}
                    <span className="font-semibold">{Math.min(pagination.page * pagination.limit, pagination.total) || 0}</span> de{' '}
                    <span className="font-semibold">{pagination.total || 0}</span> fornecedores
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => setPagination({...pagination, page: pagination.page - 1})}
                      disabled={pagination.page === 1}
                      className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-l-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Anterior
                    </button>
                    
                    {/* Page Numbers */}
                    <div className="hidden sm:flex">
                      {[...Array(Math.min(pagination.totalPages, 5))].map((_, i) => {
                        let pageNum;
                        if (pagination.totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (pagination.page <= 3) {
                          pageNum = i + 1;
                        } else if (pagination.page >= pagination.totalPages - 2) {
                          pageNum = pagination.totalPages - 4 + i;
                        } else {
                          pageNum = pagination.page - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPagination({...pagination, page: pageNum})}
                            className={`relative inline-flex items-center px-4 py-2 text-sm font-medium border transition-colors ${
                              pagination.page === pageNum
                                ? 'z-10 bg-blue-600 border-blue-600 text-white'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      onClick={() => setPagination({...pagination, page: pagination.page + 1})}
                      disabled={pagination.page === pagination.totalPages}
                      className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-r-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Próximo
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
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