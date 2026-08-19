import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { Fraunces, Manrope, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { ScrollProgress } from "@/components/ScrollProgress";
import { SmoothScroll } from "@/components/SmoothScroll";
import { RegistrarServiceWorker } from "@/components/RegistrarServiceWorker";
import { ConviteInstalar } from "@/components/app/ConviteInstalar";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const TITULO = "Vestra: educação financeira sem enrolação";
const DESCRICAO =
  "Simulador de investimentos com dinheiro fictício e preços reais da B3 e da bolsa americana. Aprenda a investir na prática, sem economês e sem arriscar dinheiro de verdade.";
const BASE_URL = "https://vestra-simulator.com.br";

export const metadata: Metadata = {
  metadataBase: new URL(BASE_URL),
  title: {
    default: TITULO,
    // "Vestra" sozinho ja tem empresas de logistica e moda ocupando a
    // primeira pagina do Google ha anos; o titulo de cada rota entra
    // como %s aqui, entao toda pagina interna carrega "Vestra" + o
    // termo especifico dela (ex: "Blog | Vestra Simulador de
    // Investimentos"), que e o par que o site realmente tem chance de
    // rankear.
    template: "%s | Vestra Simulador de Investimentos",
  },
  description: DESCRICAO,
  keywords: [
    "vestra simulador de investimentos",
    "vestra educação financeira",
    "simulador de investimentos",
    "educação financeira",
    "como investir",
    "investir para iniciantes",
    "investir na bolsa",
    "ações B3",
    "simulador de ações",
  ],
  authors: [{ name: "Vestra" }],
  alternates: { canonical: "/" },
  openGraph: {
    title: TITULO,
    description: DESCRICAO,
    url: BASE_URL,
    siteName: "Vestra Simulador de Investimentos",
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: TITULO,
    description: DESCRICAO,
  },
  robots: { index: true, follow: true },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Vestra",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-touch-icon.png",
  },
};

// Ajuda o Google a entender "Vestra" como esta entidade especifica, e
// nao a transportadora nem a marca de moda de mesmo nome que ja ocupam
// a busca. sameAs (perfis sociais) fica de fora enquanto nao existirem
// perfis confirmados: melhor sem o campo do que apontando pro perfil
// de outra empresa.
const JSON_LD_ORGANIZACAO = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Vestra",
  alternateName: "Vestra Simulador de Investimentos",
  url: BASE_URL,
  logo: `${BASE_URL}/icon.svg`,
  description: DESCRICAO,
};

const JSON_LD_SITE = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "Vestra Simulador de Investimentos",
  alternateName: "Vestra",
  url: BASE_URL,
  inLanguage: "pt-BR",
};

export const viewport: Viewport = {
  themeColor: "#0f2d44",
  // Sem "cover", env(safe-area-inset-*) vale ZERO no iPhone. A barra
  // inferior do app e o botao do assistente ja usam essa medida pra nao
  // ficar embaixo da faixa do gesto de home; sem isto aqui, os dois
  // calculos existem e nao surtem efeito nenhum no aparelho.
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      // O servidor nao tem como saber o tema salvo no navegador, entao o
      // data-theme sempre diverge entre o HTML e a hidratacao. Sem este
      // marcador, o React enche o console de aviso a cada carregamento.
      suppressHydrationWarning
      className={`${fraunces.variable} ${manrope.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink">
        {/* O Next ja emite a versao moderna (mobile-web-app-capable). O
            iPhone anterior ao iOS 16.4 so entende a variante da Apple, e
            sem ela o atalho abre dentro do Safari em vez de em tela
            cheia. O React 19 sobe esta tag pro <head> sozinho. */}
        <meta name="apple-mobile-web-app-capable" content="yes" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD_ORGANIZACAO) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD_SITE) }}
        />

        {/* Aplica o tema salvo antes da primeira pintura, pra quem
            escolheu escuro nao levar um flash de tela branca. Precisa ser
            <Script> do Next: <script> solto dentro de componente nao roda
            no cliente, e o React 19 reclamava disso no console a cada
            carregamento. De quebra, agora vai pro head e aplica mais
            cedo. */}
        <Script id="tema-salvo" strategy="beforeInteractive">
          {`try{var t=localStorage.getItem("tema");if(t)document.documentElement.dataset.theme=t;}catch(e){}`}
        </Script>
        <SmoothScroll />
        <ScrollProgress />
        <RegistrarServiceWorker />
        {children}
        <ConviteInstalar />
      </body>
    </html>
  );
}
