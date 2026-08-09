export type Noticia = {
  titulo: string;
  resumo: string;
  url: string;
  fonte: string;
  publicadoEm: string;
  imagem: string | null;
};

export type ResultadoNoticias =
  | { ok: true; noticias: Noticia[] }
  | { ok: false; motivo: "config" | "erro"; mensagem: string };

/**
 * Manchetes de mercado via marketaux (agrega Yahoo Finance, Reuters, WSJ
 * e outras fontes). Mostramos so titulo + resumo + link pra fonte
 * original — nunca o artigo inteiro, por causa de direitos autorais.
 */
export async function buscarNoticias(): Promise<ResultadoNoticias> {
  const token = process.env.MARKETAUX_API_TOKEN;
  if (!token) {
    return {
      ok: false,
      motivo: "config",
      mensagem: "O token da marketaux ainda não foi preenchido no arquivo .env.local.",
    };
  }

  const params = new URLSearchParams({
    api_token: token,
    language: "en",
    filter_entities: "true",
    limit: "3",
  });

  try {
    const resposta = await fetch(
      `https://api.marketaux.com/v1/news/all?${params.toString()}`,
      { cache: "no-store" },
    );
    if (!resposta.ok) {
      const corpo = await resposta.text().catch(() => "");
      return {
        ok: false,
        motivo: "erro",
        mensagem: `Não foi possível buscar as notícias agora (HTTP ${resposta.status}: ${corpo.slice(0, 200)}).`,
      };
    }

    const json = await resposta.json();
    const lista = Array.isArray(json.data) ? json.data : [];

    const noticias: Noticia[] = lista
      .map((n: Record<string, unknown>) => ({
        titulo: String(n.title ?? ""),
        resumo: String(n.snippet ?? n.description ?? ""),
        url: String(n.url ?? ""),
        fonte: String(n.source ?? "Fonte externa"),
        publicadoEm: String(n.published_at ?? ""),
        imagem: n.image_url ? String(n.image_url) : null,
      }))
      .filter((n: Noticia) => n.titulo && n.url);

    return { ok: true, noticias };
  } catch (e) {
    return {
      ok: false,
      motivo: "erro",
      mensagem: `Não foi possível buscar as notícias agora (${e instanceof Error ? e.message : "erro desconhecido"}).`,
    };
  }
}
