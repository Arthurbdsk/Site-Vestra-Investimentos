"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Search, Clock, TrendingUp, ArrowRight, Loader2, History, Newspaper, Timer, X, Landmark, Trophy, Target, Share2, Swords, Download, ChevronDown, Bot, HandCoins, Lock, Home, StickyNote, Scale } from "lucide-react";
import { ModalOrdem, type OrdemAberta } from "./ModalOrdem";
import { ModalDetalheAcao } from "./ModalDetalheAcao";
import { SeTivesseInvestido } from "./SeTivesseInvestido";
import { NoticiasFinanceiras } from "./NoticiasFinanceiras";
import { RendaFixaPainel, type PosicaoRendaFixa } from "./RendaFixaPainel";
import { StatusMercado } from "./StatusMercado";
import { LogoAcao } from "./LogoAcao";
import { ExplorarBr } from "./ExplorarBr";
import { ExplorarFii } from "./ExplorarFii";
import { ExplorarEtf } from "./ExplorarEtf";
import { ExplorarUs } from "./ExplorarUs";
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
import { RebalanceamentoPainel } from "./RebalanceamentoPainel";
import { CalendarioDividendos } from "./CalendarioDividendos";
import { MaioresVariacoes } from "./MaioresVariacoes";
import { CountUp } from "./CountUp";
import { BarraApp, type DestinoApp } from "./app/BarraApp";
import { Inicio, type PontoPatrimonio } from "./app/Inicio";
import { Onboarding } from "./app/Onboarding";
import { calcularNivel } from "@/lib/nivelInvestidor";
import { nivelMinimoDaAba } from "@/lib/desbloqueios";
import { cancelarOrdemLimitada } from "@/app/simulador/operacoes";
import { ACOES } from "@/lib/acoes";
import { ativoPorTicker } from "@/lib/ativos";
import { FIIS } from "@/lib/fiis";
import { ETFS } from "@/lib/etfs";
import type { AcaoB3 } from "@/lib/buscaAcoes";
import { calcularConquistas } from "@/lib/conquistas";
import { exportarTransacoesCsv } from "@/lib/exportarCsv";
import { brl, numero, pct, dataHora } from "@/lib/formato";
import type { Cotacao } from "@/lib/cotacoes";
import { useBuscaAtivos } from "@/lib/useBuscaAtivos";

const MERCADOS: { id: "br" | "us" | "fii" | "etf"; label: string; aria: string }[] = [
  { id: "br", label: "BR", aria: "Ações do Brasil" },
  { id: "us", label: "US", aria: "Ações dos Estados Unidos" },
  { id: "fii", label: "FII", aria: "Fundos imobiliários" },
  { id: "etf", label: "ETF", aria: "ETFs e fundos de índice" },
];

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
  nota: string | null;
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

type Aba = "inicio" | "carteira" | "explorar" | "renda-fixa" | "emprestimo" | "planejador" | "rebalancear" | "e-se" | "noticias" | "ranking" | "duelo" | "agente" | "historico";

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
  perdaoStreak = false,
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
  userId,
  convitesBemSucedidos = 0,
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
  perdaoStreak?: boolean;
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
  userId?: string | null;
  convitesBemSucedidos?: number;
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
    convitesBemSucedidos,
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

  /**
   * Posicao no ranking, pra entrar no cartao compartilhavel.
   *
   * O ranking vem so com o topo, entao quem esta fora dele fica com null,
   * e a linha some do cartao, em vez de mostrar posicao inventada.
   */
  const posicaoRanking =
    ranking.find((r) => r.apelido === apelido)?.posicao ?? null;

  const abas: { id: Aba; label: string; icone: typeof Wallet }[] = [
    { id: "inicio", label: "Início", icone: Home },
    { id: "carteira", label: "Minha carteira", icone: Wallet },
    { id: "explorar", label: "Explorar ações", icone: Search },
    { id: "renda-fixa", label: "Renda fixa", icone: Landmark },
    { id: "emprestimo", label: "Empréstimo", icone: HandCoins },
    { id: "planejador", label: "Planejador", icone: Target },
    { id: "rebalancear", label: "Rebalancear", icone: Scale },
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
                style={{ color: aba === id ? "var(--color-azul-texto)" : "var(--color-ink-muted)" }}
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
                    style={{ color: aba === id ? "var(--color-azul-texto)" : "var(--color-ink-muted)" }}
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
                  posicaoRanking={posicaoRanking}
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

              {aba === "rebalancear" && (
                <RebalanceamentoPainel
                  posicoes={posicoes}
                  precoDe={precoDe}
                  saldo={saldo}
                  aoOperar={(ticker, preco, tipo, limite) => {
                    setOrdem({ ticker, preco, tipo, limite });
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
        novoDia && <PopupStreak dias={diasSeguidos} perdoado={perdaoStreak} />
      )}

      {!mostrarOnboarding && (
        <TourBoasVindas
          mostrar={posicoes.length === 0 && transacoes.length === 0}
        />
      )}

      <PopupDesbloqueio conquistasConcluidas={conquistasConcluidas} userId={userId} />

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
                  const info = ativoPorTicker(p.ticker);
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
  posicaoRanking,
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
  posicaoRanking: number | null;
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
                      posicaoRanking={posicaoRanking}
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
  const [mercado, setMercado] = useState<"br" | "us" | "fii" | "etf">("br");
  const [busca, setBusca] = useState("");
  const [visao, setVisao] = useState<"cards" | "tabela">("cards");

  const [acoesUsa, setAcoesUsa] = useState<AcaoB3[] | null>(null);
  const [buscaUsa, setBuscaUsa] = useState("");

  useEffect(() => {
    if (mercado !== "us" || acoesUsa) return;
    fetch("/api/acoes-usa")
      .then((r) => r.json())
      .then((json) => setAcoesUsa(json.acoes ?? []))
      .catch(() => setAcoesUsa([]));
  }, [mercado, acoesUsa]);

  // FIIs nao aparecem na busca geral da B3 (a brapi filtra so "stock"),
  // entao os precos vem direto da cache (cotacoes), igual as acoes dos EUA.
  const [acoesFii, setAcoesFii] = useState<AcaoB3[] | null>(null);
  useEffect(() => {
    if (mercado !== "fii" || acoesFii) return;
    fetch("/api/fiis")
      .then((r) => r.json())
      .then((json) => setAcoesFii(json.acoes ?? []))
      .catch(() => setAcoesFii([]));
  }, [mercado, acoesFii]);

  // Mesmo caso dos FIIs: ETFs tambem ficam de fora da busca "type=stock".
  const [acoesEtf, setAcoesEtf] = useState<AcaoB3[] | null>(null);
  useEffect(() => {
    if (mercado !== "etf" || acoesEtf) return;
    fetch("/api/etfs")
      .then((r) => r.json())
      .then((json) => setAcoesEtf(json.acoes ?? []))
      .catch(() => setAcoesEtf([]));
  }, [mercado, acoesEtf]);

  // Busca no catalogo COMPLETO da B3: 332 FIIs e 182 ETFs, contra os 10 e
  // 6 curados. So os curados tem explicacao escrita, entao eles seguem
  // como "Populares" e a busca cobre o resto. A logica de debounce +
  // carregando/erro + guarda de cancelamento e compartilhada pelas
  // quatro abas via useBuscaAtivos (src/lib/useBuscaAtivos.ts).
  const buscandoFundo = mercado === "fii" || mercado === "etf";
  const buscaFundo = useBuscaAtivos<AcaoB3>({
    busca,
    atrasoMs: 400,
    minLength: 2,
    ativo: buscandoFundo,
    chave: mercado,
    url: (termo) => `/api/${mercado === "fii" ? "fiis" : "etfs"}?q=${termo}`,
    interpretarResposta: (json) => ({ resultados: json.acoes ?? [], erro: json.erro ?? null }),
    mensagemErroFetch: "Não foi possível buscar agora. Tente de novo em instantes.",
  });
  const buscaFundoAtrasada = buscaFundo.termo;
  const resultadosFundo = buscaFundo.resultados;
  const carregandoFundo = buscaFundo.carregando;
  const erroFundo = buscaFundo.erro;

  const buscaUsaResultado = useBuscaAtivos<AcaoB3>({
    busca: buscaUsa,
    atrasoMs: 400,
    minLength: 2,
    ativo: mercado === "us",
    url: (termo) => `/api/acoes-usa?q=${termo}`,
    interpretarResposta: (json) =>
      json.acoes
        ? { resultados: json.acoes, erro: null }
        : { erro: json.mensagem ?? "Não foi possível buscar agora." },
    mensagemErroFetch: "Não foi possível buscar agora.",
  });
  const buscaUsaAtrasada = buscaUsaResultado.termo;
  const resultadosBuscaUsa = buscaUsaResultado.resultados;
  const carregandoUsa = buscaUsaResultado.carregando;
  const erroUsa = buscaUsaResultado.erro;

  const buscaBr = useBuscaAtivos<AcaoB3>({
    busca,
    atrasoMs: 350,
    carregandoInicial: true,
    url: (termo) => `/api/acoes?q=${termo}`,
    interpretarResposta: (json) =>
      json.acoes
        ? { resultados: json.acoes, erro: null }
        : { erro: json.mensagem ?? "Não foi possível buscar as ações agora." },
    mensagemErroFetch: "Não foi possível buscar as ações agora.",
  });
  const b3 = buscaBr.resultados;
  const carregando = buscaBr.carregando;
  const erroB3 = buscaBr.erro;

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

  // FIIs nao aparecem na busca geral da B3 (a brapi so lista "stock"),
  // entao e so a lista curada, filtrada localmente pelo termo buscado.
  const popularesFii = FIIS.filter((f) => {
    if (!t) return true;
    return (
      f.ticker.toLowerCase().includes(t) ||
      f.nome.toLowerCase().includes(t) ||
      f.tipo.toLowerCase().includes(t)
    );
  }).map((f) => ({ ticker: f.ticker, nome: f.nome, setor: f.tipo, explica: f.explica }));

  const popularesEtf = ETFS.filter((e) => {
    if (!t) return true;
    return (
      e.ticker.toLowerCase().includes(t) ||
      e.nome.toLowerCase().includes(t) ||
      e.indice.toLowerCase().includes(t)
    );
  }).map((e) => ({ ticker: e.ticker, nome: e.nome, setor: e.indice, explica: e.explica }));

  return (
    <div>
      <div className="flex gap-px border border-[var(--rule)]">
        {MERCADOS.map((m) => (
          <button
            key={m.id}
            onClick={() => setMercado(m.id)}
            aria-label={m.aria}
            className="px-4 py-2 font-mono text-[11px] uppercase tracking-wider transition-colors"
            style={{
              color: mercado === m.id ? "var(--color-azul-texto)" : "var(--color-ink-muted)",
              background: mercado === m.id ? "var(--color-paper-alt)" : "var(--color-paper)",
            }}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mercado === "etf" ? (
        <ExplorarEtf
          busca={busca}
          setBusca={setBusca}
          acoesEtf={acoesEtf}
          popularesEtf={popularesEtf}
          buscaFundoAtrasada={buscaFundoAtrasada}
          resultadosFundo={resultadosFundo}
          carregandoFundo={carregandoFundo}
          erroFundo={erroFundo}
          favoritos={favoritos}
          aoComprar={aoComprar}
          aoVerDetalhe={aoVerDetalhe}
        />
      ) : mercado === "fii" ? (
        <ExplorarFii
          busca={busca}
          setBusca={setBusca}
          acoesFii={acoesFii}
          popularesFii={popularesFii}
          buscaFundoAtrasada={buscaFundoAtrasada}
          resultadosFundo={resultadosFundo}
          carregandoFundo={carregandoFundo}
          erroFundo={erroFundo}
          favoritos={favoritos}
          aoComprar={aoComprar}
          aoVerDetalhe={aoVerDetalhe}
        />
      ) : mercado === "us" ? (
        <ExplorarUs
          buscaUsa={buscaUsa}
          setBuscaUsa={setBuscaUsa}
          acoesUsa={acoesUsa}
          buscaUsaAtrasada={buscaUsaAtrasada}
          resultadosBuscaUsa={resultadosBuscaUsa}
          carregandoUsa={carregandoUsa}
          erroUsa={erroUsa}
          favoritos={favoritos}
          aoComprar={aoComprar}
          aoVerDetalhe={aoVerDetalhe}
        />
      ) : (
        <ExplorarBr
          busca={busca}
          setBusca={setBusca}
          termoBuscado={t}
          populares={populares}
          restoB3={restoB3}
          carregando={carregando}
          erroB3={erroB3}
          visao={visao}
          setVisao={setVisao}
          favoritos={favoritos}
          aoComprar={aoComprar}
          aoVerDetalhe={aoVerDetalhe}
        />
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
                          : "bg-gold text-blue-deep"
                    }`}
                  >
                    {t.tipo}
                  </span>
                </td>
                <td className="px-3 py-2 font-mono font-semibold text-ink">
                  <span className="inline-flex items-center gap-1.5">
                    {t.ticker}
                    {t.nota && (
                      <span title={t.nota} className="inline-flex shrink-0">
                        <StickyNote size={12} className="text-ink-muted" aria-label={`Nota: ${t.nota}`} />
                      </span>
                    )}
                  </span>
                </td>
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
