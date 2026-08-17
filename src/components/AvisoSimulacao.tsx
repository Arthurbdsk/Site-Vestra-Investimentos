import { FlaskConical, Clock3, Radio } from "lucide-react";

/**
 * Camada de conformidade do Vestra.
 *
 * Tudo aqui existe por uma regra so: a pessoa nunca pode confundir o que
 * ela ve com dinheiro de verdade, nem achar que um numero simulado e uma
 * cotacao oficial em tempo real. Por isso o aviso e um componente unico,
 * usado em todo lugar que mostra valor, em vez de texto solto repetido
 * (que a gente esquece de atualizar e acaba divergindo).
 */

const TEXTO_CURTO =
  "Saldo e operações virtuais, sem valor financeiro. Ambiente educacional.";

const TEXTO_COMPLETO =
  "Vestra é uma plataforma de simulação. Todo o saldo e todas as operações são virtuais e utilizados exclusivamente para fins educacionais e de treinamento. Não há depósito, saque ou transferência de valores, e nada aqui pode ser convertido em dinheiro real.";

const TEXTO_DESEMPENHO =
  "Resultados simulados não são promessa nem garantia de desempenho. Operações passadas e dados históricos não garantem resultados futuros.";

/** Aviso de uma linha, pra cabecalho de tela e rodape de cartao. */
export function AvisoSimulacaoLinha({ className = "" }: { className?: string }) {
  return (
    <p
      className={`flex items-start gap-2 font-mono text-[11px] leading-relaxed text-ink-muted ${className}`}
    >
      <FlaskConical size={13} className="mt-px shrink-0 text-gold" aria-hidden />
      {TEXTO_CURTO}
    </p>
  );
}

/** Bloco completo, pra onboarding, perfil e telas de operacao. */
export function AvisoSimulacaoBloco({
  incluirDesempenho = true,
  sobreAzul = false,
}: {
  incluirDesempenho?: boolean;
  sobreAzul?: boolean;
}) {
  const corTexto = sobreAzul ? "text-onblue-muted" : "text-ink-muted";
  const corBorda = sobreAzul ? "border-[var(--rule-inv)]" : "border-[var(--rule)]";

  return (
    <div className={`border-l-[3px] border-gold ${corBorda} pl-4`}>
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-gold">
        Ambiente de simulação
      </p>
      <p className={`mt-2 text-sm leading-relaxed ${corTexto}`}>{TEXTO_COMPLETO}</p>
      {incluirDesempenho && (
        <p className={`mt-2 text-sm leading-relaxed ${corTexto}`}>
          {TEXTO_DESEMPENHO}
        </p>
      )}
    </div>
  );
}

export type OrigemDado = "real" | "atrasado" | "simulado";

/**
 * Selo de origem do numero.
 *
 * A regra que isso resolve: preco vindo da B3 com atraso nao pode
 * aparecer igual a preco em tempo real, e preco inventado pelo motor do
 * laboratorio nao pode aparecer igual a nenhum dos dois. Cada um tem
 * simbolo, cor e palavra propria, entao a distincao sobrevive mesmo pra
 * quem nao enxerga cor.
 */
export function SeloOrigem({
  origem,
  atualizadoEm,
}: {
  origem: OrigemDado;
  atualizadoEm?: string | null;
}) {
  const config = {
    real: {
      Icone: Radio,
      rotulo: "Cotação real",
      cor: "var(--color-teal-texto)",
      titulo: "Preço vindo da bolsa.",
    },
    atrasado: {
      Icone: Clock3,
      rotulo: "Preço atrasado",
      cor: "var(--color-sky-texto)",
      titulo:
        "Preço real da bolsa, porém com atraso. Não use como cotação oficial em tempo real.",
    },
    simulado: {
      Icone: FlaskConical,
      rotulo: "Dado simulado",
      cor: "var(--color-violet-texto)",
      titulo:
        "Número gerado por um modelo educacional. Não corresponde a nenhuma empresa ou cotação real.",
    },
  }[origem];

  const { Icone } = config;

  return (
    <span
      title={config.titulo}
      className="inline-flex items-center gap-1.5 border px-2 py-1 font-mono text-[10px] uppercase tracking-[0.14em]"
      style={{ color: config.cor, borderColor: config.cor }}
    >
      <Icone size={11} aria-hidden />
      {config.rotulo}
      {atualizadoEm && (
        <span className="opacity-70">{horaCurta(atualizadoEm)}</span>
      )}
    </span>
  );
}

function horaCurta(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
