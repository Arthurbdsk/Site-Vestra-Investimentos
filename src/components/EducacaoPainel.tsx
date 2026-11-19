"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, BookOpen, Check, ChevronDown, ClipboardCheck, Layers, X as XIcon } from "lucide-react";
import { CONCEITOS, CONTEUDO_REVISADO_EM, PASSOS_CARTEIRA, PRODUTOS, type Produto } from "@/lib/educacaoFinanceira";
import { CLASSES, MODELOS, somaRendaVariavel } from "@/lib/avaliarCarteira";
import { PERFIS, type PerfilId } from "@/lib/perfilInvestidor";
import { AvaliadorCarteira, BarraAlocacao, COR_CLASSE } from "./AvaliadorCarteira";

type Etapa = "basico" | "carteira" | "avaliar";

const ETAPAS: { id: Etapa; numero: number; label: string; icone: typeof BookOpen }[] = [
  { id: "basico", numero: 1, label: "O básico", icone: BookOpen },
  { id: "carteira", numero: 2, label: "Como montar uma carteira", icone: Layers },
  { id: "avaliar", numero: 3, label: "Monte e avalie", icone: ClipboardCheck },
];

export function EducacaoPainel({ perfilInicial = null }: { perfilInicial?: PerfilId | null }) {
  const [etapa, setEtapa] = useState<Etapa>("basico");

  function irPara(e: Etapa) {
    setEtapa(e);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <main className="grain relative min-h-[70vh] flex-1 bg-paper">
      <div className="ruled absolute inset-0 opacity-70" aria-hidden="true" />

      <div className="relative z-[2] mx-auto max-w-4xl px-6 pt-16 pb-8">
        <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-[var(--color-gold-texto)]">
          Educação financeira
        </p>
        <h1 className="mt-2 font-display text-4xl leading-tight text-ink sm:text-5xl">
          Do zero à sua primeira carteira
        </h1>
        <p className="mt-4 max-w-xl border-l-[3px] border-gold pl-5 text-lg leading-relaxed text-ink-muted">
          Entenda o que é um título, um CDB, uma LCI. Depois aprenda a montar uma carteira e
          descubra se a sua combina com o seu perfil.
        </p>
      </div>

      <div className="sticky top-[57px] z-30 border-b border-[var(--rule)] bg-paper/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl gap-1 overflow-x-auto px-6">
          {ETAPAS.map(({ id, numero, label, icone: Icone }) => (
            <button
              key={id}
              onClick={() => setEtapa(id)}
              className="relative flex shrink-0 items-center gap-2 px-4 py-4 text-sm font-medium transition-colors"
              style={{ color: etapa === id ? "var(--color-azul-texto)" : "var(--color-ink-muted)" }}
            >
              <span className="font-mono text-xs">{numero}.</span>
              <Icone size={16} />
              {label}
              {etapa === id && (
                <motion.span
                  layoutId="educacao-etapa-ativa"
                  className="absolute inset-x-0 bottom-0 h-[3px] bg-gold"
                  transition={{ type: "spring", stiffness: 320, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="relative z-[2] mx-auto max-w-4xl px-6 py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={etapa}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {etapa === "basico" && <Basico aoAvancar={() => irPara("carteira")} />}
            {etapa === "carteira" && <ComoMontar aoAvancar={() => irPara("avaliar")} />}
            {etapa === "avaliar" && <AvaliadorCarteira perfilInicial={perfilInicial} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}

function BotaoAvancar({ children, onClick }: { children: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group mt-12 inline-flex items-center gap-2 bg-blue px-6 py-3 text-left text-sm font-semibold text-onblue transition-colors hover:bg-blue-deep"
    >
      {children}
      <ArrowRight size={16} className="shrink-0 transition-transform group-hover:translate-x-1" />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Etapa 1                                                             */
/* ------------------------------------------------------------------ */

function Basico({ aoAvancar }: { aoAvancar: () => void }) {
  const [grupo, setGrupo] = useState<"Renda fixa" | "Renda variável">("Renda fixa");
  const [aberto, setAberto] = useState<string | null>("cdb");
  const lista = PRODUTOS.filter((p) => p.grupo === grupo);

  return (
    <div>
      <h2 className="font-display text-2xl text-ink">Primeiro, as ideias que aparecem em tudo</h2>
      <p className="mt-2 max-w-xl leading-relaxed text-ink-muted">
        Com esses seis conceitos você consegue entender qualquer investimento que aparecer no app da corretora.
      </p>

      <ul className="mt-6 grid gap-px bg-[var(--rule)] sm:grid-cols-2">
        {CONCEITOS.map((c, i) => (
          <motion.li
            key={c.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`border-l-[3px] bg-paper p-5 ${i % 2 === 0 ? "border-blue" : "border-gold"}`}
          >
            <p className="font-display text-lg text-ink">{c.titulo}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{c.texto}</p>
            {c.exemplo && (
              <p className="mt-3 bg-paper-alt px-3 py-2 text-sm leading-relaxed text-ink">{c.exemplo}</p>
            )}
          </motion.li>
        ))}
      </ul>

      <h2 className="mt-16 font-display text-2xl text-ink">Os investimentos, um por um</h2>
      <p className="mt-2 max-w-xl leading-relaxed text-ink-muted">
        Toque em cada um para ver quem emite, como rende, o risco, o imposto e quando faz sentido.
      </p>

      <div className="mt-6 flex gap-2">
        {(["Renda fixa", "Renda variável"] as const).map((g) => (
          <button
            key={g}
            onClick={() => setGrupo(g)}
            aria-pressed={grupo === g}
            className={`border px-4 py-2 text-sm font-semibold transition-colors ${
              grupo === g ? "border-blue bg-blue text-onblue" : "border-[var(--rule)] text-ink hover:border-blue"
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      <ul className="mt-5 divide-y divide-[var(--rule)] border-y border-[var(--rule)]">
        {lista.map((p) => (
          <ItemProduto
            key={p.id}
            produto={p}
            aberto={aberto === p.id}
            alternar={() => setAberto(aberto === p.id ? null : p.id)}
          />
        ))}
      </ul>

      <p className="mt-4 font-mono text-[11px] text-ink-muted">
        Regras de imposto e garantia revisadas em {CONTEUDO_REVISADO_EM}. Elas mudam com o tempo, então
        confirme na corretora antes de investir.
      </p>

      <TesteRapido />

      <BotaoAvancar onClick={aoAvancar}>Próxima etapa: como montar uma carteira</BotaoAvancar>
    </div>
  );
}

function NivelRisco({ nivel }: { nivel: number }) {
  return (
    <span className="flex items-center gap-0.5" role="img" aria-label={`Risco ${nivel} de 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className="h-2 w-3"
          style={{
            background: n <= nivel ? (nivel >= 4 ? "var(--color-coral)" : "var(--color-gold)") : "var(--rule)",
          }}
        />
      ))}
    </span>
  );
}

function ItemProduto({ produto: p, aberto, alternar }: { produto: Produto; aberto: boolean; alternar: () => void }) {
  const linhas: [string, string][] = [
    ["Quem emite", p.quemEmite],
    ["Como rende", p.comoRende],
    ["Risco", p.risco],
    ["Liquidez", p.liquidez],
    ["Imposto", p.imposto],
    ["Garantia", p.garantia],
    ["Quando faz sentido", p.quandoFazSentido],
  ];
  return (
    <li>
      <button
        onClick={alternar}
        aria-expanded={aberto}
        className="flex w-full items-center gap-4 py-4 text-left transition-colors hover:bg-paper-alt"
      >
        <span className="min-w-0 flex-1">
          <span className="block font-display text-lg text-ink">{p.nome}</span>
          <span className="block text-sm text-ink-muted">{p.resumo}</span>
        </span>
        <NivelRisco nivel={p.nivelRisco} />
        <ChevronDown
          size={18}
          className={`shrink-0 text-ink-muted transition-transform ${aberto ? "rotate-180" : ""}`}
        />
      </button>
      <AnimatePresence initial={false}>
        {aberto && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <dl className="grid gap-x-6 gap-y-3 pb-6 sm:grid-cols-[160px_1fr]">
              {linhas.map(([rotulo, texto]) => (
                <div key={rotulo} className="contents">
                  <dt className="font-mono text-[11px] uppercase tracking-widest text-ink-muted sm:pt-0.5">
                    {rotulo}
                  </dt>
                  <dd className="text-sm leading-relaxed text-ink">{texto}</dd>
                </div>
              ))}
            </dl>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

const PERGUNTAS_TESTE = [
  {
    pergunta: "Quando você compra um título de renda fixa, você está:",
    opcoes: ["Virando sócio de uma empresa", "Emprestando dinheiro em troca de juros", "Comprando uma moeda"],
    certa: 1,
    explica: "Título é dívida: você empresta e recebe o valor de volta com juros no vencimento.",
  },
  {
    pergunta: "Qual destes é isento de imposto de renda para pessoa física?",
    opcoes: ["CDB", "Tesouro Selic", "LCI"],
    certa: 2,
    explica: "LCI e LCA são isentas. CDB e Tesouro pagam imposto pela tabela regressiva, de 22,5% a 15%.",
  },
  {
    pergunta: "Onde faz mais sentido guardar a reserva de emergência?",
    opcoes: ["Tesouro Selic", "Ações", "Tesouro IPCA+ 2045"],
    certa: 0,
    explica:
      "A reserva precisa de liquidez diária e quase nenhuma oscilação. O IPCA+ longo pode cair de preço se você precisar vender antes.",
  },
  {
    pergunta: "O FGC devolve seu dinheiro se o banco quebrar em qual destes casos?",
    opcoes: ["Debênture de uma empresa", "CDB de até R$ 250 mil", "Ações do banco"],
    certa: 1,
    explica:
      "O FGC cobre CDB, LCI, LCA e poupança até R$ 250 mil por CPF por banco. Debêntures e ações não têm FGC.",
  },
];

function TesteRapido() {
  const [respostas, setRespostas] = useState<(number | null)[]>(PERGUNTAS_TESTE.map(() => null));
  const acertos = respostas.filter((r, i) => r === PERGUNTAS_TESTE[i].certa).length;
  const terminou = respostas.every((r) => r !== null);

  return (
    <section className="mt-16 border-t border-[var(--rule)] pt-10">
      <h2 className="font-display text-2xl text-ink">Teste rápido</h2>
      <p className="mt-2 text-ink-muted">Quatro perguntas pra ver se ficou claro.</p>
      <ol className="mt-6 space-y-8">
        {PERGUNTAS_TESTE.map((q, i) => {
          const r = respostas[i];
          return (
            <li key={q.pergunta}>
              <p className="font-semibold text-ink">
                {i + 1}. {q.pergunta}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {q.opcoes.map((o, j) => {
                  const mostrar = r !== null && (r === j || j === q.certa);
                  const certo = j === q.certa;
                  return (
                    <button
                      key={o}
                      disabled={r !== null}
                      onClick={() => setRespostas((rs) => rs.map((x, k) => (k === i ? j : x)))}
                      className="inline-flex items-center gap-2 border px-4 py-2 text-sm transition-colors enabled:hover:border-blue disabled:cursor-default"
                      style={{
                        borderColor: mostrar ? (certo ? "var(--color-teal)" : "var(--color-coral)") : "var(--rule)",
                        color: mostrar
                          ? certo
                            ? "var(--color-teal-texto)"
                            : "var(--color-coral-texto)"
                          : "var(--color-ink)",
                      }}
                    >
                      {mostrar && (certo ? <Check size={14} /> : <XIcon size={14} />)}
                      {o}
                    </button>
                  );
                })}
              </div>
              {r !== null && <p className="mt-2 text-sm leading-relaxed text-ink-muted">{q.explica}</p>}
            </li>
          );
        })}
      </ol>
      {terminou && (
        <p className="mt-8 font-display text-xl text-ink">
          Você acertou {acertos} de {PERGUNTAS_TESTE.length}.{" "}
          {acertos === PERGUNTAS_TESTE.length ? "Pronto pra montar a carteira." : "Vale reler os cards acima."}
        </p>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Etapa 2                                                             */
/* ------------------------------------------------------------------ */

function ComoMontar({ aoAvancar }: { aoAvancar: () => void }) {
  return (
    <div>
      <h2 className="font-display text-2xl text-ink">Como montar uma carteira, em 6 passos</h2>
      <p className="mt-2 max-w-xl leading-relaxed text-ink-muted">
        Carteira é o conjunto de todos os seus investimentos. Montar bem é mais sobre ordem e
        proporção do que sobre achar o investimento perfeito.
      </p>

      <ol className="mt-8 space-y-px bg-[var(--rule)]">
        {PASSOS_CARTEIRA.map((p, i) => (
          <motion.li
            key={p.numero}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex gap-5 bg-paper p-5"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center bg-gold font-mono text-sm font-bold text-blue">
              {p.numero}
            </span>
            <div className="min-w-0">
              <p className="font-display text-lg text-ink">{p.titulo}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">{p.texto}</p>
              <p className="mt-2 text-sm font-medium text-ink">{p.dica}</p>
            </div>
          </motion.li>
        ))}
      </ol>

      <h2 className="mt-16 font-display text-2xl text-ink">Carteiras modelo por perfil</h2>
      <p className="mt-2 max-w-xl leading-relaxed text-ink-muted">
        Um ponto de partida para quem já tem a reserva de emergência. Quanto mais arrojado o perfil,
        maior a fatia de renda variável.
      </p>

      <div className="mt-6 space-y-8">
        {(Object.keys(MODELOS) as PerfilId[]).map((id) => {
          const m = MODELOS[id];
          const rv = somaRendaVariavel(m);
          return (
            <div key={id}>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                <p className="font-display text-lg text-ink">{PERFIS[id].nome}</p>
                <p className="font-mono text-xs text-ink-muted">
                  {100 - rv}% renda fixa, {rv}% renda variável
                </p>
              </div>
              <div className="mt-2">
                <BarraAlocacao valores={m} altura={20} />
              </div>
              <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                {CLASSES.filter((c) => m[c.id] > 0).map((c) => (
                  <li key={c.id} className="flex items-center gap-1.5 text-xs text-ink-muted">
                    <span className="inline-block h-2 w-2" style={{ background: COR_CLASSE[c.id] }} />
                    {c.nome} {m[c.id]}%
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      <p className="mt-8 border-l-[3px] border-gold pl-5 text-sm leading-relaxed text-ink-muted">
        Repare que nenhuma carteira tem poupança e todas têm uma base de renda fixa. Mesmo o arrojado
        guarda uma parte em títulos, que serve de colchão nas quedas da bolsa e de munição para comprar
        barato.
      </p>

      <BotaoAvancar onClick={aoAvancar}>Próxima etapa: monte a sua e peça uma avaliação</BotaoAvancar>
    </div>
  );
}
