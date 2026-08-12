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
      // Login com Google pula o formulario de cadastro (onde fica o
      // checkbox), entao o aceite dos termos e registrado aqui.
      await supabase.rpc("aceitar_termos");
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?erro=login_google_falhou`);
}
