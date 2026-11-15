"use server";

import { revalidatePath } from "next/cache";
import { criarClienteServidor } from "@/lib/supabase/server";
import { brl } from "@/lib/formato";
import {
  normalizarDominio,
  validarNovaCompeticao,
  validarOrdem,
  TESE_MAXIMA,
} from "@/lib/challenge";

export type ResultadoChallenge =
  | { ok: true; mensagem: string; codigo?: string }
  | { ok: false; mensagem: string };

type ErroRpc = { code?: string; message?: string } | null;

/**
 * As funcoes do banco levantam erros com mensagem pronta pra pessoa ler
 * (codigo P0001, o padrao do `raise exception`). Qualquer outro codigo e
 * erro tecnico, que nao deve vazar pra tela.
 */
function mensagemDoErro(erro: ErroRpc, generica: string): string {
  if (erro?.code === "P0001" && erro.message) return erro.message;
  return generica;
}

async function exigirSessao() {
  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function criarCompeticao(dados: {
  nome: string;
  inicioIso: string;
  fimIso: string;
  capital: number;
  dominioEmail: string;
  teseObrigatoria: boolean;
}): Promise<ResultadoChallenge> {
  const { supabase, user } = await exigirSessao();
  if (!user) return { ok: false, mensagem: "Sua sessão expirou. Entre de novo pra continuar." };

  const inicio = new Date(dados.inicioIso);
  const fim = new Date(dados.fimIso);
  const erro = validarNovaCompeticao({ ...dados, inicio, fim });
  if (erro) return { ok: false, mensagem: erro };

  const { data, error } = await supabase.rpc("criar_competicao", {
    p_nome: dados.nome.trim(),
    p_inicio: inicio.toISOString(),
    p_fim: fim.toISOString(),
    p_capital: dados.capital,
    p_dominio_email: normalizarDominio(dados.dominioEmail),
    p_tese_obrigatoria: dados.teseObrigatoria,
  });
  if (error) {
    return { ok: false, mensagem: mensagemDoErro(error, "Não foi possível criar a competição.") };
  }

  revalidatePath("/challenge");
  return {
    ok: true,
    mensagem: "Competição criada. Compartilhe o link com os participantes.",
    codigo: (data as { codigo?: string } | null)?.codigo,
  };
}

export async function entrarCompeticao(codigo: string): Promise<ResultadoChallenge> {
  const { supabase, user } = await exigirSessao();
  if (!user) return { ok: false, mensagem: "Entre na sua conta para participar." };

  const limpo = codigo.trim().toUpperCase();
  if (!/^[A-Z0-9]{6}$/.test(limpo)) return { ok: false, mensagem: "Código inválido." };

  const { error } = await supabase.rpc("entrar_competicao", { p_codigo: limpo });
  if (error) {
    return { ok: false, mensagem: mensagemDoErro(error, "Não foi possível entrar na competição.") };
  }

  revalidatePath("/challenge");
  revalidatePath(`/challenge/${limpo}`);
  return { ok: true, mensagem: "Inscrição feita. Boa competição!", codigo: limpo };
}

export async function operarCompeticao(dados: {
  codigo: string;
  tipo: "compra" | "venda";
  ticker: string;
  quantidade: number;
  tese: string;
  teseObrigatoria: boolean;
}): Promise<ResultadoChallenge> {
  const { supabase, user } = await exigirSessao();
  if (!user) return { ok: false, mensagem: "Sua sessão expirou. Entre de novo pra continuar." };

  if (dados.tipo !== "compra" && dados.tipo !== "venda") {
    return { ok: false, mensagem: "Tipo de ordem inválido." };
  }
  const erro = validarOrdem(dados);
  if (erro) return { ok: false, mensagem: erro };

  const ticker = dados.ticker.trim().toUpperCase();
  const codigo = dados.codigo.trim().toUpperCase();

  // O preco e decidido dentro do banco (garantir_cotacao). O navegador
  // so diz o que quer operar, nunca por quanto.
  const { data, error } = await supabase.rpc("operar_competicao", {
    p_codigo: codigo,
    p_tipo: dados.tipo,
    p_ticker: ticker,
    p_qtd: dados.quantidade,
    p_tese: dados.tese.trim().slice(0, TESE_MAXIMA) || null,
  });
  if (error) {
    return { ok: false, mensagem: mensagemDoErro(error, "Não foi possível executar a ordem.") };
  }

  revalidatePath(`/challenge/${codigo}`);
  const total = Number((data as { total?: number } | null)?.total ?? 0);
  const cotas = dados.quantidade === 1 ? "1 cota" : `${dados.quantidade} cotas`;
  return {
    ok: true,
    mensagem: `${dados.tipo === "compra" ? "Compra" : "Venda"} executada: ${cotas} de ${ticker} por ${brl(total)}.`,
  };
}
