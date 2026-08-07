"use client";

const tickers = [
  { s: "PETR4", p: "38,50", v: 2.31 },
  { s: "VALE3", p: "61,04", v: -0.74 },
  { s: "ITUB4", p: "31,22", v: 0.58 },
  { s: "BBDC4", p: "13,87", v: -1.12 },
  { s: "WEGE3", p: "44,90", v: 1.06 },
  { s: "MGLU3", p: "9,41", v: 3.88 },
  { s: "ABEV3", p: "12,63", v: -0.35 },
  { s: "BBAS3", p: "27,15", v: 0.92 },
  { s: "B3SA3", p: "11,78", v: -0.21 },
  { s: "RENT3", p: "39,60", v: 1.74 },
  { s: "SUZB3", p: "52,33", v: -0.66 },
  { s: "RAIL3", p: "18,05", v: 2.02 },
];

type TickerTapeProps = {
  speed?: "normal" | "slow";
  className?: string;
};

/** Barra azul com as cotações rolando. O azul entra como detalhe. */
export function TickerTape({ speed = "normal", className = "" }: TickerTapeProps) {
  const row = [...tickers, ...tickers];

  return (
    <div
      className={`marquee-pause relative overflow-hidden bg-blue py-2.5 ${className}`}
    >
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-20 bg-gradient-to-r from-blue to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-20 bg-gradient-to-l from-blue to-transparent" />

      <div
        className={`flex w-max ${
          speed === "slow" ? "animate-marquee-slow" : "animate-marquee"
        }`}
      >
        {row.map((t, i) => {
          const up = t.v >= 0;
          return (
            <div
              key={`${t.s}-${i}`}
              className="flex shrink-0 items-baseline gap-2 border-r border-[var(--rule-inv)] px-6 font-mono text-[13px] tabular"
            >
              <span className="font-medium text-gold">{t.s}</span>
              <span className="text-onblue-muted">{t.p}</span>
              <span className={up ? "text-emerald-400" : "text-rose-400"}>
                {up ? "▲" : "▼"} {Math.abs(t.v).toFixed(2).replace(".", ",")}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
