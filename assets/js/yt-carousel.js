/* ==========================================================================
   TV Brasília · motor das faixas de vídeo do canal  ·  namespace .vt-*
   --------------------------------------------------------------------------
   Monta, a partir de window.TVB_YT.videos (dado estático, sem rede):

     [data-vfixed]            grade fixa (3 por padrão) — data-vcount="3"
     [data-vcar]              carrossel — data-vlimit / data-vskip / data-vexclude
     [data-vgrid]             grade completa (página videos.html)
     [data-vplayer]           player da página video.html

   IMPORTANTE — nada aqui usa os nomes de classe do bundle (.vcard e filhos):
   aqueles nomes pertencem à seção de Shorts e a colisão .vcard__m
   (miniatura lá / rodapé aqui) esticava os cards. Ver o cabeçalho do
   yt-modern.css.
   ========================================================================== */
(function () {
  'use strict';

  var DATA = (window.TVB_YT && window.TVB_YT.videos) || [];
  if (!DATA.length) return;

  var TOTAL = DATA.length;

  var REDUZ = false;
  try {
    REDUZ = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) {}

  var ICONE = {
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
    prev: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.4 4.6 8 12l7.4 7.4 1.4-1.4L10.8 12l6-6z"/></svg>',
    next: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.6 4.6 16 12l-7.4 7.4-1.4-1.4 6-6-6-6z"/></svg>',
    ponto: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5"/></svg>'
  };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* -------------------------------------------------------------- card -- */
  function tileHTML(v, n) {
    var tag = v.prog ? '<span class="vtile__tag">' + esc(v.prog) + '</span>' : '';
    return '' +
      '<a class="vtile" href="video.html?v=' + encodeURIComponent(v.id) + '"' +
      ' data-vid="' + esc(v.id) + '" title="' + esc(v.full || v.title) + '">' +
        '<span class="vtile__thumb">' +
          '<img src="assets/img/' + esc(v.file) + '" alt="' + esc(v.full || v.title) + '"' +
          ' width="560" height="315" loading="lazy" decoding="async">' +
          tag +
          '<span class="vtile__play"><i>' + ICONE.play + '</i></span>' +
        '</span>' +
        '<span class="vtile__b">' +
          '<strong class="vtile__t">' + esc(v.title) + '</strong>' +
          '<span class="vtile__m">' + ICONE.ponto +
            '<span>Vídeo ' + n + ' de ' + TOTAL + ' &middot; ' + esc(v.date) + '</span>' +
          '</span>' +
        '</span>' +
      '</a>';
  }

  /* ------------------------------------------------------- grade fixa --- */
  function montaFixo(raiz) {
    if (raiz.getAttribute('data-vpronto')) return;
    var n = parseInt(raiz.getAttribute('data-vcount'), 10);
    if (!(n > 0)) n = 3;

    var html = '';
    for (var i = 0; i < Math.min(n, TOTAL); i++) html += tileHTML(DATA[i], i + 1);
    raiz.innerHTML = html;
    raiz.setAttribute('data-vpronto', '1');
  }

  /* --------------------------------------------------- grade completa --- */
  function montaGrade(raiz) {
    if (raiz.getAttribute('data-vpronto')) return;
    var html = '';
    for (var i = 0; i < TOTAL; i++) html += tileHTML(DATA[i], i + 1);
    raiz.innerHTML = html;
    raiz.setAttribute('data-vpronto', '1');
  }

  /* --------------------------------------------------------- carrossel -- */
  function monta(root) {
    var track = root.querySelector('[data-vtrack]');
    if (!track) return;

    var lim = parseInt(root.getAttribute('data-vlimit'), 10);
    var pula = parseInt(root.getAttribute('data-vskip'), 10);
    var fora = root.getAttribute('data-vexclude');

    var lista = DATA.filter(function (v) { return v.id !== fora; });
    if (pula > 0) lista = lista.slice(pula);
    if (lim > 0) lista = lista.slice(0, lim);
    if (!lista.length) return;

    var html = '';
    for (var i = 0; i < lista.length; i++) {
      /* o número exibido é a posição real no acervo, não a posição na faixa */
      html += tileHTML(lista[i], DATA.indexOf(lista[i]) + 1);
    }
    track.innerHTML = html;

    var dotsBox = root.querySelector('[data-vdots]');
    var bar = root.querySelector('[data-vbar]');
    var btnP = root.querySelector('[data-vnav="prev"]');
    var btnN = root.querySelector('[data-vnav="next"]');
    var cards = [].slice.call(track.children);

    /* Quantos cartões cabem por "página". Lê o grid-auto-columns calculado,
       então o CSS é a única fonte da verdade (sem duplicar breakpoints). */
    function porPagina() {
      var cs = window.getComputedStyle(track);
      var bruto = cs.gridAutoColumns || cs.getPropertyValue('grid-auto-columns') || '';
      var gap = parseFloat(cs.columnGap || cs.gap) || 0;
      var larg = track.clientWidth;
      var col = bruto.indexOf('%') >= 0
        ? larg * parseFloat(bruto) / 100
        : parseFloat(bruto);
      if (!(col > 0) || !(larg > 0)) return larg < 480 ? 1 : 3;
      return Math.max(1, Math.round((larg + gap) / (col + gap)));
    }

    function paginas() {
      return Math.max(1, Math.ceil(lista.length / porPagina()));
    }

    function pintaDots() {
      if (!dotsBox) return;
      var n = paginas();
      if (dotsBox.children.length !== n) {
        var s = '';
        for (var i = 0; i < n; i++) {
          s += '<button class="vtcar__dot" type="button" data-vdot="' + i +
               '" aria-label="Ir para a página ' + (i + 1) + '"></button>';
        }
        dotsBox.innerHTML = s;
      }
    }

    function atual() {
      var x = track.scrollLeft, melhor = 0, dist = Infinity;
      for (var i = 0; i < cards.length; i++) {
        var d = Math.abs(cards[i].offsetLeft - track.offsetLeft - x);
        if (d < dist) { dist = d; melhor = i; }
      }
      return Math.floor(melhor / porPagina());
    }

    function passo() {
      var n = porPagina();
      if (cards.length >= n + 1) return cards[n].offsetLeft - cards[0].offsetLeft;
      return Math.max(220, Math.round(track.clientWidth * 0.94));
    }

    function sincroniza() {
      var p = atual();
      var max = track.scrollWidth - track.clientWidth;

      root.classList.toggle('is-start', track.scrollLeft <= 2);
      root.classList.toggle('is-end', track.scrollLeft >= max - 2);

      if (btnP) btnP.disabled = track.scrollLeft <= 2;
      if (btnN) btnN.disabled = track.scrollLeft >= max - 2;

      if (dotsBox) {
        var ds = dotsBox.children;
        for (var i = 0; i < ds.length; i++) {
          ds[i].classList.toggle('is-on', i === p);
          if (i === p) ds[i].setAttribute('aria-current', 'true');
          else ds[i].removeAttribute('aria-current');
        }
      }
      if (bar) {
        var pct = max > 0 ? Math.max(6, Math.min(100, (track.scrollLeft / max) * 100)) : 100;
        bar.style.width = pct + '%';
      }
    }

    function rola(para) {
      track.scrollBy({ left: para, behavior: REDUZ ? 'auto' : 'smooth' });
    }

    if (btnP) btnP.addEventListener('click', function () { rola(-passo()); });
    if (btnN) btnN.addEventListener('click', function () { rola(passo()); });

    if (dotsBox) {
      dotsBox.addEventListener('click', function (ev) {
        var b = ev.target.closest('[data-vdot]');
        if (!b) return;
        var n = parseInt(b.getAttribute('data-vdot'), 10);
        var alvo = cards[Math.min(cards.length - 1, n * porPagina())];
        if (alvo) {
          track.scrollTo({
            left: alvo.offsetLeft - track.offsetLeft,
            behavior: REDUZ ? 'auto' : 'smooth'
          });
        }
      });
    }

    track.addEventListener('keydown', function (ev) {
      if (ev.key === 'ArrowRight') { rola(passo()); ev.preventDefault(); }
      else if (ev.key === 'ArrowLeft') { rola(-passo()); ev.preventDefault(); }
    });

    track.addEventListener('wheel', function (ev) {
      if (Math.abs(ev.deltaY) > Math.abs(ev.deltaX)) {
        var max = track.scrollWidth - track.clientWidth;
        if (max <= 0) return;
        var antes = track.scrollLeft;
        track.scrollLeft = antes + ev.deltaY;
        if (track.scrollLeft !== antes) ev.preventDefault();
      }
    }, { passive: false });

    var t = null;
    track.addEventListener('scroll', function () {
      if (t) return;
      t = requestAnimationFrame(function () { t = null; sincroniza(); });
    }, { passive: true });

    var r = null;
    window.addEventListener('resize', function () {
      if (r) clearTimeout(r);
      r = setTimeout(function () { pintaDots(); sincroniza(); }, 140);
    });

    pintaDots();
    sincroniza();
  }

  /* ----------------------------------------------------- página do vídeo */
  function montaPagina() {
    var alvo = document.querySelector('[data-vplayer]');
    if (!alvo) return;

    var id = new URLSearchParams(location.search).get('v');
    var v = null;
    for (var i = 0; i < TOTAL; i++) if (DATA[i].id === id) { v = DATA[i]; break; }
    if (!v) v = DATA[0];

    var origem = (location.protocol === 'http:' || location.protocol === 'https:')
      ? location.origin : '';
    var src = 'https://www.youtube-nocookie.com/embed/' + v.id +
      '?autoplay=1&rel=0&playsinline=1&modestbranding=1&iv_load_policy=3' +
      (origem ? '&origin=' + encodeURIComponent(origem) : '');

    alvo.innerHTML = '<iframe src="' + src + '" title="' + esc(v.full || v.title) + '"' +
      ' allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen' +
      ' referrerpolicy="strict-origin-when-cross-origin"></iframe>';

    document.title = v.title + ' | TV Brasília';

    var t = document.querySelector('[data-vtitle]');
    if (t) t.textContent = v.title;

    var m = document.querySelector('[data-vmeta]');
    if (m) {
      m.innerHTML =
        (v.prog ? '<span class="vtchip vtchip--plain">' + esc(v.prog) + '</span>' : '') +
        '<span class="vtchip vtchip--plain">' + esc(v.date) + '</span>' +
        '<a class="vtchip vtchip--yt" href="https://www.youtube.com/watch?v=' + esc(v.id) + '"' +
        ' target="_blank" rel="noopener">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.6 7.2a2.5 2.5 0 0 0-1.8-1.8C18.2 5 12 5 12 5s-6.2 0-7.8.4A2.5 2.5 0 0 0 2.4 7.2 26 26 0 0 0 2 12a26 26 0 0 0 .4 4.8 2.5 2.5 0 0 0 1.8 1.8C5.8 19 12 19 12 19s6.2 0 7.8-.4a2.5 2.5 0 0 0 1.8-1.8A26 26 0 0 0 22 12a26 26 0 0 0-.4-4.8zM10 15.2V8.8l5.4 3.2z"/></svg>' +
        'Abrir no YouTube</a>';
    }

    /* a faixa de baixo exclui o vídeo que já está tocando */
    var faixa = document.querySelector('[data-vcar]');
    if (faixa) {
      faixa.setAttribute('data-vexclude', v.id);
      monta(faixa);
    }
  }

  function inicia() {
    var fixas = document.querySelectorAll('[data-vfixed]');
    for (var i = 0; i < fixas.length; i++) montaFixo(fixas[i]);

    var grades = document.querySelectorAll('[data-vgrid]');
    for (var j = 0; j < grades.length; j++) montaGrade(grades[j]);

    var faixas = document.querySelectorAll('[data-vcar]');
    for (var k = 0; k < faixas.length; k++) {
      if (!faixas[k].hasAttribute('data-vexclude')) monta(faixas[k]);
    }

    montaPagina();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicia);
  } else {
    inicia();
  }
})();
