export type SlugPlataforma = 'shopee' | 'mercado-livre' | 'magalu' | 'aliexpress';

export type StatusProduto = 'ativo' | 'inativo' | 'analise' | 'rejeitado';

export type TipoEvento = 'clique' | 'venda' | 'reembolso' | 'pagamento';

export type ModoAgente = 'semi_autonomo' | 'autonomo_total' | 'manual';

export type StatusProposta = 'pendente' | 'aprovado' | 'rejeitado' | 'automatico';

export type ProvedoresSuportados = 'groq' | 'ollama' | 'gemini' | 'cloudflare' | 'openrouter' | 'deepseek';

export interface Usuario {
  id: string;
  email: string;
  nome: string;
  avatar_url?: string;
}

export interface Plataforma {
  id: string;
  slug: SlugPlataforma;
  nome: string;
  api_token_cript?: string;
  config?: Record<string, unknown>;
  ativo: boolean;
  created_at: string;
}

export interface Produto {
  id: string;
  usuario_id?: string;
  nome: string;
  categoria: string;
  plataforma_id: string;
  plataforma_slug?: SlugPlataforma;
  plataforma_nome?: string;
  valor: number;
  comissao_percent: number;
  link_original: string;
  link_curto: string;
  imagem_url?: string;
  status: StatusProduto;
  pontuacao_agente?: number;
  razao_escolha?: string;
  data_cadastro: string;
}

export interface Evento {
  id: string;
  produto_id: string;
  tipo: TipoEvento;
  valor_bruto: number;
  valor_comissao: number;
  dados_plataforma?: Record<string, unknown>;
  created_at: string;
}

export interface ProvedorIA {
  id: string;
  usuario_id?: string;
  nome: string;
  provedor: ProvedoresSuportados;
  api_key_cript?: string;
  url_base?: string;
  modelo: string;
  ativo: boolean;
  ordem_fallback: number;
}

export interface ConfigAgente {
  id: string;
  usuario_id?: string;
  modo: ModoAgente;
  pontuacao_propor: number; // ex: 75
  pontuacao_agir: number; // ex: 85
  comissao_minima: number; // ex: 5%
  rodar_a_cada_horas: number;
  max_produtos_dia: number;
  horario_inicio: number; // 0-23
  horario_fim: number; // 0-23
}

export interface PropostaAgente {
  id: string;
  usuario_id?: string;
  dados_produto: Omit<Produto, 'id' | 'data_cadastro'>;
  pontuacao: number;
  razao: string[];
  status: StatusProposta;
  data: string;
}

export interface Notificacao {
  id: string;
  usuario_id?: string;
  tipo: 'venda' | 'reembolso' | 'link_quebrado' | 'agente_acao' | 'sistema';
  titulo: string;
  mensagem: string;
  lida: boolean;
  created_at: string;
}

export type PeriodoFiltro = 'hoje' | 'ontem' | '3dias' | '5dias' | '7dias' | '15dias' | '30dias' | 'personalizado';

export interface FiltroEstatistica {
  periodo: PeriodoFiltro;
  dataInicio?: string;
  dataFim?: string;
  plataformaId?: string;
}

export interface MétricasResumo {
  cliques: number;
  vendas: number;
  valorBrutoTotal: number;
  comissaoTotal: number;
  lucroLiquido: number;
  taxaConversao: number;
  ticketMedio: number;
}
