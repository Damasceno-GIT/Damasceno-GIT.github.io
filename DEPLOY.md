# Guia de publicação — site TV Brasília (v19)

Pacote **estático**: não precisa de servidor, banco de dados nem build. Basta subir a pasta.

## O que tem dentro

- `index.html` + 18 páginas (tema escuro como padrão, com botão de tema no menu).
- `tema-claro/` — as mesmas 19 páginas com o tema claro como padrão.
- `assets/` — imagens usadas pelas páginas; `404.html` — página de erro personalizada.
- `robots.txt`, `_headers`, `netlify.toml`, `vercel.json` — bloqueiam a indexação no Google **enquanto for prévia**.
- Fotos das matérias e a fonte dos títulos (Montserrat) vão **embutidas no HTML**; o site abre mesmo sem internet.

## 1) Prévia (5 minutos, sem cadastro)

**Netlify Drop (mais simples)**
1. Acesse https://app.netlify.com/drop
2. Arraste a **pasta** do site (a que contém `index.html`) para a área indicada.
3. O Netlify devolve um endereço tipo `https://nome-aleatorio.netlify.app` — essa é a URL de prévia para aprovação.
4. A indexação já está bloqueada (`robots.txt` + cabeçalho `X-Robots-Tag`), então a prévia não aparece em buscas.

**Vercel (alternativa)**
1. Crie a conta em vercel.com e instale o CLI: `npm i -g vercel`.
2. Dentro da pasta do site: `vercel` e depois `vercel --prod`.
3. Use a URL gerada como prévia; o `vercel.json` já aplica `noindex`.

**Servidor próprio (hospedagem da emissora)**
1. Suba a pasta via FTP para `public_html/` (ou equivalente).
2. Confirme que `index.html` está na raiz do domínio.
3. Não é preciso PHP, Node ou banco de dados: são arquivos HTML puros.

## 2) Publicação oficial (depois do "aprovado")

1. **Liberar indexação no Google**
   - `robots.txt`: apague a linha `Disallow: /` e deixe apenas `User-agent: *`.
   - `_headers` e `netlify.toml` / `vercel.json`: remova a linha `X-Robots-Tag`.
   - Publique novamente (no Netlify: arrastar a pasta de novo, ou "Deploys > Retry deploy").
2. **Domínio próprio**
   - Adicione o domínio (ex.: `tvbrasilia.com.br`) e aponte o DNS; aponte também `www` para o mesmo destino, evitando conteúdo duplicado.
   - Ative HTTPS gratuito (Let's Encrypt no Netlify/Vercel ou o certificado da hospedagem).
3. **Conferir depois de publicar**
   - Home, uma página interna e `tema-claro/index.html`; no celular: menu, carrossel da capa, faixa URGENTE, programação e o botão de tema.
   - Digite um endereço inexistente para conferir a página 404.
4. **Opcional**: enviar `sitemap.xml` no Google Search Console e criar redirecionamentos das URLs antigas.

## Manutenção simples

- Textos e imagens ficam dentro de cada `.html` (imagens em `data:` base64) — para trocar uma foto, edite o arquivo da página.
- A programação fica em `programacao.html`; cada dia é uma aba com o painel correspondente.
- Ao alterar uma página, altere **as duas versões**: a da raiz (tema escuro) e a de `tema-claro/`.
