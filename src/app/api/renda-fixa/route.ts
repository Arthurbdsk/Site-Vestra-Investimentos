import { NextResponse } from "next/server";
import { buscarTaxaCDI, buscarTesouroDireto } from "@/lib/rendaFixa";

/** CDI/Selic atual + titulos do Tesouro Direto, pra montar a aba de renda fixa. */
export async function GET() {
  const [cdi, tesouro] = await Promise.all([buscarTaxaCDI(), buscarTesouroDireto()]);

  if (!cdi.ok) {
    return NextResponse.json(
      { erro: cdi.motivo, mensagem: cdi.mensagem },
      { status: cdi.motivo === "config" ? 503 : 502 },
    );
  }

  return NextResponse.json({
    cdi: { taxaAnual: cdi.taxaAnual, referencia: cdi.referencia },
    tesouro: tesouro.ok ? tesouro.titulos : [],
    avisoTesouro: tesouro.ok ? null : tesouro.mensagem,
  });
}
