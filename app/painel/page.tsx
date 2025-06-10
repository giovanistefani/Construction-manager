'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FaBuilding, 
  FaUsers, 
  FaFileInvoiceDollar, 
  FaCog, 
  FaChartLine, 
  FaEye,
  FaPlus,
  FaExclamationTriangle,
  FaMapMarkerAlt
} from 'react-icons/fa';

interface Usuario {
  usuario_id: string;
  email: string;
  nome_usuario: string;
  empresa_principal_id: string;
  empresa_nome: string;
  perfil_acesso: string;
}

interface DashboardStats {
  resumo: {
    totalEmpresas: number;
    totalFornecedores: number;
    valorDocumentos: number;
  };
  statusEmpresas: { status_empresa: string; count: number }[];
  empresasPorPlano: { nome_plano: string; count: number }[];
  documentosPorStatus: { status_documento: string; count: number }[];
  empresasPorMes: { ano: number; mes: number; count: number }[];
  empresasPorEstado: { estado: string; count: number }[];
  ultimasEmpresas: {
    empresa_id: string;
    nome_fantasia: string;
    endereco_cidade: string;
    endereco_estado_uf: string;
    data_criacao: string;
    nome_plano: string;
  }[];
  proximosVencimentos: {
    documento_id: string;
    numero_documento: string;
    data_vencimento: string;
    valor_liquido: number;
    empresa: string;
    fornecedor: string;
  }[];
}

export default function PaginaPainel() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [carregandoStats, setCarregandoStats] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchStats(token);
    }
  }, []);

  const fetchStats = async (token: string) => {
    try {
      const response = await fetch('/api/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setCarregandoStats(false);
    }
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

  if (carregandoStats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <main className="max-w-7xl mx-auto">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
            <p className="text-gray-600">Visão geral do sistema</p>
          </div>

          {/* Cards de Resumo */}
          {carregandoStats ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white p-6 rounded-lg shadow animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-blue-100">
                    <FaBuilding className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Total de Empresas</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats?.resumo.totalEmpresas || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-green-100">
                    <FaUsers className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Fornecedores Ativos</p>
                    <p className="text-2xl font-semibold text-gray-900">{stats?.resumo.totalFornecedores || 0}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow">
                <div className="flex items-center">
                  <div className="p-3 rounded-full bg-yellow-100">
                    <FaFileInvoiceDollar className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-500">Valor em Documentos</p>
                    <p className="text-2xl font-semibold text-gray-900">{formatCurrency(stats?.resumo.valorDocumentos || 0)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Grid Principal */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Ações Rápidas */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => router.push('/empresas')}
                  className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <FaBuilding className="text-blue-600" />
                    <span>Gerenciar Empresas</span>
                  </div>
                  <FaEye className="text-gray-400" />
                </button>
                
                <button 
                  onClick={() => router.push('/empresas/nova')}
                  className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <FaPlus className="text-green-600" />
                    <span>Nova Empresa</span>
                  </div>
                  <FaEye className="text-gray-400" />
                </button>
                
                <button className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <FaChartLine className="text-purple-600" />
                    <span>Relatórios</span>
                  </div>
                  <FaEye className="text-gray-400" />
                </button>
                
                <button 
                  onClick={() => router.push('/configuracoes')}
                  className="w-full text-left px-4 py-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition flex items-center justify-between"
                >
                  <div className="flex items-center space-x-3">
                    <FaCog className="text-gray-600" />
                    <span>Configurações</span>
                  </div>
                  <FaEye className="text-gray-400" />
                </button>
              </div>
            </div>

            {/* Status das Empresas */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Status das Empresas</h3>
              {carregandoStats ? (
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {stats?.statusEmpresas.map((item) => (
                    <div key={item.status_empresa} className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${
                          item.status_empresa === 'Ativa' ? 'bg-green-400' : 'bg-red-400'
                        }`}></div>
                        <span className="text-sm text-gray-700">{item.status_empresa}</span>
                      </div>
                      <span className="font-semibold text-gray-900">{item.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Seção Inferior */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Últimas Empresas */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Empresas Recentes</h3>
              {carregandoStats ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex justify-between items-center py-2 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {stats?.ultimasEmpresas.map((empresa) => (
                    <div key={empresa.empresa_id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <div>
                        <p className="font-medium text-gray-900">{empresa.nome_fantasia}</p>
                        <p className="text-sm text-gray-500 flex items-center">
                          <FaMapMarkerAlt className="mr-1" />
                          {empresa.endereco_cidade}/{empresa.endereco_estado_uf}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">{formatDate(empresa.data_criacao)}</p>
                        <p className="text-xs text-blue-600">{empresa.nome_plano}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Próximos Vencimentos */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Próximos Vencimentos</h3>
              {carregandoStats ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex justify-between items-center py-2 animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              ) : stats?.proximosVencimentos.length === 0 ? (
                <p className="text-gray-500 text-center py-4">Nenhum vencimento próximo</p>
              ) : (
                <div className="space-y-3">
                  {stats?.proximosVencimentos.slice(0, 5).map((doc) => (
                    <div key={doc.documento_id} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                      <div>
                        <p className="font-medium text-gray-900">{doc.numero_documento}</p>
                        <p className="text-sm text-gray-500">{doc.empresa}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-red-600 flex items-center">
                          <FaExclamationTriangle className="mr-1" />
                          {formatDate(doc.data_vencimento)}
                        </p>
                        <p className="text-xs text-gray-500">{formatCurrency(doc.valor_liquido)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}