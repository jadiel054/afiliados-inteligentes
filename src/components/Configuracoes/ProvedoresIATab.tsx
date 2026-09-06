// ============================================
// COMPONENTE: ABA DE PROVEDORES DE IA
// ============================================

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Brain, Plus, CheckCircle, X, Edit, Save, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { MENSAGENS, PROVEDORES_IA, mascararChave } from '@/lib/constantes';
import supabase from '@/lib/supabase';
import type { ProvedorIAConfig, ProvedorIA, ProvedorIAFormData, Usuario } from '@/types';

// Componentes para o modal
function ProvedorModal({
  isOpen,
  onClose,
  provedor,
  usuario,
  onRefetch,
}: {
  isOpen: boolean;
  onClose: () => void;
  provedor: ProvedorIAConfig | null;
  usuario: Usuario | null;
  onRefetch: () => Promise<void>;
}) {
  const [formData, setFormData] = useState<ProvedorIAFormData>({
    nome: '',
    provedor: 'groq',
    url_base: '',
    conta_id: '',
    modelo: '',
    ativo: true,
    ordem_fallback: 1,
    chave_api: '',
  });
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  // Inicializar form com dados do provedor
  if (isOpen && provedor && 
      (formData.nome !== provedor.nome || 
       formData.provedor !== provedor.provedor ||
       formData.url_base !== (provedor.url_base || '') ||
       formData.conta_id !== (provedor.conta_id || '') ||
       formData.modelo !== provedor.modelo ||
       formData.ativo !== provedor.ativo ||
       formData.ordem_fallback !== provedor.ordem_fallback)) {
    setFormData({
      nome: provedor.nome || '',
      provedor: provedor.provedor,
      url_base: provedor.url_base || '',
      conta_id: provedor.conta_id || '',
      modelo: provedor.modelo,
      ativo: provedor.ativo,
      ordem_fallback: provedor.ordem_fallback,
      chave_api: '',
    });
  }

  const handleChange = (field: keyof ProvedorIAFormData, value: string | number | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getModeloPlaceholder = (p: ProvedorIA): string => {
    const placeholders: Record<ProvedorIA, string> = {
      groq: 'llama-3.3-70b-versatile',
      ollama: 'llama3.3',
      gemini: 'gemini-2.0-flash',
      cloudflare: '@cf/meta/llama-3.1-8b-instruct',
      openrouter: 'llama-3.3-70b-versatile',
      deepseek: 'deepseek-chat',
    };
    return placeholders[p] || 'Modelo do provedor';
  };

  const getChavePlaceholder = (p: ProvedorIA): string => {
    const placeholders: Record<ProvedorIA, string> = {
      groq: 'gsk_...',
      ollama: 'Não necessário (servidor local)',
      gemini: 'Sua chave API da Google',
      cloudflare: 'Seu token da Cloudflare',
      openrouter: 'sk-or-v1-...',
      deepseek: 'sk-...',
    };
    return placeholders[p];
  };

  const testarConexao = async () => {
    if (!usuario) return;
    
    const { provedor: p, url_base, modelo, chave_api, conta_id } = formData;
    
    if (!p) {
      toast.error('Selecione um provedor.');
      return;
    }
    
    if (!chave_api && p !== 'ollama') {
      toast.error('Informe a chave API.');
      return;
    }
    
    if (p === 'ollama' && !url_base) {
      toast.error('Informe a URL base para Ollama.');
      return;
    }
    
    if (p === 'cloudflare' && (!url_base || !conta_id)) {
      toast.error('Informe a URL base e o Account ID para Cloudflare.');
      return;
    }

    setTesting(true);
    
    try {
      const response = await supabase.functions.invoke('ia-testar', {
        body: {
          provedor: p,
          url_base,
          modelo,
          chave_api,
          conta_id,
          usuario_id: usuario.id,
        },
      });
      
      const data = await response.json();
      
      if (response.ok && data.sucesso) {
        toast.success(`Conexão com ${p} testada com sucesso!`);
        
        // Se for um novo provedor, salvar agora
        if (!provedor) {
          // Gerar ordem_fallback
          const { data: existing, error: fetchError } = await supabase
            .from('provedores_ia')
            .select('ordem_fallback')
            .eq('usuario_id', usuario.id)
            .order('ordem_fallback', { ascending: false })
            .limit(1);
          
          const nextOrdem = existing && existing.length > 0 ? existing[0].ordem_fallback + 1 : 1;
          
          // Salvar o novo provedor
          const { error: insertError } = await supabase
            .from('provedores_ia')
            .insert({
              usuario_id: usuario.id,
              nome: formData.nome || p,
              provedor: p,
              vault_secret_id: data.vault_secret_id,
              url_base: formData.url_base,
              conta_id: formData.conta_id,
              modelo: formData.modelo,
              ativo: formData.ativo,
              ordem_fallback: nextOrdem,
            });
          
          if (insertError) {
            console.error('Erro ao salvar provedor:', insertError);
            toast.error('Conexão ok, mas falha ao salvar. Tente novamente.');
          } else {
            toast.success('Provedor salvo com sucesso!');
            onRefetch();
            onClose();
          }
        }
      } else {
        toast.error(data.mensagem || 'Falha ao testar conexão.');
      }
    } catch (err) {
      console.error('Erro ao testar conexão:', err);
      toast.error(MENSAGENS.ERRO_GENERICO);
    } finally {
      setTesting(false);
    }
  };

  const salvarProvedor = async () => {
    if (!usuario || !provedor) return;
    
    const { nome, provedor: p, url_base, modelo, ativo, ordem_fallback, conta_id } = formData;
    
    if (!p || !modelo) {
      toast.error('Preencha todos os campos obrigatórios.');
      return;
    }

    setSaving(true);
    
    try {
      const provedorData: Omit<ProvedorIAFormData, 'chave_api'> & { usuario_id: string } = {
        usuario_id: usuario.id,
        nome: nome || p,
        provedor: p,
        url_base,
        conta_id,
        modelo,
        ativo,
        ordem_fallback,
      };
      
      // Atualizar existente
      const { error } = await supabase
        .from('provedores_ia')
        .update(provedorData)
        .eq('id', provedor.id)
        .eq('usuario_id', usuario.id);
      
      if (error) throw error;
      
      toast.success('Provedor atualizado com sucesso!');
      onRefetch();
      onClose();
    } catch (err) {
      console.error('Erro ao salvar provedor:', err);
      toast.error(MENSAGENS.ERRO_GENERICO);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = provedor ? salvarProvedor : testarConexao;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {provedor ? 'Editar Provedor' : 'Adicionar Provedor'}
          </h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Provedor</Label>
            <Select
              value={formData.provedor}
              onValueChange={(value) => handleChange('provedor', value as ProvedorIA)}
              disabled={!!provedor}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um provedor" />
              </SelectTrigger>
              <SelectContent>
                {PROVEDORES_IA.map(p => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Nome (opcional)</Label>
            <Input
              value={formData.nome}
              onChange={(e) => handleChange('nome', e.target.value)}
              placeholder="Nome para identificação"
            />
          </div>

          {formData.provedor === 'ollama' && (
            <div className="space-y-2">
              <Label>URL Base do Ollama</Label>
              <Input
                value={formData.url_base}
                onChange={(e) => handleChange('url_base', e.target.value)}
                placeholder="http://localhost:11434"
              />
              <p className="text-xs text-muted-foreground">
                Exemplo: http://localhost:11434
              </p>
            </div>
          )}

          {formData.provedor === 'cloudflare' && (
            <>
              <div className="space-y-2">
                <Label>URL Base da Cloudflare</Label>
                <Input
                  value={formData.url_base}
                  onChange={(e) => handleChange('url_base', e.target.value)}
                  placeholder="https://api.cloudflare.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Account ID</Label>
                <Input
                  value={formData.conta_id}
                  onChange={(e) => handleChange('conta_id', e.target.value)}
                  placeholder="Seu Account ID"
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Modelo</Label>
            <Input
              value={formData.modelo}
              onChange={(e) => handleChange('modelo', e.target.value)}
              placeholder={getModeloPlaceholder(formData.provedor)}
            />
          </div>

          <div className="space-y-2">
            <Label>Ordem de Fallback</Label>
            <Input
              type="number"
              value={formData.ordem_fallback}
              onChange={(e) => handleChange('ordem_fallback', parseInt(e.target.value) || 1)}
              min={1}
            />
            <p className="text-xs text-muted-foreground">
              Provedores são tentados na ordem crescente (1 = primeiro)
            </p>
          </div>

          <div className="space-y-2">
            <Label>Chave API</Label>
            <Input
              type="password"
              value={formData.chave_api}
              onChange={(e) => handleChange('chave_api', e.target.value)}
              placeholder={getChavePlaceholder(formData.provedor)}
            />
            {formData.provedor === 'ollama' && (
              <p className="text-xs text-muted-foreground">
                Ollama não requer chave API (servidor local)
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.ativo}
                onCheckedChange={(checked) => handleChange('ativo', checked)}
              />
              <span className="text-sm">
                {formData.ativo ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={testing || saving}
              leftIcon={testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            >
              {provedor ? (saving ? 'Salvando...' : 'Salvar') : (testing ? 'Testando...' : 'Testar e Salvar')}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente principal da aba
interface ProvedoresIATabProps {
  provedores: ProvedorIAConfig[];
  usuario: Usuario | null;
  onRefetch: () => Promise<void>;
}

export function ProvedoresIATab({ provedores, usuario, onRefetch }: ProvedoresIATabProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingProvedor, setEditingProvedor] = useState<ProvedorIAConfig | null>(null);

  const excluirProvedor = async (id: string) => {
    if (!usuario) return;
    
    if (!confirm('Tem certeza que deseja excluir este provedor?')) {
      return;
    }
    
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
          {provedores.map(p => (
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

// Import Switch for tree shaking
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
