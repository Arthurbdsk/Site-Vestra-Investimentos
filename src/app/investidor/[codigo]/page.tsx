import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Sparkline } from "@/components/Sparkline";
import { ConquistasFaixa } from "@/components/ConquistasFaixa";
import { criarClienteServidor, usuarioAtual } from "@/lib/supabase/server";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { calcularConquistas } from "@/lib/conquistas";
import { calcularNivel } from "@/lib/nivelInvestidor";
import { brl } from "@/lib/formato";

type PerfilPublico = {
  ok: boolean;
  apelido?: string;
  membroDesde?: string;
  diasSeguidos?: number;
  patrimonio?: number;
  convitesBemSucedidos?: number;
  temCompra?: boolean;
  temVenda?: boolean;
  temDividendo?: boolean;
  tickersDistintos?: number;
  temRendaFixa?: boolean;
  historico?: { data: string; valor: number }[];
};

async function buscar(codigo: string): Promise<PerfilPublico | null> {
  if (!supabaseConfigurado()) return null;
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.rpc("ver_perfil_publico", { p_codigo: codigo });
  if (error) return null;
  return data as PerfilPublico;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ codigo: string }>;
}): Promise<Metadata> {
  const { codigo } = await params;
  const p = await buscar(codigo);

  if (!p?.ok) {
    return { title: "Perfil não encontrado", robots: { index: false } };
  }

  return {
    title: `${p.apelido} no Vestra`,
    description: `Patrimônio fictício, conquistas e evolução de ${p.apelido} no simulador de investimentos Vestra.`,
    robots: { index: false, follow: false },
  };
}

export default async function PerfilPublicoPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  const [user, p] = await Promise.all([usuarioAtual(), buscar(codigo)]);
  const logado = !!user;

  if (!p?.ok) {
    return (
      <>
        <Header logado={logado} />
        <main className="grain relative flex-1 bg-paper">
          <div className="relative z-[2] mx-auto max-w-2xl px-6 py-16">
            <h1 className="font-display text-3xl text-ink">Não achei esse perfil</h1>
            <p className="mt-4 leading-relaxed text-ink-muted">
              O código não existe ou essa pessoa desativou o perfil público.
            </p>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const conquistas = calcularConquistas({
    temCompra: !!p.temCompra,
    temVenda: !!p.temVenda,
    temDividendo: !!p.temDividendo,
    tickersDistintos: p.tickersDistintos ?? 0,
    temRendaFixa: !!p.temRendaFixa,
    diasSeguidos: p.diasSeguidos ?? 0,
    patrimonio: p.patrimonio ?? 0,
    convitesBemSucedidos: p.convitesBemSucedidos ?? 0,
  });
  const concluidas = conquistas.filter((c) => c.concluida).length;
  const nivel = calcularNivel(concluidas);
  const membroDesde = p.membroDesde
    ? new Date(p.membroDesde).toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    : null;
  const historico = p.historico ?? [];

  return (
    <>
      <Header logado={logado} />
      <main className="flex-1">
        <section className="bg-blue">
          <div className="mx-auto max-w-3xl px-6 py-14">
            <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-onblue-muted">
              Perfil no Vestra
            </p>
            <h1 className="mt-1 font-display text-4xl text-gold">{p.apelido}</h1>
            <p className="mt-2 flex items-center gap-2 font-mono text-xs text-onblue-muted">
              <span style={{ color: nivel.cor }}>{nivel.nome}</span>
              {membroDesde ? <span>· no Vestra desde {membroDesde}</span> : null}
            </p>

            <div className="mt-7 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="font-mono text-[11px] uppercase tracking-widest text-onblue-muted">
                  Patrimônio fictício
                </p>
                <p className="mt-1 font-mono text-3xl tabular text-onblue">
                  {brl(p.patrimonio ?? 0)}
                </p>
              </div>
              <div>
                <p className="font-mono text-[11px] uppercase tracking-widest text-onblue-muted">
                  Conquistas
                </p>
                <p className="mt-1 font-mono text-3xl tabular text-onblue">
                  {concluidas} de {conquistas.length}
                </p>
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto max-w-3xl space-y-10 px-6 py-12">
          {historico.length >= 2 && (
            <div>
              <h2 className="font-display text-xl text-ink">Evolução do patrimônio</h2>
              <div className="mt-4 border border-[var(--rule)] bg-paper-alt p-6">
                <Sparkline
                  points={historico.map((h) => h.valor)}
                  positive={historico[historico.length - 1].valor >= historico[0].valor}
                />
              </div>
            </div>
          )}

          <div>
            <h2 className="font-display text-xl text-ink">Conquistas</h2>
            <div className="mt-4">
              <ConquistasFaixa conquistas={conquistas} />
            </div>
          </div>

          <p className="border-l-[3px] border-gold pl-4 text-sm leading-relaxed text-ink-muted">
            Todo valor aqui é fictício: o Vestra é um simulador educacional
            de investimentos, ninguém aqui tem dinheiro real em jogo.
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
