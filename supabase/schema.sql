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
  criado_em            timestamptz not null default now()
);

alter table public.perfis add column if not exists dias_seguidos integer not null default 0;
alter table public.perfis add column if not exists ultimo_acesso date;
alter table public.perfis add column if not exists perfil_investidor text;
alter table public.perfis add column if not exists mes_referencia text;
alter table public.perfis add column if not exists patrimonio_inicio_mes numeric(14,2);

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
  id           uuid primary key default gen_random_uuid(),
  usuario_id   uuid not null references auth.users(id) on delete cascade,
  ticker       text not null,
  tipo         text not null check (tipo in ('comprar','vender')),
  quantidade   integer not null check (quantidade > 0),
  preco_alvo   numeric(14,2) not null check (preco_alvo > 0),
  status       text not null default 'pendente' check (status in ('pendente','executada','cancelada')),
  criado_em    timestamptz not null default now(),
  executada_em timestamptz
);

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
-- simulador carrega, antes de ler o saldo — assim ninguem fica preso
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
-- COTACOES: cache de preco atualizada dentro do proprio banco (via
-- extensao http, direto na brapi), nunca confiando no preco que o
-- navegador manda. E o que fecha a brecha de "preco forjado" — comprar
-- e vender descobrem o preco sozinhos, chamando garantir_cotacao().
-- ------------------------------------------------------------
create extension if not exists http with schema extensions;

create table if not exists public.ativos_permitidos (
  ticker text primary key
);

insert into public.ativos_permitidos (ticker) values
  ('PETR4'), ('VALE3'), ('ITUB4'), ('BBDC4'), ('BBAS3'), ('ABEV3'),
  ('WEGE3'), ('MGLU3'), ('B3SA3'), ('RENT3'), ('SUZB3'), ('RAIL3'),
  ('PRIO3'), ('EQTL3'), ('RADL3'), ('LREN3')
on conflict (ticker) do nothing;

alter table public.ativos_permitidos enable row level security;
drop policy if exists "ativos: leitura publica" on public.ativos_permitidos;
create policy "ativos: leitura publica" on public.ativos_permitidos for select using (true);

create table if not exists public.cotacoes (
  ticker        text primary key,
  preco         numeric(14,2) not null,
  variacao      numeric(6,2) not null default 0,
  atualizado_em timestamptz not null default now()
);

alter table public.cotacoes enable row level security;
drop policy if exists "cotacoes: leitura publica" on public.cotacoes;
create policy "cotacoes: leitura publica" on public.cotacoes for select using (true);

-- Guarda o token da brapi dentro do banco, nunca exposto por API — sem
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

create or replace function public.garantir_cotacao(p_ticker text)
returns numeric language plpgsql security definer set search_path = public, extensions as $$
declare
  v_token    text;
  v_preco    numeric;
  v_idade    interval;
  v_resposta jsonb;
  v_variacao numeric;
begin
  -- Formato de ticker da B3: 4 letras + 1 ou 2 digitos (ex: PETR4, TAEE11).
  -- Barra a entrada de lixo antes de gastar uma chamada na fonte.
  if p_ticker !~ '^[A-Z]{4}[0-9]{1,2}$' then
    return null;
  end if;

  select preco, now() - atualizado_em into v_preco, v_idade
  from public.cotacoes where ticker = p_ticker;

  -- Preco fresco o suficiente, reaproveita.
  if v_preco is not null and v_idade < interval '5 minutes' then
    return v_preco;
  end if;

  select valor into v_token from public.segredos where chave = 'brapi_token';
  if v_token is null then
    return v_preco;
  end if;

  begin
    select content::jsonb into v_resposta
    from extensions.http_get(
      'https://brapi.dev/api/v2/stocks/quote?symbols=' || p_ticker || '&token=' || v_token
    );

    v_preco := (v_resposta -> 'results' -> 0 -> 'data' ->> 'regularMarketPrice')::numeric;
    v_variacao := coalesce(
      (v_resposta -> 'results' -> 0 -> 'data' ->> 'regularMarketChangePercent')::numeric, 0);

    if v_preco is not null and v_preco > 0 then
      insert into public.cotacoes (ticker, preco, variacao, atualizado_em)
      values (p_ticker, round(v_preco, 2), round(v_variacao, 2), now())
      on conflict (ticker) do update
        set preco = excluded.preco, variacao = excluded.variacao,
            atualizado_em = excluded.atualizado_em;
      return round(v_preco, 2);
    end if;
  exception when others then
    -- Se a fonte falhar, entrega o ultimo preco conhecido (pode ser null).
    return v_preco;
  end;

  return v_preco;
end $$;

-- Atualiza a cotacao de todos os ativos permitidos de uma vez (chamada
-- pelo pg_cron a cada 5 minutos em horario de pregao — ver final do
-- arquivo). No maximo uma vez por minuto, pra nao martelar a brapi.
create or replace function public.atualizar_cotacoes(p_forcar boolean default false)
returns integer language plpgsql security definer set search_path = public, extensions as $$
declare
  v_token     text;
  v_ticker    text;
  v_resposta  jsonb;
  v_preco     numeric;
  v_variacao  numeric;
  v_mais_novo timestamptz;
  v_contador  integer := 0;
begin
  select max(atualizado_em) into v_mais_novo from public.cotacoes;
  if not p_forcar and v_mais_novo is not null and v_mais_novo > now() - interval '60 seconds' then
    return 0;
  end if;

  select valor into v_token from public.segredos where chave = 'brapi_token';
  if v_token is null then
    raise exception 'Token da brapi nao configurado.';
  end if;

  for v_ticker in select ticker from public.ativos_permitidos loop
    begin
      select content::jsonb into v_resposta
      from extensions.http_get(
        'https://brapi.dev/api/v2/stocks/quote?symbols=' || v_ticker || '&token=' || v_token
      );

      v_preco := (v_resposta -> 'results' -> 0 -> 'data' ->> 'regularMarketPrice')::numeric;
      v_variacao := coalesce(
        (v_resposta -> 'results' -> 0 -> 'data' ->> 'regularMarketChangePercent')::numeric, 0);

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
      -- Um papel que falhou nao derruba os outros. Fica a cotacao anterior.
      continue;
    end;
  end loop;

  return v_contador;
end $$;


-- ------------------------------------------------------------
-- COMPRAR: tira do saldo, soma na posicao, registra a transacao.
-- Tudo junto, ou nada. Assim o saldo nunca fica errado. O preco vem de
-- garantir_cotacao() — nunca do parametro do cliente.
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
-- PATRIMONIO DE: saldo + acoes pelo preco medio + renda fixa pelo
-- valor investido. Usada pelo ranking geral e pelo snapshot mensal.
-- ------------------------------------------------------------
create or replace function public.patrimonio_de(p_usuario uuid)
returns numeric language sql stable security definer set search_path = public as $$
  select
    coalesce((select saldo from public.perfis where id = p_usuario), 0)
      + coalesce((select sum(quantidade * preco_medio) from public.posicoes where usuario_id = p_usuario), 0)
      + coalesce((select sum(valor_investido) from public.investimentos_rf where usuario_id = p_usuario and resgatado = false), 0)
$$;


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
-- so pra montar o ranking — e uma aproximacao, nao o patrimonio exato
-- de cada um.
-- ------------------------------------------------------------
create or replace function public.ranking(p_limite integer default 50)
returns table(apelido text, patrimonio numeric, posicao bigint)
language sql security definer set search_path = public as $$
  select
    coalesce(p.apelido, 'Investidor') as apelido,
    public.patrimonio_de(p.id) as patrimonio,
    row_number() over (order by public.patrimonio_de(p.id) desc) as posicao
  from public.perfis p
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
  where p.mes_referencia = to_char(current_date, 'YYYY-MM')
    and p.patrimonio_inicio_mes is not null
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
-- ALERTAS DE PRECO: avisa (dentro do site, nao por e-mail — sem
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
-- cotacoes — o token fica em segredos, nunca numa env var da Vercel.
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
    return json_build_object('ok', true, 'restantes', 2);
  end if;

  if v_agente.execucoes_hoje >= 3 then
    raise exception 'Limite diario de 3 execucoes atingido. Volte amanha.';
  end if;

  update public.agentes set execucoes_hoje = execucoes_hoje + 1 where id = v_agente.id;
  return json_build_object('ok', true, 'restantes', 3 - (v_agente.execucoes_hoje + 1));
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
begin
  if v_usuario is null then
    raise exception 'Voce precisa estar logado.';
  end if;

  select * into v_agente from public.agentes where usuario_id = v_usuario;
  if not found then
    return json_build_object('existe', false);
  end if;

  if v_agente.ultimo_dia_execucao is distinct from current_date then
    v_restantes := 3;
  else
    v_restantes := greatest(0, 3 - v_agente.execucoes_hoje);
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
