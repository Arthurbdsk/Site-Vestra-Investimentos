"use client";

import { useEffect, useState } from "react";
import { Newspaper } from "lucide-react";
import type { Noticia } from "@/lib/noticias";

type Estado =
  | { fase: "carregando" }
  | { fase: "vazio" }
  | { fase: "feito"; noticias: Noticia[] };

export function NoticiasDaAcao({ nome }: { nome: string | null }) {
  const [estado, setEstado] = useState<Estado>({ fase: "carregando" });

  useEffect(() => {
    if (!nome) return;
    let cancelado = false;
    setEstado({ fase: "carregando" });
    fetch(`/api/noticias?q=${encodeURIComponent(nome)}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelado) return;
        if (Array.isArray(json.noticias) && json.noticias.length > 0) {
          setEstado({ fase: "feito", noticias: json.noticias.slice(0, 2) });
        } else {
          setEstado({ fase: "vazio" });
        }
      })
      .catch(() => {
        if (!cancelado) setEstado({ fase: "vazio" });
      });
    return () => {
      cancelado = true;
    };
  }, [nome]);

  if (!nome || estado.fase === "vazio") return null;

  return (
    <div className="mt-6 border-t border-[var(--rule)] pt-5">
      <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-ink-muted">
        <Newspaper size={13} />
        Notícias relacionadas
      </p>
      {estado.fase === "carregando" ? (
        <p className="mt-3 text-xs text-ink-muted">Buscando…</p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {estado.noticias.map((n) => (
            <li key={n.url}>
              <a
                href={n.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-sm leading-snug text-ink underline decoration-transparent underline-offset-4 transition-colors hover:text-blue hover:decoration-blue"
              >
                {n.titulo}
              </a>
              <p className="mt-0.5 text-xs text-ink-muted">{n.fonte}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
