"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, CheckCircle2, AlertCircle, Minus, Plus } from "lucide-react";
import { comprar, vender } from "@/app/simulador/operacoes";
import { acaoPorTicker } from "@/lib/acoes";
import { brl } from "@/lib/formato";

export type OrdemAberta = {
  ticker: string;
  preco: number;
  tipo: "comprar" | "vender";
  /** Saldo em caixa (compra) ou cotas em carteira (venda). */
  limite: number;
};

type Estado =
  | { fase: "formulario" }
  | { fase: "enviando" }
  | { fase: "feito"; mensagem: string }
  | { fase: "erro"; mensagem: string };

export function ModalOrdem({
  ordem,
  aoFechar,
}: {
  ordem: OrdemAberta | null;
  aoFechar: () => void;
}) {
  const router = useRouter();
  const [qtd, setQtd] = useState(1);
  const [estado, setEstado] = useState<Estado>({ fase: "formulario" });
  const [, iniciar] = useTransition();

  /** Fecha e garante que a carteira na tela reflita a ordem recem-feita. */
  function fechar() {
    if (estado.fase === "feito") router.refresh();
    aoFechar();
  }

  useEffect(() => {
    if (ordem) {
      setQtd(1);
      setEstado({ fase: "formulario" });
    }
  }, [ordem]);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") fechar();
    };
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  });

  if (!ordem) return null;

  const info = acaoPorTicker(ordem.ticker);
  const comprando = ordem.tipo === "comprar";
  const custo = qtd * ordem.preco;

  const maximo = comprando
    ? Math.max(0, Math.floor(ordem.limite / ordem.preco))
    : ordem.limite;

  const passaDoLimite = qtd > maximo;

  function enviar() {
    setEstado({ fase: "enviando" });
    iniciar(async () => {
      const r = comprando
        ? await comprar(ordem!.ticker, qtd)
        : await vender(ordem!.ticker, qtd);
      setEstado(
        r.ok
          ? { fase: "feito", mensagem: r.mensagem }
          : { fase: "erro", mensagem: r.mensagem },
      );
    });
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={fechar}
        className="fixed inset-0 z-[70] flex items-end justify-center bg-blue-deep/60 backdrop-blur-sm sm:items-center"
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-md bg-paper p-7 shadow-2xl"
        >
          <button
            onClick={fechar}
            aria-label="Fechar"
            className="absolute right-5 top-5 text-ink-muted transition-colors hover:text-ink"
          >
            <X size={20} />
          </button>

          {estado.fase === "feito" ? (
            <div className="py-4 text-center">
              <CheckCircle2 size={44} className="mx-auto text-emerald-600" />
              <p className="mt-5 font-display text-2xl text-ink">Tudo certo!</p>
              <p className="mt-2 leading-relaxed text-ink-muted">{estado.mensagem}</p>
              <button
                onClick={fechar}
                className="mt-7 w-full bg-blue px-6 py-3 text-sm font-semibold text-onblue transition-colors hover:bg-blue-deep"
              >
                Ver minha carteira
              </button>
            </div>
          ) : (
            <>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                {comprando ? "Comprar" : "Vender"}
              </p>
              <h2 className="mt-1 font-display text-3xl text-ink">
                {ordem.ticker}
              </h2>
              <p className="text-sm text-ink-muted">{info?.nome}</p>

              {info && comprando && (
                <p className="mt-4 border-l-[3px] border-gold pl-4 text-sm leading-relaxed text-ink-muted">
                  {info.explica}
                </p>
              )}

              <div className="mt-6 flex items-baseline justify-between border-y border-[var(--rule)] py-3">
                <span className="text-sm text-ink-muted">Preço de agora</span>
                <span className="font-mono text-lg tabular text-ink">
                  {brl(ordem.preco)}
                </span>
              </div>

              <div className="mt-6">
                <label className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                  Quantas cotas?
                </label>

                <div className="mt-3 flex items-stretch gap-2">
                  <button
                    onClick={() => setQtd((q) => Math.max(1, q - 1))}
                    aria-label="Diminuir"
                    className="border border-[var(--rule)] px-3 text-ink transition-colors hover:border-blue"
                  >
                    <Minus size={16} />
                  </button>
                  <input
                    type="number"
                    min={1}
                    value={qtd}
                    onChange={(e) =>
                      setQtd(Math.max(1, Math.floor(Number(e.target.value) || 1)))
                    }
                    className="w-full border border-[var(--rule)] bg-paper px-4 py-3 text-center font-mono text-lg tabular text-ink outline-none focus:border-blue"
                  />
                  <button
                    onClick={() => setQtd((q) => q + 1)}
                    aria-label="Aumentar"
                    className="border border-[var(--rule)] px-3 text-ink transition-colors hover:border-blue"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  {[1, 5, 10, 50].filter((n) => n <= maximo).map((n) => (
                    <button
                      key={n}
                      onClick={() => setQtd(n)}
                      className="border border-[var(--rule)] px-3 py-1.5 font-mono text-xs text-ink-muted transition-colors hover:border-blue hover:text-blue"
                    >
                      {n}
                    </button>
                  ))}
                  {maximo > 0 && (
                    <button
                      onClick={() => setQtd(maximo)}
                      className="border border-blue bg-blue/5 px-3 py-1.5 font-mono text-xs text-blue"
                    >
                      máximo ({maximo})
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-6 space-y-1.5 bg-paper-alt p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-ink-muted">
                    {comprando ? "Vai custar" : "Você recebe"}
                  </span>
                  <span className="font-mono font-semibold tabular text-ink">
                    {brl(custo)}
                  </span>
                </div>
                {comprando && (
                  <div className="flex justify-between text-sm">
                    <span className="text-ink-muted">Sobra em caixa</span>
                    <span
                      className={`font-mono tabular ${
                        passaDoLimite ? "text-rose-600" : "text-ink-muted"
                      }`}
                    >
                      {brl(ordem.limite - custo)}
                    </span>
                  </div>
                )}
              </div>

              {passaDoLimite && (
                <p className="mt-3 flex items-start gap-2 text-sm text-rose-700">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  {comprando
                    ? `Seu caixa dá pra no máximo ${maximo} cotas.`
                    : `Você tem apenas ${maximo} cotas de ${ordem.ticker}.`}
                </p>
              )}

              {estado.fase === "erro" && (
                <p className="mt-3 flex items-start gap-2 border-l-[3px] border-rose-500 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  {estado.mensagem}
                </p>
              )}

              <button
                onClick={enviar}
                disabled={estado.fase === "enviando" || passaDoLimite || maximo < 1}
                className={`mt-6 flex w-full items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold transition-colors disabled:opacity-50 ${
                  comprando
                    ? "bg-blue text-onblue hover:bg-blue-deep"
                    : "bg-gold text-blue hover:bg-gold-soft"
                }`}
              >
                {estado.fase === "enviando" ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Confirmando
                  </>
                ) : (
                  `Confirmar ${comprando ? "compra" : "venda"} de ${brl(custo)}`
                )}
              </button>

              <p className="mt-3 text-center font-mono text-[11px] text-ink-muted">
                Dinheiro fictício. Nada disso mexe na sua conta de verdade.
              </p>
            </>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
