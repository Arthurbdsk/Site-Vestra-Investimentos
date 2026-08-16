export type MensagemChat = { autor: "usuario" | "assistente"; texto: string };

export type ContextoAssistente = {
  apelido: string;
  saldo: number;
  patrimonio: number;
  posicoes: { ticker: string; quantidade: number }[];
};

export type AcaoPedida = {
  ferramenta: "comprar_acao" | "vender_acao" | "criar_ordem_abertura";
  ticker: string;
  quantidade: number;
  tipoOrdem?: "comprar" | "vender";
};

export type RespostaAssistente = {
  texto: string;
  acoesPedidas: AcaoPedida[];
  /** Historico de mensagens (formato Groq/OpenAI) ate aqui, incluindo a
   * resposta do modelo com os tool_calls, pra continuar a conversa depois
   * que as acoes forem executadas de verdade. */
  _mensagens?: unknown[];
  /** Os tool_calls originais (com id), na mesma ordem de acoesPedidas. */
  _toolCalls?: ToolCall[];
};

/** Resultado de uma acao ja executada, pra devolver ao modelo formular a resposta final. */
export type ResultadoAcao = { ferramenta: string; ticker: string; ok: boolean; mensagem: string };

type ToolCall = { id: string; type: "function"; function: { name: string; arguments: string } };

// Groq: chave gratuita, cota bem mais alta que a do Gemini. API
// compativel com o formato da OpenAI (messages/tools/tool_calls).
// O modelo Compound tem busca na web embutida, mas a Groq nao permite
// combinar isso com ferramentas customizadas no mesmo pedido, entao o
// modo "busca" usa Compound (sem executar acoes) e o modo "padrao" usa
// o modelo normal com as ferramentas de comprar/vender/criar ordem.
const MODELO_PADRAO = "llama-3.3-70b-versatile";
const MODELO_BUSCA = "groq/compound-mini";

export type ModoAssistente = "padrao" | "busca";

const INSTRUCAO_SISTEMA_PADRAO = `Você é o assistente do Vestra, um simulador de investimentos educativo brasileiro (dinheiro fictício, ações reais da B3 e dos EUA).
Responda em português, de forma simples e direta, sem economês. Você pode explicar termos financeiros, comentar a carteira da pessoa, dar contexto geral de mercado, executar compra/venda de ações quando a pessoa pedir claramente (ex: "compra 10 PETR4", "vende minhas ações da Tesla"), e também criar uma ordem pra comprar/vender assim que o mercado abrir, se a pessoa pedir isso especificamente (ex: "compra 5 VALE3 quando o mercado abrir", "cria uma ordem de compra pra abertura").
Só chame as ferramentas de comprar/vender/criar ordem quando o pedido for uma instrução clara com ticker e quantidade (ou "todas" pra vender tudo de uma posição). Se faltar informação (não disse quantidade, ticker ambíguo), pergunte antes de agir, não adivinhe.
Nunca dê recomendação de investimento como se fosse certeza ("essa ação vai subir"); fale sempre em termos de possibilidades e trade-offs. Seu conhecimento tem uma data de corte, então não afirme cotações ou notícias muito recentes como certeza.
Respostas curtas: no máximo 3-4 frases, a não ser que a pergunta exija mais detalhe.`;

const INSTRUCAO_SISTEMA_BUSCA = `Você é o assistente do Vestra, um simulador de investimentos educativo brasileiro (dinheiro fictício, ações reais da B3 e dos EUA), respondendo no modo de busca na internet.
Responda em português, de forma simples e direta, sem economês. Use a busca na web pra responder com informação atual (notícia recente, evento, resultado de empresa). Você NÃO executa compra, venda ou ordens neste modo; se a pessoa pedir isso, avise que ela precisa trocar pro modo "Operações".
Nunca dê recomendação de investimento como se fosse certeza ("essa ação vai subir"); fale sempre em termos de possibilidades e trade-offs.
Respostas curtas: no máximo 3-4 frases, a não ser que a pergunta exija mais detalhe.`;

const FERRAMENTAS = [
  {
    type: "function",
    function: {
      name: "comprar_acao",
      description: "Compra uma quantidade de cotas de uma ação, debitando do saldo em caixa.",
      parameters: {
        type: "object",
        properties: {
          ticker: { type: "string", description: "Ticker da ação, ex: PETR4, AAPL" },
          quantidade: { type: "integer", description: "Quantidade de cotas a comprar" },
        },
        required: ["ticker", "quantidade"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "vender_acao",
      description: "Vende uma quantidade de cotas de uma ação que a pessoa já tem na carteira.",
      parameters: {
        type: "object",
        properties: {
          ticker: { type: "string", description: "Ticker da ação" },
          quantidade: { type: "integer", description: "Quantidade de cotas a vender" },
        },
        required: ["ticker", "quantidade"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "criar_ordem_abertura",
      description:
        "Cria uma ordem pendente de compra ou venda que executa pelo preço de mercado assim que o pregão abrir (útil quando o mercado está fechado agora).",
      parameters: {
        type: "object",
        properties: {
          ticker: { type: "string", description: "Ticker da ação" },
          quantidade: { type: "integer", description: "Quantidade de cotas" },
          tipo: { type: "string", enum: ["comprar", "vender"] },
        },
        required: ["ticker", "quantidade", "tipo"],
      },
    },
  },
];

function montarMensagens(
  pergunta: string,
  historico: MensagemChat[],
  ctx: ContextoAssistente,
  modo: ModoAssistente,
) {
  const posicoesTexto =
    ctx.posicoes.map((p) => `${p.ticker} (${p.quantidade} cotas)`).join(", ") || "nenhuma";
  const contextoTexto = `Contexto da pessoa: apelido ${ctx.apelido}, saldo em caixa R$ ${ctx.saldo.toFixed(2)}, patrimônio total R$ ${ctx.patrimonio.toFixed(2)}, posições atuais: ${posicoesTexto}.`;

  return [
    { role: "system", content: modo === "busca" ? INSTRUCAO_SISTEMA_BUSCA : INSTRUCAO_SISTEMA_PADRAO },
    { role: "user", content: contextoTexto },
    { role: "assistant", content: "Entendido, já tenho o contexto da sua carteira." },
    ...historico.map((m) => ({
      role: m.autor === "usuario" ? "user" : "assistant",
      content: m.texto,
    })),
    { role: "user", content: pergunta },
  ];
}

async function chamarGroq(apiKey: string, mensagens: unknown[], modo: ModoAssistente) {
  const resposta = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: modo === "busca" ? MODELO_BUSCA : MODELO_PADRAO,
      messages: mensagens,
      ...(modo === "busca" ? {} : { tools: FERRAMENTAS }),
      max_tokens: 400,
    }),
  });

  if (!resposta.ok) {
    if (resposta.status === 429) {
      throw new Error(
        "O assistente atingiu o limite de uso da IA por agora. Tente de novo em alguns minutos.",
      );
    }
    const corpo = await resposta.text().catch(() => "");
    throw new Error(`Não foi possível falar com o assistente agora (HTTP ${resposta.status}: ${corpo.slice(0, 200)}).`);
  }

  return resposta.json();
}

/**
 * Primeira etapa: manda a pergunta pro modelo. Se ele quiser executar uma
 * acao, devolve as acoes pedidas (sem executar nada aqui: quem chama essa
 * funcao decide se executa e chama finalizarComResultado depois).
 */
export async function responderAssistente(
  pergunta: string,
  historico: MensagemChat[],
  ctx: ContextoAssistente,
  modo: ModoAssistente = "padrao",
): Promise<RespostaAssistente> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("O assistente ainda não foi configurado (falta a chave da Groq).");
  }

  const mensagens = montarMensagens(pergunta, historico, ctx, modo);
  const json = await chamarGroq(apiKey, mensagens, modo);

  const msg = json.choices?.[0]?.message ?? {};
  const toolCalls: ToolCall[] = msg.tool_calls ?? [];

  const chamadas: AcaoPedida[] = toolCalls.map((tc) => {
    let args: Record<string, unknown> = {};
    try {
      args = JSON.parse(tc.function.arguments || "{}");
    } catch {
      args = {};
    }
    return {
      ferramenta: tc.function.name as "comprar_acao" | "vender_acao" | "criar_ordem_abertura",
      ticker: String(args.ticker ?? "").toUpperCase(),
      quantidade: Number(args.quantidade) || 0,
      tipoOrdem: args.tipo as "comprar" | "vender" | undefined,
    };
  });

  const texto = String(msg.content ?? "").trim();

  if (chamadas.length === 0 && !texto) {
    throw new Error("O assistente não retornou uma resposta.");
  }

  return {
    texto,
    acoesPedidas: chamadas,
    _mensagens: [...mensagens, msg],
    _toolCalls: toolCalls,
  };
}

/**
 * Segunda etapa: depois de executar as acoes pedidas de verdade (fora
 * desse arquivo, via comprar()/vender() do operacoes.ts), manda o
 * resultado de volta pro modelo formular a resposta final em portugues.
 * `resultados` esta na MESMA ordem de `toolCalls` (um por chamada).
 */
export async function finalizarComResultado(
  mensagensAnteriores: unknown[],
  toolCalls: ToolCall[],
  resultados: ResultadoAcao[],
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("O assistente ainda não foi configurado (falta a chave da Groq).");
  }

  const mensagensTool = toolCalls.map((tc, i) => ({
    role: "tool",
    tool_call_id: tc.id,
    content: JSON.stringify(resultados[i] ?? { ok: false, mensagem: "Sem resultado." }),
  }));

  const mensagens = [...mensagensAnteriores, ...mensagensTool];

  // So chega aqui quando houve tool_calls, ou seja, sempre modo "padrao".
  const json = await chamarGroq(apiKey, mensagens, "padrao");
  const texto = String(json.choices?.[0]?.message?.content ?? "").trim();

  return texto || resultados.map((r) => r.mensagem).join(" ");
}
