/**
 * Quiz simples de perfil de investidor. Cada resposta vale de 1 a 4
 * pontos (mais conservador a mais arrojado); a soma decide o perfil.
 */
export type Pergunta = {
  id: string;
  texto: string;
  opcoes: { texto: string; pontos: number }[];
};

export const PERGUNTAS: Pergunta[] = [
  {
    id: "queda",
    texto: "Se sua carteira caísse 15% em um mês, o que você faria?",
    opcoes: [
      { texto: "Venderia tudo, não aguentaria ver perdendo mais", pontos: 1 },
      { texto: "Ficaria preocupado, mas esperaria um pouco antes de decidir", pontos: 2 },
      { texto: "Manteria a calma e esperaria recuperar", pontos: 3 },
      { texto: "Aproveitaria pra comprar mais, já que ficou mais barato", pontos: 4 },
    ],
  },
  {
    id: "prazo",
    texto: "Por quanto tempo pretende deixar esse dinheiro investido, sem precisar dele?",
    opcoes: [
      { texto: "Menos de 1 ano", pontos: 1 },
      { texto: "De 1 a 3 anos", pontos: 2 },
      { texto: "De 3 a 10 anos", pontos: 3 },
      { texto: "Mais de 10 anos", pontos: 4 },
    ],
  },
  {
    id: "frase",
    texto: "Qual frase combina mais com você?",
    opcoes: [
      { texto: "Prefiro ganhar pouco, mas ter certeza que não vou perder", pontos: 1 },
      { texto: "Aceito perder um pouco se puder ganhar mais no médio prazo", pontos: 2 },
      { texto: "Topo boas variações se isso significar retorno maior no longo prazo", pontos: 3 },
      { texto: "Quanto mais risco, mais interessante — busco crescimento agressivo", pontos: 4 },
    ],
  },
  {
    id: "reserva",
    texto: "Você já tem uma reserva de emergência (uns 6 meses de gastos guardados em algo líquido)?",
    opcoes: [
      { texto: "Não tenho nenhuma reserva", pontos: 1 },
      { texto: "Tenho uma reserva pequena", pontos: 2 },
      { texto: "Tenho uma reserva confortável", pontos: 3 },
      { texto: "Tenho de sobra, e ainda mais investido em renda fixa", pontos: 4 },
    ],
  },
  {
    id: "motivo",
    texto: "O que mais te motiva a investir?",
    opcoes: [
      { texto: "Não perder poder de compra pra inflação", pontos: 1 },
      { texto: "Ter uma renda extra estável no futuro", pontos: 2 },
      { texto: "Fazer o dinheiro crescer de forma consistente", pontos: 3 },
      { texto: "Multiplicar o patrimônio, mesmo assumindo risco", pontos: 4 },
    ],
  },
];

export type PerfilId = "conservador" | "moderado" | "arrojado";

export type Perfil = {
  id: PerfilId;
  nome: string;
  descricao: string;
  tickers: string[];
};

export const PERFIS: Record<PerfilId, Perfil> = {
  conservador: {
    id: "conservador",
    nome: "Conservador",
    descricao:
      "Você prioriza não perder dinheiro acima de tudo. Faz sentido buscar empresas grandes, de setores estáveis e com histórico de pagar dividendos — não ativos que balançam muito de um dia pro outro.",
    tickers: ["ITUB4", "EQTL3", "RADL3", "ABEV3"],
  },
  moderado: {
    id: "moderado",
    nome: "Moderado",
    descricao:
      "Você aceita alguma oscilação em troca de um retorno melhor, mas sem exagerar. Uma mistura de empresas sólidas com um pouco mais de exposição a setores cíclicos tende a combinar com você.",
    tickers: ["BBDC4", "WEGE3", "B3SA3", "BBAS3"],
  },
  arrojado: {
    id: "arrojado",
    nome: "Arrojado",
    descricao:
      "Você tem estômago pra balanço forte de preço em troca de um potencial de crescimento maior. Setores mais cíclicos e sensíveis a commodities ou consumo tendem a combinar com esse perfil.",
    tickers: ["MGLU3", "PRIO3", "VALE3", "RAIL3"],
  },
};

export function calcularPerfil(respostas: Record<string, number>): Perfil {
  const pontos = Object.values(respostas).reduce((s, p) => s + p, 0);
  if (pontos <= 9) return PERFIS.conservador;
  if (pontos <= 15) return PERFIS.moderado;
  return PERFIS.arrojado;
}
