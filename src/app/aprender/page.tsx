import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AprenderPainel } from "@/components/AprenderPainel";
import { usuarioAtual } from "@/lib/supabase/server";

const DESCRICAO =
  "Aprenda a investir de graça: dicionário de termos do mercado, artigos curtos com quiz e calculadora de juros compostos, sem economês.";

export const metadata: Metadata = {
  title: "Aprender",
  description: DESCRICAO,
  alternates: { canonical: "https://vestra-simulator.com.br/aprender" },
  openGraph: {
    title: "Aprender | Vestra Simulador de Investimentos",
    description: DESCRICAO,
    url: "https://vestra-simulator.com.br/aprender",
    type: "website",
  },
};

export default async function AprenderPage() {
  const user = await usuarioAtual();

  return (
    <>
      <Header logado={!!user} />
      <AprenderPainel userId={user?.id} />
      <Footer />
    </>
  );
}
