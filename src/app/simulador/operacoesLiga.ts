"use server";

import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { Resultado } from "./operacoes";

export async function criarLiga(nome: string, dias: number): Promise<Resultado & { codigo?: string }> {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.rpc("criar_liga", { p_nome: nome, p_dias: dias });
  if (error) return { ok: false, mensagem: "Não foi possível criar a liga." };
  revalidatePath("/simulador");
  return { ok: true, mensagem: "Liga criada! Mande o código pra sua turma.", codigo: data?.codigo };
}

export async function entrarLiga(codigo: string): Promise<Resultado> {
  const supabase = await criarClienteServidor();
  const { error } = await supabase.rpc("entrar_liga", { p_codigo: codigo });
  if (error) {
    const msg = error.message?.includes("Codigo invalido")
      ? "Código inválido."
      : error.message?.includes("ja encerrou")
        ? "Essa liga já encerrou."
        : error.message?.includes("ja esta")
          ? "Você já está nessa liga."
          : "Não foi possível entrar nessa liga.";
    return { ok: false, mensagem: msg };
  }
  revalidatePath("/simulador");
  return { ok: true, mensagem: "Você entrou na liga!" };
}
