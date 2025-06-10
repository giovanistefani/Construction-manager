'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/Modal';
import { useModal } from '@/hooks/useModal';
import {
  FaPlus,
  FaHandHoldingUsd,
  FaFileInvoice
} from 'react-icons/fa';
import { AdiantamentoFornecedor, StatusAdiantamento } from '@/types/documento';
import { Fornecedor } from '@/types/fornecedor';

export default function AdiantamentosPage() {
  const router = useRouter();
  const { modalState, hideModal } = useModal();
  const [adiantamentos, setAdiantamentos] = useState<(AdiantamentoFornecedor & { fornecedor_nome: string })[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    fornecedor_id: '',
    status: ''
  });

  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const statusOptions: StatusAdiantamento[] = ['Ativo', 'Utilizado', 'Cancelado'];

  useEffect(() => {
    loadFornecedores();
  }, []);

  useEffect(() => {
    loadAdiantamentos();
  }, [filters, pagination.page]);

  const loadFornecedores = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/fornecedores/simples', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setFornecedores(data.fornecedores || []);
      }
    } catch (error) {
      console.error('Erro ao carregar fornecedores:', error);
    }
  };

  const loadAdiantamentos = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const searchParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([, value]) => value !== '')
        )
      });

      const response = await fetch(`/api/adiantamentos/listar?${searchParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAdiantamentos(data.adiantamentos || []);
        setPagination(prev => ({ ...prev, ...data.pagination }));
      }
    } catch (error) {
      console.error('Erro ao carregar adiantamentos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({ fornecedor_id: '', status: '' });
    setPagination(prev => ({ ...prev, page: 1 }));
  };


  const getStatusColor = (status: StatusAdiantamento) => {
    const colors = {
      'Ativo': 'bg-green-100 text-green-800',
      'Utilizado': 'bg-blue-100 text-blue-800',
      'Cancelado': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-3 mb-4 sm:mb-0">
              <div className="bg-green-500 p-3 rounded-lg">
                <FaHandHoldingUsd className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Adiantamentos a Fornecedores</h1>
                <p className="text-sm text-gray-600">
                  Gerencie os adiantamentos pagos aos fornecedores
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => router.push('/documentos')}
                className="inline-flex items-center justify-center px-4 py-2 border cursor-pointer border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <FaFileInvoice className="mr-2 h-4 w-4" />
                Documentos
              </button>
              <button
                onClick={() => router.push('/adiantamentos/novo')}
                className="inline-flex items-center justify-center cursor-pointer px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors"
              >
                <FaPlus className="mr-2 h-4 w-4" />
                Novo Adiantamento
              </button>
            </div>
          </div>
        </div>


        {/* Filtros */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fornecedor
              </label>
              <select
                value={filters.fornecedor_id}
                onChange={(e) => handleFilterChange('fornecedor_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Todos os fornecedores</option>
                {fornecedores.map((fornecedor) => (
                  <option key={fornecedor.fornecedor_id} value={fornecedor.fornecedor_id}>
                    {fornecedor.nome_fantasia}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              >
                <option value="">Todos os status</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <button
              onClick={clearFilters}
              className="text-gray-600 hover:text-gray-800 text-sm"
            >
              Limpar filtros
            </button>
            <p className="text-sm text-gray-600">
              {pagination.total} adiantamento{pagination.total !== 1 ? 's' : ''} encontrado{pagination.total !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        {/* Lista de Adiantamentos */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Carregando adiantamentos...</p>
          </div>
        ) : adiantamentos.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-600">Nenhum adiantamento encontrado</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fornecedor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor Original
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Saldo Restante
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Descrição
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {adiantamentos.map((adiantamento: AdiantamentoFornecedor & { fornecedor_nome: string }) => (
                    <tr key={adiantamento.adiantamento_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {adiantamento.fornecedor_nome}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(adiantamento.data_adiantamento)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(adiantamento.valor_adiantamento)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                        {formatCurrency(adiantamento.saldo_restante || adiantamento.valor_adiantamento)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(adiantamento.status_adiantamento)}`}>
                          {adiantamento.status_adiantamento}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {adiantamento.descricao_historico}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4">
              {adiantamentos.map((adiantamento: AdiantamentoFornecedor & { fornecedor_nome: string }) => (
                <div
                  key={adiantamento.adiantamento_id}
                  className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {adiantamento.fornecedor_nome}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {formatDate(adiantamento.data_adiantamento)}
                      </p>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(adiantamento.status_adiantamento)}`}>
                      {adiantamento.status_adiantamento}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">Valor Original:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {formatCurrency(adiantamento.valor_adiantamento)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Saldo Restante:</span>
                      <span className="ml-2 font-medium text-green-600">
                        {formatCurrency(adiantamento.saldo_restante || adiantamento.valor_adiantamento)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-500">Descrição:</span>
                      <p className="mt-1 text-gray-900">{adiantamento.descricao_historico}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Paginação */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2 mt-6">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Anterior
                </button>

                <span className="text-sm text-gray-600">
                  Página {pagination.page} de {pagination.totalPages}
                </span>

                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Próxima
                </button>
              </div>
            )}
          </>
        )}
      </div>

      <Modal
        isOpen={modalState.isOpen}
        onClose={hideModal}
        title={modalState.title}
        type={modalState.type}
      >
        {modalState.message}
      </Modal>
    </div>
  );
}