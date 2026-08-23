import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { FormularioAuth } from "@/components/FormularioAuth";
import { usuarioAtual } from "@/lib/supabase/server";

export const metadata = {
  title: "Entrar",
  description: "Entre na sua conta Vestra para acessar seu simulador de investimentos.",
};

export default async function LoginPage() {
  const user = await usuarioAtual();

  if (user) redirect("/simulador");

  return (
    <>
      <Header />
      <main className="grain relative flex flex-1 items-center bg-paper">
        <div className="relative z-[2] mx-auto w-full max-w-6xl px-6 py-20">
          <FormularioAuth modo="login" />
        </div>
      </main>
      <Footer />
    </>
  );
}
