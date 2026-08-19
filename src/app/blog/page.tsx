import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { usuarioAtual } from "@/lib/supabase/server";
import { POSTS_BLOG, CAPAS } from "@/lib/blog";
import { data as fmtData } from "@/lib/formato";

// Curto de proposito: o layout raiz acrescenta " | Vestra Simulador de
// Investimentos" via template, e o Google corta o titulo perto de 60
// caracteres.
const TITULO = "Blog";
const DESCRICAO =
  "Artigos sobre como começar a investir, ações, Tesouro Direto, CDB, diversificação e dividendos, escritos em português simples pra quem está começando.";

export const metadata: Metadata = {
  title: TITULO,
  description: DESCRICAO,
  keywords: [
    "blog de investimentos",
    "educação financeira",
    "como investir",
    "investir para iniciantes",
    "ações B3",
  ],
  alternates: { canonical: "https://vestra-simulator.com.br/blog" },
  openGraph: {
    // openGraph nao passa pelo template do layout, entao aqui o nome
    // completo entra na mao.
    title: "Blog | Vestra Simulador de Investimentos",
    description: DESCRICAO,
    url: "https://vestra-simulator.com.br/blog",
    type: "website",
  },
};

export default async function BlogPage() {
  const user = await usuarioAtual();
  const posts = [...POSTS_BLOG].sort((a, b) => (a.dataPublicacao < b.dataPublicacao ? 1 : -1));

  return (
    <>
      <Header logado={!!user} />
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-6 py-16">
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">Blog</p>
          <h1 className="mt-3 font-display text-4xl text-ink">Educação financeira sem enrolação</h1>
          <p className="mt-4 max-w-xl leading-relaxed text-ink-muted">
            Artigos curtos sobre como investir, escritos em português direto,
            sem economês. Cada um leva de 4 a 6 minutos pra ler.
          </p>

          <ul className="mt-12 grid gap-px bg-[var(--rule)] sm:grid-cols-2">
            {posts.map((post, i) => (
              <li key={post.slug} className="bg-paper">
                <Link href={`/blog/${post.slug}`} className="group block">
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <Image
                      src={CAPAS[post.capa].arquivo}
                      alt={CAPAS[post.capa].alt}
                      fill
                      // Só as quatro primeiras entram acima da dobra; o
                      // resto carrega sob demanda pra a listagem não puxar
                      // as cinco capas de uma vez no primeiro paint.
                      priority={i < 4}
                      sizes="(max-width: 640px) 100vw, 50vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="p-6">
                    <p className="font-mono text-[11px] text-ink-muted">
                      {fmtData(post.dataPublicacao)} · {post.tempoLeituraMin} min de leitura
                    </p>
                    <h2 className="mt-2 font-display text-xl text-ink transition-colors group-hover:text-blue">
                      {post.titulo}
                    </h2>
                    <p className="mt-2 text-sm leading-relaxed text-ink-muted">{post.resumo}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <Footer />
    </>
  );
}
