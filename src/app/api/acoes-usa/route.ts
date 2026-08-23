import { NextRequest, NextResponse } from "next/server";
import { criarClienteServidor } from "@/lib/supabase/server";
import { ACOES_USA } from "@/lib/acoesUsa";
import { montarCotacoesCuradas } from "@/lib/cotacoes";

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
      (a: { ticker: string; nome: string; preco: number; variacao: number; logo: string | null }) => ({
        ticker: a.ticker,
        nome: a.nome,
        setor: null,
        preco: a.preco,
        variacao: a.variacao,
        logo: a.logo ?? null,
      }),
    );
    return NextResponse.json({ acoes });
  }

  const acoes = await montarCotacoesCuradas(
    ACOES_USA.map((a) => ({ ticker: a.ticker, nome: a.nome, setor: a.setor, explica: a.explica })),
  );

  return NextResponse.json({ acoes });
}
