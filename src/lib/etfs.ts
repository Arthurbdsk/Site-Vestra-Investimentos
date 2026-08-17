/**
 * Lista curada de ETFs (fundos de indice) negociados na B3. Assim como
 * os FIIs, sao tickers da B3 (terminam em 11), entao reaproveitam toda
 * a infraestrutura de cotacao/compra/venda ja existente.
 */
export type Etf = {
  ticker: string;
  nome: string;
  indice: string;
  explica: string;
};

export const ETFS: Etf[] = [
  {
    ticker: "BOVA11",
    nome: "iShares Ibovespa",
    indice: "Ibovespa",
    explica:
      "Segue o Ibovespa, o índice mais conhecido da bolsa brasileira. Comprar uma cota é comprar um pedacinho das maiores empresas da B3 de uma vez só, em vez de escolher ação por ação.",
  },
  {
    ticker: "IVVB11",
    nome: "iShares S&P 500",
    indice: "S&P 500 (EUA)",
    explica:
      "Segue o S&P 500, o principal índice da bolsa americana, mas negociado em reais na B3. Uma forma de investir nas maiores empresas dos EUA sem precisar de conta em corretora internacional.",
  },
  {
    ticker: "SMAL11",
    nome: "iShares Small Cap",
    indice: "Small Caps",
    explica:
      "Segue um índice de empresas menores da B3 (\"small caps\"), que costumam balançar mais que as gigantes, mas também têm mais espaço pra crescer.",
  },
  {
    ticker: "DIVO11",
    nome: "IT Now IDIV",
    indice: "IDIV (dividendos)",
    explica:
      "Segue o IDIV, índice das empresas da B3 que mais pagam dividendos. Foco em renda recorrente, não em valorização rápida do preço.",
  },
  {
    ticker: "XFIX11",
    nome: "Trend ETF IFIX",
    indice: "IFIX (fundos imobiliários)",
    explica:
      "Segue o IFIX, o índice que reúne os principais FIIs da B3. Uma forma de ter exposição a fundos imobiliários variados numa única cota.",
  },
  {
    ticker: "HASH11",
    nome: "Hashdex Nasdaq Crypto Index",
    indice: "Criptomoedas",
    explica:
      "Segue um índice de criptomoedas (Bitcoin, Ethereum e outras), negociado como um ETF comum na B3. Bem mais volátil que os outros ETFs dessa lista.",
  },
];

export function etfPorTicker(ticker: string): Etf | undefined {
  return ETFS.find((e) => e.ticker === ticker);
}
