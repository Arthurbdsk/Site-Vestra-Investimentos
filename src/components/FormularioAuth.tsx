"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { criarClienteNavegador } from "@/lib/supabase/client";
import { Logomark } from "./Logomark";
import { BotaoGoogle } from "./BotaoGoogle";

type Modo = "cadastro" | "login";

const textos = {
  cadastro: {
    titulo: "Criar sua conta",
    subtitulo:
      "Leva menos de um minuto. Você recebe R$ 100.000 fictícios pra começar a praticar.",
    botao: "Criar conta e começar",
    trocaTexto: "Já tem conta?",
    trocaLink: "Entrar",
    trocaHref: "/login",
  },
  login: {
    titulo: "Entrar",
    subtitulo: "Bom te ver de volta. Sua carteira está te esperando.",
    botao: "Entrar na minha conta",
    trocaTexto: "Ainda não tem conta?",
    trocaLink: "Criar agora",
    trocaHref: "/cadastro",
  },
};

export function FormularioAuth({ modo }: { modo: Modo }) {
  const t = textos[modo];
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [confirmarEmail, setConfirmarEmail] = useState(false);
  const [aceitouTermos, setAceitouTermos] = useState(false);

  const precisaAceitarTermos = modo === "cadastro" && !aceitouTermos;

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (precisaAceitarTermos) {
      setErro("Você precisa aceitar os Termos de Uso pra criar sua conta.");
      return;
    }

    if (senha.length < 6) {
      setErro("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    if (modo === "cadastro" && senha !== confirmarSenha) {
      setErro("As senhas não são iguais. Confira e tente de novo.");
      return;
    }

    setCarregando(true);
    const supabase = criarClienteNavegador();

    try {
      if (modo === "cadastro") {
        const { data, error } = await supabase.auth.signUp({ email, password: senha });
        if (error) throw error;

        // Se o projeto exigir confirmacao por email, nao vem sessao.
        if (!data.session) {
          setConfirmarEmail(true);
          setCarregando(false);
          return;
        }

        await supabase.rpc("aceitar_termos");
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password: senha,
        });
        if (error) throw error;
      }

      router.push("/simulador");
      router.refresh();
    } catch (e) {
      setErro(traduzirErro(e));
      setCarregando(false);
    }
  }

  if (confirmarEmail) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <CheckCircle2 size={44} className="text-blue" />
        <h1 className="mt-6 font-display text-3xl leading-tight text-ink">
          Confira seu email
        </h1>
        <p className="mt-4 border-l-[3px] border-gold pl-5 leading-relaxed text-ink-muted">
          Mandamos um link de confirmação para <strong>{email}</strong>. Clique
          nele e depois volte aqui pra entrar.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.18em] text-blue transition-colors hover:text-gold"
        >
          Ir para a tela de entrar
          <ArrowRight size={14} />
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md"
    >
      <Logomark size={44} />

      <h1 className="mt-6 font-display text-4xl leading-tight text-ink">
        {t.titulo}
      </h1>
      <p className="mt-4 border-l-[3px] border-gold pl-5 leading-relaxed text-ink-muted">
        {t.subtitulo}
      </p>

      <Suspense fallback={null}>
        <ErroDaUrl />
      </Suspense>

      <div className="mt-8">
        <BotaoGoogle desabilitado={precisaAceitarTermos} />
      </div>

      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-[var(--rule)]" />
        <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted">
          ou
        </span>
        <span className="h-px flex-1 bg-[var(--rule)]" />
      </div>

      <form onSubmit={enviar} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted"
          >
            Seu email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@email.com"
            className="mt-2 w-full border border-[var(--rule)] bg-paper px-4 py-3 text-ink outline-none transition-colors placeholder:text-ink-muted/60 focus:border-blue"
          />
        </div>

        <div>
          <label
            htmlFor="senha"
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted"
          >
            Sua senha
          </label>
          <input
            id="senha"
            type="password"
            required
            minLength={6}
            autoComplete={modo === "cadastro" ? "new-password" : "current-password"}
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="mínimo 6 caracteres"
            className="mt-2 w-full border border-[var(--rule)] bg-paper px-4 py-3 text-ink outline-none transition-colors placeholder:text-ink-muted/60 focus:border-blue"
          />
        </div>

        {modo === "cadastro" && (
          <div>
            <label
              htmlFor="confirmar-senha"
              className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted"
            >
              Confirme sua senha
            </label>
            <input
              id="confirmar-senha"
              type="password"
              required
              minLength={6}
              autoComplete="new-password"
              value={confirmarSenha}
              onChange={(e) => setConfirmarSenha(e.target.value)}
              placeholder="digite a senha de novo"
              className="mt-2 w-full border border-[var(--rule)] bg-paper px-4 py-3 text-ink outline-none transition-colors placeholder:text-ink-muted/60 focus:border-blue"
            />
          </div>
        )}

        <AnimatePresence>
          {erro && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden border-l-[3px] border-rose-500 bg-rose-50 px-4 py-3 text-sm text-rose-800"
            >
              {erro}
            </motion.p>
          )}
        </AnimatePresence>

        {modo === "cadastro" && (
          <label className="flex items-start gap-2.5 text-sm text-ink-muted">
            <input
              type="checkbox"
              checked={aceitouTermos}
              onChange={(e) => setAceitouTermos(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-blue"
            />
            <span>
              Li e aceito os{" "}
              <Link href="/termos" target="_blank" className="text-blue underline decoration-blue/40 underline-offset-2 hover:decoration-blue">
                Termos de Uso
              </Link>{" "}
              e a{" "}
              <Link href="/privacidade" target="_blank" className="text-blue underline decoration-blue/40 underline-offset-2 hover:decoration-blue">
                Política de Privacidade
              </Link>
              .
            </span>
          </label>
        )}

        <button
          type="submit"
          disabled={carregando || precisaAceitarTermos}
          className="group flex w-full items-center justify-center gap-2.5 bg-blue px-7 py-3.5 text-sm font-semibold text-onblue transition-colors hover:bg-blue-deep disabled:opacity-60"
        >
          {carregando ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Um instante
            </>
          ) : (
            <>
              {t.botao}
              <ArrowRight
                size={16}
                className="transition-transform group-hover:translate-x-1"
              />
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-sm text-ink-muted">
        {t.trocaTexto}{" "}
        <Link href={t.trocaHref} className="font-semibold text-blue hover:text-gold">
          {t.trocaLink}
        </Link>
      </p>

      <p className="mt-8 font-mono text-[11px] leading-relaxed text-ink-muted">
        Não pedimos CPF, cartão nem dados bancários. Todo o dinheiro do
        simulador é fictício.
      </p>
    </motion.div>
  );
}

function ErroDaUrl() {
  const params = useSearchParams();
  const erro = params.get("erro");

  const mensagens: Record<string, string> = {
    link_invalido:
      "Esse link de confirmação não é mais válido, ou já foi usado. Tente criar a conta de novo, ou entre com sua senha se já confirmou antes.",
    login_google_falhou:
      "Não conseguimos concluir o login com o Google agora. Tente de novo, ou entre com email e senha.",
  };

  const mensagem = erro ? mensagens[erro] : undefined;
  if (!mensagem) return null;

  return (
    <p className="mt-6 flex items-start gap-2 border-l-[3px] border-rose-500 bg-rose-50 px-4 py-3 text-sm text-rose-800">
      <AlertCircle size={15} className="mt-0.5 shrink-0" />
      {mensagem}
    </p>
  );
}

function traduzirErro(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);

  if (/Invalid login credentials/i.test(msg))
    return "Email ou senha não conferem. Confira e tente de novo.";
  if (/User already registered/i.test(msg))
    return "Esse email já tem conta. Tente entrar em vez de criar.";
  if (/Password should be at least/i.test(msg))
    return "A senha precisa ter pelo menos 6 caracteres.";
  if (/Email not confirmed/i.test(msg))
    return "Você ainda não confirmou seu email. Procure o link que mandamos.";
  if (/rate limit|too many/i.test(msg))
    return "Muitas tentativas seguidas. Espere um minutinho e tente de novo.";
  if (/fetch|network/i.test(msg))
    return "Não conseguimos falar com o servidor. Verifique sua internet.";

  return "Algo deu errado. Tente de novo em instantes.";
}
