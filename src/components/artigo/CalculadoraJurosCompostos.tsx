"use client";

import { useState } from "react";
import { brl } from "@/lib/formato";

/**
 * Calculadora de juros compostos pra dentro de artigo.
 *
 * O texto explica o conceito; aqui a pessoa mexe nos numeros e ve a curva
 * abrir. E o mesmo calculo da home (Manifesto), mas com taxa e prazo
 * ajustaveis, porque no artigo o assunto E a mecanica.
 */
function projetar(mensal: number, anos: number, taxaAnual: number) {
  const i = Math.pow(1 + taxaAnual, 1 / 12) - 1;
  const pontos: { ano: number; guardado: number; total: number }[] = [];

  for (let ano = 0; ano <= anos; ano++) {
    const meses = ano * 12;
    // Serie de aportes mensais: cada parcela rende pelos meses restantes.
    const total = meses === 0 ? 0 : mensal * ((Math.pow(1 + i, meses) - 1) / i);
    pontos.push({ ano, guardado: mensal * meses, total });
  }
  return pontos;
}

const L = 640;
const A = 190;

export function CalculadoraJurosCompostos() {
  const [mensal, setMensal] = useState(200);
  const [anos, setAnos] = useState(20);
  const [taxa, setTaxa] = useState(10);

  const pontos = projetar(mensal, anos, taxa / 100);
  const fim = pontos[pontos.length - 1];
  const juros = fim.total - fim.guardado;
  const teto = fim.total || 1;

  const x = (ano: number) => (anos === 0 ? 0 : (ano / anos) * L);
  const y = (v: number) => A - (v / teto) * (A - 8) - 4;

  const linha = (chave: "total" | "guardado") =>
    pontos
      .map((p, idx) => `${idx === 0 ? "M" : "L"}${x(p.ano).toFixed(1)},${y(p[chave]).toFixed(1)}`)
      .join(" ");

  return (
    <div className="not-prose my-10 border border-[var(--rule)] bg-paper-alt">
      <div className="border-b border-[var(--rule)] px-5 py-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">
          Experimente
        </p>
        <p className="mt-1 font-display text-xl text-ink">
          Quanto vira um aporte mensal
        </p>
      </div>

      <div className="grid gap-5 px-5 py-5 sm:grid-cols-3">
        <Controle
          rotulo="Por mês"
          valor={brl(mensal)}
          min={25}
          max={2000}
          passo={25}
          bruto={mensal}
          aoMudar={setMensal}
        />
        <Controle
          rotulo="Por quantos anos"
          valor={`${anos} ${anos === 1 ? "ano" : "anos"}`}
          min={1}
          max={40}
          passo={1}
          bruto={anos}
          aoMudar={setAnos}
        />
        <Controle
          rotulo="Retorno ao ano"
          valor={`${taxa}%`}
          min={1}
          max={20}
          passo={1}
          bruto={taxa}
          aoMudar={setTaxa}
        />
      </div>

      <div className="px-2 pb-1">
        <svg
          viewBox={`0 0 ${L} ${A}`}
          className="h-44 w-full"
          preserveAspectRatio="none"
          role="img"
          aria-label={`Em ${anos} anos, ${brl(fim.guardado)} aportados viram ${brl(fim.total)}.`}
        >
          <path d={`${linha("total")} L${L},${A} L0,${A} Z`} fill="var(--color-teal-texto)" opacity={0.12} />
          <path
            d={linha("total")}
            fill="none"
            stroke="var(--color-teal-texto)"
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
          />
          <path
            d={linha("guardado")}
            fill="none"
            stroke="var(--color-ink-muted)"
            strokeWidth={1.5}
            strokeDasharray="4 4"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>

      <div className="grid grid-cols-1 gap-px border-t border-[var(--rule)] bg-[var(--rule)] sm:grid-cols-3">
        <Numero rotulo="Saiu do seu bolso" valor={brl(fim.guardado)} />
        <Numero rotulo="Os juros somaram" valor={brl(juros)} cor="var(--color-teal-texto)" />
        <Numero rotulo="Total no fim" valor={brl(fim.total)} destaque />
      </div>

      <p className="border-t border-[var(--rule)] px-5 py-3 font-mono text-[10px] leading-relaxed text-ink-muted">
        Projeção hipotética com retorno constante, só pra mostrar o efeito dos
        juros compostos. Não é promessa de rentabilidade nem recomendação de
        investimento.
      </p>
    </div>
  );
}

function Controle({
  rotulo,
  valor,
  min,
  max,
  passo,
  bruto,
  aoMudar,
}: {
  rotulo: string;
  valor: string;
  min: number;
  max: number;
  passo: number;
  bruto: number;
  aoMudar: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
        {rotulo}
      </span>
      <span className="mt-1 block font-mono text-lg tabular text-ink">{valor}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={passo}
        value={bruto}
        onChange={(e) => aoMudar(Number(e.target.value))}
        className="mt-2 w-full accent-[var(--color-azul-texto)]"
      />
    </label>
  );
}

function Numero({
  rotulo,
  valor,
  cor,
  destaque = false,
}: {
  rotulo: string;
  valor: string;
  cor?: string;
  destaque?: boolean;
}) {
  return (
    <div className="bg-paper px-5 py-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
        {rotulo}
      </p>
      <p
        className={`mt-1 font-mono tabular ${destaque ? "text-2xl" : "text-lg"}`}
        style={{ color: cor ?? (destaque ? "var(--color-azul-texto)" : "var(--color-ink)") }}
      >
        {valor}
      </p>
    </div>
  );
}
