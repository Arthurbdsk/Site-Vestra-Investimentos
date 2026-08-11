"use server";

import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/server";
import { brl } from "@/lib/formato";
import type { Resultado } from "./operacoes";

export type EstadoEmprestimo = {
  divida: number;
  taxaAnualPct: number;
  limite: number;
  disponivel: number;
  patrimonioLiquido: number;
};

export async function obterEmprestimo(): Promise<EstadoEmprestimo | null> {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.rpc("obter_emprestimo");
  if (error || !data) return null;

  const d = data as Record<string, number>;
  return {
    divida: Number(d.divida ?? 0),
    taxaAnualPct: Number(d.taxaAnualPct ?? 0),
    limite: Number(d.limite ?? 0),
    disponivel: Number(d.disponivel ?? 0),
    patrimonioLiquido: Number(d.patrimonioLiquido ?? 0),
  };
}

export async function pedirEmprestimo(valor: number): Promise<Resultado> {
  const supabase = await criarClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, mensagem: "Sua sessão expirou. Entre de novo pra continuar." };
  }

  if (!Number.isFinite(valor) || valor <= 0) {
    return { ok: false, mensagem: "Escolha um valor de empréstimo válido." };
  }

  const { error } = await supabase.rpc("pedir_emprestimo", { p_valor: valor });

  if (error) {
    return { ok: false, mensagem: limparErro(error.message) };
  }

  revalidatePath("/simulador");
  return { ok: true, mensagem: `Empréstimo de ${brl(valor)} liberado pro seu saldo.` };
}

export async function pagarEmprestimo(valor: number): Promise<Resultado> {
  const supabase = await criarClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, mensagem: "Sua sessão expirou. Entre de novo pra continuar." };
  }

  if (!Number.isFinite(valor) || valor <= 0) {
    return { ok: false, mensagem: "Escolha um valor válido." };
  }

  const { data, error } = await supabase.rpc("pagar_emprestimo", { p_valor: valor });

  if (error) {
    return { ok: false, mensagem: limparErro(error.message) };
  }

  revalidatePath("/simulador");
  const pago = Number((data as { pago?: number } | null)?.pago ?? valor);
  return { ok: true, mensagem: `Pago ${brl(pago)} da dívida.` };
}

function limparErro(msg: string): string {
  const limpa = msg.replace(/^.*?(?:ERROR|error):\s*/i, "").trim();
  if (/limite de emprestimo|saldo insuficiente|voce nao tem divida/i.test(limpa)) {
    return limpa.replace(/(\d+)\.(\d{2})/g, "$1,$2");
  }
  if (/row-level security|permission denied/i.test(limpa)) {
    return "Sua sessão expirou. Entre de novo pra continuar.";
  }
  return limpa || "Não foi possível concluir a operação.";
}
