import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FormularioAuth } from "@/components/FormularioAuth";
import { usuarioAtual } from "@/lib/supabase/server";

export const metadata = {
  alternates: { canonical: "https://vestra-simulator.com.br/cadastro" },
  title: "Criar conta",
  description:
    "Crie sua conta gratuita no Vestra e receba saldo fictício pra simular investimentos com preços reais da B3 e da bolsa americana.",
};

export default async function CadastroPage() {
  const user = await usuarioAtual();

  if (user) redirect("/simulador");

  return (
    <>
      <Header />
      <main className="grain relative flex flex-1 items-center bg-paper">
        <div className="relative z-[2] mx-auto w-full max-w-6xl px-6 py-20">
          <FormularioAuth modo="cadastro" />
        </div>
      </main>
      <Footer />
    </>
  );
}
