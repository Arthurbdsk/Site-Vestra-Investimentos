import { NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";
import { ETFS } from "@/lib/etfs";
import { buscarFundosB3 } from "@/lib/buscaAcoes";

/**
 * Sem `q`: os ETFs curados, lidos da tabela cotacoes (mantida pelo cron
 * atualizar_cotacoes) — os unicos com explicacao em portugues.
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

  const supabase = await criarClienteServidor();
  const tickers = ETFS.map((e) => e.ticker);
  const { data } = await supabase.from("cotacoes").select("ticker, preco, variacao, logo").in("ticker", tickers);
  const mapa = new Map((data ?? []).map((c) => [c.ticker, c]));

  const acoes = ETFS.map((e) => {
    const c = mapa.get(e.ticker);
    return {
      ticker: e.ticker,
      nome: e.nome,
      setor: e.indice,
      explica: e.explica,
      preco: c ? Number(c.preco) : null,
      variacao: c ? Number(c.variacao) : null,
      logo: c?.logo ?? null,
    };
  });

  return NextResponse.json({ acoes });
}
