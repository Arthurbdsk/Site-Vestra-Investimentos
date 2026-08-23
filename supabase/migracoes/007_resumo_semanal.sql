-- Vestra: dados pro resumo semanal por email (envio fica no Next.js,
-- via Resend, chamado por um cron da Vercel; aqui so fica a consulta).
--
-- Ja aplicado no projeto. O mesmo conteudo ja esta refletido em
-- schema.sql, este arquivo fica so como registro do que mudou e por que.
--
-- listar_destinatarios_resumo_semanal() NAO verifica auth.uid(): e uma
-- consulta administrativa, pensada pra ser chamada com a service role
-- key (nunca a anon key) direto do cron route. Por isso o execute e
-- revogado de anon/authenticated e concedido so a service_role: se
-- alguem chamasse isso com a chave publica, veria email e patrimonio
-- de todo mundo.

alter table public.perfis add column if not exists receber_resumo boolean not null default true;

create or replace function public.alternar_resumo_semanal(p_receber boolean)
returns json language plpgsql security definer set search_path = public as $$
declare
  v_usuario uuid := auth.uid();
begin
  if v_usuario is null then
    raise exception 'Voce precisa estar logado.';
  end if;

  update public.perfis set receber_resumo = p_receber where id = v_usuario;

  return json_build_object('ok', true);
end $$;

create or replace function public.listar_destinatarios_resumo_semanal()
returns json language plpgsql security definer set search_path = public as $$
begin
  return coalesce((
    select json_agg(json_build_object(
      'usuarioId', x.id,
      'email', x.email,
      'apelido', x.apelido,
      'patrimonioAtual', x.patrimonio_atual,
      'ganhoSemanaPct', x.ganho_semana_pct,
      'posicaoRanking', x.posicao
    ))
    from (
      select
        p.id,
        u.email,
        coalesce(p.apelido, 'Investidor') as apelido,
        public.patrimonio_de(p.id) as patrimonio_atual,
        case when h.valor > 0
          then ((public.patrimonio_de(p.id) - h.valor) / h.valor) * 100
          else null end as ganho_semana_pct,
        -- Posicao contra TODO mundo, nao so quem recebe resumo, senao o
        -- numero mentiria (ex: "voce esta em 3o" quando na verdade e 47o).
        (select count(*) + 1 from public.perfis p2
          where public.patrimonio_de(p2.id) > public.patrimonio_de(p.id)) as posicao
      from public.perfis p
      join auth.users u on u.id = p.id
      left join lateral (
        select valor from public.patrimonio_historico
        where usuario_id = p.id and dia <= current_date - 7
        order by dia desc
        limit 1
      ) h on true
      where p.receber_resumo = true
        and u.email is not null
        and u.is_anonymous is not true
    ) x
    where x.ganho_semana_pct is not null
  ), '[]'::json);
end $$;

revoke all on function public.listar_destinatarios_resumo_semanal() from public, anon, authenticated;
grant execute on function public.listar_destinatarios_resumo_semanal() to service_role;
