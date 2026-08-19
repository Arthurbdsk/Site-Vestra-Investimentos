/**
 * Registro de novidades do Vestra, mostrado na aba "Novidades".
 *
 * Fica separado do blog (lib/blog.ts) de proposito: aqui e sobre o
 * produto mudando, la e conteudo educacional. Ordem mais recente
 * primeiro; cada entrada e um lancamento, nao uma tarefa interna.
 */
export type NotaAtualizacao = {
  data: string;
  titulo: string;
  descricao: string;
};

export const NOTAS_ATUALIZACAO: NotaAtualizacao[] = [
  {
    data: "2026-08-19",
    titulo: "Blog com calculadoras e imagens",
    descricao:
      "Os artigos agora têm calculadoras que você mexe em vez de só ler: juros compostos com gráfico ao vivo, tamanho da sua reserva de emergência, e comparação de poupança contra CDB e Tesouro já com o imposto descontado. Cada artigo também ganhou imagem de capa.",
  },
  {
    data: "2026-08-19",
    titulo: "Oito artigos novos no blog",
    descricao:
      "Reserva de emergência, juros compostos, poupança, inflação e IPCA, perfil de investidor, renda fixa x variável, erros de iniciante e day trade. O blog agora tem 18 artigos.",
  },
  {
    data: "2026-08-19",
    titulo: "Todos os FIIs e ETFs da B3",
    descricao:
      "Antes só dava pra comprar os 10 FIIs e 6 ETFs que a gente explicava. Agora a busca cobre a bolsa inteira: mais de 300 fundos imobiliários e mais de 180 ETFs. Os explicados continuam em destaque como \"Populares\".",
  },
  {
    data: "2026-08-19",
    titulo: "Correções de compra e de avisos de erro",
    descricao:
      "O botão \"Comprar\" ficava travado ao abrir o detalhe de um FII ou ETF, e a ação B3SA3 não podia ser negociada. Alertas de preço e ordens de ações americanas não disparavam. Renda fixa, Planejador e Duelo agora mostram o motivo quando algo falha, em vez de fechar em silêncio.",
  },
  {
    data: "2026-08-17",
    titulo: "Aba de novidades",
    descricao:
      "Esta página: agora dá pra acompanhar por aqui tudo que muda no Vestra, sem precisar adivinhar o que foi ajustado.",
  },
  {
    data: "2026-08-17",
    titulo: "Quatro novos artigos no blog",
    descricao:
      "Fundos Imobiliários (FIIs), ETFs, imposto de renda sobre ações e taxa Selic entraram no blog, com o mesmo formato prático dos artigos anteriores.",
  },
  {
    data: "2026-08-17",
    titulo: "Seletor de mercado sem emoji",
    descricao:
      "Os botões BR, US, FII e ETF em Explorar ações agora usam texto no mesmo estilo visual dos outros filtros do app, em vez de emojis de bandeira e ícones coloridos.",
  },
  {
    data: "2026-08-17",
    titulo: "Aviso de simulação mais limpo",
    descricao:
      "O aviso \"Saldo e operações virtuais, sem valor financeiro\" perdeu o ícone e ficou só com o texto.",
  },
  {
    data: "2026-08-17",
    titulo: "Gráfico de patrimônio mais direto",
    descricao:
      "O gráfico de evolução do patrimônio na tela Início não divide mais em abas de período (1D, 7D, 1M...): agora mostra sempre a curva completa do seu histórico.",
  },
];
