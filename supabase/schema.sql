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
  id          uuid primary key references auth.users(id) on delete cascade,
  apelido     text,
  saldo       numeric(14,2) not null default saldo_inicial(),
  criado_em   timestamptz not null default now()
);

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
-- COMPRAR: tira do saldo, soma na posicao, registra a transacao.
-- Tudo junto, ou nada. Assim o saldo nunca fica errado.
-- ------------------------------------------------------------
create or replace function public.comprar(p_ticker text, p_qtd integer, p_preco numeric)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_usuario uuid := auth.uid();
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
  if p_preco is null or p_preco <= 0 then
    raise exception 'Preco invalido.';
  end if;

  v_custo := round(p_qtd * p_preco, 2);

  select saldo into v_saldo from public.perfis where id = v_usuario for update;
  if v_saldo is null then
    raise exception 'Perfil nao encontrado.';
  end if;
  if v_saldo < v_custo then
    raise exception 'Saldo insuficiente. Voce tem R$ % e precisa de R$ %.', v_saldo, v_custo;
  end if;

  update public.perfis set saldo = saldo - v_custo where id = v_usuario;

  select * into v_pos from public.posicoes
    where usuario_id = v_usuario and ticker = p_ticker for update;

  if found then
    update public.posicoes set
      quantidade  = v_pos.quantidade + p_qtd,
      preco_medio = round(
        ((v_pos.quantidade * v_pos.preco_medio) + v_custo) / (v_pos.quantidade + p_qtd), 2),
      atualizado_em = now()
    where id = v_pos.id;
  else
    insert into public.posicoes (usuario_id, ticker, quantidade, preco_medio)
    values (v_usuario, p_ticker, p_qtd, p_preco);
  end if;

  insert into public.transacoes (usuario_id, ticker, tipo, quantidade, preco, total)
  values (v_usuario, p_ticker, 'compra', p_qtd, p_preco, v_custo);

  return json_build_object('ok', true, 'custo', v_custo, 'saldo', v_saldo - v_custo);
end $$;


-- ------------------------------------------------------------
-- VENDER: devolve o dinheiro (ja descontado o IR quando devido),
-- baixa a posicao, registra.
--
-- Regra real simplificada da B3 pra acoes: vendas de ate R$20mil no
-- mes sao isentas. Passando disso, paga 15% sobre o LUCRO da venda
-- (nao sobre o valor total). Prejuizo nunca paga imposto.
-- ------------------------------------------------------------
create or replace function public.vender(p_ticker text, p_qtd integer, p_preco numeric)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_usuario     uuid := auth.uid();
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
  if p_preco is null or p_preco <= 0 then
    raise exception 'Preco invalido.';
  end if;

  select * into v_pos from public.posicoes
    where usuario_id = v_usuario and ticker = p_ticker for update;

  if not found then
    raise exception 'Voce nao tem % na carteira.', p_ticker;
  end if;
  if v_pos.quantidade < p_qtd then
    raise exception 'Voce tem apenas % cotas de %.', v_pos.quantidade, p_ticker;
  end if;

  v_valor := round(p_qtd * p_preco, 2);
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
  values (v_usuario, p_ticker, 'venda', p_qtd, p_preco, v_valor, v_imposto);

  return json_build_object('ok', true, 'valor', v_valor, 'imposto', v_imposto, 'liquido', v_liquido);
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
