'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Layout from '@/components/Layout';
import { DocumentoCobrancaComDados, AnexoDocumento, StatusDocumento } from '@/types/documento';

export default function DocumentoDetalhesPage() {
  const router = useRouter();
  const params = useParams();
  const [documento, setDocumento] = useState<DocumentoCobrancaComDados | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingFile, setUploadingFile] = useState(false);

  const loadDocumento = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/documentos/${params.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setDocumento(data);
      } else {
        alert('Documento não encontrado');
        router.push('/documentos');
      }
    } catch (error) {
      console.error('Erro ao carregar documento:', error);
      alert('Erro ao carregar documento');
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  useEffect(() => {
    if (params.id) {
      loadDocumento();
    }
  }, [params.id, loadDocumento]);

  const handleFileUpload = async (file: File) => {
    try {
      setUploadingFile(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/documentos/${params.id}/anexos`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        alert('Anexo enviado com sucesso!');
        loadDocumento(); // Recarregar para mostrar o novo anexo
      } else {
        const error = await response.json();
        alert(error.erro || 'Erro ao enviar anexo');
      }
    } catch (error) {
      console.error('Erro ao enviar anexo:', error);
      alert('Erro ao enviar anexo');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleStatusChange = async (newStatus: StatusDocumento) => {
    if (!documento) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/documentos/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status_documento: newStatus })
      });

      if (response.ok) {
        alert('Status atualizado com sucesso!');
        loadDocumento();
      } else {
        const error = await response.json();
        alert(error.erro || 'Erro ao atualizar status');
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      alert('Erro ao atualizar status');
    }
  };

  const handleCancelDocument = async () => {
    if (!documento || !confirm('Tem certeza que deseja cancelar este documento?')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/documentos/${params.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        alert('Documento cancelado com sucesso!');
        router.push('/documentos');
      } else {
        const error = await response.json();
        alert(error.erro || 'Erro ao cancelar documento');
      }
    } catch (error) {
      console.error('Erro ao cancelar documento:', error);
      alert('Erro ao cancelar documento');
    }
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

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const getFileIcon = (tipo: string) => {
    switch (tipo) {
      case 'PDF': return '📄';
      case 'JPG':
      case 'PNG': return '🖼️';
      case 'XML': return '📋';
      default: return '📎';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600 mt-2">Carregando documento...</p>
        </div>
      </Layout>
    );
  }

  if (!documento) {
    return (
      <Layout>
        <div className="text-center py-8">
          <p className="text-gray-600">Documento não encontrado</p>
        </div>
      </Layout>
    );
  }

  const canEdit = !['Pago', 'Cancelado'].includes(documento.status_documento);
  const canCancel = !['Pago', 'Parcialmente Pago', 'Cancelado'].includes(documento.status_documento);

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-800"
            >
              ← Voltar
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {documento.tipo_documento} - {documento.numero_documento}
              </h1>
              <p className="text-gray-600 mt-2">
                Fornecedor: {documento.fornecedor_nome}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${getStatusColor(documento.status_documento)}`}>
                {documento.status_documento}
              </span>
              {canCancel && (
                <button
                  onClick={handleCancelDocument}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Cancelar Documento
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Informações Principais */}
          <div className="lg:col-span-2 space-y-8">
            {/* Dados Básicos */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Informações do Documento</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Tipo de Documento
                  </label>
                  <p className="text-gray-900">{documento.tipo_documento}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Número
                  </label>
                  <p className="text-gray-900">{documento.numero_documento}</p>
                </div>

                <div>
                  <label className="block cursor-pointer text-sm font-medium text-gray-500 mb-1">
                    Data de Emissão
                  </label>
                  <p className="text-gray-900">{formatDate(documento.data_emissao)}</p>
                </div>

                {documento.data_vencimento && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Data de Vencimento
                    </label>
                    <p className="text-gray-900">{formatDate(documento.data_vencimento)}</p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Valor Bruto
                  </label>
                  <p className="text-xl font-semibold text-gray-900">
                    {formatCurrency(documento.valor_bruto)}
                  </p>
                </div>

                {documento.valor_liquido && (
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">
                      Valor Líquido
                    </label>
                    <p className="text-xl font-semibold text-green-600">
                      {formatCurrency(documento.valor_liquido)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Descrição */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Descrição/Histórico</h2>
              <p className="text-gray-700 whitespace-pre-wrap">{documento.descricao_historico}</p>
            </div>

            {/* Dados do Boleto */}
            {documento.tipo_documento === 'Boleto' && (documento.codigo_barras_boleto || documento.linha_digitavel_boleto) && (
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">Dados do Boleto</h2>
                
                <div className="space-y-4">
                  {documento.codigo_barras_boleto && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Código de Barras
                      </label>
                      <p className="text-gray-900 font-mono text-sm bg-gray-50 p-2 rounded">
                        {documento.codigo_barras_boleto}
                      </p>
                    </div>
                  )}

                  {documento.linha_digitavel_boleto && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">
                        Linha Digitável
                      </label>
                      <p className="text-gray-900 font-mono text-sm bg-gray-50 p-2 rounded">
                        {documento.linha_digitavel_boleto}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Anexos */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Anexos</h2>
                <div>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.xml"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file);
                    }}
                    className="hidden"
                    id="file-upload"
                    disabled={uploadingFile}
                  />
                  <label
                    htmlFor="file-upload"
                    className={`cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors ${
                      uploadingFile ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    {uploadingFile ? 'Enviando...' : '📎 Adicionar Anexo'}
                  </label>
                </div>
              </div>

              {documento.anexos && documento.anexos.length > 0 ? (
                <div className="space-y-3">
                  {documento.anexos.map((anexo: AnexoDocumento) => (
                    <div
                      key={anexo.anexo_id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{getFileIcon(anexo.tipo_arquivo)}</span>
                        <div>
                          <p className="font-medium text-gray-900">{anexo.nome_arquivo}</p>
                          <p className="text-sm text-gray-500">
                            {anexo.tipo_arquivo} • {anexo.tamanho_arquivo_mb?.toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">
                          {formatDateTime(anexo.data_upload)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">
                  Nenhum anexo adicionado
                </p>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Alterar Status */}
            {canEdit && (
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Alterar Status</h3>
                
                <div className="space-y-2">
                  {(['Registrado', 'Aprovado', 'Aprovado para Pagamento', 'Vencido'] as StatusDocumento[])
                    .filter(status => status !== documento.status_documento)
                    .map((status) => (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        className="w-full text-left px-3 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        {status}
                      </button>
                    ))}
                </div>
              </div>
            )}

            {/* Informações de Registro */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações de Registro</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Registrado por
                  </label>
                  <p className="text-gray-900">{documento.usuario_nome}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">
                    Data de Registro
                  </label>
                  <p className="text-gray-900">{formatDateTime(documento.data_registro)}</p>
                </div>
              </div>
            </div>

            {/* Resumo Financeiro */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumo Financeiro</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Valor Bruto:</span>
                  <span className="font-medium">{formatCurrency(documento.valor_bruto)}</span>
                </div>
                
                {documento.valor_liquido && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Valor Líquido:</span>
                    <span className="font-medium text-green-600">
                      {formatCurrency(documento.valor_liquido)}
                    </span>
                  </div>
                )}

                <div className="border-t pt-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Status do Pagamento:</span>
                    <span className={`font-medium ${
                      documento.status_documento === 'Pago' ? 'text-green-600' :
                      documento.status_documento === 'Parcialmente Pago' ? 'text-orange-600' :
                      documento.status_documento === 'Vencido' ? 'text-red-600' :
                      'text-gray-600'
                    }`}>
                      {documento.status_documento === 'Pago' ? 'Pago' :
                       documento.status_documento === 'Parcialmente Pago' ? 'Parcial' :
                       documento.status_documento === 'Vencido' ? 'Vencido' :
                       'Pendente'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}