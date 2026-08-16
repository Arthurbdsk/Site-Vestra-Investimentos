"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { Logomark } from "../Logomark";
import { AvisoSimulacaoBloco } from "../AvisoSimulacao";
import { salvarOnboarding } from "@/app/simulador/operacoesOnboarding";

export type NivelExperiencia = "iniciante" | "intermediario" | "avancado";

const NIVEIS: {
  id: NivelExperiencia;
  titulo: string;
  descricao: string;
}[] = [
  {
    id: "iniciante",
    titulo: "Iniciante",
    descricao:
      "Nunca investi, ou mexi muito pouco. Quero entender as palavras antes de sair comprando.",
  },
  {
    id: "intermediario",
    titulo: "Intermediário",
    descricao:
      "Já invisto um pouco e entendo o básico. Quero praticar sem arriscar meu dinheiro.",
  },
  {
    id: "avancado",
    titulo: "Avançado",
    descricao:
      "Conheço o mercado. Quero testar estratégias e acompanhar meus números de perto.",
  },
];

/**
 * Onboarding de quatro telas, mostrado uma vez so.
 *
 * O nivel escolhido na ultima tela personaliza o CONTEUDO (o que a gente
 * explica, e quanto), e nunca tranca funcionalidade: quem se diz iniciante
 * enxerga o aplicativo inteiro igual a todo mundo. Trancar ferramenta por
 * nivel declarado seria punir a pessoa por ser honesta.
 */
export function Onboarding({ aoConcluir }: { aoConcluir?: () => void }) {
  const router = useRouter();
  const [tela, setTela] = useState(0);
  const [nivel, setNivel] = useState<NivelExperiencia | null>(null);
  const [salvando, setSalvando] = useState(false);

  async function concluir(nivelEscolhido: NivelExperiencia) {
    setNivel(nivelEscolhido);
    setSalvando(true);
    // Se a gravacao falhar, a pessoa entra do mesmo jeito. O onboarding
    // pode reaparecer numa proxima visita, o que e bem menos ruim do que
    // deixar alguem preso numa tela de boas-vindas.
    await salvarOnboarding(nivelEscolhido).catch(() => {});
    aoConcluir?.();
    router.refresh();
  }

  const telas = [
    {
      titulo: "Aprenda. Simule. Evolua.",
      texto:
        "O Vestra é um lugar pra você aprender a investir fazendo, e não lendo teoria solta. Você vai errar aqui, de graça, em vez de errar lá fora com o seu dinheiro.",
    },
    {
      titulo: "Dinheiro virtual. Experiência realista.",
      texto:
        "Você começa com R$ 100.000 virtuais. O saldo não é real e não pode ser sacado, transferido nem convertido em dinheiro. O que é real são os preços da bolsa, pra prática valer alguma coisa.",
    },
    {
      titulo: "Acompanhe sua evolução.",
      texto:
        "Cada operação entra no seu histórico. Você vê o que deu certo, o que deu errado e por quê, com gráficos e estatísticas que mostram sua evolução ao longo do tempo.",
    },
  ];

  const ultima = tela === 3;

  return (
    <div className="fixed inset-0 z-[90] flex flex-col bg-blue">
      <div className="grain pointer-events-none absolute inset-0" aria-hidden />

      <div className="relative z-[2] flex items-center justify-between px-6 pt-6">
        <Logomark size={34} />
        {!ultima && (
          <button
            onClick={() => setTela(3)}
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-onblue-muted transition-colors hover:text-gold"
          >
            Pular
          </button>
        )}
      </div>

      {/* Centralizar com `my-auto` no filho, e nao com `justify-center` no
          container: quando o conteudo passa da altura da tela (passo 4 num
          celular baixo), justify-center empurra o topo pra fora e a pessoa
          nao consegue rolar de volta pra ler o titulo. */}
      <div className="relative z-[2] flex flex-1 flex-col overflow-y-auto px-6 py-8">
        <div className="mx-auto my-auto w-full max-w-lg">
          <AnimatePresence mode="wait">
            {ultima ? (
              <motion.div
                key="nivel"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35 }}
              >
                {/* Contador, igual aos outros passos. "Ultima pergunta"
                    ficava com cara de eyebrow decorativo; numero e posicao. */}
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-gold">
                  04 de 04
                </p>
                <h1 className="mt-3 font-display text-3xl leading-tight text-onblue sm:text-4xl">
                  Onde você está hoje?
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-onblue-muted">
                  Isso muda só o jeito da gente explicar as coisas pra você.
                  Todas as ferramentas ficam liberadas do mesmo jeito, escolha o
                  que escolher.
                </p>

                <div className="mt-7 space-y-px bg-[var(--rule-inv)]">
                  {NIVEIS.map((n) => {
                    const escolhido = nivel === n.id;
                    return (
                      <button
                        key={n.id}
                        disabled={salvando}
                        onClick={() => concluir(n.id)}
                        className="group flex w-full items-start gap-4 bg-blue px-5 py-4 text-left transition-colors hover:bg-blue-deep disabled:opacity-60"
                      >
                        <span
                          className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center border transition-colors"
                          style={{
                            borderColor: escolhido
                              ? "var(--color-gold)"
                              : "var(--rule-inv)",
                            background: escolhido
                              ? "var(--color-gold)"
                              : "transparent",
                          }}
                        >
                          {escolhido && (
                            <Check size={13} className="text-blue-deep" />
                          )}
                        </span>
                        <span className="min-w-0">
                          <span className="block font-display text-lg text-onblue">
                            {n.titulo}
                          </span>
                          <span className="mt-1 block text-sm leading-relaxed text-onblue-muted">
                            {n.descricao}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-8">
                  <AvisoSimulacaoBloco sobreAzul />
                </div>
              </motion.div>
            ) : (
              <motion.div
                key={tela}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.35 }}
              >
                <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-gold">
                  {String(tela + 1).padStart(2, "0")} de 04
                </p>
                <h1 className="mt-3 font-display text-4xl leading-[1.05] text-onblue sm:text-5xl">
                  {telas[tela].titulo}
                </h1>
                <p className="mt-5 border-l-[3px] border-gold pl-5 text-base leading-relaxed text-onblue-muted">
                  {telas[tela].texto}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="relative z-[2] border-t border-[var(--rule-inv)] px-6 py-5">
        <div className="mx-auto flex w-full max-w-lg items-center justify-between gap-4">
          <div className="flex items-center gap-2" role="presentation">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="h-1 w-8 transition-colors"
                style={{
                  background:
                    i <= tela ? "var(--color-gold)" : "var(--rule-inv)",
                }}
              />
            ))}
          </div>

          {!ultima && (
            <button
              onClick={() => setTela((t) => t + 1)}
              className="group inline-flex items-center gap-2 bg-gold px-6 py-3 text-sm font-semibold text-blue-deep transition-colors hover:bg-gold-soft"
            >
              Continuar
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
