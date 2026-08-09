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

  // O preco e descoberto inteiramente dentro do banco (garantir_cotacao),
  // a partir de uma cache atualizada direto na B3. O navegador nunca
  // decide o valor, nem manda ele pra RPC — fecha a brecha de preco
  // forjado por chamada direta a funcao.
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
  const imposto = Number((data as { imposto?: number } | null)?.imposto ?? 0);

  if (operacao === "vender" && imposto > 0) {
    const liquido = brl(Number((data as { liquido?: number }).liquido));
    return {
      ok: true,
      mensagem: `Venda feita: ${cotas} de ${ticker} por ${total}. Imposto de renda de ${brl(imposto)} retido (lucro tributável); você recebeu ${liquido} líquido.`,
    };
  }

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

export async function criarOrdemLimitada(
  tipo: "comprar" | "vender",
  ticker: string,
  quantidade: number,
  precoAlvo: number,
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
  if (!Number.isFinite(precoAlvo) || precoAlvo <= 0) {
    return { ok: false, mensagem: "Escolha um preço-alvo válido." };
  }

  const { error } = await supabase.rpc("criar_ordem_limitada", {
    p_ticker: ticker,
    p_tipo: tipo,
    p_qtd: quantidade,
    p_preco_alvo: precoAlvo,
  });

  if (error) {
    return { ok: false, mensagem: limparErro(error.message) };
  }

  revalidatePath("/simulador");

  return {
    ok: true,
    mensagem: `Ordem criada: ${tipo === "comprar" ? "comprar" : "vender"} ${quantidade} ${quantidade === 1 ? "cota" : "cotas"} de ${ticker} quando o preço ${tipo === "comprar" ? "cair para" : "subir para"} ${brl(precoAlvo)}.`,
  };
}

export async function cancelarOrdemLimitada(id: string): Promise<Resultado> {
  const supabase = await criarClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, mensagem: "Sua sessão expirou. Entre de novo pra continuar." };
  }

  const { error } = await supabase.rpc("cancelar_ordem_limitada", { p_id: id });

  if (error) {
    return { ok: false, mensagem: limparErro(error.message) };
  }

  revalidatePath("/simulador");
  return { ok: true, mensagem: "Ordem cancelada." };
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
