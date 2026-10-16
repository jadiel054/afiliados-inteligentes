import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { X, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { MENSAGENS, PROVEDORES_IA } from '@/lib/constantes';
import supabase from '@/lib/supabase';
import type { ProvedorIAConfig, ProvedorIA, ProvedorIAFormData, Usuario } from '@/types';

interface ProvedorModalProps {
  isOpen: boolean;
  onClose: () => void;
  provedor: ProvedorIAConfig | null;
  usuario: Usuario | null;
  onRefetch: () => Promise<void>;
}

const MODELO_PLACEHOLDERS: Record<ProvedorIA, string> = {
  groq: 'llama-3.3-70b-versatile',
  ollama: 'llama3.3',
  gemini: 'gemini-2.0-flash',
  cloudflare: '@cf/meta/llama-3.1-8b-instruct',
  openrouter: 'llama-3.3-70b-versatile',
  deepseek: 'deepseek-chat',
};

const CHAVE_PLACEHOLDERS: Record<ProvedorIA, string> = {
  groq: 'gsk_...',
  ollama: 'Não necessário (servidor local)',
  gemini: 'Sua chave API da Google',
  cloudflare: 'Seu token da Cloudflare',
  openrouter: 'sk-or-v1-...',
  deepseek: 'sk-...',
};

export function ProvedorModal({ isOpen, onClose, provedor, usuario, onRefetch }: ProvedorModalProps) {
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
  const [statusDesligadoManual, setStatusDesligadoManual] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFormData(provedor ? {
        nome: provedor.nome || '',
        provedor: provedor.provedor,
        url_base: provedor.url_base || '',
        conta_id: provedor.conta_id || '',
        modelo: provedor.modelo,
        ativo: provedor.ativo,
        ordem_fallback: provedor.ordem_fallback,
        chave_api: '',
      } : {
        nome: '',
        provedor: 'groq',
        url_base: '',
        conta_id: '',
        modelo: '',
        ativo: true,
        ordem_fallback: 1,
        chave_api: '',
      });
      setStatusDesligadoManual(false);
    }
  }, [isOpen, provedor]);

  const handleChange = (field: keyof ProvedorIAFormData, value: string | number | boolean) => {
    if (field === 'ativo') {
      setStatusDesligadoManual(value === false);
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const testarConexao = async () => {
    if (!usuario) return;
    const { provedor: p, url_base, modelo, chave_api, conta_id } = formData;

    if (!p) return toast.error('Selecione um provedor.');
    if (!chave_api && p !== 'ollama') return toast.error('Informe a chave API.');
    if (p === 'ollama' && !url_base) return toast.error('Informe a URL base para Ollama.');
    if (p === 'cloudflare' && (!url_base || !conta_id)) return toast.error('Informe a URL base e o Account ID para Cloudflare.');

    setTesting(true);
    try {
      const response = await supabase.functions.invoke('ia-testar', {
        body: { provedor: p, url_base, modelo, chave_api, conta_id, usuario_id: usuario.id },
      });
      const resData = response.data || {};

      if (!response.error && resData.sucesso) {
        toast.success(`Conexão com ${p} testada com sucesso!`);
        if (!provedor) {
          const { data: existing } = await supabase
            .from('provedores_ia')
            .select('ordem_fallback')
            .eq('usuario_id', usuario.id)
            .order('ordem_fallback', { ascending: false })
            .limit(1);

          const nextOrdem = existing && existing.length > 0 ? existing[0].ordem_fallback + 1 : 1;
          const finalAtivo = chave_api?.trim() && !statusDesligadoManual ? true : formData.ativo;
          const { error: insertError } = await supabase.from('provedores_ia').insert({
            usuario_id: usuario.id,
            nome: formData.nome || p,
            provedor: p,
            vault_secret_id: resData.vault_secret_id,
            url_base: formData.url_base,
            conta_id: formData.conta_id,
            modelo: formData.modelo,
            ativo: finalAtivo,
            ordem_fallback: nextOrdem,
          });

          if (insertError) {
            toast.error('Conexão ok, mas falha ao salvar. Tente novamente.');
          } else {
            toast.success('Provedor salvo com sucesso!');
            onRefetch();
            onClose();
          }
        }
      } else {
        toast.error(resData.mensagem || response.error?.message || 'Falha ao testar conexão.');
      }
    } catch (err) {
      toast.error(MENSAGENS.ERRO_GENERICO);
    } finally {
      setTesting(false);
    }
  };

  const salvarProvedor = async () => {
    if (!usuario || !provedor) return;
    const { nome, provedor: p, url_base, modelo, ativo, ordem_fallback, conta_id, chave_api } = formData;
    if (!p || !modelo) return toast.error('Preencha todos os campos obrigatórios.');

    setSaving(true);
    try {
      const finalAtivo = chave_api?.trim() && !statusDesligadoManual ? true : ativo;
      const { error } = await supabase
        .from('provedores_ia')
        .update({ usuario_id: usuario.id, nome: nome || p, provedor: p, url_base, conta_id, modelo, ativo: finalAtivo, ordem_fallback })
        .eq('id', provedor.id)
        .eq('usuario_id', usuario.id);
      if (error) throw error;
      toast.success('Provedor atualizado com sucesso!');
      onRefetch();
      onClose();
    } catch (err) {
      toast.error(MENSAGENS.ERRO_GENERICO);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-background rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{provedor ? 'Editar Provedor' : 'Adicionar Provedor'}</h3>
          <Button variant="ghost" size="sm" onClick={onClose}><X className="w-4 h-4" /></Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Provedor</Label>
            <Select value={formData.provedor} onValueChange={(v) => handleChange('provedor', v as ProvedorIA)} disabled={!!provedor}>
              <SelectTrigger><SelectValue placeholder="Selecione um provedor" /></SelectTrigger>
              <SelectContent>
                {PROVEDORES_IA.map((p) => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Nome (opcional)</Label>
            <Input value={formData.nome} onChange={(e) => handleChange('nome', e.target.value)} placeholder="Nome para identificação" />
          </div>

          {formData.provedor === 'ollama' && (
            <div className="space-y-2">
              <Label>URL Base do Ollama</Label>
              <Input value={formData.url_base} onChange={(e) => handleChange('url_base', e.target.value)} placeholder="http://localhost:11434" />
            </div>
          )}

          {formData.provedor === 'cloudflare' && (
            <>
              <div className="space-y-2">
                <Label>URL Base da Cloudflare</Label>
                <Input value={formData.url_base} onChange={(e) => handleChange('url_base', e.target.value)} placeholder="https://api.cloudflare.com" />
              </div>
              <div className="space-y-2">
                <Label>Account ID</Label>
                <Input value={formData.conta_id} onChange={(e) => handleChange('conta_id', e.target.value)} placeholder="Seu Account ID" />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label>Modelo</Label>
            <Input value={formData.modelo} onChange={(e) => handleChange('modelo', e.target.value)} placeholder={MODELO_PLACEHOLDERS[formData.provedor] || 'Modelo do provedor'} />
          </div>

          <div className="space-y-2">
            <Label>Ordem de Fallback</Label>
            <Input type="number" value={formData.ordem_fallback} onChange={(e) => handleChange('ordem_fallback', parseInt(e.target.value) || 1)} min={1} />
          </div>

          <div className="space-y-2">
            <Label>Chave API</Label>
            <Input type="password" value={formData.chave_api} onChange={(e) => handleChange('chave_api', e.target.value)} placeholder={CHAVE_PLACEHOLDERS[formData.provedor]} />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <div className="flex items-center gap-2">
              <Switch checked={formData.ativo} onCheckedChange={(checked) => handleChange('ativo', checked)} />
              <span className="text-sm">{formData.ativo ? 'Ativo' : 'Inativo'}</span>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={provedor ? salvarProvedor : testarConexao} disabled={testing || saving} leftIcon={testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}>
              {provedor ? (saving ? 'Salvando...' : 'Salvar') : (testing ? 'Testando...' : 'Testar e Salvar')}
            </Button>
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
