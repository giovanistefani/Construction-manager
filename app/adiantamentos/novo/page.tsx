'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Modal from '@/components/Modal';
import { useModal } from '@/hooks/useModal';
import {
  FaArrowLeft,
  FaHandHoldingUsd,
  FaBuilding,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaAlignLeft,
  FaSave,
  FaTimes
} from 'react-icons/fa';
import { CreateAdiantamentoData } from '@/types/documento';
import { Fornecedor } from '@/types/fornecedor';

export default function NovoAdiantamentoPage() {
  const router = useRouter();
  const { modalState, hideModal, showSuccess, showError } = useModal();
  const [loading, setLoading] = useState(false);
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);

  const [formData, setFormData] = useState<CreateAdiantamentoData>({
    fornecedor_id: '',
    data_adiantamento: '',
    valor_adiantamento: 0,
    descricao_historico: ''
  });

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

  const handleInputChange = (field: keyof CreateAdiantamentoData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fornecedor_id || !formData.data_adiantamento ||
      !formData.valor_adiantamento || !formData.descricao_historico) {
      showError('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await fetch('/api/adiantamentos/criar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        showSuccess('Sucesso', 'Adiantamento registrado com sucesso!');
        setTimeout(() => {
          router.push('/adiantamentos');
        }, 1500);
      } else {
        const error = await response.json();
        showError('Erro', error.erro || 'Erro ao registrar adiantamento');
      }
    } catch (error) {
      console.error('Erro ao registrar adiantamento:', error);
      showError('Erro', 'Erro ao registrar adiantamento');
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
              className="inline-flex items-center  text-gray-600 hover:text-gray-800"
            >
              <FaArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </button>
          </div>

          <div className="flex items-center space-x-3">
            <div className="bg-green-500 p-3 rounded-lg">
              <FaHandHoldingUsd className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Novo Adiantamento</h1>
              <p className="text-sm text-gray-600">
                Registre um adiantamento pago a um fornecedor
              </p>
            </div>
          </div>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Informações Básicas */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <FaHandHoldingUsd className="h-4 w-4 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Informações do Adiantamento</h2>
                <p className="text-sm text-gray-600">Dados básicos do adiantamento</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaBuilding className="inline mr-2 h-4 w-4" />
                  Fornecedor *
                </label>
                <select
                  value={formData.fornecedor_id}
                  onChange={(e) => handleInputChange('fornecedor_id', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Selecione o fornecedor</option>
                  {fornecedores.map((fornecedor) => (
                    <option key={fornecedor.fornecedor_id} value={fornecedor.fornecedor_id}>
                      {fornecedor.nome_fantasia}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaCalendarAlt className="inline mr-2 h-4 w-4" />
                  Data do Adiantamento *
                </label>
                <input
                  type="date"
                  value={formData.data_adiantamento}
                  onChange={(e) => handleInputChange('data_adiantamento', e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 cursor-pointer rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaMoneyBillWave className="inline mr-2 h-4 w-4" />
                  Valor do Adiantamento *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.valor_adiantamento || ''}
                  onChange={(e) => handleInputChange('valor_adiantamento', parseFloat(e.target.value) || 0)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="0,00"
                />
              </div>
            </div>
          </div>

          {/* Descrição */}
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <FaAlignLeft className="h-4 w-4 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Descrição</h2>
                <p className="text-sm text-gray-600">Motivo e detalhes do adiantamento</p>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Descreva o motivo do adiantamento, projeto relacionado, etc..."
              />
            </div>
          </div>

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
              className="inline-flex items-center px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaSave className="mr-2 h-4 w-4" />
              {loading ? 'Salvando...' : 'Salvar Adiantamento'}
            </button>
          </div>
        </form>
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