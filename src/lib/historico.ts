import { mercadoDoTicker } from "./mercadoStatus";

export type Periodo = "1d" | "3d" | "1wk" | "1mo" | "3mo" | "6mo" | "1y" | "2y" | "5y";

export const PERIODOS: { valor: Periodo; label: string }[] = [
  { valor: "1d", label: "1 dia" },
  { valor: "3d", label: "3 dias" },
  { valor: "1wk", label: "Semana" },
  { valor: "1mo", label: "1 mês" },
  { valor: "3mo", label: "3 meses" },
  { valor: "6mo", label: "6 meses" },
  { valor: "1y", label: "1 ano" },
  { valor: "2y", label: "2 anos" },
  { valor: "5y", label: "5 anos" },
];

export type PontoSerie = {
  data: string;
  preco: number;
  abertura: number;
  maxima: number;
  minima: number;
  volume: number;
};

export type ResultadoHistorico =
  | {
      ok: true;
      ticker: string;
      nome: string;
      precoAntigo: number;
      dataAntiga: string;
      precoAtual: number;
      dataAtual: string;
      serie: PontoSerie[];
    }
  | { ok: false; motivo: "config" | "erro"; mensagem: string };

/** Pra periodos curtos, pedimos uma janela maior (pra sempre pegar pregao de
 * verdade mesmo perto de fim de semana/feriado) e depois filtramos so os
 * ultimos N dias de calendario que realmente tem dado. */
const CONFIG_PERIODO: Record<Periodo, { rangeConsulta: string; interval: string; ultimosDias: number | null }> = {
  "1d": { rangeConsulta: "5d", interval: "15m", ultimosDias: 1 },
  "3d": { rangeConsulta: "5d", interval: "60m", ultimosDias: 3 },
  "1wk": { rangeConsulta: "1mo", interval: "60m", ultimosDias: 7 },
  "1mo": { rangeConsulta: "1mo", interval: "1d", ultimosDias: null },
  "3mo": { rangeConsulta: "3mo", interval: "1d", ultimosDias: null },
  "6mo": { rangeConsulta: "6mo", interval: "1d", ultimosDias: null },
  "1y": { rangeConsulta: "1y", interval: "1d", ultimosDias: null },
  "2y": { rangeConsulta: "2y", interval: "1d", ultimosDias: null },
  "5y": { rangeConsulta: "5y", interval: "1d", ultimosDias: null },
};

type PontoBruto = PontoSerie;

let cacheFx: { taxa: number; expiraEm: number } | null = null;

/** Mesma fonte (gratuita, sem chave) usada no banco pra converter acoes
 * americanas pra reais; aqui em cache local por 30 minutos. */
async function buscarTaxaUsdBrl(): Promise<number | null> {
  if (cacheFx && cacheFx.expiraEm > Date.now()) return cacheFx.taxa;

  try {
    const resposta = await fetch("https://api.frankfurter.app/latest?from=USD&to=BRL", {
      cache: "no-store",
    });
    if (!resposta.ok) return cacheFx?.taxa ?? null;

    const json = await resposta.json();
    const taxa = Number(json.rates?.BRL);
    if (!Number.isFinite(taxa) || taxa <= 0) return cacheFx?.taxa ?? null;

    cacheFx = { taxa, expiraEm: Date.now() + 30 * 60_000 };
    return taxa;
  } catch {
    return cacheFx?.taxa ?? null;
  }
}

function filtrarUltimosDias(serie: PontoBruto[], dias: number): PontoBruto[] {
  const diasUnicos = [...new Set(serie.map((p) => p.data.slice(0, 10)))];
  const diasAlvo = new Set(diasUnicos.slice(-dias));
  return serie.filter((p) => diasAlvo.has(p.data.slice(0, 10)));
}

async function buscarNaBrapi(
  ticker: string,
  rangeConsulta: string,
  interval: string,
): Promise<{ ok: true; nome: string; serie: PontoBruto[] } | { ok: false; mensagem: string }> {
  const token = process.env.BRAPI_TOKEN;
  if (!token || token.startsWith("cole_aqui")) {
    return { ok: false, mensagem: "config" };
  }

  const resposta = await fetch(
    `https://brapi.dev/api/quote/${ticker}?range=${rangeConsulta}&interval=${interval}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
  );
  if (!resposta.ok) return { ok: false, mensagem: "erro" };

  const json = await resposta.json();
  const r = json.results?.[0];
  const serieBruta = r?.historicalDataPrice;
  if (!Array.isArray(serieBruta) || serieBruta.length === 0) {
    return { ok: false, mensagem: "vazio" };
  }

  const serie: PontoBruto[] = serieBruta
    .map((p: Record<string, unknown>) => {
      const preco = Number(p.close);
      return {
        data: new Date(Number(p.date) * 1000).toISOString(),
        preco,
        abertura: Number(p.open) || preco,
        maxima: Number(p.high) || preco,
        minima: Number(p.low) || preco,
        volume: Number(p.volume) || 0,
      };
    })
    .filter((p: PontoBruto) => Number.isFinite(p.preco));

  return { ok: true, nome: String(r.longName ?? r.shortName ?? ticker), serie };
}

/** NYSE/NASDAQ nao tem cobertura na brapi; a API de graficos do Yahoo
 * Finance e publica, sem chave, e cobre qualquer ticker americano. */
async function buscarNoYahoo(
  ticker: string,
  rangeConsulta: string,
  interval: string,
): Promise<{ ok: true; nome: string; serie: PontoBruto[] } | { ok: false; mensagem: string }> {
  const resposta = await fetch(
    `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?range=${rangeConsulta}&interval=${interval}`,
    { cache: "no-store" },
  );
  if (!resposta.ok) return { ok: false, mensagem: "erro" };

  const json = await resposta.json();
  const resultado = json.chart?.result?.[0];
  if (json.chart?.error || !resultado) return { ok: false, mensagem: "vazio" };

  const timestamps: number[] = resultado.timestamp ?? [];
  const quote = resultado.indicators?.quote?.[0] ?? {};
  const fechamentos: (number | null)[] = quote.close ?? [];
  const aberturas: (number | null)[] = quote.open ?? [];
  const maximas: (number | null)[] = quote.high ?? [];
  const minimas: (number | null)[] = quote.low ?? [];
  const volumes: (number | null)[] = quote.volume ?? [];
  const serie: PontoBruto[] = timestamps
    .map((t, i) => {
      const preco = Number(fechamentos[i]);
      return {
        data: new Date(t * 1000).toISOString(),
        preco,
        abertura: Number(aberturas[i]) || preco,
        maxima: Number(maximas[i]) || preco,
        minima: Number(minimas[i]) || preco,
        volume: Number(volumes[i]) || 0,
      };
    })
    .filter((p) => Number.isFinite(p.preco));

  if (serie.length === 0) return { ok: false, mensagem: "vazio" };

  const nome = String(resultado.meta?.longName ?? resultado.meta?.shortName ?? ticker);
  return { ok: true, nome, serie };
}

/**
 * Serie historica de precos de qualquer ticker, B3 ou EUA, usada tanto
 * no grafico do modal de detalhe quanto em "e se eu tivesse investido
 * antes". B3 usa a brapi; EUA usa a API publica de graficos do Yahoo
 * Finance, ja que a brapi so cobre a bolsa brasileira.
 */
export async function buscarHistorico(
  ticker: string,
  periodo: Periodo,
): Promise<ResultadoHistorico> {
  const t = ticker.trim().toUpperCase();
  const config = CONFIG_PERIODO[periodo];
  const mercado = mercadoDoTicker(t);

  try {
    let resultado =
      mercado === "br"
        ? await buscarNaBrapi(t, config.rangeConsulta, config.interval)
        : await buscarNoYahoo(t, config.rangeConsulta, config.interval);

    // Fallback pra B3: a brapi tem uma cota mensal gratuita que pode
    // estourar (ja aconteceu). O Yahoo Finance cobre a B3 tambem, via
    // sufixo ".SA", de graca e sem chave.
    if (!resultado.ok && mercado === "br") {
      resultado = await buscarNoYahoo(`${t}.SA`, config.rangeConsulta, config.interval);
    }

    // Yahoo devolve preco em dolar; o resto do site mostra tudo em real,
    // entao converte aqui pra nao aparecer um numero incompativel no grafico.
    if (resultado.ok && mercado === "us") {
      const fx = await buscarTaxaUsdBrl();
      if (fx) {
        resultado.serie = resultado.serie.map((p) => ({
          ...p,
          preco: p.preco * fx,
          abertura: p.abertura * fx,
          maxima: p.maxima * fx,
          minima: p.minima * fx,
        }));
      }
    }

    if (!resultado.ok) {
      if (resultado.mensagem === "config") {
        return {
          ok: false,
          motivo: "config",
          mensagem: "O token da brapi ainda não foi preenchido no arquivo .env.local.",
        };
      }
      return {
        ok: false,
        motivo: "erro",
        mensagem: "Não encontrei essa ação ou não consegui buscar o histórico dela.",
      };
    }

    const serie = config.ultimosDias ? filtrarUltimosDias(resultado.serie, config.ultimosDias) : resultado.serie;

    if (serie.length < 2) {
      return {
        ok: false,
        motivo: "erro",
        mensagem: "Não há histórico suficiente pra essa ação nesse período.",
      };
    }

    const primeiro = serie[0];
    const ultimo = serie[serie.length - 1];

    return {
      ok: true,
      ticker: t,
      nome: resultado.nome,
      precoAntigo: primeiro.preco,
      dataAntiga: primeiro.data,
      precoAtual: ultimo.preco,
      dataAtual: ultimo.data,
      serie,
    };
  } catch {
    return {
      ok: false,
      motivo: "erro",
      mensagem: "Não foi possível buscar o histórico agora. Tente de novo em instantes.",
    };
  }
}
