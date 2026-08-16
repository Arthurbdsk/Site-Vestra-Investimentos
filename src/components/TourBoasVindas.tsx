"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wallet, Globe2, Landmark, HandCoins, Bot, BookOpen, Trophy, ArrowRight, ArrowLeft } from "lucide-react";

const SLIDES = [
  {
    icone: Wallet,
    titulo: "Bem-vindo ao simulador",
    texto: "Você começa com R$ 100.000 fictícios. Nada aqui é dinheiro de verdade, é o seu campo de treino.",
  },
  {
    icone: Globe2,
    titulo: "Ações reais, da B3 e dos EUA",
    texto: "Os preços são reais, ao vivo. Explore empresas da bolsa brasileira e da NYSE/NASDAQ com explicação em português antes de comprar.",
  },
  {
    icone: Landmark,
    titulo: "Renda fixa: CDB e Tesouro Direto",
    texto: "Prefere não arriscar tanto? Aplique num CDB ou Tesouro simulado e veja o rendimento se acumular sozinho.",
  },
  {
    icone: HandCoins,
    titulo: "Empréstimo com juros da Selic",
    texto: "Quer investir mais do que tem no caixa? Pegue emprestado (com juros reais da Selic) e pratique alavancagem sem risco de verdade.",
  },
  {
    icone: Bot,
    titulo: "Assistente e agente de IA",
    texto: "Converse com o assistente pra tirar dúvidas ou pedir uma compra/venda, ou deixe um agente automático operar sozinho seguindo as regras que você definir.",
  },
  {
    icone: BookOpen,
    titulo: "Aprenda enquanto pratica",
    texto: "Artigos curtos, um teste de perfil de investidor e um planejador de metas te ajudam a entender o porquê de cada decisão.",
  },
  {
    icone: Trophy,
    titulo: "Conquistas, streaks e ranking",
    texto: "Volte todo dia pra manter sua sequência, desbloqueie conquistas e veja como você está no ranking geral.",
  },
];

const CHAVE = "tour_visto";

export function TourBoasVindas({ mostrar }: { mostrar: boolean }) {
  const [aberto, setAberto] = useState(false);
  const [passo, setPasso] = useState(0);

  useEffect(() => {
    if (mostrar && !localStorage.getItem(CHAVE)) {
      setAberto(true);
    }
  }, [mostrar]);

  function fechar() {
    localStorage.setItem(CHAVE, "1");
    setAberto(false);
  }

  if (!aberto) return null;

  const primeiro = passo === 0;
  const ultimo = passo === SLIDES.length - 1;
  const Slide = SLIDES[passo];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={fechar}
        className="fixed inset-0 z-[85] flex items-end justify-center bg-blue-deep/60 backdrop-blur-sm sm:items-center"
      >
        <motion.div
          initial={{ y: 40, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 22 }}
          onClick={(e) => e.stopPropagation()}
          className="relative w-full max-w-sm bg-paper p-8 text-center shadow-2xl"
        >
          <button
            onClick={fechar}
            aria-label="Fechar"
            className="absolute right-5 top-5 text-ink-muted transition-colors hover:text-ink"
          >
            <X size={20} />
          </button>

          <AnimatePresence mode="wait">
            <motion.div
              key={passo}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25 }}
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-blue/10">
                <Slide.icone size={28} className="text-blue" />
              </div>
              <p className="mt-5 font-display text-xl font-bold text-ink">{Slide.titulo}</p>
              <p className="mt-3 text-sm leading-relaxed text-ink-muted">{Slide.texto}</p>
            </motion.div>
          </AnimatePresence>

          <div className="mt-6 flex justify-center gap-1.5">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setPasso(i)}
                aria-label={`Ir pro passo ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === passo ? "w-5 bg-blue" : "w-1.5 bg-[var(--rule)] hover:bg-blue/50"
                }`}
              />
            ))}
          </div>

          <div className="mt-6 flex gap-2">
            {!primeiro && (
              <button
                onClick={() => setPasso((p) => p - 1)}
                aria-label="Voltar"
                className="flex items-center justify-center border border-[var(--rule)] px-4 py-3 text-ink-muted transition-colors hover:border-blue hover:text-blue"
              >
                <ArrowLeft size={15} />
              </button>
            )}
            <button
              onClick={() => (ultimo ? fechar() : setPasso((p) => p + 1))}
              className="flex flex-1 items-center justify-center gap-2 bg-blue px-6 py-3 text-sm font-semibold text-onblue transition-colors hover:bg-blue-deep"
            >
              {ultimo ? "Começar" : "Próximo"}
              <ArrowRight size={15} />
            </button>
          </div>

          {!ultimo && (
            <button
              onClick={fechar}
              className="mt-4 font-mono text-[11px] uppercase tracking-widest text-ink-muted hover:text-ink"
            >
              Pular tutorial
            </button>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
