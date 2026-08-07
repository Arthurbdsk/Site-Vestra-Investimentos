"use server";

import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/server";
import { precoAtual } from "@/lib/cotacoes";
import { acaoPorTicker } from "@/lib/acoes";
import { brl } from "@/lib/formato";

export type Resultado =
  | { ok: true; mensagem: string }
  | { ok: false; mensagem: string };

async function executar(
  operacao: "comprar" | "vender",
  ticker: string,
  quantidade: number,
): Promise<Resultado> {
  const supabase = await criarClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, mensagem: "Sua sessão expirou. Entre de novo pra continuar." };
  }

  if (!acaoPorTicker(ticker)) {
    return { ok: false, mensagem: "Essa ação não está disponível no simulador." };
  }

  if (!Number.isInteger(quantidade) || quantidade <= 0) {
    return { ok: false, mensagem: "Escolha uma quantidade de pelo menos 1 cota." };
  }

  // O preco vem da fonte, no servidor. O navegador nunca decide o valor.
  const preco = await precoAtual(ticker);
  if (preco === null) {
    return {
      ok: false,
      mensagem: "Não consegui confirmar o preço agora. Tente de novo em instantes.",
    };
  }

  const { error } = await supabase.rpc(operacao, {
    p_ticker: ticker,
    p_qtd: quantidade,
    p_preco: preco,
  });

  if (error) {
    return { ok: false, mensagem: limparErro(error.message) };
  }

  revalidatePath("/simulador");

  const total = brl(preco * quantidade);
  const cotas = quantidade === 1 ? "1 cota" : `${quantidade} cotas`;

  return {
    ok: true,
    mensagem:
      operacao === "comprar"
        ? `Compra feita: ${cotas} de ${ticker} por ${total}.`
        : `Venda feita: ${cotas} de ${ticker} por ${total}.`,
  };
}

export async function comprar(ticker: string, quantidade: number) {
  return executar("comprar", ticker, quantidade);
}

export async function vender(ticker: string, quantidade: number) {
  return executar("vender", ticker, quantidade);
}

/** As mensagens do banco ja vem em portugues; aqui so tiramos o ruido tecnico. */
function limparErro(msg: string): string {
  const limpa = msg.replace(/^.*?(?:ERROR|error):\s*/i, "").trim();
  if (/saldo insuficiente/i.test(limpa)) {
    return limpa.replace(/(\d+)\.(\d{2})/g, "$1,$2");
  }
  if (/row-level security|permission denied/i.test(limpa)) {
    return "Sua sessão expirou. Entre de novo pra continuar.";
  }
  return limpa || "Não foi possível concluir a operação.";
}
