import { NextRequest, NextResponse } from "next/server";
import { buscarFundamentos } from "@/lib/fundamentos";

export async function GET(request: NextRequest) {
  const ticker = request.nextUrl.searchParams.get("ticker")?.trim().toUpperCase();
  if (!ticker) {
    return NextResponse.json({ fundamentos: null }, { status: 400 });
  }

  const fundamentos = await buscarFundamentos(ticker);
  return NextResponse.json({ fundamentos });
}
