import { NextResponse } from "next/server";
import { ETFS } from "@/lib/etfs";
import { buscarFundosB3 } from "@/lib/buscaAcoes";
import { montarCotacoesCuradas } from "@/lib/cotacoes";

/**
 * Sem `q`: os ETFs curados, lidos da tabela cotacoes (mantida pelo cron
 * atualizar_cotacoes), os unicos com explicacao em portugues.
 *
 * Com `q`: busca nos 182 ETFs listados na B3, via brapi type=fund +
 * subType=etf. Mesmo motivo dos FIIs: type=stock nao devolve ETF.
 */
export async function GET(request: Request) {
  const termo = new URL(request.url).searchParams.get("q")?.trim() ?? "";

  if (termo) {
    const r = await buscarFundosB3(termo, "etf");
    if (!r.ok) return NextResponse.json({ acoes: [], erro: r.mensagem });
    return NextResponse.json({ acoes: r.acoes });
  }

  const acoes = await montarCotacoesCuradas(
    ETFS.map((e) => ({ ticker: e.ticker, nome: e.nome, setor: e.indice, explica: e.explica })),
  );

  return NextResponse.json({ acoes });
}
