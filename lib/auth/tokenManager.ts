export class TokenManager {
  private static instance: TokenManager;
  private refreshPromise: Promise<string | null> | null = null;

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  async getValidToken(): Promise<string | null> {
    const token = localStorage.getItem('token');
    if (!token) return null;

    // Verificar se o token está próximo do vencimento
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;
      const timeToExpiry = payload.exp - now;

      // Se o token expira em menos de 5 minutos, renovar
      if (timeToExpiry < 300) {
        return this.refreshToken();
      }

      return token;
    } catch (error) {
      // Se não conseguir decodificar, tentar renovar
      return this.refreshToken();
    }
  }

  private async refreshToken(): Promise<string | null> {
    // Evitar múltiplas chamadas simultâneas
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performRefresh();
    const result = await this.refreshPromise;
    this.refreshPromise = null;
    return result;
  }

  private async performRefresh(): Promise<string | null> {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        this.redirectToLogin();
        return null;
      }

      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        this.redirectToLogin();
        return null;
      }

      const data = await response.json();
      localStorage.setItem('token', data.accessToken);
      
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }

      return data.accessToken;
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      this.redirectToLogin();
      return null;
    }
  }

  private redirectToLogin(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('usuario');
    window.location.href = '/login';
  }

  async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const token = await this.getValidToken();
    
    if (!token) {
      throw new Error('Token não disponível');
    }

    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
    };

    return fetch(url, { ...options, headers });
  }
}

export const tokenManager = TokenManager.getInstance();