-- Vestra: opcoes simplificadas, so covered call e cash-secured put.
--
-- Ja aplicado no projeto. O mesmo conteudo ja esta refletido em
-- schema.sql, este arquivo fica so como registro do que mudou e por que.
--
-- Nao existe fonte de dado real de opcoes disponivel pro projeto (nem a
-- brapi nem a finnhub cobrem isso no plano gratuito), entao o premio e
-- estimado, nunca uma cotacao de mercado de verdade. A formula usa
-- Brenner-Subrahmanyam (aproximacao classica de valor de tempo pra opcao
-- no dinheiro: C ~= 0.4 * S * sigma * sqrt(T), Brenner & Subrahmanyam
-- 1988) com volatilidade fixa assumida de 35% ao ano, mais um decaimento
-- gaussiano conforme o strike se afasta do preco atual. E uma
-- aproximacao pedagogica, nao Black-Scholes completo (que precisaria de
-- volatilidade implícita real, que o projeto nao tem).
--
-- Simplificacao deliberada: as acoes que cobrem uma covered call, ou o
-- caixa que cobre um cash-secured put, NAO ficam bloqueados/reservados.
-- Se a pessoa vender as acoes ou gastar o caixa antes do vencimento, a
-- opcao so nao e exercida quando vencer (fica "expirada" sem efeito),
-- em vez de forcar uma operacao. Bloquear de verdade exigiria alterar
-- comprar/vender/emprestimo/renda-fixa pra reservar saldo, risco alto
-- de quebrar fluxo de dinheiro que ja funciona, pra um recurso que ja
-- e uma simplificacao educacional por natureza.

create table if not exists public.opcoes (
  id          uuid primary key default gen_random_uuid(),
  usuario_id  uuid not null references auth.users(id) on delete cascade,
  ticker      text not null,
  tipo        text not null check (tipo in ('covered_call', 'cash_secured_put')),
  strike      numeric(14,2) not null check (strike > 0),
  premio      numeric(14,2) not null,
  quantidade  integer not null check (quantidade > 0),
  vencimento  date not null,
  status      text not null default 'aberta' check (status in ('aberta', 'exercida', 'expirada')),
  criado_em   timestamptz not null default now()
);

create index if not exists opcoes_usuario_idx on public.opcoes(usuario_id, criado_em desc);
create index if not exists opcoes_vencimento_idx on public.opcoes(vencimento) where status = 'aberta';

alter table public.opcoes enable row level security;

drop policy if exists "opcoes proprias" on public.opcoes;
create policy "opcoes proprias" on public.opcoes
  for select using (auth.uid() = usuario_id);

create or replace function public.calcular_premio_opcao(
  p_preco_atual numeric, p_strike numeric, p_dias integer, p_tipo text
)
returns numeric language plpgsql immutable as $$
declare
  v_vol           constant numeric := 0.35;
  v_tempo         numeric;
  v_valor_tempo   numeric;
  v_dist_pct      numeric;
  v_decaimento    numeric;
  v_intrinsico    numeric;
begin
  if p_preco_atual is null or p_preco_atual <= 0 or p_strike is null or p_strike <= 0 or p_dias is null or p_dias <= 0 then
    return 0;
  end if;

  v_tempo := sqrt(p_dias::numeric / 365);
  v_valor_tempo := 0.4 * p_preco_atual * v_vol * v_tempo;

  v_dist_pct := (p_preco_atual - p_strike) / p_preco_atual;
  v_decaimento := exp(-2 * power(v_dist_pct, 2));

  v_intrinsico := case
    when p_tipo = 'covered_call' then greatest(0, p_preco_atual - p_strike)
    else greatest(0, p_strike - p_preco_atual)
  end;

  return round(v_intrinsico + (v_valor_tempo * v_decaimento), 2);
end $$;

create or replace function public.vender_covered_call(p_ticker text, p_strike numeric, p_quantidade integer, p_dias integer)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare
  v_usuario uuid := auth.uid();
  v_preco   numeric(14,2);
  v_premio  numeric(14,2);
  v_pos     public.posicoes%rowtype;
begin
  if v_usuario is null then
    raise exception 'Voce precisa estar logado.';
  end if;
  if p_quantidade is null or p_quantidade <= 0 then
    raise exception 'A quantidade precisa ser maior que zero.';
  end if;
  if p_dias is null or p_dias <= 0 or p_dias > 60 then
    raise exception 'Prazo invalido (1 a 60 dias).';
  end if;
  if p_strike is null or p_strike <= 0 then
    raise exception 'Strike invalido.';
  end if;

  select * into v_pos from public.posicoes
    where usuario_id = v_usuario and ticker = upper(trim(p_ticker));

  if not found or v_pos.quantidade < p_quantidade then
    raise exception 'Voce precisa ter pelo menos % acoes de % pra vender essa covered call.', p_quantidade, p_ticker;
  end if;

  v_preco := public.garantir_cotacao(upper(trim(p_ticker)));
  if v_preco is null or v_preco <= 0 then
    raise exception 'Nao consegui confirmar o preco de %. Tente de novo em instantes.', p_ticker;
  end if;

  v_premio := public.calcular_premio_opcao(v_preco, p_strike, p_dias, 'covered_call') * p_quantidade;

  insert into public.opcoes (usuario_id, ticker, tipo, strike, premio, quantidade, vencimento)
  values (v_usuario, upper(trim(p_ticker)), 'covered_call', p_strike, v_premio, p_quantidade, current_date + p_dias);

  update public.perfis set saldo = saldo + v_premio where id = v_usuario;

  return json_build_object('ok', true, 'premio', v_premio);
end $$;

create or replace function public.vender_cash_secured_put(p_ticker text, p_strike numeric, p_quantidade integer, p_dias integer)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare
  v_usuario uuid := auth.uid();
  v_preco   numeric(14,2);
  v_premio  numeric(14,2);
  v_saldo   numeric(14,2);
  v_reserva numeric(14,2);
begin
  if v_usuario is null then
    raise exception 'Voce precisa estar logado.';
  end if;
  if p_quantidade is null or p_quantidade <= 0 then
    raise exception 'A quantidade precisa ser maior que zero.';
  end if;
  if p_dias is null or p_dias <= 0 or p_dias > 60 then
    raise exception 'Prazo invalido (1 a 60 dias).';
  end if;
  if p_strike is null or p_strike <= 0 then
    raise exception 'Strike invalido.';
  end if;

  v_reserva := p_strike * p_quantidade;

  select saldo into v_saldo from public.perfis where id = v_usuario;
  if v_saldo is null or v_saldo < v_reserva then
    raise exception 'Voce precisa de R$ % em caixa pra vender esse cash-secured put.', v_reserva;
  end if;

  v_preco := public.garantir_cotacao(upper(trim(p_ticker)));
  if v_preco is null or v_preco <= 0 then
    raise exception 'Nao consegui confirmar o preco de %. Tente de novo em instantes.', p_ticker;
  end if;

  v_premio := public.calcular_premio_opcao(v_preco, p_strike, p_dias, 'cash_secured_put') * p_quantidade;

  insert into public.opcoes (usuario_id, ticker, tipo, strike, premio, quantidade, vencimento)
  values (v_usuario, upper(trim(p_ticker)), 'cash_secured_put', p_strike, v_premio, p_quantidade, current_date + p_dias);

  update public.perfis set saldo = saldo + v_premio where id = v_usuario;

  return json_build_object('ok', true, 'premio', v_premio);
end $$;

create or replace function public.listar_minhas_opcoes()
returns json language plpgsql security definer set search_path = public as $$
declare
  v_usuario uuid := auth.uid();
begin
  if v_usuario is null then
    raise exception 'Voce precisa estar logado.';
  end if;

  return coalesce((
    select json_agg(json_build_object(
      'id', o.id,
      'ticker', o.ticker,
      'tipo', o.tipo,
      'strike', o.strike,
      'premio', o.premio,
      'quantidade', o.quantidade,
      'vencimento', o.vencimento,
      'status', o.status,
      'criadoEm', o.criado_em
    ) order by o.criado_em desc)
    from public.opcoes o
    where o.usuario_id = v_usuario
    limit 50
  ), '[]'::json);
end $$;

create or replace function public.processar_opcoes_vencidas(p_usuario uuid)
returns void language plpgsql security definer set search_path = public, extensions as $$
declare
  v_opcao public.opcoes%rowtype;
  v_preco numeric(14,2);
  v_pos   public.posicoes%rowtype;
  v_saldo numeric(14,2);
begin
  for v_opcao in
    select * from public.opcoes
    where usuario_id = p_usuario and status = 'aberta' and vencimento <= current_date
  loop
    v_preco := public.garantir_cotacao(v_opcao.ticker);
    if v_preco is null or v_preco <= 0 then
      continue;
    end if;

    if v_opcao.tipo = 'covered_call' then
      if v_preco > v_opcao.strike then
        select * into v_pos from public.posicoes
          where usuario_id = p_usuario and ticker = v_opcao.ticker;

        if found and v_pos.quantidade >= v_opcao.quantidade then
          if v_pos.quantidade = v_opcao.quantidade then
            delete from public.posicoes where id = v_pos.id;
          else
            update public.posicoes set quantidade = v_pos.quantidade - v_opcao.quantidade where id = v_pos.id;
          end if;

          update public.perfis set saldo = saldo + (v_opcao.strike * v_opcao.quantidade) where id = p_usuario;

          insert into public.transacoes (usuario_id, ticker, tipo, quantidade, preco, total)
          values (p_usuario, v_opcao.ticker, 'venda', v_opcao.quantidade, v_opcao.strike, v_opcao.strike * v_opcao.quantidade);

          update public.opcoes set status = 'exercida' where id = v_opcao.id;
        else
          update public.opcoes set status = 'expirada' where id = v_opcao.id;
        end if;
      else
        update public.opcoes set status = 'expirada' where id = v_opcao.id;
      end if;

    else
      if v_preco < v_opcao.strike then
        select saldo into v_saldo from public.perfis where id = p_usuario;

        if v_saldo is not null and v_saldo >= (v_opcao.strike * v_opcao.quantidade) then
          update public.perfis set saldo = saldo - (v_opcao.strike * v_opcao.quantidade) where id = p_usuario;

          select * into v_pos from public.posicoes
            where usuario_id = p_usuario and ticker = v_opcao.ticker;

          if found then
            update public.posicoes set
              quantidade = v_pos.quantidade + v_opcao.quantidade,
              preco_medio = round(((v_pos.quantidade * v_pos.preco_medio) + (v_opcao.strike * v_opcao.quantidade)) / (v_pos.quantidade + v_opcao.quantidade), 2)
            where id = v_pos.id;
          else
            insert into public.posicoes (usuario_id, ticker, quantidade, preco_medio)
            values (p_usuario, v_opcao.ticker, v_opcao.quantidade, v_opcao.strike);
          end if;

          insert into public.transacoes (usuario_id, ticker, tipo, quantidade, preco, total)
          values (p_usuario, v_opcao.ticker, 'compra', v_opcao.quantidade, v_opcao.strike, v_opcao.strike * v_opcao.quantidade);

          update public.opcoes set status = 'exercida' where id = v_opcao.id;
        else
          update public.opcoes set status = 'expirada' where id = v_opcao.id;
        end if;
      else
        update public.opcoes set status = 'expirada' where id = v_opcao.id;
      end if;
    end if;
  end loop;
end $$;
