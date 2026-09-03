import React, { useState } from 'react';
import { RefreshCw, CheckCircle2, ShieldAlert, Key, Link2 } from 'lucide-react';
import { toast } from 'sonner';

export const Plataformas: React.FC = () => {
  const [sincronizando, setSincronizando] = useState(false);
  const [plataformas, setPlataformas] = useState([
    { id: 'shopee', nome: 'Shopee Affiliate', slug: 'shopee', conectado: true, token: 'shp_live_9876543210' },
    { id: 'mercado-livre', nome: 'Mercado Livre Afiliados', slug: 'mercado-livre', conectado: true, token: 'ml_live_1234567890' },
    { id: 'magalu', nome: 'Magalu Afiliados', slug: 'magalu', conectado: false, token: '' },
    { id: 'aliexpress', nome: 'AliExpress Portals', slug: 'aliexpress', conectado: true, token: 'ali_live_555444333' },
  ]);

  const handleSincronizarTodas = () => {
    setSincronizando(true);
    toast.info('Iniciando sincronização de produtos e vendas com todas as plataformas...');

    setTimeout(() => {
      setSincronizando(false);
      toast.success('Sincronização concluída! 28 novos eventos atualizados.');
    }, 1800);
  };

  const handleToggleConexao = (id: string, nome: string, atualConectado: boolean) => {
    if (atualConectado) {
      if (confirm(`Tem certeza que deseja desconectar a plataforma ${nome}?`)) {
        setPlataformas(prev =>
          prev.map(p => (p.id === id ? { ...p, conectado: false, token: '' } : p))
        );
        toast.success(`Plataforma ${nome} desconectada.`);
      }
    } else {
      const token = prompt(`Insira o Token de API para ${nome}:`, 'token_api_demo_123');
      if (token) {
        setPlataformas(prev =>
          prev.map(p => (p.id === id ? { ...p, conectado: true, token } : p))
        );
        toast.success(`Plataforma ${nome} conectada com sucesso!`);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            Plataformas Integradas
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gerencie tokens e sincronize vendas da Shopee, Mercado Livre, Magalu e AliExpress.
          </p>
        </div>

        <button
          onClick={handleSincronizarTodas}
          disabled={sincronizando}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-600/20 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${sincronizando ? 'animate-spin' : ''}`} />
          Sincronizar Agora
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {plataformas.map(plat => (
          <div
            key={plat.id}
            className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  {plat.nome}
                </h3>
                {plat.conectado ? (
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Conectado
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-900 px-2.5 py-1 rounded-full border border-slate-200 dark:border-slate-800">
                    <ShieldAlert className="w-3.5 h-3.5" /> Desconectado
                  </span>
                )}
              </div>

              {plat.conectado && (
                <div className="mb-4 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                  <Key className="w-4 h-4 text-blue-500 shrink-0" />
                  <span className="font-mono text-[11px] truncate">
                    Token: {plat.token.slice(0, 12)}••••••••
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={() => handleToggleConexao(plat.id, plat.nome, plat.conectado)}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold transition-all ${
                plat.conectado
                  ? 'bg-slate-100 dark:bg-slate-700 hover:bg-red-50 hover:text-red-600 text-slate-700 dark:text-slate-300'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/20'
              }`}
            >
              {plat.conectado ? 'Desconectar Plataforma' : 'Conectar API'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
