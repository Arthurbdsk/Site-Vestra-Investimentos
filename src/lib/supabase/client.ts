import { createBrowserClient } from "@supabase/ssr";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config";

/** Cliente do Supabase para usar no navegador. */
export function criarClienteNavegador() {
  return createBrowserClient(SUPABASE_URL!, SUPABASE_ANON_KEY!);
}
