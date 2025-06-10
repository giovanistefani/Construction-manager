'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaArrowLeft, FaShieldAlt, FaKey, FaUser } from 'react-icons/fa';
import Alert from '@/components/Alert';

interface Usuario {
  id: number;
  email: string;
  nomeUsuario: string;
  empresaId: number;
  doisFatoresAtivo?: boolean;
}

interface StatusSessao {
  lembrarMe: boolean;
  tokenExpiraEm?: string;
}

interface AlertInfo {
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
}

export default function PaginaConfiguracoes() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [alterando2FA, setAlterando2FA] = useState(false);
  const [alert, setAlert] = useState<AlertInfo | null>(null);
  const [statusSessao, setStatusSessao] = useState<StatusSessao>({ lembrarMe: false });

  useEffect(() => {
    const verificarAutenticacao = async () => {
      const token = localStorage.getItem('token');
      const dadosUsuario = localStorage.getItem('usuario');

      if (!token || !dadosUsuario) {
        router.push('/login');
        return;
      }

      try {
        const response = await fetch('/api/auth/validar', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (!data.valido) {
          localStorage.removeItem('token');
          localStorage.removeItem('usuario');
          router.push('/login');
          return;
        }

        const dadosUsuarioParsed = JSON.parse(dadosUsuario);

        // Buscar status atual do 2FA
        const responseStatus = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (responseStatus.ok) {
          const statusData = await responseStatus.json();
          setUsuario({
            id: statusData.usuario.id || dadosUsuarioParsed.id,
            email: statusData.usuario.email || dadosUsuarioParsed.email,
            nomeUsuario: statusData.usuario.nomeUsuario || dadosUsuarioParsed.nomeUsuario,
            empresaId: statusData.usuario.empresaId || dadosUsuarioParsed.empresaId,
            doisFatoresAtivo: statusData.usuario.dois_fatores_ativo || false
          });
        } else {
          // Fallback para dados do localStorage se a API falhar
          setUsuario({
            id: dadosUsuarioParsed.id,
            email: dadosUsuarioParsed.email,
            nomeUsuario: dadosUsuarioParsed.nomeUsuario,
            empresaId: dadosUsuarioParsed.empresaId,
            doisFatoresAtivo: false
          });
        }

        // Verificar status da sessão
        const lembrarMe = localStorage.getItem('lembrarMe') === 'true';
        const token = localStorage.getItem('token');
        let tokenExpiraEm;
        
        if (token) {
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            tokenExpiraEm = new Date(payload.exp * 1000).toLocaleString();
          } catch (e) {
            console.log('Erro ao decodificar token:', e);
          }
        }

        setStatusSessao({ lembrarMe, tokenExpiraEm });
      } catch (error) {
        console.error('Falha na verificação de autenticação:', error);
        router.push('/login');
      } finally {
        setCarregando(false);
      }
    };

    verificarAutenticacao();
  }, [router]);

  const alternar2FA = async () => {
    if (!usuario) return;

    setAlterando2FA(true);
    const token = localStorage.getItem('token');

    try {
      const response = await fetch('/api/auth/configurar-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          ativar: !usuario.doisFatoresAtivo
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setAlert({
          type: 'error',
          title: 'Erro ao alterar 2FA',
          message: data.erro || 'Ocorreu um erro ao alterar a configuração'
        });
        return;
      }

      setUsuario({
        ...usuario,
        doisFatoresAtivo: !usuario.doisFatoresAtivo
      });

      setAlert({
        type: 'success',
        title: '2FA alterado com sucesso',
        message: `${data.mensagem} (Usuário: ${usuario.nomeUsuario}, Empresa ID: ${usuario.empresaId})`
      });
    } catch {
      setAlert({
        type: 'error',
        title: 'Erro ao alterar 2FA',
        message: 'Erro ao comunicar com o servidor. Tente novamente.'
      });
    } finally {
      setAlterando2FA(false);
    }
  };

  const handleVoltar = () => {
    router.push('/painel');
  };

  if (carregando) {
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
    <div className="min-h-screen bg-gray-50">
      {/* Alert Component */}
      {alert && (
        <Alert
          type={alert.type}
          title={alert.title}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleVoltar}
            className="mb-4 text-gray-600 hover:text-gray-900 flex items-center gap-2 transition-colors"
          >
            <FaArrowLeft className="text-sm" />
            <span>Voltar</span>
          </button>

          <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
          <p className="text-gray-600 mt-2">Gerencie suas preferências e configurações da conta</p>
        </div>

        <div className="grid grid-cols-1 gap-6">

          {/* Informações do Usuário */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FaUser className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Informações da Conta</h2>
                  <p className="text-gray-600 text-sm mb-6">Detalhes da sua conta no sistema</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nome de Usuário</label>
                      <p className="text-gray-900">{usuario?.nomeUsuario}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                      <p className="text-gray-900">{usuario?.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">ID da Empresa</label>
                      <p className="text-gray-900">{usuario?.empresaId}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Configurações de Segurança */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <FaShieldAlt className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Segurança</h2>
                  <p className="text-gray-600 text-sm mb-6">Configure as opções de segurança da sua conta</p>

                  {/* Autenticação de Dois Fatores */}
                  <div className="space-y-6">
                    <div className="border-b border-gray-100 pb-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="text-base font-medium text-gray-900">Autenticação de Dois Fatores (2FA)</h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Adicione uma camada extra de segurança. Um código será enviado ao seu e-mail a cada login.
                          </p>
                          <div className="mt-3">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${usuario?.doisFatoresAtivo
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-700'
                              }`}>
                              {usuario?.doisFatoresAtivo ? 'Ativo' : 'Inativo'}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={alternar2FA}
                          disabled={alterando2FA}
                          className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${usuario?.doisFatoresAtivo ? 'bg-blue-600' : 'bg-gray-200'
                            } ${alterando2FA ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${usuario?.doisFatoresAtivo ? 'translate-x-5' : 'translate-x-0'
                              }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Alterar Senha */}
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <FaKey className="text-gray-600 w-4 h-4" />
                            <h3 className="text-base font-medium text-gray-900">Alterar Senha</h3>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            Mantenha sua conta segura com uma senha forte e única.
                          </p>
                        </div>
                        <button
                          onClick={() => router.push('/esqueci-senha')}
                          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          Alterar Senha
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Status da Sessão */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-indigo-100 rounded-lg">
                  <FaKey className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Status da Sessão</h2>
                  <p className="text-gray-600 text-sm mb-6">Informações sobre sua sessão atual</p>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                      <div>
                        <h3 className="text-base font-medium text-gray-900">Lembrar-me</h3>
                        <p className="text-sm text-gray-600">
                          {statusSessao.lembrarMe 
                            ? 'Ativo - Seus tokens são renovados automaticamente' 
                            : 'Inativo - Você precisará fazer login novamente quando o token expirar'
                          }
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        statusSessao.lembrarMe 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {statusSessao.lembrarMe ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>

                    {statusSessao.tokenExpiraEm && (
                      <div className="flex items-center justify-between py-3 px-4 bg-gray-50 rounded-lg">
                        <div>
                          <h3 className="text-base font-medium text-gray-900">Token atual expira em</h3>
                          <p className="text-sm text-gray-600">
                            {statusSessao.tokenExpiraEm}
                          </p>
                        </div>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          1 hora
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}