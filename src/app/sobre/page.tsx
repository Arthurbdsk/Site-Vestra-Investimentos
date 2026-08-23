import type { ReactNode } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { usuarioAtual } from "@/lib/supabase/server";

export const metadata = {
  title: "Nossa proposta",
  description:
    "Por que o Vestra existe: um simulador de investimentos com dinheiro fictício e preços reais, pensado pra quem nunca teve acesso fácil a esse conhecimento.",
};

export default async function SobrePage() {
  const user = await usuarioAtual();

  return (
    <>
      <Header logado={!!user} />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
            Nossa proposta
          </p>
          <h1 className="mt-3 font-display text-4xl text-ink">
            Investir não devia ter porteiro
          </h1>
          <p className="mt-4 leading-relaxed text-ink-muted">
            O Vestra é um simulador educacional de investimentos: dinheiro
            fictício, sobre preços reais de ações da B3 e da bolsa americana.
            A ideia é simples, aprender a investir na prática, sem risco
            financeiro e sem precisar já saber os termos antes de começar.
          </p>

          <Secao titulo="Por que existe">
            <p>
              Boa parte do conhecimento sobre investimentos fica concentrada
              com quem já tem dinheiro: livros caros, cursos caros, corretoras
              que assumem que você já sabe o que é um ticker ou uma taxa de
              administração. O Vestra existe pra abrir esse conhecimento pra
              qualquer pessoa, começando do zero, em português simples.
            </p>
          </Secao>

          <Secao titulo="Como funciona">
            <p>
              Ao criar conta, você recebe um saldo fictício e opera com preços
              reais da bolsa. Compra, venda, dividendo, renda fixa, tudo
              calculado com dado de mercado atual, mas sem nenhum valor
              real envolvido. Quem quiser, também pode aprender o vocabulário
              básico na seção Aprender, testar seu perfil de investidor, ou
              disputar um duelo de rentabilidade com outra pessoa.
            </p>
          </Secao>

          <Secao titulo="O que a gente não faz">
            <p>
              O Vestra não dá recomendação de investimento nem consultoria
              financeira. Nenhum conteúdo do site, incluindo o assistente de
              IA e o agente automático, deve ser lido como indicação de compra
              ou venda. É uma ferramenta pra praticar e entender, não pra
              decidir por você.
            </p>
          </Secao>

          <Secao titulo="Como o projeto se sustenta">
            <p>
              O Vestra é gratuito e pode exibir anúncios (Google AdSense) pra
              se manter no ar. Nenhuma parte do simulador, do conteúdo
              educativo ou do ranking depende de pagamento.
            </p>
          </Secao>

          <Secao titulo="Fale com a gente">
            <p>
              Sugestão, crítica ou algo que não fez sentido:{" "}
              <span className="text-ink">contato@vestra-simulator.com.br</span>
              . Antes de perguntar, também vale olhar as{" "}
              <Link
                href="/perguntas-frequentes"
                className="text-blue underline decoration-blue/40 underline-offset-2 hover:decoration-blue"
              >
                Perguntas Frequentes
              </Link>
              .
            </p>
          </Secao>

          <div className="mt-12 border-t border-[var(--rule)] pt-8">
            <Link
              href="/simulador"
              className="inline-block bg-blue px-6 py-3 text-sm font-semibold text-onblue transition-colors hover:bg-blue-deep"
            >
              Testar o simulador
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="font-display text-xl text-ink">{titulo}</h2>
      <div className="mt-3 leading-relaxed text-ink-muted">{children}</div>
    </section>
  );
}
