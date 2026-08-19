"use client";

import { useState } from "react";
import { brl } from "@/lib/formato";

/**
 * Poupanca x CDB x Tesouro Selic, lado a lado, no LIQUIDO.
 *
 * O artigo argumenta que a isencao de imposto da poupanca raramente
 * compensa a diferenca de rentabilidade. Aqui isso deixa de ser uma frase
 * e vira numero: o imposto entra na conta e a comparacao e do que sobra.
 *
 * As taxas ficam ajustaveis porque Selic e CDI mudam; travar um numero
 * aqui envelheceria o artigo em poucos meses.
 */

/** IR regressivo da renda fixa, por prazo de aplicacao. */
function aliquotaIr(meses: number): number {
  if (meses <= 6) return 0.225;
  if (meses <= 12) return 0.2;
  if (meses <= 24) return 0.175;
  return 0.15;
}

/** Regra legal da poupanca: com Selic acima de 8,5%, 0,5% ao mes + TR. */
function rendimentoPoupanca(selic: number): number {
  return selic > 8.5 ? 0.005 * 12 * 100 : selic * 0.7;
}

export function ComparadorRendaFixa() {
  const [valor, setValor] = useState(10000);
  const [meses, setMeses] = useState(24);
  const [selic, setSelic] = useState(10.5);
  const [pctCdi, setPctCdi] = useState(100);

  const anos = meses / 12;
  const ir = aliquotaIr(meses);
  /** Aplica o IR regressivo so sobre o rendimento, nunca sobre o principal. */
  const liquidar = (bruto: number) => valor + (bruto - valor) * (1 - ir);

  const taxaPoupanca = rendimentoPoupanca(selic) / 100;
  // Poupanca e isenta de IR pra pessoa fisica: o bruto ja e o liquido.
  const liquidoPoupanca = valor * Math.pow(1 + taxaPoupanca, anos);

  // CDI fica um pouco abaixo da Selic na pratica; o percentual do CDI e
  // ajustavel porque e exatamente o numero que os bancos anunciam.
  const cdi = selic / 100;
  const liquidoCdb = liquidar(valor * Math.pow(1 + cdi * (pctCdi / 100), anos));
  // Tesouro Selic acompanha a Selic cheia, menos a custodia da B3.
  const liquidoTesouro = liquidar(valor * Math.pow(1 + (cdi - 0.002), anos));

  const linhas = [
    { nome: "Poupança", liquido: liquidoPoupanca, nota: "isenta de IR", cor: "var(--color-ink-muted)" },
    {
      nome: `CDB ${pctCdi}% do CDI`,
      liquido: liquidoCdb,
      nota: `IR de ${(ir * 100).toFixed(1)}%`,
      cor: "var(--color-teal-texto)",
    },
    {
      nome: "Tesouro Selic",
      liquido: liquidoTesouro,
      nota: `IR de ${(ir * 100).toFixed(1)}% + custódia`,
      cor: "var(--color-azul-texto)",
    },
  ];
  const melhor = Math.max(...linhas.map((l) => l.liquido));

  return (
    <div className="not-prose my-10 border border-[var(--rule)] bg-paper-alt">
      <div className="border-b border-[var(--rule)] px-5 py-4">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">
          Compare você mesmo
        </p>
        <p className="mt-1 font-display text-xl text-ink">
          Quanto sobra depois do imposto
        </p>
      </div>

      <div className="grid gap-5 px-5 py-5 sm:grid-cols-2 lg:grid-cols-4">
        <Controle
          rotulo="Valor aplicado"
          valor={brl(valor)}
          min={1000}
          max={100000}
          passo={1000}
          bruto={valor}
          aoMudar={setValor}
        />
        <Controle
          rotulo="Por quanto tempo"
          valor={`${meses} meses`}
          min={6}
          max={60}
          passo={6}
          bruto={meses}
          aoMudar={setMeses}
        />
        <Controle
          rotulo="Selic ao ano"
          valor={`${selic.toFixed(2)}%`}
          min={2}
          max={16}
          passo={0.25}
          bruto={selic}
          aoMudar={setSelic}
        />
        <Controle
          rotulo="CDB paga do CDI"
          valor={`${pctCdi}%`}
          min={80}
          max={130}
          passo={5}
          bruto={pctCdi}
          aoMudar={setPctCdi}
        />
      </div>

      <ul className="grid gap-px border-t border-[var(--rule)] bg-[var(--rule)]">
        {linhas.map((l) => {
          const proporcao = melhor > 0 ? l.liquido / melhor : 0;
          const ganho = l.liquido - valor;
          return (
            <li key={l.nome} className="bg-paper px-5 py-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-semibold text-ink">
                  {l.nome}{" "}
                  <span className="font-mono text-[10px] font-normal uppercase tracking-wider text-ink-muted">
                    {l.nota}
                  </span>
                </p>
                <p className="font-mono tabular text-ink">
                  {brl(l.liquido)}{" "}
                  <span className="text-xs" style={{ color: l.cor }}>
                    (+{brl(ganho)})
                  </span>
                </p>
              </div>
              {/* Barra proporcional ao melhor resultado: a diferenca fica
                  visivel antes de a pessoa comparar os numeros. */}
              <div className="mt-2 h-1.5 w-full bg-paper-alt">
                <div
                  className="h-full transition-all"
                  style={{ width: `${Math.max(2, proporcao * 100)}%`, background: l.cor }}
                />
              </div>
            </li>
          );
        })}
      </ul>

      <p className="border-t border-[var(--rule)] px-5 py-3 font-mono text-[10px] leading-relaxed text-ink-muted">
        Simulação simplificada: assume Selic constante no período, usa 0,2% ao
        ano de custódia no Tesouro e ignora TR e IOF (que incide nos 30
        primeiros dias). Serve pra comparar a ordem de grandeza, não como
        projeção exata.
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
