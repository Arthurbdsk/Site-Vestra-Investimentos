"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Swords, Copy, Check, Loader2, Trophy } from "lucide-react";
import { criarDuelo, entrarDuelo } from "@/app/simulador/operacoesDuelo";
import { pct } from "@/lib/formato";

export type Duelo = {
  id: string;
  codigoConvite: string;
  dias: number;
  status: "aguardando" | "ativo";
  souCriador: boolean;
  dataInicio: string | null;
  meuApelido: string | null;
  oponenteApelido: string | null;
  meuPatrimonioInicial: number | null;
  oponentePatrimonioInicial: number | null;
  meuPatrimonioAtual: number;
  oponentePatrimonioAtual: number | null;
};

function ganhoPct(inicial: number | null, atual: number | null): number {
  if (!inicial || inicial <= 0 || atual == null) return 0;
  return ((atual - inicial) / inicial) * 100;
}

export function DuelosPainel({ duelos }: { duelos: Duelo[] }) {
  const router = useRouter();
  const [, iniciar] = useTransition();
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
      const r = await criarDuelo(dias);
      setCriando(false);
      // Sem o ramo de erro, uma falha ao criar parava o spinner e nao
      // mostrava codigo nem aviso: parecia que nada tinha acontecido.
      if (!r.ok) {
        setErroCriar(r.mensagem);
        return;
      }
      if (r.codigo) setCodigoNovo(r.codigo);
      else setErroCriar("O duelo foi criado, mas o código não voltou. Recarregue a página pra vê-lo.");
      router.refresh();
    });
  }

  function entrar() {
    if (!codigoEntrar.trim()) return;
    setEntrando(true);
    setMensagemEntrar(null);
    iniciar(async () => {
      const r = await entrarDuelo(codigoEntrar.trim());
      setEntrando(false);
      setMensagemEntrar(r.mensagem);
      if (r.ok) {
        setCodigoEntrar("");
        router.refresh();
      }
    });
  }

  function copiar(codigo: string) {
    navigator.clipboard?.writeText(codigo).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  }

  const aguardando = duelos.filter((d) => d.status === "aguardando");
  const ativos = duelos.filter((d) => d.status === "ativo");

  return (
    <div>
      <h2 className="font-display text-2xl text-ink">Modo duelo</h2>
      <p className="mt-2 max-w-xl leading-relaxed text-ink-muted">
        Desafie um amigo: quem crescer mais em porcentagem, dentro do prazo, vence.
        Sem dinheiro real, só orgulho.
      </p>

      <div className="mt-8 grid gap-px bg-[var(--rule)] sm:grid-cols-2">
        <div className="bg-paper p-5">
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
            Criar um duelo
          </p>
          <div className="mt-3 flex items-center gap-2">
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
              {criando ? <Loader2 size={15} className="animate-spin" /> : <Swords size={15} />}
              Criar
            </button>
          </div>

          {codigoNovo && (
            <div className="mt-4 flex items-center justify-between gap-3 border-l-[3px] border-gold bg-gold/10 px-4 py-3">
              <div>
                <p className="text-xs text-ink-muted">Manda esse código pro seu amigo</p>
                <p className="font-mono text-lg font-semibold tabular text-ink">{codigoNovo}</p>
              </div>
              <button
                onClick={() => copiar(codigoNovo)}
                className="shrink-0 text-ink-muted transition-colors hover:text-blue"
                aria-label="Copiar código"
              >
                {copiado ? <Check size={18} className="text-emerald-600" /> : <Copy size={18} />}
              </button>
            </div>
          )}

          {erroCriar && (
            <p className="mt-4 text-sm leading-relaxed text-rose-600">{erroCriar}</p>
          )}
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

      {aguardando.length > 0 && (
        <div className="mt-10">
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
            Esperando alguém entrar
          </p>
          <ul className="mt-3 space-y-2">
            {aguardando.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between gap-3 border border-[var(--rule)] px-4 py-3"
              >
                <span className="text-sm text-ink">
                  Duelo de {d.dias} dias · código{" "}
                  <span className="font-mono font-semibold">{d.codigoConvite}</span>
                </span>
                <button
                  onClick={() => copiar(d.codigoConvite)}
                  className="text-ink-muted transition-colors hover:text-blue"
                  aria-label="Copiar código"
                >
                  <Copy size={15} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {ativos.length > 0 && (
        <div className="mt-10 space-y-5">
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
            Duelos em andamento
          </p>
          {ativos.map((d, i) => (
            <DueloCartao key={d.id} duelo={d} delay={i * 0.05} />
          ))}
        </div>
      )}

      {duelos.length === 0 && (
        <p className="mt-10 text-ink-muted">
          Nenhum duelo ainda. Crie um e chame um amigo pra competir.
        </p>
      )}
    </div>
  );
}

function DueloCartao({ duelo, delay }: { duelo: Duelo; delay: number }) {
  const meuGanho = ganhoPct(duelo.meuPatrimonioInicial, duelo.meuPatrimonioAtual);
  const oponenteGanho = ganhoPct(duelo.oponentePatrimonioInicial, duelo.oponentePatrimonioAtual);
  const euGanhando = meuGanho >= oponenteGanho;

  const diasRestantes = duelo.dataInicio
    ? Math.max(
        0,
        duelo.dias - Math.floor((Date.now() - new Date(duelo.dataInicio).getTime()) / 86_400_000),
      )
    : duelo.dias;
  const encerrado = diasRestantes <= 0;

  const maiorBarra = Math.max(Math.abs(meuGanho), Math.abs(oponenteGanho), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="border border-[var(--rule)] p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-ink-muted">
          {encerrado ? "Duelo encerrado" : `${diasRestantes} dias restantes`} · {duelo.dias} dias no total
        </p>
        {encerrado && (
          <span className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-gold">
            <Trophy size={13} />
            {euGanhando ? "Você venceu" : `${duelo.oponenteApelido ?? "Seu amigo"} venceu`}
          </span>
        )}
      </div>

      <div className="mt-4 space-y-3">
        <Barra
          nome="Você"
          ganho={meuGanho}
          maior={maiorBarra}
          destaque={euGanhando}
        />
        <Barra
          nome={duelo.oponenteApelido ?? "Seu amigo"}
          ganho={oponenteGanho}
          maior={maiorBarra}
          destaque={!euGanhando}
        />
      </div>
    </motion.div>
  );
}

function Barra({
  nome,
  ganho,
  maior,
  destaque,
}: {
  nome: string;
  ganho: number;
  maior: number;
  destaque: boolean;
}) {
  const largura = Math.min(100, (Math.abs(ganho) / maior) * 100);
  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className={destaque ? "font-semibold text-ink" : "text-ink-muted"}>{nome}</span>
        <span
          className={`font-mono tabular ${ganho >= 0 ? "text-emerald-600" : "text-rose-600"}`}
        >
          {pct(ganho)}
        </span>
      </div>
      <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[var(--rule)]">
        <div
          className={`h-full rounded-full ${ganho >= 0 ? "bg-emerald-500" : "bg-rose-500"}`}
          style={{ width: `${largura}%` }}
        />
      </div>
    </div>
  );
}
