"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Users, Copy, Check, Loader2, Trophy } from "lucide-react";
import { criarLiga, entrarLiga } from "@/app/simulador/operacoesLiga";
import { pct } from "@/lib/formato";

export type MembroLiga = { apelido: string; ganhoPct: number; souEu: boolean };

export type Liga = {
  id: string;
  nome: string;
  codigoConvite: string;
  dias: number;
  criadoEm: string;
  souCriador: boolean;
  membros: MembroLiga[];
};

export function LigasPainel({ ligas }: { ligas: Liga[] }) {
  const router = useRouter();
  const [, iniciar] = useTransition();
  const [nome, setNome] = useState("");
  const [dias, setDias] = useState(30);
  const [criando, setCriando] = useState(false);
  const [codigoNovo, setCodigoNovo] = useState<string | null>(null);
  const [erroCriar, setErroCriar] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  const [codigoEntrar, setCodigoEntrar] = useState("");
  const [entrando, setEntrando] = useState(false);
  const [mensagemEntrar, setMensagemEntrar] = useState<string | null>(null);

  function criar() {
    setCriando(true);
    setErroCriar(null);
    iniciar(async () => {
      try {
        const r = await criarLiga(nome, dias);
        if (!r.ok) {
          setErroCriar(r.mensagem);
          return;
        }
        if (r.codigo) setCodigoNovo(r.codigo);
        setNome("");
        router.refresh();
      } catch {
        setErroCriar("Não consegui criar a liga agora. Tente de novo.");
      } finally {
        setCriando(false);
      }
    });
  }

  function entrar() {
    if (!codigoEntrar.trim()) return;
    setEntrando(true);
    setMensagemEntrar(null);
    iniciar(async () => {
      try {
        const r = await entrarLiga(codigoEntrar.trim());
        setMensagemEntrar(r.mensagem);
        if (r.ok) {
          setCodigoEntrar("");
          router.refresh();
        }
      } catch {
        setMensagemEntrar("Não consegui entrar na liga agora. Tente de novo.");
      } finally {
        setEntrando(false);
      }
    });
  }

  function copiar(codigo: string) {
    const link =
      typeof window === "undefined" ? codigo : `${window.location.origin}/liga/${codigo}`;
    navigator.clipboard?.writeText(link).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  }

  return (
    <div>
      <h2 className="font-display text-2xl text-ink">Ligas</h2>
      <p className="mt-2 max-w-xl leading-relaxed text-ink-muted">
        Igual ao duelo, mas pra um grupo inteiro: turma, família, grupo de
        amigos. Quem crescer mais em porcentagem, dentro do prazo, vence.
      </p>

      <div className="mt-8 grid gap-px bg-[var(--rule)] sm:grid-cols-2">
        <div className="bg-paper p-5">
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
            Criar uma liga
          </p>
          <div className="mt-3 space-y-2">
            <input
              value={nome}
              onChange={(e) => setNome(e.target.value.slice(0, 40))}
              placeholder="Nome da liga (ex: Turma 3A)"
              className="w-full border border-[var(--rule)] bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-blue"
            />
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={90}
                value={dias}
                onChange={(e) => setDias(Math.max(1, Math.min(90, Number(e.target.value) || 1)))}
                className="w-20 border border-[var(--rule)] bg-paper px-3 py-2 text-center font-mono text-sm tabular text-ink outline-none focus:border-blue"
              />
              <span className="text-sm text-ink-muted">dias</span>
              <button
                onClick={criar}
                disabled={criando}
                className="ml-auto flex items-center gap-2 bg-blue px-4 py-2.5 text-sm font-semibold text-onblue transition-colors hover:bg-blue-deep disabled:opacity-50"
              >
                {criando ? <Loader2 size={15} className="animate-spin" /> : <Users size={15} />}
                Criar
              </button>
            </div>
          </div>

          {codigoNovo && (
            <div className="mt-4 flex items-center justify-between gap-3 border-l-[3px] border-gold bg-gold/10 px-4 py-3">
              <div>
                <p className="text-xs text-ink-muted">
                  Copie o link e manda pra sua turma: quem entrar vê o
                  placar sem precisar criar conta antes.
                </p>
                <p className="font-mono text-lg font-semibold tabular text-ink">{codigoNovo}</p>
              </div>
              <button
                onClick={() => copiar(codigoNovo)}
                className="shrink-0 text-ink-muted transition-colors hover:text-blue"
                aria-label="Copiar link da liga"
              >
                {copiado ? <Check size={18} className="text-emerald-600" /> : <Copy size={18} />}
              </button>
            </div>
          )}

          {erroCriar && <p className="mt-4 text-sm leading-relaxed text-rose-600">{erroCriar}</p>}
        </div>

        <div className="bg-paper p-5">
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
            Entrar com um código
          </p>
          <div className="mt-3 flex items-center gap-2">
            <input
              value={codigoEntrar}
              onChange={(e) => setCodigoEntrar(e.target.value.toUpperCase())}
              placeholder="ABC123"
              maxLength={6}
              className="w-32 border border-[var(--rule)] bg-paper px-3 py-2 text-center font-mono text-sm uppercase tracking-widest text-ink outline-none focus:border-blue"
            />
            <button
              onClick={entrar}
              disabled={entrando || !codigoEntrar.trim()}
              className="ml-auto flex items-center gap-2 border border-blue px-4 py-2.5 text-sm font-semibold text-blue transition-colors hover:bg-blue hover:text-onblue disabled:opacity-50"
            >
              {entrando ? <Loader2 size={15} className="animate-spin" /> : "Entrar"}
            </button>
          </div>
          {mensagemEntrar && <p className="mt-3 text-sm text-ink-muted">{mensagemEntrar}</p>}
        </div>
      </div>

      {ligas.length > 0 ? (
        <div className="mt-10 space-y-5">
          {ligas.map((l, i) => (
            <LigaCartao key={l.id} liga={l} delay={i * 0.05} aoCopiar={() => copiar(l.codigoConvite)} />
          ))}
        </div>
      ) : (
        <p className="mt-10 text-ink-muted">
          Nenhuma liga ainda. Crie uma e chame um grupo pra competir.
        </p>
      )}
    </div>
  );
}

function LigaCartao({
  liga,
  delay,
  aoCopiar,
}: {
  liga: Liga;
  delay: number;
  aoCopiar: () => void;
}) {
  const diasRestantes = Math.max(
    0,
    liga.dias - Math.floor((Date.now() - new Date(liga.criadoEm).getTime()) / 86_400_000),
  );
  const encerrada = diasRestantes <= 0;
  const maiorGanho = Math.max(...liga.membros.map((m) => Math.abs(m.ganhoPct)), 1);
  const lider = liga.membros[0];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="border border-[var(--rule)] p-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-display text-lg text-ink">{liga.nome}</p>
          <p className="text-sm text-ink-muted">
            {encerrada ? "Liga encerrada" : `${diasRestantes} dias restantes`} ·{" "}
            {liga.membros.length} {liga.membros.length === 1 ? "membro" : "membros"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {encerrada && lider && (
            <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-gold">
              <Trophy size={13} />
              {lider.souEu ? "Você venceu" : `${lider.apelido} venceu`}
            </span>
          )}
          <button
            onClick={aoCopiar}
            className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-ink-muted transition-colors hover:text-blue"
          >
            <Copy size={13} />
            {liga.codigoConvite}
          </button>
        </div>
      </div>

      <div className="mt-4 space-y-2.5">
        {liga.membros.map((m) => (
          <div key={m.apelido}>
            <div className="flex items-baseline justify-between text-sm">
              <span className={m.souEu ? "font-semibold text-ink" : "text-ink-muted"}>
                {m.apelido}
                {m.souEu ? " (você)" : ""}
              </span>
              <span
                className={`font-mono tabular ${m.ganhoPct >= 0 ? "text-emerald-600" : "text-rose-600"}`}
              >
                {pct(m.ganhoPct)}
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[var(--rule)]">
              <div
                className={`h-full rounded-full ${m.ganhoPct >= 0 ? "bg-emerald-500" : "bg-rose-500"}`}
                style={{ width: `${Math.min(100, (Math.abs(m.ganhoPct) / maiorGanho) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
