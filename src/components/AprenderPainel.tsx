"use client";

import { useEffect, useId, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { CAPAS, type CapaArtigo } from "@/lib/blog";
import {
  BookOpen,
  Newspaper,
  Calculator,
  UserCheck,
  ArrowLeft,
  Compass,
  Scale,
  Layers,
  Percent,
  AlertTriangle,
  LineChart,
  Clock,
  Check,
  X as XIcon,
  Trophy,
  Loader2,
  type LucideIcon,
} from "lucide-react";
import { GLOSSARIO } from "@/lib/glossario";
import { ARTIGOS, type Artigo } from "@/lib/artigos";
import { caminhoSuave } from "@/lib/svgPath";
import { brl } from "@/lib/formato";
import { artigosConcluidos, marcarArtigoConcluido } from "@/lib/progressoAprender";
import { QuizPerfil } from "./QuizPerfil";
import { PopupTrilhaCompleta } from "./PopupTrilhaCompleta";
import { CENARIOS, type Cenario } from "@/lib/cenarios";
import { buscarSerieCenario } from "@/app/aprender/buscarCenarioAction";
import { GraficoPreco } from "./GraficoPreco";
import type { PontoSerie } from "@/lib/historico";
import { data as fmtData } from "@/lib/formato";

type Aba = "dicionario" | "artigos" | "cenarios" | "calculadora" | "perfil";

export function AprenderPainel({ userId }: { userId?: string | null } = {}) {
  const [aba, setAba] = useState<Aba>("dicionario");

  const abas: { id: Aba; label: string; icone: typeof BookOpen }[] = [
    { id: "dicionario", label: "Dicionário", icone: BookOpen },
    { id: "artigos", label: "Artigos", icone: Newspaper },
    { id: "cenarios", label: "Cenários históricos", icone: LineChart },
    { id: "calculadora", label: "Calculadora", icone: Calculator },
    { id: "perfil", label: "Seu perfil", icone: UserCheck },
  ];

  return (
    <main className="grain relative min-h-[70vh] flex-1 bg-paper">
      <div className="ruled absolute inset-0 opacity-70" aria-hidden="true" />

      <div className="relative z-[2] mx-auto max-w-4xl px-6 pt-16 pb-8">
        <h1 className="font-display text-4xl leading-tight text-ink sm:text-5xl">
          Aprender
        </h1>
        <p className="mt-4 max-w-xl border-l-[3px] border-gold pl-5 text-lg leading-relaxed text-ink-muted">
          Explicações simples sobre como o mercado funciona, sem economês.
        </p>
      </div>

      <div className="sticky top-[57px] z-30 border-b border-[var(--rule)] bg-paper/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-4xl gap-1 overflow-x-auto px-6">
          {abas.map(({ id, label, icone: Icone }) => (
            <button
              key={id}
              onClick={() => setAba(id)}
              className="relative flex shrink-0 items-center gap-2 px-4 py-4 text-sm font-medium transition-colors"
              style={{ color: aba === id ? "var(--color-azul-texto)" : "var(--color-ink-muted)" }}
            >
              <Icone size={16} />
              {label}
              {aba === id && (
                <motion.span
                  layoutId="aprender-aba-ativa"
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
            key={aba}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {aba === "dicionario" && <Dicionario />}
            {aba === "artigos" && <Artigos userId={userId} />}
            {aba === "cenarios" && <Cenarios />}
            {aba === "calculadora" && <CalculadoraJuros />}
            {aba === "perfil" && <QuizPerfil />}
          </motion.div>
        </AnimatePresence>
      </div>
    </main>
  );
}

/* ------------------------------------------------------------------ */

function Dicionario() {
  const [busca, setBusca] = useState("");
  const t = busca.trim().toLowerCase();
  const lista = GLOSSARIO.filter(
    (g) => !t || g.termo.toLowerCase().includes(t) || g.definicao.toLowerCase().includes(t),
  );

  return (
    <div>
      <h2 className="font-display text-2xl text-ink">Dicionário de termos</h2>
      <p className="mt-2 max-w-xl leading-relaxed text-ink-muted">
        {GLOSSARIO.length} termos explicados em português simples, sem
        economês.
      </p>

      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar um termo"
        className="mt-6 w-full max-w-sm border border-[var(--rule)] bg-paper px-4 py-3 text-ink outline-none transition-colors placeholder:text-ink-muted/60 focus:border-blue"
      />

      <ul className="mt-6 grid gap-px bg-[var(--rule)] sm:grid-cols-2">
        {lista.map((g, i) => {
          const cor = i % 2 === 0 ? "border-blue" : "border-gold";
          return (
            <motion.li
              key={g.termo}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.03, 0.4) }}
              className={`border-l-4 bg-paper p-5 ${cor}`}
            >
              <p className={`font-display text-xl font-bold ${i % 2 === 0 ? "text-blue" : "text-ink"}`}>
                {g.termo}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">
                {g.definicao}
              </p>
            </motion.li>
          );
        })}
      </ul>

      {lista.length === 0 && (
        <p className="mt-8 text-ink-muted">Nenhum termo encontrado.</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

/**
 * Capa de cada trilha, por assunto (nao rotativa): a foto entra no lugar
 * do bloco de cor chapada, e o icone fica sobre ela pra a leitura rapida
 * do cartao nao depender da imagem carregar.
 */
const ESTILO_ARTIGO: Record<string, { icone: LucideIcon; capa: CapaArtigo }> = {
  "por-onde-comecar": { icone: Compass, capa: "conceito" },
  "renda-fixa-vs-variavel": { icone: Scale, capa: "mercado" },
  "diversificar-de-verdade": { icone: Layers, capa: "bolsa" },
  "selic-sobe-desce": { icone: Percent, capa: "renda-fixa" },
  "erros-comuns-iniciante": { icone: AlertTriangle, capa: "mercado" },
  "ler-grafico-sem-se-perder": { icone: LineChart, capa: "imoveis" },
};

const ESTILO_RESERVA = { icone: Compass, capa: "conceito" as CapaArtigo };

function tempoLeitura(artigo: Artigo): number {
  const palavras = artigo.corpo.join(" ").split(/\s+/).length;
  return Math.max(1, Math.round(palavras / 200));
}

function Artigos({ userId }: { userId?: string | null }) {
  const [aberto, setAberto] = useState<string | null>(null);
  const [concluidos, setConcluidos] = useState<string[]>([]);
  const [trilhaCompleta, setTrilhaCompleta] = useState(false);
  const artigo = ARTIGOS.find((a) => a.slug === aberto);

  useEffect(() => {
    setConcluidos(artigosConcluidos(userId));
    // So precisa reler quando o usuario logado muda (login/logout), nao a
    // cada render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  function aoConcluirQuiz(slug: string) {
    const antes = artigosConcluidos(userId);
    marcarArtigoConcluido(slug, userId);
    const depois = artigosConcluidos(userId);
    setConcluidos(depois);
    // So celebra na transicao pra 100%, nao em toda visita que ja estava completa.
    if (antes.length < ARTIGOS.length && depois.length === ARTIGOS.length) {
      setTrilhaCompleta(true);
    }
  }

  if (artigo) {
    return (
      <div>
        {trilhaCompleta && (
          <PopupTrilhaCompleta aoFechar={() => setTrilhaCompleta(false)} />
        )}
        <button
          onClick={() => setAberto(null)}
          className="group inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-blue transition-colors hover:text-gold"
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
          Voltar pros artigos
        </button>

        <h2 className="mt-6 font-display text-3xl font-bold text-ink sm:text-4xl">
          {artigo.titulo}
        </h2>
        <p className="mt-2 flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-ink-muted">
          <Clock size={12} />
          {tempoLeitura(artigo)} min de leitura
        </p>

        <div className="mt-6 border-l-4 border-gold bg-gold/10 p-5">
          <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-blue">
            Resumo
          </p>
          <p className="mt-1.5 text-lg font-semibold leading-snug text-ink">
            {artigo.resumo}
          </p>
        </div>

        <div className="mt-8 space-y-4 text-base leading-relaxed text-ink-muted">
          {artigo.corpo.map((par, i) =>
            i === 0 ? (
              <p key={i} className="text-lg font-semibold leading-relaxed text-ink">
                {par}
              </p>
            ) : (
              <p key={i}>{par}</p>
            ),
          )}
        </div>

        <QuizArtigo
          artigo={artigo}
          concluido={concluidos.includes(artigo.slug)}
          aoConcluir={() => aoConcluirQuiz(artigo.slug)}
        />
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-ink">Artigos</h2>
          <p className="mt-2 max-w-xl leading-relaxed text-ink-muted">
            Textos curtos pra entender o essencial, sem enrolação. Cada um
            termina com um quiz rápido.
          </p>
        </div>
        <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
          {concluidos.length}/{ARTIGOS.length} concluídos
        </p>
      </div>

      <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-[var(--rule)]">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(concluidos.length / ARTIGOS.length) * 100}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="h-full rounded-full bg-gradient-to-r from-gold to-amber-400"
        />
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {ARTIGOS.map((a, i) => {
          const estilo = ESTILO_ARTIGO[a.slug] ?? ESTILO_RESERVA;
          const Icone = estilo.icone;
          const concluido = concluidos.includes(a.slug);
          return (
            <motion.button
              key={a.slug}
              onClick={() => setAberto(a.slug)}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.05, 0.4) }}
              className="group relative flex flex-col overflow-hidden border border-[var(--rule)] bg-paper text-left transition-colors hover:border-blue"
            >
              {concluido && (
                <span className="absolute right-3 top-3 z-[1] flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white">
                  <Check size={13} />
                </span>
              )}
              <div className="relative flex h-28 items-center justify-center overflow-hidden bg-blue">
                <Image
                  src={CAPAS[estilo.capa].arquivo}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
                {/* Véu escuro: as capas variam de exposição, e sem ele o
                    ícone e o rótulo somem nas mais claras. */}
                <div className="absolute inset-0 bg-blue-deep/55" />
                <span className="absolute left-3 top-3 font-mono text-[10px] font-bold uppercase tracking-widest text-onblue-muted">
                  Aula {String(i + 1).padStart(2, "0")} de {ARTIGOS.length}
                </span>
                <Icone size={36} className="relative text-gold" />
              </div>
              <div className="p-5">
                <p className="font-display text-xl font-bold leading-snug text-ink group-hover:text-blue">
                  {a.titulo}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink-muted">{a.resumo}</p>
                <p className="mt-3 flex items-center gap-1.5 font-mono text-[11px] font-semibold uppercase tracking-widest text-gold-texto">
                  <Clock size={12} />
                  {tempoLeitura(a)} min de leitura
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function QuizArtigo({
  artigo,
  concluido,
  aoConcluir,
}: {
  artigo: Artigo;
  concluido: boolean;
  aoConcluir: () => void;
}) {
  const [respostas, setRespostas] = useState<(number | null)[]>(
    artigo.quiz.map(() => null),
  );
  const [conferido, setConferido] = useState(false);

  const acertos = respostas.filter((r, i) => r === artigo.quiz[i].correta).length;
  const todasRespondidas = respostas.every((r) => r !== null);

  function confirmar() {
    setConferido(true);
    if (acertos === artigo.quiz.length) aoConcluir();
  }

  function tentarDeNovo() {
    setRespostas(artigo.quiz.map(() => null));
    setConferido(false);
  }

  return (
    <div className="mt-10 border-t border-[var(--rule)] pt-8">
      <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-ink-muted">
        {concluido && <Trophy size={13} className="text-gold" />}
        {concluido ? "Quiz concluído" : "Testou o que leu?"}
      </p>
      <h3 className="mt-2 font-display text-xl text-ink">Quiz rápido</h3>

      <div className="mt-5 space-y-6">
        {artigo.quiz.map((q, qi) => (
          <div key={qi}>
            <p className="font-semibold text-ink">{q.pergunta}</p>
            <div className="mt-3 space-y-2">
              {q.opcoes.map((op, oi) => {
                const selecionada = respostas[qi] === oi;
                const mostrarResultado = conferido;
                const estaCorreta = oi === q.correta;
                return (
                  <button
                    key={oi}
                    disabled={conferido}
                    onClick={() =>
                      setRespostas((r) => r.map((v, i) => (i === qi ? oi : v)))
                    }
                    className={`flex w-full items-center justify-between gap-3 border px-4 py-2.5 text-left text-sm transition-colors ${
                      mostrarResultado && estaCorreta
                        ? "border-emerald-500 bg-emerald-50 text-emerald-800"
                        : mostrarResultado && selecionada
                          ? "border-rose-500 bg-rose-50 text-rose-800"
                          : selecionada
                            ? "border-blue text-blue"
                            : "border-[var(--rule)] text-ink hover:border-blue"
                    } disabled:cursor-default`}
                  >
                    {op}
                    {mostrarResultado && estaCorreta && <Check size={15} className="shrink-0" />}
                    {mostrarResultado && selecionada && !estaCorreta && (
                      <XIcon size={15} className="shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {!conferido ? (
        <button
          onClick={confirmar}
          disabled={!todasRespondidas}
          className="mt-6 bg-blue px-6 py-3 text-sm font-semibold text-onblue transition-colors hover:bg-blue-deep disabled:opacity-40"
        >
          Confirmar respostas
        </button>
      ) : acertos === artigo.quiz.length ? (
        <p className="mt-6 flex items-center gap-2 border-l-[3px] border-emerald-500 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <Trophy size={15} />
          Acertou tudo! Artigo concluído.
        </p>
      ) : (
        <div className="mt-6">
          <p className="text-sm text-ink-muted">
            Acertou {acertos} de {artigo.quiz.length}. Dá uma olhada de novo e tenta outra vez.
          </p>
          <button
            onClick={tentarDeNovo}
            className="mt-3 border border-[var(--rule)] px-5 py-2 font-mono text-xs uppercase tracking-widest text-ink-muted transition-colors hover:border-blue hover:text-blue"
          >
            Tentar de novo
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

type EstadoCenario =
  | { fase: "carregando" }
  | { fase: "erro"; mensagem: string }
  | { fase: "feito"; serie: PontoSerie[] };

function Cenarios() {
  const [aberto, setAberto] = useState<string | null>(null);
  const [estado, setEstado] = useState<EstadoCenario>({ fase: "carregando" });
  const cenario = CENARIOS.find((c) => c.slug === aberto);

  useEffect(() => {
    if (!cenario) return;
    let cancelado = false;
    setEstado({ fase: "carregando" });
    buscarSerieCenario(cenario.ticker, cenario.dataInicio, cenario.dataFim).then((r) => {
      if (cancelado) return;
      setEstado(r.ok ? { fase: "feito", serie: r.serie } : { fase: "erro", mensagem: r.mensagem });
    });
    return () => {
      cancelado = true;
    };
  }, [cenario]);

  if (cenario) {
    return (
      <div>
        <button
          onClick={() => setAberto(null)}
          className="group inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-blue transition-colors hover:text-gold"
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
          Voltar pros cenários
        </button>

        <h2 className="mt-6 font-display text-3xl font-bold text-ink sm:text-4xl">
          {cenario.titulo}
        </h2>
        <p className="mt-2 text-sm text-ink-muted">
          {cenario.nomeAtivo} · {fmtData(cenario.dataInicio)} a {fmtData(cenario.dataFim)}
        </p>

        <div className="mt-6 border-l-4 border-gold bg-gold/10 p-5">
          <p className="text-lg font-semibold leading-snug text-ink">{cenario.resumo}</p>
        </div>

        <div className="mt-8">
          {estado.fase === "carregando" && (
            <div className="flex items-center gap-2 text-sm text-ink-muted">
              <Loader2 size={14} className="animate-spin" />
              Buscando o histórico de preço real desse período...
            </div>
          )}
          {estado.fase === "erro" && (
            <p className="text-sm text-rose-600">{estado.mensagem}</p>
          )}
          {estado.fase === "feito" && <GraficoPreco serie={estado.serie} />}
        </div>

        <div className="mt-8 space-y-4 text-base leading-relaxed text-ink-muted">
          {cenario.narrativa.map((par, i) => (
            <p key={i} className={i === 0 ? "text-lg font-semibold leading-relaxed text-ink" : ""}>
              {par}
            </p>
          ))}
        </div>

        <div className="mt-8 border-t border-[var(--rule)] pt-6">
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
            Linha do tempo
          </p>
          <ul className="mt-4 space-y-3">
            {cenario.marcos.map((m) => (
              <li key={m.data} className="flex gap-4">
                <span className="w-24 shrink-0 font-mono text-xs tabular text-ink-muted">
                  {fmtData(m.data)}
                </span>
                <span className="text-sm text-ink">{m.texto}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="mt-8 font-mono text-[11px] leading-relaxed text-ink-muted">
          O gráfico usa preço de fechamento real do período (fonte externa,
          pode ter pequenas diferenças de precisão). Rentabilidade passada
          não indica rentabilidade futura, cada crise é diferente.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display text-2xl text-ink">Cenários históricos</h2>
      <p className="mt-2 max-w-xl leading-relaxed text-ink-muted">
        Reveja, com preço real, o que aconteceu em alguns dos momentos mais
        marcantes do mercado nos últimos anos.
      </p>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {CENARIOS.map((c, i) => (
          <motion.button
            key={c.slug}
            onClick={() => setAberto(c.slug)}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.05, 0.4) }}
            className="group flex flex-col border border-[var(--rule)] bg-paper p-5 text-left transition-colors hover:border-blue"
          >
            <span className="flex items-center gap-1.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-gold-texto">
              <LineChart size={12} />
              {fmtData(c.dataInicio).slice(3)}
            </span>
            <p className="mt-2 font-display text-xl font-bold leading-snug text-ink group-hover:text-blue">
              {c.titulo}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{c.resumo}</p>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function CalculadoraJuros() {
  const gradId = useId();
  const [inicial, setInicial] = useState(1000);
  const [aporte, setAporte] = useState(200);
  const [taxaAnual, setTaxaAnual] = useState(10);
  const [anos, setAnos] = useState(10);

  const meses = Math.max(1, anos) * 12;
  const taxaMensal = Math.pow(1 + taxaAnual / 100, 1 / 12) - 1;

  const serie: number[] = [inicial];
  let saldo = inicial;
  for (let m = 1; m <= meses; m++) {
    saldo = saldo * (1 + taxaMensal) + aporte;
    serie.push(saldo);
  }

  const totalAportado = inicial + aporte * meses;
  const totalFinal = serie[serie.length - 1];
  const totalJuros = totalFinal - totalAportado;

  const W = 640;
  const H = 220;
  const PAD = 8;
  const max = Math.max(...serie);
  const min = Math.min(...serie, 0);
  const range = max - min || 1;
  const pontos = serie.map((v, i) => ({
    x: PAD + (i / (serie.length - 1)) * (W - PAD * 2),
    y: PAD + (1 - (v - min) / range) * (H - PAD * 2),
  }));
  const linha = caminhoSuave(pontos);
  const ultimo = pontos[pontos.length - 1];
  const area = `${linha} L${ultimo.x.toFixed(2)},${H - PAD} L${pontos[0].x.toFixed(2)},${H - PAD} Z`;

  return (
    <div>
      <h2 className="font-display text-2xl text-ink">Calculadora de juros compostos</h2>
      <p className="mt-2 max-w-xl leading-relaxed text-ink-muted">
        Veja como um valor inicial e aportes mensais crescem ao longo do
        tempo, com juros sobre juros.
      </p>

      <div className="mt-8 grid gap-5 border border-[var(--rule)] bg-paper-alt p-6 sm:grid-cols-2">
        <Campo label="Valor inicial (R$)" value={inicial} onChange={setInicial} />
        <Campo label="Aporte mensal (R$)" value={aporte} onChange={setAporte} />
        <Campo label="Taxa de juros ao ano (%)" value={taxaAnual} onChange={setTaxaAnual} step={0.5} />
        <Campo label="Por quantos anos" value={anos} onChange={setAnos} min={1} max={50} />
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        <Resultado label="Total investido" valor={brl(totalAportado)} />
        <Resultado label="Juros ganhos" valor={brl(totalJuros)} destaque />
        <Resultado label="Valor final" valor={brl(totalFinal)} grande />
      </div>

      <div className="mt-8">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" aria-hidden="true">
          {[0.25, 0.5, 0.75].map((g) => (
            <line key={g} x1="0" x2={W} y1={H * g} y2={H * g} stroke="var(--rule)" strokeDasharray="3 5" />
          ))}
          <defs>
            <linearGradient id={`grad-juros-${gradId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-azul-texto)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--color-azul-texto)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <motion.path
            d={area}
            fill={`url(#grad-juros-${gradId})`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          />
          <motion.path
            d={linha}
            fill="none"
            stroke="var(--color-azul-texto)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.1, ease: "easeInOut" }}
          />
        </svg>
        <div className="mt-2 flex items-center justify-between font-mono text-[11px] text-ink-muted">
          <span>Hoje · {brl(serie[0])}</span>
          <span>
            Em {anos} {anos === 1 ? "ano" : "anos"} · {brl(serie[serie.length - 1])}
          </span>
        </div>
      </div>

      <p className="mt-6 font-mono text-[11px] text-ink-muted">
        Simulação simplificada, com taxa constante. Não considera inflação,
        impostos ou taxas de administração.
      </p>
    </div>
  );
}

function Campo({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  max,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      <label className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
        {label}
      </label>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Math.max(min, Number(e.target.value) || min))}
        className="mt-2 w-full border border-[var(--rule)] bg-paper px-4 py-3 text-ink outline-none transition-colors focus:border-blue"
      />
    </div>
  );
}

function Resultado({
  label,
  valor,
  destaque = false,
  grande = false,
}: {
  label: string;
  valor: string;
  destaque?: boolean;
  grande?: boolean;
}) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
        {label}
      </p>
      <p
        className={`mt-1.5 font-mono tabular ${grande ? "text-2xl text-blue" : "text-xl text-ink"} ${destaque ? "text-emerald-600" : ""}`}
      >
        {valor}
      </p>
    </div>
  );
}
