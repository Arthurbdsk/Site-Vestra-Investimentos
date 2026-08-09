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
  return { ok: true as const };
}
