import Link from "next/link";
import { Trophy, Users, ArrowRight } from "lucide-react";

/**
 * Aba "Competicoes" do simulador. Substitui a antiga aba de Ligas: as
 * competicoes tem tela propria (/challenge e /competicoes), aqui fica so
 * o atalho pra elas.
 */
export function CompeticoesAtalho() {
  const cartoes = [
    {
      href: "/challenge",
      icone: Trophy,
      titulo: "Vestra Challenge",
      texto: "A competição oficial do Vestra. Mesmo capital para todos e pódio registrado.",
      destaque: true,
    },
    {
      href: "/competicoes",
      icone: Users,
      titulo: "Competições da comunidade",
      texto: "Crie a da sua turma ou grupo, entre com um código e veja as suas.",
      destaque: false,
    },
  ];

  return (
    <div>
      <h2 className="font-display text-2xl text-ink">Competições</h2>
      <p className="mt-2 max-w-xl leading-relaxed text-ink-muted">
        Cada competição tem uma carteira própria, separada desta. O que você
        faz lá não mexe no seu saldo aqui.
      </p>
      <div className="mt-8 grid gap-px bg-[var(--rule)] sm:grid-cols-2">
        {cartoes.map(({ href, icone: Icone, titulo, texto, destaque }) => (
          <Link
            key={href}
            href={href}
            className={`group flex flex-col justify-between gap-6 p-5 transition-colors ${
              destaque ? "bg-paper-alt hover:bg-gold/10" : "bg-paper hover:bg-paper-alt"
            }`}
          >
            <div>
              <Icone size={20} className={destaque ? "text-gold" : "text-ink-muted"} aria-hidden />
              <p className="mt-3 font-display text-xl text-ink">{titulo}</p>
              <p className="mt-1 text-sm leading-relaxed text-ink-muted">{texto}</p>
            </div>
            <span className="flex items-center gap-1 text-sm font-semibold text-blue">
              Abrir <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
