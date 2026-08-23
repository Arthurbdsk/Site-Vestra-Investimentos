/**
 * Projecao de aportes mensais com juros compostos, ano a ano.
 *
 * Compartilhado entre a prova interativa da home (Manifesto) e a
 * calculadora dentro de artigo (CalculadoraJurosCompostos): mesma conta,
 * so muda quem fixa taxa/prazo e quem deixa ajustavel.
 */
export type PontoJuros = { ano: number; guardado: number; total: number };

export function projetarJuros(mensal: number, anos: number, taxaAnual: number): PontoJuros[] {
  const i = Math.pow(1 + taxaAnual, 1 / 12) - 1;
  const pontos: PontoJuros[] = [];

  for (let ano = 0; ano <= anos; ano++) {
    const meses = ano * 12;
    // Serie de aportes mensais: cada parcela rende pelos meses restantes.
    const total = meses === 0 ? 0 : mensal * ((Math.pow(1 + i, meses) - 1) / i);
    pontos.push({ ano, guardado: mensal * meses, total });
  }
  return pontos;
}
