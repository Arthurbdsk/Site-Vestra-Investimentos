import type { ReactNode } from "react";

type MagneticButtonProps = {
  href: string;
  children: ReactNode;
  /** solid: azul sobre branco. ghost: contorno. gold: dourado, para usar sobre azul. */
  variant?: "solid" | "ghost" | "gold";
  className?: string;
};

/**
 * Botao-link principal do site. O nome ficou por compatibilidade: ele ja
 * "puxava" na direcao do cursor com uma mola, o que era movimento sem
 * funcao. Agora o hover e so troca de cor e o clique afunda de leve.
 */
export function MagneticButton({
  href,
  children,
  variant = "solid",
  className = "",
}: MagneticButtonProps) {
  const styles = {
    solid: "bg-blue text-onblue hover:bg-blue-deep",
    ghost: "border border-[var(--rule)] text-ink hover:border-[var(--color-azul-texto)]",
    // Sobre dourado o texto tem que continuar escuro nos dois temas, por
    // isso blue-deep e nao blue (que clareia no escuro).
    gold: "bg-gold text-blue-deep hover:bg-gold-soft",
  }[variant];

  return (
    <a
      href={href}
      className={`inline-flex items-center gap-2 px-6 py-3 text-sm font-medium transition-[background-color,border-color,color,transform] duration-150 ease-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold active:scale-[0.98] ${styles} ${className}`}
    >
      {children}
    </a>
  );
}
