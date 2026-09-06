// ============================================
// PÁGINA DE CONFIGURAÇÕES
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import supabase from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { toast } from 'sonner';
import { MENSAGENS } from '@/lib/constantes';
import { Brain, LogOut, Trash2 } from 'lucide-react';
import type { ConfigAgente, ProvedorIAConfig } from '@/types';
import { AgenteConfigTab } from '@/components/Configuracoes/AgenteConfigTab';
import { ProvedoresIATab } from '@/components/Configuracoes/ProvedoresIATab';
import { ContaTab } from '@/components/Configuracoes/ContaTab';

export default function Configuracoes() {
  const { usuario, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [configAgente, setConfigAgente] = useState<ConfigAgente | null>(null);
  const [provedoresIA, setProvedoresIA] = useState<ProvedorIAConfig[]>([]);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'agente' | 'ia' | 'conta'>('agente');

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

  const handleSaveConfig = async (data: ConfigAgente) => {
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

  const refetchProvedores = useCallback(async () => {
    if (!usuario) return;
    try {
      const { data: provedoresData, error: provedoresError } = await supabase
        .from('provedores_ia')
        .select('*')
        .eq('usuario_id', usuario.id);
      if (provedoresError) throw provedoresError;
      setProvedoresIA(provedoresData || []);
    } catch (err) {
      console.error('Erro ao buscar provedores:', err);
      toast.error(MENSAGENS.ERRO_GENERICO);
    }
  }, [usuario]);

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
                onClick={() => setActiveTab(tab as 'agente' | 'ia' | 'conta')}
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
            <AgenteConfigTab
              config={configAgente}
              onSave={handleSaveConfig}
              loading={saving}
            />
          )}

          {activeTab === 'ia' && (
            <ProvedoresIATab
              provedores={provedoresIA}
              usuario={usuario}
              onRefetch={refetchProvedores}
            />
          )}

          {activeTab === 'conta' && (
            <ContaTab usuario={usuario} logout={logout} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
