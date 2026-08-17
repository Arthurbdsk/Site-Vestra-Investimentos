"use client";

import { useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";

type MagneticButtonProps = {
  href: string;
  children: ReactNode;
  /** solid: azul sobre branco. ghost: contorno. gold: dourado, para usar sobre azul. */
  variant?: "solid" | "ghost" | "gold";
  className?: string;
};

/** Botão que "puxa" levemente na direção do cursor. */
export function MagneticButton({
  href,
  children,
  variant = "solid",
  className = "",
}: MagneticButtonProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    setOffset({ x: x * 0.28, y: y * 0.35 });
  };

  const styles = {
    solid: "bg-blue text-onblue hover:bg-blue-deep",
    ghost: "border border-[var(--rule)] text-ink hover:border-blue hover:text-blue",
    // Sobre dourado o texto tem que continuar escuro nos dois temas, por
    // isso blue-deep e nao blue (que clareia no escuro).
    gold: "bg-gold text-blue-deep hover:bg-gold-soft",
  }[variant];

  return (
    <motion.a
      ref={ref}
      href={href}
      onMouseMove={handleMove}
      onMouseLeave={() => setOffset({ x: 0, y: 0 })}
      animate={{ x: offset.x, y: offset.y }}
      transition={{ type: "spring", stiffness: 260, damping: 18, mass: 0.4 }}
      className={`inline-flex items-center gap-2.5 px-7 py-3.5 text-sm font-semibold transition-colors ${styles} ${className}`}
    >
      {children}
    </motion.a>
  );
}
