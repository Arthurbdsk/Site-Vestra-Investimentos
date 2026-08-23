-- Vestra: recompensa por convite de duelo que traz gente nova.
--
-- Ja aplicado no projeto. O mesmo conteudo ja esta refletido em
-- schema.sql, este arquivo fica so como registro do que mudou e por que.
--
-- Quando quem aceita um convite de duelo tem conta criada DEPOIS do
-- convite (ou seja, veio pro Vestra por causa dele), quem criou o
-- convite ganha R$ 5.000 ficticios de bonus e conta pra conquista
-- "Trouxe alguem".

alter table public.perfis add column if not exists convites_bem_sucedidos integer not null default 0;

create or replace function public.entrar_duelo(p_codigo text)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_usuario     uuid := auth.uid();
  v_duelo       public.duelos%rowtype;
  v_conta_nova  boolean;
  v_bonus       constant numeric(14,2) := 5000.00;
begin
  if v_usuario is null then
    raise exception 'Voce precisa estar logado.';
  end if;

  select * into v_duelo from public.duelos
    where codigo_convite = upper(p_codigo) and status = 'aguardando';

  if not found then
    raise exception 'Codigo invalido ou duelo ja comecou.';
  end if;
  if v_duelo.criador_id = v_usuario then
    raise exception 'Voce nao pode entrar no proprio duelo.';
  end if;

  update public.duelos set
    oponente_id = v_usuario,
    patrimonio_inicial_oponente = public.patrimonio_de(v_usuario),
    data_inicio = now(),
    status = 'ativo'
  where id = v_duelo.id;

  select (created_at > v_duelo.criado_em) into v_conta_nova
    from auth.users where id = v_usuario;

  if v_conta_nova then
    update public.perfis set
      saldo = saldo + v_bonus,
      convites_bem_sucedidos = convites_bem_sucedidos + 1
    where id = v_duelo.criador_id;
  end if;

  return json_build_object('ok', true, 'id', v_duelo.id);
end $$;
