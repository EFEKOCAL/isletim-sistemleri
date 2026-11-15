/*
 * shell-view.js — Shell Atölyesi: solda görev kartı, sağda tarayıcıda çalışan terminal.
 *
 * Öğrenme düzeni: her görev kısa bir bilgi + örnek verir, sonra öğrenci komutu KENDİSİ yazar
 * (üretme etkisi). Terminal her komuttan sonra görevi denetler ve hemen geri bildirim verir;
 * yaygın hatalarda (grep -c, boşluklu chmod, [$x ...]) neyin yanlış olduğunu söyler.
 * Yardım basamaklıdır: hedef çıktı → ipuçları → çözüm. Çözüme bakılan görevler "tekrar
 * edilecek" sayılır ve Karışık Tekrar'da önce gelir; orada bilgi kartı kapalıdır (geri çağırma).
 *
 *   #/shell              kaldığın görev
 *   #/shell/<aşama>      aşamanın ilk görevi       #/shell/tekrar   karışık tekrar
 */
(function (OSLab) {
  'use strict';

  const KEY = 'oslab.shell.v1';
  const H = '/home/ogrenci/';
  const REVIEW_SIZE = 8;
  const NO_REVIEW = new Set(['ls', 'cd', 'cdup', 'read', 'while']);

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const stages = () => OSLab.shellLab.stages;
  const Eng = () => OSLab.ShellEngine;

  /* ------------------------------------------------------------ kalıcı durum */

  function load() {
    try { const v = JSON.parse(localStorage.getItem(KEY) || 'null'); if (v && v.done) return v; } catch (e) { /* gizli pencere */ }
    return { done: {}, pos: [0, 0] };
  }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(prog)); } catch (e) { /* yok say */ } }

  const prog = load();
  let sh = null;            // terminal oturumu: sayfalar arasında gezerken korunur
  let screenHTML = '';
  const hist = [];

  const st = {
    stage: 0, idx: 0,
    review: null,           // { list: [[s, i]], at, results: {} }
    preparedFor: null,
    hintN: 0, usedSolution: false, solved: false, wrong: 0,
    pending: null, histPos: 0, editor: null, draft: ''
  };
  let $ = null;

  function mission() {
    if (st.review) { const r = st.review.list[st.review.at]; return r ? stages()[r[0]].missions[r[1]] : null; }
    const s = stages()[st.stage];
    return s ? s.missions[st.idx] : null;
  }
  const stageOf = (m) => stages().find((s) => s.missions.includes(m));

  /* ------------------------------------------------------------ iskelet */

  function template() {
    return `
      <div class="shx">
        <nav class="shx-stages" id="shx-stages" aria-label="Aşamalar"></nav>
        <div class="shx-grid">
          <section class="card shx-card" id="shx-card" aria-live="polite"></section>
          <section class="shx-term" aria-label="Terminal">
            <header class="shx-term-head">
              <span class="shx-lights" aria-hidden="true"><i></i><i></i><i></i></span>
              <span class="shx-term-title">ogrenci@oslab: <b id="shx-where">~</b></span>
              <span class="shx-term-acts">
                <button class="shx-tbtn" type="button" data-act="files" aria-expanded="false">Dosyalar</button>
                <button class="shx-tbtn" type="button" data-act="reset" title="Dosya sistemini ilk haline döndür">Sıfırla</button>
              </span>
              <div class="shx-files" id="shx-files" hidden></div>
            </header>
            <div class="shx-screen" id="shx-screen">
              <div id="shx-out"></div>
              <div class="shx-inrow">
                <span class="shx-prompt" id="shx-prompt"></span><input id="shx-in" class="shx-in" type="text" spellcheck="false" autocomplete="off" autocapitalize="off" aria-label="Komut">
              </div>
            </div>
            <div class="shx-editor" id="shx-editor" hidden>
              <div class="ed-head"><span>GNU nano</span><b id="ed-name"></b><span id="ed-mod"></span></div>
              <textarea id="ed-text" spellcheck="false" autocomplete="off" autocapitalize="off" aria-label="Dosya içeriği"></textarea>
              <div class="ed-status" id="ed-status"></div>
              <div class="ed-bar" id="ed-bar">
                <button type="button" data-ed="save"><kbd>^O</kbd> Kaydet</button>
                <button type="button" data-ed="exit"><kbd>^X</kbd> Çık</button>
              </div>
              <div class="ed-bar ed-ask" id="ed-ask" hidden>
                <span>Değişiklikler kaydedilsin mi?</span>
                <button type="button" data-ed="yes"><kbd>E</kbd> Evet</button>
                <button type="button" data-ed="no"><kbd>H</kbd> Hayır</button>
                <button type="button" data-ed="cancel"><kbd>^C</kbd> İptal</button>
              </div>
            </div>
          </section>
        </div>
      </div>`;
  }

  /* ------------------------------------------------------------ aşama şeridi */

  function stageCount(s) { return s.missions.filter((m) => prog.done[m.id]).length; }

  function renderStages() {
    const chips = stages().map((s, i) => {
      const n = stageCount(s); const all = s.missions.length;
      const cls = [!st.review && i === st.stage ? 'cur' : '', n === all ? 'full' : ''].join(' ');
      return `<a class="shx-stage ${cls}" href="#/shell/${s.id}">
        <span class="shx-snum">${n === all ? '✓' : i + 1}</span>
        <span class="shx-stext"><b>${s.title}</b><small>${s.short}</small></span>
        <span class="shx-sbar"><i style="width:${(n / all) * 100}%"></i></span>
      </a>`;
    }).join('');
    const seen = Object.values(prog.done).filter((v) => v === 'seen').length;
    $.stages.innerHTML = chips + `<a class="shx-stage shx-review ${st.review ? 'cur' : ''}" href="#/shell/tekrar">
      <span class="shx-snum">↻</span>
      <span class="shx-stext"><b>Karışık tekrar</b><small>${seen ? `${seen} görev tekrar bekliyor` : 'bilgi kartı kapalı'}</small></span>
    </a>`;
  }

  /* ------------------------------------------------------------ görev kartı */

  function helpButtons(m) {
    const target = m.kind === 'cmd' && (m.solution || m.expect || m.file);
    const hints = m.hints || [];
    return `<div class="shx-help">
      ${target ? '<button class="btn btn-sm btn-ghost" type="button" data-act="target">Hedef çıktı</button>' : ''}
      ${hints.length ? `<button class="btn btn-sm btn-ghost" type="button" data-act="hint" ${st.hintN >= hints.length ? 'disabled' : ''}>İpucu ${Math.min(st.hintN + 1, hints.length)}/${hints.length}</button>` : ''}
      <button class="btn btn-sm btn-ghost" type="button" data-act="solution">Çözümü göster</button>
    </div>`;
  }

  function renderCard() {
    const m = mission();
    if (st.review && !m) return renderReviewEnd();
    if (!m) return;
    const s = stageOf(m); const si = stages().indexOf(s); const mi = s.missions.indexOf(m);
    const dots = st.review
      ? st.review.list.map((r, i) => `<span class="shx-dot ${i === st.review.at ? 'cur' : ''} ${st.review.results[i] || ''}"></span>`).join('')
      : s.missions.map((x, i) => `<button class="shx-dot ${i === st.idx ? 'cur' : ''} ${prog.done[x.id] || ''}" type="button" data-go="${i}" title="${esc(x.title)}" aria-label="Görev ${i + 1}: ${esc(x.title)}"></button>`).join('');
    const kicker = st.review
      ? `Karışık tekrar · ${st.review.at + 1} / ${st.review.list.length} <span class="muted">· Aşama ${si + 1}</span>`
      : `Aşama ${si + 1} · ${s.title} <span class="muted">· PDF ${s.src}</span>`;
    const learnHidden = !!st.review && !st.showLearn;
    const ex = m.example ? `<button class="shx-ex" type="button" data-ins="${esc(m.example)}" title="Terminale yaz"><span>örnek</span><code>${esc(m.example)}</code><i>↵</i></button>` : '';
    let answer = '';
    if (m.kind === 'predict') {
      const rows = Math.max(1, m.answer.split('\n').length);
      answer = `<div class="shx-answer">
        <textarea id="shx-guess" rows="${rows}" spellcheck="false" placeholder="${rows > 1 ? 'Her satırı alt alta yaz' : 'Cevabın'}"></textarea>
        <button class="btn btn-primary btn-sm" type="button" data-act="guess">Kontrol et</button>
      </div>`;
    } else if (m.kind === 'choice') {
      answer = `<div class="shx-options">${m.options.map((o, i) => `<button class="shx-opt" type="button" data-opt="${i}">${o.t}</button>`).join('')}</div>`;
    }
    $.card.innerHTML = `
      <div class="shx-mhead">
        <span class="shx-kicker">${kicker}</span>
        <div class="shx-dots">${dots}</div>
      </div>
      ${!st.review && mi === 0 ? `<p class="shx-intro">${s.intro}</p>` : ''}
      <h2 class="shx-title"><span>${st.review ? '↻' : mi + 1}</span>${m.title}</h2>
      ${learnHidden
        ? '<button class="shx-learn-toggle" type="button" data-act="learn">Bilgi kartı kapalı: önce hatırlamaya çalış. <u>Göster</u></button>'
        : `<div class="shx-learn">${m.learn}${ex}</div>`}
      ${m.code ? `<pre class="shx-code">${esc(m.code)}</pre>` : ''}
      <div class="shx-task"><span class="shx-tlabel">${m.kind === 'cmd' ? 'Terminalde yap' : m.kind === 'predict' ? 'Tahmin et' : 'Seç'}</span><div>${m.task}</div></div>
      ${answer}
      ${helpButtons(m)}
      <div class="shx-hints" id="shx-hints"></div>
      <div class="shx-fb" id="shx-fb"></div>
      <div class="shx-nav">
        <button class="btn btn-sm btn-ghost" type="button" data-act="prev">← Önceki</button>
        <button class="btn btn-sm btn-ghost" type="button" data-act="skip">${st.review ? 'Atla' : 'Sonraki'} →</button>
      </div>`;
    $.hints = $.card.querySelector('#shx-hints');
    $.fb = $.card.querySelector('#shx-fb');
    for (let i = 0; i < st.hintN; i++) showHint(i);
    if (st.solved) showSuccess(m, st.solvedHow || '');
  }

  function renderReviewEnd() {
    const r = st.review;
    const ok = Object.values(r.results).filter((x) => x === 'ok').length;
    $.card.innerHTML = `
      <div class="shx-mhead"><span class="shx-kicker">Karışık tekrar</span></div>
      <h2 class="shx-title"><span>✓</span>Tekrar bitti</h2>
      <p class="shx-intro">${r.list.length} görevden <b>${ok}</b> tanesini çözüme bakmadan yaptın. Çözümüne baktıkların bir sonraki karışık tekrarda yine önce gelir.</p>
      <div class="btn-row">
        <button class="btn btn-primary" type="button" data-act="newreview">Yeni karışık tekrar</button>
        <a class="btn" href="#/shell/${stages()[0].id}">Aşamalara dön</a>
      </div>`;
    $.fb = null;
  }

  /* ------------------------------------------------------------ gezinme */

  function openMission(si, mi) {
    st.review = null;
    st.stage = si; st.idx = mi;
    prog.pos = [si, mi]; save();
    resetMissionState();
    prepare();
    renderStages(); renderCard();
  }

  function resetMissionState() {
    st.hintN = 0; st.usedSolution = false; st.solved = false; st.solvedHow = ''; st.wrong = 0; st.showLearn = false;
  }

  // Görev hazırlığı (setup) yalnızca görev değişince çalışır; terminalde görünür
  function prepare() {
    const m = mission();
    if (!m || st.preparedFor === m.id + ':' + (st.review ? st.review.at : '')) return;
    st.preparedFor = m.id + ':' + (st.review ? st.review.at : '');
    if (m.restore) {
      const name = m.restore.split('/').pop();
      sh.writePath(H + m.restore, Eng().files()[name]);
      sh.run(`chmod 755 ~/${m.restore}`);
      note(`# hazırlık: ${m.restore} ilk haline döndü`);
    }
    if (m.setup) {
      sh.run(m.setup);
      note(`# hazırlık: ${m.setup}`);
    }
    updatePrompt();
  }

  function next() {
    if (st.review) {
      st.review.at++;
      resetMissionState(); prepare(); renderStages(); renderCard();
      return;
    }
    const s = stages()[st.stage];
    if (st.idx + 1 < s.missions.length) openMission(st.stage, st.idx + 1);
    else if (st.stage + 1 < stages().length) location.hash = '#/shell/' + stages()[st.stage + 1].id;
    else location.hash = '#/shell/tekrar';
  }
  function prev() {
    if (st.review) { if (st.review.at > 0) { st.review.at--; resetMissionState(); prepare(); renderCard(); } return; }
    if (st.idx > 0) openMission(st.stage, st.idx - 1);
    else if (st.stage > 0) openMission(st.stage - 1, stages()[st.stage - 1].missions.length - 1);
  }

  function startReview() {
    const pool = [];
    stages().forEach((s, si) => s.missions.forEach((m, mi) => { if (!NO_REVIEW.has(m.id)) pool.push({ si, mi, m }); }));
    const seen = pool.filter((x) => prog.done[x.m.id] === 'seen');
    const done = pool.filter((x) => prog.done[x.m.id] === 'ok');
    const rest = pool.filter((x) => !prog.done[x.m.id]);
    const shuffle = (a) => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    let list = shuffle(seen).concat(shuffle(done));
    if (list.length < REVIEW_SIZE) list = list.concat(shuffle(rest));
    list = list.slice(0, REVIEW_SIZE);
    // aynı aşamadan art arda gelmesin (karma tekrar)
    for (let i = 1; i < list.length; i++) {
      if (list[i].si === list[i - 1].si) {
        const j = list.findIndex((x, k) => k > i && x.si !== list[i - 1].si);
        if (j > 0) [list[i], list[j]] = [list[j], list[i]];
      }
    }
    st.review = { list: list.map((x) => [x.si, x.mi]), at: 0, results: {} };
    resetMissionState(); prepare(); renderStages(); renderCard();
  }

  /* ------------------------------------------------------------ yardım ve denetim */

  function showHint(i) {
    const m = mission(); const h = m.hints[i];
    $.hints.insertAdjacentHTML('beforeend', `<div class="shx-hint"><b>İpucu ${i + 1}</b> ${h}</div>`);
  }

  function preRun(m) {
    if (!m || m.kind !== 'cmd') return {};
    const pre = 'cd ~' + (m.dir ? '/' + m.dir : '') + ' && ';
    if (m.solution) {
      const r = sh.clone().run(pre + m.solution);
      return { expected: r.status === 0 && r.stdout && !r.needInput ? r.stdout : null };
    }
    if (m.file) {
      const c = sh.clone(); c.run(pre + m.file.solution);
      const s = c.statPath(H + m.file.path);
      return { fileExp: s ? s.data : null };
    }
    return {};
  }

  function targetHTML(m) {
    if (m.solution) {
      const e = preRun(m).expected;
      return e === null ? '<span class="muted">Hedef çıktı şu an hesaplanamadı (dosyalar değişmiş olabilir; Sıfırla\'yı dene).</span>' : `<pre class="shx-target">${esc(e)}</pre>`;
    }
    if (m.expect) return `<pre class="shx-target">${esc(m.expect)}</pre>`;
    if (m.file) { const e = preRun(m).fileExp; return `<code>${esc(m.file.path)}</code> şu içerikte olmalı:<pre class="shx-target">${esc(e || '')}</pre>`; }
    return '';
  }

  function solutionText(m) {
    if (m.kind === 'cmd') {
      const s = m.solution || (m.file && m.file.solution);
      return s ? `<code>${esc(s)}</code>` : (m.hints || []).slice(-1)[0] || '';
    }
    if (m.kind === 'predict') return `<pre class="shx-target">${esc(m.answer)}</pre>`;
    return m.options.filter((o) => o.ok).map((o) => `<b>${o.t}</b>`).join('');
  }

  function feedback(kind, html) {
    if (!$.fb) return;
    $.fb.innerHTML = `<div class="shx-msg ${kind}">${html}</div>`;
  }

  function markDone(m) {
    const how = st.usedSolution || st.wrong > 1 ? 'seen' : 'ok';
    if (st.review) st.review.results[st.review.at] = how;
    if (prog.done[m.id] !== 'ok' || how === 'ok') prog.done[m.id] = how === 'ok' ? 'ok' : (prog.done[m.id] === 'ok' && !st.review ? 'ok' : 'seen');
    save();
  }

  function success(m, how) {
    if (st.solved) return;
    st.solved = true; st.solvedHow = how || '';
    markDone(m);
    renderStages();
    renderCard();
    OSLab.app.setStatus('done');
  }

  function showSuccess(m, how) {
    const last = !st.review && st.idx === stageOf(m).missions.length - 1;
    const nextLabel = st.review ? (st.review.at + 1 < st.review.list.length ? 'Sıradaki →' : 'Sonucu gör →') : last ? 'Aşama bitti · sonraki aşama →' : 'Sonraki görev →';
    const alt = m.kind === 'cmd' && m.solution && how && how.trim() !== m.solution ? `<div class="shx-alt">Örnek çözüm: <code>${esc(m.solution)}</code></div>` : '';
    feedback('ok', `<b>✓ ${st.usedSolution ? 'Tamam' : 'Doğru!'}</b> ${m.why || ''}${alt}
      <div class="btn-row"><button class="btn btn-primary btn-sm" type="button" data-act="next">${nextLabel}</button></div>`);
    $.card.querySelectorAll('.shx-opt, [data-act="guess"]').forEach((b) => { b.disabled = true; });
  }

  // Terminalde çalışan her komuttan sonra
  function check(text, r, pre) {
    const m = mission();
    if (!m || m.kind !== 'cmd' || st.solved || st.review === undefined) return;
    let ok;
    if (m.solution) ok = pre.expected !== null && pre.expected !== undefined && r.stdout === pre.expected;
    else if (m.expect) ok = r.stdout === m.expect;
    else if (m.match) ok = m.match.test(r.stdout);
    else if (m.state) ok = !!m.state(sh);
    else if (m.file) { const s = sh.statPath(H + m.file.path); ok = !!s && s.data === pre.fileExp; }
    if (ok && m.clean && r.stderr) ok = false;
    if (ok && m.must && !m.must.re.test(text)) { feedback('warn', m.must.msg); return; }
    if (ok) { success(m, text); return; }
    const tip = (m.tips || []).find((t) => (t.cmd && t.cmd.test(text)) || (t.out && t.out.test(r.stdout + r.stderr)));
    if (tip) { st.wrong++; feedback('tip', tip.msg); return; }
    const first = (text.trim().split(/\s+/)[0] || '');
    const sol = m.solution || m.expect ? (m.solution || '') : '';
    if (sol && first && sol.includes(first) && (r.stdout || r.stderr)) {
      st.wrong++;
      feedback('soft', `Bu çıktı hedeften farklı. ${r.stderr ? 'Hata iletisini oku: neyi söylüyor?' : '<button class="linkish" type="button" data-act="target">Hedef çıktıyla karşılaştır</button>'}`);
    }
  }

  /* ------------------------------------------------------------ terminal */

  const promptHTML = () => `<span class="p-user">ogrenci@oslab</span>:<span class="p-path">${esc(sh.promptPath())}</span>$ `;

  function updatePrompt() {
    if (!$) return;
    $.where.textContent = sh.promptPath();
    if (!st.pending) $.prompt.innerHTML = promptHTML();
  }

  function scrollDown() { $.screen.scrollTop = $.screen.scrollHeight; }

  function note(text) {
    if (!$) { screenHTML += `<div class="t-note">${esc(text)}</div>`; return; }
    $.out.insertAdjacentHTML('beforeend', `<div class="t-note">${esc(text)}</div>`);
    scrollDown();
  }

  function addBlock(text) {
    const b = document.createElement('div');
    b.className = 't-block';
    b.innerHTML = `<div class="t-cmd">${promptHTML()}<span>${esc(text)}</span></div><div class="t-res"></div>`;
    $.out.appendChild(b);
    return b.lastChild;
  }

  function renderRes(el, display, pending) {
    // Bloğun sonundaki satır sonu ayrıca boş satır çizmesin
    display = display.map((d, i) => (i === display.length - 1 && !pending ? { k: d.k, s: d.s.replace(/\n$/, '') } : d));
    let html = display.map((d) => `<span class="t-${d.k}">${esc(d.s)}</span>`).join('');
    let partial = '';
    if (pending) {
      // Son satır (istem metni) giriş satırına taşınır, gerçek terminaldeki gibi
      const all = display.map((d) => d.s).join('');
      const cut = all.lastIndexOf('\n') + 1;
      partial = all.slice(cut);
      let n = cut; const parts = [];
      for (const d of display) { if (n <= 0) break; const piece = d.s.slice(0, n); n -= piece.length; parts.push(`<span class="t-${d.k}">${esc(piece)}</span>`); }
      html = parts.join('');
    }
    el.innerHTML = html;
    return partial;
  }

  function submit(text) {
    if (st.pending) { feed(text); return; }
    $.input.value = '';
    const res = addBlock(text);
    if (text.trim()) { hist.push(text); sh.ctx.history.push(text); }
    st.histPos = hist.length;
    if (!text.trim()) { scrollDown(); return; }
    const m = mission();
    const pre = st.solved ? {} : preRun(m);
    const snap = sh.snapshot();
    execute({ res, text, inputs: [], snap, pre });
  }

  function execute(job) {
    let r;
    try { r = sh.run(job.text, { input: job.inputs }); } catch (e) {
      r = { display: [{ k: 'err', s: `[laboratuvar hatası: ${e.message}]\n` }], stdout: '', stderr: String(e.message), status: 1 };
      console.error(e);
    }
    const partial = renderRes(job.res, r.display, r.needInput);
    if (r.needInput) {
      st.pending = job;
      $.prompt.innerHTML = `<span class="t-err">${esc(partial)}</span>`;
      $.input.value = '';
      $.input.placeholder = 'girdi bekleniyor · Ctrl+D: girdi sonu · Ctrl+C: durdur';
      scrollDown();
      return;
    }
    st.pending = null;
    $.input.placeholder = '';
    if (r.clear) $.out.innerHTML = '';
    if (r.exit) note('# Bu terminal kapanmaz; çalışmaya devam edebilirsin.');
    updatePrompt();
    scrollDown();
    if (r.editor) openEditor(r.editor);
    OSLab.app.setStatus(r.status === 0 ? 'ready' : 'standby');
    check(job.text, r, job.pre || {});
  }

  // Girdi bekleyen komuta satır ver; durum geri yüklenip komut baştan çalışır (motor belirlenimci)
  function feed(line) {
    const job = st.pending;
    $.input.value = '';
    job.inputs.push(line);
    sh.restore(job.snap);
    execute(job);
  }

  function cancel() {
    if (st.pending) {
      const job = st.pending; st.pending = null;
      job.res.insertAdjacentHTML('beforeend', '<span class="t-err">^C</span>\n');
      $.input.placeholder = '';
    } else {
      const b = addBlock($.input.value); b.innerHTML = '<span class="t-err">^C</span>';
    }
    $.input.value = '';
    updatePrompt(); scrollDown();
  }

  function complete() {
    const v = $.input.value;
    const { word, cands } = sh.complete(v);
    if (!cands.length) return;
    if (cands.length === 1) { $.input.value = v.slice(0, v.length - word.length) + cands[0] + (cands[0].endsWith('/') ? '' : ' '); return; }
    let common = cands[0];
    for (const c of cands) while (!c.startsWith(common)) common = common.slice(0, -1);
    if (common.length > word.length) { $.input.value = v.slice(0, v.length - word.length) + common; return; }
    const b = addBlock(v);
    b.innerHTML = `<span class="t-out">${esc(cands.map((c) => c.replace(/^.*\/(?=.)/, '')).join('  '))}\n</span>`;
    scrollDown();
  }

  function onKey(e) {
    if (e.key === 'Enter') { e.preventDefault(); submit($.input.value); return; }
    if (e.key === 'Tab') { e.preventDefault(); if (!st.pending) complete(); return; }
    if (e.ctrlKey && (e.key === 'c' || e.key === 'C') && !window.getSelection().toString() && $.input.selectionStart === $.input.selectionEnd) { e.preventDefault(); cancel(); return; }
    if (e.ctrlKey && (e.key === 'd' || e.key === 'D')) { e.preventDefault(); if (st.pending) { const l = $.input.value; if (l) feed(l); feed(null); } return; }
    if (e.ctrlKey && (e.key === 'l' || e.key === 'L')) { e.preventDefault(); $.out.innerHTML = ''; return; }
    if (st.pending) return;
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (st.histPos === hist.length) st.draft = $.input.value;
      if (st.histPos > 0) { st.histPos--; $.input.value = hist[st.histPos]; }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (st.histPos < hist.length) { st.histPos++; $.input.value = st.histPos === hist.length ? st.draft : hist[st.histPos]; }
    }
  }

  function insert(text) {
    $.input.value = text;
    $.input.focus();
    $.input.setSelectionRange(text.length, text.length);
  }

  function runVisible(cmd) {
    if (st.pending) cancel();
    $.input.value = cmd;
    submit(cmd);
    $.input.focus();
  }

  /* ------------------------------------------------------------ dosyalar ve sıfırlama */

  function toggleFiles(open) {
    const btn = $.root.querySelector('[data-act="files"]');
    const show = open === undefined ? $.files.hidden : open;
    $.files.hidden = !show;
    btn.setAttribute('aria-expanded', String(show));
    if (!show) return;
    const home = sh.statPath(H);
    const row = (path) => {
      const s = sh.statPath(H + path);
      return s && s.type === 'f' ? `<button type="button" data-cat="${esc(path)}"><code>${esc(path)}</code></button>` : '';
    };
    const groups = [['Ev dizini (~)', home.kids.filter((k) => sh.statPath(H + k).type === 'f').sort()]];
    home.kids.filter((k) => sh.statPath(H + k).type === 'd').sort().forEach((d) => groups.push([`~/${d}`, sh.statPath(H + d).kids.map((k) => `${d}/${k}`).sort()]));
    $.files.innerHTML = `<p>Tıkla: içeriği <code>cat</code> ile terminale yazılır.</p>` +
      groups.map(([t, list]) => `<div class="shx-fgroup"><b>${esc(t)}</b>${list.map(row).join('')}</div>`).join('');
  }

  function resetFs() {
    if (!window.confirm('Dosya sistemi ilk haline dönsün mü? Oluşturduğun dosyalar ve değişkenler silinir; görev ilerlemen korunur.')) return;
    sh.reset();
    st.pending = null;
    note('# dosya sistemi ilk haline döndü');
    st.preparedFor = null; prepare();
    updatePrompt();
  }

  /* ------------------------------------------------------------ düzenleyici (nano) */

  function openEditor(path) {
    const s = sh.statPath(path);
    st.editor = { path, saved: s && s.data !== null ? s.data : '' };
    $.edName.textContent = path.replace(/^\/home\/ogrenci/, '~');
    $.edText.value = st.editor.saved;
    $.edStatus.textContent = s ? `[ ${st.editor.saved.split('\n').length - (st.editor.saved.endsWith('\n') ? 1 : 0)} satır okundu ]` : '[ Yeni dosya ]';
    $.edMod.textContent = '';
    $.edAsk.hidden = true; $.edBar.hidden = false;
    $.editor.hidden = false;
    $.edText.focus();
    $.edText.setSelectionRange(0, 0);
  }
  function edSave() {
    let t = $.edText.value;
    if (t && !t.endsWith('\n')) t += '\n';
    if (!sh.writePath(st.editor.path, t)) { $.edStatus.textContent = '[ Yazılamadı: dizin yok ]'; return false; }
    st.editor.saved = $.edText.value;
    const n = t ? t.split('\n').length - 1 : 0;
    $.edStatus.textContent = `[ ${n} satır yazıldı ]`;
    $.edMod.textContent = '';
    return true;
  }
  function edExit(force) {
    if (!force && $.edText.value !== st.editor.saved) { $.edBar.hidden = true; $.edAsk.hidden = false; return; }
    $.editor.hidden = true; st.editor = null;
    $.input.focus();
    const m = mission();
    if (m && m.kind === 'cmd' && m.state && !st.solved && m.state(sh)) success(m, '');
  }
  function edAct(a) {
    if (a === 'save') edSave();
    else if (a === 'exit') edExit(false);
    else if (a === 'yes') { if (edSave()) edExit(true); }
    else if (a === 'no') edExit(true);
    else { $.edAsk.hidden = true; $.edBar.hidden = false; $.edText.focus(); }
  }
  function onEdKey(e) {
    const k = e.key.toLowerCase();
    if (!$.edAsk.hidden) {
      if (k === 'e' || k === 'y') { e.preventDefault(); edAct('yes'); } else if (k === 'h' || k === 'n') { e.preventDefault(); edAct('no'); } else if (e.ctrlKey && k === 'c' || k === 'escape') { e.preventDefault(); edAct('cancel'); }
      return;
    }
    if (e.ctrlKey && (k === 'o' || k === 's')) { e.preventDefault(); edSave(); return; }
    if (e.ctrlKey && k === 'x') { e.preventDefault(); edExit(false); return; }
    if (k === 'tab') {
      e.preventDefault();
      const t = $.edText; const a = t.selectionStart;
      t.setRangeText('    ', a, t.selectionEnd, 'end');
    }
  }

  /* ------------------------------------------------------------ olaylar */

  function onCardClick(e) {
    const go = e.target.closest('[data-go]');
    if (go) { openMission(st.stage, Number(go.dataset.go)); return; }
    const ins = e.target.closest('[data-ins]');
    if (ins) { insert(ins.dataset.ins); return; }
    const opt = e.target.closest('[data-opt]');
    if (opt) { choose(Number(opt.dataset.opt), opt); return; }
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const m = mission();
    switch (b.dataset.act) {
      case 'next': next(); break;
      case 'skip': next(); break;
      case 'prev': prev(); break;
      case 'learn': st.showLearn = true; renderCard(); break;
      case 'newreview': startReview(); break;
      case 'hint':
        if (st.hintN < m.hints.length) { showHint(st.hintN); st.hintN++; }
        b.textContent = `İpucu ${Math.min(st.hintN + 1, m.hints.length)}/${m.hints.length}`;
        b.disabled = st.hintN >= m.hints.length;
        break;
      case 'target':
        $.hints.insertAdjacentHTML('beforeend', `<div class="shx-hint"><b>Hedef çıktı</b>${targetHTML(m)}</div>`);
        $.card.querySelectorAll('[data-act="target"]').forEach((x) => { x.disabled = true; });
        break;
      case 'solution':
        st.usedSolution = true;
        $.hints.insertAdjacentHTML('beforeend', `<div class="shx-hint sol"><b>Çözüm</b> ${solutionText(m)}${m.kind === 'cmd' ? '<br><small>Kendin yazarak çalıştır; bu görev Karışık Tekrar\'da yeniden gelecek.</small>' : ''}</div>`);
        b.disabled = true;
        if (m.kind !== 'cmd') success(m, '');
        break;
      case 'guess': guess(); break;
      case 'run': runVisible(b.dataset.cmd); break;
    }
  }

  const norm = (s) => s.trim().split(/\s+/).join(' ').toLowerCase();

  function guess() {
    const m = mission();
    const v = $.card.querySelector('#shx-guess').value;
    if (!v.trim()) return;
    const run = m.run ? ` <button class="linkish" type="button" data-act="run" data-cmd="${esc(m.run)}">▶ Terminalde çalıştırıp gör</button>` : '';
    if (norm(v) === norm(m.answer)) {
      success(m, '');
      if (run) $.fb.querySelector('.shx-msg').insertAdjacentHTML('beforeend', `<div class="shx-alt">${run}</div>`);
    } else {
      st.wrong++;
      feedback('tip', `Henüz değil.${st.wrong >= 2 ? ' "Çözümü göster" ile cevabı görebilirsin.' : ' Satır satır yeniden düşün.'}${run}`);
    }
  }

  function choose(i, btn) {
    const m = mission(); const o = m.options[i];
    if (o.ok) {
      btn.classList.add('right');
      success(m, '');
      $.card.querySelectorAll('.shx-opt')[i].classList.add('right');
    } else {
      st.wrong++;
      btn.classList.add('wrong'); btn.disabled = true;
      feedback('tip', o.why);
    }
  }

  /* ------------------------------------------------------------ modül */

  function navigate(params) {
    const p = params[0];
    if (p === 'tekrar') { startReview(); return; }
    const si = stages().findIndex((s) => s.id === p);
    if (si >= 0) {
      const mi = params[1] !== undefined ? Math.max(0, Math.min(Number(params[1]) - 1, stages()[si].missions.length - 1)) : (prog.pos[0] === si ? prog.pos[1] : firstOpen(si));
      openMission(si, mi);
      return;
    }
    const [s0, m0] = prog.pos;
    openMission(Math.min(s0, stages().length - 1), m0 || 0);
  }
  function firstOpen(si) { const i = stages()[si].missions.findIndex((m) => !prog.done[m.id]); return i < 0 ? 0 : i; }

  function mount(container, params) {
    if (!sh) {
      sh = Eng().create();
      screenHTML = `<div class="t-note">OS Lab terminali · tarayıcında çalışan bir bash benzetimi; bilgisayarına dokunmaz.</div><div class="t-note">help: komut listesi · man KOMUT: kısa kılavuz · ↑: önceki komut · Tab: tamamla</div>` + screenHTML;
    }
    container.innerHTML = template();
    $ = { root: container };
    const id = (x) => container.querySelector('#' + x);
    Object.assign($, {
      stages: id('shx-stages'), card: id('shx-card'), out: id('shx-out'), screen: id('shx-screen'), input: id('shx-in'),
      prompt: id('shx-prompt'), where: id('shx-where'), files: id('shx-files'),
      editor: id('shx-editor'), edName: id('ed-name'), edText: id('ed-text'), edStatus: id('ed-status'), edMod: id('ed-mod'), edBar: id('ed-bar'), edAsk: id('ed-ask')
    });
    $.out.innerHTML = screenHTML;
    st.pending = null;
    $.input.addEventListener('keydown', onKey);
    $.screen.addEventListener('click', () => { if (!window.getSelection().toString()) $.input.focus(); });
    $.card.addEventListener('click', onCardClick);
    $.card.addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.id === 'shx-guess' && !e.shiftKey && mission().answer.split('\n').length === 1) { e.preventDefault(); guess(); } });
    container.querySelector('.shx-term-head').addEventListener('click', (e) => {
      const b = e.target.closest('[data-act]');
      const cat = e.target.closest('[data-cat]');
      if (cat) { toggleFiles(false); runVisible(`cat ~/${cat.dataset.cat}`); return; }
      if (!b) return;
      if (b.dataset.act === 'files') toggleFiles();
      else if (b.dataset.act === 'reset') resetFs();
    });
    $.editor.addEventListener('click', (e) => { const b = e.target.closest('[data-ed]'); if (b) edAct(b.dataset.ed); });
    $.edText.addEventListener('keydown', onEdKey);
    $.edText.addEventListener('input', () => { if (st.editor) $.edMod.textContent = $.edText.value !== st.editor.saved ? 'Değiştirildi' : ''; });
    document.addEventListener('keydown', onEdGlobal, true);
    updatePrompt();
    navigate(params || []);
    OSLab.app.setStatus('ready');
    scrollDown();
    if (window.matchMedia('(min-width: 981px)').matches) $.input.focus({ preventScroll: true });
  }
  // Düzenleyicideki onay sorusu açıkken tuşlar textarea dışında da çalışsın
  function onEdGlobal(e) { if ($ && st.editor && !$.edAsk.hidden && e.target !== $.edText) onEdKey(e); }

  function unmount() {
    if ($) screenHTML = $.out.innerHTML;
    st.pending = null; st.editor = null;
    document.removeEventListener('keydown', onEdGlobal, true);
    $ = null;
  }

  OSLab.modules = OSLab.modules || {};
  OSLab.modules.shell = {
    num: '04',
    title: 'Shell Atölyesi',
    subtitle: 'Shell Programlama · LAB 115',
    mount,
    unmount,
    navigate
  };
})(window.OSLab = window.OSLab || {});
