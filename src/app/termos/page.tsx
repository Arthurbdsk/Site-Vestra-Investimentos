import type { ReactNode } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { usuarioAtual } from "@/lib/supabase/server";

export const metadata = {
  alternates: { canonical: "https://vestra-simulator.com.br/termos" },
  title: "Termos de Uso | Vestra",
  description: "Regras de uso do simulador de investimentos Vestra.",
};

export default async function TermosPage() {
  const user = await usuarioAtual();

  return (
    <>
      <Header logado={!!user} />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
            Última atualização: agosto de 2026
          </p>
          <h1 className="mt-3 font-display text-4xl text-ink">Termos de Uso</h1>
          <p className="mt-4 leading-relaxed text-ink-muted">
            Ao usar o Vestra, você concorda com estes termos. Se algo aqui
            não fizer sentido pra você, pode entrar em contato pelo e-mail
            no final desta página antes de continuar usando a plataforma.
          </p>

          <Secao titulo="1. O que é o Vestra">
            <p>
              O Vestra é um simulador educacional de investimentos.
              Trabalha com dinheiro fictício, sobre preços reais de ações
              da B3 e da NYSE/NASDAQ, com o objetivo de ensinar conceitos
              de investimento na prática, sem risco financeiro real.
            </p>
          </Secao>

          <Secao titulo="2. Nada aqui é dinheiro real nem recomendação de investimento">
            <p>
              Nenhum valor, compra, venda, empréstimo ou rendimento
              dentro do Vestra tem valor monetário real ou pode ser
              convertido em dinheiro. O conteúdo do site, incluindo
              textos explicativos, o assistente de IA e o agente
              automático, tem finalidade exclusivamente educacional e não
              constitui recomendação de investimento, consultoria
              financeira ou qualquer tipo de aconselhamento profissional.
              Decisões de investimento com dinheiro real são de
              responsabilidade exclusiva de quem as toma.
            </p>
          </Secao>

          <Secao titulo="3. Sua conta">
            <p>
              Para usar o simulador é necessário criar uma conta, com e-mail
              e senha ou login do Google. Você é responsável por manter sua
              senha em segurança e por tudo que acontece na sua conta.
            </p>
          </Secao>

          <Secao titulo="4. Uso aceitável">
            <p>
              Você concorda em não tentar burlar as regras do simulador
              (por exemplo, explorar falhas pra gerar saldo fictício
              fora das operações normais), não usar o site pra fins
              ilegais, e não tentar acessar dados de outras contas.
            </p>
          </Secao>

          <Secao titulo="5. Assistente e agente de inteligência artificial">
            <p>
              As respostas do assistente de chat e do agente automático
              são geradas por um modelo de linguagem (Google Gemini) e
              podem conter erros ou informações desatualizadas. Compras,
              vendas e ordens executadas por eles usam sempre o dinheiro
              fictício da sua conta, dentro dos mesmos limites e regras
              do simulador.
            </p>
          </Secao>

          <Secao titulo="6. Publicidade">
            <p>
              O Vestra pode exibir anúncios (Google AdSense) pra manter o
              projeto no ar. Os anúncios são de responsabilidade de
              quem os veicula; o Vestra não endossa produtos ou serviços
              anunciados.
            </p>
          </Secao>

          <Secao titulo="7. Disponibilidade">
            <p>
              O Vestra é oferecido "como está", sem garantia de
              disponibilidade contínua. Preços de ações e cotações vêm de
              fontes externas e podem sofrer atraso ou instabilidade
              ocasional.
            </p>
          </Secao>

          <Secao titulo="8. Mudanças nestes termos">
            <p>
              Podemos atualizar estes termos conforme o Vestra ganha
              novos recursos. A data no topo desta página sempre mostra
              a versão mais recente.
            </p>
          </Secao>

          <Secao titulo="9. Contato">
            <p>
              Dúvidas sobre estes termos: <span className="text-ink">contato@vestra-simulator.com.br</span>.
              Veja também nossa{" "}
              <a
                href="/privacidade"
                className="text-blue underline decoration-blue/40 underline-offset-2 hover:decoration-blue"
              >
                Política de Privacidade
              </a>
              .
            </p>
          </Secao>
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
