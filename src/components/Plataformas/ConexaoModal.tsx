import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { ContaPlataforma } from '@/types';

interface ConexaoModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingConta: Partial<ContaPlataforma> | undefined;
  token: string;
  setToken: (v: string) => void;
  onSubmit: () => void;
  formLoading: boolean;
}

export function ConexaoModal({
  isOpen,
  onClose,
  editingConta,
  token,
  setToken,
  onSubmit,
  formLoading,
}: ConexaoModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingConta?.id ? 'Editar Conexão' : 'Nova Conexão'}
          </DialogTitle>
          <DialogDescription>
            {editingConta?.plataforma?.nome && (
              <>Conecte sua conta de {editingConta.plataforma.nome}</>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {editingConta?.plataforma && (
            <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: editingConta.plataforma.cor_hex }}
              />
              <span className="font-semibold">{editingConta.plataforma.nome}</span>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="token">ID do Afiliado / Token</Label>
            <Input
              id="token"
              type="text"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Informe seu ID de afiliado ou token"
              disabled={formLoading}
            />
            <p className="text-xs text-muted-foreground">
              Este dado será armazenado de forma segura no Supabase Vault
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={formLoading}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} loading={formLoading}>
            {editingConta?.id ? 'Salvar' : 'Conectar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
