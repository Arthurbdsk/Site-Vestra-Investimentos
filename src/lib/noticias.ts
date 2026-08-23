import { criarClienteServidor } from "@/lib/supabase/server";

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
 * e outras fontes). A busca em si roda dentro do Postgres (funcao
 * buscar_noticias, mesmo padrao das cotacoes): o token nunca precisa
 * estar numa env var da Vercel, so no banco.
 */
export async function buscarNoticias(busca?: string): Promise<ResultadoNoticias> {
  try {
    const supabase = await criarClienteServidor();
    const { data, error } = await supabase.rpc("buscar_noticias", {
      p_busca: busca ?? null,
    });

    if (error) {
      console.error("[noticias] buscar_noticias falhou:", error.message);
      return {
        ok: false,
        motivo: "erro",
        mensagem: "Não foi possível buscar as notícias agora.",
      };
    }

    return { ok: true, noticias: (data ?? []) as Noticia[] };
  } catch (e) {
    console.error("[noticias] erro inesperado:", e instanceof Error ? e.message : e);
    return {
      ok: false,
      motivo: "erro",
      mensagem: "Não foi possível buscar as notícias agora.",
    };
  }
}
