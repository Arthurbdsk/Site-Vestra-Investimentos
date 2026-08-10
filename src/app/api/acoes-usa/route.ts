import { NextRequest, NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";
import { ACOES_USA } from "@/lib/acoesUsa";

/**
 * Sem busca: cotacoes das 12 acoes curadas, lidas da cache (rapido).
 * Com busca (?q=): qualquer acao da NYSE/NASDAQ via finnhub, dentro do
 * banco (buscar_acoes_usa), pra cobrir a bolsa toda, nao so a lista.
 */
export async function GET(req: NextRequest) {
  const termo = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const supabase = await criarClienteServidor();

  if (termo.length >= 2) {
    const { data, error } = await supabase.rpc("buscar_acoes_usa", { p_busca: termo });
    if (error) {
      return NextResponse.json(
        { erro: "erro", mensagem: "Não foi possível buscar ações americanas agora." },
        { status: 502 },
      );
    }
    const acoes = (data ?? []).map(
      (a: { ticker: string; nome: string; preco: number; variacao: number }) => ({
        ticker: a.ticker,
        nome: a.nome,
        setor: null,
        preco: a.preco,
        variacao: a.variacao,
        logo: null,
      }),
    );
    return NextResponse.json({ acoes });
  }

  const tickers = ACOES_USA.map((a) => a.ticker);
  const { data } = await supabase.from("cotacoes").select("ticker, preco, variacao").in("ticker", tickers);
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
