type Ponto = { x: number; y: number };

/**
 * Caminho SVG suavizado (Catmull-Rom convertido em curvas de Bezier),
 * em vez de linhas retas ligando os pontos. Deixa os gráficos de preço
 * com uma curva natural sem inventar dados: ainda passa exatamente por
 * cada ponto real, só a interpolação entre eles é curva.
 */
export function caminhoSuave(pontos: Ponto[]): string {
  if (pontos.length < 2) return "";
  if (pontos.length === 2) {
    return `M${pontos[0].x},${pontos[0].y} L${pontos[1].x},${pontos[1].y}`;
  }

  let d = `M${pontos[0].x},${pontos[0].y}`;

  for (let i = 0; i < pontos.length - 1; i++) {
    const p0 = pontos[i - 1] ?? pontos[i];
    const p1 = pontos[i];
    const p2 = pontos[i + 1];
    const p3 = pontos[i + 2] ?? p2;

    const c1x = p1.x + (p2.x - p0.x) / 6;
    const c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6;
    const c2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C${c1x.toFixed(2)},${c1y.toFixed(2)} ${c2x.toFixed(2)},${c2y.toFixed(2)} ${p2.x.toFixed(2)},${p2.y.toFixed(2)}`;
  }

  return d;
}
