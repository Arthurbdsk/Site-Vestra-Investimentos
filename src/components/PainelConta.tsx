"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, Pencil, AlertCircle, ArrowRight, Copy, Globe, Lock } from "lucide-react";
import { salvarApelido, alternarPerfilPublico } from "@/app/simulador/operacoesPerfil";
import { PERFIS, type PerfilId } from "@/lib/perfilInvestidor";
import type { Conquista } from "@/lib/conquistas";
import { QuizPerfil } from "./QuizPerfil";
import { ConquistasFaixa } from "./ConquistasFaixa";
import { brl } from "@/lib/formato";

export function PainelConta({
  apelido,
  email,
  visitante,
  perfilId,
  conquistas,
  patrimonio,
  diasSeguidos,
  membroDesde,
  codigoPublico,
  perfilPublico,
}: {
  apelido: string;
  email: string | null;
  visitante: boolean;
  perfilId: PerfilId | null;
  conquistas: Conquista[];
  patrimonio: number;
  diasSeguidos: number;
  membroDesde: string | null;
  codigoPublico: string | null;
  perfilPublico: boolean;
}) {
  const perfil = perfilId ? PERFIS[perfilId] : null;
  const feitas = conquistas.filter((c) => c.concluida).length;

  return (
    <main className="grain relative min-h-[60vh] flex-1 bg-paper">
      {/* Cabecalho azul, no mesmo tom do resto do simulador */}
      <section className="bg-blue">
        <div className="mx-auto max-w-5xl px-6 py-10">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-onblue-muted">
            Sua conta
          </p>
          <h1 className="mt-1 font-display text-4xl text-gold">{apelido}</h1>
          <p className="mt-2 font-mono text-xs text-onblue-muted">
            {visitante
              ? "Conta de visitante, salva só neste navegador"
              : (email ?? "")}
            {membroDesde ? ` • no Vestra desde ${membroDesde}` : ""}
          </p>

          <div className="mt-7 grid gap-6 sm:grid-cols-3">
            <Numero rotulo="Patrimônio" valor={brl(patrimonio)} />
            <Numero
              rotulo="Dias seguidos"
              valor={String(diasSeguidos)}
              nota={diasSeguidos === 1 ? "dia" : "dias"}
            />
            <Numero
              rotulo="Conquistas"
              valor={`${feitas} de ${conquistas.length}`}
            />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-5xl space-y-12 px-6 py-12">
        {visitante && (
          <div className="border-l-[3px] border-gold bg-gold/10 px-5 py-4">
            <p className="text-sm text-ink">
              Você está como visitante. Se limpar os dados deste navegador,
              perde a carteira e as conquistas.
            </p>
            <Link
              href="/cadastro"
              className="mt-2 inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.18em] text-blue underline underline-offset-4"
            >
              Criar uma conta de verdade
              <ArrowRight size={13} />
            </Link>
          </div>
        )}

        <NomeDeExibicao inicial={apelido} bloqueado={visitante} />
        <SeuPerfil perfil={perfil} />

        <section>
          <h2 className="font-display text-2xl text-ink">Suas conquistas</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Vão sendo liberadas conforme você usa o simulador.
          </p>
          <div className="mt-5">
            <ConquistasFaixa conquistas={conquistas} />
          </div>
        </section>

        {!visitante && (
          <PerfilPublicoControle codigoPublico={codigoPublico} perfilPublicoInicial={perfilPublico} />
        )}
      </div>
    </main>
  );
}

function PerfilPublicoControle({
  codigoPublico,
  perfilPublicoInicial,
}: {
  codigoPublico: string | null;
  perfilPublicoInicial: boolean;
}) {
  const [publico, setPublico] = useState(perfilPublicoInicial);
  const [copiado, setCopiado] = useState(false);
  const [, iniciar] = useTransition();

  const link =
    typeof window === "undefined" || !codigoPublico
      ? ""
      : `${window.location.origin}/investidor/${codigoPublico}`;

  function alternar() {
    const novo = !publico;
    setPublico(novo);
    iniciar(() => {
      void alternarPerfilPublico(novo);
    });
  }

  function copiar() {
    if (!link) return;
    navigator.clipboard.writeText(link).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  }

  return (
    <section>
      <h2 className="font-display text-2xl text-ink">Perfil público</h2>
      <p className="mt-1 text-sm text-ink-muted">
        Uma página compartilhável com seu patrimônio fictício e suas
        conquistas, sem precisar de login pra ver.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-3 border border-[var(--rule)] bg-paper-alt px-4 py-3">
        {publico && codigoPublico ? (
          <>
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-ink-muted">
              {link || "gerando link..."}
            </span>
            <button
              onClick={copiar}
              disabled={!link}
              className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-blue transition-colors hover:text-blue-deep disabled:opacity-50"
            >
              {copiado ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
              {copiado ? "Copiado" : "Copiar"}
            </button>
          </>
        ) : (
          <span className="flex-1 text-xs text-ink-muted">Seu perfil está privado agora.</span>
        )}

        <button
          onClick={alternar}
          className="ml-auto flex items-center gap-1.5 border border-[var(--rule)] px-3 py-1.5 font-mono text-[11px] uppercase tracking-widest text-ink-muted transition-colors hover:border-blue hover:text-blue"
        >
          {publico ? <Lock size={13} /> : <Globe size={13} />}
          {publico ? "Tornar privado" : "Tornar público"}
        </button>
      </div>
    </section>
  );
}

function Numero({
  rotulo,
  valor,
  nota,
}: {
  rotulo: string;
  valor: string;
  nota?: string;
}) {
  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-widest text-onblue-muted">
        {rotulo}
      </p>
      <p className="mt-1 font-mono text-2xl tabular text-onblue">
        {valor}
        {nota && <span className="ml-1.5 text-sm text-onblue-muted">{nota}</span>}
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function NomeDeExibicao({
  inicial,
  bloqueado,
}: {
  inicial: string;
  bloqueado: boolean;
}) {
  const router = useRouter();
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(inicial);
  const [erro, setErro] = useState<string | null>(null);
  const [salvo, setSalvo] = useState(false);
  const [enviando, iniciar] = useTransition();

  function salvar() {
    setErro(null);
    iniciar(async () => {
      const r = await salvarApelido(valor);
      if (r.ok) {
        setEditando(false);
        setSalvo(true);
        setTimeout(() => setSalvo(false), 2500);
        router.refresh();
      } else {
        setErro(r.mensagem);
      }
    });
  }

  return (
    <section>
      <h2 className="font-display text-2xl text-ink">Nome de exibição</h2>
      <p className="mt-1 text-sm text-ink-muted">
        É o nome que aparece no ranking e na saudação.
      </p>

      {!editando ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="border border-[var(--rule)] px-4 py-2.5 font-mono text-sm text-ink">
            {inicial}
          </span>
          <button
            onClick={() => {
              setValor(inicial);
              setEditando(true);
            }}
            className="inline-flex items-center gap-2 border border-[var(--rule)] px-4 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-blue hover:text-blue"
          >
            <Pencil size={14} />
            Mudar
          </button>
          <AnimatePresence>
            {salvo && (
              <motion.span
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-emerald-600"
              >
                <Check size={14} />
                salvo
              </motion.span>
            )}
          </AnimatePresence>
        </div>
      ) : (
        <div className="mt-4 max-w-sm">
          <div className="flex gap-2">
            <input
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              maxLength={24}
              autoFocus
              className="w-full border border-[var(--rule)] bg-paper px-4 py-2.5 text-ink outline-none focus:border-blue"
            />
            <button
              onClick={salvar}
              disabled={enviando}
              className="shrink-0 bg-blue px-5 py-2.5 text-sm font-semibold text-onblue transition-colors hover:bg-blue-deep disabled:opacity-60"
            >
              {enviando ? <Loader2 size={16} className="animate-spin" /> : "Salvar"}
            </button>
          </div>
          <button
            onClick={() => {
              setEditando(false);
              setErro(null);
            }}
            className="mt-2 font-mono text-[11px] uppercase tracking-widest text-ink-muted hover:text-ink"
          >
            cancelar
          </button>
          {erro && (
            <p className="mt-3 flex items-start gap-2 border-l-[3px] border-rose-500 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              {erro}
            </p>
          )}
        </div>
      )}

      {bloqueado && (
        <p className="mt-3 font-mono text-[11px] text-ink-muted">
          Como visitante, esse nome vale só neste navegador.
        </p>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */

function SeuPerfil({ perfil }: { perfil: (typeof PERFIS)[PerfilId] | null }) {
  const [refazendo, setRefazendo] = useState(false);

  return (
    <section>
      <h2 className="font-display text-2xl text-ink">Seu perfil de investidor</h2>

      {perfil && !refazendo ? (
        <div className="mt-4 border border-[var(--rule)] p-6">
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
            Você é
          </p>
          <p className="mt-1 font-display text-3xl text-blue">{perfil.nome}</p>
          <p className="mt-3 max-w-lg border-l-[3px] border-gold pl-4 leading-relaxed text-ink-muted">
            {perfil.descricao}
          </p>
          <button
            onClick={() => setRefazendo(true)}
            className="mt-5 font-mono text-[11px] uppercase tracking-[0.18em] text-blue underline underline-offset-4 hover:text-ink"
          >
            Refazer o teste
          </button>
        </div>
      ) : (
        <div className="mt-4">
          {!perfil && !refazendo && (
            <p className="mb-4 text-sm leading-relaxed text-ink-muted">
              Você ainda não fez o teste. São 5 perguntas rápidas, e o
              resultado ajuda a sugerir empresas que combinam com você.
            </p>
          )}
          <QuizPerfil persistir />
        </div>
      )}
    </section>
  );
}
