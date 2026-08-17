/**
 * Lista curada de FIIs (Fundos de Investimento Imobiliario). Sao
 * negociados na B3 exatamente como acoes (ticker terminado em 11), entao
 * reaproveitam toda a infraestrutura de cotacao/compra/venda: so
 * precisam de uma lista com explicacao, igual a de acoes.ts.
 */
export type Fii = {
  ticker: string;
  nome: string;
  tipo: string;
  explica: string;
};

export const FIIS: Fii[] = [
  {
    ticker: "HGLG11",
    nome: "CSHG Logística",
    tipo: "Logística",
    explica:
      "Dono de galpões alugados pra empresas de logística e distribuição (tipo centros de armazenamento). Ganha com o aluguel repassado aos cotistas todo mês.",
  },
  {
    ticker: "MXRF11",
    nome: "Maxi Renda",
    tipo: "Papel (CRI)",
    explica:
      "Não tem imóvel: empresta dinheiro pro setor imobiliário via títulos de crédito (CRI), e repassa os juros recebidos. Um dos FIIs mais populares do país.",
  },
  {
    ticker: "KNRI11",
    nome: "Kinea Renda Imobiliária",
    tipo: "Híbrido",
    explica:
      "Mistura galpões logísticos com lajes corporativas (prédios de escritório), diversificando entre dois tipos de imóvel dentro do mesmo fundo.",
  },
  {
    ticker: "XPML11",
    nome: "XP Malls",
    tipo: "Shopping",
    explica:
      "Dono de participações em shoppings centers pelo Brasil. O rendimento acompanha de perto as vendas e a taxa de ocupação dos shoppings.",
  },
  {
    ticker: "VISC11",
    nome: "Vinci Shopping Centers",
    tipo: "Shopping",
    explica:
      "Outro fundo de shoppings, com uma carteira de participações espalhada em diferentes cidades, reduzindo a dependência de um único shopping.",
  },
  {
    ticker: "BTLG11",
    nome: "BTG Pactual Logística",
    tipo: "Logística",
    explica:
      "Outro fundo de galpões logísticos, com contratos de aluguel de longo prazo com grandes empresas de varejo e e-commerce.",
  },
  {
    ticker: "HGRE11",
    nome: "CSHG Real Estate",
    tipo: "Lajes corporativas",
    explica:
      "Foco em prédios de escritório (lajes corporativas) em regiões nobres de São Paulo. O rendimento depende de manter os escritórios alugados.",
  },
  {
    ticker: "RBRR11",
    nome: "RBR Rendimento High Grade",
    tipo: "Papel (CRI)",
    explica:
      "Também investe em títulos de crédito imobiliário (CRI), com foco em devedores considerados mais sólidos (\"high grade\"), buscando previsibilidade no rendimento.",
  },
  {
    ticker: "VILG11",
    nome: "Vinci Logística",
    tipo: "Logística",
    explica:
      "Mais um fundo de galpões logísticos, setor que cresceu bastante com o avanço do e-commerce no Brasil.",
  },
  {
    ticker: "HFOF11",
    nome: "Hedge Fundo de Fundos",
    tipo: "Fundo de fundos",
    explica:
      "Em vez de imóveis ou papéis diretamente, compra cotas de OUTROS FIIs. Uma forma de diversificar entre vários fundos com uma única compra.",
  },
];

export function fiiPorTicker(ticker: string): Fii | undefined {
  return FIIS.find((f) => f.ticker === ticker);
}
