import { NextRequest, NextResponse } from "next/server";
import { buscarNoticias } from "@/lib/noticias";

/** Manchetes de mercado, sem o token da marketaux chegar ao navegador. */
export async function GET(request: NextRequest) {
  const busca = request.nextUrl.searchParams.get("q")?.trim() || undefined;
  const r = await buscarNoticias(busca);

  if (!r.ok) {
    return NextResponse.json(
      { erro: r.motivo, mensagem: r.mensagem },
      { status: r.motivo === "config" ? 503 : 502 },
    );
  }

  return NextResponse.json({ noticias: r.noticias });
}
