// ============================================
// PÁGINA DE CONFIGURAÇÕES
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import supabase from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { MENSAGENS, CONFIG_PADRAO_AGENTE, CATEGORIAS_NICHO, MODOS_AGENTE, LIMITES } from '@/lib/constantes';
import { Bot, CheckCircle, Plus, Brain, LogOut, Trash2 } from 'lucide-react';
import type { ConfigAgente, ProvedorIAConfig, ConfigAgenteFormData } from '@/types';

function AgenteConfig({ 
  config,
  onSave,
  loading 
}: {
  config: ConfigAgente | null;
  onSave: (data: ConfigAgenteFormData) => void;
  loading: boolean;
}) {
  const [formData, setFormData] = useState<ConfigAgenteFormData>(config || { ...CONFIG_PADRAO_AGENTE });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof ConfigAgenteFormData, value: string | number | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (formData.pontuacao_agir < formData.pontuacao_propor) {
      newErrors.pontuacao_agir = 'A pontuação para agir deve ser maior ou igual à pontuação para propor';
    }
    if (formData.comissao_minima < 0 || formData.comissao_minima > 100) {
      newErrors.comissao_minima = 'A comissão mínima deve estar entre 0 e 100';
    }
    if (formData.valor_maximo < 0) {
      newErrors.valor_maximo = 'O valor máximo deve ser positivo';
    }
    if (formData.rodar_a_cada_horas < LIMITES.RODAR_A_CADA_HORAS_MIN || formData.rodar_a_cada_horas > LIMITES.RODAR_A_CADA_HORAS_MAX) {
      newErrors.rodar_a_cada_horas = `Deve estar entre ${LIMITES.RODAR_A_CADA_HORAS_MIN} e ${LIMITES.RODAR_A_CADA_HORAS_MAX}`;
    }
    if (formData.max_produtos_dia < LIMITES.MAX_PRODUTOS_DIA_MIN || formData.max_produtos_dia > LIMITES.MAX_PRODUTOS_DIA_MAX) {
      newErrors.max_produtos_dia = `Deve estar entre ${LIMITES.MAX_PRODUTOS_DIA_MIN} e ${LIMITES.MAX_PRODUTOS_DIA_MAX}`;
    }
    if (formData.horario_inicio < LIMITES.HORARIO_MIN || formData.horario_inicio > LIMITES.HORARIO_MAX) {
      newErrors.horario_inicio = `Deve estar entre ${LIMITES.HORARIO_MIN} e ${LIMITES.HORARIO_MAX}`;
    }
    if (formData.horario_fim < LIMITES.HORARIO_MIN || formData.horario_fim > LIMITES.HORARIO_MAX) {
      newErrors.horario_fim = `Deve estar entre ${LIMITES.HORARIO_MIN} e ${LIMITES.HORARIO_MAX}`;
    }
    if (formData.categorias.length === 0) {
      newErrors.categorias = 'Selecione pelo menos uma categoria';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="modo">Modo de Operação</Label>
        <Select
          value={formData.modo}
          onValueChange={(value) => handleChange('modo', value as 'desligado' | 'semi_autonomo' | 'autonomo_total')}
          disabled={loading}
        >
          <SelectTrigger>
            <SelectValue placeholder="Selecione um modo" />
          </SelectTrigger>
          <SelectContent>
            {MODOS_AGENTE.map(modo => (
              <SelectItem key={modo} value={modo}>
                {modo === 'desligado' ? 'Desligado' :
                 modo === 'semi_autonomo' ? 'Semi-Autônomo' : 'Autônomo Total'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pontuacao_propor">Pontuação para Propor</Label>
          <Input
            id="pontuacao_propor"
            type="number"
            value={formData.pontuacao_propor}
            onChange={(e) => handleChange('pontuacao_propor', parseInt(e.target.value) || 0)}
            min={LIMITES.PONTUACAO_MIN}
            max={LIMITES.PONTUACAO_MAX}
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="pontuacao_agir">Pontuação para Agir</Label>
          <Input
            id="pontuacao_agir"
            type="number"
            value={formData.pontuacao_agir}
            onChange={(e) => handleChange('pontuacao_agir', parseInt(e.target.value) || 0)}
            min={LIMITES.PONTUACAO_MIN}
            max={LIMITES.PONTUACAO_MAX}
            disabled={loading}
            className={errors.pontuacao_agir ? 'border-destructive' : ''}
          />
          {errors.pontuacao_agir && <p className="text-xs text-destructive">{errors.pontuacao_agir}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="comissao_minima">Comissão Mínima (%)</Label>
          <Input
            id="comissao_minima"
            type="number"
            value={formData.comissao_minima}
            onChange={(e) => handleChange('comissao_minima', parseFloat(e.target.value) || 0)}
            step="0.01"
            min={0}
            max={100}
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="valor_maximo">Valor Máximo (R$)</Label>
          <Input
            id="valor_maximo"
            type="number"
            value={formData.valor_maximo}
            onChange={(e) => handleChange('valor_maximo', parseFloat(e.target.value) || 0)}
            step="0.01"
            min={0}
            disabled={loading}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="rodar_a_cada_horas">Rodar a cada (horas)</Label>
          <Input
            id="rodar_a_cada_horas"
            type="number"
            value={formData.rodar_a_cada_horas}
            onChange={(e) => handleChange('rodar_a_cada_horas', parseInt(e.target.value) || 1)}
            min={LIMITES.RODAR_A_CADA_HORAS_MIN}
            max={LIMITES.RODAR_A_CADA_HORAS_MAX}
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="max_produtos_dia">Máx. Produtos/Dia</Label>
          <Input
            id="max_produtos_dia"
            type="number"
            value={formData.max_produtos_dia}
            onChange={(e) => handleChange('max_produtos_dia', parseInt(e.target.value) || 1)}
            min={LIMITES.MAX_PRODUTOS_DIA_MIN}
            max={LIMITES.MAX_PRODUTOS_DIA_MAX}
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label>Categorias</Label>
          <div className="flex flex-wrap gap-1">
            {formData.categorias.map(categoria => (
              <Badge key={categoria} variant="secondary" className="text-xs">
                {categoria}
              </Badge>
            ))}
          </div>
          {errors.categorias && <p className="text-xs text-destructive">{errors.categorias}</p>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="horario_inicio">Horário Início</Label>
          <Input
            id="horario_inicio"
            type="number"
            value={formData.horario_inicio}
            onChange={(e) => handleChange('horario_inicio', parseInt(e.target.value) || 0)}
            min={LIMITES.HORARIO_MIN}
            max={LIMITES.HORARIO_MAX}
            disabled={loading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="horario_fim">Horário Fim</Label>
          <Input
            id="horario_fim"
            type="number"
            value={formData.horario_fim}
            onChange={(e) => handleChange('horario_fim', parseInt(e.target.value) || 23)}
            min={LIMITES.HORARIO_MIN}
            max={LIMITES.HORARIO_MAX}
            disabled={loading}
          />
        </div>
      </div>

      <Button type="submit" loading={loading}>
        Salvar Configurações do Agente
      </Button>
    </form>
  );
}

export default function Configuracoes() {
  const { usuario, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [configAgente, setConfigAgente] = useState<ConfigAgente | null>(null);
  const [provedoresIA, setProvedoresIA] = useState<ProvedorIAConfig[]>([]);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('agente');

  const fetchData = useCallback(async () => {
    if (!usuario) return;
    try {
      setLoading(true);
      setError(null);

      const { data: configData, error: configError } = await supabase
        .from('config_agente')
        .select('*')
        .eq('usuario_id', usuario.id)
        .single();

      if (configError && configError.code !== 'PGRST116') throw configError;

      const { data: provedoresData, error: provedoresError } = await supabase
        .from('provedores_ia')
        .select('*')
        .eq('usuario_id', usuario.id);

      if (provedoresError) throw provedoresError;

      setConfigAgente(configData || null);
      setProvedoresIA(provedoresData || []);
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
      setError(MENSAGENS.ERRO_GENERICO);
      toast.error(MENSAGENS.ERRO_GENERICO);
    } finally {
      setLoading(false);
    }
  }, [usuario]);

  const handleSaveConfig = async (data: ConfigAgenteFormData) => {
    if (!usuario) return;
    setSaving(true);
    try {
      if (configAgente) {
        const { error } = await supabase
          .from('config_agente')
          .update({ ...data, atualizado_em: new Date().toISOString() })
          .eq('id', configAgente.id)
          .eq('usuario_id', usuario.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('config_agente')
          .insert({ usuario_id: usuario.id, ...data, atualizado_em: new Date().toISOString() });
        if (error) throw error;
      }
      toast.success('Configurações salvas com sucesso!');
      fetchData();
    } catch (err) {
      console.error('Erro ao salvar configuração:', err);
      toast.error(MENSAGENS.ERRO_GENERICO);
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !configAgente && provedoresIA.length === 0) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-lg">{error}</div>
        <Button onClick={fetchData} className="mt-4">Tentar Novamente</Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Configurações</h1>
        <p className="text-muted-foreground">Personalize seu sistema</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex gap-2 border-b">
            {['agente', 'ia', 'conta'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2 px-4 font-medium ${
                  activeTab === tab
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'agente' ? 'Agente' : tab === 'ia' ? 'Provedores de IA' : 'Conta'}
              </button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {activeTab === 'agente' && (
            <AgenteConfig config={configAgente} onSave={handleSaveConfig} loading={saving} />
          )}

          {activeTab === 'ia' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">Provedores de IA</h3>
                  <p className="text-sm text-muted-foreground">Configure seus provedores de IA para o agente</p>
                </div>
                <Button leftIcon={<Plus className="w-4 h-4" />}>Adicionar Provedor</Button>
              </div>

              {provedoresIA.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Nenhum provedor de IA configurado</p>
                  <p className="text-sm mt-2">Adicione um provedor para começar a usar o agente</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {provedoresIA.map(provedor => (
                    <div key={provedor.id} className="border rounded-lg p-4 flex items-center gap-4">
                      <Brain className="w-5 h-5 text-primary" />
                      <div className="flex-1">
                        <div className="font-medium">{provedor.provedor || 'Provedor'}</div>
                        <div className="text-sm text-muted-foreground">{provedor.modelo || ''}</div>
                      </div>
                      <Badge variant="secondary">{provedor.ativo ? 'Ativo' : 'Inativo'}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'conta' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Conta</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {usuario?.email || 'Usuário logado'}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" leftIcon={<LogOut className="w-4 h-4" />} onClick={() => logout()}>
                    Sair
                  </Button>
                  <Button variant="destructive" leftIcon={<Trash2 className="w-4 h-4" />}>
                    Excluir Conta
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
