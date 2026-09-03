 INSTRUÇÕES COMPLETAS DE DESENVOLVIMENTO
## Projeto: Afiliados Inteligentes — Sistema de Gestão com Agente IA Autônomo

> **Repositório:** github.com/jadiel054/afiliados-inteligentes
> **Plataforma:** Apenas celular durante desenvolvimento — mantenha arquivos pequenos e bem organizados
> **Regra #1:** TODOS os botões DEVEM funcionar — sem exceção. Ação → Feedback visual imediato. Excluir SEMPRE pede confirmação.

---

## 🎯 OBJETIVO DO SISTEMA
Centralizar, monitorar e automatizar a gestão de produtos, links, cliques, vendas e comissões de múltiplas plataformas de afiliados (Shopee, Mercado Livre, Magalu, Aliexpress) em um único painel, com Agente IA que **busca → analisa → decide → se afilia → notifica** de forma autônoma ou semi-autônoma.

---

## 🧱 PILHAS TECNOLÓGICAS DEFINIDAS
| Camada | Tecnologia |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Estilo | Tailwind CSS + shadcn/ui (componentes padronizados) |
| Ícones | Lucide React |
| Gráficos | Chart.js + react-chartjs-2 |
| Banco + Auth | Supabase (PostgreSQL) |
| Hospedagem | Vercel (deploy automático) |
| IA | Groq, Ollama, Cloudflare Workers AI, OpenRouter, Gemini, DeepSeek — TODOS configuráveis |
| Notificações | Sonner (toast de feedback) |
| Formulários | React Hook Form + Zod |

---

## 📁 ESTRUTURA OBRIGATÓRIA DE PASTAS
 
 
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
│   │   ├── supabase.ts      # Cliente + inicialização
│   │   ├── ia/
│   │   │   ├── provedores.ts # Todos os provedores + teste de conexão
│   │   │   ├── analisador.ts # Lógica de pontuação de produtos
│   │   │   └── decisor.ts    # Lógica de aprovação/autonomia
│   │   └── plataformas/      # Shopee, ML, Magalu, Aliexpress — integração API
│   ├── types/
│   │   └── index.ts          # Tipos TypeScript — NÃO usar  any 
│   ├── pages/
│   │   ├── Login.tsx
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
├── prisma/schema.sql         # Modelo completo do banco
├── .env.example
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── postcss.config.js
└── README.md
---

## 🧠 FUNCIONALIDADES DETALHADAS — IMPLEMENTAR EXATAMENTE

### 1. 📊 Painel de Visão Geral
- Períodos fixos: **Hoje, Ontem, Últimos 3, 5, 7, 15 dias, Último Mês** + **Buscar dia específico**
- Métricas: Cliques, Vendas, Valor Bruto, Comissão Total, Lucro Líquido
- Origem por plataforma: gráfico de distribuição — Shopee / ML / Magalu / Aliexpress
- Gráficos: Evolução de vendas, produtos mais clicados vs mais vendidos
- Estados: Sem dados → mensagem amigável; Carregando → indicador; Erro → explicação + botão **Tentar Novamente**

### 2. 📦 Gestão de Produtos
- Cadastro: Nome, Categoria, Plataforma, Valor, Comissão %, Link Original → Link Curto GERADO AUTOMATICAMENTE
- Ações: ✏️ Editar | 🗑️ Excluir → **CONFIRMAÇÃO OBRIGATÓRIA** ("Tem certeza? Sim / Não") | 📋 Copiar Link → feedback "Copiado!"
- Filtros: Por plataforma, categoria, status, período
- Classificação automática por desempenho

### 3. 🤖 Agente IA Autônomo & Semi-Autônomo

**Provedores de IA configuráveis em Configurações:**
| Provedor | Configuração | Modelo Sugerido |
|---|---|---|
| 🦙 Ollama (Local) | URL base + modelo — SEM chave | llama3.3 |
| ⚡ Groq | Chave API (gsk_...) | llama-3.3-70b-versatile |
| 💎 Google Gemini | Chave API | gemini-2.0-flash |
| ☁️ Cloudflare AI | ID Conta + Token | Llama 3.1 8B |
| 🔄 OpenRouter | Chave API | Llama 3.3 70B |
| 🔮 DeepSeek | Chave API | deepseek-chat |

**Recursos do Agente:**
- Varredura programada nas plataformas → foco em **Beleza, Cuidados Pessoais, Maquiagem, Pele, Cabelo, Perfumaria**
- **Pontuação de Vencedor (0–100):**
  - Margem de comissão — 30%
  - Giro / Velocidade de venda — 25%
  - Avaliação do produto — 15%
  - Tendência de crescimento — 15%
  - Competitividade — 10%
  - Sazonalidade — 5%
- **Modos de Operação:**
  - 🟢 **Semi-Autônomo (PADRÃO):** Pontuação ≥75 → PROPÕE com relatório completo → Aprovar / Rejeitar / Ver Análise
  - 🔵 **Autônomo Total:** Pontuação ≥85 → SE AFILIA SOZINHO → cadastra → notifica com explicação detalhada
- **Relatório de Decisão SEMPRE explica:**
  - Por que este produto foi escolhido
  - Margem vs média da categoria
  - Tendência detectada
  - Previsão de giro estimada
- **Monitoramento contínuo:** Queda de desempenho → avisa; Link quebrado → alerta; Reembolso → notifica + calcula impacto financeiro
- **Fallback automático:** Se um provedor falhar → tenta o próximo ativo sem parar
- **Limites configuráveis:** Comissão mínima, valor máximo, horário de operação, máx produtos/dia

### 4. ⚙️ Configurações Completas
- **Provedores de IA:** Inserir chaves → Botão **TESTAR CONEXÃO** → valida na hora ✅/❌ → Salvar
- **Configurações do Agente:** Modo, pontuações limiares, comissão mínima, frequência, horário, limite diário
- **Contas de Plataformas:** Conectar/Desconectar tokens — confirmação em desconectar
- **Conta:** Alterar senha, notificações, exportar dados, excluir conta
- **Segurança:** Tokens e chaves CRIPTOGRAFADAS — nunca armazenar em texto plano

### 5. 🔔 Notificações
- ✅ Venda concluída → produto, valor, comissão, plataforma
- ⚠️ Reembolso → impacto financeiro
- 🔗 Link com problema → ação sugerida
- 🤖 Agente agiu → detalhe da decisão
- Resumo consolidado — não encher de notificações repetidas

---

## ✅ GARANTIA DE INTERAÇÃO — NENHUM BOTÃO FALHA

| Ação | Comportamento Obrigatório |
|---|---|
| Clicar botão | Feedback visual imediato (estado carregando) |
| Salvar | Mensagem de sucesso ✅ + atualiza tela |
| Excluir | Modal: "Tem certeza? Esta ação não pode ser desfeita." → [Sim, Excluir] / [Cancelar] |
| Copiar link | "Copiado para a área de transferência!" |
| Testar conexão | Resposta na hora: ✅ Funcionando / ❌ Erro: mensagem clara |
| Enviar formulário | Valida antes → avisa campos inválidos |
| Erro de sistema | Mensagem amigável + botão "Tentar Novamente" |
| Sincronizar | Estado de carregamento → "Concluído — X registros atualizados" |

---

## 🗄️ MODELO DE DADOS — SUPABASE

```sql
-- Tabela: plataformas
CREATE TABLE plataformas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL, -- shopee, mercado-livre, magalu, aliexpress
  nome TEXT NOT NULL,
  api_token_cript TEXT,
  config JSONB,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

-- Tabela: produtos
CREATE TABLE produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id),
  nome TEXT NOT NULL,
  categoria TEXT NOT NULL,
  plataforma_id UUID REFERENCES plataformas(id),
  valor NUMERIC(10,2) NOT NULL,
  comissao_percent NUMERIC(5,2) NOT NULL,
  link_original TEXT NOT NULL,
  link_curto TEXT UNIQUE NOT NULL,
  imagem_url TEXT,
  status TEXT DEFAULT 'ativo',
  pontuacao_agente NUMERIC(5,2),
  razao_escolha TEXT,
  data_cadastro TIMESTAMP DEFAULT now()
);

-- Tabela: eventos (cliques, vendas, reembolsos, pagamentos)
CREATE TABLE eventos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id UUID REFERENCES produtos(id),
  tipo TEXT NOT NULL, -- clique, venda, reembolso, pagamento
  valor_bruto NUMERIC(10,2) DEFAULT 0,
  valor_comissao NUMERIC(10,2) DEFAULT 0,
  dados_plataforma JSONB,
  created_at TIMESTAMP DEFAULT now()
);

-- Tabela: provedores_ia
CREATE TABLE provedores_ia (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id),
  nome TEXT NOT NULL,
  provedor TEXT NOT NULL, -- groq, ollama, gemini, etc
  api_key_cript TEXT,
  url_base TEXT,
  modelo TEXT NOT NULL,
  ativo BOOLEAN DEFAULT false,
  ordem_fallback INT DEFAULT 1
);

-- Tabela: config_agente
CREATE TABLE config_agente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id) UNIQUE,
  modo TEXT DEFAULT 'semi_autonomo',
  pontuacao_propor INT DEFAULT 75,
  pontuacao_agir INT DEFAULT 85,
  comissao_minima NUMERIC(5,2) DEFAULT 5,
  rodar_a_cada_horas INT DEFAULT 6,
  max_produtos_dia INT DEFAULT 10,
  horario_inicio INT DEFAULT 8,
  horario_fim INT DEFAULT 22
);

-- Tabela: propostas_agente
CREATE TABLE propostas_agente (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id),
  dados_produto JSONB NOT NULL,
  pontuacao NUMERIC(5,2) NOT NULL,
  razao TEXT[] NOT NULL,
  status TEXT DEFAULT 'pendente', -- pendente, aprovado, rejeitado, automatico
  data TIMESTAMP DEFAULT now()
);

-- Tabela: notificacoes
CREATE TABLE notificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID REFERENCES auth.users(id),
  tipo TEXT NOT NULL,
  titulo TEXT NOT NULL,
  mensagem TEXT NOT NULL,
  lida BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);
 
 
 
 
🚀 FASES DE ENTREGA — IMPLEMENTAR NESTA ORDEM
 
FASE 1 — MVP FUNCIONAL
 
Estrutura do projeto + todas as configurações
Autenticação (Login)
Tela Painel com períodos e métricas
CRUD Produtos — cadastro, edição, exclusão COM CONFIRMAÇÃO
Layout responsivo — funcionar perfeitamente no CELULAR
TODOS os botões respondendo com feedback
 
FASE 2 — CONFIGURAÇÕES DE IA
 
Tela Provedores de IA — todos listados
Inserir chaves + Botão TESTAR CONEXÃO em cada
Salvar criptografado no banco
Fallover automático entre provedores
Configurações do Agente — todos os limites ajustáveis
 
FASE 3 — AGENTE INTELIGENTE
 
Motor de pontuação de produtos
Tela de Propostas — Aprovar / Rejeitar / Ver Análise
Modo Autônomo — quando ativado, cadastra sozinho se ≥85
Relatório de decisão completo
Notificações de ações do agente
 
FASE 4 — PLATAFORMAS E POLIMENTO
 
Integração com APIs: Shopee, Mercado Livre, Magalu, Aliexpress
Sincronização automática + botão Sincronizar Agora
Detecção de vendas e reembolsos
Relatórios e exportação
LGPD / Termos / Exclusão de conta
 
 
 
📌 REGRAS DE OURO NÃO NEGOCIÁVEIS
 
1. Responsividade PRIMEIRO: O usuário desenvolve e usa pelo CELULAR — tudo deve funcionar perfeitamente em telas pequenas
2. NENHUM botão sem função: Se aparece → faz algo → dá retorno visual
3. Exclusão SEM confirmação: Nada some sem "Tem certeza?"
4. Chaves e tokens NUNCA em texto plano: Sempre criptografados
5. Mensagens em PORTUGUÊS BRASILEIRO — sistema inteiro
6. Código limpo e comentado — para quem não é dev entender
7. Arquivos pequenos e modulares — facilita editar pelo celular
8. Sempre que possível: explicar o que fez nos comentários ou no README
 
 
 
✅ ESTA É A FONTE DA VERDADE — Seguir este documento fielmente. Qualquer dúvida sobre o que fazer → consultar aqui primeiro.
 
Iniciar pela FASE 1, enviar arquivos, marcar no que foi concluído e avisar quando estiver pronto para testar.
