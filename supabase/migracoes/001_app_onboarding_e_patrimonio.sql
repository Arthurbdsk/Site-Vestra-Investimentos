-- Vestra, etapa 1 do aplicativo.
--
-- JA APLICADO no projeto (migracoes app_onboarding_e_patrimonio_historico
-- e patrimonio_hoje_inclui_renda_fixa_e_divida). Este arquivo fica como
-- registro do que foi rodado.
--
-- Cria a memoria do onboarding e a marcacao diaria de patrimonio que
-- alimenta o grafico de evolucao da tela Inicio.

-- ------------------------------------------------------------------
-- 1. Onboarding: quem ja viu, e o nivel declarado
-- ------------------------------------------------------------------

alter table public.perfis
  add column if not exists onboarding_visto_em timestamptz;

alter table public.perfis
  add column if not exists nivel_experiencia text;

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

-- A pessoa LE as colunas novas (a pagina decide o onboarding a partir
-- delas), mas nao ESCREVE: quem grava e a funcao abaixo, que valida antes.
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

  -- coalesce pra guardar quando viu pela PRIMEIRA vez, mesmo se refizer.
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

-- So leitura pela API. Se o navegador pudesse escrever o numero, daria pra
-- forjar patrimonio e subir no ranking sem operar, a mesma brecha que
-- fechamos no comprar/vender.
grant select on public.patrimonio_historico to authenticated, anon;

-- O valor gravado tem que ser exatamente o mesmo que a tela mostra em
-- "Patrimonio virtual". Faltando a renda fixa e a divida, o grafico
-- plotava uma curva que nao batia com o titulo logo acima dele (num caso
-- real do banco a diferenca passava de 71 mil).
create or replace function public.registrar_patrimonio_hoje()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id    uuid := auth.uid();
  v_total numeric(14, 2);
begin
  if v_id is null then
    return;
  end if;

  select coalesce(p.saldo, 0)
       -- Acoes a preco de mercado. Sem cotacao em cache, usa o preco
       -- medio: melhor registrar o custo do que zerar a posicao e
       -- desenhar uma queda que nao aconteceu.
       + coalesce((
           select sum(pos.quantidade * coalesce(c.preco, pos.preco_medio))
             from public.posicoes pos
             left join public.cotacoes c on c.ticker = pos.ticker
            where pos.usuario_id = v_id
         ), 0)
       -- Renda fixa rendendo desde a aplicacao, mesma formula do painel.
       + coalesce((
           select sum(
                    rf.valor_investido
                    * power(1 + rf.taxa_anual,
                            greatest(0, current_date - rf.data_aplicacao::date) / 365.0)
                  )
             from public.investimentos_rf rf
            where rf.usuario_id = v_id
              and rf.resgatado = false
         ), 0)
       -- Divida entra negativa: patrimonio e o que sobra depois de pagar.
       - coalesce((
           select e.saldo_devedor
             from public.emprestimos e
            where e.usuario_id = v_id
         ), 0)
    into v_total
    from public.perfis p
   where p.id = v_id;

  if v_total is null then
    return;
  end if;

  -- Um registro por dia, no fuso de Sao Paulo. Reentrar no mesmo dia so
  -- atualiza o valor, nao cria linha nova.
  insert into public.patrimonio_historico (usuario_id, dia, valor)
  values (v_id, (now() at time zone 'America/Sao_Paulo')::date, v_total)
  on conflict (usuario_id, dia) do update set valor = excluded.valor;
end $$;

grant execute on function public.registrar_patrimonio_hoje() to authenticated, anon;
