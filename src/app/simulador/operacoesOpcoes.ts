"use server";

import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { Resultado } from "./operacoes";

export async function venderCoveredCall(
  ticker: string,
  strike: number,
  quantidade: number,
  dias: number,
): Promise<Resultado> {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.rpc("vender_covered_call", {
    p_ticker: ticker,
    p_strike: strike,
    p_quantidade: quantidade,
    p_dias: dias,
  });
  if (error) {
    const limpa = error.message.replace(/^.*?(?:ERROR|error):\s*/i, "").trim();
    return { ok: false, mensagem: limpa || "Não foi possível vender essa covered call." };
  }
  revalidatePath("/simulador");
  return { ok: true, mensagem: `Prêmio recebido: R$ ${Number(data?.premio ?? 0).toFixed(2)}.` };
}

export async function venderCashSecuredPut(
  ticker: string,
  strike: number,
  quantidade: number,
  dias: number,
): Promise<Resultado> {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.rpc("vender_cash_secured_put", {
    p_ticker: ticker,
    p_strike: strike,
    p_quantidade: quantidade,
    p_dias: dias,
  });
  if (error) {
    const limpa = error.message.replace(/^.*?(?:ERROR|error):\s*/i, "").trim();
    return { ok: false, mensagem: limpa || "Não foi possível vender esse cash-secured put." };
  }
  revalidatePath("/simulador");
  return { ok: true, mensagem: `Prêmio recebido: R$ ${Number(data?.premio ?? 0).toFixed(2)}.` };
}

/** Preview do premio estimado, sem efeito nenhum (so leitura). */
export async function previsaoPremio(
  precoAtual: number,
  strike: number,
  dias: number,
  tipo: "covered_call" | "cash_secured_put",
): Promise<number> {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.rpc("calcular_premio_opcao", {
    p_preco_atual: precoAtual,
    p_strike: strike,
    p_dias: dias,
    p_tipo: tipo,
  });
  if (error) return 0;
  return Number(data ?? 0);
}
