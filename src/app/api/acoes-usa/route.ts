import { NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";
import { ACOES_USA } from "@/lib/acoesUsa";

/**
 * Cotacoes das acoes americanas curadas, ja convertidas pra R$ (a
 * conversao acontece no banco, ver garantir_cotacao/atualizar_cotacoes).
 * Le direto da cache em vez de chamar a brapi de novo.
 */
export async function GET() {
  const supabase = await criarClienteServidor();
  const tickers = ACOES_USA.map((a) => a.ticker);

  const { data } = await supabase
    .from("cotacoes")
    .select("ticker, preco, variacao")
    .in("ticker", tickers);

  const mapa = new Map((data ?? []).map((c) => [c.ticker, c]));

  const acoes = ACOES_USA.map((a) => {
    const c = mapa.get(a.ticker);
    return {
      ticker: a.ticker,
      nome: a.nome,
      setor: a.setor,
      explica: a.explica,
      preco: c ? Number(c.preco) : null,
      variacao: c ? Number(c.variacao) : null,
      logo: null,
    };
  });

  return NextResponse.json({ acoes });
}
