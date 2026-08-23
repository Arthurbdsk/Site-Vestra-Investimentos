import { NextResponse } from "next/server";
import { FIIS } from "@/lib/fiis";
import { buscarFundosB3 } from "@/lib/buscaAcoes";
import { montarCotacoesCuradas } from "@/lib/cotacoes";

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

  const acoes = await montarCotacoesCuradas(
    FIIS.map((f) => ({ ticker: f.ticker, nome: f.nome, setor: f.tipo, explica: f.explica })),
  );

  return NextResponse.json({ acoes });
}
