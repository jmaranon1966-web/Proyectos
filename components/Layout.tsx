
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
  Sliders
} from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  companyLogo?: string; // Prop for dynamic logo
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, companyLogo }) => {
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

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar Desktop - Added no-print class */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white border-r border-slate-800 no-print">
        <div className="p-6 flex items-center space-x-3 border-b border-slate-800">
          {renderLogo()}
          <div>
            {/* Same size for all words as requested */}
            <h1 className="text-sm font-bold leading-tight tracking-tight">
              RyV Instalaciones Eléctricas
            </h1>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
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
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold text-white overflow-hidden border-2 border-slate-700">
               <img src="https://i.pravatar.cc/150?u=u1" alt="Profile" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-sm font-medium text-white">Administrador</p>
              <p className="text-xs text-slate-400">RyV Manager</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header - Added no-print class */}
        <header className="md:hidden flex items-center justify-between bg-slate-900 p-4 text-white shadow-md no-print">
          <div className="flex items-center space-x-2">
             {renderLogo()}
            <span className="font-bold text-sm">RyV Instalaciones Eléctricas</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </header>

        {/* Mobile Menu Overlay - Added no-print class */}
        {isMobileMenuOpen && (
          <div className="absolute top-16 left-0 w-full bg-slate-800 z-50 p-4 shadow-xl md:hidden no-print">
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
