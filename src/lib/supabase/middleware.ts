import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_URL, SUPABASE_ANON_KEY, supabaseConfigurado } from "./config";

// Rotas que exigem sessao. Cada pagina aqui dentro ja verifica o usuario
// por conta propria e redireciona (ver src/app/conta/page.tsx e o
// componente de convite em src/app/simulador/page.tsx); esta lista e
// so uma segunda barreira, antes da pagina chegar a renderizar.
const PREFIXOS_PROTEGIDOS = ["/simulador", "/conta"];

/**
 * Renova o cookie de sessao a cada navegacao. Sem isso o usuario e
 * deslogado sozinho quando o token expira.
 */
export async function atualizarSessao(request: NextRequest) {
  let resposta = NextResponse.next({ request });

  // Sem chaves configuradas nao ha sessao para renovar; deixa passar.
  if (!supabaseConfigurado()) return resposta;

  const supabase = createServerClient(
    SUPABASE_URL!,
    SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          resposta = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            resposta.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Defesa em profundidade: nao substitui a checagem de cada pagina,
  // so barra a rota mais cedo caso alguma pagina protegida futura
  // esqueca de checar a sessao por conta propria. Sessao anonima
  // (visitante do simulador) conta como usuario valido aqui, do mesmo
  // jeito que conta nas paginas.
  const rotaProtegida = PREFIXOS_PROTEGIDOS.some((prefixo) =>
    request.nextUrl.pathname.startsWith(prefixo),
  );
  if (rotaProtegida && !user) {
    const urlLogin = request.nextUrl.clone();
    urlLogin.pathname = "/login";
    urlLogin.search = "";
    const redirecionamento = NextResponse.redirect(urlLogin);
    // Copia os cookies ja atualizados por getAll/setAll acima, senao um
    // refresh de sessao que tenha acontecido na mesma requisicao se perde
    // no redirecionamento.
    resposta.cookies.getAll().forEach((cookie) => {
      redirecionamento.cookies.set(cookie);
    });
    return redirecionamento;
  }

  return resposta;
}
