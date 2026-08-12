import type { MetadataRoute } from "next";

const BASE_URL = "https://vestra-simulator.com.br";

export default function sitemap(): MetadataRoute.Sitemap {
  const paginas: { rota: string; prioridade: number; frequencia: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { rota: "", prioridade: 1, frequencia: "weekly" },
    { rota: "/simulador", prioridade: 0.9, frequencia: "daily" },
    { rota: "/aprender", prioridade: 0.8, frequencia: "weekly" },
    { rota: "/cadastro", prioridade: 0.7, frequencia: "monthly" },
    { rota: "/login", prioridade: 0.5, frequencia: "monthly" },
    { rota: "/termos", prioridade: 0.3, frequencia: "yearly" },
    { rota: "/privacidade", prioridade: 0.3, frequencia: "yearly" },
  ];

  return paginas.map((p) => ({
    url: `${BASE_URL}${p.rota}`,
    lastModified: new Date(),
    changeFrequency: p.frequencia,
    priority: p.prioridade,
  }));
}
