"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2, Landmark, PiggyBank, TrendingUp } from "lucide-react";
import { CDBS } from "@/lib/rendaFixa";
import { investirRendaFixa, resgatarRendaFixa } from "@/app/simulador/operacoesRendaFixa";
import { brl, numero, data as fmtData } from "@/lib/formato";

export type PosicaoRendaFixa = {
  id: string;
  tipo: "cdb" | "tesouro";
  nome: string;
  valorInvestido: number;
  taxaAnual: number;
  dataAplicacao: string;
};

type TituloTesouro = {
  symbol: string;
  nome: string;
  indexador: string;
  taxaCompra: number;
  precoCompra: number;
  vencimento: string;
};

type EstadoDados =
  | { fase: "carregando" }
  | { fase: "erro"; mensagem: string }
  | { fase: "feito"; cdi: number; tesouro: TituloTesouro[]; avisoTesouro: string | null };

function valorAtual(pos: PosicaoRendaFixa): number {
  const dias = Math.max(
    0,
    Math.floor((Date.now() - new Date(pos.dataAplicacao).getTime()) / 86_400_000),
  );
  return pos.valorInvestido * Math.pow(1 + pos.taxaAnual, dias / 365);
}

export function RendaFixaPainel({ posicoes }: { posicoes: PosicaoRendaFixa[] }) {
  const [estado, setEstado] = useState<EstadoDados>({ fase: "carregando" });

  useEffect(() => {
    let cancelado = false;
    fetch("/api/renda-fixa")
      .then((r) => r.json())
      .then((json) => {
        if (cancelado) return;
        if (json.cdi) {
          setEstado({
            fase: "feito",
            cdi: json.cdi.taxaAnual,
            tesouro: json.tesouro ?? [],
            avisoTesouro: json.avisoTesouro,
          });
        } else {
          setEstado({ fase: "erro", mensagem: json.mensagem ?? "Não foi possível buscar as taxas." });
        }
      })
      .catch(() => setEstado({ fase: "erro", mensagem: "Não foi possível buscar as taxas." }));
    return () => {
      cancelado = true;
    };
  }, []);

  return (
    <div>
      <h2 className="font-display text-2xl text-ink">Renda fixa</h2>
      <p className="mt-2 max-w-xl leading-relaxed text-ink-muted">
        CDB e Tesouro Direto: você combina uma taxa no momento da aplicação
        e o dinheiro rende sozinho, sem oscilar como uma ação.
      </p>

      {estado.fase === "carregando" && (
        <div className="mt-10 flex items-center gap-2 text-ink-muted">
          <Loader2 size={16} className="animate-spin" />
          Carregando taxas…
        </div>
      )}

      {estado.fase === "erro" && (
        <p className="mt-8 text-ink-muted">{estado.mensagem}</p>
      )}

      {estado.fase === "feito" && (
        <>
          <div className="mt-6 flex items-center gap-3 border border-[var(--rule)] bg-paper-alt px-5 py-4">
            <TrendingUp size={20} className="text-blue" />
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
                CDI hoje (aproximado pela Selic)
              </p>
              <p className="font-mono text-xl tabular text-ink">
                {numero(estado.cdi * 100, 2)}% ao ano
              </p>
            </div>
          </div>

          {posicoes.length > 0 && (
            <div className="mt-10">
              <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
                Seus investimentos
              </p>
              <ul className="mt-3 grid gap-px bg-[var(--rule)] sm:grid-cols-2">
                {posicoes.map((p, i) => (
                  <PosicaoCartao key={p.id} pos={p} delay={i * 0.05} />
                ))}
              </ul>
            </div>
          )}

          <div className="mt-10">
            <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
              CDB (renda fixa privada)
            </p>
            <ul className="mt-3 grid gap-px bg-[var(--rule)] sm:grid-cols-2">
              {CDBS.map((c, i) => (
                <CdbCartao key={c.id} cdb={c} cdi={estado.cdi} delay={i * 0.05} />
              ))}
            </ul>
          </div>

          <div className="mt-10">
            <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
              Tesouro Direto (títulos reais do governo)
            </p>
            {estado.avisoTesouro && (
              <p className="mt-3 text-sm text-ink-muted">{estado.avisoTesouro}</p>
            )}
            <ul className="mt-3 grid gap-px bg-[var(--rule)] sm:grid-cols-2">
              {estado.tesouro.slice(0, 8).map((t, i) => (
                <TesouroCartao key={t.symbol} titulo={t} delay={i * 0.05} />
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function FormularioInvestir({
  onConfirmar,
}: {
  onConfirmar: (valor: number) => Promise<void>;
}) {
  const [aberto, setAberto] = useState(false);
  const [valor, setValor] = useState(1000);
  const [enviando, setEnviando] = useState(false);

  if (!aberto) {
    return (
      <button
        onClick={() => setAberto(true)}
        className="mt-4 w-full bg-blue px-5 py-2.5 text-sm font-semibold text-onblue transition-colors hover:bg-blue-deep"
      >
        Investir
      </button>
    );
  }

  return (
    <div className="mt-4 space-y-2">
      <input
        type="number"
        min={1}
        value={valor}
        onChange={(e) => setValor(Math.max(1, Number(e.target.value) || 1))}
        className="w-full border border-[var(--rule)] bg-paper px-4 py-2.5 text-center font-mono tabular text-ink outline-none focus:border-blue"
      />
      <button
        onClick={async () => {
          setEnviando(true);
          await onConfirmar(valor);
          setEnviando(false);
          setAberto(false);
        }}
        disabled={enviando}
        className="flex w-full items-center justify-center gap-2 bg-blue px-5 py-2.5 text-sm font-semibold text-onblue transition-colors hover:bg-blue-deep disabled:opacity-50"
      >
        {enviando ? <Loader2 size={15} className="animate-spin" /> : `Confirmar ${brl(valor)}`}
      </button>
    </div>
  );
}

function CdbCartao({
  cdb,
  cdi,
  delay,
}: {
  cdb: (typeof CDBS)[number];
  cdi: number;
  delay: number;
}) {
  const router = useRouter();
  const taxaAnual = cdi * (cdb.percentualCdi / 100);

  return (
    <motion.li
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-paper p-5"
    >
      <div className="flex items-start gap-3">
        <Landmark size={18} className="mt-0.5 shrink-0 text-blue" />
        <div>
          <p className="font-semibold text-ink">{cdb.banco}</p>
          <p className="text-sm text-ink-muted">
            {cdb.percentualCdi}% do CDI · liquidez {cdb.liquidez}
            {cdb.prazoMeses > 0 ? ` · ${cdb.prazoMeses} meses` : ""}
          </p>
        </div>
      </div>
      <p className="mt-3 font-mono text-lg tabular text-blue">
        {numero(taxaAnual * 100, 2)}% ao ano
      </p>
      <FormularioInvestir
        onConfirmar={async (valor) => {
          await investirRendaFixa("cdb", `CDB ${cdb.banco} (${cdb.percentualCdi}% do CDI)`, valor, taxaAnual);
          router.refresh();
        }}
      />
    </motion.li>
  );
}

function TesouroCartao({ titulo, delay }: { titulo: TituloTesouro; delay: number }) {
  const router = useRouter();
  const taxaAnual = titulo.taxaCompra / 100;

  return (
    <motion.li
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-paper p-5"
    >
      <div className="flex items-start gap-3">
        <PiggyBank size={18} className="mt-0.5 shrink-0 text-gold" />
        <div>
          <p className="font-semibold text-ink">{titulo.nome}</p>
          <p className="text-sm text-ink-muted">
            {titulo.indexador} · vencimento {titulo.vencimento ? fmtData(titulo.vencimento) : "—"}
          </p>
        </div>
      </div>
      <p className="mt-3 font-mono text-lg tabular text-gold">
        {numero(titulo.taxaCompra, 2)}% ao ano
      </p>
      <FormularioInvestir
        onConfirmar={async (valor) => {
          await investirRendaFixa("tesouro", titulo.nome, valor, taxaAnual);
          router.refresh();
        }}
      />
    </motion.li>
  );
}

function PosicaoCartao({ pos, delay }: { pos: PosicaoRendaFixa; delay: number }) {
  const router = useRouter();
  const [resgatando, setResgatando] = useState(false);
  const atual = valorAtual(pos);
  const ganho = atual - pos.valorInvestido;

  async function resgatar() {
    setResgatando(true);
    await resgatarRendaFixa(pos.id);
    router.refresh();
  }

  return (
    <motion.li
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-paper p-5"
    >
      <p className="font-semibold text-ink">{pos.nome}</p>
      <p className="text-xs text-ink-muted">
        Aplicado em {fmtData(pos.dataAplicacao)} · {brl(pos.valorInvestido)}
      </p>
      <p className="mt-3 font-mono text-xl tabular text-blue">{brl(atual)}</p>
      <p className="font-mono text-xs tabular text-emerald-600">+{brl(ganho)}</p>
      <button
        onClick={resgatar}
        disabled={resgatando}
        className="mt-4 w-full border border-blue px-5 py-2.5 text-sm font-semibold text-blue transition-colors hover:bg-blue hover:text-onblue disabled:opacity-50"
      >
        {resgatando ? "Resgatando…" : "Resgatar"}
      </button>
    </motion.li>
  );
}
