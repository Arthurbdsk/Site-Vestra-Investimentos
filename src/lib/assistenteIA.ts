export type MensagemChat = { autor: "usuario" | "assistente"; texto: string };

export type ContextoAssistente = {
  apelido: string;
  saldo: number;
  patrimonio: number;
  posicoes: { ticker: string; quantidade: number }[];
};

const MODELO = "gemini-3.5-flash-lite";

const INSTRUCAO_SISTEMA = `Você é o assistente do Vestra, um simulador de investimentos educativo brasileiro (dinheiro fictício, ações reais da B3 e dos EUA).
Responda em português, de forma simples e direta, sem economês. Você pode explicar termos financeiros, comentar a carteira da pessoa e dar contexto geral de mercado.
Você NÃO executa nenhuma operação (não compra, não vende, não configura nada), só conversa e explica. Se pedirem pra você comprar/vender algo, explique que isso precisa ser feito na tela do simulador ou pelo Agente de investimento, não pelo chat.
Nunca dê recomendação de investimento como se fosse certeza ("essa ação vai subir"); fale sempre em termos de possibilidades e trade-offs.
Respostas curtas: no máximo 3-4 frases, a não ser que a pergunta exija mais detalhe.`;

/** Conversa com o assistente, com o contexto da carteira da pessoa. */
export async function responderAssistente(
  pergunta: string,
  historico: MensagemChat[],
  ctx: ContextoAssistente,
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("O assistente ainda não foi configurado (falta a chave do Gemini).");
  }

  const posicoesTexto =
    ctx.posicoes.map((p) => `${p.ticker} (${p.quantidade} cotas)`).join(", ") || "nenhuma";

  const contextoTexto = `Contexto da pessoa: apelido ${ctx.apelido}, saldo em caixa R$ ${ctx.saldo.toFixed(2)}, patrimônio total R$ ${ctx.patrimonio.toFixed(2)}, posições atuais: ${posicoesTexto}.`;

  const contents = [
    { role: "user", parts: [{ text: contextoTexto }] },
    { role: "model", parts: [{ text: "Entendido, já tenho o contexto da sua carteira." }] },
    ...historico.map((m) => ({
      role: m.autor === "usuario" ? "user" : "model",
      parts: [{ text: m.texto }],
    })),
    { role: "user", parts: [{ text: pergunta }] },
  ];

  const resposta = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODELO}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: INSTRUCAO_SISTEMA }] },
        generationConfig: { maxOutputTokens: 400 },
      }),
    },
  );

  if (!resposta.ok) {
    const corpo = await resposta.text().catch(() => "");
    throw new Error(`Não foi possível falar com o assistente agora (HTTP ${resposta.status}: ${corpo.slice(0, 200)}).`);
  }

  const json = await resposta.json();
  const texto = json.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("");

  if (!texto) {
    throw new Error("O assistente não retornou uma resposta.");
  }

  return texto.trim();
}
