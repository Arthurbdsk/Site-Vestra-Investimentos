import { criarClienteServidor } from "@/lib/supabase/server";
import { buscarDividendos } from "@/lib/dividendos";
import { statusMercado, mercadoDoTicker } from "@/lib/mercadoStatus";

/**
 * Preco de qualquer ticker, por dentro do banco.
 *
 * garantir_cotacao cobre B3, FII, ETF e NYSE/NASDAQ (finnhub + cambio) e
 * ja mantem a cache. A alternativa em TS (precoAtualQualquerTicker) fala
 * so com a brapi, que nao cobre os EUA: com ela, alerta de preco em AAPL
 * ficava ativo pra sempre e ordem limitada de acao americana nunca
 * executava, sem erro nenhum aparecer.
 */
async function precoDoTicker(
  supabase: Awaited<ReturnType<typeof criarClienteServidor>>,
  ticker: string,
): Promise<number | null> {
  const { data, error } = await supabase.rpc("garantir_cotacao", {
    p_ticker: ticker.trim().toUpperCase(),
  });
  if (error || data == null) return null;
  const preco = Number(data);
  return Number.isFinite(preco) && preco > 0 ? preco : null;
}

type OrdemPendente = {
  id: string;
  ticker: string;
  tipo: "comprar" | "vender";
  quantidade: number;
  preco_alvo: number | null;
  executar_na_abertura: boolean;
};

type AlertaPreco = {
  id: string;
  ticker: string;
  direcao: "acima" | "abaixo";
  preco_alvo: number;
};

/**
 * Roda toda vez que a pagina do simulador carrega: executa ordens
 * limitadas cujo preco-alvo ja foi atingido, e credita dividendos novos
 * das acoes que a pessoa tem. Nao ha worker em background (app fica na
 * Vercel), entao "checar sempre que a pessoa entra na pagina" e o jeito
 * simples de manter isso vivo sem infraestrutura extra.
 */
export async function processarPendencias(usuarioId: string): Promise<void> {
  const supabase = await criarClienteServidor();

  await Promise.all([
    processarOrdens(supabase, usuarioId),
    processarDividendos(supabase, usuarioId),
    processarAlertas(supabase, usuarioId),
  ]);

  // A chamada de margem depende do resultado das ordens/dividendos acima
  // (mudam o patrimonio), entao roda depois, nao junto no Promise.all.
  await processarChamadaMargem(supabase, usuarioId);
}

/**
 * Se a divida do emprestimo ja ultrapassou o patrimonio (patrimonio
 * liquido negativo), vende posicoes automaticamente, da maior pra
 * menor, ate cobrir a diferenca, igual uma chamada de margem de
 * verdade. O dinheiro da venda vai direto pra quitar a divida.
 */
async function processarChamadaMargem(
  supabase: Awaited<ReturnType<typeof criarClienteServidor>>,
  usuarioId: string,
) {
  const { data: patrimonioInicial } = await supabase.rpc("patrimonio_de", { p_usuario: usuarioId });
  if (patrimonioInicial === null || Number(patrimonioInicial) >= 0) return;

  const { data: posicoes } = await supabase
    .from("posicoes")
    .select("ticker, quantidade, preco_medio")
    .eq("usuario_id", usuarioId);

  if (!posicoes || posicoes.length === 0) return;

  const { data: cotacoesData } = await supabase
    .from("cotacoes")
    .select("ticker, preco")
    .in("ticker", posicoes.map((p) => p.ticker));
  const precoDe = new Map((cotacoesData ?? []).map((c) => [c.ticker, Number(c.preco)]));

  const ordenadas = [...posicoes].sort((a, b) => {
    const valorA = Number(a.quantidade) * (precoDe.get(a.ticker) ?? Number(a.preco_medio));
    const valorB = Number(b.quantidade) * (precoDe.get(b.ticker) ?? Number(b.preco_medio));
    return valorB - valorA;
  });

  for (const pos of ordenadas) {
    const { data: patrimonioAtual } = await supabase.rpc("patrimonio_de", { p_usuario: usuarioId });
    if (patrimonioAtual !== null && Number(patrimonioAtual) >= 0) break;

    const { error: erroVenda } = await supabase.rpc("vender", {
      p_ticker: pos.ticker,
      p_qtd: Number(pos.quantidade),
    });
    if (erroVenda) continue;

    const { data: perfilAtual } = await supabase.from("perfis").select("saldo").eq("id", usuarioId).single();
    const saldoCaixa = Number(perfilAtual?.saldo ?? 0);
    if (saldoCaixa > 0) {
      await supabase.rpc("pagar_emprestimo", { p_valor: saldoCaixa });
    }
  }
}

async function processarAlertas(
  supabase: Awaited<ReturnType<typeof criarClienteServidor>>,
  usuarioId: string,
) {
  const { data: alertas } = await supabase
    .from("alertas_preco")
    .select("id, ticker, direcao, preco_alvo")
    .eq("usuario_id", usuarioId)
    .eq("status", "ativo");

  if (!alertas || alertas.length === 0) return;

  for (const alerta of alertas as AlertaPreco[]) {
    const preco = await precoDoTicker(supabase, alerta.ticker);
    if (preco === null) continue;

    const precoAlvo = Number(alerta.preco_alvo);
    const atingiu =
      alerta.direcao === "acima" ? preco >= precoAlvo : preco <= precoAlvo;
    if (!atingiu) continue;

    await supabase.rpc("marcar_alerta_disparado", { p_id: alerta.id });
  }
}

async function processarOrdens(
  supabase: Awaited<ReturnType<typeof criarClienteServidor>>,
  usuarioId: string,
) {
  const { data: ordens } = await supabase
    .from("ordens_pendentes")
    .select("id, ticker, tipo, quantidade, preco_alvo, executar_na_abertura")
    .eq("usuario_id", usuarioId)
    .eq("status", "pendente");

  if (!ordens || ordens.length === 0) return;

  const agora = new Date();

  for (const ordem of ordens as OrdemPendente[]) {
    if (ordem.executar_na_abertura) {
      // So executa quando o pregao DAQUELE ticker estiver aberto (B3 e
      // NYSE/NASDAQ tem horarios diferentes), pelo preco de mercado do
      // momento (nao ha preco-alvo pra comparar aqui).
      if (!statusMercado(agora, mercadoDoTicker(ordem.ticker)).aberto) continue;
    } else {
      const preco = await precoDoTicker(supabase, ordem.ticker);
      if (preco === null) continue;

      const precoAlvo = Number(ordem.preco_alvo);
      const atingiu =
        ordem.tipo === "comprar" ? preco <= precoAlvo : preco >= precoAlvo;
      if (!atingiu) continue;
    }

    // O preco de execucao e confirmado de novo dentro do banco
    // (garantir_cotacao), nao pelo que foi lido aqui so pra checar o alvo.
    const { error } = await supabase.rpc(ordem.tipo, {
      p_ticker: ordem.ticker,
      p_qtd: ordem.quantidade,
    });

    // Se falhar (ex: saldo ou cotas insuficientes agora), deixa
    // pendente pra tentar de novo na proxima visita.
    if (!error) {
      await supabase.rpc("marcar_ordem_executada", { p_id: ordem.id });
    }
  }
}

async function processarDividendos(
  supabase: Awaited<ReturnType<typeof criarClienteServidor>>,
  usuarioId: string,
) {
  const { data: posicoes } = await supabase
    .from("posicoes")
    .select("ticker, quantidade")
    .eq("usuario_id", usuarioId);

  if (!posicoes || posicoes.length === 0) return;

  // So credita dividendos pagos depois da primeira compra de cada ativo,
  // senao, ao comprar uma acao que ja pagou dividendo varias vezes na
  // vida real, a pessoa recebe anos de pagamentos "atrasados" de uma vez.
  const { data: primeirasCompras } = await supabase
    .from("transacoes")
    .select("ticker, criado_em")
    .eq("usuario_id", usuarioId)
    .eq("tipo", "compra")
    .order("criado_em", { ascending: true });

  const dataDaPrimeiraCompra = new Map<string, string>();
  for (const t of primeirasCompras ?? []) {
    if (!dataDaPrimeiraCompra.has(t.ticker)) {
      dataDaPrimeiraCompra.set(t.ticker, t.criado_em.slice(0, 10));
    }
  }

  const hoje = new Date().toISOString().slice(0, 10);

  for (const pos of posicoes as { ticker: string; quantidade: number }[]) {
    const desde = dataDaPrimeiraCompra.get(pos.ticker);
    if (!desde) continue;

    const dividendos = await buscarDividendos(pos.ticker);
    for (const d of dividendos) {
      const dataPagamento = d.dataPagamento.slice(0, 10);
      if (dataPagamento > hoje || dataPagamento < desde) continue;

      await supabase.rpc("creditar_dividendo", {
        p_ticker: pos.ticker,
        p_data_pagamento: dataPagamento,
        p_quantidade: pos.quantidade,
        p_rate: d.rate,
      });
      // O unique de dividendos_creditados garante que repetir essa
      // chamada em visitas futuras nao credita de novo.
    }
  }
}
