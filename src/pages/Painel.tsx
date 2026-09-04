// ============================================
// PÁGINA DO PAINEL - VISÃO GERAL
// ============================================

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import supabase from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, TrendingUp, TrendingDown, DollarSign, MousePointer, Users, BarChart3, LineChart, PieChart } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Title } from 'chart.js';
import { Pie, Bar, Line } from 'react-chartjs-2';
import { toast } from 'sonner';
import { MENSAGENS, FUSO, PERIODOS } from '@/lib/constantes';
import { formatarMoeda, formatarPorcentagem } from '@/lib/constantes';
import type { MetricasPainel, MetricasPorPlataforma, Periodo } from '@/types';

// Registrar componentes do Chart.js
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

// Componente para selecionar período
export function PeriodoSelector({ 
  periodo, 
  onPeriodoChange, 
  dataEspecifica,
  onDataEspecificaChange 
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

  const periodos = PERIODOS.map(p => ({
    value: p,
    label: p === 'hoje' ? 'Hoje' :
           p === 'ontem' ? 'Ontem' :
           p === 'ultimos_3' ? 'Últimos 3 dias' :
           p === 'ultimos_5' ? 'Últimos 5 dias' :
           p === 'ultimos_7' ? 'Últimos 7 dias' :
           p === 'ultimos_15' ? 'Últimos 15 dias' :
           p === 'ultimo_mes' ? 'Último mês' :
           'Data específica'
  }));

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-end">
      <div className="w-full sm:w-auto">
        <Select value={periodo} onValueChange={(value) => {
          onPeriodoChange(value as Periodo);
          onDataEspecificaChange('');
        }}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Selecione um período" />
          </SelectTrigger>
          <SelectContent>
            {periodos.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      {showDataInput && (
        <div className="w-full sm:w-auto">
          <input
            type="date"
            value={dataEspecifica}
            onChange={(e) => onDataEspecificaChange(e.target.value)}
            className="w-full sm:w-[200px] flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            max={new Date().toISOString().split('T')[0]}
          />
        </div>
      )}
    </div>
  );
}

// Função para calcular métricas com base nos eventos
export function calcularMetricas(eventos: any[], custos: any[]): MetricasPainel {
  const cliques = eventos.filter(e => e.tipo === 'clique').length;
  const vendas = eventos.filter(e => e.tipo === 'venda').length;
  
  const valorBruto = eventos
    .filter(e => e.tipo === 'venda')
    .reduce((sum, e) => sum + (e.valor_bruto || 0), 0);
  
  const comissaoTotal = eventos
    .filter(e => ['venda', 'reembolso'].includes(e.tipo))
    .reduce((sum, e) => sum + (e.valor_comissao || 0), 0);
  
  const custoTotal = custos.reduce((sum, c) => sum + (c.valor || 0), 0);
  const lucroLiquido = comissaoTotal - custoTotal;
  
  const taxaConversao = cliques > 0 ? (vendas / cliques) * 100 : 0;
  
  return {
    cliques,
    vendas,
    valorBruto,
    comissaoTotal,
    lucroLiquido,
    taxaConversao,
  };
}

// Função para calcular métricas por plataforma
export function calcularMetricasPorPlataforma(eventos: any[], produtos: any[]): MetricasPorPlataforma[] {
  const plataformasMap = new Map<string, MetricasPorPlataforma>();
  
  // Inicializar com todas as plataformas
  produtos.forEach(p => {
    if (!plataformasMap.has(p.plataforma_id) && p.plataforma) {
      plataformasMap.set(p.plataforma_id, {
        plataforma: p.plataforma.nome,
        plataforma_id: p.plataforma_id,
        cor_hex: p.plataforma.cor_hex,
        cliques: 0,
        vendas: 0,
        valorBruto: 0,
        comissaoTotal: 0,
      });
    }
  });
  
  // Contabilizar eventos
  eventos.forEach(e => {
    if (!e.produto_id) return;
    
    const produto = produtos.find(p => p.id === e.produto_id);
    if (!produto || !produto.plataforma_id) return;
    
    const plataformaData = plataformasMap.get(produto.plataforma_id);
    if (plataformaData) {
      if (e.tipo === 'clique') {
        plataformaData.cliques++;
      } else if (e.tipo === 'venda') {
        plataformaData.vendas++;
        plataformaData.valorBruto += e.valor_bruto || 0;
        plataformaData.comissaoTotal += e.valor_comissao || 0;
      }
    }
  });
  
  return Array.from(plataformasMap.values());
}

// Componente principal do Painel
export default function Painel() {
  const { usuario } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState<Periodo>('hoje');
  const [dataEspecifica, setDataEspecifica] = useState('');
  const [eventos, setEventos] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [custos, setCustos] = useState<any[]>([]);
  const [plataformas, setPlataformas] = useState<any[]>([]);
  
  const [metricas, setMetricas] = useState<MetricasPainel>({
    cliques: 0,
    vendas: 0,
    valorBruto: 0,
    comissaoTotal: 0,
    lucroLiquido: 0,
    taxaConversao: 0,
  });

  // Buscar dados
  const fetchData = useCallback(async () => {
    if (!usuario) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Buscar eventos com base no período
      const { data: eventosData, error: eventosError } = await supabase
        .from('eventos')
        .select('*, produto:produtos(*, plataforma:plataformas(*))')
        .eq('usuario_id', usuario.id)
        .order('ocorrido_em', { ascending: false });
      
      if (eventosError) throw eventosError;
      
      // Buscar produtos
      const { data: produtosData, error: produtosError } = await supabase
        .from('produtos')
        .select('*, plataforma:plataformas(*)')
        .eq('usuario_id', usuario.id);
      
      if (produtosError) throw produtosError;
      
      // Buscar custos
      const { data: custosData, error: custosError } = await supabase
        .from('custos')
        .select('*')
        .eq('usuario_id', usuario.id);
      
      if (custosError) throw custosError;
      
      // Buscar plataformas
      const { data: plataformasData, error: plataformasError } = await supabase
        .from('plataformas')
        .select('*');
      
      if (plataformasError) throw plataformasError;
      
      setEventos(eventosData || []);
      setProdutos(produtosData || []);
      setCustos(custosData || []);
      setPlataformas(plataformasData || []);
      
    } catch (err) {
      console.error('Erro ao buscar dados:', err);
      setError(MENSAGENS.ERRO_GENERICO);
      toast.error(MENSAGENS.ERRO_GENERICO);
    } finally {
      setLoading(false);
    }
  }, [usuario]);

  // Filtrar eventos por período
  const getEventosFiltrados = useCallback(() => {
    const now = new Date();
    const spTimezone = 'America/Sao_Paulo';
    
    return eventos.filter(e => {
      const eventoDate = new Date(e.ocorrido_em);
      const eventoDateSP = new Date(eventoDate.toLocaleString('pt-BR', { timeZone: spTimezone }));
      
      switch (periodo) {
        case 'hoje':
          const todaySP = new Date(now.toLocaleString('pt-BR', { timeZone: spTimezone }));
          todaySP.setHours(0, 0, 0, 0);
          const tomorrowSP = new Date(todaySP);
          tomorrowSP.setDate(tomorrowSP.getDate() + 1);
          return eventoDateSP >= todaySP && eventoDateSP < tomorrowSP;
        
        case 'ontem':
          const yesterdaySP = new Date(now.toLocaleString('pt-BR', { timeZone: spTimezone }));
          yesterdaySP.setDate(yesterdaySP.getDate() - 1);
          yesterdaySP.setHours(0, 0, 0, 0);
          const todaySP = new Date(yesterdaySP);
          todaySP.setDate(todaySP.getDate() + 1);
          return eventoDateSP >= yesterdaySP && eventoDateSP < todaySP;
        
        case 'ultimos_3':
          const threeDaysAgo = new Date(now.toLocaleString('pt-BR', { timeZone: spTimezone }));
          threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
          threeDaysAgo.setHours(0, 0, 0, 0);
          return eventoDateSP >= threeDaysAgo;
        
        case 'ultimos_5':
          const fiveDaysAgo = new Date(now.toLocaleString('pt-BR', { timeZone: spTimezone }));
          fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
          fiveDaysAgo.setHours(0, 0, 0, 0);
          return eventoDateSP >= fiveDaysAgo;
        
        case 'ultimos_7':
          const sevenDaysAgo = new Date(now.toLocaleString('pt-BR', { timeZone: spTimezone }));
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          sevenDaysAgo.setHours(0, 0, 0, 0);
          return eventoDateSP >= sevenDaysAgo;
        
        case 'ultimos_15':
          const fifteenDaysAgo = new Date(now.toLocaleString('pt-BR', { timeZone: spTimezone }));
          fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 15);
          fifteenDaysAgo.setHours(0, 0, 0, 0);
          return eventoDateSP >= fifteenDaysAgo;
        
        case 'ultimo_mes':
          const oneMonthAgo = new Date(now.toLocaleString('pt-BR', { timeZone: spTimezone }));
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
          oneMonthAgo.setHours(0, 0, 0, 0);
          return eventoDateSP >= oneMonthAgo;
        
        case 'especifico':
          if (!dataEspecifica) return true;
          const selectedDate = new Date(dataEspecifica + 'T00:00:00');
          const selectedDateSP = new Date(selectedDate.toLocaleString('pt-BR', { timeZone: spTimezone }));
          const nextDay = new Date(selectedDateSP);
          nextDay.setDate(nextDay.getDate() + 1);
          return eventoDateSP >= selectedDateSP && eventoDateSP < nextDay;
        
        default:
          return true;
      }
    });
  }, [eventos, periodo, dataEspecifica]);

  // Calcular métricas sempre que eventos ou período mudar
  useEffect(() => {
    const eventosFiltrados = getEventosFiltrados();
    const custosFiltrados = custos.filter(c => {
      if (periodo === 'especifico' && dataEspecifica) {
        return c.data === dataEspecifica;
      }
      return true;
    });
    
    const newMetricas = calcularMetricas(eventosFiltrados, custosFiltrados);
    setMetricas(newMetricas);
  }, [eventos, custos, getEventosFiltrados, periodo, dataEspecifica]);

  // Buscar dados ao montar o componente
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Dados para gráfico de pizza por plataforma
  const getPieChartData = () => {
    const metricasPorPlataforma = calcularMetricasPorPlataforma(getEventosFiltrados(), produtos);
    
    return {
      labels: metricasPorPlataforma.map(p => p.plataforma),
      datasets: [
        {
          data: metricasPorPlataforma.map(p => p.vendas),
          backgroundColor: metricasPorPlataforma.map(p => p.cor_hex),
          borderWidth: 1,
        },
      ],
    };
  };

  // Dados para gráfico de barras (vendas vs cliques por produto)
  const getBarChartData = () => {
    const eventosFiltrados = getEventosFiltrados();
    const produtosComEventos = produtos.map(p => {
      const pEventos = eventosFiltrados.filter(e => e.produto_id === p.id);
      return {
        ...p,
        cliques: pEventos.filter(e => e.tipo === 'clique').length,
        vendas: pEventos.filter(e => e.tipo === 'venda').length,
      };
    }).filter(p => p.cliques > 0 || p.vendas > 0)
    .sort((a, b) => b.vendas - a.vendas || b.cliques - a.cliques)
    .slice(0, 10);
    
    return {
      labels: produtosComEventos.map(p => p.nome),
      datasets: [
        {
          label: 'Cliques',
          data: produtosComEventos.map(p => p.cliques),
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
        },
        {
          label: 'Vendas',
          data: produtosComEventos.map(p => p.vendas),
          backgroundColor: 'rgba(16, 185, 129, 0.5)',
        },
      ],
    };
  };

  // Dados para gráfico de linha (evolução de vendas)
  const getLineChartData = () => {
    const eventosFiltrados = getEventosFiltrados();
    const hoje = new Date();
    const dias = Array.from({ length: 7 }, (_, i) => {
      const data = new Date(hoje);
      data.setDate(hoje.getDate() - (6 - i));
      return data;
    });
    
    const vendasPorDia = dias.map(dia => {
      const diaSP = new Date(dia.toLocaleString('pt-BR', { timeZone: FUSO }));
      const amanha = new Date(diaSP);
      amanha.setDate(amanha.getDate() + 1);
      
      const vendas = eventosFiltrados.filter(e => {
        const eDate = new Date(e.ocorrido_em);
        const eDateSP = new Date(eDate.toLocaleString('pt-BR', { timeZone: FUSO }));
        return eDateSP >= diaSP && eDateSP < amanha && e.tipo === 'venda';
      }).length;
      
      return vendas;
    });
    
    return {
      labels: dias.map(d => d.toLocaleDateString('pt-BR', { weekday: 'short' })),
      datasets: [
        {
          label: 'Vendas',
          data: vendasPorDia,
          borderColor: 'rgba(16, 185, 129, 1)',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          tension: 0.3,
          fill: true,
        },
      ],
    };
  };

  if (loading) {
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
          <h1 className="text-2xl font-bold">Painel de Controle</h1>
          <p className="text-muted-foreground">
            Visão geral do seu desempenho
          </p>
        </div>
        <div className="flex items-center gap-2">
          <PeriodoSelector
            periodo={periodo}
            onPeriodoChange={setPeriodo}
            dataEspecifica={dataEspecifica}
            onDataEspecificaChange={setDataEspecifica}
          />
        </div>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Cliques */}
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cliques</CardTitle>
            <MousePointer className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas.cliques}</div>
            <p className="text-xs text-muted-foreground">
              Total de cliques no período
            </p>
          </CardContent>
        </Card>

        {/* Vendas */}
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Vendas</CardTitle>
            <Users className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metricas.vendas}</div>
            <p className="text-xs text-muted-foreground">
              Total de vendas no período
            </p>
          </CardContent>
        </Card>

        {/* Valor Bruto */}
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Valor Bruto</CardTitle>
            <DollarSign className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatarMoeda(metricas.valorBruto)}
            </div>
            <p className="text-xs text-muted-foreground">
              Soma de todos os valores de vendas
            </p>
          </CardContent>
        </Card>

        {/* Comissão Total */}
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Comissão Total</CardTitle>
            <TrendingUp className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatarMoeda(metricas.comissaoTotal)}
            </div>
            <p className="text-xs text-muted-foreground">
              Comissão de vendas (reembolsos subtraídos)
            </p>
          </CardContent>
        </Card>

        {/* Lucro Líquido */}
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
            <BarChart3 className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${metricas.lucroLiquido >= 0 ? 'text-green-600' : 'text-destructive'}`}>
              {formatarMoeda(metricas.lucroLiquido)}
            </div>
            <p className="text-xs text-muted-foreground">
              Comissão - Custos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Taxa de conversão */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="card-hover">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
            <TrendingUp className="w-5 h-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {formatarPorcentagem(metricas.taxaConversao)}
            </div>
            <p className="text-xs text-muted-foreground">
              {metricas.cliques > 0 ? `Vendas (${metricas.vendas}) / Cliques (${metricas.cliques})` : 'Sem dados'}
            </p>
          </CardContent>
        </Card>

        {/* Card vazio para alinhamento */}
        <div></div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição por plataforma */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Vendas por Plataforma
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getPieChartData().labels.length > 0 ? (
              <Pie
                data={getPieChartData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'bottom',
                    },
                  },
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                {MENSAGENS.NAO_HA_DADOS}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Evolução de vendas */}
        <Card className="card-hover">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LineChart className="w-5 h-5" />
              Evolução de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {getLineChartData().labels.length > 0 ? (
              <Line
                data={getLineChartData()}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                  },
                }}
              />
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                {MENSAGENS.NAO_HA_DADOS}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Produtos mais clicados vs mais vendidos */}
      <Card className="card-hover">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Produtos: Cliques vs Vendas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {getBarChartData().labels.length > 0 ? (
            <Bar
              data={getBarChartData()}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                },
              }}
            />
          ) : (
            <div className="flex items-center justify-center h-[300px] text-muted-foreground">
              {MENSAGENS.NAO_HA_DADOS}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
