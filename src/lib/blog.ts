/**
 * Artigos do blog, cada um numa pagina propria (SEO: mais paginas
 * indexaveis, cada uma mirando um conjunto de palavras-chave). Conteudo
 * original, sem recomendacao de compra especifica (ver /termos).
 */
export type BlocoArtigo =
  | { tipo: "paragrafo"; texto: string }
  | { tipo: "subtitulo"; texto: string };

export type PostBlog = {
  slug: string;
  titulo: string;
  resumo: string;
  palavrasChave: string[];
  dataPublicacao: string;
  tempoLeituraMin: number;
  corpo: BlocoArtigo[];
};

function p(texto: string): BlocoArtigo {
  return { tipo: "paragrafo", texto };
}
function h(texto: string): BlocoArtigo {
  return { tipo: "subtitulo", texto };
}

export const POSTS_BLOG: PostBlog[] = [
  {
    slug: "como-comecar-a-investir-do-zero",
    titulo: "Como começar a investir do zero: guia para iniciantes",
    resumo:
      "Passo a passo prático para quem nunca investiu: reserva de emergência, perfil de investidor, e o primeiro real aplicado.",
    palavrasChave: [
      "como começar a investir",
      "investir do zero",
      "investir para iniciantes",
      "primeiro investimento",
    ],
    dataPublicacao: "2026-08-01",
    tempoLeituraMin: 6,
    corpo: [
      p(
        "Quem nunca investiu costuma pular direto pra pergunta errada: \"em que ação eu compro?\". Antes disso existem duas ou três decisões que pesam muito mais no resultado final, e que a maioria dos guias por aí não menciona.",
      ),
      h("1. Monte a reserva de emergência primeiro"),
      p(
        "Reserva de emergência é o dinheiro que cobre de 3 a 6 meses das suas despesas, guardado em algo de liquidez imediata (Tesouro Selic ou um CDB de liquidez diária, por exemplo). Sem isso, qualquer imprevisto te obriga a vender investimentos no pior momento possível, muitas vezes com prejuízo.",
      ),
      h("2. Descubra seu perfil de investidor"),
      p(
        "Perfil de investidor é a combinação entre quanto risco você tolera e quanto tempo o dinheiro pode ficar aplicado. Alguém com objetivo de 20 anos pela frente aguenta oscilação de preço de um jeito que alguém que vai usar o dinheiro ano que vem não aguenta. Não existe perfil \"melhor\", existe o que combina com a sua situação.",
      ),
      h("3. Separe o dinheiro por prazo, não por produto"),
      p(
        "Um erro comum é pensar \"70% em renda fixa, 30% em ações\" sem pensar no prazo de cada parte do dinheiro. Funciona melhor separar por objetivo: a reserva de emergência fica de lado, o dinheiro de curto prazo (comprar um carro ano que vem) vai pra renda fixa, e só o dinheiro que você não vai precisar tocar por anos entra em renda variável.",
      ),
      h("4. Comece pequeno, e comece praticando"),
      p(
        "Não precisa de milhares de reais pra aprender como o mercado funciona. Um simulador com dinheiro fictício, mas preços reais de ações da B3 e da bolsa americana, deixa você errar sem custo enquanto aprende a mecânica: como uma ordem funciona, o que move o preço, como é ver a carteira balançar num mês ruim.",
      ),
      p(
        "É exatamente esse o objetivo do Vestra: você recebe R$ 100.000 fictícios e pratica compra, venda, renda fixa e até empréstimo com juros reais da Selic, sem arriscar dinheiro de verdade. Depois que entender a mecânica, decidir aplicar dinheiro real fica bem menos assustador.",
      ),
    ],
  },
  {
    slug: "o-que-e-acao-como-funciona-a-b3",
    titulo: "O que é uma ação e como funciona a Bolsa de Valores (B3)",
    resumo:
      "Entenda o que você realmente compra ao investir em ações, e como a B3 organiza esse mercado no Brasil.",
    palavrasChave: [
      "o que é uma ação",
      "bolsa de valores",
      "B3",
      "como funciona a bolsa",
      "investir em ações",
    ],
    dataPublicacao: "2026-08-03",
    tempoLeituraMin: 5,
    corpo: [
      p(
        "Uma ação é um pedaço de uma empresa. Quando você compra uma ação da Petrobras, por exemplo, você passa a ser dono de uma fração minúscula da empresa, com direito a uma parte proporcional do lucro (via dividendos) e do valor dela.",
      ),
      h("O que é a B3"),
      p(
        "A B3 (Brasil, Bolsa, Balcão) é a bolsa de valores brasileira: o lugar onde compradores e vendedores de ações se encontram. Ela não define o preço das ações, só organiza o encontro entre quem quer comprar e quem quer vender, registrando cada negócio.",
      ),
      h("Como o preço de uma ação se move"),
      p(
        "O preço sobe quando há mais gente querendo comprar do que vender a um determinado valor, e cai no caso contrário. Por trás disso, o que influencia essa vontade de comprar ou vender costuma ser: resultado financeiro da empresa, expectativa sobre o setor, taxa de juros da economia, e notícias que mudam a percepção de risco.",
      ),
      h("Ticker: o código de cada ação"),
      p(
        "Cada ação tem um código, chamado ticker. Na B3, o padrão é quatro letras (geralmente abreviando o nome da empresa) mais um número que indica o tipo de ação: PETR4 é Petrobras preferencial, VALE3 é Vale ordinária. Esse número não é decoração, ele diz que tipo de direito aquela ação carrega dentro da empresa.",
      ),
      h("Horário de pregão"),
      p(
        "A B3 funciona de segunda a sexta, das 10h às 18h no horário de Brasília (fora feriados). Fora desse horário, o preço fica congelado no último negócio fechado, e só volta a se mexer na próxima abertura.",
      ),
      p(
        "A teoria ajuda, mas entender de verdade como isso se comporta só vem observando um preço em movimento. No simulador do Vestra dá pra acompanhar ações reais da B3 (e também da bolsa americana) com dinheiro fictício, exatamente pra treinar essa percepção sem risco.",
      ),
    ],
  },
  {
    slug: "tesouro-direto-o-que-e-como-investir",
    titulo: "Tesouro Direto: o que é e como funciona na prática",
    resumo:
      "O investimento considerado mais seguro do país, explicado sem economês: tipos de título, quando cada um faz sentido.",
    palavrasChave: [
      "tesouro direto",
      "o que é tesouro direto",
      "tesouro selic",
      "tesouro ipca",
      "investir em renda fixa",
    ],
    dataPublicacao: "2026-08-05",
    tempoLeituraMin: 5,
    corpo: [
      p(
        "Tesouro Direto é um programa do governo federal que permite qualquer pessoa emprestar dinheiro pro governo, recebendo de volta esse valor mais juros depois de um tempo combinado. Na prática, é considerado o investimento de menor risco do país, porque quem está devendo é o próprio governo.",
      ),
      h("Os três tipos principais"),
      p(
        "Tesouro Selic acompanha a taxa básica de juros (Selic) e tem liquidez diária, ou seja, dá pra resgatar quase a qualquer momento sem perder valor: costuma ser a opção pra reserva de emergência.",
      ),
      p(
        "Tesouro Prefixado paga uma taxa fixa, combinada no momento da compra. Você sabe exatamente quanto vai receber no vencimento, mas se vender antes da data, o preço pode oscilar bastante com a variação da taxa de juros.",
      ),
      p(
        "Tesouro IPCA+ paga a inflação (IPCA) mais uma taxa fixa. É a opção que protege o poder de compra do dinheiro no longo prazo, geralmente usada pra objetivos distantes, como aposentadoria.",
      ),
      h("Como comprar"),
      p(
        "A compra é feita por uma corretora (a maioria não cobra taxa pra isso), que serve de intermediária entre você e o Tesouro Nacional. O valor mínimo costuma ser baixo, algumas dezenas de reais, o que torna o Tesouro Direto acessível mesmo pra quem está começando com pouco dinheiro.",
      ),
      p(
        "Antes de decidir com dinheiro de verdade, vale simular: no Vestra você pode aplicar em títulos parecidos com os do Tesouro Direto e ver o rendimento se acumular dia após dia, com dinheiro fictício, até entender qual tipo combina com seu prazo.",
      ),
    ],
  },
  {
    slug: "cdb-vale-a-pena",
    titulo: "CDB vale a pena? Como funciona esse investimento",
    resumo:
      "O que é um CDB, o que significa \"110% do CDI\", e em que situação ele faz mais sentido que a poupança.",
    palavrasChave: [
      "CDB",
      "CDB vale a pena",
      "o que é CDB",
      "CDI",
      "CDB ou poupança",
    ],
    dataPublicacao: "2026-08-07",
    tempoLeituraMin: 4,
    corpo: [
      p(
        "CDB (Certificado de Depósito Bancário) é um empréstimo que você faz a um banco: em troca de deixar seu dinheiro aplicado por um tempo, o banco devolve com juros. É um dos investimentos de renda fixa mais comuns no Brasil.",
      ),
      h("O que significa \"110% do CDI\""),
      p(
        "CDI é uma taxa de referência do mercado financeiro, próxima da Selic. Quando um CDB promete \"110% do CDI\", significa que ele rende 10% a mais do que essa taxa de referência ao longo do período. Quanto maior esse percentual, melhor a rentabilidade prometida, mas geralmente bancos menores oferecem percentuais mais altos pra compensar o risco de serem menos conhecidos.",
      ),
      h("CDB tem proteção do FGC"),
      p(
        "Até um determinado limite por CPF e por instituição financeira, o CDB é coberto pelo Fundo Garantidor de Créditos (FGC): se o banco quebrar, o FGC devolve o valor investido. Essa garantia é um dos motivos do CDB ser considerado relativamente seguro, mesmo em bancos pequenos.",
      ),
      h("CDB ou poupança: qual rende mais"),
      p(
        "Um CDB que paga 100% do CDI ou mais costuma render bem mais que a poupança na maior parte dos cenários de juros no Brasil, especialmente com a Selic em patamares mais altos. A poupança tem a vantagem de ser isenta de imposto de renda, mas essa vantagem raramente compensa a diferença de rentabilidade.",
      ),
      p(
        "No simulador do Vestra dá pra comparar CDBs de diferentes bancos fictícios lado a lado e acompanhar o rendimento se acumulando, uma forma direta de visualizar a diferença entre os percentuais do CDI antes de decidir onde aplicar dinheiro de verdade.",
      ),
    ],
  },
  {
    slug: "diversificacao-de-carteira",
    titulo: "Diversificação de carteira: por que não apostar tudo numa ação só",
    resumo:
      "O risco de concentrar o dinheiro numa única ação, e como pensar em diversificação sem complicar demais.",
    palavrasChave: [
      "diversificação de investimentos",
      "diversificar carteira",
      "risco de investir em uma ação",
      "carteira diversificada",
    ],
    dataPublicacao: "2026-08-09",
    tempoLeituraMin: 5,
    corpo: [
      p(
        "Diversificar significa espalhar o dinheiro entre investimentos diferentes, em vez de concentrar tudo num único lugar. A lógica é simples: se um investimento vai mal, os outros podem compensar, e o resultado da carteira como um todo fica menos dependente de uma única aposta dar certo.",
      ),
      h("O risco de concentração"),
      p(
        "Colocar todo o dinheiro numa ação só significa que o resultado da sua carteira inteira depende do que acontece com uma empresa específica. Um problema pontual dela (uma crise, uma mudança de mercado, um erro de gestão) pode derrubar um patrimônio inteiro, mesmo que o resto da economia vá bem.",
      ),
      h("Diversificar entre setores, não só entre ações"),
      p(
        "Ter cinco ações não é diversificação de verdade se todas forem do mesmo setor: um problema que afete o setor bancário, por exemplo, afeta todos os bancos juntos. Diversificar de verdade envolve misturar setores diferentes (energia, tecnologia, consumo, bancos), e também classes de ativo diferentes, como renda fixa e renda variável.",
      ),
      h("Diversificação não elimina o risco, ela redistribui"),
      p(
        "Vale deixar claro: diversificar não significa nunca perder dinheiro. Significa que o resultado da carteira deixa de depender de um único evento. É uma forma de gerenciar risco, não de eliminá-lo.",
      ),
      p(
        "Uma forma de sentir isso na prática, sem arriscar dinheiro de verdade, é montar carteiras diferentes num simulador e comparar como cada uma se comporta ao longo de semanas. No Vestra, o painel de composição da carteira mostra visualmente o quanto do seu patrimônio fictício está concentrado em cada ativo.",
      ),
    ],
  },
  {
    slug: "dividendos-o-que-sao-como-funcionam",
    titulo: "Dividendos: o que são e como funcionam na prática",
    resumo:
      "Como as empresas distribuem parte do lucro aos acionistas, e o que isso muda na hora de escolher uma ação.",
    palavrasChave: [
      "dividendos",
      "o que são dividendos",
      "ações que pagam dividendos",
      "dividend yield",
    ],
    dataPublicacao: "2026-08-11",
    tempoLeituraMin: 5,
    corpo: [
      p(
        "Dividendo é a parte do lucro que uma empresa decide distribuir aos seus acionistas, em vez de reinvestir tudo de volta no próprio negócio. Se você tem ações de uma empresa que paga dividendos, esse valor cai na sua conta proporcionalmente à quantidade de ações que você possui.",
      ),
      h("Dividend yield: o que essa sigla mede"),
      p(
        "Dividend yield é o total pago em dividendos num período dividido pelo preço da ação, mostrado em porcentagem. Um dividend yield de 6% ao ano, por exemplo, significa que a empresa pagou o equivalente a 6% do preço da ação em dividendos naquele período.",
      ),
      h("Dividend yield alto nem sempre é bom sinal"),
      p(
        "Um yield alto pode significar uma empresa sólida distribuindo lucro de forma consistente, mas também pode ser sinal de um preço de ação que caiu bastante (o que aumenta o yield artificialmente, já que ele é calculado sobre o preço atual). Vale sempre olhar o histórico de pagamentos, não só o número de um único período.",
      ),
      h("Empresas em crescimento costumam pagar menos dividendo"),
      p(
        "Empresas em fase de expansão tendem a reinvestir a maior parte do lucro no próprio crescimento, em vez de distribuir. Isso não é necessariamente ruim: significa que o retorno esperado vem mais da valorização da ação do que do dividendo em si.",
      ),
      p(
        "No Vestra, o simulador credita automaticamente os dividendos reais pagos pelas ações que você tem na carteira fictícia, na mesma data em que aconteceriam de verdade. É uma forma de acompanhar esse mecanismo funcionando sem precisar esperar anos com dinheiro real pra entender o efeito.",
      ),
    ],
  },
  {
    slug: "fundos-imobiliarios-fii-o-que-sao",
    titulo: "Fundos Imobiliários (FIIs): o que são e como funcionam",
    resumo:
      "Como um FII permite investir em imóveis sem comprar um imóvel, a diferença entre fundos de papel e de tijolo, e como o rendimento mensal funciona.",
    palavrasChave: [
      "fundos imobiliários",
      "o que é FII",
      "FII de papel",
      "FII de tijolo",
      "investir em FII",
    ],
    dataPublicacao: "2026-08-13",
    tempoLeituraMin: 5,
    corpo: [
      p(
        "Um Fundo de Investimento Imobiliário (FII) reúne o dinheiro de vários investidores para comprar imóveis ou títulos ligados ao setor imobiliário, e depois distribui o resultado entre quem tem cotas do fundo. Cada cota é negociada na B3 como se fosse uma ação, mas o que está por trás dela não é uma empresa: é um conjunto de imóveis ou papéis.",
      ),
      h("FII de tijolo x FII de papel"),
      p(
        "FIIs de tijolo são donos de imóveis físicos, como galpões logísticos, shoppings ou lajes corporativas, e ganham dinheiro alugando esses espaços. FIIs de papel, por outro lado, não têm imóvel nenhum: investem em títulos de crédito imobiliário (como CRIs), funcionando de forma parecida com renda fixa, mas com o rendimento variando conforme os juros e a inflação do período.",
      ),
      h("Por que o rendimento mensal chama tanta atenção"),
      p(
        "A maioria dos FIIs distribui pelo menos 95% do resultado obtido no período aos cotistas, geralmente todo mês. Esse fluxo mensal é o que atrai quem busca renda passiva, mas vale lembrar que o valor distribuído pode variar de um mês para o outro, junto com a vacância dos imóveis ou o desempenho dos papéis do fundo.",
      ),
      h("O preço da cota também oscila"),
      p(
        "Além do rendimento mensal, o preço da cota sobe e desce na bolsa, assim como uma ação. Um FII pode estar pagando bem e ainda assim ter a cota em queda, se o mercado reprecificar o valor dos imóveis ou dos papéis por trás dele, por exemplo, quando a taxa de juros muda.",
      ),
      p(
        "No Vestra, a aba de fundos imobiliários deixa comprar cotas fictícias de FIIs reais da B3 e acompanhar o rendimento sendo creditado como aconteceria de verdade, uma forma de sentir a diferença entre tijolo e papel antes de decidir com dinheiro real.",
      ),
    ],
  },
  {
    slug: "etf-o-que-e-como-funciona",
    titulo: "ETF: o que é e como investir num índice inteiro de uma vez",
    resumo:
      "Como um ETF replica um índice como o Ibovespa ou o S&P 500 numa única cota, e por que isso simplifica a diversificação.",
    palavrasChave: [
      "o que é ETF",
      "ETF Ibovespa",
      "ETF S&P 500",
      "investir em ETF",
      "BOVA11",
    ],
    dataPublicacao: "2026-08-14",
    tempoLeituraMin: 5,
    corpo: [
      p(
        "ETF (Exchange Traded Fund) é um fundo que segue um índice de mercado, como o Ibovespa ou o S&P 500, e é negociado na bolsa igual a uma ação comum. Ao comprar uma cota de ETF, você passa a ter uma fração de todas as empresas que compõem aquele índice, na mesma proporção em que elas aparecem nele.",
      ),
      h("A vantagem: diversificação instantânea"),
      p(
        "Montar uma carteira com 50 ações diferentes exige tempo, estudo e capital. Um ETF entrega esse mesmo efeito de diversificação numa única compra, porque o índice que ele segue já é, por definição, uma cesta de várias empresas. É por isso que ETFs costumam ser o ponto de entrada mais simples pra quem quer se expor à bolsa como um todo, sem escolher ação por ação.",
      ),
      h("ETF nacional e ETF internacional"),
      p(
        "Existem ETFs que seguem índices brasileiros, como o BOVA11 (que replica o Ibovespa), e ETFs negociados na B3 que dão acesso a índices internacionais, como o IVVB11 (que segue o S&P 500, das maiores empresas americanas). Isso permite ter exposição a mercados fora do Brasil sem precisar abrir conta em corretora no exterior.",
      ),
      h("Taxa de administração: o custo de ter alguém replicando o índice"),
      p(
        "Todo ETF cobra uma taxa de administração anual, geralmente bem menor que a de fundos de investimento tradicionais, porque a gestão é passiva: o objetivo não é bater o índice, é replicá-lo o mais fielmente possível. Vale comparar essa taxa entre ETFs que seguem o mesmo índice, já que ela é descontada do rendimento ao longo do tempo.",
      ),
      p(
        "No Vestra dá pra comprar ETFs fictícios que seguem índices reais, tanto brasileiros quanto americanos, e comparar como cada um se comporta lado a lado com ações individuais na mesma carteira simulada.",
      ),
    ],
  },
  {
    slug: "imposto-de-renda-sobre-acoes",
    titulo: "Imposto de renda sobre ações: como funciona e quando pagar",
    resumo:
      "A isenção até R$ 20 mil em vendas no mês, a alíquota de 15% sobre o lucro, e como funciona a DARF na prática.",
    palavrasChave: [
      "imposto de renda ações",
      "IR sobre ações",
      "DARF ações",
      "isenção venda de ações",
      "imposto sobre lucro em bolsa",
    ],
    dataPublicacao: "2026-08-16",
    tempoLeituraMin: 5,
    corpo: [
      p(
        "Vender ações com lucro gera imposto de renda, mas a regra tem uma isenção que passa batido por muita gente: se o total vendido em ações no mês for até R$ 20.000, o lucro daquelas vendas fica isento de IR. Essa isenção vale pra soma das vendas no mês, não por operação individual.",
      ),
      h("Acima do limite: alíquota de 15%"),
      p(
        "Quando o total vendido no mês passa de R$ 20.000, o lucro obtido nessas vendas é tributado em 15%, recolhido pelo próprio investidor (a corretora não desconta automaticamente, como acontece com fundos). Day trade (compra e venda no mesmo dia) segue uma regra separada, com alíquota de 20% e sem a isenção dos R$ 20.000.",
      ),
      h("Como funciona a DARF"),
      p(
        "Quando há imposto a pagar, o próprio investidor precisa gerar uma DARF (Documento de Arrecadação de Receitas Federais) e pagar até o último dia útil do mês seguinte à venda. A maioria das corretoras oferece uma calculadora ou relatório mensal que já soma as operações e aponta se há imposto devido, o que ajuda bastante a não perder o prazo.",
      ),
      h("Prejuízo pode ser compensado depois"),
      p(
        "Se um mês fecha com prejuízo, esse valor pode ser abatido do lucro de vendas futuras, reduzindo o imposto a pagar mais adiante. Por isso vale guardar o histórico de operações: mesmo em meses de perda, esse registro tem valor pra compensação futura.",
      ),
      p(
        "Como no Vestra as operações são com dinheiro fictício, não há imposto real envolvido, mas o extrato de transações do simulador segue a mesma lógica de somar compras e vendas por mês, uma forma de já se acostumar com esse tipo de controle antes de precisar declarar imposto de verdade.",
      ),
    ],
  },
  {
    slug: "taxa-selic-como-afeta-seus-investimentos",
    titulo: "Taxa Selic: o que é e como ela afeta seus investimentos",
    resumo:
      "Por que a Selic é chamada de taxa básica de juros, e como suas mudanças pesam de forma diferente na renda fixa e nas ações.",
    palavrasChave: [
      "taxa selic",
      "o que é selic",
      "selic e investimentos",
      "selic alta ou baixa",
      "juros e bolsa",
    ],
    dataPublicacao: "2026-08-17",
    tempoLeituraMin: 5,
    corpo: [
      p(
        "A Selic é a taxa básica de juros da economia brasileira, definida pelo Comitê de Política Monetária (Copom) do Banco Central a cada 45 dias. Ela serve como referência para praticamente todas as outras taxas de juros do país, do rendimento de um Tesouro Selic ao juro cobrado no cartão de crédito.",
      ),
      h("Selic alta: renda fixa mais atrativa"),
      p(
        "Quando a Selic sobe, investimentos de renda fixa passam a pagar mais, porque grande parte deles é atrelada direta ou indiretamente a ela (Tesouro Selic, CDBs pós-fixados, fundos DI). Isso também deixa o crédito mais caro para empresas e pessoas, o que tende a desacelerar a economia.",
      ),
      h("Selic alta costuma pressionar as ações"),
      p(
        "Com a renda fixa pagando mais e sem o risco de oscilação de preço, parte do dinheiro que estaria em ações migra para lá, buscando um retorno mais previsível. Além disso, juros mais altos encarecem o crédito das empresas e reduzem o valor presente dos lucros futuros usado para precificar ações, dois fatores que costumam pesar negativamente sobre a bolsa.",
      ),
      h("Selic baixa: o efeito contrário"),
      p(
        "Com a Selic baixa, a renda fixa perde parte do apelo, e o mercado tende a olhar mais para ações e outros ativos de maior risco em busca de retorno melhor. É por isso que o mercado de ações costuma reagir tão rápido a qualquer sinal sobre o rumo dos juros, mesmo antes de o Copom anunciar qualquer decisão oficial.",
      ),
      p(
        "No Vestra, os títulos de renda fixa simulados rendem com base na Selic real, então dá pra sentir na prática como uma mudança da taxa afeta o rendimento acumulado, e comparar esse efeito com o que acontece ao mesmo tempo na carteira de ações fictícia.",
      ),
    ],
  },
];

export function postPorSlug(slug: string): PostBlog | undefined {
  return POSTS_BLOG.find((p) => p.slug === slug);
}
