// Estrutura do provedor de IA e teste de conexão
import { ProvedorIA } from '../../types';

export async function testarConexaoProvedor(provedor: ProvedorIA): Promise<boolean> {
  // Simula validação de API Key / Ollama URL
  await new Promise(res => setTimeout(res, 1000));
  if (provedor.provedor === 'ollama') return true;
  return Boolean(provedor.api_key_cript && provedor.api_key_cript.length > 5);
}
