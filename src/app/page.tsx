import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { Manifesto } from "@/components/Manifesto";
import { Valores } from "@/components/Valores";
import { SimulatorPreview } from "@/components/SimulatorPreview";
import { HowItWorks } from "@/components/HowItWorks";
import { Depoimento } from "@/components/Depoimento";
import { CTASection } from "@/components/CTASection";
import { usuarioAtual } from "@/lib/supabase/server";

export default async function Home() {
  const user = await usuarioAtual();

  return (
    <>
      <Header logado={!!user} />
      <main className="flex-1">
        <Hero />
        <Manifesto />
        <Valores />
        <SimulatorPreview />
        <HowItWorks />
        <Depoimento />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
