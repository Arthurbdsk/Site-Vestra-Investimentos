/**
 * Quantas conquistas concluidas cada funcao avancada do simulador
 * precisa pra desbloquear. Fica num lugar so pra o painel (que trava
 * as abas) e o popup de celebracao (que avisa quando uma nova abre)
 * usarem a mesma fonte.
 *
 * TRAVAS_LIGADAS = false libera todas as abas desde o primeiro acesso
 * (desligado para a apresentacao nas escolas, pra quem chega ver tudo).
 * Pra voltar a travar, e so trocar pra true.
 */
const TRAVAS_LIGADAS = false;

const TRAVAS: { aba: string; minimo: number; label: string }[] = [
  { aba: "planejador", minimo: 2, label: "Planejador" },
  { aba: "e-se", minimo: 2, label: "E se eu tivesse investido antes?" },
  { aba: "ranking", minimo: 2, label: "Ranking" },
  { aba: "duelo", minimo: 4, label: "Duelo" },
  { aba: "emprestimo", minimo: 4, label: "Empréstimo" },
  { aba: "agente", minimo: 6, label: "Agente IA" },
];

export const DESBLOQUEIOS = TRAVAS_LIGADAS ? TRAVAS : [];

export function nivelMinimoDaAba(aba: string): number | undefined {
  return DESBLOQUEIOS.find((d) => d.aba === aba)?.minimo;
}
