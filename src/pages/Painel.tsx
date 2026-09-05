// ============================================
// PÁGINA DO PAINEL - VISÃO GERAL
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import supabase from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingUp, DollarSign, MousePointer, BarChart3 } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { toast } from 'sonner';
import { MENSAGENS, PERIODOS } from '@/lib/constantes';
import { formatarMoeda, formatarPorcentagem } from '@/lib/constantes';
import type { Periodo } from '@/types';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title
);

export function PeriodoSelector({
  periodo,
  onPeriodoChange,
  dataEspecifica,
  onDataEspecificaChange,
}: {
  periodo: Periodo;
  onPeriodoChange: (periodo: Periodo) => void;
  dataEspecifica: string;
  onDataEspecificaChange: (data: string) => void;
}) {
  const [showDataInput, setShowDataInput] = useState(false);

  useEffect(() => {
    setShowDataInput(periodo === 'especifico');
  }, [periodo]);

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <Select value={periodo} onValueChange={(v) => onPeriodoChange(v as Periodo)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Período" />
        </SelectTrigger>
        <SelectContent>
          {PERIODOS.map((p) => (
            <SelectItem key={p} value={p}>
              {p}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {showDataInput && (
        <input
          type="date"
          value={dataEspecifica}
          onChange={(e) => onDataEspecificaChange(e.target.value)}
          className="border rounded px-2 py-1 text-sm"
        />
      )}
    </div>
  );
}

export default function Painel() {
  const { usuario } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [eventos, setEventos] = useState<any[]>([]);
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
    const spTimezone = 'America/Sao_Paulo';

    return eventos.filter((e) => {
      const eventoDate = new Date(e.ocorrido_em);
      const eventoDateSP = new Date(eventoDate.toLocaleString('pt-BR', { timeZone: spTimezone }));

      switch (periodo) {
        case 'hoje': {
          const todaySP = new Date(now.toLocaleString('pt-BR', { timeZone: spTimezone }));
          todaySP.setHours(0, 0, 0, 0);
          const tomorrowSP = new Date(todaySP);
          tomorrowSP.setDate(tomorrowSP.getDate() + 1);
          return eventoDateSP >= todaySP && eventoDateSP < tomorrowSP;
        }
        case 'ontem': {
          const yesterdaySP = new Date(now.toLocaleString('pt-BR', { timeZone: spTimezone }));
          yesterdaySP.setDate(yesterdaySP.getDate() - 1);
          yesterdaySP.setHours(0, 0, 0, 0);
          const endOfYesterday = new Date(yesterdaySP);
          endOfYesterday.setDate(endOfYesterday.getDate() + 1);
          return eventoDateSP >= yesterdaySP && eventoDateSP < endOfYesterday;
        }
        case 'ultimos_3': {
          const threeDaysAgo = new Date(now.toLocaleString('pt-BR', { timeZone: spTimezone }));
          threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
          threeDaysAgo.setHours(0, 0, 0, 0);
          return eventoDateSP >= threeDaysAgo;
        }
        case 'ultimos_5': {
          const fiveDaysAgo = new Date(now.toLocaleString('pt-BR', { timeZone: spTimezone }));
          fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
          fiveDaysAgo.setHours(0, 0, 0, 0);
          return eventoDateSP >= fiveDaysAgo;
        }
        case 'ultimos_7': {
          const sevenDaysAgo = new Date(now.toLocaleString('pt-BR', { timeZone: spTimezone }));
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          sevenDaysAgo.setHours(0, 0, 0, 0);
          return eventoDateSP >= sevenDaysAgo;
        }
        default:
          return true;
      }
    });
  }, [eventos, periodo]);

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
    datasets: [
      {
        data: [cliques, vendas],
        backgroundColor: ['#3b82f6', '#22c55e'],
      },
    ],
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
          <CardContent>
            <div className="text-2xl font-bold">{cliques}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{vendas}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Comissão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatarMoeda(comissao)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Conversão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatarPorcentagem(conversao)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Distribuição</CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <div className="w-64 h-64">
            <Pie data={chartData} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
