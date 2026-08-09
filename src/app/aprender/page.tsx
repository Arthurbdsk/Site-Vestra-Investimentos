import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AprenderPainel } from "@/components/AprenderPainel";
import { usuarioAtual } from "@/lib/supabase/server";

export default async function AprenderPage() {
  const user = await usuarioAtual();

  return (
    <>
      <Header logado={!!user} />
      <AprenderPainel />
      <Footer />
    </>
  );
}
