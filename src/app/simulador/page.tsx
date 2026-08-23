import { after } from "next/server";
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
import type { RankingLinha, RankingMensalLinha } from "@/components/RankingPainel";
import type { AlertaPreco } from "@/components/AlertasPreco";
import type { Duelo } from "@/components/DuelosPainel";
import type { Agente, DecisaoAgente } from "@/components/AgentePainel";
import type { EstadoEmprestimo } from "./operacoesEmprestimo";
import type { PontoPatrimonio } from "@/components/app/Inicio";
import type { Cotacao } from "@/lib/cotacoes";
import { criarClienteServidor } from "@/lib/supabase/server";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { processarPendencias } from "./processarPendencias";

export const metadata = {
  alternates: { canonical: "https://vestra-simulator.com.br/simulador" },
  title: "Simulador de investimentos",
  description:
    "Monte uma carteira com saldo fictício e preços reais da B3 e da bolsa americana. Compre, venda, ganhe dividendos e acompanhe seu patrimônio dia a dia, sem risco.",
};

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

  // O perfil precisa existir antes de qualquer leitura que dependa dele,
  // entao essa e a unica coisa que roda sozinha antes das demais.
  await supabase.rpc("garantir_perfil");

  // Tudo daqui pra baixo e independente, entao vai junto numa tacada so.
  // Antes eram sete idas e voltas em fila ate o banco; agora e uma.
  const [
    perfilRes,
    posicoesRes,
    transacoesRes,
    cotacoesRes,
    ordensRes,
    rendaFixaRes,
    rankingRes,
    rankingMensalRes,
    favoritosRes,
    duelosRes,
    alertasRes,
    acessoRes,
    emprestimoRes,
    onboardingRes,
    historicoRes,
  ] = await Promise.all([
    supabase
      .from("perfis")
      .select("apelido, saldo, perfil_investidor, quiz_perfil_visto_em")
      .eq("id", user.id)
      .single(),
    supabase.from("posicoes").select("ticker, quantidade, preco_medio").order("ticker"),
    supabase
      .from("transacoes")
      .select("id, ticker, tipo, quantidade, preco, total, imposto, criado_em")
      .order("criado_em", { ascending: false })
      .limit(50),
    // As cotacoes agora vem da tabela que o proprio banco mantem atualizada.
    // Antes eram 16 chamadas HTTP a brapi a cada carregamento da pagina.
    supabase.from("cotacoes").select("ticker, preco, variacao, atualizado_em"),
    supabase
      .from("ordens_pendentes")
      .select("id, ticker, tipo, quantidade, preco_alvo, executar_na_abertura, criado_em")
      .eq("status", "pendente")
      .order("criado_em", { ascending: false }),
    supabase
      .from("investimentos_rf")
      .select("id, tipo, nome, valor_investido, taxa_anual, data_aplicacao")
      .eq("resgatado", false)
      .order("criado_em", { ascending: false }),
    supabase.rpc("ranking", { p_limite: 50 }),
    supabase.rpc("ranking_mensal", { p_limite: 50 }),
    supabase.from("favoritos").select("ticker"),
    supabase.rpc("listar_meus_duelos"),
    supabase
      .from("alertas_preco")
      .select("id, ticker, direcao, preco_alvo, status, visto")
      .in("status", ["ativo", "disparado"])
      .order("criado_em", { ascending: false }),
    supabase.rpc("registrar_acesso"),
    supabase.rpc("obter_emprestimo"),
    // As duas consultas abaixo dependem de coluna e tabela novas. Ficam
    // separadas do select de perfis de proposito: se a migracao ainda nao
    // rodou, so elas falham, e o resto da pagina continua de pe.
    supabase
      .from("perfis")
      .select("onboarding_visto_em")
      .eq("id", user.id)
      .maybeSingle(),
    supabase
      .from("patrimonio_historico")
      .select("dia, valor")
      .order("dia", { ascending: true }),
  ]);

  const [agenteRes, decisoesAgenteRes] = await Promise.all([
    supabase.rpc("obter_agente"),
    supabase.rpc("listar_decisoes_agente", { p_limite: 20 }),
  ]);
  const agente: Agente = agenteRes.data ?? { existe: false };
  const decisoesAgente: DecisaoAgente[] = decisoesAgenteRes.data ?? [];

  const emprestimoDados = emprestimoRes.data as Record<string, number> | null;
  const emprestimo: EstadoEmprestimo | null = emprestimoDados
    ? {
        divida: Number(emprestimoDados.divida ?? 0),
        taxaAnualPct: Number(emprestimoDados.taxaAnualPct ?? 0),
        limite: Number(emprestimoDados.limite ?? 0),
        disponivel: Number(emprestimoDados.disponivel ?? 0),
        patrimonioLiquido: Number(emprestimoDados.patrimonioLiquido ?? 0),
      }
    : null;

  // Ordens limitadas, dividendos e alertas dependem de consultar preco na
  // brapi num laco, o que segurava a pagina por segundos. Agora roda DEPOIS
  // que a resposta ja foi enviada. O efeito aparece na proxima visita.
  after(async () => {
    try {
      await processarPendencias(user.id);
    } catch {
      // Falhar aqui nao pode atrapalhar quem ja recebeu a pagina.
    }

    // Marca o patrimonio do dia, que e o que alimenta o grafico de
    // evolucao. Fica no after junto com o resto: e escrita, ninguem
    // espera por ela, e enquanto a migracao nao rodou isso so falha
    // em silencio e o grafico segue mostrando o estado vazio.
    try {
      await supabase.rpc("registrar_patrimonio_hoje");
    } catch {
      // idem
    }
  });


  const diasSeguidos = Number(acessoRes.data?.diasSeguidos ?? 0);
  const novoDia = Boolean(acessoRes.data?.novoDia);
  const perdaoStreak = Boolean(acessoRes.data?.perdoado);

  const favoritos: string[] = (favoritosRes.data ?? []).map((f) => f.ticker);
  const duelos: Duelo[] = duelosRes.data ?? [];

  const alertas: AlertaPreco[] = (alertasRes.data ?? [])
    .filter((a) => a.status === "ativo" || !a.visto)
    .map((a) => ({
      id: a.id,
      ticker: a.ticker,
      direcao: a.direcao,
      precoAlvo: Number(a.preco_alvo),
      status: a.status,
    }));

  const visitante = user.is_anonymous === true;

  const apelido = visitante
    ? "visitante"
    : (perfilRes.data?.apelido ?? user.email?.split("@")[0] ?? "investidor");

  const saldo = Number(perfilRes.data?.saldo ?? 0);
  // O quiz so aparece pra quem nunca foi perguntado. Quem respondeu OU
  // quem pulou nao ve de novo: antes o "pular" nao gravava nada e o quiz
  // voltava em toda visita.
  const perfilInvestidorDefinido =
    Boolean(perfilRes.data?.perfil_investidor) ||
    Boolean(perfilRes.data?.quiz_perfil_visto_em);

  // Se o quiz vai aparecer agora, ja registra aqui que perguntamos.
  //
  // O popup tambem avisa ao ser fechado, mas isso depende de a pessoa
  // esperar a resposta do servidor: quem clica em "pular" e fecha a aba
  // na hora perde a gravacao, e o quiz voltaria na visita seguinte.
  // Marcando no servidor, ninguem e perguntado duas vezes. Quem quiser
  // responder depois acha o teste em /conta.
  if (!perfilInvestidorDefinido) {
    after(async () => {
      try {
        await supabase.rpc("marcar_quiz_perfil_visto");
      } catch {
        // Nao pode atrapalhar quem ja recebeu a pagina.
      }
    });
  }

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
    precoAlvo: o.preco_alvo != null ? Number(o.preco_alvo) : null,
    executarNaAbertura: Boolean(o.executar_na_abertura),
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

  const ranking: RankingLinha[] = (rankingRes.data ?? []).map(
    (r: { apelido: string; patrimonio: number | string; posicao: number }) => ({
      apelido: r.apelido,
      patrimonio: Number(r.patrimonio),
      posicao: Number(r.posicao),
    }),
  );

  const rankingMensal: RankingMensalLinha[] = (rankingMensalRes.data ?? []).map(
    (r: {
      apelido: string;
      ganho: number | string;
      ganho_pct: number | string;
      posicao: number;
    }) => ({
      apelido: r.apelido,
      ganho: Number(r.ganho),
      ganhoPct: Number(r.ganho_pct),
      posicao: Number(r.posicao),
    }),
  );

  const cotacoes: Cotacao[] = (cotacoesRes.data ?? []).map((c) => ({
    ticker: c.ticker,
    preco: Number(c.preco),
    variacao: Number(c.variacao),
    atualizadoEm: c.atualizado_em,
  }));

  const avisoCotacoes =
    cotacoes.length === 0 ? "Estamos buscando os preços da B3. Atualize em instantes." : null;

  // Falha fechada de proposito: enquanto a coluna nao existir, a consulta
  // devolve erro e ninguem ve o onboarding. Errar pra "nao mostrar" e bem
  // melhor do que errar pra "mostrar em toda visita", que foi exatamente o
  // problema que o quiz de perfil teve.
  const mostrarOnboarding =
    !onboardingRes.error && onboardingRes.data?.onboarding_visto_em == null;

  const historico: PontoPatrimonio[] = (historicoRes.data ?? []).map((p) => ({
    data: p.dia,
    valor: Number(p.valor),
  }));

  // Decidida aqui, e nao no navegador, pra servidor e cliente nunca
  // escreverem saudacoes diferentes. O fuso e fixado em Sao Paulo porque
  // e o horario do publico, independente de onde a maquina esteja.
  const horaSp = Number(
    new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour: "2-digit",
      hour12: false,
    }).format(new Date()),
  );
  const saudacao =
    horaSp < 12 ? "Bom dia" : horaSp < 18 ? "Boa tarde" : "Boa noite";

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
        ranking={ranking}
        rankingMensal={rankingMensal}
        diasSeguidos={diasSeguidos}
        novoDia={novoDia}
        perdaoStreak={perdaoStreak}
        perfilInvestidorDefinido={perfilInvestidorDefinido}
        alertas={alertas}
        favoritos={favoritos}
        duelos={duelos}
        agente={agente}
        decisoesAgente={decisoesAgente}
        emprestimo={emprestimo}
        historico={historico}
        saudacao={saudacao}
        mostrarOnboarding={mostrarOnboarding}
        userId={user.id}
      />
      <Footer />
    </>
  );
}
