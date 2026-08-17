import { NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";
import { FIIS } from "@/lib/fiis";

/**
 * Cotacoes dos FIIs curados, lidas da tabela cotacoes (mantida pelo cron
 * atualizar_cotacoes). Nao usa a busca geral da B3 (buscarAcoesB3),
 * porque o filtro "type=stock" da brapi nao inclui FIIs, so acoes.
 */
export async function GET() {
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
