import type { Acao } from "./acoes";

/**
 * Lista curada de acoes americanas (NYSE/NASDAQ), mesmo espirito da lista
 * da B3: poucas empresas conhecidas, explicadas em portugues. Precos vem
 * convertidos pra R$ (o banco ja faz essa conversao, ver garantir_cotacao).
 */
export const ACOES_USA: Acao[] = [
  {
    ticker: "AAPL",
    nome: "Apple",
    setor: "Tecnologia",
    explica: "Vende iPhone, Mac e serviços. A maior empresa de tecnologia do mundo em valor de mercado.",
  },
  {
    ticker: "MSFT",
    nome: "Microsoft",
    setor: "Tecnologia",
    explica: "Windows, Office e a nuvem Azure. Boa parte do lucro hoje vem de serviços em nuvem, não de software vendido em caixa.",
  },
  {
    ticker: "GOOGL",
    nome: "Alphabet (Google)",
    setor: "Tecnologia",
    explica: "Dona do Google e do YouTube. Ganha dinheiro principalmente com publicidade.",
  },
  {
    ticker: "AMZN",
    nome: "Amazon",
    setor: "Varejo",
    explica: "Do e-commerce à computação em nuvem (AWS). A nuvem é onde está boa parte do lucro.",
  },
  {
    ticker: "NVDA",
    nome: "Nvidia",
    setor: "Tecnologia",
    explica: "Fabrica os chips que rodam boa parte da inteligência artificial do mundo hoje.",
  },
  {
    ticker: "TSLA",
    nome: "Tesla",
    setor: "Automóveis",
    explica: "Carros elétricos e baterias. Costuma balançar bem mais que a média do mercado.",
  },
  {
    ticker: "META",
    nome: "Meta (Facebook)",
    setor: "Tecnologia",
    explica: "Dona do Facebook, Instagram e WhatsApp. Também ganha principalmente com publicidade.",
  },
  {
    ticker: "JPM",
    nome: "JPMorgan Chase",
    setor: "Bancos",
    explica: "Um dos maiores bancos dos Estados Unidos, parecido em espírito com um Itaú de lá.",
  },
  {
    ticker: "KO",
    nome: "Coca-Cola",
    setor: "Bebidas",
    explica: "Vende bebida em praticamente todo país do mundo. Costuma balançar pouco e pagar dividendo com frequência.",
  },
  {
    ticker: "DIS",
    nome: "Disney",
    setor: "Entretenimento",
    explica: "Parques, filmes e streaming (Disney+). Depende bastante de quanto as pessoas estão dispostas a gastar com lazer.",
  },
  {
    ticker: "NFLX",
    nome: "Netflix",
    setor: "Entretenimento",
    explica: "Streaming de vídeo. Cresce ou desacelera junto com o número de assinantes que consegue manter.",
  },
  {
    ticker: "V",
    nome: "Visa",
    setor: "Financeiro",
    explica: "Não empresta dinheiro, processa os pagamentos com cartão. Ganha uma taxinha em cada transação.",
  },
];
