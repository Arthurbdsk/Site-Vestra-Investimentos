import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PainelConta } from "@/components/PainelConta";
import { criarClienteServidor } from "@/lib/supabase/server";
import { supabaseConfigurado } from "@/lib/supabase/config";
import { calcularConquistas } from "@/lib/conquistas";
import type { PerfilId } from "@/lib/perfilInvestidor";

export const metadata = {
  title: "Minha conta",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function ContaPage() {
  if (!supabaseConfigurado()) redirect("/simulador");

  const supabase = await criarClienteServidor();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  await supabase.rpc("garantir_perfil");

  const [perfilRes, posicoesRes, transacoesRes, cotacoesRes, rendaFixaRes, acessoRes] =
    await Promise.all([
      supabase
        .from("perfis")
        .select(
          "apelido, saldo, perfil_investidor, criado_em, convites_bem_sucedidos, codigo_publico, perfil_publico, receber_resumo",
        )
        .eq("id", user.id)
        .single(),
      supabase.from("posicoes").select("ticker, quantidade, preco_medio"),
      supabase.from("transacoes").select("tipo").limit(500),
      supabase.from("cotacoes").select("ticker, preco"),
      supabase
        .from("investimentos_rf")
        .select("id")
        .eq("resgatado", false)
        .limit(1),
      supabase.rpc("registrar_acesso"),
    ]);

  const visitante = user.is_anonymous === true;
  const apelido =
    perfilRes.data?.apelido ?? user.email?.split("@")[0] ?? "investidor";
  const saldo = Number(perfilRes.data?.saldo ?? 0);

  const precoDe = new Map(
    (cotacoesRes.data ?? []).map((c) => [c.ticker, Number(c.preco)]),
  );

  const posicoes = posicoesRes.data ?? [];
  const valorEmAcoes = posicoes.reduce(
    (s, p) =>
      s + Number(p.quantidade) * (precoDe.get(p.ticker) ?? Number(p.preco_medio)),
    0,
  );

  const tipos = (transacoesRes.data ?? []).map((t) => t.tipo);
  const diasSeguidos = Number(acessoRes.data?.diasSeguidos ?? 0);

  const conquistas = calcularConquistas({
    temCompra: tipos.includes("compra"),
    temVenda: tipos.includes("venda"),
    temDividendo: tipos.includes("dividendo"),
    tickersDistintos: new Set(posicoes.map((p) => p.ticker)).size,
    temRendaFixa: (rendaFixaRes.data ?? []).length > 0,
    diasSeguidos,
    patrimonio: saldo + valorEmAcoes,
    convitesBemSucedidos: Number(perfilRes.data?.convites_bem_sucedidos ?? 0),
  });

  const membroDesde = perfilRes.data?.criado_em
    ? new Date(perfilRes.data.criado_em).toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <>
      <Header logado />
      <PainelConta
        apelido={apelido}
        email={visitante ? null : (user.email ?? null)}
        visitante={visitante}
        perfilId={(perfilRes.data?.perfil_investidor as PerfilId | null) ?? null}
        conquistas={conquistas}
        patrimonio={saldo + valorEmAcoes}
        diasSeguidos={diasSeguidos}
        membroDesde={membroDesde}
        codigoPublico={perfilRes.data?.codigo_publico ?? null}
        perfilPublico={perfilRes.data?.perfil_publico ?? true}
        receberResumo={perfilRes.data?.receber_resumo ?? true}
      />
      <Footer />
    </>
  );
}
