import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./config";

/**
 * Cliente com a service role key: ignora RLS por completo. So pra rotas
 * administrativas que nunca recebem requisicao direta do navegador (ex:
 * o cron do resumo semanal), nunca importar isso em codigo de cliente
 * nem em Server Component que responde requisicao de usuario comum.
 */
export function criarClienteAdmin() {
  const chave = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !chave) return null;

  return createClient(SUPABASE_URL, chave, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
