"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, UserRound, AlertCircle } from "lucide-react";
import { criarClienteNavegador } from "@/lib/supabase/client";

/**
 * Entra sem cadastro, usando login anonimo do Supabase. O visitante vira
 * um usuario de verdade no banco, entao comprar e vender seguem as mesmas
 * regras de quem tem conta. A diferenca e que nao ha email nem senha.
 */
export function BotaoVisitante({
  className = "",
  variante = "contorno",
}: {
  className?: string;
  variante?: "contorno" | "texto";
}) {
  const router = useRouter();
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function entrar() {
    setErro(null);
    setCarregando(true);

    const supabase = criarClienteNavegador();
    const { error } = await supabase.auth.signInAnonymously();

    if (error) {
      setErro(traduzir(error.message));
      setCarregando(false);
      return;
    }

    router.push("/simulador");
    router.refresh();
  }

  const estilo =
    variante === "contorno"
      ? "border border-[var(--rule)] text-ink hover:border-blue hover:text-blue"
      : "text-ink-muted hover:text-blue underline underline-offset-4 decoration-dashed";

  return (
    <div className={className}>
      <button
        onClick={entrar}
        disabled={carregando}
        className={`inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold transition-colors disabled:opacity-60 ${estilo}`}
      >
        {carregando ? (
          <>
            <Loader2 size={16} className="animate-spin" />
            Preparando sua carteira
          </>
        ) : (
          <>
            <UserRound size={16} />
            Entrar como visitante
          </>
        )}
      </button>

      <AnimatePresence>
        {erro && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 flex items-start gap-2 overflow-hidden border-l-[3px] border-rose-500 bg-rose-50 px-4 py-3 text-sm text-rose-800"
          >
            <AlertCircle size={15} className="mt-0.5 shrink-0" />
            {erro}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function traduzir(msg: string): string {
  if (/anonymous.*disabled|signups.*disabled|not enabled/i.test(msg)) {
    return "O modo visitante ainda não foi liberado no Supabase. Ative 'Anonymous sign-ins' em Authentication e tente de novo.";
  }
  if (/rate limit|too many/i.test(msg)) {
    return "Muitas tentativas seguidas. Espere um minutinho e tente de novo.";
  }
  return "Não consegui abrir a carteira de visitante agora. Tente de novo em instantes.";
}
