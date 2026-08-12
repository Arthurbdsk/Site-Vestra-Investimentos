import Link from "next/link";
import { Logomark } from "./Logomark";

export function Footer() {
  return (
    <footer className="bg-blue-deep">
      <div className="mx-auto max-w-6xl px-6 py-14">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-3">
              <Logomark size={32} />
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-onblue-muted">
                Vestra
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-onblue-muted">
              Um espaço pra aprender a investir na prática, sem arriscar seu
              dinheiro de verdade e sem esperar que você já saiba os termos.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-12">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-gold">
                Plataforma
              </p>
              <ul className="mt-4 space-y-2.5 text-sm text-onblue-muted">
                <li>
                  <Link href="/simulador" className="transition-colors hover:text-gold">
                    Simulador
                  </Link>
                </li>
                <li>
                  <Link href="/aprender" className="transition-colors hover:text-gold">
                    Aprender
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="transition-colors hover:text-gold">
                    Blog
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-gold">
                Sobre
              </p>
              <ul className="mt-4 space-y-2.5 text-sm text-onblue-muted">
                <li className="opacity-55">Nossa proposta</li>
                <li className="opacity-55">Perguntas frequentes</li>
                <li>
                  <Link href="/privacidade" className="transition-colors hover:text-gold">
                    Política de Privacidade
                  </Link>
                </li>
                <li>
                  <Link href="/termos" className="transition-colors hover:text-gold">
                    Termos de Uso
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-[var(--rule-inv)] pt-6 font-mono text-[11px] text-onblue-muted sm:flex-row sm:items-center sm:justify-between">
          <p>Ambiente 100% educacional. Nenhum valor aqui é dinheiro real.</p>
          <p>&copy; {new Date().getFullYear()} projeto em construção</p>
        </div>
      </div>
    </footer>
  );
}
