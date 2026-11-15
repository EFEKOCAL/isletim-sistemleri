/*
 * review-view.js — Hızlı Tekrar: dersler konu konu, her konu kaydırmasız tek ekranda.
 *
 *   2. aşama "Bütün"     : dersin bütün bilgisi (tanım, liste, tablo, şekil, kod, not) tek sayfada.
 *   3. aşama "Başlıklar" : aynı sayfa; başlık, terim ve kalın anahtar sözcükler görünür, açıklamalar
 *                          bulanıklaşır. Okuyan kişi konuyu başlıklardan kendisi anlatır, sonra tıklayıp
 *                          kontrol eder.
 *
 * Sayfa bölümü js/data/review-pages.js'ten gelir (bir sayfada yalnızca birbiriyle ilgili başlıklar).
 * Planda olmayan ders kendi başına bir sayfa olur; plandan kaçan başlık sona eklenir ki hiçbir bilgi
 * kaybolmasın. Kapsam (vize dışı dersler ve başlıklar) exam-scope.js'ten okunur.
 *
 * Sığdırma: sığan en büyük yazı boyutu (MAX → MIN) ve o boyutta sığan en az sütun seçilir; sütunlar
 * dengeli dolar ve içerik sayfanın ortasında durur (boşluk sağda-solda, üstte-altta eşit).
 * OSLab.reviewView.audit() tüm sayfaları bu ekranda dener ve sığmayanları döndürür.
 *
 * Rota: #/learn/hizli[/<sayfa no>]
 */
(function (OSLab) {
  'use strict';

  const HREF = '#/learn/hizli';
  const MAX = 20;
  const MIN = 12;
  const STEP = 0.5;

  const K = () => OSLab.learnKit;

  /* ------------------------------------------------------------ sayfaları kur */

  // Dersi başlık (h) birimlerine böler. İlk başlıktan önceki bloklar '' adlı birimdir.
  function sectionsOf(l) {
    const secs = [{ h: '', blocks: [] }];
    l.blocks.forEach((bl) => {
      if (bl.t === 'h') secs.push({ h: bl.text, blocks: [] });
      else if (bl.t !== 'br') secs[secs.length - 1].blocks.push(bl);
    });
    return secs.filter((s) => s.h || s.blocks.length);
  }

  // Vize dışı başlıkları atar (exam-scope.js: from = bu başlıktan sonrası dışarıda)
  function inScopeSections(ch, l) {
    const k = K();
    const st = k.scopeOf(ch, l);
    if (st === 'out') return [];
    const secs = sectionsOf(l);
    if (st !== 'partial') return secs;
    const rule = k.scopeRule(ch, l);
    const cut = secs.findIndex((s) => s.h && s.h.startsWith(rule.from));
    return cut < 0 ? secs : secs.slice(0, cut);
  }

  let PAGES = null;
  let MISSING = [];

  function build() {
    if (PAGES) return PAGES;
    const k = K();
    const plan = (OSLab.reviewPages && OSLab.reviewPages.pages) || [];
    const pages = [];
    MISSING = [];
    k.chapters().forEach((ch) => {
      if (k.scope() && k.scope().chapters[ch.id]) return;
      ch.lessons.forEach((l) => {
        if (l.review || l.intro) return;
        const secs = inScopeSections(ch, l);
        if (!secs.length) return;
        const key = k.lessonKey(ch, l);
        const used = secs.map((s) => new Array(s.blocks.length).fill(false));
        const usedH = secs.map(() => false);
        const own = plan.filter((p) => p.l === key);
        const mk = (parts, title) => {
          const blocks = [];
          parts.forEach(({ si, from, to }) => {
            const s = secs[si];
            const cont = from > 0;
            if (s.h) blocks.push({ t: 'h', text: cont ? `${s.h} <small>(devam)</small>` : s.h });
            s.blocks.slice(from, to).forEach((b, j) => { blocks.push(b); used[si][from + j] = true; });
            usedH[si] = true;
          });
          pages.push({ ch, l, key, title: title || l.title, blocks, heads: parts.map((p) => secs[p.si].h).filter(Boolean) });
        };
        own.forEach((p) => {
          const parts = [];
          (p.secs || []).forEach((h) => {
            const si = secs.findIndex((s) => s.h === h);
            if (si < 0) { MISSING.push(`${key}: planda olup derste bulunmayan başlık "${h}"`); return; }
            const [from, to] = p.range && p.secs.length === 1 ? p.range : [0, secs[si].blocks.length];
            parts.push({ si, from, to: Math.min(to, secs[si].blocks.length) });
          });
          if (parts.length) mk(parts, p.title);
        });
        // Planın dokunmadığı bilgiler: kaybolmasın diye sona eklenir
        const rest = [];
        secs.forEach((s, si) => {
          const left = used[si].map((u, j) => (u ? -1 : j)).filter((j) => j >= 0);
          if (!left.length && (usedH[si] || !s.h)) return;
          if (own.length) MISSING.push(`${key}: planda olmayan bilgi → "${s.h || '(giriş)'}"`);
          rest.push({ si, from: left.length ? left[0] : 0, to: left.length ? left[left.length - 1] + 1 : 0 });
        });
        if (rest.length) mk(rest);
      });
    });
    pages.forEach((p, i) => { p.n = i; });
    PAGES = pages;
    if (MISSING.length) console.warn('[hızlı tekrar] sayfa planı eksik:\n' + MISSING.join('\n'));
    return pages;
  }

  /* ------------------------------------------------------------ çizim */

  const mode = () => (K().Store.data.rvMode === 'recall' ? 'recall' : 'full');

  function topBar(pages, cur) {
    const groups = [];
    pages.forEach((p) => {
      const g = groups[groups.length - 1];
      if (g && g.ch === p.ch) g.pages.push(p);
      else groups.push({ ch: p.ch, pages: [p] });
    });
    return `<header class="fx-top rv-top">
      <button class="icon-btn fx-menu" type="button" data-act="menu" aria-label="Menüyü aç">☰</button>
      <div class="fx-progress">
        <div class="fx-bar">${groups.map((g) => `<div class="fx-ch" style="flex-grow:${g.pages.length}">
          <div class="fx-segs">${g.pages.map((p) => `<a class="fx-seg${p.n < cur.n ? ' read' : ''}${p === cur ? ' active' : ''}" href="${HREF}/${p.n + 1}" title="B${p.ch.num} · ${K().esc(p.title.replace(/<[^>]+>/g, ''))}"><span><i style="width:${p.n <= cur.n ? 100 : 0}%"></i></span></a>`).join('')}</div>
          <div class="fx-chname"><span>${g.ch.title}</span><small>B${g.ch.num}</small></div>
        </div>`).join('')}</div>
      </div>
      <div class="rv-modes" role="group" aria-label="Tekrar aşaması">
        <button type="button" class="rv-mode${mode() === 'full' ? ' on' : ''}" data-rv="full" title="2. aşama: konunun bütün bilgisi">Bütün</button>
        <button type="button" class="rv-mode${mode() === 'recall' ? ' on' : ''}" data-rv="recall" title="3. aşama: yalnızca başlıklar ve anahtar sözcükler">Başlıklar</button>
      </div>
    </header>`;
  }

  function pageHtml(p) {
    const k = K();
    const total = build().length;
    const tq = k.questionsFor(p.key);
    const sameLesson = build().filter((x) => x.key === p.key);
    const part = sameLesson.length > 1 ? ` <small class="rv-part">${sameLesson.indexOf(p) + 1}/${sameLesson.length}</small>` : '';
    const blocks = p.blocks.map((bl) => (bl.t === 'h'
      ? `<h3 class="l-h rv-h">${bl.text}</h3>`
      : `<div class="rv-b rv-${bl.t}">${bl.t === 'solve' ? solveHtml(bl) : k.renderBlock(bl)}</div>`)).join('');
    return `<div class="rv-head">
        <span class="rv-where">Bölüm ${p.ch.num} · ${p.ch.title}</span>
        <h2 class="rv-title">${p.title}${part}</h2>
        <span class="rv-meta">
          ${tq.length ? `<a class="rv-tq" href="#/learn/sorular/${tq[0].id}" title="Bu dersten ${tq.length} hoca sorusu">★ ${tq.length}</a>` : ''}
          <a class="rv-lesson" href="#/learn/harita/${p.ch.id}/${p.l.id}" title="Bu konunun diğer konularla ilişkisi">Haritada gör</a>
          <a class="rv-lesson" href="${k.lessonHref(p.ch, p.l)}" title="Dersi kart kart aç">Derse git ↗</a>
          <span class="rv-count">${p.n + 1} / ${total}</span>
        </span>
      </div>
      <div class="rv-body l-body" id="rv-body">${blocks}</div>`;
  }

  // Çözümlü örnek: tekrar sayfasında çözüm baştan açıktır
  function solveHtml(bl) {
    return `<div class="l-solve"><span class="tag">${bl.title}</span><p class="l-solve-q">${bl.q}</p><div class="l-solve-a">${bl.dg ? OSLab.diagrams.render(bl.dg) : ''}<p>${bl.a}</p></div></div>`;
  }

  function current(param) {
    const pages = build();
    const saved = K().Store.data.rvPage || 0;
    const n = param ? (parseInt(param, 10) || 1) - 1 : saved;
    return pages[Math.min(Math.max(n, 0), pages.length - 1)];
  }

  function page(param) {
    const pages = build();
    if (!pages.length) return '<p class="empty">Tekrar edilecek ders yok.</p>';
    const p = current(param);
    return `<div class="fx rv rv-${mode()}">
      ${topBar(pages, p)}
      <main class="rv-page" id="rv-page">${pageHtml(p)}</main>
      <nav class="rv-nav">
        <button class="btn rv-prev" type="button" data-rvgo="-1" aria-label="Önceki sayfa"${p.n === 0 ? ' disabled' : ''}>‹</button>
        <button class="btn btn-primary rv-next" type="button" data-rvgo="1" aria-label="Sonraki sayfa"${p.n === pages.length - 1 ? ' disabled' : ''}>›</button>
      </nav>
    </div>`;
  }

  /* ------------------------------------------------------------ ekrana sığdırma */

  const overflows = (body) => body.scrollWidth > body.clientWidth + 1 || body.scrollHeight > body.clientHeight + 1;

  // Geniş şekiller sütuna küçültülerek sığdırılır. Şekillerin boyu yazı boyutuyla küçülmez; sütundan
  // uzun bir şekil (ve onu taşıyan blok) hiçbir yazı boyutunda sığmayacağından yüksekliğe göre de küçülür.
  function shrinkFigures(body) {
    const H = body.clientHeight;
    body.querySelectorAll('.dg-stage, .table-wrap, .l-code, .l-codex').forEach((el) => {
      el.style.zoom = '';
      const w = el.scrollWidth;
      const c = el.clientWidth;
      let z = w > c + 1 ? c / w : 1;
      if (el.classList.contains('dg-stage')) {
        const box = el.closest('.rv-b') || el;
        let extra = 0; // bloğun şekil dışındaki kısımları (düğmeler, açıklama, soru metni, iç boşluk)
        for (let p = el; p !== box && p.parentElement; p = p.parentElement) {
          [...p.parentElement.children].forEach((s) => { if (s !== p) extra += s.offsetHeight; });
          const cs = getComputedStyle(p.parentElement);
          extra += parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom) + parseFloat(cs.borderTopWidth) + parseFloat(cs.borderBottomWidth);
        }
        const room = H * 0.97 - extra;
        if (el.offsetHeight * z > room) z = room / el.offsetHeight;
      }
      if (z < 1) el.style.zoom = String(Math.max(z, 0.55));
    });
  }

  // Yerleşim: önce sığan en büyük yazı boyutu, sonra o boyutta sığan en az sütun. Sütunlar dengeli
  // doldurulur ve blok sayfanın ortasına konur; böylece boşluk sağda, solda, altta eşit kalır.
  const GAP = 28;
  const colW = (f) => 25 * f;
  const minW = (f) => 19 * f;

  function layout(body, f, n, W) {
    body.style.fontSize = `${f}px`;
    body.style.columnCount = String(n);
    body.style.width = `${Math.min(W, n * colW(f) + (n - 1) * GAP)}px`;
    shrinkFigures(body);
    return !overflows(body);
  }

  function fit(body) {
    // Kullanılabilir alanı ölç, sonra ölçüm için yüksekliği sabitle
    body.style.cssText = '';
    const W = body.clientWidth;
    const H = body.clientHeight;
    body.style.flex = 'none';
    body.style.height = `${H}px`;
    let size = MIN;
    let cols = Math.max(1, Math.floor((W + GAP) / (minW(MIN) + GAP)));
    let ok = false;
    for (let f = MAX; f >= MIN && !ok; f -= STEP) {
      const nMax = Math.max(1, Math.floor((W + GAP) / (minW(f) + GAP)));
      // Az sütun her zaman daha kısa değildir: dar sütunda tablolar uzar. Bu yüzden her sütun sayısı denenir.
      for (let n = 1; n <= nMax; n++) {
        if (layout(body, f, n, W)) { size = f; cols = n; ok = true; break; }
      }
    }
    layout(body, size, cols, W);
    const bad = overflows(body);
    // Sığdıysa yükseklik içeriğe göre kısalır ve blok dikeyde de ortalanır
    if (!bad) body.style.height = 'auto';
    body.style.maxHeight = `${H}px`;
    body.classList.toggle('rv-overflow', bad);
    return { size, bad, cols };
  }

  /* ------------------------------------------------------------ olaylar */

  let S = null; // { root, wheelAt }

  function go(n) {
    const pages = build();
    if (n < 0 || n >= pages.length) return;
    location.hash = `${HREF}/${n + 1}`;
  }

  function onKey(e) {
    if (!S || e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
    const p = current(S.param);
    let d = 0;
    if (['ArrowRight', 'ArrowDown', 'PageDown'].includes(e.key) || (e.key === ' ' && !e.shiftKey)) d = 1;
    else if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key) || (e.key === ' ' && e.shiftKey)) d = -1;
    else if (e.key === 'b' || e.key === 'B') { setMode(mode() === 'full' ? 'recall' : 'full'); return; }
    if (!d) return;
    e.preventDefault();
    go(p.n + d);
  }

  function onWheel(e) {
    if (e.ctrlKey || Math.abs(e.deltaY) < Math.abs(e.deltaX) || Math.abs(e.deltaY) < 4) return;
    e.preventDefault();
    const now = Date.now();
    if (now - S.wheelAt < 700) { S.wheelAt = now; return; }
    S.wheelAt = now;
    go(current(S.param).n + Math.sign(e.deltaY));
  }

  function setMode(m) {
    const k = K();
    k.Store.data.rvMode = m;
    k.Store.save();
    const rv = S.root.querySelector('.rv');
    rv.classList.toggle('rv-recall', m === 'recall');
    rv.classList.toggle('rv-full', m === 'full');
    rv.querySelectorAll('[data-rv]').forEach((b) => b.classList.toggle('on', b.dataset.rv === m));
    rv.querySelectorAll('.rv-open').forEach((b) => b.classList.remove('rv-open'));
  }

  function onClick(e) {
    if (!S) return;
    const m = e.target.closest('[data-rv]');
    if (m) { setMode(m.dataset.rv); return; }
    const g = e.target.closest('[data-rvgo]');
    if (g) { go(current(S.param).n + Number(g.dataset.rvgo)); return; }
    // 3. aşamada bulanık bloğa tıklamak onu açar / kapatır
    if (mode() === 'recall' && !e.target.closest('a, button')) {
      const b = e.target.closest('.rv-b');
      if (b) b.classList.toggle('rv-open');
    }
  }

  let resizeT = 0;
  function onResize() {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => { if (S) fit(S.root.querySelector('#rv-body')); }, 120);
  }

  function start(root, param) {
    stop();
    const p = current(param);
    S = { root, param, wheelAt: 0 };
    const k = K();
    k.Store.data.rvPage = p.n;
    k.Store.save();
    try { history.replaceState(null, '', `${HREF}/${p.n + 1}`); } catch (e) { /* yok say */ }
    S.param = String(p.n + 1);
    root.addEventListener('click', onClick);
    document.addEventListener('keydown', onKey);
    root.querySelector('#rv-page').addEventListener('wheel', onWheel, { passive: false });
    addEventListener('resize', onResize);
    fit(root.querySelector('#rv-body'));
  }

  function stop() {
    if (!S) return;
    S.root.removeEventListener('click', onClick);
    document.removeEventListener('keydown', onKey);
    removeEventListener('resize', onResize);
    S = null;
  }

  // Denetim: bütün sayfaları bu ekranda dener; sığmayanları ve kullanılan yazı boyutunu döndürür
  async function audit() {
    if (!S) throw new Error('Önce #/learn/hizli sayfasını aç.');
    const host = S.root.querySelector('#rv-page');
    const keep = host.innerHTML;
    const out = [];
    for (const p of build()) {
      host.innerHTML = pageHtml(p);
      OSLab.diagrams.init(host);
      await new Promise((r) => setTimeout(r, 0));
      const r = fit(host.querySelector('#rv-body'));
      out.push({ page: p.n + 1, lesson: p.key, title: p.title, heads: p.heads, size: r.size, overflow: r.bad });
    }
    host.innerHTML = keep;
    OSLab.diagrams.init(host);
    fit(host.querySelector('#rv-body'));
    return { viewport: `${innerWidth}x${innerHeight}`, pages: out.length, missing: MISSING.slice(), overflow: out.filter((x) => x.overflow), small: out.filter((x) => x.size < 13.5), all: out };
  }

  OSLab.reviewView = {
    HREF,
    page,
    start,
    stop,
    audit,
    count: () => build().length,
    pages: () => build(),
    // Zihin haritası için: kapsamdaki dersler, başlıkları ve ilk tekrar sayfaları
    lessons: () => {
      const out = [];
      build().forEach((p) => {
        let x = out.find((o) => o.key === p.key);
        if (!x) out.push(x = { ch: p.ch, l: p.l, key: p.key, page: p.n, heads: [] });
        p.heads.forEach((h) => { if (!x.heads.includes(h)) x.heads.push(h); });
      });
      return out;
    }
  };
})(window.OSLab = window.OSLab || {});
