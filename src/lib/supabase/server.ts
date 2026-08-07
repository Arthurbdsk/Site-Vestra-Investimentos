import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config";

/** Cliente do Supabase para usar no servidor (paginas e rotas de API). */
export async function criarClienteServidor() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Chamado de um Server Component: o middleware cuida de renovar a sessao.
        }
      },
    },
  });
}

/**
 * Devolve o usuario logado, ou null. Nunca lanca excecao: se as chaves
 * nao estiverem configuradas (deploy sem variaveis de ambiente, por
 * exemplo), o site continua de pe em vez de quebrar o build inteiro.
 */
export async function usuarioAtual() {
  const { supabaseConfigurado } = await import("./config");
  if (!supabaseConfigurado()) return null;

  try {
    const supabase = await criarClienteServidor();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}
