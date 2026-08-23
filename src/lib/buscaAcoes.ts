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
  return buscarNaBrapi(termo, { type: "stock", sortBy: "market_cap_basic" });
}

/**
 * Busca em TODOS os fundos listados na B3, nao apenas nos curados.
 *
 * A brapi separa fundo de acao por `type=fund`, e dentro disso distingue
 * FII de ETF por `subType`. Sao 332 FIIs e 182 ETFs, contra os 10 e 6 das
 * listas curadas, que continuam existindo como destaque ("Populares"),
 * porque so elas tem explicacao escrita em portugues.
 *
 * Volume nao vem ordenavel por valor de mercado aqui (fundo nao publica
 * market_cap na brapi), entao a ordem e por volume negociado.
 */
export async function buscarFundosB3(
  termo: string,
  subTipo: "fii" | "etf",
): Promise<ResultadoBusca> {
  return buscarNaBrapi(termo, { type: "fund", subType: subTipo, sortBy: "volume" });
}

// Cada tecla digitada na busca dispara uma chamada; sem isso, um usuario
// digitando "petr4" gera 5 chamadas identicas em sequencia contra o plano
// pago da brapi. Cache simples em memoria (nao e um limitador distribuido,
// so um jeito pratico de nao repetir a mesma busca dentro de uma janela
// curta), valido enquanto o processo do servidor Node estiver de pe.
const CACHE_BUSCA = new Map<string, { at: number; data: ResultadoBusca }>();
const TTL_CACHE_MS = 9_000;

/** Tamanho de pagina da lista de resultados da busca (equilibra cobertura
 * da bolsa inteira com o tempo de resposta da brapi). */
const LIMITE_RESULTADOS = "48";

async function buscarNaBrapi(
  termo: string,
  filtros: { type: string; subType?: string; sortBy: string },
): Promise<ResultadoBusca> {
  const token = process.env.BRAPI_TOKEN;
  if (!token || token.startsWith("cole_aqui")) {
    return {
      ok: false,
      motivo: "config",
      mensagem: "O token da brapi ainda não foi preenchido no arquivo .env.local.",
    };
  }

  const params = new URLSearchParams({
    type: filtros.type,
    limit: LIMITE_RESULTADOS,
    sortBy: filtros.sortBy,
    sortOrder: "desc",
  });
  if (filtros.subType) params.set("subType", filtros.subType);
  if (termo.trim()) params.set("search", termo.trim());

  const chaveCache = params.toString();
  const cacheado = CACHE_BUSCA.get(chaveCache);
  if (cacheado && cacheado.at > Date.now() - TTL_CACHE_MS) {
    return cacheado.data;
  }

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

    // Fundo nao publica setor na brapi, entao sem esta reserva o rotulo
    // saia vazio no cartao de todo FII e ETF fora da lista curada.
    const setorReserva =
      filtros.subType === "fii"
        ? "Fundo imobiliário"
        : filtros.subType === "etf"
          ? "ETF"
          : null;

    const acoes: AcaoB3[] = lista.map((s: Record<string, unknown>) => ({
      ticker: String(s.stock ?? ""),
      nome: String(s.name ?? s.stock ?? ""),
      preco: Number.isFinite(Number(s.close)) ? Number(s.close) : null,
      variacao: Number.isFinite(Number(s.change)) ? Number(s.change) : null,
      setor: s.sector ? String(s.sector) : setorReserva,
      volume: Number.isFinite(Number(s.volume)) ? Number(s.volume) : null,
      valorMercado: Number.isFinite(Number(s.market_cap)) ? Number(s.market_cap) : null,
      logo: s.logo ? String(s.logo) : null,
    }));

    // O mercado fracionario duplica cada ticker com um "F" no final
    // (ex: PETR4F ao lado de PETR4); e a mesma empresa, entao filtramos.
    const semFracionario = acoes.filter(
      (a) => a.ticker && !a.ticker.endsWith("F"),
    );

    const resultado: ResultadoBusca = { ok: true, acoes: semFracionario };
    CACHE_BUSCA.set(chaveCache, { at: Date.now(), data: resultado });
    return resultado;
  } catch {
    return {
      ok: false,
      motivo: "erro",
      mensagem: "Não foi possível buscar as ações agora. Tente de novo em instantes.",
    };
  }
}
