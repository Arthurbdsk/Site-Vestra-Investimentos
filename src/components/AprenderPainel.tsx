"use client";

import { useId, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookOpen, Newspaper, Calculator, ChevronDown, UserCheck } from "lucide-react";
import { GLOSSARIO } from "@/lib/glossario";
import { ARTIGOS } from "@/lib/artigos";
import { caminhoSuave } from "@/lib/svgPath";
import { brl } from "@/lib/formato";
import { QuizPerfil } from "./QuizPerfil";

type Aba = "dicionario" | "artigos" | "calculadora" | "perfil";

export function AprenderPainel() {
  const [aba, setAba] = useState<Aba>("dicionario");

  const abas: { id: Aba; label: string; icone: typeof BookOpen }[] = [
    { id: "dicionario", label: "Dicionário", icone: BookOpen },
    { id: "artigos", label: "Artigos", icone: Newspaper },
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
              style={{ color: aba === id ? "var(--color-blue)" : "var(--color-ink-muted)" }}
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
            {aba === "artigos" && <Artigos />}
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
        {lista.map((g, i) => (
          <motion.li
            key={g.termo}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.03, 0.4) }}
            className="bg-paper p-5"
          >
            <p className="font-display text-lg text-ink">{g.termo}</p>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">
              {g.definicao}
            </p>
          </motion.li>
        ))}
      </ul>

      {lista.length === 0 && (
        <p className="mt-8 text-ink-muted">Nenhum termo encontrado.</p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Artigos() {
  const [aberto, setAberto] = useState<string | null>(null);

  return (
    <div>
      <h2 className="font-display text-2xl text-ink">Artigos</h2>
      <p className="mt-2 max-w-xl leading-relaxed text-ink-muted">
        Textos curtos pra entender o essencial, sem enrolação.
      </p>

      <ul className="mt-6 border-t border-[var(--rule)]">
        {ARTIGOS.map((a) => {
          const expandido = aberto === a.slug;
          return (
            <li key={a.slug} className="border-b border-[var(--rule)]">
              <button
                onClick={() => setAberto(expandido ? null : a.slug)}
                className="flex w-full items-center justify-between gap-4 py-5 text-left"
              >
                <div>
                  <p className="font-display text-lg text-ink">{a.titulo}</p>
                  <p className="mt-1 text-sm text-ink-muted">{a.resumo}</p>
                </div>
                <ChevronDown
                  size={18}
                  className={`shrink-0 text-ink-muted transition-transform ${expandido ? "rotate-180" : ""}`}
                />
              </button>

              <div className="grid transition-all duration-300" style={{ gridTemplateRows: expandido ? "1fr" : "0fr" }}>
                <div className="overflow-hidden">
                  <div className="space-y-3 pb-6 pr-8 text-sm leading-relaxed text-ink-muted">
                    {a.corpo.map((par, i) => (
                      <p key={i}>{par}</p>
                    ))}
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
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
              <stop offset="0%" stopColor="var(--color-blue)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--color-blue)" stopOpacity="0" />
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
            stroke="var(--color-blue)"
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
