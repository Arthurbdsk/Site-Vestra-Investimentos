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

const MODELO = "gemini-2.5-flash";

/**
 * Pede pro modelo decidir UMA operacao (comprar, vender ou manter),
 * usando function calling do Gemini pra garantir resposta estruturada.
 * Modelo Flash (tier gratuito do Google AI Studio) e suficiente: e uma
 * decisao simples sobre dados tabulares, nao um raciocinio complexo.
 */
export async function decidirOperacao(ctx: ContextoAgente): Promise<DecisaoAgente> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("O agente ainda não foi configurado (falta a chave do Gemini).");
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

  const resposta = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        tools: [
          {
            functionDeclarations: [
              {
                name: "decidir_operacao",
                description: "Registra a decisão de investimento do agente.",
                parameters: {
                  type: "OBJECT",
                  properties: {
                    ticker: {
                      type: "STRING",
                      nullable: true,
                      description: "Ticker da ação, vazio se manter",
                    },
                    acao: { type: "STRING", enum: ["comprar", "vender", "manter"] },
                    quantidade: { type: "INTEGER", description: "Quantidade de cotas, 0 se manter" },
                    justificativa: { type: "STRING" },
                  },
                  required: ["acao", "quantidade", "justificativa"],
                },
              },
            ],
          },
        ],
        toolConfig: {
          functionCallingConfig: { mode: "ANY", allowedFunctionNames: ["decidir_operacao"] },
        },
      }),
    },
  );

  if (!resposta.ok) {
    const corpo = await resposta.text().catch(() => "");
    throw new Error(`Não foi possível consultar o agente agora (HTTP ${resposta.status}: ${corpo.slice(0, 200)}).`);
  }

  const json = await resposta.json();
  const partes = json.candidates?.[0]?.content?.parts as { functionCall?: { name: string; args: Record<string, unknown> } }[] | undefined;
  const chamada = partes?.find((p) => p.functionCall)?.functionCall;
  if (!chamada) {
    throw new Error("O agente não retornou uma decisão válida.");
  }

  const args = chamada.args as {
    ticker?: string | null;
    acao: "comprar" | "vender" | "manter";
    quantidade: number;
    justificativa: string;
  };

  return {
    ticker: args.ticker && args.ticker.trim() ? args.ticker.trim().toUpperCase() : null,
    acao: args.acao,
    quantidade: Number(args.quantidade) || 0,
    justificativa: args.justificativa,
  };
}
