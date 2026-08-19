import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { usuarioAtual } from "@/lib/supabase/server";
import Image from "next/image";
import { POSTS_BLOG, postPorSlug, CAPAS } from "@/lib/blog";
import { WidgetArtigo } from "@/components/artigo/WidgetArtigo";
import { data as fmtData } from "@/lib/formato";

const BASE_URL = "https://vestra-simulator.com.br";

export function generateStaticParams() {
  return POSTS_BLOG.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = postPorSlug(slug);
  if (!post) return {};

  const url = `${BASE_URL}/blog/${post.slug}`;

  return {
    // absolute: o titulo do artigo ja e longo; deixar o template do
    // layout somar " | Vestra Simulador de Investimentos" passaria bem
    // do que o Google mostra.
    title: { absolute: `${post.titulo} | Vestra` },
    description: post.resumo,
    keywords: post.palavrasChave,
    alternates: { canonical: url },
    openGraph: {
      title: post.titulo,
      description: post.resumo,
      url,
      type: "article",
      publishedTime: post.dataPublicacao,
      // Sem imagem, o link compartilhado no WhatsApp/LinkedIn sai como
      // um bloco de texto sem nada; a capa do tema resolve isso.
      images: [{ url: CAPAS[post.capa].arquivo, alt: CAPAS[post.capa].alt }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.titulo,
      description: post.resumo,
      images: [CAPAS[post.capa].arquivo],
    },
  };
}

export default async function PostBlogPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = postPorSlug(slug);
  if (!post) notFound();

  const user = await usuarioAtual();
  const url = `${BASE_URL}/blog/${post.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.titulo,
    description: post.resumo,
    datePublished: post.dataPublicacao,
    keywords: post.palavrasChave.join(", "),
    url,
    author: { "@type": "Organization", name: "Vestra" },
    publisher: { "@type": "Organization", name: "Vestra" },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
  };

  const outrosPosts = POSTS_BLOG.filter((p) => p.slug !== post.slug).slice(0, 3);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Header logado={!!user} />
      <main className="flex-1">
        <article className="mx-auto max-w-2xl px-6 py-16">
          <Link
            href="/blog"
            className="inline-flex items-center gap-1.5 font-mono text-xs uppercase tracking-widest text-ink-muted transition-colors hover:text-blue"
          >
            <ArrowLeft size={13} />
            Blog
          </Link>

          <p className="mt-6 font-mono text-[11px] text-ink-muted">
            {fmtData(post.dataPublicacao)} · {post.tempoLeituraMin} min de leitura
          </p>
          <h1 className="mt-2 font-display text-4xl leading-tight text-ink">{post.titulo}</h1>
          <p className="mt-4 border-l-[3px] border-gold pl-5 leading-relaxed text-ink-muted">
            {post.resumo}
          </p>

          {/* priority: e a maior imagem acima da dobra, entao carregar
              depois do resto empurraria o texto e piscaria o layout. */}
          <div className="relative mt-8 aspect-[16/7] overflow-hidden border border-[var(--rule)]">
            <Image
              src={CAPAS[post.capa].arquivo}
              alt={CAPAS[post.capa].alt}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 672px"
              className="object-cover"
            />
          </div>

          <div className="mt-10 space-y-5">
            {post.corpo.map((bloco, i) => {
              if (bloco.tipo === "subtitulo") {
                return (
                  <h2 key={i} className="pt-2 font-display text-2xl text-ink">
                    {bloco.texto}
                  </h2>
                );
              }
              if (bloco.tipo === "widget") {
                return <WidgetArtigo key={i} nome={bloco.nome} />;
              }
              return (
                <p key={i} className="leading-relaxed text-ink">
                  {bloco.texto}
                </p>
              );
            })}
          </div>

          <div className="mt-12 border-t border-[var(--rule)] pt-8">
            <p className="text-ink-muted">
              Quer praticar o que leu aqui sem arriscar dinheiro de verdade?{" "}
              <Link href="/simulador" className="font-semibold text-blue hover:text-gold">
                Experimente o simulador do Vestra
              </Link>
              .
            </p>
          </div>

          {outrosPosts.length > 0 && (
            <div className="mt-14">
              <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
                Leia também
              </p>
              <ul className="mt-4 space-y-3">
                {outrosPosts.map((p) => (
                  <li key={p.slug}>
                    <Link
                      href={`/blog/${p.slug}`}
                      className="font-semibold text-ink transition-colors hover:text-blue"
                    >
                      {p.titulo}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </article>
      </main>
      <Footer />
    </>
  );
}
