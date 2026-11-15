"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Trophy, Copy, Check } from "lucide-react";
import { entrarCompeticao, operarCompeticao } from "@/app/competicoes/operacoes";
import { TESE_MAXIMA, TESE_MINIMA, validarOrdem } from "@/lib/challenge";

const campo =
  "w-full border border-[var(--rule)] bg-paper px-3 py-2 text-sm text-ink outline-none focus:border-blue";
const rotulo = "mb-1 block font-mono text-[11px] uppercase tracking-widest text-ink-muted";

export function BotaoEntrarCompeticao({ codigo }: { codigo: string }) {
  const router = useRouter();
  const [, iniciar] = useTransition();
  const [carregando, setCarregando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);

  function entrar() {
    setCarregando(true);
    setMensagem(null);
    iniciar(async () => {
      try {
        const r = await entrarCompeticao(codigo);
        if (r.ok) {
          router.refresh();
          return;
        }
        setMensagem(r.mensagem);
      } catch {
        setMensagem("Não consegui fazer sua inscrição agora. Tente de novo.");
      } finally {
        setCarregando(false);
      }
    });
  }

  return (
    <div>
      <button
        onClick={entrar}
        disabled={carregando}
        className="flex items-center gap-2 bg-blue px-6 py-3 text-sm font-semibold text-onblue transition-colors hover:bg-blue-deep disabled:opacity-50"
      >
        {carregando ? <Loader2 size={15} className="animate-spin" /> : <Trophy size={15} />}
        Participar
      </button>
      {mensagem && <p className="mt-3 text-sm text-rose-600">{mensagem}</p>}
    </div>
  );
}

export function BotaoCopiarLink({ codigo }: { codigo: string }) {
  const [copiado, setCopiado] = useState(false);

  function copiar() {
    const link = `${window.location.origin}/challenge/${codigo}`;
    navigator.clipboard?.writeText(link).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  }

  return (
    <button
      onClick={copiar}
      className="flex items-center gap-2 border border-[var(--rule)] px-4 py-2 text-sm text-ink transition-colors hover:border-blue"
    >
      {copiado ? <Check size={14} /> : <Copy size={14} />}
      {copiado ? "Link copiado" : "Copiar link de convite"}
    </button>
  );
}

export function FormOrdemCompeticao({
  codigo,
  teseObrigatoria,
  tickersEmCarteira,
}: {
  codigo: string;
  teseObrigatoria: boolean;
  tickersEmCarteira: string[];
}) {
  const router = useRouter();
  const [, iniciar] = useTransition();
  const [tipo, setTipo] = useState<"compra" | "venda">("compra");
  const [ticker, setTicker] = useState("");
  const [quantidade, setQuantidade] = useState(1);
  const [tese, setTese] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [retorno, setRetorno] = useState<{ ok: boolean; texto: string } | null>(null);

  function enviar() {
    const dados = { codigo, tipo, ticker, quantidade, tese, teseObrigatoria };
    const erro = validarOrdem(dados);
    if (erro) {
      setRetorno({ ok: false, texto: erro });
      return;
    }
    setEnviando(true);
    setRetorno(null);
    iniciar(async () => {
      try {
        const r = await operarCompeticao(dados);
        setRetorno({ ok: r.ok, texto: r.mensagem });
        if (r.ok) {
          setTese("");
          router.refresh();
        }
      } catch {
        setRetorno({ ok: false, texto: "Não consegui enviar a ordem agora. Tente de novo." });
      } finally {
        setEnviando(false);
      }
    });
  }

  const faltaTese = teseObrigatoria ? Math.max(0, TESE_MINIMA - tese.trim().length) : 0;

  return (
    <div className="space-y-3">
      <div className="flex border border-[var(--rule)]" role="group" aria-label="Tipo de ordem">
        {(["compra", "venda"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTipo(t)}
            aria-pressed={tipo === t}
            className={`flex-1 px-4 py-2 text-sm font-semibold transition-colors ${
              tipo === t ? "bg-blue text-onblue" : "text-ink-muted hover:text-ink"
            }`}
          >
            {t === "compra" ? "Comprar" : "Vender"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_7rem] gap-3">
        <div>
          <label htmlFor="ordem-ticker" className={rotulo}>Ativo</label>
          <input
            id="ordem-ticker"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 7))}
            placeholder="PETR4, AAPL..."
            list={tipo === "venda" ? "tickers-carteira" : undefined}
            className={`${campo} font-mono uppercase`}
          />
          <datalist id="tickers-carteira">
            {tickersEmCarteira.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        </div>
        <div>
          <label htmlFor="ordem-qtd" className={rotulo}>Cotas</label>
          <input
            id="ordem-qtd"
            type="number"
            min={1}
            value={quantidade}
            onChange={(e) => setQuantidade(Math.max(0, Math.floor(Number(e.target.value) || 0)))}
            className={`${campo} font-mono tabular`}
          />
        </div>
      </div>

      <div>
        <label htmlFor="ordem-tese" className={rotulo}>
          Tese {teseObrigatoria ? "(obrigatória)" : "(opcional)"}
        </label>
        <textarea
          id="ordem-tese"
          value={tese}
          onChange={(e) => setTese(e.target.value.slice(0, TESE_MAXIMA))}
          rows={3}
          placeholder="Por que essa operação? Qual o catalisador e quando você sairia?"
          className={campo}
        />
        <p className="mt-1 text-xs text-ink-muted">
          {faltaTese > 0
            ? `Faltam ${faltaTese} caracteres.`
            : `${tese.length}/${TESE_MAXIMA}`}
        </p>
      </div>

      <p className="text-xs leading-relaxed text-ink-muted">
        A ordem é executada a mercado, pelo preço confirmado no servidor no
        momento do envio. Ações americanas são convertidas para reais.
      </p>

      <button
        onClick={enviar}
        disabled={enviando}
        className="flex w-full items-center justify-center gap-2 bg-blue px-4 py-3 text-sm font-semibold text-onblue transition-colors hover:bg-blue-deep disabled:opacity-50"
      >
        {enviando && <Loader2 size={15} className="animate-spin" />}
        {tipo === "compra" ? "Enviar compra" : "Enviar venda"}
      </button>

      {retorno && (
        <p className={`text-sm ${retorno.ok ? "text-emerald-600" : "text-rose-600"}`} role="status">
          {retorno.texto}
        </p>
      )}
    </div>
  );
}
