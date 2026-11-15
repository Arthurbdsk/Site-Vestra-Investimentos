-- Vestra Challenge oficial x competicoes da comunidade.
--
-- O "Vestra Challenge" e a competicao principal, organizada pelo proprio
-- Vestra (tela /challenge). Qualquer pessoa continua podendo criar a sua
-- (tela /competicoes). A diferenca e so a marca `oficial`, que apenas
-- quem esta em vestra_admins consegue ligar.
--
-- As ligas saem do site (a competicao faz o mesmo papel, com regras
-- mais justas). As tabelas e funcoes das ligas ficam no banco de
-- proposito, para nao apagar dados de quem ja usou.
--
-- Para tornar alguem admin (rodar no SQL Editor):
--   insert into public.vestra_admins (usuario_id)
--   select id from auth.users where email = 'EMAIL_DA_PESSOA';

alter table public.competicoes add column if not exists oficial boolean not null default false;

create index if not exists competicoes_oficial_idx on public.competicoes(fim desc) where oficial;

create table if not exists public.vestra_admins (
  usuario_id uuid primary key references auth.users(id) on delete cascade,
  criado_em  timestamptz not null default now()
);

-- RLS ligado e nenhuma policy: ninguem le ou escreve por fora das funcoes.
alter table public.vestra_admins enable row level security;

create or replace function public.sou_admin_vestra()
returns boolean language sql stable security definer set search_path = public as $$
  select auth.uid() is not null
    and exists (select 1 from public.vestra_admins where usuario_id = auth.uid())
$$;

revoke all on function public.sou_admin_vestra() from public, anon;
grant execute on function public.sou_admin_vestra() to authenticated;


-- CRIAR ganha p_oficial. Drop antes porque mudar a lista de parametros
-- com create or replace criaria uma sobrecarga ambigua.
drop function if exists public.criar_competicao(text, timestamptz, timestamptz, numeric, text, boolean);

create or replace function public.criar_competicao(
  p_nome text,
  p_inicio timestamptz,
  p_fim timestamptz,
  p_capital numeric,
  p_dominio_email text default null,
  p_tese_obrigatoria boolean default true,
  p_oficial boolean default false
)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_usuario uuid := auth.uid();
  v_nome    text := left(trim(coalesce(p_nome, '')), 60);
  v_dominio text := nullif(lower(trim(both '@ ' from coalesce(p_dominio_email, ''))), '');
  v_oficial boolean := coalesce(p_oficial, false);
  v_codigo  text;
  v_ativas  integer;
begin
  if v_usuario is null then
    raise exception 'Você precisa estar logado.';
  end if;
  if v_oficial and not exists (select 1 from public.vestra_admins where usuario_id = v_usuario) then
    raise exception 'Só a equipe do Vestra pode criar uma edição oficial.';
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
    (organizador_id, nome, codigo, capital_inicial, inicio, fim, dominio_email, tese_obrigatoria, oficial)
  values
    (v_usuario, v_nome, v_codigo, round(p_capital, 2), p_inicio, p_fim, v_dominio,
     coalesce(p_tese_obrigatoria, true), v_oficial);

  return json_build_object('ok', true, 'codigo', v_codigo);
end $$;

revoke all on function public.criar_competicao(text, timestamptz, timestamptz, numeric, text, boolean, boolean) from public, anon;
grant execute on function public.criar_competicao(text, timestamptz, timestamptz, numeric, text, boolean, boolean) to authenticated;


-- EDICOES OFICIAIS: lista publica para a tela /challenge. Para edicoes
-- encerradas devolve o podio (finalizando antes, se ainda nao foi).
create or replace function public.listar_challenge_oficial()
returns json language plpgsql security definer set search_path = public, extensions as $$
declare
  v_id uuid;
begin
  for v_id in
    select id from public.competicoes
    where oficial and now() >= fim and finalizada_em is null
  loop
    perform public.finalizar_competicao(v_id);
  end loop;

  return coalesce((
    select json_agg(json_build_object(
      'codigo', c.codigo,
      'nome', c.nome,
      'inicio', c.inicio,
      'fim', c.fim,
      'capitalInicial', c.capital_inicial,
      'status', public.status_competicao(c.inicio, c.fim),
      'totalParticipantes', (select count(*) from public.competicao_participantes p where p.competicao_id = c.id),
      'podio', case when c.finalizada_em is null then '[]'::json else coalesce((
        select json_agg(json_build_object(
          'posicao', x.posicao,
          'apelido', x.apelido,
          'retornoPct', round(((x.patrimonio_final - c.capital_inicial) / c.capital_inicial) * 100, 2)
        ) order by x.posicao)
        from (
          select
            coalesce(pf.apelido, 'Investidor') as apelido,
            p.patrimonio_final,
            row_number() over (order by p.patrimonio_final desc nulls last, p.entrou_em asc) as posicao
          from public.competicao_participantes p
          left join public.perfis pf on pf.id = p.usuario_id
          where p.competicao_id = c.id
        ) x
        where x.posicao <= 3
      ), '[]'::json) end
    ) order by c.inicio desc)
    from public.competicoes c
    where c.oficial
  ), '[]'::json);
end $$;

revoke all on function public.listar_challenge_oficial() from public;
grant execute on function public.listar_challenge_oficial() to anon, authenticated;


-- VER ganha o campo `oficial`. Resto igual a 009.
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
    'oficial', v_comp.oficial,
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


-- LISTAR ganha `oficial`, pra lista de "suas competicoes" marcar a edicao oficial.
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
      'oficial', c.oficial,
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
