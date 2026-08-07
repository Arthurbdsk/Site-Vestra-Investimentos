export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function preenchida(v: string | undefined): v is string {
  return Boolean(v && v.trim() && !v.startsWith("cole_aqui"));
}

/**
 * As chaves ficam no .env.local, que nao vai para o Git. Em producao elas
 * precisam ser cadastradas no painel da hospedagem. Sem essa checagem o
 * build quebra com um erro tecnico dificil de entender.
 */
export function supabaseConfigurado(): boolean {
  return preenchida(SUPABASE_URL) && preenchida(SUPABASE_ANON_KEY);
}
