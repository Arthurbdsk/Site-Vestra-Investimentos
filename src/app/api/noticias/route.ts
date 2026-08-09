import { NextResponse } from "next/server";
import { buscarNoticias } from "@/lib/noticias";

/** Manchetes de mercado, sem o token da marketaux chegar ao navegador. */
export async function GET() {
  const r = await buscarNoticias();

  if (!r.ok) {
    return NextResponse.json(
      { erro: r.motivo, mensagem: r.mensagem },
      { status: r.motivo === "config" ? 503 : 502 },
    );
  }

  return NextResponse.json({ noticias: r.noticias });
}
