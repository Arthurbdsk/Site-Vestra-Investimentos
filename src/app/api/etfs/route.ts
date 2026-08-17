import { NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";
import { ETFS } from "@/lib/etfs";

/**
 * Cotacoes dos ETFs curados, lidas da tabela cotacoes (mantida pelo cron
 * atualizar_cotacoes). Mesmo motivo do /api/fiis: a busca geral da B3
 * (type=stock na brapi) nao inclui ETFs.
 */
export async function GET() {
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
