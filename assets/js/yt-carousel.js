/* ==========================================================================
   TV Brasília · motor do carrossel de vídeos do canal
   --------------------------------------------------------------------------
   Monta as faixas marcadas com [data-vcar] a partir de window.TVB_YT.videos.
   Sem dependências e sem chamadas de rede: os dados e as miniaturas já vêm
   embutidos no HTML/JS, então a faixa aparece junto com o resto da página.

   Atributos reconhecidos na faixa:
     data-vlimit="15"      usa só os N primeiros vídeos
     data-vexclude="<id>"  deixa de fora um vídeo (usado na página do vídeo)
   ========================================================================== */
(function () {
  'use strict';

  var DATA = (window.TVB_YT && window.TVB_YT.videos) || [];
  if (!DATA.length) return;

  var REDUZ = false;
  try {
    REDUZ = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) {}

  var ICONE = {
    play: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>',
    seta: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.4 4.6 8 12l7.4 7.4 1.4-1.4L10.8 12l6-6z"/></svg>',
    ponto: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5"/></svg>'
  };

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  /* ------------------------------------------------------------ cartão -- */
  function cardHTML(v, i) {
    var tag = v.prog ? '<span class="vcard__tag">' + esc(v.prog) + '</span>' : '';
    return '' +
      '<a class="vcard" href="video.html?v=' + encodeURIComponent(v.id) + '"' +
      ' data-vid="' + esc(v.id) + '" title="' + esc(v.full || v.title) + '">' +
        '<span class="vcard__thumb">' +
          '<img src="assets/img/' + esc(v.file) + '" alt="' + esc(v.full || v.title) + '"' +
          ' width="560" height="315" loading="lazy" decoding="async">' +
          tag +
          '<span class="vcard__play"><i>' + ICONE.play + '</i></span>' +
        '</span>' +
        '<span class="vcard__b">' +
          '<strong class="vcard__t">' + esc(v.title) + '</strong>' +
          '<span class="vcard__m">' + ICONE.ponto +
            '<span>Vídeo ' + (i + 1) + ' de ' + DATA.length + ' &middot; ' + esc(v.date) + '</span>' +
          '</span>' +
        '</span>' +
      '</a>';
  }

  /* ------------------------------------------------------------- faixa -- */
  function monta(root) {
    var track = root.querySelector('[data-vtrack]');
    if (!track) return;

    var lim = parseInt(root.getAttribute('data-vlimit'), 10);
    var fora = root.getAttribute('data-vexclude');
    var lista = DATA.filter(function (v) { return v.id !== fora; });
    if (lim > 0) lista = lista.slice(0, lim);
    if (!lista.length) return;

    var html = '';
    for (var i = 0; i < lista.length; i++) html += cardHTML(lista[i], i);
    track.innerHTML = html;

    var dotsBox = root.querySelector('[data-vdots]');
    var bar = root.querySelector('[data-vbar]');
    var btnP = root.querySelector('[data-vnav="prev"]');
    var btnN = root.querySelector('[data-vnav="next"]');
    var cards = [].slice.call(track.children);

    /* quantos cartões cabem por "página" (acompanha o CSS) */
    function porPagina() {
      var w = track.clientWidth;
      if (w < 480) return 1;
      if (w < 1000) return 2;
      return 3;
    }

    function paginas() {
      return Math.max(1, Math.ceil(lista.length / porPagina()));
    }

    /* pontos */
    function pintaDots() {
      if (!dotsBox) return;
      var n = paginas();
      if (dotsBox.children.length !== n) {
        var s = '';
        for (var i = 0; i < n; i++) {
          s += '<button class="vcar__dot" type="button" data-vdot="' + i +
               '" aria-label="Ir para a página ' + (i + 1) + '"></button>';
        }
        dotsBox.innerHTML = s;
      }
    }

    /* qual página está visível: pelo primeiro cartão encostado à esquerda */
    function atual() {
      var x = track.scrollLeft, melhor = 0, dist = Infinity;
      for (var i = 0; i < cards.length; i++) {
        var d = Math.abs(cards[i].offsetLeft - track.offsetLeft - x);
        if (d < dist) { dist = d; melhor = i; }
      }
      return Math.floor(melhor / porPagina());
    }

    function passo() {
      return Math.max(220, Math.round(track.clientWidth * 0.94));
    }

    function sincroniza() {
      var p = atual(), n = paginas();
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

    /* teclado quando a faixa está focada */
    track.addEventListener('keydown', function (ev) {
      if (ev.key === 'ArrowRight') { rola(passo()); ev.preventDefault(); }
      else if (ev.key === 'ArrowLeft') { rola(-passo()); ev.preventDefault(); }
    });

    /* roda do mouse na horizontal (desktop) */
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

  /* ------------------------------------------------- página do vídeo --- */
  function montaPagina() {
    var alvo = document.querySelector('[data-vplayer]');
    if (!alvo) return;

    var id = new URLSearchParams(location.search).get('v');
    var v = null;
    for (var i = 0; i < DATA.length; i++) if (DATA[i].id === id) { v = DATA[i]; break; }
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
        (v.prog ? '<span class="vchip vchip--plain">' + esc(v.prog) + '</span>' : '') +
        '<span class="vchip vchip--plain">' + esc(v.date) + '</span>' +
        '<a class="vchip vchip--yt" href="https://www.youtube.com/watch?v=' + esc(v.id) + '"' +
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
    var faixas = document.querySelectorAll('[data-vcar]');
    for (var i = 0; i < faixas.length; i++) {
      if (!faixas[i].hasAttribute('data-vexclude')) monta(faixas[i]);
    }
    montaPagina();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicia);
  } else {
    inicia();
  }
})();
