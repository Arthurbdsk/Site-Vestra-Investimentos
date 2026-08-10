"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight } from "lucide-react";
import { PERGUNTAS, calcularPerfil, type Perfil } from "@/lib/perfilInvestidor";
import {
  salvarPerfilInvestidor,
  marcarQuizVisto,
} from "@/app/simulador/operacoesPerfil";

export function PopupPerfilInvestidor({ mostrar }: { mostrar: boolean }) {
  const router = useRouter();
  const [aberto, setAberto] = useState(mostrar);
  const [passo, setPasso] = useState(0);
  const [respostas, setRespostas] = useState<Record<string, number>>({});
  const [resultado, setResultado] = useState<Perfil | null>(null);
  const [erroSalvar, setErroSalvar] = useState(false);

  if (!aberto) return null;

  /**
   * Fecha e registra que ja perguntamos.
   *
   * Antes so fechava a janela. Como pular nao gravava nada, o quiz
   * reaparecia em TODA visita. Agora quem pula fica em paz, e pode
   * responder quando quiser pela area de conta.
   */
  async function fechar() {
    setAberto(false);
    await marcarQuizVisto();
    router.refresh();
  }

  async function salvar(perfil: Perfil) {
    setErroSalvar(false);
    const r = await salvarPerfilInvestidor(perfil.id);
    if (!r.ok) setErroSalvar(true);
  }

  function responder(pontos: number) {
    const pergunta = PERGUNTAS[passo];
    const novasRespostas = { ...respostas, [pergunta.id]: pontos };
    setRespostas(novasRespostas);

    if (passo + 1 < PERGUNTAS.length) {
      setPasso(passo + 1);
    } else {
      const perfil = calcularPerfil(novasRespostas);
      setResultado(perfil);
      salvar(perfil);
    }
  }

  const pergunta = PERGUNTAS[passo];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[80] flex items-end justify-center bg-blue-deep/60 backdrop-blur-sm sm:items-center"
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
          className="relative w-full max-w-md bg-paper p-7 shadow-2xl"
        >
          <button
            onClick={fechar}
            aria-label="Fechar"
            className="absolute right-5 top-5 text-ink-muted transition-colors hover:text-ink"
          >
            <X size={20} />
          </button>

          {resultado ? (
            <div>
              <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-gold-soft">
                Seu perfil é
              </p>
              <h2 className="mt-1 font-display text-3xl font-bold text-blue">{resultado.nome}</h2>
              <p className="mt-4 border-l-[3px] border-gold pl-4 text-sm leading-relaxed text-ink-muted">
                {resultado.descricao}
              </p>
              {erroSalvar && (
                <p className="mt-4 border-l-[3px] border-rose-500 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                  Não consegui salvar seu perfil agora — esse quiz pode
                  aparecer de novo na próxima vez. Tente de novo:{" "}
                  <button
                    onClick={() => salvar(resultado)}
                    className="font-semibold underline underline-offset-2"
                  >
                    tentar salvar
                  </button>
                </p>
              )}
              <button
                onClick={fechar}
                className="group mt-7 flex w-full items-center justify-center gap-2 bg-blue px-6 py-3 text-sm font-semibold text-onblue transition-colors hover:bg-blue-deep"
              >
                Começar a investir
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          ) : (
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                Bem-vindo(a) ao Vestra
              </p>
              <h2 className="mt-1 font-display text-2xl text-ink">
                Que tipo de investidor você é?
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {PERGUNTAS.length} perguntas rápidas pra gente te sugerir empresas
                que combinam com você.
              </p>

              <div className="mt-6 flex items-center gap-2">
                {PERGUNTAS.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 flex-1 ${i <= passo ? "bg-gold" : "bg-[var(--rule)]"}`}
                  />
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={pergunta.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="mt-6"
                >
                  <p className="font-display text-lg text-ink">{pergunta.texto}</p>
                  <div className="mt-4 space-y-2">
                    {pergunta.opcoes.map((op) => (
                      <button
                        key={op.texto}
                        onClick={() => responder(op.pontos)}
                        className="block w-full border border-[var(--rule)] px-4 py-3 text-left text-sm leading-relaxed text-ink transition-colors hover:border-blue hover:bg-paper-alt"
                      >
                        {op.texto}
                      </button>
                    ))}
                  </div>
                </motion.div>
              </AnimatePresence>

              <button
                onClick={fechar}
                className="mt-6 w-full text-center font-mono text-[11px] uppercase tracking-widest text-ink-muted hover:text-ink"
              >
                Pular por agora
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
