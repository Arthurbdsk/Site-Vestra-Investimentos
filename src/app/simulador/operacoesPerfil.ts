"use server";

import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { PerfilId } from "@/lib/perfilInvestidor";

export async function salvarPerfilInvestidor(perfil: PerfilId) {
  const supabase = await criarClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const };

  const { error } = await supabase.rpc("definir_perfil_investidor", { p_perfil: perfil });
  if (error) return { ok: false as const };

  revalidatePath("/simulador");
  revalidatePath("/conta");
  return { ok: true as const };
}

/**
 * Marca que ja perguntamos, mesmo que a pessoa tenha pulado.
 *
 * Sem isso o quiz voltava a cada visita: pular nao gravava nada, entao
 * a pagina achava que nunca tinha perguntado. Quem pula uma vez nao deve
 * ser importunado de novo, da pra responder depois na area de conta.
 */
export async function marcarQuizVisto() {
  const supabase = await criarClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const };

  const { error } = await supabase.rpc("marcar_quiz_perfil_visto");
  if (error) return { ok: false as const };

  revalidatePath("/simulador");
  return { ok: true as const };
}

/** Troca o nome que aparece no ranking e na saudacao. */
export async function salvarApelido(apelido: string) {
  const supabase = await criarClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, mensagem: "Sua sessão expirou." };

  const { error } = await supabase.rpc("definir_apelido", { p_apelido: apelido });
  if (error) {
    const limpa = error.message.replace(/^.*?(?:ERROR|error):\s*/i, "").trim();
    return { ok: false as const, mensagem: limpa || "Não consegui salvar esse nome." };
  }

  revalidatePath("/simulador");
  revalidatePath("/conta");
  return { ok: true as const };
}

/** Liga/desliga a pagina publica de perfil (/investidor/[codigo]). */
export async function alternarPerfilPublico(publico: boolean) {
  const supabase = await criarClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const };

  const { error: erroToggle } = await supabase.rpc("alternar_perfil_publico", { p_publico: publico });
  if (erroToggle) return { ok: false as const };

  revalidatePath("/conta");
  return { ok: true as const };
}
