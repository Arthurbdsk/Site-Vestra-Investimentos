import type { Metadata } from "next";
import Link from "next/link";
import { Trophy, ArrowRight, Users, Medal } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AvisoSimulacaoLinha } from "@/components/AvisoSimulacao";
import { criarClienteServidor, usuarioAtual } from "@/lib/supabase/server";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { brl, data, pct } from "@/lib/formato";
import {
  ROTULO_STATUS,
  descreverPrazo,
  edicaoEmDestaque,
  type Competicao,
  type EdicaoOficial,
} from "@/lib/challenge";

export const metadata: Metadata = {
  title: "Vestra Challenge | A competição oficial do Vestra",
  description:
    "A competição oficial de investimentos do Vestra: mesmo capital fictício para todos, cotações reais, cada ordem registrada e resultado congelado no encerramento.",
};

async function carregar(): Promise<{ edicoes: EdicaoOficial[]; destaque: Competicao | null }> {
  if (!supabaseConfigurado()) return { edicoes: [], destaque: null };
  try {
    const supabase = await criarClienteServidor();
    const { data: lista } = await supabase.rpc("listar_challenge_oficial");
    const edicoes = Array.isArray(lista) ? (lista as EdicaoOficial[]) : [];
    const atual = edicaoEmDestaque(edicoes);
    if (!atual) return { edicoes, destaque: null };
    const { data: det } = await supabase.rpc("ver_competicao", { p_codigo: atual.codigo });
    return { edicoes, destaque: det?.ok ? (det as Competicao) : null };
  } catch {
    return { edicoes: [], destaque: null };
  }
}

const COMO_FUNCIONA = [
  ["Mesmo ponto de partida", "Todo mundo recebe o mesmo capital fictício, numa carteira só da competição."],
  ["Cotações reais", "Ações do Brasil e dos EUA, executadas pelo preço confirmado no servidor do Vestra."],
  ["Decisões registradas", "Cada ordem leva uma tese escrita: o que você viu e por que entrou."],
  ["Resultado definitivo", "No encerramento o patrimônio de todos é congelado e o pódio fica registrado aqui."],
] as const;

const cor = (v: number) => (v >= 0 ? "text-emerald-600" : "text-rose-600");

export default async function ChallengePage() {
  const [user, { edicoes, destaque }] = await Promise.all([usuarioAtual(), carregar()]);
  const agora = new Date().getTime();
  const anteriores = edicoes.filter((e) => e.status === "encerrada");

  return (
    <>
      <Header logado={!!user} />
      <main className="grain relative flex-1 bg-paper">
        <div className="relative z-[2] mx-auto max-w-4xl px-6 py-16">
          <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-gold">
            <Trophy size={13} aria-hidden /> A competição oficial do Vestra
          </p>
          <h1 className="mt-3 font-display text-4xl leading-tight text-ink sm:text-5xl">Vestra Challenge</h1>
          <p className="mt-4 max-w-2xl text-lg leading-relaxed text-ink-muted">
            Uma disputa de investimentos com regras iguais para todos. Monte sua
            carteira, defenda suas teses e veja até onde sua estratégia chega.
          </p>

          {destaque ? (
            <section className="mt-10 border border-[var(--rule)]">
              <div className="border-b border-[var(--rule)] bg-paper-alt px-5 py-3 font-mono text-[11px] uppercase tracking-widest text-ink-muted">
                {destaque.status === "aberta" ? "Edição em andamento" : "Próxima edição"} ·{" "}
                {descreverPrazo(destaque.inicio, destaque.fim, agora)}
              </div>
              <div className="p-5">
                <h2 className="font-display text-2xl text-ink">{destaque.nome}</h2>
                <dl className="mt-4 grid gap-4 sm:grid-cols-4">
                  {[
                    ["Status", ROTULO_STATUS[destaque.status]],
                    ["Capital inicial", brl(destaque.capitalInicial)],
                    ["Período", `${data(destaque.inicio)} a ${data(destaque.fim)}`],
                    ["Participantes", String(destaque.totalParticipantes)],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <dt className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">{k}</dt>
                      <dd className="mt-1 text-sm text-ink">{v}</dd>
                    </div>
                  ))}
                </dl>

                {destaque.ranking.length > 0 && destaque.status === "aberta" && (
                  <ol className="mt-6 border-t border-[var(--rule)]">
                    {destaque.ranking.slice(0, 5).map((r) => (
                      <li
                        key={r.posicao}
                        className={`flex items-center justify-between border-b border-[var(--rule)] py-2 text-sm last:border-b-0 ${r.souEu ? "bg-gold/10" : ""}`}
                      >
                        <span className="text-ink">
                          <span className="mr-3 font-mono tabular text-ink-muted">{r.posicao}</span>
                          {r.apelido}
                        </span>
                        <span className={`font-mono tabular ${cor(r.retornoPct)}`}>{pct(r.retornoPct)}</span>
                      </li>
                    ))}
                  </ol>
                )}

                <Link
                  href={`/competicoes/${destaque.codigo}`}
                  className="mt-6 inline-flex items-center gap-2 bg-blue px-6 py-3 text-sm font-semibold text-onblue transition-colors hover:bg-blue-deep"
                >
                  {destaque.souParticipante ? "Abrir minha carteira" : "Participar"}
                  <ArrowRight size={15} />
                </Link>
              </div>
            </section>
          ) : (
            <section className="mt-10 border-l-[3px] border-gold bg-paper-alt px-5 py-5">
              <p className="font-display text-xl text-ink">A próxima edição será anunciada em breve</p>
              <p className="mt-2 leading-relaxed text-ink-muted">
                Enquanto isso, treine com a sua turma: crie uma competição com
                as mesmas regras e convide quem quiser.
              </p>
              <Link
                href="/competicoes"
                className="mt-4 inline-flex items-center gap-2 bg-blue px-6 py-3 text-sm font-semibold text-onblue transition-colors hover:bg-blue-deep"
              >
                Criar uma competição <ArrowRight size={15} />
              </Link>
            </section>
          )}

          <section className="mt-12">
            <h2 className="font-display text-2xl text-ink">Como funciona</h2>
            <ul className="mt-4 grid gap-px bg-[var(--rule)] sm:grid-cols-2">
              {COMO_FUNCIONA.map(([titulo, texto]) => (
                <li key={titulo} className="bg-paper p-5">
                  <p className="text-sm font-semibold text-ink">{titulo}</p>
                  <p className="mt-1 text-sm leading-relaxed text-ink-muted">{texto}</p>
                </li>
              ))}
            </ul>
          </section>

          {anteriores.length > 0 && (
            <section className="mt-12">
              <h2 className="font-display text-2xl text-ink">Edições anteriores</h2>
              <ul className="mt-4 border border-[var(--rule)]">
                {anteriores.map((e) => (
                  <li key={e.codigo} className="border-b border-[var(--rule)] px-5 py-4 last:border-b-0">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <Link href={`/competicoes/${e.codigo}`} className="text-ink hover:text-blue">
                        {e.nome}
                      </Link>
                      <span className="font-mono text-xs text-ink-muted">
                        {data(e.inicio)} a {data(e.fim)} · {e.totalParticipantes} participantes
                      </span>
                    </div>
                    {e.podio.length > 0 && (
                      <ol className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                        {e.podio.map((p) => (
                          <li key={p.posicao} className="flex items-center gap-1.5 text-ink-muted">
                            <Medal size={14} className={p.posicao === 1 ? "text-gold" : ""} aria-hidden />
                            {p.posicao}º {p.apelido}
                            <span className={`font-mono tabular ${cor(p.retornoPct)}`}>{pct(p.retornoPct)}</span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <Link
            href="/competicoes"
            className="group mt-12 flex items-center justify-between gap-4 border border-[var(--rule)] px-5 py-4 transition-colors hover:border-blue"
          >
            <span className="flex items-center gap-3">
              <Users size={18} className="shrink-0 text-ink-muted" aria-hidden />
              <span>
                <span className="block text-sm font-semibold text-ink">Organize a competição da sua turma</span>
                <span className="block text-sm text-ink-muted">Mesmas regras, seu grupo, seu prazo.</span>
              </span>
            </span>
            <ArrowRight size={16} className="shrink-0 text-ink-muted transition-transform group-hover:translate-x-1" />
          </Link>

          <AvisoSimulacaoLinha className="mt-12" />
        </div>
      </main>
      <Footer />
    </>
  );
}
