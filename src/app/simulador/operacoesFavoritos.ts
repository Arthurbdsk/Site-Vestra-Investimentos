"use server";

import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { Resultado } from "./operacoes";

export async function favoritarAcao(ticker: string): Promise<Resultado> {
  const supabase = await criarClienteServidor();
  const { error } = await supabase.rpc("favoritar_acao", { p_ticker: ticker });
  if (error) return { ok: false, mensagem: "Não foi possível favoritar essa ação." };
  revalidatePath("/simulador");
  return { ok: true, mensagem: "Adicionada aos favoritos." };
}

export async function desfavoritarAcao(ticker: string): Promise<Resultado> {
  const supabase = await criarClienteServidor();
  const { error } = await supabase.rpc("desfavoritar_acao", { p_ticker: ticker });
  if (error) return { ok: false, mensagem: "Não foi possível remover dos favoritos." };
  revalidatePath("/simulador");
  return { ok: true, mensagem: "Removida dos favoritos." };
}
