'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function PaginaVerificar2FA() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const usuarioId = searchParams.get('usuarioId');
  const nomeUsuario = searchParams.get('nome');
  
  const [codigo, setCodigo] = useState('');
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    if (!usuarioId) {
      router.push('/login');
    }
  }, [usuarioId, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valor = e.target.value.replace(/\D/g, ''); // Apenas números
    if (valor.length <= 6) {
      setCodigo(valor);
      setErro('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    setErro('');

    if (codigo.length !== 6) {
      setErro('O código deve ter 6 dígitos');
      setCarregando(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/verificar-2fa', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usuarioId: usuarioId!,
          codigo
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErro(data.erro || 'Falha na verificação');
        return;
      }

      // Armazenar tokens no localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
      
      // Manter o estado do "lembrar-me" se existir
      const lembrarMe = localStorage.getItem('lembrarMe');
      if (!lembrarMe) {
        localStorage.setItem('lembrarMe', 'false');
      }

      // Redirecionar para o painel
      router.push('/painel');
    } catch (err) {
      setErro('Falha ao conectar com o servidor');
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
            <svg className="h-8 w-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-blue-800 mb-2">Verificação em Duas Etapas</h1>
          <p className="text-gray-600">
            Olá {nomeUsuario}! Enviamos um código de verificação para seu e-mail.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="codigo" className="block text-sm font-medium text-gray-700 mb-2">
              Código de Verificação
            </label>
            <input
              type="text"
              id="codigo"
              value={codigo}
              onChange={handleChange}
              required
              maxLength={6}
              className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 placeholder-gray-400 text-gray-800 outline-none"
              placeholder="123456"
            />
            <p className="text-xs text-gray-500 mt-2">
              Digite o código de 6 dígitos enviado para seu e-mail
            </p>
          </div>

          {erro && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {erro}
            </div>
          )}

          <button
            type="submit"
            disabled={carregando || codigo.length !== 6}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {carregando ? 'Verificando...' : 'Verificar Código'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Não recebeu o código?{' '}
            <button 
              onClick={() => router.push('/login')} 
              className="font-medium text-blue-600 hover:text-blue-800 transition"
            >
              Tentar novamente
            </button>
          </p>
        </div>

        <div className="mt-4 p-4 bg-amber-50 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-amber-700">
                O código expira em 5 minutos. Não compartilhe com ninguém.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}