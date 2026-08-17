"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";
import { Logomark } from "./Logomark";
import { BotaoSair } from "./BotaoSair";
import { ThemeToggle } from "./ThemeToggle";

const links = [
  { href: "/", label: "Início" },
  { href: "/simulador", label: "Simulador" },
  { href: "/aprender", label: "Aprender" },
  { href: "/blog", label: "Blog" },
  { href: "/novidades", label: "Novidades" },
];

export function Header({ logado = false }: { logado?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hover, setHover] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? "border-[var(--rule)] bg-paper/90 py-3 backdrop-blur-md"
          : "border-transparent bg-transparent py-5"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
        <Link href="/" className="group flex items-center gap-3">
          <motion.span
            whileHover={{ rotate: -8 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <Logomark size={36} />
          </motion.span>
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted transition-colors group-hover:text-blue">
            Vestra
          </span>
        </Link>

        <nav
          className="hidden items-center gap-1 md:flex"
          onMouseLeave={() => setHover(null)}
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onMouseEnter={() => setHover(link.href)}
              className="relative px-4 py-2 text-sm font-medium text-ink/75 transition-colors hover:text-blue"
            >
              {hover === link.href && (
                <motion.span
                  layoutId="nav-hover"
                  className="absolute inset-0 -z-10 bg-paper-alt"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-5 md:flex">
          <ThemeToggle />
          {logado && (
            <Link
              href="/conta"
              className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted transition-colors hover:text-blue"
            >
              Minha conta
            </Link>
          )}
          {logado && <BotaoSair />}
          <Link
            href="/simulador"
            className="bg-blue px-5 py-2.5 text-sm font-semibold text-onblue transition-colors hover:bg-blue-deep"
          >
            {logado ? "Minha carteira" : "Testar o simulador"}
          </Link>
        </div>

        <button
          className="text-ink md:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label="Abrir menu"
        >
          {menuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden border-t border-[var(--rule)] bg-paper/97 backdrop-blur-md md:hidden"
          >
            <div className="flex flex-col px-6 py-3">
              {links.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="block border-b border-[var(--rule)] py-3.5 text-base text-ink transition-colors hover:text-blue"
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <Link
                href="/simulador"
                onClick={() => setMenuOpen(false)}
                className="mt-4 bg-blue px-5 py-3 text-center text-sm font-semibold text-onblue"
              >
                {logado ? "Minha carteira" : "Testar o simulador"}
              </Link>
              {logado && (
                <Link
                  href="/conta"
                  onClick={() => setMenuOpen(false)}
                  className="mt-3 block text-center font-mono text-[11px] uppercase tracking-[0.18em] text-ink-muted"
                >
                  Minha conta
                </Link>
              )}
              <div className="mt-4 flex items-center justify-center gap-4">
                <ThemeToggle />
                {logado && <BotaoSair />}
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
