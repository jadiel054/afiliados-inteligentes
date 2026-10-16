// ============================================
// COMPONENTE: ABA DE CONTA
// ============================================

import { Button } from '@/components/ui/button';
import { LogOut, Trash2, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import type { Usuario } from '@/types';

interface ContaTabProps {
  usuario: Usuario | null;
  logout: () => Promise<void>;
}

export function ContaTab({ usuario, logout }: ContaTabProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Conta</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {usuario?.email || 'Usuário logado'}
        </p>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" leftIcon={<LogOut className="w-4 h-4" />} onClick={logout}>
            Sair
          </Button>
          <Button variant="destructive" leftIcon={<Trash2 className="w-4 h-4" />}>
            Excluir Conta
          </Button>
        </div>
      </div>

      <div className="pt-4 border-t">
        <h4 className="text-md font-medium mb-2">Aparência</h4>
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div>
            <p className="font-medium">Tema da Interface</p>
            <p className="text-sm text-muted-foreground">
              {theme === 'dark' ? 'Modo escuro ativado' : 'Modo claro ativado'}
            </p>
          </div>
          <Button
            variant="outline"
            onClick={toggleTheme}
            leftIcon={theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          >
            {theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}
          </Button>
        </div>
      </div>
    </div>
  );
}
