/**
 * Tipos e regras puras do Vestra Challenge (competicoes com carteira
 * propria). As mesmas regras sao reforcadas no banco, em
 * supabase/migracoes/009_challenge.sql; aqui elas existem so pra dar
 * resposta rapida no formulario, antes de ir ao servidor.
 */

export type StatusCompeticao = "agendada" | "aberta" | "encerrada";

export type LinhaRanking = {
  posicao: number;
  apelido: string;
  patrimonio: number;
  retornoPct: number;
  ordens: number;
  souEu: boolean;
};

export type PosicaoCompeticao = {
  ticker: string;
  quantidade: number;
  precoMedio: number;
  precoAtual: number;
  valor: number;
};

export type CarteiraCompeticao = {
  caixa: number;
  patrimonio: number;
  retornoPct: number;
  posicoes: PosicaoCompeticao[];
};

export type OrdemCompeticao = {
  id: string;
  apelido: string;
  ticker: string;
  tipo: "compra" | "venda";
  quantidade: number;
  preco: number;
  total: number;
  tese: string | null;
  executadaEm: string;
};

export type Competicao = {
  ok: true;
  nome: string;
  codigo: string;
  oficial: boolean;
  capitalInicial: number;
  inicio: string;
  fim: string;
  status: StatusCompeticao;
  finalizada: boolean;
  dominioEmail: string | null;
  teseObrigatoria: boolean;
  totalParticipantes: number;
  souOrganizador: boolean;
  souParticipante: boolean;
  ranking: LinhaRanking[];
  carteira: CarteiraCompeticao | null;
  ordens: OrdemCompeticao[] | null;
};

export type ResumoCompeticao = {
  codigo: string;
  nome: string;
  oficial: boolean;
  inicio: string;
  fim: string;
  status: StatusCompeticao;
  souOrganizador: boolean;
  participo: boolean;
  totalParticipantes: number;
};

export type EdicaoOficial = {
  codigo: string;
  nome: string;
  inicio: string;
  fim: string;
  capitalInicial: number;
  status: StatusCompeticao;
  totalParticipantes: number;
  podio: { posicao: number; apelido: string; retornoPct: number }[];
};

/**
 * Qual edicao oficial destacar no topo de /challenge: a que esta em
 * andamento; se nenhuma, a proxima agendada (a mais proxima de comecar).
 * A lista chega do banco ordenada por inicio decrescente.
 */
export function edicaoEmDestaque(edicoes: EdicaoOficial[]): EdicaoOficial | null {
  const aberta = edicoes.find((e) => e.status === "aberta");
  if (aberta) return aberta;
  const agendadas = edicoes.filter((e) => e.status === "agendada");
  return agendadas.length > 0 ? agendadas[agendadas.length - 1] : null;
}

export const ROTULO_STATUS: Record<StatusCompeticao, string> = {
  agendada: "Ainda não começou",
  aberta: "Em andamento",
  encerrada: "Encerrada",
};

export const TESE_MINIMA = 15;
export const TESE_MAXIMA = 500;
export const DURACAO_MAXIMA_DIAS = 120;
export const CAPITAL_MINIMO = 1_000;
export const CAPITAL_MAXIMO = 10_000_000;

const DIA_MS = 24 * 60 * 60 * 1000;
const DOMINIO = /^[a-z0-9.-]+\.[a-z]{2,}$/;

/** "@Mackenzie.br " vira "mackenzie.br"; vazio vira null. */
export function normalizarDominio(valor: string): string | null {
  const limpo = valor.trim().toLowerCase().replace(/^@+/, "");
  return limpo === "" ? null : limpo;
}

export type DadosNovaCompeticao = {
  nome: string;
  inicio: Date;
  fim: Date;
  capital: number;
  dominioEmail: string;
};

/** Devolve a primeira mensagem de erro, ou null se esta tudo certo. */
export function validarNovaCompeticao(d: DadosNovaCompeticao, agora = Date.now()): string | null {
  if (d.nome.trim().length < 3) return "Dê um nome com pelo menos 3 letras.";
  if (Number.isNaN(d.inicio.getTime()) || Number.isNaN(d.fim.getTime())) {
    return "Preencha a data de início e de fim.";
  }
  if (d.inicio.getTime() < agora - 60 * 60 * 1000) return "O início não pode ficar no passado.";
  if (d.fim.getTime() <= d.inicio.getTime()) return "O fim precisa ser depois do início.";
  if (d.fim.getTime() - d.inicio.getTime() > DURACAO_MAXIMA_DIAS * DIA_MS) {
    return `A competição pode durar no máximo ${DURACAO_MAXIMA_DIAS} dias.`;
  }
  if (!Number.isFinite(d.capital) || d.capital < CAPITAL_MINIMO || d.capital > CAPITAL_MAXIMO) {
    return "O capital inicial precisa ficar entre R$ 1.000 e R$ 10.000.000.";
  }
  const dominio = normalizarDominio(d.dominioEmail);
  if (dominio && !DOMINIO.test(dominio)) {
    return "Domínio de e-mail inválido. Use algo como mackenzie.br.";
  }
  return null;
}

export type DadosOrdem = {
  ticker: string;
  quantidade: number;
  tese: string;
  teseObrigatoria: boolean;
};

export function validarOrdem(d: DadosOrdem): string | null {
  if (!/^[A-Z][A-Z0-9]{0,6}$/.test(d.ticker.trim().toUpperCase())) {
    return "Informe o código do ativo (ex: PETR4 ou AAPL).";
  }
  if (!Number.isInteger(d.quantidade) || d.quantidade <= 0) {
    return "A quantidade precisa ser de pelo menos 1 cota.";
  }
  if (d.teseObrigatoria && d.tese.trim().length < TESE_MINIMA) {
    return `Escreva sua tese, com pelo menos ${TESE_MINIMA} caracteres: por que essa operação?`;
  }
  return null;
}

/** Texto curto de prazo: "começa em 3 dias", "termina em 5 horas", "encerrada". */
export function descreverPrazo(inicio: string, fim: string, agora = Date.now()): string {
  const ini = new Date(inicio).getTime();
  const end = new Date(fim).getTime();
  if (agora < ini) return `começa ${emQuanto(ini - agora)}`;
  if (agora < end) return `termina ${emQuanto(end - agora)}`;
  return "encerrada";
}

function emQuanto(ms: number): string {
  const horas = Math.ceil(ms / (60 * 60 * 1000));
  if (horas < 1) return "em menos de 1 hora";
  if (horas < 48) return `em ${horas} ${horas === 1 ? "hora" : "horas"}`;
  const dias = Math.ceil(ms / DIA_MS);
  return `em ${dias} dias`;
}
