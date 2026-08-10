"use server";

import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/server";
import { decidirOperacao } from "@/lib/agenteIA";
import { acaoPorTicker } from "@/lib/acoes";
import type { Resultado } from "./operacoes";
import { comprar, vender } from "./operacoes";

export async function criarAgente(perfilRisco: "conservador" | "moderado" | "agressivo"): Promise<Resultado> {
  const supabase = await criarClienteServidor();
  const { error } = await supabase.rpc("criar_ou_atualizar_agente", { p_perfil_risco: perfilRisco });
  if (error) return { ok: false, mensagem: "Não foi possível criar o agente." };
  revalidatePath("/simulador");
  return { ok: true, mensagem: "Agente configurado." };
}

export async function rodarAgente(): Promise<Resultado> {
  const supabase = await criarClienteServidor();

  const { error: erroReserva } = await supabase.rpc("reservar_execucao_agente");
  if (erroReserva) {
    return { ok: false, mensagem: limparErro(erroReserva.message) };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, mensagem: "Sua sessão expirou." };

  const [agenteRes, perfilRes, posicoesRes, cotacoesRes] = await Promise.all([
    supabase.rpc("obter_agente"),
    supabase.from("perfis").select("saldo").eq("id", user.id).single(),
    supabase.from("posicoes").select("ticker, quantidade, preco_medio"),
    supabase.from("cotacoes").select("ticker, preco, variacao"),
  ]);

  const perfilRisco = agenteRes.data?.perfilRisco as "conservador" | "moderado" | "agressivo" | undefined;
  if (!perfilRisco) return { ok: false, mensagem: "Agente não encontrado." };

  const saldo = Number(perfilRes.data?.saldo ?? 0);
  const cotacoesMap = new Map((cotacoesRes.data ?? []).map((c) => [c.ticker, Number(c.preco)]));

  const posicoes = (posicoesRes.data ?? []).map((p) => ({
    ticker: p.ticker,
    quantidade: Number(p.quantidade),
    precoMedio: Number(p.preco_medio),
    precoAtual: cotacoesMap.get(p.ticker) ?? Number(p.preco_medio),
  }));

  const cotacoesDisponiveis = (cotacoesRes.data ?? [])
    .map((c) => {
      const info = acaoPorTicker(c.ticker);
      return {
        ticker: c.ticker,
        nome: info?.nome ?? c.ticker,
        setor: info?.setor ?? "outro",
        preco: Number(c.preco),
        variacao: Number(c.variacao),
      };
    })
    .filter((c) => c.preco > 0);

  try {
    const decisao = await decidirOperacao({ perfilRisco, saldo, posicoes, cotacoesDisponiveis });

    let executado = false;
    let erro: string | null = null;

    if (decisao.acao !== "manter" && decisao.ticker && decisao.quantidade > 0) {
      const resultado =
        decisao.acao === "comprar"
          ? await comprar(decisao.ticker, decisao.quantidade)
          : await vender(decisao.ticker, decisao.quantidade);
      executado = resultado.ok;
      erro = resultado.ok ? null : resultado.mensagem;
    }

    await supabase.rpc("registrar_decisao_agente", {
      p_ticker: decisao.ticker,
      p_acao: decisao.acao,
      p_quantidade: decisao.quantidade,
      p_justificativa: decisao.justificativa,
      p_executado: executado,
      p_erro: erro,
    });

    revalidatePath("/simulador");
    return {
      ok: true,
      mensagem:
        decisao.acao === "manter"
          ? "O agente decidiu manter a carteira como está."
          : executado
            ? `O agente decidiu ${decisao.acao} ${decisao.quantidade} ${decisao.quantidade === 1 ? "cota" : "cotas"} de ${decisao.ticker}.`
            : `O agente decidiu ${decisao.acao} ${decisao.ticker}, mas não conseguiu executar (${erro}).`,
    };
  } catch (e) {
    const mensagem = e instanceof Error ? e.message : "Erro desconhecido ao consultar o agente.";
    await supabase.rpc("registrar_decisao_agente", {
      p_ticker: null,
      p_acao: "manter",
      p_quantidade: 0,
      p_justificativa: "Falha ao consultar o agente.",
      p_executado: false,
      p_erro: mensagem,
    });
    return { ok: false, mensagem };
  }
}

function limparErro(msg: string): string {
  if (msg.includes("Limite diario")) return "Limite diário de 3 execuções atingido. Volte amanhã.";
  if (msg.includes("nao criou um agente")) return "Configure um perfil de risco antes de rodar o agente.";
  return "Não foi possível rodar o agente agora.";
}
