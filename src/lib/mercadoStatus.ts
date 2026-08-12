/**
 * Horario de pregao de cada bolsa (aproximado, ignora feriados):
 * B3 (Brasil): seg-sex, 10:00-18:00 em America/Sao_Paulo (o Brasil nao
 * usa mais horario de verao desde 2019, entao e sempre UTC-3).
 * NYSE/NASDAQ (EUA): seg-sex, 9:30-16:00 em America/New_York, que
 * alterna entre UTC-5 (horario padrao) e UTC-4 (horario de verao
 * americano) ao longo do ano, por isso o deslocamento e calculado a
 * cada chamada via Intl em vez de fixo.
 */
export type Mercado = "br" | "us";

const HORARIOS: Record<Mercado, { abreHora: number; abreMinuto: number; fechaHora: number; fechaMinuto: number }> = {
  br: { abreHora: 10, abreMinuto: 0, fechaHora: 18, fechaMinuto: 0 },
  us: { abreHora: 9, abreMinuto: 30, fechaHora: 16, fechaMinuto: 0 },
};

export type StatusMercado = {
  aberto: boolean;
  mensagem: string;
};

/** Detecta o mercado pelo FORMATO do ticker: B3 termina em digito (PETR4), EUA e so letras (AAPL). */
export function mercadoDoTicker(ticker: string): Mercado {
  return /^[A-Z]{4}[0-9]{1,2}$/.test(ticker.trim().toUpperCase()) ? "br" : "us";
}

function offsetHorasNY(data: Date): number {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    timeZoneName: "shortOffset",
  }).formatToParts(data);
  const nome = partes.find((p) => p.type === "timeZoneName")?.value ?? "GMT-5";
  const match = nome.match(/GMT([+-]\d+)/);
  return match ? Number(match[1]) : -5;
}

/** Desloca um instante UTC pro horario local de cada bolsa, mantendo os getUTC* como se fossem hora local. */
function paraHorarioLocal(data: Date, mercado: Mercado): Date {
  const offsetHoras = mercado === "br" ? -3 : offsetHorasNY(data);
  return new Date(data.getTime() + offsetHoras * 60 * 60 * 1000);
}

function formatarContagem(ms: number): string {
  const minutosTotais = Math.floor(ms / 60_000);
  const dias = Math.floor(minutosTotais / (60 * 24));
  const horas = Math.floor((minutosTotais % (60 * 24)) / 60);
  const minutos = minutosTotais % 60;

  if (dias > 0) return `${dias}d ${horas}h ${minutos}min`;
  if (horas > 0) return `${horas}h ${minutos}min`;
  return `${minutos}min`;
}

export function statusMercado(agora: Date, mercado: Mercado = "br"): StatusMercado {
  const { abreHora, abreMinuto, fechaHora, fechaMinuto } = HORARIOS[mercado];
  const local = paraHorarioLocal(agora, mercado);
  const diaSemana = local.getUTCDay(); // 0=domingo ... 6=sabado
  const minutosDoDia = local.getUTCHours() * 60 + local.getUTCMinutes();
  const abreMinutos = abreHora * 60 + abreMinuto;
  const fechaMinutos = fechaHora * 60 + fechaMinuto;
  const util = diaSemana >= 1 && diaSemana <= 5;

  if (util && minutosDoDia >= abreMinutos && minutosDoDia < fechaMinutos) {
    const fechamento = new Date(local);
    fechamento.setUTCHours(fechaHora, fechaMinuto, 0, 0);
    const faltam = fechamento.getTime() - local.getTime();
    return { aberto: true, mensagem: `Mercado aberto · fecha em ${formatarContagem(faltam)}` };
  }

  // Proxima abertura: hoje mais tarde, ou o proximo dia util no horario de abertura.
  const proximaAbertura = new Date(local);
  proximaAbertura.setUTCHours(abreHora, abreMinuto, 0, 0);
  if (util && minutosDoDia < abreMinutos) {
    // ainda da tempo hoje
  } else {
    do {
      proximaAbertura.setUTCDate(proximaAbertura.getUTCDate() + 1);
    } while (proximaAbertura.getUTCDay() === 0 || proximaAbertura.getUTCDay() === 6);
  }

  const faltam = proximaAbertura.getTime() - local.getTime();
  return { aberto: false, mensagem: `Mercado fechado · abre em ${formatarContagem(faltam)}` };
}
