/**
 * Conteudo da trilha de educacao financeira basica (/educacao).
 *
 * Fica separado da pagina pra poder ser revisado sem mexer em layout.
 * Regras de imposto e garantia mudam de tempos em tempos: quando mudar,
 * atualize aqui e a data em CONTEUDO_REVISADO_EM.
 */

export const CONTEUDO_REVISADO_EM = "novembro de 2026";

export type Conceito = {
  id: string;
  titulo: string;
  texto: string;
  exemplo?: string;
};

/** Ideias que aparecem em todos os produtos. Vem antes dos produtos. */
export const CONCEITOS: Conceito[] = [
  {
    id: "titulo",
    titulo: "O que é um título",
    texto:
      "Um título é um papel de dívida. Quando você compra um título, está emprestando dinheiro pra alguém (o governo, um banco ou uma empresa). Em troca, essa pessoa promete devolver o valor com juros numa data combinada, que se chama vencimento.",
    exemplo:
      "Comprar um Tesouro Selic é emprestar pro governo federal. Comprar um CDB é emprestar pro banco.",
  },
  {
    id: "rentabilidade",
    titulo: "Prefixado, pós-fixado e híbrido",
    texto:
      "Prefixado: você sabe a taxa no dia da compra (ex.: 13% ao ano). Pós-fixado: acompanha um índice, quase sempre o CDI ou a Selic (ex.: 100% do CDI). Híbrido: paga a inflação (IPCA) mais uma taxa fixa (ex.: IPCA + 6%), o que protege seu poder de compra.",
  },
  {
    id: "liquidez",
    titulo: "Liquidez",
    texto:
      "É a rapidez com que você transforma o investimento de volta em dinheiro sem perder valor. Liquidez diária significa que dá pra resgatar em qualquer dia útil. Alguns títulos só devolvem o dinheiro no vencimento.",
  },
  {
    id: "risco",
    titulo: "Risco de crédito e risco de mercado",
    texto:
      "Risco de crédito é a chance de quem pegou seu dinheiro emprestado não pagar. Risco de mercado é o preço do investimento oscilar antes do vencimento. Um título pode ter risco de crédito baixíssimo e ainda assim oscilar bastante no meio do caminho.",
  },
  {
    id: "fgc",
    titulo: "FGC: a garantia dos bancos",
    texto:
      "O Fundo Garantidor de Créditos devolve até R$ 250 mil por CPF, por instituição financeira, se o banco quebrar (com teto de R$ 1 milhão a cada 4 anos). Cobre poupança, CDB, LCI e LCA. Não cobre Tesouro (que tem a garantia do próprio governo), debêntures, fundos, ações nem cripto.",
  },
  {
    id: "ir",
    titulo: "Imposto de renda na renda fixa",
    texto:
      "A maior parte da renda fixa segue a tabela regressiva: quanto mais tempo o dinheiro fica aplicado, menor o imposto sobre o lucro. Resgates nos primeiros 30 dias ainda pagam IOF.",
    exemplo:
      "Até 180 dias: 22,5%. De 181 a 360 dias: 20%. De 361 a 720 dias: 17,5%. Acima de 720 dias: 15%.",
  },
];

export type Produto = {
  id: string;
  nome: string;
  grupo: "Renda fixa" | "Renda variável";
  /** Frase de uma linha, a primeira coisa que a pessoa le. */
  resumo: string;
  quemEmite: string;
  comoRende: string;
  risco: string;
  liquidez: string;
  imposto: string;
  garantia: string;
  quandoFazSentido: string;
  /** 1 (muito baixo) a 5 (muito alto), so pra desenhar a barrinha. */
  nivelRisco: 1 | 2 | 3 | 4 | 5;
};

export const PRODUTOS: Produto[] = [
  {
    id: "poupanca",
    nome: "Poupança",
    grupo: "Renda fixa",
    resumo: "O investimento mais conhecido do Brasil, e quase sempre o que rende menos.",
    quemEmite: "Bancos.",
    comoRende:
      "Com a Selic acima de 8,5% ao ano, rende 0,5% ao mês mais a TR (cerca de 6,2% ao ano mais TR). Só rende no aniversário mensal do depósito.",
    risco: "Muito baixo.",
    liquidez: "Diária, mas sacar antes do aniversário perde o rendimento do mês.",
    imposto: "Isenta de imposto de renda.",
    garantia: "FGC, até R$ 250 mil.",
    quandoFazSentido:
      "Quase nunca, quando a Selic está alta. Tesouro Selic e CDB a 100% do CDI costumam render mais mesmo depois do imposto.",
    nivelRisco: 1,
  },
  {
    id: "tesouro-selic",
    nome: "Tesouro Selic",
    grupo: "Renda fixa",
    resumo: "Empréstimo ao governo que acompanha a Selic. O lugar clássico da reserva de emergência.",
    quemEmite: "Governo federal, pelo Tesouro Direto.",
    comoRende: "Pós-fixado: acompanha a taxa Selic, um pouco mais um pequeno prêmio.",
    risco: "O mais baixo do país. O preço quase não oscila.",
    liquidez: "Diária: o dinheiro cai na conta no mesmo dia útil ou no seguinte.",
    imposto: "Tabela regressiva (22,5% a 15%). Taxa de custódia da B3, com isenções para valores menores.",
    garantia: "Tesouro Nacional.",
    quandoFazSentido: "Reserva de emergência e dinheiro que pode ser preciso a qualquer momento.",
    nivelRisco: 1,
  },
  {
    id: "tesouro-prefixado",
    nome: "Tesouro Prefixado",
    grupo: "Renda fixa",
    resumo: "Você trava uma taxa hoje e sabe exatamente quanto recebe no vencimento.",
    quemEmite: "Governo federal, pelo Tesouro Direto.",
    comoRende: "Prefixado: taxa fixa definida na compra (ex.: 13% ao ano).",
    risco:
      "Crédito muito baixo, mas o preço oscila antes do vencimento (marcação a mercado). Se vender no meio do caminho pode ganhar mais ou perder.",
    liquidez: "Diária, mas pelo preço do dia. Levando até o vencimento, recebe a taxa combinada.",
    imposto: "Tabela regressiva (22,5% a 15%).",
    garantia: "Tesouro Nacional.",
    quandoFazSentido: "Objetivos com data marcada, quando você acha que os juros vão cair.",
    nivelRisco: 2,
  },
  {
    id: "tesouro-ipca",
    nome: "Tesouro IPCA+",
    grupo: "Renda fixa",
    resumo: "Paga a inflação mais uma taxa fixa. Protege o poder de compra no longo prazo.",
    quemEmite: "Governo federal, pelo Tesouro Direto.",
    comoRende: "Híbrido: IPCA mais uma taxa real (ex.: IPCA + 6% ao ano).",
    risco:
      "Crédito muito baixo, mas é o título público que mais oscila antes do vencimento, principalmente os mais longos.",
    liquidez: "Diária pelo preço do dia. Feito pra ficar até o vencimento.",
    imposto: "Tabela regressiva (22,5% a 15%).",
    garantia: "Tesouro Nacional.",
    quandoFazSentido: "Aposentadoria e objetivos de 5 anos ou mais.",
    nivelRisco: 2,
  },
  {
    id: "cdb",
    nome: "CDB",
    grupo: "Renda fixa",
    resumo: "Empréstimo a um banco. Rende normalmente um percentual do CDI.",
    quemEmite: "Bancos (Certificado de Depósito Bancário).",
    comoRende:
      "Quase sempre pós-fixado em % do CDI (ex.: 100% ou 110% do CDI). Também existem versões prefixadas e atreladas ao IPCA.",
    risco: "Baixo, e menor ainda dentro do limite do FGC. Bancos menores pagam mais porque têm risco maior.",
    liquidez: "Depende do CDB: alguns têm liquidez diária, outros só pagam no vencimento.",
    imposto: "Tabela regressiva (22,5% a 15%).",
    garantia: "FGC, até R$ 250 mil por CPF por banco.",
    quandoFazSentido:
      "Reserva de emergência (se tiver liquidez diária e pagar pelo menos 100% do CDI) e objetivos de curto e médio prazo.",
    nivelRisco: 1,
  },
  {
    id: "lci-lca",
    nome: "LCI e LCA",
    grupo: "Renda fixa",
    resumo: "Parecidas com o CDB, mas isentas de imposto de renda para pessoa física.",
    quemEmite:
      "Bancos. O dinheiro financia o setor imobiliário (LCI, Letra de Crédito Imobiliário) ou o agronegócio (LCA, Letra de Crédito do Agronegócio).",
    comoRende:
      "Normalmente em % do CDI. Como não tem imposto, um LCI a 90% do CDI pode render mais que um CDB a 110%.",
    risco: "Baixo, parecido com o CDB.",
    liquidez:
      "Têm prazo mínimo de carência definido pelo Banco Central, então o dinheiro fica preso por meses. Não servem como reserva de emergência.",
    imposto: "Isentas de imposto de renda para pessoa física.",
    garantia: "FGC, até R$ 250 mil por CPF por banco.",
    quandoFazSentido: "Dinheiro que você não vai precisar por pelo menos um ano.",
    nivelRisco: 1,
  },
  {
    id: "credito-privado",
    nome: "Debêntures, CRI e CRA",
    grupo: "Renda fixa",
    resumo: "Empréstimos a empresas. Pagam mais que o banco porque o risco é maior.",
    quemEmite:
      "Empresas (debêntures) ou securitizadoras, que empacotam créditos imobiliários (CRI) ou do agronegócio (CRA).",
    comoRende: "Pode ser prefixado, % do CDI ou IPCA mais uma taxa.",
    risco: "Médio. Se a empresa quebrar, não existe FGC pra devolver o dinheiro.",
    liquidez: "Baixa. Vender antes do vencimento pode ser difícil ou sair com desconto.",
    imposto:
      "Debêntures comuns seguem a tabela regressiva. Debêntures incentivadas, CRI e CRA são isentos para pessoa física.",
    garantia: "Nenhuma garantia do FGC.",
    quandoFazSentido: "Uma parte pequena da carteira, para quem já tem a base em títulos mais seguros.",
    nivelRisco: 3,
  },
  {
    id: "fundos",
    nome: "Fundos de investimento",
    grupo: "Renda fixa",
    resumo: "Você junta seu dinheiro com o de outras pessoas e um gestor profissional decide onde aplicar.",
    quemEmite: "Gestoras de recursos. Você compra cotas do fundo.",
    comoRende: "Depende da estratégia: há fundos de renda fixa, multimercado, ações e cambiais.",
    risco: "Varia muito com o tipo de fundo. Leia a lâmina antes de investir.",
    liquidez: "Prazo de resgate definido pelo fundo (de D+0 a mais de 30 dias).",
    imposto:
      "Fundos abertos têm come-cotas: o imposto é cobrado automaticamente em maio e novembro. Há também taxa de administração e, às vezes, de performance.",
    garantia: "Não tem FGC.",
    quandoFazSentido: "Quando você quer delegar a gestão e as taxas cobradas são justas.",
    nivelRisco: 3,
  },
  {
    id: "fii",
    nome: "Fundos imobiliários (FII)",
    grupo: "Renda variável",
    resumo: "Uma forma de investir em imóveis comprando cotas na bolsa, e receber aluguel todo mês.",
    quemEmite: "Fundos que compram shoppings, galpões, escritórios ou títulos imobiliários.",
    comoRende: "Distribuição mensal de rendimentos mais a variação do preço da cota.",
    risco: "Médio: a cota oscila na bolsa e o aluguel pode cair se o imóvel ficar vazio.",
    liquidez: "Vende na bolsa em qualquer pregão, mas pelo preço do dia.",
    imposto:
      "Rendimentos mensais isentos para pessoa física (dentro das regras). Lucro na venda das cotas paga 20%.",
    garantia: "Não tem FGC.",
    quandoFazSentido: "Para quem busca renda mensal e aceita oscilação no preço.",
    nivelRisco: 3,
  },
  {
    id: "acoes",
    nome: "Ações",
    grupo: "Renda variável",
    resumo: "Um pedacinho de uma empresa. Você ganha se ela crescer e distribuir lucro.",
    quemEmite: "Empresas listadas na bolsa (B3).",
    comoRende: "Valorização da ação mais dividendos e juros sobre capital próprio.",
    risco: "Alto: uma ação pode cair 30% ou mais em poucos meses.",
    liquidez: "Alta nas empresas grandes. Vende em qualquer pregão, pelo preço do dia.",
    imposto:
      "15% sobre o lucro na venda, com isenção se o total vendido no mês ficar abaixo de R$ 20 mil. Dividendos são isentos para a grande maioria dos investidores.",
    garantia: "Não tem FGC.",
    quandoFazSentido: "Dinheiro de longo prazo (5 anos ou mais) que você aguenta ver oscilar.",
    nivelRisco: 4,
  },
  {
    id: "etf",
    nome: "ETFs",
    grupo: "Renda variável",
    resumo: "Um fundo negociado na bolsa que compra uma cesta inteira de ações de uma vez só.",
    quemEmite: "Gestoras. Exemplos: BOVA11 (copia o Ibovespa) e IVVB11 (copia o S&P 500, em dólar).",
    comoRende: "Acompanha o índice que ele replica.",
    risco: "Alto, mas diversificado: uma empresa ruim pesa pouco na cesta.",
    liquidez: "Vende em qualquer pregão.",
    imposto: "15% sobre o lucro na venda, sem a isenção dos R$ 20 mil.",
    garantia: "Não tem FGC.",
    quandoFazSentido: "Jeito simples e barato de diversificar em ações, inclusive no exterior.",
    nivelRisco: 4,
  },
  {
    id: "cripto",
    nome: "Criptomoedas",
    grupo: "Renda variável",
    resumo: "Moedas digitais como Bitcoin. Podem subir muito e cair muito.",
    quemEmite: "Ninguém: são redes descentralizadas.",
    comoRende: "Só pela variação de preço.",
    risco: "Muito alto. Quedas de 50% ou mais já aconteceram várias vezes.",
    liquidez: "Alta nas maiores moedas, 24 horas por dia.",
    imposto: "15% sobre o lucro, com isenção para vendas de até R$ 35 mil no mês.",
    garantia: "Nenhuma.",
    quandoFazSentido: "No máximo uma fatia pequena, de dinheiro que você aceita perder.",
    nivelRisco: 5,
  },
];

export type PassoCarteira = {
  numero: number;
  titulo: string;
  texto: string;
  dica: string;
};

/** O passo a passo da etapa "Como montar uma carteira". */
export const PASSOS_CARTEIRA: PassoCarteira[] = [
  {
    numero: 1,
    titulo: "Monte a reserva de emergência primeiro",
    texto:
      "Antes de pensar em retorno, separe de 6 a 12 meses dos seus gastos num investimento seguro e com liquidez diária. É ela que impede você de vender ações no pior momento quando aparece um imprevisto.",
    dica: "Onde: Tesouro Selic ou CDB com liquidez diária pagando pelo menos 100% do CDI.",
  },
  {
    numero: 2,
    titulo: "Defina objetivo e prazo de cada dinheiro",
    texto:
      "Viagem no ano que vem, entrada de um apartamento em 5 anos, aposentadoria em 30. Cada objetivo tem um prazo, e o prazo decide o tipo de investimento.",
    dica: "Menos de 2 anos: renda fixa. De 2 a 5 anos: maioria em renda fixa. Mais de 5 anos: dá pra ter mais renda variável.",
  },
  {
    numero: 3,
    titulo: "Conheça seu perfil de investidor",
    texto:
      "Conservador, moderado ou arrojado. O perfil mostra quanta oscilação você aguenta sem perder o sono, e por isso limita quanto pode ir pra renda variável.",
    dica: "Se não sabe o seu, faça o quiz de 5 perguntas na etapa de avaliação.",
  },
  {
    numero: 4,
    titulo: "Divida o dinheiro entre as classes",
    texto:
      "Essa é a decisão que mais pesa no resultado: quanto vai pra renda fixa e quanto vai pra renda variável. Escolher a ação certa importa bem menos do que acertar essa divisão.",
    dica: "Use as carteiras modelo abaixo como ponto de partida.",
  },
  {
    numero: 5,
    titulo: "Diversifique dentro de cada classe",
    texto:
      "Não coloque toda a renda fixa num banco só, nem toda a renda variável numa ação só. Misture setores, emissores e, se fizer sentido, um pouco de exterior.",
    dica: "Respeite o limite do FGC: até R$ 250 mil por banco.",
  },
  {
    numero: 6,
    titulo: "Rebalanceie de tempos em tempos",
    texto:
      "Com o tempo, o que subiu passa a pesar mais do que você planejou. Uma ou duas vezes por ano, volte às porcentagens de origem: isso faz você vender o que está caro e comprar o que está barato.",
    dica: "Dá pra rebalancear só com aportes novos, sem vender nada.",
  },
];
