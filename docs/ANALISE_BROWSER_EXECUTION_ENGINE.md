# Análise da Arquitetura Browser/Execution Engine para Afiliados Inteligentes

## 📌 Resumo do Documento
Este documento contém a **análise crítica completa** da proposta de arquitetura Browser/Execution Engine para o projeto Afiliados Inteligentes, conforme solicitado.

---

## 🎯 Resumo Executivo
**Verdito:** ✅ **APROVADA COM AJUSTES CRÍTICOS**

A arquitetura híbrida (API + Browser + Human) é **tecnicamente viável** e resolve o problema central identificado: **depender de APIs de afiliados que podem ser inexistentes, restritas ou diferentes por plataforma**.

**Pontos-chave da análise:**
- ✅ Viável tecnicamente com a infraestrutura atual
- ✅ Superior à abordagem atual de dependência exclusiva de APIs
- ✅ Segura com as mitigações de risco propostas
- ✅ Escalável com custo controlado para MVP
- ✅ Flexível para qualquer plataforma, mesmo sem API

---

## 📋 Índice
1. [Viabilidade Técnica](#1-viabilidade-técnica)
2. [Infraestrutura](#2-infraestrutura)
3. [Segurança](#3-segurança)
4. [Browser Automation](#4-browser-automation)
5. [Plataformas](#5-plataformas)
6. [Arquitetura](#6-arquitetura)
7. [Integração com o Agente Atual](#7-integração-com-o-agente-atual)
8. [Banco de Dados](#8-banco-de-dados)
9. [Custos e Escalabilidade](#9-custos-e-escalabilidade)
10. [Riscos](#10-riscos)
11. [MVP](#11-mvp)
12. [Critérios de Aceitação](#12-critérios-de-aceitação)
13. [Comparação de Arquiteturas](#13-comparação-de-arquiteturas)

---

## 1. Viabilidade Técnica

### ✅ O que pode ser reaproveitado (90% da base já existe)
- **Supabase (PostgreSQL + Auth + Vault):** ✅ 100% - Já gerencia segredos, ideal para armazenar sessões do navegador
- **Edge Functions (Deno):** ✅ 100% - Perfeito para orquestrar o Execution Engine
- **Tabelas existentes:** ✅ 90% - `contas_plataforma`, `log_agente`, `log_ia` podem ser estendidas
- **Sistema de RLS:** ✅ 100% - Já protege dados por usuário
- **pg_cron:** ✅ 100% - Pode agendar execuções do Engine

### ⚠️ O que precisa mudar/adicionar
- Criar novo subsistema: `src/lib/execution/` com API Runner + Browser Runner + Human Runner
- Modificar `lib/ia/decisor.ts` para usar Execution Engine
- Adicionar tabelas para sessões, execuções e checkpoints
- Adicionar infraestrutura de Browser Worker (Fly.io)

---

## 2. Infraestrutura

### 📍 Onde rodar o Browser Worker?
**Recomendação para MVP: Fly.io**
- Custo: ~$5-10/mês
- Suporta Docker + Playwright
- Free tier para testes
- Escalável

### 🔌 Arquitetura de Comunicação
```
[ Frontend (Vercel) ]
       ↓ HTTPS
[ Supabase Edge Function ] → Orquestrador
       ↓ HTTP
[ Browser Worker (Fly.io) ] → Playwright
       ↓ HTTPS
[ Supabase (PostgreSQL + Storage) ]
```

### ⚠️ Limitações de Edge Functions
- ❌ Não suporta navegador headless → Browser Worker em Fly.io
- ❌ Timeout de 5s → Worker assíncrono
- ❌ Sem estado → Armazenar cookies no Supabase Vault

### 💰 Arquitetura de Baixo Custo para MVP
- **Total estimado: ~$6-12/mês**
  - Fly.io: $5-10
  - Supabase: $0 (free tier)
  - Vercel: $0
  - LLM/Visão: ~$1-2 (só para fallback)

---

## 3. Segurança

### 🛡️ Proteção de Sessões Autenticadas
- **Senhas:** ❌ Nunca armazenar em texto plano
- **Cookies/Storage:** ✅ Criptografar no Supabase Vault
- **LLM:** ✅ Nunca recebe credenciais (sessões gerenciadas pelo Session Manager)
- **Prompt Injection:** ✅ Sanitizar conteúdo + Policy Engine
- **Domínios:** ✅ Allowlist estrita (shopee.com.br, mercadolivre.com.br, etc.)

### 🔐 Policy Engine (Exemplo)
```typescript
export const POLICIES = {
  // LEITURA (permitido)
  'browser.open': { allowed: true, requiresApproval: false },
  'browser.getText': { allowed: true, requiresApproval: false },
  
  // ESCRITA (com limites)
  'browser.click': { allowed: true, requiresApproval: false, rateLimit: { maxRequests: 10, windowMs: 60000 } },
  
  // CRÍTICO (bloqueado ou requer aprovação)
  'browser.executeScript': { allowed: false }, // ❌ Bloqueado
  'browser.acceptTerms': { allowed: false, requiresApproval: true }, // Requer humano
  'browser.uploadFile': { allowed: false }, // ❌ Bloqueado
};
```

### 🚨 Human Runner
Fluxo para ações que requerem aprovação humana:
1. Browser Runner detecta CAPTCHA/MFA
2. Execution Engine salva checkpoint
3. Frontend exibe modal: "⚠️ Ação Requer Aprovação"
4. Usuário aprova/rejeita
5. Execution Engine retoma do checkpoint

---

## 4. Browser Automation

### 📌 Componentes Críticos para MVP
| Componente | Necessário? | Prioridade |
|------------|-------------|------------|
| Browser Runner (Playwright) | ✅ Sim | P1 |
| Session Manager | ✅ Sim | P1 |
| DOM/Accessibility Resolver | ✅ Sim | P1 |
| Element Resolver | ✅ Sim | P1 |
| Observer | ✅ Sim | P1 |
| Validator | ✅ Sim | P1 |
| Checkpoints | ✅ Sim | P1 |
| Computer Vision | ❌ Não | P3 |
| Adaptive Selectors | ❌ Não | P3 |

### 🔧 Detalhes dos Componentes

#### Browser Runner (Playwright)
- **Por que Playwright?** Suporta Chrome/Firefox/WebKit, API moderna, melhor tratamento de erros
- **Configuração crítica:** `--single-process` para Fly.io
- **Timeouts:** 30s para navegação, 5s para ações

#### Element Resolver
**Regras de confiança:**
- ≥ 0.9: Executar automaticamente
- 0.7-0.89: Executar com alerta
- 0.5-0.69: Requer segunda validação
- < 0.5: Bloquear e requer Human Runner

#### Observer
Detecta:
- Mudanças de URL/título
- Modais (CAPTCHA, login expirado)
- Erros
- Indicadores de sucesso

---

## 5. Plataformas

### 📊 Análise Detalhada

#### Shopee
- **API:** ✅ Disponível (Shopee Affiliate API)
- **Navegador:** ✅ Funciona
- **Login:** ✅ Requerido para geração de links
- **CAPTCHA/MFA:** ⚠️ Possível → Requer Human Runner
- **Aprovação de cadastro:** ❌ Manual (não pode ser automatizado)
- **Recomendação:** API → Browser (fallback)

#### Mercado Livre
- **API:** ✅ Disponível (bem documentada)
- **Navegador:** ✅ Funciona
- **Login:** ✅ Requerido
- **CAPTCHA/MFA:** ⚠️ Possível → Requer Human Runner
- **Aprovação de cadastro:** ❌ Manual
- **Recomendação:** API → Browser (fallback)

#### Magalu
- **API:** ❓ Não confirmada
- **Navegador:** ✅ Única opção viável
- **Login:** ✅ Requerido
- **CAPTCHA/MFA:** ⚠️ Possível → Requer Human Runner
- **Recomendação:** Browser (principal)

#### AliExpress
- **API:** ✅ Disponível (mas requer aprovação de app)
- **Navegador:** ✅ Funciona
- **Login:** ✅ Requerido
- **Aprovação de app:** ❌ Manual (pode demorar semanas)
- **Recomendação:** Browser (principal)

### 🎯 Estratégia Recomendada
| Plataforma | Principal | Fallback |
|------------|----------|----------|
| Shopee | API | Browser |
| Mercado Livre | API | Browser |
| Magalu | Browser | API (se existir) |
| AliExpress | Browser | API (se aprovada) |

---

## 6. Arquitetura

### ✅ Arquitetura Recomendada (Modular)
```
[ LLM (Agente IA) ]
       ↓
[ Execution Engine ]
       ├── [ Planner ] → Gera plano de execução
       ├── [ Policy Engine ] → Verifica permissões
       │
       ├── [ API Runner ] → Chamadas a APIs
       ├── [ Browser Runner ] → Automação de navegador
       │      ├── Session Manager
       │      ├── DOM Resolver
       │      ├── Element Resolver
       │      ├── Observer
       │      └── Validator
       │
       └── [ Human Runner ] → Aprovação humana
              ├── Approval Queue
              └── Checkpoints
       ↓
[ Resultado ]
```

### 🔄 Fluxo de Execução (Exemplo: Gerar Link Afiliado)
1. Planner: Gerar plano (verificar API → navegador → humano)
2. Policy: Verificar permissões
3. API Runner: Tentar API
4. Se falhar → Browser Runner:
   - Carregar sessão
   - Navegar para portal
   - Encontrar botão "Gerar Link"
   - Clicar
   - Observer: Verificar se link foi gerado
   - Validator: Validar link
5. Se CAPTCHA/MFA → Human Runner
6. Salvar resultado

---

## 7. Integração com o Agente Atual

**Impacto: BAIXO**
- Execution Engine é um novo subsistema
- Agente atual continua funcionando
- Apenas adição de camada de abstração

**Exemplo de integração:**
```typescript
// Antes
const produtos = await shopeeAPI.buscarProdutos();

// Depois
const produtos = await executionEngine.execute({
  capability: 'PRODUCT_SEARCH',
  platform: 'shopee',
  method: 'API' // ou 'BROWSER'
});
```

**Modificações necessárias:**
- `lib/ia/decisor.ts`: Usar Execution Engine
- `src/types/index.ts`: Adicionar tipos para Execution
- `src/lib/constantes.ts`: Adicionar constantes

---

## 8. Banco de Dados

### 📋 Novas Tabelas Necessárias
1. **browser_sessions** - Sessões autenticadas do navegador
2. **executions** - Execuções do Engine
3. **execution_steps** - Passos de uma execução
4. **execution_checkpoints** - Checkpoints para recuperação
5. **human_approvals** - Aprovações humanas pendentes
6. **browser_profiles** - Perfis de navegador
7. **capabilities** - Capacidades por plataforma (global)
8. **execution_errors** - Erros de execução

**Todas com RLS** (exceto `capabilities`)

---

## 9. Custos e Escalabilidade

### 💰 Estimativa de Custos (MVP)
| Recurso | Custo Mensal |
|---------|--------------|
| Fly.io (Browser Worker) | $5-10 |
| Supabase (PostgreSQL) | $0 |
| Supabase Storage | $0 |
| Vercel (Frontend) | $0 |
| LLM/Visão | ~$1-2 |
| **Total** | **~$6-12/mês** |

### 📈 Escalabilidade
| Cenário | Usuários | Execuções/Dia | Custo |
|---------|----------|----------------|-------|
| MVP | 1 | 50 | $6-12 |
| Pequeno | 10 | 500 | $20-50 |
| Médio | 100 | 5.000 | $100-200 |
| Grande | 1.000 | 50.000 | $500-1000 |

---

## 10. Riscos

### 🔴 Riscos Críticos
| Risco | Probabilidade | Impacto | Mitigação |
|-------|---------------|---------|-----------|
| Bloqueio de IP | Alta | Alto | Proxies rotativos |
| CAPTCHA/MFA | Alta | Alto | Human Runner |
| Mudanças na interface | Alta | Médio | Element Resolver + fallback |
| Vazamento de sessões | Baixa | Crítico | Criptografia + RLS |
| Prompt Injection | Média | Alto | Sanitização + Policy Engine |
| Execução infinita | Baixa | Alto | Timeout + limite de passos |

### 🟡 Riscos Moderados
| Risco | Mitigação |
|-------|-----------|
| Lentidão do navegador | Otimizar scripts |
| Sessões expirando | Auto-renew |
| Erros de DOM | Fallback para Human Runner |

---

## 11. MVP

### 🎯 Escopo do MVP
**Objetivo:** Gerar links afiliados para Shopee e Mercado Livre usando navegador quando API não estiver disponível

**Componentes:**
- Execution Engine (Core)
- Planner
- Policy Engine
- API Runner
- Browser Runner (Básico)
- Session Manager
- DOM Resolver
- Element Resolver
- Observer
- Validator
- Human Runner (Básico)
- Checkpoints
- Logs

**Capacidades:**
- PRODUCT_SEARCH (Shopee, Mercado Livre)
- PRODUCT_DETAILS (Shopee, Mercado Livre)
- AFFILIATE_LINK_GENERATION (Shopee, Mercado Livre)

**Tecnologias:**
- Frontend: Vercel (React)
- Backend: Supabase Edge Functions
- Browser Worker: Fly.io (Playwright)

---

## 12. Critérios de Aceitação

### 📌 Definition of Done
- **DESIGNED:** Especificação completa (`BROWSER_EXECUTION_ENGINE_SPEC.md`)
- **IMPLEMENTED:** Todos os componentes do MVP implementados
- **VERIFIED:** Testes unitários + integração passam
- **PRODUCTION-READY:** Deploy em Fly.io + Supabase + Vercel

### 🎯 Critérios Específicos
1. **Execution Engine:**
   - API Runner funciona para Shopee e Mercado Livre
   - Browser Runner executa ações básicas
   - Session Manager armazena e recupera sessões
   - Policy Engine bloqueia ações não permitidas

2. **Integração:**
   - Agente usa API Runner se disponível
   - Agente usa Browser Runner se API falhar
   - Fallback para Human Runner

3. **Segurança:**
   - Nenhuma senha em texto plano
   - Sessões criptografadas no Vault
   - Domain Allowlist funcionando
   - Policy Engine bloqueando ações perigosas

4. **Plataformas:**
   - Shopee: Busca e geração de links via navegador
   - Mercado Livre: Busca e geração de links via navegador
   - CAPTCHA/MFA: Detectado e pausado para Human Runner

5. **Logs:**
   - Todas as execuções registradas
   - Checkpoints permitem recuperação

---

## 13. Comparação de Arquiteturas

| Critério | A) API Principal | B) Navegador Principal | C) Híbrida |
|----------|------------------|------------------------|------------|
| Viabilidade | ❌ Baixa | ✅ Alta | ✅ **Alta** |
| Robustez | ❌ Baixa | ⚠️ Média | ✅ **Alta** |
| Flexibilidade | ❌ Baixa | ✅ Alta | ✅ **Alta** |
| Custo | ✅ Baixo | ❌ Alto | ⚠️ Médio |
| Segurança | ✅ Alta | ❌ Baixa | ✅ **Alta** |
| Escalabilidade | ✅ Alta | ❌ Baixa | ⚠️ Média |
| **Recomendação** | ❌ Não viável | ❌ Risco alto | ✅ **Melhor** |

### 📌 Por que a Arquitetura Híbrida (C) é a Melhor?
1. **Combina vantagens de API e navegador** (velocidade + flexibilidade)
2. **Fallback automático** (API → Browser → Human)
3. **Mais robusta** a longo prazo (suporta qualquer plataforma)
4. **Segurança centralizada** (Policy Engine + Human Runner)
5. **Custo controlado** (API quando disponível, browser só como fallback)

---

## 🚀 Próximos Passos (Se Aprovado)

1. **📝 Criar `BROWSER_EXECUTION_ENGINE_SPEC.md`**
   - Especificação detalhada de todos os componentes
   - Interfaces e tipos (TypeScript)
   - Fluxos de execução
   - Regras de segurança
   - Tabelas do banco de dados
   - Infraestrutura

2. **🔍 Validar APIs das Plataformas**
   - Preencher tabela no README.md
   - Confirmar Magalu e AliExpress
   - Testar autenticação via navegador

3. **🧪 Testar Navegador Headless**
   - Shopee e Mercado Livre
   - Login, busca, geração de links
   - CAPTCHA/MFA

4. **✅ Implementar MVP**
   - Seguir escopo definido
   - Playwright no Fly.io
   - Integração com Supabase

5. **🔄 Integrar com Agente**
   - Modificar `lib/ia/decisor.ts`
   - Testar fallback automático

6. **🧹 Testar e Ajustar**
   - Testes unitários
   - Testes de integração
   - Ajustes finos

---

## 🎯 Conclusão Final

A arquitetura **Browser/Execution Engine Híbrido** é **viável, segura e superior** à abordagem atual. 

**Recomendação:** ✅ **APROVAR PARA IMPLEMENTAÇÃO** com os ajustes propostos:
- Computer Vision e Adaptive Selectors ficam para V1.1
- Human Runner é obrigatório
- Session Manager usa Supabase Vault
- Policy Engine bloqueia ações perigosas

**Próximo passo:** Criar `BROWSER_EXECUTION_ENGINE_SPEC.md` (especificação detalhada)

---

**Documento criado em:** 2025 (data aproximada)
**Status:** Aguardando aprovação para implementação
**Arquivo:** `docs/ANALISE_BROWSER_EXECUTION_ENGINE.md`