// ============================================
// PÁGINA DO AGENTE - PROPOSTAS E CONFIGURAÇÕES
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import supabase from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { MENSAGENS } from '@/lib/constantes';
import { Robot, Brain, CheckCircle, XCircle, Clock, TrendingUp, Sparkles, PlayCircle, StopCircle } from 'lucide-react';

export default function Agente() {
  const { usuario } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [propostas, setPropostas] = useState<any[]>([]);
  const [configAgente, setConfigAgente] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);

  // Buscar dados
  const fetchData = useCallback(async () => {
    if (!usuario) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Buscar propostas
      const { data: propostasData, error: propostasError } = await supabase
        .from('propostas_agente')
        .select('*, produto:produtos(*)')
        .eq('usuario_id', usuario.id)
        .order('data', { ascending: false });
      
      if (propostasError) throw propostasError;
      
      // Buscar configuração do agente
      const { data: configData, error: configError } = await supabase
        .from('config_agente')
        .select('*')
        .eq('usuario_id', usuario.id)
        .single();
      
      if (configError && configError.code !== 'PGRST116') throw configError;
      
      // Buscar logs do agente
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

  // Aprovar proposta
  const handleAprovarProposta = async (propostaId: string) => {
    if (!usuario) return;
    
    try {
      // Atualizar status da proposta
      const { error } = await supabase
        .from('propostas_agente')
        .update({
          status: 'aprovado',
          decidido_em: new Date().toISOString(),
        })
        .eq('id', propostaId)
        .eq('usuario_id', usuario.id);
      
      if (error) throw error;
      
      toast.success('Proposta aprovada com sucesso!');
      fetchData();
    } catch (err) {
      console.error('Erro ao aprovar proposta:', err);
      toast.error(MENSAGENS.ERRO_GENERICO);
    }
  };

  // Rejeitar proposta
  const handleRejeitarProposta = async (propostaId: string) => {
    if (!usuario) return;
    
    try {
      const { error } = await supabase
        .from('propostas_agente')
        .update({
          status: 'rejeitado',
          decidido_em: new Date().toISOString(),
        })
        .eq('id', propostaId)
        .eq('usuario_id', usuario.id);
      
      if (error) throw error;
      
      toast.success('Proposta rejeitada');
      fetchData();
    } catch (err) {
      console.error('Erro ao rejeitar proposta:', err);
      toast.error(MENSAGENS.ERRO_GENERICO);
    }
  };

  // Buscar dados ao montar o componente
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
          <h1 className="text-2xl font-bold">Agente Inteligente</h1>
          <p className="text-muted-foreground">
            Análise e propostas de produtos automaticamente
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" leftIcon={<PlayCircle className="w-4 h-4" />}>
            Rodar Agora
          </Button>
          <Button leftIcon={<Sparkles className="w-4 h-4" />}>
            Configurações
          </Button>
        </div>
      </div>

      {/* Status do Agente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Robot className="w-5 h-5" />
            Status do Agente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Robot className="w-8 h-8 text-primary" />
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
                <div className="text-2xl font-bold">{propostas.filter(p => p.status === 'pendente').length}</div>
                <div className="text-sm text-muted-foreground">Propostas Pendentes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{propostas.filter(p => p.status === 'aprovado').length}</div>
                <div className="text-sm text-muted-foreground">Aprovadas</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">{propostas.filter(p => p.status === 'rejeitado').length}</div>
                <div className="text-sm text-muted-foreground">Rejeitadas</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Propostas Recentes */}
      <Card>
        <CardHeader>
          <CardTitle>Propostas Recentes</CardTitle>
          <CardDescription>
            {propostas.length} propostas encontradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {propostas.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhuma proposta encontrada</p>
              <p className="text-sm mt-2">
                O agente ainda não analisou nenhum produto
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {propostas.map(proposta => (
                <div
                  key={proposta.id}
                  className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">
                          {proposta.dados_produto?.nome || 'Produto sem nome'}
                        </h4>
                        <Badge variant={proposta.status === 'aprovado' ? 'default' : 
                                       proposta.status === 'rejeitado' ? 'destructive' : 'secondary'}>
                          {proposta.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-4">
                          <span>
                            <TrendingUp className="w-4 h-4 inline mr-1" />
                            Pontuação: {proposta.pontuacao}/100
                          </span>
                          <span>
                            <Brain className="w-4 h-4 inline mr-1" />
                            Confiança: {proposta.confianca}
                          </span>
                          <span>
                            <Clock className="w-4 h-4 inline mr-1" />
                            {new Date(proposta.data).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {proposta.status === 'pendente' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRejeitarProposta(proposta.id)}
                          leftIcon={<XCircle className="w-4 h-4" />}
                        >
                          Rejeitar
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleAprovarProposta(proposta.id)}
                          leftIcon={<CheckCircle className="w-4 h-4" />}
                        >
                          Aprovar
                        </Button>
                      </div>
                    )}
                  </div>
                  
                  {proposta.status === 'pendente' && (
                    <div className="mt-4 pt-4 border-t">
                      <h5 className="font-medium mb-2">Resumo da Análise</h5>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {proposta.relatorio || 'Relatório não disponível'}
                      </p>
                      <Button variant="link" size="sm" className="mt-2">
                        Ver Análise Completa
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Atividade do Agente */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade do Agente</CardTitle>
          <CardDescription>
            Últimas ações realizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Nenhuma atividade registrada</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map(log => (
                <div key={log.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50">
                  <div className={`w-2 h-2 rounded-full ${
                    log.resultado === 'sucesso' ? 'bg-green-500' :
                    log.resultado === 'parcial' ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`} />
                  <div className="flex-1">
                    <div className="font-medium">{log.acao}</div>
                    <div className="text-sm text-muted-foreground">
                      {log.mensagem || 'Sem mensagem'}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(log.created_at).toLocaleString('pt-BR')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
