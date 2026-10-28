/*
 * learn-view.js — "Ders Notları" modülü: teori önce, laboratuvar sonra.
 *
 * Rotalar:
 *   #/learn                 ana sayfa (çalışma yöntemi, ilerleme, ders planı)
 *   #/learn/ch2             bölüm özeti
 *   #/learn/ch2/baglayici   ders
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
    data: { read: {}, q: {}, checks: {}, drafts: {} },
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
        return `<${tag} class="l-list">${bl.items.map((x) => `<li>${x}</li>`).join('')}</${tag}>`;
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

  /* ------------------------------------------------------------ sayfalar */

  function pageHome() {
    const nl = nextLesson();
    const qs = questions();
    const learned = qs.filter((q) => qState(q.id).box === 3).length;
    const total = allLessons().length;
    const readAll = allLessons().filter(({ ch, l }) => isRead(ch, l)).length;

    const method = [
      ['1', 'Oku', 'Kısa dersler, tanım kartları, slayt numaraları', 'Konuyu PDF sırasıyla, küçük parçalar halinde öğren. Her dersin başında "okumadan önce düşün" sorusu var: bilmesen bile tahmin etmek, sonraki okumayı daha akılda kalıcı yapar (pretesting).'],
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
      <section class="l-hero card">
        <div>
          <span class="tag">BLM3003 · İşletim Sistemleri · Silberschatz 10. baskı</span>
          <h2>Önce teori, sonra pratik</h2>
          <p>Bu bölüm ders notlarını (PDF'lerdeki sırayla) adım adım öğretir. Her ders kısa bir okuma, etkileşimli şekiller ve geri çağırma sorularıyla biter; ardından seni ilgili laboratuvara yönlendirir.</p>
          <div class="btn-row">
            ${nl ? `<a class="btn btn-primary" href="${lessonHref(nl.ch, nl.l)}">${readAll ? '▶ Kaldığın yerden devam et' : '▶ Bölüm 1 ile başla'}</a><span class="l-next">Sıradaki: <b>Bölüm ${nl.ch.num} · ${nl.l.title}</b></span>` : '<span class="l-next">Tüm dersleri tamamladın. Şimdi hocanın sorularıyla tekrar et.</span>'}
            <a class="btn" href="#/learn/sorular">Hocanın soruları (${learned}/${qs.length} öğrenildi)</a>
          </div>
        </div>
        <div class="l-hero-stats">
          <div class="mini-stat"><span>Okunan ders</span><b>${readAll} / ${total}</b></div>
          <div class="mini-stat"><span>Öğrenilen soru</span><b>${learned} / ${qs.length}</b></div>
        </div>
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
      <nav class="l-crumbs"><a href="#/learn">Ders Notları</a> › Bölüm ${ch.num}</nav>
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

  function pageLesson(ch, l) {
    const idx = ch.lessons.indexOf(l);
    const all = allLessons();
    const gi = all.findIndex((x) => x.l === l);
    const prev = all[gi - 1];
    const next = all[gi + 1];
    const key = lessonKey(ch, l);
    const rel = questionsFor(key);
    const pre = l.checks && l.checks[0];

    return `
      <div class="l-layout">
        <aside class="l-toc">
          <a class="l-toc-ch" href="#/learn/${ch.id}">Bölüm ${ch.num}: ${ch.title}</a>
          <ol>${ch.lessons.map((x, i) => `<li><a href="${lessonHref(ch, x)}" class="${x === l ? 'active' : ''}${isRead(ch, x) ? ' read' : ''}"><span>${isRead(ch, x) ? '✓' : i + 1}</span>${x.title}</a></li>`).join('')}</ol>
          <div class="l-toc-other">${chapters().filter((c) => c !== ch).map((c) => `<a href="#/learn/${c.id}">Bölüm ${c.num}: ${c.title}</a>`).join('')}<a href="#/learn/sorular">Hocanın soruları</a></div>
        </aside>
        <article class="l-article">
          <nav class="l-crumbs"><a href="#/learn">Ders Notları</a> › <a href="#/learn/${ch.id}">Bölüm ${ch.num}</a> › Ders ${idx + 1}</nav>
          <header class="l-head">
            <span class="tag">Ders ${idx + 1} / ${ch.lessons.length} · Slayt ${l.slides} · ~${l.minutes} dk</span>
            <h2>${l.title}</h2>
            <p class="muted">${l.en}</p>
          </header>
          ${pre ? `<div class="l-pre"><span class="l-note-label">Okumadan önce düşün</span><p>${pre.q}</p><small>Cevabını bilmiyorsan da tahmin et. Ders sonunda kontrol edeceksin.</small></div>` : ''}
          <div class="l-body">${l.blocks.map(renderBlock).join('')}</div>

          ${l.checks && l.checks.length ? `<section class="l-checks">
            <h3 class="l-section">Kendini yokla</h3>
            <p class="hint">Cevabı açmadan önce zihninde ya da kağıtta cevapla. Sonra kendini dürüstçe değerlendir.</p>
            ${l.checks.map((c, i) => {
              const st = Store.data.checks[`${key}#${i}`];
              return `<div class="l-check${st ? ' ' + st : ''}" data-check="${key}#${i}">
                <p class="l-check-q"><span>${i + 1}</span>${c.q}</p>
                <button class="btn btn-sm" type="button" data-act="reveal">Cevabı göster</button>
                <div class="l-check-a" hidden><p>${c.a}</p><div class="btn-row"><button class="btn btn-sm l-ok" type="button" data-act="ok">✓ Bildim</button><button class="btn btn-sm l-bad" type="button" data-act="bad">✗ Bilemedim</button></div></div>
              </div>`;
            }).join('')}
          </section>` : ''}

          ${l.lab ? `<section class="l-lab card"><div><span class="tag">Pratikte gör</span><b>${l.lab.label}</b></div><button class="btn btn-primary" type="button" data-act="lab">▶ Laboratuvara git</button></section>` : ''}

          ${rel.length ? `<section class="l-rel"><h3 class="l-section">Bu dersle ilgili hoca soruları</h3>${rel.map((q) => `<a class="l-relq" href="#/learn/sorular/${q.id}"><span class="pill ${BOX[qState(q.id).box].cls}">${BOX[qState(q.id).box].label}</span>${q.q}</a>`).join('')}</section>` : ''}

          <footer class="l-foot">
            <button class="btn ${isRead(ch, l) ? 'l-done' : 'btn-primary'}" type="button" data-act="read">${isRead(ch, l) ? '✓ Tamamlandı (geri al)' : 'Bu dersi tamamladım ✓'}</button>
            <div class="btn-row">
              ${prev ? `<a class="btn" href="${lessonHref(prev.ch, prev.l)}">◀ ${prev.l.title}</a>` : ''}
              ${next ? `<a class="btn" href="${lessonHref(next.ch, next.l)}">${next.l.title} ▶</a>` : '<a class="btn" href="#/learn/sorular">Hocanın soruları ▶</a>'}
            </div>
          </footer>
        </article>
      </div>`;
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
    if (a === 'read' && l) {
      const key = lessonKey(ch, l);
      if (Store.data.read[key]) delete Store.data.read[key];
      else Store.data.read[key] = today();
      Store.save();
      draw();
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
    const [a, b2] = params;
    let html;
    let header = { num: 'T', title: 'Ders Notları', sub: 'Önce teori, sonra laboratuvar' };
    if (!a) {
      html = pageHome();
    } else if (a === 'sorular') {
      html = pageQuestions(b2);
      header = { num: 'S', title: 'Hocanın Soruları', sub: 'Aralıklı tekrar ile sınava hazırlık' };
    } else {
      const ch = findChapter(a);
      const l = ch && b2 && ch.lessons.find((x) => x.id === b2);
      if (l) {
        html = pageLesson(ch, l);
        header = { num: `B${ch.num}`, title: l.title, sub: `Bölüm ${ch.num}: ${ch.title}` };
      } else if (ch) {
        html = pageChapter(ch);
        header = { num: `B${ch.num}`, title: `Bölüm ${ch.num}: ${ch.title}`, sub: ch.en };
      } else {
        html = pageHome();
      }
    }
    root.innerHTML = `<div class="learn">${html}</div>`;
    OSLab.diagrams.init(root);
    OSLab.app.setHeader(header);

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
    navigate(p);
  }

  function unmount() {
    if (root) {
      root.removeEventListener('click', onClick);
      root.removeEventListener('input', onInput);
      root.removeEventListener('change', onInput);
    }
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
