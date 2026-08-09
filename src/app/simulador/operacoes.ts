"use server";

import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/server";
import { precoAtualQualquerTicker } from "@/lib/cotacoes";
import { assinarPreco } from "@/lib/assinaturaPreco";
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

  // O preco vem da fonte, no servidor. O navegador nunca decide o valor.
  // Um ticker invalido tambem cai aqui, ja que a busca simplesmente falha.
  const preco = await precoAtualQualquerTicker(ticker);
  if (preco === null) {
    return {
      ok: false,
      mensagem: "Não consegui confirmar o preço dessa ação agora. Tente de novo em instantes.",
    };
  }

  // Assinamos o preco pra fechar uma brecha real: chamar esse RPC direto
  // (por fora do site, com o proprio token de sessao do usuario) permitia
  // mandar qualquer p_preco. O banco recalcula essa assinatura com o mesmo
  // segredo e rejeita se nao bater ou se a cotacao ja tiver expirado.
  const assinada = assinarPreco(ticker, preco);

  const { error } = await supabase.rpc(operacao, {
    p_ticker: ticker,
    p_qtd: quantidade,
    p_preco_texto: assinada.precoTexto,
    p_expira_em: assinada.expiraEm,
    p_assinatura: assinada.assinatura,
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
