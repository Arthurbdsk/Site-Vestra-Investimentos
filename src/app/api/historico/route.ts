import { NextRequest, NextResponse } from "next/server";
import { buscarHistorico, type Periodo } from "@/lib/historico";

const PERIODOS_VALIDOS: Periodo[] = ["1d", "3d", "1wk", "1mo", "3mo", "6mo", "1y", "2y", "5y"];

// Cobre tickers da B3 (PETR4, HGLG11), dos EUA (AAPL) e evita que qualquer
// outra coisa (path traversal, espacos, barra) chegue na URL da brapi/Yahoo.
const TICKER_VALIDO = /^[A-Z0-9.]{1,10}$/;

/** Preco antigo x atual de uma acao, pra calcular "e se eu tivesse investido antes". */
export async function GET(req: NextRequest) {
  const ticker = (req.nextUrl.searchParams.get("ticker") ?? "").trim().toUpperCase();
  const periodo = req.nextUrl.searchParams.get("periodo") ?? "";

  if (!ticker) {
    return NextResponse.json({ erro: "erro", mensagem: "Informe uma ação." }, { status: 400 });
  }
  if (!TICKER_VALIDO.test(ticker)) {
    return NextResponse.json({ erro: "erro", mensagem: "Ticker inválido." }, { status: 400 });
  }
  if (!PERIODOS_VALIDOS.includes(periodo as Periodo)) {
    return NextResponse.json({ erro: "erro", mensagem: "Período inválido." }, { status: 400 });
  }

  const r = await buscarHistorico(ticker, periodo as Periodo);

  if (!r.ok) {
    return NextResponse.json(
      { erro: r.motivo, mensagem: r.mensagem },
      { status: r.motivo === "config" ? 503 : 502 },
    );
  }

  return NextResponse.json(r);
}
