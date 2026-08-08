import { NextRequest, NextResponse } from "next/server";
import { buscarAcoesB3 } from "@/lib/buscaAcoes";

/** Busca em toda a B3 pra aba "Explorar", sem o token chegar ao navegador. */
export async function GET(req: NextRequest) {
  const termo = req.nextUrl.searchParams.get("q") ?? "";
  const r = await buscarAcoesB3(termo);

  if (!r.ok) {
    return NextResponse.json(
      { erro: r.motivo, mensagem: r.mensagem },
      { status: r.motivo === "config" ? 503 : 502 },
    );
  }

  return NextResponse.json({ acoes: r.acoes });
}
