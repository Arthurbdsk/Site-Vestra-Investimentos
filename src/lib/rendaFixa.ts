/**
 * Renda fixa: CDI/Selic (taxa de referencia), Tesouro Direto (titulos
 * publicos reais, via brapi) e CDB (lista curada, com taxa expressa em
 * % do CDI, igual ao mercado de verdade).
 */

export type ResultadoTaxa =
  | { ok: true; taxaAnual: number; referencia: string }
  | { ok: false; motivo: "config" | "erro"; mensagem: string };

/**
 * Taxa Selic anual atual. Usamos ela tambem como aproximacao do CDI: as
 * duas andam coladas na vida real (CDI fica ~0,1 ponto percentual abaixo
 * da Selic), e a brapi nao tem uma serie separada e confiavel de CDI no
 * plano gratuito.
 */
export async function buscarTaxaCDI(): Promise<ResultadoTaxa> {
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
      `https://brapi.dev/api/v2/prime-rate?country=brazil&historical=false`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
    );
    if (!resposta.ok) {
      return {
        ok: false,
        motivo: "erro",
        mensagem: "Não foi possível buscar a taxa de juros agora.",
      };
    }

    const json = await resposta.json();
    const item = json.prime_rate?.[0] ?? json.results?.[0] ?? json[0];
    const taxa = Number(
      item?.value ?? item?.rate ?? item?.mid ?? item?.selic ?? item?.taxa,
    );
    const referencia = String(item?.date ?? item?.reference_date ?? "");

    if (!Number.isFinite(taxa) || taxa <= 0) {
      return {
        ok: false,
        motivo: "erro",
        mensagem: "Não consegui ler a taxa de juros retornada.",
      };
    }

    return { ok: true, taxaAnual: taxa, referencia };
  } catch {
    return {
      ok: false,
      motivo: "erro",
      mensagem: "Não foi possível buscar a taxa de juros agora.",
    };
  }
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
      return {
        ok: false,
        motivo: "erro",
        mensagem: "Não foi possível buscar os títulos do Tesouro agora.",
      };
    }

    const json = await resposta.json();
    const lista = json.results ?? json.bonds ?? json.data ?? [];
    if (!Array.isArray(lista)) {
      return { ok: false, motivo: "erro", mensagem: "Resposta inesperada do Tesouro Direto." };
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
