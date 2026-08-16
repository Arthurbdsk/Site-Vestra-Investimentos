import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { ScrollProgress } from "@/components/ScrollProgress";
import { SmoothScroll } from "@/components/SmoothScroll";
import { RegistrarServiceWorker } from "@/components/RegistrarServiceWorker";

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

export const metadata: Metadata = {
  metadataBase: new URL("https://vestra-simulator.com.br"),
  title: TITULO,
  description: DESCRICAO,
  keywords: [
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
    url: "https://vestra-simulator.com.br",
    siteName: "Vestra",
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

export const viewport: Viewport = {
  themeColor: "#0f2d44",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${fraunces.variable} ${manrope.variable} ${plexMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-paper text-ink">
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("tema");if(t)document.documentElement.dataset.theme=t;}catch(e){}`,
          }}
        />
        <SmoothScroll />
        <ScrollProgress />
        <RegistrarServiceWorker />
        {children}
      </body>
    </html>
  );
}
