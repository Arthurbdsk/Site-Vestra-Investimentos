"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Diz se o elemento esta na tela. Serve pra desligar animacoes e timers
 * de secoes que a pessoa nao esta vendo: sem isso o site fica gastando
 * processamento a toa e engasga na rolagem.
 *
 * Usa o IntersectionObserver do proprio navegador. Se ele nao existir,
 * assume visivel, porque atrasar animacao e melhor que sumir com ela.
 */
export function useVisivel<T extends HTMLElement>(fracao = 0.1) {
  const ref = useRef<T>(null);
  const [visivel, setVisivel] = useState(true);

  useEffect(() => {
    const alvo = ref.current;
    if (!alvo || typeof IntersectionObserver === "undefined") return;

    const observador = new IntersectionObserver(
      ([entrada]) => setVisivel(entrada.isIntersecting),
      { threshold: fracao },
    );
    observador.observe(alvo);
    return () => observador.disconnect();
  }, [fracao]);

  return { ref, visivel };
}
