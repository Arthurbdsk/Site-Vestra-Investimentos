import { Logomark } from "./Logomark";

/**
 * Mostrado quando o site sobe sem as chaves do Supabase (tipico de um
 * primeiro deploy). Melhor uma tela explicativa que um build quebrado.
 */
export function AvisoConfiguracao() {
  return (
    <main className="grain relative flex flex-1 items-center bg-paper">
      <div className="relative z-[2] mx-auto w-full max-w-2xl px-6 py-24">
        <Logomark size={48} />
        <h1 className="mt-7 font-display text-3xl leading-tight text-ink sm:text-4xl">
          Falta conectar o banco de dados.
        </h1>
        <p className="mt-5 border-l-[3px] border-gold pl-5 leading-relaxed text-ink-muted">
          O site está no ar, mas as chaves do Supabase ainda não foram
          cadastradas nesta hospedagem. Elas ficam no arquivo{" "}
          <code className="font-mono text-sm text-blue">.env.local</code>, que
          de propósito não vai para o GitHub.
        </p>

        <div className="mt-8 border border-[var(--rule)] p-6">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">
            No painel da Vercel
          </p>
          <p className="mt-3 text-sm leading-relaxed text-ink-muted">
            Abra o projeto, vá em <strong className="text-ink">Settings</strong>{" "}
            → <strong className="text-ink">Environment Variables</strong> e
            cadastre as três abaixo, com os mesmos valores do seu arquivo
            local. Depois clique em{" "}
            <strong className="text-ink">Redeploy</strong>.
          </p>
          <ul className="mt-4 space-y-1.5 font-mono text-sm text-blue">
            <li>NEXT_PUBLIC_SUPABASE_URL</li>
            <li>NEXT_PUBLIC_SUPABASE_ANON_KEY</li>
            <li>BRAPI_TOKEN</li>
          </ul>
        </div>
      </div>
    </main>
  );
}
