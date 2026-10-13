# TV Brasília — site institucional (pacote estático)

## Visão geral
- **Nome**: TV Brasília (Canal 6.1)
- **Objetivo**: publicar o site institucional da emissora (20 páginas, pt-BR, tema escuro padrão) como site estático, sem etapa de build.
- **Características**: HTML/CSS/JS puros, assets externalizados (antes embutidos em base64), carrossel de capa, trilhos de programas, seção **Shorts** com player em modal, enquete, programação do dia.

## URLs
- **Produção (GitHub Pages, user site)**: https://damasceno-git.github.io/
- **Repositório (projeto)**: https://github.com/Damasceno-GIT/TV-Brasilia
- **Repositório (user site)**: https://github.com/Damasceno-GIT/Damasceno-GIT.github.io

> O site é publicado na **raiz** do user site (`Damasceno-GIT.github.io`), portanto todos os caminhos relativos (`assets/...`, `programas.html`) funcionam sem prefixo.

## Arquitetura de dados
- **Sem backend**: nenhum dado é gravado no servidor. Todo o estado é local.
- **Estado no navegador**:
  - `localStorage["tvb-theme"]` — tema claro/escuro (`data-theme` no `<html>`).
  - Enquete: votos somados apenas no navegador do visitante (participação, sem caráter científico).
- **Conteúdo**: thumbnails e imagens em `assets/img/`; CSS compartilhado em `assets/css/` (8 arquivos, deduplicados por hash); fonte em `assets/fonts/` (1 woff2).
- **Shorts**: 15 vídeos da playlist pública [Shorts CB – 2026](https://www.youtube.com/playlist?list=PLHAcFePwq-6O_lgIY_yQHAUSc03MXc6CL) da TV Brasília.

## Seção Shorts (implementação)
- **Cards verticais 9:16** (`540×960`), um por vídeo, com o título e um atalho para o YouTube.
- **Thumbnails geradas localmente** (não dependem de hotlink em tempo de execução):
  - 5 vídeos com thumbnail vertical nativa (`oardefault`, 1080×1920) do próprio YouTube;
  - 10 vídeos horizontais convertidos com **corte central 9:16** (maxresdefault → recorte → 540×960).
- **Player em modal, na própria página**: o clique no card injeta um iframe do YouTube
  (`youtube-nocookie.com/embed/<id>?autoplay=1&rel=0&playsinline=1&modestbranding=1&iv_load_policy=3`)
  em um modal 9:16. Fecha por botão, clique no fundo ou tecla `Esc`.
- **Correções aplicadas**:
  1. o script dos Shorts rodava **antes** do `#shortModal` existir no DOM (o modal vinha depois), então os cliques nunca eram ligados — agora a inicialização espera o DOM (`DOMContentLoaded`/`readyState`);
  2. chamada `qa(seletor, raiz)` recebia uma **string** como raiz, causando `querySelectorAll is not a function` e abortando a inicialização.

## Página "Anuncie aqui" — correção do tema claro (v21)
O tema claro (`data-theme="light"`) mantinha a seção do anúncio com **faixa escura** e textos claros sobre fundo claro. Correções aplicadas em `anuncie.html`, isoladas por escopo (a folha compartilhada `assets/css/site-598fa12702.css` **não** foi alterada, pois é usada por 19 páginas):

- **Faixa escura removida**: as regras `html[data-theme="light"] body .section:has(.anuncie--adx)` e `html[data-theme="light"] body .anuncie--adx` forçavam `linear-gradient(rgb(11,13,19), rgb(10,11,15))`. Agora a seção é clara (`#F7FAFE → #FFFFFF → #F2F7FC`) com texto escuro.
- **Conflito de especificidade resolvido**: 12 regras usavam `html[data-theme="light"] body:not(#v10bl) .anuncie--adx …`, que carrega especificidade de **ID** e venceria qualquer bloco de mesma ordem. O bloco corretivo usa `.anuncie--adx#adxClaro` e é o **último `<style>`** do documento, vencendo a cascata.
- **Contraste corrigido**: `h2` → `#0C1A2B`; destaque "TV Brasília" → `#0868B5`; parágrafos → `#33415A`; cartões 2×2 brancos com texto escuro; botão "Ver plataformas" agora é legível (antes ficava branco sobre branco).
- **Cartões inferiores**: "Formatos comerciais" e "Como funciona" herdavam `color:#fff` forçado pela seção branca — reaplicados como texto escuro sobre branco.
- **Cores cravadas no HTML**: as 4 ocorrências de `style="color:#A7B2C2;…"` passaram a usar `var(--t2)`, acompanhando o tema.
- **Responsivo**: tabela de formatos com rolagem horizontal (`display:block; overflow-x:auto`); botões em largura total e paddings reduzidos em `≤760px`; tipografia ajustada em `≤420px`.
- **Sem regressão no tema escuro** (verificado por captura: idêntico ao anterior).

## Carrossel no celular, menu hambúrguer e espaçamentos (v22–v26)
Ajustes de layout aplicados **exclusivamente em CSS** (nenhuma marcação foi alterada), para que o comportamento não dependa do HTML de cada página. Cada ajuste vive em um bloco comentado e idempotente dentro dos bundles de `assets/css/`, aplicado por um script em `.tools/`.

> **Por que em CSS e nos bundles:** as páginas carregam o bundle no `<head>` e depois dezenas de blocos `<style>` inline com `!important`. As regras abaixo usam seletores suficientemente específicos (ou ID) para vencer a cascata sem tocar no HTML.

### v22 — espaço entre o banner e a flag "Anuncie aqui"
- `.anuncie__img + .anuncie__b{margin-top:10px}` — **10px** entre a arte do banner e a tarja "Anuncie aqui" (mesmo valor em `≤760px`).
- Script: `.tools/v22_espaco_flag.py` — aplicado nos 7 bundles que contêm as classes.
- Bloco: `/* v22-espaco-flag:start */ … :end */`

### v23 — carrossel e faixa URGENTE no celular
O banner ficava alto demais no celular: a regra `@media(max-width:760px){html body #v10slider,html body .hero{height:clamp(380px,122vw,560px)}}` produzia **~476px** a 390px de largura, e `--hero-media-top:108px` criava um vão preto.
- Altura do slider: `clamp(300px, 80vw, 430px)`; `--hero-media-top:0` e `--hero-art-height:300px`.
- Títulos de notícia em `14.5px`, `text-wrap:balance`; `lead` oculto no banner para não quebrar texto; CTA e setas reduzidos; `URGENTE` com altura fixa de `34px`.
- Pontos de navegação ancorados na base (`bottom:14px`), ficando abaixo do título/CTA sem sobrepor.
- Script: `.tools/v23_mobile_carrossel.py` — **somente** em `site-7830ebdce1.css` (bundle da `index.html`).
- Bloco: `/* v23-mobile-carrossel:start */ … :end */`

### v24 — menu hambúrguer modernizado
- Painel em "vidro" (blur + saturação), cantos arredondados, rolagem interna segura (`overscroll-behavior:contain`).
- **Faixa de marca com a logo pequena** da TV Brasília (96px, 84px em `≤760px`) sobre degradê escuro + filete tricolor.
- Itens em pílula com barra de destaque; entrada escalonada.
- **"Ao vivo" em destaque**: gradiente vermelho, ponto pulsante e selo `AO VIVO`.
- **CTA "Anuncie aqui"** em amarelo, centralizado.
- **Correção de ordem de camadas**: em `background-image` a **primeira** camada pinta por cima — a arte opaca teve de ser a **última**, senão a logo ficava invisível.
- **Correção de tema claro**: o bundle pinta `.drawer` de branco no tema claro e lavava o fundo escuro — neutralizado com `html[data-theme="light"] body .drawer{background:transparent}`.
- Script: `.tools/v24_drawer.py` — 7 bundles (todas as páginas com drawer).
- Bloco: `/* v24-drawer:start */ … :end */`

### v26 — vão de exatamente 7px entre as migalhas e o título (todas as páginas)
Pedido: **7px** entre a linha das migalhas de pão e o nome da página, em todas as páginas.

O vão visível **não é só a margem CSS**: o `<h1>` acrescenta acima das letras a folga de entrelinha `(line-height − ascent − descent)/2 + (ascent − cap-height)`, e essa folga **muda com o `font-size` do título**. Como o site tem **duas** estruturas de cabeçalho e o `font-size` cai em `@media(max-width:760px)`, um único valor de margem nunca daria 7px em todos os casos:

| estrutura | largura | `font-size` do `h1` | folga interna | margem para 7px |
|---|---|---|---|---|
| `.phead` (11 páginas) | ≥761px | 33.6px | 7.31px | **−0.31px** |
| `.phead` (11 páginas) | ≤760px | 21.3px | 3.29px | **+3.70px** |
| `.pghero` (7 páginas `programa-*`) | ≥761px | 46.5px | 7.75px | **−0.75px** |
| `.pghero` (7 páginas `programa-*`) | ≤760px | 25.8px | 4.40px | **+2.60px** |

- Margens base zeradas (`.crumbs{16px}`, `.tagp{14px}`, `.crumb{18px}`, `.pghero h1{margin-top:16px}`) e o vão controlado pelo `margin-top` do `h1`, em dois intervalos de mídia.
- Cobre **18 páginas** (11 com `.phead` + 7 com `.pghero`); a `404.html` não tem migalhas.
- Script: `.tools/v26_vao_migalhas.py` — 7 bundles; **substitui** o bloco anterior `v25`.
- Bloco: `/* v26-vao-migalhas:start */ … :end */`

**Verificação (navegador real, `getBoundingClientRect` + métricas de fonte):** vão medido em **7.01px** (`.phead`, ≥761px), **6.98px** (`.phead`, ≤760px), **7.00px** (`.pghero`, ≥761px) e **6.99px** (`.pghero`, ≤760px) — isto é, **18/18 páginas** em 7px, em 7 larguras de 390px a 1280px.

### Como reaplicar os ajustes
Os scripts de `.tools/` são **idempotentes** (removem o próprio bloco antes de reinserir), então podem ser reexecutados com segurança:
```bash
python3 .tools/v22_espaco_flag.py
python3 .tools/v23_mobile_carrossel.py
python3 .tools/v24_drawer.py
python3 .tools/v26_vao_migalhas.py
```
Após reexecutar, valide a integridade dos bundles (chaves balanceadas e 0 erros de parse — via `tinycss2`).

## Guia de uso
1. Abra https://damasceno-git.github.io/
2. No carrossel da capa, use as setas (ou `←`/`→` com o carrossel focado) para navegar entre os destaques.
3. Role até **Shorts** e clique em um card: o vídeo abre em um player no meio da tela. `Esc` fecha.
4. O ícone ao lado do título de cada card abre o vídeo no YouTube em uma nova aba.
5. O alternador de tema (sol/lua) no topo troca entre claro e escuro; a escolha fica salva no navegador.

## Entradas funcionais (páginas)
| Página | Conteúdo |
|---|---|
| `index.html` | Capa: carrossel de destaques, notícias, programas, programação, **Shorts**, anuncie, enquete |
| `noticias.html` / `noticia.html` | Lista e página de matéria |
| `programas.html` + `programa-*.html` | Índice e 7 páginas de programa (DF Alerta, Jornal Local, Vitrine, Ofertas Vrum, CB. Poder, CB. Agro, CB. Saúde) |
| `programacao.html` | Grade do dia |
| `ao-vivo.html` | Transmissão ao vivo |
| `portais.html` | Plataformas e redes |
| `anuncie.html` | Comercial / anuncie aqui (v21: tema claro sem faixa escura, contraste e responsivo) |
| `institucional.html`, `acessibilidade.html` | Institucional e acessibilidade |
| `componentes.html`, `fundamentos.html` | Guia de estilo do projeto |
| `404.html` | Página de erro |

## Publicação
- **Plataforma**: GitHub Pages (user site, `main` / raiz). Build: nenhum (site estático).
- **Status**: ativo — https://damasceno-git.github.io/
- **Sem Jekyll**: há um arquivo `.nojekyll` na raiz.
- **Cache**: `assets/*` com `max-age=86400`; `.html` com `must-revalidate` (via `_headers`, respeitado por hosts que suportam o formato; no GitHub Pages o cache é o padrão do serviço).
- **Atualizar**: `git add -A && git commit -m "..." && git push origin main && git push usersite main`
- **Stack**: HTML + CSS + JavaScript (sem framework)
- **Última atualização**: 2026-10-13

## Observações / pendências
- O robô de busca está bloqueado (`robots.txt` com `Disallow: /` e `X-Robots-Tag: noindex`), adequado para homologação; remover ambos para indexação pública.
- Todas as 20 páginas são HTML gerado manualmente — não há script gerador versionado neste repositório. Alterações de conteúdo devem ser feitas no HTML ou em um gerador que venha a ser incorporado.
