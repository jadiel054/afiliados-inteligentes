import React, { useState } from 'react';
import { Bot, Check, X, Sparkles, RefreshCw, SlidersHorizontal, ArrowUpRight } from 'lucide-react';
import { toast } from 'sonner';

export const Agente: React.FC = () => {
  const [modo, setModo] = useState<'semi_autonomo' | 'autonomo_total'>('semi_autonomo');
  const [analisando, setAnalisando] = useState(false);

  const [propostas, setPropostas] = useState([
    {
      id: 'prop-1',
      nome: 'Base Líquida Alta Cobertura Matte 30ml',
      categoria: 'Maquiagem',
      plataforma: 'Shopee',
      preco: 39.90,
      comissao: 16.0,
      score: 89,
      status: 'pendente',
      razao: [
        'Margem de comissão de 16% é 4.5% acima da média da categoria Beleza.',
        'Volume de vendas cresceu +42% nos últimos 7 dias.',
        '4.9 estrelas de avaliação dos clientes.'
      ]
    },
    {
      id: 'prop-2',
      nome: 'Óleo Reparador de Pontas Argan 60ml',
      categoria: 'Cabelo',
      plataforma: 'Mercado Livre',
      preco: 54.90,
      comissao: 15.0,
      score: 84,
      status: 'pendente',
      razao: [
        'Excelente giro de estoque com entregas no mesmo dia.',
        'Competitividade alta e baixo índice de devolução (0.2%).'
      ]
    }
  ]);

  const handleAprovar = (id: string) => {
    setPropostas(prev => prev.map(p => p.id === id ? { ...p, status: 'aprovado' } : p));
    toast.success('Proposta aprovada! Produto cadastrado no seu painel.');
  };

  const handleRejeitar = (id: string) => {
    setPropostas(prev => prev.map(p => p.id === id ? { ...p, status: 'rejeitado' } : p));
    toast.info('Proposta rejeitada.');
  };

  const handleEscanearAgora = () => {
    setAnalisando(true);
    toast.info('Agente IA varrendo Shopee, Mercado Livre, Magalu e AliExpress...');
    setTimeout(() => {
      setAnalisando(false);
      toast.success('Varredura concluída! Nenhuma nova proposta acima do limiar no momento.');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
              Agente IA Autônomo
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white">
              v1.0 MVP
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            O Agente analisa produtos com alto potencial em Beleza, Cuidados, Maquiagem e Cabelo.
          </p>
        </div>

        <button
          onClick={handleEscanearAgora}
          disabled={analisando}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-600/20 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${analisando ? 'animate-spin' : ''}`} />
          Executar Varredura
        </button>
      </div>

      {/* Seletor de Modo do Agente */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Modo de Operação
            </h4>
            <p className="text-xs text-slate-500">
              {modo === 'semi_autonomo'
                ? '🟢 Semi-Autônomo (Padrão): Pontuação ≥75 envia propostas para sua aprovação.'
                : '🔵 Autônomo Total: Pontuação ≥85 se afilia e cadastra automaticamente.'}
            </p>
          </div>
        </div>

        <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-1 rounded-xl shrink-0">
          <button
            onClick={() => {
              setModo('semi_autonomo');
              toast.info('Modo alterado para Semi-Autônomo');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              modo === 'semi_autonomo'
                ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Semi-Autônomo
          </button>
          <button
            onClick={() => {
              setModo('autonomo_total');
              toast.info('Modo alterado para Autônomo Total');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              modo === 'autonomo_total'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Autônomo Total
          </button>
        </div>
      </div>

      {/* Propostas de Afiliação */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          Propostas Pendentes de Afiliação
        </h3>

        <div className="space-y-3">
          {propostas.map(prop => (
            <div
              key={prop.id}
              className={`bg-white dark:bg-slate-800 p-5 rounded-2xl border transition-all shadow-sm ${
                prop.status === 'aprovado'
                  ? 'border-emerald-300 dark:border-emerald-800/60 bg-emerald-50/20'
                  : prop.status === 'rejeitado'
                  ? 'border-slate-200 dark:border-slate-800 opacity-60'
                  : 'border-slate-200 dark:border-slate-700/60 hover:border-blue-300'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2 max-w-xl">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                      {prop.plataforma}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
                      {prop.categoria}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-700">
                      Score Winner: {prop.score}/100
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    {prop.nome}
                  </h4>

                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Preço: <strong>R$ {prop.preco.toFixed(2)}</strong> | Comissão estimada: <strong className="text-emerald-600 dark:text-emerald-400">{prop.comissao}% (R$ {((prop.preco * prop.comissao)/100).toFixed(2)})</strong>
                  </p>

                  <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 block uppercase">Motivos da Decisão do Agente:</span>
                    <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-300 list-disc list-inside">
                      {prop.razao.map((r, i) => (
                        <li key={i}>{r}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Ações */}
                <div className="flex items-center md:flex-col gap-2 shrink-0 justify-end">
                  {prop.status === 'pendente' ? (
                    <>
                      <button
                        onClick={() => handleAprovar(prop.id)}
                        className="flex-1 md:w-36 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all"
                      >
                        <Check className="w-4 h-4" />
                        Aprovar
                      </button>
                      <button
                        onClick={() => handleRejeitar(prop.id)}
                        className="flex-1 md:w-36 flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-all"
                      >
                        <X className="w-4 h-4" />
                        Rejeitar
                      </button>
                    </>
                  ) : (
                    <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {prop.status === 'aprovado' ? '✅ Aprovado' : '❌ Rejeitado'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
