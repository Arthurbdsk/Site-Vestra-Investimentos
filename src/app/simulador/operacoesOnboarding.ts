"use server";

import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/server";

const NIVEIS_VALIDOS = new Set(["iniciante", "intermediario", "avancado"]);

/**
 * Guarda o nivel de experiencia declarado e marca o onboarding como visto.
 *
 * O nivel serve pra calibrar explicacao, nao pra liberar ou trancar
 * ferramenta, entao ele nunca e consultado pra decidir permissao.
 */
export async function salvarOnboarding(
  nivel: string,
): Promise<{ ok: boolean }> {
  if (!NIVEIS_VALIDOS.has(nivel)) return { ok: false };

  const supabase = await criarClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { error } = await supabase.rpc("salvar_onboarding", {
    p_nivel: nivel,
  });

  if (error) return { ok: false };

  revalidatePath("/simulador");
  return { ok: true };
}

/** Fecha o onboarding sem escolher nivel (quem pulou responde depois). */
export async function marcarOnboardingVisto(): Promise<{ ok: boolean }> {
  const supabase = await criarClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { error } = await supabase.rpc("marcar_onboarding_visto");
  if (error) return { ok: false };

  revalidatePath("/simulador");
  return { ok: true };
}
