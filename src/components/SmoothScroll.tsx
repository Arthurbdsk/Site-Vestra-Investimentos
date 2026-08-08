"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * Rolagem suave em toda a pagina. Respeita quem pediu menos animacao no
 * sistema operacional, e nao intercepta rolagem dentro de modais.
 */
export function SmoothScroll() {
  useEffect(() => {
    const prefereMenosMovimento = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefereMenosMovimento) return;

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.6,
    });

    let frame = 0;
    function loop(tempo: number) {
      lenis.raf(tempo);
      frame = requestAnimationFrame(loop);
    }
    frame = requestAnimationFrame(loop);

    // Links de ancora (#como-funciona) passam a rolar suave tambem.
    const aoClicar = (e: MouseEvent) => {
      const alvo = (e.target as HTMLElement)?.closest?.('a[href^="#"]');
      if (!alvo) return;
      const id = alvo.getAttribute("href");
      if (!id || id === "#") return;
      const destino = document.querySelector(id);
      if (!destino) return;
      e.preventDefault();
      lenis.scrollTo(destino as HTMLElement, { offset: -70 });
    };
    document.addEventListener("click", aoClicar);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("click", aoClicar);
      lenis.destroy();
    };
  }, []);

  return null;
}
