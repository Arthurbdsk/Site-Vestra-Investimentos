"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Star } from "lucide-react";
import { favoritarAcao, desfavoritarAcao } from "@/app/simulador/operacoesFavoritos";

export function BotaoFavorito({
  ticker,
  favorito,
  tamanho = 17,
}: {
  ticker: string;
  favorito: boolean;
  tamanho?: number;
}) {
  const router = useRouter();
  const [otimista, setOtimista] = useState(favorito);
  const [, iniciar] = useTransition();

  function alternar(e: React.MouseEvent) {
    e.stopPropagation();
    const novoValor = !otimista;
    setOtimista(novoValor);
    iniciar(async () => {
      await (novoValor ? favoritarAcao(ticker) : desfavoritarAcao(ticker));
      router.refresh();
    });
  }

  return (
    <button
      onClick={alternar}
      aria-label={otimista ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      aria-pressed={otimista}
      className={`transition-colors ${
        otimista ? "text-gold" : "text-ink-muted/50 hover:text-gold"
      }`}
    >
      <Star size={tamanho} fill={otimista ? "currentColor" : "none"} />
    </button>
  );
}
