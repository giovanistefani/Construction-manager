'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/Modal';
import { useModal } from '@/hooks/useModal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  FaArrowLeft,
  FaFileInvoice,
  FaFileUpload,
  FaBuilding,
  FaHashtag,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaAlignLeft,
  FaBarcode,
  FaSave,
  FaTimes,
  FaExclamationTriangle
} from 'react-icons/fa';
import { CreateDocumentoCobrancaData, TipoDocumento, XMLImportData } from '@/types/documento';
import { Fornecedor } from '@/types/fornecedor';

export default function NovoDocumentoPage() {
  const router = useRouter();
  const { modalState, hideModal, showSuccess, showError } = useModal();
  const [loading, setLoading] = useState(false);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [showXMLImport, setShowXMLImport] = useState(false);
  const [duplicateAlert, setDuplicateAlert] = useState(false);
  const [alertDialog, setAlertDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning';
    onConfirm?: () => void;
  }>({
    open: false,
    title: '',
    message: '',
    type: 'success'
  });

  const [formData, setFormData] = useState<CreateDocumentoCobrancaData>({
    fornecedor_id: '',
    tipo_documento: 'Fatura',
    numero_documento: '',
    data_emissao: '',
    data_vencimento: '',
    valor_bruto: 0,
    descricao_historico: '',
    codigo_barras_boleto: '',
    linha_digitavel_boleto: ''
  });

  const tiposDocumento: TipoDocumento[] = [
    'Fatura', 'Recibo', 'Boleto', 'Guia de Imposto', 'Taxa de Condomínio', 'Outros'
  ];

  useEffect(() => {
    loadFornecedores();
  }, []);

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

  const formatCurrency = (value: number): string => {
    if (!value || value === 0) return '';

    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const parseCurrency = (formattedValue: string): number => {
    if (!formattedValue) return 0;

    // Remove formatação (pontos e vírgulas) e converte para número
    const cleanValue = formattedValue
      .replace(/\./g, '') // Remove pontos (milhares)
      .replace(',', '.'); // Troca vírgula por ponto (decimais)

    return parseFloat(cleanValue) || 0;
  };

  const handleInputChange = (field: keyof CreateDocumentoCobrancaData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    setDuplicateAlert(false);
  };

  const [valorInput, setValorInput] = useState('');

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setValorInput(value);

    // Converte para número
    const numericValue = parseFloat(value.replace(',', '.')) || 0;

    setFormData(prev => ({
      ...prev,
      valor_bruto: numericValue
    }));
    setDuplicateAlert(false);
  };

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'warning', onConfirm?: () => void) => {
    setAlertDialog({
      open: true,
      title,
      message,
      type,
      onConfirm
    });
  };

  const closeAlert = () => {
    setAlertDialog(prev => ({ ...prev, open: false }));
  };

  const handleXMLImport = async (file: File) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);

      const response = await fetch('/api/documentos/importar-xml', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataUpload
      });

      if (response.ok) {
        const data = await response.json();
        const xmlData: XMLImportData & { fornecedor_id?: string } = data.xmlData;

        setFormData(prev => ({
          ...prev,
          fornecedor_id: xmlData.fornecedor_id || '',
          numero_documento: xmlData.numero_documento,
          data_emissao: xmlData.data_emissao,
          valor_bruto: xmlData.valor_bruto,
          descricao_historico: xmlData.descricao_historico,
          tipo_documento: 'Fatura'
        }));


        if (!data.fornecedor_encontrado) {
          showAlert('XML Importado', 'XML importado com sucesso, mas o fornecedor não foi encontrado. Selecione-o manualmente.', 'warning');
        } else {
          showAlert('Sucesso', 'XML importado com sucesso!', 'success');
        }
      } else {
        const error = await response.json();
        showAlert('Erro', error.erro || 'Erro ao processar XML', 'error');
      }
    } catch (error) {
      console.error('Erro ao importar XML:', error);
      showAlert('Erro', 'Erro ao importar XML', 'error');
    } finally {
      setLoading(false);
      setShowXMLImport(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fornecedor_id || !formData.numero_documento || !formData.data_emissao
      || !formData.valor_bruto || !formData.descricao_historico) {
      showAlert('Campos Obrigatórios', 'Preencha todos os campos obrigatórios', 'warning');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch('/api/documentos/criar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        const data = await response.json();

        if (data.isDuplicate) {
          setDuplicateAlert(true);
          showAlert(
            'Possível Duplicata',
            'Possível documento duplicado detectado. Deseja continuar?',
            'warning',
            () => {
              showAlert('Sucesso', 'Documento criado com sucesso!', 'success', () => {
                router.push('/documentos');
              });
            }
          );
          return;
        }

        showAlert('Sucesso', 'Documento criado com sucesso!', 'success', () => {
          router.push('/documentos');
        });
      } else {
        const error = await response.json();
        showAlert('Erro', error.erro || 'Erro ao criar documento', 'error');
      }
    } catch (error) {
      console.error('Erro ao criar documento:', error);
      showAlert('Erro', 'Erro ao criar documento', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center text-gray-600 hover:text-gray-800"
            >
              <FaArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </button>
          </div>

          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-blue-500 p-3 rounded-lg">
              <FaFileInvoice className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Novo Documento de Cobrança</h1>
              <p className="text-sm text-gray-600">
                Registre manualmente um documento ou importe via XML de NF-e
              </p>
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowXMLImport(true)}
              className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <FaFileUpload className="mr-2 h-4 w-4" />
              Importar XML (NF-e)
            </button>
          </div>
        </div>

        {/* Dialog de importação XML */}
        <Dialog open={showXMLImport} onOpenChange={setShowXMLImport}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Importar XML (NF-e)</DialogTitle>
            </DialogHeader>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-green-400 hover:bg-green-50 transition-colors">
              <input
                type="file"
                accept=".xml"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleXMLImport(file);
                }}
                className="hidden"
                id="xml-upload"
              />
              <label htmlFor="xml-upload" className="cursor-pointer">
                <FaFileUpload className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                <p className="text-sm font-medium text-gray-900 mb-1">
                  Clique para selecionar arquivo XML
                </p>
                <p className="text-xs text-gray-500">
                  Aceita apenas arquivos .xml de NF-e
                </p>
              </label>
            </div>
          </DialogContent>
        </Dialog>

        {/* Alerta de duplicata */}
        {duplicateAlert && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-yellow-600 mr-3">⚠️</div>
              <div>
                <h4 className="font-medium text-yellow-800">Possível Duplicata Detectada</h4>
                <p className="text-yellow-700 text-sm mt-1">
                  Já existe um documento com o mesmo fornecedor, número e valor.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Informações Básicas */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaFileInvoice className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Informações Básicas</h2>
                <p className="text-sm text-gray-600">Dados principais do documento</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fornecedor *
                </label>
                <select
                  value={formData.fornecedor_id}
                  onChange={(e) => handleInputChange('fornecedor_id', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione o fornecedor</option>
                  {fornecedores.length === 0 && <option disabled>Nenhum fornecedor encontrado</option>}
                  {fornecedores.map((fornecedor) => (
                    <option key={fornecedor.fornecedor_id} value={fornecedor.fornecedor_id}>
                      {fornecedor.nome_fantasia}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Documento *
                </label>
                <select
                  value={formData.tipo_documento}
                  onChange={(e) => handleInputChange('tipo_documento', e.target.value as TipoDocumento)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {tiposDocumento.map((tipo) => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Número do Documento *
                </label>
                <input
                  type="text"
                  value={formData.numero_documento}
                  onChange={(e) => handleInputChange('numero_documento', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: 001234"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor Bruto *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    R$
                  </span>
                  <input
                    type="text"
                    value={valorInput}
                    onChange={handleCurrencyChange}
                    onBlur={() => {
                      // Formata quando sai do campo
                      if (formData.valor_bruto > 0) {
                        const formatted = formData.valor_bruto.toLocaleString('pt-BR', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2
                        });
                        setValorInput(formatted);
                      }
                    }}
                    onFocus={() => {
                      // Remove formatação quando entra no campo
                      if (formData.valor_bruto > 0) {
                        setValorInput(String(formData.valor_bruto));
                      }
                    }}
                    required
                    className="w-full pl-12 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Digite o valor (ex: 1580.20)"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Emissão *
                </label>
                <input
                  type="date"
                  value={formData.data_emissao}
                  onChange={(e) => handleInputChange('data_emissao', e.target.value)}
                  required
                  className="w-full px-3 py-2 cursor-pointer border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Vencimento
                </label>
                <input
                  type="date"
                  value={formData.data_vencimento}
                  onChange={(e) => handleInputChange('data_vencimento', e.target.value)}
                  className="w-full px-3 py-2 border cursor-pointer border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Opcional - deixe em branco se não houver prazo específico
                </p>
              </div>
            </div>
          </div>

          {/* Descrição */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <FaAlignLeft className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Descrição</h2>
                <p className="text-sm text-gray-600">Detalhes e histórico do documento</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição/Histórico *
              </label>
              <textarea
                value={formData.descricao_historico}
                onChange={(e) => handleInputChange('descricao_historico', e.target.value)}
                required
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Descreva o documento, produtos/serviços, observações..."
              />
            </div>
          </div>

          {/* Dados do Boleto (opcional) */}
          {formData.tipo_documento === 'Boleto' && (
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FaBarcode className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">Dados do Boleto</h2>
                  <p className="text-sm text-gray-600">Informações específicas para boletos</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código de Barras
                  </label>
                  <input
                    type="text"
                    value={formData.codigo_barras_boleto || ''}
                    onChange={(e) => handleInputChange('codigo_barras_boleto', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Digite o código de barras"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Linha Digitável
                  </label>
                  <input
                    type="text"
                    value={formData.linha_digitavel_boleto || ''}
                    onChange={(e) => handleInputChange('linha_digitavel_boleto', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Digite a linha digitável"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Botões de ação */}
          <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.back()}
              className="inline-flex items-center px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <FaTimes className="mr-2 h-4 w-4" />
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaSave className="mr-2 h-4 w-4" />
              {loading ? 'Salvando...' : 'Salvar Documento'}
            </button>
          </div>
        </form>
      </div>

      <Modal
        isOpen={modalState.isOpen}
        onClose={hideModal}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
      />

      {/* Alert Dialog */}
      <Dialog open={alertDialog.open} onOpenChange={closeAlert}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className={`flex items-center gap-2 ${alertDialog.type === 'error' ? 'text-red-600' :
              alertDialog.type === 'warning' ? 'text-yellow-600' :
                'text-green-600'
              }`}>
              {alertDialog.type === 'error' && <FaExclamationTriangle />}
              {alertDialog.type === 'warning' && <FaExclamationTriangle />}
              {alertDialog.type === 'success' && <FaSave />}
              {alertDialog.title}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-700">{alertDialog.message}</p>
          </div>
          <DialogFooter className="flex gap-2">
            {alertDialog.onConfirm ? (
              <>
                <button
                  onClick={closeAlert}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    alertDialog.onConfirm?.();
                    closeAlert();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Continuar
                </button>
              </>
            ) : (
              <button
                onClick={closeAlert}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full"
              >
                OK
              </button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}