import type { Transacao } from "@/components/PainelSimulador";

function celula(v: string | number): string {
  const texto = String(v);
  return /[",\n;]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
}

export function exportarTransacoesCsv(transacoes: Transacao[]) {
  const cabecalho = ["Data", "Tipo", "Ticker", "Quantidade", "Preço", "Total", "Imposto"];
  const linhas = transacoes.map((t) =>
    [
      new Date(t.criado_em).toLocaleString("pt-BR"),
      t.tipo,
      t.ticker,
      t.quantidade,
      t.preco.toFixed(2).replace(".", ","),
      t.total.toFixed(2).replace(".", ","),
      t.imposto.toFixed(2).replace(".", ","),
    ]
      .map(celula)
      .join(";"),
  );

  const csv = [cabecalho.join(";"), ...linhas].join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `vestra-transacoes-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
