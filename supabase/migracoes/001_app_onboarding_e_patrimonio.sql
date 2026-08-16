-- Vestra, etapa 1 do aplicativo.
--
-- Cria o que a estrutura nova precisa: memoria do onboarding e a marcacao
-- diaria de patrimonio que alimenta o grafico de evolucao da tela Inicio.
--
-- Rode no SQL Editor do Supabase. Pode rodar mais de uma vez sem estragar
-- nada (tudo e "if not exists" ou "create or replace").

-- ------------------------------------------------------------------
-- 1. Onboarding: quem ja viu, e o nivel declarado
-- ------------------------------------------------------------------

alter table public.perfis
  add column if not exists onboarding_visto_em timestamptz;

alter table public.perfis
  add column if not exists nivel_experiencia text;

-- Restringe os valores aceitos, mas so cria a regra se ela ainda nao existe.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'perfis_nivel_experiencia_valido'
  ) then
    alter table public.perfis
      add constraint perfis_nivel_experiencia_valido
      check (nivel_experiencia is null
             or nivel_experiencia in ('iniciante', 'intermediario', 'avancado'));
  end if;
end $$;

-- A pessoa precisa LER as colunas novas (a pagina decide se mostra o
-- onboarding a partir delas), mas nao pode ESCREVER: quem grava e a
-- funcao abaixo, que valida o valor antes.
grant select (onboarding_visto_em, nivel_experiencia)
  on public.perfis to authenticated, anon;

create or replace function public.salvar_onboarding(p_nivel text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Sem sessao ativa.';
  end if;

  if p_nivel not in ('iniciante', 'intermediario', 'avancado') then
    raise exception 'Nivel de experiencia invalido.';
  end if;

  -- coalesce pra nao reescrever a data toda vez que a pessoa refizer:
  -- interessa quando ela viu pela PRIMEIRA vez.
  update public.perfis
     set nivel_experiencia = p_nivel,
         onboarding_visto_em = coalesce(onboarding_visto_em, now())
   where id = auth.uid();
end $$;

create or replace function public.marcar_onboarding_visto()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Sem sessao ativa.';
  end if;

  update public.perfis
     set onboarding_visto_em = coalesce(onboarding_visto_em, now())
   where id = auth.uid();
end $$;

grant execute on function public.salvar_onboarding(text) to authenticated, anon;
grant execute on function public.marcar_onboarding_visto() to authenticated, anon;

-- ------------------------------------------------------------------
-- 2. Marcacao diaria do patrimonio (grafico de evolucao)
-- ------------------------------------------------------------------

create table if not exists public.patrimonio_historico (
  usuario_id uuid not null references auth.users (id) on delete cascade,
  dia        date not null,
  valor      numeric(14, 2) not null,
  primary key (usuario_id, dia)
);

alter table public.patrimonio_historico enable row level security;

drop policy if exists "cada um le o proprio historico" on public.patrimonio_historico;
create policy "cada um le o proprio historico"
  on public.patrimonio_historico
  for select
  using (auth.uid() = usuario_id);

-- So leitura. Ninguem escreve historico pela API: quem grava e a funcao
-- security definer logo abaixo, que calcula o valor dentro do banco.
-- Se o navegador pudesse mandar o numero, daria pra forjar patrimonio e
-- subir no ranking sem operar, que foi a brecha que fechamos no comprar.
grant select on public.patrimonio_historico to authenticated, anon;

-- O nome da coluna de dono em public.posicoes e descoberto aqui em vez de
-- chutado, e a migracao para com mensagem clara se nao achar.
do $$
declare
  v_col text;
begin
  select column_name
    into v_col
    from information_schema.columns
   where table_schema = 'public'
     and table_name = 'posicoes'
     and column_name in ('usuario_id', 'user_id', 'perfil_id', 'id_usuario')
   order by array_position(
     array['usuario_id', 'user_id', 'perfil_id', 'id_usuario'], column_name)
   limit 1;

  if v_col is null then
    raise exception
      'Nao encontrei a coluna de dono em public.posicoes. Me diga o nome dela.';
  end if;

  execute format($f$
    create or replace function public.registrar_patrimonio_hoje()
    returns void
    language plpgsql
    security definer
    set search_path = public
    as $corpo$
    declare
      v_id    uuid := auth.uid();
      v_total numeric(14, 2);
    begin
      if v_id is null then
        return;
      end if;

      -- Saldo em dinheiro mais o valor de mercado das posicoes. Onde nao
      -- houver cotacao em cache, usa o preco medio: melhor registrar o
      -- custo do que zerar a posicao e desenhar uma queda que nao houve.
      select coalesce(p.saldo, 0)
           + coalesce((
               select sum(pos.quantidade * coalesce(c.preco, pos.preco_medio))
                 from public.posicoes pos
                 left join public.cotacoes c on c.ticker = pos.ticker
                where pos.%I = v_id
             ), 0)
        into v_total
        from public.perfis p
       where p.id = v_id;

      if v_total is null then
        return;
      end if;

      -- Um registro por dia, no fuso de Sao Paulo. Reentrar no mesmo dia
      -- so atualiza o valor, nao cria linha nova.
      insert into public.patrimonio_historico (usuario_id, dia, valor)
      values (v_id, (now() at time zone 'America/Sao_Paulo')::date, v_total)
      on conflict (usuario_id, dia) do update set valor = excluded.valor;
    end $corpo$;
  $f$, v_col);
end $$;

grant execute on function public.registrar_patrimonio_hoje() to authenticated, anon;
