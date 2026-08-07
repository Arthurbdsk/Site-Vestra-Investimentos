/**
 * Lista curada de acoes. A ideia nao e oferecer as milhares da B3, e sim
 * um punhado de empresas conhecidas, com uma explicacao em portugues do
 * que cada uma faz. Menos opcao, menos paralisia.
 */
export type Acao = {
  ticker: string;
  nome: string;
  setor: string;
  explica: string;
};

export const ACOES: Acao[] = [
  {
    ticker: "PETR4",
    nome: "Petrobras",
    setor: "Petróleo",
    explica:
      "Tira petróleo do fundo do mar e vende combustível. Quando o preço do barril sobe lá fora, ela tende a subir junto.",
  },
  {
    ticker: "VALE3",
    nome: "Vale",
    setor: "Mineração",
    explica:
      "Tira minério de ferro do chão e vende, principalmente pra China. Se a China compra menos, a ação sente.",
  },
  {
    ticker: "ITUB4",
    nome: "Itaú Unibanco",
    setor: "Bancos",
    explica:
      "O maior banco privado do país. Ganha com juros de empréstimo e tarifas. Costuma balançar menos que a média.",
  },
  {
    ticker: "BBDC4",
    nome: "Bradesco",
    setor: "Bancos",
    explica:
      "Outro banco gigante. Mesma lógica do Itaú: vive de juros, tarifas e seguros.",
  },
  {
    ticker: "BBAS3",
    nome: "Banco do Brasil",
    setor: "Bancos",
    explica:
      "Banco onde o governo é o maior dono. Isso significa que decisão política mexe no preço dele.",
  },
  {
    ticker: "ABEV3",
    nome: "Ambev",
    setor: "Bebidas",
    explica:
      "Dona da Brahma, Skol e Antarctica. Vende o ano inteiro, então tende a ser mais previsível.",
  },
  {
    ticker: "WEGE3",
    nome: "WEG",
    setor: "Indústria",
    explica:
      "Fabrica motores elétricos e exporta pro mundo todo. Vai bem quando a indústria vai bem.",
  },
  {
    ticker: "MGLU3",
    nome: "Magazine Luiza",
    setor: "Varejo",
    explica:
      "Loja de varejo e e-commerce. É bem sensível a juros: juro alto, gente compra menos parcelado.",
  },
  {
    ticker: "B3SA3",
    nome: "B3",
    setor: "Financeiro",
    explica:
      "É a própria bolsa de valores. Ganha uma taxinha cada vez que alguém compra ou vende ação.",
  },
  {
    ticker: "RENT3",
    nome: "Localiza",
    setor: "Aluguel de carros",
    explica:
      "Aluga carros e depois revende a frota usada. Compra carro financiado, então juros pesam bastante.",
  },
  {
    ticker: "SUZB3",
    nome: "Suzano",
    setor: "Papel e celulose",
    explica:
      "Maior produtora de celulose do mundo. Vende em dólar, então dólar alto costuma ajudar.",
  },
  {
    ticker: "RAIL3",
    nome: "Rumo",
    setor: "Logística",
    explica:
      "Dona de ferrovias que levam grãos até o porto. Safra boa costuma significar mais carga transportada.",
  },
  {
    ticker: "PRIO3",
    nome: "PRIO",
    setor: "Petróleo",
    explica:
      "Compra campos de petróleo antigos e faz eles produzirem de novo. Costuma oscilar mais que a Petrobras.",
  },
  {
    ticker: "EQTL3",
    nome: "Equatorial",
    setor: "Energia",
    explica:
      "Distribui energia elétrica. Setor mais previsível, porque conta de luz todo mundo paga.",
  },
  {
    ticker: "RADL3",
    nome: "Raia Drogasil",
    setor: "Farmácias",
    explica:
      "Dona das Drogasil e Droga Raia. Remédio a pessoa compra mesmo em crise, o que dá estabilidade.",
  },
  {
    ticker: "LREN3",
    nome: "Lojas Renner",
    setor: "Varejo",
    explica:
      "Rede de roupas. Depende do quanto as pessoas estão dispostas a gastar com o que não é essencial.",
  },
];

export const TICKERS = ACOES.map((a) => a.ticker);

export function acaoPorTicker(ticker: string): Acao | undefined {
  return ACOES.find((a) => a.ticker === ticker);
}
