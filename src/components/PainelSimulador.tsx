"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Search, Clock, TrendingUp, ArrowRight, Loader2, History, Newspaper, Timer, X, Landmark, Trophy, Target, Share2, Swords, Download, ChevronDown, Bot, HandCoins, Lock, Home } from "lucide-react";
import { ModalOrdem, type OrdemAberta } from "./ModalOrdem";
import { ModalDetalheAcao } from "./ModalDetalheAcao";
import { SeTivesseInvestido } from "./SeTivesseInvestido";
import { NoticiasFinanceiras } from "./NoticiasFinanceiras";
import { RendaFixaPainel, type PosicaoRendaFixa } from "./RendaFixaPainel";
import { StatusMercado } from "./StatusMercado";
import { MiniGraficoAcao } from "./MiniGraficoAcao";
import { TabelaAcoes } from "./TabelaAcoes";
import { LogoAcao } from "./LogoAcao";
import { RankingPainel, type RankingLinha, type RankingMensalLinha } from "./RankingPainel";
import { PlanejadorPainel } from "./PlanejadorPainel";
import { PopupStreak } from "./PopupStreak";
import { PopupDesbloqueio } from "./PopupDesbloqueio";
import { PopupPerfilInvestidor } from "./PopupPerfilInvestidor";
import { ConquistasFaixa } from "./ConquistasFaixa";
import { CartaoCompartilhavel } from "./CartaoCompartilhavel";
import { BannerAlertasDisparados, PainelAlertas, type AlertaPreco } from "./AlertasPreco";
import { DuelosPainel, type Duelo } from "./DuelosPainel";
import { AgentePainel, type Agente, type DecisaoAgente } from "./AgentePainel";
import { EmprestimoPainel } from "./EmprestimoPainel";
import type { EstadoEmprestimo } from "@/app/simulador/operacoesEmprestimo";
import { TourBoasVindas } from "./TourBoasVindas";
import { AssistenteChat } from "./AssistenteChat";
import { ComposicaoCarteira } from "./ComposicaoCarteira";
import { CalendarioDividendos } from "./CalendarioDividendos";
import { MaioresVariacoes } from "./MaioresVariacoes";
import { BotaoFavorito } from "./BotaoFavorito";
import { CountUp } from "./CountUp";
import { BarraApp, type DestinoApp } from "./app/BarraApp";
import { Inicio, type PontoPatrimonio } from "./app/Inicio";
import { Onboarding } from "./app/Onboarding";
import { calcularNivel } from "@/lib/nivelInvestidor";
import { nivelMinimoDaAba } from "@/lib/desbloqueios";
import { cancelarOrdemLimitada } from "@/app/simulador/operacoes";
import { ACOES, acaoPorTicker } from "@/lib/acoes";
import { ACOES_USA } from "@/lib/acoesUsa";
import type { AcaoB3 } from "@/lib/buscaAcoes";
import { calcularConquistas } from "@/lib/conquistas";
import { exportarTransacoesCsv } from "@/lib/exportarCsv";
import { corDoSetor } from "@/lib/coresSetor";
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
  precoAlvo: number | null;
  executarNaAbertura: boolean;
  criadoEm: string;
};

type Aba = "inicio" | "carteira" | "explorar" | "renda-fixa" | "emprestimo" | "planejador" | "e-se" | "noticias" | "ranking" | "duelo" | "agente" | "historico";

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
  ranking,
  rankingMensal,
  diasSeguidos,
  novoDia,
  perfilInvestidorDefinido,
  alertas,
  favoritos,
  duelos,
  agente,
  decisoesAgente,
  emprestimo,
  historico = [],
  saudacao = "Bem-vindo de volta",
  mostrarOnboarding = false,
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
  ranking: RankingLinha[];
  rankingMensal: RankingMensalLinha[];
  diasSeguidos: number;
  novoDia: boolean;
  perfilInvestidorDefinido: boolean;
  alertas: AlertaPreco[];
  favoritos: string[];
  duelos: Duelo[];
  agente: Agente;
  decisoesAgente: DecisaoAgente[];
  emprestimo: EstadoEmprestimo | null;
  historico?: PontoPatrimonio[];
  saudacao?: string;
  mostrarOnboarding?: boolean;
}) {
  // O aplicativo abre no Inicio, que e o painel de visao geral. Antes abria
  // direto na carteira (ou no explorar, se vazia), o que jogava a pessoa no
  // meio da ferramenta sem ela ver onde estava.
  const [aba, setAba] = useState<Aba>("inicio");
  const router = useRouter();
  const [ordem, setOrdem] = useState<OrdemAberta | null>(null);
  const [detalhe, setDetalhe] = useState<string | null>(null);
  const [mostrarCartao, setMostrarCartao] = useState(false);
  const favoritosSet = useMemo(() => new Set(favoritos), [favoritos]);

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
  const divida = emprestimo?.divida ?? 0;
  const patrimonio = saldo + valorAtual + valorRendaFixa - divida;
  const lucro = valorAtual - investido;
  const lucroPct = investido > 0 ? (lucro / investido) * 100 : 0;

  const conquistas = calcularConquistas({
    temCompra: transacoes.some((t) => t.tipo === "compra"),
    temVenda: transacoes.some((t) => t.tipo === "venda"),
    temDividendo: transacoes.some((t) => t.tipo === "dividendo"),
    tickersDistintos: new Set(posicoes.map((p) => p.ticker)).size,
    temRendaFixa: posicoesRendaFixa.length > 0,
    diasSeguidos,
    patrimonio,
  });
  const conquistasConcluidas = conquistas.filter((c) => c.concluida).length;
  const nivel = calcularNivel(conquistasConcluidas);

  // Melhor posicao aberta por retorno percentual. Usamos posicao (e nao
  // "melhor operacao") porque o lucro real de cada venda nao fica gravado
  // por transacao; anunciar isso como operacao seria um numero inventado.
  const melhorPosicao = posicoes.reduce<{ ticker: string; retornoPct: number } | null>(
    (melhor, p) => {
      const cotacao = precoDe(p.ticker);
      if (!cotacao || p.preco_medio <= 0) return melhor;
      const retornoPct = ((cotacao.preco - p.preco_medio) / p.preco_medio) * 100;
      return !melhor || retornoPct > melhor.retornoPct
        ? { ticker: p.ticker, retornoPct }
        : melhor;
    },
    null,
  );

  const abas: { id: Aba; label: string; icone: typeof Wallet }[] = [
    { id: "inicio", label: "Início", icone: Home },
    { id: "carteira", label: "Minha carteira", icone: Wallet },
    { id: "explorar", label: "Explorar ações", icone: Search },
    { id: "renda-fixa", label: "Renda fixa", icone: Landmark },
    { id: "emprestimo", label: "Empréstimo", icone: HandCoins },
    { id: "planejador", label: "Planejador", icone: Target },
    { id: "e-se", label: "E se eu tivesse investido antes?", icone: History },
    { id: "noticias", label: "Notícias", icone: Newspaper },
    { id: "ranking", label: "Ranking", icone: Trophy },
    { id: "duelo", label: "Duelo", icone: Swords },
    { id: "agente", label: "Agente IA", icone: Bot },
    { id: "historico", label: "Histórico", icone: Clock },
  ];

  // Quem ja usou a funcao antes (ja tem divida, ja configurou o agente, ja
  // tem duelos) nunca perde o acesso so por causa do nivel exigido.
  const JA_USADA: Partial<Record<Aba, boolean>> = {
    duelo: duelos.length > 0,
    emprestimo: (emprestimo?.divida ?? 0) > 0,
    agente: agente.existe,
  };
  function abaDesbloqueada(id: Aba) {
    const minimo = nivelMinimoDaAba(id);
    if (minimo === undefined) return true;
    return conquistasConcluidas >= minimo || Boolean(JA_USADA[id]);
  }

  const PRIMARIAS: Aba[] = ["inicio", "carteira", "explorar"];
  const abasSecundarias = abas.filter((a) => !PRIMARIAS.includes(a.id));

  /** A barra inferior leva pros quatro destinos principais. "Perfil" mora
   * numa pagina propria, entao esse e o unico que troca de rota. */
  function navegarApp(destino: DestinoApp) {
    if (destino === "perfil") {
      router.push("/conta");
      return;
    }
    setAba(destino);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

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

      <BannerAlertasDisparados alertas={alertas} />

      {/* Resumo em azul */}
      <section className="grain relative bg-blue">
        <div className="relative z-[2] mx-auto max-w-6xl px-6 py-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-onblue-muted">
                Olá, {apelido}
              </p>
              <span
                className="px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider"
                style={{ background: `color-mix(in srgb, ${nivel.cor} 22%, transparent)`, color: nivel.cor }}
              >
                {nivel.nome}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <StatusMercado mercado="br" />
              <StatusMercado mercado="us" />
            </div>
          </div>

          <div className="mt-5 grid gap-6 sm:grid-cols-3">
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

      {/* No celular, os quatro destinos principais vivem na barra inferior;
          esta tira horizontal fica so com o que e secundario, pra ela nao
          competir com a barra e nao repetir os mesmos botoes duas vezes.
          No desktop nada disso aparece: la a navegacao e a coluna lateral. */}
      <div className="sticky top-[57px] z-30 border-b border-[var(--rule)] bg-paper/95 backdrop-blur-md md:hidden">
        <div className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-6">
          {abasSecundarias.map(({ id, label, icone: Icone }) => {
            const desbloqueada = abaDesbloqueada(id);
            return (
              <motion.button
                key={id}
                onClick={() => desbloqueada && setAba(id)}
                disabled={!desbloqueada}
                title={desbloqueada ? undefined : `Desbloqueia com ${nivelMinimoDaAba(id)} conquistas (você tem ${conquistasConcluidas})`}
                whileTap={desbloqueada ? { scale: 0.94 } : undefined}
                className="relative flex shrink-0 items-center gap-2 px-4 py-4 text-sm font-medium transition-colors disabled:opacity-40"
                style={{ color: aba === id ? "var(--color-blue)" : "var(--color-ink-muted)" }}
              >
                {desbloqueada ? <Icone size={16} /> : <Lock size={16} />}
                {label}
                {aba === id && (
                  <motion.span
                    layoutId="aba-ativa-mobile"
                    className="absolute inset-x-0 bottom-0 h-[3px] bg-gold"
                    transition={{ type: "spring", stiffness: 320, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* pb no celular pra barra inferior nao cobrir o fim do conteudo */}
      <main className="grain relative min-h-[50vh] flex-1 bg-paper pb-24 md:pb-0">
        <div className="mx-auto flex max-w-6xl gap-8 px-6 py-8">
          <aside className="hidden w-56 shrink-0 md:block">
            <nav className="sticky top-[76px] space-y-0.5">
              {abas.map(({ id, label, icone: Icone }) => {
                const desbloqueada = abaDesbloqueada(id);
                return (
                  <motion.button
                    key={id}
                    onClick={() => desbloqueada && setAba(id)}
                    disabled={!desbloqueada}
                    title={desbloqueada ? undefined : `Desbloqueia com ${nivelMinimoDaAba(id)} conquistas (você tem ${conquistasConcluidas})`}
                    whileTap={desbloqueada ? { scale: 0.97 } : undefined}
                    className="relative flex w-full items-center gap-2.5 px-3 py-2.5 text-left text-sm font-medium transition-colors disabled:opacity-40"
                    style={{ color: aba === id ? "var(--color-blue)" : "var(--color-ink-muted)" }}
                  >
                    {aba === id && (
                      <motion.span
                        layoutId="aba-ativa-sidebar"
                        className="absolute inset-y-0.5 left-0 w-[3px] bg-gold"
                        transition={{ type: "spring", stiffness: 320, damping: 30 }}
                      />
                    )}
                    {desbloqueada ? <Icone size={16} className="shrink-0" /> : <Lock size={16} className="shrink-0" />}
                    <span className="leading-snug">{label}</span>
                  </motion.button>
                );
              })}
            </nav>
          </aside>

          <div className="min-w-0 flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={aba}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.3 }}
            >
              {aba === "inicio" && (
                <Inicio
                  apelido={apelido}
                  saudacao={saudacao}
                  saldo={saldo}
                  investido={investido}
                  lucro={lucro}
                  lucroPct={lucroPct}
                  patrimonio={patrimonio}
                  historico={historico}
                  melhorPosicao={melhorPosicao}
                  aoExplorar={() => setAba("explorar")}
                />
              )}

              {aba === "carteira" && (
                <>
                <ConquistasFaixa conquistas={conquistas} />

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

                <FerramentasCarteira
                  alertas={alertas}
                  posicoes={posicoes}
                  precoDe={precoDe}
                  transacoes={transacoes}
                  apelido={apelido}
                  patrimonio={patrimonio}
                  lucroPct={lucroPct}
                  mostrarCartao={mostrarCartao}
                  setMostrarCartao={setMostrarCartao}
                />
                </>
              )}

              {aba === "explorar" && (
                <>
                  <MaioresVariacoes cotacoes={cotacoes} aoVerDetalhe={(ticker) => setDetalhe(ticker)} />
                  <Explorar
                    favoritos={favoritosSet}
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
                </>
              )}

              {aba === "renda-fixa" && <RendaFixaPainel posicoes={posicoesRendaFixa} />}

              {aba === "emprestimo" && <EmprestimoPainel emprestimo={emprestimo} />}

              {aba === "planejador" && (
                <PlanejadorPainel
                  aoComprar={(ticker, preco, nome) => {
                    setOrdem({ ticker, preco, tipo: "comprar", limite: saldo, nome });
                  }}
                />
              )}

              {aba === "e-se" && <SeTivesseInvestido />}

              {aba === "noticias" && <NoticiasFinanceiras />}

              {aba === "ranking" && (
                <RankingPainel ranking={ranking} rankingMensal={rankingMensal} />
              )}

              {aba === "duelo" && <DuelosPainel duelos={duelos} />}

              {aba === "agente" && <AgentePainel agente={agente} decisoes={decisoesAgente} />}

              {aba === "historico" && <Historico transacoes={transacoes} />}
            </motion.div>
          </AnimatePresence>
          </div>
        </div>
      </main>

      <ModalOrdem ordem={ordem} aoFechar={() => setOrdem(null)} />
      <ModalDetalheAcao
        ticker={detalhe}
        favorito={detalhe != null && favoritosSet.has(detalhe)}
        aoFechar={() => setDetalhe(null)}
        aoComprar={(ticker, preco, nome) => {
          setDetalhe(null);
          setOrdem({ ticker, preco, tipo: "comprar", limite: saldo, nome });
        }}
      />

      <BarraApp
        ativo={aba}
        aoNavegar={navegarApp}
        aoOperar={() => setAba("explorar")}
      />

      {/* O onboarding vem antes de tudo: quem chega pela primeira vez ve as
          boas-vindas, e so depois o quiz de perfil. Empilhar as duas coisas
          na mesma visita seria receber alguem com dois questionarios. */}
      {mostrarOnboarding ? (
        <Onboarding />
      ) : !perfilInvestidorDefinido ? (
        <PopupPerfilInvestidor mostrar />
      ) : (
        novoDia && <PopupStreak dias={diasSeguidos} />
      )}

      {!mostrarOnboarding && (
        <TourBoasVindas
          mostrar={posicoes.length === 0 && transacoes.length === 0}
        />
      )}

      <PopupDesbloqueio conquistasConcluidas={conquistasConcluidas} />

      <AssistenteChat />
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

          <div className="mt-6 overflow-x-auto border border-[var(--rule)]">
            <table className="w-full min-w-[680px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--rule)] bg-paper-alt">
                  <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                    Ação
                  </th>
                  <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                    Cotas
                  </th>
                  <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                    Preço médio
                  </th>
                  <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                    Preço atual
                  </th>
                  <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                    Resultado
                  </th>
                  <th className="px-3 py-2" />
                </tr>
              </thead>
              <tbody>
                {posicoes.map((p) => {
                  const c = precoDe(p.ticker);
                  const preco = c?.preco ?? p.preco_medio;
                  const info = acaoPorTicker(p.ticker);
                  const valor = p.quantidade * preco;
                  const custo = p.quantidade * p.preco_medio;
                  const dif = valor - custo;
                  const difPct = custo > 0 ? (dif / custo) * 100 : 0;

                  return (
                    <tr
                      key={p.ticker}
                      className="border-b border-[var(--rule)] last:border-b-0 hover:bg-paper-alt"
                    >
                      <td className="px-3 py-2">
                        <button
                          onClick={() => aoVerDetalhe(p.ticker)}
                          className="flex items-center gap-2.5 text-left"
                        >
                          <LogoAcao logo={null} ticker={p.ticker} size={24} />
                          <span>
                            <span className="block font-mono text-sm font-semibold text-ink underline decoration-transparent underline-offset-4 hover:text-blue hover:decoration-blue">
                              {p.ticker}
                            </span>
                            <span className="block max-w-[160px] truncate text-xs text-ink-muted">
                              {info?.nome}
                            </span>
                          </span>
                        </button>
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular text-ink">
                        {numero(p.quantidade, 0)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular text-ink-muted">
                        {brl(p.preco_medio)}
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular text-ink">
                        {brl(preco)}
                      </td>
                      <td
                        className={`px-3 py-2 text-right font-mono tabular ${
                          dif >= 0 ? "text-emerald-600" : "text-rose-600"
                        }`}
                      >
                        {dif >= 0 ? "+" : ""}
                        {brl(dif)} ({pct(difPct)})
                      </td>
                      <td className="px-3 py-2 text-right">
                        <button
                          onClick={() => aoVender(p)}
                          className="border border-[var(--rule)] px-3 py-1.5 font-mono text-xs text-ink transition-colors hover:border-blue hover:text-blue"
                        >
                          Vender
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
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

/**
 * Alertas, composicao, dividendos e cartao compartilhavel sao uteis mas
 * secundarios, ficam atras de uma unica revelacao, em vez de 4 caixas
 * sempre abertas competindo com a carteira em si pela atencao.
 */
function FerramentasCarteira({
  alertas,
  posicoes,
  precoDe,
  transacoes,
  apelido,
  patrimonio,
  lucroPct,
  mostrarCartao,
  setMostrarCartao,
}: {
  alertas: AlertaPreco[];
  posicoes: Posicao[];
  precoDe: (t: string) => Cotacao | null;
  transacoes: Transacao[];
  apelido: string;
  patrimonio: number;
  lucroPct: number;
  mostrarCartao: boolean;
  setMostrarCartao: (fn: (v: boolean) => boolean) => void;
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <div className="mt-10 border-t border-[var(--rule)] pt-6">
      <button
        onClick={() => setAberto((v) => !v)}
        className="flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-ink-muted transition-colors hover:text-blue"
      >
        <ChevronDown
          size={14}
          className={`transition-transform ${aberto ? "rotate-180" : ""}`}
        />
        Mais sobre sua carteira
      </button>

      <AnimatePresence>
        {aberto && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-5">
              <PainelAlertas alertas={alertas} />
              <ComposicaoCarteira posicoes={posicoes} precoDe={precoDe} />
              <CalendarioDividendos transacoes={transacoes} />

              <div className="mb-8">
                <button
                  onClick={() => setMostrarCartao((v) => !v)}
                  className="flex items-center gap-2 border border-[var(--rule)] px-4 py-2.5 font-mono text-xs uppercase tracking-widest text-ink-muted transition-colors hover:border-blue hover:text-blue"
                >
                  <Share2 size={14} />
                  {mostrarCartao ? "Esconder cartão" : "Compartilhar desempenho"}
                </button>
                {mostrarCartao && (
                  <div className="mt-4">
                    <CartaoCompartilhavel
                      apelido={apelido}
                      patrimonio={patrimonio}
                      lucroPct={lucroPct}
                    />
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
            {ordem.executarNaAbertura ? (
              <>
                {ordem.quantidade} {ordem.quantidade === 1 ? "cota" : "cotas"} assim que o
                mercado abrir
              </>
            ) : (
              <>
                {ordem.quantidade} {ordem.quantidade === 1 ? "cota" : "cotas"} quando
                {ordem.tipo === "comprar" ? " cair pra " : " subir pra "}
                {brl(ordem.precoAlvo ?? 0)}
              </>
            )}
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
  favoritos,
  aoComprar,
  aoVerDetalhe,
}: {
  favoritos: Set<string>;
  aoComprar: (ticker: string, preco: number, nome?: string) => void;
  aoVerDetalhe: (ticker: string) => void;
}) {
  const [mercado, setMercado] = useState<"br" | "us">("br");
  const [busca, setBusca] = useState("");
  const [buscaAtrasada, setBuscaAtrasada] = useState("");
  const [b3, setB3] = useState<AcaoB3[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erroB3, setErroB3] = useState<string | null>(null);
  const [visao, setVisao] = useState<"cards" | "tabela">("cards");

  const [acoesUsa, setAcoesUsa] = useState<AcaoB3[] | null>(null);
  const [buscaUsa, setBuscaUsa] = useState("");
  const [buscaUsaAtrasada, setBuscaUsaAtrasada] = useState("");
  const [resultadosBuscaUsa, setResultadosBuscaUsa] = useState<AcaoB3[]>([]);
  const [carregandoUsa, setCarregandoUsa] = useState(false);
  const [erroUsa, setErroUsa] = useState<string | null>(null);

  useEffect(() => {
    if (mercado !== "us" || acoesUsa) return;
    fetch("/api/acoes-usa")
      .then((r) => r.json())
      .then((json) => setAcoesUsa(json.acoes ?? []))
      .catch(() => setAcoesUsa([]));
  }, [mercado, acoesUsa]);

  useEffect(() => {
    const id = setTimeout(() => setBuscaUsaAtrasada(buscaUsa.trim()), 400);
    return () => clearTimeout(id);
  }, [buscaUsa]);

  useEffect(() => {
    if (mercado !== "us" || buscaUsaAtrasada.length < 2) {
      setResultadosBuscaUsa([]);
      setErroUsa(null);
      return;
    }
    let cancelado = false;
    setCarregandoUsa(true);
    fetch(`/api/acoes-usa?q=${encodeURIComponent(buscaUsaAtrasada)}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelado) return;
        if (json.acoes) {
          setResultadosBuscaUsa(json.acoes);
          setErroUsa(null);
        } else {
          setErroUsa(json.mensagem ?? "Não foi possível buscar agora.");
        }
      })
      .catch(() => {
        if (!cancelado) setErroUsa("Não foi possível buscar agora.");
      })
      .finally(() => {
        if (!cancelado) setCarregandoUsa(false);
      });
    return () => {
      cancelado = true;
    };
  }, [mercado, buscaUsaAtrasada]);

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
      <div className="flex items-center gap-2">
        <button
          onClick={() => setMercado("br")}
          aria-label="Ações do Brasil"
          className={`flex h-9 w-9 items-center justify-center rounded-full text-lg transition-opacity ${
            mercado === "br" ? "opacity-100 ring-2 ring-blue" : "opacity-40 hover:opacity-70"
          }`}
        >
          🇧🇷
        </button>
        <button
          onClick={() => setMercado("us")}
          aria-label="Ações dos Estados Unidos"
          className={`flex h-9 w-9 items-center justify-center rounded-full text-lg transition-opacity ${
            mercado === "us" ? "opacity-100 ring-2 ring-blue" : "opacity-40 hover:opacity-70"
          }`}
        >
          🇺🇸
        </button>
      </div>

      {mercado === "us" ? (
        <>
          <h2 className="mt-4 font-display text-2xl text-ink">
            Escolha uma ação dos EUA
          </h2>
          <p className="mt-2 max-w-xl leading-relaxed text-ink-muted">
            Destacamos algumas empresas conhecidas, mas a NYSE/NASDAQ inteira
            é sua: busque qualquer ticker ou nome. Preço já convertido pra
            reais.
          </p>

          <input
            value={buscaUsa}
            onChange={(e) => setBuscaUsa(e.target.value)}
            placeholder="Buscar por nome ou ticker (ex: Netflix, GOOG)"
            className="mt-6 w-full max-w-sm border border-[var(--rule)] bg-paper px-4 py-3 text-ink outline-none transition-colors placeholder:text-ink-muted/60 focus:border-blue"
          />

          {!buscaUsaAtrasada && (
            <>
              <p className="mt-8 font-mono text-[11px] uppercase tracking-widest text-ink-muted">
                Populares
              </p>
              {acoesUsa === null ? (
                <div className="mt-6 flex items-center gap-2 text-ink-muted">
                  <Loader2 size={16} className="animate-spin" />
                  Carregando ações americanas…
                </div>
              ) : (
                <ul className="mt-3 grid gap-px bg-[var(--rule)] sm:grid-cols-2">
                  {ACOES_USA.map((a, i) => {
                    const dado = acoesUsa.find((x) => x.ticker === a.ticker);
                    return (
                      <CartaoAcaoPopular
                        key={a.ticker}
                        acao={a}
                        delay={Math.min(i * 0.04, 0.4)}
                        favorito={favoritos.has(a.ticker)}
                        dadosPre={{
                          preco: dado?.preco ?? null,
                          variacao: dado?.variacao ?? null,
                          logo: dado?.logo ?? null,
                        }}
                        aoComprar={aoComprar}
                        aoVerDetalhe={aoVerDetalhe}
                      />
                    );
                  })}
                </ul>
              )}
            </>
          )}

          {buscaUsaAtrasada && (
            <div className="mt-8">
              <div className="flex items-center gap-2">
                <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
                  Resultados
                </p>
                {carregandoUsa && <Loader2 size={13} className="animate-spin text-ink-muted" />}
              </div>

              {erroUsa && <p className="mt-4 text-sm text-ink-muted">{erroUsa}</p>}

              {!erroUsa && !carregandoUsa && resultadosBuscaUsa.length === 0 && (
                <p className="mt-4 text-ink-muted">Nenhuma ação encontrada com esse termo.</p>
              )}

              {!erroUsa && resultadosBuscaUsa.length > 0 && (
                <ul className="mt-3 grid gap-px bg-[var(--rule)] sm:grid-cols-2">
                  {resultadosBuscaUsa.map((a, i) => (
                    <CartaoAcaoB3
                      key={a.ticker}
                      acao={a}
                      delay={Math.min(i * 0.04, 0.4)}
                      favorito={favoritos.has(a.ticker)}
                      aoComprar={aoComprar}
                      aoVerDetalhe={aoVerDetalhe}
                    />
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      ) : (
        <>
      <h2 className="mt-4 font-display text-2xl text-ink">
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

      {favoritos.size > 0 && !t && (
        <FavoritasFaixa
          tickers={[...favoritos]}
          aoComprar={aoComprar}
          aoVerDetalhe={aoVerDetalhe}
        />
      )}

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
                favorito={favoritos.has(a.ticker)}
                aoComprar={aoComprar}
                aoVerDetalhe={aoVerDetalhe}
              />
            ))}
          </ul>
        </>
      )}

      <div className="mt-10 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
            {t ? "Resultados na B3" : "Mais ações da B3"}
          </p>
          {carregando && <Loader2 size={13} className="animate-spin text-ink-muted" />}
        </div>

        <div className="flex gap-1.5">
          <button
            onClick={() => setVisao("cards")}
            className={`px-3 py-1.5 font-mono text-xs transition-colors ${
              visao === "cards"
                ? "bg-blue text-onblue"
                : "border border-[var(--rule)] text-ink-muted hover:border-blue hover:text-blue"
            }`}
          >
            Cards
          </button>
          <button
            onClick={() => setVisao("tabela")}
            className={`px-3 py-1.5 font-mono text-xs transition-colors ${
              visao === "tabela"
                ? "bg-blue text-onblue"
                : "border border-[var(--rule)] text-ink-muted hover:border-blue hover:text-blue"
            }`}
          >
            Tabela
          </button>
        </div>
      </div>

      {erroB3 && (
        <p className="mt-4 text-sm text-ink-muted">{erroB3}</p>
      )}

      {!erroB3 && visao === "cards" && (
        <ul className="mt-3 grid gap-px bg-[var(--rule)] sm:grid-cols-2">
          {restoB3.map((a, i) => (
            <CartaoAcaoB3
              key={a.ticker}
              acao={a}
              delay={Math.min(i * 0.04, 0.4)}
              favorito={favoritos.has(a.ticker)}
              aoComprar={aoComprar}
              aoVerDetalhe={aoVerDetalhe}
            />
          ))}
        </ul>
      )}

      {!erroB3 && visao === "tabela" && restoB3.length > 0 && (
        <div className="mt-3">
          <TabelaAcoes acoes={restoB3} favoritos={favoritos} aoVerDetalhe={aoVerDetalhe} aoComprar={aoComprar} />
        </div>
      )}

      {!carregando && !erroB3 && populares.length === 0 && restoB3.length === 0 && (
        <p className="mt-8 text-ink-muted">
          Nenhuma ação encontrada com esse termo.
        </p>
      )}
        </>
      )}
    </div>
  );
}

function CartaoAcaoPopular({
  acao,
  delay,
  favorito,
  dadosPre,
  aoComprar,
  aoVerDetalhe,
}: {
  acao: (typeof ACOES)[number];
  delay: number;
  favorito?: boolean;
  /** Quando informado, pula a busca propria (usado pras acoes americanas, ja buscadas de uma vez pelo componente pai). */
  dadosPre?: { preco: number | null; variacao: number | null; logo: string | null };
  aoComprar: (ticker: string, preco: number, nome?: string) => void;
  aoVerDetalhe: (ticker: string) => void;
}) {
  const [dados, setDados] = useState<{ preco: number; variacao: number; logo: string | null } | null>(null);

  useEffect(() => {
    if (dadosPre) return;
    let cancelado = false;
    fetch(`/api/acoes?q=${encodeURIComponent(acao.ticker)}`)
      .then((r) => r.json())
      .then((json) => {
        if (cancelado || !json.acoes) return;
        const encontrada = json.acoes.find(
          (a: AcaoB3) => a.ticker === acao.ticker,
        );
        if (encontrada?.preco != null) {
          setDados({ preco: encontrada.preco, variacao: encontrada.variacao ?? 0, logo: encontrada.logo ?? null });
        }
      })
      .catch(() => {});
    return () => {
      cancelado = true;
    };
  }, [acao.ticker, dadosPre]);

  const dadosFinais = dadosPre
    ? dadosPre.preco != null
      ? { preco: dadosPre.preco, variacao: dadosPre.variacao ?? 0, logo: dadosPre.logo }
      : null
    : dados;
  const semDadosDisponiveis = Boolean(dadosPre) && dadosPre!.preco == null;

  return (
    <motion.li
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="bg-paper p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <button onClick={() => aoVerDetalhe(acao.ticker)} className="flex items-start gap-3 text-left">
          <LogoAcao logo={dadosFinais?.logo ?? null} ticker={acao.ticker} />
          <div>
            <p className="font-mono text-sm font-semibold text-ink underline decoration-transparent underline-offset-4 transition-colors hover:text-blue hover:decoration-blue">
              {acao.ticker}
            </p>
            <p className="text-sm text-ink">{acao.nome}</p>
            <p
              className="font-mono text-[11px] font-medium uppercase tracking-wider"
              style={{ color: corDoSetor(acao.setor) }}
            >
              {acao.setor}
            </p>
          </div>
        </button>

        <div className="flex items-start gap-3">
          <div className="text-right">
            {dadosFinais ? (
              <>
                <p className="font-mono text-lg tabular text-ink">{brl(dadosFinais.preco)}</p>
                <p
                  className={`font-mono text-xs tabular ${
                    dadosFinais.variacao >= 0 ? "text-emerald-600" : "text-rose-600"
                  }`}
                >
                  {dadosFinais.variacao >= 0 ? "▲" : "▼"} {numero(Math.abs(dadosFinais.variacao))}%
                </p>
              </>
            ) : semDadosDisponiveis ? (
              <p className="font-mono text-xs text-ink-muted">indisponível</p>
            ) : (
              <p className="font-mono text-xs text-ink-muted">carregando…</p>
            )}
          </div>
          <BotaoFavorito ticker={acao.ticker} favorito={Boolean(favorito)} />
        </div>
      </div>

      {!dadosPre && (
        <div className="mt-3 flex justify-end">
          <MiniGraficoAcao ticker={acao.ticker} />
        </div>
      )}

      <p className="mt-3 text-sm leading-relaxed text-ink-muted">{acao.explica}</p>

      <button
        onClick={() => dadosFinais && aoComprar(acao.ticker, dadosFinais.preco, acao.nome)}
        disabled={!dadosFinais}
        className="mt-4 w-full bg-blue px-5 py-2.5 text-sm font-semibold text-onblue transition-colors hover:bg-blue-deep disabled:opacity-40"
      >
        {dadosFinais ? "Comprar" : "Indisponível agora"}
      </button>
    </motion.li>
  );
}

function CartaoAcaoB3({
  acao,
  delay,
  favorito,
  aoComprar,
  aoVerDetalhe,
}: {
  acao: AcaoB3;
  delay: number;
  favorito?: boolean;
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
        <button onClick={() => aoVerDetalhe(acao.ticker)} className="flex items-start gap-3 text-left">
          <LogoAcao logo={acao.logo} ticker={acao.ticker} />
          <div>
            <p className="font-mono text-sm font-semibold text-ink underline decoration-transparent underline-offset-4 transition-colors hover:text-blue hover:decoration-blue">
              {acao.ticker}
            </p>
            <p className="text-sm text-ink">{acao.nome}</p>
            {acao.setor && (
              <p
                className="font-mono text-[11px] font-medium uppercase tracking-wider"
                style={{ color: corDoSetor(acao.setor) }}
              >
                {acao.setor}
              </p>
            )}
          </div>
        </button>

        <div className="flex items-start gap-3">
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
          <BotaoFavorito ticker={acao.ticker} favorito={Boolean(favorito)} />
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

/** Suas acoes favoritadas, buscando a cotacao de cada uma individualmente. */
function FavoritasFaixa({
  tickers,
  aoComprar,
  aoVerDetalhe,
}: {
  tickers: string[];
  aoComprar: (ticker: string, preco: number, nome?: string) => void;
  aoVerDetalhe: (ticker: string) => void;
}) {
  const [acoes, setAcoes] = useState<AcaoB3[]>([]);

  useEffect(() => {
    let cancelado = false;
    Promise.all(
      tickers.map((t) =>
        fetch(`/api/acoes?q=${encodeURIComponent(t)}`)
          .then((r) => r.json())
          .then((json) => json.acoes?.find((a: AcaoB3) => a.ticker === t) ?? null)
          .catch(() => null),
      ),
    ).then((resultados) => {
      if (!cancelado) setAcoes(resultados.filter((a): a is AcaoB3 => a != null));
    });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tickers.join(",")]);

  if (acoes.length === 0) return null;

  return (
    <>
      <p className="mt-2 font-mono text-[11px] uppercase tracking-widest text-ink-muted">
        Suas favoritas
      </p>
      <ul className="mt-3 grid gap-px bg-[var(--rule)] sm:grid-cols-2">
        {acoes.map((a, i) => (
          <CartaoAcaoB3
            key={a.ticker}
            acao={a}
            delay={Math.min(i * 0.04, 0.4)}
            favorito
            aoComprar={aoComprar}
            aoVerDetalhe={aoVerDetalhe}
          />
        ))}
      </ul>
    </>
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-2xl text-ink">Tudo que você já fez</h2>
        <button
          onClick={() => exportarTransacoesCsv(transacoes)}
          className="flex items-center gap-2 border border-[var(--rule)] px-4 py-2 font-mono text-xs uppercase tracking-widest text-ink-muted transition-colors hover:border-blue hover:text-blue"
        >
          <Download size={14} />
          Exportar CSV
        </button>
      </div>

      <div className="mt-6 overflow-x-auto border border-[var(--rule)]">
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--rule)] bg-paper-alt">
              <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                Data
              </th>
              <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                Tipo
              </th>
              <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                Ação
              </th>
              <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                Quantidade
              </th>
              <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                Preço
              </th>
              <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-ink-muted">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {transacoes.map((t) => (
              <tr key={t.id} className="border-b border-[var(--rule)] last:border-b-0 hover:bg-paper-alt">
                <td className="whitespace-nowrap px-3 py-2 font-mono text-xs tabular text-ink-muted">
                  {dataHora(t.criado_em)}
                </td>
                <td className="px-3 py-2">
                  <span
                    className={`px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                      t.tipo === "compra"
                        ? "bg-blue text-onblue"
                        : t.tipo === "dividendo"
                          ? "bg-emerald-600 text-white"
                          : "bg-gold text-blue"
                    }`}
                  >
                    {t.tipo}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono font-semibold text-ink">{t.ticker}</td>
                <td className="px-3 py-2 text-right font-mono tabular text-ink-muted">
                  {numero(t.quantidade, 0)}
                </td>
                <td className="px-3 py-2 text-right font-mono tabular text-ink-muted">
                  {brl(t.preco)}
                  {t.tipo === "venda" && t.imposto > 0 && (
                    <span className="ml-1.5 text-rose-600">(IR {brl(t.imposto)})</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right font-mono tabular font-semibold text-ink">
                  {brl(t.tipo === "venda" ? t.total - t.imposto : t.total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
