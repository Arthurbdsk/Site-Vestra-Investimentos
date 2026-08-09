"use client";

import { useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { brl, pct } from "@/lib/formato";

const W = 1080;
const H = 1080;

export function CartaoCompartilhavel({
  apelido,
  patrimonio,
  lucroPct,
}: {
  apelido: string;
  patrimonio: number;
  lucroPct: number;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [baixando, setBaixando] = useState(false);

  async function baixar() {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    setBaixando(true);

    try {
      const serializado = new XMLSerializer().serializeToString(svgEl);
      const svgBlob = new Blob([serializado], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(svgBlob);

      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = url;
      });

      const canvas = document.createElement("canvas");
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, W, H);
      URL.revokeObjectURL(url);

      const link = document.createElement("a");
      link.download = "vestra-carteira.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    } finally {
      setBaixando(false);
    }
  }

  const subiu = lucroPct >= 0;
  const cor = subiu ? "#f5a623" : "#fb7185";

  return (
    <div>
      <div className="mx-auto max-w-sm overflow-hidden border border-[var(--rule)]">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          xmlns="http://www.w3.org/2000/svg"
          className="w-full"
        >
          <rect width={W} height={H} fill="#0f2d44" />
          <circle cx={W / 2} cy="140" r="230" fill="#f5a623" opacity="0.08" />

          <text x="80" y="150" fontFamily="Georgia, serif" fontSize="52" fill="#f5f6f7">
            Vestra
          </text>
          <text
            x="80"
            y="195"
            fontFamily="monospace"
            fontSize="24"
            letterSpacing="2"
            fill="#a9b4bf"
          >
            SIMULADOR DE INVESTIMENTOS
          </text>

          <text
            x="80"
            y="420"
            fontFamily="monospace"
            fontSize="26"
            letterSpacing="3"
            fill="#a9b4bf"
          >
            PATRIMÔNIO DE {apelido.toUpperCase()}
          </text>
          <text x="80" y="520" fontFamily="Georgia, serif" fontSize="90" fill="#f5a623">
            {brl(patrimonio)}
          </text>

          <text x="80" y="600" fontFamily="monospace" fontSize="42" fill={cor}>
            {subiu ? "▲" : "▼"} {pct(lucroPct)}
          </text>
          <text x="80" y="640" fontFamily="monospace" fontSize="22" fill="#a9b4bf">
            desde o início, em dinheiro fictício
          </text>

          <line x1="80" y1={H - 160} x2={W - 80} y2={H - 160} stroke="#f5a623" strokeOpacity="0.3" />
          <text
            x="80"
            y={H - 110}
            fontFamily="monospace"
            fontSize="22"
            letterSpacing="2"
            fill="#a9b4bf"
          >
            APRENDA A INVESTIR SEM RISCO
          </text>
          <text x="80" y={H - 70} fontFamily="monospace" fontSize="22" fill="#f5a623">
            vestra-simulator.com.br
          </text>
        </svg>
      </div>

      <button
        onClick={baixar}
        disabled={baixando}
        className="mx-auto mt-4 flex items-center justify-center gap-2 bg-blue px-6 py-3 text-sm font-semibold text-onblue transition-colors hover:bg-blue-deep disabled:opacity-50"
      >
        {baixando ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
        Baixar imagem
      </button>
    </div>
  );
}
