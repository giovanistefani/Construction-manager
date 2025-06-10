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
  FaBuilding,
  FaMapMarkerAlt,
  FaPhone,
  FaEnvelope
} from 'react-icons/fa';

interface Empresa {
  empresa_id: string;
  nome_fantasia: string;
  razao_social: string;
  cnpj: string;
  endereco_cidade: string;
  endereco_estado_uf: string;
  telefone_contato: string;
  email_contato: string;
  status_empresa: string;
  nome_plano: string;
  data_criacao: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function EmpresasPage() {
  const router = useRouter();
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [orderBy, setOrderBy] = useState('nome_fantasia');
  const [orderDir, setOrderDir] = useState<'ASC' | 'DESC'>('ASC');
  const { modalState, hideModal, showSuccess, showError, showConfirm } = useModal();

  const fetchEmpresas = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        search: searchTerm,
        status: statusFilter,
        orderBy,
        orderDir
      });

      const response = await fetch(`/api/empresas/listar?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/login');
          return;
        }
          throw new Error('Erro ao buscar empresas');
      }

      const data = await response.json();
      setEmpresas(data.empresas);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Erro:', error);
      showError('Erro', 'Erro ao carregar empresas');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, searchTerm, statusFilter, orderBy, orderDir, router, showError]);

  useEffect(() => {
    fetchEmpresas();
  }, [fetchEmpresas]);

  const handleSort = (column: string) => {
    if (orderBy === column) {
      setOrderDir(orderDir === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setOrderBy(column);
      setOrderDir('ASC');
    }
  };

  const handleStatusChange = (empresaId: string, novoStatus: string, nomeEmpresa: string) => {
    showConfirm(
      'Confirmar Alteração',
      `Tem certeza que deseja ${novoStatus === 'Ativa' ? 'ativar' : 'desativar'} a empresa "${nomeEmpresa}"?`,
      async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`/api/empresas/${empresaId}`, {
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
            `Empresa ${novoStatus === 'Ativa' ? 'ativada' : 'desativada'} com sucesso!`
          );
          fetchEmpresas();
        } catch (error) {
          console.error('Erro:', error);
          showError('Erro', 'Erro ao alterar status da empresa');
        }
      },
      novoStatus === 'Ativa' ? 'Ativar' : 'Desativar',
      'Cancelar'
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <FaBuilding className="mr-3 text-blue-600" />
                Empresas
              </h1>
              <p className="text-gray-600 mt-2">Gerencie todas as empresas do sistema</p>
            </div>
            <button
              onClick={() => router.push('/empresas/nova')}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-lg shadow-lg hover:from-blue-700 hover:to-blue-800 transform hover:scale-105 transition-all duration-200"
            >
              <FaPlus className="mr-2" />
              Nova Empresa
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
                placeholder="Buscar por nome, razão social ou CNPJ..."
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
                className="appearance-none bg-white border border-gray-300 rounded-lg pl-10 pr-8 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-200 cursor-pointer min-w-[200px]"
              >
                <option value="">Todos os Status</option>
                <option value="Ativa">Empresas Ativas</option>
                <option value="Inativa">Empresas Inativas</option>
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
                <p className="text-gray-600">Carregando empresas...</p>
              </div>
            </div>
          ) : empresas.length === 0 ? (
            <div className="text-center py-16">
              <FaBuilding className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma empresa encontrada</h3>
              <p className="text-gray-500">Comece criando sua primeira empresa</p>
              <button
                onClick={() => router.push('/empresas/nova')}
                className="mt-4 inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FaPlus className="mr-2" />
                Nova Empresa
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
                          onClick={() => handleSort('nome_fantasia')}
                          className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-1">
                            <span>Empresa</span>
                            {orderBy === 'nome_fantasia' && (
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
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          Plano
                        </th>
                        <th 
                          onClick={() => handleSort('status_empresa')}
                          className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center space-x-1">
                            <span>Status</span>
                            {orderBy === 'status_empresa' && (
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
                      {empresas.map((empresa) => (
                        <tr key={empresa.empresa_id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4">
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{empresa.nome_fantasia}</div>
                              <div className="text-sm text-gray-500">{empresa.razao_social}</div>
                              <div className="text-xs text-gray-400 mt-1">{empresa.cnpj}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 flex items-center">
                              <FaPhone className="mr-2 text-gray-400" />
                              {empresa.telefone_contato}
                            </div>
                            <div className="text-sm text-gray-500 flex items-center mt-1">
                              <FaEnvelope className="mr-2 text-gray-400" />
                              {empresa.email_contato}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 flex items-center">
                              <FaMapMarkerAlt className="mr-2 text-gray-400" />
                              {empresa.endereco_cidade}/{empresa.endereco_estado_uf}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {empresa.nome_plano}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                              empresa.status_empresa === 'Ativa' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                empresa.status_empresa === 'Ativa' ? 'bg-green-400' : 'bg-red-400'
                              }`}></span>
                              {empresa.status_empresa}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => router.push(`/empresas/${empresa.empresa_id}`)}
                                className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-md hover:bg-blue-200 transition-colors"
                              >
                                <FaEdit className="mr-1" />
                                Editar
                              </button>
                              <button
                                onClick={() => handleStatusChange(
                                  empresa.empresa_id, 
                                  empresa.status_empresa === 'Ativa' ? 'Inativa' : 'Ativa',
                                  empresa.nome_fantasia
                                )}
                                className={`inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                                  empresa.status_empresa === 'Ativa' 
                                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                                }`}
                              >
                                {empresa.status_empresa === 'Ativa' ? (
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
                  {empresas.map((empresa) => (
                    <div key={empresa.empresa_id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{empresa.nome_fantasia}</h3>
                          <p className="text-sm text-gray-600">{empresa.razao_social}</p>
                          <p className="text-xs text-gray-500 mt-1">{empresa.cnpj}</p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          empresa.status_empresa === 'Ativa' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {empresa.status_empresa}
                        </span>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <FaMapMarkerAlt className="mr-2 text-gray-400" />
                          {empresa.endereco_cidade}/{empresa.endereco_estado_uf}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <FaPhone className="mr-2 text-gray-400" />
                          {empresa.telefone_contato}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            {empresa.nome_plano}
                          </span>
                        </div>
                      </div>

                      <div className="flex space-x-2">
                        <button
                          onClick={() => router.push(`/empresas/${empresa.empresa_id}`)}
                          className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors"
                        >
                          <FaEdit className="mr-1" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleStatusChange(
                            empresa.empresa_id, 
                            empresa.status_empresa === 'Ativa' ? 'Inativa' : 'Ativa',
                            empresa.nome_fantasia
                          )}
                          className={`flex-1 inline-flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                            empresa.status_empresa === 'Ativa' 
                              ? 'bg-red-600 text-white hover:bg-red-700' 
                              : 'bg-green-600 text-white hover:bg-green-700'
                          }`}
                        >
                          {empresa.status_empresa === 'Ativa' ? (
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
                    Mostrando <span className="font-semibold">{((pagination.page - 1) * pagination.limit) + 1}</span> a{' '}
                    <span className="font-semibold">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> de{' '}
                    <span className="font-semibold">{pagination.total}</span> empresas
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