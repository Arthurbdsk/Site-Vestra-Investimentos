"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Trophy, Plus, LogIn } from "lucide-react";
import { criarCompeticao, entrarCompeticao } from "@/app/challenge/operacoes";
import {
  ROTULO_STATUS,
  descreverPrazo,
  validarNovaCompeticao,
  type ResumoCompeticao,
} from "@/lib/challenge";

/** Date -> "YYYY-MM-DDTHH:mm" no fuso do navegador, o formato do input datetime-local. */
function paraInputLocal(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function padroes() {
  const inicio = new Date();
  inicio.setDate(inicio.getDate() + 1);
  inicio.setHours(10, 0, 0, 0);
  const fim = new Date(inicio);
  fim.setDate(fim.getDate() + 28);
  fim.setHours(18, 30, 0, 0);
  return { inicio: paraInputLocal(inicio), fim: paraInputLocal(fim) };
}

const campo =
  "w-full border border-[var(--rule)] bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-blue";
const rotulo = "mb-1 block font-mono text-[11px] uppercase tracking-widest text-ink-muted";

export function ChallengeInicio({
  logado,
  competicoes,
  agora,
}: {
  logado: boolean;
  competicoes: ResumoCompeticao[];
  agora: number;
}) {
  const router = useRouter();
  const [, iniciar] = useTransition();

  const [codigo, setCodigo] = useState("");
  const [entrando, setEntrando] = useState(false);
  const [msgEntrar, setMsgEntrar] = useState<string | null>(null);

  const [{ inicio: inicioPadrao, fim: fimPadrao }] = useState(padroes);
  const [nome, setNome] = useState("");
  const [inicio, setInicio] = useState(inicioPadrao);
  const [fim, setFim] = useState(fimPadrao);
  const [capital, setCapital] = useState(100_000);
  const [dominio, setDominio] = useState("");
  const [tese, setTese] = useState(true);
  const [criando, setCriando] = useState(false);
  const [msgCriar, setMsgCriar] = useState<string | null>(null);

  function entrar() {
    if (!codigo.trim()) return;
    setEntrando(true);
    setMsgEntrar(null);
    iniciar(async () => {
      try {
        const r = await entrarCompeticao(codigo);
        if (r.ok && r.codigo) {
          router.push(`/challenge/${r.codigo}`);
          return;
        }
        setMsgEntrar(r.mensagem);
      } catch {
        setMsgEntrar("Não consegui entrar agora. Tente de novo.");
      } finally {
        setEntrando(false);
      }
    });
  }

  function criar() {
    const dados = {
      nome,
      inicio: new Date(inicio),
      fim: new Date(fim),
      capital,
      dominioEmail: dominio,
    };
    const erro = validarNovaCompeticao(dados);
    if (erro) {
      setMsgCriar(erro);
      return;
    }
    setCriando(true);
    setMsgCriar(null);
    iniciar(async () => {
      try {
        const r = await criarCompeticao({
          nome,
          inicioIso: dados.inicio.toISOString(),
          fimIso: dados.fim.toISOString(),
          capital,
          dominioEmail: dominio,
          teseObrigatoria: tese,
        });
        if (r.ok && r.codigo) {
          router.push(`/challenge/${r.codigo}`);
          return;
        }
        setMsgCriar(r.mensagem);
      } catch {
        setMsgCriar("Não consegui criar agora. Tente de novo.");
      } finally {
        setCriando(false);
      }
    });
  }

  if (!logado) {
    return (
      <div className="mt-10 border-l-[3px] border-gold bg-paper-alt px-5 py-5">
        <p className="font-display text-xl text-ink">Entre para participar</p>
        <p className="mt-2 leading-relaxed text-ink-muted">
          Com a conta do Vestra você entra em uma competição pelo código ou
          organiza a sua.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/cadastro"
            className="bg-blue px-6 py-3 text-sm font-semibold text-onblue transition-colors hover:bg-blue-deep"
          >
            Criar conta
          </Link>
          <Link
            href="/login"
            className="border border-[var(--rule)] px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-blue"
          >
            Já tenho conta
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-10 space-y-10">
      {competicoes.length > 0 && (
        <section>
          <h2 className="font-display text-2xl text-ink">Suas competições</h2>
          <ul className="mt-4 border border-[var(--rule)]">
            {competicoes.map((c) => (
              <li key={c.codigo} className="border-b border-[var(--rule)] last:border-b-0">
                <Link
                  href={`/challenge/${c.codigo}`}
                  className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 transition-colors hover:bg-paper-alt"
                >
                  <span>
                    <span className="block text-ink">{c.nome}</span>
                    <span className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
                      {ROTULO_STATUS[c.status]} · {descreverPrazo(c.inicio, c.fim, agora)} ·{" "}
                      {c.totalParticipantes} {c.totalParticipantes === 1 ? "participante" : "participantes"}
                    </span>
                  </span>
                  <span className="font-mono text-xs text-ink-muted">
                    {c.souOrganizador ? "Organizador" : "Participante"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-px bg-[var(--rule)] md:grid-cols-2">
        <section className="bg-paper p-5">
          <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-ink-muted">
            <LogIn size={13} aria-hidden /> Entrar com código
          </p>
          <div className="mt-3 flex gap-2">
            <input
              value={codigo}
              onChange={(e) => setCodigo(e.target.value.toUpperCase().slice(0, 6))}
              onKeyDown={(e) => e.key === "Enter" && entrar()}
              placeholder="ABC123"
              aria-label="Código da competição"
              className={`${campo} font-mono uppercase tracking-widest`}
            />
            <button
              onClick={entrar}
              disabled={entrando}
              className="flex shrink-0 items-center gap-2 bg-blue px-4 py-2.5 text-sm font-semibold text-onblue transition-colors hover:bg-blue-deep disabled:opacity-50"
            >
              {entrando ? <Loader2 size={15} className="animate-spin" /> : <Trophy size={15} />}
              Entrar
            </button>
          </div>
          {msgEntrar && <p className="mt-3 text-sm text-rose-600">{msgEntrar}</p>}
        </section>

        <section className="bg-paper p-5">
          <p className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-ink-muted">
            <Plus size={13} aria-hidden /> Organizar uma competição
          </p>
          <div className="mt-3 space-y-3">
            <div>
              <label htmlFor="ch-nome" className={rotulo}>Nome</label>
              <input
                id="ch-nome"
                value={nome}
                onChange={(e) => setNome(e.target.value.slice(0, 60))}
                placeholder="Vestra Challenge Mackenzie 2027"
                className={campo}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="ch-inicio" className={rotulo}>Início</label>
                <input id="ch-inicio" type="datetime-local" value={inicio} onChange={(e) => setInicio(e.target.value)} className={campo} />
              </div>
              <div>
                <label htmlFor="ch-fim" className={rotulo}>Fim</label>
                <input id="ch-fim" type="datetime-local" value={fim} onChange={(e) => setFim(e.target.value)} className={campo} />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="ch-capital" className={rotulo}>Capital inicial (R$)</label>
                <input
                  id="ch-capital"
                  type="number"
                  min={1000}
                  max={10000000}
                  step={1000}
                  value={capital}
                  onChange={(e) => setCapital(Number(e.target.value) || 0)}
                  className={`${campo} font-mono tabular`}
                />
              </div>
              <div>
                <label htmlFor="ch-dominio" className={rotulo}>Só e-mails de (opcional)</label>
                <input
                  id="ch-dominio"
                  value={dominio}
                  onChange={(e) => setDominio(e.target.value.slice(0, 80))}
                  placeholder="mackenzie.br"
                  className={campo}
                />
              </div>
            </div>
            <label className="flex items-start gap-2 text-sm text-ink">
              <input type="checkbox" checked={tese} onChange={(e) => setTese(e.target.checked)} className="mt-1" />
              <span>
                Exigir uma tese escrita em cada ordem
                <span className="block text-xs text-ink-muted">
                  Recomendado: o organizador vê o raciocínio por trás de cada operação.
                </span>
              </span>
            </label>
            <p className="text-xs leading-relaxed text-ink-muted">
              Dica: marque o fim depois do fechamento do pregão. O resultado é
              congelado com as cotações daquele momento.
            </p>
            <button
              onClick={criar}
              disabled={criando}
              className="flex items-center gap-2 bg-blue px-4 py-2.5 text-sm font-semibold text-onblue transition-colors hover:bg-blue-deep disabled:opacity-50"
            >
              {criando ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
              Criar competição
            </button>
            {msgCriar && <p className="text-sm text-rose-600">{msgCriar}</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
