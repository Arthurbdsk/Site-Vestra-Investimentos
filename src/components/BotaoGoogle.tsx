"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { criarClienteNavegador } from "@/lib/supabase/client";

export function BotaoGoogle() {
  const [carregando, setCarregando] = useState(false);

  async function entrar() {
    setCarregando(true);
    const supabase = criarClienteNavegador();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    // O navegador sai da pagina pra ir pro Google; se voltar sem redirecionar,
    // algo deu errado (provedor nao configurado) e liberamos o botao de novo.
    setCarregando(false);
  }

  return (
    <button
      onClick={entrar}
      disabled={carregando}
      className="flex w-full items-center justify-center gap-2.5 border border-[var(--rule)] px-7 py-3.5 text-sm font-semibold text-ink transition-colors hover:border-blue disabled:opacity-60"
    >
      {carregando ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <GoogleIcon />
      )}
      Continuar com Google
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path
        fill="#FFC107"
        d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.1 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
      />
      <path
        fill="#FF3D00"
        d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.1 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4c-7.4 0-13.8 4.1-17.1 10.1z"
      />
      <path
        fill="#4CAF50"
        d="M24 44c5.5 0 10.4-2.1 14.1-5.5l-6.5-5.5c-2 1.5-4.6 2.5-7.6 2.5-5.3 0-9.7-3.4-11.3-8.1l-6.6 5.1C9.9 39.7 16.4 44 24 44z"
      />
      <path
        fill="#1976D2"
        d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.3-4.1 5.7l6.5 5.5C41.8 36.3 44 30.9 44 24c0-1.3-.1-2.7-.4-3.5z"
      />
    </svg>
  );
}
