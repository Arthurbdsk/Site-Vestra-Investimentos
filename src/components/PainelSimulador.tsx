"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Search, Clock, TrendingUp, ArrowRight } from "lucide-react";
import { ModalOrdem, type OrdemAberta } from "./ModalOrdem";
import { CountUp } from "./CountUp";
import { ACOES, acaoPorTicker } from "@/lib/acoes";
import { brl, numero, pct, dataHora } from "@/lib/formato";
import type { Cotacao } from "@/lib/cotacoes";

export type Posicao = {
  ticker: string;
  quantidade: number;
  preco_medio: number;
};

export type Transacao = {
  id: string;
  ticker: string;
  tipo: "compra" | "venda";
  quantidade: number;
  preco: number;
  total: number;
  criado_em: string;
};

type Aba = "carteira" | "explorar" | "historico";

export function PainelSimulador({
  apelido,
  saldo,
  posicoes,
  transacoes,
  cotacoes,
  avisoCotacoes,
  visitante = false,
}: {
  apelido: string;
  saldo: number;
  posicoes: Posicao[];
  transacoes: Transacao[];
  cotacoes: Cotacao[];
  avisoCotacoes: string | null;
  visitante?: boolean;
}) {
  const [aba, setAba] = useState<Aba>(posicoes.length ? "carteira" : "explorar");
  const [ordem, setOrdem] = useState<OrdemAberta | null>(null);

  const precoDe = useMemo(() => {
    const mapa = new Map(cotacoes.map((c) => [c.ticker, c]));
    return (ticker: string) => mapa.get(ticker) ?? null;
  }, [cotacoes]);

  const investido = posicoes.reduce(
    (s, p) => s + p.quantidade * p.preco_medio,
    0,
  );
  const valorAtual = posicoes.reduce((s, p) => {
    const c = precoDe(p.ticker);
    return s + p.quantidade * (c?.preco ?? p.preco_medio);
  }, 0);
  const patrimonio = saldo + valorAtual;
  const lucro = valorAtual - investido;
  const lucroPct = investido > 0 ? (lucro / investido) * 100 : 0;

  const abas: { id: Aba; label: string; icone: typeof Wallet }[] = [
    { id: "carteira", label: "Minha carteira", icone: Wallet },
    { id: "explorar", label: "Explorar ações", icone: Search },
    { id: "historico", label: "Histórico", icone: Clock },
  ];

  return (
    <>
      {visitante && (
        <div className="border-b border-gold/40 bg-gold/15">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3">
            <p className="text-sm text-ink">
              Você está como visitante. Esta carteira vive só neste navegador
              e some se você limpar os dados dele.
            </p>
            <Link
              href="/cadastro"
              className="shrink-0 font-mono text-[11px] uppercase tracking-[0.18em] text-blue underline underline-offset-4 hover:text-ink"
            >
              Criar conta pra salvar
            </Link>
          </div>
        </div>
      )}

      {/* Resumo em azul */}
      <section className="grain relative bg-blue">
        <div className="ruled-inv absolute inset-0 opacity-50" aria-hidden="true" />
        <div className="relative z-[2] mx-auto max-w-6xl px-6 py-12">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-onblue-muted">
            Olá, {apelido}
          </p>

          <div className="mt-6 grid gap-8 sm:grid-cols-3">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-onblue-muted">
                Patrimônio total
              </p>
              <p className="mt-1.5 font-mono text-4xl tabular text-gold">
                <CountUp value={patrimonio} prefix="R$ " decimals={2} />
              </p>
              <p className="mt-1 text-xs text-onblue-muted">
                o que você tem em caixa mais o valor das suas ações
              </p>
            </div>

            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-onblue-muted">
                Livre pra investir
              </p>
              <p className="mt-1.5 font-mono text-2xl tabular text-onblue">
                {brl(saldo)}
              </p>
              <p className="mt-1 text-xs text-onblue-muted">
                dinheiro fictício ainda não aplicado
              </p>
            </div>

            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-onblue-muted">
                Ganho ou perda
              </p>
              {posicoes.length === 0 ? (
                <p className="mt-1.5 font-mono text-2xl tabular text-onblue-muted">
                  sem ações ainda
                </p>
              ) : (
                <>
                  <p
                    className={`mt-1.5 font-mono text-2xl tabular ${
                      lucro >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {lucro >= 0 ? "+" : ""}
                    {brl(lucro)}
                  </p>
                  <p className="mt-1 text-xs text-onblue-muted">
                    {pct(lucroPct)} sobre o que você investiu
                  </p>
                </>
              )}
            </div>
          </div>

          {avisoCotacoes && (
            <p className="mt-8 border-l-[3px] border-gold pl-4 text-sm text-onblue-muted">
              {avisoCotacoes}
            </p>
          )}
        </div>
      </section>

      {/* Abas */}
      <div className="sticky top-[57px] z-30 border-b border-[var(--rule)] bg-paper/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-6">
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
                  layoutId="aba-ativa"
                  className="absolute inset-x-0 bottom-0 h-[3px] bg-gold"
                  transition={{ type: "spring", stiffness: 320, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>

      <main className="grain relative min-h-[50vh] flex-1 bg-paper">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={aba}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {aba === "carteira" && (
                <Carteira
                  posicoes={posicoes}
                  precoDe={precoDe}
                  aoVender={(p) => {
                    const c = precoDe(p.ticker);
                    if (c)
                      setOrdem({
                        ticker: p.ticker,
                        preco: c.preco,
                        tipo: "vender",
                        limite: p.quantidade,
                      });
                  }}
                  aoExplorar={() => setAba("explorar")}
                />
              )}

              {aba === "explorar" && (
                <Explorar
                  precoDe={precoDe}
                  aoComprar={(ticker) => {
                    const c = precoDe(ticker);
                    if (c)
                      setOrdem({
                        ticker,
                        preco: c.preco,
                        tipo: "comprar",
                        limite: saldo,
                      });
                  }}
                />
              )}

              {aba === "historico" && <Historico transacoes={transacoes} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <ModalOrdem ordem={ordem} aoFechar={() => setOrdem(null)} />
    </>
  );
}

/* ------------------------------------------------------------------ */

function Carteira({
  posicoes,
  precoDe,
  aoVender,
  aoExplorar,
}: {
  posicoes: Posicao[];
  precoDe: (t: string) => Cotacao | null;
  aoVender: (p: Posicao) => void;
  aoExplorar: () => void;
}) {
  if (posicoes.length === 0) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <TrendingUp size={44} className="mx-auto text-blue" />
        <h2 className="mt-6 font-display text-3xl text-ink">
          Sua carteira está vazia.
        </h2>
        <p className="mt-4 leading-relaxed text-ink-muted">
          E isso é totalmente normal, todo mundo começa aqui. Escolha uma
          empresa que você conhece, compre uma cota só pra ver como funciona,
          e acompanhe o que acontece.
        </p>
        <button
          onClick={aoExplorar}
          className="group mt-8 inline-flex items-center gap-2 bg-blue px-7 py-3.5 text-sm font-semibold text-onblue transition-colors hover:bg-blue-deep"
        >
          Ver as ações disponíveis
          <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display text-2xl text-ink">
        Você tem {posicoes.length} {posicoes.length === 1 ? "ação" : "ações"}
      </h2>

      <ul className="mt-6 border-t border-[var(--rule)]">
        {posicoes.map((p, i) => {
          const c = precoDe(p.ticker);
          const preco = c?.preco ?? p.preco_medio;
          const info = acaoPorTicker(p.ticker);
          const valor = p.quantidade * preco;
          const custo = p.quantidade * p.preco_medio;
          const dif = valor - custo;
          const difPct = custo > 0 ? (dif / custo) * 100 : 0;

          return (
            <motion.li
              key={p.ticker}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="border-b border-[var(--rule)] py-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="min-w-[140px]">
                  <p className="font-mono text-sm font-semibold text-ink">
                    {p.ticker}
                  </p>
                  <p className="text-xs text-ink-muted">{info?.nome}</p>
                </div>

                <div className="text-right">
                  <p className="font-mono text-xs text-ink-muted">quantas</p>
                  <p className="font-mono text-sm tabular text-ink">
                    {p.quantidade}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-mono text-xs text-ink-muted">pagou por cota</p>
                  <p className="font-mono text-sm tabular text-ink">
                    {brl(p.preco_medio)}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-mono text-xs text-ink-muted">vale agora</p>
                  <p className="font-mono text-sm tabular text-ink">{brl(preco)}</p>
                </div>

                <div className="text-right">
                  <p className="font-mono text-xs text-ink-muted">seu resultado</p>
                  <p
                    className={`font-mono text-sm tabular ${
                      dif >= 0 ? "text-emerald-600" : "text-rose-600"
                    }`}
                  >
                    {dif >= 0 ? "+" : ""}
                    {brl(dif)} ({pct(difPct)})
                  </p>
                </div>

                <button
                  onClick={() => aoVender(p)}
                  className="border border-[var(--rule)] px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-blue hover:text-blue"
                >
                  Vender
                </button>
              </div>

              <p className="mt-3 text-xs leading-relaxed text-ink-muted">
                Você tem {numero(p.quantidade, 0)} {p.quantidade === 1 ? "cota" : "cotas"} que
                valem {brl(valor)} hoje. Você pagou {brl(custo)} por elas.
              </p>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Explorar({
  precoDe,
  aoComprar,
}: {
  precoDe: (t: string) => Cotacao | null;
  aoComprar: (ticker: string) => void;
}) {
  const [busca, setBusca] = useState("");

  const lista = ACOES.filter((a) => {
    const t = busca.trim().toLowerCase();
    if (!t) return true;
    return (
      a.ticker.toLowerCase().includes(t) ||
      a.nome.toLowerCase().includes(t) ||
      a.setor.toLowerCase().includes(t)
    );
  });

  return (
    <div>
      <h2 className="font-display text-2xl text-ink">
        Escolha uma empresa que você conhece
      </h2>
      <p className="mt-2 max-w-xl leading-relaxed text-ink-muted">
        Selecionamos poucas empresas de propósito, todas conhecidas. Cada uma
        tem uma explicação simples do que ela faz.
      </p>

      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar por nome, código ou setor"
        className="mt-6 w-full max-w-sm border border-[var(--rule)] bg-paper px-4 py-3 text-ink outline-none transition-colors placeholder:text-ink-muted/60 focus:border-blue"
      />

      <ul className="mt-6 grid gap-px bg-[var(--rule)] sm:grid-cols-2">
        {lista.map((a, i) => {
          const c = precoDe(a.ticker);
          return (
            <motion.li
              key={a.ticker}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.4) }}
              className="bg-paper p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-mono text-sm font-semibold text-ink">
                    {a.ticker}
                  </p>
                  <p className="text-sm text-ink">{a.nome}</p>
                  <p className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">
                    {a.setor}
                  </p>
                </div>

                <div className="text-right">
                  {c ? (
                    <>
                      <p className="font-mono text-lg tabular text-ink">
                        {brl(c.preco)}
                      </p>
                      <p
                        className={`font-mono text-xs tabular ${
                          c.variacao >= 0 ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {c.variacao >= 0 ? "▲" : "▼"} {numero(Math.abs(c.variacao))}%
                      </p>
                    </>
                  ) : (
                    <p className="font-mono text-xs text-ink-muted">
                      preço indisponível
                    </p>
                  )}
                </div>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                {a.explica}
              </p>

              <button
                onClick={() => aoComprar(a.ticker)}
                disabled={!c}
                className="mt-4 w-full bg-blue px-5 py-2.5 text-sm font-semibold text-onblue transition-colors hover:bg-blue-deep disabled:opacity-40"
              >
                {c ? "Comprar" : "Indisponível agora"}
              </button>
            </motion.li>
          );
        })}
      </ul>

      {lista.length === 0 && (
        <p className="mt-8 text-ink-muted">
          Nenhuma empresa encontrada com esse termo.
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */

function Historico({ transacoes }: { transacoes: Transacao[] }) {
  if (transacoes.length === 0) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center">
        <Clock size={40} className="mx-auto text-blue" />
        <h2 className="mt-6 font-display text-2xl text-ink">
          Nada por aqui ainda.
        </h2>
        <p className="mt-3 leading-relaxed text-ink-muted">
          Assim que você comprar ou vender sua primeira ação, tudo fica
          registrado aqui, com data, preço e valor.
        </p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-display text-2xl text-ink">Tudo que você já fez</h2>

      <ul className="mt-6 border-t border-[var(--rule)]">
        {transacoes.map((t, i) => (
          <motion.li
            key={t.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: Math.min(i * 0.04, 0.4) }}
            className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--rule)] py-4"
          >
            <div className="flex items-center gap-4">
              <span
                className={`px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider ${
                  t.tipo === "compra"
                    ? "bg-blue text-onblue"
                    : "bg-gold text-blue"
                }`}
              >
                {t.tipo}
              </span>
              <div>
                <p className="font-mono text-sm font-semibold text-ink">
                  {t.ticker}
                </p>
                <p className="text-xs text-ink-muted">{dataHora(t.criado_em)}</p>
              </div>
            </div>

            <p className="text-sm text-ink-muted">
              {t.quantidade} {t.quantidade === 1 ? "cota" : "cotas"} a{" "}
              {brl(t.preco)}
            </p>

            <p className="font-mono text-sm tabular font-semibold text-ink">
              {brl(t.total)}
            </p>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
