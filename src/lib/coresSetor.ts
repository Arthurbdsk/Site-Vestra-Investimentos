// Variantes "-texto" porque a cor do setor sempre aparece como texto ou
// borda sobre o papel, nunca como bloco de fundo. No tema escuro elas
// clareiam; usando as cores base, a tag do setor sumia no escuro.
const PALETA = [
  "var(--color-teal-texto)",
  "var(--color-coral-texto)",
  "var(--color-violet-texto)",
  "var(--color-sky-texto)",
  "var(--color-gold)",
];

/** Cor determinística por nome de setor, so pra dar variedade visual as tags. */
export function corDoSetor(setor: string): string {
  let hash = 0;
  for (let i = 0; i < setor.length; i++) {
    hash = (hash * 31 + setor.charCodeAt(i)) | 0;
  }
  return PALETA[Math.abs(hash) % PALETA.length];
}
