import { useEffect, useRef, useState } from "react";
import type { AcaoB3 } from "@/lib/buscaAcoes";

/**
 * Atrasa um valor que muda rápido (o que a pessoa digita) em N
 * milissegundos, pra nao disparar uma busca a cada tecla apertada.
 * Usado pelas abas do Explorar (BR, FII, ETF, US), que tinham cada uma
 * seu proprio efeito de debounce identico.
 */
export function useDebounce<T>(valor: T, atrasoMs: number): T {
  const [atrasado, setAtrasado] = useState(valor);
  useEffect(() => {
    const id = setTimeout(() => setAtrasado(valor), atrasoMs);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [valor, atrasoMs]);
  return atrasado;
}

/**
 * Busca debounced com estado de carregando/erro e guarda de cancelamento
 * (evita que a resposta de uma busca antiga sobrescreva uma mais nova).
 *
 * As quatro abas do Explorar (BR, FII, ETF, US) tinham essa mesma logica
 * duplicada, cada uma com pequenas diferencas em como interpretar a
 * resposta (json.acoes vs json.erro, se mantem o resultado anterior num
 * erro ou zera). `interpretarResposta` existe justamente pra preservar
 * essas diferencas em vez de forcar todo mundo a se comportar igual.
 */
export function useBuscaAtivos<T = AcaoB3>(params: {
  /** Texto ainda nao atrasado (o que a pessoa esta digitando agora). */
  busca: string;
  atrasoMs: number;
  /** Tamanho minimo do termo (ja atrasado) pra disparar a busca. */
  minLength?: number;
  /** Quando falso, nao busca (ex: aba nao esta selecionada). */
  ativo?: boolean;
  /**
   * Valor extra que deve refazer a busca mesmo se o termo nao mudou (ex:
   * qual mercado esta selecionado, quando isso muda a rota chamada por
   * `url`). Nao inclua `url`/`interpretarResposta` diretamente nas
   * dependencias do efeito: como sao funcoes recriadas a cada render do
   * componente que chama o hook, isso disparia uma busca nova em toda
   * renderizacao. Em vez disso elas ficam numa ref, sempre atualizada.
   */
  chave?: string | number;
  carregandoInicial?: boolean;
  url: (termo: string) => string;
  interpretarResposta: (json: { acoes?: T[]; erro?: string | null; mensagem?: string | null }) => {
    /** undefined mantem os resultados atuais (nao mexe no que ja tinha). */
    resultados?: T[];
    erro: string | null;
  };
  mensagemErroFetch: string;
}): { termo: string; resultados: T[]; carregando: boolean; erro: string | null } {
  const {
    busca,
    atrasoMs,
    minLength = 0,
    ativo = true,
    chave,
    carregandoInicial = false,
    url,
    interpretarResposta,
    mensagemErroFetch,
  } = params;

  const termo = useDebounce(busca.trim(), atrasoMs);

  const [resultados, setResultados] = useState<T[]>([]);
  const [carregando, setCarregando] = useState(carregandoInicial);
  const [erro, setErro] = useState<string | null>(null);

  const urlRef = useRef(url);
  const interpretarRef = useRef(interpretarResposta);
  useEffect(() => {
    urlRef.current = url;
    interpretarRef.current = interpretarResposta;
  });

  useEffect(() => {
    if (!ativo || termo.length < minLength) {
      setResultados([]);
      setErro(null);
      return;
    }
    let cancelado = false;
    setCarregando(true);
    fetch(urlRef.current(encodeURIComponent(termo)))
      .then((r) => r.json())
      .then((json) => {
        if (cancelado) return;
        const interpretado = interpretarRef.current(json);
        if (interpretado.resultados !== undefined) setResultados(interpretado.resultados);
        setErro(interpretado.erro);
      })
      .catch(() => {
        if (!cancelado) setErro(mensagemErroFetch);
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });
    return () => {
      cancelado = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ativo, termo, minLength, chave]);

  return { termo, resultados, carregando, erro };
}
