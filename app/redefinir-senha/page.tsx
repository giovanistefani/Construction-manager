'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { FaCheckCircle } from 'react-icons/fa';

export default function PaginaRedefinirSenha() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  const [dadosFormulario, setDadosFormulario] = useState({
    novaSenha: '',
    confirmarSenha: ''
  });
  const [erros, setErros] = useState<string[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [tokenValido, setTokenValido] = useState<boolean | null>(null);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    const verificarToken = async () => {
      if (!token) {
        setTokenValido(false);
        return;
      }

      try {
        const response = await fetch(`/api/auth/redefinir-senha?token=${token}`);
        const data = await response.json();
        setTokenValido(data.valido);
      } catch (error) {
        setTokenValido(false);
      }
    };

    verificarToken();
  }, [token]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDadosFormulario({
      ...dadosFormulario,
      [e.target.name]: e.target.value
    });
    setErros([]);
  };

  const validarSenha = (senha: string): string[] => {
    const erros: string[] = [];
    
    if (senha.length < 8) {
      erros.push('A senha deve ter pelo menos 8 caracteres');
    }
    if (!/[A-Z]/.test(senha)) {
      erros.push('A senha deve conter pelo menos uma letra maiúscula');
    }
    if (!/[a-z]/.test(senha)) {
      erros.push('A senha deve conter pelo menos uma letra minúscula');
    }
    if (!/[0-9]/.test(senha)) {
      erros.push('A senha deve conter pelo menos um número');
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(senha)) {
      erros.push('A senha deve conter pelo menos um caractere especial');
    }
    
    return erros;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCarregando(true);
    setErros([]);

    // Validar se as senhas coincidem
    if (dadosFormulario.novaSenha !== dadosFormulario.confirmarSenha) {
      setErros(['As senhas não coincidem']);
      setCarregando(false);
      return;
    }

    // Validar força da senha
    const errosSenha = validarSenha(dadosFormulario.novaSenha);
    if (errosSenha.length > 0) {
      setErros(errosSenha);
      setCarregando(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/redefinir-senha', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          novaSenha: dadosFormulario.novaSenha
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.detalhes) {
          setErros(data.detalhes);
        } else {
          setErros([data.erro || 'Falha ao redefinir senha']);
        }
        return;
      }

      // Mostrar mensagem de sucesso e redirecionar
      setSucesso(true);
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err) {
      setErros(['Falha ao conectar com o servidor']);
    } finally {
      setCarregando(false);
    }
  };

  if (tokenValido === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Verificando token...</p>
        </div>
      </div>
    );
  }

  if (tokenValido === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
        <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Link Inválido ou Expirado</h1>
            <p className="text-gray-600 mb-6">
              Este link de recuperação de senha é inválido ou já expirou. 
              Por favor, solicite um novo link.
            </p>
            <button
              onClick={() => router.push('/esqueci-senha')}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition duration-200 font-medium"
            >
              Solicitar Novo Link
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-800 mb-2">Redefinir Senha</h1>
          <p className="text-gray-600">Crie uma nova senha para sua conta</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="novaSenha" className="block text-sm font-medium text-gray-700 mb-2">
              Nova Senha
            </label>
            <input
              type="password"
              id="novaSenha"
              name="novaSenha"
              value={dadosFormulario.novaSenha}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 placeholder-gray-400 text-gray-800 outline-none"
              placeholder="Digite sua nova senha"
            />
          </div>

          <div>
            <label htmlFor="confirmarSenha" className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar Nova Senha
            </label>
            <input
              type="password"
              id="confirmarSenha"
              name="confirmarSenha"
              value={dadosFormulario.confirmarSenha}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition duration-200 placeholder-gray-400 text-gray-800 outline-none"
              placeholder="Confirme sua nova senha"
            />
          </div>

          {erros.length > 0 && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              <ul className="list-disc list-inside">
                {erros.map((erro, index) => (
                  <li key={index}>{erro}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg">
            <p className="font-medium mb-1">Requisitos da Senha:</p>
            <ul className="text-xs space-y-1">
              <li>• Pelo menos 8 caracteres</li>
              <li>• Uma letra maiúscula</li>
              <li>• Uma letra minúscula</li>
              <li>• Um número</li>
              <li>• Um caractere especial</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={carregando}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {carregando ? 'Redefinindo...' : 'Redefinir Senha'}
          </button>
        </form>
      </div>
      
      {/* Toast de Sucesso */}
      {sucesso && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center space-x-3 animate-pulse">
          <FaCheckCircle className="h-6 w-6" />
          <span className="font-medium">Senha redefinida com sucesso!</span>
        </div>
      )}
    </div>
  );
}