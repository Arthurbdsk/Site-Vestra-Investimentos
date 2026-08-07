import { NextResponse } from "next/server";
import { buscarCotacoes } from "@/lib/cotacoes";

/** Cotacoes para o navegador atualizar precos sem recarregar a pagina. */
export async function GET() {
  const r = await buscarCotacoes();

  if (!r.ok) {
    return NextResponse.json(
      { erro: r.motivo, mensagem: r.mensagem },
      { status: r.motivo === "config" ? 503 : 502 },
    );
  }

  return NextResponse.json({ cotacoes: r.cotacoes, doCache: r.doCache });
}
