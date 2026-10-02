// ============================================
// EDGE FUNCTION: REDIRECT-LINK
// Gera código curto e redireciona para o link original ou de afiliado
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { nanoid } from 'https://esm.sh/nanoid@5.0.6';

// Interface do produto retornado pelo banco de dados
interface Produto {
  id: string;
  usuario_id: string;
  link_original: string;
  link_afiliado: string | null;
}

// Interface do payload recebido no endpoint de geração de código curto
interface GerarCodigoPayload {
  produto_id?: string;
}

// Configuração do Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Tamanho do código curto (8 caracteres base62)
const CODE_LENGTH = 8;

// Criar cliente Supabase com service role
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Função para gerar um código curto único de 8 caracteres.
 * Tenta no máximo 5 vezes antes de lançar um erro de unicidade.
 */
async function generateUniqueCode(): Promise<string> {
  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    const code = nanoid(CODE_LENGTH);

    // Verificar se o código já existe no banco de dados
    const { data, error } = await supabase
      .from('produtos')
      .select('id')
      .eq('link_curto_codigo', code)
      .maybeSingle();

    if (error) {
      console.error('Erro ao verificar unicidade do código:', error);
      attempts++;
      continue;
    }

    if (!data) {
      return code;
    }

    attempts++;
  }

  throw new Error('Não foi possível gerar código único após 5 tentativas');
}

/**
 * Função para gerar hash SHA-256 do IP do usuário com salt.
 * Utiliza Web Crypto API nativa do Deno/browsers.
 */
async function generateIpHash(ip: string): Promise<string> {
  const salt = Deno.env.get('VAULT_SALT');

  // Lança erro explícito se VAULT_SALT não estiver definido nas variáveis de ambiente
  if (!salt) {
    throw new Error('Variável de ambiente VAULT_SALT não configurada');
  }

  const encodedData = new TextEncoder().encode(ip + salt);
  const hashBuffer = await crypto.subtle.digest('SHA-256', encodedData);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  return hashHex;
}

/**
 * Função para verificar se houve clique duplicado (mesmo produto e ip_hash nos últimos 30 segundos).
 */
async function isDuplicateClick(
  produtoId: string,
  ipHash: string
): Promise<boolean> {
  const thirtySecondsAgo = new Date(Date.now() - 30000);

  const { data, error } = await supabase
    .from('eventos')
    .select('id')
    .eq('produto_id', produtoId)
    .eq('tipo', 'clique')
    .eq('ip_hash', ipHash)
    .gte('created_at', thirtySecondsAgo.toISOString())
    .maybeSingle();

  if (error) {
    console.error('Erro ao verificar duplicação de clique:', error);
    return false;
  }

  return !!data;
}

/**
 * Função para gravar o evento de clique na tabela 'eventos'.
 * Requer usuario_id pois a coluna é NOT NULL.
 */
async function recordClick(
  usuarioId: string,
  produtoId: string,
  ipHash: string,
  userAgent: string,
  referrer: string
): Promise<void> {
  const { error } = await supabase.from('eventos').insert({
    usuario_id: usuarioId,
    produto_id: produtoId,
    tipo: 'clique',
    ip_hash: ipHash,
    user_agent: userAgent,
    referrer: referrer,
    ocorrido_em: new Date().toISOString(),
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error('Erro ao gravar evento de clique:', error);
  }
}

// Handler principal unificado do Deno
serve(async (req: Request): Promise<Response> => {
  const url = new URL(req.url);
  const funcaoHeader = req.headers.get('x-funcao');

  // 1. ROTA DE GERAÇÃO DE CÓDIGO CURTO: POST com header "x-funcao: gerar"
  if (req.method === 'POST' && funcaoHeader === 'gerar') {
    try {
      const body = (await req.json()) as GerarCodigoPayload;
      const { produto_id } = body;

      if (!produto_id) {
        return new Response(
          JSON.stringify({ error: 'produto_id é obrigatório' }),
          {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Gerar código único
      const code = await generateUniqueCode();

      // Atualizar o produto com o novo código curto
      const { error: updateError } = await supabase
        .from('produtos')
        .update({ link_curto_codigo: code })
        .eq('id', produto_id);

      if (updateError) {
        console.error('Erro ao atualizar produto com código curto:', updateError);
        return new Response(
          JSON.stringify({ error: 'Erro ao salvar código no produto' }),
          {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const publicUrl =
        Deno.env.get('PUBLIC_URL') || 'https://afiliados-inteligentes.com';

      return new Response(
        JSON.stringify({
          link_curto_codigo: code,
          link_curto_url: `${publicUrl}/r/${code}`,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('Erro ao gerar código curto:', error);
      return new Response(
        JSON.stringify({
          error: error instanceof Error ? error.message : 'Erro interno',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  }

  // 2. ROTA DE REDIRECIONAMENTO E CLIQUE: GET /r/:codigo
  if (req.method === 'GET') {
    const pathParts = url.pathname.split('/');

    // Formato esperado: /r/:codigo
    if (pathParts.length < 3 || pathParts[1] !== 'r' || !pathParts[2]) {
      return new Response(JSON.stringify({ error: 'Rota inválida' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const code = pathParts[2];

    try {
      // Buscar produto associado ao código curto
      const { data: produto, error: produtoError } = await supabase
        .from('produtos')
        .select('id, usuario_id, link_original, link_afiliado')
        .eq('link_curto_codigo', code)
        .maybeSingle<Produto>();

      if (produtoError) {
        console.error('Erro ao buscar produto:', produtoError);
        return new Response(null, {
          status: 302,
          headers: { Location: 'https://afiliados-inteligentes.com/erro' },
        });
      }

      if (!produto) {
        return new Response(
          JSON.stringify({ error: 'Produto não encontrado' }),
          {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // Prioriza link_afiliado se existir; caso contrário usa link_original
      const targetUrl = produto.link_afiliado || produto.link_original;

      // Obter informações da requisição para rastreamento de clique
      const ip =
        req.headers.get('x-forwarded-for') ||
        req.headers.get('x-real-ip') ||
        '';
      const userAgent = req.headers.get('user-agent') || '';
      const referrer = req.headers.get('referer') || '';

      // Tenta registrar o clique sem falhar o redirecionamento principal caso ocorra algum erro
      try {
        const ipHash = await generateIpHash(ip);
        const isDuplicate = await isDuplicateClick(produto.id, ipHash);

        if (!isDuplicate) {
          await recordClick(
            produto.usuario_id,
            produto.id,
            ipHash,
            userAgent,
            referrer
          );
        }
      } catch (clickError) {
        console.error('Erro ao registrar clique:', clickError);
      }

      // Redirecionamento final (regra de ouro: sempre redirecionar)
      return new Response(null, {
        status: 302,
        headers: { Location: targetUrl },
      });
    } catch (error) {
      console.error('Erro no redirect-link:', error);
      return new Response(null, {
        status: 302,
        headers: { Location: 'https://afiliados-inteligentes.com/erro' },
      });
    }
  }

  // Rota ou método não suportado
  return new Response(
    JSON.stringify({ error: 'Método não permitido ou rota inválida' }),
    {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    }
  );
});
