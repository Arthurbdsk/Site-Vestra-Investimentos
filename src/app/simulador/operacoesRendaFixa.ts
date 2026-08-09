"use server";

import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/server";
import { brl } from "@/lib/formato";
import type { Resultado } from "./operacoes";

export async function investirRendaFixa(
  tipo: "cdb" | "tesouro",
  nome: string,
  valor: number,
  taxaAnual: number,
): Promise<Resultado> {
  const supabase = await criarClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, mensagem: "Sua sessão expirou. Entre de novo pra continuar." };
  }

  if (!Number.isFinite(valor) || valor <= 0) {
    return { ok: false, mensagem: "Escolha um valor válido pra investir." };
  }

  const { error } = await supabase.rpc("investir_renda_fixa", {
    p_tipo: tipo,
    p_nome: nome,
    p_valor: valor,
    p_taxa_anual: taxaAnual,
  });

  if (error) {
    return { ok: false, mensagem: limparErro(error.message) };
  }

  revalidatePath("/simulador");
  return { ok: true, mensagem: `Investido ${brl(valor)} em ${nome}.` };
}

export async function resgatarRendaFixa(id: string): Promise<Resultado> {
  const supabase = await criarClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, mensagem: "Sua sessão expirou. Entre de novo pra continuar." };
  }

  const { data, error } = await supabase.rpc("resgatar_renda_fixa", { p_id: id });

  if (error) {
    return { ok: false, mensagem: limparErro(error.message) };
  }

  revalidatePath("/simulador");
  const valor = Number((data as { valor?: number } | null)?.valor ?? 0);
  return { ok: true, mensagem: `Resgatado: ${brl(valor)}.` };
}

function limparErro(msg: string): string {
  const limpa = msg.replace(/^.*?(?:ERROR|error):\s*/i, "").trim();
  if (/saldo insuficiente/i.test(limpa)) {
    return limpa.replace(/(\d+)\.(\d{2})/g, "$1,$2");
  }
  if (/row-level security|permission denied/i.test(limpa)) {
    return "Sua sessão expirou. Entre de novo pra continuar.";
  }
  return limpa || "Não foi possível concluir a operação.";
}
