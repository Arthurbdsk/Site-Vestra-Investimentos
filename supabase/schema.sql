-- ============================================================
-- BANCO DE DADOS DO SIMULADOR
-- Copie TODO este arquivo e cole no "SQL Editor" do Supabase,
-- depois clique em "Run". Pode rodar mais de uma vez sem quebrar.
--
-- IMPORTANTE (uma vez so, antes de rodar isto pela primeira vez):
-- as funcoes comprar/vender abaixo verificam uma assinatura do preco
-- pra ninguem conseguir chamar esse RPC direto (por fora do site) e
-- forjar um preco. Isso exige um segredo guardado no Vault do Supabase,
-- que precisa ser IGUAL ao da variavel PRECO_ASSINATURA_SECRET no
-- .env.local / Vercel. Rode isto uma unica vez, com um valor aleatorio
-- longo (o mesmo que voce vai colocar em PRECO_ASSINATURA_SECRET):
--
--   select vault.create_secret('COLE_AQUI_O_MESMO_VALOR_DO_ENV', 'preco_assinatura_secret');
--
-- Se precisar trocar o segredo depois:
--
--   select vault.update_secret(
--     (select id from vault.secrets where name = 'preco_assinatura_secret'),
--     'NOVO_VALOR'
--   );
-- ============================================================

create extension if not exists pgcrypto;

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
-- TRANSACOES: historico de tudo que foi comprado e vendido
-- ------------------------------------------------------------
create table if not exists public.transacoes (
  id          uuid primary key default gen_random_uuid(),
  usuario_id  uuid not null references auth.users(id) on delete cascade,
  ticker      text not null,
  tipo        text not null check (tipo in ('compra','venda')),
  quantidade  integer not null check (quantidade > 0),
  preco       numeric(14,2) not null check (preco > 0),
  total       numeric(14,2) not null,
  criado_em   timestamptz not null default now()
);

create index if not exists transacoes_usuario_idx
  on public.transacoes(usuario_id, criado_em desc);

alter table public.transacoes enable row level security;

drop policy if exists "transacoes proprias" on public.transacoes;
create policy "transacoes proprias" on public.transacoes
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
-- Verifica a assinatura de um preco (veja o aviso do topo do arquivo).
-- Sem isso, qualquer pessoa com uma sessao valida poderia chamar
-- comprar/vender direto (por fora do site) e inventar o preco que
-- quisesse. Aqui o banco recalcula a assinatura com o mesmo segredo do
-- servidor e so aceita se bater e ainda nao tiver expirado.
-- ------------------------------------------------------------
create or replace function public.verificar_preco_assinado(
  p_ticker text, p_preco_texto text, p_expira_em bigint, p_assinatura text
) returns numeric language plpgsql security definer set search_path = public as $$
declare
  v_segredo text;
  v_mensagem text;
  v_esperada text;
begin
  select decrypted_secret into v_segredo
    from vault.decrypted_secrets where name = 'preco_assinatura_secret';

  if v_segredo is null then
    raise exception 'Segredo de assinatura de preco nao configurado no Vault.';
  end if;

  if p_expira_em < (extract(epoch from now()) * 1000)::bigint then
    raise exception 'Essa cotacao expirou. Tente de novo.';
  end if;

  v_mensagem := p_ticker || '|' || p_preco_texto || '|' || p_expira_em::text;
  v_esperada := encode(hmac(v_mensagem, v_segredo, 'sha256'), 'hex');

  if v_esperada <> p_assinatura then
    raise exception 'Preco nao pode ser confirmado. Tente de novo.';
  end if;

  return p_preco_texto::numeric;
end $$;


-- Remove as versoes antigas (3 parametros, preco direto sem assinatura).
-- Sem isso as duas ficariam coexistindo no banco — Postgres permite
-- sobrecarga de funcao por assinatura diferente — e a brecha continuaria
-- aberta pela versao velha.
drop function if exists public.comprar(text, integer, numeric);
drop function if exists public.vender(text, integer, numeric);


-- ------------------------------------------------------------
-- COMPRAR: tira do saldo, soma na posicao, registra a transacao.
-- Tudo junto, ou nada. Assim o saldo nunca fica errado.
-- ------------------------------------------------------------
create or replace function public.comprar(
  p_ticker text, p_qtd integer, p_preco_texto text, p_expira_em bigint, p_assinatura text
)
returns json language plpgsql security definer set search_path = public as $$
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

  v_preco := public.verificar_preco_assinado(p_ticker, p_preco_texto, p_expira_em, p_assinatura);
  if v_preco <= 0 then
    raise exception 'Preco invalido.';
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
    values (v_usuario, p_ticker, p_qtd, v_preco);
  end if;

  insert into public.transacoes (usuario_id, ticker, tipo, quantidade, preco, total)
  values (v_usuario, p_ticker, 'compra', p_qtd, v_preco, v_custo);

  return json_build_object('ok', true, 'preco', v_preco, 'custo', v_custo, 'saldo', v_saldo - v_custo);
end $$;


-- ------------------------------------------------------------
-- VENDER: devolve o dinheiro, baixa a posicao, registra
-- ------------------------------------------------------------
create or replace function public.vender(
  p_ticker text, p_qtd integer, p_preco_texto text, p_expira_em bigint, p_assinatura text
)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_usuario uuid := auth.uid();
  v_preco   numeric(14,2);
  v_valor   numeric(14,2);
  v_pos     public.posicoes%rowtype;
begin
  if v_usuario is null then
    raise exception 'Voce precisa estar logado.';
  end if;
  if p_qtd is null or p_qtd <= 0 then
    raise exception 'A quantidade precisa ser maior que zero.';
  end if;

  v_preco := public.verificar_preco_assinado(p_ticker, p_preco_texto, p_expira_em, p_assinatura);
  if v_preco <= 0 then
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

  v_valor := round(p_qtd * v_preco, 2);

  if v_pos.quantidade = p_qtd then
    delete from public.posicoes where id = v_pos.id;
  else
    update public.posicoes
      set quantidade = v_pos.quantidade - p_qtd, atualizado_em = now()
      where id = v_pos.id;
  end if;

  update public.perfis set saldo = saldo + v_valor where id = v_usuario;

  insert into public.transacoes (usuario_id, ticker, tipo, quantidade, preco, total)
  values (v_usuario, p_ticker, 'venda', p_qtd, v_preco, v_valor);

  return json_build_object('ok', true, 'valor', v_valor);
end $$;
