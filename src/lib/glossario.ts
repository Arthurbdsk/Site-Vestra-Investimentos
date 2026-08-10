/**
 * Dicionario de termos financeiros em portugues simples, no mesmo espirito
 * do Investopedia mas com conteudo original e em escala menor: alguns
 * termos essenciais bem explicados, nao um dicionario de 30 mil entradas.
 */
export type TermoGlossario = {
  termo: string;
  definicao: string;
};

export const GLOSSARIO: TermoGlossario[] = [
  {
    termo: "Ação",
    definicao:
      "Um pedacinho de uma empresa. Comprar uma ação é virar sócio, mesmo que bem pequeno, daquele negócio.",
  },
  {
    termo: "Dividendo",
    definicao:
      "Parte do lucro que a empresa devolve pra quem tem ações dela, geralmente depositado direto na conta da corretora.",
  },
  {
    termo: "Ticker",
    definicao:
      "O código curto que identifica uma ação na bolsa, tipo PETR4 ou VALE3.",
  },
  {
    termo: "Volatilidade",
    definicao:
      "O quanto o preço de algo sobe e desce num período. Ação volátil balança muito; ação estável, pouco.",
  },
  {
    termo: "Liquidez",
    definicao:
      "A facilidade de vender algo rápido sem perder valor no processo. Ações grandes têm liquidez alta; imóveis, baixa.",
  },
  {
    termo: "Renda fixa",
    definicao:
      "Investimento onde as regras de rendimento já são combinadas antes, tipo Tesouro Direto ou CDB.",
  },
  {
    termo: "Renda variável",
    definicao:
      "Investimento sem promessa de retorno fixo, como ações e fundos imobiliários. Pode ganhar mais, mas também pode perder.",
  },
  {
    termo: "Diversificação",
    definicao:
      "Espalhar o dinheiro em investimentos diferentes pra não depender do resultado de um só.",
  },
  {
    termo: "IPO",
    definicao:
      "Sigla em inglês pra quando uma empresa vende ações pela primeira vez na bolsa, abrindo seu capital.",
  },
  {
    termo: "Blue chip",
    definicao:
      "Apelido pras ações de empresas grandes e consolidadas, consideradas mais seguras dentro da renda variável.",
  },
  {
    termo: "Day trade",
    definicao:
      "Comprar e vender a mesma ação no mesmo dia, tentando lucrar com pequenas variações de preço.",
  },
  {
    termo: "Corretora",
    definicao:
      "A empresa que serve de ponte entre você e a bolsa de valores, por onde suas ordens de compra e venda passam.",
  },
  {
    termo: "Ibovespa",
    definicao:
      "O principal índice da bolsa brasileira. Mostra a média do desempenho das ações mais negociadas do país.",
  },
  {
    termo: "Selic",
    definicao:
      "A taxa básica de juros da economia brasileira, definida pelo Banco Central. Serve de referência pra quase todo investimento.",
  },
  {
    termo: "CDI",
    definicao:
      'Taxa de juros usada entre bancos, andando bem perto da Selic. Muitos investimentos de renda fixa rendem "um % do CDI".',
  },
  {
    termo: "FII",
    definicao:
      "Fundo de Investimento Imobiliário. Um jeito de investir em imóveis (aluguel, shoppings, galpões) comprando cotas na bolsa.",
  },
  {
    termo: "ETF",
    definicao:
      "Fundo negociado na bolsa que replica um índice inteiro, tipo comprar um pacotinho de várias ações de uma vez só.",
  },
  {
    termo: "Spread",
    definicao:
      "A diferença entre o preço de compra e o de venda de um ativo naquele exato momento.",
  },
  {
    termo: "Stop loss",
    definicao:
      "Uma ordem automática pra vender uma ação se o preço cair até um limite que você define, limitando sua perda.",
  },
  {
    termo: "Alavancagem",
    definicao:
      "Investir com mais dinheiro do que você tem, geralmente emprestado, pra tentar multiplicar o ganho, e também a perda.",
  },
  {
    termo: "P/L",
    definicao:
      'Preço sobre Lucro. Compara o preço da ação com o lucro da empresa; ajuda a ver se ela está "cara" ou "barata" perto do que produz.',
  },
  {
    termo: "Come-cotas",
    definicao:
      "Um adiantamento de Imposto de Renda cobrado automaticamente em alguns fundos, duas vezes por ano.",
  },
  {
    termo: "Home broker",
    definicao:
      "O sistema (site ou aplicativo) da corretora onde você efetivamente compra e vende ações.",
  },
  {
    termo: "Bolsa de valores",
    definicao:
      "O mercado organizado onde ações e outros ativos são comprados e vendidos publicamente, sob regras claras.",
  },
  {
    termo: "Carteira",
    definicao:
      "O conjunto de todos os investimentos que uma pessoa tem, também chamado de portfólio.",
  },
];
