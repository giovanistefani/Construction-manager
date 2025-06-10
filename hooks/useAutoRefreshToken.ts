'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface UseAutoRefreshTokenProps {
  onTokenRefreshed?: (newToken: string) => void;
}

export const useAutoRefreshToken = ({ onTokenRefreshed }: UseAutoRefreshTokenProps = {}) => {
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isRefreshingRef = useRef(false);

  const refreshToken = async (): Promise<boolean> => {
    // Evitar múltiplas tentativas simultâneas
    if (isRefreshingRef.current) {
      return false;
    }

    isRefreshingRef.current = true;

    try {
      const currentToken = localStorage.getItem('token');
      const refreshTokenValue = localStorage.getItem('refreshToken');
      const lembrarMe = localStorage.getItem('lembrarMe') === 'true';

      // Se não tem "lembrar-me" ativo, não renovar automaticamente
      if (!lembrarMe || !currentToken || !refreshTokenValue) {
        return false;
      }

      console.log('Tentando renovar token automaticamente...');

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        },
        body: JSON.stringify({
          refreshToken: refreshTokenValue
        })
      });

      if (!response.ok) {
        console.log('Falha ao renovar token:', response.status);
        // Se falhou, redirecionar para login
        localStorage.clear();
        router.push('/login');
        return false;
      }

      const data = await response.json();

      // Atualizar tokens no localStorage
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);

      console.log('Token renovado com sucesso');

      // Callback opcional
      if (onTokenRefreshed) {
        onTokenRefreshed(data.accessToken);
      }

      return true;
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      // Em caso de erro, redirecionar para login
      localStorage.clear();
      router.push('/login');
      return false;
    } finally {
      isRefreshingRef.current = false;
    }
  };

  const startAutoRefresh = () => {
    // Limpar interval existente
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Verificar se "lembrar-me" está ativo
    const lembrarMe = localStorage.getItem('lembrarMe') === 'true';
    
    if (!lembrarMe) {
      console.log('Auto-refresh desabilitado: "Lembrar-me" não está ativo');
      return;
    }

    console.log('Iniciando auto-refresh de token (15 minutos)');

    // Renovar token a cada 15 minutos (900000 ms)
    intervalRef.current = setInterval(async () => {
      await refreshToken();
    }, 15 * 60 * 1000);

    // Também tentar renovar imediatamente se o token está próximo do vencimento
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // Decodificar o JWT para verificar expiração
        const payload = JSON.parse(atob(token.split('.')[1]));
        const expirationTime = payload.exp * 1000; // Converter para milliseconds
        const currentTime = Date.now();
        const timeUntilExpiration = expirationTime - currentTime;

        // Se o token expira em menos de 30 minutos, renovar agora
        if (timeUntilExpiration < 30 * 60 * 1000) {
          console.log('Token próximo do vencimento, renovando agora...');
          refreshToken(); // Removido await - deixar rodar em background
        }
      } catch (error) {
        console.log('Erro ao verificar expiração do token:', error);
      }
    }
  };

  const stopAutoRefresh = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('Auto-refresh de token parado');
    }
  };

  useEffect(() => {
    // Iniciar auto-refresh quando o hook for montado
    startAutoRefresh();

    // Cleanup quando o componente for desmontado
    return () => {
      stopAutoRefresh();
    };
  }, []);

  return {
    refreshToken,
    startAutoRefresh,
    stopAutoRefresh
  };
};