-- Vestra: nota opcional em cada compra/venda ("por que comprei isso").
--
-- Ja aplicado no projeto. O mesmo conteudo ja esta refletido em
-- schema.sql, este arquivo fica so como registro do que mudou e por que.
--
-- Motivo: o simulador ja registra toda operacao, mas nao guarda o
-- raciocinio por tras dela. Sem isso, revisar o historico depois mostra
-- SO numeros, sem contexto do por que a decisao foi tomada, que e
-- justamente o que transforma uma operacao em aprendizado.

alter table public.transacoes add column if not exists nota text;
alter table public.transacoes drop constraint if exists transacoes_nota_tamanho;
alter table public.transacoes add constraint transacoes_nota_tamanho check (char_length(nota) <= 280);

create or replace function public.comprar(p_ticker text, p_qtd integer, p_nota text default null)
returns json language plpgsql security definer set search_path = public, extensions as $$
declare
  v_usuario uuid := auth.uid();
  v_preco   numeric(14,2);
  v_custo   numeric(14,2);
  v_saldo   numeric(14,2);
  v_pos     public.posicoes%rowtype;
  v_nota    text := left(trim(p_nota), 280);
begin
  if v_usuario is null then
    raise exception 'Voce precisa estar logado.';
  end if;
  if p_qtd is null or p_qtd <= 0 then
    raise exception 'A quantidade precisa ser maior que zero.';
  end if;
  if v_nota = '' then
    v_nota := null;
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

  insert into public.transacoes (usuario_id, ticker, tipo, quantidade, preco, total, nota)
  values (v_usuario, upper(trim(p_ticker)), 'compra', p_qtd, v_preco, v_custo, v_nota);

  return json_build_object('ok', true, 'preco', v_preco, 'custo', v_custo, 'saldo', v_saldo - v_custo);
end $$;

create or replace function public.vender(p_ticker text, p_qtd integer, p_nota text default null)
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
  v_nota        text := left(trim(p_nota), 280);
begin
  if v_usuario is null then
    raise exception 'Voce precisa estar logado.';
  end if;
  if p_qtd is null or p_qtd <= 0 then
    raise exception 'A quantidade precisa ser maior que zero.';
  end if;
  if v_nota = '' then
    v_nota := null;
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

  insert into public.transacoes (usuario_id, ticker, tipo, quantidade, preco, total, imposto, nota)
  values (v_usuario, upper(trim(p_ticker)), 'venda', p_qtd, v_preco, v_valor, v_imposto, v_nota);

  return json_build_object('ok', true, 'preco', v_preco, 'valor', v_valor, 'imposto', v_imposto, 'liquido', v_liquido);
end $$;
