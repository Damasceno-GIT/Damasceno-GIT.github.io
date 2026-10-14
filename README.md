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

## Carrossel no celular, menu hambúrguer e espaçamentos (v22–v27)
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

### v27 — migalhas × título: respiro no desktop e empilhado centralizado no celular (todas as páginas)
Pedido: **desktop** com espaçamento entre as migalhas e o título (em todas as páginas) e **celular** com as migalhas, a data e o título **um debaixo do outro, centralizados, com espaçamento**. Substitui o bloco `v26`.

**O problema que o v26 não resolvia no desktop.** No `.phead` as migalhas (`.crumbs`, pílula) e o selo da data (`.tagp`) ficam na **mesma linha**, lado a lado. A pílula tem 34px de altura e o selo 27,59px — a pílula termina ~2,4px **abaixo** do selo. Como o vão era medido a partir do elemento mais baixo, o número fechava "7px" **a partir do selo**, mas a pílula ficava a apenas ~4,6px do título: parecia colado. O v27 passa a ancorar o vão na **base da pílula / do `nav.crumb`**, que é o que o olho enxerga como fim das migalhas.

**Desktop (≥761px):** vão de **16px** — o mesmo ritmo do `margin-top:16px` do parágrafo abaixo do título.

| estrutura | `font-size` do `h1` | folga de entrelinha | `margin-top` aplicado |
|---|---|---|---|
| `.phead` (11 páginas) | 33.6px | 7.31px | **8.7px** |
| `.pghero` (7 páginas `programa-*`) | 46.5px | 7.75px | **8.25px** |

**Mobile (≤760px):** migalhas, data e título empilhados e centralizados.

| | valor |
|---|---|
| vão migalhas → data | **10px** |
| vão data → título | **~12px** (8.7px + folga de 3,29px no `.phead`; 7,6px + 4,40px no `.pghero`) |
| título | `text-align:center` |
| centralização | deslocamento em relação ao centro = **0px** |

**A armadilha da centralização (descoberta via CSSOM).** A primeira tentativa foi dar `display:flex` na própria pílula, com seletor `html body .phead .wrap .crumbs.crumbs` (0,4,2 — **maior** que a regra inline `html body .crumbs.crumbs` (0,2,2)) e `!important`. Mesmo assim o `display` computado continuava `inline-flex` e a pílula ficava **91px à esquerda** do centro.

A saída foi **não disputar a propriedade `display`**: o **contêiner** vira `display:flex; flex-direction:column; align-items:center`. Assim a pílula passa a ser um *flex item* e é centralizada (e encolhida ao próprio conteúdo) **pelo pai**, qualquer que seja o `display` dela. Verificado: o deslocamento cai de −91px para **0**.

- Os filhos de largura total (`>h1`, `>p`, `>.insthero`, `.pgmeta`, `.pghero__act`) recebem `width:100%` — sem isso, como flex items, a largura passaria a ser a do conteúdo e o parágrafo viraria uma linha só. O `.insthero` (presente **só** na `institucional.html`, e que é `display:grid`) também precisou dessa correção para não encolher.
- Cobre **18 páginas** (11 com `.phead` + 7 com `.pghero`); a `404.html` e a `index.html` não têm migalhas.
- Script: `.tools/v27_migalhas_responsivo.py` — 7 bundles; **substitui** os blocos `v25` e `v26`.
- Bloco: `/* v27-migalhas:start */ … :end */`

**Verificação (navegador real, `getBoundingClientRect` + métricas de fonte), em 360–1280px:**
- Desktop: vão pílula→título = **16px** exato; `empilhado:false`; título alinhado à esquerda (`text-align:start`); contêiner segue `display:block` (layout intocado).
- Mobile: `flex-direction:column`, `align-items:center`, `empilhado:true`, centralização **0**, vãos **10px** e **11,98px**, título e parágrafo em `center`.

**Verificação no site publicado** (`https://damasceno-git.github.io`, capturas com escala 2 e medição das faixas de conteúdo):
- Desktop 1264px: pílula 218–244, título 260–292 → vão = **16,0px** exatos.
- Mobile 390px: da borda inferior da pílula até o topo do selo = **20px**; do selo até o topo das letras do título = **11px** — migalhas, data e título empilhados (bandas de glifos: 201,5–213,5 / 233,5–261,0 / 272,0–292,5).
  > O `margin` entre as caixas é **10px**; a distância ótima *visível* é maior porque a pílula tem borda e `padding`, e o texto do selo é em caixa-alta (começa abaixo do topo da caixa).
- Centralização mobile (captura de 780px = 390 CSS px, **sem** barra de rolagem): desvio do centro = **+0,25 / 0,00 / +0,75 / −0,25 / 0,00 / 0,00 px** para migalhas, data, título e as 3 linhas do parágrafo.

> Dica de medição: numa captura com barra de rolagem visível (viewport 375 de 390px) **todos** os elementos aparecem deslocados em +7,5px. Isso é o recorte da barra, não falta de centralização — para medir, use um viewport alto o bastante para o conteúdo caber sem barra.

Os 8 bundles foram checados no ar (9 páginas amostradas, todas com o bloco `v27`; a `404.html` fica fora porque não tem migalhas). Site ao vivo em `4d013de`: `site-69d0d50dd9.css` = 147518 B com `v27=1`.

### v28 — Programas no celular: 2 cards por linha (em vez de 4)
Pedido: na página `programas.html`, mostrar **2 cards por linha no celular**.

**A causa raiz.** O CSS já tinha a regra correta para o celular:
```css
.progs{display:grid;grid-template-columns:repeat(7,1fr);gap:16px}
@media (max-width:1180px){.progs{grid-template-columns:repeat(4,1fr)}}
@media (max-width:760px){.progs{grid-template-columns:repeat(2,1fr)}}   /* existia, mas nunca vencia */
```
Mas o HTML congela a grade num **estilo inline**:
```html
<div class="progs" style="grid-template-columns:repeat(4,1fr);margin-bottom:34px">
```
Estilo inline é *author normal* e **vence qualquer seletor de folha de estilo — inclusive as media queries**. Resultado: a grade ficava com 4 colunas em todas as larguras e a regra de 2 colunas não tinha efeito.

**A correção (só CSS, sem tocar no HTML).** Na cascata, *author `!important`* tem prioridade **maior** que *author normal* (onde vive o `style=""`). Basta declarar o valor com `!important` no bundle:
```css
@media(max-width:760px){
  html body .progs.progs{grid-template-columns:repeat(2,1fr)!important}
}
```
Acima de 760px nada é declarado, então o desktop segue com as 4 colunas que o inline define — **sem regressão**.

**Verificação (capturas do site, escala 2, medição das colunas por saturação de cor):**

| viewport | colunas | largura do card | gap |
|---|---|---|---|
| Desktop 1264px | **4** (inalterado) | 296px | 18px |
| Mobile 375px | **2** ✅ | 165px | 18px |

- Cobertura: os 7 bundles que contêm `.progs{display:grid` (o `404.html` não tem a regra e é pulado).
- Script: `.tools/v28_programas_2col.py`
- Bloco: `/* v28-programas-2col:start */ … :end */`

### v29 — Carrossel da capa no celular: banners institucionais novos, 450px de altura, título e CTA centralizados
Pedido: **substituir** as artes dos banners institucionais do carrossel **apenas no celular**, **subir a altura do carrossel para 450px** e **centralizar o título e o CTA** dos slides de matéria.

**Onde fica o carrossel.** É o `#v10slider` dentro de `<header class="hero">`, e **somente a `index.html` o usa** (as outras 19 páginas não têm marcador de carrossel). Dentro dele há 3 banners intercalados com 3 matérias:

| slide | classe extra | arte original | arte mobile (nova) | link |
|---|---|---|---|---|
| 1º | `.slide--df-full` | `be8c58cfdcdd.jpg` | `banner-mobile-df-alerta.jpg` | `programa-df-alerta.html` |
| — | `.slide--institutional-full` | `de8ae7524329.jpg` | `banner-mobile-familia.jpg` | — |
| — | `.slide--institutional-full` | `anuncie-tvbrasilia-arte-2.jpg` | `banner-mobile-anuncie.jpg` | `anuncie.html` |

Os três identificadores (`be8c58cfdcdd`, `de8ae7524329`, `anuncie-tvbrasilia`) aparecem **uma única vez** em todo o site, o que permite usá-los como gancho seguro de CSS. As **duas** `.slide--institutional-full` dividem a mesma classe, então cada uma é achada pela **própria imagem** com `:has(img[src*="…"])` — construção que o bundle já usa em mais de uma dezena de regras.

**A correção (só CSS, sem tocar no HTML).** Um único `@media(max-width:760px)` acrescentado ao fim de `site-7830ebdce1.css`, com três partes:

1. **Altura 450px** — `--hero-total-height:450px` e `#v10slider.slider{height/min-height/max-height:450px}`, e a `.slide__media` de `top:0` a `bottom:0` (zera o `--hero-media-top:102px` que os banners institucionais tinham).
2. **Arte nova** — no celular o `<img>` antigo sai (`display:none`) e a arte 1:1 entra como `background-image` da `.slide__media`, em `background-size:contain` (para **não cortar nenhuma palavra**) sobre `#06070A`. O `<a.slide__link>` que envolvia a imagem **continua existindo** e passa a cobrir toda a área (`position:absolute;inset:0`), então o banner segue clicável.
3. **Título e CTA centralizados** — `.slide__body{justify-content:center;text-align:center}`, `.slide__col{width:100%;margin:0 auto}`, `.slide__title{text-align:center}`, `.slide__act{justify-content:center}`. O `.slide__body` é `display:flex` em linha, então `justify-content` cuida do eixo horizontal e o `align-items` (vertical) fica como estava, para o texto não invadir a foto.

Acima de 760px **nada** é declarado: o desktop permanece idêntico.

> **Achado importante de cascata.** A `index.html` carrega **blocos `<style>` embutidos depois do `<link>`** deste bundle. Um deles (`v10dk`) redefine, no celular, `--hero-total-height` como 458px e a altura do `#v10slider` como `clamp(380px,122vw,560px)`. Como um `<style>` inline é a mesma origem e vem *depois*, ele **venceria no empate** de especificidade. Por isso a variável é declarada como `html:root body` (o `:root` soma 1 “classe” e ganha independentemente da ordem), e a altura usa `#v10slider.slider` (1 id, que já supera o `#v10slider` do bloco embutido).

- Cobertura: apenas `site-7830ebdce1.css` (único bundle com `#v10slider` **e** `slide--institutional-full`); os outros 7 são pulados.
- Script: `.tools/v29_banners_mobile.py`
- Bloco: `/* v29-banners-mobile:start */ … :end */`

### v30 — Matérias no celular: texto centralizado, título maior e descrição visível
Pedido: nos slides de matéria, **centralizar** o bloco, **aumentar um pouco** o título e **mostrar a descrição** com fonte pequena.

**Por que a centralização do v29 não aparecia.** O v29 já declarava `text-align:center` no título, mas o `.slide__body` continuava com `align-items:flex-start` **e** `justify-content:flex-start` (herdados do bloco `v23`), além de um `padding-top` grande que empurrava o texto para baixo do menu. Como o `.slide__body` é `display:flex`, `text-align` sozinho não move o conteúdo — é preciso mexer no **eixo** (`justify-content`/`align-items`). Foi o que o v30 fez.

**O ajuste (só CSS, sem tocar no HTML).** Uma única media query ao fim de `site-7830ebdce1.css`:

| elemento | antes (celular) | depois |
|---|---|---|
| `.slide__body` | `align-items:flex-start`, `justify-content:flex-start`, texto no topo | `align-items:center` + `justify-content:center` + `text-align:center` |
| `.slide__title` | 14.5px, peso 600 | **17px**, peso 700, `line-height:1.22` |
| `.slide__lead` | `display:none` (escondido) | visível em **12.5px**, no máximo **3 linhas** (`-webkit-line-clamp:3`) |
| `.slide__act` | alinhado à esquerda | `justify-content:center` |

Especificidade usada: `html:root body #v10slider.slider .slide--news …` (1 id + 4 classes). Isso vence tanto o bloco `v23` (1,2,2) quanto os `<style>` embutidos da `index.html` (0,6,6, **sem** id): como todos declaram `!important`, o desempate cai na **coluna de id** — e só o `#v10slider` tem id.

**A descrição em 3 linhas.** Caso o lead fosse maior que o slide, o texto empurraria o CTA para fora. Para evitar isso, o lead usa `display:-webkit-box` + `-webkit-line-clamp:3` (o padrão de "teaser"): sempre no máximo 3 linhas, com reticências se cortar. Como o `.slide__col` tem `width:100%` e o `.slide__body` respeita o padding, o texto não estoura o carrossel.

- Cobertura: apenas `site-7830ebdce1.css` (único bundle com `#v10slider` **e** `.slide__lead`).
- Script: `.tools/v30_news_mobile.py`
- Bloco: `/* v30-news-mobile:start */ … :end */`

### v31 — Carregamento das páginas (imagens 35% mais leves + adiamento)
Pedido: **melhorar o carregamento das páginas**.

**O diagnóstico (medido, não estimado).** O site é HTML estático sem build; o peso está quase todo em imagem. Na `index.html`, 55 imagens somavam **3,83 MB**, e três delas — as fotos das matérias do carrossel — respondiam por **1,58 MB** sozinhas:

| arquivo | tamanho | formato | cores | veredito |
|---|---|---|---|---|
| `e802b4806bf6` | 568 KB | PNG | 165.370 | **fotografia salva como PNG** |
| `f4f421069d08` | 524 KB | PNG | 123.971 | **fotografia salva como PNG** |
| `38373c7d6b35` | 494 KB | PNG | 129.080 | **fotografia salva como PNG** |

São **fotos** (centenas de milhares de cores, sem transparência) num formato feito para gráficos. Medição com **SSIM**:

| solução | tamanho | % do original | SSIM |
|---|---|---|---|
| JPEG q85 | 71/70/60 KB | **12–13%** | 0,95–0,97 |
| PNG8 256 cores | 159/159/122 KB | 25–30% | 0,92–0,95 |

O JPEG é **~2,3× menor e com mais qualidade** — vence nos dois critérios. Os outros 58 JPEGs do site ganhariam 1–2% ao recomprimir, então **não foram tocados** (evita artefato de dupla compressão); os PNGs restantes são pequenos (16–32 KB), e o único com transparência real (`d68d23d3c228.png`, o símbolo decorativo) continua PNG.

**O ajuste.**
1. As 3 fotos-PNG viraram **JPEG q85 progressivo** (1,62 MB → 197 KB) com um **portão de qualidade**: o script aborta se o SSIM ficar abaixo de 0,93.
2. As 3 referências `src` foram atualizadas na `index.html`; os `.png` órfãos foram removidos (o histórico do git preserva os originais).
3. **65 `<img>` abaixo do cabeçalho** (em 20 páginas) ganharam `loading="lazy"`; as imagens **dentro do `<header>`** (o carrossel, que aparece na primeira dobra) continuam **imediatas**, para não prejudicar o LCP.

**Resultado medido:**

| | antes | depois |
|---|---|---|
| Imagens da capa (`index.html`) | 3,83 MB | **2,47 MB** (−35%) |
| Soma das imagens de todas as páginas | 5,50 MB | **4,14 MB** (−1,36 MB) |
| `<img>` adiados | 18 | **48** |

- Script: `.tools/v31_carregamento.py` (idempotente)
- Não altera CSS; no HTML só escreve `src`/`loading`/`decoding`.

### v32 — Faixa de vídeos do canal + página do vídeo (novo)
Pedido: **uma seção nova abaixo da linha de URGENTE, sem títulos, em carrossel mostrando de três em três os últimos 15 vídeos do canal**; ao clicar, **abre uma página do vídeo** e, abaixo dela, **os outros vídeos em um carrossel** — "tudo bem moderno".

**Origem dos dados.** Os 15 vídeos vêm do **feed RSS oficial do canal** (`youtube.com/feeds/videos.xml?channel_id=UCl5Yg7lgK_qqW6sDtJYzCVA`), não de uma lista escrita à mão. Isso importa: os 15 vídeos atuais do canal são **diferentes** dos 15 da playlist antiga de Shorts — nenhum dos IDs coincide. O RSS entrega exatamente os 15 mais recentes.

| | Shorts (seção antiga) | Faixa de vídeos (v32) |
|---|---|---|
| origem | playlist fixa | feed RSS do canal |
| formato | vertical 9:16 (540×960) | horizontal 16:9 (560×315) |
| player | modal na própria página | **página própria** (`video.html`) |

**Decisões técnicas.**
- Os dados são **estáticos** (`assets/js/yt-videos.js`), gerados por script: nenhuma chamada à API do YouTube no navegador, nenhum custo de cota, nenhum erro se o visitante bloquear terceiros. As miniaturas também são **locais** (`assets/img/ytv-<id>.jpg`, 560×315, ~36 KB cada, 535 KB no total) — mesmo critério já usado nos Shorts, sem hotlink em tempo de execução.
- **Nada de título**: a faixa é `<section id="videos">` com uma `aria-label` (acessibilidade) e **nenhum `h1`–`h4` nem parágrafo** — verificado por teste automatizado.
- **3 por vez**: grade com `grid-auto-flow:column` e `grid-auto-columns:calc((100% − 2·gap)/3)`, com rolagem por encaixe (`scroll-snap`). Acompanha o viewport: **3** no desktop, **2** até 1100px, **1** no celular.
- **Sem dependência do bundle da página**: `assets/css/yt-modern.css` e `assets/js/yt-carousel.js` são autossuficientes e usam os tokens do site com valor de reserva. Assim a mesma faixa funciona na capa (bundle `7830ebdce1`) e na página do vídeo (bundle `48a3082af5`), e **não houve alteração em nenhum bundle**.
- `video.html` foi **gerada a partir do chrome nativo** de `noticia.html` (barra social, menu, drawer, rodapé), para nascer dentro do design system sem duplicar código à mão.
- A faixa da página do vídeo **exclui o vídeo em exibição** (14 cards), e `?v=<id>` inválido ou ausente cai no primeiro vídeo do feed.

**Estilo ("bem moderno").** Cards com borda em gradiente revelada no hover, elevação suave, zoom da miniatura, selo do programa (Jornal Local / DF Alerta), setas circulares sobrepostas com desfoque de fundo, indicadores que viram pílula na página ativa, linha de progresso e sombras laterais que só aparecem quando há conteúdo escondido. Respeita `prefers-reduced-motion` e o **tema claro** (indicadores e progresso usam cinza neutro, não branco translúcido).

**Arquivos novos:** `assets/css/yt-modern.css`, `assets/js/yt-carousel.js`, `assets/js/yt-videos.js`, `video.html`, 15 × `assets/img/ytv-*.jpg`.
**Scripts:** `.tools/fetch_channel.py` (lê o RSS e baixa as miniaturas), `.tools/build_yt_data.py` (gera o JS de dados), `.tools/build_video_page.py` (gera `video.html`), `.tools/v32_videos_canal.py` (insere a faixa na capa; idempotente).

**Validação:** 31 asserções automatizadas em DOM real (jsdom) — 15 cards, ordem idêntica ao feed, miniaturas existentes em disco, 5 indicadores, seta anterior desabilitada no início, `iframe` com o ID certo em `youtube-nocookie`, exclusão do vídeo atual, e os dois casos de fallback. Todas passaram.

### v33 — Responsivo do carrossel da capa no celular (correção do v29/v30)
Pedido: *"ajustar o responsivo do carrossel na versão mobile, melhorar alinhamentos das fontes dos slides de matérias, ter um espaçamento maior da parte superior, os bullets points"*.

**O que a captura mostrava.** No celular: o texto *"COM UMA GRADE PROGRAMAÇÃO…"* e o título *"TODA A FAMÍLIA"* cortados pelo menu escuro no topo, as bolinhas alinhadas à **esquerda** (não centralizadas) e quase coladas na borda inferior do carrossel.

**Causa raiz (uma regressão minha, em duas versões).**
1. O **v29** zerou o topo da `.slide__media` (`top:0!important`) para a arte 900×900 preencher os 450px de altura. Isso era necessário para os banners — mas **apagou o recuo que os slides de matéria usavam para começar abaixo do menu fixo** (a mídia começava em `--hero-media-top`, ~78px).
2. O **v30** então compensou fixando `padding-top:60px`, um valor **medido contra a geometria antiga**. Com o topo da mídia zerado, esses 60px passaram a ficar rentes ao menu — o texto subiu para baixo da barra.

**Uma segunda regressão, na mesma origem.** Com a mídia começando em `top:0`, a **arte dos banners** também passou a começar no topo do slide. Como ela é quadrada (900×900) e entrava em `contain` dentro dos 450px, ocupava y=30..420 — e o menu fixo cobre até y=110. Os três banners têm conteúdo **no topo**: medido na própria arte, o primeiro texto denso está em `y=101` (família), `y=0` (DF Alerta) e `y=0` (Anuncie) num arquivo de 900px. Ou seja, **o menu escondia a faixa de 0–12% da arte**, que é justamente onde o texto começa.

**A correção.** O v33 faz duas coisas, as duas derivadas do menu e não de números mágicos:
1. **Texto das matérias** — o recuo volta a ser `calc(var(--site-menu-top) + 88px)`, a mesma fórmula que o próprio design system usa, e o v33 entra **antes** das regras antigas na cascata, então `--news-copy-top` continua valendo onde for maior (telas baixas, `--hero-copy-min`).
2. **Arte dos banners** — a caixa da arte passa a começar **exatamente onde o menu termina** (`top:calc(var(--site-menu-top) + 66px)` = 112px no celular (46px do socialbar + 66px do `nav__in`)) e a arte preenche por **`cover`**, sem tarja escura nas laterais e sem cortar o texto.

| | antes (v29/v30) | depois (v33) |
|---|---|---|
| respiro do topo (matéria) | `60px` fixo (rente ao menu) | `calc(--site-menu-top + 88px)` |
| caixa da arte (banner) | `top:0` (sob o menu) | `calc(--site-menu-top + 66px)` = 112px |
| arte do banner | `contain` (tarja de 30px em cima/baixo) | `cover` (preenche, sem tarja) |
| bolinhas | `justify-content:flex-start`, `bottom:14px` | `center`, `bottom:24px` |
| título | 17px / `line-height:1.22` | 17px / `line-height:1.26` |
| descrição | 12,5px, 3 linhas | 12,5px, 3 linhas, `margin-top:10px` |
| rodapé do slide | 74px | 84px |

**Como o v33 vence a cascata.** O seletor de texto é `html:root body #v10slider.slider div.slide--news …`, que soma 1 id (`#v10slider`) + 4 classes/pseudo (`:root`, `.slider`, `.slide--news`, a classe do filho) + 3 tipos. Os três recursos que garantem a vitória, em ordem de peso:
1. **`html:root body`** → acrescenta a pseudo-classe `:root`, subindo a coluna de classes de 0 para 1;
2. **`#v10slider.slider`** → 1 id, que vence qualquer seletor sem id;
3. **`div.slide--news`** (em vez de `.slide--news`) → o `div` é um **elemento**, somando na terceira coluna e desempatando contra o v30, que usa a mesma forma sem o `div`.

Para os banners a conta é um pouco maior, e isso foi **medido, não suposto**: o v29 declara `background-size:contain` no seletor `.slide--institutional-full:has(img[src*="…"])`, e `:has()` mais `[src*=…]` valem **1 classe cada**, o que leva esse seletor a `(1,4,3)`. O v33, somando as **duas** classes úteis do banner (`div.slide--banner` + a variante), também chega a `(1,4,3)` — ou seja, **empate**, decidido pela **ordem do documento**. Como o bloco do v33 é sempre reanexado no **fim** do bundle, ele fica depois das regras do v29 e vence nos três banners. No DF Alerta não há seletor `:has()` concorrente, então ali o v33 ganha por especificidade mesmo.

> **Um bug meu, pego na revisão.** Ao montar a lista de seletores eu deixei `.slide__media` só no último ramo. Numa lista separada por vírgula o sufixo se aplica **apenas ao último ramo**: o primeiro ficou sem `.slide__media` e passou a apontar para o **próprio card do slide** (aplicando `top/bottom/height/background-size` no container) — pior que o problema original. Corrigido montando a lista **ramo a ramo**, com `.slide__media` em cada um.

Resultado medido com um **resolvedor de cascata** (tinycss2 + expansão de shorthands + ordem do documento): texto `(1,3,3)` contra `(1,1,2)` do v30 e `(1,1,3)` do bloco inline que fixa 14px; arte dos banners `(1,4,3)` vencendo nos **três** cards. O `.slide__link` continua cobrindo a caixa inteira, então o banner segue clicável. Em 1280px o v33 **não se aplica** (media `max-width:760px`), portanto o desktop fica intocado.

> **Nota de método.** A primeira versão do meu resolvedor dava resultado **invertido**: calculava a especificidade só do *último* composto do seletor (todos colapsavam em `(0,1,0)`) e, em empate, mantinha a *primeira* regra em vez da última. Foi corrigido (seletor inteiro + última vence) antes de qualquer conclusão ser tirada — e foi ele que pegou o empate perdido do `background-size`, que a olho nu passaria.

- Cobertura: apenas `site-7830ebdce1.css` — o script tem um **portão** que aborta se o arquivo não contiver `#v10slider`, `slide--news` e `.dots-wrap`.
- Script: `.tools/v33_mobile_carrossel.py`
- Bloco: `/* v33-mobile-carrossel:start */ … :end */`

### Como reaplicar os ajustes
Os scripts são **idempotentes** (removem o próprio bloco antes de reinserir), então podem ser reexecutados com segurança. Eles ficam na pasta `.tools/` do **repositório de trabalho** (`/home/user/webapp/.tools/`), e não dentro deste pacote publicado:

```bash
cd /home/user/webapp
python3 .tools/v22_espaco_flag.py
python3 .tools/v23_mobile_carrossel.py
python3 .tools/v24_drawer.py
python3 .tools/v27_migalhas_responsivo.py   # v25 e v26 são obsoletos: apenas delegam para o v27
python3 .tools/v28_programas_2col.py
python3 .tools/v29_banners_mobile.py
python3 .tools/v30_news_mobile.py
python3 .tools/v31_carregamento.py
python3 .tools/v33_mobile_carrossel.py      # v33 depois do v29/v30: corrige o respiro que eles alteraram
# v32 — faixa de vídeos do canal (na ordem, pois os dois primeiros geram os arquivos usados)
python3 .tools/fetch_channel.py      # lê o RSS e baixa as 15 miniaturas
python3 .tools/build_yt_data.py      # gera assets/js/yt-videos.js
python3 .tools/build_video_page.py   # gera video.html
python3 .tools/v32_videos_canal.py   # insere a faixa na capa
```

> Para **atualizar** a faixa com vídeos novos, basta rodar de novo `fetch_channel.py` → `build_yt_data.py` → `build_video_page.py`. O `v32_videos_canal.py` só mexe na capa e não precisa ser reexecutado (a faixa se alimenta do JS de dados).
Após reexecutar, valide a integridade dos bundles (chaves balanceadas e 0 erros de parse — via `tinycss2`).

> **Atenção:** `v25_migalhas.py` e `v26_vao_migalhas.py` estão **obsoletos**. Os dois foram convertidos em atalhos que delegam para o `v27`, para que reexecutar um script antigo não desfaça a correção atual. Use sempre o `v27_migalhas_responsivo.py`.

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
