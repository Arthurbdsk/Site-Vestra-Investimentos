"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Loader2, Check, Search, Wallet } from "lucide-react";
import { perguntarAssistente } from "@/app/simulador/operacoesAssistente";
import type { ModoAssistente } from "@/lib/assistenteIA";

type Mensagem = { autor: "usuario" | "assistente"; texto: string; executouAcao?: boolean };

export function AssistenteChat() {
  const [aberto, setAberto] = useState(false);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [entrada, setEntrada] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [restantes, setRestantes] = useState<number | null>(null);
  const [modo, setModo] = useState<ModoAssistente>("padrao");
  const [, iniciar] = useTransition();
  const fimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens, aberto]);

  function enviar() {
    const pergunta = entrada.trim();
    if (!pergunta || enviando) return;

    const historico = mensagens.slice(-8);
    setMensagens((m) => [...m, { autor: "usuario", texto: pergunta }]);
    setEntrada("");
    setErro(null);
    setEnviando(true);

    iniciar(async () => {
      const r = await perguntarAssistente(pergunta, historico, modo);
      setEnviando(false);
      if (!r.ok) {
        setErro(r.mensagem);
        return;
      }
      setMensagens((m) => [...m, { autor: "assistente", texto: r.resposta, executouAcao: r.executouAcao }]);
      setRestantes(r.restantes);
    });
  }

  return (
    <>
      <button
        onClick={() => setAberto((v) => !v)}
        aria-label="Abrir assistente"
        className="fixed bottom-6 right-6 z-[75] flex h-14 w-14 items-center justify-center rounded-full bg-blue text-onblue shadow-2xl transition-colors hover:bg-blue-deep"
      >
        {aberto ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      <AnimatePresence>
        {aberto && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            className="fixed bottom-24 right-6 z-[75] flex h-[min(70vh,520px)] w-[min(90vw,380px)] flex-col border border-[var(--rule)] bg-paper shadow-2xl"
          >
            <div className="border-b border-[var(--rule)] bg-blue px-4 py-3">
              <div className="flex items-center justify-between">
                <p className="font-mono text-[11px] uppercase tracking-widest text-onblue">
                  Assistente Vestra
                </p>
                {restantes != null && (
                  <p className="font-mono text-[10px] text-onblue-muted">{restantes}/100 hoje</p>
                )}
              </div>
              <div className="mt-2 flex gap-1.5">
                <button
                  onClick={() => setModo("padrao")}
                  className={`flex items-center gap-1.5 border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                    modo === "padrao"
                      ? "border-onblue bg-onblue text-blue"
                      : "border-onblue-muted/40 text-onblue-muted hover:border-onblue-muted"
                  }`}
                >
                  <Wallet size={11} />
                  Operações
                </button>
                <button
                  onClick={() => setModo("busca")}
                  className={`flex items-center gap-1.5 border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                    modo === "busca"
                      ? "border-onblue bg-onblue text-blue"
                      : "border-onblue-muted/40 text-onblue-muted hover:border-onblue-muted"
                  }`}
                >
                  <Search size={11} />
                  Busca na web
                </button>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {mensagens.length === 0 && (
                <p className="text-sm text-ink-muted">
                  {modo === "padrao"
                    ? "Pergunte sobre sua carteira, termos financeiros, ou como o simulador funciona. Também posso comprar, vender ou criar uma ordem pra abertura do mercado se você pedir."
                    : "Modo busca: respondo com informação atual da web, mas não executo compra, venda ou ordens aqui. Troque pro modo \"Operações\" pra isso."}
                </p>
              )}
              {mensagens.map((m, i) => (
                <div
                  key={i}
                  className={`max-w-[85%] px-3 py-2 text-sm leading-relaxed ${
                    m.autor === "usuario"
                      ? "ml-auto bg-blue text-onblue"
                      : "bg-paper-alt text-ink"
                  }`}
                >
                  {m.executouAcao && (
                    <p className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-emerald-500">
                      <Check size={11} />
                      Operação executada
                    </p>
                  )}
                  {m.texto}
                </div>
              ))}
              {enviando && (
                <div className="flex items-center gap-2 text-sm text-ink-muted">
                  <Loader2 size={14} className="animate-spin" />
                  Pensando…
                </div>
              )}
              {erro && <p className="text-sm text-rose-600">{erro}</p>}
              <div ref={fimRef} />
            </div>

            <div className="flex items-center gap-2 border-t border-[var(--rule)] p-3">
              <input
                value={entrada}
                onChange={(e) => setEntrada(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && enviar()}
                placeholder="Digite sua pergunta"
                className="flex-1 border border-[var(--rule)] bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-blue"
              />
              <button
                onClick={enviar}
                disabled={enviando || !entrada.trim()}
                aria-label="Enviar"
                className="flex h-9 w-9 shrink-0 items-center justify-center bg-blue text-onblue transition-colors hover:bg-blue-deep disabled:opacity-50"
              >
                <Send size={15} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
