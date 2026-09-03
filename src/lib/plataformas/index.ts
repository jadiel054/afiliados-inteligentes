// Cliente base para plataformas (Shopee, Mercado Livre, Magalu, AliExpress)
export interface ConexaoPlataforma {
  slug: string;
  token: string;
}

export async function testarTokenPlataforma(conexao: ConexaoPlataforma): Promise<boolean> {
  await new Promise(res => setTimeout(res, 800));
  return Boolean(conexao.token && conexao.token.length >= 8);
}
