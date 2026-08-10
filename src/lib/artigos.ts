/**
 * Artigos educativos curtos, conteudo original escrito pro Vestra, no
 * mesmo espirito das materias do Investopedia, so que em portugues
 * informal e em escala bem menor (poucos artigos, nao 36 mil).
 */
export type PerguntaQuiz = {
  pergunta: string;
  opcoes: string[];
  /** Indice (0-based) da opcao correta em `opcoes`. */
  correta: number;
};

export type Artigo = {
  slug: string;
  titulo: string;
  resumo: string;
  corpo: string[];
  quiz: PerguntaQuiz[];
};

export const ARTIGOS: Artigo[] = [
  {
    slug: "por-onde-comecar",
    titulo: "Por onde começar a investir",
    resumo:
      "Antes de escolher uma ação, tem duas ou três decisões que importam bem mais.",
    corpo: [
      "A pergunta mais comum de quem começa é \"em que ação eu compro?\". Mas antes disso tem perguntas mais importantes: você tem uma reserva de emergência? Sabe pra quando é esse dinheiro: daqui a um ano ou daqui a vinte?",
      "Se a resposta for \"não tenho reserva\", o primeiro investimento nem devia ser em ações. Faz mais sentido guardar uns meses de gasto num lugar de liquidez alta e renda fixa, tipo Tesouro Selic, antes de qualquer outra coisa.",
      "Depois disso resolvido, o tamanho do prazo muda tudo. Dinheiro que você pode precisar em seis meses não deveria estar em renda variável, porque o preço pode estar baixo bem na hora que você precisar sacar. Dinheiro que só vai fazer falta daqui a dez anos aguenta balançar no caminho.",
      "Só depois de organizar isso é que faz sentido pensar em ações específicas, e mesmo aí, começar pequeno, com uma empresa que você entende o que faz, costuma valer mais que tentar acertar a próxima ação da moda.",
    ],
    quiz: [
      {
        pergunta: "Antes de comprar a primeira ação, o que costuma importar mais?",
        opcoes: [
          "Ter uma reserva de emergência e saber o prazo do dinheiro",
          "Escolher a ação que mais subiu no último mês",
          "Investir o máximo possível de uma vez",
        ],
        correta: 0,
      },
      {
        pergunta: "Dinheiro que você pode precisar em 6 meses deveria estar em:",
        opcoes: [
          "Ações de empresas em crescimento",
          "Renda fixa de liquidez alta",
          "Não importa, o prazo não muda nada",
        ],
        correta: 1,
      },
    ],
  },
  {
    slug: "renda-fixa-vs-variavel",
    titulo: "Renda fixa e renda variável: a diferença de verdade",
    resumo:
      "Não é sobre uma ser \"melhor\" que a outra: é sobre o que cada uma promete.",
    corpo: [
      "Renda fixa quer dizer que a regra do rendimento já está combinada desde o início. Um CDB que paga 110% do CDI, por exemplo: você sabe exatamente a fórmula que vai definir o quanto recebe.",
      "Renda variável não promete nada. Uma ação pode valorizar 30% num ano ou cair 20%; ninguém assina embaixo de um número antes.",
      "Isso não faz da renda fixa \"segura\" e da variável \"arriscada\" de forma automática: depende do emissor, do prazo, de várias coisas. Mas ajuda a entender por que elas servem pra objetivos diferentes: a fixa costuma segurar o dinheiro que você não pode se dar ao luxo de perder; a variável entra quando você tem tempo de esperar as oscilações passarem.",
      "A maioria das carteiras saudáveis tem as duas. A pergunta não é \"qual escolher\", é \"quanto de cada, pro meu momento de vida\".",
    ],
    quiz: [
      {
        pergunta: "O que define a renda fixa?",
        opcoes: [
          "Ela nunca perde valor",
          "A regra do rendimento já é combinada desde o início",
          "Ela sempre rende mais que ações",
        ],
        correta: 1,
      },
      {
        pergunta: "Por que a maioria das carteiras tem renda fixa e variável junto?",
        opcoes: [
          "Porque uma é sempre melhor que a outra",
          "Porque elas servem pra objetivos diferentes, dependendo do prazo",
          "Porque é obrigatório por lei",
        ],
        correta: 1,
      },
    ],
  },
  {
    slug: "diversificar-de-verdade",
    titulo: "Diversificar não é só \"colocar em vários lugares\"",
    resumo:
      "Ter dez ações de banco não é diversificação. É concentração disfarçada.",
    corpo: [
      "Um erro comum é achar que diversificar significa ter várias posições diferentes. Mas se você tem ações de cinco bancos, na prática está apostando numa coisa só: como vai o setor bancário.",
      "Diversificar de verdade é buscar ativos que não sobem e descem pelo mesmo motivo. Uma ação de banco e uma de exportadora de commodities reagem de jeitos diferentes a uma alta do dólar, por exemplo.",
      "Isso não elimina o risco, nada elimina. Mas evita que um único evento (uma crise no setor bancário, digamos) derrube a carteira inteira de uma vez.",
      "Vale lembrar também que diversificação tem limite de utilidade: depois de um certo número de ativos bem escolhidos, adicionar mais um não reduz muito mais o risco, só deixa a carteira mais difícil de acompanhar.",
    ],
    quiz: [
      {
        pergunta: "Ter dez ações de banco diferentes é diversificação de verdade?",
        opcoes: [
          "Sim, são dez empresas diferentes",
          "Não, é concentração disfarçada num só setor",
          "Só se todas pagarem dividendo",
        ],
        correta: 1,
      },
      {
        pergunta: "Diversificar de verdade significa buscar ativos que:",
        opcoes: [
          "Sobem e descem pelo mesmo motivo",
          "Não sobem e descem pelo mesmo motivo",
          "Têm sempre o mesmo preço",
        ],
        correta: 1,
      },
    ],
  },
  {
    slug: "selic-sobe-desce",
    titulo: "O que muda quando a Selic sobe ou desce",
    resumo:
      "A taxa básica de juros mexe com muito mais coisa do que só a poupança.",
    corpo: [
      "Quando a Selic sobe, investir em renda fixa fica mais atraente: os títulos passam a pagar mais. Isso puxa dinheiro pra longe da bolsa, porque comparado a um retorno maior e mais previsível, o risco da renda variável passa a exigir uma recompensa ainda maior pra valer a pena.",
      "Também fica mais caro pras empresas pegarem empréstimo, o que pode frear planos de expansão e pesar no lucro futuro, outro motivo pra ações caírem quando os juros sobem.",
      "Quando a Selic cai, o caminho tende a ser o oposto: renda fixa rende menos, e a bolsa volta a parecer mais interessante em comparação.",
      "Não é uma regra matemática exata (outros fatores entram na conta), mas entender essa relação ajuda a explicar por que notícia sobre juros sempre mexe com o mercado inteiro.",
    ],
    quiz: [
      {
        pergunta: "Quando a Selic sobe, o que costuma acontecer com a bolsa?",
        opcoes: [
          "Costuma atrair mais dinheiro pra bolsa",
          "Costuma puxar dinheiro pra longe da bolsa, em direção à renda fixa",
          "Não tem relação nenhuma",
        ],
        correta: 1,
      },
      {
        pergunta: "Selic mais alta deixa mais caro pras empresas:",
        opcoes: [
          "Pagar dividendo",
          "Pegar empréstimo",
          "Contratar funcionários",
        ],
        correta: 1,
      },
    ],
  },
  {
    slug: "erros-comuns-iniciante",
    titulo: "Erros mais comuns de quem está começando",
    resumo:
      "Quase todo mundo passa por pelo menos um desses.",
    corpo: [
      "Comprar por notícia. Quando uma ação já está estampada em manchete de tanto que subiu, boa parte do movimento já aconteceu, comprar ali é entrar tarde na festa.",
      "Vender no pânico. Uma queda de 10% dói, mas vender justamente no fundo do poço transforma uma perda de papel numa perda de verdade.",
      "Não entender o que comprou. Se você não consegue explicar em duas frases o que a empresa faz e como ela ganha dinheiro, é sinal de que talvez seja cedo pra ter aquela ação na carteira.",
      "Confundir sorte com estratégia. Acertar uma ação que triplicou de valor sente bem, mas nem sempre quer dizer que a decisão foi boa: às vezes foi só sorte, e repetir o comportamento sem entender o porquê custa caro no médio prazo.",
    ],
    quiz: [
      {
        pergunta: "Por que comprar uma ação só porque ela virou manchete é arriscado?",
        opcoes: [
          "Porque manchete é sempre mentira",
          "Porque boa parte do movimento provavelmente já aconteceu",
          "Porque manchetes são ilegais",
        ],
        correta: 1,
      },
      {
        pergunta: "Vender uma ação em pânico durante uma queda de 10%:",
        opcoes: [
          "Garante que você não perde mais nada",
          "Transforma uma perda de papel numa perda de verdade",
          "É sempre a atitude certa",
        ],
        correta: 1,
      },
    ],
  },
  {
    slug: "ler-grafico-sem-se-perder",
    titulo: "Como ler o gráfico de uma ação sem se perder",
    resumo:
      "Você não precisa ser analista técnico pra tirar informação útil de uma linha.",
    corpo: [
      "O básico: o eixo de baixo é tempo, o de lado é preço. Uma linha subindo da esquerda pra direita significa que o preço estava mais baixo no passado e mais alto agora, parece óbvio, mas é o primeiro instinto que trava em quem nunca olhou um gráfico antes.",
      "Preste atenção na escala do preço, não só no formato da linha. Uma variação de 2% pode parecer um Everest ou uma reta quase plana dependendo de como o gráfico foi desenhado.",
      "Períodos maiores contam histórias diferentes de períodos menores. Uma ação pode estar em queda no último mês e em alta forte no último ano, nenhuma das duas visões é \"a errada\", são só janelas de tempo diferentes.",
      "E o mais importante: um gráfico mostra o que já aconteceu, não o que vai acontecer. Ele é útil pra dar contexto, não uma bola de cristal.",
    ],
    quiz: [
      {
        pergunta: "Numa linha de preço subindo da esquerda pra direita, isso significa:",
        opcoes: [
          "O preço estava mais baixo no passado e mais alto agora",
          "A ação vai continuar subindo pra sempre",
          "O gráfico está errado",
        ],
        correta: 0,
      },
      {
        pergunta: "Um gráfico de preço mostra:",
        opcoes: [
          "O que vai acontecer no futuro",
          "O que já aconteceu no passado",
          "O lucro exato da empresa",
        ],
        correta: 1,
      },
    ],
  },
];
