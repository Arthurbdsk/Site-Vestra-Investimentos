"use client";

import { useEffect, useRef, useState } from "react";
import {
  createChart,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  ColorType,
  type UTCTimestamp,
} from "lightweight-charts";
import { CandlestickChart, LineChart } from "lucide-react";
import type { PontoSerie } from "@/lib/historico";

function paraTimestamp(data: string): UTCTimestamp {
  return Math.floor(new Date(data).getTime() / 1000) as UTCTimestamp;
}

/**
 * Grafico de candlestick + volume, no estilo dos apps de corretora/
 * Investing.com. Usa a lightweight-charts (TradingView), que roda
 * inteiramente no navegador; os dados (OHLC + volume) ja vem prontos
 * da API de historico.
 */
export function GraficoAvancado({ serie }: { serie: PontoSerie[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [modo, setModo] = useState<"candle" | "linha">("candle");

  useEffect(() => {
    const container = containerRef.current;
    if (!container || serie.length < 2) return;

    // Canvas nao resolve "var(--x)" sozinho (fillStyle so entende cor
    // final), diferente do texto/grade abaixo que a propria lib repassa
    // pro DOM. Por isso lemos o valor computado uma vez aqui, o que
    // tambem mantem as cores de alta/baixa vindas so do globals.css.
    const estiloRaiz = getComputedStyle(document.documentElement);
    const corAlta = estiloRaiz.getPropertyValue("--color-alta").trim();
    const corBaixa = estiloRaiz.getPropertyValue("--color-baixa").trim();

    const chart = createChart(container, {
      width: container.clientWidth,
      height: 320,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "var(--color-ink-muted)",
        fontFamily: "var(--font-plex-mono)",
      },
      grid: {
        vertLines: { color: "var(--rule)" },
        horzLines: { color: "var(--rule)" },
      },
      timeScale: { timeVisible: true, secondsVisible: false },
      rightPriceScale: { borderColor: "var(--rule)" },
    });

    // Duas casas de timestamp identico (mesmo dia numa serie diaria, ou
    // varios pontos por hora numa intraday) confundem a lib, entao
    // garantimos unicidade e ordem crescente antes de montar os dados.
    const pontosOrdenados = [...serie]
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
      .filter((p, i, arr) => i === 0 || new Date(p.data).getTime() !== new Date(arr[i - 1].data).getTime());

    if (modo === "candle") {
      const candles = chart.addSeries(CandlestickSeries, {
        upColor: corAlta,
        downColor: corBaixa,
        borderVisible: false,
        wickUpColor: corAlta,
        wickDownColor: corBaixa,
      });
      candles.setData(
        pontosOrdenados.map((p) => ({
          time: paraTimestamp(p.data),
          open: p.abertura,
          high: p.maxima,
          low: p.minima,
          close: p.preco,
        })),
      );
    } else {
      const linha = chart.addSeries(LineSeries, {
        color: corAlta,
        lineWidth: 2,
      });
      linha.setData(pontosOrdenados.map((p) => ({ time: paraTimestamp(p.data), value: p.preco })));
    }

    const temVolume = pontosOrdenados.some((p) => p.volume > 0);
    if (temVolume) {
      const volume = chart.addSeries(HistogramSeries, {
        priceFormat: { type: "volume" },
        priceScaleId: "volume",
      });
      volume.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
      volume.setData(
        pontosOrdenados.map((p, i) => ({
          time: paraTimestamp(p.data),
          value: p.volume,
          color: i === 0 || p.preco >= pontosOrdenados[i - 1].preco ? `${corAlta}80` : `${corBaixa}80`,
        })),
      );
    }

    chart.timeScale().fitContent();

    const onResize = () => {
      if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth });
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      chart.remove();
    };
  }, [serie, modo]);

  if (serie.length < 2) return null;

  return (
    <div>
      <div className="mb-2 flex justify-end gap-1">
        <button
          onClick={() => setModo("candle")}
          title="Candlestick"
          className={`border p-1.5 transition-colors ${
            modo === "candle" ? "border-blue text-blue" : "border-[var(--rule)] text-ink-muted hover:text-blue"
          }`}
        >
          <CandlestickChart size={14} />
        </button>
        <button
          onClick={() => setModo("linha")}
          title="Linha"
          className={`border p-1.5 transition-colors ${
            modo === "linha" ? "border-blue text-blue" : "border-[var(--rule)] text-ink-muted hover:text-blue"
          }`}
        >
          <LineChart size={14} />
        </button>
      </div>
      <div ref={containerRef} className="w-full" />
    </div>
  );
}
