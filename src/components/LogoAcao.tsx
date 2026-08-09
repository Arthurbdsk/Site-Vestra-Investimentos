"use client";

import { useState } from "react";

/**
 * Logo da empresa, com fallback pra um circulo com a primeira letra do
 * ticker (nem toda acao tem logo na fonte, e a imagem as vezes falha).
 */
export function LogoAcao({
  logo,
  ticker,
  size = 32,
}: {
  logo: string | null;
  ticker: string;
  size?: number;
}) {
  const [falhou, setFalhou] = useState(false);

  if (!logo || falhou) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex shrink-0 items-center justify-center rounded-full bg-blue font-mono text-xs font-bold text-gold"
      >
        {ticker.charAt(0)}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logo}
      alt=""
      width={size}
      height={size}
      className="shrink-0 rounded-full bg-white object-contain"
      style={{ width: size, height: size }}
      onError={() => setFalhou(true)}
    />
  );
}
