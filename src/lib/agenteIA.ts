export type DecisaoAgente = {
  ticker: string | null;
  acao: "comprar" | "vender" | "manter";
  quantidade: number;
  justificativa: string;
};

export type ContextoAgente = {
  perfilRisco: "conservador" | "moderado" | "agressivo";
  regraPersonalizada: string | null;
  saldo: number;
  posicoes: { ticker: string; quantidade: number; precoMedio: number; precoAtual: number }[];
  cotacoesDisponiveis: {
    ticker: string;
    nome: string;
    setor: string;
    preco: number;
    variacao: number;
    beta: number | null;
    precoLucro: number | null;
    dividendYield: number | null;
  }[];
};

const LIMITE_POR_PERFIL: Record<ContextoAgente["perfilRisco"], number> = {
  conservador: 0.1,
  moderado: 0.2,
  agressivo: 0.4,
};

// Groq: chave gratuita, cota bem mais alta que a do Gemini. API
// compativel com o formato da OpenAI (messages/tools/tool_calls).
const MODELO = "llama-3.3-70b-versatile";

/**
 * Pede pro modelo decidir UMA operacao (comprar, vender ou manter),
 * usando tool calling (formato OpenAI, servido pela Groq) pra garantir
 * resposta estruturada. E uma decisao simples sobre dados tabulares,
 * nao um raciocinio complexo, entao um modelo rapido e suficiente.
 */
export async function decidirOperacao(ctx: ContextoAgente): Promise<DecisaoAgente> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("O agente ainda não foi configurado (falta a chave da Groq).");
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
    .map((c) => {
      const beta = c.beta != null ? `beta ${c.beta.toFixed(2)}` : "beta indisponível";
      const pl = c.precoLucro != null ? `P/L ${c.precoLucro.toFixed(1)}` : "P/L indisponível";
      const dy = c.dividendYield != null ? `dividend yield ${(c.dividendYield * 100).toFixed(1)}%` : "dividend yield indisponível";
      return `${c.ticker} (${c.nome}, setor ${c.setor}): R$ ${c.preco.toFixed(2)}, variação hoje ${c.variacao.toFixed(2)}%, ${beta}, ${pl}, ${dy}`;
    })
    .join("\n");

  const regraTexto = ctx.regraPersonalizada
    ? `\nRegra própria definida pelo usuário, priorize ela ao decidir (mas nunca ultrapasse o limite de valor por operação): "${ctx.regraPersonalizada}"\n`
    : "";

  const prompt = `Você é um agente de investimentos de um simulador educativo brasileiro (dinheiro fictício, ações reais da B3).

Perfil de risco escolhido pelo usuário: ${ctx.perfilRisco}.
Saldo em caixa disponível: R$ ${ctx.saldo.toFixed(2)}.
Limite máximo por operação, dado esse perfil: R$ ${limiteReais.toFixed(2)} (${limitePct * 100}% do saldo).
${regraTexto}
Carteira atual:
${dadosPosicoes}

Ações disponíveis pra negociar (com fundamentos reais: beta, P/L e dividend yield):
${dadosCotacoes}

Decida UMA única operação: comprar uma ação disponível, vender uma ação que já está na carteira, ou manter (não fazer nada). Respeite o limite de valor por operação. Se decidir manter, quantidade deve ser 0 e ticker pode ficar vazio. Justifique em português, em 1-2 frases curtas, mencionando o dado real que motivou a decisão. Chame sempre a função decidir_operacao com sua decisão.`;

  const resposta = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: MODELO,
      messages: [{ role: "user", content: prompt }],
      tools: [
        {
          type: "function",
          function: {
            name: "decidir_operacao",
            description: "Registra a decisão de investimento do agente.",
            parameters: {
              type: "object",
              properties: {
                ticker: {
                  type: "string",
                  description: "Ticker da ação, vazio se manter",
                },
                acao: { type: "string", enum: ["comprar", "vender", "manter"] },
                quantidade: { type: "integer", description: "Quantidade de cotas, 0 se manter" },
                justificativa: { type: "string" },
              },
              required: ["acao", "quantidade", "justificativa"],
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "decidir_operacao" } },
      max_tokens: 300,
    }),
  });

  if (!resposta.ok) {
    if (resposta.status === 429) {
      throw new Error("O agente atingiu o limite de uso da IA por agora. Tente de novo em alguns minutos.");
    }
    const corpo = await resposta.text().catch(() => "");
    throw new Error(`Não foi possível consultar o agente agora (HTTP ${resposta.status}: ${corpo.slice(0, 200)}).`);
  }

  const json = await resposta.json();
  const toolCalls = json.choices?.[0]?.message?.tool_calls as
    | { function: { name: string; arguments: string } }[]
    | undefined;
  const chamada = toolCalls?.find((tc) => tc.function.name === "decidir_operacao");
  if (!chamada) {
    throw new Error("O agente não retornou uma decisão válida.");
  }

  let args: {
    ticker?: string | null;
    acao: "comprar" | "vender" | "manter";
    quantidade: number;
    justificativa: string;
  };
  try {
    args = JSON.parse(chamada.function.arguments);
  } catch {
    throw new Error("O agente não retornou uma decisão válida.");
  }

  return {
    ticker: args.ticker && args.ticker.trim() ? args.ticker.trim().toUpperCase() : null,
    acao: args.acao,
    quantidade: Number(args.quantidade) || 0,
    justificativa: args.justificativa,
  };
}
