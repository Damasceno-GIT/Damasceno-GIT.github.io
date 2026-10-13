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
```
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
