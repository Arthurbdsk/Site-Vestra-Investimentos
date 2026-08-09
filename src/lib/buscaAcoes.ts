export type AcaoB3 = {
  ticker: string;
  nome: string;
  preco: number | null;
  variacao: number | null;
  setor: string | null;
  volume: number | null;
  valorMercado: number | null;
  logo: string | null;
};

export type ResultadoBusca =
  | { ok: true; acoes: AcaoB3[] }
  | { ok: false; motivo: "config" | "erro"; mensagem: string };

/**
 * Busca ações em toda a B3 (nao so a lista curada), via brapi.dev
 * /api/quote/list. Usada na aba "Explorar" quando o usuario digita algo,
 * pra cobrir a bolsa inteira e nao so o punhado de empresas conhecidas.
 */
export async function buscarAcoesB3(termo: string): Promise<ResultadoBusca> {
  const token = process.env.BRAPI_TOKEN;
  if (!token || token.startsWith("cole_aqui")) {
    return {
      ok: false,
      motivo: "config",
      mensagem: "O token da brapi ainda não foi preenchido no arquivo .env.local.",
    };
  }

  const params = new URLSearchParams({
    type: "stock",
    limit: "48",
    sortBy: "market_cap_basic",
    sortOrder: "desc",
  });
  if (termo.trim()) params.set("search", termo.trim());

  try {
    const resposta = await fetch(
      `https://brapi.dev/api/quote/list?${params.toString()}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
    );
    if (!resposta.ok) {
      return {
        ok: false,
        motivo: "erro",
        mensagem: "Não foi possível buscar as ações agora. Tente de novo em instantes.",
      };
    }

    const json = await resposta.json();
    const lista = Array.isArray(json.stocks) ? json.stocks : [];

    const acoes: AcaoB3[] = lista.map((s: Record<string, unknown>) => ({
      ticker: String(s.stock ?? ""),
      nome: String(s.name ?? s.stock ?? ""),
      preco: Number.isFinite(Number(s.close)) ? Number(s.close) : null,
      variacao: Number.isFinite(Number(s.change)) ? Number(s.change) : null,
      setor: s.sector ? String(s.sector) : null,
      volume: Number.isFinite(Number(s.volume)) ? Number(s.volume) : null,
      valorMercado: Number.isFinite(Number(s.market_cap)) ? Number(s.market_cap) : null,
      logo: s.logo ? String(s.logo) : null,
    }));

    // O mercado fracionario duplica cada ticker com um "F" no final
    // (ex: PETR4F ao lado de PETR4); e a mesma empresa, entao filtramos.
    const semFracionario = acoes.filter(
      (a) => a.ticker && !a.ticker.endsWith("F"),
    );

    return { ok: true, acoes: semFracionario };
  } catch {
    return {
      ok: false,
      motivo: "erro",
      mensagem: "Não foi possível buscar as ações agora. Tente de novo em instantes.",
    };
  }
}
