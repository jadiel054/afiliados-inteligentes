-- ============================================
-- 001_tabelas.sql
-- Criação de todas as tabelas do sistema
-- ============================================

-- Catálogo GLOBAL de plataformas (sem token - token é por usuário)
CREATE TABLE IF NOT EXISTS plataformas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,            -- shopee, mercado-livre, magalu, aliexpress
  nome TEXT NOT NULL,
  cor_hex TEXT,                         -- usada nos gráficos por origem
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Conexão de CADA usuário com CADA plataforma
CREATE TABLE IF NOT EXISTS contas_plataforma (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plataforma_id UUID NOT NULL REFERENCES plataformas(id),
  vault_secret_id UUID,                 -- referência ao Supabase Vault. NUNCA o token aqui
  id_afiliado TEXT,                     -- identificador público do afiliado
  config JSONB DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'desconectado'
    CHECK (status IN ('conectado','desconectado','erro')),
  ultima_sinc TIMESTAMPTZ,
  ultimo_erro TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (usuario_id, plataforma_id)
);

CREATE TABLE IF NOT EXISTS produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  plataforma_id UUID NOT NULL REFERENCES plataformas(id),
  id_externo TEXT,                      -- id do produto na plataforma de origem
  valor NUMERIC(10,2) NOT NULL CHECK (valor >= 0),
  comissao_percent NUMERIC(5,2) NOT NULL CHECK (comissao_percent BETWEEN 0 AND 100),
  link_original TEXT NOT NULL,
  link_afiliado TEXT,                   -- link de afiliado gerado na plataforma
  link_curto_codigo TEXT UNIQUE NOT NULL,   -- 8 chars base62
  imagem_url TEXT,
  status TEXT NOT NULL DEFAULT 'ativo'
    CHECK (status IN ('ativo','pausado','arquivado')),
  origem TEXT NOT NULL DEFAULT 'manual'
    CHECK (origem IN ('manual','agente_proposto','agente_automatico')),
  pontuacao_agente NUMERIC(5,2) CHECK (pontuacao_agente BETWEEN 0 AND 100),
  razao_escolha TEXT,
  classificacao TEXT                    -- campeao | promissor | estavel | fraco
    CHECK (classificacao IN ('campeao','promissor','estavel','fraco')),
  data_cadastro TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now(),
  UNIQUE (usuario_id, plataforma_id, id_externo)   -- evita cadastrar o mesmo produto 2x
);

-- Eventos: cliques, vendas, reembolsos, pagamentos
CREATE TABLE IF NOT EXISTS eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES produtos(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('clique','venda','reembolso','pagamento')),
  valor_bruto NUMERIC(10,2) DEFAULT 0,
  valor_comissao NUMERIC(10,2) DEFAULT 0,   -- NEGATIVO em reembolso
  moeda TEXT NOT NULL DEFAULT 'BRL',
  id_externo TEXT,                     -- id do evento na plataforma - CHAVE DE DEDUPLICAÇÃO
  ip_hash TEXT,                        -- somente cliques. SHA-256(ip + salt). Nunca IP puro
  user_agent TEXT,
  referrer TEXT,
  dados_plataforma JSONB,
  ocorrido_em TIMESTAMPTZ NOT NULL DEFAULT now(),  -- quando aconteceu na plataforma
  created_at TIMESTAMPTZ DEFAULT now()             -- quando entrou no nosso banco
);

-- Impede que re-sincronizar duplique vendas e infle suas métricas
CREATE UNIQUE INDEX IF NOT EXISTS eventos_id_externo_unico
  ON eventos (usuario_id, tipo, id_externo)
  WHERE id_externo IS NOT NULL;

-- Custos - necessários para calcular Lucro Líquido
CREATE TABLE IF NOT EXISTS custos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('anuncio','ferramenta','imposto','outro')),
  valor NUMERIC(10,2) NOT NULL CHECK (valor >= 0),
  produto_id UUID REFERENCES produtos(id) ON DELETE SET NULL,  -- opcional
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS provedores_ia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  provedor TEXT NOT NULL
    CHECK (provedor IN ('groq','ollama','gemini','cloudflare','openrouter','deepseek')),
  vault_secret_id UUID,                -- chave no Vault. NUNCA a chave aqui
  url_base TEXT,                       -- obrigatório para ollama e cloudflare
  conta_id TEXT,                       -- cloudflare: account id
  modelo TEXT NOT NULL,
  ativo BOOLEAN DEFAULT false,
  ordem_fallback INT NOT NULL DEFAULT 1,
  ultimo_teste TIMESTAMPTZ,
  ultimo_teste_ok BOOLEAN,
  ultimo_teste_msg TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (usuario_id, ordem_fallback)
);

CREATE TABLE IF NOT EXISTS config_agente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  modo TEXT NOT NULL DEFAULT 'semi_autonomo'
    CHECK (modo IN ('desligado','semi_autonomo','autonomo_total')),
  pontuacao_propor INT NOT NULL DEFAULT 75 CHECK (pontuacao_propor BETWEEN 0 AND 100),
  pontuacao_agir INT NOT NULL DEFAULT 85 CHECK (pontuacao_agir BETWEEN 0 AND 100),
  comissao_minima NUMERIC(5,2) NOT NULL DEFAULT 5,
  valor_maximo NUMERIC(10,2) DEFAULT 500,
  rodar_a_cada_horas INT NOT NULL DEFAULT 6 CHECK (rodar_a_cada_horas BETWEEN 1 AND 24),
  max_produtos_dia INT NOT NULL DEFAULT 10 CHECK (max_produtos_dia BETWEEN 1 AND 100),
  horario_inicio INT NOT NULL DEFAULT 8 CHECK (horario_inicio BETWEEN 0 AND 23),
  horario_fim INT NOT NULL DEFAULT 22 CHECK (horario_fim BETWEEN 0 AND 23),
  categorias TEXT[] NOT NULL DEFAULT ARRAY[
    'beleza','cuidados-pessoais','maquiagem','pele','cabelo','perfumaria'
  ],
  atualizado_em TIMESTAMPTZ DEFAULT now(),
  CHECK (pontuacao_agir >= pontuacao_propor)
);

CREATE TABLE IF NOT EXISTS propostas_agente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dados_produto JSONB NOT NULL,
  pontuacao NUMERIC(5,2) NOT NULL CHECK (pontuacao BETWEEN 0 AND 100),
  subpontuacoes JSONB NOT NULL,        -- {margem: 82, giro: 65, ...} - auditoria
  razao TEXT[] NOT NULL,
  relatorio TEXT NOT NULL,             -- texto completo em PT-BR
  dados_incompletos BOOLEAN DEFAULT false,
  confianca TEXT NOT NULL DEFAULT 'media' CHECK (confianca IN ('baixa','media','alta')),
  status TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente','aprovado','rejeitado','automatico','expirado')),
  produto_id UUID REFERENCES produtos(id) ON DELETE SET NULL,  -- preenchido ao aprovar
  decidido_em TIMESTAMPTZ,
  data TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL
    CHECK (tipo IN ('venda','reembolso','link_problema','agente','sistema','resumo')),
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  link_interno TEXT,                   -- rota para onde o toque leva
  chave_agrupamento TEXT,              -- consolida repetidas
  lida BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Log de execuções do agente - transparência das decisões
CREATE TABLE IF NOT EXISTS log_agente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  acao TEXT NOT NULL,                  -- varredura, pontuou, propos, afiliou, monitorou
  resultado TEXT NOT NULL CHECK (resultado IN ('sucesso','parcial','falhou')),
  detalhe JSONB,
  mensagem TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Log de chamadas de IA - controle de custo e diagnóstico de failover
CREATE TABLE IF NOT EXISTS log_ia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provedor TEXT NOT NULL,
  modelo TEXT,
  tokens_entrada INT,
  tokens_saida INT,
  latencia_ms INT,
  sucesso BOOLEAN NOT NULL,
  erro TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela para armazenar o salt do Vault (para ip_hash)
CREATE TABLE IF NOT EXISTS vault_salt (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  salt TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (usuario_id)
);
