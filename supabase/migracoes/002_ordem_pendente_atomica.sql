-- Vestra: corrige execucao em dobro de ordens limitadas e ordens
-- stop loss/stop gain orfas.
--
-- AINDA NAO APLICADO no projeto (ao contrario dos outros arquivos dessa
-- pasta). Copie este arquivo no SQL Editor do Supabase e rode antes (ou
-- depois, e idempotente) de fazer deploy do codigo que usa
-- executar_ordem_pendente. O mesmo conteudo ja esta refletido em
-- schema.sql, este arquivo fica so como registro do que mudou e por que.
--
-- Problema 1 (critico): processarPendencias.ts executava a ordem
-- (rpc comprar/vender) e so depois marcava como executada (rpc
-- marcar_ordem_executada), em duas chamadas separadas. Se a segunda
-- falhasse (ou se a funcao rodasse 2x em paralelo, ex.: dois
-- carregamentos de pagina quase juntos), a ordem continuava "pendente"
-- e era executada de novo na proxima visita: compra ou venda em dobro.
--
-- Problema 2: ordens de stop loss e stop gain criadas juntas pelo
-- agente (mesma compra) nao tinham nenhum vinculo entre si. Quando uma
-- executava, a outra ficava "pendente" pra sempre, referenciando cotas
-- que a pessoa ja nao tinha mais.

-- 1. Liga o par stop loss / stop gain.
alter table public.ordens_pendentes
  add column if not exists ordem_irma_id uuid references public.ordens_pendentes(id) on delete set null;

-- 2. criar_ordem_limitada agora aceita o id da ordem irma e completa o
--    vinculo dos dois lados.
create or replace function public.criar_ordem_limitada(
  p_ticker text, p_tipo text, p_qtd integer, p_preco_alvo numeric,
  p_ordem_irma_id uuid default null
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

  insert into public.ordens_pendentes (usuario_id, ticker, tipo, quantidade, preco_alvo, ordem_irma_id)
  values (v_usuario, p_ticker, p_tipo, p_qtd, p_preco_alvo, p_ordem_irma_id)
  returning id into v_id;

  if p_ordem_irma_id is not null then
    update public.ordens_pendentes
      set ordem_irma_id = v_id
      where id = p_ordem_irma_id and usuario_id = v_usuario and ordem_irma_id is null;
  end if;

  return json_build_object('ok', true, 'id', v_id);
end $$;

-- 3. cancelar_ordem_limitada agora cancela tambem a ordem irma.
create or replace function public.cancelar_ordem_limitada(p_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_usuario uuid := auth.uid();
  v_linhas  integer;
  v_irma    uuid;
begin
  if v_usuario is null then
    raise exception 'Voce precisa estar logado.';
  end if;

  update public.ordens_pendentes
    set status = 'cancelada'
    where id = p_id and usuario_id = v_usuario and status = 'pendente'
    returning ordem_irma_id into v_irma;

  get diagnostics v_linhas = row_count;
  if v_linhas = 0 then
    raise exception 'Ordem nao encontrada ou ja nao esta mais pendente.';
  end if;

  if v_irma is not null then
    update public.ordens_pendentes
      set status = 'cancelada'
      where id = v_irma and usuario_id = v_usuario and status = 'pendente';
  end if;

  return json_build_object('ok', true);
end $$;

-- 4. Nova funcao: claim atomico (for update) + execucao + marcacao +
--    cancelamento da ordem irma, tudo numa transacao so.
create or replace function public.executar_ordem_pendente(p_id uuid)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_usuario   uuid := auth.uid();
  v_ordem     public.ordens_pendentes%rowtype;
  v_resultado json;
begin
  if v_usuario is null then
    raise exception 'Voce precisa estar logado.';
  end if;

  select * into v_ordem from public.ordens_pendentes
    where id = p_id and usuario_id = v_usuario and status = 'pendente'
    for update;

  if not found then
    return json_build_object('ok', false, 'motivo', 'ja_processada');
  end if;

  if v_ordem.tipo = 'comprar' then
    v_resultado := public.comprar(v_ordem.ticker, v_ordem.quantidade);
  else
    v_resultado := public.vender(v_ordem.ticker, v_ordem.quantidade);
  end if;

  update public.ordens_pendentes
    set status = 'executada', executada_em = now()
    where id = p_id;

  if v_ordem.ordem_irma_id is not null then
    update public.ordens_pendentes
      set status = 'cancelada'
      where id = v_ordem.ordem_irma_id and status = 'pendente';
  end if;

  return json_build_object('ok', true, 'resultado', v_resultado);
exception
  when others then
    return json_build_object('ok', false, 'motivo', 'falha_execucao', 'mensagem', sqlerrm);
end $$;

revoke all on function public.executar_ordem_pendente(uuid) from public;
grant execute on function public.executar_ordem_pendente(uuid) to authenticated;

-- Nota: marcar_ordem_executada(uuid) fica no schema, sem uso pelo
-- codigo depois dessa mudanca (processarPendencias.ts passa a chamar
-- executar_ordem_pendente), mas nao precisa ser removida.
