import { NextRequest, NextResponse } from "next/server";
import { criarClienteAdmin } from "@/lib/supabase/admin";
import { enviarResumoSemanal } from "@/lib/email";

type Destinatario = {
  usuarioId: string;
  email: string;
  apelido: string;
  patrimonioAtual: number;
  ganhoSemanaPct: number;
  posicaoRanking: number;
};

/**
 * Roda uma vez por semana via cron da Vercel (ver vercel.json). Protegido
 * pelo CRON_SECRET que a propria Vercel manda no header Authorization em
 * disparos automaticos: https://vercel.com/docs/cron-jobs/manage-cron-jobs
 */
export async function GET(request: NextRequest) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo || request.headers.get("authorization") !== `Bearer ${segredo}`) {
    return NextResponse.json({ ok: false, motivo: "nao autorizado" }, { status: 401 });
  }

  const admin = criarClienteAdmin();
  if (!admin) {
    return NextResponse.json({ ok: false, motivo: "supabase admin nao configurado" }, { status: 200 });
  }

  const { data, error } = await admin.rpc("listar_destinatarios_resumo_semanal");
  if (error) {
    return NextResponse.json({ ok: false, motivo: error.message }, { status: 500 });
  }

  const destinatarios = (data ?? []) as Destinatario[];
  let enviados = 0;
  let falhas = 0;

  for (const d of destinatarios) {
    const r = await enviarResumoSemanal(d.email, {
      apelido: d.apelido,
      patrimonioAtual: d.patrimonioAtual,
      ganhoSemanaPct: d.ganhoSemanaPct,
      posicaoRanking: d.posicaoRanking,
    });
    if (r.ok) enviados++;
    else falhas++;
  }

  return NextResponse.json({ ok: true, total: destinatarios.length, enviados, falhas });
}
