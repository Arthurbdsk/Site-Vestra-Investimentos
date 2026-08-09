"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Search, Clock, TrendingUp, ArrowRight, Loader2, History, Newspaper, Timer, X, Landmark } from "lucide-react";
import { ModalOrdem, type OrdemAberta } from "./ModalOrdem";
import { ModalDetalheAcao } from "./ModalDetalheAcao";
import { SeTivesseInvestido } from "./SeTivesseInvestido";
import { NoticiasFinanceiras } from "./NoticiasFinanceiras";
import { RendaFixaPainel, type PosicaoRendaFixa } from "./RendaFixaPainel";
import { StatusMercado } from "./StatusMercado";
import { MiniGraficoAcao } from "./MiniGraficoAcao";
import { CountUp } from "./CountUp";
import { cancelarOrdemLimitada } from "@/app/simulador/operacoes";
import { ACOES, acaoPorTicker } from "@/lib/acoes";
import type { AcaoB3 } from "@/lib/buscaAcoes";
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
  tipo: "compra" | "venda" | "dividendo";
  quantidade: number;
  preco: number;
  total: number;
  imposto: number;
  criado_em: string;
};

export type OrdemPendente = {
  id: string;
  ticker: string;
  tipo: "comprar" | "vender";
  quantidade: number;
  precoAlvo: number;
  criadoEm: string;
};

type Aba = "carteira" | "explorar" | "renda-fixa" | "e-se" | "noticias" | "historico";

export function PainelSimulador({
  apelido,
  saldo,
  posicoes,
  transacoes,
  cotacoes,
  avisoCotacoes,
  visitante = false,
  ordensPendentes,
  posicoesRendaFixa,
}: {
  apelido: string;
  saldo: number;
  posicoes: Posicao[];
  transacoes: Transacao[];
  cotacoes: Cotacao[];
  avisoCotacoes: string | null;
  visitante?: boolean;
  ordensPendentes: OrdemPendente[];
  posicoesRendaFixa: PosicaoRendaFixa[];
}) {
  const [aba, setAba] = useState<Aba>(posicoes.length ? "carteira" : "explorar");
  const [ordem, setOrdem] = useState<OrdemAberta | null>(null);
  const [detalhe, setDetalhe] = useState<string | null>(null);

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
  const valorRendaFixa = posicoesRendaFixa.reduce((s, p) => {
    const dias = Math.max(
      0,
      Math.floor((Date.now() - new Date(p.dataAplicacao).getTime()) / 86_400_000),
    );
    return s + p.valorInvestido * Math.pow(1 + p.taxaAnual, dias / 365);
  }, 0);
  const patrimonio = saldo + valorAtual + valorRendaFixa;
  const lucro = valorAtual - investido;
  const lucroPct = investido > 0 ? (lucro / investido) * 100 : 0;

  const abas: { id: Aba; label: string; icone: typeof Wallet }[] = [
    { id: "carteira", label: "Minha carteira", icone: Wallet },
    { id: "explorar", label: "Explorar ações", icone: Search },
    { id: "renda-fixa", label: "Renda fixa", icone: Landmark },
    { id: "e-se", label: "E se eu tivesse investido antes?", icone: History },
    { id: "noticias", label: "Notícias", icone: Newspaper },
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
        <div className="relative z-[2] mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-onblue-muted">
              Olá, {apelido}
            </p>
            <StatusMercado />
          </div>

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
                  ordensPendentes={ordensPendentes}
                  precoDe={precoDe}
                  aoVerDetalhe={(ticker) => setDetalhe(ticker)}
                  aoVender={async (p) => {
                    // precoDe so cobre a lista curada; ações compradas via
                    // busca na B3 inteira precisam de uma cotação avulsa.
                    const cache = precoDe(p.ticker);
                    const preco =
                      cache?.preco ??
                      (await fetch(`/api/acoes?q=${encodeURIComponent(p.ticker)}`)
                        .then((r) => r.json())
                        .then(
                          (json) =>
                            json.acoes?.find((a: AcaoB3) => a.ticker === p.ticker)
                              ?.preco ?? null,
                        )
                        .catch(() => null));

                    if (preco != null)
                      setOrdem({
                        ticker: p.ticker,
                        preco,
                        tipo: "vender",
                        limite: p.quantidade,
                      });
                  }}
                  aoExplorar={() => setAba("explorar")}
                />
              )}

              {aba === "explorar" && (
                <Explorar
                  aoVerDetalhe={(ticker) => setDetalhe(ticker)}
                  aoComprar={(ticker, preco, nome) => {
                    setOrdem({
                      ticker,
                      preco,
                      tipo: "comprar",
                      limite: saldo,
                      nome,
                    });
                  }}
                />
              )}

              {aba === "renda-fixa" && <RendaFixaPainel posicoes={posicoesRendaFixa} />}

              {aba === "e-se" && <SeTivesseInvestido />}

              {aba === "noticias" && <NoticiasFinanceiras />}

              {aba === "historico" && <Historico transacoes={transacoes} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <ModalOrdem ordem={ordem} aoFechar={() => setOrdem(null)} />
      <ModalDetalheAcao
        ticker={detalhe}
        aoFechar={() => setDetalhe(null)}
        aoComprar={(ticker, preco, nome) => {
          setDetalhe(null);
          setOrdem({ ticker, preco, tipo: "comprar", limite: saldo, nome });
        }}
      />
    </>
  );
}

/* ------------------------------------------------------------------ */

function Carteira({
  posicoes,
  ordensPendentes,
  precoDe,
  aoVender,
  aoExplorar,
  aoVerDetalhe,
}: {
  posicoes: Posicao[];
  ordensPendentes: OrdemPendente[];
  precoDe: (t: string) => Cotacao | null;
  aoVender: (p: Posicao) => void;
  aoExplorar: () => void;
  aoVerDetalhe: (ticker: string) => void;
}) {
  if (posicoes.length === 0 && ordensPendentes.length === 0) {
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
      {posicoes.length > 0 && (
        <>
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
                <button
                  onClick={() => aoVerDetalhe(p.ticker)}
                  className="min-w-[140px] text-left"
                >
                  <p className="font-mono text-sm font-semibold text-ink underline decoration-transparent underline-offset-4 transition-colors hover:text-blue hover:decoration-blue">
                    {p.ticker}
                  </p>
                  <p className="text-xs text-ink-muted">{info?.nome}</p>
                </button>

                <MiniGraficoAcao ticker={p.ticker} />

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
        </>
      )}

      {ordensPendentes.length > 0 && (
        <div className={posicoes.length > 0 ? "mt-12" : ""}>
          <h2 className="font-display text-2xl text-ink">
            {ordensPendentes.length}{" "}
            {ordensPendentes.length === 1 ? "ordem pendente" : "ordens pendentes"}
          </h2>
          <p className="mt-2 text-sm text-ink-muted">
            Executam sozinhas na próxima vez que você abrir o simulador,
            assim que o preço atingir o alvo.
          </p>

          <ul className="mt-6 border-t border-[var(--rule)]">
            {ordensPendentes.map((o, i) => (
              <OrdemPendenteLinha key={o.id} ordem={o} delay={i * 0.06} />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function OrdemPendenteLinha({ ordem, delay }: { ordem: OrdemPendente; delay: number }) {
  const [cancelando, setCancelando] = useState(false);
  const router = useRouter();

  async function cancelar() {
    setCancelando(true);
    await cancelarOrdemLimitada(ordem.id);
    router.refresh();
  }

  return (
    <motion.li
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay }}
      className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--rule)] py-4"
    >
      <div className="flex items-center gap-3">
        <Timer size={16} className="text-gold" />
        <div>
          <p className="font-mono text-sm font-semibold text-ink">
            {ordem.tipo === "comprar" ? "Comprar" : "Vender"} {ordem.ticker}
          </p>
          <p className="text-xs text-ink-muted">
            {ordem.quantidade} {ordem.quantidade === 1 ? "cota" : "cotas"} quando
            {ordem.tipo === "comprar" ? " cair pra " : " subir pra "}
            {brl(ordem.precoAlvo)}
          </p>
        </div>
      </div>

      <button
        onClick={cancelar}
        disabled={cancelando}
        className="flex items-center gap-1.5 border border-[var(--rule)] px-3 py-2 font-mono text-xs text-ink-muted transition-colors hover:border-rose-400 hover:text-rose-600 disabled:opacity-50"
      >
        <X size={13} />
        Cancelar
      </button>
    </motion.li>
  );
}

/* ------------------------------------------------------------------ */

function Explorar({
  aoComprar,
  aoVerDetalhe,
}: {
  aoComprar: (ticker: string, preco: number, nome?: string) => void;
  aoVerDetalhe: (ticker: string) => void;
}) {
  const [busca, setBusca] = useState("");
  const [buscaAtrasada, setBuscaAtrasada] = useState("");
  const [b3, setB3] = useState<AcaoB3[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroB3, setErroB3] = useState<string | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setBuscaAtrasada(busca.trim()), 350);
    return () => clearTimeout(id);
  }, [busca]);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    fetch(`/api/acoes?q=${encodeURIComponent(buscaAtrasada)}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelado) return;
        if (json.acoes) {
          setB3(json.acoes);
          setErroB3(null);
        } else {
          setErroB3(json.mensagem ?? "Não foi possível buscar as ações agora.");
        }
      })
      .catch(() => {
        if (!cancelado) setErroB3("Não foi possível buscar as ações agora.");
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [buscaAtrasada]);

  const t = busca.trim().toLowerCase();
  const populares = ACOES.filter((a) => {
    if (!t) return true;
    return (
      a.ticker.toLowerCase().includes(t) ||
      a.nome.toLowerCase().includes(t) ||
      a.setor.toLowerCase().includes(t)
    );
  });
  const populareTickers = new Set(populares.map((a) => a.ticker));
  const restoB3 = b3.filter((a) => !populareTickers.has(a.ticker));

  return (
    <div>
      <h2 className="font-display text-2xl text-ink">
        Escolha uma ação da B3
      </h2>
      <p className="mt-2 max-w-xl leading-relaxed text-ink-muted">
        Destacamos algumas empresas conhecidas com explicação em português,
        mas a bolsa é sua: busque qualquer código ou nome pra comprar
        qualquer ação da B3.
      </p>

      <input
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Buscar por nome, código ou setor"
        className="mt-6 w-full max-w-sm border border-[var(--rule)] bg-paper px-4 py-3 text-ink outline-none transition-colors placeholder:text-ink-muted/60 focus:border-blue"
      />

      {populares.length > 0 && (
        <>
          <p className="mt-8 font-mono text-[11px] uppercase tracking-widest text-ink-muted">
            Populares
          </p>
          <ul className="mt-3 grid gap-px bg-[var(--rule)] sm:grid-cols-2">
            {populares.map((a, i) => (
              <CartaoAcaoPopular
                key={a.ticker}
                acao={a}
                delay={Math.min(i * 0.04, 0.4)}
                aoComprar={aoComprar}
                aoVerDetalhe={aoVerDetalhe}
              />
            ))}
          </ul>
        </>
      )}

      <div className="mt-10 flex items-center gap-3">
        <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
          {t ? "Resultados na B3" : "Mais ações da B3"}
        </p>
        {carregando && <Loader2 size={13} className="animate-spin text-ink-muted" />}
      </div>

      {erroB3 && (
        <p className="mt-4 text-sm text-ink-muted">{erroB3}</p>
      )}

      {!erroB3 && (
        <ul className="mt-3 grid gap-px bg-[var(--rule)] sm:grid-cols-2">
          {restoB3.map((a, i) => (
            <CartaoAcaoB3
              key={a.ticker}
              acao={a}
              delay={Math.min(i * 0.04, 0.4)}
              aoComprar={aoComprar}
              aoVerDetalhe={aoVerDetalhe}
            />
          ))}
        </ul>
      )}

      {!carregando && !erroB3 && populares.length === 0 && restoB3.length === 0 && (
        <p className="mt-8 text-ink-muted">
          Nenhuma ação encontrada com esse termo.
        </p>
      )}
    </div>
  );
}

function CartaoAcaoPopular({
  acao,
  delay,
  aoComprar,
  aoVerDetalhe,
}: {
  acao: (typeof ACOES)[number];
  delay: number;
  aoComprar: (ticker: string, preco: number, nome?: string) => void;
  aoVerDetalhe: (ticker: string) => void;
}) {
  const [dados, setDados] = useState<{ preco: number; variacao: number } | null>(null);

  useEffect(() => {
    let cancelado = false;
    fetch(`/api/acoes?q=${encodeURIComponent(acao.ticker)}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelado || !json.acoes) return;
        const encontrada = json.acoes.find(
          (a: AcaoB3) => a.ticker === acao.ticker,
        );
        if (encontrada?.preco != null) {
          setDados({ preco: encontrada.preco, variacao: encontrada.variacao ?? 0 });
        }
      })
      .catch(() => {});
    return () => {
      cancelado = true;
    };
  }, [acao.ticker]);

  return (
    <motion.li
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-paper p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <button onClick={() => aoVerDetalhe(acao.ticker)} className="text-left">
          <p className="font-mono text-sm font-semibold text-ink underline decoration-transparent underline-offset-4 transition-colors hover:text-blue hover:decoration-blue">
            {acao.ticker}
          </p>
          <p className="text-sm text-ink">{acao.nome}</p>
          <p className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">
            {acao.setor}
          </p>
        </button>

        <div className="text-right">
          {dados ? (
            <>
              <p className="font-mono text-lg tabular text-ink">{brl(dados.preco)}</p>
              <p
                className={`font-mono text-xs tabular ${
                  dados.variacao >= 0 ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {dados.variacao >= 0 ? "▲" : "▼"} {numero(Math.abs(dados.variacao))}%
              </p>
            </>
          ) : (
            <p className="font-mono text-xs text-ink-muted">carregando…</p>
          )}
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <MiniGraficoAcao ticker={acao.ticker} />
      </div>

      <p className="mt-3 text-sm leading-relaxed text-ink-muted">{acao.explica}</p>

      <button
        onClick={() => dados && aoComprar(acao.ticker, dados.preco, acao.nome)}
        disabled={!dados}
        className="mt-4 w-full bg-blue px-5 py-2.5 text-sm font-semibold text-onblue transition-colors hover:bg-blue-deep disabled:opacity-40"
      >
        {dados ? "Comprar" : "Indisponível agora"}
      </button>
    </motion.li>
  );
}

function CartaoAcaoB3({
  acao,
  delay,
  aoComprar,
  aoVerDetalhe,
}: {
  acao: AcaoB3;
  delay: number;
  aoComprar: (ticker: string, preco: number, nome?: string) => void;
  aoVerDetalhe: (ticker: string) => void;
}) {
  const disponivel = acao.preco != null;

  return (
    <motion.li
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-paper p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <button onClick={() => aoVerDetalhe(acao.ticker)} className="text-left">
          <p className="font-mono text-sm font-semibold text-ink underline decoration-transparent underline-offset-4 transition-colors hover:text-blue hover:decoration-blue">
            {acao.ticker}
          </p>
          <p className="text-sm text-ink">{acao.nome}</p>
          {acao.setor && (
            <p className="font-mono text-[11px] uppercase tracking-wider text-ink-muted">
              {acao.setor}
            </p>
          )}
        </button>

        <div className="text-right">
          {disponivel ? (
            <>
              <p className="font-mono text-lg tabular text-ink">{brl(acao.preco!)}</p>
              {acao.variacao != null && (
                <p
                  className={`font-mono text-xs tabular ${
                    acao.variacao >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {acao.variacao >= 0 ? "▲" : "▼"} {numero(Math.abs(acao.variacao))}%
                </p>
              )}
            </>
          ) : (
            <p className="font-mono text-xs text-ink-muted">preço indisponível</p>
          )}
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <MiniGraficoAcao ticker={acao.ticker} />
      </div>

      <button
        onClick={() => disponivel && aoComprar(acao.ticker, acao.preco!, acao.nome)}
        disabled={!disponivel}
        className="mt-4 w-full border border-blue px-5 py-2.5 text-sm font-semibold text-blue transition-colors hover:bg-blue hover:text-onblue disabled:opacity-40"
      >
        {disponivel ? "Comprar" : "Indisponível agora"}
      </button>
    </motion.li>
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
                    : t.tipo === "dividendo"
                      ? "bg-emerald-600 text-white"
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
              {t.tipo === "dividendo"
                ? `${t.quantidade} ${t.quantidade === 1 ? "cota" : "cotas"} a ${brl(t.preco)} cada`
                : `${t.quantidade} ${t.quantidade === 1 ? "cota" : "cotas"} a ${brl(t.preco)}`}
              {t.tipo === "venda" && t.imposto > 0 && (
                <span className="ml-2 text-rose-600">
                  (IR de {brl(t.imposto)})
                </span>
              )}
            </p>

            <p className="font-mono text-sm tabular font-semibold text-ink">
              {brl(t.tipo === "venda" ? t.total - t.imposto : t.total)}
            </p>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
