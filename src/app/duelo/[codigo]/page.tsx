import type { Metadata } from "next";
import Link from "next/link";
import { Swords } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { criarClienteServidor, usuarioAtual } from "@/lib/supabase/server";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { AvisoSimulacaoLinha } from "@/components/AvisoSimulacao";
import { pct } from "@/lib/formato";

/**
 * Pagina de convite de duelo, aberta SEM login.
 *
 * O convidado precisava criar conta antes de ver do que se tratava, e e
 * exatamente ai que o convite morre. Aqui ele ve o placar primeiro; o
 * cadastro passa a ser o passo pra RESPONDER, nao pra entender.
 *
 * Dinamica de proposito: o placar muda com o preco do mercado, entao nao
 * pode ser congelado no build.
 */
export const dynamic = "force-dynamic";

type DueloPublico = {
  ok: boolean;
  motivo?: string;
  codigo?: string;
  dias?: number;
  status?: string;
  criadorApelido?: string;
  oponenteApelido?: string | null;
  criadorVariacaoPct?: number | null;
  oponenteVariacaoPct?: number | null;
};

async function buscar(codigo: string): Promise<DueloPublico | null> {
  if (!supabaseConfigurado()) return null;
  const supabase = await criarClienteServidor();
  const { data, error } = await supabase.rpc("ver_duelo_publico", { p_codigo: codigo });
  if (error) return null;
  return data as DueloPublico;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ codigo: string }>;
}): Promise<Metadata> {
  const { codigo } = await params;
  const d = await buscar(codigo);

  if (!d?.ok) {
    return { title: "Convite de duelo | Vestra", robots: { index: false } };
  }

  const titulo = d.oponenteApelido
    ? `${d.criadorApelido} x ${d.oponenteApelido} — duelo no Vestra`
    : `${d.criadorApelido} te desafiou para um duelo no Vestra`;

  return {
    title: titulo,
    description: `Duelo de ${d.dias} dias no simulador Vestra: quem faz a carteira fictícia render mais. Abra o placar e entre com o código ${d.codigo}.`,
    // Convite e efemero e pessoal: nao deve virar pagina de busca.
    robots: { index: false, follow: false },
    openGraph: { title: titulo, type: "website" },
  };
}

export default async function ConviteDueloPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  const [user, duelo] = await Promise.all([usuarioAtual(), buscar(codigo)]);
  const logado = !!user;

  return (
    <>
      <Header logado={logado} />
      <main className="grain relative flex-1 bg-paper">
        <div className="relative z-[2] mx-auto max-w-2xl px-6 py-16">
          {!duelo?.ok ? (
            <>
              <h1 className="font-display text-3xl text-ink">
                Não achei esse duelo
              </h1>
              <p className="mt-4 leading-relaxed text-ink-muted">
                O código <span className="font-mono">{codigo}</span> não existe
                ou o duelo já foi encerrado. Peça o link de novo a quem te
                convidou.
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
                <Swords size={13} aria-hidden />
                Convite de duelo · {duelo.dias} dias
              </p>
              <h1 className="mt-3 font-display text-3xl leading-tight text-ink sm:text-4xl">
                {duelo.oponenteApelido
                  ? `${duelo.criadorApelido} contra ${duelo.oponenteApelido}`
                  : `${duelo.criadorApelido} te desafiou`}
              </h1>
              <p className="mt-4 max-w-lg leading-relaxed text-ink-muted">
                Duelo é quem faz a carteira fictícia render mais no período.
                Dinheiro nenhum de verdade entra ou sai — o que está em jogo é
                só o placar.
              </p>

              <div className="mt-8 grid gap-px border border-[var(--rule)] bg-[var(--rule)] sm:grid-cols-2">
                <Lado
                  apelido={duelo.criadorApelido ?? "investidor"}
                  variacao={duelo.criadorVariacaoPct ?? null}
                />
                <Lado
                  apelido={duelo.oponenteApelido ?? "vaga aberta"}
                  variacao={duelo.oponenteVariacaoPct ?? null}
                  vago={!duelo.oponenteApelido}
                />
              </div>

              <div className="mt-8 border-l-[3px] border-gold bg-paper-alt px-5 py-5">
                <p className="font-display text-xl text-ink">
                  {logado ? "Entre no duelo" : "Aceite o desafio"}
                </p>
                <p className="mt-2 leading-relaxed text-ink-muted">
                  {logado
                    ? "Use o código abaixo na aba Duelo do simulador."
                    : "Crie sua conta, receba R$ 100.000 fictícios e use o código abaixo na aba Duelo."}
                </p>
                <p className="mt-3 font-mono text-2xl font-semibold tabular tracking-widest text-ink">
                  {duelo.codigo}
                </p>
                <Link
                  href={logado ? "/simulador" : "/cadastro"}
                  className="mt-4 inline-block bg-blue px-6 py-3 text-sm font-semibold text-onblue transition-colors hover:bg-blue-deep"
                >
                  {logado ? "Abrir o simulador" : "Criar conta e duelar"}
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

function Lado({
  apelido,
  variacao,
  vago = false,
}: {
  apelido: string;
  variacao: number | null;
  vago?: boolean;
}) {
  const cor =
    variacao == null
      ? "text-ink-muted"
      : variacao > 0
        ? "text-emerald-600 dark:text-emerald-400"
        : variacao < 0
          ? "text-rose-600 dark:text-rose-400"
          : "text-ink-muted";

  return (
    <div className="bg-paper px-5 py-5">
      <p className={`font-display text-lg ${vago ? "text-ink-muted" : "text-ink"}`}>
        {apelido}
      </p>
      <p className={`mt-1.5 font-mono text-3xl tabular ${cor}`}>
        {variacao == null ? "—" : pct(variacao)}
      </p>
      <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-ink-muted">
        {vago ? "ninguém entrou ainda" : "no período do duelo"}
      </p>
    </div>
  );
}
