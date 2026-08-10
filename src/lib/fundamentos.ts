export type Fundamentos = {
  ticker: string;
  beta: number | null;
  precoLucro: number | null;
  dividendYield: number | null;
  valorDeMercado: number | null;
};

/**
 * Estatisticas fundamentalistas (beta, P/L, dividend yield, valor de
 * mercado) usadas pelo agente de investimento pra avaliar regras que a
 * pessoa escrever (ex: "compre se beta > 1"). Vem do modulo
 * defaultKeyStatistics da brapi, disponivel no plano gratuito.
 */
export async function buscarFundamentos(ticker: string): Promise<Fundamentos | null> {
  const token = process.env.BRAPI_TOKEN;
  if (!token || token.startsWith("cole_aqui")) return null;

  try {
    const resposta = await fetch(
      `https://brapi.dev/api/quote/${ticker}?modules=defaultKeyStatistics`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
    );
    if (!resposta.ok) return null;

    const json = await resposta.json();
    const stats = json.results?.[0]?.defaultKeyStatistics;
    if (!stats) return null;

    return {
      ticker,
      beta: Number.isFinite(stats.beta) ? Number(stats.beta) : null,
      precoLucro: Number.isFinite(stats.trailingPE) ? Number(stats.trailingPE) : null,
      dividendYield: Number.isFinite(stats.dividendYield) ? Number(stats.dividendYield) : null,
      valorDeMercado: Number.isFinite(stats.marketCap) ? Number(stats.marketCap) : null,
    };
  } catch {
    return null;
  }
}

export async function buscarFundamentosVarios(tickers: string[]): Promise<Fundamentos[]> {
  const resultados = await Promise.all(tickers.map(buscarFundamentos));
  return resultados.filter((f): f is Fundamentos => f !== null);
}
