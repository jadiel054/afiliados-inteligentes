import { Produto, Evento, PeriodoFiltro, MétricasResumo, Plataforma } from '../types';

const LOCAL_STORAGE_PRODUTOS_KEY = 'afiliados_produtos_v1';
const LOCAL_STORAGE_EVENTOS_KEY = 'afiliados_eventos_v1';

export const PLATAFORMAS_INICIAIS: Plataforma[] = [
  { id: '1', slug: 'shopee', nome: 'Shopee', ativo: true, created_at: new Date().toISOString() },
  { id: '2', slug: 'mercado-livre', nome: 'Mercado Livre', ativo: true, created_at: new Date().toISOString() },
  { id: '3', slug: 'magalu', nome: 'Magalu', ativo: true, created_at: new Date().toISOString() },
  { id: '4', slug: 'aliexpress', nome: 'AliExpress', ativo: true, created_at: new Date().toISOString() },
];

const PRODUTOS_INICIAIS_MOCK: Produto[] = [
  {
    id: 'prod-1',
    nome: 'Sérum Facial Vitamina C Pure 30ml',
    categoria: 'Pele',
    plataforma_id: '1',
    plataforma_slug: 'shopee',
    plataforma_nome: 'Shopee',
    valor: 49.90,
    comissao_percent: 14.5,
    link_original: 'https://shopee.com.br/product/12345/67890',
    link_curto: 'https://afi.li/shp-serum-vit-c',
    imagem_url: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=200&q=80',
    status: 'ativo',
    pontuacao_agente: 88,
    razao_escolha: 'Alta procura na categoria Pele, margem superior a 14% e excelente giro diário.',
    data_cadastro: new Date(Date.now() - 3 * 86400000).toISOString()
  },
  {
    id: 'prod-2',
    nome: 'Batom Líquido Matte Duradouro Rose',
    categoria: 'Maquiagem',
    plataforma_id: '2',
    plataforma_slug: 'mercado-livre',
    plataforma_nome: 'Mercado Livre',
    valor: 29.90,
    comissao_percent: 12.0,
    link_original: 'https://mercadolivre.com.br/p/MLB123456',
    link_curto: 'https://afi.li/ml-batom-matte',
    imagem_url: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=200&q=80',
    status: 'ativo',
    pontuacao_agente: 82,
    razao_escolha: 'Produto tendência em redes sociais com altíssima taxa de conversão.',
    data_cadastro: new Date(Date.now() - 5 * 86400000).toISOString()
  },
  {
    id: 'prod-3',
    nome: 'Perfume Masculino Eau de Parfum 100ml',
    categoria: 'Perfumaria',
    plataforma_id: '3',
    plataforma_slug: 'magalu',
    plataforma_nome: 'Magalu',
    valor: 189.90,
    comissao_percent: 10.0,
    link_original: 'https://magazineluiza.com.br/perfume-edp/p/9876543',
    link_curto: 'https://afi.li/mgl-perfume-edp',
    imagem_url: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=200&q=80',
    status: 'ativo',
    pontuacao_agente: 79,
    razao_escolha: 'Ticket médio alto garantindo excelente valor absoluto por comissão.',
    data_cadastro: new Date(Date.now() - 10 * 86400000).toISOString()
  },
  {
    id: 'prod-4',
    nome: 'Kit Máscara de Cabelo Nutrição Profunda 500g',
    categoria: 'Cabelo',
    plataforma_id: '4',
    plataforma_slug: 'aliexpress',
    plataforma_nome: 'AliExpress',
    valor: 75.00,
    comissao_percent: 18.0,
    link_original: 'https://aliexpress.com/item/1005001234.html',
    link_curto: 'https://afi.li/ali-kit-cabelo',
    imagem_url: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=200&q=80',
    status: 'ativo',
    pontuacao_agente: 91,
    razao_escolha: 'Comissão de 18% imbatível e ótimas avaliações dos compradores.',
    data_cadastro: new Date(Date.now() - 1 * 86400000).toISOString()
  }
];

function gerarEventosIniciaisMock(): Evento[] {
  const eventos: Evento[] = [];
  const agora = Date.now();
  const diaMs = 86400000;

  PRODUTOS_INICIAIS_MOCK.forEach(prod => {
    // Cliques nos últimos 15 dias
    for (let i = 0; i < 30; i++) {
      const offset = Math.random() * 15 * diaMs;
      eventos.push({
        id: `ev-clique-${prod.id}-${i}`,
        produto_id: prod.id,
        tipo: 'clique',
        valor_bruto: 0,
        valor_comissao: 0,
        created_at: new Date(agora - offset).toISOString()
      });
    }

    // Vendas nos últimos 15 dias
    for (let i = 0; i < 6; i++) {
      const offset = Math.random() * 12 * diaMs;
      const valComissao = (prod.valor * prod.comissao_percent) / 100;
      eventos.push({
        id: `ev-venda-${prod.id}-${i}`,
        produto_id: prod.id,
        tipo: 'venda',
        valor_bruto: prod.valor,
        valor_comissao: valComissao,
        created_at: new Date(agora - offset).toISOString()
      });
    }
  });

  return eventos;
}

export function carregarProdutos(): Produto[] {
  const salvos = localStorage.getItem(LOCAL_STORAGE_PRODUTOS_KEY);
  if (salvos) {
    try {
      return JSON.parse(salvos);
    } catch (e) {
      console.error('Erro ao ler produtos do LocalStorage', e);
    }
  }
  localStorage.setItem(LOCAL_STORAGE_PRODUTOS_KEY, JSON.stringify(PRODUTOS_INICIAIS_MOCK));
  return PRODUTOS_INICIAIS_MOCK;
}

export function salvarProdutos(produtos: Produto[]): void {
  localStorage.setItem(LOCAL_STORAGE_PRODUTOS_KEY, JSON.stringify(produtos));
}

export function carregarEventos(): Evento[] {
  const salvos = localStorage.getItem(LOCAL_STORAGE_EVENTOS_KEY);
  if (salvos) {
    try {
      return JSON.parse(salvos);
    } catch (e) {
      console.error('Erro ao ler eventos do LocalStorage', e);
    }
  }
  const iniciais = gerarEventosIniciaisMock();
  localStorage.setItem(LOCAL_STORAGE_EVENTOS_KEY, JSON.stringify(iniciais));
  return iniciais;
}

export function salvarEventos(eventos: Evento[]): void {
  localStorage.setItem(LOCAL_STORAGE_EVENTOS_KEY, JSON.stringify(eventos));
}

export function gerarLinkCurto(nomeProduto: string, plataformaSlug: string): string {
  const slugLimpo = nomeProduto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 20);

  const prefixoPlat = plataformaSlug === 'mercado-livre' ? 'ml' : plataformaSlug.slice(0, 3);
  const hash = Math.random().toString(36).substring(2, 6);
  return `https://afi.li/${prefixoPlat}-${slugLimpo}-${hash}`;
}

export function calcularMetricasPorPeriodo(
  periodo: PeriodoFiltro,
  dataInicioPersonalizada?: string,
  dataFimPersonalizada?: string
): { resumo: MétricasResumo; eventosFiltrados: Evento[] } {
  const eventos = carregarEventos();
  const agora = new Date();
  let inicio = new Date();
  let fim = new Date();

  fim.setHours(23, 59, 59, 999);

  switch (periodo) {
    case 'hoje':
      inicio.setHours(0, 0, 0, 0);
      break;
    case 'ontem':
      inicio.setDate(inicio.getDate() - 1);
      inicio.setHours(0, 0, 0, 0);
      fim.setDate(fim.getDate() - 1);
      fim.setHours(23, 59, 59, 999);
      break;
    case '3dias':
      inicio.setDate(inicio.getDate() - 2);
      inicio.setHours(0, 0, 0, 0);
      break;
    case '5dias':
      inicio.setDate(inicio.getDate() - 4);
      inicio.setHours(0, 0, 0, 0);
      break;
    case '7dias':
      inicio.setDate(inicio.getDate() - 6);
      inicio.setHours(0, 0, 0, 0);
      break;
    case '15dias':
      inicio.setDate(inicio.getDate() - 14);
      inicio.setHours(0, 0, 0, 0);
      break;
    case '30dias':
      inicio.setDate(inicio.getDate() - 29);
      inicio.setHours(0, 0, 0, 0);
      break;
    case 'personalizado':
      if (dataInicioPersonalizada) {
        inicio = new Date(dataInicioPersonalizada);
        inicio.setHours(0, 0, 0, 0);
      }
      if (dataFimPersonalizada) {
        fim = new Date(dataFimPersonalizada);
        fim.setHours(23, 59, 59, 999);
      }
      break;
  }

  const eventosFiltrados = eventos.filter(ev => {
    const d = new Date(ev.created_at);
    return d >= inicio && d <= fim;
  });

  let cliques = 0;
  let vendas = 0;
  let valorBrutoTotal = 0;
  let comissaoTotal = 0;
  let reembolsos = 0;

  eventosFiltrados.forEach(ev => {
    if (ev.tipo === 'clique') cliques++;
    if (ev.tipo === 'venda') {
      vendas++;
      valorBrutoTotal += ev.valor_bruto;
      comissaoTotal += ev.valor_comissao;
    }
    if (ev.tipo === 'reembolso') {
      reembolsos += ev.valor_comissao;
    }
  });

  const lucroLiquido = comissaoTotal - reembolsos;
  const taxaConversao = cliques > 0 ? (vendas / cliques) * 100 : 0;
  const ticketMedio = vendas > 0 ? valorBrutoTotal / vendas : 0;

  return {
    resumo: {
      cliques,
      vendas,
      valorBrutoTotal,
      comissaoTotal,
      lucroLiquido,
      taxaConversao,
      ticketMedio,
    },
    eventosFiltrados
  };
}
