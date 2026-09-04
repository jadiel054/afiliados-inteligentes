# Afiliados Inteligentes - Sistema de Gestão com Agente IA Autônomo

## 📋 Visão Geral

**Versão:** 2.0 - FASE 1 (MVP Funcional) ✅

Sistema completo para centralizar, monitorar e automatizar a gestão de produtos, links, cliques, vendas e comissões de múltiplas plataformas de afiliados (Shopee, Mercado Livre, Magalu, AliExpress) em um único painel.

O **Agente IA** busca → analisa → decide → se afilia → notifica de forma autônoma ou semi-autônoma, com foco no nicho de **Beleza, Cuidados Pessoais, Maquiagem, Pele, Cabelo e Perfumaria**.

---

## 🚀 Tecnologias

| Camada | Tecnologia |
|---|---|
| **Frontend** | React 18 + TypeScript + Vite |
| **Estilo** | Tailwind CSS + shadcn/ui |
| **Ícones** | Lucide React |
| **Gráficos** | Chart.js + react-chartjs-2 |
| **Banco de Dados** | Supabase (PostgreSQL) |
| **Backend** | Supabase Edge Functions (Deno) |
| **Autenticação** | Supabase Auth |
| **Segredos** | Supabase Vault |
| **Agendamento** | pg_cron (Supabase) |
| **IA** | Groq, Ollama, Cloudflare, OpenRouter, Gemini, DeepSeek |
| **Notificações** | Sonner (toast) |
| **Formulários** | React Hook Form + Zod |

---

## 📁 Estrutura do Projeto

```
afiliados-inteligentes/
├── src/
│   ├── components/
│   │   ├── ui/              # Componentes shadcn/ui
│   │   ├── Layout/          # Layout, menu, navegação
│   │   ├── Painel/          # Componentes do painel
│   │   ├── Produtos/        # Componentes de produtos
│   │   ├── Agente/          # Componentes do agente
│   │   ├── Plataformas/     # Componentes de plataformas
│   │   └── Configuracoes/   # Componentes de configurações
│   ├── lib/
│   │   ├── supabase.ts      # Cliente Supabase
│   │   ├── constantes.ts    # Constantes e funções utilitárias
│   │   └── utils.ts         # Funções utilitárias
│   ├── types/              # Definições de tipos TypeScript
│   ├── pages/              # Páginas do sistema
│   ├── context/            # Contextos React
│   └── App.tsx             # Componente principal
├── supabase/
│   ├── migrations/         # Migrações do banco
│   │   ├── 001_tabelas.sql  # Criação das tabelas
│   │   ├── 002_rls.sql      # Row Level Security
│   │   ├── 003_indices.sql  # Índices
│   │   └── 004_cron.sql     # Agendamento
│   ├── functions/          # Edge Functions
│   │   └── redirect-link/   # Redirect de links curtos
│   └── seed.sql            # Dados de teste
├── public/                # Arquivos estáticos
├── package.json            # Dependências
├── tsconfig.json           # Configuração TypeScript
├── vite.config.ts          # Configuração Vite
├── tailwind.config.js      # Configuração Tailwind
└── README.md               # Este arquivo
```

---

## 🛠 Configuração Inicial

### 1. Clonar o Repositório

```bash
git clone https://github.com/jadiel054/afiliados-inteligentes.git
cd afiliados-inteligentes
```

### 2. Instalar Dependências

```bash
npm install
```

### 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 4. Configurar Supabase

1. Crie um projeto no [Supabase](https://supabase.com/)
2. Execute as migrações:
   ```bash
   # Aplicar migrações via Supabase Dashboard ou CLI
   supabase db push
   ```
3. Execute o seed para dados de teste:
   ```sql
   -- Execute o conteúdo de supabase/seed.sql no SQL Editor do Supabase
   ```

### 5. Deploy das Edge Functions

```bash
# Instalar Supabase CLI
npm install -g supabase

# Login
supabase login

# Link com o projeto
supabase link --project-ref your-project-ref

# Deploy das functions
supabase functions deploy redirect-link
```

---

## ✅ FASE 1 - MVP FUNCIONAL (CONCLUÍDA)

### 📋 Critério de Aceite - Fase 1

- ✅ **Cadastro → e-mail de confirmação → login → logout**, todos funcionando
- ✅ **Usuário B não consegue ler dado do usuário A** (teste de RLS)
- ✅ **Acessar `/r/{codigo}` redireciona e incrementa cliques no Painel**
- ✅ **Trocar o período muda os números; "Buscar dia específico" funciona**
- ✅ **Excluir produto exige confirmação e o histórico de vendas do Painel não muda**
- ✅ **Copiar link mostra toast "Copiado!"**
- ✅ **Zero `any` no código; `npm run build` sem erro nem warning de tipo**
- ✅ **Testado em tela de 360px de largura, sem scroll horizontal**

### 🎯 Funcionalidades Implementadas

#### 1. Autenticação
- ✅ Login com e-mail e senha
- ✅ Cadastro de usuário
- ✅ Recuperação de senha
- ✅ Proteção de rotas
- ✅ Gerenciamento de session

#### 2. Painel de Controle
- ✅ Métricas: Cliques, Vendas, Valor Bruto, Comissão Total, Lucro Líquido
- ✅ Taxa de conversão
- ✅ 7 períodos: Hoje, Ontem, Últimos 3/5/7/15 dias, Último mês, Data específica
- ✅ Gráfico de pizza: Vendas por plataforma
- ✅ Gráfico de linha: Evolução de vendas
- ✅ Gráfico de barras: Cliques vs Vendas por produto
- ✅ Filtros por período

#### 3. Produtos
- ✅ CRUD completo (Criar, Ler, Atualizar, Deletar)
- ✅ Geração de link curto automático
- ✅ Copiar link para clipboard
- ✅ Exclusão com confirmação
- ✅ Classificação automática (campeão, promissor, estável, fraco)
- ✅ Filtros por plataforma, categoria, status
- ✅ Busca por nome

#### 4. Link Curto
- ✅ Edge Function `redirect-link` funcionando
- ✅ Geração de código único (nanoid)
- ✅ Gravação de evento de clique
- ✅ Deduplicação de cliques (mesmo IP + mesmo produto em 30 segundos)
- ✅ ip_hash com salt do Vault

#### 5. Layout Responsivo
- ✅ Funciona perfeitamente em celular (360px)
- ✅ Todos os botões com feedback visual
- ✅ Design limpo e intuitivo

---

## 🚀 Como Executar

### Desenvolvimento

```bash
npm run dev
```

Acesse: http://localhost:5173

### Produção

```bash
npm run build
npm run preview
```

---

## 📊 Banco de Dados

### Tabelas Principais

- **plataformas**: Catálogo de plataformas de afiliados
- **contas_plataforma**: Conexões de usuários com plataformas
- **produtos**: Produtos cadastrados
- **eventos**: Cliques, vendas, reembolsos, pagamentos
- **custos**: Custos para cálculo do lucro líquido
- **provedores_ia**: Configuração de provedores de IA
- **config_agente**: Configuração do agente
- **propostas_agente**: Propostas geradas pelo agente
- **notificacoes**: Notificações do sistema
- **log_agente**: Log de execuções do agente
- **log_ia**: Log de chamadas de IA

### Row Level Security (RLS)

Todas as tabelas com `usuario_id` têm RLS ativado:
- Usuários só veem seus próprios dados
- Ninguém pode acessar dados de outro usuário

---

## 🤖 Agente Inteligente

O agente inteligentes analisa produtos com base em:

1. **Margem de comissão** (30%)
2. **Giro/velocidade de venda** (25%)
3. **Avaliação do produto** (15%)
4. **Tendência de crescimento** (15%)
5. **Competitividade** (10%)
6. **Sazonalidade** (5%)

### Modos de Operação

- **Desligado**: Agente não faz nada
- **Semi-Autônomo**: Propõe produtos para aprovação
- **Autônomo Total**: Cadastra automaticamente

### Filtros Eliminatórios

- Comissão < mínima configurada
- Valor > máximo configurado
- Produto já cadastrado
- Link inválido
- Avaliação < 3.0 estrelas
- Categoria fora do foco

---

## 📡 APIs Externas (Fase 4)

Antes de implementar a Fase 4, validar as APIs:

| Plataforma | Busca de produtos | Geração de link | Relatório de vendas | Status |
|---|---|---|---|---|
| Shopee Affiliate | ❓ | ❓ | ❓ | A validar |
| Mercado Livre | ❓ | ❓ | ❓ | A validar |
| Magalu | ❓ | ❓ | ❓ | A validar |
| AliExpress | ❓ | ❓ | ❓ | A validar |

---

## 🎨 Componentes UI

- ✅ Botão com loading e ícones
- ✅ Input com validação
- ✅ Select customizado
- ✅ Card responsivo
- ✅ Tabela com paginação
- ✅ Dialog/Modal
- ✅ Badge
- ✅ Switch
- ✅ Toast (Sonner)

---

## 📝 Regras de Ouro

1. ✅ **Responsividade PRIMEIRO** - Funciona em 360px
2. ✅ **NENHUM botão sem função** - Todos têm feedback visual
3. ✅ **Exclusão SEMPRE COM CONFIRMAÇÃO**
4. ✅ **Chaves e tokens NUNCA em texto plano** - Sempre no Vault
5. ✅ **RLS ligado em toda tabela**
6. ✅ **Mensagens em PORTUGUÊS BRASILEIRO**
7. ✅ **Código limpo e comentado**
8. ✅ **Arquivos pequenos e modulares** (< 250 linhas)
9. ✅ **`any` é proibido** em TypeScript
10. ✅ **Nunca inventar endpoint de API externa**

---

## 🔧 Scripts Disponíveis

```bash
npm run dev          # Inicia servidor de desenvolvimento
npm run build        # Compila para produção
npm run lint         # Executa lint
npm run preview      # Preview da build
```

---

## 📄 Documentação

- [Instruções de Desenvolvimento](INSTRUCOES_DESENVOLVIMENTO.md) - **Fonte da Verdade**
- [Instruções V1 Original](docs/INSTRUCOES_V1_ORIGINAL.md)

---

## 🤝 Contribuindo

1. Leia as [Instruções de Desenvolvimento](INSTRUCOES_DESENVOLVIMENTO.md)
2. Siga o Critério de Aceite item por item
3. Não pule fases
4. Nunca invente endpoints de API externa
5. Mantenha o código limpo e bem documentado

---

## 📜 Licença

Este projeto é proprietário e confidencial. Todos os direitos reservados.

---

## 🆘 Suporte

Para dúvidas ou problemas, consulte as [Instruções de Desenvolvimento](INSTRUCOES_DESENVOLVIMENTO.md) ou abra uma issue no repositório.

---

**Status:** FASE 1 - MVP Funcional ✅ | **Próxima:** FASE 2 - Configurações de IA
