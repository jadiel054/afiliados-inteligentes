// ============================================
// CONSTANTES GLOBAIS DO SISTEMA
// ============================================

import { 
  CATEGORIAS_NICHO, 
  PLATAFORMAS_CORES, 
  FUSO,
  STATUS_PRODUTO,
  CLASSIFICACOES,
  PROVEDORES_IA,
  MODOS_AGENTE,
  TIPOS_CUSTO,
  PERIODOS,
  type PlataformaSlug,
  type ClassificacaoProduto,
  type ProvedorIA,
  type ModoAgente,
  type TipoCusto,
  type Periodo,
  type StatusProduto
} from '@/types';

// Re-exportar tipos e constantes do types/index
export {
  CATEGORIAS_NICHO,
  PLATAFORMAS_CORES,
  FUSO,
  STATUS_PRODUTO,
  CLASSIFICACOES,
  PROVEDORES_IA,
  MODOS_AGENTE,
  TIPOS_CUSTO,
  PERIODOS,
};

export type {
  PlataformaSlug,
  ClassificacaoProduto,
  ProvedorIA,
  ModoAgente,
  TipoCusto,
  Periodo,
  StatusProduto,
};

// ============================================
// CONFIGURAÇÃO DE SAZONALIDADE
// ============================================

export const SAZONALIDADE: Record<string, Record<string, 'alta' | 'neutro' | 'baixa'>> = {
  beleza: {
    '01': 'alta',
    '02': 'alta',
    '03': 'neutro',
    '04': 'neutro',
    '05': 'alta',
    '06': 'neutro',
    '07': 'neutro',
    '08': 'neutro',
    '09': 'neutro',
    '10': 'neutro',
    '11': 'alta',
    '12': 'alta',
  },
  'cuidados-pessoais': {
    '01': 'alta',
    '02': 'alta',
    '05': 'alta',
    '11': 'alta',
    '12': 'alta',
    '03': 'neutro',
    '04': 'neutro',
    '06': 'neutro',
    '07': 'neutro',
    '08': 'neutro',
    '09': 'neutro',
    '10': 'neutro',
  },
  maquiagem: {
    '01': 'alta',
    '02': 'alta',
    '05': 'alta',
    '11': 'alta',
    '12': 'alta',
    '03': 'neutro',
    '04': 'neutro',
    '06': 'neutro',
    '07': 'neutro',
    '08': 'neutro',
    '09': 'neutro',
    '10': 'neutro',
  },
  pele: {
    '01': 'alta',
    '02': 'alta',
    '03': 'alta',
    '04': 'neutro',
    '05': 'alta',
    '06': 'neutro',
    '07': 'neutro',
    '08': 'neutro',
    '09': 'alta',
    '10': 'neutro',
    '11': 'alta',
    '12': 'alta',
  },
  cabelo: {
    '01': 'alta',
    '02': 'alta',
    '05': 'alta',
    '11': 'alta',
    '12': 'alta',
    '03': 'neutro',
    '04': 'neutro',
    '06': 'neutro',
    '07': 'neutro',
    '08': 'neutro',
    '09': 'neutro',
    '10': 'neutro',
  },
  perfumaria: {
    '01': 'neutro',
    '02': 'neutro',
    '03': 'neutro',
    '04': 'neutro',
    '05': 'alta',
    '06': 'neutro',
    '07': 'neutro',
    '08': 'neutro',
    '09': 'neutro',
    '10': 'neutro',
    '11': 'alta',
    '12': 'alta',
  },
};

export const PESOS_PONTUACAO = {
  margem: 0.30,
  giro: 0.25,
  avaliacao: 0.15,
  tendencia: 0.15,
  competitividade: 0.10,
  sazonalidade: 0.05,
} as const;

export const CONFIG_PADRAO_AGENTE = {
  modo: 'semi_autonomo' as ModoAgente,
  pontuacao_propor: 75,
  pontuacao_agir: 85,
  comissao_minima: 5,
  valor_maximo: 500,
  rodar_a_cada_horas: 6,
  max_produtos_dia: 10,
  horario_inicio: 8,
  horario_fim: 22,
  categorias: Array.from(CATEGORIAS_NICHO),
} as const;

export const LIMITES = {
  NOME_MIN: 2,
  NOME_MAX: 100,
  VALOR_MIN: 0,
  VALOR_MAX: 10000,
  COMISSAO_MIN: 0,
  COMISSAO_MAX: 100,
  LINK_MAX: 2000,
  DESCricao_MAX: 500,
  MAX_PRODUTOS_DIA_MIN: 1,
  MAX_PRODUTOS_DIA_MAX: 100,
  HORARIO_MIN: 0,
  HORARIO_MAX: 23,
  RODAR_A_CADA_HORAS_MIN: 1,
  RODAR_A_CADA_HORAS_MAX: 24,
  PONTUACAO_MIN: 0,
  PONTUACAO_MAX: 100,
} as const;

export const PAGINACAO = {
  ITENS_POR_PAGINA: 20,
  MAX_PAGINAS: 10,
} as const;

export const MENSAGENS = {
  ERRO_GENERICO: 'Ocorreu um erro inesperado. Por favor, tente novamente.',
  SUCESSO_SALVAR: 'Dados salvos com sucesso!',
  SUCESSO_EXCLUIR: 'Registro excluído com sucesso!',
  SUCESSO_COPiar: 'Copiado para a área de transferência!',
  CONFIRMAR_EXCLUIR: 'Tem certeza? Esta ação não pode ser desfeita.',
  CAMPO_OBRIGATORIO: 'Este campo é obrigatório.',
  VALOR_INVALIDO: 'Valor inválido.',
  PRODUTO_SALVO: 'Produto salvo com sucesso!',
  PRODUTO_EXCLUIDO: 'Produto excluído com sucesso!',
  LINK_COPADO: 'Link copiado com sucesso!',
  CONEXAO_TESTADA: 'Conexão testada com sucesso!',
  CONEXAO_FALHOU: 'Falha ao testar conexão.',
  LOGIN_SUCESSO: 'Login realizado com sucesso!',
  LOGOUT_SUCESSO: 'Logout realizado com sucesso!',
  CADASTRO_SUCESSO: 'Cadastro realizado com sucesso! Verifique seu e-mail.',
  SENHA_RECUPERADA: 'Instruções de recuperação enviadas para seu e-mail.',
  DADOS_SEM_ALTERACAO: 'Nenhuma alteração detectada.',
  NAO_HA_DADOS: 'Não há dados para exibir.',
  CARREGANDO: 'Carregando...',
} as const;

export const LINK_CURTO = {
  TAMANHO_CODIGO: 8,
  BASE_URL: import.meta.env.VITE_PUBLIC_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173'),
  MAX_TENTATIVAS: 5,
} as const;

export const RETRY_CONFIG = {
  MAX_TENTATIVAS: 3,
  BACKOFF_BASE: 1000,
  BACKOFF_MAX: 4000,
  STATUS_RETRY: [429, 500, 502, 503, 504],
} as const;

export function getSazonalidade(categoria: string, mes: string): 'alta' | 'neutro' | 'baixa' {
  const mesFormatado = mes.padStart(2, '0');
  return SAZONALIDADE[categoria]?.[mesFormatado] || 'neutro';
}

export function toSaoPauloTime(date: Date | string): Date {
  if (typeof date === 'string') {
    date = new Date(date);
  }
  return new Date(date.toLocaleString('pt-BR', { timeZone: FUSO }));
}

export function getDataAtualSP(): Date {
  return toSaoPauloTime(new Date());
}

export function formatarData(data: Date | string, formato: 'curto' | 'longo' = 'curto'): string {
  const date = typeof data === 'string' ? new Date(data) : data;
  const spDate = toSaoPauloTime(date);
  
  if (formato === 'longo') {
    return spDate.toLocaleDateString('pt-BR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }
  
  return spDate.toLocaleDateString('pt-BR');
}

export function formatarMoeda(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(valor);
}

export function formatarPorcentagem(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valor / 100);
}

export function gerarCodigoCurto(): string {
  const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let codigo = '';
  for (let i = 0; i < LINK_CURTO.TAMANHO_CODIGO; i++) {
    const indice = Math.floor(Math.random() * caracteres.length);
    codigo += caracteres.charAt(indice);
  }
  return codigo;
}

export function mascararChave(chave: string): string {
  if (chave.length <= 4) return '****';
  return '*'.repeat(chave.length - 4) + chave.slice(-4);
}

export function getCorPlataforma(slug: PlataformaSlug): string {
  return PLATAFORMAS_CORES[slug];
}

export function getNomePlataforma(slug: PlataformaSlug): string {
  const nomes: Record<PlataformaSlug, string> = {
    shopee: 'Shopee',
    'mercado-livre': 'Mercado Livre',
    magalu: 'Magalu',
    aliexpress: 'AliExpress',
  };
  return nomes[slug];
}

export function getClassificacaoAutomatica(
  cliques: number,
  vendas: number,
  taxaConversao: number
): ClassificacaoProduto | null {
  if (vendas >= 5 && taxaConversao >= 0.03) {
    return 'campeao';
  }
  if (vendas >= 1 && taxaConversao >= 0.01) {
    return 'promissor';
  }
  if (cliques >= 20 && vendas >= 1) {
    return 'estavel';
  }
  if (cliques >= 50 && vendas === 0) {
    return 'fraco';
  }
  return null;
}

/** Copia texto para a área de transferência */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator?.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    document.body.appendChild(textArea);
    textArea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textArea);
    return ok;
  } catch {
    return false;
  }
}
