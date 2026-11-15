-- Vestra Challenge: competicoes com carteira PROPRIA.
--
-- Por que nao reaproveitar as ligas: a liga mede a carteira pessoal
-- inteira desde que a pessoa entrou. Numa competicao oficial isso e
-- injusto (cada um comeca com um patrimonio diferente, posicoes antigas
-- contam) e nao da pra auditar. Aqui cada participante recebe o mesmo
-- capital, numa carteira que so existe dentro da competicao, e toda
-- ordem fica registrada com horario, preco e tese.
--
-- Regras fixas desta primeira versao:
--   * preco sempre vem de garantir_cotacao(), nunca do navegador;
--   * so opera entre inicio e fim;
--   * sem imposto, dividendo, alavancagem ou venda a descoberto, pra
--     ficar simples de entender e de conferir;
--   * no encerramento o patrimonio de cada um e congelado
--     (patrimonio_final), e o ranking passa a usar so esse valor.
--
-- O mesmo conteudo esta refletido no fim de schema.sql.

create table if not exists public.competicoes (
  id                uuid primary key default gen_random_uuid(),
  organizador_id    uuid not null references auth.users(id) on delete cascade,
  nome              text not null check (char_length(nome) between 3 and 60),
  codigo            text not null unique,
  capital_inicial   numeric(14,2) not null check (capital_inicial between 1000 and 10000000),
  inicio            timestamptz not null,
  fim               timestamptz not null,
  dominio_email     text check (dominio_email ~ '^[a-z0-9.-]+\.[a-z]{2,}$'),
  tese_obrigatoria  boolean not null default true,
  finalizada_em     timestamptz,
  criado_em         timestamptz not null default now(),
  check (fim > inicio),
  check (fim - inicio <= interval '120 days')
);

create index if not exists competicoes_organizador_idx on public.competicoes(organizador_id);

alter table public.competicoes enable row level security;

drop policy if exists "competicoes: organizador ve" on public.competicoes;
create policy "competicoes: organizador ve" on public.competicoes
  for select to authenticated using (auth.uid() = organizador_id);

create table if not exists public.competicao_participantes (
  competicao_id    uuid not null references public.competicoes(id) on delete cascade,
  usuario_id       uuid not null references auth.users(id) on delete cascade,
  caixa            numeric(14,2) not null check (caixa >= 0),
  patrimonio_final numeric(14,2),
  entrou_em        timestamptz not null default now(),
  primary key (competicao_id, usuario_id)
);

create index if not exists competicao_participantes_usuario_idx
  on public.competicao_participantes(usuario_id);

alter table public.competicao_participantes enable row level security;

drop policy if exists "competicao_participantes: proprio" on public.competicao_participantes;
create policy "competicao_participantes: proprio" on public.competicao_participantes
  for select to authenticated using (auth.uid() = usuario_id);

create table if not exists public.competicao_posicoes (
  competicao_id uuid not null references public.competicoes(id) on delete cascade,
  usuario_id    uuid not null references auth.users(id) on delete cascade,
  ticker        text not null,
  quantidade    integer not null check (quantidade > 0),
  preco_medio   numeric(14,2) not null check (preco_medio > 0),
  atualizado_em timestamptz not null default now(),
  primary key (competicao_id, usuario_id, ticker)
);

alter table public.competicao_posicoes enable row level security;

drop policy if exists "competicao_posicoes: proprio" on public.competicao_posicoes;
create policy "competicao_posicoes: proprio" on public.competicao_posicoes
  for select to authenticated using (auth.uid() = usuario_id);

-- Log de auditoria: so recebe insert pelas funcoes abaixo, nunca update
-- ou delete. E o que permite ao organizador conferir qualquer resultado.
create table if not exists public.competicao_ordens (
  id            uuid primary key default gen_random_uuid(),
  competicao_id uuid not null references public.competicoes(id) on delete cascade,
  usuario_id    uuid not null references auth.users(id) on delete cascade,
  ticker        text not null,
  tipo          text not null check (tipo in ('compra', 'venda')),
  quantidade    integer not null check (quantidade > 0),
  preco         numeric(14,2) not null check (preco > 0),
  total         numeric(14,2) not null,
  tese          text check (char_length(tese) <= 500),
  executada_em  timestamptz not null default now()
);

create index if not exists competicao_ordens_idx
  on public.competicao_ordens(competicao_id, usuario_id, executada_em desc);

alter table public.competicao_ordens enable row level security;

drop policy if exists "competicao_ordens: proprio" on public.competicao_ordens;
create policy "competicao_ordens: proprio" on public.competicao_ordens
  for select to authenticated using (auth.uid() = usuario_id);


-- ------------------------------------------------------------
-- Helpers internos (nao expostos para anon/authenticated)
-- ------------------------------------------------------------
create or replace function public.status_competicao(p_inicio timestamptz, p_fim timestamptz)
returns text language sql stable set search_path = public as $$
  select case
    when now() < p_inicio then 'agendada'
    when now() < p_fim then 'aberta'
    else 'encerrada'
  end
$$;

create or replace function public.patrimonio_competicao(p_competicao uuid, p_usuario uuid)
returns numeric language sql stable security definer set search_path = public as $$
  select
    coalesce((
      select caixa from public.competicao_participantes
      where competicao_id = p_competicao and usuario_id = p_usuario
    ), 0)
    + coalesce((
      select sum(cp.quantidade * coalesce(c.preco, cp.preco_medio))
      from public.competicao_posicoes cp
      left join public.cotacoes c on c.ticker = cp.ticker
      where cp.competicao_id = p_competicao and cp.usuario_id = p_usuario
    ), 0)
$$;

-- Congela o resultado na primeira consulta depois do fim. Antes de
-- congelar, atualiza a cotacao de todo ticker em carteira, pra ninguem
-- ser medido por um preco velho de cache. Recomendado marcar o fim
-- depois do fechamento do pregao, assim o preco usado e o de fechamento.
create or replace function public.finalizar_competicao(p_competicao uuid)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare
  v_comp   public.competicoes%rowtype;
  v_ticker text;
begin
  select * into v_comp from public.competicoes where id = p_competicao for update;
  if not found or v_comp.finalizada_em is not null or now() < v_comp.fim then
    return;
  end if;

  for v_ticker in
    select distinct ticker from public.competicao_posicoes where competicao_id = p_competicao
  loop
    begin
      perform public.garantir_cotacao(v_ticker);
    exception when others then
      null;
    end;
  end loop;

  update public.competicao_participantes
    set patrimonio_final = round(public.patrimonio_competicao(p_competicao, usuario_id), 2)
    where competicao_id = p_competicao;

  update public.competicoes set finalizada_em = now() where id = p_competicao;
end $$;

revoke all on function public.status_competicao(timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function public.patrimonio_competicao(uuid, uuid) from public, anon, authenticated;
revoke all on function public.finalizar_competicao(uuid) from public, anon, authenticated;


-- ------------------------------------------------------------
-- CRIAR: qualquer pessoa logada pode organizar uma competicao.
-- ------------------------------------------------------------
create or replace function public.criar_competicao(
  p_nome text,
  p_inicio timestamptz,
  p_fim timestamptz,
  p_capital numeric,
  p_dominio_email text default null,
  p_tese_obrigatoria boolean default true
)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_usuario uuid := auth.uid();
  v_nome    text := left(trim(coalesce(p_nome, '')), 60);
  v_dominio text := nullif(lower(trim(both '@ ' from coalesce(p_dominio_email, ''))), '');
  v_codigo  text;
  v_ativas  integer;
begin
  if v_usuario is null then
    raise exception 'Você precisa estar logado.';
  end if;
  if char_length(v_nome) < 3 then
    raise exception 'Dê um nome com pelo menos 3 letras.';
  end if;
  if p_inicio is null or p_fim is null or p_fim <= p_inicio then
    raise exception 'O fim precisa ser depois do início.';
  end if;
  if p_inicio < now() - interval '1 hour' then
    raise exception 'O início não pode ficar no passado.';
  end if;
  if p_fim - p_inicio > interval '120 days' then
    raise exception 'A competição pode durar no máximo 120 dias.';
  end if;
  if p_capital is null or p_capital < 1000 or p_capital > 10000000 then
    raise exception 'O capital inicial precisa ficar entre R$ 1.000 e R$ 10.000.000.';
  end if;
  if v_dominio is not null and v_dominio !~ '^[a-z0-9.-]+\.[a-z]{2,}$' then
    raise exception 'Domínio de e-mail inválido. Use algo como mackenzie.br.';
  end if;

  select count(*) into v_ativas from public.competicoes
    where organizador_id = v_usuario and fim > now();
  if v_ativas >= 10 then
    raise exception 'Você já organiza 10 competições ativas.';
  end if;

  loop
    v_codigo := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from public.competicoes where codigo = v_codigo);
  end loop;

  insert into public.competicoes
    (organizador_id, nome, codigo, capital_inicial, inicio, fim, dominio_email, tese_obrigatoria)
  values
    (v_usuario, v_nome, v_codigo, round(p_capital, 2), p_inicio, p_fim, v_dominio, coalesce(p_tese_obrigatoria, true));

  return json_build_object('ok', true, 'codigo', v_codigo);
end $$;

revoke all on function public.criar_competicao(text, timestamptz, timestamptz, numeric, text, boolean) from public, anon;
grant execute on function public.criar_competicao(text, timestamptz, timestamptz, numeric, text, boolean) to authenticated;


-- ------------------------------------------------------------
-- ENTRAR: confere prazo e, se houver, o dominio do e-mail.
-- ------------------------------------------------------------
create or replace function public.entrar_competicao(p_codigo text)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_usuario uuid := auth.uid();
  v_comp    public.competicoes%rowtype;
  v_email   text;
  v_dominio text;
begin
  if v_usuario is null then
    raise exception 'Você precisa estar logado.';
  end if;

  select * into v_comp from public.competicoes where codigo = upper(trim(coalesce(p_codigo, '')));
  if not found then
    raise exception 'Código inválido.';
  end if;
  if now() >= v_comp.fim then
    raise exception 'Essa competição já encerrou.';
  end if;

  if v_comp.dominio_email is not null then
    select lower(email) into v_email from auth.users where id = v_usuario;
    v_dominio := split_part(coalesce(v_email, ''), '@', 2);
    if v_dominio <> v_comp.dominio_email and v_dominio not like '%.' || v_comp.dominio_email then
      raise exception 'Essa competição é só para e-mails @%.', v_comp.dominio_email;
    end if;
  end if;

  if exists (
    select 1 from public.competicao_participantes
    where competicao_id = v_comp.id and usuario_id = v_usuario
  ) then
    raise exception 'Você já está inscrito nessa competição.';
  end if;

  insert into public.competicao_participantes (competicao_id, usuario_id, caixa)
  values (v_comp.id, v_usuario, v_comp.capital_inicial);

  return json_build_object('ok', true, 'codigo', v_comp.codigo);
end $$;

revoke all on function public.entrar_competicao(text) from public, anon;
grant execute on function public.entrar_competicao(text) to authenticated;


-- ------------------------------------------------------------
-- OPERAR: compra ou venda a mercado dentro da carteira da competicao.
-- ------------------------------------------------------------
create or replace function public.operar_competicao(
  p_codigo text,
  p_tipo text,
  p_ticker text,
  p_qtd integer,
  p_tese text default null
)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare
  v_usuario uuid := auth.uid();
  v_comp    public.competicoes%rowtype;
  v_part    public.competicao_participantes%rowtype;
  v_pos     public.competicao_posicoes%rowtype;
  v_ticker  text := upper(trim(coalesce(p_ticker, '')));
  v_tese    text := left(trim(coalesce(p_tese, '')), 500);
  v_preco   numeric(14,2);
  v_total   numeric(14,2);
begin
  if v_usuario is null then
    raise exception 'Você precisa estar logado.';
  end if;
  if p_tipo not in ('compra', 'venda') then
    raise exception 'Tipo de ordem inválido.';
  end if;
  if p_qtd is null or p_qtd <= 0 or p_qtd > 1000000 then
    raise exception 'A quantidade precisa ser de pelo menos 1 cota.';
  end if;
  if v_ticker = '' then
    raise exception 'Informe o código do ativo.';
  end if;

  select * into v_comp from public.competicoes where codigo = upper(trim(coalesce(p_codigo, '')));
  if not found then
    raise exception 'Competição não encontrada.';
  end if;
  if now() < v_comp.inicio then
    raise exception 'A competição ainda não começou.';
  end if;
  if now() >= v_comp.fim then
    raise exception 'A competição já encerrou.';
  end if;

  if v_comp.tese_obrigatoria and char_length(v_tese) < 15 then
    raise exception 'Escreva sua tese, com pelo menos 15 caracteres: por que essa operação?';
  end if;
  if v_tese = '' then
    v_tese := null;
  end if;

  select * into v_part from public.competicao_participantes
    where competicao_id = v_comp.id and usuario_id = v_usuario for update;
  if not found then
    raise exception 'Você não está inscrito nessa competição.';
  end if;

  v_preco := public.garantir_cotacao(v_ticker);
  if v_preco is null or v_preco <= 0 then
    raise exception 'Não consegui confirmar o preço de %. Confira o código e tente de novo.', v_ticker;
  end if;

  v_total := round(p_qtd * v_preco, 2);

  if p_tipo = 'compra' then
    if v_part.caixa < v_total then
      raise exception 'Caixa insuficiente: você tem R$ % e a ordem custa R$ %.', v_part.caixa, v_total;
    end if;

    update public.competicao_participantes set caixa = caixa - v_total
      where competicao_id = v_comp.id and usuario_id = v_usuario;

    insert into public.competicao_posicoes as pos (competicao_id, usuario_id, ticker, quantidade, preco_medio)
    values (v_comp.id, v_usuario, v_ticker, p_qtd, v_preco)
    on conflict (competicao_id, usuario_id, ticker) do update set
      quantidade    = pos.quantidade + excluded.quantidade,
      preco_medio   = round(((pos.quantidade * pos.preco_medio) + v_total) / (pos.quantidade + excluded.quantidade), 2),
      atualizado_em = now();
  else
    select * into v_pos from public.competicao_posicoes
      where competicao_id = v_comp.id and usuario_id = v_usuario and ticker = v_ticker for update;
    if not found then
      raise exception 'Você não tem % nessa carteira.', v_ticker;
    end if;
    if v_pos.quantidade < p_qtd then
      raise exception 'Você tem apenas % cotas de %.', v_pos.quantidade, v_ticker;
    end if;

    if v_pos.quantidade = p_qtd then
      delete from public.competicao_posicoes
        where competicao_id = v_comp.id and usuario_id = v_usuario and ticker = v_ticker;
    else
      update public.competicao_posicoes
        set quantidade = quantidade - p_qtd, atualizado_em = now()
        where competicao_id = v_comp.id and usuario_id = v_usuario and ticker = v_ticker;
    end if;

    update public.competicao_participantes set caixa = caixa + v_total
      where competicao_id = v_comp.id and usuario_id = v_usuario;
  end if;

  insert into public.competicao_ordens (competicao_id, usuario_id, ticker, tipo, quantidade, preco, total, tese)
  values (v_comp.id, v_usuario, v_ticker, p_tipo, p_qtd, v_preco, v_total, v_tese);

  return json_build_object('ok', true, 'preco', v_preco, 'total', v_total);
end $$;

revoke all on function public.operar_competicao(text, text, text, integer, text) from public, anon;
grant execute on function public.operar_competicao(text, text, text, integer, text) to authenticated;


-- ------------------------------------------------------------
-- VER: dados publicos + ranking para qualquer um; carteira e ordens
-- proprias para participante; todas as ordens para o organizador.
-- Carteiras de outros participantes nao aparecem, pra ninguem copiar.
-- ------------------------------------------------------------
create or replace function public.ver_competicao(p_codigo text)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare
  v_usuario     uuid := auth.uid();
  v_comp        public.competicoes%rowtype;
  v_organizador boolean;
  v_part        public.competicao_participantes%rowtype;
  v_participa   boolean := false;
  v_ranking     json;
  v_carteira    json := null;
  v_ordens      json := null;
  v_patrimonio  numeric;
begin
  select * into v_comp from public.competicoes where codigo = upper(trim(coalesce(p_codigo, '')));
  if not found then
    return json_build_object('ok', false);
  end if;

  if now() >= v_comp.fim and v_comp.finalizada_em is null then
    perform public.finalizar_competicao(v_comp.id);
    select * into v_comp from public.competicoes where id = v_comp.id;
  end if;

  v_organizador := v_usuario is not null and v_usuario = v_comp.organizador_id;

  if v_usuario is not null then
    select * into v_part from public.competicao_participantes
      where competicao_id = v_comp.id and usuario_id = v_usuario;
    v_participa := found;
  end if;

  select coalesce(json_agg(json_build_object(
      'posicao', x.posicao,
      'apelido', x.apelido,
      'patrimonio', round(x.patrimonio, 2),
      'retornoPct', round(((x.patrimonio - v_comp.capital_inicial) / v_comp.capital_inicial) * 100, 2),
      'ordens', x.ordens,
      'souEu', coalesce(x.usuario_id = v_usuario, false)
    ) order by x.posicao), '[]'::json)
  into v_ranking
  from (
    select
      b.*,
      row_number() over (order by b.patrimonio desc, b.entrou_em asc) as posicao
    from (
      select
        p.usuario_id,
        p.entrou_em,
        coalesce(pf.apelido, 'Investidor') as apelido,
        case when v_comp.finalizada_em is not null
          then coalesce(p.patrimonio_final, p.caixa)
          else public.patrimonio_competicao(v_comp.id, p.usuario_id)
        end as patrimonio,
        (select count(*) from public.competicao_ordens o
          where o.competicao_id = v_comp.id and o.usuario_id = p.usuario_id) as ordens
      from public.competicao_participantes p
      left join public.perfis pf on pf.id = p.usuario_id
      where p.competicao_id = v_comp.id
    ) b
  ) x
  where x.posicao <= 500;

  if v_participa then
    v_patrimonio := case when v_comp.finalizada_em is not null
      then coalesce(v_part.patrimonio_final, v_part.caixa)
      else public.patrimonio_competicao(v_comp.id, v_usuario)
    end;

    v_carteira := json_build_object(
      'caixa', v_part.caixa,
      'patrimonio', round(v_patrimonio, 2),
      'retornoPct', round(((v_patrimonio - v_comp.capital_inicial) / v_comp.capital_inicial) * 100, 2),
      'posicoes', coalesce((
        select json_agg(json_build_object(
          'ticker', cp.ticker,
          'quantidade', cp.quantidade,
          'precoMedio', cp.preco_medio,
          'precoAtual', coalesce(c.preco, cp.preco_medio),
          'valor', round(cp.quantidade * coalesce(c.preco, cp.preco_medio), 2)
        ) order by cp.quantidade * coalesce(c.preco, cp.preco_medio) desc)
        from public.competicao_posicoes cp
        left join public.cotacoes c on c.ticker = cp.ticker
        where cp.competicao_id = v_comp.id and cp.usuario_id = v_usuario
      ), '[]'::json)
    );
  end if;

  if v_organizador or v_participa then
    select coalesce(json_agg(json_build_object(
        'id', o.id,
        'apelido', coalesce(pf.apelido, 'Investidor'),
        'ticker', o.ticker,
        'tipo', o.tipo,
        'quantidade', o.quantidade,
        'preco', o.preco,
        'total', o.total,
        'tese', o.tese,
        'executadaEm', o.executada_em
      ) order by o.executada_em desc), '[]'::json)
    into v_ordens
    from (
      select * from public.competicao_ordens
      where competicao_id = v_comp.id
        and (v_organizador or usuario_id = v_usuario)
      order by executada_em desc
      limit 1000
    ) o
    left join public.perfis pf on pf.id = o.usuario_id;
  end if;

  return json_build_object(
    'ok', true,
    'nome', v_comp.nome,
    'codigo', v_comp.codigo,
    'capitalInicial', v_comp.capital_inicial,
    'inicio', v_comp.inicio,
    'fim', v_comp.fim,
    'status', public.status_competicao(v_comp.inicio, v_comp.fim),
    'finalizada', v_comp.finalizada_em is not null,
    'dominioEmail', v_comp.dominio_email,
    'teseObrigatoria', v_comp.tese_obrigatoria,
    'totalParticipantes', (select count(*) from public.competicao_participantes where competicao_id = v_comp.id),
    'souOrganizador', v_organizador,
    'souParticipante', v_participa,
    'ranking', v_ranking,
    'carteira', v_carteira,
    'ordens', v_ordens
  );
end $$;

revoke all on function public.ver_competicao(text) from public;
grant execute on function public.ver_competicao(text) to anon, authenticated;


-- ------------------------------------------------------------
-- LISTAR: competicoes em que a pessoa participa ou que organiza.
-- ------------------------------------------------------------
create or replace function public.listar_minhas_competicoes()
returns json language plpgsql security definer set search_path = public as $$
declare
  v_usuario uuid := auth.uid();
begin
  if v_usuario is null then
    raise exception 'Você precisa estar logado.';
  end if;

  return coalesce((
    select json_agg(json_build_object(
      'codigo', c.codigo,
      'nome', c.nome,
      'inicio', c.inicio,
      'fim', c.fim,
      'status', public.status_competicao(c.inicio, c.fim),
      'souOrganizador', c.organizador_id = v_usuario,
      'participo', p.usuario_id is not null,
      'totalParticipantes', (select count(*) from public.competicao_participantes x where x.competicao_id = c.id)
    ) order by c.fim desc)
    from public.competicoes c
    left join public.competicao_participantes p
      on p.competicao_id = c.id and p.usuario_id = v_usuario
    where c.organizador_id = v_usuario or p.usuario_id is not null
  ), '[]'::json);
end $$;

revoke all on function public.listar_minhas_competicoes() from public, anon;
grant execute on function public.listar_minhas_competicoes() to authenticated;
