import { NextResponse } from "next/server";
import { buscarTaxaCDI, buscarTesouroDireto } from "@/lib/rendaFixa";

/** CDI/Selic atual + titulos do Tesouro Direto, pra montar a aba de renda fixa. */
export async function GET() {
  const [cdi, tesouro] = await Promise.all([buscarTaxaCDI(), buscarTesouroDireto()]);

  return NextResponse.json({
    cdi: { taxaAnual: cdi.taxaAnual, referencia: cdi.referencia },
    tesouro: tesouro.titulos,
    avisoTesouro: null,
  });
}
