"use server";

import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { Resultado } from "./operacoes";

export async function criarAlertaPreco(
  ticker: string,
  direcao: "acima" | "abaixo",
  precoAlvo: number,
): Promise<Resultado> {
  const supabase = await criarClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, mensagem: "Sua sessão expirou. Entre de novo pra continuar." };

  const { error } = await supabase.rpc("criar_alerta_preco", {
    p_ticker: ticker,
    p_direcao: direcao,
    p_preco_alvo: precoAlvo,
  });

  if (error) return { ok: false, mensagem: "Não foi possível criar o alerta." };

  revalidatePath("/simulador");
  return {
    ok: true,
    mensagem: `Alerta criado: avisar quando ${ticker} ficar ${direcao === "acima" ? "acima" : "abaixo"} de R$ ${precoAlvo.toFixed(2)}.`,
  };
}

export async function cancelarAlertaPreco(id: string): Promise<Resultado> {
  const supabase = await criarClienteServidor();
  const { error } = await supabase.rpc("cancelar_alerta_preco", { p_id: id });
  if (error) return { ok: false, mensagem: "Não foi possível cancelar o alerta." };
  revalidatePath("/simulador");
  return { ok: true, mensagem: "Alerta cancelado." };
}

export async function marcarAlertaVisto(id: string): Promise<void> {
  const supabase = await criarClienteServidor();
  await supabase.rpc("marcar_alerta_visto", { p_id: id });
  revalidatePath("/simulador");
}
