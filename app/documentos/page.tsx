'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/Modal';
import { useModal } from '@/hooks/useModal';
import {
  FaPlus,
  FaSearch,
  FaFilter,
  FaFileInvoice,
  FaBuilding,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaHandHoldingUsd,
  FaEye,
  FaExclamationTriangle
} from 'react-icons/fa';
import { DocumentoCobrancaComDados, DocumentosFilter, TipoDocumento, StatusDocumento } from '@/types/documento';
import { Fornecedor } from '@/types/fornecedor';

export default function DocumentosPage() {
  const router = useRouter();
  const { modalState, hideModal, showError } = useModal();
  const [documentos, setDocumentos] = useState<DocumentoCobrancaComDados[]>([]);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<DocumentosFilter>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  const tiposDocumento: TipoDocumento[] = [
    'Fatura', 'Recibo', 'Boleto', 'Guia de Imposto', 'Taxa de Condomínio', 'Outros'
  ];

  const statusDocumento: StatusDocumento[] = [
    'Registrado', 'Aprovado', 'Aprovado para Pagamento', 'Parcialmente Pago', 'Pago', 'Vencido', 'Cancelado'
  ];

  useEffect(() => {
    loadFornecedores();
  }, []);

  useEffect(() => {
    loadDocumentos();
  }, [filters, pagination.page]);

  const loadFornecedores = useCallback(async () => {
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
  }, []);

  const loadDocumentos = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const searchParams = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        numero_documento: searchTerm,
        ...Object.fromEntries(
          Object.entries(filters).filter(([, value]) => value !== undefined && value !== '')
        )
      });

      const response = await fetch(`/api/documentos/listar?${searchParams}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setDocumentos(data.documentos || []);
        setPagination(prev => ({ ...prev, ...data.pagination }));
      }
    } catch (error) {
      console.error('Erro ao carregar documentos:', error);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination.page, searchTerm]);

  const handleFilterChange = (field: keyof DocumentosFilter, value: string) => {
    setFilters(prev => ({
      ...prev,
      [field]: value || undefined
    }));
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const getStatusColor = (status: StatusDocumento) => {
    const colors = {
      'Registrado': 'bg-blue-100 text-blue-800',
      'Aprovado': 'bg-green-100 text-green-800',
      'Aprovado para Pagamento': 'bg-yellow-100 text-yellow-800',
      'Parcialmente Pago': 'bg-orange-100 text-orange-800',
      'Pago': 'bg-emerald-100 text-emerald-800',
      'Vencido': 'bg-red-100 text-red-800',
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

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center space-x-3 mb-4 sm:mb-0">
              <div className="bg-blue-500 p-3 rounded-lg">
                <FaFileInvoice className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Documentos de Cobrança</h1>
                <p className="text-sm text-gray-600">
                  Gerencie faturas, recibos, boletos e outros documentos de fornecedores
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => router.push('/adiantamentos')}
                className="inline-flex items-center justify-center cursor-pointer px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                <FaHandHoldingUsd className="mr-2 h-4 w-4" />
                Adiantamentos
              </button>
              <button
                onClick={() => router.push('/documentos/novo')}
                className="inline-flex items-center justify-center cursor-pointer px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <FaPlus className="mr-2 h-4 w-4" />
                Novo Documento
              </button>
            </div>
          </div>
        </div>

        {/* Barra de pesquisa e filtros */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaSearch className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    placeholder="Buscar por número do documento..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <select
                  value={filters.fornecedor_id || ''}
                  onChange={(e) => handleFilterChange('fornecedor_id', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos fornecedores</option>
                  {fornecedores.map((fornecedor) => (
                    <option key={fornecedor.fornecedor_id} value={fornecedor.fornecedor_id}>
                      {fornecedor.nome_fantasia}
                    </option>
                  ))}
                </select>

                <select
                  value={filters.status_documento || ''}
                  onChange={(e) => handleFilterChange('status_documento', e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos status</option>
                  {statusDocumento.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>

                {(filters.fornecedor_id || filters.status_documento || searchTerm) && (
                  <button
                    onClick={clearFilters}
                    className="px-3 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <FaFilter className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="px-6 py-3 bg-gray-50 text-sm text-gray-600">
            {pagination.total} documento{pagination.total !== 1 ? 's' : ''} encontrado{pagination.total !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Tabela/Cards */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Carregando documentos...</p>
          </div>
        ) : documentos.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-600">Nenhum documento encontrado</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden lg:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Documento
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fornecedor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Datas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documentos.map((documento) => (
                    <tr key={documento.documento_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {documento.tipo_documento}
                          </div>
                          <div className="text-sm text-gray-500">
                            Nº {documento.numero_documento}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {documento.fornecedor_nome}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>Emissão: {formatDate(documento.data_emissao)}</div>
                        {documento.data_vencimento && (
                          <div>Vencimento: {formatDate(documento.data_vencimento)}</div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {formatCurrency(documento.valor_bruto)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(documento.status_documento)}`}>
                          {documento.status_documento}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => router.push(`/documentos/${documento.documento_id}`)}
                          className="inline-flex items-center text-blue-600 hover:text-blue-900"
                        >
                          <FaEye className="mr-1 h-4 w-4" />
                          Ver detalhes
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="lg:hidden space-y-4">
              {documentos.map((documento) => (
                <div
                  key={documento.documento_id}
                  className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {documento.tipo_documento}
                      </h3>
                      <p className="text-sm text-gray-500">Nº {documento.numero_documento}</p>
                    </div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(documento.status_documento)}`}>
                      {documento.status_documento}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-500">Fornecedor:</span>
                      <span className="ml-2 text-gray-900">{documento.fornecedor_nome}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Valor:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {formatCurrency(documento.valor_bruto)}
                      </span>
                    </div>
                    {documento.data_vencimento && (
                      <div>
                        <span className="text-gray-500">Vencimento:</span>
                        <span className="ml-2 text-gray-900">
                          {formatDate(documento.data_vencimento)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <button
                      onClick={() => router.push(`/documentos/${documento.documento_id}`)}
                      className="inline-flex items-center text-blue-600 hover:text-blue-900 text-sm font-medium"
                    >
                      <FaEye className="mr-1 h-4 w-4" />
                      Ver detalhes
                    </button>
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
        message={modalState.message}
        type={modalState.type}
      />
    </div>
  );
}