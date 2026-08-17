"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Share, Plus, Download } from "lucide-react";

/**
 * Convite pra instalar o Vestra na tela de inicio.
 *
 * O registro do service worker NAO fica aqui: quem faz isso e o
 * RegistrarServiceWorker. Este componente cuida so de convidar.
 *
 * Sem ele, no Android o navegador mostra no maximo uma tarja discreta
 * que quase ninguem percebe, e no iPhone nao mostra nada: la a
 * instalacao e manual, escondida no menu de compartilhar. Ou seja, sem
 * este convite, "instalar" existe no papel e nao acontece na pratica.
 */

/** Evento que o Chrome dispara quando o site pode ser instalado. Ainda
 * nao e padrao, entao nao vem tipado no TypeScript. */
type EventoInstalar = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const CHAVE_DISPENSADO = "vestra:convite-instalar-dispensado";

/** So convidamos quem ja esta usando o produto. Na landing a pessoa ainda
 * esta decidindo se quer; pedir pra instalar ali e pedir demais, cedo
 * demais. */
const AREAS_DO_APP = ["/simulador", "/conta", "/aprender"];

export function ConviteInstalar() {
  const caminho = usePathname();
  const [evento, setEvento] = useState<EventoInstalar | null>(null);
  const [mostrarIos, setMostrarIos] = useState(false);
  const [fechado, setFechado] = useState(false);

  useEffect(() => {
    function aoPoderInstalar(e: Event) {
      // Segura o aviso automatico do navegador pra convidar do nosso
      // jeito, no momento em que a pessoa ja viu o produto.
      e.preventDefault();
      setEvento(e as EventoInstalar);
    }
    window.addEventListener("beforeinstallprompt", aoPoderInstalar);
    return () =>
      window.removeEventListener("beforeinstallprompt", aoPoderInstalar);
  }, []);

  // O Safari do iPhone nao tem esse evento: la a instalacao e manual.
  //
  // O atraso nao e enfeite. Aparecer no primeiro segundo atrapalha quem
  // acabou de abrir, e mexer em estado direto no corpo do efeito e
  // justamente o que o lint (com razao) nao deixa.
  useEffect(() => {
    const relogio = setTimeout(() => {
      const ua = navigator.userAgent;
      const ehIos = /iphone|ipad|ipod/i.test(ua);
      const ehSafari = /safari/i.test(ua) && !/crios|fxios|edgios/i.test(ua);
      const jaInstalado =
        window.matchMedia("(display-mode: standalone)").matches ||
        // Propriedade so do Safari, nao existe no tipo padrao.
        (navigator as Navigator & { standalone?: boolean }).standalone === true;

      if (ehIos && ehSafari && !jaInstalado) setMostrarIos(true);
    }, 4000);
    return () => clearTimeout(relogio);
  }, []);

  const naAreaDoApp = AREAS_DO_APP.some((a) => caminho?.startsWith(a));

  // Quem ja dispensou uma vez nao e perguntado de novo.
  const jaDispensou =
    typeof window !== "undefined" &&
    window.localStorage?.getItem(CHAVE_DISPENSADO) === "1";

  const visivel =
    naAreaDoApp && !fechado && !jaDispensou && (evento || mostrarIos);

  function dispensar() {
    setFechado(true);
    try {
      window.localStorage.setItem(CHAVE_DISPENSADO, "1");
    } catch {
      // Navegacao anonima bloqueia localStorage; some so nesta sessao.
    }
  }

  async function instalar() {
    if (!evento) return;
    await evento.prompt();
    await evento.userChoice;
    // O evento so vale uma vez. Aceitando ou nao, ele nao se repete.
    setEvento(null);
    dispensar();
  }

  return (
    <AnimatePresence>
      {visivel && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 28 }}
          // No celular sobe acima da barra inferior do app; no desktop
          // vira um cartao discreto no canto.
          className="fixed inset-x-3 bottom-40 z-[78] border border-[var(--rule)] bg-paper shadow-xl md:inset-x-auto md:right-5 md:bottom-5 md:w-96"
          style={{ marginBottom: "env(safe-area-inset-bottom)" }}
        >
          <div className="flex items-start gap-3 p-4">
            <div className="min-w-0 flex-1">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                Instalar o Vestra
              </p>

              {evento ? (
                <>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink">
                    Deixe o Vestra na tela de início, com ícone próprio e sem
                    a barra do navegador.
                  </p>
                  <button
                    onClick={instalar}
                    className="mt-3.5 inline-flex items-center gap-2 bg-gold px-5 py-2.5 text-sm font-semibold text-blue-deep transition-colors hover:bg-gold-soft"
                  >
                    <Download size={15} aria-hidden />
                    Instalar
                  </button>
                </>
              ) : (
                <>
                  <p className="mt-1.5 text-sm leading-relaxed text-ink">
                    No iPhone dá pra deixar na tela de início em dois toques:
                  </p>
                  <ol className="mt-3 space-y-2 text-sm text-ink-muted">
                    <li className="flex items-center gap-2">
                      <Share size={15} className="shrink-0 text-blue" aria-hidden />
                      Toque em Compartilhar, na barra de baixo
                    </li>
                    <li className="flex items-center gap-2">
                      <Plus size={15} className="shrink-0 text-blue" aria-hidden />
                      Escolha &quot;Adicionar à Tela de Início&quot;
                    </li>
                  </ol>
                </>
              )}
            </div>

            <button
              onClick={dispensar}
              aria-label="Dispensar"
              className="shrink-0 text-ink-muted transition-colors hover:text-ink"
            >
              <X size={18} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
