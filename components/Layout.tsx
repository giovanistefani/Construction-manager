'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import { FaBars } from 'react-icons/fa';
import { useAutoRefreshToken } from '@/hooks/useAutoRefreshToken';

interface LayoutProps {
  children: React.ReactNode;
}

interface Usuario {
  id: string;
  email: string;
  nomeUsuario: string;
  empresaId: string;
  empresaNome?: string;
  perfilAcesso?: string;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Hook para auto-refresh de token
  useAutoRefreshToken({
    onTokenRefreshed: () => {
      console.log('Token renovado automaticamente');
    }
  });

  // Páginas que não precisam de layout (login, registro, etc.)
  const publicPages = ['/login', '/esqueci-senha', '/redefinir-senha', '/verificar-2fa'];
  const isPublicPage = publicPages.includes(pathname);

  useEffect(() => {
    if (isPublicPage) {
      setLoading(false);
      return;
    }

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

        setUsuario(JSON.parse(dadosUsuario));
      } catch (error) {
        console.error('Erro na verificação de autenticação:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    verificarAutenticacao();
  }, [pathname, router, isPublicPage]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Páginas públicas (sem sidebar)
  if (isPublicPage) {
    return <>{children}</>;
  }

  // Páginas privadas (com sidebar)
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar 
        userName={usuario?.nomeUsuario} 
        userEmail={usuario?.email} 
        mobileMenuOpen={mobileMenuOpen}
        setMobileMenuOpen={setMobileMenuOpen}
        onCollapseChange={setSidebarCollapsed}
      />
      
      {/* Mobile Header */}
      <div className="lg:hidden bg-white shadow-sm border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">C</span>
          </div>
          <h1 className="text-gray-900 font-bold text-lg">ConstructPro</h1>
        </div>
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"
        >
          <FaBars />
        </button>
      </div>
      
      {/* Main Content */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'}`}>
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}