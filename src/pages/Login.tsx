import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Bot, LogIn, Sparkles, ShieldCheck } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('afiliado@inteligente.com.br');
  const [senha, setSenha] = useState('123456');
  const [nome, setNome] = useState('Afiliado Gestor');
  const [isCadastro, setIsCadastro] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !senha) {
      toast.error('Preencha e-mail e senha.');
      return;
    }
    try {
      setLoading(true);
      await login(email, isCadastro ? nome : undefined);
      toast.success(isCadastro ? 'Conta criada com sucesso!' : 'Login realizado com sucesso!');
    } catch (err) {
      toast.error('Erro ao realizar autenticação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-slate-100 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-slate-800/80 backdrop-blur-md border border-slate-700/60 rounded-2xl p-6 sm:p-8 shadow-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600/20 text-blue-400 mb-4 ring-1 ring-blue-500/30">
            <Bot className="w-10 h-10" />
          </div>
          <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-300">
            Afiliados Inteligentes
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Gestão Autônoma & IA Multicanal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isCadastro && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Nome Completo</label>
              <input
                type="text"
                value={nome}
                onChange={e => setNome(e.target.value)}
                placeholder="Seu nome"
                className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                required={isCadastro}
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Senha</label>
            <input
              type="password"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              placeholder="••••••••"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl font-semibold text-sm bg-blue-600 hover:bg-blue-500 active:scale-[0.98] transition-all text-white flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <>
                <LogIn className="w-4 h-4" />
                {isCadastro ? 'Criar Conta' : 'Entrar no Sistema'}
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-700/50 text-center">
          <button
            type="button"
            onClick={() => setIsCadastro(!isCadastro)}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
          >
            {isCadastro
              ? 'Já possui uma conta? Faça login'
              : 'Ainda não tem conta? Cadastre-se gratuitamente'}
          </button>
        </div>

        <div className="mt-6 bg-blue-950/40 border border-blue-800/40 rounded-xl p-3 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
          <p className="text-[11px] text-slate-300 leading-tight">
            Modo de Demonstração Ativo. Você pode entrar diretamente com os dados pré-preenchidos.
          </p>
        </div>
      </div>
    </div>
  );
};
