-- Vestra: ligas (contests em grupo, N pessoas, nao so 1v1 como o duelo).
--
-- Ja aplicado no projeto. O mesmo conteudo ja esta refletido em
-- schema.sql, este arquivo fica so como registro do que mudou e por que.
--
-- Mesma mecanica do duelo (rentabilidade percentual desde que entrou,
-- num prazo fixo, com codigo de convite), mas pra um grupo qualquer em
-- vez de exatamente duas pessoas. E o formato que professor/turma ou
-- grupo de amigos maior usa de verdade.

create table if not exists public.ligas (
  id             uuid primary key default gen_random_uuid(),
  criador_id     uuid not null references auth.users(id) on delete cascade,
  nome           text not null,
  codigo_convite text not null unique,
  dias           integer not null check (dias > 0 and dias <= 90),
  criado_em      timestamptz not null default now()
);

alter table public.ligas enable row level security;

drop policy if exists "ligas: membros veem" on public.ligas;
create policy "ligas: membros veem" on public.ligas
  for select using (
    id in (select liga_id from public.liga_membros where usuario_id = auth.uid())
  );

create table if not exists public.liga_membros (
  liga_id            uuid not null references public.ligas(id) on delete cascade,
  usuario_id         uuid not null references auth.users(id) on delete cascade,
  patrimonio_inicial numeric(14,2) not null,
  entrou_em          timestamptz not null default now(),
  primary key (liga_id, usuario_id)
);

alter table public.liga_membros enable row level security;

drop policy if exists "liga_membros: membros veem" on public.liga_membros;
create policy "liga_membros: membros veem" on public.liga_membros
  for select using (
    liga_id in (select liga_id from public.liga_membros where usuario_id = auth.uid())
  );

create or replace function public.criar_liga(p_nome text, p_dias integer)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_usuario uuid := auth.uid();
  v_codigo  text;
  v_id      uuid;
  v_nome    text := left(trim(p_nome), 40);
begin
  if v_usuario is null then
    raise exception 'Voce precisa estar logado.';
  end if;
  if v_nome = '' then
    v_nome := 'Liga sem nome';
  end if;
  if p_dias is null or p_dias <= 0 or p_dias > 90 then
    raise exception 'Duracao invalida (1 a 90 dias).';
  end if;

  loop
    v_codigo := upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    exit when not exists (select 1 from public.ligas where codigo_convite = v_codigo);
  end loop;

  insert into public.ligas (criador_id, nome, codigo_convite, dias)
  values (v_usuario, v_nome, v_codigo, p_dias)
  returning id into v_id;

  insert into public.liga_membros (liga_id, usuario_id, patrimonio_inicial)
  values (v_id, v_usuario, public.patrimonio_de(v_usuario));

  return json_build_object('ok', true, 'id', v_id, 'codigo', v_codigo);
end $$;

create or replace function public.entrar_liga(p_codigo text)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_usuario uuid := auth.uid();
  v_liga    public.ligas%rowtype;
begin
  if v_usuario is null then
    raise exception 'Voce precisa estar logado.';
  end if;

  select * into v_liga from public.ligas where codigo_convite = upper(p_codigo);
  if not found then
    raise exception 'Codigo invalido.';
  end if;

  if now() > v_liga.criado_em + (v_liga.dias || ' days')::interval then
    raise exception 'Essa liga ja encerrou.';
  end if;

  if exists (select 1 from public.liga_membros where liga_id = v_liga.id and usuario_id = v_usuario) then
    raise exception 'Voce ja esta nessa liga.';
  end if;

  insert into public.liga_membros (liga_id, usuario_id, patrimonio_inicial)
  values (v_liga.id, v_usuario, public.patrimonio_de(v_usuario));

  return json_build_object('ok', true, 'id', v_liga.id);
end $$;

create or replace function public.listar_minhas_ligas()
returns json language plpgsql security definer set search_path = public as $$
declare
  v_usuario uuid := auth.uid();
begin
  if v_usuario is null then
    raise exception 'Voce precisa estar logado.';
  end if;

  return coalesce((
    select json_agg(json_build_object(
      'id', l.id,
      'nome', l.nome,
      'codigoConvite', l.codigo_convite,
      'dias', l.dias,
      'criadoEm', l.criado_em,
      'souCriador', l.criador_id = v_usuario,
      'membros', (
        select coalesce(json_agg(json_build_object(
          'apelido', x.apelido,
          'ganhoPct', x.ganho_pct,
          'souEu', x.usuario_id = v_usuario
        ) order by x.ganho_pct desc), '[]'::json)
        from (
          select
            m.usuario_id,
            coalesce(p.apelido, 'Investidor') as apelido,
            case when m.patrimonio_inicial > 0
              then ((public.patrimonio_de(m.usuario_id) - m.patrimonio_inicial) / m.patrimonio_inicial) * 100
              else 0 end as ganho_pct
          from public.liga_membros m
          left join public.perfis p on p.id = m.usuario_id
          where m.liga_id = l.id
        ) x
      )
    ) order by l.criado_em desc)
    from public.ligas l
    where l.id in (select liga_id from public.liga_membros where usuario_id = v_usuario)
  ), '[]'::json);
end $$;

create or replace function public.ver_liga_publica(p_codigo text)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_liga public.ligas%rowtype;
begin
  select * into v_liga from public.ligas where codigo_convite = upper(p_codigo);
  if not found then
    return json_build_object('ok', false);
  end if;

  return json_build_object(
    'ok', true,
    'nome', v_liga.nome,
    'dias', v_liga.dias,
    'criadoEm', v_liga.criado_em,
    'totalMembros', (select count(*) from public.liga_membros where liga_id = v_liga.id),
    'top', coalesce((
      select json_agg(json_build_object('apelido', x.apelido, 'ganhoPct', x.ganho_pct) order by x.ganho_pct desc)
      from (
        select
          coalesce(p.apelido, 'Investidor') as apelido,
          case when m.patrimonio_inicial > 0
            then ((public.patrimonio_de(m.usuario_id) - m.patrimonio_inicial) / m.patrimonio_inicial) * 100
            else 0 end as ganho_pct
        from public.liga_membros m
        left join public.perfis p on p.id = m.usuario_id
        where m.liga_id = v_liga.id
        order by ganho_pct desc
        limit 3
      ) x
    ), '[]'::json)
  );
end $$;

grant execute on function public.ver_liga_publica(text) to anon, authenticated;
