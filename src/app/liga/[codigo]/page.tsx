import type { Metadata } from "next";
import Link from "next/link";
import { Users } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { criarClienteServidor, usuarioAtual } from "@/lib/supabase/server";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { AvisoSimulacaoLinha } from "@/components/AvisoSimulacao";
import { pct } from "@/lib/formato";

type LigaPublica = {
  ok: boolean;
  nome?: string;
  dias?: number;
  criadoEm?: string;
  totalMembros?: number;
  top?: { apelido: string; ganhoPct: number }[];
};

async function buscar(codigo: string): Promise<LigaPublica | null> {
  if (!supabaseConfigurado()) return null;
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.rpc("ver_liga_publica", { p_codigo: codigo });
  if (error) return null;
  return data as LigaPublica;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ codigo: string }>;
}): Promise<Metadata> {
  const { codigo } = await params;
  const l = await buscar(codigo);

  if (!l?.ok) {
    return { title: "Convite de liga | Vestra", robots: { index: false } };
  }

  return {
    title: `${l.nome} | Liga no Vestra`,
    description: `Entre na liga "${l.nome}" no simulador Vestra: quem crescer mais em ${l.dias} dias vence.`,
    robots: { index: false, follow: false },
  };
}

export default async function ConviteLigaPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  const [user, liga] = await Promise.all([usuarioAtual(), buscar(codigo)]);
  const logado = !!user;

  return (
    <>
      <Header logado={logado} />
      <main className="grain relative flex-1 bg-paper">
        <div className="relative z-[2] mx-auto max-w-2xl px-6 py-16">
          {!liga?.ok ? (
            <>
              <h1 className="font-display text-3xl text-ink">Não achei essa liga</h1>
              <p className="mt-4 leading-relaxed text-ink-muted">
                O código <span className="font-mono">{codigo}</span> não existe
                ou a liga já encerrou.
              </p>
              <Link
                href="/simulador"
                className="mt-8 inline-block bg-blue px-6 py-3 text-sm font-semibold text-onblue transition-colors hover:bg-blue-deep"
              >
                Conhecer o simulador
              </Link>
            </>
          ) : (
            <>
              <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                <Users size={13} aria-hidden />
                Liga · {liga.dias} dias · {liga.totalMembros}{" "}
                {liga.totalMembros === 1 ? "membro" : "membros"}
              </p>
              <h1 className="mt-3 font-display text-3xl leading-tight text-ink sm:text-4xl">
                {liga.nome}
              </h1>
              <p className="mt-4 max-w-lg leading-relaxed text-ink-muted">
                Quem fizer a carteira fictícia crescer mais, em porcentagem,
                dentro do prazo, vence. Dinheiro nenhum de verdade entra ou
                sai: o que está em jogo é só o placar.
              </p>

              {liga.top && liga.top.length > 0 && (
                <div className="mt-8 border border-[var(--rule)]">
                  <p className="border-b border-[var(--rule)] bg-paper-alt px-5 py-2.5 font-mono text-[11px] uppercase tracking-widest text-ink-muted">
                    No topo agora
                  </p>
                  <ul>
                    {liga.top.map((m, i) => (
                      <li
                        key={m.apelido}
                        className="flex items-center justify-between border-b border-[var(--rule)] px-5 py-3 last:border-b-0"
                      >
                        <span className="text-sm text-ink">
                          {i + 1}. {m.apelido}
                        </span>
                        <span
                          className={`font-mono text-sm tabular ${
                            m.ganhoPct >= 0 ? "text-emerald-600" : "text-rose-600"
                          }`}
                        >
                          {pct(m.ganhoPct)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-8 border-l-[3px] border-gold bg-paper-alt px-5 py-5">
                <p className="font-display text-xl text-ink">
                  {logado ? "Entre na liga" : "Aceite o convite"}
                </p>
                <p className="mt-2 leading-relaxed text-ink-muted">
                  {logado
                    ? "Use o código abaixo na aba Ligas do simulador."
                    : "Crie sua conta, receba R$ 100.000 fictícios e use o código abaixo na aba Ligas."}
                </p>
                <p className="mt-3 font-mono text-2xl font-semibold tabular tracking-widest text-ink">
                  {codigo.toUpperCase()}
                </p>
                <Link
                  href={logado ? "/simulador" : "/cadastro"}
                  className="mt-4 inline-block bg-blue px-6 py-3 text-sm font-semibold text-onblue transition-colors hover:bg-blue-deep"
                >
                  {logado ? "Abrir o simulador" : "Criar conta e entrar"}
                </Link>
              </div>

              <AvisoSimulacaoLinha className="mt-8" />
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
