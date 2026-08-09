export type IconeConquista =
  | "compra"
  | "venda"
  | "diversificado"
  | "renda-fixa"
  | "dividendo"
  | "semana"
  | "mes"
  | "patrimonio";

export type Conquista = {
  id: string;
  nome: string;
  descricao: string;
  concluida: boolean;
  icone: IconeConquista;
};

export type DadosConquistas = {
  temCompra: boolean;
  temVenda: boolean;
  temDividendo: boolean;
  tickersDistintos: number;
  temRendaFixa: boolean;
  diasSeguidos: number;
  patrimonio: number;
};

/**
 * Conquistas calculadas na hora, a partir do que a pessoa ja tem (sem
 * tabela nova no banco): cada uma e so uma condicao sobre dados que ja
 * carregamos pro simulador.
 */
export function calcularConquistas(d: DadosConquistas): Conquista[] {
  return [
    {
      id: "primeira-compra",
      nome: "Primeira compra",
      descricao: "Comprou a primeira ação no simulador.",
      concluida: d.temCompra,
      icone: "compra",
    },
    {
      id: "primeira-venda",
      nome: "Primeira venda",
      descricao: "Vendeu uma ação pela primeira vez.",
      concluida: d.temVenda,
      icone: "venda",
    },
    {
      id: "diversificado",
      nome: "Diversificado",
      descricao: "Tem 5 ou mais empresas diferentes na carteira.",
      concluida: d.tickersDistintos >= 5,
      icone: "diversificado",
    },
    {
      id: "renda-fixa",
      nome: "Pé no chão",
      descricao: "Investiu em CDB ou Tesouro Direto.",
      concluida: d.temRendaFixa,
      icone: "renda-fixa",
    },
    {
      id: "primeiro-dividendo",
      nome: "Sócio de verdade",
      descricao: "Recebeu o primeiro dividendo de uma ação.",
      concluida: d.temDividendo,
      icone: "dividendo",
    },
    {
      id: "semana-seguida",
      nome: "Uma semana seguida",
      descricao: "Voltou ao simulador por 7 dias seguidos.",
      concluida: d.diasSeguidos >= 7,
      icone: "semana",
    },
    {
      id: "mes-seguido",
      nome: "Hábito formado",
      descricao: "Voltou ao simulador por 30 dias seguidos.",
      concluida: d.diasSeguidos >= 30,
      icone: "mes",
    },
    {
      id: "patrimonio-dobrado",
      nome: "Dobrou de tamanho",
      descricao: "Chegou a R$ 200.000 de patrimônio (o dobro do inicial).",
      concluida: d.patrimonio >= 200_000,
      icone: "patrimonio",
    },
  ];
}
