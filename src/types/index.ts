// ============================================
// TIPOS PRINCIPAIS DO SISTEMA
// ============================================

// --- Enums e Tipos Básicos ---

export type PlataformaSlug = 'shopee' | 'mercado-livre' | 'magalu' | 'aliexpress';

export type StatusProduto = 'ativo' | 'pausado' | 'arquivado';

export type OrigemProduto = 'manual' | 'agente_proposto' | 'agente_automatico';

export type ClassificacaoProduto = 'campeao' | 'promissor' | 'estavel' | 'fraco';

export type TipoEvento = 'clique' | 'venda' | 'reembolso' | 'pagamento';

export type TipoCusto = 'anuncio' | 'ferramenta' | 'imposto' | 'outro';

export type ProvedorIA = 'groq' | 'ollama' | 'gemini' | 'cloudflare' | 'openrouter' | 'deepseek';

export type ModoAgente = 'desligado' | 'semi_autonomo' | 'autonomo_total';

export type Confianca = 'baixa' | 'media' | 'alta';

export type StatusProposta = 'pendente' | 'aprovado' | 'rejeitado' | 'automatico' | 'expirado';

export type StatusContaPlataforma = 'conectado' | 'desconectado' | 'erro';

export type TipoNotificacao = 'venda' | 'reembolso' | 'link_problema' | 'agente' | 'sistema' | 'resumo';

export type ResultadoAcao = 'sucesso' | 'parcial' | 'falhou';

export type Periodo = 'hoje' | 'ontem' | 'ultimos_3' | 'ultimos_5' | 'ultimos_7' | 'ultimos_15' | 'ultimo_mes' | 'especifico';

// --- Interfaces de Dados ---

// Plataformas
export interface Plataforma {
  id: string;
  slug: PlataformaSlug;
  nome: string;
  cor_hex: string;
  ativo: boolean;
  created_at: string;
}

// Contas de Plataforma por Usuário
export interface ContaPlataforma {
  id: string;
  usuario_id: string;
  plataforma_id: string;
  vault_secret_id?: string;
  id_afiliado: string;
  config: Record<string, unknown>;
  status: StatusContaPlataforma;
  ultima_sinc?: string;
  ultimo_erro?: string;
  created_at: string;
  plataforma?: Plataforma;
}

// Produtos
export interface Produto {
  id: string;
  usuario_id: string;
  nome: string;
  categoria: string;
  plataforma_id: string;
  id_externo?: string;
  valor: number;
  comissao_percent: number;
  link_original: string;
  link_afiliado?: string;
  link_curto_codigo: string;
  imagem_url?: string;
  status: StatusProduto;
  origem: OrigemProduto;
  pontuacao_agente?: number;
  razao_escolha?: string;
  classificacao?: ClassificacaoProduto;
  data_cadastro: string;
  atualizado_em: string;
  plataforma?: Plataforma;
}

// Eventos
export interface Evento {
  id: string;
  usuario_id: string;
  produto_id?: string;
  tipo: TipoEvento;
  valor_bruto?: number;
  valor_comissao?: number;
  moeda: string;
  id_externo?: string;
  ip_hash?: string;
  user_agent?: string;
  referrer?: string;
  dados_plataforma?: Record<string, unknown>;
  ocorrido_em: string;
  created_at: string;
  produto?: Produto;
}

// Custos
export interface Custo {
  id: string;
  usuario_id: string;
  descricao: string;
  tipo: TipoCusto;
  valor: number;
  produto_id?: string;
  data: string;
  created_at: string;
  produto?: Produto;
}

// Provedores de IA
export interface ProvedorIAConfig {
  id: string;
  usuario_id: string;
  nome: string;
  provedor: ProvedorIA;
  vault_secret_id?: string;
  url_base?: string;
  conta_id?: string;
  modelo: string;
  ativo: boolean;
  ordem_fallback: number;
  ultimo_teste?: string;
  ultimo_teste_ok?: boolean;
  ultimo_teste_msg?: string;
  created_at: string;
}

// Configuração do Agente
export interface ConfigAgente {
  id: string;
  usuario_id: string;
  modo: ModoAgente;
  pontuacao_propor: number;
  pontuacao_agir: number;
  comissao_minima: number;
  valor_maximo: number;
  rodar_a_cada_horas: number;
  max_produtos_dia: number;
  horario_inicio: number;
  horario_fim: number;
  categorias: string[];
  atualizado_em: string;
}

// Propostas do Agente
export interface PropostaAgente {
  id: string;
  usuario_id: string;
  dados_produto: Record<string, unknown>;
  pontuacao: number;
  subpontuacoes: Record<string, number | null>;
  razao: string[];
  relatorio: string;
  dados_incompletos: boolean;
  confianca: Confianca;
  status: StatusProposta;
  produto_id?: string;
  decidido_em?: string;
  data: string;
  produto?: Produto;
}

// Notificações
export interface Notificacao {
  id: string;
  usuario_id: string;
  tipo: TipoNotificacao;
  titulo: string;
  mensagem: string;
  link_interno?: string;
  chave_agrupamento?: string;
  lida: boolean;
  created_at: string;
}

// Log do Agente
export interface LogAgente {
  id: string;
  usuario_id: string;
  acao: string;
  resultado: ResultadoAcao;
  detalhe?: Record<string, unknown>;
  mensagem?: string;
  created_at: string;
}

// Log de IA
export interface LogIA {
  id: string;
  usuario_id: string;
  provedor: string;
  modelo?: string;
  tokens_entrada?: number;
  tokens_saida?: number;
  latencia_ms?: number;
  sucesso: boolean;
  erro?: string;
  created_at: string;
}

// --- Tipos de Requisição e Resposta ---

// Autenticação
export interface Usuario {
  id: string;
  email: string;
  nome?: string;
  criado_em?: string;
}

export interface AuthContextType {
  usuario: Usuario | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<{ error?: string }>;
  cadastro: (email: string, senha: string, nome: string) => Promise<{ error?: string }>;
  recuperarSenha: (email: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
}

// Métricas do Painel
export interface MetricasPainel {
  cliques: number;
  vendas: number;
  valorBruto: number;
  comissaoTotal: number;
  lucroLiquido: number;
  taxaConversao: number;
}

export interface MetricasPorPeriodo {
  periodo: string;
  metricas: MetricasPainel;
}

export interface MetricasPorPlataforma {
  plataforma: string;
  plataforma_id: string;
  cor_hex: string;
  cliques: number;
  vendas: number;
  valorBruto: number;
  comissaoTotal: number;
}

// Filtros
export interface FiltroProdutos {
  plataforma_id?: string;
  categoria?: string;
  status?: StatusProduto;
  periodo?: string;
  data_inicio?: string;
  data_fim?: string;
}

// Dados para geração de link curto
export interface GerarLinkCurtoRequest {
  produto_id: string;
  link_original: string;
}

export interface GerarLinkCurtoResponse {
  link_curto_codigo: string;
  link_curto_url: string;
  error?: string;
}

// Teste de conexão IA
export interface TestarIARequest {
  provedor: ProvedorIA;
  url_base?: string;
  modelo: string;
  chave_api?: string;
  conta_id?: string;
}

export interface TestarIAResponse {
  sucesso: boolean;
  mensagem: string;
  provedor: ProvedorIA;
  modelo: string;
}

// Pontuação do Agente
export interface PontuacaoInput {
  comissao_percent: number;
  valor: number;
  categorias: string[];
  vendas_30d?: number;
  avaliacao?: { nota: number; total: number };
  tendencia?: number;
  competitividade?: { preco: number; mediana: number; concorrentes: number };
  sazonalidade?: number;
  media_comissao_categoria?: number;
}

export interface PontuacaoResultado {
  pontuacao: number;
  subpontuacoes: Record<string, number | null>;
  dados_incompletos: boolean;
  confianca: Confianca;
  razoes: string[];
}

// Configuração de Sazonalidade
export interface SazonalidadeConfig {
  [categoria: string]: {
    [mes: string]: 'alta' | 'neutro' | 'baixa';
  };
}

// --- Tipos para Formulários ---

export interface ProdutoFormData {
  nome: string;
  categoria: string;
  plataforma_id: string;
  valor: number;
  comissao_percent: number;
  link_original: string;
  link_afiliado?: string;
  imagem_url?: string;
  status: StatusProduto;
}

export interface CustoFormData {
  descricao: string;
  tipo: TipoCusto;
  valor: number;
  produto_id?: string;
  data: string;
}

export interface ProvedorIAFormData {
  nome: string;
  provedor: ProvedorIA;
  url_base?: string;
  conta_id?: string;
  modelo: string;
  ativo: boolean;
  ordem_fallback: number;
  chave_api?: string;
}

export interface ConfigAgenteFormData {
  modo: ModoAgente;
  pontuacao_propor: number;
  pontuacao_agir: number;
  comissao_minima: number;
  valor_maximo: number;
  rodar_a_cada_horas: number;
  max_produtos_dia: number;
  horario_inicio: number;
  horario_fim: number;
  categorias: string[];
}

// --- Constantes ---

export const CATEGORIAS_NICHO = [
  'beleza',
  'cuidados-pessoais',
  'maquiagem',
  'pele',
  'cabelo',
  'perfumaria',
] as const;

export const PLATAFORMAS_CORES: Record<PlataformaSlug, string> = {
  shopee: '#F57224',
  'mercado-livre': '#FFE600',
  magalu: '#00A8E8',
  aliexpress: '#FF6600',
} as const;

export const FUSO = 'America/Sao_Paulo' as const;

export const STATUS_PRODUTO: StatusProduto[] = ['ativo', 'pausado', 'arquivado'];

export const CLASSIFICACOES: ClassificacaoProduto[] = ['campeao', 'promissor', 'estavel', 'fraco'];

export const PROVEDORES_IA: ProvedorIA[] = ['groq', 'ollama', 'gemini', 'cloudflare', 'openrouter', 'deepseek'];

export const MODOS_AGENTE: ModoAgente[] = ['desligado', 'semi_autonomo', 'autonomo_total'];

export const TIPOS_CUSTO: TipoCusto[] = ['anuncio', 'ferramenta', 'imposto', 'outro'];

export const PERIODOS: Periodo[] = ['hoje', 'ontem', 'ultimos_3', 'ultimos_5', 'ultimos_7', 'ultimos_15', 'ultimo_mes', 'especifico'];
