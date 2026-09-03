# INSTRUÇÕES COMPLETAS DE DESENVOLVIMENTO — V2
## Projeto: Afiliados Inteligentes — Sistema de Gestão com Agente IA Autônomo

> **Repositório:** github.com/jadiel054/afiliados-inteligentes
> **Versão:** 2.0 — 03/09/2026 (a V1 original está preservada em `docs/INSTRUCOES_V1_ORIGINAL.md`)
> **Plataforma de desenvolvimento:** Apenas celular — mantenha arquivos pequenos, modulares e bem organizados
> **Regra #1:** TODOS os botões DEVEM funcionar — sem exceção. Ação → Feedback visual imediato. Excluir SEMPRE pede confirmação.

---

## 0. COMO USAR ESTE DOCUMENTO (leia antes de codar)

Este documento é a **fonte da verdade**. Qualquer dúvida sobre o que fazer → consultar aqui primeiro.

**Para o agente de codificação:**

1. Implemente **uma fase por vez**. Nunca comece a Fase N+1 sem que a Fase N atenda 100% do seu *Critério de Aceite* (seção 10).
2. Ao terminar uma fase, **liste o que foi feito item por item** contra o critério de aceite e diga explicitamente o que ficou pendente.
3. **Nunca invente endpoint de API externa.** Se a documentação oficial da plataforma não confirmar que um endpoint existe, pare e pergunte (ver seção 12).
4. **Nunca use `any`** em TypeScript. Todos os tipos em `src/types/`.
5. **Nunca escreva chave, token ou segredo no código nem no frontend.** Ver seção 6 — isso é motivo de rejeição imediata do código.
6. Se este documento estiver ambíguo em algum ponto, **pergunte antes de assumir**. Não preencha lacuna com invenção.

---

## 1. OBJETIVO DO SISTEMA

Centralizar, monitorar e automatizar a gestão de produtos, links, cliques, vendas e comissões de múltiplas plataformas de afiliados (Shopee, Mercado Livre, Magalu, Aliexpress) em um único painel, com Agente IA que **busca → analisa → decide → se afilia → notifica** de forma autônoma ou semi-autônoma.

**Nicho de foco do agente:** Beleza, Cuidados Pessoais, Maquiagem, Pele, Cabelo, Perfumaria.

---

## 2. PILHAS TECNOLÓGICAS DEFINIDAS

| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Estilo | Tailwind CSS + shadcn/ui (componentes padronizados) |
| Ícones | Lucide React |
| Gráficos | Chart.js + react-chartjs-2 |
| Banco + Auth | Supabase (PostgreSQL) |
| **Camada de servidor** | **Supabase Edge Functions (Deno) — OBRIGATÓRIA, ver seção 3** |
| **Segredos** | **Supabase Vault** |
| **Agendamento** | **pg_cron (Supabase) chamando Edge Function** |
| Hospedagem frontend | Vercel (deploy automático via GitHub) |
| IA | Groq, Ollama, Cloudflare Workers AI, OpenRouter, Gemini, DeepSeek — TODOS configuráveis |
| Notificações UI | Sonner (toast de feedback) |
| Formulários | React Hook Form + Zod |

### 2.1 Por que a camada de servidor é obrigatória

**Mudança em relação à V1.** A V1 definia apenas frontend + Supabase. Isso torna **impossível** cumprir três requisitos do próprio documento:

| Requisito | Por que não funciona só no frontend |
|---|---|
| "Chaves CRIPTOGRAFADAS, nunca em texto plano" | Num navegador, a chave de descriptografar estaria ao lado do dado. Criptografia client-side é teatro. |
| Chamar Groq/Gemini/DeepSeek | Chamada direta do browser expõe a API key no DevTools e no tráfego de rede. |
| Link curto + contagem de cliques | Redirect e gravação do clique exigem um endpoint HTTP do lado do servidor. |

Portanto: **toda chamada que envolve segredo, API externa ou redirect passa por Edge Function.** O frontend nunca vê uma chave.

> Neon não é necessário. O Supabase já é PostgreSQL e as Edge Functions cobrem o backend. Manter Neon adicionaria uma dependência sem ganho. Se algum dia precisar de banco separado, migrar depois — não agora.

---

## 3. ARQUITETURA E FLUXOS

### 3.1 Visão geral

```
[ Navegador / Celular ]
        |
        |  supabase-js (anon key) — apenas leitura/escrita de dados do próprio usuário, protegido por RLS
        v
[ Supabase Postgres + RLS ]  <----+
        ^                          |
        |  service_role            |
        |                          |
[ Supabase Edge Functions ] -------+
        |
        +--> Provedores de IA (Groq, Gemini, Ollama, ...)  <- chave lida do Vault
        +--> APIs de afiliado (Shopee, ML, Magalu, Aliexpress) <- token lido do Vault
        +--> /r/:codigo  (redirect de link curto + grava clique)
        ^
        |
[ pg_cron ] -- agenda a varredura do agente
```

### 3.2 Edge Functions obrigatórias

| Função | Rota | O que faz |
|---|---|---|
| `redirect-link` | `GET /r/:codigo` | Grava evento `clique` → responde `302` para o link original |
| `ia-testar` | `POST /ia/testar` | Testa conexão de um provedor de IA e devolve ✅/❌ com mensagem clara |
| `ia-completar` | `POST /ia/completar` | Chama o provedor ativo com failover automático |
| `plataforma-testar` | `POST /plataforma/testar` | Valida token de plataforma de afiliado |
| `plataforma-sincronizar` | `POST /plataforma/sincronizar` | Importa cliques/vendas/reembolsos — idempotente |
| `agente-varredura` | `POST /agente/varredura` | Busca produtos, pontua, propõe ou age. Chamada pelo pg_cron e pelo botão manual |
| `exportar-dados` | `POST /conta/exportar` | Exporta dados do usuário (LGPD) |
| `excluir-conta` | `POST /conta/excluir` | Apaga tudo do usuário (LGPD) |

### 3.3 Especificação do link curto (faltava na V1)

Sem isso, a métrica "Cliques" do Painel nunca sai de zero.

- **Formato:** `https://<dominio>/r/{codigo}` — `codigo` = 8 caracteres base62 gerados com `nanoid`, salvos em `produtos.link_curto_codigo` com constraint `UNIQUE`.
- **Geração:** no momento do cadastro do produto, dentro de uma Edge Function (nunca no cliente). Em caso de colisão, tentar novamente até 5 vezes.
- **No acesso:** grava em `eventos` um registro `tipo='clique'` com `produto_id`, `ip_hash` (SHA-256 do IP + salt do Vault — **nunca o IP puro**, LGPD), `user_agent`, `referrer`.
- **Deduplicação:** mesmo `ip_hash` + mesmo `produto_id` dentro de **30 segundos** conta como 1 clique.
- **Resposta:** `302` para `link_original`.
- **Regra de ouro do redirect:** se o produto estiver `pausado`/`arquivado` ou se a gravação do clique falhar, **redirecione mesmo assim** e registre o erro no log. Nunca perder uma venda por causa de telemetria.

### 3.4 Fuso horário

- Guardar **sempre** em `TIMESTAMPTZ` (UTC).
- Todo agrupamento de métrica ("Hoje", "Ontem", "Últimos 7 dias") converte para **`America/Sao_Paulo`** na consulta.
- Constante única `FUSO = 'America/Sao_Paulo'` em `src/lib/constantes.ts`. Nunca hardcodar em outro lugar.

### 3.5 Retry, rate limit e failover

- Erro `429` ou `5xx` em API externa → **backoff exponencial**: 1s, 2s, 4s (máx. 3 tentativas).
- Esgotadas as tentativas em um provedor de IA → **failover** para o próximo `ativo` por `ordem_fallback`, sem interromper o fluxo.
- Todos os provedores falharam → grava notificação `sistema` explicando, e a varredura termina como `falhou` (nunca em silêncio).
- Toda chamada de IA registrada em `log_ia` (provedor, modelo, tokens, latência, sucesso). Serve para você controlar custo.

---

## 4. ESTRUTURA OBRIGATÓRIA DE PASTAS

```
afiliados-inteligentes/
├── public/
├── src/
│   ├── components/
│   │   ├── ui/              # Botões, inputs, modais, cards — TODOS funcionais
│   │   ├── Layout/          # Menu, Navegação, Rodapé
│   │   ├── Painel/          # Gráficos, Resumos, Filtros de Período
│   │   ├── Produtos/        # Lista, Cadastro, Edição, Exclusão
│   │   ├── Agente/          # Propostas, Análises, Log de Ações
│   │   ├── Plataformas/     # Conexões, Sincronização
│   │   └── Configuracoes/   # IA, Agente, Conta, Preferências
│   ├── lib/
│   │   ├── supabase.ts       # Cliente + inicialização
│   │   ├── constantes.ts     # FUSO, enums, limites, categorias do nicho
│   │   ├── ia/
│   │   │   ├── provedores.ts # Catálogo dos provedores (metadados, NÃO chaves)
│   │   │   ├── analisador.ts # Pontuação determinística — ver seção 8
│   │   │   └── decisor.ts    # Filtros eliminatórios + autonomia
│   │   └── plataformas/      # Shopee, ML, Magalu, Aliexpress — adaptadores
│   ├── types/
│   │   └── index.ts          # Tipos TypeScript — NÃO usar any
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Cadastro.tsx          # NOVO — faltava na V1
│   │   ├── RecuperarSenha.tsx    # NOVO — faltava na V1
│   │   ├── Painel.tsx
│   │   ├── Produtos.tsx
│   │   ├── Agente.tsx
│   │   ├── Plataformas.tsx
│   │   ├── Notificacoes.tsx
│   │   └── Configuracoes.tsx
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── supabase/
│   ├── migrations/           # Substitui prisma/schema.sql — Prisma NÃO está na stack
│   │   ├── 001_tabelas.sql
│   │   ├── 002_rls.sql
│   │   ├── 003_indices.sql
│   │   └── 004_cron.sql
│   ├── functions/            # Edge Functions (seção 3.2)
│   └── seed.sql              # Dados de teste — ver seção 10, Fase 1
├── .env.example
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── README.md
```

**Limite de arquivo:** máximo **250 linhas** por arquivo `.tsx`/`.ts`. Passou disso, quebre em componentes menores — você edita pelo celular.

---

## 5. MODELO DE DADOS — SUPABASE

> Mudanças frente à V1: `TIMESTAMPTZ`, enums com `CHECK`, `contas_plataforma` separada, `id_externo` para deduplicação, tabela `custos` (para definir Lucro Líquido), tabelas de log, índices e RLS.

### 5.1 Tabelas

```sql
-- ============================================
-- 001_tabelas.sql
-- ============================================

-- Catálogo GLOBAL de plataformas (sem token — token é por usuário)
CREATE TABLE plataformas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,            -- shopee, mercado-livre, magalu, aliexpress
  nome TEXT NOT NULL,
  cor_hex TEXT,                         -- usada nos gráficos por origem
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Conexão de CADA usuário com CADA plataforma
-- (na V1 o token ficava na tabela global = token compartilhado entre usuários)
CREATE TABLE contas_plataforma (
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

CREATE TABLE produtos (
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
  link_curto_codigo TEXT UNIQUE NOT NULL,   -- 8 chars base62 — ver 3.3
  imagem_url TEXT,
  status TEXT NOT NULL DEFAULT 'ativo'
    CHECK (status IN ('ativo','pausado','arquivado')),
  origem TEXT NOT NULL DEFAULT 'manual'
    CHECK (origem IN ('manual','agente_proposto','agente_automatico')),
  pontuacao_agente NUMERIC(5,2) CHECK (pontuacao_agente BETWEEN 0 AND 100),
  razao_escolha TEXT,
  classificacao TEXT                    -- campeao | promissor | estavel | fraco — ver 7.2
    CHECK (classificacao IN ('campeao','promissor','estavel','fraco')),
  data_cadastro TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now(),
  UNIQUE (usuario_id, plataforma_id, id_externo)   -- evita cadastrar o mesmo produto 2x
);

-- Eventos: cliques, vendas, reembolsos, pagamentos
CREATE TABLE eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  produto_id UUID REFERENCES produtos(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('clique','venda','reembolso','pagamento')),
  valor_bruto NUMERIC(10,2) DEFAULT 0,
  valor_comissao NUMERIC(10,2) DEFAULT 0,   -- NEGATIVO em reembolso
  moeda TEXT NOT NULL DEFAULT 'BRL',
  id_externo TEXT,                     -- id do evento na plataforma — CHAVE DE DEDUPLICAÇÃO
  ip_hash TEXT,                        -- somente cliques. SHA-256(ip + salt). Nunca IP puro
  user_agent TEXT,
  referrer TEXT,
  dados_plataforma JSONB,
  ocorrido_em TIMESTAMPTZ NOT NULL DEFAULT now(),  -- quando aconteceu na plataforma
  created_at TIMESTAMPTZ DEFAULT now()             -- quando entrou no nosso banco
);

-- Impede que re-sincronizar duplique vendas e infle suas métricas
CREATE UNIQUE INDEX eventos_id_externo_unico
  ON eventos (usuario_id, tipo, id_externo)
  WHERE id_externo IS NOT NULL;

-- Custos — necessários para calcular Lucro Líquido (indefinido na V1)
CREATE TABLE custos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('anuncio','ferramenta','imposto','outro')),
  valor NUMERIC(10,2) NOT NULL CHECK (valor >= 0),
  produto_id UUID REFERENCES produtos(id) ON DELETE SET NULL,  -- opcional
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE provedores_ia (
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

CREATE TABLE config_agente (
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

CREATE TABLE propostas_agente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  dados_produto JSONB NOT NULL,
  pontuacao NUMERIC(5,2) NOT NULL CHECK (pontuacao BETWEEN 0 AND 100),
  subpontuacoes JSONB NOT NULL,        -- {margem: 82, giro: 65, ...} — auditoria
  razao TEXT[] NOT NULL,
  relatorio TEXT NOT NULL,             -- texto completo em PT-BR — ver 8.5
  dados_incompletos BOOLEAN DEFAULT false,
  confianca TEXT NOT NULL DEFAULT 'media' CHECK (confianca IN ('baixa','media','alta')),
  status TEXT NOT NULL DEFAULT 'pendente'
    CHECK (status IN ('pendente','aprovado','rejeitado','automatico','expirado')),
  produto_id UUID REFERENCES produtos(id) ON DELETE SET NULL,  -- preenchido ao aprovar
  decidido_em TIMESTAMPTZ,
  data TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL
    CHECK (tipo IN ('venda','reembolso','link_problema','agente','sistema','resumo')),
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  link_interno TEXT,                   -- rota para onde o toque leva
  chave_agrupamento TEXT,              -- consolida repetidas — ver 7.5
  lida BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Log de execuções do agente — transparência das decisões
CREATE TABLE log_agente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  acao TEXT NOT NULL,                  -- varredura, pontuou, propos, afiliou, monitorou
  resultado TEXT NOT NULL CHECK (resultado IN ('sucesso','parcial','falhou')),
  detalhe JSONB,
  mensagem TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Log de chamadas de IA — controle de custo e diagnóstico de failover
CREATE TABLE log_ia (
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
```

### 5.2 Índices

```sql
-- ============================================
-- 003_indices.sql
-- ============================================
CREATE INDEX idx_eventos_usuario_data   ON eventos (usuario_id, ocorrido_em DESC);
CREATE INDEX idx_eventos_produto_tipo   ON eventos (produto_id, tipo, ocorrido_em DESC);
CREATE INDEX idx_produtos_usuario       ON produtos (usuario_id, status);
CREATE INDEX idx_produtos_codigo        ON produtos (link_curto_codigo);
CREATE INDEX idx_propostas_usuario_st   ON propostas_agente (usuario_id, status, data DESC);
CREATE INDEX idx_notificacoes_nao_lidas ON notificacoes (usuario_id, lida, created_at DESC);
CREATE INDEX idx_custos_usuario_data    ON custos (usuario_id, data DESC);
```

### 5.3 RLS — Row Level Security (faltava por completo na V1)

**Isto é crítico.** O frontend usa a `anon key`, que é pública por design. **Sem RLS, qualquer usuário logado lê os produtos, comissões e conexões de todos os outros.**

```sql
-- ============================================
-- 002_rls.sql
-- ============================================

-- Catálogo global: leitura para autenticados, escrita ninguém (só service_role)
ALTER TABLE plataformas ENABLE ROW LEVEL SECURITY;
CREATE POLICY plataformas_leitura ON plataformas
  FOR SELECT TO authenticated USING (true);

-- Padrão aplicado a TODAS as tabelas com usuario_id
-- Repetir este bloco para: contas_plataforma, produtos, eventos, custos,
-- provedores_ia, config_agente, propostas_agente, notificacoes, log_agente, log_ia

ALTER TABLE produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY produtos_sel ON produtos
  FOR SELECT TO authenticated USING (auth.uid() = usuario_id);
CREATE POLICY produtos_ins ON produtos
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY produtos_upd ON produtos
  FOR UPDATE TO authenticated
  USING (auth.uid() = usuario_id) WITH CHECK (auth.uid() = usuario_id);
CREATE POLICY produtos_del ON produtos
  FOR DELETE TO authenticated USING (auth.uid() = usuario_id);
```

**Regras adicionais de RLS:**

- `provedores_ia` e `contas_plataforma`: o frontend **pode** ler nome/modelo/status, mas `vault_secret_id` **nunca** deve chegar ao cliente. Exponha essas tabelas ao frontend através de uma `VIEW` que omite a coluna, e faça toda escrita de segredo por Edge Function.
- `eventos`, `log_agente`, `log_ia`: frontend tem **somente SELECT**. Inserção apenas por Edge Function (`service_role`).
- `propostas_agente`: frontend pode SELECT e UPDATE apenas da coluna `status` (aprovar/rejeitar). INSERT só pelo agente.
- **Teste obrigatório antes de fechar a Fase 1:** crie dois usuários, cadastre produto no A, e confirme que o B **não** consegue ler nem por consulta direta. Se conseguir, a fase não está pronta.

### 5.4 Agendamento

```sql
-- ============================================
-- 004_cron.sql
-- ============================================
-- Roda de hora em hora; a própria Edge Function decide quem está no horário
-- e quem já venceu o intervalo de rodar_a_cada_horas.
SELECT cron.schedule(
  'agente-varredura-horaria',
  '0 * * * *',
  $$ SELECT net.http_post(
       url     := current_setting('app.edge_url') || '/agente-varredura',
       headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.cron_token'))
     ) $$
);
```

---

## 6. SEGURANÇA — NÃO NEGOCIÁVEL

1. **Nenhum segredo no frontend.** Chaves de IA e tokens de plataforma vivem no **Supabase Vault**, referenciados por `vault_secret_id`. O frontend envia a chave **uma única vez** para a Edge Function `ia-testar`/`plataforma-testar`, que grava no Vault e devolve apenas o id.
2. **Nunca devolver segredo em resposta de API.** Ao exibir uma chave já salva, mostrar mascarado: `gsk_••••••••4f2a` (últimos 4 caracteres). Sem "revelar chave".
3. **`.env` no frontend só aceita valor público:** `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`. Qualquer outra coisa em `VITE_*` é pública — tratar como vazada.
4. **`service_role` key só dentro de Edge Function.** Nunca no repositório, nunca em `VITE_*`.
5. **RLS ligado em todas as tabelas** (seção 5.3). Tabela nova sem policy = bug de segurança.
6. **LGPD:** nunca gravar IP puro (usar `ip_hash` com salt do Vault). Exportação e exclusão de conta funcionais (Fase 4). Ao excluir conta, `ON DELETE CASCADE` limpa tudo e os segredos do Vault são apagados.
7. **Validação no servidor também.** Zod no frontend é UX; a Edge Function revalida. Nunca confiar no cliente.

---

## 7. FUNCIONALIDADES DETALHADAS — IMPLEMENTAR EXATAMENTE

### 7.1 📊 Painel de Visão Geral

- Períodos fixos: **Hoje, Ontem, Últimos 3, 5, 7, 15 dias, Último Mês** + **Buscar dia específico**
- Métricas: Cliques, Vendas, Valor Bruto, Comissão Total, **Lucro Líquido**
- Origem por plataforma: gráfico de distribuição — Shopee / ML / Magalu / Aliexpress
- Gráficos: Evolução de vendas, produtos mais clicados vs mais vendidos
- Estados: Sem dados → mensagem amigável; Carregando → indicador; Erro → explicação + botão **Tentar Novamente**

**Fórmulas (a V1 não definia "Lucro Líquido"):**

```
Valor Bruto     = Σ eventos.valor_bruto        WHERE tipo='venda'
Comissão Total  = Σ eventos.valor_comissao     WHERE tipo IN ('venda','reembolso')
                  (reembolso entra com valor NEGATIVO)
Lucro Líquido   = Comissão Total − Σ custos.valor  (no mesmo período)
Taxa Conversão  = Vendas ÷ Cliques × 100
```

Toda agregação por dia usa `ocorrido_em` convertido para `America/Sao_Paulo`.

### 7.2 📦 Gestão de Produtos

- Cadastro: Nome, Categoria, Plataforma, Valor, Comissão %, Link Original → **Link Curto GERADO AUTOMATICAMENTE** (via Edge Function, seção 3.3)
- Ações: ✏️ Editar | 🗑️ Excluir → **CONFIRMAÇÃO OBRIGATÓRIA** ("Tem certeza? Esta ação não pode ser desfeita." → [Sim, Excluir] / [Cancelar]) | 📋 Copiar Link → feedback "Copiado!"
- Filtros: Por plataforma, categoria, status, período
- Classificação automática por desempenho

**Regra da classificação automática** (a V1 não definia os limites). Calculada sobre os últimos 30 dias:

| Classificação | Critério |
|---|---|
| 🏆 `campeao` | ≥ 5 vendas **e** conversão ≥ 3% |
| 📈 `promissor` | ≥ 1 venda **e** conversão ≥ 1% |
| ➖ `estavel` | ≥ 20 cliques **e** ≥ 1 venda |
| 📉 `fraco` | ≥ 50 cliques **e** 0 venda |
| — | Menos de 20 cliques → sem classificação ("dados insuficientes") |

**Exclusão preserva histórico:** deletar produto usa `ON DELETE SET NULL` em `eventos.produto_id`. As vendas passadas continuam contando no Painel — senão seu faturamento histórico muda quando você limpa a lista.

### 7.3 🤖 Agente IA Autônomo & Semi-Autônomo

**Provedores configuráveis em Configurações:**

| Provedor | Configuração | Modelo Sugerido |
|---|---|---|
| 🦙 Ollama (Local) | URL base + modelo — SEM chave | llama3.3 |
| ⚡ Groq | Chave API (gsk_...) | llama-3.3-70b-versatile |
| 💎 Google Gemini | Chave API | gemini-2.0-flash |
| ☁️ Cloudflare AI | ID Conta + Token | Llama 3.1 8B |
| 🔄 OpenRouter | Chave API | Llama 3.3 70B |
| 🔮 DeepSeek | Chave API | deepseek-chat |

**Recursos:**

- Varredura programada (pg_cron, seção 3.5) → foco nas categorias de `config_agente.categorias`
- Pontuação de Vencedor 0–100 → **seção 8**
- **Modos de operação:**
  - ⚪ **Desligado**
  - 🟢 **Semi-Autônomo (PADRÃO):** pontuação ≥ `pontuacao_propor` (75) → PROPÕE com relatório completo → Aprovar / Rejeitar / Ver Análise
  - 🔵 **Autônomo Total:** pontuação ≥ `pontuacao_agir` (85) → se afilia sozinho → cadastra → notifica com explicação detalhada
- **Monitoramento contínuo:** queda de desempenho → avisa; link quebrado → alerta; reembolso → notifica + calcula impacto financeiro
- **Failover automático** entre provedores (seção 3.5)
- **Limites configuráveis:** comissão mínima, valor máximo, horário de operação, máx. produtos/dia

**Travas de segurança do modo autônomo** (novo — o modo autônomo gasta reputação e cadastra sozinho):

1. Respeitar `max_produtos_dia` contando as ações das últimas 24h em `log_agente`.
2. Agir somente entre `horario_inicio` e `horario_fim` (fuso de São Paulo).
3. **Nunca agir sozinho** com `dados_incompletos = true` ou `confianca = 'baixa'` — nesse caso rebaixa para proposta, mesmo com nota ≥85.
4. Nunca cadastrar produto já existente (`UNIQUE (usuario_id, plataforma_id, id_externo)`).
5. Toda ação autônoma gera registro em `log_agente` **e** notificação. Nada acontece em silêncio.

### 7.4 ⚙️ Configurações Completas

- **Provedores de IA:** inserir chaves → botão **TESTAR CONEXÃO** → valida na hora ✅/❌ com mensagem clara → Salvar. Chave vai para o Vault, nunca para o banco em texto plano.
- **Configurações do Agente:** modo, limiares, comissão mínima, valor máximo, frequência, horário, limite diário, categorias
- **Contas de Plataformas:** conectar/desconectar tokens — **confirmação obrigatória ao desconectar**
- **Custos:** cadastrar/editar/excluir custos (alimenta o Lucro Líquido)
- **Conta:** alterar senha, preferências de notificação, exportar dados, excluir conta
- **Segurança:** ver seção 6

### 7.5 🔔 Notificações

- ✅ Venda concluída → produto, valor, comissão, plataforma
- ⚠️ Reembolso → impacto financeiro: `−valor_comissao` e o novo Lucro Líquido do dia
- 🔗 Link com problema → ação sugerida
- 🤖 Agente agiu → detalhe da decisão (link para o relatório)
- Resumo consolidado — não encher de notificações repetidas

**Regra de consolidação** (a V1 pedia sem definir como): antes de inserir, calcule `chave_agrupamento` = `tipo + produto_id + data`. Se já existir não lida com a mesma chave nas últimas 6h, **atualize** a existente ("3 vendas hoje — R$ 84,20 em comissão") em vez de criar outra.

---

## 8. MOTOR DE PONTUAÇÃO — ESPECIFICAÇÃO

> Esta seção é inteiramente nova. A V1 definia os pesos, mas não de onde vinham os números — o que faria a nota virar chute do modelo.

### 8.1 Regra fundamental

**A pontuação é aritmética determinística em TypeScript (`lib/ia/analisador.ts`). O LLM NÃO calcula a nota.**

O LLM entra em apenas dois pontos:
1. Estimar `tendencia` e `sazonalidade` quando não há dado numérico (devolvendo 0–100 + justificativa).
2. Escrever o relatório em português (seção 8.5).

Motivo: se o modelo devolver o número, dois produtos idênticos recebem notas diferentes e a decisão fica irreprodutível.

### 8.2 Filtros eliminatórios (antes de pontuar)

Reprovado em qualquer um → descarta sem pontuar e registra o motivo em `log_agente`:

- `comissao_percent < config.comissao_minima`
- `valor > config.valor_maximo`
- Produto já cadastrado para o usuário
- Link original inválido (não responde 200)
- Avaliação < 3,0 estrelas (com ≥ 10 avaliações)
- Categoria fora de `config.categorias`

### 8.3 Os 6 critérios — input, fonte e normalização

Cada critério gera um subscore **0–100**. Nota final = soma ponderada.

**1. Margem de comissão — peso 30%**
- Input: `comissao_percent`; média da categoria quando disponível
- Com média: `50 + ((comissao − media) / media) × 50`, limitado a 0–100
- Sem média, tabela fixa:

| Comissão | Subscore |
|---|---|
| < 5% | 0 |
| 5–8% | 30 |
| 8–12% | 55 |
| 12–18% | 75 |
| 18–25% | 90 |
| > 25% | 100 |

**2. Giro / velocidade de venda — peso 25%**
- Input: unidades vendidas nos últimos 30 dias (API da plataforma)

| Vendas/30d | Subscore |
|---|---|
| 0 | 0 |
| 1–10 | 25 |
| 11–50 | 45 |
| 51–200 | 65 |
| 201–1000 | 85 |
| > 1000 | 100 |

**3. Avaliação do produto — peso 15%**
- Input: nota (0–5) + quantidade de avaliações
- `((nota − 3) / 2) × 100`, limitado a 0–100
- Menos de 20 avaliações → multiplicar por **0,6** (amostra fraca)
- Zero avaliação → subscore `null` (ver 8.4)

**4. Tendência de crescimento — peso 15%**
- Input: variação de vendas dos últimos 7 dias vs. 7 dias anteriores
- `−50%` → 0 | `0%` → 50 | `+100%` → 100 (linear, limitado)
- Sem histórico → LLM estima e a proposta recebe `confianca = 'baixa'`

**5. Competitividade — peso 10%**
- Input: preço do produto vs. mediana de ofertas equivalentes; nº de concorrentes
- Mais barato que a mediana → sobe; muitos vendedores idênticos → desce
- `50 + (mediana − preco)/mediana × 50`, e −10 pontos se houver mais de 20 ofertas iguais

**6. Sazonalidade — peso 5%**
- Input: mês atual vs. calendário de sazonalidade por categoria (tabela estática em `lib/constantes.ts` — ex.: protetor solar sobe out–fev; perfumaria sobe mai (Dia das Mães) e nov–dez)
- Em alta = 100 | neutro = 50 | em baixa = 20

### 8.4 Dado faltando — nunca chutar

Se um critério não tiver input, o subscore é `null` e **o peso é redistribuído proporcionalmente** entre os critérios disponíveis. A proposta recebe:

- `dados_incompletos = true`
- `confianca` = `alta` (todos os 6 presentes) | `media` (4–5) | `baixa` (≤3)

E o relatório declara, com todas as letras, qual dado faltou. **Proibido preencher lacuna com número inventado.**

Guardar sempre `subpontuacoes` (JSONB) com cada subscore e o input usado — é o que te permite auditar por que o agente decidiu aquilo.

### 8.5 Relatório de decisão — SEMPRE explica

Gerado pelo LLM em PT-BR, a partir das `subpontuacoes` já calculadas, contendo obrigatoriamente:

1. **Por que este produto foi escolhido** — os 2–3 critérios que mais pesaram
2. **Margem vs. média da categoria** — número contra número
3. **Tendência detectada** — com o dado que a sustenta
4. **Previsão de giro estimada** — faixa (ex.: "8 a 15 vendas/mês"), nunca número exato falsamente preciso
5. **Riscos e ressalvas** — inclusive dados faltantes e nível de confiança

Linguagem para quem não é dev. Sem jargão.

---

## 9. ✅ GARANTIA DE INTERAÇÃO — NENHUM BOTÃO FALHA

| Ação | Comportamento Obrigatório |
|---|---|
| Clicar botão | Feedback visual imediato (estado carregando, botão desabilitado) |
| Salvar | Mensagem de sucesso ✅ + atualiza tela |
| Excluir | Modal: "Tem certeza? Esta ação não pode ser desfeita." → [Sim, Excluir] / [Cancelar] |
| Copiar link | "Copiado para a área de transferência!" |
| Testar conexão | Resposta na hora: ✅ Funcionando / ❌ Erro: mensagem clara |
| Enviar formulário | Valida antes (Zod) → aponta os campos inválidos |
| Erro de sistema | Mensagem amigável em PT-BR + botão "Tentar Novamente" |
| Sincronizar | Estado de carregamento → "Concluído — X registros atualizados" |
| Desconectar plataforma | Confirmação antes |
| Aprovar/Rejeitar proposta | Carregando → resultado → lista atualiza sozinha |

**Nunca** deixar `onClick` vazio, `TODO`, `alert()` ou `console.log` como feedback ao usuário. Botão sem função implementada **não deve existir na tela**.

---

## 10. 🚀 FASES DE ENTREGA — IMPLEMENTAR NESTA ORDEM

> Reordenado frente à V1: o redirect de link curto e o seed entram na Fase 1, senão o Painel de métricas nasce sempre zerado e você não consegue testar nada.

### FASE 1 — MVP FUNCIONAL

1. Estrutura do projeto + todas as configurações (Vite, TS, Tailwind, shadcn/ui, Sonner)
2. Migrations `001` a `003` aplicadas — **incluindo RLS**
3. Autenticação: Login, Cadastro, Recuperar Senha, rota protegida
4. Edge Function `redirect-link` + geração de código curto
5. Tela Painel com os 7 períodos e as 5 métricas (fórmulas da 7.1)
6. CRUD Produtos — cadastro, edição, exclusão COM CONFIRMAÇÃO, copiar link
7. `supabase/seed.sql` com ~15 produtos e ~300 eventos de 30 dias, para o Painel ter dado real de teste
8. Layout responsivo — funcionar perfeitamente no CELULAR
9. TODOS os botões respondendo com feedback

**Critério de Aceite — Fase 1**
- [ ] Cadastro → e-mail de confirmação → login → logout, todos funcionando
- [ ] Usuário B **não** consegue ler dado do usuário A (teste de RLS da seção 5.3)
- [ ] Acessar `/r/{codigo}` redireciona e incrementa cliques no Painel
- [ ] Trocar o período muda os números; "Buscar dia específico" funciona
- [ ] Excluir produto exige confirmação e o histórico de vendas do Painel não muda
- [ ] Copiar link mostra toast "Copiado!"
- [ ] Zero `any` no código; `npm run build` sem erro nem warning de tipo
- [ ] Testado em tela de 360px de largura, sem scroll horizontal

### FASE 2 — CONFIGURAÇÕES DE IA

1. Tela Provedores de IA — todos os 6 listados
2. Inserir chaves + botão **TESTAR CONEXÃO** em cada um (Edge Function `ia-testar`)
3. Salvar no Vault (nunca em texto plano) + exibição mascarada
4. **Failover** automático entre provedores por `ordem_fallback`, com backoff (3.5)
5. Configurações do Agente — todos os limites ajustáveis
6. `log_ia` gravando toda chamada

**Critério de Aceite — Fase 2**
- [ ] Chave errada → ❌ com mensagem entendível ("Chave inválida — verifique se começa com gsk_")
- [ ] Chave certa → ✅ em menos de 10s
- [ ] Nenhuma chave aparece na resposta de rede (conferir no DevTools) nem no banco
- [ ] Desligando o 1º provedor, a chamada cai sozinha no 2º e o `log_ia` registra os dois
- [ ] Todos falhando → notificação de sistema, sem tela branca
- [ ] `pontuacao_agir` não pode ser salvo abaixo de `pontuacao_propor`

### FASE 3 — AGENTE INTELIGENTE

1. Motor de pontuação determinístico (seção 8) — **com testes unitários dos 6 critérios**
2. Filtros eliminatórios (8.2)
3. Tela de Propostas — Aprovar / Rejeitar / Ver Análise
4. Modo Autônomo — cadastra sozinho se ≥ `pontuacao_agir`, com as 5 travas da 7.3
5. Relatório de decisão completo (8.5)
6. Notificações das ações do agente + `log_agente`
7. Varredura agendada por pg_cron + botão "Rodar Agora"

**Critério de Aceite — Fase 3**
- [ ] Mesmo produto pontuado 2x → **nota idêntica** (prova que é determinístico)
- [ ] Teste unitário cobrindo os 6 critérios, incluindo input faltando
- [ ] Produto com dado faltando → nunca é afiliado automaticamente, vira proposta
- [ ] Aprovar proposta cria o produto com `origem='agente_proposto'` e link curto
- [ ] `max_produtos_dia` respeitado; fora do horário o agente não age
- [ ] Todo relatório traz os 5 itens da 8.5, em português
- [ ] `subpontuacoes` salvo e visível em "Ver Análise"

### FASE 4 — PLATAFORMAS E POLIMENTO

1. **Antes de codar: validar as APIs — seção 12**
2. Adaptadores por plataforma em `lib/plataformas/` com interface comum
3. Sincronização automática + botão "Sincronizar Agora" — **idempotente** via `id_externo`
4. Detecção de vendas e reembolsos + impacto financeiro
5. Monitoramento de link quebrado e queda de desempenho
6. Relatórios e exportação (CSV/JSON)
7. LGPD: Termos, Política de Privacidade, exportar dados, excluir conta

**Critério de Aceite — Fase 4**
- [ ] Sincronizar 2x seguidas **não** duplica venda nenhuma (teste explícito)
- [ ] Reembolso reduz Comissão Total e Lucro Líquido, e notifica com o valor
- [ ] Plataforma sem API disponível aparece na tela como "Manual" e explica o motivo — sem endpoint inventado
- [ ] Exportação abre corretamente em planilha
- [ ] Excluir conta remove tudo, inclusive segredos do Vault
- [ ] Rate limit (429) tratado com backoff, sem quebrar a tela

---

## 11. 📌 REGRAS DE OURO NÃO NEGOCIÁVEIS

1. **Responsividade PRIMEIRO** — o usuário desenvolve e usa pelo CELULAR. Referência: 360px. Nada de scroll horizontal, alvo de toque mínimo 44px.
2. **NENHUM botão sem função** — se aparece → faz algo → dá retorno visual.
3. **Exclusão SEMPRE COM CONFIRMAÇÃO** — nada some sem "Tem certeza?". *(Corrigido: na V1 este título dizia o oposto do texto.)*
4. **Chaves e tokens NUNCA em texto plano** — sempre no Vault, sempre atrás de Edge Function. Nunca em `VITE_*`.
5. **RLS ligado em toda tabela** — tabela nova sem policy é falha de segurança, não pendência.
6. **Mensagens em PORTUGUÊS BRASILEIRO** — sistema inteiro, inclusive erros técnicos traduzidos.
7. **Código limpo e comentado** — para quem não é dev entender.
8. **Arquivos pequenos e modulares** — máximo 250 linhas, facilita editar pelo celular.
9. **`any` é proibido** em TypeScript.
10. **Nunca inventar endpoint de API externa** — sem confirmação na documentação oficial, pergunte.
11. **Nunca chutar número** — dado faltando é declarado, não preenchido (seção 8.4).
12. **Uma fase por vez** — com critério de aceite verificado item por item.
13. **Sempre explicar o que fez** — nos comentários e no README.

---

## 12. ⚠️ RISCOS A VALIDAR ANTES DA FASE 4

**O modo "se afilia sozinho" pode não ser tecnicamente possível em todas as plataformas.** Programas de afiliado costumam expor *geração de link* e *relatórios*, e o acesso normalmente exige conta de afiliado já aprovada. Não há garantia de que exista endpoint de "afiliar-se a este produto".

**Antes de escrever a primeira linha da Fase 4**, confirme na documentação **oficial** de cada programa e preencha esta tabela no README:

| Plataforma | Busca de produtos? | Geração de link? | Relatório de vendas? | Aprovação exigida | Status |
|---|---|---|---|---|---|
| Shopee Affiliate | ? | ? | ? | ? | a validar |
| Mercado Livre | ? | ? | ? | ? | a validar |
| Magalu | ? | ? | ? | ? | a validar |
| Aliexpress | ? | ? | ? | ? | a validar |

**Regra de degradação:** se uma plataforma não permitir afiliação programática, o agente **propõe** o produto e o usuário gera o link manualmente e cola — a conexão aparece como "Manual" na tela, com o motivo explicado. **Jamais implementar endpoint suposto.**

Atenção também a: limites de requisição, se termos de uso permitem varredura automatizada, e prazo de confirmação de comissão (venda pode ser estornada semanas depois — por isso `reembolso` é um tipo de evento de primeira classe).

---

## 13. DECISÕES EM ABERTO

Perguntar ao dono do projeto quando chegar no ponto:

1. **Domínio próprio para o link curto?** Link curto em domínio genérico converte pior. Definir antes da Fase 1 (afeta `link_curto`).
2. **Sistema multiusuário ou de uso pessoal?** O schema já é multiusuário; se for pessoal, simplifica onboarding.
3. **Provedor de IA padrão inicial?** Groq tem free tier generoso e é o melhor ponto de partida.
4. **Notificação fora do app** (e-mail/WhatsApp/Telegram) ou só dentro do sistema? A V1 previa só interna.
5. **Meta de custo mensal de IA?** Define se o agente pode usar modelo grande ou fica no pequeno.

---

## ✅ ESTA É A FONTE DA VERDADE

Seguir este documento fielmente. Qualquer dúvida sobre o que fazer → consultar aqui primeiro.

**Iniciar pela FASE 1**, entregar os arquivos, marcar o *Critério de Aceite* item por item e avisar quando estiver pronto para testar.

---

### Registro de alterações — V1 → V2

| # | Mudança | Motivo |
|---|---|---|
| 1 | Camada de Edge Functions + Vault (seções 2.1, 3, 6) | Sem servidor era **impossível** cumprir "chaves criptografadas" e chamar IA com segurança |
| 2 | RLS completo (5.3) | V1 não tinha nenhuma policy — com `anon key`, todo usuário leria os dados dos outros |
| 3 | `contas_plataforma` separada de `plataformas` | Na V1 o token de afiliado ficava na tabela global = compartilhado entre usuários |
| 4 | Spec do link curto + redirect (3.3) | "Link gerado automaticamente" não tinha endpoint; métrica "Cliques" nunca sairia de zero |
| 5 | Seção 8 — motor de pontuação | V1 dava os pesos mas não os inputs nem a normalização; a nota viraria chute do LLM |
| 6 | Pontuação determinística em código, LLM só explica | Garante que o mesmo produto receba sempre a mesma nota |
| 7 | Regra 8.4 — dado faltando não é chutado | Evita decisão de afiliação baseada em número inventado |
| 8 | `id_externo UNIQUE` em `eventos` | Sem chave de dedup, cada re-sincronização duplicaria vendas e inflaria as métricas |
| 9 | Tabela `custos` + fórmula do Lucro Líquido (7.1) | V1 listava a métrica sem definir o que era |
| 10 | `TIMESTAMPTZ` + fuso fixo São Paulo (3.4) | "Hoje"/"Ontem" divergiriam do relatório da plataforma |
| 11 | Índices (5.2) | `eventos` cresce rápido com cliques |
| 12 | `CHECK` em todos os enums de status | V1 usava `TEXT` livre; valores divergentes quebram filtro |
| 13 | pg_cron (3.5, 5.4) | "Varredura programada" não tinha agendador — frontend não roda tarefa agendada |
| 14 | Backoff + failover especificado (3.5) | V1 citava fallback sem definir retry nem tratamento de 429 |
| 15 | 5 travas do modo autônomo (7.3) | Modo autônomo agia sem limite de segurança além da nota |
| 16 | Regra de classificação por desempenho (7.2) | V1 pedia "classificação automática" sem definir os limites |
| 17 | Consolidação de notificações (7.5) | V1 pedia "não repetir" sem definir como |
| 18 | Telas de Cadastro e Recuperar Senha | V1 só tinha Login — não havia como criar conta |
| 19 | Critério de Aceite por fase (10) | V1 não definia o que caracteriza "pronto para testar" |
| 20 | `supabase/migrations/` no lugar de `prisma/schema.sql` | Prisma não está na stack e confunde o agente |
| 21 | `seed.sql` movido para a Fase 1 | Painel nasceria zerado e impossível de testar |
| 22 | Seção 12 — validar APIs antes da Fase 4 | "Se afiliar sozinho" pode não existir; risco de endpoint inventado |
| 23 | Regra de Ouro #3 corrigida | Na V1 o título dizia "Exclusão SEM confirmação", contradizendo o texto |
| 24 | "Fallover" → failover | Erro de grafia que confunde o agente |
| 25 | Exclusão de produto preserva eventos | Deletar produto alteraria seu faturamento histórico |
| 26 | `ip_hash` em vez de IP puro | LGPD |
| 27 | Limite de 250 linhas por arquivo | Desenvolvimento pelo celular |
| 28 | Neon removido | Supabase + Edge Functions já cobre; seria dependência sem ganho |
