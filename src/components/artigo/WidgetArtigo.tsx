import { CalculadoraJurosCompostos } from "./CalculadoraJurosCompostos";
import { CalculadoraReserva } from "./CalculadoraReserva";
import { ComparadorRendaFixa } from "./ComparadorRendaFixa";

/**
 * Nomes que um artigo pode pedir no corpo. Ficam num tipo fechado pra um
 * nome errado no blog.ts virar erro de build, e nao um espaco vazio no ar.
 */
export type NomeWidget =
  | "juros-compostos"
  | "reserva-emergencia"
  | "comparador-renda-fixa";

export function WidgetArtigo({ nome }: { nome: NomeWidget }) {
  switch (nome) {
    case "juros-compostos":
      return <CalculadoraJurosCompostos />;
    case "reserva-emergencia":
      return <CalculadoraReserva />;
    case "comparador-renda-fixa":
      return <ComparadorRendaFixa />;
  }
}
