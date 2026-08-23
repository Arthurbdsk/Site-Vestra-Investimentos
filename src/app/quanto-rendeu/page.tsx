import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { usuarioAtual } from "@/lib/supabase/server";
import {
  ATIVOS,
  JANELAS,
  VALORES,
  montarSlug,
  categoriaLabel,
  type CategoriaAtivo,
} from "@/lib/quantoRendeu";
import { brl } from "@/lib/formato";

const TITULO = "Quanto teria rendido? Simulações com preço real da bolsa";
const DESCRICAO =
  "Veja quanto R$ 1.000 ou R$ 5.000 investidos há 1, 2 ou 5 anos valeriam hoje em ações da B3, ações dos EUA, fundos imobiliários e ETFs, comparado ao CDI e à poupança.";

export const metadata: Metadata = {
  title: TITULO,
  description: DESCRICAO,
  keywords: [
    "quanto rendeu",
    "quanto teria rendido",
    "simulador de rentabilidade",
    "rentabilidade de ações",
    "se eu tivesse investido",
  ],
  alternates: { canonical: "https://vestra-simulator.com.br/quanto-rendeu" },
  openGraph: {
    title: TITULO,
    description: DESCRICAO,
    url: "https://vestra-simulator.com.br/quanto-rendeu",
    type: "website",
  },
};

const ORDEM: CategoriaAtivo[] = ["acao-br", "acao-us", "fii", "etf"];

export default async function QuantoRendeuIndex() {
  const user = await usuarioAtual();
  const valorPadrao = VALORES[0];

  return (
    <>
      <Header logado={!!user} />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
            Quanto rendeu
          </p>
          <h1 className="mt-3 font-display text-4xl text-ink">
            E se você tivesse investido antes?
          </h1>
          <p className="mt-4 max-w-xl leading-relaxed text-ink-muted">
            Cada página abaixo calcula, com preço real de fechamento, quanto{" "}
            {brl(valorPadrao)} investidos há 1, 2 ou 5 anos valeriam hoje, e
            compara com o que a mesma quantia renderia no CDI e na poupança.
          </p>

          {ORDEM.map((cat) => {
            const doGrupo = ATIVOS.filter((a) => a.categoria === cat);
            if (doGrupo.length === 0) return null;
            return (
              <section key={cat} className="mt-12">
                <h2 className="font-display text-2xl text-ink">
                  {categoriaLabel(cat)}
                </h2>
                <ul className="mt-4 grid gap-px bg-[var(--rule)] sm:grid-cols-2">
                  {doGrupo.map((a) => (
                    <li key={a.ticker} className="bg-paper p-5">
                      <p className="font-mono text-sm font-semibold text-ink">
                        {a.ticker}
                      </p>
                      <p className="mt-0.5 text-sm text-ink-muted">{a.nome}</p>
                      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
                        {JANELAS.map((j) => (
                          <Link
                            key={j.slug}
                            href={`/quanto-rendeu/${montarSlug(a.ticker, valorPadrao, j.slug)}`}
                            className="font-mono text-[11px] uppercase tracking-wider text-blue transition-colors hover:text-ink"
                          >
                            {j.labelCurto}
                          </Link>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}

          <p className="mt-12 font-mono text-[11px] leading-relaxed text-ink-muted">
            Resultado passado não indica resultado futuro. As simulações
            ignoram corretagem, emolumentos, imposto de renda e reinvestimento
            de dividendos.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
