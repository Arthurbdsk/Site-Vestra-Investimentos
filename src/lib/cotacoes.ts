import { TICKERS } from "./acoes";

export type Cotacao = {
  ticker: string;
  preco: number;
  variacao: number;
  atualizadoEm: string;
};

/**
 * Busca cotacoes na brapi.dev. Sempre no servidor, para que o token nunca
 * chegue ao navegador e para que o preco usado numa compra seja definido
 * aqui, e nao enviado pelo cliente (que poderia mentir no valor).
 *
 * O plano gratuito da brapi aceita 1 ativo por requisicao, entao fazemos
 * uma chamada por ticker, em paralelo, e juntamos o resultado.
 */

let cache: { dados: Cotacao[]; expiraEm: number } | null = null;
const TTL = 60_000;

async function buscarUm(ticker: string, token: string): Promise<Cotacao | null> {
  try {
    const resposta = await fetch(
      `https://brapi.dev/api/v2/stocks/quote?symbols=${ticker}`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
    );
    if (!resposta.ok) return null;

    const json = await resposta.json();
    const r = json.results?.[0];
    if (!r) return null;

    // A brapi v2 aninha os dados em "data"; versoes antigas vinham no
    // nivel de cima. Aceitamos os dois formatos.
    const d = (r.data ?? r) as Record<string, unknown>;
    const preco = Number(d.regularMarketPrice);
    if (!Number.isFinite(preco) || preco <= 0) return null;

    return {
      ticker: String(r.symbol ?? r.requestedSymbol ?? ticker),
      preco,
      variacao: Number(d.regularMarketChangePercent ?? 0),
      atualizadoEm: String(d.regularMarketTime ?? new Date().toISOString()),
    };
  } catch {
    return null;
  }
}

export type ResultadoCotacoes =
  | { ok: true; cotacoes: Cotacao[]; doCache: boolean }
  | { ok: false; motivo: "config" | "vazio"; mensagem: string };

export async function buscarCotacoes(): Promise<ResultadoCotacoes> {
  const token = process.env.BRAPI_TOKEN;

  if (!token || token.startsWith("cole_aqui")) {
    return {
      ok: false,
      motivo: "config",
      mensagem: "O token da brapi ainda não foi preenchido no arquivo .env.local.",
    };
  }

  if (cache && cache.expiraEm > Date.now()) {
    return { ok: true, cotacoes: cache.dados, doCache: true };
  }

  const resultados = await Promise.all(
    TICKERS.map((ticker) => buscarUm(ticker, token)),
  );
  const cotacoes = resultados.filter((c): c is Cotacao => c !== null);

  if (cotacoes.length === 0) {
    // Preco levemente desatualizado e melhor que uma tela quebrada.
    if (cache) return { ok: true, cotacoes: cache.dados, doCache: true };
    return {
      ok: false,
      motivo: "vazio",
      mensagem: "Não foi possível buscar as cotações agora. Tente de novo em instantes.",
    };
  }

  cache = { dados: cotacoes, expiraEm: Date.now() + TTL };
  return { ok: true, cotacoes, doCache: false };
}

/** Preco atual de um unico ticker, direto da fonte. Usado nas ordens. */
export async function precoAtual(ticker: string): Promise<number | null> {
  const r = await buscarCotacoes();
  if (!r.ok) return null;
  return r.cotacoes.find((c) => c.ticker === ticker)?.preco ?? null;
}
