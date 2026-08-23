"use server";

import { buscarHistoricoAbsoluto } from "@/lib/cenarios";
import type { PontoSerie } from "@/lib/historico";

/**
 * "use server" fica num arquivo proprio porque so pode exportar funcoes
 * async: CENARIOS e o resto de lib/cenarios.ts sao dados simples,
 * importados direto no componente cliente.
 */
export async function buscarSerieCenario(
  ticker: string,
  dataInicio: string,
  dataFim: string,
): Promise<{ ok: true; serie: PontoSerie[] } | { ok: false; mensagem: string }> {
  return buscarHistoricoAbsoluto(ticker, dataInicio, dataFim);
}
