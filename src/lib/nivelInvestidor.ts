export type Nivel = { nome: string; cor: string };

// Tons pensados pra contrastar sobre o fundo azul-escuro do topo do simulador.
const NIVEIS: Nivel[] = [
  { nome: "Iniciante", cor: "#a9b4bf" },
  { nome: "Explorador", cor: "#4fc7b3" },
  { nome: "Investidor", cor: "#6fb4e8" },
  { nome: "Avançado", cor: "var(--color-gold)" },
];

/** Nivel de progressao calculado so a partir de conquistas ja desbloqueadas (sem tabela nova). */
export function calcularNivel(conquistasConcluidas: number): Nivel {
  if (conquistasConcluidas >= 6) return NIVEIS[3];
  if (conquistasConcluidas >= 4) return NIVEIS[2];
  if (conquistasConcluidas >= 2) return NIVEIS[1];
  return NIVEIS[0];
}
