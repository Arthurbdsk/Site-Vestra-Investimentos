import { type Acao, ACOES } from "./acoes";
import { ACOES_USA } from "./acoesUsa";
import { FIIS } from "./fiis";
import { ETFS } from "./etfs";

/**
 * Busca em TODAS as listas curadas (acoes BR, acoes EUA, FIIs, ETFs).
 *
 * acaoPorTicker() olha so a lista da B3, entao quem comprava um ETF, um
 * FII ou uma acao americana via a linha da carteira sem nome nenhum, so
 * com o ticker. Aqui os quatro catalogos entram juntos, no formato comum
 * de Acao (o campo de categoria de cada um vira "setor").
 */
export function ativoPorTicker(ticker: string): Acao | undefined {
  const naB3 = ACOES.find((a) => a.ticker === ticker);
  if (naB3) return naB3;

  const naUsa = ACOES_USA.find((a) => a.ticker === ticker);
  if (naUsa) return naUsa;

  const fii = FIIS.find((f) => f.ticker === ticker);
  if (fii) {
    return { ticker: fii.ticker, nome: fii.nome, setor: fii.tipo, explica: fii.explica };
  }

  const etf = ETFS.find((e) => e.ticker === ticker);
  if (etf) {
    return { ticker: etf.ticker, nome: etf.nome, setor: etf.indice, explica: etf.explica };
  }

  return undefined;
}
