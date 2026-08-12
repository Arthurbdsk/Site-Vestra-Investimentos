"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, CheckCircle2, AlertCircle, Minus, Plus } from "lucide-react";
import { comprar, vender, criarOrdemLimitada, criarOrdemMercadoAbertura } from "@/app/simulador/operacoes";
import { acaoPorTicker } from "@/lib/acoes";
import { brl } from "@/lib/formato";
import { statusMercado, mercadoDoTicker } from "@/lib/mercadoStatus";

export type OrdemAberta = {
  ticker: string;
  preco: number;
  tipo: "comprar" | "vender";
  /** Saldo em caixa (compra) ou cotas em carteira (venda). */
  limite: number;
  /** Nome da empresa, pra ações fora da lista curada (que não têm explica). */
  nome?: string;
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
  const [modo, setModo] = useState<"mercado" | "limitada" | "abertura">("mercado");
  const [precoAlvo, setPrecoAlvo] = useState(0);
  const [estado, setEstado] = useState<Estado>({ fase: "formulario" });
  const [, iniciar] = useTransition();
  const mercadoFechado = !statusMercado(new Date(), ordem ? mercadoDoTicker(ordem.ticker) : "br").aberto;

  /** Fecha e garante que a carteira na tela reflita a ordem recem-feita. */
  function fechar() {
    if (estado.fase === "feito") router.refresh();
    aoFechar();
  }

  useEffect(() => {
    if (ordem) {
      setQtd(1);
      setModo("mercado");
      setPrecoAlvo(ordem.preco);
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
  const limitada = modo === "limitada";
  const abertura = modo === "abertura";
  const custo = qtd * (limitada ? precoAlvo : ordem.preco);

  const maximo = comprando
    ? Math.max(0, Math.floor(ordem.limite / ordem.preco))
    : ordem.limite;

  // Numa ordem que so vai executar depois (limitada ou na abertura), o
  // preco pode mudar ate la, entao nao faz sentido travar pela sobra de
  // caixa de agora quando for compra.
  const passaDoLimite = comprando && (limitada || abertura) ? false : qtd > maximo;

  function enviar() {
    setEstado({ fase: "enviando" });
    iniciar(async () => {
      const r =
        modo === "limitada"
          ? await criarOrdemLimitada(
              comprando ? "comprar" : "vender",
              ordem!.ticker,
              qtd,
              precoAlvo,
            )
          : modo === "abertura"
            ? await criarOrdemMercadoAbertura(comprando ? "comprar" : "vender", ordem!.ticker, qtd)
            : comprando
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
              <p className="text-sm text-ink-muted">{info?.nome ?? ordem.nome}</p>

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

              <div className={`mt-5 grid gap-1.5 ${mercadoFechado ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-2"}`}>
                <button
                  onClick={() => setModo("mercado")}
                  className={`border px-3 py-2.5 text-sm font-semibold transition-colors ${
                    modo === "mercado"
                      ? "border-blue bg-blue text-onblue"
                      : "border-[var(--rule)] text-ink-muted hover:border-blue hover:text-blue"
                  }`}
                >
                  A mercado, agora
                </button>
                <button
                  onClick={() => setModo("limitada")}
                  className={`border px-3 py-2.5 text-sm font-semibold transition-colors ${
                    modo === "limitada"
                      ? "border-blue bg-blue text-onblue"
                      : "border-[var(--rule)] text-ink-muted hover:border-blue hover:text-blue"
                  }`}
                >
                  Só a um preço-alvo
                </button>
                {mercadoFechado && (
                  <button
                    onClick={() => setModo("abertura")}
                    className={`border px-3 py-2.5 text-sm font-semibold transition-colors ${
                      modo === "abertura"
                        ? "border-blue bg-blue text-onblue"
                        : "border-[var(--rule)] text-ink-muted hover:border-blue hover:text-blue"
                    }`}
                  >
                    Quando o mercado abrir
                  </button>
                )}
              </div>

              {abertura && (
                <p className="mt-4 text-xs leading-relaxed text-ink-muted">
                  O mercado está fechado agora. Essa ordem fica pendente e
                  executa pelo preço de mercado assim que o pregão abrir de
                  novo (a próxima vez que você abrir o simulador nesse horário).
                </p>
              )}

              {limitada && (
                <div className="mt-4">
                  <label className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                    {comprando ? "Comprar quando cair para" : "Vender quando subir para"}
                  </label>
                  <input
                    type="number"
                    min={0.01}
                    step={0.01}
                    value={precoAlvo}
                    onChange={(e) => setPrecoAlvo(Math.max(0, Number(e.target.value) || 0))}
                    className="mt-2 w-full border border-[var(--rule)] bg-paper px-4 py-3 font-mono text-lg tabular text-ink outline-none focus:border-blue"
                  />
                  <p className="mt-2 text-xs leading-relaxed text-ink-muted">
                    A ordem fica pendente e é executada sozinha na próxima
                    vez que você abrir o simulador, se o preço já tiver
                    {comprando ? " caído até esse valor." : " subido até esse valor."}
                  </p>
                </div>
              )}

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
                    {limitada
                      ? "Se executar, vai custar"
                      : abertura
                        ? "Estimativa (preço pode mudar até abrir)"
                        : comprando
                          ? "Vai custar"
                          : "Você recebe"}
                  </span>
                  <span className="font-mono font-semibold tabular text-ink">
                    {brl(custo)}
                  </span>
                </div>
                {comprando && !limitada && !abertura && (
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
                disabled={
                  estado.fase === "enviando" ||
                  passaDoLimite ||
                  (limitada ? precoAlvo <= 0 : maximo < 1)
                }
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
                ) : limitada || abertura ? (
                  `Criar ordem de ${comprando ? "compra" : "venda"}`
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
