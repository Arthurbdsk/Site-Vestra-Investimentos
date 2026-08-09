"use server";

import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/server";
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

  if (!Number.isInteger(quantidade) || quantidade <= 0) {
    return { ok: false, mensagem: "Escolha uma quantidade de pelo menos 1 cota." };
  }

  // O preco NAO e enviado daqui, de proposito. Antes ele ia como
  // parametro, e dava pra falar direto com o banco pedindo PETR4 por um
  // centavo (testado, funcionava). Agora o proprio banco busca o preco
  // na fonte, entao nao existe valor vindo de fora pra falsificar.
  // Isso tambem evita buscar a cotacao duas vezes na mesma operacao.
  const { data, error } = await supabase.rpc(operacao, {
    p_ticker: ticker,
    p_qtd: quantidade,
  });

  if (error) {
    return { ok: false, mensagem: limparErro(error.message) };
  }

  revalidatePath("/simulador");

  const preco = Number((data as { preco?: number } | null)?.preco ?? 0);
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
