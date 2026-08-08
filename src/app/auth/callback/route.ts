import { type NextRequest, NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";

/**
 * Pra onde o Google manda a pessoa de volta depois do login. Troca o
 * codigo temporario por uma sessao de verdade.
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/simulador";

  if (code) {
    const supabase = await criarClienteServidor();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?erro=login_google_falhou`);
}
