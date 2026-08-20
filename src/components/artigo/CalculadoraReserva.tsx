"use client";

import { useState } from "react";
import { brl } from "@/lib/formato";

/**
 * Reserva de emergencia: despesa mensal -> faixa de 3 a 6 meses.
 *
 * O artigo diz "3 a 6 meses das suas despesas"; aqui a pessoa poe o
 * proprio numero e ve o alvo, em vez de fazer a conta de cabeca.
 */
const PERFIS = [
  {
    id: "estavel",
    rotulo: "Salário fixo",
    meses: 3,
    explica: "Renda previsível e estável costuma se apoiar em 3 meses.",
  },
  {
    id: "medio",
    rotulo: "Renda mista",
    meses: 4,
    explica: "Parte fixa, parte variável: um meio de caminho.",
  },
  {
    id: "autonomo",
    rotulo: "Autônomo",
    meses: 6,
    explica: "Renda que oscila (ou sustentar outras pessoas) pede 6 meses ou mais.",
  },
] as const;

export function CalculadoraReserva() {
  const [despesa, setDespesa] = useState(3000);
  const [perfil, setPerfil] = useState<(typeof PERFIS)[number]["id"]>("estavel");

  const escolhido = PERFIS.find((p) => p.id === perfil) ?? PERFIS[0];
  const alvo = despesa * escolhido.meses;

  return (
    <div className="not-prose my-10 border border-[var(--rule)] bg-paper-alt">
      <div className="border-b border-[var(--rule)] px-5 py-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">
          Faça a sua conta
        </p>
        <p className="mt-1 font-display text-xl text-ink">
          Qual o tamanho da sua reserva
        </p>
      </div>

      <div className="px-5 py-5">
        <label className="block">
          <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
            Quanto você gasta por mês
          </span>
          <span className="mt-1 block font-mono text-2xl tabular text-ink">
            {brl(despesa)}
          </span>
          <input
            type="range"
            min={500}
            max={20000}
            step={100}
            value={despesa}
            onChange={(e) => setDespesa(Number(e.target.value))}
            className="mt-2 w-full accent-[var(--color-azul-texto)]"
          />
        </label>

        <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
          Como é a sua renda
        </p>
        <div className="mt-2 flex gap-px border border-[var(--rule)]">
          {PERFIS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPerfil(p.id)}
              className="flex-1 px-2 py-2.5 font-mono text-[11px] uppercase tracking-wider transition-colors"
              style={{
                color:
                  perfil === p.id ? "var(--color-azul-texto)" : "var(--color-ink-muted)",
                background:
                  perfil === p.id ? "var(--color-paper-alt)" : "var(--color-paper)",
              }}
            >
              {p.rotulo}
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          {escolhido.explica}
        </p>
      </div>

      <div className="border-t border-[var(--rule)] bg-paper px-5 py-5">
        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-muted">
          Sua reserva deveria ser perto de
        </p>
        <p className="mt-1 font-mono text-3xl tabular text-gold-texto">{brl(alvo)}</p>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          {escolhido.meses} meses de despesa, guardados em algo de liquidez
          diária — dá pra resgatar a qualquer momento, sem perder valor por
          sacar na hora errada.
        </p>
      </div>
    </div>
  );
}
