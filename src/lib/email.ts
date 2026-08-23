import { Resend } from "resend";
import { brl, pct } from "./formato";

const REMETENTE = "Vestra <resumo@vestra-simulator.com.br>";

export type DadosResumoSemanal = {
  apelido: string;
  patrimonioAtual: number;
  ganhoSemanaPct: number;
  posicaoRanking: number;
};

function htmlResumoSemanal(d: DadosResumoSemanal): string {
  const subiu = d.ganhoSemanaPct >= 0;
  const cor = subiu ? "#16a34a" : "#e11d48";

  return `
  <div style="background:#f5f6f7;padding:32px 16px;font-family:Georgia,'Times New Roman',serif;">
    <div style="max-width:480px;margin:0 auto;background:#ffffff;">
      <div style="background:#0f2d44;padding:28px 32px;">
        <p style="margin:0;color:#a9b4bf;font-family:monospace;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;">
          Resumo da semana
        </p>
        <h1 style="margin:8px 0 0;color:#f5a623;font-size:24px;">Olá, ${d.apelido}</h1>
      </div>
      <div style="padding:28px 32px;">
        <p style="margin:0;font-family:monospace;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#5c666f;">
          Patrimônio fictício
        </p>
        <p style="margin:4px 0 20px;font-family:monospace;font-size:32px;color:#0f2d44;">
          ${brl(d.patrimonioAtual)}
        </p>

        <p style="margin:0;font-family:monospace;font-size:11px;letter-spacing:0.08em;text-transform:uppercase;color:#5c666f;">
          Nos últimos 7 dias
        </p>
        <p style="margin:4px 0 20px;font-family:monospace;font-size:20px;color:${cor};">
          ${pct(d.ganhoSemanaPct)}
        </p>

        <p style="margin:0 0 24px;font-size:15px;line-height:1.5;color:#0f2d44;">
          Você está na posição <strong>${d.posicaoRanking}</strong> do ranking geral do Vestra.
        </p>

        <a href="https://vestra-simulator.com.br/simulador"
           style="display:inline-block;background:#0f2d44;color:#f5f6f7;padding:12px 24px;text-decoration:none;font-size:14px;font-weight:bold;">
          Abrir o simulador
        </a>

        <p style="margin:28px 0 0;font-size:11px;line-height:1.5;color:#5c666f;">
          Ambiente 100% educacional. Nenhum valor aqui é dinheiro real.
          Não quer mais receber este resumo? Desative em
          <a href="https://vestra-simulator.com.br/conta" style="color:#5c666f;">Minha conta</a>.
        </p>
      </div>
    </div>
  </div>`;
}

/** Retorna null (sem lancar erro) se a chave da Resend nao estiver configurada. */
export async function enviarResumoSemanal(
  destinatario: string,
  dados: DadosResumoSemanal,
): Promise<{ ok: boolean }> {
  const chave = process.env.RESEND_API_KEY;
  if (!chave) return { ok: false };

  const resend = new Resend(chave);
  const { error } = await resend.emails.send({
    from: REMETENTE,
    to: destinatario,
    subject: `Você está na posição ${dados.posicaoRanking} do Vestra`,
    html: htmlResumoSemanal(dados),
  });

  return { ok: !error };
}
