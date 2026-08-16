"use client";

import { motion } from "framer-motion";
import { Home, LineChart, Wallet, User, ArrowLeftRight } from "lucide-react";

export type DestinoApp = "inicio" | "explorar" | "carteira" | "perfil";

const ITENS: {
  id: DestinoApp;
  label: string;
  icone: typeof Home;
}[] = [
  { id: "inicio", label: "Início", icone: Home },
  { id: "explorar", label: "Mercado", icone: LineChart },
  { id: "carteira", label: "Carteira", icone: Wallet },
  { id: "perfil", label: "Perfil", icone: User },
];

/**
 * Barra inferior do aplicativo, so no celular.
 *
 * No desktop ela nao aparece: la a navegacao e a coluna lateral, que cabe
 * mais itens e nao desperdica a largura. Espremer a barra de celular numa
 * tela grande e justamente o que faz um site parecer aplicativo esticado.
 *
 * "Operar" fica no meio, em dourado e elevado, porque e a acao central do
 * produto. Os outros quatro sao navegacao; esse e verbo.
 */
export function BarraApp({
  ativo,
  aoNavegar,
  aoOperar,
}: {
  ativo: string;
  aoNavegar: (destino: DestinoApp) => void;
  aoOperar: () => void;
}) {
  const esquerda = ITENS.slice(0, 2);
  const direita = ITENS.slice(2);

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[var(--rule)] bg-paper/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto grid max-w-lg grid-cols-5 items-end">
        {esquerda.map((item) => (
          <Item key={item.id} item={item} ativo={ativo} aoNavegar={aoNavegar} />
        ))}

        <div className="flex justify-center">
          <button
            onClick={aoOperar}
            className="-mt-5 flex h-14 w-14 flex-col items-center justify-center gap-0.5 bg-gold text-blue-deep shadow-lg transition-transform active:scale-95"
            aria-label="Operar: comprar ou vender"
          >
            <ArrowLeftRight size={19} aria-hidden />
            <span className="font-mono text-[9px] font-bold uppercase tracking-wider">
              Operar
            </span>
          </button>
        </div>

        {direita.map((item) => (
          <Item key={item.id} item={item} ativo={ativo} aoNavegar={aoNavegar} />
        ))}
      </div>
    </nav>
  );
}

function Item({
  item,
  ativo,
  aoNavegar,
}: {
  item: (typeof ITENS)[number];
  ativo: string;
  aoNavegar: (destino: DestinoApp) => void;
}) {
  const { id, label, icone: Icone } = item;
  const selecionado = ativo === id;

  return (
    <button
      onClick={() => aoNavegar(id)}
      aria-current={selecionado ? "page" : undefined}
      className="relative flex flex-col items-center gap-1 px-1 pb-2 pt-3 transition-colors"
      style={{
        color: selecionado ? "var(--color-blue)" : "var(--color-ink-muted)",
      }}
    >
      {selecionado && (
        <motion.span
          layoutId="barra-app-ativo"
          className="absolute inset-x-3 top-0 h-[2px] bg-gold"
          transition={{ type: "spring", stiffness: 320, damping: 30 }}
        />
      )}
      <Icone size={19} aria-hidden strokeWidth={selecionado ? 2.4 : 1.9} />
      <span className="font-mono text-[10px] uppercase tracking-wider">
        {label}
      </span>
    </button>
  );
}
