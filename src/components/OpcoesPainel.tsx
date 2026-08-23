"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { venderCoveredCall, venderCashSecuredPut, previsaoPremio } from "@/app/simulador/operacoesOpcoes";
import { brl, data as fmtData } from "@/lib/formato";
import type { Posicao } from "./PainelSimulador";
import type { Cotacao } from "@/lib/cotacoes";

export type Opcao = {
  id: string;
  ticker: string;
  tipo: "covered_call" | "cash_secured_put";
  strike: number;
  premio: number;
  quantidade: number;
  vencimento: string;
  status: "aberta" | "exercida" | "expirada";
  criadoEm: string;
};

export function OpcoesPainel({
  posicoes,
  precoDe,
  saldo,
  opcoes,
}: {
  posicoes: Posicao[];
  precoDe: (ticker: string) => Cotacao | null;
  saldo: number;
  opcoes: Opcao[];
}) {
  const [modo, setModo] = useState<"covered_call" | "cash_secured_put">("covered_call");
  const abertas = opcoes.filter((o) => o.status === "aberta");
  const encerradas = opcoes.filter((o) => o.status !== "aberta");

  return (
    <div>
      <h2 className="font-display text-2xl text-ink">Opções (simplificado)</h2>
      <p className="mt-2 max-w-xl leading-relaxed text-ink-muted">
        Duas estratégias comuns pra quem já tem uma carteira: vender covered
        call sobre ações que você tem, ou vender cash-secured put pra
        talvez comprar uma ação mais barata, ganhando um prêmio nos dois
        casos.
      </p>
      <p className="mt-2 max-w-xl text-xs leading-relaxed text-ink-muted">
        O prêmio aqui é <strong>estimado</strong> (fórmula simplificada com
        volatilidade fixa assumida), não é uma cotação real de mercado de
        opções, que este simulador não tem acesso.
      </p>

      <div className="mt-6 flex gap-1.5">
        <button
          onClick={() => setModo("covered_call")}
          className={`px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors ${
            modo === "covered_call" ? "bg-blue text-onblue" : "border border-[var(--rule)] text-ink-muted hover:border-blue hover:text-blue"
          }`}
        >
          Covered call
        </button>
        <button
          onClick={() => setModo("cash_secured_put")}
          className={`px-4 py-2 font-mono text-xs uppercase tracking-widest transition-colors ${
            modo === "cash_secured_put" ? "bg-blue text-onblue" : "border border-[var(--rule)] text-ink-muted hover:border-blue hover:text-blue"
          }`}
        >
          Cash-secured put
        </button>
      </div>

      <div className="mt-5">
        {modo === "covered_call" ? (
          <FormularioCoveredCall posicoes={posicoes} precoDe={precoDe} />
        ) : (
          <FormularioCashSecuredPut saldo={saldo} />
        )}
      </div>

      {abertas.length > 0 && (
        <div className="mt-10">
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">Abertas</p>
          <TabelaOpcoes opcoes={abertas} />
        </div>
      )}

      {encerradas.length > 0 && (
        <div className="mt-8">
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">Histórico</p>
          <TabelaOpcoes opcoes={encerradas} />
        </div>
      )}
    </div>
  );
}

function TabelaOpcoes({ opcoes }: { opcoes: Opcao[] }) {
  return (
    <div className="mt-3 overflow-x-auto border border-[var(--rule)]">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--rule)] bg-paper-alt">
            <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-ink-muted">Tipo</th>
            <th className="px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-ink-muted">Ação</th>
            <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-ink-muted">Strike</th>
            <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-ink-muted">Prêmio</th>
            <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-ink-muted">Vencimento</th>
            <th className="px-3 py-2 text-right font-mono text-[10px] uppercase tracking-wider text-ink-muted">Status</th>
          </tr>
        </thead>
        <tbody>
          {opcoes.map((o) => (
            <tr key={o.id} className="border-b border-[var(--rule)] last:border-b-0 hover:bg-paper-alt">
              <td className="px-3 py-2 text-ink-muted">{o.tipo === "covered_call" ? "Covered call" : "Cash-secured put"}</td>
              <td className="px-3 py-2 font-mono font-semibold text-ink">{o.ticker} × {o.quantidade}</td>
              <td className="px-3 py-2 text-right font-mono tabular text-ink-muted">{brl(o.strike)}</td>
              <td className="px-3 py-2 text-right font-mono tabular text-emerald-600">{brl(o.premio)}</td>
              <td className="px-3 py-2 text-right font-mono tabular text-ink-muted">{fmtData(o.vencimento)}</td>
              <td className="px-3 py-2 text-right">
                <span
                  className={`px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${
                    o.status === "aberta"
                      ? "bg-blue text-onblue"
                      : o.status === "exercida"
                        ? "bg-gold text-blue-deep"
                        : "bg-[var(--rule)] text-ink-muted"
                  }`}
                >
                  {o.status}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FormularioCoveredCall({
  posicoes,
  precoDe,
}: {
  posicoes: Posicao[];
  precoDe: (ticker: string) => Cotacao | null;
}) {
  const router = useRouter();
  const [, iniciar] = useTransition();
  const [ticker, setTicker] = useState(posicoes[0]?.ticker ?? "");
  const [strike, setStrike] = useState(0);
  const [quantidade, setQuantidade] = useState(1);
  const [dias, setDias] = useState(14);
  const [premio, setPremio] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<{ ok: boolean; texto: string } | null>(null);

  const posicao = posicoes.find((p) => p.ticker === ticker);
  const precoAtual = ticker ? precoDe(ticker)?.preco ?? posicao?.preco_medio ?? 0 : 0;

  useEffect(() => {
    if (precoAtual > 0 && strike === 0) setStrike(Math.round(precoAtual * 1.05 * 100) / 100);
  }, [precoAtual, strike]);

  useEffect(() => {
    if (precoAtual <= 0 || strike <= 0 || dias <= 0) {
      setPremio(0);
      return;
    }
    previsaoPremio(precoAtual, strike, dias, "covered_call").then((p) => setPremio(p * quantidade));
  }, [precoAtual, strike, dias, quantidade]);

  if (posicoes.length === 0) {
    return (
      <p className="text-sm text-ink-muted">
        Você precisa ter ações em carteira pra vender uma covered call
        sobre elas. Compre alguma ação primeiro.
      </p>
    );
  }

  function enviar() {
    setEnviando(true);
    setMensagem(null);
    iniciar(async () => {
      const r = await venderCoveredCall(ticker, strike, quantidade, dias);
      setMensagem({ ok: r.ok, texto: r.mensagem });
      if (r.ok) router.refresh();
      setEnviando(false);
    });
  }

  return (
    <div className="border border-[var(--rule)] bg-paper-alt p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">Ação (que você tem)</label>
          <select
            value={ticker}
            onChange={(e) => {
              setTicker(e.target.value);
              setStrike(0);
            }}
            className="mt-2 w-full border border-[var(--rule)] bg-paper px-3 py-2.5 text-sm text-ink outline-none focus:border-blue"
          >
            {posicoes.map((p) => (
              <option key={p.ticker} value={p.ticker}>{p.ticker} ({p.quantidade} ações)</option>
            ))}
          </select>
        </div>
        <div>
          <label className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">Quantidade coberta</label>
          <input
            type="number"
            min={1}
            max={posicao?.quantidade ?? 1}
            value={quantidade}
            onChange={(e) => setQuantidade(Math.max(1, Math.min(posicao?.quantidade ?? 1, Number(e.target.value) || 1)))}
            className="mt-2 w-full border border-[var(--rule)] bg-paper px-3 py-2.5 font-mono tabular text-ink outline-none focus:border-blue"
          />
        </div>
        <div>
          <label className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">Strike (preço de venda)</label>
          <input
            type="number"
            min={0.01}
            step={0.01}
            value={strike}
            onChange={(e) => setStrike(Math.max(0, Number(e.target.value) || 0))}
            className="mt-2 w-full border border-[var(--rule)] bg-paper px-3 py-2.5 font-mono tabular text-ink outline-none focus:border-blue"
          />
          <p className="mt-1 text-xs text-ink-muted">Preço atual: {brl(precoAtual)}</p>
        </div>
        <div>
          <label className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">Prazo (dias)</label>
          <input
            type="number"
            min={1}
            max={60}
            value={dias}
            onChange={(e) => setDias(Math.max(1, Math.min(60, Number(e.target.value) || 1)))}
            className="mt-2 w-full border border-[var(--rule)] bg-paper px-3 py-2.5 font-mono tabular text-ink outline-none focus:border-blue"
          />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-[var(--rule)] pt-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">Prêmio estimado</p>
          <p className="font-mono text-xl tabular text-emerald-600">{brl(premio)}</p>
        </div>
        <button
          onClick={enviar}
          disabled={enviando || strike <= 0 || quantidade < 1}
          className="flex items-center gap-2 bg-blue px-5 py-3 text-sm font-semibold text-onblue transition-colors hover:bg-blue-deep disabled:opacity-50"
        >
          {enviando && <Loader2 size={15} className="animate-spin" />}
          Vender covered call
        </button>
      </div>

      {mensagem && (
        <p className={`mt-3 flex items-center gap-2 text-sm ${mensagem.ok ? "text-emerald-700" : "text-rose-700"}`}>
          {mensagem.ok ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          {mensagem.texto}
        </p>
      )}

      <p className="mt-4 text-xs leading-relaxed text-ink-muted">
        Se o preço estiver acima do strike no vencimento, suas ações são
        vendidas automaticamente por esse preço. Se ficar abaixo, a opção
        expira e você fica com as ações e o prêmio.
      </p>
    </div>
  );
}

function FormularioCashSecuredPut({ saldo }: { saldo: number }) {
  const router = useRouter();
  const [, iniciar] = useTransition();
  const [ticker, setTicker] = useState("");
  const [precoAtual, setPrecoAtual] = useState(0);
  const [buscandoPreco, setBuscandoPreco] = useState(false);
  const [strike, setStrike] = useState(0);
  const [quantidade, setQuantidade] = useState(1);
  const [dias, setDias] = useState(14);
  const [premio, setPremio] = useState(0);
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<{ ok: boolean; texto: string } | null>(null);

  async function buscarPreco() {
    const t = ticker.trim().toUpperCase();
    if (!t) return;
    setBuscandoPreco(true);
    try {
      const resposta = await fetch(`/api/acoes?q=${encodeURIComponent(t)}`);
      const json = await resposta.json();
      const encontrada = json.acoes?.find((a: { ticker: string; preco: number }) => a.ticker === t);
      if (encontrada?.preco != null) {
        setPrecoAtual(encontrada.preco);
        if (strike === 0) setStrike(Math.round(encontrada.preco * 0.95 * 100) / 100);
      }
    } catch {
      // silencioso: o botao de buscar continua disponivel pra tentar de novo
    } finally {
      setBuscandoPreco(false);
    }
  }

  useEffect(() => {
    if (precoAtual <= 0 || strike <= 0 || dias <= 0) {
      setPremio(0);
      return;
    }
    previsaoPremio(precoAtual, strike, dias, "cash_secured_put").then((p) => setPremio(p * quantidade));
  }, [precoAtual, strike, dias, quantidade]);

  const reserva = strike * quantidade;

  function enviar() {
    setEnviando(true);
    setMensagem(null);
    iniciar(async () => {
      const r = await venderCashSecuredPut(ticker.trim().toUpperCase(), strike, quantidade, dias);
      setMensagem({ ok: r.ok, texto: r.mensagem });
      if (r.ok) router.refresh();
      setEnviando(false);
    });
  }

  return (
    <div className="border border-[var(--rule)] bg-paper-alt p-5">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">Ação</label>
          <div className="mt-2 flex gap-2">
            <input
              value={ticker}
              onChange={(e) => setTicker(e.target.value.toUpperCase())}
              onBlur={buscarPreco}
              placeholder="Ex: PETR4"
              className="w-full border border-[var(--rule)] bg-paper px-3 py-2.5 font-mono text-sm uppercase text-ink outline-none focus:border-blue"
            />
            <button
              onClick={buscarPreco}
              disabled={buscandoPreco}
              className="shrink-0 border border-[var(--rule)] px-3 text-xs text-ink-muted hover:border-blue hover:text-blue"
            >
              {buscandoPreco ? <Loader2 size={14} className="animate-spin" /> : "Buscar"}
            </button>
          </div>
          <p className="mt-1 text-xs text-ink-muted">
            {precoAtual > 0 ? `Preço atual: ${brl(precoAtual)}` : "Digite o ticker e clique em Buscar"}
          </p>
        </div>
        <div>
          <label className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">Quantidade</label>
          <input
            type="number"
            min={1}
            value={quantidade}
            onChange={(e) => setQuantidade(Math.max(1, Number(e.target.value) || 1))}
            className="mt-2 w-full border border-[var(--rule)] bg-paper px-3 py-2.5 font-mono tabular text-ink outline-none focus:border-blue"
          />
        </div>
        <div>
          <label className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">Strike (preço de compra)</label>
          <input
            type="number"
            min={0.01}
            step={0.01}
            value={strike}
            onChange={(e) => setStrike(Math.max(0, Number(e.target.value) || 0))}
            className="mt-2 w-full border border-[var(--rule)] bg-paper px-3 py-2.5 font-mono tabular text-ink outline-none focus:border-blue"
          />
        </div>
        <div>
          <label className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">Prazo (dias)</label>
          <input
            type="number"
            min={1}
            max={60}
            value={dias}
            onChange={(e) => setDias(Math.max(1, Math.min(60, Number(e.target.value) || 1)))}
            className="mt-2 w-full border border-[var(--rule)] bg-paper px-3 py-2.5 font-mono tabular text-ink outline-none focus:border-blue"
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--rule)] pt-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">Prêmio estimado</p>
          <p className="font-mono text-xl tabular text-emerald-600">{brl(premio)}</p>
          <p
            className={`mt-1 text-xs ${reserva > saldo ? "text-rose-600" : "text-ink-muted"}`}
          >
            Precisa de {brl(reserva)} em caixa (você tem {brl(saldo)})
          </p>
        </div>
        <button
          onClick={enviar}
          disabled={enviando || strike <= 0 || quantidade < 1 || precoAtual <= 0 || reserva > saldo}
          className="flex items-center gap-2 bg-blue px-5 py-3 text-sm font-semibold text-onblue transition-colors hover:bg-blue-deep disabled:opacity-50"
        >
          {enviando && <Loader2 size={15} className="animate-spin" />}
          Vender cash-secured put
        </button>
      </div>

      {mensagem && (
        <p className={`mt-3 flex items-center gap-2 text-sm ${mensagem.ok ? "text-emerald-700" : "text-rose-700"}`}>
          {mensagem.ok ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}
          {mensagem.texto}
        </p>
      )}

      <p className="mt-4 text-xs leading-relaxed text-ink-muted">
        Se o preço estiver abaixo do strike no vencimento, você compra as
        ações por esse preço automaticamente. Se ficar acima, a opção
        expira e você fica só com o prêmio.
      </p>
    </div>
  );
}
