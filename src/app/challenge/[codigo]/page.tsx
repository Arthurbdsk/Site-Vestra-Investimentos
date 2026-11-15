import { redirect } from "next/navigation";

/**
 * A pagina de cada competicao mora em /competicoes/[codigo]. Este caminho
 * existiu na primeira versao do Challenge e fica so pra links antigos.
 */
export default async function ChallengeCodigoAntigo({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  redirect(`/competicoes/${encodeURIComponent(codigo)}`);
}
