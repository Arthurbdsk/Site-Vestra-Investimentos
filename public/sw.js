const CACHE = "vestra-v1";
const PAGINA_OFFLINE = "/offline.html";
const PRECACHE_URLS = [
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  PAGINA_OFFLINE,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .catch(() => {}),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((chaves) => Promise.all(chaves.filter((c) => c !== CACHE).map((c) => caches.delete(c))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Abrir uma pagina sem internet: em vez da tela de erro do navegador,
  // mostra a nossa, que explica por que nao ha numero na tela. A pagina
  // continua NUNCA saindo do cache quando ha rede, so serve de ultimo
  // recurso quando o fetch falha.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(() =>
        caches
          .match(PAGINA_OFFLINE)
          .then((resposta) => resposta ?? Response.error()),
      ),
    );
    return;
  }

  // So os arquivos versionados do Next (hash no nome, nunca ficam
  // desatualizados) usam cache-first. Paginas, saldo, cotacoes, sessao
  // de login e tudo mais vai sempre direto pra rede.
  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const emCache = await cache.match(request);
        if (emCache) return emCache;
        const resposta = await fetch(request);
        if (resposta.ok) cache.put(request, resposta.clone());
        return resposta;
      }),
    );
  }
});
