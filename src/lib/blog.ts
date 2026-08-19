/**
 * Artigos do blog, cada um numa pagina propria (SEO: mais paginas
 * indexaveis, cada uma mirando um conjunto de palavras-chave). Conteudo
 * original, sem recomendacao de compra especifica (ver /termos).
 */
import type { NomeWidget } from "@/components/artigo/WidgetArtigo";

export type BlocoArtigo =
  | { tipo: "paragrafo"; texto: string }
  | { tipo: "subtitulo"; texto: string }
  /** Calculadora interativa no meio do texto (ver components/artigo). */
  | { tipo: "widget"; nome: NomeWidget };

/**
 * Capas por TEMA, nao uma por artigo.
 *
 * Cinco imagens reaproveitadas entre os posts: mantem o peso da pagina
 * baixo, o cache quente, e evita o visual de banco de imagens que vem de
 * escolher uma foto qualquer pra cada texto. Todas do Unsplash, cuja
 * licenca permite uso comercial sem atribuicao, baixadas pra
 * public/images/blog (link externo quebra quando a origem sai do ar).
 */
export type CapaArtigo = "conceito" | "mercado" | "imoveis" | "renda-fixa" | "bolsa";

export const CAPAS: Record<CapaArtigo, { arquivo: string; alt: string }> = {
  conceito: {
    arquivo: "/images/blog/capa-conceito.jpg",
    alt: "Curva de arquitetura moderna em azul escuro contra o céu",
  },
  mercado: {
    arquivo: "/images/blog/capa-mercado.jpg",
    alt: "Tela de negociação com gráfico de candles em verde e vermelho",
  },
  imoveis: {
    arquivo: "/images/blog/capa-imoveis.jpg",
    alt: "Arranha-céus de escritórios vistos de baixo para cima",
  },
  "renda-fixa": {
    arquivo: "/images/blog/capa-renda-fixa.jpg",
    alt: "Fachada de vidro escuro em padrão geométrico repetido",
  },
  bolsa: {
    arquivo: "/images/blog/capa-bolsa.jpg",
    alt: "Estrutura de vidro azul em ângulos geométricos vista de baixo",
  },
};

export type PostBlog = {
  slug: string;
  titulo: string;
  resumo: string;
  palavrasChave: string[];
  dataPublicacao: string;
  tempoLeituraMin: number;
  capa: CapaArtigo;
  corpo: BlocoArtigo[];
};

function p(texto: string): BlocoArtigo {
  return { tipo: "paragrafo", texto };
}
function h(texto: string): BlocoArtigo {
  return { tipo: "subtitulo", texto };
}
function w(nome: NomeWidget): BlocoArtigo {
  return { tipo: "widget", nome };
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
    capa: "conceito",
    corpo: [
      p(
        "Quem nunca investiu costuma pular direto pra pergunta errada: \"em que ação eu compro?\". Antes disso existem duas ou três decisões que pesam muito mais no resultado final, e que a maioria dos guias por aí não menciona.",
      ),
      h("1. Monte a reserva de emergência primeiro"),
      p(
        "Reserva de emergência é o dinheiro que cobre de 3 a 6 meses das suas despesas, guardado em algo de liquidez imediata (Tesouro Selic ou um CDB de liquidez diária, por exemplo). Sem isso, qualquer imprevisto te obriga a vender investimentos no pior momento possível, muitas vezes com prejuízo.",
      ),
      w("reserva-emergencia"),
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
    capa: "bolsa",
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
    capa: "renda-fixa",
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
    capa: "renda-fixa",
    corpo: [
      p(
        "CDB (Certificado de Depósito Bancário) é um empréstimo que você faz a um banco: em troca de deixar seu dinheiro aplicado por um tempo, o banco devolve com juros. É um dos investimentos de renda fixa mais comuns no Brasil.",
      ),
      h("O que significa \"110% do CDI\""),
      p(
        "CDI é uma taxa de referência do mercado financeiro, próxima da Selic. Quando um CDB promete \"110% do CDI\", significa que ele rende 10% a mais do que essa taxa de referência ao longo do período. Quanto maior esse percentual, melhor a rentabilidade prometida, mas geralmente bancos menores oferecem percentuais mais altos pra compensar o risco de serem menos conhecidos.",
      ),
      w("comparador-renda-fixa"),
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
    capa: "conceito",
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
    capa: "mercado",
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
    capa: "imoveis",
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
    capa: "bolsa",
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
    capa: "renda-fixa",
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
    capa: "renda-fixa",
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
  {
    slug: "reserva-de-emergencia-quanto-e-onde",
    titulo: "Reserva de emergência: quanto guardar e onde deixar o dinheiro",
    resumo:
      "Como calcular o tamanho da sua reserva, por que ela vem antes de qualquer investimento, e quais aplicações servem pra ela.",
    palavrasChave: [
      "reserva de emergência",
      "quanto guardar reserva de emergência",
      "onde investir reserva de emergência",
      "liquidez diária",
    ],
    dataPublicacao: "2026-08-18",
    tempoLeituraMin: 5,
    capa: "conceito",
    corpo: [
      p(
        "Reserva de emergência é o dinheiro separado pra imprevisto: perder o emprego, quebrar o carro, uma consulta que o plano não cobre. Ela não existe pra render bem, existe pra estar disponível no dia em que você precisar dela.",
      ),
      h("Quanto guardar"),
      p(
        "A conta parte das suas despesas mensais, não do seu salário. Some o que você realmente gasta por mês (aluguel, comida, transporte, contas) e multiplique por 3 a 6. Quem tem renda fixa e estável fica mais perto de 3; quem é autônomo, tem renda variável ou sustenta outras pessoas se aproxima de 6, ou mais.",
      ),
      w("reserva-emergencia"),
      h("Onde deixar: liquidez importa mais que rentabilidade"),
      p(
        "A reserva precisa de duas coisas: baixo risco e resgate rápido. Isso aponta pra aplicações de liquidez diária, como Tesouro Selic ou CDBs que permitem resgate a qualquer momento. O ponto não é achar o que rende mais, é garantir que o dinheiro esteja lá amanhã, sem prejuízo por sacar na hora errada.",
      ),
      h("O que não serve como reserva"),
      p(
        "Ações, fundos imobiliários e qualquer coisa com preço oscilando não servem: se a emergência coincidir com um mês ruim, você vende no prejuízo. Títulos com vencimento longo e resgate antecipado penalizado também ficam de fora, mesmo sendo de renda fixa.",
      ),
      h("Por que ela vem primeiro"),
      p(
        "Sem reserva, qualquer imprevisto te obriga a desmontar investimentos no pior momento possível, ou a recorrer a crédito caro. É por isso que ela costuma ser tratada como etapa zero: não é um investimento entre outros, é o que protege todos os outros.",
      ),
      p(
        "No simulador do Vestra dá pra aplicar em títulos de liquidez diária com dinheiro fictício e acompanhar o rendimento se acumulando dia a dia, o que ajuda a ver na prática a diferença entre deixar a reserva parada na conta e deixar ela rendendo.",
      ),
    ],
  },
  {
    slug: "juros-compostos-como-funcionam",
    titulo: "Juros compostos: como o tempo faz o trabalho pesado",
    resumo:
      "A diferença entre juro simples e composto, por que começar cedo pesa mais que aportar muito, e como ver isso na prática.",
    palavrasChave: [
      "juros compostos",
      "como funcionam juros compostos",
      "juros simples e compostos",
      "efeito bola de neve investimento",
    ],
    dataPublicacao: "2026-08-18",
    tempoLeituraMin: 5,
    capa: "conceito",
    corpo: [
      p(
        "Juro composto é juro que rende sobre juro. Em vez de o rendimento incidir sempre sobre o valor que você aplicou no início, ele passa a incidir sobre o valor aplicado mais tudo o que já rendeu até ali. É essa diferença que faz o resultado crescer em curva, e não em linha reta.",
      ),
      h("Simples x composto, na prática"),
      p(
        "No juro simples, aplicar R$ 1.000 a 10% ao ano rende R$ 100 todo ano, sempre igual. No composto, o primeiro ano rende R$ 100, o segundo rende sobre R$ 1.100, o terceiro sobre R$ 1.210, e assim por diante. Nos primeiros anos a diferença parece pequena; em duas ou três décadas ela é o que separa os dois resultados por uma distância enorme.",
      ),
      h("Tempo pesa mais que valor"),
      p(
        "Essa é a parte contraintuitiva: quem começa cedo com pouco costuma terminar à frente de quem começa tarde com muito, porque o composto precisa de tempo pra agir. Cada ano a mais de aplicação não adiciona um pedaço igual ao anterior, adiciona um pedaço maior, já que a base sobre a qual o rendimento incide cresceu.",
      ),
      p(
        "Em vez de acreditar na explicação, mexa nos controles abaixo. Repare no que acontece com a linha quando você aumenta os anos, e compare com o efeito de aumentar o valor mensal:",
      ),
      w("juros-compostos"),
      h("Por que retirar no meio custa caro"),
      p(
        "Sacar parte do dinheiro não interrompe só o valor sacado, interrompe também todo o rendimento que aquele valor teria gerado nos anos seguintes. É por isso que o composto e a paciência andam juntos: o efeito depende de deixar o dinheiro trabalhando sem interrupção.",
      ),
      h("O composto também trabalha contra você"),
      p(
        "A mesma matemática rege dívidas. Juro de cartão de crédito e cheque especial é composto, e roda contra o seu bolso na mesma velocidade em que ele rodaria a favor num investimento. Quitar uma dívida caras costuma render mais, em termos práticos, do que qualquer aplicação.",
      ),
      p(
        "A simulação da página inicial do Vestra mostra esse efeito com números: você escolhe um valor mensal e vê quanto sairia do seu bolso e quanto o juro acrescentaria em 30 anos. É a forma mais direta de ver o tamanho da diferença sem precisar fazer a conta na mão.",
      ),
    ],
  },
  {
    slug: "poupanca-vale-a-pena",
    titulo: "Poupança vale a pena? O que ela rende e quando faz sentido",
    resumo:
      "Como a poupança calcula o rendimento, por que ela costuma perder de outras aplicações igualmente seguras, e o que ela tem de bom.",
    palavrasChave: [
      "poupança vale a pena",
      "quanto rende a poupança",
      "poupança ou tesouro direto",
      "rendimento da poupança",
    ],
    dataPublicacao: "2026-08-18",
    tempoLeituraMin: 4,
    capa: "renda-fixa",
    corpo: [
      p(
        "A poupança é a aplicação mais conhecida do país, e também uma das que rendem menos entre as opções de risco parecido. Vale entender como o rendimento dela é calculado, porque a regra não é intuitiva.",
      ),
      h("Como o rendimento é definido"),
      p(
        "A poupança segue uma regra fixada em lei, atrelada à Selic. Quando a Selic está acima de um certo patamar, a poupança rende um percentual fixo ao mês mais a TR; quando está abaixo, passa a render uma fração da Selic. O ponto importante: o rendimento dela não acompanha integralmente a taxa de juros, mesmo quando os juros sobem bastante.",
      ),
      h("O detalhe do aniversário"),
      p(
        "A poupança só credita rendimento na data de aniversário do depósito, uma vez por mês. Se você saca um dia antes, perde o rendimento do mês inteiro daquele valor. Aplicações de liquidez diária, por comparação, rendem proporcionalmente aos dias em que o dinheiro ficou aplicado.",
      ),
      h("O que ela tem de bom"),
      p(
        "Dois pontos reais: é isenta de imposto de renda para pessoa física, e é simples de usar, sem precisar entender produto nenhum. A isenção, porém, raramente compensa a diferença de rentabilidade frente a um título público ou um CDB que pague perto de 100% do CDI, porque a diferença bruta costuma ser maior que o imposto.",
      ),
      p(
        "O comparador abaixo já desconta o imposto de renda das outras opções, então o que aparece é o que sobraria na sua mão em cada uma:",
      ),
      w("comparador-renda-fixa"),
      h("Quando faz sentido"),
      p(
        "Pra quem está começando e ainda não abriu conta em corretora, a poupança é melhor que deixar o dinheiro na conta corrente rendendo zero. Mas ela funciona mais como um degrau do que como destino: assim que existe acesso a renda fixa de liquidez diária, o mesmo dinheiro tende a render mais lá, com risco equivalente.",
      ),
      p(
        "Comparar isso lado a lado ajuda mais que qualquer explicação. No Vestra você aplica em títulos simulados e acompanha o rendimento diário acumulando, o que dá pra contrastar com o que a poupança entregaria no mesmo período.",
      ),
    ],
  },
  {
    slug: "inflacao-ipca-e-seu-dinheiro",
    titulo: "Inflação e IPCA: por que render pouco pode significar perder",
    resumo:
      "O que o IPCA mede, a diferença entre ganho nominal e ganho real, e como proteger o poder de compra do dinheiro.",
    palavrasChave: [
      "inflação",
      "o que é IPCA",
      "ganho real e nominal",
      "proteger dinheiro da inflação",
      "IPCA investimentos",
    ],
    dataPublicacao: "2026-08-18",
    tempoLeituraMin: 5,
    capa: "conceito",
    corpo: [
      p(
        "Inflação é a perda de poder de compra do dinheiro ao longo do tempo: a mesma quantia compra menos coisa depois de um período. No Brasil, o índice oficial que mede isso é o IPCA, calculado pelo IBGE a partir de uma cesta de produtos e serviços que representa o consumo das famílias.",
      ),
      h("Ganho nominal x ganho real"),
      p(
        "Ganho nominal é o número que aparece no extrato. Ganho real é o que sobra depois de descontar a inflação do período, e é ele que diz se você ficou mais rico de verdade. Um investimento que rendeu 8% num ano em que a inflação foi 6% entregou ganho real de aproximadamente 2%, não de 8%.",
      ),
      h("Por que dinheiro parado perde"),
      p(
        "Dinheiro na conta corrente rende zero nominal, o que significa ganho real negativo em qualquer ano com inflação. Não é uma perda visível (o saldo não diminui), mas o que aquele saldo compra vai encolhendo mês a mês. É a forma mais silenciosa de perder dinheiro.",
      ),
      h("Aplicações atreladas à inflação"),
      p(
        "Existem títulos que pagam a inflação mais uma taxa fixa, como o Tesouro IPCA+. A lógica deles é justamente garantir ganho real: independentemente de a inflação vir alta ou baixa, você recebe ela mais um percentual acima. Isso os torna comuns em objetivos de prazo longo, em que a inflação acumulada pesa muito.",
      ),
      h("Prazo curto e prazo longo pedem coisas diferentes"),
      p(
        "Pra dinheiro que vai ser usado logo, inflação importa pouco: alguns meses não mudam muito o poder de compra. Pra dinheiro de dez ou vinte anos, ela é provavelmente o fator mais importante da conta, porque a perda acumulada é grande mesmo com inflação moderada.",
      ),
      p(
        "No simulador do Vestra os títulos de renda fixa rendem com base em taxas reais do mercado, então dá pra acompanhar como diferentes tipos de aplicação se comportam ao longo do tempo, com dinheiro fictício, antes de decidir onde colocar dinheiro de verdade.",
      ),
    ],
  },
  {
    slug: "perfil-de-investidor-qual-o-seu",
    titulo: "Perfil de investidor: conservador, moderado ou arrojado?",
    resumo:
      "O que define seu perfil de verdade, por que ele não é só sobre coragem, e como ele muda ao longo da vida.",
    palavrasChave: [
      "perfil de investidor",
      "conservador moderado arrojado",
      "qual meu perfil de investidor",
      "tolerância ao risco",
    ],
    dataPublicacao: "2026-08-18",
    tempoLeituraMin: 5,
    capa: "bolsa",
    corpo: [
      p(
        "Perfil de investidor é a combinação entre quanto risco você tolera e por quanto tempo o dinheiro pode ficar aplicado. As corretoras costumam classificar em três faixas — conservador, moderado e arrojado — mas o rótulo importa menos que os dois fatores que o formam.",
      ),
      h("Não é só sobre coragem"),
      p(
        "Muita gente responde ao questionário pensando só em quanto aguenta ver o saldo cair. Isso é metade da conta. A outra metade é o prazo: alguém que vai usar o dinheiro em um ano não deveria estar em renda variável, mesmo que tenha estômago de sobra, porque não haveria tempo pra recuperar uma queda.",
      ),
      h("Conservador"),
      p(
        "Prioriza previsibilidade e preservação do valor. Concentra em renda fixa, aceitando rentabilidade menor em troca de saber mais ou menos o que vai receber. É também o perfil natural de qualquer dinheiro de curto prazo, independentemente de quem seja o dono.",
      ),
      h("Moderado"),
      p(
        "Aceita alguma oscilação em parte do patrimônio em busca de retorno maior, mantendo a maior parte em aplicações mais previsíveis. Na prática costuma significar uma carteira majoritariamente de renda fixa com uma fatia em renda variável.",
      ),
      h("Arrojado"),
      p(
        "Tolera quedas relevantes no meio do caminho, apostando em retorno maior no longo prazo. Só faz sentido pra dinheiro que realmente não será tocado por muitos anos, e pra quem não vai vender no pânico durante uma queda, o que é mais difícil na prática do que parece na teoria.",
      ),
      h("O perfil muda"),
      p(
        "Ele não é um traço permanente. Muda quando a sua situação muda: um filho, uma troca de emprego, a aposentadoria se aproximando. Vale revisitar de tempo em tempo, em vez de responder uma vez e assumir que valerá pra sempre.",
      ),
      p(
        "O Vestra tem um quiz de perfil e, mais útil que ele, um ambiente pra testar na prática: dá pra montar uma carteira arrojada com dinheiro fictício e descobrir como você reage a um mês ruim de verdade, sem que isso custe nada.",
      ),
    ],
  },
  {
    slug: "renda-fixa-ou-renda-variavel",
    titulo: "Renda fixa ou renda variável: qual a diferença de verdade",
    resumo:
      "O que separa as duas categorias, por que renda fixa também oscila, e como decidir a proporção entre elas.",
    palavrasChave: [
      "renda fixa ou renda variável",
      "diferença renda fixa e variável",
      "o que é renda variável",
      "alocação de carteira",
    ],
    dataPublicacao: "2026-08-18",
    tempoLeituraMin: 5,
    capa: "mercado",
    corpo: [
      p(
        "A diferença central é a previsibilidade da regra de remuneração. Em renda fixa, você sabe desde a aplicação como o rendimento será calculado (uma taxa fixa, ou a Selic, ou a inflação mais um percentual). Em renda variável, não existe regra: o retorno depende do que acontecer com o preço do ativo.",
      ),
      h("Renda fixa não significa valor fixo"),
      p(
        "Esse é o mal-entendido mais comum. Um título prefixado tem rendimento definido se você levar até o vencimento, mas o preço dele oscila todos os dias no mercado. Vender antes da data pode significar receber menos do que aplicou, especialmente se a taxa de juros subiu no meio do caminho. Renda fixa previsível até o fim, não estável no meio.",
      ),
      h("Renda variável: o retorno vem de duas fontes"),
      p(
        "Em ações e fundos imobiliários, o retorno vem da valorização do preço e da distribuição de resultado (dividendos ou rendimentos). Nenhuma das duas é garantida: empresa pode não dar lucro, imóvel pode ficar vago, e o preço pode passar anos abaixo do que você pagou.",
      ),
      h("Como pensar a proporção"),
      p(
        "Uma forma mais útil que decidir percentuais no vácuo é separar por objetivo e prazo. Dinheiro que você vai usar em menos de dois anos tende a ficar inteiro em renda fixa de baixa oscilação. Dinheiro de prazo longo suporta uma fatia em renda variável, porque há tempo pra atravessar quedas. A proporção sai dessa divisão, não de uma regra genérica.",
      ),
      h("As duas juntas, não uma contra a outra"),
      p(
        "Não é uma escolha excludente. A maioria das carteiras usa as duas, com pesos diferentes conforme o momento de vida: a renda fixa dá o piso e a liquidez, a variável dá o potencial de crescimento acima da inflação no longo prazo.",
      ),
      p(
        "No Vestra as duas convivem no mesmo simulador: você aplica em títulos de renda fixa e compra ações e fundos com o mesmo saldo fictício, o que deixa comparar o comportamento das duas partes da carteira ao longo das semanas.",
      ),
    ],
  },
  {
    slug: "erros-comuns-de-quem-comeca-a-investir",
    titulo: "7 erros comuns de quem está começando a investir",
    resumo:
      "Os tropeços que aparecem com mais frequência entre iniciantes, e o raciocínio por trás de cada um.",
    palavrasChave: [
      "erros ao investir",
      "erros de iniciante investimentos",
      "o que não fazer ao investir",
      "dicas para começar a investir",
    ],
    dataPublicacao: "2026-08-18",
    tempoLeituraMin: 6,
    capa: "mercado",
    corpo: [
      p(
        "A maior parte dos erros de quem começa não tem a ver com escolher o ativo errado, e sim com estrutura: ordem das etapas, prazo, e reação a oscilação. Estes são os que aparecem com mais frequência.",
      ),
      h("1. Investir antes de ter reserva de emergência"),
      p(
        "Sem reserva, o primeiro imprevisto te força a vender investimento na hora errada. A reserva não é uma etapa opcional que se resolve depois; ela é o que permite que o resto da carteira fique intocado quando a vida acontece.",
      ),
      h("2. Investir com dinheiro de curto prazo em renda variável"),
      p(
        "Colocar em ações o dinheiro da entrada do apartamento que você vai dar no ano que vem transforma uma oscilação normal em prejuízo real, porque não há tempo pra esperar recuperação. O prazo do dinheiro define o tipo de aplicação, não o contrário.",
      ),
      h("3. Concentrar tudo numa única aposta"),
      p(
        "Colocar todo o patrimônio numa ação ou num setor faz o resultado inteiro depender de um evento específico dar certo. Diversificar não elimina risco, mas evita que uma única decisão errada apague anos de aporte.",
      ),
      h("4. Comprar porque subiu"),
      p(
        "Perseguir o ativo que mais valorizou nos últimos meses é comprar depois que a alta aconteceu, muitas vezes perto do topo. Rentabilidade passada não é indicação de rentabilidade futura, e isso vale especialmente pra o que acabou de disparar.",
      ),
      h("5. Vender no pânico"),
      p(
        "Vender durante uma queda transforma uma oscilação temporária em perda definitiva, e costuma acontecer justamente quando os preços estão mais baixos. É o erro mais caro da lista, e o mais difícil de evitar, porque é emocional e não técnico.",
      ),
      h("6. Ignorar taxas e imposto"),
      p(
        "Taxa de administração, taxa de custódia e imposto de renda saem do seu rendimento todos os anos. Duas aplicações com rentabilidade bruta parecida podem entregar resultados líquidos bem diferentes, e essa diferença se acumula ao longo do tempo.",
      ),
      h("7. Esperar o momento perfeito pra começar"),
      p(
        "Adiar o início esperando o cenário ideal custa o fator que mais pesa no resultado final: tempo. Começar pequeno e aprender com valores baixos costuma ser melhor que ficar de fora estudando por anos.",
      ),
      p(
        "Vários desses erros são mais fáceis de entender depois de senti-los. O Vestra existe pra isso: você comete o erro com dinheiro fictício, vê o que acontece com a carteira e aprende o mecanismo sem que a lição custe dinheiro de verdade.",
      ),
    ],
  },
  {
    slug: "day-trade-por-que-a-maioria-perde",
    titulo: "Day trade: o que é e por que a maioria perde dinheiro",
    resumo:
      "Como funciona a operação de curtíssimo prazo, o que os estudos mostram sobre o resultado dos day traders, e a tributação diferente.",
    palavrasChave: [
      "day trade",
      "day trade vale a pena",
      "day trade é arriscado",
      "quanto ganha um day trader",
    ],
    dataPublicacao: "2026-08-18",
    tempoLeituraMin: 5,
    capa: "mercado",
    corpo: [
      p(
        "Day trade é comprar e vender o mesmo ativo no mesmo dia, tentando lucrar com a oscilação de preço em horas ou minutos. É diferente de investir: não há tese sobre o negócio da empresa nem prazo longo, o objetivo é acertar a direção do preço no curtíssimo prazo.",
      ),
      h("O que os estudos mostram"),
      p(
        "Pesquisas acadêmicas que acompanharam day traders no mercado brasileiro encontraram um resultado consistente: a grande maioria não consegue lucro sustentável, e a proporção dos que se mantêm lucrativos ao longo de anos é muito pequena. Não é uma questão de esforço ou de método secreto; é o que os dados mostram sobre a atividade.",
      ),
      h("Por que é tão difícil"),
      p(
        "Três fatores se acumulam. Primeiro, cada operação tem custo (corretagem, emolumentos), e operar muitas vezes ao dia multiplica esse custo. Segundo, o adversário do outro lado da tela costuma ser instituição com mais informação e velocidade. Terceiro, o acerto precisa ser frequente: alguns erros grandes apagam muitos acertos pequenos.",
      ),
      h("A tributação é diferente e menos favorável"),
      p(
        "Operação normal de ações tem isenção de imposto de renda se o total vendido no mês ficar até R$ 20.000. Em day trade essa isenção não existe, e a alíquota é 20% sobre o lucro, contra 15% da operação comum. Há ainda retenção na fonte a cada operação com lucro.",
      ),
      h("Alavancagem multiplica os dois lados"),
      p(
        "Muitas plataformas permitem operar valores maiores que o saldo disponível. Isso amplia o ganho potencial e, na mesma proporção, a perda: é possível perder mais do que se tinha, virando dívida com a corretora.",
      ),
      h("O que fazer se ainda quiser testar"),
      p(
        "Se a curiosidade existe, testar em simulador antes é o caminho de menor custo: você observa quantas operações dão certo, quanto os custos consomem, e como você reage a uma sequência de perdas, tudo sem dinheiro real envolvido.",
      ),
      p(
        "No Vestra dá pra fazer esse teste com preços reais de mercado e saldo fictício. Não é uma recomendação pra operar assim — é a chance de descobrir na prática, e de graça, o que os números acima descrevem.",
      ),
    ],
  },
];

export function postPorSlug(slug: string): PostBlog | undefined {
  return POSTS_BLOG.find((p) => p.slug === slug);
}
