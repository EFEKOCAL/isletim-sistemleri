/*
 * scheduling-view.js — "2. CPU Scheduling" modülünün arayüzü ve canlı Gantt animasyonu.
 * Hesaplamanın tamamı scheduler.js'te yapılır; bu dosya yalnızca sonucu zaman içinde oynatır.
 */
(function (OSLab) {
  'use strict';

  const { simulate, ALGORITHMS } = OSLab.scheduler;

  const MAX_PROCESSES = 12;
  const UNIT_PX = 34; // bir zaman biriminin Gantt'taki minimum genişliği
  const SPEEDS = [
    { id: '0.5', label: '0.5× — yavaş', ms: 900 },
    { id: '1', label: '1× — normal', ms: 450 },
    { id: '2', label: '2× — hızlı', ms: 220 },
    { id: '4', label: '4× — çok hızlı', ms: 110 }
  ];
  const HINTS = {
    FCFS: 'Kesmesiz (non-preemptive). Hazır kuyruğu FIFO çalışır; aynı anda gelenlerde tablodaki ekleme sırası esas alınır.',
    SJF: 'Kesmesiz (non-preemptive). CPU boşaldığında hazırdaki en kısa burst seçilir; eşitlikte önce gelen (FCFS).',
    RR: 'Kesmeli (preemptive). Her işlem en fazla q birim çalışır, sonra kuyruğun sonuna döner. Aynı anda gelen yeni işlem, kesilen işlemden önce kuyruğa girer.'
  };
  const EXAMPLE = [['P1', 0, 8], ['P2', 1, 4], ['P3', 2, 9], ['P4', 3, 5]];

  const state = {
    processes: [], // { pid, arrival, burst, color }
    colorSeq: 0,
    algorithm: 'FCFS',
    quantum: 4,
    speed: '1',
    seeded: false,
    result: null,
    gantt: null, // oluşturulan Gantt DOM referansları
    live: null,  // animasyon sırasında ilerleyen işaretçiler
    anim: null   // { ms, t0, timers, raf }
  };

  let $ = null;

  /* ------------------------------------------------------------ yardımcılar */

  const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
  const camel = (s) => s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  function nextColor() {
    const hue = (198 + state.colorSeq++ * 137.508) % 360; // altın açı → komşu renkler birbirinden uzak
    return `hsl(${hue.toFixed(1)} 78% 64%)`;
  }

  const makeProcess = (pid, arrival, burst) => ({ pid, arrival, burst, color: nextColor() });

  function colorOf(pid) {
    const p = state.processes.find((x) => x.pid === pid);
    return p ? p.color : 'var(--muted)';
  }

  function nextPid() {
    let n = 1;
    while (state.processes.some((p) => p.pid.toLowerCase() === 'p' + n)) n++;
    return 'P' + n;
  }

  /* ------------------------------------------------------------ şablon */

  function template() {
    const algoOptions = Object.values(ALGORITHMS).map((a) => `<option value="${a.id}">${a.label}</option>`).join('');
    const speedOptions = SPEEDS.map((s) => `<option value="${s.id}">${s.label}</option>`).join('');
    return `
      <p class="module-lead">Bir işlem kümesi tanımla, algoritmayı seç ve kısa vadeli zamanlayıcının CPU'yu zaman içinde nasıl dağıttığını izle.</p>
      <div class="sched-grid">
        <div class="stack">
          <article class="card">
            <header class="card-head"><h2>Konfigürasyon</h2><span class="tag">CPU Scheduler</span></header>
            <div class="field">
              <label for="sc-algo">Algoritma</label>
              <select id="sc-algo">${algoOptions}</select>
              <p class="hint" id="sc-algo-hint"></p>
            </div>
            <div class="collapsible" id="sc-quantum-wrap">
              <div>
                <div class="field">
                  <label for="sc-quantum">Time Quantum (q)</label>
                  <input id="sc-quantum" type="number" min="1" max="99" step="1" inputmode="numeric">
                </div>
              </div>
            </div>
            <div class="field">
              <label for="sc-speed">Animasyon Hızı</label>
              <select id="sc-speed">${speedOptions}</select>
            </div>
            <button class="btn btn-primary btn-block" id="sc-start" type="button">▶ Simülasyonu Başlat</button>
            <div class="btn-row two">
              <button class="btn" id="sc-skip" type="button" disabled>⏭ Sonuca Atla</button>
              <button class="btn" id="sc-reset" type="button" disabled>↺ Sıfırla</button>
            </div>
            <p class="form-error" id="sc-run-error" role="alert"></p>
          </article>

          <article class="card">
            <header class="card-head"><h2>İşlem Ekle</h2><span class="tag" id="sc-count"></span></header>
            <form id="sc-form" class="add-form" novalidate autocomplete="off">
              <div class="field"><label for="sc-pid">Process ID</label><input id="sc-pid" maxlength="6"></div>
              <div class="field"><label for="sc-arrival">Arrival (AT)</label><input id="sc-arrival" type="number" min="0" max="99" step="1" value="0" inputmode="numeric"></div>
              <div class="field"><label for="sc-burst">Burst (BT)</label><input id="sc-burst" type="number" min="1" max="99" step="1" value="3" inputmode="numeric"></div>
              <button class="btn btn-block span-all" type="submit">+ İşlem Ekle</button>
            </form>
            <p class="form-error" id="sc-form-error" role="alert"></p>
            <div class="btn-row">
              <button class="btn btn-sm" id="sc-rand-one" type="button">Rastgele İşlem</button>
              <button class="btn btn-sm" id="sc-rand-set" type="button">Rastgele Set (5)</button>
              <button class="btn btn-sm" id="sc-example" type="button">Örnek Yükle</button>
              <button class="btn btn-sm btn-ghost" id="sc-clear" type="button">Temizle</button>
            </div>
          </article>
        </div>

        <div class="stack">
          <article class="card">
            <header class="card-head"><h2>İşlem Tablosu</h2><span class="tag">Process Table</span></header>
            <div class="table-wrap proc-table">
              <table>
                <thead><tr><th>PID</th><th class="num">Arrival Time</th><th class="num">Burst Time</th><th class="act"></th></tr></thead>
                <tbody id="sc-proc-body"></tbody>
              </table>
            </div>
          </article>
          <article class="card">
            <header class="card-head"><h2>Formül Kartı</h2><span class="tag">Sınavda bunlar sorulur</span></header>
            <dl class="formula-grid">
              <div><dt>TAT</dt><dd>CT − AT</dd><span>Turnaround: sisteme girişten bitişe</span></div>
              <div><dt>WT</dt><dd>TAT − BT</dd><span>Hazır kuyruğunda geçen süre</span></div>
              <div><dt>RT</dt><dd>İlk çalışma − AT</dd><span>Response: ilk CPU'ya çıkışa kadar</span></div>
              <div><dt>Kullanım</dt><dd>Σ BT / süre</dd><span>CPU'nun meşgul olduğu oran</span></div>
            </dl>
          </article>
        </div>

        <article class="card span-2" id="sc-live-card">
          <header class="card-head"><h2>Canlı Yürütme · Gantt Şeması</h2><span class="tag" id="sc-run-tag"></span></header>
          <div class="live-strip">
            <div class="live-box"><span class="live-label">SAAT</span><span class="clock-value" id="sc-clock">t = 0</span></div>
            <div class="live-box"><span class="live-label">CPU</span><div class="cpu-core" id="sc-cpu">IDLE</div></div>
            <div class="live-box"><span class="live-label">HAZIR KUYRUĞU <em>baş → son</em></span><div class="chips" id="sc-queue"></div></div>
            <div class="live-box"><span class="live-label">TAMAMLANAN</span><div class="chips" id="sc-done"></div></div>
          </div>
          <div class="gantt-wrap" id="sc-gantt-wrap"><div class="gantt" id="sc-gantt"></div></div>
          <div class="legend" id="sc-legend"></div>
        </article>

        <div class="duo span-2">
          <article class="card">
            <header class="card-head"><h2>Sonuç Tablosu</h2><span class="tag">TAT = CT − AT · WT = TAT − BT</span></header>
            <div class="table-wrap">
              <table class="results">
                <thead><tr>
                  <th>PID</th><th class="num">AT</th><th class="num">BT</th><th class="num" title="İlk kez CPU'ya çıktığı an">Başlama</th>
                  <th class="num">CT</th><th class="num">TAT</th><th class="num">WT</th><th class="num">RT</th>
                </tr></thead>
                <tbody id="sc-res-body"></tbody>
                <tfoot id="sc-res-foot"></tfoot>
              </table>
            </div>
          </article>
          <article class="card">
            <header class="card-head"><h2>Olay Günlüğü</h2><span class="tag">Dispatcher</span></header>
            <ol class="log" id="sc-log"></ol>
          </article>
        </div>

        <div class="duo even span-2">
          <article class="card">
            <header class="card-head"><h2>Performans Ölçütleri</h2></header>
            <div class="metrics" id="sc-metrics"></div>
          </article>
          <article class="card">
            <header class="card-head"><h2>Algoritma Karşılaştırması</h2><span class="tag">Aynı işlem kümesi</span></header>
            <div id="sc-compare"></div>
          </article>
        </div>
      </div>`;
  }

  /* ------------------------------------------------------------ olaylar */

  function bind() {
    $.algo.addEventListener('change', () => {
      state.algorithm = $.algo.value;
      syncControls();
      resetVisualization();
      OSLab.app.focusInfo(state.algorithm);
    });
    $.quantum.addEventListener('input', () => {
      const q = Number($.quantum.value);
      if (Number.isInteger(q) && q >= 1 && q <= 99) state.quantum = q;
      resetVisualization();
    });
    $.speed.addEventListener('change', () => { state.speed = $.speed.value; });
    $.start.addEventListener('click', start);
    $.skip.addEventListener('click', () => { if (state.anim) finish(); });
    $.reset.addEventListener('click', resetVisualization);
    $.form.addEventListener('submit', (e) => { e.preventDefault(); addFromForm(); });
    $.randOne.addEventListener('click', addRandom);
    $.randSet.addEventListener('click', randomSet);
    $.example.addEventListener('click', () => setProcesses(EXAMPLE));
    $.clear.addEventListener('click', () => setProcesses([]));
    $.procBody.addEventListener('click', (e) => {
      const btn = e.target.closest('[data-remove]');
      if (!btn) return;
      state.processes = state.processes.filter((p) => p.pid !== btn.dataset.remove);
      processesChanged();
    });
  }

  function syncControls() {
    const isRR = state.algorithm === 'RR';
    $.algo.value = state.algorithm;
    $.algoHint.textContent = HINTS[state.algorithm];
    $.quantumWrap.classList.toggle('open', isRR);
    $.quantum.disabled = !isRR;
    $.quantum.value = state.quantum;
    $.speed.value = state.speed;
  }

  /* ------------------------------------------------------------ işlem yönetimi */

  function validate(pid, arrival, burst) {
    if (state.processes.length >= MAX_PROCESSES) return `En fazla ${MAX_PROCESSES} işlem eklenebilir.`;
    if (!/^[A-Za-z0-9_-]{1,6}$/.test(pid)) return 'Process ID 1–6 karakter olmalı (harf, rakam, - veya _).';
    if (state.processes.some((p) => p.pid.toLowerCase() === pid.toLowerCase())) return `"${pid}" zaten var; her işlemin PID'si benzersiz olmalı.`;
    if (!Number.isInteger(arrival) || arrival < 0 || arrival > 99) return 'Arrival Time 0–99 arası bir tam sayı olmalı.';
    if (!Number.isInteger(burst) || burst < 1 || burst > 99) return 'Burst Time 1–99 arası bir tam sayı olmalı (CPU burst > 0).';
    return '';
  }

  function addFromForm() {
    const pid = $.pid.value.trim();
    const arrival = Number($.arrival.value);
    const burst = Number($.burst.value);
    const error = validate(pid, arrival, burst);
    $.formError.textContent = error;
    if (error) return;
    state.processes.push(makeProcess(pid, arrival, burst));
    processesChanged(pid);
    $.arrival.focus();
  }

  function addRandom() {
    const pid = nextPid();
    const arrival = randInt(0, 8);
    const burst = randInt(1, 10);
    const error = validate(pid, arrival, burst);
    $.formError.textContent = error;
    if (error) return;
    state.processes.push(makeProcess(pid, arrival, burst));
    processesChanged(pid);
  }

  function randomSet() {
    const arrivals = [0, ...Array.from({ length: 4 }, () => randInt(0, 8))].sort((a, b) => a - b);
    setProcesses(arrivals.map((at, i) => ['P' + (i + 1), at, randInt(1, 10)]));
  }

  function setProcesses(list) {
    state.colorSeq = 0;
    state.processes = list.map(([pid, at, bt]) => makeProcess(pid, at, bt));
    processesChanged();
  }

  function processesChanged(highlightPid) {
    $.formError.textContent = '';
    renderProcesses(highlightPid);
    $.pid.value = nextPid();
    resetVisualization();
  }

  function renderProcesses(highlightPid) {
    $.count.textContent = `${state.processes.length} / ${MAX_PROCESSES}`;
    if (!state.processes.length) {
      $.procBody.innerHTML = '<tr><td colspan="4" class="empty">Henüz işlem yok. Formu kullanın veya “Rastgele Set” ile başlayın.</td></tr>';
      return;
    }
    $.procBody.innerHTML = state.processes.map((p) => `
      <tr class="${p.pid === highlightPid ? 'flash' : ''}">
        <td><span class="pid-cell" style="--c:${p.color}"><i class="swatch"></i>${esc(p.pid)}</span></td>
        <td class="num">${p.arrival}</td>
        <td class="num">${p.burst}</td>
        <td class="act"><button class="icon-btn sm" type="button" data-remove="${esc(p.pid)}" title="${esc(p.pid)} işlemini sil" aria-label="${esc(p.pid)} işlemini sil">×</button></td>
      </tr>`).join('');
  }

  /* ------------------------------------------------------------ görselleştirme durumu */

  function setButtons(mode) {
    $.start.disabled = mode === 'running';
    $.start.textContent = mode === 'done' ? '▶ Tekrar Oynat' : '▶ Simülasyonu Başlat';
    $.skip.disabled = mode !== 'running';
    $.reset.disabled = mode === 'idle';
    $.speed.disabled = mode === 'running';
  }

  function runTagText() {
    return ALGORITHMS[state.algorithm].short + (state.algorithm === 'RR' ? ` · q = ${state.quantum}` : '');
  }

  function resetVisualization() {
    stopAnimation();
    state.result = null;
    state.gantt = null;
    state.live = null;
    $.runError.textContent = '';
    $.runTag.textContent = runTagText();
    $.clock.textContent = 't = 0';
    setCpu(null);
    renderQueue([]);
    $.done.innerHTML = '<span class="chip-empty">Henüz yok</span>';
    $.gantt.style.minWidth = '';
    $.gantt.innerHTML = '<div class="gantt-empty">Simülasyonu başlattığında işlemler burada zaman ekseni üzerinde akacak.</div>';
    $.legend.innerHTML = '';
    renderResultRows();
    $.log.innerHTML = '<li class="log-empty">Dispatcher kararları simülasyon sırasında burada listelenir.</li>';
    renderMetrics(null);
    $.compare.innerHTML = '<p class="empty">Simülasyon tamamlandığında FCFS, SJF ve RR aynı işlem kümesi üzerinde karşılaştırılır.</p>';
    setButtons('idle');
    OSLab.app.setStatus('ready');
  }

  function setCpu(pid, label) {
    const core = $.cpu;
    if (pid === null) {
      core.classList.remove('busy', 'pulse');
      core.style.removeProperty('--c');
      core.textContent = label || 'IDLE';
      return;
    }
    core.style.setProperty('--c', colorOf(pid));
    core.textContent = pid;
    core.classList.add('busy');
    core.classList.remove('pulse');
    void core.offsetWidth; // animasyonu yeniden tetikle
    core.classList.add('pulse');
  }

  function renderQueue(pids) {
    $.queue.innerHTML = pids.length
      ? pids.map((pid, i) => `${i ? '<span class="q-sep">›</span>' : ''}<span class="chip" style="--c:${colorOf(pid)}">${esc(pid)}</span>`).join('')
      : '<span class="chip-empty">Boş</span>';
  }

  function renderResultRows() {
    $.resFoot.innerHTML = '';
    if (!state.processes.length) {
      $.resBody.innerHTML = '<tr><td colspan="8" class="empty">İşlem yok.</td></tr>';
      return;
    }
    $.resBody.innerHTML = state.processes.map((p) => `
      <tr>
        <td><span class="pid-cell" style="--c:${p.color}"><i class="swatch"></i>${esc(p.pid)}</span></td>
        <td class="num">${p.arrival}</td>
        <td class="num">${p.burst}</td>
        <td class="num" data-k="start">—</td>
        <td class="num" data-k="ct">—</td>
        <td class="num calc" data-k="tat">—</td>
        <td class="num calc" data-k="wt">—</td>
        <td class="num calc" data-k="rt">—</td>
      </tr>`).join('');
  }

  /* ------------------------------------------------------------ simülasyon */

  function start() {
    $.runError.textContent = '';
    if (!state.processes.length) {
      $.runError.textContent = 'Simülasyon için en az bir işlem ekleyin.';
      return;
    }
    if (state.algorithm === 'RR') {
      const q = Number($.quantum.value);
      if (!Number.isInteger(q) || q < 1 || q > 99) {
        $.runError.textContent = 'Time Quantum 1–99 arası bir tam sayı olmalı.';
        $.quantum.focus();
        return;
      }
      state.quantum = q;
    }

    let result;
    try {
      result = simulate(state.processes, state.algorithm, { quantum: state.quantum });
    } catch (err) {
      $.runError.textContent = err.message;
      return;
    }

    resetVisualization();
    state.result = result;
    buildGantt(result);
    run();
  }

  function buildGantt(r) {
    const total = r.makespan;
    const pct = (t) => `${(t / total) * 100}%`;
    const g = $.gantt;
    g.style.minWidth = `${total * UNIT_PX}px`;
    g.style.setProperty('--units', total);

    // Aynı anda gelen işlemler tek bir varış işaretinde gruplanır
    const groups = new Map();
    r.rows.forEach((row) => {
      if (!groups.has(row.arrival)) groups.set(row.arrival, []);
      groups.get(row.arrival).push(row.pid);
    });
    const arrivals = [...groups].sort((a, b) => a[0] - b[0]);
    const ticks = [...new Set([0, ...r.segments.map((s) => s.end)])].sort((a, b) => a - b);

    g.innerHTML = `
      <div class="gantt-arrivals" aria-hidden="true">
        ${arrivals.map(([t, pids]) => `<span class="arrival" style="left:${pct(t)}" title="t=${t}: ${esc(pids.join(', '))} geldi">${esc(pids.join(','))}</span>`).join('')}
      </div>
      <div class="gantt-track">
        ${r.segments.map((s) => s.pid === null
          ? `<div class="seg seg-idle" style="left:${pct(s.start)}" title="IDLE: ${s.start}–${s.end}"><span>idle</span></div>`
          : `<div class="seg" style="left:${pct(s.start)};--c:${colorOf(s.pid)}" title="${esc(s.pid)}: ${s.start}–${s.end}"><span>${esc(s.pid)}</span></div>`).join('')}
      </div>
      <div class="gantt-axis">${ticks.map((t) => `<span class="tick" style="left:${pct(t)}">${t}</span>`).join('')}</div>
      <div class="gantt-cursor"></div>`;

    const tickEls = g.querySelectorAll('.tick');
    const arrivalEls = g.querySelectorAll('.arrival');
    state.gantt = {
      pct,
      segEls: [...g.querySelectorAll('.seg')],
      ticks: ticks.map((t, i) => ({ time: t, el: tickEls[i] })),
      arrivals: arrivals.map(([t], i) => ({ time: t, el: arrivalEls[i] })),
      cursor: g.querySelector('.gantt-cursor')
    };

    const hasIdle = r.segments.some((s) => s.pid === null);
    $.legend.innerHTML = state.processes.map((p) => `<span class="legend-item"><i class="swatch" style="--c:${p.color}"></i>${esc(p.pid)}</span>`).join('')
      + (hasIdle ? '<span class="legend-item"><i class="swatch swatch-idle"></i>CPU boşta (idle)</span>' : '')
      + '<span class="legend-item legend-arrival"><i>▼</i>varış anı</span>';
  }

  function run() {
    const r = state.result;
    const ms = SPEEDS.find((s) => s.id === state.speed).ms;
    const rows = r.rows.map((row, i) => Object.assign({ i }, row));

    state.live = {
      grown: 0, seg: -1, snap: -1, ev: 0, tick: 0, arr: 0, started: 0, done: 0,
      byStart: rows.slice().sort((a, b) => a.start - b.start),
      byDone: rows.slice().sort((a, b) => a.completion - b.completion),
      doneHtml: ''
    };
    const anim = state.anim = { ms, t0: performance.now(), raf: 0 };

    state.gantt.cursor.classList.add('show');
    setButtons('running');
    OSLab.app.setStatus('running');

    const frame = (now) => {
      const T = Math.min(r.makespan, Math.max(0, (now - anim.t0) / ms));
      updateLive(T);
      if (T >= r.makespan) finish();
      else anim.raf = requestAnimationFrame(frame);
    };
    anim.raf = requestAnimationFrame(frame);
  }

  // Segment, başlama anına gelindiğinde CSS transition ile 0'dan gerçek genişliğine büyür.
  // Süre, saatin o anki değerinden hesaplanır; böylece Gantt ile saat hiçbir zaman kopmaz.
  function growSegment(i, T) {
    const s = state.result.segments[i];
    const el = state.gantt.segEls[i];
    const duration = state.anim ? Math.max(0, (s.end - T) * state.anim.ms) : 0;
    void el.offsetWidth; // başlangıç genişliğinin (0) hesaplandığından emin ol
    el.style.transitionDuration = `${duration}ms`;
    el.style.width = state.gantt.pct(s.end - s.start);
  }

  function updateLive(T) {
    const r = state.result;
    const L = state.live;
    const G = state.gantt;

    while (L.grown < r.segments.length && r.segments[L.grown].start <= T) growSegment(L.grown++, T);

    $.clock.textContent = `t = ${T.toFixed(1)}`;
    G.cursor.style.left = G.pct(T);

    // CPU'da şu an çalışan segment
    const idx = r.segments.findIndex((s) => s.start <= T && T < s.end);
    if (idx !== L.seg) {
      if (L.seg >= 0) G.segEls[L.seg].classList.remove('active');
      if (idx >= 0) G.segEls[idx].classList.add('active');
      L.seg = idx;
      setCpu(idx >= 0 ? r.segments[idx].pid : null);
    }

    // Hazır kuyruğu
    let s = L.snap;
    while (s + 1 < r.snapshots.length && r.snapshots[s + 1].time <= T) s++;
    if (s !== L.snap) {
      const changed = L.snap < 0 || r.snapshots[s].queue.join() !== r.snapshots[L.snap].queue.join();
      L.snap = s;
      if (changed) renderQueue(r.snapshots[s].queue);
    }

    while (L.ev < r.events.length && r.events[L.ev].time <= T) appendLog(r.events[L.ev++]);
    while (L.tick < G.ticks.length && G.ticks[L.tick].time <= T) G.ticks[L.tick++].el.classList.add('show');
    while (L.arr < G.arrivals.length && G.arrivals[L.arr].time <= T) G.arrivals[L.arr++].el.classList.add('show');

    while (L.started < L.byStart.length && L.byStart[L.started].start <= T) {
      const row = L.byStart[L.started++];
      cell(row.i, 'start').innerHTML = `<b>${row.start}</b>`;
    }
    let doneChanged = false;
    while (L.done < L.byDone.length && L.byDone[L.done].completion <= T) {
      const row = L.byDone[L.done++];
      fillRow(row);
      L.doneHtml += `<span class="chip chip-done" style="--c:${colorOf(row.pid)}">✓ ${esc(row.pid)}</span>`;
      doneChanged = true;
    }
    if (doneChanged) $.done.innerHTML = L.doneHtml;

    // Gantt yatay kayıyorsa imleci görünür tut
    const wrap = $.ganttWrap;
    if (wrap.scrollWidth > wrap.clientWidth + 1) {
      const x = (T / r.makespan) * $.gantt.offsetWidth;
      if (x > wrap.scrollLeft + wrap.clientWidth * 0.8 || x < wrap.scrollLeft) {
        wrap.scrollLeft = x - wrap.clientWidth * 0.3;
      }
    }
  }

  const cell = (i, key) => $.resBody.rows[i].querySelector(`[data-k="${key}"]`);

  function fillRow(row) {
    cell(row.i, 'ct').innerHTML = `<b>${row.completion}</b>`;
    cell(row.i, 'tat').innerHTML = `<b>${row.turnaround}</b><small>${row.completion} − ${row.arrival}</small>`;
    cell(row.i, 'wt').innerHTML = `<b>${row.waiting}</b><small>${row.turnaround} − ${row.burst}</small>`;
    cell(row.i, 'rt').innerHTML = `<b>${row.response}</b><small>${row.start} − ${row.arrival}</small>`;
    const tr = $.resBody.rows[row.i];
    tr.classList.remove('flash');
    void tr.offsetWidth;
    tr.classList.add('flash');
  }

  function appendLog(e) {
    const empty = $.log.querySelector('.log-empty');
    if (empty) empty.remove();
    const li = document.createElement('li');
    li.className = `t-${e.type}`;
    if (e.pid !== null) li.style.setProperty('--c', colorOf(e.pid));
    li.innerHTML = `<span class="log-time">t=${e.time}</span><span>${esc(e.text)}</span>`;
    $.log.appendChild(li);
    $.log.scrollTop = $.log.scrollHeight;
  }

  function finish() {
    const r = state.result;
    stopAnimation();
    // "Sonuca Atla" veya sekme arka plandayken kalan segmentleri anında tamamla
    state.gantt.segEls.forEach((el, i) => {
      el.style.transitionDuration = '0ms';
      el.style.width = state.gantt.pct(r.segments[i].end - r.segments[i].start);
    });
    updateLive(r.makespan);
    setCpu(null, 'BİTTİ');
    renderFooter(r);
    renderMetrics(r);
    renderCompare(r);
    setButtons('done');
    OSLab.app.setStatus('done');
  }

  function stopAnimation() {
    const a = state.anim;
    if (!a) return;
    cancelAnimationFrame(a.raf);
    state.anim = null;
  }

  /* ------------------------------------------------------------ sonuç panelleri */

  const sum = (r, key) => r.rows.reduce((s, x) => s + x[key], 0);

  function renderFooter(r) {
    const n = r.rows.length;
    const avgCell = (key, value) => `<td class="num calc"><b>${value.toFixed(2)}</b><small>${sum(r, key)} / ${n}</small></td>`;
    $.resFoot.innerHTML = `
      <tr>
        <td colspan="5">Ortalama <span class="muted">(n = ${n})</span></td>
        ${avgCell('turnaround', r.averages.turnaround)}
        ${avgCell('waiting', r.averages.waiting)}
        ${avgCell('response', r.averages.response)}
      </tr>`;
  }

  function renderMetrics(r) {
    const n = r ? r.rows.length : 'n';
    const items = [
      { label: 'Ort. Bekleme (WT)', value: r && r.averages.waiting, dec: 2, formula: r ? `Σ WT / n = ${sum(r, 'waiting')} / ${n}` : 'Σ WT / n', accent: true },
      { label: 'Ort. Devir (TAT)', value: r && r.averages.turnaround, dec: 2, formula: r ? `Σ TAT / n = ${sum(r, 'turnaround')} / ${n}` : 'Σ TAT / n' },
      { label: 'Ort. Yanıt (RT)', value: r && r.averages.response, dec: 2, formula: r ? `Σ RT / n = ${sum(r, 'response')} / ${n}` : 'Σ RT / n' },
      { label: 'CPU Kullanımı', value: r && r.utilization * 100, dec: 1, suffix: '%', formula: r ? `Σ BT / süre = ${r.busyTime} / ${r.makespan}` : 'Σ BT / toplam süre' },
      { label: 'Throughput', value: r && r.throughput, dec: 3, formula: r ? `n / süre = ${n} / ${r.makespan} (işlem/birim)` : 'n / toplam süre' },
      { label: 'Bağlam Değişimi', value: r && r.contextSwitches, dec: 0, formula: 'farklı bir işleme geçiş sayısı' }
    ];
    $.metrics.innerHTML = items.map((m) => `
      <div class="metric${m.accent ? ' accent' : ''}">
        <div class="metric-label">${m.label}</div>
        <div class="metric-value">—</div>
        <div class="metric-formula">${m.formula}</div>
      </div>`).join('');
    if (!r) return;
    $.metrics.querySelectorAll('.metric-value').forEach((el, i) => countUp(el, items[i].value, items[i].dec, items[i].suffix || ''));
  }

  function countUp(el, target, dec, suffix) {
    const t0 = performance.now();
    const step = (now) => {
      const k = Math.min(1, (now - t0) / 700);
      el.textContent = (target * (1 - Math.pow(1 - k, 3))).toFixed(dec) + suffix;
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function renderCompare(current) {
    const q = state.quantum;
    const list = ['FCFS', 'SJF', 'RR'].map((id) => {
      const r = id === current.algorithm ? current : simulate(state.processes, id, { quantum: q });
      return { id, label: id === 'RR' ? `RR (q=${q})` : id, wt: r.averages.waiting, tat: r.averages.turnaround, rt: r.averages.response };
    });
    const max = Math.max(...list.map((x) => Math.max(x.tat, x.wt, x.rt))) || 1;
    const bestWT = Math.min(...list.map((x) => x.wt));
    const bar = (kind, v) => `<div class="bar ${kind}"><div class="track"><i data-w="${(v / max) * 100}%"></i></div><span>${v.toFixed(2)}</span></div>`;

    $.compare.innerHTML = `
      <div class="compare-legend"><span><i class="lg wt"></i>Ort. WT</span><span><i class="lg tat"></i>Ort. TAT</span><span><i class="lg rt"></i>Ort. RT</span></div>
      ${list.map((x) => `
        <div class="compare-row${x.id === current.algorithm ? ' current' : ''}">
          <div class="compare-name">${x.label}${x.wt === bestWT ? '<span class="best">en düşük WT</span>' : ''}</div>
          <div class="bars">${bar('wt', x.wt)}${bar('tat', x.tat)}${bar('rt', x.rt)}</div>
        </div>`).join('')}
      <p class="hint compare-note">SJF, tüm işlemler aynı anda hazırken ortalama bekleme süresi bakımından optimaldir. Varış zamanları farklıysa kesmesiz SJF her zaman optimal olmayabilir. RR ise genellikle daha düşük yanıt süresi sağlar.</p>`;

    void $.compare.offsetWidth;
    $.compare.querySelectorAll('.track i').forEach((i) => { i.style.width = i.dataset.w; });
  }

  /* ------------------------------------------------------------ modül arayüzü */

  function mount(container) {
    container.innerHTML = template();
    $ = {};
    container.querySelectorAll('[id^="sc-"]').forEach((node) => { $[camel(node.id.slice(3))] = node; });

    if (!state.seeded) {
      state.seeded = true;
      state.processes = EXAMPLE.map(([pid, at, bt]) => makeProcess(pid, at, bt));
    }
    bind();
    syncControls();
    renderProcesses();
    $.pid.value = nextPid();
    resetVisualization();
    OSLab.app.focusInfo(state.algorithm);
  }

  function unmount() {
    stopAnimation();
    $ = null;
  }

  // Sınav panelindeki "Simülatörde Dene" butonu buraya gelir
  function loadPreset(preset) {
    state.algorithm = preset.algorithm;
    if (preset.quantum) state.quantum = preset.quantum;
    state.colorSeq = 0;
    state.processes = preset.processes.map(([pid, at, bt]) => makeProcess(pid, at, bt));
    syncControls();
    renderProcesses();
    $.pid.value = nextPid();
    OSLab.app.focusInfo(state.algorithm);
    $.liveCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
    start();
  }

  OSLab.modules = OSLab.modules || {};
  OSLab.modules.scheduling = {
    num: '02',
    title: 'CPU Scheduling',
    subtitle: 'İşlemci Zamanlama',
    mount,
    unmount,
    loadPreset
  };
})(window.OSLab = window.OSLab || {});
