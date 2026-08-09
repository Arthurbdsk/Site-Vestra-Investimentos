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

export type ResultadoTesouro = { ok: true; titulos: TituloTesouro[] };

/**
 * Titulos do Tesouro Direto. O endpoint ao vivo da brapi
 * (/api/v2/treasury/list) tambem exige plano pago, entao usamos uma lista
 * curada com taxas aproximadas — mesma logica do CDI aproximado acima.
 * Nao muda dia a dia, mas reflete bem a cara de cada tipo de titulo.
 */
const TESOURO_ATUALIZADO_EM = "2026-01";

const TITULOS_TESOURO: TituloTesouro[] = [
  {
    symbol: "tesouro-selic-2029",
    nome: "Tesouro Selic 2029",
    indexador: "Selic",
    taxaCompra: 15.0,
    precoCompra: 100,
    vencimento: "2029-03-01",
  },
  {
    symbol: "tesouro-prefixado-2029",
    nome: "Tesouro Prefixado 2029",
    indexador: "Prefixado",
    taxaCompra: 13.8,
    precoCompra: 100,
    vencimento: "2029-01-01",
  },
  {
    symbol: "tesouro-ipca-2035",
    nome: "Tesouro IPCA+ 2035",
    indexador: "IPCA+",
    taxaCompra: 7.2,
    precoCompra: 100,
    vencimento: "2035-05-15",
  },
  {
    symbol: "tesouro-ipca-2045",
    nome: "Tesouro IPCA+ 2045",
    indexador: "IPCA+",
    taxaCompra: 7.5,
    precoCompra: 100,
    vencimento: "2045-05-15",
  },
];

export async function buscarTesouroDireto(): Promise<ResultadoTesouro> {
  return { ok: true, titulos: TITULOS_TESOURO };
}

export { TESOURO_ATUALIZADO_EM, TITULOS_TESOURO };

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
