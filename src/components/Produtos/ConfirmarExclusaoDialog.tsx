import React from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { AlertCircle } from 'lucide-react';

interface ConfirmarExclusaoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  produtoNome: string;
  loading: boolean;
}

export function ConfirmarExclusaoDialog({
  isOpen,
  onClose,
  onConfirm,
  produtoNome,
  loading,
}: ConfirmarExclusaoDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            Confirmar Exclusão
          </DialogTitle>
          <DialogDescription>
            Tem certeza? Esta ação não pode ser desfeita. O produto "{produtoNome}" será removido, mas o histórico de vendas será preservado.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} loading={loading}>
            Sim, Excluir
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
