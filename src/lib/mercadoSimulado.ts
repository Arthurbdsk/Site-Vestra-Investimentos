/**
 * Mercado ficticio do Laboratorio.
 *
 * Empresas inventadas de proposito: se o laboratorio usasse PETR4 com
 * precos inventados, alguem poderia achar que a Petrobras caiu de verdade.
 *
 * Tudo aqui e DETERMINISTICO a partir da semente. Isso significa que o
 * servidor consegue recalcular o preco de qualquer dia sem guardar nada,
 * e que o navegador nunca decide quanto custa uma acao.
 */

export type AtivoSim = {
  ticker: string;
  nome: string;
  setor: Setor;
  explica: string;
  precoBase: number;
  /** Quanto balanca no dia a dia. Maior = mais sobe e desce. */
  volatilidade: number;
  /**
   * Retorno medio esperado por ano no longo prazo (0.10 = 10% ao ano).
   *
   * Guardamos o ALVO, e nao a tendencia diaria crua, porque duas forcas
   * comem o retorno e precisam ser descontadas: a volatilidade (quem cai
   * 50% precisa subir 100% pra voltar) e o saldo negativo dos eventos de
   * crise. Sem esse desconto o mercado inteiro afundava no longo prazo,
   * ensinando o oposto do que o simulador deveria ensinar.
   *
   * Isso e a MEDIA de longo prazo. Cada caminho sorteado varia muito, e
   * perder dinheiro continua perfeitamente possivel.
   */
  retornoAnual: number;
};

export type Setor =
  | "petroleo"
  | "bancos"
  | "varejo"
  | "mineracao"
  | "energia"
  | "tecnologia"
  | "agro"
  | "saude";

export const NOMES_SETOR: Record<Setor, string> = {
  petroleo: "Petróleo",
  bancos: "Bancos",
  varejo: "Varejo",
  mineracao: "Mineração",
  energia: "Energia",
  tecnologia: "Tecnologia",
  agro: "Agronegócio",
  saude: "Saúde",
};

export const ATIVOS_SIM: AtivoSim[] = [
  {
    ticker: "PTLN3",
    nome: "Petrolina",
    setor: "petroleo",
    explica:
      "Tira petróleo e vende combustível. Sobe e desce junto com o preço do barril no mundo.",
    precoBase: 32.4,
    volatilidade: 0.022,
    retornoAnual: 0.11,
  },
  {
    ticker: "BAUR4",
    nome: "Banco Aurora",
    setor: "bancos",
    explica:
      "Banco grande. Ganha com juros de empréstimo. Juro alto costuma ajudar o lucro dele.",
    precoBase: 26.8,
    volatilidade: 0.013,
    retornoAnual: 0.1,
  },
  {
    ticker: "BNCA3",
    nome: "Rede Bonança",
    setor: "varejo",
    explica:
      "Rede de lojas. Bem sensível a juros: com juro alto, gente compra menos parcelado.",
    precoBase: 11.9,
    volatilidade: 0.026,
    retornoAnual: 0.09,
  },
  {
    ticker: "SERR3",
    nome: "Mineradora Serra",
    setor: "mineracao",
    explica:
      "Vende minério pro exterior. Depende de quanto os outros países estão comprando.",
    precoBase: 48.2,
    volatilidade: 0.021,
    retornoAnual: 0.1,
  },
  {
    ticker: "ENRG3",
    nome: "Energis",
    setor: "energia",
    explica:
      "Distribui energia elétrica. Setor previsível, porque conta de luz todo mundo paga.",
    precoBase: 19.5,
    volatilidade: 0.011,
    retornoAnual: 0.09,
  },
  {
    ticker: "TCNV3",
    nome: "Tecnova",
    setor: "tecnologia",
    explica:
      "Empresa de tecnologia. Cresce rápido quando vai bem, mas cai forte quando o mercado desconfia.",
    precoBase: 15.3,
    volatilidade: 0.027,
    retornoAnual: 0.14,
  },
  {
    ticker: "AGVL3",
    nome: "AgroVale",
    setor: "agro",
    explica:
      "Planta e exporta grãos. Safra boa e dólar alto costumam ajudar o resultado.",
    precoBase: 22.7,
    volatilidade: 0.019,
    retornoAnual: 0.1,
  },
  {
    ticker: "VDMS3",
    nome: "VidaMais",
    setor: "saude",
    explica:
      "Hospitais e planos de saúde. As pessoas não deixam de usar nem em crise, o que dá estabilidade.",
    precoBase: 28.1,
    volatilidade: 0.014,
    retornoAnual: 0.095,
  },
];

export function ativoSimPorTicker(ticker: string): AtivoSim | undefined {
  return ATIVOS_SIM.find((a) => a.ticker === ticker);
}

/* ------------------------------------------------------------------ */
/* Sorteio deterministico                                              */
/* ------------------------------------------------------------------ */

function embaralhar(texto: string): number {
  let h = 2166136261;
  for (let i = 0; i < texto.length; i++) {
    h ^= texto.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Gerador de numeros pseudoaleatorios com semente (mulberry32). */
function sorteador(semente: number) {
  let a = semente >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Converte dois sorteios uniformes num sorteio em forma de sino. */
function sino(rng: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/* ------------------------------------------------------------------ */
/* Eventos do mundo                                                    */
/* ------------------------------------------------------------------ */

export type Evento = {
  dia: number;
  titulo: string;
  texto: string;
  /** Setor atingido, ou "geral" quando mexe no mercado inteiro. */
  alvo: Setor | "geral";
  /** Impacto no preco naquele dia. 0.05 = +5%. */
  impacto: number;
};

type Molde = {
  titulo: string;
  texto: string;
  alvo: Setor | "geral";
  /** Faixa de impacto [minimo, maximo]. */
  faixa: [number, number];
};

const MOLDES: Molde[] = [
  {
    titulo: "Barril de petróleo dispara no exterior",
    texto:
      "Uma tensão geopolítica reduziu a oferta mundial. Quem produz petróleo tende a lucrar mais com o barril caro.",
    alvo: "petroleo",
    faixa: [0.04, 0.09],
  },
  {
    titulo: "Petróleo despenca com excesso de oferta",
    texto:
      "Produtores aumentaram a extração e sobrou barril no mercado. Com o preço lá embaixo, a margem das petroleiras encolhe.",
    alvo: "petroleo",
    faixa: [-0.08, -0.035],
  },
  {
    titulo: "Banco central sobe os juros",
    texto:
      "Juro mais alto costuma engordar o lucro dos bancos, que emprestam mais caro. O lado ruim aparece no varejo.",
    alvo: "bancos",
    faixa: [0.025, 0.05],
  },
  {
    titulo: "Juros em alta seguram o consumo",
    texto:
      "Com crédito mais caro, as pessoas parcelam menos e as lojas vendem menos. O varejo sente primeiro.",
    alvo: "varejo",
    faixa: [-0.07, -0.03],
  },
  {
    titulo: "Banco central corta os juros",
    texto:
      "Crédito mais barato costuma animar o consumo. Varejo e empresas endividadas tendem a respirar melhor.",
    alvo: "varejo",
    faixa: [0.035, 0.075],
  },
  {
    titulo: "China aumenta compras de minério",
    texto:
      "A demanda externa cresceu e o minério subiu. Mineradoras exportadoras costumam ir junto.",
    alvo: "mineracao",
    faixa: [0.035, 0.08],
  },
  {
    titulo: "Demanda por minério esfria",
    texto:
      "A indústria lá fora desacelerou e comprou menos. Quem depende de exportação sente o baque.",
    alvo: "mineracao",
    faixa: [-0.075, -0.03],
  },
  {
    titulo: "Seca preocupa o setor elétrico",
    texto:
      "Com menos água nos reservatórios, gerar energia fica mais caro. Isso pressiona as distribuidoras.",
    alvo: "energia",
    faixa: [-0.05, -0.02],
  },
  {
    titulo: "Chuvas enchem os reservatórios",
    texto:
      "Com água sobrando, gerar energia fica mais barato. Isso alivia o custo das distribuidoras.",
    alvo: "energia",
    faixa: [0.02, 0.05],
  },
  {
    titulo: "Nova tecnologia anima investidores",
    texto:
      "Uma inovação promissora aumentou a expectativa de lucro futuro. Empresas de tecnologia costumam disparar nesses momentos.",
    alvo: "tecnologia",
    faixa: [0.06, 0.13],
  },
  {
    titulo: "Setor de tecnologia é visto como caro demais",
    texto:
      "Investidores acharam que os preços subiram além do que o lucro justifica e começaram a vender.",
    alvo: "tecnologia",
    faixa: [-0.12, -0.05],
  },
  {
    titulo: "Safra recorde no campo",
    texto:
      "A colheita veio maior que o esperado. Mais volume para exportar costuma se traduzir em mais receita.",
    alvo: "agro",
    faixa: [0.035, 0.07],
  },
  {
    titulo: "Clima ruim ameaça a colheita",
    texto:
      "Estiagem prolongada deve reduzir a produção. Menos safra costuma significar menos receita.",
    alvo: "agro",
    faixa: [-0.07, -0.03],
  },
  {
    titulo: "Novo marco regulatório na saúde",
    texto:
      "Mudança nas regras dos planos trouxe previsibilidade ao setor. Investidores costumam gostar de regra clara.",
    alvo: "saude",
    faixa: [0.025, 0.055],
  },
  {
    titulo: "Otimismo global impulsiona as bolsas",
    texto:
      "Dados econômicos vieram melhores que o esperado no mundo todo e o dinheiro voltou para a renda variável.",
    alvo: "geral",
    faixa: [0.02, 0.045],
  },
  {
    titulo: "Medo de recessão derruba as bolsas",
    texto:
      "O receio de uma economia mais fraca fez muita gente vender ao mesmo tempo. Em pânico, quase tudo cai junto.",
    alvo: "geral",
    faixa: [-0.06, -0.025],
  },
  {
    titulo: "Inflação vem acima do esperado",
    texto:
      "Preços subindo mais que o previsto aumentam a chance de juro alto por mais tempo, o que costuma pesar nas ações.",
    alvo: "geral",
    faixa: [-0.045, -0.018],
  },
];

/** Teto do laboratorio: 10 anos simulados. */
export const DIA_MAXIMO = 3650;

/** Chance de acontecer um evento em cada dia simulado. */
const PROB_EVENTO = 0.11;

/**
 * Quanto os eventos empurram o preco de um setor, em media, por dia.
 *
 * Os eventos de crise sao mais fortes que os de euforia (assim como na
 * vida real), entao o saldo tende a ser negativo. Medimos esse saldo aqui
 * pra descontar depois, senao o mercado afunda no longo prazo sozinho.
 */
function deriveEventos(setor: Setor): number {
  // Usamos o logaritmo do impacto, e nao o impacto cru, porque perdas e
  // ganhos se acumulam multiplicando. Cair 10% e subir 10% nao volta ao
  // ponto de partida, e ignorar isso subestimava o estrago das crises.
  const emLog = (v: number) => Math.log(1 + v);

  let soma = 0;
  for (const m of MOLDES) {
    const medioLog = (emLog(m.faixa[0]) + emLog(m.faixa[1])) / 2;
    if (m.alvo === "geral") soma += medioLog * 0.75;
    else if (m.alvo === setor) soma += medioLog;
  }
  return PROB_EVENTO * (soma / MOLDES.length);
}

const cacheEventos = new Map<number, Evento[]>();

/** Todos os eventos da semente, do dia 1 ate o teto. Calculado uma vez so. */
function todosEventos(semente: number): Evento[] {
  const guardado = cacheEventos.get(semente);
  if (guardado) return guardado;

  const eventos: Evento[] = [];
  for (let dia = 1; dia <= DIA_MAXIMO; dia++) {
    const rng = sorteador(embaralhar(`evt|${semente}|${dia}`));
    // Cerca de um evento a cada 9 dias simulados.
    if (rng() > PROB_EVENTO) continue;

    const molde = MOLDES[Math.floor(rng() * MOLDES.length)];
    const [min, max] = molde.faixa;
    eventos.push({
      dia,
      titulo: molde.titulo,
      texto: molde.texto,
      alvo: molde.alvo,
      impacto: min + rng() * (max - min),
    });
  }

  cacheEventos.set(semente, eventos);
  return eventos;
}

/** Eventos ja acontecidos ate o dia atual. */
export function eventosAte(semente: number, ateDia: number): Evento[] {
  return todosEventos(semente).filter((e) => e.dia <= ateDia);
}

/* ------------------------------------------------------------------ */
/* Precos                                                              */
/* ------------------------------------------------------------------ */

const cacheSerie = new Map<string, number[]>();

/**
 * Serie completa de precos, do dia 0 ate o teto. Calculada uma vez por
 * (semente, papel) e reaproveitada: guardar uma serie nova a cada dia que
 * passa faria a memoria crescer sem parar.
 */
function serieCompleta(semente: number, ticker: string): number[] {
  const ativo = ativoSimPorTicker(ticker);
  if (!ativo) return [];

  const chave = `${semente}|${ticker}`;
  const guardado = cacheSerie.get(chave);
  if (guardado) return guardado;

  const eventos = todosEventos(semente);
  const porDia = new Map<number, number>();
  for (const e of eventos) {
    if (e.alvo === "geral" || e.alvo === ativo.setor) {
      // Evento geral bate mais leve em cada papel do que um evento do setor.
      const peso = e.alvo === "geral" ? 0.75 : 1;
      porDia.set(e.dia, (porDia.get(e.dia) ?? 0) + e.impacto * peso);
    }
  }

  // Do retorno-alvo anual pra tendencia diaria, descontando as duas
  // forcas que comem retorno: a volatilidade e o saldo dos eventos.
  const alvoDiario = Math.log(1 + ativo.retornoAnual) / 365;
  const perdaPorVolatilidade = (ativo.volatilidade * ativo.volatilidade) / 2;
  const tendencia =
    alvoDiario + perdaPorVolatilidade - deriveEventos(ativo.setor);

  const rng = sorteador(embaralhar(`px|${semente}|${ticker}`));
  const serie: number[] = [ativo.precoBase];

  for (let dia = 1; dia <= DIA_MAXIMO; dia++) {
    const ruido = sino(rng) * ativo.volatilidade;
    const choque = porDia.get(dia) ?? 0;
    const anterior = serie[dia - 1];
    // Piso simbolico: no laboratorio nenhuma empresa vai a zero.
    const novo = Math.max(0.5, anterior * (1 + tendencia + ruido + choque));
    serie.push(Number(novo.toFixed(2)));
  }

  cacheSerie.set(chave, serie);
  return serie;
}

/** Serie do dia 0 ate o dia pedido. */
export function serieDe(semente: number, ticker: string, ateDia: number): number[] {
  const limite = Math.min(Math.max(0, ateDia), DIA_MAXIMO);
  return serieCompleta(semente, ticker).slice(0, limite + 1);
}

/** Preco de um papel num dia especifico. */
export function precoSimulado(semente: number, ticker: string, dia: number): number {
  const limite = Math.min(Math.max(0, dia), DIA_MAXIMO);
  return serieCompleta(semente, ticker)[limite] ?? 0;
}

/** Variacao percentual em relacao ao dia anterior. */
export function variacaoSimulada(
  semente: number,
  ticker: string,
  dia: number,
): number {
  if (dia <= 0) return 0;
  const serie = serieCompleta(semente, ticker);
  const limite = Math.min(dia, DIA_MAXIMO);
  const hoje = serie[limite];
  const ontem = serie[limite - 1];
  if (!hoje || !ontem) return 0;
  return ((hoje - ontem) / ontem) * 100;
}

/* ------------------------------------------------------------------ */
/* Calendario                                                          */
/* ------------------------------------------------------------------ */

/** Dia 0 do laboratorio. Data ficticia, so pra dar noção de tempo passando. */
export const DATA_INICIAL = new Date("2020-01-02T00:00:00Z");

export function dataDoDia(dia: number): Date {
  const d = new Date(DATA_INICIAL);
  d.setUTCDate(d.getUTCDate() + dia);
  return d;
}

export function rotuloDoDia(dia: number): string {
  return dataDoDia(dia).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}
