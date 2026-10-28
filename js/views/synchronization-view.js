/*
 * synchronization-view.js — "3. Synchronization" modülünün arayüzü.
 * İki laboratuvar içerir:
 *   cs → Kritik bölge: yarış durumu, ardından mutex / semafor ile çözüm
 *   pc → Üretici–tüketici (bounded buffer)
 * Tüm durum geçişleri synchronization.js'te hesaplanır; bu dosya her adımı görselleştirir.
 */
(function (OSLab) {
  'use strict';

  const { createRaceSim, createRacePicker, createBoundedBuffer, pickWeighted, RACE_MODES, WAIT_REASON } = OSLab.sync;

  const SPEEDS = [
    { id: '0.5', label: '0.5× — yavaş', ms: 1500 },
    { id: '1', label: '1× — normal', ms: 900 },
    { id: '2', label: '2× — hızlı', ms: 450 },
    { id: '4', label: '4× — çok hızlı', ms: 180 }
  ];
  const MODE_HINTS = {
    none: 'Kritik bölge korumasız. Zamanlayıcı herhangi iki makine komutu arasında bağlam değişimi yapabilir; işlemler aynı değeri okuyup birbirinin yazdığını ezebilir.',
    mutex: 'acquire() kilidi atomik olarak alır. Kilit doluysa işlem bekleme kuyruğuna girer ve bloklanır. release() kilidi kuyruktaki ilk işleme devreder.',
    semaphore: 'wait(S): S−−, S < 0 ise işlem bloklanır. signal(S): S++, S ≤ 0 ise kuyruktaki ilk işlem uyandırılır. Karşılıklı dışlama için başlangıç değeri 1 olmalıdır.'
  };
  const POLICY_HINTS = {
    textbook: 'Silberschatz\'daki T0–T5 sırası tekrarlanır: A, A, B, B, A, B … (çalıştırılamayan işlem atlanır).',
    random: 'Her komuttan sonra %45 olasılıkla zamanlayıcı kesmesi gelir ve diğer işleme geçilir. Her çalıştırma farklı sonuç verebilir.',
    manual: 'Zamanlayıcı sensin: bir sonraki komutu hangi işlemin çalıştıracağını kartlardaki butonlarla seç.'
  };
  const STATE_LABEL = { ready: 'READY', running: 'RUNNING', blocked: 'BLOCKED', done: 'DONE' };
  const SECTION_LABEL = { entry: 'entry', cs: 'kritik', exit: 'exit' };
  const FOCUS_BY_MODE = { none: 'race', mutex: 'mutex', semaphore: 'semaphore' };

  const view = { lab: 'cs', speed: '1' };
  const cs = {
    cfg: { mode: 'none', policy: 'textbook', initial: 5, iterations: 1, opB: 'dec', semValue: 1 },
    sim: null, pick: null, timer: 0, playing: false, history: [], runs: 0
  };
  const pc = {
    cfg: { size: 5, prod: 3, cons: 2, policy: 'auto', buggy: false },
    sim: null, timer: 0, playing: false
  };

  let $ = null;

  /* ------------------------------------------------------------ yardımcılar */

  const camel = (s) => s.replace(/-([a-zA-Z])/g, (_, c) => c.toUpperCase()); // sy-cs-proc-A → csProcA
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const part = (root, name) => root.querySelector(`[data-el="${name}"]`);
  const delay = () => SPEEDS.find((s) => s.id === view.speed).ms;
  const itemColor = (id) => `hsl(${(id * 47) % 360} 72% 64%)`;

  function renderCode(list, program, header) {
    list.innerHTML = `<li class="code-meta"><code>${esc(header)}</code></li>`
      + program.map((ins, i) => `
        <li data-line="${i}" class="${ins.section ? 'sec-' + ins.section : ''}">
          <span class="ln">${i + 1}</span>
          <code>${esc(ins.text).replace(/\n/g, '<br>')}</code>
          ${ins.section ? `<span class="sec-tag">${SECTION_LABEL[ins.section]}</span>` : ''}
        </li>`).join('')
      + '<li class="code-meta"><code>}</code></li>';
  }

  function setPc(list, line) {
    list.querySelectorAll('li[data-line]').forEach((li) => li.classList.toggle('pc', Number(li.dataset.line) === line));
  }

  function flashLine(list, line, kind) {
    const li = list.querySelector(`li[data-line="${line}"]`);
    if (!li) return;
    li.classList.remove('flash', 'flash-bad', 'flash-ok', 'flash-warn');
    void li.offsetWidth;
    li.classList.add(kind === 'violation' || kind === 'conflict' || kind === 'deadlock' ? 'flash-bad'
      : kind === 'block' ? 'flash-warn'
        : kind === 'enter' || kind === 'wake' || kind === 'wakeup' || kind === 'release' ? 'flash-ok' : 'flash');
  }

  function retrigger(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  // Bir değerin bir öğeden diğerine "uçmasını" CSS transition ile canlandırır
  function flyToken(stage, fromEl, toEl, text, tone) {
    const duration = Math.min(560, delay() * 0.6);
    if (!fromEl || !toEl || duration < 120 || !stage.offsetParent) return;
    const sr = stage.getBoundingClientRect();
    const a = fromEl.getBoundingClientRect();
    const b = toEl.getBoundingClientRect();
    const x0 = a.left + a.width / 2 - sr.left;
    const y0 = a.top + a.height / 2 - sr.top;
    const tok = document.createElement('div');
    tok.className = `token ${tone || ''}`;
    tok.textContent = text;
    tok.style.left = `${x0}px`;
    tok.style.top = `${y0}px`;
    tok.style.transitionDuration = `${duration}ms`;
    stage.appendChild(tok);
    void tok.offsetWidth;
    tok.style.transform = `translate(-50%, -50%) translate(${b.left + b.width / 2 - sr.left - x0}px, ${b.top + b.height / 2 - sr.top - y0}px)`;
    setTimeout(() => tok.remove(), duration + 60);
  }

  function setAlert(el, tone, title, text) {
    el.className = `sy-alert ${tone}`;
    el.innerHTML = `<b>${title}</b><span>${text}</span>`;
    retrigger(el, 'pop');
  }

  function speedOptions() {
    return SPEEDS.map((s) => `<option value="${s.id}">${s.label}</option>`).join('');
  }

  /* ------------------------------------------------------------ şablon */

  const csProcCard = (id) => `
    <div class="proc proc-${id}" id="sy-cs-proc-${id}">
      <div class="proc-head">
        <span class="proc-name"><i class="proc-dot"></i>Process ${id}</span>
        <span class="state-badge" data-el="state"></span>
      </div>
      <div class="proc-sub" data-el="sub"></div>
      <div class="pcb"><span>PCB · yazmaç <b data-el="reg-name"></b></span><span class="pcb-val" data-el="reg">—</span></div>
      <ol class="code" data-el="code"></ol>
      <button class="btn btn-sm btn-block run-btn" type="button" data-run="${id}">▶ ${id} sıradaki komutu çalıştırsın</button>
    </div>`;

  const pcProcCard = (id, title, sub, regName) => `
    <div class="proc proc-${id}" id="sy-pc-proc-${id}">
      <div class="proc-head">
        <span class="proc-name"><i class="proc-dot"></i>${title}</span>
        <span class="state-badge" data-el="state"></span>
      </div>
      <div class="proc-sub">${sub}</div>
      <div class="pcb"><span>${regName}</span><span class="pcb-val" data-el="reg">—</span></div>
      <div class="sleep-note" data-el="sleep"></div>
      <ol class="code" data-el="code"></ol>
      <button class="btn btn-sm btn-block run-btn" type="button" data-run="${id}">▶ ${title} sıradaki komutu çalıştırsın</button>
    </div>`;

  function template() {
    return `
      <p class="module-lead">Eşzamanlı işlemlerin paylaşılan veriye erişimini makine komutu düzeyinde izle: önce yarış durumunu gör, sonra aynı senaryoyu kilitlerle düzelt.</p>
      <div class="lab-tabs" role="tablist">
        <button class="lab-tab" type="button" role="tab" data-lab="cs"><span class="lab-num">A</span>Kritik Bölge <small>Race Condition → Mutex / Semafor</small></button>
        <button class="lab-tab" type="button" role="tab" data-lab="pc"><span class="lab-num">B</span>Üretici–Tüketici <small>Bounded Buffer</small></button>
      </div>

      <section class="lab" id="sy-lab-cs" role="tabpanel">
        <div class="sync-grid">
          <article class="card">
            <header class="card-head"><h2>Konfigürasyon</h2><span class="tag">Kritik Bölge</span></header>
            <div class="field">
              <span class="label">Koruma Modu</span>
              <div class="segmented" id="sy-cs-modes">
                <button type="button" data-mode="none" class="seg-danger">Senkronizasyon Yok</button>
                <button type="button" data-mode="mutex" class="seg-ok">Mutex</button>
                <button type="button" data-mode="semaphore" class="seg-ok">Semafor</button>
              </div>
              <p class="hint" id="sy-cs-mode-hint"></p>
            </div>
            <div class="collapsible" id="sy-cs-sem-wrap">
              <div>
                <div class="field">
                  <label for="sy-cs-sem-value">Semafor başlangıç değeri (S)</label>
                  <select id="sy-cs-sem-value">
                    <option value="1">S = 1 (binary semafor, karşılıklı dışlama)</option>
                    <option value="2">S = 2 (counting semafor, ihlali gör)</option>
                  </select>
                </div>
              </div>
            </div>
            <div class="field">
              <label for="sy-cs-policy">Zamanlama (bağlam değişimi)</label>
              <select id="sy-cs-policy">
                <option value="textbook">Ders kitabı senaryosu (T0–T5)</option>
                <option value="random">Rastgele kesmeler</option>
                <option value="manual">Manuel: zamanlayıcı sensin</option>
              </select>
              <p class="hint" id="sy-cs-policy-hint"></p>
            </div>
            <div class="field-row">
              <div class="field"><label for="sy-cs-initial">counter başlangıç</label><input id="sy-cs-initial" type="number" min="-99" max="99" step="1"></div>
              <div class="field"><label for="sy-cs-iter">Tekrar (her işlem)</label><input id="sy-cs-iter" type="number" min="1" max="5" step="1"></div>
            </div>
            <div class="field-row">
              <div class="field"><label for="sy-cs-opb">Process B</label>
                <select id="sy-cs-opb"><option value="dec">counter-- (tüketici)</option><option value="inc">counter++ (ikinci üretici)</option></select>
              </div>
              <div class="field"><label for="sy-cs-speed">Hız</label><select id="sy-cs-speed">${speedOptions()}</select></div>
            </div>
            <button class="btn btn-primary btn-block" id="sy-cs-play" type="button"></button>
            <div class="btn-row two">
              <button class="btn" id="sy-cs-step" type="button">⏭ Tek Adım</button>
              <button class="btn" id="sy-cs-reset" type="button">↺ Sıfırla</button>
            </div>
          </article>

          <article class="card stage-card">
            <header class="card-head"><h2>Paylaşılan Bellek</h2><span class="tag" id="sy-cs-tag"></span></header>
            <div class="sy-alert" id="sy-cs-alert"></div>
            <div class="arena" id="sy-cs-stage">
              ${csProcCard('A')}
              <div class="shared">
                <div class="cpu-pill">CPU <b id="sy-cs-cpu">—</b></div>
                <div class="counter-box" id="sy-cs-counter">
                  <span class="live-label">PAYLAŞILAN DEĞİŞKEN</span>
                  <span class="counter-name">counter</span>
                  <span class="counter-val" id="sy-cs-counter-val">5</span>
                  <span class="counter-meta" id="sy-cs-counter-meta"></span>
                  <span class="clash">ÇAKIŞMA</span>
                </div>
                <div class="lock-box" id="sy-cs-lock"></div>
              </div>
              ${csProcCard('B')}
            </div>
          </article>

          <div class="duo span-2">
            <article class="card">
              <header class="card-head"><h2>Yürütme İzi</h2><span class="tag">Silberschatz T0–T5 tablosu biçiminde</span></header>
              <div class="table-wrap trace-wrap" id="sy-cs-trace-wrap">
                <table class="trace">
                  <thead><tr><th>Adım</th><th>İşlem</th><th>Komut</th><th>Sonuç</th><th class="num">counter</th></tr></thead>
                  <tbody id="sy-cs-trace"></tbody>
                </table>
              </div>
            </article>
            <article class="card">
              <header class="card-head"><h2>Sonuç</h2><span class="tag">Veri tutarlılığı</span></header>
              <div class="verdict" id="sy-cs-verdict"></div>
              <div class="mini-stats" id="sy-cs-stats"></div>
              <div class="history-label">Çalıştırma geçmişi</div>
              <div class="history" id="sy-cs-history"></div>
            </article>
          </div>
        </div>
      </section>

      <section class="lab" id="sy-lab-pc" role="tabpanel" hidden>
        <div class="sync-grid">
          <article class="card">
            <header class="card-head"><h2>Konfigürasyon</h2><span class="tag">Bounded Buffer</span></header>
            <div class="field-row">
              <div class="field"><label for="sy-pc-size">Tampon boyutu (n)</label><input id="sy-pc-size" type="number" min="2" max="8" step="1"></div>
              <div class="field"><label for="sy-pc-speed">Hız</label><select id="sy-pc-speed">${speedOptions()}</select></div>
            </div>
            <div class="field">
              <label for="sy-pc-prod">Üretici CPU payı <b class="range-val" id="sy-pc-prod-val"></b></label>
              <input id="sy-pc-prod" type="range" min="1" max="5" step="1" class="range range-p">
            </div>
            <div class="field">
              <label for="sy-pc-cons">Tüketici CPU payı <b class="range-val" id="sy-pc-cons-val"></b></label>
              <input id="sy-pc-cons" type="range" min="1" max="5" step="1" class="range range-c">
              <p class="hint">Üretici hızlıysa tampon dolar ve üretici bloklanır. Tüketici hızlıysa tampon boşalır ve tüketici bloklanır.</p>
            </div>
            <div class="field">
              <label for="sy-pc-policy">Zamanlama</label>
              <select id="sy-pc-policy">
                <option value="auto">Otomatik (CPU paylarına göre)</option>
                <option value="manual">Manuel: zamanlayıcı sensin</option>
              </select>
            </div>
            <label class="toggle">
              <input type="checkbox" id="sy-pc-buggy">
              <span class="toggle-ui"></span>
              <span><b>Hatalı sıralama</b><small>Üreticide wait(mutex) → wait(empty): deadlock'u gör</small></span>
            </label>
            <button class="btn btn-primary btn-block" id="sy-pc-play" type="button"></button>
            <div class="btn-row two">
              <button class="btn" id="sy-pc-step" type="button">⏭ Tek Adım</button>
              <button class="btn" id="sy-pc-reset" type="button">↺ Sıfırla</button>
            </div>
          </article>

          <article class="card stage-card">
            <header class="card-head"><h2>Sınırlı Tampon</h2><span class="tag" id="sy-pc-tag"></span></header>
            <div class="sy-alert" id="sy-pc-alert"></div>
            <div class="arena" id="sy-pc-stage">
              ${pcProcCard('P', 'Üretici', 'Producer', 'next_produced')}
              <div class="shared">
                <div class="cpu-pill">CPU <b id="sy-pc-cpu">—</b></div>
                <div class="buffer" id="sy-pc-buffer">
                  <div class="buffer-head"><span class="live-label">buffer[n]</span><span class="buffer-count" id="sy-pc-count"></span></div>
                  <div class="slots" id="sy-pc-slots"></div>
                  <div class="ptr-row"><span class="ptr ptr-in" id="sy-pc-ptr-in">in ▲</span></div>
                  <div class="ptr-row"><span class="ptr ptr-out" id="sy-pc-ptr-out">out ▲</span></div>
                  <div class="fill"><i id="sy-pc-fill"></i></div>
                </div>
                <div class="sems" id="sy-pc-sems"></div>
              </div>
              ${pcProcCard('C', 'Tüketici', 'Consumer', 'next_consumed')}
            </div>
          </article>

          <div class="duo span-2">
            <article class="card">
              <header class="card-head"><h2>Olay Günlüğü</h2><span class="tag">wait / signal / block / wakeup</span></header>
              <ol class="log" id="sy-pc-log"></ol>
            </article>
            <article class="card">
              <header class="card-head"><h2>İstatistikler</h2></header>
              <div class="mini-stats" id="sy-pc-stats"></div>
            </article>
          </div>
        </div>
      </section>`;
  }

  /* ============================================================ A) KRİTİK BÖLGE */

  function csBind() {
    $.csModes.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-mode]');
      if (!btn) return;
      cs.cfg.mode = btn.dataset.mode;
      csConfigChanged();
      OSLab.app.focusInfo(FOCUS_BY_MODE[cs.cfg.mode]);
    });
    $.csSemValue.addEventListener('change', () => { cs.cfg.semValue = Number($.csSemValue.value); csConfigChanged(); });
    $.csPolicy.addEventListener('change', () => { cs.cfg.policy = $.csPolicy.value; csConfigChanged(); });
    $.csOpb.addEventListener('change', () => { cs.cfg.opB = $.csOpb.value; csConfigChanged(); });
    $.csInitial.addEventListener('change', () => {
      const v = Math.round(Number($.csInitial.value));
      cs.cfg.initial = Number.isFinite(v) ? Math.max(-99, Math.min(99, v)) : 5;
      csConfigChanged();
    });
    $.csIter.addEventListener('change', () => {
      const v = Math.round(Number($.csIter.value));
      cs.cfg.iterations = Number.isFinite(v) ? Math.max(1, Math.min(5, v)) : 1;
      csConfigChanged();
    });
    $.csSpeed.addEventListener('change', () => { view.speed = $.csSpeed.value; });
    $.csPlay.addEventListener('click', () => (cs.playing ? csPause() : csPlay()));
    $.csStep.addEventListener('click', () => { csPause(); csTick(); });
    $.csReset.addEventListener('click', csReset);
    $.csStage.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-run]');
      if (btn && !btn.disabled) csApply(cs.sim.step(btn.dataset.run));
    });
  }

  function csSyncControls() {
    const c = cs.cfg;
    $.csModes.querySelectorAll('[data-mode]').forEach((b) => {
      const on = b.dataset.mode === c.mode;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    $.csModeHint.textContent = MODE_HINTS[c.mode];
    $.csSemWrap.classList.toggle('open', c.mode === 'semaphore');
    $.csSemValue.disabled = c.mode !== 'semaphore';
    $.csSemValue.value = c.semValue;
    $.csPolicy.value = c.policy;
    $.csPolicyHint.textContent = POLICY_HINTS[c.policy];
    $.csInitial.value = c.initial;
    $.csIter.value = c.iterations;
    $.csOpb.value = c.opB;
    $.csSpeed.value = view.speed;
    $.csStage.dataset.mode = c.mode;
    $.csTag.textContent = RACE_MODES[c.mode].label + (c.mode === 'semaphore' ? ` · S₀ = ${c.semValue}` : '');
  }

  function csConfigChanged() {
    csSyncControls();
    csReset();
  }

  function csReset() {
    csStop();
    const c = cs.cfg;
    cs.sim = createRaceSim(c);
    cs.pick = createRacePicker(c.policy);

    ['A', 'B'].forEach((id) => {
      const p = cs.sim.procs[id];
      const card = $['csProc' + id];
      part(card, 'reg-name').textContent = p.regName;
      renderCode(part(card, 'code'), p.program, `for (i = 0; i < ${c.iterations}; i++) {`);
      card.classList.remove('violation');
    });
    $.csCounter.classList.remove('conflict', 'corrupt', 'safe-write');
    $.csTrace.innerHTML = '<tr class="trace-empty"><td colspan="5" class="empty">Başlattığında her makine komutu burada bir satır olacak.</td></tr>';

    if (c.mode === 'none') setAlert($.csAlert, 'warn', 'Koruma yok.', 'Kritik bölgeye giriş denetlenmiyor. Bağlam değişimi komutların arasına düşerse veri bozulabilir.');
    else if (c.mode === 'semaphore' && c.semValue > 1) setAlert($.csAlert, 'warn', `S = ${c.semValue}.`, 'Semafor aynı anda iki işlemin girmesine izin veriyor. Bu bir counting semafor; karşılıklı dışlama sağlamaz.');
    else setAlert($.csAlert, 'info', c.mode === 'mutex' ? 'Mutex aktif.' : 'Binary semafor aktif.', 'Kritik bölgeye aynı anda yalnızca bir işlem girebilir. Diğeri bekleme kuyruğunda uyur.');

    csRender();
    csRenderResult();
    csButtons();
    OSLab.app.setStatus('ready');
  }

  function csRender() {
    const sim = cs.sim;
    const both = sim.procs.A.inCS && sim.procs.B.inCS;
    const manual = cs.cfg.policy === 'manual';
    const runnable = sim.runnable();

    ['A', 'B'].forEach((id) => {
      const p = sim.procs[id];
      const card = $['csProc' + id];
      card.dataset.state = p.state;
      card.classList.toggle('in-cs', p.inCS);
      card.classList.toggle('violation', both);
      const badge = part(card, 'state');
      badge.textContent = STATE_LABEL[p.state];
      badge.dataset.state = p.state;
      part(card, 'sub').innerHTML = `<code>${p.delta > 0 ? 'counter++' : 'counter--'}</code> · `
        + (p.state === 'done' ? `${sim.iterations}/${sim.iterations} tur ✓` : `tur ${p.iter + 1}/${sim.iterations}`)
        + (p.inCS ? ' · <b class="in-cs-tag">KRİTİK BÖLGEDE</b>' : '');
      part(card, 'reg').textContent = p.reg === null ? '—' : p.reg;
      setPc(part(card, 'code'), p.state === 'done' ? -1 : p.pc);
      const btn = card.querySelector('.run-btn');
      btn.hidden = !manual;
      btn.disabled = !runnable.includes(id) || sim.finished;
    });

    // Bloklanan işlem CPU'yu bırakır; bir sonraki seçime kadar CPU boşta gösterilir
    const onCpu = sim.current && sim.procs[sim.current].state === 'running' ? sim.current : null;
    $.csCpu.textContent = onCpu ? `Process ${onCpu}` : '—';
    $.csCpu.dataset.pid = onCpu || '';
    $.csCounterVal.textContent = sim.counter.value;
    $.csCounterMeta.innerHTML = `son yazan: <b>${sim.counter.writer || '—'}</b> · sonda beklenen: <b>${sim.expected}</b>`;
    $.csCounter.classList.toggle('corrupt', sim.stats.staleWrites > 0);
    csRenderLock();
  }

  function queueChips(ids) {
    return ids.length
      ? ids.map((id) => `<span class="qchip q-${id}">${id}</span>`).join('<span class="q-sep">›</span>')
      : '<span class="chip-empty">boş</span>';
  }

  const PADLOCK = (locked) => `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true">
      <rect x="4.5" y="11" width="15" height="10" rx="2"/>
      <path d="${locked ? 'M8 11V8a4 4 0 0 1 8 0v3' : 'M8 11V8a4 4 0 0 1 7.8-1.2'}"/>
      <circle cx="12" cy="16" r="1.3"/>
    </svg>`;

  function csRenderLock() {
    const sim = cs.sim;
    const box = $.csLock;
    if (sim.mode === 'none') {
      box.className = 'lock-box lock-none';
      box.innerHTML = `<div class="lock-state">${PADLOCK(false)}<div><b>Kilit yok</b><small>A ve B kritik bölgeye istedikleri an girebilir</small></div></div>`;
      return;
    }
    if (sim.mode === 'mutex') {
      const owner = sim.lock.owner;
      box.className = `lock-box ${owner ? 'locked' : 'open'}`;
      box.innerHTML = `
        <div class="lock-state">${PADLOCK(!!owner)}<div><b>mutex · ${owner ? 'KİLİTLİ' : 'AÇIK'}</b><small>${owner ? `sahibi: Process ${owner}` : 'available = true'}</small></div></div>
        <div class="wq"><span class="wq-label">Bekleme kuyruğu</span><div class="wq-chips">${queueChips(sim.lock.queue)}</div></div>`;
      return;
    }
    const v = sim.lock.value;
    box.className = `lock-box ${v <= 0 ? 'locked' : 'open'}`;
    box.innerHTML = `
      <div class="lock-state"><div class="semval${v < 0 ? ' neg' : ''}"><span>S</span><b>${v}</b></div>
        <div><b>semafor</b><small>${v < 0 ? `|S| = ${-v} işlem bekliyor` : v === 0 ? 'giriş hakkı kalmadı' : `${v} giriş hakkı var`}</small></div></div>
      <div class="wq"><span class="wq-label">S.list (bekleyenler)</span><div class="wq-chips">${queueChips(sim.lock.queue)}</div></div>`;
  }

  function csApply(ev) {
    const sim = cs.sim;
    const card = $['csProc' + ev.pid];

    csTraceRow(ev);
    csRender();
    flashLine(part(card, 'code'), ev.line, ev.kind);
    if (ev.switchFrom) retrigger($.csCpu, 'switch');

    if (ev.op === 'load') flyToken($.csStage, $.csCounterVal, part(card, 'reg'), ev.result.split(' = ')[1], `t-${ev.pid}`);
    if (ev.op === 'store') {
      flyToken($.csStage, part(card, 'reg'), $.csCounterVal, ev.counter, ev.kind === 'conflict' ? 'bad' : `t-${ev.pid}`);
      if (ev.kind !== 'conflict' && sim.mode !== 'none') retrigger($.csCounter, 'safe-write');
    }

    switch (ev.kind) {
      case 'violation':
        setAlert($.csAlert, 'danger', '⚠ Karşılıklı dışlama ihlali!', `${esc(ev.note)} İkisi de aynı counter değerini okuyabilir.`);
        break;
      case 'conflict':
        retrigger($.csCounter, 'conflict');
        $.csCounterMeta.innerHTML = `<s>${ev.overwritten}</s> ezildi → <b>${ev.counter}</b> · sonda beklenen: <b>${sim.expected}</b>`;
        setAlert($.csAlert, 'danger', '✗ ÇAKIŞMA: veri bozuldu.', esc(ev.note));
        break;
      case 'block':
        setAlert($.csAlert, 'warn', `⏸ Process ${ev.pid} bloklandı.`, `${esc(ev.result)}. CPU boşa dönmez; zamanlayıcı diğer işleme geçer.`);
        break;
      case 'wake':
        setAlert($.csAlert, 'ok', `▶ Process ${ev.woken} uyandırıldı.`, `${esc(ev.result)}. ${ev.woken} artık kritik bölgede, veri tutarlı.`);
        break;
      case 'enter':
        if (sim.mode !== 'none') setAlert($.csAlert, 'ok', `🔒 Process ${ev.pid} kritik bölgeye girdi.`, `${esc(ev.result)}. Diğer işlem girmeye çalışırsa bekleme kuyruğuna alınacak.`);
        break;
    }

    if (sim.finished) csFinish();
    else csRenderResult();
  }

  function csTraceRow(ev) {
    const empty = $.csTrace.querySelector('.trace-empty');
    if (empty) empty.remove();
    let html = ev.switchFrom ? `<tr class="row-switch"><td colspan="5">⇄ ${esc(ev.switchNote)}</td></tr>` : '';
    html += `
      <tr class="row-${ev.kind}">
        <td class="t-step">T${ev.t}</td>
        <td><span class="qchip q-${ev.pid}">${ev.pid}</span></td>
        <td><code>${esc(ev.text)}</code></td>
        <td>${esc(ev.result)}${ev.note ? `<small>${esc(ev.note)}</small>` : ''}</td>
        <td class="num">${ev.counter}</td>
      </tr>`;
    $.csTrace.insertAdjacentHTML('beforeend', html);
    $.csTraceWrap.scrollTop = $.csTraceWrap.scrollHeight;
  }

  function csRenderResult() {
    const sim = cs.sim;
    const st = sim.stats;
    const value = sim.counter.value;
    const ok = value === sim.expected;
    const box = $.csVerdict;

    if (!sim.finished) {
      box.className = 'verdict pending';
      box.innerHTML = `<b>${sim.steps ? 'Çalışıyor…' : 'Hazır'}</b><span>Doğru son değer: <code>${sim.expected}</code></span>`;
    } else if (ok) {
      box.className = 'verdict ok';
      box.innerHTML = `<b>✓ TUTARLI</b><span>beklenen ${sim.expected} = bulunan ${value}</span>`
        + (st.violations ? '<em>Sonuç bu kez doğru çıktı ama karşılıklı dışlama ihlal edildi. Yarış durumu her çalıştırmada görünmeyebilir; bu onu daha da tehlikeli yapar.</em>' : '');
    } else {
      box.className = 'verdict bad';
      box.innerHTML = `<b>✗ TUTARSIZ</b><span>beklenen ${sim.expected}, bulunan ${value} (fark ${value - sim.expected > 0 ? '+' : ''}${value - sim.expected})</span>`;
    }

    const stat = (label, v, tone) => `<div class="mini-stat ${v && tone ? tone : ''}"><span>${label}</span><b>${v}</b></div>`;
    $.csStats.innerHTML = stat('Adım', sim.steps)
      + stat('Bağlam değişimi', st.switches)
      + stat('Kayıp güncelleme', st.staleWrites, 'bad')
      + stat('ME ihlali', st.violations, 'bad')
      + stat('Bloklanma', st.blocks, 'warn');

    $.csHistory.innerHTML = cs.history.length
      ? cs.history.map((h) => `<span class="hchip ${h.ok ? 'ok' : 'bad'}" title="${esc(h.title)}">#${h.n} ${h.mode} · ${h.ok ? '✓' : '✗'} ${h.value}</span>`).join('')
      : '<span class="chip-empty">Henüz tamamlanan çalıştırma yok</span>';
  }

  function csButtons() {
    const sim = cs.sim;
    const manual = cs.cfg.policy === 'manual';
    $.csPlay.disabled = manual && !sim.finished;
    $.csPlay.textContent = cs.playing ? '⏸ Duraklat'
      : sim.finished ? '↻ Tekrar Çalıştır'
        : manual ? 'Manuel mod: kartlardaki butonları kullan'
          : sim.steps ? '▶ Devam Et' : '▶ Simülasyonu Başlat';
    $.csStep.disabled = sim.finished || manual;
  }

  function csPlay() {
    if (cs.sim.finished) csReset();
    if (cs.cfg.policy === 'manual') return;
    cs.playing = true;
    csButtons();
    OSLab.app.setStatus('running');
    csLoop();
  }

  function csLoop() {
    csTick();
    if (cs.playing && !cs.sim.finished) cs.timer = setTimeout(csLoop, delay());
  }

  function csTick() {
    if (cs.sim.finished) return;
    const pid = cs.pick(cs.sim);
    if (pid) csApply(cs.sim.step(pid));
  }

  function csStop() {
    clearTimeout(cs.timer);
    cs.playing = false;
  }

  function csPause() {
    if (!cs.playing) return;
    csStop();
    csButtons();
    OSLab.app.setStatus('paused');
  }

  function csFinish() {
    const sim = cs.sim;
    csStop();
    const ok = sim.counter.value === sim.expected;
    const modeLabel = sim.mode === 'none' ? 'Korumasız' : sim.mode === 'mutex' ? 'Mutex' : `Semafor S=${sim.lock.initial}`;
    cs.history.unshift({ n: ++cs.runs, mode: modeLabel, value: sim.counter.value, ok, title: `${modeLabel}, ${$.csPolicy.selectedOptions[0].text}, beklenen ${sim.expected}` });
    cs.history.length = Math.min(cs.history.length, 10);
    csRender();
    csRenderResult();
    csButtons();
    if (ok && !sim.stats.violations) {
      setAlert($.csAlert, 'ok', '✓ Veri tutarlı.', `Her iki işlem de bitti. counter = ${sim.counter.value}, beklenen değerle aynı.`);
    } else if (ok) {
      setAlert($.csAlert, 'warn', 'Sonuç doğru ama şans eseri.', 'Karşılıklı dışlama ihlal edildi. Farklı bir zamanlamada sonuç bozulabilir.');
    } else {
      setAlert($.csAlert, 'danger', '✗ Yarış durumu kanıtlandı.', `Beklenen ${sim.expected}, bulunan ${sim.counter.value}. Sonuç, komutların hangi sırayla iç içe geçtiğine bağlı. Mutex veya semafor modunu açıp tekrar çalıştır.`);
    }
    OSLab.app.setStatus(ok && !sim.stats.violations ? 'done' : 'alert');
  }

  /* ============================================================ B) ÜRETİCİ–TÜKETİCİ */

  function pcBind() {
    $.pcSize.addEventListener('change', () => {
      const v = Math.round(Number($.pcSize.value));
      pc.cfg.size = Number.isFinite(v) ? Math.max(2, Math.min(8, v)) : 5;
      pcSyncControls();
      pcReset();
    });
    $.pcProd.addEventListener('input', () => { pc.cfg.prod = Number($.pcProd.value); pcSyncControls(); });
    $.pcCons.addEventListener('input', () => { pc.cfg.cons = Number($.pcCons.value); pcSyncControls(); });
    $.pcPolicy.addEventListener('change', () => { pc.cfg.policy = $.pcPolicy.value; pcPause(); pcSyncControls(); pcRender(); pcButtons(); });
    $.pcBuggy.addEventListener('change', () => { pc.cfg.buggy = $.pcBuggy.checked; pcSyncControls(); pcReset(); });
    $.pcSpeed.addEventListener('change', () => { view.speed = $.pcSpeed.value; });
    $.pcPlay.addEventListener('click', () => (pc.playing ? pcPause() : pcPlay()));
    $.pcStep.addEventListener('click', () => { pcPause(); pcTick(); });
    $.pcReset.addEventListener('click', pcReset);
    $.pcStage.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-run]');
      if (btn && !btn.disabled) pcApply(pc.sim.step(btn.dataset.run));
    });
  }

  function pcSyncControls() {
    const c = pc.cfg;
    $.pcSize.value = c.size;
    $.pcProd.value = c.prod;
    $.pcCons.value = c.cons;
    $.pcProdVal.textContent = `${c.prod} / 5`;
    $.pcConsVal.textContent = `${c.cons} / 5`;
    $.pcPolicy.value = c.policy;
    $.pcBuggy.checked = c.buggy;
    $.pcSpeed.value = view.speed;
    $.pcTag.textContent = `n = ${c.size} · ${c.buggy ? 'HATALI sıralama' : 'doğru çözüm'}`;
  }

  function pcReset() {
    pcStop();
    const c = pc.cfg;
    pc.sim = createBoundedBuffer({ size: c.size, buggy: c.buggy });
    const sim = pc.sim;

    renderCode(part($.pcProcP, 'code'), sim.procs.P.program, 'while (true) {');
    renderCode(part($.pcProcC, 'code'), sim.procs.C.program, 'while (true) {');
    $.pcSlots.style.setProperty('--n', c.size);
    $.pcBuffer.style.setProperty('--n', c.size);
    $.pcSlots.innerHTML = Array.from({ length: c.size }, (_, i) => `<div class="slot" data-item=""><span class="slot-idx">${i}</span></div>`).join('');
    $.pcSems.innerHTML = ['mutex', 'empty', 'full'].map((name) => `
      <div class="sem" data-sem="${name}">
        <div class="sem-top"><span class="sem-name">${name}</span><span class="sem-init">başl. ${sim.sems[name].initial}</span></div>
        <b class="sem-val">${sim.sems[name].value}</b>
        <div class="wq-chips"></div>
      </div>`).join('');
    $.pcStage.classList.remove('deadlocked');
    $.pcLog.innerHTML = '<li class="log-empty">wait/signal çağrıları, bloklanmalar ve uyandırmalar burada listelenir.</li>';

    if (c.buggy) {
      setAlert($.pcAlert, 'danger', 'Hatalı sıralama aktif.', 'Üretici önce mutex\'i alıyor, sonra empty\'yi bekliyor. Tampon dolduğunda ne olacağını izle (üretici payını artır).');
    } else {
      setAlert($.pcAlert, 'info', 'Ders kitabı çözümü.', '<code>mutex = 1, empty = n, full = 0</code>. Üretici wait(empty) → wait(mutex), tüketici wait(full) → wait(mutex).');
    }
    pcRender();
    pcButtons();
    OSLab.app.setStatus('ready');
  }

  function pcRender() {
    const sim = pc.sim;
    const manual = pc.cfg.policy === 'manual';
    const runnable = sim.runnable();

    ['P', 'C'].forEach((id) => {
      const p = sim.procs[id];
      const card = $['pcProc' + id];
      card.dataset.state = p.state;
      card.classList.toggle('deadlocked', sim.deadlock);
      card.classList.toggle('in-cs', sim.mutexHolder === id);
      const badge = part(card, 'state');
      badge.textContent = sim.deadlock ? 'DEADLOCK' : STATE_LABEL[p.state];
      badge.dataset.state = sim.deadlock ? 'deadlock' : p.state;
      part(card, 'reg').innerHTML = p.item === null ? '—' : `<span class="item-dot" style="--c:${itemColor(p.item)}"></span>#${p.item}`;
      const sleep = part(card, 'sleep');
      if (p.state === 'blocked') {
        const waker = p.blockedOn === 'mutex' ? (sim.mutexHolder === 'P' ? 'Üretici' : 'Tüketici') : id === 'P' ? 'Tüketici' : 'Üretici';
        sleep.innerHTML = `<span class="zzz">z<i>z</i><i>z</i></span><b>${esc(p.blockedOn)}</b> semaforunda uyuyor: ${WAIT_REASON[p.blockedOn]}.<br>${sim.deadlock ? 'Onu uyandıracak işlem de bloklu.' : `${waker} signal(${esc(p.blockedOn)}) yapınca uyanacak.`}`;
        sleep.hidden = false;
      } else {
        sleep.hidden = true;
      }
      setPc(part(card, 'code'), p.pc);
      const btn = card.querySelector('.run-btn');
      btn.hidden = !manual;
      btn.disabled = sim.deadlock || !runnable.includes(id);
    });

    const onCpu = sim.current && sim.procs[sim.current].state === 'running' ? sim.current : null;
    $.pcCpu.textContent = sim.deadlock ? 'kimse çalışamıyor' : onCpu ? sim.procs[onCpu].name : '—';
    $.pcCpu.dataset.pid = onCpu || '';

    // Tampon yuvaları: yalnızca değişen yuva yeniden çizilir, böylece giriş/çıkış animasyonları korunur
    [...$.pcSlots.children].forEach((slot, i) => {
      const want = sim.buffer[i] === null ? '' : String(sim.buffer[i]);
      if (slot.dataset.item === want) return;
      const old = slot.querySelector('.item');
      if (old) {
        old.classList.add('leave');
        setTimeout(() => old.remove(), 320);
      }
      if (want) slot.insertAdjacentHTML('beforeend', `<span class="item enter" style="--c:${itemColor(Number(want))}">#${want}</span>`);
      slot.dataset.item = want;
    });
    $.pcPtrIn.style.setProperty('--i', sim.in);
    $.pcPtrOut.style.setProperty('--i', sim.out);
    $.pcFill.style.width = `${(sim.count / sim.size) * 100}%`;
    $.pcBuffer.dataset.level = sim.count === sim.size ? 'full' : sim.count === 0 ? 'empty' : '';
    $.pcCount.textContent = `${sim.count} / ${sim.size}${sim.count === sim.size ? ' · DOLU' : sim.count === 0 ? ' · BOŞ' : ''}`;

    $.pcSems.querySelectorAll('.sem').forEach((el) => {
      const s = sim.sems[el.dataset.sem];
      const valEl = el.querySelector('.sem-val');
      if (valEl.textContent !== String(s.value)) {
        valEl.textContent = s.value;
        retrigger(el, 'bump');
      }
      el.classList.toggle('neg', s.value < 0);
      el.classList.toggle('zero', s.value === 0);
      el.querySelector('.wq-chips').innerHTML = s.queue.length
        ? s.queue.map((id) => `<span class="qchip q-${id}">${sim.procs[id].name}</span>`).join('')
        : '';
    });

    const st = sim.stats;
    const stat = (label, v, tone) => `<div class="mini-stat ${v && tone ? tone : ''}"><span>${label}</span><b>${v}</b></div>`;
    $.pcStats.innerHTML = stat('Üretilen', st.produced)
      + stat('Tüketilen', st.consumed)
      + stat('Tampondaki', `${sim.count}/${sim.size}`)
      + stat('Üretici bloklanma', sim.procs.P.blocks, 'warn')
      + stat('Tüketici bloklanma', sim.procs.C.blocks, 'warn')
      + stat('Bağlam değişimi', st.switches);
  }

  function pcApply(ev) {
    const sim = pc.sim;
    const card = $['pcProc' + ev.pid];
    pcRender();
    flashLine(part(card, 'code'), ev.line, ev.kind);
    pcLog(ev);
    if (ev.switchFrom) retrigger($.pcCpu, 'switch');

    const slot = ev.slot === undefined ? null : $.pcSlots.children[ev.slot];
    if (ev.op === 'add') flyToken($.pcStage, part(card, 'reg'), slot, `#${ev.item}`, 't-P');
    if (ev.op === 'remove') flyToken($.pcStage, slot, part(card, 'reg'), `#${ev.item}`, 't-C');

    const P = sim.procs.P;
    const C = sim.procs.C;
    if (ev.kind === 'deadlock') {
      pcDeadlock();
    } else if (ev.kind === 'block') {
      const name = sim.procs[ev.pid].name;
      let extra = '';
      if (ev.sem === 'empty' && sim.count < sim.size) extra = ' Dikkat: tamponda fiziksel boş yuva görünse de tüketici henüz signal(empty) yapmadı, yani empty henüz artmadı.';
      if (ev.sem === 'full' && sim.count > 0) extra = ' Dikkat: tamponda ürün görünse de üretici henüz signal(full) yapmadı, yani full henüz artmadı.';
      setAlert($.pcAlert, 'warn', `⏸ ${name} BLOCKED.`, `${esc(ev.result)}. ${name} ${ev.sem} kuyruğunda uyuyor, CPU'yu meşgul etmiyor.${extra}`);
    } else if (ev.kind === 'wakeup') {
      setAlert($.pcAlert, 'ok', `▶ ${sim.procs[ev.woken].name} uyandırıldı.`, `${esc(ev.result)}. Uyanan işlem hazır kuyruğuna döner ve kaldığı wait() satırından sonra devam eder.`);
    } else if (P.state !== 'blocked' && C.state !== 'blocked' && $.pcAlert.classList.contains('warn')) {
      setAlert($.pcAlert, 'info', 'Akış normal.', 'İki işlem de çalışabilir durumda.');
    }
  }

  function pcLog(ev) {
    const empty = $.pcLog.querySelector('.log-empty');
    if (empty) empty.remove();
    const li = document.createElement('li');
    li.className = `t-${ev.kind} q-${ev.pid}`;
    li.innerHTML = `<span class="log-time">#${ev.t}</span><span><b>${ev.pid === 'P' ? 'Üretici' : 'Tüketici'}</b> <code>${esc(ev.text)}</code><br>${esc(ev.result)}</span>`;
    $.pcLog.appendChild(li);
    while ($.pcLog.children.length > 150) $.pcLog.firstElementChild.remove();
    $.pcLog.scrollTop = $.pcLog.scrollHeight;
  }

  function pcDeadlock() {
    const sim = pc.sim;
    const P = sim.procs.P;
    const C = sim.procs.C;
    pcStop();
    pcRender();
    pcButtons();
    $.pcStage.classList.add('deadlocked');
    const holder = sim.mutexHolder ? sim.procs[sim.mutexHolder].name : 'kimse';
    setAlert($.pcAlert, 'danger', '☠ DEADLOCK: kilitlenme.',
      `Üretici <b>${P.blockedOn}</b> semaforunda, Tüketici <b>${C.blockedOn}</b> semaforunda bloklu; mutex <b>${holder}</b> elinde. `
      + 'Üretici mutex\'i tutarken boş yuva bekliyor, tüketici yuva boşaltmak için mutex\'i bekliyor. Bu döngüsel bekleme (circular wait); '
      + 'dört Coffman koşulu da sağlandığı için hiçbir işlem ilerleyemez. Düzeltmek için hatalı sıralamayı kapat.');
    OSLab.app.setStatus('deadlock');
    OSLab.app.focusInfo('deadlock');
  }

  function pcButtons() {
    const sim = pc.sim;
    const manual = pc.cfg.policy === 'manual';
    $.pcPlay.disabled = manual && !sim.deadlock;
    $.pcPlay.textContent = pc.playing ? '⏸ Duraklat'
      : sim.deadlock ? '↻ Baştan Başlat'
        : manual ? 'Manuel mod: kartlardaki butonları kullan'
          : sim.steps ? '▶ Devam Et' : '▶ Simülasyonu Başlat';
    $.pcStep.disabled = sim.deadlock || manual;
  }

  function pcPlay() {
    if (pc.sim.deadlock) pcReset();
    if (pc.cfg.policy === 'manual') return;
    pc.playing = true;
    pcButtons();
    OSLab.app.setStatus('running');
    pcLoop();
  }

  function pcLoop() {
    pcTick();
    if (pc.playing && !pc.sim.deadlock) pc.timer = setTimeout(pcLoop, delay());
  }

  function pcTick() {
    if (pc.sim.deadlock) return;
    const pid = pickWeighted(pc.sim, { P: pc.cfg.prod, C: pc.cfg.cons });
    if (pid) pcApply(pc.sim.step(pid));
  }

  function pcStop() {
    clearTimeout(pc.timer);
    pc.playing = false;
  }

  function pcPause() {
    if (!pc.playing) return;
    pcStop();
    pcButtons();
    OSLab.app.setStatus('paused');
  }

  /* ============================================================ modül arayüzü */

  function showLab(lab) {
    view.lab = lab;
    if (lab === 'cs') pcPause(); else csPause();
    $.root.querySelectorAll('.lab-tab').forEach((t) => {
      const on = t.dataset.lab === lab;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', String(on));
    });
    $.labCs.hidden = lab !== 'cs';
    $.labPc.hidden = lab !== 'pc';
    $.csSpeed.value = view.speed;
    $.pcSpeed.value = view.speed;
    OSLab.app.focusInfo(lab === 'cs' ? FOCUS_BY_MODE[cs.cfg.mode] : 'pc');
    OSLab.app.setStatus(lab === 'pc' && pc.sim.deadlock ? 'deadlock' : 'ready');
  }

  function mount(container) {
    container.innerHTML = template();
    $ = { root: container };
    container.querySelectorAll('[id^="sy-"]').forEach((node) => { $[camel(node.id.slice(3))] = node; });

    container.querySelector('.lab-tabs').addEventListener('click', (e) => {
      const tab = e.target.closest('[data-lab]');
      if (tab) showLab(tab.dataset.lab);
    });
    csBind();
    pcBind();
    csSyncControls();
    pcSyncControls();
    csReset();
    pcReset();
    showLab(view.lab);
  }

  function unmount() {
    csStop();
    pcStop();
    $ = null;
  }

  // Sınav panelindeki "Simülatörde Dene" butonu
  function loadPreset(preset) {
    if (preset.lab === 'pc') {
      Object.assign(pc.cfg, preset.cfg);
      showLab('pc');
      pcSyncControls();
      pcReset();
      $.labPc.scrollIntoView({ behavior: 'smooth', block: 'start' });
      pcPlay();
    } else {
      Object.assign(cs.cfg, preset.cfg);
      showLab('cs');
      csSyncControls();
      csReset();
      $.labCs.scrollIntoView({ behavior: 'smooth', block: 'start' });
      csPlay();
    }
  }

  OSLab.modules = OSLab.modules || {};
  OSLab.modules.sync = {
    num: '03',
    title: 'Synchronization',
    subtitle: 'Senkronizasyon',
    mount,
    unmount,
    loadPreset
  };
})(window.OSLab = window.OSLab || {});
