// ============================================
// COMPONENTE: ABA DE CONTA
// ============================================

import { Button } from '@/components/ui/button';
import { LogOut, Trash2 } from 'lucide-react';
import type { Usuario } from '@/types';

interface ContaTabProps {
  usuario: Usuario | null;
  logout: () => Promise<void>;
}

export function ContaTab({ usuario, logout }: ContaTabProps) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Conta</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {usuario?.email || 'Usuário logado'}
        </p>
        <div className="flex gap-2">
          <Button variant="outline" leftIcon={<LogOut className="w-4 h-4" />} onClick={logout}>
            Sair
          </Button>
          <Button variant="destructive" leftIcon={<Trash2 className="w-4 h-4" />}>
            Excluir Conta
          </Button>
        </div>
      </div>
    </div>
  );
}
