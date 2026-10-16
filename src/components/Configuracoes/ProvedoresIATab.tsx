// ============================================
// COMPONENTE: ABA DE PROVEDORES DE IA
// ============================================

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Plus, CheckCircle, X, Edit, Trash2, Play, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { MENSAGENS, mascararChave } from '@/lib/constantes';
import supabase from '@/lib/supabase';
import type { ProvedorIAConfig, Usuario } from '@/types';
import { ProvedorModal } from './ProvedorModal';

interface ProvedoresIATabProps {
  provedores: ProvedorIAConfig[];
  usuario: Usuario | null;
  onRefetch: () => Promise<void>;
}

export function ProvedoresIATab({ provedores, usuario, onRefetch }: ProvedoresIATabProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingProvedor, setEditingProvedor] = useState<ProvedorIAConfig | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);

  const testarProvedor = async (p: ProvedorIAConfig) => {
    if (!usuario) return;
    setTestingId(p.id);
    try {
      const response = await supabase.functions.invoke('ia-testar', {
        body: {
          provedor_id: p.id,
          provedor: p.provedor,
          usuario_id: usuario.id,
          modelo: p.modelo,
          url_base: p.url_base,
          conta_id: p.conta_id,
        },
      });

      if (response.error) {
        toast.error(MENSAGENS.ERRO_GENERICO);
      }
      await onRefetch();
    } catch (err) {
      console.error('Erro ao testar provedor:', err);
      toast.error(MENSAGENS.ERRO_GENERICO);
    } finally {
      setTestingId(null);
    }
  };

  const excluirProvedor = async (id: string) => {
    if (!usuario) return;
    if (!confirm('Tem certeza que deseja excluir este provedor?')) return;

    try {
      const { error } = await supabase
        .from('provedores_ia')
        .delete()
        .eq('id', id)
        .eq('usuario_id', usuario.id);

      if (error) throw error;
      toast.success('Provedor excluído com sucesso!');
      onRefetch();
    } catch (err) {
      console.error('Erro ao excluir provedor:', err);
      toast.error(MENSAGENS.ERRO_GENERICO);
    }
  };

  const toggleProvedorAtivo = async (provedor: ProvedorIAConfig) => {
    if (!usuario) return;

    try {
      const { error } = await supabase
        .from('provedores_ia')
        .update({ ativo: !provedor.ativo })
        .eq('id', provedor.id)
        .eq('usuario_id', usuario.id);

      if (error) throw error;
      onRefetch();
    } catch (err) {
      console.error('Erro ao alterar status do provedor:', err);
      toast.error(MENSAGENS.ERRO_GENERICO);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">Provedores de IA</h3>
          <p className="text-sm text-muted-foreground">Configure seus provedores de IA para o agente</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => {
          setEditingProvedor(null);
          setShowModal(true);
        }}>
          Adicionar Provedor
        </Button>
      </div>

      {provedores.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p>Nenhum provedor de IA configurado</p>
          <p className="text-sm mt-2">Adicione um provedor para começar a usar o agente</p>
        </div>
      ) : (
        <div className="space-y-4">
          {provedores.map((p) => (
            <div key={p.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Brain className="w-5 h-5 text-primary" />
                  <div className="flex-1">
                    <div className="font-medium">{p.nome || p.provedor || 'Provedor'}</div>
                    <div className="text-sm text-muted-foreground">{p.modelo || ''}</div>
                    {p.url_base && (
                      <div className="text-xs text-muted-foreground">{mascararChave(p.url_base)}</div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={p.ativo ? 'default' : 'secondary'}>
                    {p.ativo ? 'Ativo' : 'Inativo'}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={testingId === p.id}
                    onClick={() => testarProvedor(p)}
                    title="Testar Conexão"
                  >
                    {testingId === p.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Play className="w-4 h-4" />
                    )}
                    <span className="ml-1 text-xs">Testar</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleProvedorAtivo(p)}
                    title={p.ativo ? 'Desativar' : 'Ativar'}
                  >
                    {p.ativo ? <CheckCircle className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingProvedor(p);
                      setShowModal(true);
                    }}
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => excluirProvedor(p.id)}
                    title="Excluir"
                    className="text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {p.ultimo_teste && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Último teste: {new Date(p.ultimo_teste).toLocaleString('pt-BR')}
                  {p.ultimo_teste_ok && ' ✅'}
                  {p.ultimo_teste_ok === false && ' ❌'}
                  {p.ultimo_teste_msg && ` - ${p.ultimo_teste_msg}`}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ProvedorModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        provedor={editingProvedor}
        usuario={usuario}
        onRefetch={onRefetch}
      />
    </div>
  );
}
