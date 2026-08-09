"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [escuro, setEscuro] = useState(false);

  useEffect(() => {
    setEscuro(document.documentElement.dataset.theme === "dark");
  }, []);

  function alternar() {
    const proximo = escuro ? "light" : "dark";
    document.documentElement.dataset.theme = proximo;
    localStorage.setItem("tema", proximo);
    setEscuro(!escuro);
  }

  return (
    <button
      onClick={alternar}
      aria-label={escuro ? "Mudar para tema claro" : "Mudar para tema escuro"}
      className="text-ink-muted transition-colors hover:text-blue"
    >
      {escuro ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
