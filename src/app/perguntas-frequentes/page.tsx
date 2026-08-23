import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { usuarioAtual } from "@/lib/supabase/server";

export const metadata = {
  title: "Perguntas frequentes",
  description:
    "Dinheiro é real? Preciso pagar? Como funciona o duelo? Respostas diretas sobre o simulador de investimentos Vestra.",
};

const PERGUNTAS = [
  {
    pergunta: "O dinheiro do simulador é real?",
    resposta:
      "Não. Todo saldo, compra, venda, dividendo e empréstimo dentro do Vestra é fictício. Os preços das ações é que são reais, vindos da B3 e da bolsa americana.",
  },
  {
    pergunta: "Preciso pagar pra usar?",
    resposta:
      "Não. O Vestra é gratuito e pode exibir anúncios (Google AdSense) pra se manter no ar. Nenhum recurso do simulador fica atrás de pagamento.",
  },
  {
    pergunta: "Se eu perder tudo no simulador, perco dinheiro de verdade?",
    resposta:
      "Não, em nenhuma hipótese. É esse o ponto do simulador: você pode errar, testar estratégia arriscada ou entender na prática o que é uma queda de mercado sem nenhuma consequência financeira real.",
  },
  {
    pergunta: "De onde vêm os preços das ações?",
    resposta:
      "De fontes de mercado externas, atualizadas periodicamente. Pode haver atraso ou instabilidade ocasional, o que está previsto nos Termos de Uso.",
  },
  {
    pergunta: "O que é o perfil de investidor e pra que serve?",
    resposta:
      "É um quiz curto que estima se você tende a ser mais conservador, moderado ou arrojado. Ele é só uma referência educativa dentro do simulador, não define nem limita o que você pode fazer na plataforma.",
  },
  {
    pergunta: "O que é o duelo?",
    resposta:
      "Um desafio entre duas contas: quem faz a carteira fictícia render mais em um período fixo de dias vence. Nenhum valor real entra ou sai, só o placar.",
  },
  {
    pergunta: "O assistente de IA e o agente automático dão dicas de investimento?",
    resposta:
      "As respostas deles são geradas por um modelo de linguagem (Google Gemini) e têm finalidade educacional, não são recomendação de investimento. Quando o agente automático compra ou vende algo, usa sempre o saldo fictício da sua conta, dentro dos mesmos limites do simulador.",
  },
  {
    pergunta: "Meus dados estão seguros?",
    resposta:
      "Guardamos apenas o necessário pra fazer o simulador funcionar (e-mail, apelido e os dados que você gera usando a plataforma). Os detalhes completos estão na Política de Privacidade.",
  },
  {
    pergunta: "Posso usar no celular?",
    resposta:
      "Sim. O site funciona no navegador do celular e também pode ser instalado como aplicativo (PWA), com parte do conteúdo disponível offline.",
  },
  {
    pergunta: "Encontrei um bug ou algo não fez sentido. Como aviso?",
    resposta:
      "Manda um e-mail pra contato@vestra-simulator.com.br contando o que aconteceu. Toda correção ajuda quem vem depois de você.",
  },
];

const JSON_LD_FAQ = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: PERGUNTAS.map((p) => ({
    "@type": "Question",
    name: p.pergunta,
    acceptedAnswer: {
      "@type": "Answer",
      text: p.resposta,
    },
  })),
};

export default async function PerguntasFrequentesPage() {
  const user = await usuarioAtual();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD_FAQ) }}
      />
      <Header logado={!!user} />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink-muted">
            Dúvidas
          </p>
          <h1 className="mt-3 font-display text-4xl text-ink">
            Perguntas frequentes
          </h1>
          <p className="mt-4 leading-relaxed text-ink-muted">
            As respostas mais diretas sobre como o Vestra funciona. Se não
            achar o que procura aqui, veja também{" "}
            <Link
              href="/sobre"
              className="text-blue underline decoration-blue/40 underline-offset-2 hover:decoration-blue"
            >
              Nossa proposta
            </Link>{" "}
            ou escreva pra contato@vestra-simulator.com.br.
          </p>

          <ul className="mt-10 border-t border-[var(--rule)]">
            {PERGUNTAS.map((p, i) => (
              <li key={p.pergunta} className="border-b border-[var(--rule)] py-7">
                <div className="flex gap-5">
                  <span className="mt-1 shrink-0 font-mono text-xs tabular font-semibold text-ink-muted">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h2 className="font-display text-xl leading-snug text-ink">
                      {p.pergunta}
                    </h2>
                    <p className="mt-2 leading-relaxed text-ink-muted">{p.resposta}</p>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </main>
      <Footer />
    </>
  );
}
