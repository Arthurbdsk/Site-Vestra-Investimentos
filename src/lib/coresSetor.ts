const PALETA = [
  "var(--color-teal)",
  "var(--color-coral)",
  "var(--color-violet)",
  "var(--color-sky)",
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
