import { ACOES, acaoPorTicker } from "@/lib/acoes";
import { PERFIS } from "@/lib/perfilInvestidor";
import { CDBS, TITULOS_TESOURO } from "@/lib/rendaFixa";

export type Objetivo = "seguranca" | "equilibrado" | "rentabilidade";

export const OBJETIVOS: { id: Objetivo; label: string; descricao: string }[] = [
  {
    id: "seguranca",
    label: "Segurança máxima",
    descricao: "Priorizar não perder dinheiro, mesmo que renda menos",
  },
  {
    id: "equilibrado",
    label: "Equilibrado",
    descricao: "Um meio-termo entre segurança e crescimento",
  },
  {
    id: "rentabilidade",
    label: "Rentabilidade máxima",
    descricao: "Topar mais oscilação em troca de um retorno maior",
  },
];

export type ItemPlano = {
  tipo: "renda-fixa" | "acao";
  nome: string;
  ticker?: string;
  percentual: number;
  valor: number;
  taxaAnual?: number;
  quandoVender: string;
};

export type Plano = {
  valorTotal: number;
  prazoAnos: number;
  objetivo: Objetivo;
  percentualRendaFixa: number;
  itens: ItemPlano[];
};

const BASE_RENDA_FIXA: Record<Objetivo, number> = {
  seguranca: 80,
  equilibrado: 45,
  rentabilidade: 15,
};

/**
 * Monta um plano de alocacao simples e transparente: define quanto vai
 * pra renda fixa (com base no objetivo e ajustado pelo prazo) e reparte o
 * resto entre acoes da lista curada que combinam com o objetivo. Nao e
 * uma recomendacao de investimento real, e uma simulacao educativa.
 */
export function gerarPlano(
  valorTotal: number,
  prazoAnos: number,
  objetivo: Objetivo,
): Plano {
  let percentualRendaFixa = BASE_RENDA_FIXA[objetivo];

  // Prazo curto pede mais liquidez/seguranca; prazo longo aguenta mais
  // renda variavel, porque ha tempo de recuperar de uma queda.
  if (prazoAnos < 1) percentualRendaFixa += 15;
  else if (prazoAnos > 3) percentualRendaFixa -= 10;
  percentualRendaFixa = Math.min(90, Math.max(10, percentualRendaFixa));

  const valorRendaFixa = round2(valorTotal * (percentualRendaFixa / 100));
  const valorAcoes = valorTotal - valorRendaFixa;

  const itens: ItemPlano[] = [
    ...planoRendaFixa(valorRendaFixa, prazoAnos),
    ...planoAcoes(valorAcoes, objetivo),
  ];

  return { valorTotal, prazoAnos, objetivo, percentualRendaFixa, itens };
}

function planoRendaFixa(valor: number, prazoAnos: number): ItemPlano[] {
  if (valor <= 0) return [];

  if (prazoAnos <= 1) {
    // Prazo curto: tudo em algo com liquidez diaria, sem trava.
    const cdb = CDBS.find((c) => c.liquidez === "diária")!;
    return [
      {
        tipo: "renda-fixa",
        nome: `CDB ${cdb.banco} (liquidez diária)`,
        percentual: 100,
        valor,
        quandoVender: "Resgatar quando precisar, sem prazo mínimo.",
      },
    ];
  }

  // Prazo mais longo: metade num CDB de prazo parecido, metade no
  // Tesouro (Prefixado se ate ~5 anos, IPCA+ se mais longo, protege
  // da inflacao em horizontes bem distantes).
  const cdb =
    prazoAnos <= 2
      ? CDBS.find((c) => c.prazoMeses === 12)!
      : CDBS.find((c) => c.prazoMeses === 24)!;
  const titulo =
    prazoAnos <= 5
      ? TITULOS_TESOURO.find((t) => t.indexador === "Prefixado")!
      : TITULOS_TESOURO.find((t) => t.symbol === "tesouro-ipca-2045")!;

  const metade = round2(valor / 2);
  return [
    {
      tipo: "renda-fixa",
      nome: `CDB ${cdb.banco} (${cdb.percentualCdi}% do CDI)`,
      percentual: 50,
      valor: metade,
      quandoVender: `Manter até o vencimento (${cdb.prazoMeses} meses) pra garantir a taxa cheia.`,
    },
    {
      tipo: "renda-fixa",
      nome: titulo.nome,
      percentual: 50,
      valor: valor - metade,
      taxaAnual: titulo.taxaCompra,
      quandoVender: `Manter até perto do vencimento (${titulo.vencimento.slice(0, 4)}) ou até o fim do seu prazo, o que vier primeiro.`,
    },
  ];
}

function planoAcoes(valor: number, objetivo: Objetivo): ItemPlano[] {
  if (valor <= 0) return [];

  const tickers =
    objetivo === "seguranca"
      ? PERFIS.conservador.tickers
      : objetivo === "rentabilidade"
        ? PERFIS.arrojado.tickers
        : PERFIS.moderado.tickers;

  const quandoVender =
    objetivo === "rentabilidade"
      ? "Reavaliar a cada 6 meses; venda parcial se subir muito acima do resto da carteira."
      : "Reavaliar a cada 12 meses; não venda só por causa de uma queda passageira.";

  const percentualCada = round2(100 / tickers.length);
  const valorCada = round2(valor / tickers.length);

  return tickers.map((ticker, i) => {
    const info = acaoPorTicker(ticker) ?? ACOES[0];
    const ultima = i === tickers.length - 1;
    return {
      tipo: "acao" as const,
      nome: info.nome,
      ticker,
      percentual: ultima ? round2(100 - percentualCada * (tickers.length - 1)) : percentualCada,
      valor: ultima ? round2(valor - valorCada * (tickers.length - 1)) : valorCada,
      quandoVender,
    };
  });
}

function round2(v: number): number {
  return Math.round(v * 100) / 100;
}
