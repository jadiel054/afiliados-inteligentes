// ============================================
// PÁGINA DE LOGIN
// ============================================

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { MENSAGENS } from '@/lib/constantes';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSenha, setShowSenha] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !senha) {
      toast.error(MENSAGENS.CAMPO_OBRIGATORIO);
      return;
    }

    setLoading(true);
    try {
      const result = await login(email, senha);
      if (result.error) {
        toast.error(result.error);
      }
    } catch (error) {
      toast.error(MENSAGENS.ERRO_GENERICO);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-background p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-xl shadow-lg p-8">
          {/* Logo e título */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary-foreground">AI</span>
            </div>
            <h1 className="text-2xl font-bold">Afiliados Inteligentes</h1>
            <p className="text-muted-foreground text-sm mt-2">
              Gestão automatizada de afiliados com IA
            </p>
          </div>

          {/* Formulário de login */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                  disabled={loading}
                  required
                />
              </div>
            </div>

            {/* Senha */}
            <div className="space-y-2">
              <Label htmlFor="senha">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="senha"
                  type={showSenha ? 'text' : 'password'}
                  placeholder="Sua senha"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  className="pl-10 pr-10"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowSenha(!showSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showSenha ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Esqueceu a senha */}
            <div className="flex justify-end">
              <Link
                to="/recuperar-senha"
                className="text-sm text-primary hover:text-primary/80 hover:underline"
              >
                Esqueceu a senha?
              </Link>
            </div>

            {/* Botão de login */}
            <Button
              type="submit"
              className="w-full"
              loading={loading}
              disabled={!email || !senha}
            >
              Entrar
            </Button>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-card text-muted-foreground">ou</span>
              </div>
            </div>

            {/* Link para cadastro */}
            <p className="text-center text-sm text-muted-foreground">
              Não tem uma conta?{' '}
              <Link
                to="/cadastro"
                className="text-primary hover:text-primary/80 hover:underline font-medium"
              >
                Cadastre-se
              </Link>
            </p>
          </form>
        </div>

        {/* Rodapé */}
        <p className="text-center text-xs text-muted-foreground mt-8">
          © 2026 Afiliados Inteligentes. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
