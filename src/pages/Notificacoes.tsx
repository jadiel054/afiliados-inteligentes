import React, { useState } from 'react';
import { Bell, CheckCheck, Trash2, ShoppingBag, AlertTriangle, Link2, Bot } from 'lucide-react';
import { toast } from 'sonner';

export const Notificacoes: React.FC = () => {
  const [notificacoes, setNotificacoes] = useState([
    {
      id: 'not-1',
      tipo: 'venda',
      titulo: 'Venda Concluída! 🎉',
      mensagem: 'Sérum Facial Vitamina C vendido pela Shopee. Comissão gerada: R$ 7.23',
      lida: false,
      data: 'Há 12 minutos'
    },
    {
      id: 'not-2',
      tipo: 'agente_acao',
      titulo: 'Agente IA sugeriu 2 novos produtos',
      mensagem: 'Análise de alta margem concluída na categoria Maquiagem.',
      lida: false,
      data: 'Há 2 horas'
    },
    {
      id: 'not-3',
      tipo: 'reembolso',
      titulo: 'Aviso de Reembolso ⚠️',
      mensagem: 'Reembolso solicitado para Batom Matte (Mercado Livre). Impacto: -R$ 3.58',
      lida: true,
      data: 'Ontem'
    }
  ]);

  const handleMarcarTodasLidas = () => {
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })));
    toast.success('Todas as notificações foram marcadas como lidas.');
  };

  const handleLimpar = () => {
    if (confirm('Deseja limpar todas as notificações?')) {
      setNotificacoes([]);
      toast.success('Notificações limpas.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            Central de Notificações
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Acompanhe alertas de vendas, reembolsos, links e decisões do Agente IA.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleMarcarTodasLidas}
            className="flex items-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50"
          >
            <CheckCheck className="w-4 h-4 text-blue-600" />
            Marcar Lidas
          </button>
          <button
            onClick={handleLimpar}
            className="p-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-red-500 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {notificacoes.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl text-center border border-slate-200 dark:border-slate-700">
            <Bell className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs text-slate-500">Nenhuma notificação no momento.</p>
          </div>
        ) : (
          notificacoes.map(n => (
            <div
              key={n.id}
              className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                n.lida
                  ? 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-800 opacity-75'
                  : 'bg-white dark:bg-slate-800 border-blue-200 dark:border-blue-900 shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 shrink-0 mt-0.5">
                  {n.tipo === 'venda' && <ShoppingBag className="w-4 h-4 text-emerald-500" />}
                  {n.tipo === 'agente_acao' && <Bot className="w-4 h-4 text-blue-500" />}
                  {n.tipo === 'reembolso' && <AlertTriangle className="w-4 h-4 text-amber-500" />}
                </div>

                <div>
                  <h4 className="font-bold text-xs text-slate-900 dark:text-slate-100">{n.titulo}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">{n.mensagem}</p>
                  <span className="text-[10px] text-slate-400 mt-1 block">{n.data}</span>
                </div>
              </div>

              {!n.lida && (
                <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-2" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
