// ============================================
// PÁGINA DE RECUPERAÇÃO DE SENHA
// ============================================

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { MENSAGENS } from '@/lib/constantes';

export default function RecuperarSenha() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { recuperarSenha } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error(MENSAGENS.CAMPO_OBRIGATORIO);
      return;
    }

    setLoading(true);
    try {
      const result = await recuperarSenha(email);
      if (result.error) {
        toast.error(result.error);
      } else {
        setSuccess(true);
      }
    } catch (error) {
      toast.error(MENSAGENS.ERRO_GENERICO);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-background p-4">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-xl shadow-lg p-8 text-center">
            {/* Ícone de sucesso */}
            <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>

            <h1 className="text-2xl font-bold mb-4">Verifique seu e-mail</h1>
            <p className="text-muted-foreground mb-6">
              Enviamos um link de recuperação de senha para o endereço:
              <span className="block font-medium text-foreground mt-2">{email}</span>
            </p>

            <p className="text-sm text-muted-foreground mb-8">
              O link expira em 1 hora. Se não recebeu o e-mail, verifique sua caixa de spam ou{' '}
              <button
                onClick={() => setSuccess(false)}
                className="text-primary hover:text-primary/80 hover:underline font-medium"
              >
                tente novamente
              </button>
            </p>

            <Button onClick={() => navigate('/login')} className="w-full">
              Voltar para Login
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-8">
            © 2026 Afiliados Inteligentes. Todos os direitos reservados.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-background p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-xl shadow-lg p-8">
          {/* Header com botão de voltar */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => navigate('/login')}
              className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Voltar
            </button>
          </div>

          {/* Logo e título */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-primary-foreground">AI</span>
            </div>
            <h1 className="text-2xl font-bold">Recuperar Senha</h1>
            <p className="text-muted-foreground text-sm mt-2">
              Informe seu e-mail para receber o link de recuperação
            </p>
          </div>

          {/* Formulário */}
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

            {/* Botão de enviar */}
            <Button
              type="submit"
              className="w-full"
              loading={loading}
              disabled={!email}
            >
              Enviar Link de Recuperação
            </Button>

            {/* Link para login */}
            <p className="text-center text-sm text-muted-foreground">
              Lembrou sua senha?{' '}
              <Link
                to="/login"
                className="text-primary hover:text-primary/80 hover:underline font-medium"
              >
                Entrar
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
