"use server";

import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { Resultado } from "./operacoes";

export async function criarDuelo(dias: number): Promise<Resultado & { codigo?: string }> {
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.rpc("criar_duelo", { p_dias: dias });
  if (error) return { ok: false, mensagem: "Não foi possível criar o duelo." };
  revalidatePath("/simulador");
  return { ok: true, mensagem: "Duelo criado! Mande o código pro seu amigo.", codigo: data?.codigo };
}

export async function entrarDuelo(codigo: string): Promise<Resultado> {
  const supabase = await criarClienteServidor();
  const { error } = await supabase.rpc("entrar_duelo", { p_codigo: codigo });
  if (error) {
    const msg = error.message?.includes("Codigo invalido")
      ? "Código inválido, ou o duelo já começou."
      : error.message?.includes("proprio duelo")
        ? "Você não pode entrar no seu próprio duelo."
        : "Não foi possível entrar nesse duelo.";
    return { ok: false, mensagem: msg };
  }
  revalidatePath("/simulador");
  return { ok: true, mensagem: "Duelo começou! Boa sorte." };
}
