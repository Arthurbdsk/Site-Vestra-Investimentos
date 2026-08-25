import { type Acao, ACOES } from "./acoes";
import { ACOES_USA } from "./acoesUsa";
import { FIIS } from "./fiis";
import { ETFS } from "./etfs";
import type { Periodo } from "./historico";

/**
 * Paginas de "quanto teria rendido R$X em [ativo] nos ultimos N anos".
 *
 * Por que existem: sao paginas de FERRAMENTA, nao de texto. A intencao de
 * quem busca "quanto rendeu 1000 reais em petr4" nao e ler um artigo, e
 * ver o numero, e isso e o tipo de pagina que um resumo de IA na busca
 * nao substitui, porque o resultado precisa ser calculado com dado atual.
 *
 * Cada pagina precisa de conteudo proprio de verdade (numero calculado,
 * grafico, comparacao com CDI e poupanca, e a explicacao daquele ativo
 * especifico). Pagina que so troca o nome do ticker num molde vazio conta
 * como doorway page, e o Google descarta o lote inteiro, por isso a
 * combinacao sai de catalogo curado (que tem texto proprio por ativo), e
 * nao de um produto cartesiano de tudo com tudo.
 */

export type JanelaQuantoRendeu = {
  slug: string;
  label: string;
  labelCurto: string;
  periodo: Periodo;
  anos: number;
};

export const JANELAS: JanelaQuantoRendeu[] = [
  { slug: "1-ano", label: "1 ano", labelCurto: "1 ano", periodo: "1y", anos: 1 },
  { slug: "2-anos", label: "2 anos", labelCurto: "2 anos", periodo: "2y", anos: 2 },
  { slug: "5-anos", label: "5 anos", labelCurto: "5 anos", periodo: "5y", anos: 5 },
];

/** Valores redondos, que e como as pessoas escrevem a busca. */
export const VALORES = [1000, 5000] as const;

/**
 * Valor canonico dessas paginas.
 *
 * Mesmo ativo e mesma janela, mudando so o valor, dao a MESMA pagina
 * multiplicada: o percentual de retorno e identico, o texto do ativo e
 * identico, e todo numero em reais so escala. Medido em producao entre
 * petr4-1000-reais-1-ano e petr4-5000-reais-1-ano: as unicas diferencas
 * eram os seis valores em reais, todos vezes cinco.
 *
 * Entao so o valor principal entra no sitemap, e as outras versoes
 * apontam canonical pra ele. As rotas continuam existindo e respondendo
 * 200, pra nao quebrar link nem indexacao ja existente. A janela, essa
 * sim, gera conteudo diferente de verdade, e continua inteira.
 */
export const VALOR_PRINCIPAL = 1000;

export type CategoriaAtivo = "acao-br" | "acao-us" | "fii" | "etf";

export type AtivoQuantoRendeu = Acao & { categoria: CategoriaAtivo };

/** Catalogo unico, achatado, so com o que tem explicacao escrita. */
export const ATIVOS: AtivoQuantoRendeu[] = [
  ...ACOES.map((a) => ({ ...a, categoria: "acao-br" as CategoriaAtivo })),
  ...ACOES_USA.map((a) => ({ ...a, categoria: "acao-us" as CategoriaAtivo })),
  ...FIIS.map((f) => ({
    ticker: f.ticker,
    nome: f.nome,
    setor: f.tipo,
    explica: f.explica,
    categoria: "fii" as CategoriaAtivo,
  })),
  ...ETFS.map((e) => ({
    ticker: e.ticker,
    nome: e.nome,
    setor: e.indice,
    explica: e.explica,
    categoria: "etf" as CategoriaAtivo,
  })),
];

export type CombinacaoQuantoRendeu = {
  slug: string;
  ativo: AtivoQuantoRendeu;
  valor: number;
  janela: JanelaQuantoRendeu;
};

/** petr4-1000-reais-5-anos */
export function montarSlug(ticker: string, valor: number, janelaSlug: string): string {
  return `${ticker.toLowerCase()}-${valor}-reais-${janelaSlug}`;
}

/**
 * Slug da versao canonica de uma combinacao: mesmo ativo, mesma janela,
 * no valor principal. Pra quem ja esta no valor principal, e ele mesmo.
 */
export function slugCanonico(c: CombinacaoQuantoRendeu): string {
  return montarSlug(c.ativo.ticker, VALOR_PRINCIPAL, c.janela.slug);
}

export function combinacaoPorSlug(slug: string): CombinacaoQuantoRendeu | undefined {
  return TODAS_COMBINACOES.find((c) => c.slug === slug);
}

export const TODAS_COMBINACOES: CombinacaoQuantoRendeu[] = ATIVOS.flatMap((ativo) =>
  VALORES.flatMap((valor) =>
    JANELAS.map((janela) => ({
      slug: montarSlug(ativo.ticker, valor, janela.slug),
      ativo,
      valor,
      janela,
    })),
  ),
);

/**
 * Referencia de renda fixa pra comparar.
 *
 * Numero fixo e declarado como aproximacao de proposito: puxar a Selic
 * historica exata de cada janela exigiria outra fonte de dado, e o papel
 * aqui e dar ordem de grandeza ("ficou acima ou abaixo do CDI?"), nao
 * precisao contabil. A pagina diz isso ao leitor.
 */
export const CDI_ANUAL_APROX = 0.105;
export const POUPANCA_ANUAL_APROX = 0.06;

export function renderRendaFixa(valor: number, anos: number, taxaAnual: number): number {
  return valor * Math.pow(1 + taxaAnual, anos);
}

export function categoriaLabel(c: CategoriaAtivo): string {
  return {
    "acao-br": "Ação da B3",
    "acao-us": "Ação dos EUA",
    fii: "Fundo imobiliário",
    etf: "ETF",
  }[c];
}
