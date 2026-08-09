import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ConviteEntrar } from "@/components/ConviteEntrar";
import { AvisoConfiguracao } from "@/components/AvisoConfiguracao";
import {
  PainelSimulador,
  type Posicao,
  type Transacao,
  type OrdemPendente,
} from "@/components/PainelSimulador";
import type { PosicaoRendaFixa } from "@/components/RendaFixaPainel";
import { criarClienteServidor } from "@/lib/supabase/server";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { buscarCotacoes } from "@/lib/cotacoes";
import { processarPendencias } from "./processarPendencias";

export const dynamic = "force-dynamic";

export default async function SimuladorPage() {
  if (!supabaseConfigurado()) {
    return (
      <>
        <Header />
        <AvisoConfiguracao />
        <Footer />
      </>
    );
  }

  const supabase = await criarClienteServidor();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <>
        <Header />
        <ConviteEntrar />
        <Footer />
      </>
    );
  }

  // Executa ordens limitadas que atingiram o preco-alvo, e credita
  // dividendos novos, antes de buscar o estado atual da carteira.
  await processarPendencias(user.id);

  const [perfilRes, posicoesRes, transacoesRes, cotacoesRes, ordensRes, rendaFixaRes] =
    await Promise.all([
      supabase.from("perfis").select("apelido, saldo").eq("id", user.id).single(),
      supabase
        .from("posicoes")
        .select("ticker, quantidade, preco_medio")
        .order("ticker"),
      supabase
        .from("transacoes")
        .select("id, ticker, tipo, quantidade, preco, total, imposto, criado_em")
        .order("criado_em", { ascending: false })
        .limit(50),
      buscarCotacoes(),
      supabase
        .from("ordens_pendentes")
        .select("id, ticker, tipo, quantidade, preco_alvo, criado_em")
        .eq("status", "pendente")
        .order("criado_em", { ascending: false }),
      supabase
        .from("investimentos_rf")
        .select("id, tipo, nome, valor_investido, taxa_anual, data_aplicacao")
        .eq("resgatado", false)
        .order("criado_em", { ascending: false }),
    ]);

  const visitante = user.is_anonymous === true;

  const apelido = visitante
    ? "visitante"
    : (perfilRes.data?.apelido ?? user.email?.split("@")[0] ?? "investidor");

  const saldo = Number(perfilRes.data?.saldo ?? 0);

  const posicoes: Posicao[] = (posicoesRes.data ?? []).map((p) => ({
    ticker: p.ticker,
    quantidade: Number(p.quantidade),
    preco_medio: Number(p.preco_medio),
  }));

  const transacoes: Transacao[] = (transacoesRes.data ?? []).map((t) => ({
    id: t.id,
    ticker: t.ticker,
    tipo: t.tipo,
    quantidade: Number(t.quantidade),
    preco: Number(t.preco),
    total: Number(t.total),
    imposto: Number(t.imposto ?? 0),
    criado_em: t.criado_em,
  }));

  const ordensPendentes: OrdemPendente[] = (ordensRes.data ?? []).map((o) => ({
    id: o.id,
    ticker: o.ticker,
    tipo: o.tipo,
    quantidade: Number(o.quantidade),
    precoAlvo: Number(o.preco_alvo),
    criadoEm: o.criado_em,
  }));

  const posicoesRendaFixa: PosicaoRendaFixa[] = (rendaFixaRes.data ?? []).map((p) => ({
    id: p.id,
    tipo: p.tipo,
    nome: p.nome,
    valorInvestido: Number(p.valor_investido),
    taxaAnual: Number(p.taxa_anual),
    dataAplicacao: p.data_aplicacao,
  }));

  const cotacoes = cotacoesRes.ok ? cotacoesRes.cotacoes : [];
  const avisoCotacoes = cotacoesRes.ok
    ? cotacoesRes.doCache
      ? "Os preços vêm da B3 com alguns minutos de atraso, o que é normal em dados gratuitos."
      : null
    : cotacoesRes.mensagem;

  return (
    <>
      <Header logado />
      <PainelSimulador
        apelido={apelido}
        saldo={saldo}
        posicoes={posicoes}
        transacoes={transacoes}
        cotacoes={cotacoes}
        avisoCotacoes={avisoCotacoes}
        visitante={visitante}
        ordensPendentes={ordensPendentes}
        posicoesRendaFixa={posicoesRendaFixa}
      />
      <Footer />
    </>
  );
}
