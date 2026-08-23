import { ImageResponse } from "next/og";

export const alt = "Vestra: simulador de investimentos";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function carregarFonteFraunces(texto: string) {
  const url = `https://fonts.googleapis.com/css2?family=Fraunces:wght@600&text=${encodeURIComponent(texto)}`;
  const css = await (await fetch(url)).text();
  const match = css.match(/src: url\(([^)]+)\) format\('(opentype|truetype)'\)/);
  if (!match) throw new Error("Fonte Fraunces nao encontrada na resposta do Google Fonts");
  const resposta = await fetch(match[1]);
  return await resposta.arrayBuffer();
}

export default async function ImagemOpenGraph() {
  const titulo = "Vestra";
  const subtitulo = "Simulador de investimentos com dinheiro fictício e preços reais da bolsa";
  const rotulo = "B3 · NYSE · NASDAQ";

  const fonte = await carregarFonteFraunces(titulo + subtitulo + rotulo);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "88px",
          backgroundColor: "#0f2d44",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <svg width={56} height={56} viewBox="0 0 120 120">
            <polyline
              points="26,34 58,86 94,26"
              fill="none"
              stroke="#f5a623"
              strokeWidth={14}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span
            style={{
              fontFamily: "Fraunces",
              fontSize: 34,
              color: "#f5f6f7",
            }}
          >
            {titulo}
          </span>
        </div>

        <div
          style={{
            marginTop: 44,
            fontFamily: "Fraunces",
            fontSize: 52,
            lineHeight: 1.18,
            maxWidth: 920,
            color: "#f5f6f7",
          }}
        >
          {subtitulo}
        </div>

        <div
          style={{
            marginTop: 40,
            fontFamily: "monospace",
            fontSize: 20,
            letterSpacing: 6,
            textTransform: "uppercase",
            color: "#a9b4bf",
          }}
        >
          {rotulo}
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "Fraunces", data: fonte, style: "normal", weight: 600 }],
    },
  );
}
