/*
 * learn-view.js — "Ders Notları" modülü: teori önce, laboratuvar sonra.
 *
 * Rotalar:
 *   #/learn                 başlangıç ekranı (ilerleme çubuğu ve büyük başla düğmesi)
 *   #/learn/plan            genel bakış (çalışma yöntemi, bölümler, dönem planı)
 *   #/learn/ch2             bölüm özeti
 *   #/learn/ch2/baglayici[/3|/son]   ders: dikey kart akışı (kart numarası isteğe bağlı)
 *   #/learn/sorular[/h5]    hocanın soruları (aralıklı tekrar)
 *
 * İlerleme tarayıcının localStorage'ında tutulur; erişilemezse sayfa yine çalışır.
 */
(function (OSLab) {
  'use strict';

  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const today = () => new Date().toISOString().slice(0, 10);

  /* ------------------------------------------------------------ ilerleme kaydı */

  const Store = {
    key: 'oslab.learn.v1',
    data: { read: {}, seen: {}, q: {}, checks: {}, drafts: {} },
    load() {
      try {
        const raw = JSON.parse(localStorage.getItem(this.key));
        if (raw) Object.assign(this.data, raw);
      } catch (e) { /* gizli pencere vb.: ilerleme kaydedilmez */ }
    },
    save() {
      try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) { /* yok say */ }
    }
  };
  Store.load();

  // Kutu: 0 yeni, 1 tekrar et, 2 gelişiyor, 3 öğrenildi
  const BOX = [
    { id: 0, label: 'Yeni', cls: 'b0' },
    { id: 1, label: 'Tekrar et', cls: 'b1' },
    { id: 2, label: 'Gelişiyor', cls: 'b2' },
    { id: 3, label: 'Öğrenildi', cls: 'b3' }
  ];
  const qState = (id) => Store.data.q[id] || { box: 0 };

  /* ------------------------------------------------------------ veri yardımcıları */

  const chapters = () => OSLab.lessons.chapters;
  const findChapter = (id) => chapters().find((c) => c.id === id);
  const lessonKey = (ch, l) => `${ch.id}/${l.id}`;
  const isRead = (ch, l) => !!Store.data.read[lessonKey(ch, l)];
  const allLessons = () => chapters().flatMap((ch) => ch.lessons.map((l, i) => ({ ch, l, i })));
  const questions = () => OSLab.teacherQuestions || [];
  const questionsFor = (key) => questions().filter((q) => q.lesson === key || q.lesson.startsWith(key + '/'));

  function chapterProgress(ch) {
    const read = ch.lessons.filter((l) => isRead(ch, l)).length;
    return { read, total: ch.lessons.length, pct: Math.round((read / ch.lessons.length) * 100) };
  }

  function nextLesson() {
    return allLessons().find(({ ch, l }) => !isRead(ch, l)) || null;
  }

  const lessonHref = (ch, l) => `#/learn/${ch.id}/${l.id}`;

  /* ------------------------------------------------------------ blok çizimi */

  const NOTE = {
    exam: 'Sınav notu',
    extra: 'Ek bilgi (slaytta yok)',
    warn: 'Dikkat: slaytta hata / belirsizlik'
  };

  function renderBlock(bl) {
    switch (bl.t) {
      case 'p': return `<p>${bl.html}</p>`;
      case 'h': return `<h3 class="l-h">${bl.text}</h3>`;
      case 'def': return `<div class="l-def"><div class="l-def-term">${bl.term}${bl.en ? ` <span>${bl.en}</span>` : ''}</div><div class="l-def-body">${bl.html}</div></div>`;
      case 'list': {
        const tag = bl.ordered ? 'ol' : 'ul';
        return `<${tag} class="l-list"${bl.start > 1 ? ` start="${bl.start}"` : ''}>${bl.items.map((x) => `<li>${x}</li>`).join('')}</${tag}>`;
      }
      case 'compare': return `<div class="l-compare">${bl.cols.map((c) => `<div class="l-cmp"><b>${c.title}</b><ul>${c.items.map((x) => `<li>${x}</li>`).join('')}</ul></div>`).join('')}</div>`;
      case 'table': return `<div class="table-wrap l-table"><table><thead><tr>${bl.head.map((h) => `<th>${h}</th>`).join('')}</tr></thead><tbody>${bl.rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
      case 'code': return `<pre class="l-code">${esc(bl.text)}</pre>`;
      case 'note': return `<div class="l-note ${bl.kind}"><span class="l-note-label">${NOTE[bl.kind] || 'Not'}</span><div>${bl.html}</div></div>`;
      case 'dg': return OSLab.diagrams.render(bl.id);
      default: return '';
    }
  }

  const progressBar = (pct, cls) => `<div class="l-bar ${cls || ''}"><i style="width:${pct}%"></i></div>`;

  /* ------------------------------------------------------------ genel bakış */

  function pageOverview() {
    const qs = questions();
    const learned = qs.filter((q) => qState(q.id).box === 3).length;
    const total = allLessons().length;
    const readAll = allLessons().filter(({ ch, l }) => isRead(ch, l)).length;

    const method = [
      ['1', 'Oku', 'Tek ekranlık kartlar, slayt numaraları', 'Konuyu PDF sırasıyla, küçük parçalar halinde öğren. Her ders "okumadan önce düşün" sorusuyla açılır: bilmesen bile tahmin etmek, sonraki okumayı daha akılda kalıcı yapar (pretesting).'],
      ['2', 'Gör', 'Etkileşimli şekiller', 'Her kavramın yanında tıklanabilir veya adım adım ilerleyen bir şekil var. Sözel ve görsel bilginin birlikte kodlanması (dual coding) hatırlamayı güçlendirir.'],
      ['3', 'Hatırla', 'Kendini yokla', 'Ders sonundaki soruları cevaba bakmadan zihninde cevapla, sonra kontrol et. Bilgiyi geri çağırmak, tekrar okumaktan çok daha kalıcı öğrenme sağlar (testing effect).'],
      ['4', 'Dene', 'Laboratuvara geç', 'Teoriyi öğrendikten sonra ilgili laboratuvarda kavramı canlı çalıştır: mod biti, relocation, yarış durumu…'],
      ['5', 'Tekrar et', 'Hocanın soruları', 'Önce kendi cevabını yaz, sonra model cevaptaki anahtar noktalarla karşılaştır. Bilemediğin sorular daha sık gelir; "Öğrenildi" sayılması için farklı günlerde iki kez bilmen gerekir (aralıklı tekrar, spacing effect).']
    ];

    const plan = [
      ['1', 'Dersin tanıtımı, İşletim sistemleri, Temel kavramlar', 'ch1', null],
      ['2', 'Bilgisayar Sistem Yapıları', 'ch2', null],
      ['3', 'İşletim sistemi yapıları, işlemler (processes), iş parçacıkları', 'ch3', null],
      ['4', 'CPU zamanlama (Scheduling)', null, 'scheduling'],
      ['5', 'Çoklu iş parçacığı (Multithreading)', null, null],
      ['6–7', 'Bellek Yönetimi', null, null],
      ['8', 'Ara Sınav', null, null],
      ['9', 'Sanal Bellek Yönetimi', null, null],
      ['10', 'Dosya Sistemi', null, null],
      ['11', 'İkincil Bellek Yönetimi', null, null],
      ['12', 'G/Ç Yönetimi', null, null],
      ['13', 'Koruma Yönetimi', null, null],
      ['14', 'Güvenlik Sistemi', null, null]
    ];

    return `
      <section class="card l-chhead">
        <span class="tag">BLM3003 · İşletim Sistemleri · Silberschatz 10. baskı</span>
        <h2>Genel bakış</h2>
        <div class="qx-stats l-ov-stats">
          <div class="mini-stat"><span>Okunan ders</span><b>${readAll} / ${total}</b></div>
          <div class="mini-stat"><span>Öğrenilen soru</span><b>${learned} / ${qs.length}</b></div>
        </div>
        <div class="btn-row"><a class="btn btn-primary" href="#/learn">▶ Derse dön</a><a class="btn" href="#/learn/sorular">Hocanın soruları</a></div>
      </section>

      <h3 class="l-section">Nasıl çalışmalı? 5 adımlı döngü</h3>
      <div class="l-method">${method.map(([n, t, s, d]) => `<div class="l-step"><span class="l-step-n">${n}</span><b>${t}</b><small>${s}</small><p>${d}</p></div>`).join('')}</div>

      <h3 class="l-section">Bölümler</h3>
      <div class="l-chapters">${chapters().map((ch) => {
        const p = chapterProgress(ch);
        const qn = questionsFor(ch.id).length;
        return `<a class="card l-chcard" href="#/learn/${ch.id}">
          <span class="l-chnum">Bölüm ${ch.num}</span>
          <b>${ch.title}</b><small>${ch.en} · ${ch.source}</small>
          ${progressBar(p.pct)}
          <span class="l-chmeta">${p.read}/${p.total} ders${qn ? ` · ${qn} hoca sorusu` : ''}</span>
        </a>`;
      }).join('')}</div>

      <h3 class="l-section">Dönem planı</h3>
      <div class="card"><div class="table-wrap"><table class="l-plan"><thead><tr><th>Hafta</th><th>Konu</th><th>Bu sitede</th></tr></thead><tbody>
        ${plan.map(([w, t, ch, lab]) => `<tr><td class="num">${w}</td><td>${t}</td><td>${ch ? `<a class="pill ok" href="#/learn/${ch}">Ders notu ✓</a>` : ''}${lab ? `<a class="pill lab" href="#/${lab}">Laboratuvar</a> <span class="muted">· ders notu PDF gelince eklenecek</span>` : ''}${!ch && !lab ? '<span class="muted">PDF gelince eklenecek</span>' : ''}</td></tr>`).join('')}
      </tbody></table></div>
      <p class="hint">Senkronizasyon laboratuvarı, Bölüm 3'teki üretici–tüketici ve yarış durumu konularının (slayt 3.34–3.45) devamıdır.</p></div>`;
  }

  function pageChapter(ch) {
    const p = chapterProgress(ch);
    const firstUnread = ch.lessons.find((l) => !isRead(ch, l)) || ch.lessons[0];
    const qn = questionsFor(ch.id);
    return `
      <nav class="l-crumbs"><a href="#/learn/plan">Genel bakış</a> › Bölüm ${ch.num}</nav>
      <section class="card l-chhead">
        <span class="tag">Bölüm ${ch.num} · ${ch.source}</span>
        <h2>${ch.title} <span class="muted">${ch.en}</span></h2>
        ${progressBar(p.pct)}
        <p class="muted">${p.read}/${p.total} ders tamamlandı · yaklaşık ${ch.lessons.reduce((s, l) => s + l.minutes, 0)} dakika</p>
        <h4>Bu bölümün sonunda şunları yapabilmelisin</h4>
        <ul class="l-list">${ch.objectives.map((o) => `<li>${o}</li>`).join('')}</ul>
        <div class="btn-row"><a class="btn btn-primary" href="${lessonHref(ch, firstUnread)}">▶ ${p.read ? 'Devam et' : 'Başla'}: ${firstUnread.title}</a>
        ${qn.length ? `<a class="btn" href="#/learn/sorular">Bu bölümden ${qn.length} hoca sorusu</a>` : ''}</div>
      </section>
      <ol class="l-lessonlist">${ch.lessons.map((l, i) => `
        <li><a class="card l-lessonrow${isRead(ch, l) ? ' read' : ''}" href="${lessonHref(ch, l)}">
          <span class="l-ln">${isRead(ch, l) ? '✓' : i + 1}</span>
          <span><b>${l.title}</b><small>${l.en} · slayt ${l.slides} · ~${l.minutes} dk${questionsFor(lessonKey(ch, l)).length ? ` · ${questionsFor(lessonKey(ch, l)).length} hoca sorusu` : ''}${l.lab ? ' · laboratuvar' : ''}</small></span>
        </a></li>`).join('')}</ol>`;
  }

  /* ------------------------------------------------------------ kartlara bölme */

  // Bir kartta en fazla bu kadar okuma metni olur (karakter); kart tek fikir taşısın diye
  const CARD_BUDGET = 480;
  const textLen = (html) => html.replace(/<[^>]+>/g, '').length;
  const cardCache = new Map();

  // Ders bloklarını tek ekranlık kartlara böler: tanım, not, şekil ve tablolar kendi kartındadır;
  // başlık yeni kart açar; uzun listeler bölünür. Şekli tanıtan paragraf şekille aynı kartta kalır.
  function buildCards(l) {
    if (cardCache.has(l)) return cardCache.get(l);
    const cards = [{ kind: 'open' }];
    let sec = null;
    let cur = [];
    let size = 0;

    const flush = () => {
      if (cur.length) cards.push({ kind: 'read', h: sec, blocks: cur });
      cur = [];
      size = 0;
    };
    const flushKeepLead = () => {
      const lead = cur.length && cur[cur.length - 1].t === 'p' ? cur.pop() : null;
      flush();
      return lead;
    };

    l.blocks.forEach((bl) => {
      if (bl.t === 'h') {
        flush();
        sec = bl.text;
      } else if (bl.t === 'p') {
        const n = textLen(bl.html);
        if (size && size + n > CARD_BUDGET) flush();
        cur.push(bl);
        size += n;
      } else if (bl.t === 'list') {
        const lens = bl.items.map(textLen);
        if (size && size + lens.reduce((s, n) => s + n, 0) > CARD_BUDGET) {
          const lead = flushKeepLead();
          if (lead) {
            cur.push(lead);
            size = textLen(lead.html);
          }
        }
        let part = [];
        let start = 1;
        bl.items.forEach((item, i) => {
          if (part.length && size + lens[i] > CARD_BUDGET) {
            cur.push(Object.assign({}, bl, { items: part, start }));
            flush();
            part = [];
            start = i + 1;
          }
          part.push(item);
          size += lens[i];
        });
        cur.push(Object.assign({}, bl, { items: part, start }));
      } else if (bl.t === 'def' || bl.t === 'note') {
        flush();
        cards.push({ kind: bl.t, h: sec, blocks: [bl] });
      } else {
        const lead = flushKeepLead();
        cards.push({ kind: 'wide', h: sec, blocks: lead ? [lead, bl] : [bl] });
      }
    });
    flush();

    (l.checks || []).forEach((c, i) => cards.push({ kind: 'check', check: c, n: i }));
    cards.push({ kind: 'end' });
    cardCache.set(l, cards);
    return cards;
  }

  const lastCard = (l) => buildCards(l).length - 1;
  const seenCard = (ch, l) => Math.min(Store.data.seen[lessonKey(ch, l)] || 0, lastCard(l));
  const lessonFill = (ch, l) => (isRead(ch, l) ? 100 : Math.round((seenCard(ch, l) / lastCard(l)) * 100));

  function overallPct() {
    const all = allLessons();
    return Math.round(all.reduce((s, { ch, l }) => s + lessonFill(ch, l), 0) / all.length);
  }

  /* ------------------------------------------------------------ ilerleme çubuğu */

  function renderTop(active, caption) {
    return `<header class="fx-top">
      <button class="icon-btn fx-menu" type="button" data-act="menu" aria-label="Menüyü aç">☰</button>
      <div class="fx-progress">
        <div class="fx-bar">${chapters().map((ch) => `<div class="fx-ch" style="flex-grow:${ch.lessons.length}">
          <div class="fx-segs">${ch.lessons.map((l) => `<a class="fx-seg${isRead(ch, l) ? ' read' : ''}${active === l ? ' active' : ''}" href="${lessonHref(ch, l)}" title="Bölüm ${ch.num} · ${esc(l.title)}" aria-label="Bölüm ${ch.num}: ${esc(l.title)}"><span><i style="width:${lessonFill(ch, l)}%"></i></span></a>`).join('')}</div>
          ${caption ? '' : `<div class="fx-chname"><span>${ch.title}</span><small>${chapterProgress(ch).read}/${ch.lessons.length}</small></div>`}
        </div>`).join('')}</div>
        ${caption || ''}
      </div>
      <span class="fx-pct" id="fx-pct">%${overallPct()}</span>
    </header>`;
  }

  /* ------------------------------------------------------------ başlangıç ekranı */

  function pageHome() {
    const nl = nextLesson();
    const started = allLessons().some(({ ch, l }) => isRead(ch, l) || seenCard(ch, l) > 0);
    const action = nl
      ? `<a class="fx-start-btn" href="${lessonHref(nl.ch, nl.l)}">▶ ${started ? 'Devam et' : 'Başla'}</a>
         <p class="fx-start-next">Sıradaki: <b>${nl.l.title}</b></p>`
      : `<a class="fx-start-btn" href="#/learn/sorular">▶ Tekrar et</a>
         <p class="fx-start-next">Tüm dersleri bitirdin. Şimdi hocanın sorularıyla tekrar et.</p>`;
    return `<div class="fx fx-home">
      ${renderTop(null)}
      <section class="fx-start">
        <span class="tag">BLM3003</span>
        <h2>İşletim Sistemleri</h2>
        ${action}
      </section>
    </div>`;
  }

  /* ------------------------------------------------------------ kart akışı */

  function renderCard(card, i, ctx) {
    const { ch, l, key, idx, cards, next } = ctx;
    let inner;
    if (card.kind === 'open') {
      const pre = l.checks && l.checks[0];
      inner = `<span class="tag">Bölüm ${ch.num} · Ders ${idx + 1} / ${ch.lessons.length}</span>
        <h2 class="fx-title">${l.title}</h2>
        <p class="fx-sub">${l.en} · slayt ${l.slides} · ~${l.minutes} dk</p>
        ${pre ? `<div class="fx-pre"><span class="l-note-label">Okumadan önce düşün</span><p>${pre.q}</p><small>Bilmiyorsan da tahmin et. Ders sonunda kontrol edeceksin.</small></div>` : ''}`;
    } else if (card.kind === 'check') {
      const c = card.check;
      const id = `${key}#${card.n}`;
      const st = Store.data.checks[id];
      inner = `<span class="tag">Kendini yokla · ${card.n + 1} / ${l.checks.length}</span>
        <div class="fx-check${st ? ' ' + st : ''}" data-check="${id}">
          <p class="fx-check-q">${c.q}</p>
          <button class="btn" type="button" data-act="reveal">Cevabı göster</button>
          <div class="l-check-a" hidden><p>${c.a}</p><div class="btn-row"><button class="btn btn-sm l-ok" type="button" data-act="ok">✓ Bildim</button><button class="btn btn-sm l-bad" type="button" data-act="bad">✗ Bilemedim</button></div></div>
        </div>`;
    } else if (card.kind === 'end') {
      const rel = questionsFor(key);
      inner = `<div class="fx-end">
        <span class="fx-end-mark" aria-hidden="true">✓</span>
        <h2 class="fx-title">Ders tamam</h2>
        <p class="fx-sub">${l.title}</p>
        ${next
          ? `<a class="btn btn-primary fx-next" href="${lessonHref(next.ch, next.l)}">Sıradaki: ${next.l.title} ▶</a>`
          : '<a class="btn btn-primary fx-next" href="#/learn/sorular">Hocanın soruları ▶</a>'}
        <div class="btn-row">
          ${l.lab ? `<button class="btn btn-sm" type="button" data-act="lab">Laboratuvarda dene</button>` : ''}
          ${rel.length ? `<a class="btn btn-sm" href="#/learn/sorular/${rel[0].id}">Bu dersten ${rel.length} hoca sorusu</a>` : ''}
          <button class="btn btn-sm btn-ghost" type="button" data-act="restart">Dersi baştan al</button>
        </div>
      </div>`;
    } else {
      inner = `${card.h ? `<h3 class="fx-h">${card.h}</h3>` : ''}<div class="l-body fx-body">${card.blocks.map(renderBlock).join('')}</div>`;
    }
    return `<section class="fx-card fx-${card.kind}" data-i="${i}" aria-label="Kart ${i + 1} / ${cards.length}"><div class="fx-inner">${inner}</div></section>`;
  }

  function pageFeed(ch, l) {
    const all = allLessons();
    const gi = all.findIndex((x) => x.l === l);
    const ctx = { ch, l, key: lessonKey(ch, l), idx: ch.lessons.indexOf(l), cards: buildCards(l), next: all[gi + 1] };
    const caption = `<div class="fx-caption"><span>${ch.title} › <b>${l.title}</b></span><span class="fx-count" id="fx-count"></span></div>`;
    return `<div class="fx">
      ${renderTop(l, caption)}
      <div class="fx-scroll" id="fx-scroll">${ctx.cards.map((c, i) => renderCard(c, i, ctx)).join('')}</div>
      <div class="fx-nav" id="fx-nav">
        <button class="btn fx-up" type="button" data-act="prev" aria-label="Önceki kart">↑</button>
        <button class="btn btn-primary fx-down" type="button" data-act="next">Devam ↓</button>
      </div>
    </div>`;
  }

  // Akışın durumu: { ch, l, idx, wheelAt, wheelGo } (akış ekranı dışında null)
  let F = null;

  const feedScroller = () => root.querySelector('#fx-scroll');
  const feedCard = (i) => feedScroller().children[i];

  function refreshFeedUi() {
    root.querySelector('#fx-count').textContent = `${F.idx + 1} / ${lastCard(F.l) + 1}`;
    root.querySelector('#fx-nav').classList.toggle('end', F.idx === lastCard(F.l));
    root.querySelector('.fx-seg.active i').style.width = `${lessonFill(F.ch, F.l)}%`;
    root.querySelector('.fx-seg.active').classList.toggle('read', isRead(F.ch, F.l));
    root.querySelector('#fx-pct').textContent = `%${overallPct()}`;
  }

  // İlerleme yalnızca kullanıcı kaydırdığında işlenir; adresle bir karta atlamak dersi bitirmez
  function onFeedScroll() {
    const sc = feedScroller();
    const i = Math.round(sc.scrollTop / sc.clientHeight);
    if (i === F.idx || i < 0 || i > lastCard(F.l)) return;
    F.idx = i;
    const key = lessonKey(F.ch, F.l);
    Store.data.seen[key] = Math.max(Store.data.seen[key] || 0, i);
    if (i === lastCard(F.l) && !Store.data.read[key]) Store.data.read[key] = today();
    Store.save();
    try { history.replaceState(null, '', `${lessonHref(F.ch, F.l)}/${i + 1}`); } catch (e) { /* adres güncellenmese de akış çalışır */ }
    refreshFeedUi();
  }

  function showCard(i) {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    feedScroller().scrollTo({ top: feedCard(i).offsetTop, behavior: reduce ? 'auto' : 'smooth' });
  }

  // Kart ekrana sığmıyorsa önce kartın içi kayar, sonra sıradaki karta geçilir
  function scrollInsideCard(dir) {
    const card = feedCard(F.idx);
    const canScroll = dir > 0 ? card.scrollTop + card.clientHeight < card.scrollHeight - 4 : card.scrollTop > 4;
    if (canScroll) card.scrollBy({ top: dir * card.clientHeight * 0.8, behavior: 'smooth' });
    return canScroll;
  }

  function step(dir) {
    if (scrollInsideCard(dir)) return;
    const i = F.idx + dir;
    if (i >= 0 && i <= lastCard(F.l)) { showCard(i); return; }
    const all = allLessons();
    const gi = all.findIndex((x) => x.l === F.l);
    const to = all[gi + dir];
    if (to) location.hash = dir > 0 ? lessonHref(to.ch, to.l) : `${lessonHref(to.ch, to.l)}/son`;
    else if (dir > 0) location.hash = '#/learn/sorular';
  }

  // Tekerlek hareketi tek jest başına bir kart ilerletir; ders sınırını yalnızca düğme ve klavye geçer
  function onFeedWheel(e) {
    if (e.ctrlKey || Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
    const dir = Math.sign(e.deltaY);
    const sc = feedScroller();
    for (let el = e.target; el && el !== sc; el = el.parentElement) {
      if (el.scrollHeight <= el.clientHeight + 1 || !/auto|scroll/.test(getComputedStyle(el).overflowY)) continue;
      if (dir > 0 ? el.scrollTop + el.clientHeight < el.scrollHeight - 1 : el.scrollTop > 0) return;
    }
    e.preventDefault();
    const now = Date.now();
    const newGesture = now - F.wheelAt > 140;
    F.wheelAt = now;
    if (Math.abs(e.deltaY) < 4 || (!newGesture && now - F.wheelGo < 900)) return;
    const i = F.idx + dir;
    if (i >= 0 && i <= lastCard(F.l)) {
      F.wheelGo = now;
      showCard(i);
    }
  }

  function onKey(e) {
    if (!F || e.ctrlKey || e.metaKey || e.altKey) return;
    if (/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return;
    const onControl = /^(BUTTON|A|SUMMARY)$/.test(e.target.tagName);
    let dir = 0;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight' || e.key === 'PageDown') dir = 1;
    else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft' || e.key === 'PageUp') dir = -1;
    else if (e.key === ' ' && !onControl) dir = e.shiftKey ? -1 : 1;
    if (!dir) return;
    e.preventDefault();
    step(dir);
  }

  function startFeed(ch, l, cardParam) {
    const last = lastCard(l);
    let i = isRead(ch, l) ? 0 : seenCard(ch, l);
    if (cardParam === 'son') i = last;
    else if (cardParam) i = Math.min(Math.max((parseInt(cardParam, 10) || 1) - 1, 0), last);
    F = { ch, l, idx: i, wheelAt: 0, wheelGo: 0 };
    const sc = feedScroller();
    sc.scrollTop = feedCard(i).offsetTop;
    sc.addEventListener('scroll', () => requestAnimationFrame(() => { if (F && feedScroller() === sc) onFeedScroll(); }), { passive: true });
    sc.addEventListener('wheel', onFeedWheel, { passive: false });
    refreshFeedUi();
  }

  /* ------------------------------------------------------------ hoca soruları */

  const Q = { mode: 'list', filter: 'all', current: null, lastShown: null };

  function qCard(q, n) {
    const st = qState(q.id);
    const [chId, lId] = q.lesson.split('/');
    const ch = findChapter(chId);
    const l = ch && ch.lessons.find((x) => x.id === lId);
    return `<article class="card qx" id="q-${q.id}" data-q="${q.id}">
      <header class="qx-head">
        <span class="q-num">S${n}</span>
        <span class="q-topic">${esc(q.set)}</span>
        ${l ? `<a class="qx-lesson" href="${lessonHref(ch, l)}">Bölüm ${ch.num} · ${l.title}</a>` : ''}
        <span class="pill ${BOX[st.box].cls}">${BOX[st.box].label}</span>
      </header>
      <p class="qx-q">${q.q}</p>
      <label class="qx-draft-l" for="d-${q.id}">Önce kendi cevabını yaz (isteğe bağlı, bu tarayıcıda saklanır)</label>
      <textarea class="qx-draft" id="d-${q.id}" rows="3" placeholder="Cevabını buraya yaz…">${esc(Store.data.drafts[q.id] || '')}</textarea>
      <div class="btn-row"><button class="btn btn-primary btn-sm" type="button" data-act="reveal">Model cevabı göster</button>${q.lab ? `<button class="btn btn-sm btn-ghost" type="button" data-act="lab">▶ ${esc(q.lab.label)}</button>` : ''}</div>
      <div class="qx-answer" hidden>
        <div class="qx-model">${q.a}</div>
        <div class="qx-keys"><b>Cevabında bu anahtar noktalar var mıydı?</b> <small>(işaretle, puanın hesaplansın)</small>
          ${q.keys.map((k, i) => `<label class="qx-key"><input type="checkbox" data-key="${i}"><span>${k}</span></label>`).join('')}
          <div class="qx-score"></div>
        </div>
        <div class="qx-rate"><span>Kendini değerlendir:</span>
          <button class="btn btn-sm l-bad" type="button" data-rate="bad">✗ Bilemedim</button>
          <button class="btn btn-sm" type="button" data-rate="partial">~ Kısmen</button>
          <button class="btn btn-sm l-ok" type="button" data-rate="good">✓ Bildim</button>
        </div>
        <div class="qx-msg"></div>
      </div>
    </article>`;
  }

  function qStats() {
    const counts = [0, 0, 0, 0];
    questions().forEach((q) => counts[qState(q.id).box]++);
    return counts;
  }

  function pickNext() {
    const qs = questions().filter((q) => q.id !== Q.lastShown);
    if (!qs.length) return questions()[0];
    const t = today();
    // Öncelik: tekrar et (1) > yeni (0) > gelişiyor (2, bugün çalışılmamışsa) > öğrenildi (3)
    const prio = (q) => {
      const s = qState(q.id);
      if (s.box === 1) return 0;
      if (s.box === 0) return 1;
      if (s.box === 2) return s.day === t ? 4 : 2;
      return 5;
    };
    const best = Math.min(...qs.map(prio));
    const pool = qs.filter((q) => prio(q) === best);
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function pageQuestions(focusId) {
    const qs = questions();
    const c = qStats();
    const total = qs.length;
    const filters = [['all', 'Tümü'], ['1', 'Tekrar et'], ['0', 'Yeni'], ['2', 'Gelişiyor'], ['3', 'Öğrenildi']];
    let body;
    if (Q.mode === 'card') {
      if (!Q.current || !qs.find((q) => q.id === Q.current)) Q.current = pickNext().id;
      const q = qs.find((x) => x.id === Q.current);
      body = `<p class="hint">Karışık tekrar: sıradaki soru, en az bildiklerinden seçilir. "Bildim" dediğin bir soru <b>aynı gün</b> tekrar "Öğrenildi" olmaz; ertesi gün yeniden sorulur.</p>
        ${qCard(q, qs.indexOf(q) + 1)}
        <div class="btn-row"><button class="btn btn-primary" type="button" data-act="nextq">Sonraki soru ▶</button></div>`;
    } else {
      const list = qs.filter((q) => Q.filter === 'all' || String(qState(q.id).box) === String(Q.filter));
      body = `<div class="qx-filters">${filters.map(([k, t]) => `<button type="button" class="dg-tab${String(Q.filter) === k ? ' active' : ''}" data-filter="${k}">${t}${k === 'all' ? ` (${total})` : ` (${c[k]})`}</button>`).join('')}</div>
        ${list.length ? list.map((q) => qCard(q, qs.indexOf(q) + 1)).join('') : '<p class="empty">Bu filtrede soru yok.</p>'}`;
    }
    return `
      <nav class="l-crumbs"><a href="#/learn">Ders Notları</a> › Hocanın soruları</nav>
      <section class="card l-chhead">
        <span class="tag">Sınavda çıkabilir · ${total} soru</span>
        <h2>Hocanın soruları</h2>
        <p>Önce <b>kendi cevabını yaz</b>, sonra model cevabı aç ve <b>anahtar noktaları</b> işaretleyerek karşılaştır. Model cevaplarda "(Ek)" ile işaretli bilgiler slaytlarda yok; kitaptan ve genel bilgiden eklendi.</p>
        <div class="qx-stats">${BOX.map((bx) => `<div class="mini-stat ${bx.cls}"><span>${bx.label}</span><b>${c[bx.id]}</b></div>`).join('')}</div>
        <div class="l-bar l-bar-stack">${BOX.slice(1).reverse().map((bx) => `<i class="${bx.cls}" style="width:${total ? (c[bx.id] / total) * 100 : 0}%"></i>`).join('')}</div>
        <div class="lab-tabs qx-modes">
          <button class="lab-tab${Q.mode === 'list' ? ' active' : ''}" type="button" data-mode="list"><span class="lab-num">≡</span>Liste</button>
          <button class="lab-tab${Q.mode === 'card' ? ' active' : ''}" type="button" data-mode="card"><span class="lab-num">⟳</span>Kart modu <small>karışık aralıklı tekrar</small></button>
        </div>
      </section>
      <div class="qx-body">${body}</div>`;
  }

  function rate(id, kind) {
    const s = Object.assign({ box: 0 }, qState(id));
    const t = today();
    let msg;
    if (kind === 'bad') { s.box = 1; msg = 'Tekrar listesine eklendi. İlgili dersi tekrar oku, sonra yeniden dene.'; }
    if (kind === 'partial') { s.box = 1; msg = 'Eksik noktaları işaretlenmemiş anahtar maddelerden tamamla; bu soru yakında tekrar gelecek.'; }
    if (kind === 'good') {
      if (s.box <= 1) { s.box = 2; msg = 'Güzel! "Gelişiyor"a geçti. Başka bir gün tekrar bilirsen "Öğrenildi" olur.'; }
      else if (s.box === 2 && s.goodDay && s.goodDay !== t) { s.box = 3; msg = 'Farklı bir günde tekrar bildin: "Öğrenildi" ✓'; }
      else if (s.box === 2) { msg = 'Bugün zaten bildin. Aralıklı tekrar için yarın tekrar sorulacak.'; }
      else { msg = 'Hâlâ biliyorsun ✓'; }
      s.goodDay = t;
    }
    s.day = t;
    s.n = (s.n || 0) + 1;
    Store.data.q[id] = s;
    Store.save();
    return msg;
  }

  /* ------------------------------------------------------------ olaylar */

  let root = null;
  let params = [];

  function onClick(e) {
    const t = e.target;
    const act = t.closest('[data-act]');

    const modeBtn = t.closest('[data-mode]');
    if (modeBtn && params[0] === 'sorular') { Q.mode = modeBtn.dataset.mode; draw(); return; }
    const filt = t.closest('[data-filter]');
    if (filt) { Q.filter = filt.dataset.filter; draw(); return; }

    const qx = t.closest('[data-q]');
    const rateBtn = t.closest('[data-rate]');
    if (rateBtn && qx) {
      const msg = rate(qx.dataset.q, rateBtn.dataset.rate);
      qx.querySelector('.qx-msg').textContent = msg;
      const st = qState(qx.dataset.q);
      const pill = qx.querySelector('.qx-head .pill');
      pill.className = `pill ${BOX[st.box].cls}`;
      pill.textContent = BOX[st.box].label;
      qx.querySelectorAll('[data-rate]').forEach((x) => x.classList.toggle('chosen', x === rateBtn));
      return;
    }
    if (!act) return;
    const a = act.dataset.act;

    if (a === 'menu') { OSLab.app.toggleSidebar(true); return; }
    if (a === 'next' && F) { step(1); return; }
    if (a === 'prev' && F) { step(-1); return; }

    if (a === 'reveal' && qx) {
      const ans = qx.querySelector('.qx-answer');
      ans.hidden = !ans.hidden;
      act.textContent = ans.hidden ? 'Model cevabı göster' : 'Model cevabı gizle';
      return;
    }
    if (a === 'lab' && qx) {
      const q = questions().find((x) => x.id === qx.dataset.q);
      OSLab.app.loadPreset(q.lab.preset);
      return;
    }
    if (a === 'nextq') {
      Q.lastShown = Q.current;
      Q.current = pickNext().id;
      draw();
      return;
    }

    const chk = t.closest('[data-check]');
    if (chk) {
      if (a === 'reveal') {
        chk.querySelector('.l-check-a').hidden = false;
        act.hidden = true;
      } else if (a === 'ok' || a === 'bad') {
        Store.data.checks[chk.dataset.check] = a;
        Store.save();
        chk.classList.remove('ok', 'bad');
        chk.classList.add(a);
      }
      return;
    }

    const [chId, lId] = params;
    const ch = findChapter(chId);
    const l = ch && ch.lessons.find((x) => x.id === lId);
    if (a === 'lab' && l) OSLab.app.loadPreset(l.lab.preset);
    if (a === 'restart' && l) {
      const key = lessonKey(ch, l);
      delete Store.data.read[key];
      delete Store.data.seen[key];
      Store.save();
      F.idx = 0;
      feedScroller().scrollTop = 0;
      try { history.replaceState(null, '', lessonHref(ch, l)); } catch (e) { /* yok say */ }
      refreshFeedUi();
    }
  }

  function onInput(e) {
    const ta = e.target.closest('.qx-draft');
    if (ta) {
      Store.data.drafts[ta.closest('[data-q]').dataset.q] = ta.value;
      Store.save();
      return;
    }
    const cb = e.target.closest('[data-key]');
    if (cb) {
      const qx = cb.closest('[data-q]');
      const boxes = [...qx.querySelectorAll('[data-key]')];
      const got = boxes.filter((x) => x.checked).length;
      const ratio = got / boxes.length;
      const sug = ratio >= 0.8 ? 'good' : ratio >= 0.4 ? 'partial' : 'bad';
      qx.querySelector('.qx-score').innerHTML = `<b>${got} / ${boxes.length}</b> anahtar nokta → önerilen değerlendirme: <b>${{ good: '✓ Bildim', partial: '~ Kısmen', bad: '✗ Bilemedim' }[sug]}</b>`;
      qx.querySelectorAll('[data-rate]').forEach((x) => x.classList.toggle('suggest', x.dataset.rate === sug));
    }
  }

  /* ------------------------------------------------------------ yönlendirme */

  function draw() {
    const [a, b2, b3] = params;
    let html;
    let focus = false;
    let header = { num: 'T', title: 'Ders Notları', sub: 'Önce teori, sonra laboratuvar' };
    const ch = findChapter(a);
    const l = ch && b2 && ch.lessons.find((x) => x.id === b2);
    F = null;
    if (a === 'plan') {
      html = pageOverview();
      header = { num: 'T', title: 'Genel Bakış', sub: 'Çalışma yöntemi, bölümler, dönem planı' };
    } else if (a === 'sorular') {
      html = pageQuestions(b2);
      header = { num: 'S', title: 'Hocanın Soruları', sub: 'Aralıklı tekrar ile sınava hazırlık' };
    } else if (l) {
      html = pageFeed(ch, l);
      focus = true;
      header = { num: `B${ch.num}`, title: l.title, sub: `Bölüm ${ch.num}: ${ch.title}` };
    } else if (ch) {
      html = pageChapter(ch);
      header = { num: `B${ch.num}`, title: `Bölüm ${ch.num}: ${ch.title}`, sub: ch.en };
    } else {
      html = pageHome();
      focus = true;
    }
    document.body.classList.toggle('focus-mode', focus);
    root.innerHTML = `<div class="learn${focus ? ' learn-focus' : ''}">${html}</div>`;
    OSLab.diagrams.init(root);
    OSLab.app.setHeader(header);
    if (l) startFeed(ch, l, b3);

    if (a === 'sorular' && b2 && Q.mode === 'list') {
      const el = root.querySelector(`#q-${CSS.escape(b2)}`);
      if (el) {
        el.classList.add('flash-card');
        requestAnimationFrame(() => el.scrollIntoView({ block: 'start' }));
      }
    }
  }

  function navigate(p) {
    params = p || [];
    if (params[0] === 'sorular' && params[1]) Q.mode = 'list';
    draw();
  }

  function mount(container, p) {
    root = container;
    root.addEventListener('click', onClick);
    root.addEventListener('input', onInput);
    root.addEventListener('change', onInput);
    document.addEventListener('keydown', onKey);
    navigate(p);
  }

  function unmount() {
    if (root) {
      root.removeEventListener('click', onClick);
      root.removeEventListener('input', onInput);
      root.removeEventListener('change', onInput);
    }
    document.removeEventListener('keydown', onKey);
    document.body.classList.remove('focus-mode');
    F = null;
    root = null;
  }

  OSLab.modules = OSLab.modules || {};
  OSLab.modules.learn = {
    num: 'T',
    title: 'Ders Notları',
    subtitle: 'Önce teori, sonra laboratuvar',
    mount,
    unmount,
    navigate
  };
})(window.OSLab = window.OSLab || {});
