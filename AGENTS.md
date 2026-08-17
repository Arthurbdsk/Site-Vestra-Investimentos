<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes, APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev`, verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Diretrizes de design (Vestra)

Leia isto antes de criar ou editar qualquer componente visual. O objetivo
é manter uma linguagem editorial consistente e evitar o "cheiro de site
feito por IA" (gradientes decorativos, cards genéricos, paleta sem
intenção). Use valores exatos abaixo, não aproximações.

## Cores (tokens CSS em `src/app/globals.css`, não hardcode hex fora dali)
- `--color-paper` `#ffffff` / `--color-paper-alt` `#f5f6f7`, fundo
- `--color-blue` `#0f2d44` / `--color-blue-deep` `#0a2133`, bloco de destaque (hero, CTA, cards de resumo)
- `--color-gold` `#f5a623` / `--color-gold-soft` `#f5c56a`, única cor de ação/CTA. Não usar gold pra decoração aleatória.
- `--color-ink` `#0f2d44` / `--color-ink-muted` `#5c666f`, texto sobre `paper`
- `--color-onblue` `#f5f6f7` / `--color-onblue-muted` `#a9b4bf`, texto sobre `blue`
- Acentos extras (`--color-teal` `#1f7a6c`, `--color-coral` `#b84d2c`, `--color-violet` `#6b5b9a`, `--color-sky` `#2f6690`): só pra informação que precisa de cor (setor de uma ação, nível do investidor, medalhas do ranking). **Nunca** decorativo, se a cor não carrega significado, não adicione.
- **Cor como texto usa a variante `-texto`**, não a base: `--color-azul-texto`, `--color-teal-texto`, `--color-coral-texto`, `--color-violet-texto`, `--color-sky-texto`. As bases são pensadas pra fundo (bloco colorido com texto claro em cima) e no tema escuro viram cor escura sobre fundo escuro. As classes `text-blue`, `text-teal`, `text-coral`, `text-violet` e `text-sky` já apontam pra variante certa automaticamente (regra no `globals.css`); a variante só precisa ser escrita à mão em `style={{ color: ... }}` e em SVG (`stroke`, `fill`).
- Modo escuro já existe via `data-theme`/`prefers-color-scheme` no próprio `globals.css`, qualquer cor nova precisa funcionar nos dois temas.
- **Contraste mínimo 4,5:1** (3:1 pra texto grande). Isso não é enfeite: o público-alvo inclui gente que vai ler no celular, no sol, em tela ruim. Antes de aceitar uma cor de texto nova, meça contra o fundo real nos dois temas.

## Tipografia
- `font-display` (Fraunces, serifada), títulos grandes, headlines. Isso é a assinatura visual do site, não trocar por sans-serif genérica.
- `font-body` (Manrope), texto corrido.
- `font-mono` (IBM Plex Mono), rótulos em uppercase/tracking largo, números tabulares, badges. Já é o "tom" do site pra metadado (ex: `text-[11px] uppercase tracking-widest`).
- Nunca usar Inter, system-ui ou qualquer sans-serif default como fonte principal, é a marca mais reconhecível de site genérico feito por IA.

## Duas estéticas, dois lugares
- **Landing/institucional** (`/`, componentes de marketing como `Hero`, `Manifesto`, `Valores`, `HowItWorks`, `CTASection`): editorial, espaçoso, tipografia grande, as regras abaixo valem à risca aqui.
- **Simulador logado** (`PainelSimulador` e tudo dentro da área logada): estética deliberadamente **maximalista/densa**, tipo terminal de trading (referência: leaderboard do Investopedia Simulator). Tabelas de verdade (`<table>`), linhas compactas (`py-1.5`/`py-2`), pouco espaço em branco, números tabulares alinhados à direita, cantos retos (sem `rounded-full` em tags/badges). Prefira tabela a lista de cards sempre que houver 3+ colunas de dado (posições, transações, ranking).

## Regras específicas (o que NÃO fazer)
- **Sem gradiente/blur decorativo** (bolhas `blur(90px)` soltas no fundo). Já foram removidas do Hero/Manifesto/CTASection de propósito, não trazer de volta.
- **Sem grid de 3 cards genéricos** (ícone + título + descrição, todos do mesmo tamanho). Prefira listas numeradas, layouts assimétricos (`grid-cols-[1.15fr_0.85fr]` etc.), ou o padrão editorial já usado em `Valores.tsx`/`HowItWorks.tsx`.
- **Ícone-em-círculo/quadrado só quando funcional** (conquista desbloqueada, popup pontual). Não usar como decoração repetida em toda seção.
- Borda/régua usa sempre `border-[var(--rule)]` (ou `--rule-inv` sobre azul), nunca cinza hardcoded.
- Textura `.grain` (ruído sutil) já está em quase toda `<section>`, mantenha nas novas.
- Antes de aceitar o resultado de uma mudança visual, compare com o resto do site: se parecer que "poderia ser qualquer SaaS", ainda não está certo.
- **Nunca usar travessão** (em dash "—" ou en dash "–") em nenhum texto do site, nem em comentário de código. Troque por vírgula, dois-pontos, parênteses ou reestruture a frase. Hífen simples ("-") continua ok como marcador de valor ausente numa tabela.

