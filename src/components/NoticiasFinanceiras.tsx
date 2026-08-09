"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, Loader2, Newspaper } from "lucide-react";
import type { Noticia } from "@/lib/noticias";
import { tempoRelativo } from "@/lib/formato";

type Estado =
  | { fase: "carregando" }
  | { fase: "erro"; mensagem: string }
  | { fase: "feito"; noticias: Noticia[] };

export function NoticiasFinanceiras() {
  const [estado, setEstado] = useState<Estado>({ fase: "carregando" });

  useEffect(() => {
    let cancelado = false;
    fetch("/api/noticias")
      .then((r) => r.json())
      .then((json) => {
        if (cancelado) return;
        if (json.noticias) {
          setEstado({ fase: "feito", noticias: json.noticias });
        } else {
          setEstado({
            fase: "erro",
            mensagem: json.mensagem ?? "Não foi possível buscar as notícias agora.",
          });
        }
      })
      .catch(() => {
        if (!cancelado) {
          setEstado({ fase: "erro", mensagem: "Não foi possível buscar as notícias agora." });
        }
      });
    return () => {
      cancelado = true;
    };
  }, []);

  return (
    <div>
      <h2 className="font-display text-2xl text-ink">Notícias do mercado</h2>
      <p className="mt-2 max-w-xl leading-relaxed text-ink-muted">
        Manchetes agregadas de fontes como Yahoo Finance, Reuters e WSJ.
        Clique pra ler a matéria completa na fonte original.
      </p>

      {estado.fase === "carregando" && (
        <div className="mt-10 flex items-center gap-2 text-ink-muted">
          <Loader2 size={16} className="animate-spin" />
          Carregando manchetes…
        </div>
      )}

      {estado.fase === "erro" && (
        <p className="mt-8 text-ink-muted">{estado.mensagem}</p>
      )}

      {estado.fase === "feito" && (
        <ul className="mt-6 grid gap-px bg-[var(--rule)] sm:grid-cols-2">
          {estado.noticias.map((n, i) => (
            <motion.li
              key={n.url}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.4) }}
              className="bg-paper p-5"
            >
              <a
                href={n.url}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="group block"
              >
                <div className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-wider text-ink-muted">
                  <Newspaper size={12} />
                  {n.fonte} · {tempoRelativo(n.publicadoEm)}
                </div>
                <p className="mt-2 font-display text-lg leading-snug text-ink group-hover:text-blue">
                  {n.titulo}
                </p>
                {n.resumo && (
                  <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-muted">
                    {n.resumo}
                  </p>
                )}
                <span className="mt-3 inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-wider text-blue">
                  Ler na fonte
                  <ExternalLink size={11} />
                </span>
              </a>
            </motion.li>
          ))}
        </ul>
      )}

      {estado.fase === "feito" && estado.noticias.length === 0 && (
        <p className="mt-8 text-ink-muted">Nenhuma notícia disponível agora.</p>
      )}
    </div>
  );
}
