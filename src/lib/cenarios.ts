import type { PontoSerie } from "./historico";

/**
 * Diferente de buscarHistorico() (janela relativa a hoje, "ultimos 3
 * meses"), isso busca uma janela de datas FIXA no passado, pro replay de
 * cenario historico funcionar sempre igual, nao mudar com o dia de hoje.
 * So Yahoo Finance: cobre B3 (sufixo .SA) e EUA com o mesmo formato, e
 * period1/period2 (unix timestamp) aceitam qualquer janela absoluta, o
 * que o range relativo da brapi nao permite.
 */
export async function buscarHistoricoAbsoluto(
  ticker: string,
  dataInicio: string,
  dataFim: string,
): Promise<{ ok: true; serie: PontoSerie[] } | { ok: false; mensagem: string }> {
  const period1 = Math.floor(new Date(dataInicio).getTime() / 1000);
  const period2 = Math.floor(new Date(dataFim).getTime() / 1000);

  try {
    const resposta = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?period1=${period1}&period2=${period2}&interval=1d`,
      { cache: "no-store" },
    );
    if (!resposta.ok) return { ok: false, mensagem: "Não consegui buscar esse período agora." };

    const json = await resposta.json();
    const resultado = json.chart?.result?.[0];
    if (json.chart?.error || !resultado) {
      return { ok: false, mensagem: "Não encontrei dado histórico pra esse período." };
    }

    const timestamps: number[] = resultado.timestamp ?? [];
    const fechamentos: (number | null)[] = resultado.indicators?.quote?.[0]?.close ?? [];

    const serie: PontoSerie[] = timestamps
      .map((t, i) => {
        const preco = Number(fechamentos[i]);
        return { data: new Date(t * 1000).toISOString(), preco, abertura: preco, maxima: preco, minima: preco, volume: 0 };
      })
      .filter((p) => Number.isFinite(p.preco) && p.preco > 0);

    if (serie.length < 2) {
      return { ok: false, mensagem: "Não há histórico suficiente pra esse período." };
    }

    return { ok: true, serie };
  } catch {
    return { ok: false, mensagem: "Não foi possível buscar o histórico agora." };
  }
}

export type Marco = { data: string; texto: string };

export type Cenario = {
  slug: string;
  titulo: string;
  ticker: string;
  nomeAtivo: string;
  dataInicio: string;
  dataFim: string;
  resumo: string;
  narrativa: string[];
  marcos: Marco[];
};

/**
 * Datas e eventos abaixo são de conhecimento público amplamente
 * documentado, mas não foram verificados contra uma fonte primária
 * nesta sessão. Confirme antes de publicar.
 */
export const CENARIOS: Cenario[] = [
  {
    slug: "crise-2008",
    titulo: "A crise financeira de 2008",
    ticker: "^BVSP",
    nomeAtivo: "Ibovespa",
    dataInicio: "2008-08-01",
    dataFim: "2009-03-31",
    resumo:
      "A quebra do banco Lehman Brothers em setembro de 2008 travou o crédito no mundo inteiro e derrubou bolsas em todo lugar, incluindo a B3.",
    narrativa: [
      "Em 15 de setembro de 2008, o banco de investimento americano Lehman Brothers entrou em concordata, a maior falência bancária da história dos EUA até então. O mercado interbancário travou: bancos deixaram de confiar entre si o suficiente pra se emprestar dinheiro no dia a dia.",
      "A crise começou no mercado imobiliário americano (hipotecas de alto risco, as \"subprime\"), mas se espalhou rápido pro mundo inteiro porque bancos globais tinham comprado produtos financeiros ligados a essas hipotecas. A B3 não tinha exposição direta ao subprime americano, mas caiu junto: quando o crédito mundial trava, investidores em todo lugar vendem ativos de risco pra se proteger, e mercados emergentes como o Brasil costumam cair mais que a média nesses momentos.",
      "A recuperação começou em 2009, puxada por cortes de juros e socorro a bancos em várias partes do mundo. Quem vendeu no fundo do pânico, em vez de esperar, perdeu a recuperação que veio depois.",
    ],
    marcos: [
      { data: "2008-09-15", texto: "Lehman Brothers entra em concordata" },
      { data: "2008-10-08", texto: "Bancos centrais coordenam corte de juros em conjunto" },
      { data: "2009-03-09", texto: "Ponto mais baixo das bolsas americanas nesse ciclo" },
    ],
  },
  {
    slug: "covid-2020",
    titulo: "O crash da Covid-19 em 2020",
    ticker: "^BVSP",
    nomeAtivo: "Ibovespa",
    dataInicio: "2020-01-15",
    dataFim: "2020-07-15",
    resumo:
      "Entre fevereiro e março de 2020, as bolsas do mundo inteiro caíram mais rápido do que em qualquer outra crise recente, e depois se recuperaram quase tão rápido.",
    narrativa: [
      "Em 11 de março de 2020, a Organização Mundial da Saúde declarou a Covid-19 uma pandemia. Países fecharam fronteiras e cidades entraram em quarentena em poucas semanas, parando boa parte da atividade econômica de uma vez.",
      "A reação dos mercados foi uma das quedas mais rápidas da história: o Ibovespa teve várias sessões de circuit breaker (paralisação automática do pregão por queda extrema) só em março de 2020. A incerteza era sobre quanto tempo a economia ficaria parada, não sobre um problema estrutural do sistema financeiro como em 2008.",
      "A recuperação também foi rápida, puxada por bancos centrais despejando dinheiro na economia e por governos anunciando pacotes de estímulo. Quem manteve a carteira montada (em vez de vender no meio do pânico) recuperou boa parte da perda em poucos meses, o que não é garantia de que toda queda se recupera assim, cada crise é diferente.",
    ],
    marcos: [
      { data: "2020-02-26", texto: "Primeiro caso confirmado de Covid-19 no Brasil" },
      { data: "2020-03-11", texto: "OMS declara pandemia" },
      { data: "2020-03-23", texto: "Ponto mais baixo do Ibovespa nesse ciclo" },
    ],
  },
  {
    slug: "gamestop-2021",
    titulo: "O rali de GameStop em 2021",
    ticker: "GME",
    nomeAtivo: "GameStop (EUA)",
    dataInicio: "2020-12-15",
    dataFim: "2021-03-15",
    resumo:
      "Um grupo de investidores de varejo, coordenados num fórum online, comprou em massa uma ação que grandes fundos apostavam contra, e o preço multiplicou em poucas semanas.",
    narrativa: [
      "A GameStop (rede de lojas de videogame americana) era uma das ações mais \"vendidas a descoberto\" da bolsa: fundos grandes apostavam que o preço ia cair, prevendo que a loja física perderia espaço pro varejo digital. Vender a descoberto significa vender uma ação que você não tem (emprestada), esperando recomprá-la mais barata depois.",
      "Um grupo de investidores de varejo, organizado principalmente num fórum do Reddit, notou que a aposta contra a GameStop era tão grande que, se o preço subisse, os fundos que venderam a descoberto seriam forçados a comprar de volta pra limitar a perda, o que empurraria o preço ainda mais pra cima. Esse efeito em cadeia se chama \"short squeeze\".",
      "Em poucas semanas de janeiro de 2021, o preço multiplicou muitas vezes. Alguns dos fundos que apostaram contra a ação tiveram perdas bilionárias. O episódio ficou conhecido como um dos exemplos mais claros de como coordenação de investidores individuais pode afetar até ações de empresas grandes, e também de como preço pode se afastar bastante do valor real de uma empresa por um tempo.",
    ],
    marcos: [
      { data: "2021-01-13", texto: "Início do movimento de compra coordenada" },
      { data: "2021-01-27", texto: "Pico do preço nesse ciclo" },
      { data: "2021-02-02", texto: "Preço já tinha caído bastante do pico" },
    ],
  },
];
