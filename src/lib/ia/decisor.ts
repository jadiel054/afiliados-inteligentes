// Lógica de aprovação/autonomia do Agente IA
import { ModoAgente } from '../../types';

export function decidirAcaoAgente(score: number, modo: ModoAgente) {
  if (modo === 'autonomo_total' && score >= 85) {
    return { acao: 'AFILIAR_AUTOMATICO', motivo: 'Score >= 85 em Modo Autônomo Total' };
  }
  if (score >= 75) {
    return { acao: 'ENVIAR_PROPOSTA', motivo: 'Score >= 75 aguardando aprovação' };
  }
  return { acao: 'IGNORAR', motivo: 'Score insuficiente para afiliação' };
}
