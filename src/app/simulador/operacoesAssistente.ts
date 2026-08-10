"use server";

import { criarClienteServidor } from "@/lib/supabase/server";
import { responderAssistente, type MensagemChat } from "@/lib/assistenteIA";

export type ResultadoChat =
  | { ok: true; resposta: string; restantes: number }
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
    const resposta = await responderAssistente(pergunta, historico, {
      apelido: perfilRes.data?.apelido ?? "investidor",
      saldo,
      patrimonio,
      posicoes,
    });
    return { ok: true, resposta, restantes: reserva?.restantes ?? 0 };
  } catch (e) {
    return {
      ok: false,
      mensagem: e instanceof Error ? e.message : "Erro desconhecido ao consultar o assistente.",
    };
  }
}
