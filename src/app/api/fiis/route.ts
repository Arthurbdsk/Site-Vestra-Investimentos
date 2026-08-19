import { NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";
import { FIIS } from "@/lib/fiis";
import { buscarFundosB3 } from "@/lib/buscaAcoes";

/**
 * Sem `q`: os FIIs curados, lidos da tabela cotacoes (mantida pelo cron
 * atualizar_cotacoes). Sao os unicos com explicacao escrita em portugues,
 * entao continuam sendo o destaque da aba.
 *
 * Com `q`: busca nos 332 FIIs listados na B3, via brapi type=fund +
 * subType=fii. A busca geral de acoes (type=stock) nao devolve FII, e era
 * por isso que a aba ficava limitada a lista curada.
 */
export async function GET(request: Request) {
  const termo = new URL(request.url).searchParams.get("q")?.trim() ?? "";

  if (termo) {
    const r = await buscarFundosB3(termo, "fii");
    if (!r.ok) return NextResponse.json({ acoes: [], erro: r.mensagem });
    // `explica` fica de fora aqui: fundo vindo da busca nao tem texto
    // proprio, e inventar um seria pior do que nao mostrar nenhum.
    return NextResponse.json({ acoes: r.acoes });
  }

  const supabase = await criarClienteServidor();
  const tickers = FIIS.map((f) => f.ticker);
  const { data } = await supabase.from("cotacoes").select("ticker, preco, variacao, logo").in("ticker", tickers);
  const mapa = new Map((data ?? []).map((c) => [c.ticker, c]));

  const acoes = FIIS.map((f) => {
    const c = mapa.get(f.ticker);
    return {
      ticker: f.ticker,
      nome: f.nome,
      setor: f.tipo,
      explica: f.explica,
      preco: c ? Number(c.preco) : null,
      variacao: c ? Number(c.variacao) : null,
      logo: c?.logo ?? null,
    };
  });

  return NextResponse.json({ acoes });
}
