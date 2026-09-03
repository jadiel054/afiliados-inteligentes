// Estrutura de análise e cálculo do Score Winner (0-100)
export interface CriteriosProduto {
  margemComissao: number; // 30%
  giroVenda: number;      // 25%
  avaliacao: number;      // 15%
  tendencia: number;      // 15%
  competitividade: number;// 10%
  sazonalidade: number;   // 5%
}

export function calcularScoreWinner(criterios: CriteriosProduto): number {
  const score =
    criterios.margemComissao * 0.30 +
    criterios.giroVenda * 0.25 +
    criterios.avaliacao * 0.15 +
    criterios.tendencia * 0.15 +
    criterios.competitividade * 0.10 +
    criterios.sazonalidade * 0.05;

  return Math.min(100, Math.max(0, Math.round(score)));
}
