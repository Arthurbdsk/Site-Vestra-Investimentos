import { type EmailOtpType } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";

/**
 * Pra onde o link do email de confirmacao aponta. O Supabase ja validou
 * o token antes de redirecionar pra cá; aqui a gente so troca esse token
 * por uma sessao de verdade, dentro do MESMO navegador que abriu o link
 * (por isso token_hash, e nao o fluxo PKCE de code, que quebra quando o
 * email e aberto num navegador diferente do que fez o cadastro).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") ?? "/simulador";

  if (token_hash && type) {
    const supabase = await criarClienteServidor();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?erro=link_invalido`);
}
