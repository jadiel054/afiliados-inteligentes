// ============================================
// PÁGINA DE NOTIFICAÇÕES
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import supabase from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { MENSAGENS } from '@/lib/constantes';
import { Bell, CheckCircle, XCircle, AlertCircle, DollarSign, TrendingUp, Link2, Robot } from 'lucide-react';
import type { Notificacao } from '@/types';

// Componente para ícone da notificação
function getNotificacaoIcon(tipo: string) {
  switch (tipo) {
    case 'venda':
      return <DollarSign className="w-5 h-5 text-green-500" />;
    case 'reembolso':
      return <TrendingUp className="w-5 h-5 text-red-500" />;
    case 'link_problema':
      return <Link2 className="w-5 h-5 text-yellow-500" />;
    case 'agente':
      return <Robot className="w-5 h-5 text-blue-500" />;
    case 'sistema':
      return <AlertCircle className="w-5 h-5 text-gray-500" />;
    case 'resumo':
      return <Bell className="w-5 h-5 text-purple-500" />;
    default:
      return <Bell className="w-5 h-5" />;
  }
}

// Componente para cor do badge
function getNotificacaoColor(tipo: string) {
  switch (tipo) {
    case 'venda':
      return 'bg-green-500/10 text-green-600';
    case 'reembolso':
      return 'bg-red-500/10 text-red-600';
    case 'link_problema':
      return 'bg-yellow-500/10 text-yellow-600';
    case 'agente':
      return 'bg-blue-500/10 text-blue-600';
    case 'sistema':
      return 'bg-gray-500/10 text-gray-600';
    case 'resumo':
      return 'bg-purple-500/10 text-purple-600';
    default:
      return 'bg-muted/50 text-muted-foreground';
  }
}

export default function Notificacoes() {
  const { usuario } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [notificacoesNaoLidas, setNotificacoesNaoLidas] = useState(0);

  // Buscar notificações
  const fetchData = useCallback(async () => {
    if (!usuario) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Buscar notificações
      const { data: notificacoesData, error: notificacoesError } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('usuario_id', usuario.id)
        .order('created_at', { ascending: false });
      
      if (notificacoesError) throw notificacoesError;
      
      setNotificacoes(notificacoesData || []);
      setNotificacoesNaoLidas(
        (notificacoesData || []).filter(n => !n.lida).length
      );
      
    } catch (err) {
      console.error('Erro ao buscar notificações:', err);
      setError(MENSAGENS.ERRO_GENERICO);
      toast.error(MENSAGENS.ERRO_GENERICO);
    } finally {
      setLoading(false);
    }
  }, [usuario]);

  // Marcar notificação como lida
  const handleMarcarComoLida = async (notificacaoId: string) => {
    if (!usuario) return;
    
    try {
      const { error } = await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('id', notificacaoId)
        .eq('usuario_id', usuario.id);
      
      if (error) throw error;
      
      // Atualizar estado local
      setNotificacoes(prev => 
        prev.map(n => 
          n.id === notificacaoId ? { ...n, lida: true } : n
        )
      );
      setNotificacoesNaoLidas(prev => Math.max(0, prev - 1));
      
    } catch (err) {
      console.error('Erro ao marcar notificação como lida:', err);
      toast.error(MENSAGENS.ERRO_GENERICO);
    }
  };

  // Marcar todas como lidas
  const handleMarcarTodasComoLidas = async () => {
    if (!usuario) return;
    
    try {
      const { error } = await supabase
        .from('notificacoes')
        .update({ lida: true })
        .eq('usuario_id', usuario.id)
        .neq('lida', true);
      
      if (error) throw error;
      
      // Atualizar estado local
      setNotificacoes(prev => 
        prev.map(n => ({ ...n, lida: true }))
      );
      setNotificacoesNaoLidas(0);
      
      toast.success('Todas as notificações foram marcadas como lidas');
      
    } catch (err) {
      console.error('Erro ao marcar todas as notificações como lidas:', err);
      toast.error(MENSAGENS.ERRO_GENERICO);
    }
  };

  // Buscar dados ao montar o componente
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && notificacoes.length === 0) {
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
          <h1 className="text-2xl font-bold">Notificações</h1>
          <p className="text-muted-foreground">
            {notificacoesNaoLidas} não lidas
          </p>
        </div>
        {notificacoesNaoLidas > 0 && (
          <Button
            onClick={handleMarcarTodasComoLidas}
            leftIcon={<CheckCircle className="w-4 h-4" />}
          >
            Marcar Todas como Lidas
          </Button>
        )}
      </div>

      {/* Lista de notificações */}
      <Card>
        <CardHeader>
          <CardTitle>Todas as Notificações</CardTitle>
          <CardDescription>
            {notificacoes.length} notificações
          </CardDescription>
        </CardHeader>
        <CardContent>
          {notificacoes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma notificação encontrada</p>
              <p className="text-sm mt-2">
                Você não tem notificações no momento
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {notificacoes.map(notificacao => (
                <div
                  key={notificacao.id}
                  className={`border rounded-lg p-4 transition-colors ${
                    !notificacao.lida ? 'bg-muted/50 border-primary' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => !notificacao.lida && handleMarcarComoLida(notificacao.id)}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {getNotificacaoIcon(notificacao.tipo)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{notificacao.titulo}</h4>
                        {!notificacao.lida && (
                          <Badge className="bg-primary/10 text-primary">Novo</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {notificacao.mensagem}
                      </p>
                      {notificacao.link_interno && (
                        <Button variant="link" size="sm" className="mt-2">
                          Ver detalhes
                        </Button>
                      )}
                    </div>
                    <div className="flex-shrink-0 text-sm text-muted-foreground">
                      {new Date(notificacao.created_at).toLocaleString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t border-border">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getNotificacaoColor(notificacao.tipo)}`}>
                      {notificacao.tipo}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <Card>
        <CardHeader>
          <CardTitle>Estatísticas de Notificações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {['venda', 'reembolso', 'link_problema', 'agente', 'sistema', 'resumo'].map(tipo => {
              const count = notificacoes.filter(n => n.tipo === tipo).length;
              return (
                <div key={tipo} className="text-center">
                  <div className={`w-12 h-12 rounded-full mx-auto mb-2 flex items-center justify-center ${
                    tipo === 'venda' ? 'bg-green-500/10' :
                    tipo === 'reembolso' ? 'bg-red-500/10' :
                    tipo === 'link_problema' ? 'bg-yellow-500/10' :
                    tipo === 'agente' ? 'bg-blue-500/10' :
                    tipo === 'sistema' ? 'bg-gray-500/10' :
                    'bg-purple-500/10'
                  }`}>
                    {getNotificacaoIcon(tipo)}
                  </div>
                  <div className="font-semibold">{count}</div>
                  <div className="text-xs text-muted-foreground">
                    {tipo}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
