import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  ShoppingBag,
  Bot,
  Store,
  Bell,
  Settings,
  LogOut,
  Menu,
  X,
  Sparkles
} from 'lucide-react';

interface LayoutProps {
  paginaAtual: string;
  setPaginaAtual: (pagina: string) => void;
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ paginaAtual, setPaginaAtual, children }) => {
  const { usuario, logout } = useAuth();
  const [menuMobileAberto, setMenuMobileAberto] = useState(false);

  const navItems = [
    { id: 'painel', label: 'Painel', icon: LayoutDashboard },
    { id: 'produtos', label: 'Produtos', icon: ShoppingBag },
    { id: 'agente', label: 'Agente IA', icon: Bot, badge: 'IA' },
    { id: 'plataformas', label: 'Plataformas', icon: Store },
    { id: 'notificacoes', label: 'Notificações', icon: Bell },
    { id: 'configuracoes', label: 'Configurações', icon: Settings },
  ];

  const handleNavegar = (id: string) => {
    setPaginaAtual(id);
    setMenuMobileAberto(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-100 flex flex-col md:flex-row">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700/60 p-4 sticky top-0 h-screen justify-between shrink-0">
        <div>
          <div className="flex items-center gap-3 px-3 py-2 mb-6">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-md shadow-blue-500/30">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-sm leading-tight text-slate-900 dark:text-white">
                Afiliados Inteligentes
              </h1>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold uppercase tracking-wider">
                MVP Funcional
              </span>
            </div>
          </div>

          <nav className="space-y-1">
            {navItems.map(item => {
              const Icon = item.icon;
              const ativo = paginaAtual === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavegar(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    ativo
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                      : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                        ativo ? 'bg-white/20 text-white' : 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Rodapé Usuário Desktop */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <img
              src={usuario?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80'}
              alt={usuario?.nome}
              className="w-8 h-8 rounded-full object-cover border border-slate-300 dark:border-slate-600 shrink-0"
            />
            <div className="truncate">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                {usuario?.nome}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {usuario?.email}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            title="Sair"
            className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Header Mobile */}
      <header className="md:hidden bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700/60 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-600 rounded-lg text-white">
            <Bot className="w-5 h-5" />
          </div>
          <span className="font-bold text-sm text-slate-900 dark:text-white">
            Afiliados Inteligentes
          </span>
        </div>
        <button
          onClick={() => setMenuMobileAberto(!menuMobileAberto)}
          className="p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
        >
          {menuMobileAberto ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Drawer Menu Mobile */}
      {menuMobileAberto && (
        <div className="md:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end animate-fadeIn">
          <div className="bg-white dark:bg-slate-800 w-4/5 max-w-xs h-full p-5 flex flex-col justify-between shadow-2xl">
            <div>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                  <span className="font-bold text-sm">Navegação</span>
                </div>
                <button
                  onClick={() => setMenuMobileAberto(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="space-y-1.5">
                {navItems.map(item => {
                  const Icon = item.icon;
                  const ativo = paginaAtual === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleNavegar(item.id)}
                      className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-xs font-semibold transition-all ${
                        ativo
                          ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                          : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-5 h-5" />
                        <span className="text-sm">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2 overflow-hidden">
                <img
                  src={usuario?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&q=80'}
                  alt={usuario?.nome}
                  className="w-9 h-9 rounded-full object-cover shrink-0"
                />
                <div className="truncate">
                  <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                    {usuario?.nome}
                  </p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                    {usuario?.email}
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                className="p-2 text-slate-400 hover:text-red-600 rounded-lg"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Conteúdo Principal */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden pb-20 md:pb-8">
        {children}
      </main>

      {/* Mobile Bottom Navigation Bar para fácil acesso no celular */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-slate-800/90 backdrop-blur-md border-t border-slate-200 dark:border-slate-700/60 py-2 px-3 flex justify-around items-center z-30">
        {navItems.slice(0, 4).map(item => {
          const Icon = item.icon;
          const ativo = paginaAtual === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavegar(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                ativo ? 'text-blue-600 dark:text-blue-400 font-bold' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className={`w-5 h-5 ${ativo ? 'scale-110' : ''}`} />
              <span className="text-[10px]">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
