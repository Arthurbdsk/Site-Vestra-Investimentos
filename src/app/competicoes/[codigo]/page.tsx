import type { Metadata } from "next";
import Link from "next/link";
import { Trophy } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AvisoSimulacaoLinha } from "@/components/AvisoSimulacao";
import {
  BotaoCopiarLink,
  BotaoEntrarCompeticao,
  FormOrdemCompeticao,
} from "@/components/challenge/AcoesCompeticao";
import { criarClienteServidor, usuarioAtual } from "@/lib/supabase/server";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { brl, dataHora, pct } from "@/lib/formato";
import { ROTULO_STATUS, descreverPrazo, type Competicao } from "@/lib/challenge";

async function buscar(codigo: string): Promise<Competicao | null> {
  if (!supabaseConfigurado() || !/^[A-Za-z0-9]{6}$/.test(codigo)) return null;
  try {
    const supabase = await criarClienteServidor();
    const { data, error } = await supabase.rpc("ver_competicao", { p_codigo: codigo });
    if (error || !data?.ok) return null;
    return data as Competicao;
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ codigo: string }>;
}): Promise<Metadata> {
  const { codigo } = await params;
  const c = await buscar(codigo);
  if (!c) return { title: "Competição | Vestra", robots: { index: false } };
  return {
    title: `${c.nome} | ${c.oficial ? "Vestra Challenge" : "Competição no Vestra"}`,
    description: `Competição de investimento no Vestra com ${brl(c.capitalInicial)} fictícios para cada participante.`,
    robots: { index: false, follow: false },
  };
}

const cor = (v: number) => (v >= 0 ? "text-emerald-600" : "text-rose-600");
const titulo = "font-mono text-[11px] uppercase tracking-widest text-ink-muted";

export default async function CompeticaoPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  const [user, c] = await Promise.all([usuarioAtual(), buscar(codigo)]);
  const logado = !!user;
  const agora = new Date().getTime();

  return (
    <>
      <Header logado={logado} />
      <main className="grain relative flex-1 bg-paper">
        <div className="relative z-[2] mx-auto max-w-5xl px-6 py-16">
          {!c ? (
            <>
              <h1 className="font-display text-3xl text-ink">Não achei essa competição</h1>
              <p className="mt-4 leading-relaxed text-ink-muted">
                O código <span className="font-mono">{codigo.toUpperCase()}</span> não existe.
              </p>
              <Link
                href="/competicoes"
                className="mt-8 inline-block bg-blue px-6 py-3 text-sm font-semibold text-onblue transition-colors hover:bg-blue-deep"
              >
                Ver competições
              </Link>
            </>
          ) : (
            <>
              <p className="flex flex-wrap items-center gap-2 font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">
                <Trophy size={13} aria-hidden />
                {c.oficial ? (
                  <Link href="/challenge" className="text-gold hover:text-blue">Vestra Challenge · edição oficial</Link>
                ) : (
                  <Link href="/competicoes" className="hover:text-blue">Competição da comunidade</Link>
                )}
                <span>· {ROTULO_STATUS[c.status]}</span>
                <span>· {descreverPrazo(c.inicio, c.fim, agora)}</span>
              </p>
              <h1 className="mt-3 font-display text-3xl leading-tight text-ink sm:text-4xl">{c.nome}</h1>

              <dl className="mt-6 grid gap-px bg-[var(--rule)] sm:grid-cols-4">
                {[
                  ["Capital inicial", brl(c.capitalInicial)],
                  ["Início", dataHora(c.inicio)],
                  ["Fim", dataHora(c.fim)],
                  ["Participantes", String(c.totalParticipantes)],
                ].map(([k, v]) => (
                  <div key={k} className="bg-paper p-4">
                    <dt className={titulo}>{k}</dt>
                    <dd className="mt-1 font-mono text-sm tabular text-ink">{v}</dd>
                  </div>
                ))}
              </dl>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-ink-muted">
                <span>
                  Código <span className="font-mono font-semibold tracking-widest text-ink">{c.codigo}</span>
                </span>
                {c.dominioEmail && <span>· só e-mails @{c.dominioEmail}</span>}
                {c.teseObrigatoria && <span>· tese obrigatória em cada ordem</span>}
                {(c.souOrganizador || c.souParticipante) && c.status !== "encerrada" && (
                  <BotaoCopiarLink codigo={c.codigo} />
                )}
              </div>

              {!c.souParticipante && c.status !== "encerrada" && (
                <div className="mt-8 border-l-[3px] border-gold bg-paper-alt px-5 py-5">
                  <p className="font-display text-xl text-ink">Participe</p>
                  <p className="mt-2 leading-relaxed text-ink-muted">
                    Você recebe {brl(c.capitalInicial)} fictícios numa carteira
                    só desta competição. Sua carteira pessoal do Vestra não é afetada.
                  </p>
                  <div className="mt-4">
                    {logado ? (
                      <BotaoEntrarCompeticao codigo={c.codigo} />
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        <Link href="/cadastro" className="bg-blue px-6 py-3 text-sm font-semibold text-onblue transition-colors hover:bg-blue-deep">
                          Criar conta
                        </Link>
                        <Link href="/login" className="border border-[var(--rule)] px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-blue">
                          Já tenho conta
                        </Link>
                        <p className="w-full text-xs text-ink-muted">
                          Depois de entrar, volte a este link para se inscrever.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {c.carteira && (
                <section className="mt-10 grid gap-px bg-[var(--rule)] lg:grid-cols-[1fr_22rem]">
                  <div className="bg-paper p-5">
                    <p className={titulo}>Sua carteira na competição</p>
                    <div className="mt-3 flex flex-wrap items-baseline gap-x-6 gap-y-1">
                      <span className="font-display text-3xl tabular text-ink">{brl(c.carteira.patrimonio)}</span>
                      <span className={`font-mono text-sm tabular ${cor(c.carteira.retornoPct)}`}>
                        {pct(c.carteira.retornoPct)}
                      </span>
                      <span className="text-sm text-ink-muted">Caixa {brl(c.carteira.caixa)}</span>
                    </div>
                    {c.carteira.posicoes.length === 0 ? (
                      <p className="mt-6 text-sm text-ink-muted">Nenhuma posição ainda.</p>
                    ) : (
                      <div className="mt-6 overflow-x-auto">
                        <table className="w-full min-w-[28rem] text-sm">
                          <thead>
                            <tr className="border-b border-[var(--rule)] text-left text-ink-muted">
                              <th className="py-2 font-normal">Ativo</th>
                              <th className="py-2 text-right font-normal">Cotas</th>
                              <th className="py-2 text-right font-normal">Preço médio</th>
                              <th className="py-2 text-right font-normal">Atual</th>
                              <th className="py-2 text-right font-normal">Valor</th>
                            </tr>
                          </thead>
                          <tbody className="font-mono tabular">
                            {c.carteira.posicoes.map((p) => (
                              <tr key={p.ticker} className="border-b border-[var(--rule)] last:border-b-0">
                                <td className="py-2 text-ink">{p.ticker}</td>
                                <td className="py-2 text-right">{p.quantidade}</td>
                                <td className="py-2 text-right">{brl(p.precoMedio)}</td>
                                <td className={`py-2 text-right ${cor(p.precoAtual - p.precoMedio)}`}>{brl(p.precoAtual)}</td>
                                <td className="py-2 text-right text-ink">{brl(p.valor)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                  <div className="bg-paper p-5">
                    <p className={titulo}>Nova ordem</p>
                    <div className="mt-3">
                      {c.status === "aberta" ? (
                        <FormOrdemCompeticao
                          codigo={c.codigo}
                          teseObrigatoria={c.teseObrigatoria}
                          tickersEmCarteira={c.carteira.posicoes.map((p) => p.ticker)}
                        />
                      ) : (
                        <p className="text-sm text-ink-muted">
                          {c.status === "agendada"
                            ? `As ordens abrem em ${dataHora(c.inicio)}.`
                            : "A competição encerrou. O resultado está congelado."}
                        </p>
                      )}
                    </div>
                  </div>
                </section>
              )}

              <section className="mt-10">
                <h2 className="font-display text-2xl text-ink">
                  {c.status === "encerrada" ? "Resultado final" : "Ranking"}
                </h2>
                <p className="mt-1 text-sm text-ink-muted">
                  {c.finalizada
                    ? "Patrimônio congelado no encerramento."
                    : "Ao vivo, com a última cotação conhecida de cada ativo. As carteiras dos outros participantes ficam ocultas."}
                </p>
                {c.ranking.length === 0 ? (
                  <p className="mt-4 text-sm text-ink-muted">Ninguém se inscreveu ainda.</p>
                ) : (
                  <div className="mt-4 overflow-x-auto border border-[var(--rule)]">
                    <table className="w-full min-w-[30rem] text-sm">
                      <thead>
                        <tr className="border-b border-[var(--rule)] bg-paper-alt text-left text-ink-muted">
                          <th className="px-4 py-2 font-normal">#</th>
                          <th className="px-4 py-2 font-normal">Participante</th>
                          <th className="px-4 py-2 text-right font-normal">Patrimônio</th>
                          <th className="px-4 py-2 text-right font-normal">Retorno</th>
                          <th className="px-4 py-2 text-right font-normal">Ordens</th>
                        </tr>
                      </thead>
                      <tbody>
                        {c.ranking.map((r) => (
                          <tr
                            key={r.posicao}
                            className={`border-b border-[var(--rule)] last:border-b-0 ${r.souEu ? "bg-gold/10" : ""}`}
                          >
                            <td className="px-4 py-2 font-mono tabular text-ink-muted">{r.posicao}</td>
                            <td className="px-4 py-2 text-ink">
                              {r.apelido}
                              {r.souEu && <span className="ml-2 text-xs text-ink-muted">(você)</span>}
                            </td>
                            <td className="px-4 py-2 text-right font-mono tabular text-ink">{brl(r.patrimonio)}</td>
                            <td className={`px-4 py-2 text-right font-mono tabular ${cor(r.retornoPct)}`}>{pct(r.retornoPct)}</td>
                            <td className="px-4 py-2 text-right font-mono tabular text-ink-muted">{r.ordens}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {c.ordens && (
                <section className="mt-10">
                  <h2 className="font-display text-2xl text-ink">
                    {c.souOrganizador ? "Registro de ordens" : "Suas ordens"}
                  </h2>
                  <p className="mt-1 text-sm text-ink-muted">
                    {c.souOrganizador
                      ? "Todas as ordens de todos os participantes, com preço de execução e tese. Este registro não pode ser editado."
                      : "Histórico das suas operações nesta competição."}
                  </p>
                  {c.ordens.length === 0 ? (
                    <p className="mt-4 text-sm text-ink-muted">Nenhuma ordem ainda.</p>
                  ) : (
                    <ul className="mt-4 border border-[var(--rule)]">
                      {c.ordens.map((o) => (
                        <li key={o.id} className="border-b border-[var(--rule)] px-4 py-3 last:border-b-0">
                          <div className="flex flex-wrap items-baseline justify-between gap-2 text-sm">
                            <span className="text-ink">
                              <span className={o.tipo === "compra" ? "text-emerald-600" : "text-rose-600"}>
                                {o.tipo === "compra" ? "Compra" : "Venda"}
                              </span>{" "}
                              <span className="font-mono">{o.quantidade} {o.ticker}</span> a{" "}
                              <span className="font-mono tabular">{brl(o.preco)}</span>
                              {c.souOrganizador && <span className="text-ink-muted"> · {o.apelido}</span>}
                            </span>
                            <span className="font-mono text-xs tabular text-ink-muted">
                              {dataHora(o.executadaEm)} · {brl(o.total)}
                            </span>
                          </div>
                          {o.tese && <p className="mt-1 text-sm leading-relaxed text-ink-muted">{o.tese}</p>}
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              )}

              <AvisoSimulacaoLinha className="mt-12" />
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
