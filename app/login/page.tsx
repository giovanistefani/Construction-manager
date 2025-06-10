'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function PaginaLogin() {
  const router = useRouter();
  const [dadosFormulario, setDadosFormulario] = useState({
    nome_usuario: '',
    senha: ''
  });
  const [lembrarMe, setLembrarMe] = useState(false);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDadosFormulario({
      ...dadosFormulario,
      [e.target.name]: e.target.value
    });
    setErro('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    setErro('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(dadosFormulario),
      });

      const data = await response.json();

      if (!response.ok) {
        setErro(data.erro || 'Falha no login');
        return;
      }

      // Verificar se requer 2FA
      if (data.requer2FA) {
        router.push(`/verificar-2fa?usuarioId=${data.usuario.id}&nome=${encodeURIComponent(data.usuario.email)}`);
        return;
      }

      // Armazenar tokens no localStorage
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('usuario', JSON.stringify(data.usuario));
      localStorage.setItem('lembrarMe', lembrarMe.toString());

      console.log('Login bem-sucedido, dados salvos:', {
        token: data.accessToken?.substring(0, 20) + '...',
        usuario: data.usuario
      });

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
          <h1 className="text-3xl font-bold text-blue-800 mb-2">Bem-vindo de Volta</h1>
          <p className="text-gray-600">Entre para acessar sua conta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="nome_usuario" className="block text-sm font-medium text-gray-700 mb-2">
              Usuário ou E-mail
            </label>
            <input
              type="text"
              id="nome_usuario"
              name="nome_usuario"
              value={dadosFormulario.nome_usuario}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 placeholder-gray-400 text-gray-800 outline-none"
              placeholder="Digite seu usuário ou e-mail"
            />
          </div>

          <div>
            <label htmlFor="senha" className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <input
              type="password"
              id="senha"
              name="senha"
              value={dadosFormulario.senha}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 placeholder-gray-400 text-gray-800 outline-none"
              placeholder="Digite sua senha"
            />
          </div>

          {erro && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {erro}
            </div>
          )}

          <div className="flex items-center justify-between">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={lembrarMe}
                onChange={(e) => setLembrarMe(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded text-gray-800 outline-none"
              />
              <span className="ml-2 text-sm text-gray-600">Lembrar-me</span>
            </label>
            <a href="/esqueci-senha" className="text-sm text-blue-600 hover:text-blue-800 transition">
              Esqueceu a senha?
            </a>
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {carregando ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

      </div>
    </div>
  );
}