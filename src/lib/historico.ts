export type Periodo = "1mo" | "3mo" | "6mo" | "1y" | "2y" | "5y";

export const PERIODOS: { valor: Periodo; label: string }[] = [
  { valor: "1mo", label: "1 mês" },
  { valor: "3mo", label: "3 meses" },
  { valor: "6mo", label: "6 meses" },
  { valor: "1y", label: "1 ano" },
  { valor: "2y", label: "2 anos" },
  { valor: "5y", label: "5 anos" },
];

export type PontoSerie = { data: string; preco: number };

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

/**
 * Preco de uma acao no inicio e no fim de um periodo (ex: "ha 1 ano" vs
 * "hoje"), usado pra calcular "e se voce tivesse investido antes". Usa o
 * mesmo endpoint de cotacao da brapi, so que com range/interval, que devolve
 * a serie historica em historicalDataPrice.
 */
export async function buscarHistorico(
  ticker: string,
  periodo: Periodo,
): Promise<ResultadoHistorico> {
  const token = process.env.BRAPI_TOKEN;
  if (!token || token.startsWith("cole_aqui")) {
    return {
      ok: false,
      motivo: "config",
      mensagem: "O token da brapi ainda não foi preenchido no arquivo .env.local.",
    };
  }

  const t = ticker.trim().toUpperCase();
  // O plano gratuito da brapi so libera granularidade diaria (1d) pro
  // intervalo, entao nao ha como oferecer um grafico intraday de verdade.

  try {
    const resposta = await fetch(
      `https://brapi.dev/api/quote/${t}?range=${periodo}&interval=1d`,
      { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
    );
    if (!resposta.ok) {
      return {
        ok: false,
        motivo: "erro",
        mensagem: "Não encontrei essa ação ou não consegui buscar o histórico dela.",
      };
    }

    const json = await resposta.json();
    const r = json.results?.[0];
    let serie = r?.historicalDataPrice;
    if (!Array.isArray(serie) || serie.length === 0) {
      return {
        ok: false,
        motivo: "erro",
        mensagem: "Não há histórico suficiente pra essa ação nesse período.",
      };
    }

    if (serie.length < 2) {
      return {
        ok: false,
        motivo: "erro",
        mensagem: "Não há histórico suficiente pra essa ação nesse período.",
      };
    }

    const primeiro = serie[0];
    const ultimo = serie[serie.length - 1];
    const precoAntigo = Number(primeiro.close);
    const precoAtual = Number(ultimo.close);
    if (!Number.isFinite(precoAntigo) || !Number.isFinite(precoAtual)) {
      return {
        ok: false,
        motivo: "erro",
        mensagem: "Não consegui ler os preços históricos dessa ação.",
      };
    }

    const pontosValidos: PontoSerie[] = serie
      .map((p: Record<string, unknown>) => ({
        data: new Date(Number(p.date) * 1000).toISOString(),
        preco: Number(p.close),
      }))
      .filter((p: PontoSerie) => Number.isFinite(p.preco));

    return {
      ok: true,
      ticker: String(r.symbol ?? t),
      nome: String(r.longName ?? r.shortName ?? t),
      precoAntigo,
      dataAntiga: new Date(Number(primeiro.date) * 1000).toISOString(),
      precoAtual,
      dataAtual: new Date(Number(ultimo.date) * 1000).toISOString(),
      serie: pontosValidos,
    };
  } catch {
    return {
      ok: false,
      motivo: "erro",
      mensagem: "Não foi possível buscar o histórico agora. Tente de novo em instantes.",
    };
  }
}
