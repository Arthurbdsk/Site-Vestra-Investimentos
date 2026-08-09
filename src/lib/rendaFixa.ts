/**
 * Renda fixa: CDI/Selic (taxa de referencia), Tesouro Direto (titulos
 * publicos reais, via brapi) e CDB (lista curada, com taxa expressa em
 * % do CDI, igual ao mercado de verdade).
 */

export type ResultadoTaxa = { ok: true; taxaAnual: number; referencia: string };

/**
 * Taxa Selic/CDI. O endpoint ao vivo da brapi (/api/v2/prime-rate) exige
 * plano pago ("FEATURE_NOT_AVAILABLE" no plano gratuito), entao usamos um
 * valor fixo aproximado, atualizado manualmente aqui de vez em quando.
 * Nao e ao vivo, mas fica perto o suficiente da taxa real pra fins
 * educativos.
 */
const CDI_APROXIMADO = 0.15; // 15% ao ano — atualize aqui quando a Selic mudar
const CDI_ATUALIZADO_EM = "2026-01";

export async function buscarTaxaCDI(): Promise<ResultadoTaxa> {
  return { ok: true, taxaAnual: CDI_APROXIMADO, referencia: CDI_ATUALIZADO_EM };
}

export type TituloTesouro = {
  symbol: string;
  nome: string;
  indexador: string;
  taxaCompra: number;
  precoCompra: number;
  vencimento: string;
};

export type ResultadoTesouro =
  | { ok: true; titulos: TituloTesouro[] }
  | { ok: false; motivo: "config" | "erro"; mensagem: string };

export async function buscarTesouroDireto(): Promise<ResultadoTesouro> {
  const token = process.env.BRAPI_TOKEN;
  if (!token || token.startsWith("cole_aqui")) {
    return {
      ok: false,
      motivo: "config",
      mensagem: "O token da brapi ainda não foi preenchido no arquivo .env.local.",
    };
  }

  try {
    const resposta = await fetch(
      `https://brapi.dev/api/v2/treasury/list?limit=20`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
    );
    if (!resposta.ok) {
      const corpo = await resposta.text().catch(() => "");
      return {
        ok: false,
        motivo: "erro",
        mensagem: `Não foi possível buscar os títulos do Tesouro agora (HTTP ${resposta.status}: ${corpo.slice(0, 200)}).`,
      };
    }

    const json = await resposta.json();
    const lista = json.results ?? json.bonds ?? json.data ?? [];
    if (!Array.isArray(lista)) {
      return {
        ok: false,
        motivo: "erro",
        mensagem: `Resposta inesperada do Tesouro Direto (${JSON.stringify(json).slice(0, 300)}).`,
      };
    }

    const titulos: TituloTesouro[] = lista
      .map((t: Record<string, unknown>) => ({
        symbol: String(t.symbol ?? ""),
        nome: String(t.bondType ?? t.name ?? t.symbol ?? ""),
        indexador: String(t.indexer ?? ""),
        taxaCompra: Number(t.buyRate ?? t.rate ?? 0),
        precoCompra: Number(t.buyPrice ?? t.price ?? 0),
        vencimento: String(t.maturityDate ?? ""),
      }))
      .filter((t) => t.symbol && t.precoCompra > 0);

    return { ok: true, titulos };
  } catch {
    return {
      ok: false,
      motivo: "erro",
      mensagem: "Não foi possível buscar os títulos do Tesouro agora.",
    };
  }
}

export type Cdb = {
  id: string;
  banco: string;
  percentualCdi: number;
  liquidez: "diária" | "no vencimento";
  prazoMeses: number;
};

/** Lista curada de CDBs ficticios, com taxa expressa em % do CDI (como no mercado real). */
export const CDBS: Cdb[] = [
  { id: "cdb-liquidez-diaria", banco: "Banco Aurora", percentualCdi: 100, liquidez: "diária", prazoMeses: 0 },
  { id: "cdb-curto", banco: "Banco Bonança", percentualCdi: 108, liquidez: "no vencimento", prazoMeses: 6 },
  { id: "cdb-medio", banco: "Banco Serra", percentualCdi: 115, liquidez: "no vencimento", prazoMeses: 12 },
  { id: "cdb-longo", banco: "Banco Vale Real", percentualCdi: 122, liquidez: "no vencimento", prazoMeses: 24 },
];
