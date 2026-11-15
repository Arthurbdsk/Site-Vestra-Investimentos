import type { Metadata } from "next";
import { Trophy } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AvisoSimulacaoLinha } from "@/components/AvisoSimulacao";
import { ChallengeInicio } from "@/components/challenge/ChallengeInicio";
import { criarClienteServidor, usuarioAtual } from "@/lib/supabase/server";
import type { ResumoCompeticao } from "@/lib/challenge";

export const metadata: Metadata = {
  title: "Vestra Challenge | Competições de investimento",
  description:
    "Competições de investimento com dinheiro fictício e cotações reais: todos começam com o mesmo capital, cada ordem fica registrada e o ranking é congelado no encerramento.",
};

async function minhasCompeticoes(): Promise<ResumoCompeticao[]> {
  try {
    const supabase = await criarClienteServidor();
    const { data, error } = await supabase.rpc("listar_minhas_competicoes");
    if (error || !Array.isArray(data)) return [];
    return data as ResumoCompeticao[];
  } catch {
    return [];
  }
}

const REGRAS = [
  ["Mesmo ponto de partida", "Cada participante recebe o mesmo capital, numa carteira separada da carteira pessoal."],
  ["Preço confirmado no servidor", "Toda ordem é executada pelo preço de mercado verificado pelo Vestra, nunca pelo navegador."],
  ["Tudo registrado", "Horário, preço, quantidade e a tese de cada operação ficam no histórico, visível ao organizador."],
  ["Resultado congelado", "No encerramento, o patrimônio de todos é calculado com as cotações atualizadas e não muda mais."],
] as const;

export default async function ChallengePage() {
  const user = await usuarioAtual();
  const competicoes = user ? await minhasCompeticoes() : [];

  return (
    <>
      <Header logado={!!user} />
      <main className="grain relative flex-1 bg-paper">
        <div className="relative z-[2] mx-auto max-w-4xl px-6 py-16">
          <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">
            <Trophy size={13} aria-hidden /> Vestra Challenge
          </p>
          <h1 className="mt-3 font-display text-3xl leading-tight text-ink sm:text-4xl">
            Competições de investimento para turmas, ligas e universidades
          </h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-ink-muted">
            Um ambiente justo e auditável para treinar decisões de investimento
            com cotações reais e dinheiro fictício.
          </p>

          <ul className="mt-8 grid gap-px bg-[var(--rule)] sm:grid-cols-2">
            {REGRAS.map(([titulo, texto]) => (
              <li key={titulo} className="bg-paper p-5">
                <p className="text-sm font-semibold text-ink">{titulo}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">{texto}</p>
              </li>
            ))}
          </ul>

          <ChallengeInicio logado={!!user} competicoes={competicoes} agora={new Date().getTime()} />

          <AvisoSimulacaoLinha className="mt-12" />
        </div>
      </main>
      <Footer />
    </>
  );
}
