const CHAVE_BASE = "aprender_concluidos";

// Sem o id do usuario a chave fica global no navegador: numa maquina
// compartilhada, o progresso de leitura de uma conta aparece pra outra
// que faca login depois. Com o id, cada conta tem sua propria chave.
// Sem usuario logado (contexto anonimo) cai na chave sem sufixo, unica
// forma de manter a funcao disponivel pra quem nao esta autenticado.
function chave(userId?: string | null): string {
  return userId ? `${CHAVE_BASE}_${userId}` : CHAVE_BASE;
}

export function artigosConcluidos(userId?: string | null): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(chave(userId)) ?? "[]");
  } catch {
    return [];
  }
}

export function marcarArtigoConcluido(slug: string, userId?: string | null) {
  const atuais = artigosConcluidos(userId);
  if (atuais.includes(slug)) return;
  localStorage.setItem(chave(userId), JSON.stringify([...atuais, slug]));
}
