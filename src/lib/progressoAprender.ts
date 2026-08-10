const CHAVE = "aprender_concluidos";

export function artigosConcluidos(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(CHAVE) ?? "[]");
  } catch {
    return [];
  }
}

export function marcarArtigoConcluido(slug: string) {
  const atuais = artigosConcluidos();
  if (atuais.includes(slug)) return;
  localStorage.setItem(CHAVE, JSON.stringify([...atuais, slug]));
}
