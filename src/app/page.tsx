import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Hero } from "@/components/Hero";
import { WhySection } from "@/components/WhySection";
import { SimulatorPreview } from "@/components/SimulatorPreview";
import { HowItWorks } from "@/components/HowItWorks";
import { CTASection } from "@/components/CTASection";
import { usuarioAtual } from "@/lib/supabase/server";

export default async function Home() {
  const user = await usuarioAtual();

  return (
    <>
      <Header logado={!!user} />
      <main className="flex-1">
        <Hero />
        <WhySection />
        <SimulatorPreview />
        <HowItWorks />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
