/*
 * architecture-view.js — "1. System & Architecture" modülünün arayüzü.
 * Üç laboratuvar:
 *   mode  → User / Kernel mode geçişi (sistem çağrısı ve ayrıcalıklı komut ihlali)
 *   build → Derleme → Bağlama → Yükleme hattı
 *   arch  → Monolitik ve mikroçekirdek karşılaştırması (IPC paket animasyonu)
 * Hesaplamalar architecture.js'te yapılır; bu dosya her durumu görselleştirir.
 */
(function (OSLab) {
  'use strict';

  const A = OSLab.arch;

  const SPEEDS = [
    { id: '0.5', label: '0.5× — yavaş', ms: 2600 },
    { id: '1', label: '1× — normal', ms: 1700 },
    { id: '2', label: '2× — hızlı', ms: 900 },
    { id: '4', label: '4× — çok hızlı', ms: 450 }
  ];
  const FOCUS_BY_LAB = { mode: 'dual', build: 'linkload', arch: 'structures' };
  const SYSCALL_TABLE = [[0, 'read'], [1, 'write'], [2, 'open'], [57, 'fork']];
  const REG_NAMES = ['PC', 'rax', 'rdi', 'rsi', 'rdx'];

  const view = { lab: 'mode', speed: '1' };
  const md = { syscall: 'read', steps: [], idx: -1, illegal: false, timer: 0, playing: false };
  const bd = { libc: 'dynamic', base: 14000, stage: 'source', timer: 0, running: false };
  const ar = { token: null, busy: false, panic: false, mkDown: false, stats: {} };

  let $ = null;

  /* ------------------------------------------------------------ yardımcılar */

  const camel = (s) => s.replace(/-([a-zA-Z])/g, (_, c) => c.toUpperCase());
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const delay = () => SPEEDS.find((s) => s.id === view.speed).ms;
  const speedOptions = () => SPEEDS.map((s) => `<option value="${s.id}">${s.label}</option>`).join('');
  const wait = (ms, token) => new Promise((resolve) => setTimeout(() => resolve(!token || !token.cancelled), ms));

  function retrigger(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  /* ------------------------------------------------------------ şablon */

  function template() {
    return `
      <p class="module-lead">İşletim sisteminin donanımla ve programlarla nasıl bir sınır kurduğunu izle: mod geçişleri, bir programın diskteki dosyadan çalışan işleme dönüşmesi ve çekirdeğin nasıl tasarlanabileceği.</p>
      <div class="lab-tabs" role="tablist">
        <button class="lab-tab" type="button" role="tab" data-lab="mode"><span class="lab-num">A</span>Dual-Mode <small>User ⇄ Kernel geçişi</small></button>
        <button class="lab-tab" type="button" role="tab" data-lab="build"><span class="lab-num">B</span>Derle → Bağla → Yükle <small>Compile · Link · Load</small></button>
        <button class="lab-tab" type="button" role="tab" data-lab="arch"><span class="lab-num">C</span>OS Mimarileri <small>Monolitik ve Mikroçekirdek</small></button>
      </div>
      ${templateMode()}
      ${templateBuild()}
      ${templateArch()}`;
  }

  function templateMode() {
    const node = (id, title, body, cls) => `
      <div class="dm-node ${cls || ''}" data-node="${id}" id="ar-node-${id}">
        <span class="dm-title">${title}</span>${body || ''}
      </div>`;
    return `
      <section class="lab" id="ar-lab-mode" role="tabpanel">
        <div class="sync-grid">
          <article class="card">
            <header class="card-head"><h2>Konfigürasyon</h2><span class="tag">Dual-Mode</span></header>
            <div class="field-row">
              <div class="field">
                <label for="ar-md-syscall">Sistem çağrısı</label>
                <select id="ar-md-syscall">
                  ${Object.keys(A.SYSCALLS).map((k) => `<option value="${k}">${k}() · #${A.SYSCALLS[k].nr}</option>`).join('')}
                </select>
              </div>
              <div class="field"><label for="ar-md-speed">Hız</label><select id="ar-md-speed">${speedOptions()}</select></div>
            </div>
            <button class="btn btn-primary btn-block" id="ar-md-play" type="button"></button>
            <div class="btn-row two">
              <button class="btn" id="ar-md-step" type="button">⏭ Tek Adım</button>
              <button class="btn" id="ar-md-reset" type="button">↺ Sıfırla</button>
            </div>
            <button class="btn btn-danger btn-block" id="ar-md-illegal" type="button">⚠ Ayrıcalıklı komut dene: <code>cli</code></button>
            <div class="history-label">Adımlar</div>
            <ol class="step-list" id="ar-md-steps"></ol>
          </article>

          <article class="card stage-card">
            <header class="card-head"><h2>Çift Modlu Çalışma</h2><span class="tag" id="ar-md-tag"></span></header>
            <div class="dm-top">
              <div class="modebit" id="ar-md-modebit"><span class="live-label">MODE BIT</span><b>1</b><small>USER MODE</small></div>
              <div class="regs" id="ar-md-regs"></div>
              <div class="proc-state"><span class="live-label">İŞLEM</span><span class="state-badge" id="ar-md-proc"></span></div>
            </div>
            <div class="dm-stage" id="ar-md-stage">
              <div class="space user-space">
                <span class="space-label">USER SPACE · mode bit = 1</span>
                <div class="space-row">
                  ${node('app', 'Kullanıcı programı', '<code id="ar-md-call"></code>')}
                  ${node('lib', 'C kütüphanesi (API)', '<code id="ar-md-wrapper"></code>')}
                </div>
              </div>
              <div class="dm-boundary">
                ${node('gate', 'trap ⇣ · return-from-trap ⇡', '<small>kullanıcı / çekirdek sınırı</small>', 'gate')}
              </div>
              <div class="space kernel-space">
                <span class="space-label">KERNEL SPACE · mode bit = 0</span>
                <div class="space-row four">
                  ${node('entry', 'Trap işleyici', '<code>giriş noktası</code>')}
                  ${node('pcb', 'PCB · bağlam', '<div class="pcb-box" id="ar-md-pcb"></div>')}
                  ${node('table', 'Sistem çağrısı tablosu', `<div class="sct" id="ar-md-sct">${SYSCALL_TABLE.map(([nr, n]) => `<span data-nr="${nr}"><b>${nr}</b> sys_${n}</span>`).join('')}</div>`)}
                  ${node('service', 'Servis rutini', '<code id="ar-md-service"></code>')}
                </div>
              </div>
              <div class="space hw-space">
                <span class="space-label">DONANIM / DEPOLAMA</span>
                <div class="space-row">
                  ${node('hw', 'Aygıt', '<code id="ar-md-device"></code>', 'hw')}
                  ${node('dump', 'core dosyası', '<code>bellek görüntüsü</code>', 'hw dump')}
                </div>
              </div>
              <div class="dm-token" id="ar-md-token"></div>
            </div>
            <div class="explain" id="ar-md-explain"></div>
          </article>
        </div>
      </section>`;
  }

  function templateBuild() {
    const stations = A.BUILD_STAGES.map((s, i) => `
      ${i ? '<span class="belt-arrow">→</span>' : ''}
      <button class="station ${s.kind}" type="button" data-stage="${s.id}">
        <span class="st-kind">${s.kind === 'file' ? 'DOSYA' : 'ARAÇ'}</span>
        <b>${s.label}</b><small>${s.sub}</small>
        ${s.id === 'linker' ? '<span class="feeds" id="ar-bd-feeds"></span>' : ''}
      </button>`).join('');
    return `
      <section class="lab" id="ar-lab-build" role="tabpanel" hidden>
        <article class="card">
          <header class="card-head"><h2>Üretim Bandı</h2><span class="tag">Kaynak koddan çalışan işleme</span></header>
          <div class="build-controls">
            <button class="btn btn-primary" id="ar-bd-run" type="button">▶ Bandı Çalıştır</button>
            <button class="btn" id="ar-bd-reset" type="button">↺ Başa Al</button>
            <div class="field inline">
              <span class="label">libc bağlama</span>
              <div class="segmented two" id="ar-bd-libc">
                <button type="button" data-libc="dynamic">Dinamik (.so)</button>
                <button type="button" data-libc="static">Statik (.a)</button>
              </div>
            </div>
            <div class="field inline">
              <label for="ar-bd-base">Yükleme tabanı</label>
              <input id="ar-bd-base" type="number" min="${A.BASE_MIN}" max="${A.BASE_MAX}" step="1000">
            </div>
            <button class="btn btn-sm" id="ar-bd-aslr" type="button">🎲 ASLR</button>
            <div class="field inline"><label for="ar-bd-speed">Hız</label><select id="ar-bd-speed">${speedOptions()}</select></div>
          </div>
          <div class="belt-wrap">
            <div class="belt" id="ar-bd-belt">
              ${stations}
              <span class="belt-arrow">→</span>
              <button class="station ram" type="button" data-stage="loader"><span class="st-kind">BELLEK</span><b>RAM</b><small>çalışan işlem</small></button>
            </div>
            <div class="belt-track" id="ar-bd-track"><span class="belt-chip" id="ar-bd-chip">main.c</span></div>
          </div>
        </article>
        <article class="card build-detail" id="ar-bd-detail"></article>
      </section>`;
  }

  function templateArch() {
    const card = (key) => `
      <article class="card arch-card" id="ar-arch-${key}">
        <header class="card-head"><h2>${A.ARCHS[key].label}</h2><span class="tag">${A.ARCHS[key].examples}</span></header>
        <div class="arch-svg" id="ar-svg-${key}"></div>
        <div class="arch-status" id="ar-status-${key}">Hazır.</div>
        <div class="mini-stats" id="ar-stats-${key}"></div>
      </article>`;
    return `
      <section class="lab" id="ar-lab-arch" role="tabpanel" hidden>
        <article class="card">
          <div class="build-controls">
            <button class="btn btn-primary" id="ar-ar-send" type="button">▶ read() isteği gönder (ikisine birden)</button>
            <button class="btn btn-danger" id="ar-ar-crash" type="button">💥 Disk sürücüsünü çökert</button>
            <button class="btn" id="ar-ar-reset" type="button">↺ Sıfırla</button>
            <div class="field inline"><label for="ar-ar-speed">Hız</label><select id="ar-ar-speed">${speedOptions()}</select></div>
          </div>
          <p class="hint">Aynı <code>read()</code> isteği iki tasarımda aynı anda gönderilir. Kesik çizgi kullanıcı/çekirdek sınırıdır; her geçişte bir mod değişimi sayılır. Maliyet göreli bir modeldir: fonksiyon çağrısı 1, sistem çağrısı 2, IPC mesajı (kopyalama ve geçiş dahil) 3 birim.</p>
        </article>
        <div class="duo even arch-duo">
          ${card('monolithic')}
          ${card('microkernel')}
        </div>
        <article class="card">
          <header class="card-head"><h2>Karşılaştırma</h2><span class="tag">Silberschatz §2.8</span></header>
          <div class="table-wrap">
            <table class="compare-table">
              <thead><tr><th></th><th>Monolitik</th><th>Mikroçekirdek</th></tr></thead>
              <tbody>
                <tr><td>Çekirdekte çalışan</td><td>Dosya sistemi, zamanlayıcı, bellek yönetimi, sürücüler, ağ; hepsi tek adres alanında</td><td>Yalnızca IPC, temel zamanlama, düşük düzey bellek yönetimi</td></tr>
                <tr><td>Bileşen iletişimi</td><td>Doğrudan fonksiyon çağrısı</td><td>Mesaj geçirme (message passing)</td></tr>
                <tr><td>Performans</td><td class="good">Yüksek: sistem çağrısı arayüzünde ek yük az</td><td class="bad">Daha düşük: mesaj kopyalama ve işlem/mod geçişleri</td></tr>
                <tr><td>Güvenilirlik / güvenlik</td><td class="bad">Bir sürücü hatası tüm çekirdeği çökertebilir</td><td class="good">Servis çökse de çekirdek ve diğer servisler çalışır</td></tr>
                <tr><td>Genişletme / taşınabilirlik</td><td class="bad">Zor: çekirdeğin değişmesi gerekir (yüklenebilir modüller bunu hafifletir)</td><td class="good">Kolay: yeni servis kullanıcı alanına eklenir</td></tr>
                <tr><td>Örnekler</td><td>Geleneksel UNIX, Linux (modüler)</td><td>Mach, QNX, MINIX 3</td></tr>
              </tbody>
            </table>
          </div>
          <p class="hint compare-note">Pratikte çoğu sistem <b>hibrittir</b>: Linux monolitiktir ama yüklenebilir çekirdek modülleri (LKM) kullanır. Windows büyük ölçüde monolitik olup mikroçekirdek özellikleri taşır. macOS'un XNU çekirdeği Mach ile BSD'yi birleştirir.</p>
        </article>
      </section>`;
  }

  /* ============================================================ A) DUAL-MODE */

  const IDLE_STEP = { mode: 1, node: null, regs: { PC: 'main+0x2c', rax: '?', rdi: '—', rsi: '—', rdx: '—' }, pcb: null, proc: 'running' };

  function mdBind() {
    $.mdSyscall.addEventListener('change', () => { md.syscall = $.mdSyscall.value; mdLoad(false); });
    $.mdSpeed.addEventListener('change', () => { view.speed = $.mdSpeed.value; });
    $.mdPlay.addEventListener('click', () => (md.playing ? mdPause() : mdPlay()));
    $.mdStep.addEventListener('click', () => { mdPause(); mdNext(); });
    $.mdReset.addEventListener('click', () => mdLoad(md.illegal));
    $.mdIllegal.addEventListener('click', () => { mdLoad(true); mdPlay(); });
    $.mdSteps.addEventListener('click', (e) => {
      const li = e.target.closest('[data-i]');
      if (!li) return;
      mdPause();
      md.idx = Number(li.dataset.i);
      mdRender();
    });
    window.addEventListener('resize', mdPlaceToken);
  }

  function mdLoad(illegal) {
    mdStop();
    md.illegal = illegal;
    md.steps = illegal ? A.illegalSteps() : A.syscallSteps(md.syscall);
    md.idx = -1;
    const sc = A.SYSCALLS[md.syscall];
    $.mdTag.textContent = illegal ? 'ayrıcalıklı komut ihlali' : `${md.syscall}() · rax = ${sc.nr}`;
    $.mdCall.textContent = illegal ? 'cli;   // ayrıcalıklı!' : sc.call;
    $.mdWrapper.textContent = illegal ? '—' : `${md.syscall}() → syscall`;
    $.mdService.textContent = illegal ? 'GP fault handler' : `${sc.service}()`;
    $.mdDevice.textContent = sc.device || 'yok (yalnız bellek)';
    $.mdSteps.innerHTML = md.steps.map((s, i) => `<li data-i="${i}" class="${s.bad ? 'bad' : ''}"><span>${i + 1}</span>${esc(s.title.replace(/<[^>]+>/g, ''))}</li>`).join('');
    mdRender();
  }

  function mdRender() {
    const st = md.idx >= 0 ? md.steps[md.idx] : IDLE_STEP;
    const prev = md.idx > 0 ? md.steps[md.idx - 1] : IDLE_STEP;
    const kernel = st.mode === 0;

    $.mdModebit.dataset.mode = st.mode;
    $.mdModebit.querySelector('b').textContent = st.mode;
    $.mdModebit.querySelector('small').textContent = kernel ? 'KERNEL MODE' : 'USER MODE';
    if (st.mode !== prev.mode && md.idx >= 0) retrigger($.mdModebit, 'flip');
    $.mdStage.dataset.mode = st.mode;
    $.mdStage.classList.toggle('bad', !!st.bad);

    $.mdStage.querySelectorAll('.dm-node').forEach((n) => {
      const id = n.dataset.node;
      n.classList.toggle('active', id === st.node);
      n.classList.toggle('bad', id === st.node && !!st.bad);
      n.classList.toggle('busy', id === 'hw' && !!st.device);
    });
    if (st.cross) retrigger($.nodeGate, st.cross === 'down' ? 'cross-down' : 'cross-up');

    $.mdRegs.innerHTML = REG_NAMES.map((r) => {
      const changed = md.idx >= 0 && st.regs[r] !== prev.regs[r];
      return `<div class="reg${changed ? ' changed' : ''}"><span>${r}</span><b>${esc(st.regs[r])}</b></div>`;
    }).join('');

    if (st.pcb) {
      $.mdPcb.className = `pcb-box ${st.pcb.state}`;
      $.mdPcb.innerHTML = `<em>${st.pcb.state === 'saved' ? 'KAYDEDİLDİ' : 'GERİ YÜKLENDİ ✓'}</em>`
        + REG_NAMES.map((r) => `<span>${r} = ${esc(st.pcb.regs[r])}</span>`).join('');
    } else {
      $.mdPcb.className = 'pcb-box';
      $.mdPcb.innerHTML = '<em>boş</em>';
    }

    const reached = st.node === 'table' || st.node === 'service' || (md.idx >= 0 && md.steps.slice(0, md.idx + 1).some((s) => s.node === 'table'));
    $.mdSct.querySelectorAll('[data-nr]').forEach((row) => {
      row.classList.toggle('hit', !md.illegal && reached && Number(row.dataset.nr) === A.SYSCALLS[md.syscall].nr);
    });

    $.mdProc.textContent = st.proc === 'terminated' ? 'TERMINATED' : 'RUNNING';
    $.mdProc.dataset.state = st.proc === 'terminated' ? 'deadlock' : 'running';

    if (md.idx < 0) {
      $.mdExplain.className = 'explain';
      $.mdExplain.innerHTML = md.illegal
        ? '<span class="step-no">Hazır</span><b>Ayrıcalıklı komut senaryosu</b><p>Bir kullanıcı programı kesmeleri kapatmaya çalışacak. Donanımın bunu nasıl engellediğini izle.</p>'
        : `<span class="step-no">Hazır</span><b>${md.syscall}() sistem çağrısı</b><p>Başlattığında, program kullanıcı modundan çekirdeğe ve geri dönüş yolunu adım adım izleyecek. Not: önce <b>trap</b> komutu kullanıcı modunda çalışır, ardından donanım mode bit'i 0 yapar (Silberschatz Şekil 1.13).</p>`;
    } else {
      $.mdExplain.className = `explain${st.bad ? ' bad' : kernel ? ' kernel' : ''}`;
      $.mdExplain.innerHTML = `<span class="step-no">Adım ${md.idx + 1} / ${md.steps.length} · mode bit = ${st.mode}</span><b>${st.title}</b><p>${st.text}</p>`;
      retrigger($.mdExplain, 'pop');
    }

    $.mdSteps.querySelectorAll('li').forEach((li, i) => {
      li.classList.toggle('current', i === md.idx);
      li.classList.toggle('done', i < md.idx);
    });
    const cur = $.mdSteps.querySelector('.current');
    if (cur) cur.scrollIntoView({ block: 'nearest' });

    mdPlaceToken();
    mdButtons();
    const done = md.idx === md.steps.length - 1;
    if (!md.playing) OSLab.app.setStatus(done ? (md.illegal ? 'fault' : 'done') : md.idx >= 0 ? 'paused' : 'ready');
  }

  // Yürütmeyi gösteren nokta, aktif düğümün üzerine CSS transition ile kayar
  function mdPlaceToken() {
    if (!$ || !$.mdToken) return;
    const st = md.idx >= 0 ? md.steps[md.idx] : null;
    const tok = $.mdToken;
    if (!st || !st.node) { tok.classList.remove('show'); return; }
    const node = $.mdStage.querySelector(`[data-node="${st.node}"]`);
    const sr = $.mdStage.getBoundingClientRect();
    const r = node.getBoundingClientRect();
    tok.style.left = `${r.left - sr.left + r.width - 14}px`;
    tok.style.top = `${r.top - sr.top + 12}px`;
    tok.className = `dm-token show ${st.bad ? 'bad' : st.mode === 0 ? 'kernel' : 'user'}`;
  }

  function mdButtons() {
    const done = md.idx === md.steps.length - 1;
    $.mdPlay.textContent = md.playing ? '⏸ Duraklat'
      : done ? '↻ Tekrar Oynat'
        : md.idx >= 0 ? '▶ Devam Et' : (md.illegal ? '▶ İhlali Oynat' : `▶ ${md.syscall}() Sistem Çağrısını Tetikle`);
    $.mdStep.disabled = done;
  }

  function mdNext() {
    if (md.idx >= md.steps.length - 1) return false;
    md.idx++;
    mdRender();
    return md.idx < md.steps.length - 1;
  }

  function mdPlay() {
    if (md.idx >= md.steps.length - 1) { md.idx = -1; mdRender(); }
    md.playing = true;
    OSLab.app.setStatus('running');
    const loop = () => {
      const more = mdNext();
      if (more && md.playing) md.timer = setTimeout(loop, delay());
      else { md.playing = false; mdRender(); }
    };
    mdButtons();
    loop();
  }

  function mdStop() {
    clearTimeout(md.timer);
    md.playing = false;
  }

  function mdPause() {
    if (!md.playing) return;
    mdStop();
    mdRender();
  }

  /* ============================================================ B) DERLE → BAĞLA → YÜKLE */

  const CHIP_TEXT = { source: 'main.c', compiler: 'main.c ⟶ main.o', object: 'main.o', linker: 'main.o + kütüphaneler', exe: 'main (ELF)', loader: 'main ⟶ RAM' };

  function bdBind() {
    $.bdBelt.addEventListener('click', (e) => {
      const st = e.target.closest('[data-stage]');
      if (!st) return;
      bdStop();
      bdSelect(st.dataset.stage, st.classList.contains('ram'));
    });
    $.bdLibc.addEventListener('click', (e) => {
      const b = e.target.closest('[data-libc]');
      if (!b) return;
      bd.libc = b.dataset.libc;
      bdSync();
      bdRenderDetail();
    });
    $.bdBase.addEventListener('change', () => {
      const v = Math.round(Number($.bdBase.value) / 1000) * 1000;
      bd.base = Math.max(A.BASE_MIN, Math.min(A.BASE_MAX, Number.isFinite(v) ? v : 14000));
      bdSync();
      if (bd.stage === 'loader') bdRenderDetail();
    });
    $.bdAslr.addEventListener('click', () => {
      bd.base = A.randomBase(bd.base);
      bdSync();
      bdSelect('loader');
    });
    $.bdSpeed.addEventListener('change', () => { view.speed = $.bdSpeed.value; });
    $.bdRun.addEventListener('click', () => (bd.running ? bdStop() : bdRun()));
    $.bdReset.addEventListener('click', () => { bdStop(); bdSelect('source'); });
    window.addEventListener('resize', bdPlaceChip);
  }

  function bdSync() {
    $.bdLibc.querySelectorAll('[data-libc]').forEach((b) => b.classList.toggle('active', b.dataset.libc === bd.libc));
    $.bdBase.value = bd.base;
    $.bdSpeed.value = view.speed;
    $.bdFeeds.innerHTML = `<span class="lib static">libm.a · statik</span><span class="lib ${bd.libc === 'dynamic' ? 'dyn' : 'static'}">${bd.libc === 'dynamic' ? 'libc.so.6 · dinamik' : 'libc.a · statik'}</span>`;
    $.bdRun.textContent = bd.running ? '⏸ Durdur' : '▶ Bandı Çalıştır';
  }

  function bdSelect(stage, ram) {
    bd.stage = stage;
    const ids = A.BUILD_STAGES.map((s) => s.id);
    const idx = ids.indexOf(stage);
    $.bdBelt.querySelectorAll('.station').forEach((s) => {
      const i = ids.indexOf(s.dataset.stage);
      const isRam = s.classList.contains('ram');
      s.classList.toggle('active', isRam ? !!ram : s.dataset.stage === stage && !ram);
      s.classList.toggle('done', !isRam && i < idx);
    });
    $.bdChip.textContent = ram ? `PID 4242 @ ${bd.base}` : CHIP_TEXT[stage];
    $.bdChip.dataset.stage = ram ? 'ram' : stage;
    bdPlaceChip(ram);
    bdRenderDetail();
    OSLab.app.focusInfo('linkload');
  }

  function bdPlaceChip(ram) {
    if (!$ || !$.bdChip) return;
    const target = ram === true || $.bdChip.dataset.stage === 'ram'
      ? $.bdBelt.querySelector('.station.ram')
      : $.bdBelt.querySelector(`.station[data-stage="${bd.stage}"]:not(.ram)`);
    if (!target) return;
    const wr = $.bdTrack.getBoundingClientRect();
    const r = target.getBoundingClientRect();
    $.bdChip.style.left = `${r.left - wr.left + r.width / 2}px`;
    $.bdTrack.style.setProperty('--progress', `${r.left - wr.left + r.width / 2}px`);
  }

  async function bdRun() {
    const token = { cancelled: false };
    bd.token = token;
    bd.running = true;
    $.bdBelt.classList.add('running');
    bdSync();
    OSLab.app.setStatus('running');
    for (const s of A.BUILD_STAGES) {
      bdSelect(s.id);
      if (!(await wait(delay() * 1.4, token))) return;
    }
    bdSelect('loader', true);
    bd.running = false;
    $.bdBelt.classList.remove('running');
    bdSync();
    OSLab.app.setStatus('done');
  }

  function bdStop() {
    if (bd.token) bd.token.cancelled = true;
    bd.running = false;
    if ($) {
      $.bdBelt.classList.remove('running');
      bdSync();
    }
  }

  function codeBlock(text, marks) {
    return `<pre class="codeblock">${text.split('\n').map((line, i) => {
      const m = marks && marks[i + 1];
      return `<span class="cl${m ? ' ' + m : ''}"><i>${i + 1}</i>${esc(line) || ' '}</span>`;
    }).join('')}</pre>`;
  }

  function bdRenderDetail() {
    const exe = A.link({ libc: bd.libc });
    const L = A.load(exe, bd.base);
    const stage = A.BUILD_STAGES.find((s) => s.id === bd.stage);
    const head = (title, lead) => `<header class="detail-head"><span class="st-kind ${stage.kind}">${stage.kind === 'file' ? 'DOSYA' : 'ARAÇ'}</span><h3>${title}</h3><p>${lead}</p></header>`;
    let html = '';

    switch (bd.stage) {
      case 'source':
        html = head('main.c: kaynak kod', 'İnsanın okuyabildiği C kodu. <code>sqrt</code> ve <code>printf</code> bu dosyada tanımlı değildir; yalnızca başlık dosyalarında <i>bildirilmiştir</i>. Tanımlarını bağlayıcı bulacaktır.')
          + `<div class="detail-grid">${codeBlock(A.SOURCE, { 4: 'mark-data', 7: 'mark-ext', 8: 'mark-ext' })}
            <ul class="detail-notes">
              <li><span class="dot data"></span><code>counter</code>: başlangıç değerli global değişken, <b>.data</b> bölümüne gidecek</li>
              <li><span class="dot ext"></span><code>sqrt</code>: <b>libm</b> matematik kütüphanesinde</li>
              <li><span class="dot ext"></span><code>printf</code>: <b>libc</b> standart C kütüphanesinde</li>
            </ul></div>`;
        break;

      case 'compiler':
        html = head('Derleyici: C → nesne dosyası', 'Derleme tek bir adım değildir. Çıktı, adresleri henüz kesinleşmemiş <b>yeniden konumlandırılabilir nesne dosyasıdır (relocatable object file)</b>.')
          + `<div class="phases">
              <div class="phase"><b>1 · Önişlemci</b><span>cpp</span><p>#include ve #define açılır, başlık dosyaları metne eklenir.</p></div>
              <div class="phase"><b>2 · Derleme</b><span>cc1</span><p>C kodu sözdizimi ve tür denetiminden geçer, assembly koduna çevrilir.</p></div>
              <div class="phase"><b>3 · Assembler</b><span>as</span><p>Assembly makine koduna çevrilir, sembol ve relocation tabloları üretilir.</p></div>
            </div>`
          + codeBlock(['main:', '    push  rbp', '    movsd xmm0, [.LC0]     ; 16.0', '    call  sqrt             ; adres bilinmiyor!', '    mov   esi, [counter]   ; adres bilinmiyor!', '    call  printf           ; adres bilinmiyor!', '    mov   eax, 0', '    ret'].join('\n'), { 4: 'mark-ext', 5: 'mark-data', 6: 'mark-ext' });
        break;

      case 'object':
        html = head('main.o: nesne dosyası', 'Her bölüm <b>0 adresinden</b> başlar. Derleyici dış sembollerin yerini bilmediği için bağlayıcıya "burayı düzelt" notları (<b>relocation entries</b>) bırakır.')
          + `<div class="detail-grid three">
              <div><div class="mini-title">Bölümler</div><table class="mini-table">${A.OBJECT.sections.map((s) => `<tr><td><code>${s.name}</code></td><td class="num">${s.size} B</td><td>${esc(s.note)}</td></tr>`).join('')}</table></div>
              <div><div class="mini-title">Sembol tablosu</div><table class="mini-table">${A.OBJECT.symbols.map((s) => `<tr class="${s.defined ? '' : 'undef'}"><td><code>${s.name}</code></td><td>${s.section}</td><td class="num">${s.defined ? s.value : '<span class="pill bad">UND</span>'}</td></tr>`).join('')}</table></div>
              <div><div class="mini-title">Relocation girdileri (.rela.text)</div><table class="mini-table">${A.OBJECT.relocations.map((r) => `<tr><td class="num">+${r.offset}</td><td><code>${r.instr}</code></td><td>→ ${r.symbol}</td></tr>`).join('')}</table></div>
            </div>`;
        break;

      case 'linker':
        html = head('Bağlayıcı (linker): sembol çözümleme ve birleştirme', 'Nesne dosyaları ile kütüphaneler tek bir çalıştırılabilir dosyada birleştirilir. Tanımsız sembollerin adresleri bulunur ve komutlardaki adres alanları düzeltilir.')
          + `<div class="detail-grid">
              <div><div class="mini-title">Sembol çözümleme</div><table class="mini-table">${exe.symbols.map((s) => `
                <tr><td><code>${s.name}</code></td><td>${s.from}${s.kind ? ` <span class="pill ${s.kind === 'dynamic' ? 'dyn' : 'static'}">${s.kind === 'dynamic' ? 'DİNAMİK' : 'STATİK'}</span>` : ''}</td><td class="num">${s.address}</td></tr>
                <tr class="sub"><td colspan="3">${esc(s.how)}</td></tr>`).join('')}</table></div>
              <div><div class="mini-title">Düzeltilen komutlar</div><table class="mini-table">${exe.patched.map((p) => `<tr><td class="num">+${p.offset}</td><td><s>${esc(p.before)}</s></td><td><code class="ok">${esc(p.after)}</code></td></tr>`).join('')}</table>
                <div class="link-compare">
                  <div class="${bd.libc === 'static' ? 'on' : ''}"><b>Statik bağlama</b>Kütüphane kodu dosyaya kopyalanır. Dosya büyür (${bd.libc === 'static' ? exe.sizeText : '≈ 800 KB'}), çalışma anında bağımlılık kalmaz, her program kendi kopyasını taşır.</div>
                  <div class="${bd.libc === 'dynamic' ? 'on' : ''}"><b>Dinamik bağlama (DLL / .so)</b>Dosyaya yalnızca bir saplama (stub) eklenir (${bd.libc === 'dynamic' ? exe.sizeText : '≈ 16 KB'}). Kütüphane bellekte bir kez bulunur ve işlemler arasında paylaşılır; kütüphane güncellenince yeniden bağlamak gerekmez.</div>
                </div>
              </div>
            </div>`;
        break;

      case 'exe': {
        const total = exe.segments[exe.segments.length - 1].end + 1;
        html = head('main: çalıştırılabilir dosya (ELF)', `Diskte duran ve çalışmaya hazır dosya. Adresler <b>hâlâ mantıksaldır, 0'dan başlar</b>; dosya henüz bellekte değildir. Boyut: <b>${exe.sizeText}</b>.`)
          + `<div class="elf-head"><span><b>Sihirli sayı</b><code>7F 45 4C 46 ("\\x7FELF")</code></span><span><b>Giriş noktası</b><code>0 (main)</code></span><span><b>Gereken kütüphaneler</b><code>${exe.needed.length ? exe.needed.join(', ') : '— (statik)'}</code></span></div>
            <div class="mini-title">Mantıksal adres düzeni (0 – ${total - 1})</div>
            <div class="layout-bar">${exe.segments.map((s) => `
              <div class="seg-block sec-${s.name.slice(1)}" style="flex:${s.end - s.start + 1}">
                <b>${s.name}</b><small>${s.start}–${s.end}</small>
                <div class="parts">${s.parts.map((p) => `<span title="${esc(p.from)}">${esc(p.name)} @${p.start}</span>`).join('')}</div>
              </div>`).join('')}</div>`;
        break;
      }

      case 'loader': {
        // Bölgeler adres sırasıyla, aradaki boşluklar da gösterilerek çizilir. Yükseklik boyutla
        // orantılıdır ama küçük bölgeler okunabilir kalsın diye en az bir satır yüksekliği alır.
        const blocks = [];
        let cursor = 0;
        L.regions.slice().sort((a, b) => a.start - b.start).forEach((r) => {
          if (r.start > cursor) blocks.push({ name: 'boş', start: cursor, end: r.start - 1, kind: 'free' });
          blocks.push(r);
          cursor = r.end + 1;
        });
        if (cursor < L.ramSize) blocks.push({ name: 'boş', start: cursor, end: L.ramSize - 1, kind: 'free' });
        html = head('Yükleyici (loader): belleğe yerleştirme ve relocation', `<code>exec()</code> çalıştırılabilir dosyayı belleğe yükler. Yükleme anı bağlamada (load-time binding) her mantıksal adrese <b>taban adres (relocation register = ${L.base})</b> eklenir.`)
          + `<div class="detail-grid">
              <div>
                <div class="regs-row">
                  <div class="reg big"><span>relocation (base)</span><b>${L.base}</b></div>
                  <div class="reg big"><span>limit</span><b>${L.limit}</b></div>
                  <div class="reg big"><span>geçerli fiziksel aralık</span><b>${L.base}–${L.base + L.limit - 1}</b></div>
                </div>
                <div class="mini-title">Relocation: fiziksel = taban + mantıksal</div>
                <table class="mini-table reloc">${L.refs.map((r, i) => `<tr style="--d:${i * 120}ms"><td><code>${esc(r.what)}</code></td><td class="num">${r.logical}</td><td class="op">+ ${L.base} =</td><td class="num ok">${r.physical}</td></tr>`).join('')}</table>
                ${L.dynamicFix ? `<div class="dyn-fix"><b>Dinamik bağlayıcı (ld.so):</b> libc.so.6 paylaşılan bölgeye (30000) eşlendi. <code>GOT[printf]</code> (fiziksel ${L.dynamicFix.got}) = <b>${L.dynamicFix.value}</b>. İlk printf çağrısı PLT üzerinden bu adrese gider (tembel bağlama, lazy binding).</div>` : '<div class="dyn-fix static">Statik bağlı: tüm kod zaten dosyanın içinde, dinamik bağlayıcıya gerek yok.</div>'}
                <p class="hint">Modern sistemlerde adres çoğunlukla <b>çalışma zamanında</b> MMU tarafından çevrilir (execution-time binding). <b>ASLR</b> güvenlik için tabanı her çalıştırmada rastgele seçer; 🎲 butonunu deneyebilirsin.</p>
              </div>
              <div>
                <div class="mini-title">Fiziksel bellek (0 – ${L.ramSize - 1})</div>
                <div class="ram-map">
                  ${blocks.map((r) => `
                    <div class="ram-region ${r.kind}" style="flex-grow:${r.end - r.start + 1}">
                      <span>${esc(r.name)}${r.kind === 'code' ? ` <em>counter @ ${L.base + 346}</em>` : ''}</span><small>${r.start}–${r.end}</small>
                    </div>`).join('')}
                </div>
                <p class="hint">İşlem imajı: ${L.base}–${L.base + L.limit - 1} (limit ${L.limit}). Bu haritada düşük adresler üsttedir: heap yüksek adreslere (ekranda aşağı), stack düşük adreslere (ekranda yukarı) doğru büyür.</p>
              </div>
            </div>`;
        break;
      }
    }
    $.bdDetail.innerHTML = html;
    retrigger($.bdDetail, 'pop');
  }

  /* ============================================================ C) MİMARİLER */

  // SVG düzeni (viewBox 0 0 400 340): kullanıcı alanı üstte, çekirdek ortada, donanım altta
  const GEOMETRY = {
    monolithic: {
      nodes: {
        shell: { x: 20, y: 50, w: 90, h: 36, label: 'Kabuk', decor: true },
        app: { x: 155, y: 50, w: 90, h: 36, label: 'Uygulama', app: true },
        editor: { x: 290, y: 50, w: 90, h: 36, label: 'Editör', decor: true },
        sci: { x: 22, y: 166, w: 356, h: 24, label: 'Sistem çağrısı arayüzü' },
        fs: { x: 22, y: 200, w: 112, h: 38, label: 'Dosya Sistemi' },
        sched: { x: 144, y: 200, w: 112, h: 38, label: 'CPU Zamanlayıcı' },
        mem: { x: 266, y: 200, w: 112, h: 38, label: 'Bellek Yönetimi' },
        drv: { x: 22, y: 248, w: 112, h: 38, label: 'Aygıt Sürücüleri' },
        net: { x: 144, y: 248, w: 112, h: 38, label: 'Ağ Yığını' },
        ipc: { x: 266, y: 248, w: 112, h: 38, label: 'IPC' },
        disk: { x: 22, y: 308, w: 112, h: 24, label: 'Disk', hw: true }
      },
      kernelBox: { x: 10, y: 156, w: 380, h: 140, label: 'MONOLİTİK ÇEKİRDEK' }
    },
    microkernel: {
      nodes: {
        app: { x: 15, y: 50, w: 110, h: 36, label: 'Uygulama', app: true },
        fs: { x: 145, y: 50, w: 110, h: 36, label: 'Dosya Sunucusu', server: true },
        drv: { x: 275, y: 50, w: 110, h: 36, label: 'Disk Sürücüsü', server: true },
        net: { x: 145, y: 98, w: 110, h: 30, label: 'Ağ Sunucusu', server: true, decor: true },
        mk: { x: 110, y: 186, w: 180, h: 64, label: 'Mikroçekirdek', sub: 'IPC · temel zamanlama · bellek' },
        disk: { x: 275, y: 308, w: 110, h: 24, label: 'Disk', hw: true }
      },
      kernelBox: null
    }
  };

  const HOP_COST = { call: 1, ret: 1, hw: 2, syscall: 2, msg: 3 };

  const center = (n) => ({ x: n.x + n.w / 2, y: n.y + n.h / 2 });

  function arBuildSvg(key) {
    const g = GEOMETRY[key];
    const edges = [];
    A.ARCHS[key].path.forEach((h) => {
      const k = [h.from, h.to].sort().join('-');
      if (!edges.includes(k)) edges.push(k);
    });
    const nodeSvg = (id, n) => `
      <g class="an${n.decor ? ' decor' : ''}${n.app ? ' app' : ''}${n.server ? ' server' : ''}${n.hw ? ' hw' : ''}${id === 'mk' ? ' mk' : ''}" data-node="${id}">
        <rect x="${n.x}" y="${n.y}" width="${n.w}" height="${n.h}" rx="8"></rect>
        <text x="${n.x + n.w / 2}" y="${n.y + n.h / 2 + (n.sub ? -4 : 4)}" text-anchor="middle">${n.label}</text>
        ${n.sub ? `<text class="sub" x="${n.x + n.w / 2}" y="${n.y + n.h / 2 + 13}" text-anchor="middle">${n.sub}</text>` : ''}
      </g>`;
    $['svg' + key[0].toUpperCase() + key.slice(1)].innerHTML = `
      <svg viewBox="0 0 400 340" role="img" aria-label="${A.ARCHS[key].label} şeması">
        <rect class="band user" x="0" y="0" width="400" height="140" rx="10"></rect>
        <text class="band-label" x="10" y="18">USER SPACE · mode bit = 1</text>
        <rect class="band kernel" x="0" y="146" width="400" height="154" rx="10"></rect>
        <text class="band-label" x="10" y="${g.kernelBox ? 153 : 164}">KERNEL SPACE · mode bit = 0</text>
        <rect class="band hw" x="0" y="302" width="400" height="38" rx="8"></rect>
        <text class="band-label" x="${key === 'monolithic' ? 390 : 10}" y="325" text-anchor="${key === 'monolithic' ? 'end' : 'start'}">DONANIM</text>
        <line class="boundary" x1="0" y1="143" x2="400" y2="143"></line>
        ${g.kernelBox ? `<rect class="kbox" x="${g.kernelBox.x}" y="${g.kernelBox.y}" width="${g.kernelBox.w}" height="${g.kernelBox.h}" rx="10"></rect>` : ''}
        ${edges.map((k) => {
          const [a, b] = k.split('-');
          const p = center(g.nodes[a]);
          const q = center(g.nodes[b]);
          return `<line class="ae" data-edge="${k}" x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}"></line>`;
        }).join('')}
        ${Object.entries(g.nodes).map(([id, n]) => nodeSvg(id, n)).join('')}
        <g class="panic-overlay"><rect x="10" y="156" width="380" height="140" rx="10"></rect><text x="200" y="222" text-anchor="middle">KERNEL PANIC</text><text class="sub" x="200" y="244" text-anchor="middle">tüm sistem durdu · crash dump yazılıyor</text></g>
      </svg>`;
  }

  function arStatus(key, text, tone) {
    const el = $['status' + key[0].toUpperCase() + key.slice(1)];
    el.className = `arch-status ${tone || ''}`;
    el.innerHTML = text;
  }

  function arRenderStats(key) {
    const s = ar.stats[key];
    const stat = (label, v, tone) => `<div class="mini-stat ${v && tone ? tone : ''}"><span>${label}</span><b>${v}</b></div>`;
    $['stats' + key[0].toUpperCase() + key.slice(1)].innerHTML = stat('Mod geçişi', s.modeSwitches, 'warn')
      + stat('IPC mesajı', s.messages, 'warn')
      + stat('Fonksiyon çağrısı', s.calls)
      + stat('Göreli maliyet', s.cost);
  }

  function arReset() {
    if (ar.token) ar.token.cancelled = true;
    ar.token = null;
    ar.busy = false;
    ar.panic = false;
    ar.mkDown = false;
    ['monolithic', 'microkernel'].forEach((key) => {
      ar.stats[key] = { modeSwitches: 0, messages: 0, calls: 0, cost: 0 };
      arBuildSvg(key);
      arRenderStats(key);
      arStatus(key, key === 'monolithic'
        ? 'Tüm servisler çekirdek alanında, tek adres alanında çalışır.'
        : 'Servisler kullanıcı alanında ayrı işlemler olarak çalışır.');
    });
    arButtons();
    OSLab.app.setStatus('ready');
  }

  function arButtons() {
    $.arSend.disabled = ar.busy;
    $.arCrash.disabled = ar.busy || ar.panic;
  }

  const svgOf = (key) => $['svg' + key[0].toUpperCase() + key.slice(1)].querySelector('svg');

  // Paket, iki düğüm merkezi arasında requestAnimationFrame ile ilerler
  function movePacket(svg, from, to, duration, kind, token) {
    return new Promise((resolve) => {
      const pkt = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      pkt.setAttribute('r', kind === 'msg' ? 7 : 5.5);
      pkt.setAttribute('class', `pkt ${kind}`);
      svg.appendChild(pkt);
      const t0 = performance.now();
      const frame = (now) => {
        if (token.cancelled) { pkt.remove(); resolve(false); return; }
        const k = Math.min(1, (now - t0) / duration);
        const e = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
        pkt.setAttribute('cx', from.x + (to.x - from.x) * e);
        pkt.setAttribute('cy', from.y + (to.y - from.y) * e);
        if (k < 1) requestAnimationFrame(frame);
        else { pkt.remove(); resolve(true); }
      };
      requestAnimationFrame(frame);
    });
  }

  async function arRunPath(key, token) {
    const g = GEOMETRY[key];
    const svg = svgOf(key);
    const s = ar.stats[key] = { modeSwitches: 0, messages: 0, calls: 0, cost: 0 };
    arRenderStats(key);
    if (key === 'monolithic' && ar.panic) {
      arStatus(key, '☠ Sistem çökmüş durumda. İstek işlenemez; yeniden başlatma (Sıfırla) gerekir.', 'bad');
      return;
    }
    const unit = delay() / 4;
    for (const hop of A.ARCHS[key].path) {
      if (token.cancelled) return;
      if (key === 'microkernel' && ar.mkDown && (hop.to === 'drv' || hop.from === 'drv')) {
        arStatus(key, '⏸ Disk sürücüsü yeniden başlatılıyor; mesaj kuyrukta bekliyor…', 'warn');
        while (ar.mkDown && !token.cancelled) await wait(200);
      }
      const edge = svg.querySelector(`[data-edge="${[hop.from, hop.to].sort().join('-')}"]`);
      edge.classList.add('active', hop.kind);
      svg.querySelectorAll('.an').forEach((n) => n.classList.toggle('active', n.dataset.node === hop.to));
      arStatus(key, `<b>${hop.kind === 'msg' ? 'IPC' : hop.kind === 'hw' ? 'Donanım' : hop.kind === 'syscall' ? 'Sistem çağrısı' : 'Çağrı'}</b> · ${esc(hop.label)}`);
      const ok = await movePacket(svg, center(g.nodes[hop.from]), center(g.nodes[hop.to]), HOP_COST[hop.kind] * unit, hop.kind, token);
      edge.classList.remove('active', hop.kind);
      if (!ok) return;
      if (hop.cross) {
        s.modeSwitches++;
        retrigger(svg.querySelector('.boundary'), 'flash');
      }
      if (hop.kind === 'msg' && hop.to === 'mk') s.messages++;
      if (hop.kind === 'call') s.calls++;
      s.cost += HOP_COST[hop.kind];
      arRenderStats(key);
    }
    svg.querySelectorAll('.an').forEach((n) => n.classList.toggle('active', n.dataset.node === 'app'));
    arStatus(key, `✓ Veri uygulamaya ulaştı: ${s.modeSwitches} mod geçişi, ${s.messages} mesaj, maliyet ${s.cost}.`, 'ok');
  }

  async function arSend() {
    if (ar.busy) return;
    const token = ar.token = { cancelled: false };
    ar.busy = true;
    arButtons();
    OSLab.app.setStatus('running');
    await Promise.all([arRunPath('monolithic', token), arRunPath('microkernel', token)]);
    if (token.cancelled) return;
    ar.busy = false;
    arButtons();
    OSLab.app.setStatus(ar.panic ? 'panic' : 'done');
  }

  async function arCrash() {
    if (ar.busy || ar.panic) return;
    const token = ar.token = { cancelled: false };
    ar.busy = true;
    arButtons();
    OSLab.app.focusInfo('structures');
    const mono = svgOf('monolithic');
    const micro = svgOf('microkernel');
    mono.querySelector('[data-node="drv"]').classList.add('crashed');
    micro.querySelector('[data-node="drv"]').classList.add('crashed');
    arStatus('monolithic', '💥 Sürücü hatası çekirdek adres alanında oluştu…', 'bad');
    arStatus('microkernel', '💥 Disk sürücüsü sunucusu çöktü. Bu yalnızca bir kullanıcı işlemi.', 'warn');
    ar.mkDown = true;

    if (!(await wait(900, token))) return;
    mono.classList.add('panic');
    ar.panic = true;
    arStatus('monolithic', '☠ <b>KERNEL PANIC</b>: sürücü çekirdek alanında çalıştığı için hata tüm çekirdeği çökertti. Bellek durumu <b>crash dump</b> olarak diske yazılır, sistem yeniden başlatılmalı.', 'bad');
    OSLab.app.setStatus('panic');

    if (!(await wait(1800, token))) return;
    arStatus('microkernel', '↻ Çekirdek ve diğer sunucular çalışmaya devam ediyor. Sürücü sunucusu yeniden başlatılıyor…', 'warn');
    if (!(await wait(1600, token))) return;
    micro.querySelector('[data-node="drv"]').classList.remove('crashed');
    micro.querySelector('[data-node="drv"]').classList.add('restarted');
    ar.mkDown = false;
    arStatus('microkernel', '✓ Disk sürücüsü yeniden başlatıldı (MINIX 3\'teki "reincarnation server" gibi). Sistem hiç durmadı.', 'ok');
    ar.busy = false;
    arButtons();
  }

  function arBind() {
    $.arSend.addEventListener('click', arSend);
    $.arCrash.addEventListener('click', arCrash);
    $.arReset.addEventListener('click', arReset);
    $.arSpeed.addEventListener('change', () => { view.speed = $.arSpeed.value; });
  }

  /* ============================================================ modül arayüzü */

  function showLab(lab) {
    view.lab = lab;
    if (lab !== 'mode') mdPause();
    if (lab !== 'build') bdStop();
    $.root.querySelectorAll('.lab-tab').forEach((t) => {
      const on = t.dataset.lab === lab;
      t.classList.toggle('active', on);
      t.setAttribute('aria-selected', String(on));
    });
    $.labMode.hidden = lab !== 'mode';
    $.labBuild.hidden = lab !== 'build';
    $.labArch.hidden = lab !== 'arch';
    [$.mdSpeed, $.bdSpeed, $.arSpeed].forEach((s) => { s.value = view.speed; });
    OSLab.app.focusInfo(FOCUS_BY_LAB[lab]);
    OSLab.app.setStatus('ready');
    // Gizliyken ölçülemeyen konumları görünür olunca yeniden hesapla
    requestAnimationFrame(() => { mdPlaceToken(); bdPlaceChip(); });
  }

  function mount(container) {
    container.innerHTML = template();
    $ = { root: container };
    container.querySelectorAll('[id^="ar-"]').forEach((node) => { $[camel(node.id.slice(3))] = node; });

    container.querySelector('.lab-tabs').addEventListener('click', (e) => {
      const tab = e.target.closest('[data-lab]');
      if (tab) showLab(tab.dataset.lab);
    });
    mdBind();
    bdBind();
    arBind();
    $.mdSyscall.value = md.syscall;
    mdLoad(false);
    bdSync();
    bdSelect('source');
    arReset();
    showLab(view.lab);
  }

  function unmount() {
    mdStop();
    bdStop();
    if (ar.token) ar.token.cancelled = true;
    window.removeEventListener('resize', mdPlaceToken);
    window.removeEventListener('resize', bdPlaceChip);
    $ = null;
  }

  // Sınav panelindeki "Simülatörde Dene" butonu
  function loadPreset(preset) {
    showLab(preset.lab);
    const target = { mode: $.labMode, build: $.labBuild, arch: $.labArch }[preset.lab];
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (preset.lab === 'mode') {
      if (preset.syscall) { md.syscall = preset.syscall; $.mdSyscall.value = md.syscall; }
      mdLoad(!!preset.illegal);
      mdPlay();
    } else if (preset.lab === 'build') {
      if (preset.libc) bd.libc = preset.libc;
      if (preset.base) bd.base = preset.base;
      bdSync();
      bdSelect(preset.stage || 'source', preset.stage === 'loader');
    } else {
      arReset();
      if (preset.action === 'crash') arCrash(); else arSend();
    }
  }

  OSLab.modules = OSLab.modules || {};
  OSLab.modules.system = {
    num: '01',
    title: 'System & Architecture',
    subtitle: 'Sistem ve Mimari',
    mount,
    unmount,
    loadPreset
  };
})(window.OSLab = window.OSLab || {});
