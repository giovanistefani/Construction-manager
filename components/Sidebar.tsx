'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  FaHome,
  FaBuilding,
  FaUsers,
  FaFileInvoiceDollar,
  FaProjectDiagram,
  FaChartLine,
  FaCog,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaPlus,
  FaChevronDown,
  FaChevronRight,
  FaTruck
} from 'react-icons/fa';

interface SidebarProps {
  userName?: string;
  userEmail?: string;
  mobileMenuOpen?: boolean;
  setMobileMenuOpen?: (open: boolean) => void;
  onCollapseChange?: (collapsed: boolean) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path?: string;
  children?: MenuItem[];
}

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <FaHome />,
    path: '/painel'
  },
  {
    id: 'empresas',
    label: 'Empresas',
    icon: <FaBuilding />,
    children: [
      {
        id: 'empresas-listar',
        label: 'Todas as Empresas',
        icon: <FaBuilding />,
        path: '/empresas'
      },
      {
        id: 'empresas-nova',
        label: 'Nova Empresa',
        icon: <FaPlus />,
        path: '/empresas/nova'
      }
    ]
  },
  {
    id: 'fornecedores',
    label: 'Fornecedores',
    icon: <FaTruck />,
    children: [
      {
        id: 'fornecedores-listar',
        label: 'Todos os Fornecedores',
        icon: <FaTruck />,
        path: '/fornecedores'
      },
      {
        id: 'fornecedores-novo',
        label: 'Novo Fornecedor',
        icon: <FaPlus />,
        path: '/fornecedores/novo'
      }
    ]
  },
  {
    id: 'usuarios',
    label: 'Usuários',
    icon: <FaUsers />,
    children: [
      {
        id: 'usuarios-listar',
        label: 'Todos os Usuários',
        icon: <FaUsers />,
        path: '/usuarios'
      },
      {
        id: 'usuarios-novo',
        label: 'Novo Usuário',
        icon: <FaPlus />,
        path: '/usuarios/novo'
      }
    ]
  },
  {
    id: 'projetos',
    label: 'Projetos',
    icon: <FaProjectDiagram />,
    path: '/projetos'
  },
  {
    id: 'financeiro',
    label: 'Financeiro',
    icon: <FaFileInvoiceDollar />,
    children: [
      {
        id: 'documentos',
        label: 'Documentos',
        icon: <FaFileInvoiceDollar />,
        path: '/documentos'
      },
      {
        id: 'pagamentos',
        label: 'Pagamentos',
        icon: <FaFileInvoiceDollar />,
        path: '/pagamentos'
      }
    ]
  },
  {
    id: 'relatorios',
    label: 'Relatórios',
    icon: <FaChartLine />,
    path: '/relatorios'
  },
  {
    id: 'configuracoes',
    label: 'Configurações',
    icon: <FaCog />,
    path: '/configuracoes'
  }
];

export default function Sidebar({
  userName = 'Usuário',
  userEmail = 'user@example.com',
  mobileMenuOpen = false,
  setMobileMenuOpen = () => { },
  onCollapseChange = () => { }
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedItems, setExpandedItems] = useState<string[]>(['empresas', 'fornecedores', 'usuarios']);
  const router = useRouter();
  const pathname = usePathname();

  const toggleCollapse = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    onCollapseChange(newCollapsedState);
    if (!newCollapsedState) {
      setExpandedItems([]);
    }
  };

  const toggleExpanded = (itemId: string) => {
    if (isCollapsed) return;

    setExpandedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    router.push('/login');
  };

  const isActive = (path?: string) => {
    if (!path) return false;
    return pathname === path;
  };

  const hasActiveChild = (children?: MenuItem[]) => {
    if (!children) return false;
    return children.some(child => isActive(child.path));
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedItems.includes(item.id);
    const itemIsActive = isActive(item.path);
    const hasActiveChildren = hasActiveChild(item.children);

    return (
      <div key={item.id} className="mb-1">
        <div
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.id);
            } else if (item.path) {
              router.push(item.path);
              setMobileMenuOpen(false);
            }
          }}
          className={`
            flex items-center rounded-lg cursor-pointer transition-all duration-200
            ${level > 0 ? 'ml-4 pl-6 pr-3 py-2.5' : isCollapsed ? 'mx-1 px-3 py-3 justify-center' : 'px-3 py-2.5 justify-between'}
            ${itemIsActive || hasActiveChildren
              ? 'bg-blue-600 text-white shadow-lg'
              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }
          `}
        >
          <div className="flex items-center space-x-3 w-full">
            <span className="text-lg flex-shrink-0">
              {item.icon}
            </span>
            {!isCollapsed && (
              <span className="font-medium text-sm flex-1">
                {item.label}
              </span>
            )}
            {!isCollapsed && hasChildren && (
              <span className="text-sm">
                {isExpanded ? <FaChevronDown /> : <FaChevronRight />}
              </span>
            )}
          </div>
        </div>

        {/* Children */}
        {!isCollapsed && hasChildren && isExpanded && (
          <div className="mt-1 space-y-1">
            {item.children?.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed left-0 top-0 h-screen bg-gradient-to-b from-gray-900 to-gray-800 
        shadow-2xl z-50 transition-all duration-300 ease-in-out flex flex-col
        ${isCollapsed ? 'w-16' : 'w-64'}
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        lg:flex
      `}>
        {/* Header */}
        <div className={`p-4 border-b border-gray-700 flex-shrink-0 ${isCollapsed ? 'px-2' : ''}`}>
          <div className={`flex items-center ${isCollapsed ? 'flex-col space-y-3' : 'justify-between'}`}>
            {!isCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <FaBuilding className="text-white text-sm" />
                </div>
                <div>
                  <h1 className="text-white font-bold text-lg">ConstructPro</h1>
                  <p className="text-gray-400 text-xs">Sistema de Gestão</p>
                </div>
              </div>
            )}



            <button
              onClick={toggleCollapse}
              className="p-2 rounded-lg hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
            >
              {isCollapsed ? <FaBars /> : <FaTimes />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className={`flex-1 min-h-0 py-6 space-y-2 overflow-y-auto overflow-x-hidden sidebar-scroll ${isCollapsed ? 'px-2' : 'px-4'}`}>
          {menuItems.map(item => renderMenuItem(item))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-700 flex-shrink-0">
          {!isCollapsed ? (
            <div className="space-y-3">
              {/* User Info */}
              <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-700/50">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-semibold text-sm">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm truncate">
                    {userName}
                  </p>
                  <p className="text-gray-400 text-xs truncate">
                    {userEmail}
                  </p>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-all duration-200"
              >
                <FaSignOutAlt />
                <span className="font-medium text-sm">Sair</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {/* User Avatar */}
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mx-auto">
                <span className="text-white font-semibold text-sm">
                  {userName.charAt(0).toUpperCase()}
                </span>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="w-full p-2.5 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-all duration-200 flex justify-center"
                title="Sair"
              >
                <FaSignOutAlt />
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}