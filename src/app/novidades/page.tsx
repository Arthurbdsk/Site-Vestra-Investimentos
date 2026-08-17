import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { usuarioAtual } from "@/lib/supabase/server";
import { NotasAtualizacao } from "@/components/NotasAtualizacao";

const TITULO = "Novidades do Vestra: o que mudou na plataforma";
const DESCRICAO =
  "Acompanhe as últimas atualizações do simulador Vestra: novas funções, ajustes de tela e conteúdo adicionado.";

export const metadata: Metadata = {
  title: TITULO,
  description: DESCRICAO,
  alternates: { canonical: "https://vestra-simulator.com.br/novidades" },
  openGraph: {
    title: TITULO,
    description: DESCRICAO,
    url: "https://vestra-simulator.com.br/novidades",
    type: "website",
  },
};

export default async function NovidadesPage() {
  const user = await usuarioAtual();

  return (
    <>
      <Header logado={!!user} />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
            Novidades
          </p>
          <div className="mt-6">
            <NotasAtualizacao />
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
