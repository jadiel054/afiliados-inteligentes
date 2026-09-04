// ============================================
// EDGE FUNCTION: REDIRECT-LINK
// Gera código curto e redireciona para o link original
// ============================================

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { nanoid } from 'https://esm.sh/nanoid@5.0.6';

// Configuração do Supabase
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Tamanho do código curto (8 caracteres base62)
const CODE_LENGTH = 8;

// Criar cliente Supabase com service role
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Função para gerar código curto único
async function generateUniqueCode(): Promise<string> {
  let attempts = 0;
  const maxAttempts = 5;

  while (attempts < maxAttempts) {
    const code = nanoid(CODE_LENGTH);
    
    // Verificar se código já existe
    const { data, error } = await supabase
      .from('produtos')
      .select('id')
      .eq('link_curto_codigo', code)
      .maybeSingle();
    
    if (error) {
      console.error('Erro ao verificar código:', error);
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

// Função para gravar evento de clique
async function recordClick(
  produtoId: string,
  ipHash: string,
  userAgent: string,
  referrer: string
): Promise<void> {
  const { error } = await supabase
    .from('eventos')
    .insert({
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

// Função para gerar ip_hash (SHA-256 do IP + salt)
async function generateIpHash(ip: string): Promise<string> {
  // Obter salt do Vault
  const salt = Deno.env.get('VAULT_SALT') || 'default-salt';
  
  // Criar hash simples (em produção, usar SHA-256 real)
  const hash = crypto
    .createHash('sha256')
    .update(ip + salt)
    .toString('hex');
  
  return hash;
}

// Função para deduplicação de cliques
async function isDuplicateClick(
  produtoId: string,
  ipHash: string
): Promise<boolean> {
  const thirtySecondsAgo = new Date(Date.now() - 30000); // 30 segundos atrás
  
  const { data, error } = await supabase
    .from('eventos')
    .select('id')
    .eq('produto_id', produtoId)
    .eq('tipo', 'clique')
    .eq('ip_hash', ipHash)
    .gte('created_at', thirtySecondsAgo.toISOString())
    .maybeSingle();
  
  if (error) {
    console.error('Erro ao verificar duplicação:', error);
    return false;
  }
  
  return !!data;
}

// Handler principal
serve(async (req) => {
  try {
    const { pathname } = new URL(req.url);
    const pathParts = pathname.split('/');
    
    // Extrair código do path /r/:codigo
    if (pathParts.length < 3 || pathParts[1] !== 'r') {
      return new Response(JSON.stringify({ error: 'Rota inválida' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    const code = pathParts[2];
    
    // Buscar produto pelo código curto
    const { data: produto, error: produtoError } = await supabase
      .from('produtos')
      .select('*, usuario:auth.users(id)')
      .eq('link_curto_codigo', code)
      .maybeSingle();
    
    if (produtoError) {
      console.error('Erro ao buscar produto:', produtoError);
      // Redirecionar mesmo assim (regra de ouro: nunca perder uma venda)
      return new Response(null, {
        status: 302,
        headers: { Location: 'https://afiliados-inteligentes.com/erro' },
      });
    }
    
    if (!produto) {
      return new Response(JSON.stringify({ error: 'Produto não encontrado' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    // Obter IP do cliente
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || '';
    const userAgent = req.headers.get('user-agent') || '';
    const referrer = req.headers.get('referer') || '';
    
    // Gerar ip_hash
    const ipHash = await generateIpHash(ip);
    
    // Verificar se é clique duplicado (mesmo ip_hash + mesmo produto dentro de 30 segundos)
    const isDuplicate = await isDuplicateClick(produto.id, ipHash);
    
    if (!isDuplicate) {
      // Gravar evento de clique
      await recordClick(produto.id, ipHash, userAgent, referrer);
    }
    
    // Redirecionar para o link original (regra de ouro: SEMPRE redirecionar)
    return new Response(null, {
      status: 302,
      headers: { Location: produto.link_original },
    });
    
  } catch (error) {
    console.error('Erro no redirect-link:', error);
    // Redirecionar mesmo em caso de erro
    return new Response(null, {
      status: 302,
      headers: { Location: 'https://afiliados-inteligentes.com/erro' },
    });
  }
});

// Função para gerar código curto para novo produto (chamada pelo frontend)
// Esta função será chamada via POST /r/gerar
serve(async (req) => {
  if (req.method === 'POST' && new URL(req.url).pathname === '/r/gerar') {
    try {
      const { produto_id, link_original } = await req.json();
      
      if (!produto_id || !link_original) {
        return new Response(JSON.stringify({ error: 'produto_id e link_original são obrigatórios' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      // Gerar código único
      const code = await generateUniqueCode();
      
      // Atualizar produto com o código
      const { error: updateError } = await supabase
        .from('produtos')
        .update({ link_curto_codigo: code })
        .eq('id', produto_id);
      
      if (updateError) {
        console.error('Erro ao atualizar produto:', updateError);
        return new Response(JSON.stringify({ error: 'Erro ao salvar código' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      
      return new Response(JSON.stringify({
        link_curto_codigo: code,
        link_curto_url: `${Deno.env.get('PUBLIC_URL') || 'https://afiliados-inteligentes.com'}/r/${code}`,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
      
    } catch (error) {
      console.error('Erro ao gerar código:', error);
      return new Response(JSON.stringify({ error: 'Erro interno' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }
});
