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
