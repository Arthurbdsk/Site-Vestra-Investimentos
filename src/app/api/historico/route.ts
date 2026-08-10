import { NextRequest, NextResponse } from "next/server";
import { buscarHistorico, type Periodo } from "@/lib/historico";

const PERIODOS_VALIDOS: Periodo[] = ["1mo", "3mo", "6mo", "1y", "2y", "5y"];

/** Preco antigo x atual de uma acao, pra calcular "e se eu tivesse investido antes". */
export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get("ticker") ?? "";
  const periodo = req.nextUrl.searchParams.get("periodo") ?? "";

  if (!ticker.trim()) {
    return NextResponse.json({ erro: "erro", mensagem: "Informe uma ação." }, { status: 400 });
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
