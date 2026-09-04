// ============================================
// PÁGINA DE CONFIGURAÇÕES
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import supabase from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { MENSAGENS, CONFIG_PADRAO_AGENTE, CATEGORIAS_NICHO, MODOS_AGENTE, PROVEDORES_IA, LIMITES } from '@/lib/constantes';
import { Settings, User, Bell, Robot, Database, Key, Shield, LogOut, Trash2, ArrowLeft } from 'lucide-react';
import type { ConfigAgente, ProvedorIAConfig, ConfigAgenteFormData } from '@/types';

// Componente para configuração do Agente
function AgenteConfig({ 
  config,
  onSave,
  loading 
}: {
  config: ConfigAgente | null;
  onSave: (data: ConfigAgenteFormData) => void;
  loading: boolean;
}) {
  const [formData, setFormData] = useState<ConfigAgenteFormData>(config || CONFIG_PADRAO_AGENTE);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: keyof ConfigAgenteFormData, value: string | number | boolean | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpar erro ao alterar campo
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
    if (validate()) {
      onSave(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Modo de Operação */}
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
        <p className="text-xs text-muted-foreground">
          Desligado: agente não faz nada | Semi-Autônomo: propõe produtos para aprovação | Autônomo Total: cadastra automaticamente
        </p>
      </div>

      {/* Pontuações */}
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
            className={errors.pontuacao_propor ? 'border-destructive' : ''}
          />
          {errors.pontuacao_propor && <p className="text-xs text-destructive">{errors.pontuacao_propor}</p>}
          <p className="text-xs text-muted-foreground">
            Produtos com pontuação ≥ este valor serão propostos (modo semi-autônomo)
          </p>
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
          <p className="text-xs text-muted-foreground">
            Produtos com pontuação ≥ este valor serão cadastrados automaticamente (modo autônomo)
          </p>
        </div>
      </div>

      {/* Limites */}
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
            className={errors.comissao_minima ? 'border-destructive' : ''}
          />
          {errors.comissao_minima && <p className="text-xs text-destructive">{errors.comissao_minima}</p>}
          <p className="text-xs text-muted-foreground">
            Produtos com comissão abaixo deste valor serão descartados
          </p>
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
            className={errors.valor_maximo ? 'border-destructive' : ''}
          />
          {errors.valor_maximo && <p className="text-xs text-destructive">{errors.valor_maximo}</p>}
          <p className="text-xs text-muted-foreground">
            Produtos com valor acima deste limite serão descartados
          </p>
        </div>
      </div>

      {/* Frequência e Horário */}
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
            className={errors.rodar_a_cada_horas ? 'border-destructive' : ''}
          />
          {errors.rodar_a_cada_horas && <p className="text-xs text-destructive">{errors.rodar_a_cada_horas}</p>}
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
            className={errors.max_produtos_dia ? 'border-destructive' : ''}
          />
          {errors.max_produtos_dia && <p className="text-xs text-destructive">{errors.max_produtos_dia}</p>}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="categorias">Categorias</Label>
          <Select
            value={undefined}
            onValueChange={(value) => {
              if (formData.categorias.includes(value)) {
                handleChange('categorias', formData.categorias.filter(c => c !== value));
              } else {
                handleChange('categorias', [...formData.categorias, value]);
              }
            }}
            disabled={loading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Adicionar categoria" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIAS_NICHO.map(categoria => (
                <SelectItem key={categoria} value={categoria}>
                  <div className="flex items-center gap-2">
                    {formData.categorias.includes(categoria) && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                    {categoria}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.categorias && <p className="text-xs text-destructive">{errors.categorias}</p>}
          <div className="flex flex-wrap gap-1">
            {formData.categorias.map(categoria => (
              <Badge key={categoria} variant="secondary" className="text-xs">
                {categoria}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Horário de Operação */}
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
            className={errors.horario_inicio ? 'border-destructive' : ''}
          />
          {errors.horario_inicio && <p className="text-xs text-destructive">{errors.horario_inicio}</p>}
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
            className={errors.horario_fim ? 'border-destructive' : ''}
          />
          {errors.horario_fim && <p className="text-xs text-destructive">{errors.horario_fim}</p>}
        </div>
      </div>

      <Button type="submit" loading={loading}>
        Salvar Configurações do Agente
      </Button>
    </form>
  );
}

// Componente principal da página de Configurações
export default function Configuracoes() {
  const { usuario, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [configAgente, setConfigAgente] = useState<ConfigAgente | null>(null);
  const [provedoresIA, setProvedoresIA] = useState<ProvedorIAConfig[]>([]);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('agente');

  // Buscar dados
  const fetchData = useCallback(async () => {
    if (!usuario) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Buscar configuração do agente
      const { data: configData, error: configError } = await supabase
        .from('config_agente')
        .select('*')
        .eq('usuario_id', usuario.id)
        .single();
      
      if (configError && configError.code !== 'PGRST116') throw configError;
      
      // Buscar provedores de IA
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

  // Salvar configuração do agente
  const handleSaveConfig = async (data: ConfigAgenteFormData) => {
    if (!usuario) return;
    
    setSaving(true);
    try {
      if (configAgente) {
        // Atualizar configuração existente
        const { error } = await supabase
          .from('config_agente')
          .update({
            ...data,
            atualizado_em: new Date().toISOString(),
          })
          .eq('id', configAgente.id)
          .eq('usuario_id', usuario.id);
        
        if (error) throw error;
      } else {
        // Criar nova configuração
        const { error } = await supabase
          .from('config_agente')
          .insert({
            usuario_id: usuario.id,
            ...data,
            atualizado_em: new Date().toISOString(),
          });
        
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

  // Buscar dados ao montar o componente
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
        <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-lg">
          {error}
        </div>
        <Button onClick={fetchData} className="mt-4">
          Tentar Novamente
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Configurações</h1>
          <p className="text-muted-foreground">
            Personalize seu sistema
          </p>
        </div>
      </div>

      {/* Navegação por abas */}
      <Card>
        <CardHeader>
          <div className="flex gap-2 border-b">
            <button
              onClick={() => setActiveTab('agente')}
              className={`pb-2 px-4 font-medium ${
                activeTab === 'agente' 
                  ? 'border-b-2 border-primary text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Agente
            </button>
            <button
              onClick={() => setActiveTab('ia')}
              className={`pb-2 px-4 font-medium ${
                activeTab === 'ia' 
                  ? 'border-b-2 border-primary text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Provedores de IA
            </button>
            <button
              onClick={() => setActiveTab('conta')}
              className={`pb-2 px-4 font-medium ${
                activeTab === 'conta' 
                  ? 'border-b-2 border-primary text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Conta
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {activeTab === 'agente' && (
            <AgenteConfig
              config={configAgente}
              onSave={handleSaveConfig}
              loading={saving}
            />
          )}
          
          {activeTab === 'ia' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">Provedores de IA</h3>
                  <p className="text-sm text-muted-foreground">
                    Configure seus provedores de IA para o agente
                  </p>
                </div>
                <Button leftIcon={<Plus className="w-4 h-4" />}>
                  Adicionar Provedor
                </Button>
              </div>
              
              {provedoresIA.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Nenhum provedor de IA configurado</p>
                  <p className="text-sm mt-2">
                    Adicione um provedor para começar a usar o agente
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {provedoresIA.map(provedor => (
                    <div
                      key={provedor.id}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Brain className="w-5 h-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{provedor.nome}</h4>
                            <p className="text-sm text-muted-foreground">
                              {provedor.provedor} - {provedor.modelo}
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={provedor.ativo}
                          onCheckedChange={() => {}}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <Label className="text-muted-foreground">Ordem de Fallback</Label>
                          <div className="font-medium">{provedor.ordem_fallback}</div>
                        </div>
                        <div>
                          <Label className="text-muted-foreground">Último Teste</Label>
                          <div className="font-medium">
                            {provedor.ultimo_teste ? new Date(provedor.ultimo_teste).toLocaleString('pt-BR') : 'Nunca'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 mt-4">
                        <Button variant="outline" size="sm">
                          Testar Conexão
                        </Button>
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                        <Button variant="destructive" size="sm">
                          Excluir
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'conta' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-semibold">Configurações da Conta</h3>
                  <p className="text-sm text-muted-foreground">
                    Gerencie sua conta e preferências
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                {/* Informações do usuário */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Informações do Usuário
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label>E-mail</Label>
                        <div className="font-medium">{usuario?.email}</div>
                      </div>
                      <div>
                        <Label>Nome</Label>
                        <div className="font-medium">{usuario?.nome || 'Não informado'}</div>
                      </div>
                      <div>
                        <Label>Conta criada em</Label>
                        <div className="font-medium">{usuario?.criado_em ? new Date(usuario.criado_em).toLocaleDateString('pt-BR') : 'N/A'}</div>
                      </div>
                    </div>
                    <Button variant="outline" className="mt-4">
                      Editar Perfil
                    </Button>
                  </CardContent>
                </Card>
                
                {/* Notificações */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Bell className="w-5 h-5" />
                      Notificações
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <Label>Receber notificações por e-mail</Label>
                          <p className="text-sm text-muted-foreground">
                            Receba notificações importantes por e-mail
                          </p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Ações da conta */}
                <Card>
                  <CardHeader>
                    <CardTitle>Ações da Conta</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        leftIcon={<Shield className="w-4 h-4" />}
                      >
                        Alterar Senha
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        leftIcon={<Database className="w-4 h-4" />}
                      >
                        Exportar Dados
                      </Button>
                      <Button
                        variant="destructive"
                        className="w-full justify-start"
                        leftIcon={<Trash2 className="w-4 h-4" />}
                        onClick={async () => {
                          // Confirmar exclusão
                          if (window.confirm('Tem certeza que deseja excluir sua conta? Esta ação não pode ser desfeita.')) {
                            try {
                              await supabase.auth.signOut();
                              // Chamar Edge Function para excluir conta
                              toast.info('Exclusão de conta será implementada na Fase 4');
                            } catch (err) {
                              toast.error(MENSAGENS.ERRO_GENERICO);
                            }
                          }
                        }}
                      >
                        Excluir Conta
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        leftIcon={<LogOut className="w-4 h-4" />}
                        onClick={logout}
                      >
                        Sair
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
