/**
 * Horario de pregao da B3 (aproximado, ignora feriados): seg-sex,
 * 10:00-18:00 no horario de Brasilia. O Brasil nao usa mais horario de
 * verao desde 2019, entao America/Sao_Paulo e sempre UTC-3.
 */
const ABRE_HORA = 10;
const FECHA_HORA = 18;

export type StatusMercado = {
  aberto: boolean;
  mensagem: string;
};

function paraBRT(data: Date): Date {
  return new Date(data.getTime() - 3 * 60 * 60 * 1000);
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

export function statusMercado(agora: Date): StatusMercado {
  const brt = paraBRT(agora);
  const diaSemana = brt.getUTCDay(); // 0=domingo ... 6=sabado
  const hora = brt.getUTCHours();
  const util = diaSemana >= 1 && diaSemana <= 5;

  if (util && hora >= ABRE_HORA && hora < FECHA_HORA) {
    const fechamento = new Date(brt);
    fechamento.setUTCHours(FECHA_HORA, 0, 0, 0);
    const faltam = fechamento.getTime() - brt.getTime();
    return { aberto: true, mensagem: `Mercado aberto · fecha em ${formatarContagem(faltam)}` };
  }

  // Proxima abertura: hoje mais tarde, ou o proximo dia util as 10h.
  const proximaAbertura = new Date(brt);
  proximaAbertura.setUTCHours(ABRE_HORA, 0, 0, 0);
  if (util && hora < ABRE_HORA) {
    // ainda da tempo hoje
  } else {
    do {
      proximaAbertura.setUTCDate(proximaAbertura.getUTCDate() + 1);
    } while (proximaAbertura.getUTCDay() === 0 || proximaAbertura.getUTCDay() === 6);
  }

  const faltam = proximaAbertura.getTime() - brt.getTime();
  return { aberto: false, mensagem: `Mercado fechado · abre em ${formatarContagem(faltam)}` };
}
