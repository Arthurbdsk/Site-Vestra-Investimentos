import type { Metadata } from "next";
import Link from "next/link";
import { Users, ArrowRight, Trophy } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AvisoSimulacaoLinha } from "@/components/AvisoSimulacao";
import { ChallengeInicio } from "@/components/challenge/ChallengeInicio";
import { criarClienteServidor, usuarioAtual } from "@/lib/supabase/server";
import type { ResumoCompeticao } from "@/lib/challenge";

export const metadata: Metadata = {
  title: "Competições | Vestra",
  description:
    "Crie a competição de investimento da sua turma, liga ou grupo: todos começam com o mesmo capital fictício, cada ordem fica registrada e o resultado é congelado no encerramento.",
};

async function dadosDoUsuario(): Promise<{ competicoes: ResumoCompeticao[]; souAdmin: boolean }> {
  try {
    const supabase = await criarClienteServidor();
    const [lista, admin] = await Promise.all([
      supabase.rpc("listar_minhas_competicoes"),
      supabase.rpc("sou_admin_vestra"),
    ]);
    return {
      competicoes: Array.isArray(lista.data) ? (lista.data as ResumoCompeticao[]) : [],
      souAdmin: admin.data === true,
    };
  } catch {
    return { competicoes: [], souAdmin: false };
  }
}

const REGRAS = [
  ["Mesmo ponto de partida", "Cada participante recebe o mesmo capital, numa carteira separada da carteira pessoal."],
  ["Preço confirmado no servidor", "Toda ordem é executada pelo preço de mercado verificado pelo Vestra, nunca pelo navegador."],
  ["Tudo registrado", "Horário, preço, quantidade e a tese de cada operação ficam no histórico, visível ao organizador."],
  ["Resultado congelado", "No encerramento, o patrimônio de todos é calculado com as cotações atualizadas e não muda mais."],
] as const;

export default async function CompeticoesPage() {
  const user = await usuarioAtual();
  const { competicoes, souAdmin } = user ? await dadosDoUsuario() : { competicoes: [], souAdmin: false };

  return (
    <>
      <Header logado={!!user} />
      <main className="grain relative flex-1 bg-paper">
        <div className="relative z-[2] mx-auto max-w-4xl px-6 py-16">
          <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">
            <Users size={13} aria-hidden /> Competições
          </p>
          <h1 className="mt-3 font-display text-3xl leading-tight text-ink sm:text-4xl">
            Crie a competição da sua turma, liga ou grupo
          </h1>
          <p className="mt-4 max-w-2xl leading-relaxed text-ink-muted">
            Você define nome, datas e capital inicial, manda o link e acompanha
            o ranking. As regras são as mesmas do Vestra Challenge.
          </p>

          <Link
            href="/challenge"
            className="group mt-8 flex items-center justify-between gap-4 border-l-[3px] border-gold bg-paper-alt px-5 py-4 transition-colors hover:bg-gold/10"
          >
            <span className="flex items-center gap-3">
              <Trophy size={18} className="shrink-0 text-gold" aria-hidden />
              <span>
                <span className="block text-sm font-semibold text-ink">Vestra Challenge</span>
                <span className="block text-sm text-ink-muted">A competição oficial do Vestra, aberta a todos.</span>
              </span>
            </span>
            <ArrowRight size={16} className="shrink-0 text-ink-muted transition-transform group-hover:translate-x-1" />
          </Link>

          <ul className="mt-8 grid gap-px bg-[var(--rule)] sm:grid-cols-2">
            {REGRAS.map(([titulo, texto]) => (
              <li key={titulo} className="bg-paper p-5">
                <p className="text-sm font-semibold text-ink">{titulo}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">{texto}</p>
              </li>
            ))}
          </ul>

          <ChallengeInicio
            logado={!!user}
            competicoes={competicoes}
            souAdmin={souAdmin}
            agora={new Date().getTime()}
          />

          <AvisoSimulacaoLinha className="mt-12" />
        </div>
      </main>
      <Footer />
    </>
  );
}
