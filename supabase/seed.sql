-- ============================================
-- seed.sql
-- Dados de teste para desenvolvimento
-- ============================================

-- Inserir plataformas
INSERT INTO plataformas (slug, nome, cor_hex, ativo) VALUES
  ('shopee', 'Shopee', '#F57224', true),
  ('mercado-livre', 'Mercado Livre', '#FFE600', true),
  ('magalu', 'Magalu', '#00A8E8', true),
  ('aliexpress', 'AliExpress', '#FF6600', true)
ON CONFLICT (slug) DO NOTHING;

-- Função para gerar código curto único
CREATE OR REPLACE FUNCTION gerar_codigo_curto()
RETURNS TEXT AS $$
DECLARE
  codigo TEXT;
  caracteres TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  i INT;
  tentativas INT := 0;
BEGIN
  LOOP
    codigo := '';
    FOR i IN 1..8 LOOP
      codigo := codigo || substr(characteres, floor(random() * length(characteres)) + 1, 1);
    END LOOP;
    
    -- Verificar se código já existe
    IF NOT EXISTS (SELECT 1 FROM produtos WHERE link_curto_codigo = codigo) THEN
      RETURN codigo;
    END IF;
    
    tentativas := tentativas + 1;
    IF tentativas >= 5 THEN
      RAISE EXCEPTION 'Não foi possível gerar código único após 5 tentativas';
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Função para gerar salt para vault
CREATE OR REPLACE FUNCTION gerar_salt()
RETURNS TEXT AS $$
DECLARE
  salt TEXT;
  caracteres TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  i INT;
BEGIN
  salt := '';
  FOR i IN 1..32 LOOP
    salt := salt || substr(characteres, floor(random() * length(characteres)) + 1, 1);
  END LOOP;
  RETURN salt;
END;
$$ LANGUAGE plpgsql;

-- Função para inserir usuário de teste e seus dados
CREATE OR REPLACE FUNCTION inserir_usuario_teste(p_email TEXT, p_senha TEXT, p_nome TEXT)
RETURNS UUID AS $$
DECLARE
  usuario_id UUID;
  usuario_record RECORD;
  i INT;
  produto_id UUID;
  data_evento TIMESTAMPTZ;
  dias_atras INT;
BEGIN
  -- Obter ou criar usuário (simulação - na prática, usuário é criado via auth.users)
  -- Vamos usar um ID fixo para o usuário de teste
  usuario_id := '00000000-0000-0000-0000-000000000001'::UUID;
  
  -- Inserir salt para o usuário
  INSERT INTO vault_salt (usuario_id, salt) VALUES 
    (usuario_id, gerar_salt())
  ON CONFLICT (usuario_id) DO NOTHING;
  
  -- Inserir configuração do agente
  INSERT INTO config_agente (usuario_id, modo, pontuacao_propor, pontuacao_agir, comissao_minima, valor_maximo, rodar_a_cada_horas, max_produtos_dia, horario_inicio, horario_fim, categorias)
  VALUES 
    (usuario_id, 'semi_autonomo', 75, 85, 5, 500, 6, 10, 8, 22, ARRAY['beleza','cuidados-pessoais','maquiagem','pele','cabelo','perfumaria'])
  ON CONFLICT (usuario_id) DO NOTHING;
  
  -- Inserir provedores de IA (simulação)
  INSERT INTO provedores_ia (usuario_id, nome, provedor, modelo, ativo, ordem_fallback) VALUES
    (usuario_id, 'Groq Principal', 'groq', 'llama-3.3-70b-versatile', true, 1),
    (usuario_id, 'Ollama Local', 'ollama', 'llama3.3', false, 2)
  ON CONFLICT (usuario_id, ordem_fallback) DO NOTHING;
  
  -- Inserir contas de plataforma
  INSERT INTO contas_plataforma (usuario_id, plataforma_id, id_afiliado, status) VALUES
    (usuario_id, (SELECT id FROM plataformas WHERE slug = 'shopee'), 'AFF_123456', 'conectado'),
    (usuario_id, (SELECT id FROM plataformas WHERE slug = 'mercado-livre'), 'ML_AFF_789012', 'conectado'),
    (usuario_id, (SELECT id FROM plataformas WHERE slug = 'magalu'), 'MAG_AFF_345678', 'desconectado'),
    (usuario_id, (SELECT id FROM plataformas WHERE slug = 'aliexpress'), 'AE_AFF_901234', 'conectado')
  ON CONFLICT (usuario_id, plataforma_id) DO NOTHING;
  
  -- Inserir ~15 produtos
  -- Produtos para Shopee
  FOR i IN 1..5 LOOP
    INSERT INTO produtos (usuario_id, nome, categoria, plataforma_id, valor, comissao_percent, link_original, link_curto_codigo, imagem_url, status, origem)
    VALUES (
      usuario_id,
      CASE i
        WHEN 1 THEN 'Kit de Maquiagem Profissional'
        WHEN 2 THEN 'Shampoo Antiqueda 400ml'
        WHEN 3 THEN 'Perfume Feminino 100ml'
        WHEN 4 THEN 'Hidratante Corporal 200ml'
        WHEN 5 THEN 'Escova de Cabelo Profissional'
      END,
      CASE i
        WHEN 1 THEN 'maquiagem'
        WHEN 2 THEN 'cabelo'
        WHEN 3 THEN 'perfumaria'
        WHEN 4 THEN 'pele'
        WHEN 5 THEN 'cuidados-pessoais'
      END,
      (SELECT id FROM plataformas WHERE slug = 'shopee'),
      CASE i
        WHEN 1 THEN 299.90
        WHEN 2 THEN 89.90
        WHEN 3 THEN 199.90
        WHEN 4 THEN 59.90
        WHEN 5 THEN 45.90
      END,
      CASE i
        WHEN 1 THEN 15.00
        WHEN 2 THEN 8.00
        WHEN 3 THEN 20.00
        WHEN 4 THEN 10.00
        WHEN 5 THEN 12.00
      END,
      CASE i
        WHEN 1 THEN 'https://shopee.com.br/produto1'
        WHEN 2 THEN 'https://shopee.com.br/produto2'
        WHEN 3 THEN 'https://shopee.com.br/produto3'
        WHEN 4 THEN 'https://shopee.com.br/produto4'
        WHEN 5 THEN 'https://shopee.com.br/produto5'
      END,
      gerar_codigo_curto(),
      CASE i
        WHEN 1 THEN 'https://imagens.shopee.com.br/produto1.jpg'
        WHEN 2 THEN 'https://imagens.shopee.com.br/produto2.jpg'
        WHEN 3 THEN 'https://imagens.shopee.com.br/produto3.jpg'
        WHEN 4 THEN 'https://imagens.shopee.com.br/produto4.jpg'
        WHEN 5 THEN 'https://imagens.shopee.com.br/produto5.jpg'
      END,
      'ativo',
      'manual'
    )
    RETURNING id INTO produto_id;
    
    -- Inserir link afiliado
    UPDATE produtos SET link_afiliado = 'https://shopee.com.br/affiliate/' || id_afiliado || '/produto' || i 
    WHERE id = produto_id;
  END LOOP;
  
  -- Produtos para Mercado Livre
  FOR i IN 6..10 LOOP
    INSERT INTO produtos (usuario_id, nome, categoria, plataforma_id, valor, comissao_percent, link_original, link_curto_codigo, imagem_url, status, origem)
    VALUES (
      usuario_id,
      CASE i
        WHEN 6 THEN 'Base Líquida Matte'
        WHEN 7 THEN 'Condicionador Capilar'
        WHEN 8 THEN 'Desodorante Roll-on'
        WHEN 9 THEN 'Sabonete Facial'
        WHEN 10 THEN 'Pente de Cabelo'
      END,
      CASE i
        WHEN 6 THEN 'maquiagem'
        WHEN 7 THEN 'cabelo'
        WHEN 8 THEN 'cuidados-pessoais'
        WHEN 9 THEN 'pele'
        WHEN 10 THEN 'cuidados-pessoais'
      END,
      (SELECT id FROM plataformas WHERE slug = 'mercado-livre'),
      CASE i
        WHEN 6 THEN 129.90
        WHEN 7 THEN 39.90
        WHEN 8 THEN 24.90
        WHEN 9 THEN 19.90
        WHEN 10 THEN 15.90
      END,
      CASE i
        WHEN 6 THEN 12.00
        WHEN 7 THEN 6.00
        WHEN 8 THEN 5.00
        WHEN 9 THEN 8.00
        WHEN 10 THEN 10.00
      END,
      CASE i
        WHEN 6 THEN 'https://mercadolivre.com.br/produto6'
        WHEN 7 THEN 'https://mercadolivre.com.br/produto7'
        WHEN 8 THEN 'https://mercadolivre.com.br/produto8'
        WHEN 9 THEN 'https://mercadolivre.com.br/produto9'
        WHEN 10 THEN 'https://mercadolivre.com.br/produto10'
      END,
      gerar_codigo_curto(),
      CASE i
        WHEN 6 THEN 'https://imagens.mercadolivre.com.br/produto6.jpg'
        WHEN 7 THEN 'https://imagens.mercadolivre.com.br/produto7.jpg'
        WHEN 8 THEN 'https://imagens.mercadolivre.com.br/produto8.jpg'
        WHEN 9 THEN 'https://imagens.mercadolivre.com.br/produto9.jpg'
        WHEN 10 THEN 'https://imagens.mercadolivre.com.br/produto10.jpg'
      END,
      CASE i
        WHEN 8 THEN 'pausado'
        ELSE 'ativo'
      END,
      'manual'
    )
    RETURNING id INTO produto_id;
    
    -- Inserir link afiliado
    UPDATE produtos SET link_afiliado = 'https://mercadolivre.com.br/affiliate/' || id_afiliado || '/produto' || (i-5) 
    WHERE id = produto_id;
  END LOOP;
  
  -- Produtos para AliExpress
  FOR i IN 11..15 LOOP
    INSERT INTO produtos (usuario_id, nome, categoria, plataforma_id, valor, comissao_percent, link_original, link_curto_codigo, imagem_url, status, origem)
    VALUES (
      usuario_id,
      CASE i
        WHEN 11 THEN 'Paleta de Sombras 12 Cores'
        WHEN 12 THEN 'Mascara de Cílios'
        WHEN 13 THEN 'Batons Líquidos Kit 6 Unidades'
        WHEN 14 THEN 'Pincéis de Maquiagem'
        WHEN 15 THEN 'Corretivo Líquido'
      END,
      CASE i
        WHEN 11 THEN 'maquiagem'
        WHEN 12 THEN 'maquiagem'
        WHEN 13 THEN 'maquiagem'
        WHEN 14 THEN 'maquiagem'
        WHEN 15 THEN 'maquiagem'
      END,
      (SELECT id FROM plataformas WHERE slug = 'aliexpress'),
      CASE i
        WHEN 11 THEN 89.90
        WHEN 12 THEN 45.90
        WHEN 13 THEN 129.90
        WHEN 14 THEN 59.90
        WHEN 15 THEN 39.90
      END,
      CASE i
        WHEN 11 THEN 10.00
        WHEN 12 THEN 8.00
        WHEN 13 THEN 15.00
        WHEN 14 THEN 10.00
        WHEN 15 THEN 12.00
      END,
      CASE i
        WHEN 11 THEN 'https://aliexpress.com/produto11'
        WHEN 12 THEN 'https://aliexpress.com/produto12'
        WHEN 13 THEN 'https://aliexpress.com/produto13'
        WHEN 14 THEN 'https://aliexpress.com/produto14'
        WHEN 15 THEN 'https://aliexpress.com/produto15'
      END,
      gerar_codigo_curto(),
      CASE i
        WHEN 11 THEN 'https://imagens.aliexpress.com/produto11.jpg'
        WHEN 12 THEN 'https://imagens.aliexpress.com/produto12.jpg'
        WHEN 13 THEN 'https://imagens.aliexpress.com/produto13.jpg'
        WHEN 14 THEN 'https://imagens.aliexpress.com/produto14.jpg'
        WHEN 15 THEN 'https://imagens.aliexpress.com/produto15.jpg'
      END,
      'ativo',
      'manual'
    )
    RETURNING id INTO produto_id;
    
    -- Inserir link afiliado
    UPDATE produtos SET link_afiliado = 'https://aliexpress.com/affiliate/' || id_afiliado || '/produto' || (i-10) 
    WHERE id = produto_id;
  END LOOP;
  
  -- Inserir ~300 eventos dos últimos 30 dias
  -- Para cada produto, gerar eventos de cliques e vendas
  FOR produto_record IN SELECT id, usuario_id, plataforma_id FROM produtos WHERE usuario_id = usuario_id LOOP
    -- Gerar entre 5 e 40 eventos por produto
    FOR j IN 1..(floor(random() * 36) + 5) LOOP
      data_evento := now() - (floor(random() * 30) || ' days')::text::interval;
      
      -- Decidir tipo de evento (80% cliques, 15% vendas, 5% reembolsos)
      IF random() < 0.80 THEN
        -- Clique
        INSERT INTO eventos (usuario_id, produto_id, tipo, ip_hash, user_agent, referrer, ocorrido_em, created_at)
        VALUES (
          produto_record.usuario_id,
          produto_record.id,
          'clique',
          'hash_' || floor(random() * 1000000), -- Simulação de ip_hash
          CASE floor(random() * 3)
            WHEN 0 THEN 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            WHEN 1 THEN 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)'
            WHEN 2 THEN 'Mozilla/5.0 (Linux; Android 11; SM-A505FN)'
          END,
          CASE floor(random() * 4)
            WHEN 0 THEN 'https://google.com'
            WHEN 1 THEN 'https://facebook.com'
            WHEN 2 THEN 'https://instagram.com'
            WHEN 3 THEN 'direct'
          END,
          data_evento,
          data_evento
        );
      ELSIF random() < 0.95 THEN
        -- Venda
        INSERT INTO eventos (usuario_id, produto_id, tipo, valor_bruto, valor_comissao, moeda, id_externo, ocorrido_em, created_at)
        VALUES (
          produto_record.usuario_id,
          produto_record.id,
          'venda',
          (SELECT valor FROM produtos WHERE id = produto_record.id),
          (SELECT (valor * comissao_percent / 100) FROM produtos WHERE id = produto_record.id),
          'BRL',
          'venda_' || floor(random() * 1000000),
          data_evento,
          data_evento
        );
      ELSE
        -- Reembolso (apenas se houver venda)
        IF EXISTS (SELECT 1 FROM eventos WHERE produto_id = produto_record.id AND tipo = 'venda' AND ocorrido_em >= data_evento - interval '7 days') THEN
          INSERT INTO eventos (usuario_id, produto_id, tipo, valor_bruto, valor_comissao, moeda, id_externo, ocorrido_em, created_at)
          VALUES (
            produto_record.usuario_id,
            produto_record.id,
            'reembolso',
            (SELECT valor FROM produtos WHERE id = produto_record.id),
            -(SELECT (valor * comissao_percent / 100) FROM produtos WHERE id = produto_record.id),
            'BRL',
            'reembolso_' || floor(random() * 1000000),
            data_evento,
            data_evento
          );
        END IF;
      END IF;
    END LOOP;
  END LOOP;
  
  -- Inserir alguns custos
  INSERT INTO custos (usuario_id, descricao, tipo, valor, data) VALUES
    (usuario_id, 'Google Ads - Campanha 1', 'anuncio', 250.00, CURRENT_DATE - interval '15 days'),
    (usuario_id, 'Google Ads - Campanha 2', 'anuncio', 180.00, CURRENT_DATE - interval '10 days'),
    (usuario_id, 'Ferramenta de SEO', 'ferramenta', 99.90, CURRENT_DATE - interval '5 days'),
    (usuario_id, 'Imposto - MEI', 'imposto', 50.00, CURRENT_DATE),
    (usuario_id, 'Outros custos', 'outro', 30.00, CURRENT_DATE - interval '20 days');
  
  -- Inserir algumas notificações
  INSERT INTO notificacoes (usuario_id, tipo, titulo, mensagem, lida) VALUES
    (usuario_id, 'venda', 'Nova Venda!', 'Você recebeu uma nova venda do produto Kit de Maquiagem Profissional', false),
    (usuario_id, 'agente', 'Nova Proposta', 'O agente encontrou um novo produto com pontuação 85', false),
    (usuario_id, 'sistema', 'Sincronização', 'Sincronização automática concluída com sucesso', true),
    (usuario_id, 'resumo', 'Resumo Diário', 'Hoje você teve 15 cliques e 2 vendas', false);
  
  -- Inserir logs de agente
  INSERT INTO log_agente (usuario_id, acao, resultado, mensagem) VALUES
    (usuario_id, 'varredura', 'sucesso', 'Varredura concluída - 5 novos produtos analisados'),
    (usuario_id, 'pontuou', 'sucesso', 'Produto pontuado: 85 pontos'),
    (usuario_id, 'propos', 'sucesso', 'Proposta criada para o usuário');
  
  RETURN usuario_id;
END;
$$ LANGUAGE plpgsql;

-- Chamar função para inserir usuário de teste
SELECT inserir_usuario_teste('teste@exemplo.com', 'senha123', 'Usuário Teste');
