-- Vestra: pagina de perfil publica e compartilhavel, sem login.
--
-- Ja aplicado no projeto. O mesmo conteudo ja esta refletido em
-- schema.sql, este arquivo fica so como registro do que mudou e por que.
--
-- Mesmo espirito do convite de duelo publico (ver_duelo_publico): um
-- codigo curto e opaco, nao o apelido (que nao e unico) nem o uuid
-- interno. Liga por padrao (perfil_publico = true), com opcao de
-- desativar em /conta.

alter table public.perfis add column if not exists codigo_publico text unique;
alter table public.perfis add column if not exists perfil_publico boolean not null default true;

create or replace function public.garantir_perfil()
returns json language plpgsql security definer set search_path = public as $$
declare
  v_usuario uuid := auth.uid();
  v_email   text;
  v_codigo  text;
begin
  if v_usuario is null then
    raise exception 'Voce precisa estar logado.';
  end if;

  select email into v_email from auth.users where id = v_usuario;

  insert into public.perfis (id, apelido)
  values (v_usuario, split_part(coalesce(v_email, ''), '@', 1))
  on conflict (id) do nothing;

  if (select codigo_publico from public.perfis where id = v_usuario) is null then
    loop
      v_codigo := lower(substr(md5(random()::text || clock_timestamp()::text), 1, 8));
      exit when not exists (select 1 from public.perfis where codigo_publico = v_codigo);
    end loop;
    update public.perfis set codigo_publico = v_codigo where id = v_usuario;
  end if;

  return json_build_object('ok', true);
end $$;

create or replace function public.alternar_perfil_publico(p_publico boolean)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_usuario uuid := auth.uid();
begin
  if v_usuario is null then
    raise exception 'Voce precisa estar logado.';
  end if;

  update public.perfis set perfil_publico = p_publico where id = v_usuario;

  return json_build_object('ok', true);
end $$;

create or replace function public.ver_perfil_publico(p_codigo text)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_perfil public.perfis%rowtype;
begin
  select * into v_perfil from public.perfis
    where codigo_publico = lower(p_codigo) and perfil_publico = true;

  if not found then
    return json_build_object('ok', false);
  end if;

  return json_build_object(
    'ok', true,
    'apelido', coalesce(v_perfil.apelido, 'Investidor'),
    'membroDesde', v_perfil.criado_em,
    'diasSeguidos', v_perfil.dias_seguidos,
    'patrimonio', public.patrimonio_de(v_perfil.id),
    'convitesBemSucedidos', v_perfil.convites_bem_sucedidos,
    'temCompra', exists(select 1 from public.transacoes where usuario_id = v_perfil.id and tipo = 'compra'),
    'temVenda', exists(select 1 from public.transacoes where usuario_id = v_perfil.id and tipo = 'venda'),
    'temDividendo', exists(select 1 from public.transacoes where usuario_id = v_perfil.id and tipo = 'dividendo'),
    'tickersDistintos', (select count(distinct ticker) from public.posicoes where usuario_id = v_perfil.id),
    'temRendaFixa', exists(select 1 from public.investimentos_rf where usuario_id = v_perfil.id and resgatado = false),
    'historico', coalesce((
      select json_agg(json_build_object('data', h.dia, 'valor', h.valor) order by h.dia)
      from (
        select dia, valor from public.patrimonio_historico
        where usuario_id = v_perfil.id
        order by dia desc
        limit 90
      ) h
    ), '[]'::json)
  );
end $$;

grant execute on function public.ver_perfil_publico(text) to anon, authenticated;
