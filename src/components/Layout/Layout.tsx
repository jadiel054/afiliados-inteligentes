import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  Package,
  Bot,
  Layers,
  Bell,
  Settings,
  LogOut,
} from 'lucide-react';

const desktopNavItems = [
  { label: 'Painel', path: '/', icon: LayoutDashboard },
  { label: 'Produtos', path: '/produtos', icon: Package },
  { label: 'Agente', path: '/agente', icon: Bot },
  { label: 'Plataformas', path: '/plataformas', icon: Layers },
  { label: 'Notificações', path: '/notificacoes', icon: Bell },
  { label: 'Configurações', path: '/configuracoes', icon: Settings },
];

const mobileNavItems = [
  { label: 'Painel', path: '/', icon: LayoutDashboard },
  { label: 'Produtos', path: '/produtos', icon: Package },
  { label: 'Agente', path: '/agente', icon: Bot },
  { label: 'Notificações', path: '/notificacoes', icon: Bell },
  { label: 'Configurações', path: '/configuracoes', icon: Settings },
];

export default function Layout() {
  const { usuario, logout } = useAuth();

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r bg-card z-30">
        <div className="flex flex-col h-full p-4">
          <div className="flex items-center gap-2 px-2 py-4 border-b mb-4">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold">
              AI
            </div>
            <span className="font-bold text-lg leading-tight">Afiliados Inteligentes</span>
          </div>

          <nav className="flex-1 space-y-1">
            {desktopNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          <div className="pt-4 border-t space-y-3">
            {usuario && (
              <div className="px-2">
                <p className="text-xs text-muted-foreground truncate">{usuario.email}</p>
                {usuario.nome && <p className="text-sm font-medium truncate">{usuario.nome}</p>}
              </div>
            )}
            <Button
              variant="outline"
              className="w-full justify-start text-destructive hover:text-destructive"
              onClick={logout}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:pl-64 min-w-0">
        <main className="flex-1 pb-16 md:pb-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation (5 items) */}
      <nav className="fixed bottom-0 left-0 right-0 border-t bg-card md:hidden z-40">
        <div className="grid grid-cols-5 h-14 max-w-md mx-auto">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center text-[10px] font-medium transition-colors ${
                    isActive
                      ? 'text-primary'
                      : 'text-muted-foreground hover:text-foreground'
                  }`
                }
              >
                <Icon className="w-5 h-5 mb-0.5" />
                <span className="truncate w-full text-center px-0.5">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
