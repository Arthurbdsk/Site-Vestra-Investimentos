/**
 * So aceita caminhos internos relativos como destino de redirecionamento
 * pos-login. Sem isso, um link como ".../auth/callback?next=@evil.com"
 * vira `${origin}${next}` = "https://vestra...@evil.com", que o navegador
 * interpreta como o host "evil.com" (tudo antes do "@" vira userinfo) e
 * manda a pessoa, ja autenticada, pra fora do site.
 */
export function rotaSegura(next: string | null, fallback = "/simulador"): string {
  if (!next) return fallback;
  if (!next.startsWith("/") || next.startsWith("//")) return fallback;
  if (next.includes("://") || next.includes("@") || next.includes("\\")) return fallback;
  return next;
}
