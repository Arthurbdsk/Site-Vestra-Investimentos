export type DecisaoAgente = {
  ticker: string | null;
  acao: "comprar" | "vender" | "manter";
  quantidade: number;
  justificativa: string;
};

export type ContextoAgente = {
  perfilRisco: "conservador" | "moderado" | "agressivo";
  saldo: number;
  posicoes: { ticker: string; quantidade: number; precoMedio: number; precoAtual: number }[];
  cotacoesDisponiveis: { ticker: string; nome: string; setor: string; preco: number; variacao: number }[];
};

const LIMITE_POR_PERFIL: Record<ContextoAgente["perfilRisco"], number> = {
  conservador: 0.1,
  moderado: 0.2,
  agressivo: 0.4,
};

/**
 * Pede pro modelo decidir UMA operacao (comprar, vender ou manter),
 * usando tool use pra garantir resposta estruturada. Modelo barato
 * (Haiku) e suficiente: e uma decisao simples sobre dados tabulares,
 * nao um raciocinio complexo.
 */
export async function decidirOperacao(ctx: ContextoAgente): Promise<DecisaoAgente> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("O agente ainda não foi configurado (falta a chave da Anthropic).");
  }

  const limitePct = LIMITE_POR_PERFIL[ctx.perfilRisco];
  const limiteReais = Math.round(ctx.saldo * limitePct * 100) / 100;

  const dadosPosicoes = ctx.posicoes
    .map(
      (p) =>
        `${p.ticker}: ${p.quantidade} cotas, comprou a R$ ${p.precoMedio.toFixed(2)}, vale agora R$ ${p.precoAtual.toFixed(2)}`,
    )
    .join("\n") || "(carteira vazia)";

  const dadosCotacoes = ctx.cotacoesDisponiveis
    .map((c) => `${c.ticker} (${c.nome}, setor ${c.setor}): R$ ${c.preco.toFixed(2)}, variação hoje ${c.variacao.toFixed(2)}%`)
    .join("\n");

  const prompt = `Você é um agente de investimentos de um simulador educativo brasileiro (dinheiro fictício, ações reais da B3).

Perfil de risco escolhido pelo usuário: ${ctx.perfilRisco}.
Saldo em caixa disponível: R$ ${ctx.saldo.toFixed(2)}.
Limite máximo por operação, dado esse perfil: R$ ${limiteReais.toFixed(2)} (${limitePct * 100}% do saldo).

Carteira atual:
${dadosPosicoes}

Ações disponíveis pra negociar:
${dadosCotacoes}

Decida UMA única operação: comprar uma ação disponível, vender uma ação que já está na carteira, ou manter (não fazer nada). Respeite o limite de valor por operação. Se decidir manter, quantidade deve ser 0 e ticker pode ser null. Justifique em português, em 1-2 frases curtas, mencionando o dado real que motivou a decisão.`;

  const resposta = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 400,
      messages: [{ role: "user", content: prompt }],
      tools: [
        {
          name: "decidir_operacao",
          description: "Registra a decisão de investimento do agente.",
          input_schema: {
            type: "object",
            properties: {
              ticker: { type: ["string", "null"], description: "Ticker da ação, ou null se manter" },
              acao: { type: "string", enum: ["comprar", "vender", "manter"] },
              quantidade: { type: "integer", description: "Quantidade de cotas, 0 se manter" },
              justificativa: { type: "string" },
            },
            required: ["acao", "quantidade", "justificativa"],
          },
        },
      ],
      tool_choice: { type: "tool", name: "decidir_operacao" },
    }),
  });

  if (!resposta.ok) {
    const corpo = await resposta.text().catch(() => "");
    throw new Error(`Não foi possível consultar o agente agora (HTTP ${resposta.status}: ${corpo.slice(0, 200)}).`);
  }

  const json = await resposta.json();
  const usoDeFerramenta = json.content?.find((b: { type: string }) => b.type === "tool_use");
  if (!usoDeFerramenta) {
    throw new Error("O agente não retornou uma decisão válida.");
  }

  const entrada = usoDeFerramenta.input as {
    ticker?: string | null;
    acao: "comprar" | "vender" | "manter";
    quantidade: number;
    justificativa: string;
  };

  return {
    ticker: entrada.ticker ?? null,
    acao: entrada.acao,
    quantidade: Number(entrada.quantidade) || 0,
    justificativa: entrada.justificativa,
  };
}
