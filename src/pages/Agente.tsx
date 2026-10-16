// ============================================
// PÁGINA DO AGENTE - PROPOSTAS E CONFIGURAÇÕES
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import supabase from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { MENSAGENS } from '@/lib/constantes';
import { Bot, Sparkles, PlayCircle, Loader2 } from 'lucide-react';
import type { PropostaAgente, ConfigAgente, LogAgente } from '@/types';
import { PropostasList } from '@/components/Agente/PropostasList';

export default function Agente() {
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [propostas, setPropostas] = useState<PropostaAgente[]>([]);
  const [configAgente, setConfigAgente] = useState<ConfigAgente | null>(null);
  const [logs, setLogs] = useState<LogAgente[]>([]);

  const fetchData = useCallback(async () => {
    if (!usuario) return;
    try {
      setLoading(true);
      setError(null);

      const { data: propostasData, error: propostasError } = await supabase
        .from('propostas_agente')
        .select('*, produto:produtos(*)')
        .eq('usuario_id', usuario.id)
        .order('data', { ascending: false });
      if (propostasError) throw propostasError;

      const { data: configData, error: configError } = await supabase
        .from('config_agente')
        .select('*')
        .eq('usuario_id', usuario.id)
        .single();
      if (configError && configError.code !== 'PGRST116') throw configError;

      const { data: logsData, error: logsError } = await supabase
        .from('log_agente')
        .select('*')
        .eq('usuario_id', usuario.id)
        .order('created_at', { ascending: false })
        .limit(20);
      if (logsError) throw logsError;

      setPropostas(propostasData || []);
      setConfigAgente(configData || null);
      setLogs(logsData || []);
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
      setError(MENSAGENS.ERRO_GENERICO);
      toast.error(MENSAGENS.ERRO_GENERICO);
    } finally {
      setLoading(false);
    }
  }, [usuario]);

  const handleAprovarProposta = async (propostaId: string) => {
    if (!usuario) return;
    try {
      const { error } = await supabase
        .from('propostas_agente')
        .update({ status: 'aprovado', decidido_em: new Date().toISOString() })
        .eq('id', propostaId)
        .eq('usuario_id', usuario.id);
      if (error) throw error;
      toast.success('Proposta aprovada com sucesso!');
      fetchData();
    } catch (err) {
      toast.error(MENSAGENS.ERRO_GENERICO);
    }
  };

  const handleRodarAgora = async () => {
    if (!usuario) return;

    try {
      setRunning(true);
      const { data: provedoresAtivos, error: provError } = await supabase
        .from('provedores_ia')
        .select('id')
        .eq('usuario_id', usuario.id)
        .eq('ativo', true);

      if (provError) throw provError;

      if (!provedoresAtivos || provedoresAtivos.length === 0) {
        toast.warning('Ative um provedor de IA em Configurações antes de rodar o agente');
        return;
      }

      const response = await supabase.functions.invoke('ia-completar', { body: {} });
      if (response.error) {
        throw response.error;
      }

      toast.success('Agente executado com sucesso!');
      await fetchData();
    } catch (err) {
      console.error('Erro ao rodar agente:', err);
      toast.error(MENSAGENS.ERRO_GENERICO);
    } finally {
      setRunning(false);
    }
  };

  const handleRejeitarProposta = async (propostaId: string) => {
    if (!usuario) return;
    try {
      const { error } = await supabase
        .from('propostas_agente')
        .update({ status: 'rejeitado', decidido_em: new Date().toISOString() })
        .eq('id', propostaId)
        .eq('usuario_id', usuario.id);
      if (error) throw error;
      toast.success('Proposta rejeitada');
      fetchData();
    } catch (err) {
      toast.error(MENSAGENS.ERRO_GENERICO);
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && propostas.length === 0 && !configAgente) {
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Agente Inteligente</h1>
          <p className="text-muted-foreground">Análise e propostas de produtos automaticamente</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={running}
            onClick={handleRodarAgora}
            leftIcon={running ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
          >
            {running ? 'Rodando...' : 'Rodar Agora'}
          </Button>
          <Button
            leftIcon={<Sparkles className="w-4 h-4" />}
            onClick={() => navigate('/configuracoes')}
          >
            Configurações
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Bot className="w-5 h-5" /> Status do Agente</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Modo de Operação</h3>
                <p className="text-muted-foreground">
                  {configAgente?.modo === 'autonomo_total' ? 'Autônomo Total' :
                   configAgente?.modo === 'semi_autonomo' ? 'Semi-Autônomo' : 'Desligado'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{propostas.filter((p) => p.status === 'pendente').length}</div>
                <div className="text-sm text-muted-foreground">Propostas Pendentes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{propostas.filter((p) => p.status === 'aprovado').length}</div>
                <div className="text-sm text-muted-foreground">Aprovadas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{propostas.filter((p) => p.status === 'rejeitado').length}</div>
                <div className="text-sm text-muted-foreground">Rejeitadas</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <PropostasList
        propostas={propostas}
        onAprovar={handleAprovarProposta}
        onRejeitar={handleRejeitarProposta}
      />

      <Card>
        <CardHeader>
          <CardTitle>Atividade do Agente</CardTitle>
          <CardDescription>Últimas ações realizadas</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground"><p>Nenhuma atividade registrada</p></div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50">
                  <div className={`w-2 h-2 rounded-full ${
                    log.resultado === 'sucesso' ? 'bg-green-500' : log.resultado === 'parcial' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <div className="flex-1">
                    <div className="font-medium">{log.acao}</div>
                    <div className="text-sm text-muted-foreground">{log.mensagem || 'Sem mensagem'}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">{new Date(log.created_at).toLocaleString('pt-BR')}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
