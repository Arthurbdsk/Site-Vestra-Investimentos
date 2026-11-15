import { redirect } from "next/navigation";

/**
 * As ligas sairam do site: as competicoes fazem o mesmo papel com regras
 * mais justas (mesmo capital, carteira separada, ordens registradas).
 * Links de convite antigos continuam funcionando e levam pra la.
 */
export default function LigaAntigaPage() {
  redirect("/competicoes");
}
