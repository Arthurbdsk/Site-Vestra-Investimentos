import type { ReactNode } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { usuarioAtual } from "@/lib/supabase/server";

export const metadata = {
  title: "Política de Privacidade | Vestra",
  description: "Como o Vestra coleta, usa e protege os seus dados.",
};

export default async function PrivacidadePage() {
  const user = await usuarioAtual();

  return (
    <>
      <Header logado={!!user} />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
            Última atualização: agosto de 2026
          </p>
          <h1 className="mt-3 font-display text-4xl text-ink">Política de Privacidade</h1>
          <p className="mt-4 leading-relaxed text-ink-muted">
            O Vestra é um simulador educacional de investimentos: todo o
            dinheiro usado na plataforma é fictício, e nenhuma operação aqui
            movimenta valores reais. Esta página explica quais dados a
            gente coleta pra fazer o simulador funcionar, pra que eles
            servem, e com quem são compartilhados.
          </p>

          <Secao titulo="1. Dados que coletamos">
            <p>
              Ao criar uma conta, guardamos o e-mail e a senha (ou, se você
              entrar com o Google, os dados básicos que o Google
              compartilha, como nome e e-mail) e o apelido que aparece no
              simulador e no ranking. Se você entrar como visitante, nada
              disso é coletado: os dados ficam só no seu navegador.
            </p>
            <p className="mt-3">
              Também guardamos os dados que você gera usando o simulador:
              saldo fictício, posições em ações, ordens, histórico de
              transações, investimentos de renda fixa e as respostas dos
              quizzes de aprendizado. Nada disso representa dinheiro ou
              investimento de verdade.
            </p>
          </Secao>

          <Secao titulo="2. Assistente e agente de inteligência artificial">
            <p>
              Se você usa o assistente de chat ou o agente automático, as
              mensagens que você envia e um resumo da sua carteira
              (saldo, patrimônio, posições) são enviados pra API do
              Gemini, do Google, pra gerar a resposta. Essas mensagens não
              incluem sua senha nem dados de pagamento, porque não
              coletamos dados de pagamento.
            </p>
          </Secao>

          <Secao titulo="3. Cookies e publicidade">
            <p>
              Usamos uma preferência local (tema claro/escuro) guardada no
              seu navegador, que não é compartilhada com ninguém. O
              Vestra pode exibir anúncios via Google AdSense; quando
              ativos, esses anúncios podem usar cookies do Google pra
              mostrar publicidade mais relevante. Você pode gerenciar
              suas preferências de anúncios diretamente nas{" "}
              <a
                href="https://myadcenter.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue underline decoration-blue/40 underline-offset-2 hover:decoration-blue"
              >
                configurações de anúncios do Google
              </a>
              .
            </p>
          </Secao>

          <Secao titulo="4. Com quem compartilhamos dados">
            <p>
              Usamos o Supabase pra autenticação e armazenamento dos dados
              da conta e do simulador, o Google pra login social, o
              assistente de IA (Gemini) e, quando ativos, os anúncios
              (AdSense), e a Vercel pra hospedar o site. Nenhum desses
              parceiros recebe seus dados pra fins diferentes de operar o
              Vestra.
            </p>
          </Secao>

          <Secao titulo="5. Seus direitos">
            <p>
              Você pode pedir acesso, correção ou exclusão dos seus dados
              e da sua conta a qualquer momento, conforme a Lei Geral de
              Proteção de Dados (LGPD). Pra isso, entre em contato pelo
              e-mail abaixo.
            </p>
          </Secao>

          <Secao titulo="6. Retenção de dados">
            <p>
              Mantemos seus dados enquanto sua conta existir. Se você
              pedir a exclusão da conta, apagamos os dados associados a
              ela.
            </p>
          </Secao>

          <Secao titulo="7. Menores de idade">
            <p>
              O Vestra é um ambiente educacional e pode ser usado por
              menores de idade, preferencialmente com orientação de um
              responsável, já que trata de conceitos financeiros.
            </p>
          </Secao>

          <Secao titulo="8. Mudanças nesta política">
            <p>
              Podemos atualizar esta política conforme o Vestra ganha
              novos recursos (como a publicidade). A data no topo desta
              página sempre mostra a versão mais recente.
            </p>
          </Secao>

          <Secao titulo="9. Contato">
            <p>
              Dúvidas sobre privacidade ou pedidos relacionados aos seus
              dados: <span className="text-ink">contato@vestra-simulator.com.br</span>.
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
