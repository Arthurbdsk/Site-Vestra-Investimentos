import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { EducacaoPainel } from "@/components/EducacaoPainel";
import { criarClienteServidor, usuarioAtual } from "@/lib/supabase/server";
import type { PerfilId } from "@/lib/perfilInvestidor";

const DESCRICAO =
  "Educação financeira do zero: o que é um título, CDB, LCI, LCA e Tesouro Direto, como montar uma carteira e uma avaliação gratuita que diz se a sua combina com o seu perfil.";

export const metadata: Metadata = {
  title: "Educação financeira",
  description: DESCRICAO,
  alternates: { canonical: "https://vestra-simulator.com.br/educacao" },
  openGraph: {
    title: "Educação financeira | Vestra Simulador de Investimentos",
    description: DESCRICAO,
    url: "https://vestra-simulator.com.br/educacao",
    type: "website",
  },
};

const PERFIS_VALIDOS: PerfilId[] = ["conservador", "moderado", "arrojado"];

export default async function EducacaoPage() {
  const user = await usuarioAtual();

  // Quem ja fez o quiz no simulador chega na avaliacao com o perfil marcado.
  let perfilInicial: PerfilId | null = null;
  if (user) {
    try {
      const supabase = await criarClienteServidor();
      const { data } = await supabase
        .from("perfis")
        .select("perfil_investidor")
        .eq("id", user.id)
        .maybeSingle();
      const p = data?.perfil_investidor as PerfilId | null | undefined;
      if (p && PERFIS_VALIDOS.includes(p)) perfilInicial = p;
    } catch {
      perfilInicial = null;
    }
  }

  return (
    <>
      <Header logado={!!user} />
      <EducacaoPainel perfilInicial={perfilInicial} />
      <Footer />
    </>
  );
}
