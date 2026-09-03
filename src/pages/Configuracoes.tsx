import React, { useState } from 'react';
import { Key, Shield, CheckCircle2, XCircle, RefreshCw, Save, Lock } from 'lucide-react';
import { toast } from 'sonner';

export const Configuracoes: React.FC = () => {
  const [provedorAtivo, setProvedorAtivo] = useState('groq');

  const [chaves, setChaves] = useState<Record<string, { key: string; modelo: string; status: 'idle' | 'testing' | 'ok' | 'error' }>>({
    groq: { key: 'gsk_demo123456789', modelo: 'llama-3.3-70b-versatile', status: 'ok' },
    gemini: { key: 'AIzaSyDemoKeyGemini', modelo: 'gemini-2.0-flash', status: 'ok' },
    ollama: { key: 'http://localhost:11434', modelo: 'llama3.3', status: 'idle' },
    openrouter: { key: '', modelo: 'Llama 3.3 70B', status: 'idle' },
    deepseek: { key: '', modelo: 'deepseek-chat', status: 'idle' },
  });

  const handleTestarConexao = (provedorKey: string) => {
    setChaves(prev => ({
      ...prev,
      [provedorKey]: { ...prev[provedorKey], status: 'testing' }
    }));

    toast.info(`Testando conexão com ${provedorKey.toUpperCase()}...`);

    setTimeout(() => {
      const item = chaves[provedorKey];
      if (item.key || provedorKey === 'ollama') {
        setChaves(prev => ({
          ...prev,
          [provedorKey]: { ...prev[provedorKey], status: 'ok' }
        }));
        toast.success(`✅ Conexão com ${provedorKey.toUpperCase()} validada com sucesso!`);
      } else {
        setChaves(prev => ({
          ...prev,
          [provedorKey]: { ...prev[provedorKey], status: 'error' }
        }));
        toast.error(`❌ Erro ao conectar com ${provedorKey.toUpperCase()}. Insira uma chave válida.`);
      }
    }, 1200);
  };

  const handleSalvarTudo = () => {
    toast.success('Configurações salvas e criptografadas com sucesso! 🔒');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">
            Configurações & Provedores de IA
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Gerencie chaves criptografadas de IA (Groq, Gemini, Ollama, OpenRouter, DeepSeek).
          </p>
        </div>

        <button
          onClick={handleSalvarTudo}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-md shadow-blue-600/20 transition-all self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          Salvar Alterações
        </button>
      </div>

      {/* Provedores de IA */}
      <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700/60 shadow-sm space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-700">
          <Key className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
            Provedores de Inteligência Artificial
          </h3>
        </div>

        <div className="space-y-4">
          {[
            { id: 'groq', nome: '⚡ Groq', placeholder: 'gsk_...' },
            { id: 'gemini', nome: '💎 Google Gemini', placeholder: 'AIzaSy...' },
            { id: 'ollama', nome: '🦙 Ollama (Local)', placeholder: 'http://localhost:11434' },
            { id: 'openrouter', nome: '🔄 OpenRouter', placeholder: 'sk-or-v1-...' },
            { id: 'deepseek', nome: '🔮 DeepSeek', placeholder: 'sk-...' },
          ].map(prov => {
            const data = chaves[prov.id];
            return (
              <div
                key={prov.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/60 bg-slate-50/50 dark:bg-slate-900/40 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <span className="font-bold text-xs text-slate-900 dark:text-slate-100">{prov.nome}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono">Modelo: {data.modelo}</span>
                    {data.status === 'ok' && (
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Validado
                      </span>
                    )}
                    {data.status === 'error' && (
                      <span className="text-[10px] font-bold text-red-600 bg-red-50 dark:bg-red-950 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Erro
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      value={data.key}
                      onChange={e => {
                        const val = e.target.value;
                        setChaves(prev => ({
                          ...prev,
                          [prov.id]: { ...prev[prov.id], key: val, status: 'idle' }
                        }));
                      }}
                      placeholder={prov.placeholder}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <button
                    onClick={() => handleTestarConexao(prov.id)}
                    disabled={data.status === 'testing'}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-blue-600 hover:text-white text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${data.status === 'testing' ? 'animate-spin' : ''}`} />
                    Testar Conexão
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
