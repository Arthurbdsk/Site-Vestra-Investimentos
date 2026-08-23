import { NextRequest, NextResponse } from "next/server";
import { buscarFundamentos } from "@/lib/fundamentos";

// Cobre tickers da B3 (PETR4, HGLG11), dos EUA (AAPL) e evita que qualquer
// outra coisa (path traversal, espacos, barra) chegue na URL da brapi.
const TICKER_VALIDO = /^[A-Z0-9.]{1,10}$/;

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker")?.trim().toUpperCase();
  if (!ticker) {
    return NextResponse.json({ fundamentos: null }, { status: 400 });
  }
  if (!TICKER_VALIDO.test(ticker)) {
    return NextResponse.json({ erro: "erro", mensagem: "Ticker inválido." }, { status: 400 });
  }

  const fundamentos = await buscarFundamentos(ticker);
  return NextResponse.json({ fundamentos });
}
