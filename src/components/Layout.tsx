
import React, { ReactNode, useState } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Bell, 
  Settings, 
  Zap, 
  Menu,
  X,
  BookOpen,
  Users,
  FileBarChart,
  Building2,
  Sliders,
  LogOut
} from 'lucide-react';
import { User } from '../types';
import { api } from '../services/api';

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  companyLogo?: string;
  currentUser?: User | null;
  onLogout?: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, companyLogo, currentUser, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Panel de Control', icon: LayoutDashboard },
    { id: 'projects', label: 'Gestión de Proyecto', icon: Calendar },
    { id: 'enterprise', label: 'Gestión Empresarial', icon: Building2 },
    { id: 'reports', label: 'Reportes Globales', icon: FileBarChart },
    { id: 'docs', label: 'Documentación Técnica', icon: BookOpen },
    { id: 'notifications', label: 'Notificaciones IA', icon: Bell },
    { id: 'settings', label: 'Configuración', icon: Sliders }, 
  ];

  const renderLogo = () => {
      if (companyLogo) {
          return <img src={companyLogo} alt="Logo Empresa" className="w-8 h-8 rounded object-cover bg-white" />;
      }
      return (
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/50">
             <Zap className="w-5 h-5" />
          </div>
      );
  };

  const handleLogout = async () => {
      if (confirm("¿Cerrar sesión?")) {
          await api.auth.logout();
          if (onLogout) onLogout();
      }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar Desktop - Added no-print class */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white border-r border-slate-800 no-print transition-all flex-shrink-0">
        <div className="p-6 flex items-center space-x-3 border-b border-slate-800">
          {renderLogo()}
          <div>
            <h1 className="text-sm font-bold leading-tight tracking-tight">
              RyV Instalaciones Eléctricas
            </h1>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto flex flex-col">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center w-full px-4 py-3 rounded-lg transition-colors ${
                activeTab === item.id 
                  ? 'bg-blue-600 text-white shadow-md' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className="w-5 h-5 mr-3" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}

          {/* VISIBLE LOGOUT BUTTON IN NAV */}
          <div className="mt-auto pt-4 border-t border-slate-800">
              <button
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-3 rounded-lg text-slate-400 hover:bg-red-900/30 hover:text-red-400 transition-colors group"
              >
                <LogOut className="w-5 h-5 mr-3 group-hover:text-red-400" />
                <span className="font-medium">Cerrar Sesión</span>
              </button>
          </div>
        </nav>

        {/* Desktop User Footer (Profile Info Only) */}
        <div className="p-4 border-t border-slate-800 bg-slate-900">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center space-x-3 min-w-0 overflow-hidden">
                <div className="w-9 h-9 flex-shrink-0 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white overflow-hidden border border-slate-600">
                {currentUser?.avatar ? (
                    <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                    <span>{currentUser?.name?.substring(0,2).toUpperCase() || 'US'}</span>
                )}
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{currentUser?.name || 'Usuario'}</p>
                    <p className="text-xs text-slate-400 truncate">{currentUser?.role || 'Staff'}</p>
                </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header - Added no-print class */}
        <header className="md:hidden flex items-center justify-between bg-slate-900 p-4 text-white shadow-md no-print z-20">
          <div className="flex items-center space-x-2">
             {renderLogo()}
            <span className="font-bold text-sm">RyV</span>
          </div>
          
          <div className="flex items-center space-x-4">
              {/* Mobile User Profile & Logout */}
              {currentUser && (
                  <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                          <div className="text-right hidden sm:block">
                              <p className="text-xs font-bold text-white leading-none">{currentUser.name.split(' ')[0]}</p>
                              <p className="text-[10px] text-slate-400 leading-none mt-0.5">{currentUser.role}</p>
                          </div>
                          <img 
                            src={currentUser.avatar || `https://ui-avatars.com/api/?name=${currentUser.name}&background=random`} 
                            className="w-8 h-8 rounded-full border border-slate-600" 
                            alt="User"
                          />
                      </div>
                      <button 
                        onClick={handleLogout}
                        className="p-2 bg-slate-800 rounded-full text-red-400 hover:bg-red-600 hover:text-white transition-colors border border-slate-700"
                        title="Salir"
                      >
                          <LogOut className="w-4 h-4" />
                      </button>
                  </div>
              )}
              
              {/* Mobile Menu Toggle */}
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-1 text-slate-300 hover:text-white">
                {isMobileMenuOpen ? <X /> : <Menu />}
              </button>
          </div>
        </header>

        {/* Mobile Menu Overlay - Added no-print class */}
        {isMobileMenuOpen && (
          <div className="absolute top-16 left-0 w-full bg-slate-800 z-50 p-4 shadow-xl md:hidden no-print animate-fade-in border-t border-slate-700">
            <nav className="space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`flex items-center w-full px-4 py-3 rounded-lg ${
                    activeTab === item.id ? 'bg-blue-600 text-white' : 'text-slate-300'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  <span className="font-medium">{item.label}</span>
                </button>
              ))}
              <div className="h-px bg-slate-700 my-2"></div>
              <button 
                onClick={handleLogout}
                className="flex items-center w-full px-4 py-3 rounded-lg text-red-400 hover:bg-slate-700 hover:text-red-300 transition-colors"
              >
                  <LogOut className="w-5 h-5 mr-3" />
                  <span className="font-medium">Cerrar Sesión</span>
              </button>
            </nav>
          </div>
        )}

        <main className="flex-1 overflow-auto p-4 md:p-8 bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
