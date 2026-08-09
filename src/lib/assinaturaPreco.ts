import { createHmac } from "crypto";

/**
 * Assina o preco real (buscado aqui no servidor) antes de mandar pro banco,
 * fechando a brecha de forjar preco chamando o RPC do Supabase direto por
 * fora do site: o banco recalcula essa assinatura com o mesmo segredo e so
 * aceita a compra/venda se ela bater e ainda nao tiver expirado. Ninguem
 * sem o segredo consegue forjar um preco valido.
 */
const TTL_MS = 60_000;

export type CotacaoAssinada = {
  precoTexto: string;
  expiraEm: number;
  assinatura: string;
};

function segredo(): string {
  const s = process.env.PRECO_ASSINATURA_SECRET;
  if (!s) {
    throw new Error(
      "PRECO_ASSINATURA_SECRET nao configurado no .env.local (e nas variaveis da Vercel).",
    );
  }
  return s;
}

export function assinarPreco(ticker: string, preco: number): CotacaoAssinada {
  const precoTexto = preco.toFixed(2);
  const expiraEm = Date.now() + TTL_MS;
  const mensagem = `${ticker}|${precoTexto}|${expiraEm}`;
  const assinatura = createHmac("sha256", segredo()).update(mensagem).digest("hex");
  return { precoTexto, expiraEm, assinatura };
}
