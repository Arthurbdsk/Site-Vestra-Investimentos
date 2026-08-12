"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Landmark, Loader2, AlertCircle } from "lucide-react";
import { pedirEmprestimo, pagarEmprestimo, type EstadoEmprestimo } from "@/app/simulador/operacoesEmprestimo";
import { brl, numero } from "@/lib/formato";

export function EmprestimoPainel({ emprestimo }: { emprestimo: EstadoEmprestimo | null }) {
  const router = useRouter();
  const [valorPedir, setValorPedir] = useState(1000);
  const [valorPagar, setValorPagar] = useState(1000);
  const [enviando, setEnviando] = useState<"pedir" | "pagar" | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  if (!emprestimo) {
    return (
      <div>
        <h2 className="font-display text-2xl text-ink">Empréstimo</h2>
        <p className="mt-4 text-ink-muted">Não foi possível carregar seu empréstimo agora.</p>
      </div>
    );
  }

  const divida = emprestimo.divida;
  const temDivida = divida > 0;
  const emChamadaDeMargem = emprestimo.patrimonioLiquido < 0;

  async function pedir() {
    setErro(null);
    setEnviando("pedir");
    const r = await pedirEmprestimo(valorPedir);
    setEnviando(null);
    if (!r.ok) {
      setErro(r.mensagem);
      return;
    }
    router.refresh();
  }

  async function pagar() {
    setErro(null);
    setEnviando("pagar");
    const r = await pagarEmprestimo(Math.min(valorPagar, divida));
    setEnviando(null);
    if (!r.ok) {
      setErro(r.mensagem);
      return;
    }
    router.refresh();
  }

  return (
    <div>
      <h2 className="font-display text-2xl text-ink">Empréstimo</h2>
      <p className="mt-2 max-w-xl leading-relaxed text-ink-muted">
        Pegue dinheiro emprestado pra investir mais do que seu saldo permite
        (alavancagem). Os juros seguem a Selic, a mesma taxa usada como juros
        legal no Brasil, e são compostos todo dia sobre o que você ainda deve.
      </p>

      {emChamadaDeMargem && (
        <div className="mt-6 flex items-start gap-3 border border-rose-600/40 bg-rose-600/10 px-5 py-4">
          <AlertCircle size={20} className="mt-0.5 shrink-0 text-rose-600" />
          <p className="text-sm text-ink">
            Sua dívida já ultrapassou seu patrimônio. O simulador vende suas
            posições automaticamente até cobrir a diferença, assim como uma
            chamada de margem de verdade.
          </p>
        </div>
      )}

      <div className="mt-6 grid gap-px bg-[var(--rule)] sm:grid-cols-3">
        <div className="bg-paper p-5">
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">Dívida atual</p>
          <p className={`mt-1 font-mono text-2xl tabular ${temDivida ? "text-rose-600" : "text-ink"}`}>
            {brl(emprestimo.divida)}
          </p>
        </div>
        <div className="bg-paper p-5">
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">Juros (Selic)</p>
          <p className="mt-1 font-mono text-2xl tabular text-ink">
            {numero(emprestimo.taxaAnualPct, 2)}% <span className="text-sm text-ink-muted">ao ano</span>
          </p>
        </div>
        <div className="bg-paper p-5">
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
            Disponível pra pegar
          </p>
          <p className="mt-1 font-mono text-2xl tabular text-blue">{brl(emprestimo.disponivel)}</p>
          <p className="mt-1 text-xs text-ink-muted">Limite de 50% do seu patrimônio.</p>
        </div>
      </div>

      {erro && (
        <p className="mt-4 flex items-center gap-2 text-sm text-rose-600">
          <AlertCircle size={15} className="shrink-0" />
          {erro}
        </p>
      )}

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="border border-[var(--rule)] bg-paper p-5">
          <div className="flex items-center gap-2">
            <Landmark size={18} className="text-blue" />
            <p className="font-semibold text-ink">Pedir emprestado</p>
          </div>
          <input
            type="number"
            min={1}
            value={valorPedir}
            onChange={(e) => setValorPedir(Math.max(1, Number(e.target.value) || 1))}
            className="mt-4 w-full border border-[var(--rule)] bg-paper px-4 py-2.5 text-center font-mono tabular text-ink outline-none focus:border-blue"
          />
          <button
            onClick={pedir}
            disabled={enviando !== null || emprestimo.disponivel <= 0}
            className="mt-3 flex w-full items-center justify-center gap-2 bg-blue px-5 py-2.5 text-sm font-semibold text-onblue transition-colors hover:bg-blue-deep disabled:opacity-40"
          >
            {enviando === "pedir" ? <Loader2 size={15} className="animate-spin" /> : `Pegar ${brl(valorPedir)}`}
          </button>
        </div>

        <div className="border border-[var(--rule)] bg-paper p-5">
          <div className="flex items-center gap-2">
            <Landmark size={18} className="text-teal" />
            <p className="font-semibold text-ink">Pagar dívida</p>
          </div>
          <input
            type="number"
            min={1}
            value={valorPagar}
            onChange={(e) => setValorPagar(Math.max(1, Number(e.target.value) || 1))}
            disabled={!temDivida}
            className="mt-4 w-full border border-[var(--rule)] bg-paper px-4 py-2.5 text-center font-mono tabular text-ink outline-none focus:border-teal disabled:opacity-40"
          />
          <button
            onClick={pagar}
            disabled={enviando !== null || !temDivida}
            className="mt-3 flex w-full items-center justify-center gap-2 border border-teal px-5 py-2.5 text-sm font-semibold text-teal transition-colors hover:bg-teal hover:text-onblue disabled:opacity-40"
          >
            {enviando === "pagar" ? <Loader2 size={15} className="animate-spin" /> : `Pagar ${brl(Math.min(valorPagar, emprestimo.divida))}`}
          </button>
        </div>
      </div>
    </div>
  );
}
