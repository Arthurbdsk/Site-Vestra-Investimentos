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
};

/** Resultado de uma acao ja executada, pra devolver ao modelo formular a resposta final. */
export type ResultadoAcao = { ferramenta: string; ticker: string; ok: boolean; mensagem: string };

const MODELO = "gemini-3.5-flash-lite";

const INSTRUCAO_SISTEMA = `Você é o assistente do Vestra, um simulador de investimentos educativo brasileiro (dinheiro fictício, ações reais da B3 e dos EUA).
Responda em português, de forma simples e direta, sem economês. Você pode explicar termos financeiros, comentar a carteira da pessoa, dar contexto geral de mercado, executar compra/venda de ações quando a pessoa pedir claramente (ex: "compra 10 PETR4", "vende minhas ações da Tesla"), e também criar uma ordem pra comprar/vender assim que o mercado abrir, se a pessoa pedir isso especificamente (ex: "compra 5 VALE3 quando o mercado abrir", "cria uma ordem de compra pra abertura").
Você também pode buscar na internet quando a pergunta precisar de informação atual (notícia recente, evento, resultado de empresa, cotação de algo fora do simulador). Use a busca quando fizer sentido, não invente informação que pode estar desatualizada.
Só chame as ferramentas de comprar/vender/criar ordem quando o pedido for uma instrução clara com ticker e quantidade (ou "todas" pra vender tudo de uma posição). Se faltar informação (não disse quantidade, ticker ambíguo), pergunte antes de agir, não adivinhe.
Nunca dê recomendação de investimento como se fosse certeza ("essa ação vai subir"); fale sempre em termos de possibilidades e trade-offs.
Respostas curtas: no máximo 3-4 frases, a não ser que a pergunta exija mais detalhe.`;

const FERRAMENTAS = [
  { google_search: {} },
  {
    functionDeclarations: [
      {
        name: "comprar_acao",
        description: "Compra uma quantidade de cotas de uma ação, debitando do saldo em caixa.",
        parameters: {
          type: "OBJECT",
          properties: {
            ticker: { type: "STRING", description: "Ticker da ação, ex: PETR4, AAPL" },
            quantidade: { type: "INTEGER", description: "Quantidade de cotas a comprar" },
          },
          required: ["ticker", "quantidade"],
        },
      },
      {
        name: "vender_acao",
        description: "Vende uma quantidade de cotas de uma ação que a pessoa já tem na carteira.",
        parameters: {
          type: "OBJECT",
          properties: {
            ticker: { type: "STRING", description: "Ticker da ação" },
            quantidade: { type: "INTEGER", description: "Quantidade de cotas a vender" },
          },
          required: ["ticker", "quantidade"],
        },
      },
      {
        name: "criar_ordem_abertura",
        description: "Cria uma ordem pendente de compra ou venda que executa pelo preço de mercado assim que o pregão abrir (útil quando o mercado está fechado agora).",
        parameters: {
          type: "OBJECT",
          properties: {
            ticker: { type: "STRING", description: "Ticker da ação" },
            quantidade: { type: "INTEGER", description: "Quantidade de cotas" },
            tipo: { type: "STRING", enum: ["comprar", "vender"] },
          },
          required: ["ticker", "quantidade", "tipo"],
        },
      },
    ],
  },
];

function montarContents(pergunta: string, historico: MensagemChat[], ctx: ContextoAssistente) {
  const posicoesTexto =
    ctx.posicoes.map((p) => `${p.ticker} (${p.quantidade} cotas)`).join(", ") || "nenhuma";
  const contextoTexto = `Contexto da pessoa: apelido ${ctx.apelido}, saldo em caixa R$ ${ctx.saldo.toFixed(2)}, patrimônio total R$ ${ctx.patrimonio.toFixed(2)}, posições atuais: ${posicoesTexto}.`;

  return [
    { role: "user", parts: [{ text: contextoTexto }] },
    { role: "model", parts: [{ text: "Entendido, já tenho o contexto da sua carteira." }] },
    ...historico.map((m) => ({
      role: m.autor === "usuario" ? "user" : "model",
      parts: [{ text: m.texto }],
    })),
    { role: "user", parts: [{ text: pergunta }] },
  ];
}

async function chamarGemini(apiKey: string, contents: unknown[]) {
  const resposta = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: INSTRUCAO_SISTEMA }] },
        tools: FERRAMENTAS,
        generationConfig: { maxOutputTokens: 400 },
      }),
    },
  );

  if (!resposta.ok) {
    const corpo = await resposta.text().catch(() => "");
    throw new Error(`Não foi possível falar com o assistente agora (HTTP ${resposta.status}: ${corpo.slice(0, 200)}).`);
  }

  return resposta.json();
}

/**
 * Primeira etapa: manda a pergunta pro modelo. Se ele quiser executar uma
 * acao, devolve as acoes pedidas (sem executar nada aqui: quem chama essa
 * funcao decide se executa e chama continuarComResultado depois).
 */
export async function responderAssistente(
  pergunta: string,
  historico: MensagemChat[],
  ctx: ContextoAssistente,
): Promise<RespostaAssistente & { _contents?: unknown[] }> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("O assistente ainda não foi configurado (falta a chave do Gemini).");
  }

  const contents = montarContents(pergunta, historico, ctx);
  const json = await chamarGemini(apiKey, contents);

  const partes = json.candidates?.[0]?.content?.parts ?? [];
  const chamadas: AcaoPedida[] = partes
    .filter((p: { functionCall?: unknown }) => p.functionCall)
    .map((p: { functionCall: { name: string; args: Record<string, unknown> } }) => ({
      ferramenta: p.functionCall.name as "comprar_acao" | "vender_acao" | "criar_ordem_abertura",
      ticker: String(p.functionCall.args.ticker ?? "").toUpperCase(),
      quantidade: Number(p.functionCall.args.quantidade) || 0,
      tipoOrdem: p.functionCall.args.tipo as "comprar" | "vender" | undefined,
    }));

  const texto = partes.map((p: { text?: string }) => p.text ?? "").join("").trim();

  if (chamadas.length === 0 && !texto) {
    throw new Error("O assistente não retornou uma resposta.");
  }

  return { texto, acoesPedidas: chamadas, _contents: contents };
}

/**
 * Segunda etapa: depois de executar as acoes pedidas de verdade (fora
 * desse arquivo, via comprar()/vender() do operacoes.ts), manda o
 * resultado de volta pro modelo formular a resposta final em portugues.
 */
export async function finalizarComResultado(
  contentsAnteriores: unknown[],
  chamadasOriginais: { name: string; args: Record<string, unknown> }[],
  resultados: ResultadoAcao[],
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("O assistente ainda não foi configurado (falta a chave do Gemini).");
  }

  const contents = [
    ...contentsAnteriores,
    {
      role: "model",
      parts: chamadasOriginais.map((c) => ({ functionCall: c })),
    },
    {
      role: "function",
      parts: resultados.map((r) => ({
        functionResponse: {
          name: r.ferramenta,
          response: { ok: r.ok, mensagem: r.mensagem, ticker: r.ticker },
        },
      })),
    },
  ];

  const json = await chamarGemini(apiKey, contents);
  const partes = json.candidates?.[0]?.content?.parts ?? [];
  const texto = partes.map((p: { text?: string }) => p.text ?? "").join("").trim();

  return texto || resultados.map((r) => r.mensagem).join(" ");
}
