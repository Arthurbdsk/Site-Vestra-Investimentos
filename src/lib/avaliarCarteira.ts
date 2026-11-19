/**
 * Avaliador educativo de carteira (/educacao, etapa "Monte e avalie").
 *
 * A pessoa diz quanto colocaria em cada classe de investimento, qual o
 * perfil dela e o prazo do dinheiro. A funcao compara com os limites do
 * perfil e devolve uma nota, um veredito e uma lista de correcoes, cada
 * uma com o que fazer e o porque. Tudo puro e deterministico, pra poder
 * ser testado e rodar no navegador sem chamar servidor.
 *
 * Nao e recomendacao de investimento: os limites sao uma regra de bolso
 * didatica, parecida com as carteiras modelo que corretoras publicam.
 */
import type { PerfilId } from "./perfilInvestidor";
import { brl } from "./formato";

export type ClasseId =
  | "posFixado"
  | "poupanca"
  | "bancarios"
  | "tesouroLongo"
  | "creditoPrivado"
  | "fiis"
  | "acoes"
  | "exterior"
  | "cripto";

export type Classe = {
  id: ClasseId;
  nome: string;
  exemplos: string;
  grupo: "rf" | "rv";
  /** Peso de risco de 1 a 5, usado no termometro da carteira. */
  risco: number;
};

export const CLASSES: Classe[] = [
  { id: "posFixado", nome: "Pós-fixado com liquidez diária", exemplos: "Tesouro Selic, CDB 100% do CDI com resgate diário", grupo: "rf", risco: 1 },
  { id: "poupanca", nome: "Poupança", exemplos: "Caderneta de poupança", grupo: "rf", risco: 1 },
  { id: "bancarios", nome: "CDB com prazo, LCI e LCA", exemplos: "CDB com vencimento, LCI, LCA", grupo: "rf", risco: 1.5 },
  { id: "tesouroLongo", nome: "Tesouro Prefixado e IPCA+", exemplos: "Tesouro IPCA+ 2035, Tesouro Prefixado 2029", grupo: "rf", risco: 2.5 },
  { id: "creditoPrivado", nome: "Debêntures, CRI e CRA", exemplos: "Títulos de empresas e securitizadoras", grupo: "rf", risco: 3 },
  { id: "fiis", nome: "Fundos imobiliários", exemplos: "FIIs de tijolo ou de papel", grupo: "rv", risco: 3.5 },
  { id: "acoes", nome: "Ações do Brasil", exemplos: "Ações da B3, BOVA11", grupo: "rv", risco: 4.5 },
  { id: "exterior", nome: "Exterior", exemplos: "IVVB11, BDRs, ações americanas", grupo: "rv", risco: 4.5 },
  { id: "cripto", nome: "Criptomoedas", exemplos: "Bitcoin, Ethereum, ETFs de cripto", grupo: "rv", risco: 5 },
];

export const CLASSE_POR_ID = Object.fromEntries(CLASSES.map((c) => [c.id, c])) as Record<ClasseId, Classe>;

export type Alocacao = Record<ClasseId, number>;

export function alocacaoVazia(): Alocacao {
  return Object.fromEntries(CLASSES.map((c) => [c.id, 0])) as Alocacao;
}

/** Carteiras modelo em % (somam 100). Ponto de partida, nao regra. */
export const MODELOS: Record<PerfilId, Alocacao> = {
  conservador: { posFixado: 35, poupanca: 0, bancarios: 25, tesouroLongo: 20, creditoPrivado: 5, fiis: 5, acoes: 5, exterior: 5, cripto: 0 },
  moderado: { posFixado: 20, poupanca: 0, bancarios: 15, tesouroLongo: 15, creditoPrivado: 10, fiis: 10, acoes: 20, exterior: 10, cripto: 0 },
  arrojado: { posFixado: 10, poupanca: 0, bancarios: 5, tesouroLongo: 10, creditoPrivado: 5, fiis: 10, acoes: 35, exterior: 20, cripto: 5 },
};

type Limites = {
  rvMin: number;
  rvMax: number;
  maxPorClasse: Partial<Record<ClasseId, number>>;
  /** Faixa do termometro de risco (1 a 5) que combina com o perfil. */
  faixaRisco: [number, number];
};

export const LIMITES: Record<PerfilId, Limites> = {
  conservador: {
    rvMin: 0,
    rvMax: 20,
    maxPorClasse: { acoes: 10, fiis: 10, exterior: 10, cripto: 0, creditoPrivado: 10, tesouroLongo: 40 },
    faixaRisco: [1, 2],
  },
  moderado: {
    rvMin: 20,
    rvMax: 50,
    maxPorClasse: { acoes: 35, fiis: 15, exterior: 20, cripto: 3, creditoPrivado: 15 },
    faixaRisco: [1.8, 3],
  },
  arrojado: {
    rvMin: 45,
    rvMax: 80,
    maxPorClasse: { acoes: 55, fiis: 20, exterior: 35, cripto: 10, creditoPrivado: 20 },
    faixaRisco: [2.6, 4.2],
  },
};

export type Prazo = "curto" | "medio" | "longo";

export const PRAZOS: { id: Prazo; nome: string; detalhe: string }[] = [
  { id: "curto", nome: "Menos de 2 anos", detalhe: "Viagem, carro, um gasto que já tem data" },
  { id: "medio", nome: "De 2 a 5 anos", detalhe: "Entrada de imóvel, intercâmbio, faculdade" },
  { id: "longo", nome: "Mais de 5 anos", detalhe: "Aposentadoria, independência financeira" },
];

export type EntradaAvaliacao = {
  perfil: PerfilId;
  /** Valores em reais por classe. */
  valores: Alocacao;
  prazo: Prazo;
  /** A pessoa ja tem reserva de emergencia separada, fora dessa carteira? */
  temReserva: boolean;
  /** Gasto mensal, opcional. Com ele da pra calcular o tamanho da reserva. */
  gastoMensal?: number | null;
};

export type Severidade = "alta" | "media" | "baixa";

export type Correcao = {
  id: string;
  severidade: Severidade;
  titulo: string;
  /** O que fazer, com numero quando possivel. */
  acao: string;
  /** Por que essa correcao importa. */
  porque: string;
  classe?: ClasseId;
};

export type Veredito = "compativel" | "ajustes" | "incompativel";

export type ResultadoAvaliacao = {
  total: number;
  percentuais: Alocacao;
  rendaVariavel: number;
  risco: number;
  faixaRisco: [number, number];
  nota: number;
  veredito: Veredito;
  correcoes: Correcao[];
  pontosFortes: string[];
  /** Carteira modelo do perfil em reais, no mesmo total. */
  sugerida: Alocacao;
};

const PESO: Record<Severidade, number> = { alta: 25, media: 12, baixa: 5 };
const ORDEM: Record<Severidade, number> = { alta: 0, media: 1, baixa: 2 };

function arred(n: number, casas = 1): number {
  const f = 10 ** casas;
  return Math.round(n * f) / f;
}

function fmtPct(n: number): string {
  return `${arred(n, 0).toLocaleString("pt-BR")}%`;
}

export function somaRendaVariavel(p: Alocacao): number {
  return CLASSES.filter((c) => c.grupo === "rv").reduce((s, c) => s + p[c.id], 0);
}

export function avaliarCarteira(entrada: EntradaAvaliacao): ResultadoAvaliacao | null {
  const valores = alocacaoVazia();
  for (const c of CLASSES) {
    const v = Number(entrada.valores[c.id]);
    valores[c.id] = Number.isFinite(v) && v > 0 ? v : 0;
  }
  const total = CLASSES.reduce((s, c) => s + valores[c.id], 0);
  if (total <= 0) return null;

  const { perfil, prazo, temReserva } = entrada;
  const lim = LIMITES[perfil];
  const modelo = MODELOS[perfil];

  const pct = alocacaoVazia();
  for (const c of CLASSES) pct[c.id] = (valores[c.id] / total) * 100;

  const rv = somaRendaVariavel(pct);
  const risco = CLASSES.reduce((s, c) => s + (pct[c.id] / 100) * c.risco, 0);
  const reais = (p: number) => brl((p / 100) * total);

  const correcoes: Correcao[] = [];
  const fortes: string[] = [];

  // 1. Reserva de emergencia
  const liquido = valores.posFixado + valores.poupanca;
  const gasto = entrada.gastoMensal && entrada.gastoMensal > 0 ? entrada.gastoMensal : null;
  if (!temReserva) {
    const reservaIdeal = gasto ? gasto * 6 : null;
    if (reservaIdeal !== null && liquido >= reservaIdeal) {
      fortes.push(
        `Sua parte com liquidez diária (${brl(liquido)}) já cobre 6 meses de gastos. Pense nela como a sua reserva e não use esse dinheiro pra outra coisa.`,
      );
    } else {
      correcoes.push({
        id: "reserva",
        severidade: "alta",
        titulo: "Falta a reserva de emergência",
        acao:
          reservaIdeal !== null
            ? `Antes de qualquer outra coisa, deixe pelo menos ${brl(reservaIdeal)} (6 meses dos seus gastos) em Tesouro Selic ou CDB com liquidez diária. Faltam ${brl(reservaIdeal - liquido)}.`
            : "Antes de qualquer outra coisa, separe de 6 a 12 meses dos seus gastos em Tesouro Selic ou CDB com liquidez diária.",
        porque:
          "Sem reserva, qualquer imprevisto (uma demissão, um conserto, uma conta de hospital) obriga você a vender investimentos às pressas, muitas vezes no prejuízo ou pagando imposto alto por resgatar cedo. A reserva é o que deixa o resto da carteira trabalhar em paz.",
        classe: "posFixado",
      });
    }
  } else {
    fortes.push("Você já tem reserva de emergência separada. Esse é o primeiro passo e muita gente pula.");
  }

  // 2. Prazo curto nao combina com oscilacao
  const prazoCurtoComRv = prazo === "curto" && rv > 10;
  if (prazoCurtoComRv) {
    correcoes.push({
      id: "prazo-rv",
      severidade: "alta",
      titulo: "Renda variável demais para um dinheiro de curto prazo",
      acao: `Você vai precisar desse dinheiro em menos de 2 anos. Reduza a renda variável de ${fmtPct(rv)} para no máximo 10% (tirar cerca de ${reais(rv - 10)}) e leve para Tesouro Selic, CDB ou LCI/LCA com vencimento antes da data do seu objetivo.`,
      porque:
        "Ações e fundos imobiliários podem passar anos abaixo do preço de compra. Se a bolsa cair bem perto da data em que você precisa do dinheiro, não dá tempo de esperar a recuperação e a perda vira real.",
    });
  }
  if (prazo === "curto") {
    const oscilantes = pct.tesouroLongo + pct.creditoPrivado;
    if (oscilantes > 20) {
      correcoes.push({
        id: "prazo-marcacao",
        severidade: "media",
        titulo: "Títulos longos num objetivo curto",
        acao: `Tesouro Prefixado, IPCA+ e títulos de empresa somam ${fmtPct(oscilantes)}. Prefira títulos que vençam antes da data do objetivo, ou troque por pós-fixados.`,
        porque:
          "Esses títulos oscilam de preço até o vencimento (marcação a mercado). Se você precisar vender antes, pode receber menos do que aplicou, mesmo sendo renda fixa.",
        classe: "tesouroLongo",
      });
    }
  }

  // 3. Renda variavel x perfil. Se o prazo curto ja cobrou um limite
  // mais apertado (10%), nao repete a mesma correcao com outro numero.
  if (rv > lim.rvMax) {
    if (!prazoCurtoComRv) {
      correcoes.push({
        id: "rv-acima",
        severidade: "alta",
        titulo: `Mais risco do que o perfil ${perfil} aguenta`,
        acao: `Sua renda variável está em ${fmtPct(rv)}, e o limite para o perfil ${perfil} é ${fmtPct(lim.rvMax)}. Leve cerca de ${reais(rv - lim.rvMax)} da renda variável para a renda fixa.`,
        porque:
          "O perfil mede quanta queda você aguenta sem entrar em pânico. Uma carteira mais arriscada do que o seu perfil tende a fazer você vender no fundo do poço, que é justamente o pior momento. Uma carteira que você consegue manter rende mais do que uma ótima que você abandona.",
      });
    }
  } else if (rv < lim.rvMin && prazo !== "curto") {
    correcoes.push({
      id: "rv-abaixo",
      severidade: prazo === "longo" ? "media" : "baixa",
      titulo: `Mais conservadora do que o seu perfil ${perfil}`,
      acao: `Sua renda variável está em ${fmtPct(rv)}. Para o perfil ${perfil}, algo a partir de ${fmtPct(lim.rvMin)} faz sentido: cerca de ${reais(lim.rvMin - rv)} a mais em ações, fundos imobiliários ou exterior, aos poucos.`,
      porque:
        "Em prazos longos, a renda variável costuma render mais que a renda fixa e ajuda a vencer a inflação. Ficar muito abaixo do que seu perfil aceita é deixar retorno na mesa sem necessidade.",
    });
  } else if (!prazoCurtoComRv) {
    fortes.push(
      `A divisão entre renda fixa (${fmtPct(100 - rv)}) e renda variável (${fmtPct(rv)}) combina com o perfil ${perfil}.`,
    );
  }

  // 4. Limite por classe
  for (const c of CLASSES) {
    const max = lim.maxPorClasse[c.id];
    if (max === undefined) continue;
    const excesso = pct[c.id] - max;
    if (excesso < 1 && !(max === 0 && pct[c.id] > 0)) continue;
    const ehCripto = c.id === "cripto";
    correcoes.push({
      id: `max-${c.id}`,
      severidade: ehCripto && max === 0 ? "alta" : ehCripto || excesso > 10 ? "media" : "baixa",
      titulo:
        max === 0 ? `${c.nome} não combina com o perfil ${perfil}` : `Peso alto em ${c.nome.toLowerCase()}`,
      acao:
        max === 0
          ? `Tire os ${reais(pct[c.id])} de ${c.nome.toLowerCase()} e leve para renda fixa.`
          : `${c.nome} está em ${fmtPct(pct[c.id])}. Reduza para até ${fmtPct(max)} (cerca de ${reais(excesso)} a menos) e espalhe pelas outras classes.`,
      porque: porqueClasse(c.id),
      classe: c.id,
    });
  }

  // 5. Poupanca
  if (pct.poupanca > 0) {
    correcoes.push({
      id: "poupanca",
      severidade: pct.poupanca >= 10 ? "media" : "baixa",
      titulo: "Dinheiro parado na poupança",
      acao: `Troque os ${brl(valores.poupanca)} da poupança por Tesouro Selic ou um CDB de liquidez diária que pague pelo menos 100% do CDI. A segurança é parecida e o dinheiro continua disponível.`,
      porque:
        "Com a Selic alta, a poupança rende cerca de 6,2% ao ano mais TR, enquanto o Tesouro Selic e um CDB a 100% do CDI acompanham a Selic. Mesmo pagando imposto, eles rendem bem mais.",
      classe: "poupanca",
    });
  }

  // 6. Diversificacao
  const classesRelevantes = CLASSES.filter((c) => pct[c.id] >= 5).length;
  if (classesRelevantes < 3 && prazo !== "curto") {
    correcoes.push({
      id: "diversificacao",
      severidade: "media",
      titulo: "Carteira pouco diversificada",
      acao: `Hoje quase tudo está em ${classesRelevantes === 1 ? "uma única classe" : "duas classes"}. Espalhe o dinheiro por pelo menos 3 ou 4 classes, usando a carteira sugerida como guia.`,
      porque:
        "Cada tipo de investimento vai bem num momento diferente: quando os juros sobem a renda fixa brilha, quando a economia cresce a bolsa sobe. Misturar classes reduz o tamanho das quedas sem derrubar o retorno.",
    });
  } else if (classesRelevantes >= 4) {
    fortes.push(`Boa diversificação: o dinheiro está espalhado por ${classesRelevantes} classes diferentes.`);
  }

  // 7. Inflacao no longo prazo
  if (prazo === "longo" && pct.tesouroLongo < 5 && rv < 30) {
    correcoes.push({
      id: "inflacao",
      severidade: "baixa",
      titulo: "Pouca proteção contra a inflação",
      acao: `Coloque uma parte (perto de ${fmtPct(modelo.tesouroLongo)} da carteira, cerca de ${reais(modelo.tesouroLongo)}) em Tesouro IPCA+ com vencimento perto do seu objetivo.`,
      porque:
        "Em 10 ou 20 anos, a inflação come uma parte grande do poder de compra. O IPCA+ garante um ganho acima da inflação se você levar até o vencimento, coisa que o pós-fixado não garante.",
      classe: "tesouroLongo",
    });
  }

  // 8. Exterior
  if (perfil !== "conservador" && prazo !== "curto" && pct.exterior === 0 && rv >= 15) {
    correcoes.push({
      id: "exterior",
      severidade: "baixa",
      titulo: "Toda a renda variável está no Brasil",
      acao: `Considere levar uma parte (perto de ${fmtPct(modelo.exterior)}, cerca de ${reais(modelo.exterior)}) para o exterior, por exemplo com um ETF como o IVVB11.`,
      porque:
        "A bolsa brasileira é uma fatia pequena do mercado mundial e depende muito de bancos, petróleo e minério. Ter um pouco fora dilui o risco Brasil e protege quando o dólar sobe.",
      classe: "exterior",
    });
  }

  // 9. FGC
  if (valores.bancarios > 250_000) {
    correcoes.push({
      id: "fgc",
      severidade: "baixa",
      titulo: "Atenção ao limite do FGC",
      acao: `Você tem ${brl(valores.bancarios)} em CDB, LCI e LCA. Divida entre bancos diferentes para que nenhum passe de R$ 250 mil.`,
      porque:
        "O FGC devolve até R$ 250 mil por CPF em cada instituição se o banco quebrar. O que passar disso fica sem garantia.",
      classe: "bancarios",
    });
  }

  // Termometro
  const [rMin, rMax] = lim.faixaRisco;
  if (risco >= rMin && risco <= rMax) {
    fortes.push("O risco médio da carteira está na faixa que combina com o seu perfil.");
  }

  correcoes.sort((a, b) => ORDEM[a.severidade] - ORDEM[b.severidade]);

  const nota = Math.max(0, 100 - correcoes.reduce((s, c) => s + PESO[c.severidade], 0));
  const veredito: Veredito = correcoes.some((c) => c.severidade === "alta")
    ? "incompativel"
    : correcoes.some((c) => c.severidade === "media")
      ? "ajustes"
      : "compativel";

  const sugerida = alocacaoVazia();
  for (const c of CLASSES) sugerida[c.id] = Math.round((modelo[c.id] / 100) * total);

  return {
    total,
    percentuais: pct,
    rendaVariavel: rv,
    risco: arred(risco, 2),
    faixaRisco: lim.faixaRisco,
    nota,
    veredito,
    correcoes,
    pontosFortes: fortes,
    sugerida,
  };
}

function porqueClasse(id: ClasseId): string {
  switch (id) {
    case "acoes":
      return "Ações são a classe que mais oscila. Muito peso nela faz a carteira inteira subir e descer junto com a bolsa, e uma queda de 30% vira um rombo grande no seu patrimônio.";
    case "fiis":
      return "Fundos imobiliários pagam renda todo mês, mas a cota oscila e o setor sofre junto quando os juros sobem. Concentrar demais deixa a carteira dependente de um único setor.";
    case "exterior":
      return "Investir lá fora é ótimo para diversificar, mas também traz a oscilação do dólar. Em excesso, a carteira passa a depender do câmbio.";
    case "cripto":
      return "Criptomoedas já caíram mais de 50% várias vezes e não têm nenhuma garantia. O ideal é uma fatia pequena o bastante para que, se zerar, não mude sua vida.";
    case "creditoPrivado":
      return "Títulos de empresas pagam mais porque não têm FGC: se a empresa quebrar, você pode perder. Também são difíceis de vender antes do vencimento.";
    case "tesouroLongo":
      return "Títulos prefixados e IPCA+ longos oscilam bastante antes do vencimento. Para o perfil conservador, é melhor que eles não dominem a carteira.";
    default:
      return "Concentrar demais numa só classe aumenta o risco da carteira.";
  }
}
