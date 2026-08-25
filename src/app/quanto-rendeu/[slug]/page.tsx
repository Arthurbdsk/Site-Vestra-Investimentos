import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { usuarioAtual } from "@/lib/supabase/server";
import { buscarHistorico } from "@/lib/historico";
import { AvisoSimulacaoLinha } from "@/components/AvisoSimulacao";
import { GraficoQuantoRendeu } from "@/components/GraficoQuantoRendeu";
import {
  TODAS_COMBINACOES,
  combinacaoPorSlug,
  categoriaLabel,
  renderRendaFixa,
  CDI_ANUAL_APROX,
  POUPANCA_ANUAL_APROX,
  JANELAS,
  montarSlug,
  slugCanonico,
} from "@/lib/quantoRendeu";
import { brl, pct, numero, data as fmtData } from "@/lib/formato";

const BASE_URL = "https://vestra-simulator.com.br";

/**
 * O resultado muda todo dia (depende do preco de hoje), entao a pagina e
 * revalidada de 24h em 24h em vez de congelada no build. Gerar as ~300 no
 * build tambem estouraria a cota do Yahoo de uma vez; assim cada uma nasce
 * no primeiro acesso e fica em cache.
 */
export const revalidate = 86400;

export function generateStaticParams() {
  // Só as janelas de 5 anos das ações da B3 saem prontas do build (as com
  // mais chance de busca); o resto gera sob demanda no primeiro acesso.
  return TODAS_COMBINACOES.filter(
    (c) => c.janela.slug === "5-anos" && c.ativo.categoria === "acao-br" && c.valor === 1000,
  ).map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = combinacaoPorSlug(slug);
  if (!c) return {};

  const titulo = `Quanto teria rendido ${brl(c.valor)} em ${c.ativo.ticker} em ${c.janela.label}?`;
  const descricao = `Simulação com preço real de ${c.ativo.nome} (${c.ativo.ticker}): quanto ${brl(c.valor)} investidos há ${c.janela.label} valeriam hoje, comparado ao CDI e à poupança.`;
  const url = `${BASE_URL}/quanto-rendeu/${c.slug}`;

  return {
    title: titulo,
    description: descricao,
    keywords: [
      `quanto rendeu ${c.ativo.ticker}`,
      `${c.ativo.ticker} rentabilidade ${c.janela.label}`,
      `investir em ${c.ativo.nome}`,
      `${c.ativo.ticker} vale a pena`,
    ],
    // Trocar so o valor da a mesma pagina multiplicada, entao essas
    // versoes apontam pra do valor principal em vez de competirem entre
    // si. Pra propria versao principal, isso resolve pra ela mesma.
    alternates: { canonical: `${BASE_URL}/quanto-rendeu/${slugCanonico(c)}` },
    openGraph: { title: titulo, description: descricao, url, type: "article" },
  };
}

export default async function QuantoRendeuPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const c = combinacaoPorSlug(slug);
  if (!c) notFound();

  const [user, hist] = await Promise.all([
    usuarioAtual(),
    buscarHistorico(c.ativo.ticker, c.janela.periodo),
  ]);

  const cdi = renderRendaFixa(c.valor, c.janela.anos, CDI_ANUAL_APROX);
  const poupanca = renderRendaFixa(c.valor, c.janela.anos, POUPANCA_ANUAL_APROX);

  // Outras janelas do mesmo ativo + mesma janela de outros ativos: e o
  // link interno que faz o Google encontrar as paginas vizinhas.
  const outrasJanelas = JANELAS.filter((j) => j.slug !== c.janela.slug).map((j) => ({
    label: j.label,
    slug: montarSlug(c.ativo.ticker, c.valor, j.slug),
  }));
  const vizinhos = TODAS_COMBINACOES.filter(
    (o) =>
      o.janela.slug === c.janela.slug &&
      o.valor === c.valor &&
      o.ativo.categoria === c.ativo.categoria &&
      o.ativo.ticker !== c.ativo.ticker,
  ).slice(0, 6);

  return (
    <>
      <Header logado={!!user} />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 py-14">
          <Link
            href="/quanto-rendeu"
            className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-ink-muted transition-colors hover:text-blue"
          >
            <ArrowLeft size={13} />
            Quanto rendeu
          </Link>

          <p className="mt-6 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">
            {categoriaLabel(c.ativo.categoria)} · {c.ativo.setor}
          </p>
          <h1 className="mt-2 font-display text-3xl leading-tight text-ink sm:text-4xl">
            Se você tivesse investido {brl(c.valor)} em {c.ativo.ticker} há{" "}
            {c.janela.label}
          </h1>

          {hist.ok ? (
            <Resultado
              valor={c.valor}
              precoAntigo={hist.precoAntigo}
              precoAtual={hist.precoAtual}
              dataAntiga={hist.dataAntiga}
              dataAtual={hist.dataAtual}
              nome={hist.nome || c.ativo.nome}
              ticker={c.ativo.ticker}
              serie={hist.serie}
              cdi={cdi}
              poupanca={poupanca}
              anos={c.janela.anos}
            />
          ) : (
            <p className="mt-8 border-l-[3px] border-gold pl-5 leading-relaxed text-ink-muted">
              Não consegui buscar o histórico de {c.ativo.ticker} agora.{" "}
              {hist.mensagem} Tente recarregar em alguns instantes.
            </p>
          )}

          {/* Texto proprio do ativo: e o que diferencia esta pagina de um
              molde repetido, e vem do catalogo curado. */}
          <section className="mt-12">
            <h2 className="font-display text-2xl text-ink">
              O que é {c.ativo.ticker}?
            </h2>
            <p className="mt-3 leading-relaxed text-ink">
              <strong className="font-semibold">{c.ativo.nome}</strong>:{" "}
              {c.ativo.explica}
            </p>
          </section>

          <section className="mt-10">
            <h2 className="font-display text-2xl text-ink">
              Rentabilidade passada não se repete
            </h2>
            <p className="mt-3 leading-relaxed text-ink">
              Este número mostra o que aconteceu, não o que vai acontecer. O
              resultado de {c.janela.label} depende do ponto exato em que a
              janela começa: mover a data de início em poucos meses pode
              transformar ganho em perda, e o contrário também. Nenhuma
              conclusão sobre o futuro sai daqui.
            </p>
            <p className="mt-3 leading-relaxed text-ink">
              A simulação também ignora custos que existem na vida real
              (corretagem, emolumentos e imposto de renda na venda) e, no caso
              de ações e fundos que distribuem resultado, não reinveste
              dividendos nem rendimentos: o retorno total de quem recebeu e
              reaplicou seria diferente.
            </p>
            <AvisoSimulacaoLinha className="mt-4" />
          </section>

          <section className="mt-12 border border-[var(--rule)] bg-paper-alt px-6 py-6">
            <p className="font-display text-xl text-ink">
              Quer testar sua própria combinação?
            </p>
            <p className="mt-2 leading-relaxed text-ink-muted">
              No simulador do Vestra você monta uma carteira com R$ 100.000
              fictícios e preços reais da bolsa, e acompanha o resultado dia a
              dia. Sem cadastro obrigatório e sem risco.
            </p>
            <Link
              href="/simulador"
              className="mt-4 inline-block bg-blue px-5 py-2.5 text-sm font-semibold text-onblue transition-colors hover:bg-blue-deep"
            >
              Abrir o simulador
            </Link>
          </section>

          <nav className="mt-12 grid gap-8 sm:grid-cols-2">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
                Mesma ação, outro prazo
              </p>
              <ul className="mt-3 space-y-2">
                {outrasJanelas.map((o) => (
                  <li key={o.slug}>
                    <Link
                      href={`/quanto-rendeu/${o.slug}`}
                      className="text-sm font-semibold text-ink transition-colors hover:text-blue"
                    >
                      {brl(c.valor)} em {c.ativo.ticker} há {o.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            {vizinhos.length > 0 && (
              <div>
                <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
                  Mesmo prazo, outros ativos
                </p>
                <ul className="mt-3 space-y-2">
                  {vizinhos.map((v) => (
                    <li key={v.slug}>
                      <Link
                        href={`/quanto-rendeu/${v.slug}`}
                        className="text-sm font-semibold text-ink transition-colors hover:text-blue"
                      >
                        {v.ativo.ticker}: {v.ativo.nome}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </nav>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Resultado({
  valor,
  precoAntigo,
  precoAtual,
  dataAntiga,
  dataAtual,
  nome,
  ticker,
  serie,
  cdi,
  poupanca,
  anos,
}: {
  valor: number;
  precoAntigo: number;
  precoAtual: number;
  dataAntiga: string;
  dataAtual: string;
  nome: string;
  ticker: string;
  serie: { data: string; preco: number }[];
  cdi: number;
  poupanca: number;
  anos: number;
}) {
  // Fracionar a cota de proposito: arredondar pra baixo esconderia parte
  // do resultado em ativo de preco alto, e a pergunta aqui e sobre o
  // desempenho do ativo, nao sobre lote minimo de negociacao.
  const cotas = precoAntigo > 0 ? valor / precoAntigo : 0;
  const hoje = cotas * precoAtual;
  const dif = hoje - valor;
  const difPct = valor > 0 ? (dif / valor) * 100 : 0;
  const positivo = dif > 0;
  const Icone = positivo ? TrendingUp : dif < 0 ? TrendingDown : Minus;
  const cor = positivo
    ? "text-emerald-600 dark:text-emerald-400"
    : dif < 0
      ? "text-rose-600 dark:text-rose-400"
      : "text-ink-muted";

  const linhas = [
    { nome: `${ticker}`, valor: hoje, destaque: true },
    { nome: "CDI (aprox.)", valor: cdi, destaque: false },
    { nome: "Poupança (aprox.)", valor: poupanca, destaque: false },
  ];
  const teto = Math.max(...linhas.map((l) => l.valor), valor);

  return (
    <>
      <div className="mt-8 border border-[var(--rule)]">
        <div className="border-b border-[var(--rule)] px-6 py-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">
            Valeriam hoje
          </p>
          <p className="mt-1.5 font-mono text-4xl tabular text-ink sm:text-5xl">
            {brl(hoje)}
          </p>
          <p className={`mt-2 flex items-center gap-1.5 font-mono text-sm tabular ${cor}`}>
            <Icone size={14} aria-hidden />
            {dif >= 0 ? "+" : ""}
            {brl(dif)} ({pct(difPct)})
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            {brl(valor)} comprariam {cotas.toFixed(2).replace(".", ",")} cotas de{" "}
            {nome} a {brl(precoAntigo)} em {fmtData(dataAntiga)}. A{" "}
            {brl(precoAtual)} de {fmtData(dataAtual)}, valem {brl(hoje)}.
          </p>
        </div>

        <GraficoQuantoRendeu serie={serie} cotas={cotas} investido={valor} />

        <div className="border-t border-[var(--rule)] px-6 py-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">
            No mesmo período, em renda fixa
          </p>
          <ul className="mt-4 space-y-3">
            {linhas.map((l) => (
              <li key={l.nome}>
                <div className="flex items-baseline justify-between gap-3">
                  <span className={`text-sm ${l.destaque ? "font-semibold text-ink" : "text-ink-muted"}`}>
                    {l.nome}
                  </span>
                  <span className="font-mono tabular text-ink">{brl(l.valor)}</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full bg-paper-alt">
                  <div
                    className="h-full"
                    style={{
                      width: `${Math.max(2, (l.valor / teto) * 100)}%`,
                      background: l.destaque
                        ? "var(--color-azul-texto)"
                        : "var(--color-ink-muted)",
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-4 font-mono text-[10px] leading-relaxed text-ink-muted">
            CDI e poupança calculados como taxa média aproximada de{" "}
            {numero(CDI_ANUAL_APROX * 100, 1)}% e{" "}
            {numero(POUPANCA_ANUAL_APROX * 100, 1)}% ao ano, compostos por{" "}
            {anos} {anos === 1 ? "ano" : "anos"}. Serve para dar ordem de
            grandeza, não como rentabilidade histórica exata do período.
          </p>
        </div>
      </div>
    </>
  );
}
