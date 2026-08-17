-- ============================================================
-- BANCO DE DADOS DO SIMULADOR
-- Copie TODO este arquivo e cole no "SQL Editor" do Supabase,
-- depois clique em "Run". Pode rodar mais de uma vez sem quebrar.
-- ============================================================

-- Saldo inicial ficticio de todo mundo que se cadastra
create or replace function saldo_inicial()
returns numeric language sql immutable as $$ select 100000.00::numeric $$;


-- ------------------------------------------------------------
-- PERFIS: um por usuario, guarda o dinheiro ficticio em caixa
-- ------------------------------------------------------------
create table if not exists public.perfis (
  id                   uuid primary key references auth.users(id) on delete cascade,
  apelido              text,
  saldo                numeric(14,2) not null default saldo_inicial(),
  dias_seguidos        integer not null default 0,
  ultimo_acesso        date,
  perfil_investidor    text,
  mes_referencia        text,
  patrimonio_inicio_mes numeric(14,2),
  termos_aceitos_em     timestamptz,
  criado_em            timestamptz not null default now()
);

alter table public.perfis add column if not exists dias_seguidos integer not null default 0;
alter table public.perfis add column if not exists ultimo_acesso date;
alter table public.perfis add column if not exists perfil_investidor text;
alter table public.perfis add column if not exists mes_referencia text;
alter table public.perfis add column if not exists patrimonio_inicio_mes numeric(14,2);
alter table public.perfis add column if not exists termos_aceitos_em timestamptz;

alter table public.perfis enable row level security;

drop policy if exists "perfil proprio: ler" on public.perfis;
create policy "perfil proprio: ler" on public.perfis
  for select using (auth.uid() = id);

drop policy if exists "perfil proprio: atualizar" on public.perfis;
create policy "perfil proprio: atualizar" on public.perfis
  for update using (auth.uid() = id);


-- ------------------------------------------------------------
-- POSICOES: o que o usuario tem em carteira agora
-- ------------------------------------------------------------
create table if not exists public.posicoes (
  id            uuid primary key default gen_random_uuid(),
  usuario_id    uuid not null references auth.users(id) on delete cascade,
  ticker        text not null,
  quantidade    integer not null check (quantidade > 0),
  preco_medio   numeric(14,2) not null check (preco_medio > 0),
  atualizado_em timestamptz not null default now(),
  unique (usuario_id, ticker)
);

create index if not exists posicoes_usuario_idx on public.posicoes(usuario_id);

alter table public.posicoes enable row level security;

drop policy if exists "posicoes proprias" on public.posicoes;
create policy "posicoes proprias" on public.posicoes
  for select using (auth.uid() = usuario_id);


-- ------------------------------------------------------------
-- TRANSACOES: historico de tudo que foi comprado, vendido e
-- recebido de dividendo
-- ------------------------------------------------------------
create table if not exists public.transacoes (
  id          uuid primary key default gen_random_uuid(),
  usuario_id  uuid not null references auth.users(id) on delete cascade,
  ticker      text not null,
  tipo        text not null check (tipo in ('compra','venda','dividendo')),
  quantidade  integer not null check (quantidade > 0),
  preco       numeric(14,2) not null check (preco > 0),
  total       numeric(14,2) not null,
  imposto     numeric(14,2) not null default 0,
  criado_em   timestamptz not null default now()
);

-- Se a tabela ja existia (de uma versao anterior), garante as colunas novas
-- e afrouxa o check de tipo pra aceitar 'dividendo'.
alter table public.transacoes add column if not exists imposto numeric(14,2) not null default 0;
alter table public.transacoes drop constraint if exists transacoes_tipo_check;
alter table public.transacoes add constraint transacoes_tipo_check check (tipo in ('compra','venda','dividendo'));

create index if not exists transacoes_usuario_idx
  on public.transacoes(usuario_id, criado_em desc);

alter table public.transacoes enable row level security;

drop policy if exists "transacoes proprias" on public.transacoes;
create policy "transacoes proprias" on public.transacoes
  for select using (auth.uid() = usuario_id);


-- ------------------------------------------------------------
-- ORDENS PENDENTES: ordens limitadas (compra/venda so quando o
-- preco atingir um alvo), aguardando serem executadas
-- ------------------------------------------------------------
create table if not exists public.ordens_pendentes (
  id                    uuid primary key default gen_random_uuid(),
  usuario_id            uuid not null references auth.users(id) on delete cascade,
  ticker                text not null,
  tipo                  text not null check (tipo in ('comprar','vender')),
  quantidade            integer not null check (quantidade > 0),
  preco_alvo            numeric(14,2) check (preco_alvo > 0),
  status                text not null default 'pendente' check (status in ('pendente','executada','cancelada')),
  criado_em             timestamptz not null default now(),
  executada_em          timestamptz,
  executar_na_abertura  boolean not null default false
);

-- preco_alvo ficou opcional: ordem "na abertura" nao tem preco-alvo, so
-- espera o pregao abrir e executa pelo preco de mercado do momento.
alter table public.ordens_pendentes alter column preco_alvo drop not null;
alter table public.ordens_pendentes add column if not exists executar_na_abertura boolean not null default false;
alter table public.ordens_pendentes drop constraint if exists ordens_pendentes_alvo_ou_abertura;
alter table public.ordens_pendentes add constraint ordens_pendentes_alvo_ou_abertura
  check (executar_na_abertura or preco_alvo is not null);

create index if not exists ordens_pendentes_usuario_idx
  on public.ordens_pendentes(usuario_id, status);

alter table public.ordens_pendentes enable row level security;

drop policy if exists "ordens proprias" on public.ordens_pendentes;
create policy "ordens proprias" on public.ordens_pendentes
  for select using (auth.uid() = usuario_id);


-- ------------------------------------------------------------
-- DIVIDENDOS CREDITADOS: evita creditar o mesmo pagamento 2x
-- ------------------------------------------------------------
create table if not exists public.dividendos_creditados (
  id             uuid primary key default gen_random_uuid(),
  usuario_id     uuid not null references auth.users(id) on delete cascade,
  ticker         text not null,
  data_pagamento date not null,
  criado_em      timestamptz not null default now(),
  unique (usuario_id, ticker, data_pagamento)
);

alter table public.dividendos_creditados enable row level security;

drop policy if exists "dividendos proprios" on public.dividendos_creditados;
create policy "dividendos proprios" on public.dividendos_creditados
  for select using (auth.uid() = usuario_id);


-- ------------------------------------------------------------
-- Cria o perfil automaticamente quando alguem se cadastra
-- ------------------------------------------------------------
create or replace function public.criar_perfil()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.perfis (id, apelido)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists ao_criar_usuario on auth.users;
create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.criar_perfil();


-- ------------------------------------------------------------
-- GARANTIR PERFIL: cria o perfil se por algum motivo o gatilho acima
-- nao rodou (ex: login social/OAuth em alguns fluxos nao dispara
-- "after insert" do mesmo jeito). Chamada toda vez que a pagina do
-- simulador carrega, antes de ler o saldo, assim ninguem fica preso
-- vendo R$ 0,00 por causa de um perfil que nunca foi criado.
-- ------------------------------------------------------------
create or replace function public.garantir_perfil()
returns json language plpgsql security definer set search_path = public as $$
declare
  v_usuario uuid := auth.uid();
  v_email   text;
begin
  if v_usuario is null then
    raise exception 'Voce precisa estar logado.';
  end if;

  select email into v_email from auth.users where id = v_usuario;

  insert into public.perfis (id, apelido)
  values (v_usuario, split_part(coalesce(v_email, ''), '@', 1))
  on conflict (id) do nothing;

  return json_build_object('ok', true);
end $$;

-- ------------------------------------------------------------
-- ACEITAR TERMOS: registrado no cadastro por email/senha, no login
-- com Google (que pula o formulario com o checkbox) e na confirmacao
-- por email. Idempotente: so grava na primeira vez.
-- ------------------------------------------------------------
create or replace function public.aceitar_termos()
returns json language plpgsql security definer set search_path = public as $$
declare
  v_usuario uuid := auth.uid();
begin
  if v_usuario is null then
    raise exception 'Voce precisa estar logado.';
  end if;

  update public.perfis
    set termos_aceitos_em = now()
    where id = v_usuario and termos_aceitos_em is null;

  return json_build_object('ok', true);
end $$;

revoke all on function public.aceitar_termos() from public;
grant execute on function public.aceitar_termos() to authenticated;


-- ------------------------------------------------------------
-- COTACOES: cache de preco atualizada dentro do proprio banco (via
-- extensao http, direto na brapi), nunca confiando no preco que o
-- navegador manda. E o que fecha a brecha de "preco forjado", comprar
-- e vender descobrem o preco sozinhos, chamando garantir_cotacao().
-- ------------------------------------------------------------
create extension if not exists http with schema extensions;

create table if not exists public.ativos_permitidos (
  ticker  text primary key,
  mercado text not null default 'br' check (mercado in ('br', 'us'))
);

alter table public.ativos_permitidos add column if not exists mercado text not null default 'br';
alter table public.ativos_permitidos drop constraint if exists ativos_permitidos_mercado_check;
alter table public.ativos_permitidos add constraint ativos_permitidos_mercado_check check (mercado in ('br', 'us'));

insert into public.ativos_permitidos (ticker, mercado) values
  ('PETR4', 'br'), ('VALE3', 'br'), ('ITUB4', 'br'), ('BBDC4', 'br'), ('BBAS3', 'br'), ('ABEV3', 'br'),
  ('WEGE3', 'br'), ('MGLU3', 'br'), ('B3SA3', 'br'), ('RENT3', 'br'), ('SUZB3', 'br'), ('RAIL3', 'br'),
  ('PRIO3', 'br'), ('EQTL3', 'br'), ('RADL3', 'br'), ('LREN3', 'br'),
  -- FIIs (Fundos Imobiliarios): tickers da B3 tambem, terminados em 11.
  ('HGLG11', 'br'), ('MXRF11', 'br'), ('KNRI11', 'br'), ('XPML11', 'br'), ('VISC11', 'br'),
  ('BTLG11', 'br'), ('HGRE11', 'br'), ('RBRR11', 'br'), ('VILG11', 'br'), ('HFOF11', 'br'),
  ('AAPL', 'us'), ('MSFT', 'us'), ('GOOGL', 'us'), ('AMZN', 'us'),
  ('NVDA', 'us'), ('TSLA', 'us'), ('META', 'us'), ('JPM', 'us'),
  ('KO', 'us'), ('DIS', 'us'), ('NFLX', 'us'), ('V', 'us')
on conflict (ticker) do update set mercado = excluded.mercado;

alter table public.ativos_permitidos enable row level security;
drop policy if exists "ativos: leitura publica" on public.ativos_permitidos;
create policy "ativos: leitura publica" on public.ativos_permitidos for select using (true);

create table if not exists public.cotacoes (
  ticker        text primary key,
  preco         numeric(14,2) not null,
  variacao      numeric(6,2) not null default 0,
  logo          text,
  atualizado_em timestamptz not null default now()
);

alter table public.cotacoes add column if not exists logo text;

alter table public.cotacoes enable row level security;
drop policy if exists "cotacoes: leitura publica" on public.cotacoes;
create policy "cotacoes: leitura publica" on public.cotacoes for select using (true);

-- Guarda o token da brapi dentro do banco, nunca exposto por API, sem
-- policy nenhuma (RLS ligado, zero policies = ninguem le por fora de uma
-- funcao security definer). Depois de rodar este arquivo, insira o seu
-- token manualmente uma vez (nao commitar o valor real no repositorio):
--   insert into public.segredos (chave, valor) values ('brapi_token', 'SEU_TOKEN_AQUI')
--   on conflict (chave) do update set valor = excluded.valor;
create table if not exists public.segredos (
  chave text primary key,
  valor text not null
);

alter table public.segredos enable row level security;

-- Cache da cotacao do dolar (frankfurter.app, gratuito, sem chave),
-- usada pra converter acoes americanas pra reais.
create table if not exists public.cotacao_fx (
  par           text primary key,
  taxa          numeric(10,4) not null,
  atualizado_em timestamptz not null default now()
);

alter table public.cotacao_fx enable row level security;
drop policy if exists "fx: leitura publica" on public.cotacao_fx;
create policy "fx: leitura publica" on public.cotacao_fx for select using (true);

create or replace function public.garantir_fx_usd_brl()
returns numeric language plpgsql security definer set search_path = public, extensions as $$
declare
  v_taxa     numeric;
  v_idade    interval;
  v_resposta jsonb;
begin
  select taxa, now() - atualizado_em into v_taxa, v_idade
  from public.cotacao_fx where par = 'USD-BRL';

  if v_taxa is not null and v_idade < interval '30 minutes' then
    return v_taxa;
  end if;

  begin
    select content::jsonb into v_resposta
    from extensions.http_get('https://api.frankfurter.app/latest?from=USD&to=BRL');

    v_taxa := (v_resposta -> 'rates' ->> 'BRL')::numeric;

    if v_taxa is not null and v_taxa > 0 then
      insert into public.cotacao_fx (par, taxa, atualizado_em)
      values ('USD-BRL', v_taxa, now())
      on conflict (par) do update set taxa = excluded.taxa, atualizado_em = excluded.atualizado_em;
      return v_taxa;
    end if;
  exception when others then
    return v_taxa;
  end;

  return v_taxa;
end $$;

revoke all on function public.garantir_fx_usd_brl() from public;
grant execute on function public.garantir_fx_usd_brl() to authenticated;

-- O mercado e detectado pelo FORMATO do ticker (B3 sempre termina em
-- digito, ex PETR4; NYSE/NASDAQ e so letras, ex MSFT), nao por estar
-- cadastrado em ativos_permitidos, assim qualquer acao americana pode
-- ser negociada, nao so as curadas. B3 usa brapi; EUA usa finnhub
-- (mesmo token das noticias), convertido pra R$.
create or replace function public.garantir_cotacao(p_ticker text)
returns numeric language plpgsql security definer set search_path = public, extensions as $$
declare
  v_mercado     text;
  v_token       text;
  v_preco       numeric;
  v_preco_cache numeric;
  v_idade       interval;
  v_resposta    jsonb;
  v_variacao    numeric;
  v_fx          numeric;
  v_logo        text;
  v_prev        numeric;
begin
  select preco, now() - atualizado_em into v_preco, v_idade
  from public.cotacoes where ticker = p_ticker;
  v_preco_cache := v_preco;

  if v_preco is not null and v_idade < interval '5 minutes' then
    return v_preco;
  end if;

  if p_ticker ~ '^[A-Z]{4}[0-9]{1,2}$' then
    v_mercado := 'br';
  elsif p_ticker ~ '^[A-Z]{1,5}$' then
    v_mercado := 'us';
  else
    return null;
  end if;

  if v_mercado = 'br' then
    v_preco := null;
    select valor into v_token from public.segredos where chave = 'brapi_token';
    if v_token is not null then
      begin
        select content::jsonb into v_resposta
        from extensions.http_get(
          'https://brapi.dev/api/v2/stocks/quote?symbols=' || p_ticker || '&token=' || v_token
        );
        if not coalesce((v_resposta ->> 'error')::boolean, false) then
          v_preco := (v_resposta -> 'results' -> 0 -> 'data' ->> 'regularMarketPrice')::numeric;
          v_variacao := coalesce(
            (v_resposta -> 'results' -> 0 -> 'data' ->> 'regularMarketChangePercent')::numeric, 0);
          v_logo := v_resposta -> 'results' -> 0 -> 'data' ->> 'logourl';
        end if;
      exception when others then
        v_preco := null;
      end;
    end if;

    -- Fallback: Yahoo Finance (gratuito, sem chave, sem limite de cota
    -- conhecido), usado quando a brapi falha ou a cota mensal dela
    -- estoura (ja aconteceu: plano gratuito da brapi e de 15 mil
    -- requisicoes/mes).
    if v_preco is null or v_preco <= 0 then
      begin
        select content::jsonb into v_resposta
        from extensions.http_get(
          'https://query1.finance.yahoo.com/v8/finance/chart/' || p_ticker || '.SA?range=1d&interval=1d'
        );
        v_preco := (v_resposta -> 'chart' -> 'result' -> 0 -> 'meta' ->> 'regularMarketPrice')::numeric;
        v_prev := (v_resposta -> 'chart' -> 'result' -> 0 -> 'meta' ->> 'chartPreviousClose')::numeric;
        v_variacao := case when v_prev is not null and v_prev > 0
          then round(((v_preco - v_prev) / v_prev) * 100, 2)
          else 0
        end;
      exception when others then
        v_preco := null;
      end;
    end if;

    if v_preco is null or v_preco <= 0 then
      return v_preco_cache;
    end if;
  else
    select valor into v_token from public.segredos where chave = 'finnhub_token';
    if v_token is null then
      return v_preco;
    end if;

    begin
      select content::jsonb into v_resposta
      from extensions.http_get(
        'https://finnhub.io/api/v1/quote?symbol=' || p_ticker || '&token=' || v_token
      );
      v_preco := (v_resposta ->> 'c')::numeric;
      v_variacao := coalesce((v_resposta ->> 'dp')::numeric, 0);

      if v_preco is not null and v_preco > 0 then
        v_fx := public.garantir_fx_usd_brl();
        if v_fx is not null then
          v_preco := v_preco * v_fx;
        end if;
      end if;

      begin
        select content::jsonb ->> 'logo' into v_logo
        from extensions.http_get('https://finnhub.io/api/v1/stock/profile2?symbol=' || p_ticker || '&token=' || v_token);
      exception when others then
        v_logo := null;
      end;
    exception when others then
      return v_preco;
    end;
  end if;

  if v_preco is not null and v_preco > 0 then
    insert into public.cotacoes (ticker, preco, variacao, logo, atualizado_em)
    values (p_ticker, round(v_preco, 2), round(v_variacao, 2), v_logo, now())
    on conflict (ticker) do update
      set preco = excluded.preco, variacao = excluded.variacao,
          logo = coalesce(excluded.logo, public.cotacoes.logo),
          atualizado_em = excluded.atualizado_em;
    return round(v_preco, 2);
  end if;

  return v_preco_cache;
end $$;

-- Atualiza a cotacao dos ativos curados de uma vez (chamada pelo pg_cron
-- a cada 5 minutos em horario de pregao, ver final do arquivo). No
-- maximo uma vez por minuto, pra nao martelar as fontes.
create or replace function public.atualizar_cotacoes(p_forcar boolean default false)
returns integer language plpgsql security definer set search_path = public, extensions as $$
declare
  v_token_brapi    text;
  v_token_finnhub  text;
  v_ticker         text;
  v_mercado        text;
  v_tickers_br     text[];
  v_resposta       jsonb;
  v_item           jsonb;
  v_preco          numeric;
  v_prev           numeric;
  v_variacao       numeric;
  v_fx             numeric;
  v_logo           text;
  v_logo_existente text;
  v_mais_novo      timestamptz;
  v_contador       integer := 0;
  v_atualizados_br text[] := array[]::text[];
begin
  select max(atualizado_em) into v_mais_novo from public.cotacoes;
  if not p_forcar and v_mais_novo is not null and v_mais_novo > now() - interval '60 seconds' then
    return 0;
  end if;

  select valor into v_token_brapi from public.segredos where chave = 'brapi_token';
  select valor into v_token_finnhub from public.segredos where chave = 'finnhub_token';
  v_fx := public.garantir_fx_usd_brl();

  select array_agg(ticker) into v_tickers_br
  from public.ativos_permitidos where mercado = 'br';

  -- B3, tentativa 1: todos os tickers curados numa unica chamada a
  -- brapi (o parametro "symbols" aceita varios, separados por
  -- virgula). Bem mais barato em cota do que uma chamada por ticker
  -- (o plano gratuito e de so 15 mil requisicoes por mes).
  if v_token_brapi is not null and v_tickers_br is not null then
    begin
      select content::jsonb into v_resposta
      from extensions.http_get(
        'https://brapi.dev/api/v2/stocks/quote?symbols=' || array_to_string(v_tickers_br, ',') || '&token=' || v_token_brapi
      );

      if not coalesce((v_resposta ->> 'error')::boolean, false) then
        for v_item in select * from jsonb_array_elements(coalesce(v_resposta -> 'results', '[]'::jsonb))
        loop
          v_ticker := v_item ->> 'symbol';
          v_preco := (v_item -> 'data' ->> 'regularMarketPrice')::numeric;
          v_variacao := coalesce((v_item -> 'data' ->> 'regularMarketChangePercent')::numeric, 0);
          v_logo := v_item -> 'data' ->> 'logourl';

          if v_ticker is not null and v_preco is not null and v_preco > 0 then
            insert into public.cotacoes (ticker, preco, variacao, logo, atualizado_em)
            values (v_ticker, round(v_preco, 2), round(v_variacao, 2), v_logo, now())
            on conflict (ticker) do update
              set preco = excluded.preco,
                  variacao = excluded.variacao,
                  logo = coalesce(excluded.logo, public.cotacoes.logo),
                  atualizado_em = excluded.atualizado_em;
            v_contador := v_contador + 1;
            v_atualizados_br := v_atualizados_br || v_ticker;
          end if;
        end loop;
      end if;
    exception when others then
      null;
    end;
  end if;

  -- B3, fallback: qualquer ticker que a brapi nao tenha atualizado
  -- (token ausente, cota estourada, erro pontual) busca no Yahoo
  -- Finance (gratuito, sem chave), um por um.
  if v_tickers_br is not null then
    foreach v_ticker in array v_tickers_br loop
      if v_ticker = any(v_atualizados_br) then continue; end if;
      begin
        select content::jsonb into v_resposta
        from extensions.http_get(
          'https://query1.finance.yahoo.com/v8/finance/chart/' || v_ticker || '.SA?range=1d&interval=1d'
        );
        v_preco := (v_resposta -> 'chart' -> 'result' -> 0 -> 'meta' ->> 'regularMarketPrice')::numeric;
        v_prev := (v_resposta -> 'chart' -> 'result' -> 0 -> 'meta' ->> 'chartPreviousClose')::numeric;
        v_variacao := case when v_prev is not null and v_prev > 0
          then round(((v_preco - v_prev) / v_prev) * 100, 2)
          else 0
        end;

        if v_preco is not null and v_preco > 0 then
          insert into public.cotacoes (ticker, preco, variacao, atualizado_em)
          values (v_ticker, round(v_preco, 2), round(v_variacao, 2), now())
          on conflict (ticker) do update
            set preco = excluded.preco,
                variacao = excluded.variacao,
                atualizado_em = excluded.atualizado_em;
          v_contador := v_contador + 1;
        end if;
      exception when others then
        continue;
      end;
    end loop;
  end if;

  -- EUA: Finnhub nao tem endpoint de cotacao em lote no plano gratuito,
  -- entao continua uma chamada por ticker (quota separada e maior).
  for v_ticker, v_mercado in select ticker, mercado from public.ativos_permitidos where mercado = 'us' loop
    begin
      v_logo := null;
      if v_token_finnhub is null then continue; end if;
      select content::jsonb into v_resposta
      from extensions.http_get('https://finnhub.io/api/v1/quote?symbol=' || v_ticker || '&token=' || v_token_finnhub);
      v_preco := (v_resposta ->> 'c')::numeric;
      v_variacao := coalesce((v_resposta ->> 'dp')::numeric, 0);
      if v_preco is not null and v_fx is not null then
        v_preco := v_preco * v_fx;
      end if;

      -- O logo de uma empresa nao muda de 5 em 5 minutos: so busca de
      -- novo se ainda nao tiver um salvo, pra nao gastar chamada a toa.
      select logo into v_logo_existente from public.cotacoes where ticker = v_ticker;
      if v_logo_existente is null then
        begin
          select content::jsonb ->> 'logo' into v_logo
          from extensions.http_get('https://finnhub.io/api/v1/stock/profile2?symbol=' || v_ticker || '&token=' || v_token_finnhub);
        exception when others then
          v_logo := null;
        end;
      else
        v_logo := v_logo_existente;
      end if;

      if v_preco is not null and v_preco > 0 then
        insert into public.cotacoes (ticker, preco, variacao, logo, atualizado_em)
        values (v_ticker, round(v_preco, 2), round(v_variacao, 2), v_logo, now())
        on conflict (ticker) do update
          set preco = excluded.preco,
              variacao = excluded.variacao,
              logo = coalesce(excluded.logo, public.cotacoes.logo),
              atualizado_em = excluded.atualizado_em;
        v_contador := v_contador + 1;
      end if;
    exception when others then
      continue;
    end;
  end loop;

  return v_contador;
end $$;

-- Busca qualquer acao da NYSE/NASDAQ por nome ou ticker (nao so os
-- curados), via finnhub. Filtra pra ticker "puro" (sem sufixo de bolsa
-- estrangeira tipo .TW/.SS/.PA) e ja devolve preco convertido pra R$.
create or replace function public.buscar_acoes_usa(p_busca text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare
  v_token    text;
  v_fx       numeric;
  v_resposta jsonb;
  v_item     jsonb;
  v_ticker   text;
  v_quote    jsonb;
  v_preco    numeric;
  v_logo     text;
  v_resultado json[] := array[]::json[];
  v_contador integer := 0;
begin
  if p_busca is null or length(trim(p_busca)) < 2 then
    return '[]'::json;
  end if;

  select valor into v_token from public.segredos where chave = 'finnhub_token';
  if v_token is null then
    raise exception 'Token da finnhub nao configurado.';
  end if;

  v_fx := public.garantir_fx_usd_brl();

  select content::jsonb into v_resposta
  from extensions.http_get(
    'https://finnhub.io/api/v1/search?q=' || extensions.urlencode(trim(p_busca)) || '&token=' || v_token
  );

  for v_item in select * from jsonb_array_elements(coalesce(v_resposta -> 'result', '[]'::jsonb))
  loop
    exit when v_contador >= 12;

    v_ticker := v_item ->> 'symbol';
    if v_ticker !~ '^[A-Za-z]{1,5}$' then
      continue;
    end if;
    if coalesce(v_item ->> 'type', '') <> 'Common Stock' then
      continue;
    end if;

    begin
      select content::jsonb into v_quote
      from extensions.http_get('https://finnhub.io/api/v1/quote?symbol=' || upper(v_ticker) || '&token=' || v_token);
      v_preco := (v_quote ->> 'c')::numeric;
    exception when others then
      v_preco := null;
    end;

    if v_preco is not null and v_preco > 0 then
      -- Reaproveita o logo ja salvo em cotacoes quando existir, so busca
      -- na finnhub se ainda nao tiver (evita chamada extra por resultado).
      select logo into v_logo from public.cotacoes where ticker = upper(v_ticker);
      if v_logo is null then
        begin
          select content::jsonb ->> 'logo' into v_logo
          from extensions.http_get('https://finnhub.io/api/v1/stock/profile2?symbol=' || upper(v_ticker) || '&token=' || v_token);
        exception when others then
          v_logo := null;
        end;
      end if;

      v_resultado := v_resultado || json_build_object(
        'ticker', upper(v_ticker),
        'nome', v_item ->> 'description',
        'preco', round(v_preco * coalesce(v_fx, 1), 2),
        'variacao', round(coalesce((v_quote ->> 'dp')::numeric, 0), 2),
        'logo', v_logo
      );
      v_contador := v_contador + 1;
    end if;
  end loop;

  return array_to_json(v_resultado);
end $$;

revoke all on function public.buscar_acoes_usa(text) from public;
grant execute on function public.buscar_acoes_usa(text) to authenticated;


-- ------------------------------------------------------------
-- COMPRAR: tira do saldo, soma na posicao, registra a transacao.
-- Tudo junto, ou nada. Assim o saldo nunca fica errado. O preco vem de
-- garantir_cotacao(), nunca do parametro do cliente.
-- ------------------------------------------------------------
drop function if exists public.comprar(text, integer, numeric);

create or replace function public.comprar(p_ticker text, p_qtd integer)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare
  v_usuario uuid := auth.uid();
  v_preco   numeric(14,2);
  v_custo   numeric(14,2);
  v_saldo   numeric(14,2);
  v_pos     public.posicoes%rowtype;
begin
  if v_usuario is null then
    raise exception 'Voce precisa estar logado.';
  end if;
  if p_qtd is null or p_qtd <= 0 then
    raise exception 'A quantidade precisa ser maior que zero.';
  end if;

  v_preco := public.garantir_cotacao(upper(trim(p_ticker)));
  if v_preco is null or v_preco <= 0 then
    raise exception 'Nao consegui confirmar o preco de %. Tente de novo em instantes.', p_ticker;
  end if;

  v_custo := round(p_qtd * v_preco, 2);

  select saldo into v_saldo from public.perfis where id = v_usuario for update;
  if v_saldo is null then
    raise exception 'Perfil nao encontrado.';
  end if;
  if v_saldo < v_custo then
    raise exception 'Saldo insuficiente. Voce tem R$ % e precisa de R$ %.', v_saldo, v_custo;
  end if;

  update public.perfis set saldo = saldo - v_custo where id = v_usuario;

  select * into v_pos from public.posicoes
    where usuario_id = v_usuario and ticker = upper(trim(p_ticker)) for update;

  if found then
    update public.posicoes set
      quantidade  = v_pos.quantidade + p_qtd,
      preco_medio = round(
        ((v_pos.quantidade * v_pos.preco_medio) + v_custo) / (v_pos.quantidade + p_qtd), 2),
      atualizado_em = now()
    where id = v_pos.id;
  else
    insert into public.posicoes (usuario_id, ticker, quantidade, preco_medio)
    values (v_usuario, upper(trim(p_ticker)), p_qtd, v_preco);
  end if;

  insert into public.transacoes (usuario_id, ticker, tipo, quantidade, preco, total)
  values (v_usuario, upper(trim(p_ticker)), 'compra', p_qtd, v_preco, v_custo);

  return json_build_object('ok', true, 'preco', v_preco, 'custo', v_custo, 'saldo', v_saldo - v_custo);
end $$;


-- ------------------------------------------------------------
-- VENDER: devolve o dinheiro (ja descontado o IR quando devido),
-- baixa a posicao, registra. Preco tambem vem de garantir_cotacao().
--
-- Regra real simplificada da B3 pra acoes: vendas de ate R$20mil no
-- mes sao isentas. Passando disso, paga 15% sobre o LUCRO da venda
-- (nao sobre o valor total). Prejuizo nunca paga imposto.
-- ------------------------------------------------------------
drop function if exists public.vender(text, integer, numeric);

create or replace function public.vender(p_ticker text, p_qtd integer)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare
  v_usuario     uuid := auth.uid();
  v_preco       numeric(14,2);
  v_valor       numeric(14,2);
  v_lucro       numeric(14,2);
  v_vendido_mes numeric(14,2);
  v_imposto     numeric(14,2) := 0;
  v_liquido     numeric(14,2);
  v_pos         public.posicoes%rowtype;
begin
  if v_usuario is null then
    raise exception 'Voce precisa estar logado.';
  end if;
  if p_qtd is null or p_qtd <= 0 then
    raise exception 'A quantidade precisa ser maior que zero.';
  end if;

  v_preco := public.garantir_cotacao(upper(trim(p_ticker)));
  if v_preco is null or v_preco <= 0 then
    raise exception 'Nao consegui confirmar o preco de %. Tente de novo em instantes.', p_ticker;
  end if;

  select * into v_pos from public.posicoes
    where usuario_id = v_usuario and ticker = upper(trim(p_ticker)) for update;

  if not found then
    raise exception 'Voce nao tem % na carteira.', p_ticker;
  end if;
  if v_pos.quantidade < p_qtd then
    raise exception 'Voce tem apenas % cotas de %.', v_pos.quantidade, p_ticker;
  end if;

  v_valor := round(p_qtd * v_preco, 2);
  v_lucro := v_valor - round(p_qtd * v_pos.preco_medio, 2);

  select coalesce(sum(total), 0) into v_vendido_mes
    from public.transacoes
    where usuario_id = v_usuario and tipo = 'venda'
      and date_trunc('month', criado_em) = date_trunc('month', now());

  if v_lucro > 0 and (v_vendido_mes + v_valor) > 20000 then
    v_imposto := round(v_lucro * 0.15, 2);
  end if;

  v_liquido := v_valor - v_imposto;

  if v_pos.quantidade = p_qtd then
    delete from public.posicoes where id = v_pos.id;
  else
    update public.posicoes
      set quantidade = v_pos.quantidade - p_qtd, atualizado_em = now()
      where id = v_pos.id;
  end if;

  update public.perfis set saldo = saldo + v_liquido where id = v_usuario;

  insert into public.transacoes (usuario_id, ticker, tipo, quantidade, preco, total, imposto)
  values (v_usuario, upper(trim(p_ticker)), 'venda', p_qtd, v_preco, v_valor, v_imposto);

  return json_build_object('ok', true, 'preco', v_preco, 'valor', v_valor, 'imposto', v_imposto, 'liquido', v_liquido);
end $$;

-- Agenda a atualizacao automatica das cotacoes a cada 5 minutos, em
-- horario de pregao da B3 (10h-21h, seg-sex). Exige a extensao pg_cron
-- habilitada no projeto (Database > Extensions, no painel do Supabase).
do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    perform cron.unschedule(jobid) from cron.job where jobname = 'atualizar-cotacoes';
    perform cron.schedule('atualizar-cotacoes', '*/5 10-21 * * 1-5', 'select public.atualizar_cotacoes(true)');
  end if;
end $$;


-- ------------------------------------------------------------
-- ORDEM LIMITADA: cria um pedido pra comprar/vender so quando o
-- preco atingir o alvo. A execucao em si acontece do lado do site,
-- chamando comprar()/vender() quando a condicao bate (ver
-- src/app/simulador/processarPendencias.ts), e so marca aqui como
-- executada ou cancelada.
-- ------------------------------------------------------------
create or replace function public.criar_ordem_limitada(
  p_ticker text, p_tipo text, p_qtd integer, p_preco_alvo numeric
)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_usuario uuid := auth.uid();
  v_id      uuid;
begin
  if v_usuario is null then
    raise exception 'Voce precisa estar logado.';
  end if;
  if p_tipo not in ('comprar', 'vender') then
    raise exception 'Tipo de ordem invalido.';
  end if;
  if p_qtd is null or p_qtd <= 0 then
    raise exception 'A quantidade precisa ser maior que zero.';
  end if;
  if p_preco_alvo is null or p_preco_alvo <= 0 then
    raise exception 'Preco alvo invalido.';
  end if;

  insert into public.ordens_pendentes (usuario_id, ticker, tipo, quantidade, preco_alvo)
  values (v_usuario, p_ticker, p_tipo, p_qtd, p_preco_alvo)
  returning id into v_id;

  return json_build_object('ok', true, 'id', v_id);
end $$;

-- ------------------------------------------------------------
-- ORDEM NA ABERTURA: mesma ideia da ordem limitada, mas sem preco
-- alvo, so espera o pregao abrir (ver src/lib/mercadoStatus.ts) e
-- executa pelo preco de mercado do momento.
-- ------------------------------------------------------------
create or replace function public.criar_ordem_mercado_abertura(
  p_ticker text, p_tipo text, p_qtd integer
)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_usuario uuid := auth.uid();
  v_id      uuid;
begin
  if v_usuario is null then
    raise exception 'Voce precisa estar logado.';
  end if;
  if p_tipo not in ('comprar', 'vender') then
    raise exception 'Tipo de ordem invalido.';
  end if;
  if p_qtd is null or p_qtd <= 0 then
    raise exception 'A quantidade precisa ser maior que zero.';
  end if;

  insert into public.ordens_pendentes (usuario_id, ticker, tipo, quantidade, executar_na_abertura)
  values (v_usuario, p_ticker, p_tipo, p_qtd, true)
  returning id into v_id;

  return json_build_object('ok', true, 'id', v_id);
end $$;

create or replace function public.cancelar_ordem_limitada(p_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_usuario uuid := auth.uid();
  v_linhas  integer;
begin
  if v_usuario is null then
    raise exception 'Voce precisa estar logado.';
  end if;

  update public.ordens_pendentes
    set status = 'cancelada'
    where id = p_id and usuario_id = v_usuario and status = 'pendente';

  get diagnostics v_linhas = row_count;
  if v_linhas = 0 then
    raise exception 'Ordem nao encontrada ou ja nao esta mais pendente.';
  end if;

  return json_build_object('ok', true);
end $$;

create or replace function public.marcar_ordem_executada(p_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_usuario uuid := auth.uid();
begin
  if v_usuario is null then
    raise exception 'Voce precisa estar logado.';
  end if;

  update public.ordens_pendentes
    set status = 'executada', executada_em = now()
    where id = p_id and usuario_id = v_usuario and status = 'pendente';

  return json_build_object('ok', true);
end $$;


-- ------------------------------------------------------------
-- CREDITAR DIVIDENDO: soma no saldo, registra no historico. O
-- unique de dividendos_creditados garante que o mesmo pagamento
-- nunca e creditado duas vezes.
-- ------------------------------------------------------------
create or replace function public.creditar_dividendo(
  p_ticker text, p_data_pagamento date, p_quantidade integer, p_rate numeric
)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_usuario uuid := auth.uid();
  v_total   numeric(14,2);
  v_novo_id uuid;
begin
  if v_usuario is null then
    raise exception 'Voce precisa estar logado.';
  end if;
  if p_quantidade is null or p_quantidade <= 0 or p_rate is null or p_rate <= 0 then
    raise exception 'Dados de dividendo invalidos.';
  end if;

  insert into public.dividendos_creditados (usuario_id, ticker, data_pagamento)
  values (v_usuario, p_ticker, p_data_pagamento)
  on conflict (usuario_id, ticker, data_pagamento) do nothing
  returning id into v_novo_id;

  if v_novo_id is null then
    return json_build_object('ok', true, 'creditado', false);
  end if;

  v_total := round(p_quantidade * p_rate, 2);

  update public.perfis set saldo = saldo + v_total where id = v_usuario;

  insert into public.transacoes (usuario_id, ticker, tipo, quantidade, preco, total)
  values (v_usuario, p_ticker, 'dividendo', p_quantidade, p_rate, v_total);

  return json_build_object('ok', true, 'creditado', true, 'valor', v_total);
end $$;


-- ------------------------------------------------------------
-- RENDA FIXA: CDB e Tesouro Direto. Cada posicao guarda a taxa anual
-- do dia da aplicacao (como na vida real, a taxa contratada nao muda
-- depois); o valor atual e calculado por juros compostos sobre os
-- dias corridos desde a aplicacao.
-- ------------------------------------------------------------
create table if not exists public.investimentos_rf (
  id              uuid primary key default gen_random_uuid(),
  usuario_id      uuid not null references auth.users(id) on delete cascade,
  tipo            text not null check (tipo in ('cdb','tesouro')),
  nome            text not null,
  valor_investido numeric(14,2) not null check (valor_investido > 0),
  taxa_anual      numeric(8,4) not null check (taxa_anual > 0),
  data_aplicacao  date not null default current_date,
  resgatado       boolean not null default false,
  resgatado_em    timestamptz,
  valor_resgate   numeric(14,2),
  criado_em       timestamptz not null default now()
);

create index if not exists investimentos_rf_usuario_idx
  on public.investimentos_rf(usuario_id, resgatado);

alter table public.investimentos_rf enable row level security;

drop policy if exists "investimentos rf proprios" on public.investimentos_rf;
create policy "investimentos rf proprios" on public.investimentos_rf
  for select using (auth.uid() = usuario_id);

create or replace function public.investir_renda_fixa(
  p_tipo text, p_nome text, p_valor numeric, p_taxa_anual numeric
)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_usuario uuid := auth.uid();
  v_saldo   numeric(14,2);
  v_id      uuid;
begin
  if v_usuario is null then
    raise exception 'Voce precisa estar logado.';
  end if;
  if p_tipo not in ('cdb', 'tesouro') then
    raise exception 'Tipo de investimento invalido.';
  end if;
  if p_valor is null or p_valor <= 0 then
    raise exception 'Valor invalido.';
  end if;
  if p_taxa_anual is null or p_taxa_anual <= 0 then
    raise exception 'Taxa invalida.';
  end if;

  select saldo into v_saldo from public.perfis where id = v_usuario for update;
  if v_saldo is null then
    raise exception 'Perfil nao encontrado.';
  end if;
  if v_saldo < p_valor then
    raise exception 'Saldo insuficiente. Voce tem R$ % e precisa de R$ %.', v_saldo, p_valor;
  end if;

  update public.perfis set saldo = saldo - p_valor where id = v_usuario;

  insert into public.investimentos_rf (usuario_id, tipo, nome, valor_investido, taxa_anual)
  values (v_usuario, p_tipo, p_nome, p_valor, p_taxa_anual)
  returning id into v_id;

  return json_build_object('ok', true, 'id', v_id);
end $$;

create or replace function public.resgatar_renda_fixa(p_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_usuario uuid := auth.uid();
  v_pos     public.investimentos_rf%rowtype;
  v_dias    integer;
  v_valor   numeric(14,2);
begin
  if v_usuario is null then
    raise exception 'Voce precisa estar logado.';
  end if;

  select * into v_pos from public.investimentos_rf
    where id = p_id and usuario_id = v_usuario for update;

  if not found then
    raise exception 'Investimento nao encontrado.';
  end if;
  if v_pos.resgatado then
    raise exception 'Esse investimento ja foi resgatado.';
  end if;

  v_dias := greatest(0, current_date - v_pos.data_aplicacao);
  v_valor := round(
    v_pos.valor_investido * power(1 + v_pos.taxa_anual, v_dias / 365.0),
    2
  );

  update public.investimentos_rf
    set resgatado = true, resgatado_em = now(), valor_resgate = v_valor
    where id = p_id;

  update public.perfis set saldo = saldo + v_valor where id = v_usuario;

  return json_build_object('ok', true, 'valor', v_valor, 'dias', v_dias);
end $$;


-- ------------------------------------------------------------
-- TAXA SELIC: cache da meta Selic (Banco Central, serie 432), usada
-- como "juros legal" do emprestimo. So atualiza a cada 24h, ja que o
-- Copom muda a meta poucas vezes por ano.
-- ------------------------------------------------------------
create table if not exists public.taxa_selic_cache (
  id            smallint primary key default 1 check (id = 1),
  taxa_anual    numeric(6,4) not null,
  atualizado_em timestamptz not null default now()
);

alter table public.taxa_selic_cache enable row level security;
drop policy if exists "selic: leitura publica" on public.taxa_selic_cache;
create policy "selic: leitura publica" on public.taxa_selic_cache for select using (true);

create or replace function public.garantir_taxa_selic()
returns numeric language plpgsql security definer set search_path = public, extensions as $$
declare
  v_taxa     numeric;
  v_idade    interval;
  v_resposta jsonb;
begin
  select taxa_anual, now() - atualizado_em into v_taxa, v_idade
  from public.taxa_selic_cache where id = 1;

  if v_taxa is not null and v_idade < interval '24 hours' then
    return v_taxa;
  end if;

  begin
    select content::jsonb into v_resposta
    from extensions.http_get('https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1?formato=json');

    v_taxa := (v_resposta -> 0 ->> 'valor')::numeric / 100;

    if v_taxa is not null and v_taxa > 0 then
      insert into public.taxa_selic_cache (id, taxa_anual, atualizado_em)
      values (1, v_taxa, now())
      on conflict (id) do update set taxa_anual = excluded.taxa_anual, atualizado_em = excluded.atualizado_em;
      return v_taxa;
    end if;
  exception when others then
    return v_taxa;
  end;

  return v_taxa;
end $$;

revoke all on function public.garantir_taxa_selic() from public;
grant execute on function public.garantir_taxa_selic() to authenticated;

select public.garantir_taxa_selic();

-- ------------------------------------------------------------
-- EMPRESTIMOS: uma "linha de credito" por usuario, nao emprestimos
-- avulsos. saldo_devedor cresce sozinho com juros compostos diarios
-- (juros legal = Selic), calculados de forma projetada (sem escrita)
-- em saldo_devedor_atual(), e so "assentados" de verdade quando a
-- pessoa pede mais ou paga uma parte.
-- ------------------------------------------------------------
create table if not exists public.emprestimos (
  usuario_id        uuid primary key references auth.users(id) on delete cascade,
  saldo_devedor     numeric(14,2) not null default 0 check (saldo_devedor >= 0),
  criado_em         timestamptz not null default now(),
  ultimo_calculo_em timestamptz not null default now()
);

alter table public.emprestimos enable row level security;
drop policy if exists "emprestimo proprio" on public.emprestimos;
create policy "emprestimo proprio" on public.emprestimos
  for select using (auth.uid() = usuario_id);

-- Divida projetada ATE AGORA, sem gravar nada (seguro de chamar em
-- massa, tipo dentro do ranking). Juros compostos diarios a partir da
-- taxa anual da Selic: taxa_diaria = (1+taxa_anual)^(1/365) - 1.
create or replace function public.saldo_devedor_atual(p_usuario uuid)
returns numeric language sql stable security definer set search_path = public as $$
  select coalesce(
    (
      select e.saldo_devedor * power(
        power(1 + t.taxa_anual, 1.0/365),
        greatest(extract(epoch from (now() - e.ultimo_calculo_em)) / 86400, 0)
      )
      from public.emprestimos e, public.taxa_selic_cache t
      where e.usuario_id = p_usuario and t.id = 1
    ),
    0
  )
$$;

revoke all on function public.saldo_devedor_atual(uuid) from public;
grant execute on function public.saldo_devedor_atual(uuid) to authenticated;

-- ------------------------------------------------------------
-- PATRIMONIO DE: saldo + acoes pela cotacao ao vivo (cache atualizada
-- por cron; cai pro preco medio se por algum motivo a acao nao tiver
-- cotacao em cache) + renda fixa pelo valor investido, menos a divida
-- do emprestimo. Usada pelo ranking geral e pelo snapshot mensal.
-- ------------------------------------------------------------
create or replace function public.patrimonio_de(p_usuario uuid)
returns numeric language sql stable security definer set search_path = public as $$
  select
    coalesce((select saldo from public.perfis where id = p_usuario), 0)
      + coalesce((
          select sum(p.quantidade * coalesce(c.preco, p.preco_medio))
          from public.posicoes p
          left join public.cotacoes c on c.ticker = p.ticker
          where p.usuario_id = p_usuario
        ), 0)
      + coalesce((select sum(valor_investido) from public.investimentos_rf where usuario_id = p_usuario and resgatado = false), 0)
      - public.saldo_devedor_atual(p_usuario)
$$;

-- ------------------------------------------------------------
-- EMPRESTIMO: estado pra UI, pedido e pagamento. Limite e 50% do
-- patrimonio BRUTO (antes de descontar a propria divida), senao o
-- limite encolheria sozinho so pelos juros acumulando.
-- ------------------------------------------------------------
create or replace function public.obter_emprestimo()
returns json language plpgsql security definer set search_path = public as $$
declare
  v_usuario            uuid := auth.uid();
  v_taxa                numeric;
  v_divida              numeric;
  v_patrimonio_liquido  numeric;
  v_patrimonio_bruto    numeric;
  v_limite              numeric;
begin
  if v_usuario is null then
    raise exception 'Voce precisa estar logado.';
  end if;

  select taxa_anual into v_taxa from public.taxa_selic_cache where id = 1;
  if v_taxa is null then
    v_taxa := public.garantir_taxa_selic();
  end if;

  v_divida := public.saldo_devedor_atual(v_usuario);
  v_patrimonio_liquido := public.patrimonio_de(v_usuario);
  v_patrimonio_bruto := v_patrimonio_liquido + v_divida;
  v_limite := greatest(v_patrimonio_bruto, 0) * 0.5;

  return json_build_object(
    'divida', round(v_divida, 2),
    'taxaAnualPct', round(coalesce(v_taxa, 0) * 100, 2),
    'limite', round(v_limite, 2),
    'disponivel', round(greatest(v_limite - v_divida, 0), 2),
    'patrimonioLiquido', round(v_patrimonio_liquido, 2)
  );
end $$;

revoke all on function public.obter_emprestimo() from public;
grant execute on function public.obter_emprestimo() to authenticated;

create or replace function public.pedir_emprestimo(p_valor numeric)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_usuario          uuid := auth.uid();
  v_divida_atual     numeric;
  v_patrimonio_bruto numeric;
  v_limite           numeric;
begin
  if v_usuario is null then
    raise exception 'Voce precisa estar logado.';
  end if;
  if p_valor is null or p_valor <= 0 then
    raise exception 'Escolha um valor de emprestimo valido.';
  end if;

  perform public.garantir_taxa_selic();

  v_divida_atual := public.saldo_devedor_atual(v_usuario);
  v_patrimonio_bruto := public.patrimonio_de(v_usuario) + v_divida_atual;
  v_limite := greatest(v_patrimonio_bruto, 0) * 0.5;

  if v_divida_atual + p_valor > v_limite then
    raise exception 'Limite de emprestimo excedido. Voce pode pegar ate R$ %.',
      to_char(greatest(v_limite - v_divida_atual, 0), 'FM999999999.00');
  end if;

  insert into public.emprestimos (usuario_id, saldo_devedor, criado_em, ultimo_calculo_em)
  values (v_usuario, v_divida_atual + p_valor, now(), now())
  on conflict (usuario_id) do update
    set saldo_devedor = v_divida_atual + p_valor, ultimo_calculo_em = now();

  update public.perfis set saldo = saldo + p_valor where id = v_usuario;

  return json_build_object('ok', true, 'valor', p_valor, 'saldoDevedor', round(v_divida_atual + p_valor, 2));
end $$;

revoke all on function public.pedir_emprestimo(numeric) from public;
grant execute on function public.pedir_emprestimo(numeric) to authenticated;

create or replace function public.pagar_emprestimo(p_valor numeric)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_usuario      uuid := auth.uid();
  v_divida_atual numeric;
  v_saldo_caixa  numeric;
  v_pagamento    numeric;
begin
  if v_usuario is null then
    raise exception 'Voce precisa estar logado.';
  end if;
  if p_valor is null or p_valor <= 0 then
    raise exception 'Escolha um valor valido.';
  end if;

  v_divida_atual := public.saldo_devedor_atual(v_usuario);
  if v_divida_atual <= 0 then
    raise exception 'Voce nao tem divida pra pagar.';
  end if;

  select saldo into v_saldo_caixa from public.perfis where id = v_usuario;
  v_pagamento := least(p_valor, v_divida_atual, coalesce(v_saldo_caixa, 0));

  if v_pagamento <= 0 then
    raise exception 'Saldo insuficiente em caixa.';
  end if;

  update public.emprestimos
    set saldo_devedor = v_divida_atual - v_pagamento, ultimo_calculo_em = now()
    where usuario_id = v_usuario;

  update public.perfis set saldo = saldo - v_pagamento where id = v_usuario;

  return json_build_object('ok', true, 'pago', round(v_pagamento, 2), 'saldoDevedorRestante', round(v_divida_atual - v_pagamento, 2));
end $$;

revoke all on function public.pagar_emprestimo(numeric) from public;
grant execute on function public.pagar_emprestimo(numeric) to authenticated;


-- ------------------------------------------------------------
-- REGISTRAR ACESSO: streak de dias seguidos usando o simulador, e
-- snapshot do patrimonio no inicio de cada mes (pro desafio mensal).
-- Chamada uma vez por carregamento da pagina (ver
-- src/app/simulador/processarPendencias.ts). So conta a primeira
-- visita de cada dia: entrar varias vezes no mesmo dia nao aumenta.
-- ------------------------------------------------------------
create or replace function public.registrar_acesso()
returns json language plpgsql security definer set search_path = public as $$
declare
  v_usuario uuid := auth.uid();
  v_perfil  public.perfis%rowtype;
  v_novo_dia boolean;
  v_mes_atual text := to_char(current_date, 'YYYY-MM');
begin
  if v_usuario is null then
    raise exception 'Voce precisa estar logado.';
  end if;

  select * into v_perfil from public.perfis where id = v_usuario for update;
  if not found then
    raise exception 'Perfil nao encontrado.';
  end if;

  if v_perfil.ultimo_acesso = current_date then
    v_novo_dia := false;
  else
    v_novo_dia := true;
    if v_perfil.ultimo_acesso = current_date - 1 then
      update public.perfis
        set dias_seguidos = dias_seguidos + 1, ultimo_acesso = current_date
        where id = v_usuario;
    else
      update public.perfis
        set dias_seguidos = 1, ultimo_acesso = current_date
        where id = v_usuario;
    end if;
  end if;

  if v_perfil.mes_referencia is distinct from v_mes_atual then
    update public.perfis
      set mes_referencia = v_mes_atual,
          patrimonio_inicio_mes = public.patrimonio_de(v_usuario)
      where id = v_usuario;
  end if;

  select dias_seguidos into v_perfil.dias_seguidos
    from public.perfis where id = v_usuario;

  return json_build_object('ok', true, 'diasSeguidos', v_perfil.dias_seguidos, 'novoDia', v_novo_dia);
end $$;


-- ------------------------------------------------------------
-- RANKING: top usuarios por patrimonio (saldo + acoes pelo preco
-- medio + renda fixa pelo valor investido). Usa preco medio em vez do
-- preco de mercado agora pra nao precisar buscar cotacao de todo mundo
-- so pra montar o ranking, e uma aproximacao, nao o patrimonio exato
-- de cada um. So entram contas de verdade: visitante anonimo (is_anonymous)
-- ganha um perfil igual a todo mundo, mas nao deveria aparecer no ranking.
-- ------------------------------------------------------------
create or replace function public.ranking(p_limite integer default 50)
returns table(apelido text, patrimonio numeric, posicao bigint)
language sql security definer set search_path = public as $$
  select
    coalesce(p.apelido, 'Investidor') as apelido,
    public.patrimonio_de(p.id) as patrimonio,
    row_number() over (order by public.patrimonio_de(p.id) desc) as posicao
  from public.perfis p
  join auth.users u on u.id = p.id
  where u.is_anonymous is not true
  order by patrimonio desc
  limit p_limite
$$;

grant execute on function public.ranking(integer) to authenticated;


-- ------------------------------------------------------------
-- RANKING MENSAL (desafio do mes): ordena por QUANTO CRESCEU o
-- patrimonio desde o snapshot capturado no inicio do mes (ver
-- registrar_acesso), nao pelo total acumulado. So entram quem ja tem
-- um snapshot deste mes (ou seja, quem visitou o simulador este mes).
-- ------------------------------------------------------------
create or replace function public.ranking_mensal(p_limite integer default 50)
returns table(apelido text, ganho numeric, ganho_pct numeric, posicao bigint)
language sql security definer set search_path = public as $$
  select
    coalesce(p.apelido, 'Investidor') as apelido,
    public.patrimonio_de(p.id) - p.patrimonio_inicio_mes as ganho,
    case when p.patrimonio_inicio_mes > 0
      then round(((public.patrimonio_de(p.id) - p.patrimonio_inicio_mes) / p.patrimonio_inicio_mes) * 100, 2)
      else 0
    end as ganho_pct,
    row_number() over (order by public.patrimonio_de(p.id) - p.patrimonio_inicio_mes desc) as posicao
  from public.perfis p
  join auth.users u on u.id = p.id
  where p.mes_referencia = to_char(current_date, 'YYYY-MM')
    and p.patrimonio_inicio_mes is not null
    and u.is_anonymous is not true
  order by ganho desc
  limit p_limite
$$;

grant execute on function public.ranking_mensal(integer) to authenticated;


-- ------------------------------------------------------------
-- DEFINIR PERFIL: guarda o resultado do quiz de perfil de investidor
-- (conservador/moderado/arrojado), pra so mostrar o pop-up uma vez.
-- ------------------------------------------------------------
create or replace function public.definir_perfil_investidor(p_perfil text)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_usuario uuid := auth.uid();
begin
  if v_usuario is null then
    raise exception 'Voce precisa estar logado.';
  end if;
  if p_perfil not in ('conservador', 'moderado', 'arrojado') then
    raise exception 'Perfil invalido.';
  end if;

  update public.perfis set perfil_investidor = p_perfil where id = v_usuario;

  return json_build_object('ok', true);
end $$;


-- ------------------------------------------------------------
-- ALERTAS DE PRECO: avisa (dentro do site, nao por e-mail, sem
-- infraestrutura de envio configurada) quando uma acao bate um preco.
-- A checagem roda a cada carregamento do simulador (ver
-- processarPendencias.ts), igual as ordens limitadas.
-- ------------------------------------------------------------
create table if not exists public.alertas_preco (
  id           uuid primary key default gen_random_uuid(),
  usuario_id   uuid not null references auth.users(id) on delete cascade,
  ticker       text not null,
  direcao      text not null check (direcao in ('acima', 'abaixo')),
  preco_alvo   numeric(14,2) not null check (preco_alvo > 0),
  status       text not null default 'ativo' check (status in ('ativo', 'disparado', 'cancelado')),
  visto        boolean not null default false,
  criado_em    timestamptz not null default now(),
  disparado_em timestamptz
);

create index if not exists alertas_preco_usuario_idx
  on public.alertas_preco(usuario_id, status);

alter table public.alertas_preco enable row level security;

drop policy if exists "alertas proprios" on public.alertas_preco;
create policy "alertas proprios" on public.alertas_preco
  for select using (auth.uid() = usuario_id);

create or replace function public.criar_alerta_preco(
  p_ticker text, p_direcao text, p_preco_alvo numeric
)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_usuario uuid := auth.uid();
  v_id      uuid;
begin
  if v_usuario is null then
    raise exception 'Voce precisa estar logado.';
  end if;
  if p_direcao not in ('acima', 'abaixo') then
    raise exception 'Direcao invalida.';
  end if;
  if p_preco_alvo is null or p_preco_alvo <= 0 then
    raise exception 'Preco alvo invalido.';
  end if;

  insert into public.alertas_preco (usuario_id, ticker, direcao, preco_alvo)
  values (v_usuario, p_ticker, p_direcao, p_preco_alvo)
  returning id into v_id;

  return json_build_object('ok', true, 'id', v_id);
end $$;

create or replace function public.cancelar_alerta_preco(p_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_usuario uuid := auth.uid();
begin
  if v_usuario is null then
    raise exception 'Voce precisa estar logado.';
  end if;

  update public.alertas_preco
    set status = 'cancelado'
    where id = p_id and usuario_id = v_usuario and status = 'ativo';

  return json_build_object('ok', true);
end $$;

create or replace function public.marcar_alerta_disparado(p_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_usuario uuid := auth.uid();
begin
  if v_usuario is null then
    raise exception 'Voce precisa estar logado.';
  end if;

  update public.alertas_preco
    set status = 'disparado', disparado_em = now()
    where id = p_id and usuario_id = v_usuario and status = 'ativo';

  return json_build_object('ok', true);
end $$;

create or replace function public.marcar_alerta_visto(p_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_usuario uuid := auth.uid();
begin
  if v_usuario is null then
    raise exception 'Voce precisa estar logado.';
  end if;

  update public.alertas_preco
    set visto = true
    where id = p_id and usuario_id = v_usuario;

  return json_build_object('ok', true);
end $$;


-- ------------------------------------------------------------
-- FAVORITOS (watchlist): acompanhar uma acao sem comprar
-- ------------------------------------------------------------
create table if not exists public.favoritos (
  id         uuid primary key default gen_random_uuid(),
  usuario_id uuid not null references auth.users(id) on delete cascade,
  ticker     text not null,
  criado_em  timestamptz not null default now(),
  unique (usuario_id, ticker)
);

alter table public.favoritos enable row level security;

drop policy if exists "favoritos proprios" on public.favoritos;
create policy "favoritos proprios" on public.favoritos
  for all using (auth.uid() = usuario_id) with check (auth.uid() = usuario_id);

create or replace function public.favoritar_acao(p_ticker text)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_usuario uuid := auth.uid();
begin
  if v_usuario is null then
    raise exception 'Voce precisa estar logado.';
  end if;

  insert into public.favoritos (usuario_id, ticker)
  values (v_usuario, upper(p_ticker))
  on conflict (usuario_id, ticker) do nothing;

  return json_build_object('ok', true);
end $$;

create or replace function public.desfavoritar_acao(p_ticker text)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_usuario uuid := auth.uid();
begin
  if v_usuario is null then
    raise exception 'Voce precisa estar logado.';
  end if;

  delete from public.favoritos
    where usuario_id = v_usuario and ticker = upper(p_ticker);

  return json_build_object('ok', true);
end $$;


-- ------------------------------------------------------------
-- MODO DUELO: competir com um amigo por X dias, ve quem cresce mais
-- ------------------------------------------------------------
create table if not exists public.duelos (
  id                          uuid primary key default gen_random_uuid(),
  criador_id                  uuid not null references auth.users(id) on delete cascade,
  oponente_id                 uuid references auth.users(id) on delete cascade,
  codigo_convite              text not null unique,
  dias                        integer not null check (dias > 0 and dias <= 90),
  patrimonio_inicial_criador  numeric(14,2),
  patrimonio_inicial_oponente numeric(14,2),
  data_inicio                 timestamptz,
  status                      text not null default 'aguardando' check (status in ('aguardando', 'ativo')),
  criado_em                   timestamptz not null default now()
);

alter table public.duelos enable row level security;

drop policy if exists "duelos proprios" on public.duelos;
create policy "duelos proprios" on public.duelos
  for select using (auth.uid() = criador_id or auth.uid() = oponente_id);

create or replace function public.criar_duelo(p_dias integer)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_usuario uuid := auth.uid();
  v_codigo  text;
  v_id      uuid;
begin
  if v_usuario is null then
    raise exception 'Voce precisa estar logado.';
  end if;
  if p_dias is null or p_dias <= 0 or p_dias > 90 then
    raise exception 'Duracao invalida (1 a 90 dias).';
  end if;

  loop
    v_codigo := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from public.duelos where codigo_convite = v_codigo);
  end loop;

  insert into public.duelos (criador_id, codigo_convite, dias, patrimonio_inicial_criador)
  values (v_usuario, v_codigo, p_dias, public.patrimonio_de(v_usuario))
  returning id into v_id;

  return json_build_object('ok', true, 'id', v_id, 'codigo', v_codigo);
end $$;

create or replace function public.entrar_duelo(p_codigo text)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_usuario uuid := auth.uid();
  v_duelo   public.duelos%rowtype;
begin
  if v_usuario is null then
    raise exception 'Voce precisa estar logado.';
  end if;

  select * into v_duelo from public.duelos
    where codigo_convite = upper(p_codigo) and status = 'aguardando';

  if not found then
    raise exception 'Codigo invalido ou duelo ja comecou.';
  end if;
  if v_duelo.criador_id = v_usuario then
    raise exception 'Voce nao pode entrar no proprio duelo.';
  end if;

  update public.duelos set
    oponente_id = v_usuario,
    patrimonio_inicial_oponente = public.patrimonio_de(v_usuario),
    data_inicio = now(),
    status = 'ativo'
  where id = v_duelo.id;

  return json_build_object('ok', true, 'id', v_duelo.id);
end $$;

create or replace function public.listar_meus_duelos()
returns json language plpgsql security definer set search_path = public as $$
declare
  v_usuario uuid := auth.uid();
begin
  if v_usuario is null then
    raise exception 'Voce precisa estar logado.';
  end if;

  return coalesce((
    select json_agg(json_build_object(
      'id', d.id,
      'codigoConvite', d.codigo_convite,
      'dias', d.dias,
      'status', d.status,
      'souCriador', d.criador_id = v_usuario,
      'dataInicio', d.data_inicio,
      'meuApelido', case when d.criador_id = v_usuario then pc.apelido else po.apelido end,
      'oponenteApelido', case when d.criador_id = v_usuario then po.apelido else pc.apelido end,
      'meuPatrimonioInicial',
        case when d.criador_id = v_usuario then d.patrimonio_inicial_criador else d.patrimonio_inicial_oponente end,
      'oponentePatrimonioInicial',
        case when d.criador_id = v_usuario then d.patrimonio_inicial_oponente else d.patrimonio_inicial_criador end,
      'meuPatrimonioAtual', public.patrimonio_de(v_usuario),
      'oponentePatrimonioAtual',
        case
          when d.oponente_id is null then null
          else public.patrimonio_de(case when d.criador_id = v_usuario then d.oponente_id else d.criador_id end)
        end
    ) order by d.criado_em desc)
    from public.duelos d
    left join public.perfis pc on pc.id = d.criador_id
    left join public.perfis po on po.id = d.oponente_id
    where d.criador_id = v_usuario or d.oponente_id = v_usuario
  ), '[]'::json);
end $$;


-- ------------------------------------------------------------
-- NOTICIAS: busca na finnhub de dentro do banco, mesmo padrao das
-- cotacoes, o token fica em segredos, nunca numa env var da Vercel.
-- Trocamos de marketaux pra finnhub porque o plano gratuito da
-- marketaux capava em 3 manchetes por busca; a finnhub nao tem esse
-- limite por chamada no plano gratuito (so 60 chamadas/minuto).
-- Depois de rodar este arquivo, insira o seu token uma vez:
--   insert into public.segredos (chave, valor) values ('finnhub_token', 'SEU_TOKEN_AQUI')
--   on conflict (chave) do update set valor = excluded.valor;
-- ------------------------------------------------------------
-- Traduz pro portugues via Google Translate (endpoint publico, sem
-- chave). Se falhar por qualquer motivo, devolve o texto original em
-- ingles em vez de quebrar a lista inteira.
create or replace function public.traduzir_pt(p_texto text)
returns text language plpgsql security definer set search_path = public, extensions as $$
declare
  v_resposta jsonb;
  v_traduzido text;
begin
  if p_texto is null or length(trim(p_texto)) = 0 then
    return p_texto;
  end if;

  begin
    select content::jsonb into v_resposta
    from extensions.http_get(
      'https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=pt&dt=t&q=' || extensions.urlencode(p_texto)
    );
    v_traduzido := v_resposta -> 0 -> 0 ->> 0;
    return coalesce(v_traduzido, p_texto);
  exception when others then
    return p_texto;
  end;
end $$;

revoke all on function public.traduzir_pt(text) from public;
grant execute on function public.traduzir_pt(text) to authenticated;

create or replace function public.buscar_noticias(p_busca text default null)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare
  v_token    text;
  v_resposta jsonb;
begin
  select valor into v_token from public.segredos where chave = 'finnhub_token';
  if v_token is null then
    raise exception 'Token da finnhub nao configurado.';
  end if;

  select content::jsonb into v_resposta
  from extensions.http_get(
    'https://finnhub.io/api/v1/news?category=general&token=' || v_token
  );

  return (
    select coalesce(json_agg(json_build_object(
      'titulo', public.traduzir_pt(item ->> 'headline'),
      'resumo', public.traduzir_pt(coalesce(item ->> 'summary', '')),
      'url', item ->> 'url',
      'fonte', coalesce(item ->> 'source', 'Fonte externa'),
      'publicadoEm', to_char(to_timestamp((item ->> 'datetime')::bigint), 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
      'imagem', case when item ->> 'image' = '' then null else item ->> 'image' end
    )), '[]'::json)
    from (
      select item
      from jsonb_array_elements(v_resposta) as item
      where item ->> 'headline' is not null and item ->> 'url' is not null
        and (
          p_busca is null or length(trim(p_busca)) = 0
          or item ->> 'headline' ilike '%' || p_busca || '%'
          or item ->> 'summary' ilike '%' || p_busca || '%'
        )
      limit 6
    ) t
  );
end $$;

revoke all on function public.buscar_noticias(text) from public;
grant execute on function public.buscar_noticias(text) to authenticated;


-- ------------------------------------------------------------
-- AGENTE DE INVESTIMENTO: um por usuario, com perfil de risco. A
-- decisao (comprar/vender/manter) e tomada por um modelo de IA de
-- verdade, chamado do lado do servidor Next.js (nao daqui, pra poder
-- usar tool use com o SDK/fetch da Anthropic direito). A execucao da
-- ordem reaproveita comprar()/vender() normais, entao roda com o
-- usuario logado de verdade, sem precisar de um caminho privilegiado
-- novo. Limite de 3 execucoes por dia, controlado aqui no banco.
-- ------------------------------------------------------------
create table if not exists public.agentes (
  id                  uuid primary key default gen_random_uuid(),
  usuario_id          uuid not null unique references auth.users(id) on delete cascade,
  perfil_risco        text not null check (perfil_risco in ('conservador', 'moderado', 'agressivo')),
  ativo               boolean not null default true,
  execucoes_hoje      integer not null default 0,
  ultimo_dia_execucao date,
  regra_personalizada text,
  stop_loss_pct       numeric(5,2),
  stop_gain_pct       numeric(5,2),
  criado_em           timestamptz not null default now()
);

alter table public.agentes add column if not exists regra_personalizada text;
alter table public.agentes add column if not exists stop_loss_pct numeric(5,2);
alter table public.agentes add column if not exists stop_gain_pct numeric(5,2);

alter table public.agentes enable row level security;

drop policy if exists "agente proprio" on public.agentes;
create policy "agente proprio" on public.agentes
  for select using (auth.uid() = usuario_id);

create table if not exists public.agente_decisoes (
  id            uuid primary key default gen_random_uuid(),
  agente_id     uuid not null references public.agentes(id) on delete cascade,
  ticker        text,
  acao          text not null check (acao in ('comprar', 'vender', 'manter')),
  quantidade    integer,
  justificativa text not null,
  executado     boolean not null default false,
  erro          text,
  criado_em     timestamptz not null default now()
);

create index if not exists agente_decisoes_agente_idx
  on public.agente_decisoes(agente_id, criado_em desc);

alter table public.agente_decisoes enable row level security;

drop policy if exists "decisoes do proprio agente" on public.agente_decisoes;
create policy "decisoes do proprio agente" on public.agente_decisoes
  for select using (
    agente_id in (select id from public.agentes where usuario_id = auth.uid())
  );

create or replace function public.criar_ou_atualizar_agente(
  p_perfil_risco text, p_regra_personalizada text default null,
  p_stop_loss_pct numeric default null, p_stop_gain_pct numeric default null
)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_usuario uuid := auth.uid();
begin
  if v_usuario is null then
    raise exception 'Voce precisa estar logado.';
  end if;
  if p_perfil_risco not in ('conservador', 'moderado', 'agressivo') then
    raise exception 'Perfil de risco invalido.';
  end if;
  if p_regra_personalizada is not null and length(p_regra_personalizada) > 500 then
    raise exception 'Regra personalizada muito longa (maximo 500 caracteres).';
  end if;
  if p_stop_loss_pct is not null and (p_stop_loss_pct <= 0 or p_stop_loss_pct >= 100) then
    raise exception 'Stop loss precisa ser entre 0 e 100 por cento.';
  end if;
  if p_stop_gain_pct is not null and p_stop_gain_pct <= 0 then
    raise exception 'Stop gain precisa ser maior que zero.';
  end if;

  insert into public.agentes (usuario_id, perfil_risco, regra_personalizada, stop_loss_pct, stop_gain_pct)
  values (v_usuario, p_perfil_risco, p_regra_personalizada, p_stop_loss_pct, p_stop_gain_pct)
  on conflict (usuario_id) do update
    set perfil_risco = excluded.perfil_risco,
        regra_personalizada = excluded.regra_personalizada,
        stop_loss_pct = excluded.stop_loss_pct,
        stop_gain_pct = excluded.stop_gain_pct,
        ativo = true;

  return json_build_object('ok', true);
end $$;

create or replace function public.reservar_execucao_agente()
returns json language plpgsql security definer set search_path = public as $$
declare
  v_usuario uuid := auth.uid();
  v_agente  public.agentes%rowtype;
  v_limite  constant integer := 10;
begin
  if v_usuario is null then
    raise exception 'Voce precisa estar logado.';
  end if;

  select * into v_agente from public.agentes where usuario_id = v_usuario for update;
  if not found then
    raise exception 'Voce ainda nao criou um agente.';
  end if;

  if v_agente.ultimo_dia_execucao is distinct from current_date then
    update public.agentes
      set execucoes_hoje = 1, ultimo_dia_execucao = current_date
      where id = v_agente.id;
    return json_build_object('ok', true, 'restantes', v_limite - 1);
  end if;

  if v_agente.execucoes_hoje >= v_limite then
    raise exception 'Limite diario de % execucoes atingido. Volte amanha.', v_limite;
  end if;

  update public.agentes set execucoes_hoje = execucoes_hoje + 1 where id = v_agente.id;
  return json_build_object('ok', true, 'restantes', v_limite - (v_agente.execucoes_hoje + 1));
end $$;

create or replace function public.registrar_decisao_agente(
  p_ticker text, p_acao text, p_quantidade integer, p_justificativa text,
  p_executado boolean, p_erro text default null
)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_usuario uuid := auth.uid();
  v_agente_id uuid;
begin
  if v_usuario is null then
    raise exception 'Voce precisa estar logado.';
  end if;

  select id into v_agente_id from public.agentes where usuario_id = v_usuario;
  if v_agente_id is null then
    raise exception 'Agente nao encontrado.';
  end if;

  insert into public.agente_decisoes (agente_id, ticker, acao, quantidade, justificativa, executado, erro)
  values (v_agente_id, p_ticker, p_acao, p_quantidade, p_justificativa, p_executado, p_erro);

  return json_build_object('ok', true);
end $$;

create or replace function public.listar_decisoes_agente(p_limite integer default 20)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_usuario uuid := auth.uid();
begin
  if v_usuario is null then
    raise exception 'Voce precisa estar logado.';
  end if;

  return coalesce((
    select json_agg(json_build_object(
      'id', d.id,
      'ticker', d.ticker,
      'acao', d.acao,
      'quantidade', d.quantidade,
      'justificativa', d.justificativa,
      'executado', d.executado,
      'erro', d.erro,
      'criadoEm', d.criado_em
    ) order by d.criado_em desc)
    from public.agente_decisoes d
    join public.agentes a on a.id = d.agente_id
    where a.usuario_id = v_usuario
    limit p_limite
  ), '[]'::json);
end $$;

create or replace function public.obter_agente()
returns json language plpgsql security definer set search_path = public as $$
declare
  v_usuario uuid := auth.uid();
  v_agente public.agentes%rowtype;
  v_restantes integer;
  v_limite constant integer := 10;
begin
  if v_usuario is null then
    raise exception 'Voce precisa estar logado.';
  end if;

  select * into v_agente from public.agentes where usuario_id = v_usuario;
  if not found then
    return json_build_object('existe', false);
  end if;

  if v_agente.ultimo_dia_execucao is distinct from current_date then
    v_restantes := v_limite;
  else
    v_restantes := greatest(0, v_limite - v_agente.execucoes_hoje);
  end if;

  return json_build_object(
    'existe', true,
    'perfilRisco', v_agente.perfil_risco,
    'regraPersonalizada', v_agente.regra_personalizada,
    'stopLossPct', v_agente.stop_loss_pct,
    'stopGainPct', v_agente.stop_gain_pct,
    'restantesHoje', v_restantes
  );
end $$;


-- ------------------------------------------------------------
-- ASSISTENTE DE CHAT: so conversa e explica, nunca executa operacao
-- (diferente do agente de investimento). Limite diario por pessoa pra
-- controlar custo do Gemini.
-- ------------------------------------------------------------
create table if not exists public.assistente_uso (
  usuario_id     uuid primary key references auth.users(id) on delete cascade,
  mensagens_hoje integer not null default 0,
  ultimo_dia     date
);

alter table public.assistente_uso enable row level security;

drop policy if exists "uso proprio do assistente" on public.assistente_uso;
create policy "uso proprio do assistente" on public.assistente_uso
  for select using (auth.uid() = usuario_id);

create or replace function public.reservar_mensagem_assistente()
returns json language plpgsql security definer set search_path = public as $$
declare
  v_usuario uuid := auth.uid();
  v_uso     public.assistente_uso%rowtype;
  v_limite  constant integer := 100;
begin
  if v_usuario is null then
    raise exception 'Voce precisa estar logado.';
  end if;

  insert into public.assistente_uso (usuario_id, mensagens_hoje, ultimo_dia)
  values (v_usuario, 0, null)
  on conflict (usuario_id) do nothing;

  select * into v_uso from public.assistente_uso where usuario_id = v_usuario for update;

  if v_uso.ultimo_dia is distinct from current_date then
    update public.assistente_uso
      set mensagens_hoje = 1, ultimo_dia = current_date
      where usuario_id = v_usuario;
    return json_build_object('ok', true, 'restantes', v_limite - 1);
  end if;

  if v_uso.mensagens_hoje >= v_limite then
    raise exception 'Limite diario de % mensagens atingido. Volte amanha.', v_limite;
  end if;

  update public.assistente_uso set mensagens_hoje = mensagens_hoje + 1 where usuario_id = v_usuario;
  return json_build_object('ok', true, 'restantes', v_limite - (v_uso.mensagens_hoje + 1));
end $$;

create or replace function public.restantes_assistente_hoje()
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_usuario uuid := auth.uid();
  v_uso     public.assistente_uso%rowtype;
  v_limite  constant integer := 100;
begin
  if v_usuario is null then
    raise exception 'Voce precisa estar logado.';
  end if;

  select * into v_uso from public.assistente_uso where usuario_id = v_usuario;
  if not found or v_uso.ultimo_dia is distinct from current_date then
    return v_limite;
  end if;

  return greatest(0, v_limite - v_uso.mensagens_hoje);
end $$;
