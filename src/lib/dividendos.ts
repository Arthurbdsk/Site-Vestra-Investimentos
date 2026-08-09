export type DividendoPago = {
  dataPagamento: string;
  rate: number;
  label: string;
};

/**
 * Historico de dividendos de um ticker, via brapi.dev (?dividends=true).
 * Usado pra creditar dividendos reais na carteira de quem tem a acao.
 */
export async function buscarDividendos(ticker: string): Promise<DividendoPago[]> {
  const token = process.env.BRAPI_TOKEN;
  if (!token || token.startsWith("cole_aqui")) return [];

  try {
    const resposta = await fetch(
      `https://brapi.dev/api/quote/${ticker.trim().toUpperCase()}?dividends=true`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
    );
    if (!resposta.ok) return [];

    const json = await resposta.json();
    const cash = json.results?.[0]?.dividendsData?.cashDividends;
    if (!Array.isArray(cash)) return [];

    return cash
      .map((d: Record<string, unknown>) => ({
        dataPagamento: String(d.paymentDate ?? ""),
        rate: Number(d.rate),
        label: String(d.label ?? "Dividendo"),
      }))
      .filter((d) => d.dataPagamento && Number.isFinite(d.rate) && d.rate > 0);
  } catch {
    return [];
  }
}
