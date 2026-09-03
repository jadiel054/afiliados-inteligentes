import React, { useState, useEffect } from 'react';
import { PeriodoFiltro, MétricasResumo, Evento, Produto } from '../types';
import { calcularMetricasPorPeriodo, carregarProdutos } from '../lib/dadosService';
import { GraficosPainel } from '../components/Painel/GraficosPainel';
import {
  MousePointerClick,
  ShoppingBag,
  DollarSign,
  TrendingUp,
  Percent,
  Calendar,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

export const Painel: React.FC = () => {
  const [periodo, setPeriodo] = useState<PeriodoFiltro>('7dias');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [metricas, setMetricas] = useState<MétricasResumo | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregarDados = () => {
    try {
      setCarregando(true);
      setErro(null);

      const prods = carregarProdutos();
      setProdutos(prods);

      const resultado = calcularMetricasPorPeriodo(periodo, dataInicio, dataFim);
      setMetricas(resultado.resumo);
      setEventos(resultado.eventosFiltrados);
    } catch (e) {
      setErro('Falha ao carregar métricas do painel. Verifique as configurações.');
      toast.error('Erro ao atualizar o painel.');
    } finally {
      setTimeout(() => setCarregando(false), 300);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [periodo, dataInicio, dataFim]);

  const handlePeriodoChange = (novoPeriodo: PeriodoFiltro) => {
    setPeriodo(novoPeriodo);
    toast.info(`Filtro alterado para: ${rotuloPeriodo(novoPeriodo)}`);
  };

  const rotuloPeriodo = (p: PeriodoFiltro) => {
    switch (p) {
      case 'hoje': return 'Hoje';
      case 'ontem': return 'Ontem';
      case '3dias': return 'Últimos 3 dias';
      case '5dias': return 'Últimos 5 dias';
      case '7dias': return 'Últimos 7 dias';
      case '15dias': return 'Últimos 15 dias';
      case '30dias': return 'Último Mês';
      case 'personalizado': return 'Personalizado';
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho e Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            Painel de Visão Geral
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Acompanhe o desempenho de cliques, vendas e comissões em tempo real.
          </p>
        </div>

        <button
          onClick={carregarDados}
          disabled={carregando}
          className="self-start sm:self-auto flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${carregando ? 'animate-spin' : ''}`} />
          Atualizar
        </button>
      </div>

      {/* Seleção de Períodos Fixos */}
      <div className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span>Filtrar Período:</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {(['hoje', 'ontem', '3dias', '5dias', '7dias', '15dias', '30dias', 'personalizado'] as PeriodoFiltro[]).map((p) => (
            <button
              key={p}
              onClick={() => handlePeriodoChange(p)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                periodo === p
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {rotuloPeriodo(p)}
            </button>
          ))}
        </div>

        {/* Inputs para Data Personalizada */}
        {periodo === 'personalizado' && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-700/50">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">De:</span>
              <input
                type="date"
                value={dataInicio}
                onChange={e => setDataInicio(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200"
              />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500">Até:</span>
              <input
                type="date"
                value={dataFim}
                onChange={e => setDataFim(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>
        )}
      </div>

      {/* Tratamento de Estados: Erro */}
      {erro && (
        <div className="p-4 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/40 rounded-2xl flex items-center justify-between gap-3 text-red-700 dark:text-red-400">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="text-xs font-semibold">{erro}</span>
          </div>
          <button
            onClick={carregarDados}
            className="px-3 py-1.5 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 shrink-0"
          >
            Tentar Novamente
          </button>
        </div>
      )}

      {/* Estado: Carregando */}
      {carregando ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-24 bg-slate-200 dark:bg-slate-700/40 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : metricas ? (
        <>
          {/* Grid de Cards de Métricas */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {/* Card Cliques */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Cliques</span>
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg">
                  <MousePointerClick className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {metricas.cliques.toLocaleString('pt-BR')}
              </p>
            </div>

            {/* Card Vendas */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Vendas</span>
                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {metricas.vendas.toLocaleString('pt-BR')}
              </p>
            </div>

            {/* Card Valor Bruto */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Valor Bruto</span>
                <div className="p-1.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                R$ {metricas.valorBrutoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            {/* Card Comissão Total */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Comissão Total</span>
                <div className="p-1.5 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-lg">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                R$ {metricas.comissaoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>

            {/* Card Lucro Líquido */}
            <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col justify-between col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Lucro Líquido</span>
                <div className="p-1.5 bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 rounded-lg">
                  <Percent className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                R$ {metricas.lucroLiquido.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Gráficos em tempo real */}
          <GraficosPainel eventos={eventos} produtos={produtos} />
        </>
      ) : null}
    </div>
  );
};
