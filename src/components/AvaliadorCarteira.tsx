"use client";

import { useRef, useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  HelpCircle,
  Lightbulb,
  RotateCcw,
  Wand2,
} from "lucide-react";
import {
  CLASSES,
  CLASSE_POR_ID,
  PRAZOS,
  alocacaoVazia,
  avaliarCarteira,
  type Alocacao,
  type ClasseId,
  type Prazo,
  type ResultadoAvaliacao,
  type Severidade,
  type Veredito,
} from "@/lib/avaliarCarteira";
import { PERFIS, type PerfilId } from "@/lib/perfilInvestidor";
import { brl } from "@/lib/formato";
import { QuizPerfil } from "./QuizPerfil";

/** Cor de cada classe nas barras. Mesma cor em todo lugar da pagina. */
export const COR_CLASSE: Record<ClasseId, string> = {
  posFixado: "var(--color-sky)",
  poupanca: "var(--color-ink-muted)",
  bancarios: "var(--color-teal)",
  tesouroLongo: "var(--color-violet)",
  creditoPrivado: "var(--color-gold-soft)",
  fiis: "var(--color-gold)",
  acoes: "var(--color-azul-texto)",
  exterior: "var(--color-coral)",
  cripto: "var(--color-baixa)",
};

const VEREDITO: Record<Veredito, { titulo: string; texto: string; cor: string }> = {
  compativel: {
    titulo: "Compatível com o seu perfil",
    texto: "A carteira respeita os limites do seu perfil e do seu prazo. Veja abaixo os detalhes e os ajustes opcionais.",
    cor: "var(--color-teal-texto)",
  },
  ajustes: {
    titulo: "Quase lá: alguns ajustes",
    texto: "Nada grave, mas há pontos que deixariam a carteira mais alinhada ao seu perfil.",
    cor: "var(--color-gold-texto)",
  },
  incompativel: {
    titulo: "Não está compatível com o seu perfil",
    texto: "Há pelo menos um problema importante. Comece pelas correções marcadas como prioridade.",
    cor: "var(--color-coral-texto)",
  },
};

const SEVERIDADE: Record<Severidade, { rotulo: string; cor: string }> = {
  alta: { rotulo: "Prioridade", cor: "var(--color-coral-texto)" },
  media: { rotulo: "Importante", cor: "var(--color-gold-texto)" },
  baixa: { rotulo: "Sugestão", cor: "var(--color-sky-texto)" },
};

/** Aceita "10.000", "10000", "10000,50". Ponto e separador de milhar. */
function lerNumero(texto: string): number {
  const limpo = texto.replace(/[^\d,]/g, "").replace(",", ".");
  const n = Number(limpo);
  return Number.isFinite(n) ? n : 0;
}

export function BarraAlocacao({ valores, altura = 14 }: { valores: Alocacao; altura?: number }) {
  const total = CLASSES.reduce((s, c) => s + valores[c.id], 0);
  if (total <= 0) {
    return <div className="w-full bg-[var(--rule)]" style={{ height: altura }} />;
  }
  return (
    <div className="flex w-full overflow-hidden" style={{ height: altura }}>
      {CLASSES.map((c) =>
        valores[c.id] > 0 ? (
          <div
            key={c.id}
            title={`${c.nome}: ${Math.round((valores[c.id] / total) * 100)}%`}
            style={{ width: `${(valores[c.id] / total) * 100}%`, background: COR_CLASSE[c.id] }}
          />
        ) : null,
      )}
    </div>
  );
}

export function AvaliadorCarteira({ perfilInicial = null }: { perfilInicial?: PerfilId | null }) {
  const [perfil, setPerfil] = useState<PerfilId | null>(perfilInicial);
  const [fazendoQuiz, setFazendoQuiz] = useState(false);
  const [valores, setValores] = useState<Alocacao>(alocacaoVazia());
  const [textos, setTextos] = useState<Record<ClasseId, string>>(
    () => Object.fromEntries(CLASSES.map((c) => [c.id, ""])) as Record<ClasseId, string>,
  );
  const [prazo, setPrazo] = useState<Prazo | null>(null);
  const [temReserva, setTemReserva] = useState<boolean | null>(null);
  const [gastoTexto, setGastoTexto] = useState("");
  const [resultado, setResultado] = useState<ResultadoAvaliacao | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const resultadoRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLElement>(null);

  const total = CLASSES.reduce((s, c) => s + valores[c.id], 0);

  function mudarValor(id: ClasseId, texto: string) {
    setTextos((t) => ({ ...t, [id]: texto }));
    setValores((v) => ({ ...v, [id]: lerNumero(texto) }));
    setResultado(null);
  }

  function preencher(nova: Alocacao) {
    setValores(nova);
    setTextos(
      Object.fromEntries(CLASSES.map((c) => [c.id, nova[c.id] ? String(nova[c.id]) : ""])) as Record<
        ClasseId,
        string
      >,
    );
  }

  function rodar(v: Alocacao) {
    if (!perfil) return setErro("Escolha seu perfil de investidor (ou faça o quiz).");
    if (CLASSES.every((c) => v[c.id] <= 0)) return setErro("Coloque algum valor em pelo menos uma classe.");
    if (!prazo) return setErro("Diga em quanto tempo você vai precisar desse dinheiro.");
    if (temReserva === null) return setErro("Responda se você já tem uma reserva de emergência.");
    setErro(null);
    setResultado(
      avaliarCarteira({
        perfil,
        valores: v,
        prazo,
        temReserva,
        gastoMensal: gastoTexto ? lerNumero(gastoTexto) : null,
      }),
    );
    requestAnimationFrame(() =>
      resultadoRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  }

  function usarSugerida() {
    if (!resultado) return;
    const sugerida = resultado.sugerida;
    preencher(sugerida);
    rodar(sugerida);
  }

  function escolha(ativo: boolean) {
    return ativo ? "border-blue bg-blue text-onblue" : "border-[var(--rule)] text-ink hover:border-blue";
  }

  return (
    <div>
      <h2 className="font-display text-2xl text-ink">Monte sua carteira e peça uma avaliação</h2>
      <p className="mt-2 max-w-xl leading-relaxed text-ink-muted">
        Diga quanto você colocaria em cada tipo de investimento. O Vestra compara com o seu perfil,
        aponta o que não combina e explica o porquê de cada correção.
      </p>

      {/* 1. Perfil */}
      <section className="mt-10">
        <Rotulo numero={1}>Seu perfil de investidor</Rotulo>
        {fazendoQuiz ? (
          <div className="mt-4 border border-[var(--rule)] p-6">
            <QuizPerfil
              aoConcluir={(p) => {
                setPerfil(p.id);
                setFazendoQuiz(false);
                setResultado(null);
              }}
            />
          </div>
        ) : (
          <>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {(Object.keys(PERFIS) as PerfilId[]).map((id) => (
                <button
                  key={id}
                  onClick={() => {
                    setPerfil(id);
                    setResultado(null);
                  }}
                  aria-pressed={perfil === id}
                  className={`border px-4 py-3 text-left text-sm font-semibold transition-colors ${escolha(perfil === id)}`}
                >
                  {PERFIS[id].nome}
                </button>
              ))}
            </div>
            <button
              onClick={() => setFazendoQuiz(true)}
              className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[var(--color-azul-texto)] underline-offset-4 hover:underline"
            >
              <HelpCircle size={15} />
              {perfil ? "Refazer o quiz de perfil" : "Não sei meu perfil: fazer o quiz de 5 perguntas"}
            </button>
            {perfil && (
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-ink-muted">
                {PERFIS[perfil].descricao}
              </p>
            )}
          </>
        )}
      </section>

      {/* 2. Valores */}
      <section ref={formRef} className="mt-10 scroll-mt-32">
        <Rotulo numero={2}>Quanto você colocaria em cada classe</Rotulo>
        <p className="mt-2 text-sm text-ink-muted">
          Pode ser uma carteira que você já tem ou uma que está planejando. Deixe em branco o que não usar.
        </p>
        <ul className="mt-4 grid gap-px bg-[var(--rule)] sm:grid-cols-2">
          {CLASSES.map((c) => {
            const p = total > 0 ? (valores[c.id] / total) * 100 : 0;
            return (
              <li key={c.id} className="bg-paper p-4">
                <label className="block">
                  <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <span className="inline-block h-2.5 w-2.5 shrink-0" style={{ background: COR_CLASSE[c.id] }} />
                    {c.nome}
                  </span>
                  <span className="mt-0.5 block text-xs text-ink-muted">{c.exemplos}</span>
                  <span className="mt-2 flex items-center gap-2">
                    <span className="font-mono text-sm text-ink-muted">R$</span>
                    <input
                      inputMode="decimal"
                      value={textos[c.id]}
                      onChange={(e) => mudarValor(c.id, e.target.value)}
                      placeholder="0"
                      className="w-full min-w-0 border border-[var(--rule)] bg-paper px-3 py-2 font-mono text-ink outline-none focus:border-blue"
                    />
                    <span className="w-10 shrink-0 text-right font-mono text-xs text-ink-muted">
                      {total > 0 ? `${Math.round(p)}%` : ""}
                    </span>
                  </span>
                </label>
              </li>
            );
          })}
        </ul>
        <div className="mt-4">
          <BarraAlocacao valores={valores} />
          <p className="mt-2 font-mono text-xs text-ink-muted">Total: {brl(total)}</p>
        </div>
      </section>

      {/* 3. Prazo */}
      <section className="mt-10">
        <Rotulo numero={3}>Quando você vai precisar desse dinheiro?</Rotulo>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {PRAZOS.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setPrazo(p.id);
                setResultado(null);
              }}
              aria-pressed={prazo === p.id}
              className={`border px-4 py-3 text-left transition-colors ${escolha(prazo === p.id)}`}
            >
              <span className="block text-sm font-semibold">{p.nome}</span>
              <span className={`mt-1 block text-xs ${prazo === p.id ? "text-onblue-muted" : "text-ink-muted"}`}>
                {p.detalhe}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* 4. Reserva */}
      <section className="mt-10">
        <Rotulo numero={4}>Você já tem reserva de emergência fora dessa carteira?</Rotulo>
        <div className="mt-4 flex flex-wrap gap-3">
          {[
            { v: true, t: "Sim, já tenho" },
            { v: false, t: "Ainda não" },
          ].map((o) => (
            <button
              key={o.t}
              onClick={() => {
                setTemReserva(o.v);
                setResultado(null);
              }}
              aria-pressed={temReserva === o.v}
              className={`border px-5 py-3 text-sm font-semibold transition-colors ${escolha(temReserva === o.v)}`}
            >
              {o.t}
            </button>
          ))}
        </div>
        {temReserva === false && (
          <label className="mt-4 block max-w-sm">
            <span className="text-sm text-ink">Quanto você gasta por mês, mais ou menos? (opcional)</span>
            <span className="mt-2 flex items-center gap-2">
              <span className="font-mono text-sm text-ink-muted">R$</span>
              <input
                inputMode="decimal"
                value={gastoTexto}
                onChange={(e) => {
                  setGastoTexto(e.target.value);
                  setResultado(null);
                }}
                placeholder="3000"
                className="w-full border border-[var(--rule)] bg-paper px-3 py-2 font-mono text-ink outline-none focus:border-blue"
              />
            </span>
            <span className="mt-1 block text-xs text-ink-muted">
              Com isso dá pra calcular o tamanho certo da sua reserva.
            </span>
          </label>
        )}
      </section>

      <div className="mt-10 flex flex-wrap items-center gap-4">
        <button
          onClick={() => rodar(valores)}
          className="inline-flex items-center gap-2 bg-blue px-7 py-4 text-sm font-semibold text-onblue transition-colors hover:bg-blue-deep"
        >
          <ClipboardCheck size={17} />
          Avaliar minha carteira
        </button>
        {erro && (
          <p role="alert" className="text-sm font-medium text-[var(--color-coral-texto)]">
            {erro}
          </p>
        )}
      </div>

      <div ref={resultadoRef} className="scroll-mt-32">
        <AnimatePresence>
          {resultado && perfil && (
            <motion.div
              key={`${resultado.nota}-${resultado.total}-${resultado.correcoes.length}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.35 }}
            >
              <Resultado
                r={resultado}
                perfil={perfil}
                valores={valores}
                aoUsarSugerida={usarSugerida}
                aoAjustar={() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Rotulo({ numero, children }: { numero: number; children: ReactNode }) {
  return (
    <h3 className="flex items-center gap-3 font-display text-lg text-ink">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center bg-gold font-mono text-xs font-bold text-blue">
        {numero}
      </span>
      {children}
    </h3>
  );
}

function Resultado({
  r,
  perfil,
  valores,
  aoUsarSugerida,
  aoAjustar,
}: {
  r: ResultadoAvaliacao;
  perfil: PerfilId;
  valores: Alocacao;
  aoUsarSugerida: () => void;
  aoAjustar: () => void;
}) {
  const v = VEREDITO[r.veredito];
  const posRisco = ((r.risco - 1) / 4) * 100;
  const faixaIni = ((r.faixaRisco[0] - 1) / 4) * 100;
  const faixaFim = ((r.faixaRisco[1] - 1) / 4) * 100;

  return (
    <div className="mt-14 border-t-[3px] border-gold pt-10">
      <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-ink-muted">
        Avaliação da sua carteira
      </p>

      <div className="mt-4 flex flex-wrap items-start gap-8">
        <div
          className="flex h-28 w-28 shrink-0 flex-col items-center justify-center border-[3px]"
          style={{ borderColor: v.cor }}
        >
          <span className="font-display text-4xl font-bold" style={{ color: v.cor }}>
            {r.nota}
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-ink-muted">de 100</span>
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-2xl font-bold" style={{ color: v.cor }}>
            {v.titulo}
          </h3>
          <p className="mt-2 max-w-xl leading-relaxed text-ink-muted">{v.texto}</p>
          <p className="mt-2 text-sm text-ink">
            Perfil avaliado: <strong>{PERFIS[perfil].nome}</strong>. Renda variável:{" "}
            <strong>{Math.round(r.rendaVariavel)}%</strong>.
          </p>
        </div>
      </div>

      {/* Termometro de risco */}
      <div className="mt-10">
        <p className="text-sm font-semibold text-ink">Termômetro de risco</p>
        <div className="relative mt-3 h-3 w-full bg-[var(--rule)]">
          <div
            className="absolute inset-y-0 bg-[var(--color-teal)] opacity-40"
            style={{ left: `${faixaIni}%`, width: `${faixaFim - faixaIni}%` }}
          />
          <div
            className="absolute -top-1.5 h-6 w-1.5 -translate-x-1/2 bg-ink"
            style={{ left: `${Math.min(100, Math.max(0, posRisco))}%` }}
            role="img"
            aria-label={`Risco da carteira: ${r.risco.toLocaleString("pt-BR")} de 5`}
          />
        </div>
        <div className="mt-2 flex justify-between gap-3 font-mono text-[11px] text-ink-muted">
          <span>Muito seguro</span>
          <span className="text-center">Faixa verde: combina com o perfil {PERFIS[perfil].nome.toLowerCase()}</span>
          <span className="text-right">Muito arriscado</span>
        </div>
      </div>

      {/* Correcoes */}
      {r.correcoes.length > 0 && (
        <div className="mt-12">
          <h3 className="font-display text-xl text-ink">
            {r.correcoes.length === 1 ? "1 correção sugerida" : `${r.correcoes.length} correções sugeridas`}
          </h3>
          <ol className="mt-5 space-y-4">
            {r.correcoes.map((c, i) => {
              const s = SEVERIDADE[c.severidade];
              return (
                <motion.li
                  key={c.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i }}
                  className="border border-l-[4px] border-[var(--rule)] bg-paper p-5"
                  style={{ borderLeftColor: s.cor }}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className="inline-flex items-center gap-1 font-mono text-[10px] font-bold uppercase tracking-widest"
                      style={{ color: s.cor }}
                    >
                      <AlertTriangle size={12} />
                      {s.rotulo}
                    </span>
                    {c.classe && (
                      <span className="inline-flex items-center gap-1.5 text-xs text-ink-muted">
                        <span className="inline-block h-2 w-2" style={{ background: COR_CLASSE[c.classe] }} />
                        {CLASSE_POR_ID[c.classe].nome}
                      </span>
                    )}
                  </div>
                  <p className="mt-2 font-semibold text-ink">{c.titulo}</p>
                  <p className="mt-3 text-sm leading-relaxed text-ink">
                    <strong>O que fazer: </strong>
                    {c.acao}
                  </p>
                  <p className="mt-2 flex gap-2 text-sm leading-relaxed text-ink-muted">
                    <Lightbulb size={16} className="mt-0.5 shrink-0 text-[var(--color-gold-texto)]" />
                    <span>
                      <strong className="text-ink">Por quê: </strong>
                      {c.porque}
                    </span>
                  </p>
                </motion.li>
              );
            })}
          </ol>
        </div>
      )}

      {r.pontosFortes.length > 0 && (
        <div className="mt-10">
          <h3 className="font-display text-xl text-ink">O que já está bom</h3>
          <ul className="mt-4 space-y-2">
            {r.pontosFortes.map((f) => (
              <li key={f} className="flex gap-2 text-sm leading-relaxed text-ink">
                <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[var(--color-teal-texto)]" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Comparacao */}
      <div className="mt-12">
        <h3 className="font-display text-xl text-ink">Sua carteira e a carteira modelo do perfil</h3>
        <div className="mt-4 space-y-3">
          <div>
            <p className="mb-1 font-mono text-[11px] uppercase tracking-widest text-ink-muted">Sua carteira</p>
            <BarraAlocacao valores={valores} altura={18} />
          </div>
          <div>
            <p className="mb-1 font-mono text-[11px] uppercase tracking-widest text-ink-muted">
              Modelo {PERFIS[perfil].nome.toLowerCase()}
            </p>
            <BarraAlocacao valores={r.sugerida} altura={18} />
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[440px] text-sm">
            <thead>
              <tr className="border-b border-[var(--rule)] text-left font-mono text-[11px] uppercase tracking-widest text-ink-muted">
                <th className="py-2 pr-3 font-normal">Classe</th>
                <th className="py-2 pr-3 text-right font-normal">Sua</th>
                <th className="py-2 pr-3 text-right font-normal">Modelo</th>
                <th className="py-2 text-right font-normal">Ajuste</th>
              </tr>
            </thead>
            <tbody>
              {CLASSES.map((c) => {
                const sua = valores[c.id];
                const mod = r.sugerida[c.id];
                if (sua === 0 && mod === 0) return null;
                const dif = mod - sua;
                const pequeno = Math.abs(dif) < r.total * 0.01;
                return (
                  <tr key={c.id} className="border-b border-[var(--rule)]">
                    <td className="py-2 pr-3 text-ink">
                      <span className="mr-2 inline-block h-2 w-2" style={{ background: COR_CLASSE[c.id] }} />
                      {c.nome}
                    </td>
                    <td className="py-2 pr-3 text-right font-mono text-ink">{Math.round(r.percentuais[c.id])}%</td>
                    <td className="py-2 pr-3 text-right font-mono text-ink-muted">
                      {Math.round((mod / r.total) * 100)}%
                    </td>
                    <td
                      className="py-2 text-right font-mono"
                      style={{
                        color: pequeno
                          ? "var(--color-ink-muted)"
                          : dif > 0
                            ? "var(--color-teal-texto)"
                            : "var(--color-coral-texto)",
                      }}
                    >
                      {pequeno ? "ok" : `${dif > 0 ? "+" : "-"}${brl(Math.abs(dif))}`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-ink-muted">
          A carteira modelo é um ponto de partida didático, não a única resposta certa. Pequenas diferenças
          em relação a ela são normais.
        </p>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          onClick={aoUsarSugerida}
          className="inline-flex items-center gap-2 bg-blue px-6 py-3 text-sm font-semibold text-onblue transition-colors hover:bg-blue-deep"
        >
          <Wand2 size={16} />
          Usar a carteira modelo e reavaliar
        </button>
        <button
          onClick={aoAjustar}
          className="inline-flex items-center gap-2 border border-[var(--rule)] px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-blue hover:text-blue"
        >
          <RotateCcw size={15} />
          Ajustar e avaliar de novo
        </button>
      </div>

      <p className="mt-8 font-mono text-[11px] leading-relaxed text-ink-muted">
        Avaliação educativa, não é recomendação de investimento. Antes de investir dinheiro de verdade,
        confira as condições de cada produto na sua corretora.
      </p>
    </div>
  );
}
