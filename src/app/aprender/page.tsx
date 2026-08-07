import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { StubPage } from "@/components/StubPage";
import { usuarioAtual } from "@/lib/supabase/server";

export default async function AprenderPage() {
  const user = await usuarioAtual();

  return (
    <>
      <Header logado={!!user} />
      <StubPage
        titulo="O conteúdo educativo está a caminho."
        descricao="Aqui vão morar explicações simples sobre como o mercado funciona, sem economês. Estamos escrevendo tudo com calma."
      />
      <Footer />
    </>
  );
}
