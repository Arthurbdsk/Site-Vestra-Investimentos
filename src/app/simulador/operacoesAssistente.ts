"use server";

import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/server";
import {
  responderAssistente,
  finalizarComResultado,
  type MensagemChat,
  type ResultadoAcao,
} from "@/lib/assistenteIA";
import { comprar, vender, criarOrdemMercadoAbertura } from "./operacoes";

export type ResultadoChat =
  | { ok: true; resposta: string; restantes: number; executouAcao: boolean }
  | { ok: false; mensagem: string };

export async function perguntarAssistente(
  pergunta: string,
  historico: MensagemChat[],
): Promise<ResultadoChat> {
  const supabase = await criarClienteServidor();

  const { data: reserva, error: erroReserva } = await supabase.rpc("reservar_mensagem_assistente");
  if (erroReserva) {
    const msg = erroReserva.message.includes("Limite diario")
      ? "Limite diário de 20 mensagens atingido. Volte amanhã."
      : "Não foi possível conversar com o assistente agora.";
    return { ok: false, mensagem: msg };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, mensagem: "Sua sessão expirou." };

  const [perfilRes, posicoesRes] = await Promise.all([
    supabase.from("perfis").select("apelido, saldo").eq("id", user.id).single(),
    supabase.from("posicoes").select("ticker, quantidade"),
  ]);

  const saldo = Number(perfilRes.data?.saldo ?? 0);
  const posicoes = (posicoesRes.data ?? []).map((p) => ({
    ticker: p.ticker,
    quantidade: Number(p.quantidade),
  }));

  const { data: patrimonioData } = await supabase.rpc("patrimonio_de", { p_usuario: user.id });
  const patrimonio = Number(patrimonioData ?? saldo);

  try {
    const primeiraResposta = await responderAssistente(pergunta, historico, {
      apelido: perfilRes.data?.apelido ?? "investidor",
      saldo,
      patrimonio,
      posicoes,
    });

    if (primeiraResposta.acoesPedidas.length === 0) {
      return { ok: true, resposta: primeiraResposta.texto, restantes: reserva?.restantes ?? 0, executouAcao: false };
    }

    // Executa de verdade, uma por uma, pelas mesmas funcoes seguras do
    // simulador (o preco vem sempre do banco, nunca do modelo).
    const resultados: ResultadoAcao[] = [];
    for (const acao of primeiraResposta.acoesPedidas) {
      if (!acao.ticker || acao.quantidade <= 0) {
        resultados.push({
          ferramenta: acao.ferramenta,
          ticker: acao.ticker,
          ok: false,
          mensagem: "Ticker ou quantidade inválidos.",
        });
        continue;
      }
      const r =
        acao.ferramenta === "comprar_acao"
          ? await comprar(acao.ticker, acao.quantidade)
          : acao.ferramenta === "vender_acao"
            ? await vender(acao.ticker, acao.quantidade)
            : await criarOrdemMercadoAbertura(acao.tipoOrdem ?? "comprar", acao.ticker, acao.quantidade);
      resultados.push({ ferramenta: acao.ferramenta, ticker: acao.ticker, ok: r.ok, mensagem: r.mensagem });
    }

    const textoFinal = await finalizarComResultado(
      primeiraResposta._contents ?? [],
      primeiraResposta.acoesPedidas.map((a) => ({
        name: a.ferramenta,
        args:
          a.ferramenta === "criar_ordem_abertura"
            ? { ticker: a.ticker, quantidade: a.quantidade, tipo: a.tipoOrdem }
            : { ticker: a.ticker, quantidade: a.quantidade },
      })),
      resultados,
    );

    revalidatePath("/simulador");
    return { ok: true, resposta: textoFinal, restantes: reserva?.restantes ?? 0, executouAcao: true };
  } catch (e) {
    return {
      ok: false,
      mensagem: e instanceof Error ? e.message : "Erro desconhecido ao consultar o assistente.",
    };
  }
}
