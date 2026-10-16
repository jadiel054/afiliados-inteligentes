// ============================================
// PÁGINA DO PAINEL - VISÃO GERAL
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import supabase from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, DollarSign, MousePointer, BarChart3 } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { toast } from 'sonner';
import { MENSAGENS, formatarMoeda, formatarPorcentagem } from '@/lib/constantes';
import type { Periodo, Evento } from '@/types';
import { PeriodoSelector } from '@/components/Painel/PeriodoSelector';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title);

function toSPDate(date: Date | string): Date {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Date(d.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
}

export default function Painel() {
  const { usuario } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [periodo, setPeriodo] = useState<Periodo>('hoje');
  const [dataEspecifica, setDataEspecifica] = useState('');

  const fetchData = useCallback(async () => {
    if (!usuario) return;
    try {
      setLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from('eventos')
        .select('*')
        .eq('usuario_id', usuario.id)
        .order('ocorrido_em', { ascending: false });
      if (err) throw err;
      setEventos(data || []);
    } catch (err) {
      console.error(err);
      setError(MENSAGENS.ERRO_GENERICO);
      toast.error(MENSAGENS.ERRO_GENERICO);
    } finally {
      setLoading(false);
    }
  }, [usuario]);

  const getEventosFiltrados = useCallback(() => {
    const now = new Date();

    return eventos.filter((e) => {
      const eventoDateSP = toSPDate(e.ocorrido_em);

      switch (periodo) {
        case 'hoje': {
          const todaySP = toSPDate(now);
          todaySP.setHours(0, 0, 0, 0);
          const tomorrowSP = new Date(todaySP);
          tomorrowSP.setDate(tomorrowSP.getDate() + 1);
          return eventoDateSP >= todaySP && eventoDateSP < tomorrowSP;
        }
        case 'ontem': {
          const yesterdaySP = toSPDate(now);
          yesterdaySP.setDate(yesterdaySP.getDate() - 1);
          yesterdaySP.setHours(0, 0, 0, 0);
          const endOfYesterday = new Date(yesterdaySP);
          endOfYesterday.setDate(endOfYesterday.getDate() + 1);
          return eventoDateSP >= yesterdaySP && eventoDateSP < endOfYesterday;
        }
        case 'ultimos_3': {
          const threeDaysAgo = toSPDate(now);
          threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
          threeDaysAgo.setHours(0, 0, 0, 0);
          return eventoDateSP >= threeDaysAgo;
        }
        case 'ultimos_5': {
          const fiveDaysAgo = toSPDate(now);
          fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
          fiveDaysAgo.setHours(0, 0, 0, 0);
          return eventoDateSP >= fiveDaysAgo;
        }
        case 'ultimos_7': {
          const sevenDaysAgo = toSPDate(now);
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          sevenDaysAgo.setHours(0, 0, 0, 0);
          return eventoDateSP >= sevenDaysAgo;
        }
        case 'ultimos_15': {
          const fifteenDaysAgo = toSPDate(now);
          fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
          fifteenDaysAgo.setHours(0, 0, 0, 0);
          return eventoDateSP >= fifteenDaysAgo;
        }
        case 'ultimo_mes': {
          const thirtyDaysAgo = toSPDate(now);
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          thirtyDaysAgo.setHours(0, 0, 0, 0);
          return eventoDateSP >= thirtyDaysAgo;
        }
        case 'especifico': {
          if (!dataEspecifica) return true;
          const [year, month, day] = dataEspecifica.split('-').map(Number);
          if (!year || !month || !day) return true;
          const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
          const endOfDay = new Date(year, month - 1, day + 1, 0, 0, 0, 0);
          return eventoDateSP >= startOfDay && eventoDateSP < endOfDay;
        }
        default:
          return true;
      }
    });
  }, [eventos, periodo, dataEspecifica]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filtrados = getEventosFiltrados();
  const cliques = filtrados.filter((e) => e.tipo === 'clique').length;
  const vendas = filtrados.filter((e) => e.tipo === 'venda').length;
  const comissao = filtrados
    .filter((e) => e.tipo === 'venda')
    .reduce((sum, e) => sum + (e.valor_comissao || 0), 0);
  const conversao = cliques > 0 ? (vendas / cliques) * 100 : 0;

  const chartData = {
    labels: ['Cliques', 'Vendas'],
    datasets: [{ data: [cliques, vendas], backgroundColor: ['#3b82f6', '#22c55e'] }],
  };

  if (loading && eventos.length === 0) {
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
          <h1 className="text-2xl font-bold">Painel</h1>
          <p className="text-muted-foreground">Visão geral do seu desempenho</p>
        </div>
        <PeriodoSelector
          periodo={periodo}
          onPeriodoChange={setPeriodo}
          dataEspecifica={dataEspecifica}
          onDataEspecificaChange={setDataEspecifica}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MousePointer className="w-4 h-4" /> Cliques
            </CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{cliques}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Vendas
            </CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{vendas}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Comissão
            </CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatarMoeda(comissao)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Conversão
            </CardTitle>
          </CardHeader>
          <CardContent><div className="text-2xl font-bold">{formatarPorcentagem(conversao)}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Distribuição</CardTitle></CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <div className="w-64 h-64"><Pie data={chartData} /></div>
        </CardContent>
      </Card>
    </div>
  );
}
