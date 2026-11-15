/*
 * mindmap-view.js — Zihin Haritası: konuların birbiriyle ilgisi, kaydırmasız tek ekranda.
 *
 *   #/learn/harita            genel harita: ortada ders, çevresinde bölümler, uçlarda dersler
 *   #/learn/harita/ch3[/pcb]  bölüm haritası: ortada bölüm, çevresinde dersler, uçlarda başlıkları
 *
 * Ağaç (bölüm → ders → başlık) Hızlı Tekrar'ın kapsamdaki derslerinden üretilir. Konular arası
 * ilişkiler js/data/mind-links.js'ten gelir: bir konuya tıklayınca ilişkileri çizilir ve alttaki
 * şeritte nedenleriyle listelenir. "Alt başlıklar: gizli" 3. aşama içindir: dersin başlıklarını
 * kendin hatırla, sonra tıklayıp aç.
 */
(function (OSLab) {
  'use strict';

  const HREF = '#/learn/harita';
  const K = () => OSLab.learnKit;
  const MAXF = 16;
  const MINF = 10.5;

  const links = () => OSLab.mindLinks || [];
  const lessons = () => (OSLab.reviewView ? OSLab.reviewView.lessons() : []);
  const strip = (s) => String(s).replace(/<[^>]+>/g, '');

  function linksOf(key) {
    return links().filter((x) => x.a === key || x.b === key).map((x) => ({ other: x.a === key ? x.b : x.a, why: x.why }));
  }

  /* ------------------------------------------------------------ ağaç */

  // Genel harita: dal = bölüm, yaprak = ders. Bölüm haritası: dal = ders, yaprak = başlık.
  function tree(chId) {
    const ls = lessons();
    if (!chId) {
      const chs = [];
      ls.forEach((x) => {
        let c = chs.find((y) => y.ch === x.ch);
        if (!c) chs.push(c = { ch: x.ch, items: [] });
        c.items.push(x);
      });
      return {
        center: { label: 'İşletim Sistemleri', sub: `${chs.length} bölüm · ${ls.length} ders` },
        branches: chs.map((c) => ({
          id: c.ch.id, label: `B${c.ch.num} · ${c.ch.title}`, href: `${HREF}/${c.ch.id}`,
          leaves: c.items.map((x) => ({ id: x.key, key: x.key, label: x.l.title }))
        }))
      };
    }
    const own = ls.filter((x) => x.ch.id === chId);
    if (!own.length) return null;
    const ch = own[0].ch;
    return {
      ch,
      center: { label: `Bölüm ${ch.num}`, sub: ch.title },
      branches: own.map((x) => ({
        id: x.key, key: x.key, label: x.l.title,
        leaves: x.heads.map((h, i) => ({ id: `${x.key}#${i}`, label: strip(h), page: x.page }))
      }))
    };
  }

  // Dalları iki yana böler (sıra korunur): sağ üstten başlar, sol üstten devam eder; yaprak sayıları dengelenir
  function split(branches) {
    const w = branches.map((b) => Math.max(b.leaves.length, 1) + 0.6);
    const total = w.reduce((s, x) => s + x, 0);
    let best = 1;
    let bestD = Infinity;
    let acc = 0;
    for (let i = 1; i < branches.length; i++) {
      acc += w[i - 1];
      const d = Math.abs(total - 2 * acc);
      if (d < bestD) { bestD = d; best = i; }
    }
    return { right: branches.slice(0, best), left: branches.slice(best) };
  }

  /* ------------------------------------------------------------ çizim */

  const showLeaves = () => K().Store.data.mmLeaves !== false;

  function side(list, dir) {
    return `<div class="mm-side mm-${dir}">${list.map((b) => `
      <div class="mm-group">
        <a class="mm-branch" data-id="${b.id}"${b.key ? ` data-key="${b.key}"` : ''} href="${b.href || '#'}">${b.label}${b.key && linksOf(b.key).length ? ` <i class="mm-deg">${linksOf(b.key).length}</i>` : ''}</a>
        <ul class="mm-leaves${b.leaves.length > 7 && !b.key ? ' mm-two' : ''}">${b.leaves.map((f) => `<li><a class="mm-leaf" data-id="${f.id}"${f.key ? ` data-key="${f.key}"` : ''} href="${f.key ? '#' : `${OSLab.reviewView.HREF}/${f.page + 1}`}">${f.label}${f.key && linksOf(f.key).length ? ` <i class="mm-deg">${linksOf(f.key).length}</i>` : ''}</a></li>`).join('')}</ul>
      </div>`).join('')}</div>`;
  }

  function tabs(chId) {
    const chs = [];
    lessons().forEach((x) => { if (!chs.includes(x.ch)) chs.push(x.ch); });
    return `<nav class="mm-tabs" aria-label="Harita seç">
      <a class="mm-tab${!chId ? ' on' : ''}" href="${HREF}">Genel</a>
      ${chs.map((c) => `<a class="mm-tab${chId === c.id ? ' on' : ''}" href="${HREF}/${c.id}" title="${K().esc(c.title)}">B${c.num}</a>`).join('')}
    </nav>`;
  }

  function page(chId) {
    const t = tree(chId) || tree(null);
    const { left, right } = split(t.branches);
    const leavesHidden = t.ch && !showLeaves();
    return `<div class="fx mm${t.ch ? ' mm-chapter' : ' mm-overview'}${leavesHidden ? ' mm-hide' : ''}">
      <header class="fx-top mm-top">
        <button class="icon-btn fx-menu" type="button" data-act="menu" aria-label="Menüyü aç">☰</button>
        <div class="mm-title"><b>Zihin Haritası</b><span>${t.ch ? `Bölüm ${t.ch.num}: ${t.ch.title}` : 'Bölümler ve dersler'}</span></div>
        ${tabs(t.ch && t.ch.id)}
        <div class="mm-tools">
          ${t.ch
            ? `<button class="btn btn-sm" type="button" data-mm="leaves">Alt başlıklar: ${leavesHidden ? 'gizli' : 'açık'}</button>`
            : `<button class="btn btn-sm${K().Store.data.mmAll ? ' on' : ''}" type="button" data-mm="all">Tüm ilişkiler</button>`}
          <a class="btn btn-sm" href="${OSLab.reviewView.HREF}">Hızlı Tekrar</a>
        </div>
      </header>
      <div class="mm-stage" id="mm-stage">
        <svg class="mm-wires" id="mm-wires" aria-hidden="true"></svg>
        <div class="mm-grid" id="mm-grid">
          ${side(left, 'left')}
          <div class="mm-center"><b>${t.center.label}</b><span>${t.center.sub}</span></div>
          ${side(right, 'right')}
        </div>
      </div>
      <div class="mm-info" id="mm-info">${hint(t)}</div>
    </div>`;
  }

  const hint = (t) => `<p class="mm-hint">${t.ch
    ? 'Bir derse tıkla: başka konularla ilişkileri çizilir ve burada nedenleriyle listelenir. Bir başlığa tıklamak o konunun tekrar sayfasını açar.'
    : 'Bir bölüme ya da derse tıkla: ilişkileri çizilir ve burada nedenleriyle listelenir. Bölüm adına iki kez tıklamak bölüm haritasını açar.'}${links().length ? ` <span>${links().length} ilişki</span>` : ''}</p>`;

  /* ------------------------------------------------------------ çizgiler */

  function center(el, stage) {
    const r = el.getBoundingClientRect();
    const s = stage.getBoundingClientRect();
    return { l: r.left - s.left, r: r.right - s.left, y: r.top - s.top + r.height / 2, x: r.left - s.left + r.width / 2, t: r.top - s.top, b: r.bottom - s.top };
  }

  const curve = (x1, y1, x2, y2, cls) => {
    const mx = (x1 + x2) / 2;
    return `<path class="${cls}" d="M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}"/>`;
  };

  function wires() {
    const stage = S.root.querySelector('#mm-stage');
    const svg = S.root.querySelector('#mm-wires');
    const c = center(S.root.querySelector('.mm-center'), stage);
    let out = '';
    S.root.querySelectorAll('.mm-group').forEach((g) => {
      const left = !!g.closest('.mm-left');
      const b = center(g.querySelector('.mm-branch'), stage);
      out += curve(left ? c.l : c.r, c.y, left ? b.r : b.l, b.y, 'mm-w1');
      g.querySelectorAll('.mm-leaf').forEach((lf) => {
        const f = center(lf, stage);
        out += curve(left ? b.l : b.r, b.y, left ? f.r + 2 : f.l - 2, f.y, 'mm-w2');
      });
    });
    out += relWires(stage);
    svg.innerHTML = out;
  }

  // İlişki çizgileri: yalnızca ekranda görünen iki konu arasında
  function relWires(stage) {
    const pairs = [];
    if (S.sel) linksOf(S.sel).forEach((x) => pairs.push([S.sel, x.other]));
    else if (S.selCh) links().filter((x) => x.a.startsWith(S.selCh + '/') || x.b.startsWith(S.selCh + '/')).forEach((x) => pairs.push([x.a, x.b]));
    else if (!S.chId && K().Store.data.mmAll) links().forEach((x) => pairs.push([x.a, x.b]));
    const stageR = stage.getBoundingClientRect();
    const node = (key) => S.root.querySelector(`[data-key="${CSS.escape(key)}"]`);
    return pairs.map(([a, b]) => {
      const na = node(a);
      const nb = node(b);
      if (!na || !nb) return '';
      const A = center(na, stage);
      const B = center(nb, stage);
      const ax = na.closest('.mm-left') ? A.l : A.r;
      const bx = nb.closest('.mm-left') ? B.l : B.r;
      const mid = stageR.width / 2;
      // Uçlar dış kenarda kalır; çizgi haritanın ortasına doğru kavis yapar
      const pull = (x) => x + (mid - x) * 0.55;
      return `<path class="mm-rel" d="M${ax},${A.y} C${pull(ax)},${A.y} ${pull(bx)},${B.y} ${bx},${B.y}"/>`;
    }).join('');
  }

  /* ------------------------------------------------------------ seçim ve bilgi şeridi */

  const lessonByKey = (key) => lessons().find((x) => x.key === key);

  function info() {
    const box = S.root.querySelector('#mm-info');
    const t = tree(S.chId) || tree(null);
    if (!S.sel && !S.selCh) { box.innerHTML = hint(t); return; }
    if (S.selCh) {
      const ch = K().chapters().find((c) => c.id === S.selCh);
      const ls = links().filter((x) => x.a.startsWith(S.selCh + '/') !== x.b.startsWith(S.selCh + '/') && (x.a.startsWith(S.selCh + '/') || x.b.startsWith(S.selCh + '/')));
      box.innerHTML = `<div class="mm-sel"><b>Bölüm ${ch.num}: ${ch.title}</b><span>diğer bölümlerle ${ls.length} ilişki</span>
        <a class="btn btn-sm btn-primary" href="${HREF}/${ch.id}">Bölüm haritasını aç</a></div>
        <ul class="mm-rels">${ls.map((x) => relItem(x.a.startsWith(S.selCh + '/') ? x.a : x.b, x.a.startsWith(S.selCh + '/') ? x.b : x.a, x.why)).join('')}</ul>`;
      return;
    }
    const me = lessonByKey(S.sel);
    const rs = linksOf(S.sel);
    box.innerHTML = `<div class="mm-sel"><b>B${me.ch.num} · ${me.l.title}</b><span>${rs.length ? `${rs.length} ilişki` : 'henüz ilişki tanımlı değil'}</span>
      <a class="btn btn-sm btn-primary" href="${OSLab.reviewView.HREF}/${me.page + 1}">Tekrar sayfası</a>
      <a class="btn btn-sm" href="${K().lessonHref(me.ch, me.l)}">Derse git</a></div>
      <ul class="mm-rels">${rs.map((x) => relItem(S.sel, x.other, x.why)).join('')}</ul>`;
  }

  function relItem(from, to, why) {
    const o = lessonByKey(to);
    if (!o) return '';
    const here = !!S.root.querySelector(`[data-key="${CSS.escape(to)}"]`);
    const href = here ? '#' : `${HREF}/${o.ch.id}/${o.l.id}`;
    return `<li><a class="mm-to" href="${href}" data-go="${to}">B${o.ch.num} · ${o.l.title}</a><span>${K().esc(why)}</span></li>`;
  }

  function select(key, chId) {
    S.sel = key || null;
    S.selCh = chId || null;
    S.root.querySelectorAll('.mm-on, .mm-rel-on').forEach((x) => x.classList.remove('mm-on', 'mm-rel-on'));
    if (S.sel) {
      S.root.querySelectorAll(`[data-key="${CSS.escape(S.sel)}"]`).forEach((x) => x.classList.add('mm-on'));
      linksOf(S.sel).forEach((x) => S.root.querySelectorAll(`[data-key="${CSS.escape(x.other)}"]`).forEach((n) => n.classList.add('mm-rel-on')));
    }
    if (S.selCh) S.root.querySelectorAll(`[data-id="${S.selCh}"]`).forEach((x) => x.classList.add('mm-on'));
    S.root.querySelector('.mm').classList.toggle('mm-focus', !!(S.sel || S.selCh));
    info();
    fit();
  }

  /* ------------------------------------------------------------ ekrana sığdırma */

  function fit() {
    const stage = S.root.querySelector('#mm-stage');
    const grid = S.root.querySelector('#mm-grid');
    // Yanlar dikeyde ortalandığı için taşma üstten de olabilir: her yanın kendi yüksekliğine bakılır
    const over = () => grid.scrollWidth > grid.clientWidth + 1
      || [...grid.children].some((c) => c.offsetHeight > grid.clientHeight + 1 || c.scrollWidth > c.clientWidth + 1);
    let f = MAXF;
    grid.style.fontSize = `${f}px`;
    while (over() && f > MINF) {
      f -= 0.5;
      grid.style.fontSize = `${f}px`;
    }
    S.font = f;
    S.overflow = over();
    stage.classList.toggle('mm-overflow', S.overflow);
    wires();
  }

  /* ------------------------------------------------------------ olaylar */

  let S = null;

  function onClick(e) {
    if (!S) return;
    const tool = e.target.closest('[data-mm]');
    if (tool) {
      const k = K();
      if (tool.dataset.mm === 'leaves') k.Store.data.mmLeaves = !showLeaves();
      if (tool.dataset.mm === 'all') k.Store.data.mmAll = !k.Store.data.mmAll;
      k.Store.save();
      if (tool.dataset.mm === 'leaves') {
        S.root.querySelector('.mm').classList.toggle('mm-hide', !showLeaves());
        tool.textContent = `Alt başlıklar: ${showLeaves() ? 'açık' : 'gizli'}`;
        S.root.querySelectorAll('.mm-shown').forEach((x) => x.classList.remove('mm-shown'));
      } else {
        tool.classList.toggle('on', !!k.Store.data.mmAll);
      }
      fit();
      return;
    }
    const go = e.target.closest('[data-go]');
    if (go && go.getAttribute('href') === '#') { e.preventDefault(); select(go.dataset.go); return; }
    // Gizli başlık: ilk tıklama açar, ikincisi tekrar sayfasına gider
    const leaf = e.target.closest('.mm-leaf');
    if (leaf && !leaf.dataset.key && S.root.querySelector('.mm-hide') && !leaf.classList.contains('mm-shown')) {
      e.preventDefault();
      leaf.classList.add('mm-shown');
      return;
    }
    const n = e.target.closest('[data-key]');
    if (n) { e.preventDefault(); select(S.sel === n.dataset.key ? null : n.dataset.key); return; }
    const br = e.target.closest('.mm-branch');
    if (br && !S.chId) {
      // Genel haritada bölüm: tek tık seçer, ikinci tık bölüm haritasını açar
      if (S.selCh !== br.dataset.id) { e.preventDefault(); select(null, br.dataset.id); }
      return;
    }
    if (e.target.closest('#mm-stage') && !e.target.closest('a')) select(null);
  }

  let resizeT = 0;
  function onResize() {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => { if (S) fit(); }, 120);
  }

  function start(root, chId, lessonId) {
    stop();
    S = { root, chId: tree(chId) ? chId : null, sel: null, selCh: null };
    root.addEventListener('click', onClick);
    addEventListener('resize', onResize);
    fit();
    if (S.chId && lessonId) select(`${S.chId}/${lessonId}`);
  }

  function stop() {
    if (!S) return;
    S.root.removeEventListener('click', onClick);
    removeEventListener('resize', onResize);
    S = null;
  }

  // Denetim: bu ekranda her haritanın sığıp sığmadığı ve yazı boyutu (önce #/learn/harita açık olmalı)
  async function audit() {
    if (!S) throw new Error('Önce #/learn/harita sayfasını aç.');
    const root = S.root;
    const ids = [null].concat([...new Set(lessons().map((x) => x.ch.id))]);
    const out = [];
    for (const id of ids) {
      root.querySelector('.learn').innerHTML = page(id);
      start(root, id);
      await new Promise((r) => setTimeout(r, 0));
      out.push({ map: id || 'genel', font: S.font, overflow: S.overflow });
    }
    const keys = new Set(lessons().map((x) => x.key));
    const bad = links().filter((x) => !keys.has(x.a) || !keys.has(x.b)).map((x) => `${x.a} — ${x.b}`);
    return { viewport: `${innerWidth}x${innerHeight}`, maps: out, badLinks: bad, links: links().length };
  }

  OSLab.mindMap = { HREF, page, start, stop, audit };
})(window.OSLab = window.OSLab || {});
