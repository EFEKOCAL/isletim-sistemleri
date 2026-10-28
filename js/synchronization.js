/*
 * synchronization.js — Senkronizasyon simülasyonlarının saf (DOM'dan bağımsız) çekirdeği.
 *
 * Model (Silberschatz, "Operating System Concepts", Bölüm 6–7):
 *  - Tek CPU (uniprocessor). Her adımda bir işlem tek bir komut çalıştırır; zamanlayıcı
 *    herhangi iki komut arasında bağlam değişimi yapabilir.
 *  - counter++ / counter-- tek komut değildir. Makine düzeyinde üç komuttur:
 *      R = counter;  R = R ± 1;  counter = R;
 *    R, işleme özel bir yazmaçtır. Bağlam değişiminde PCB'ye kaydedilir.
 *  - Semafor, kitaptaki engellemeli (busy-waiting olmayan) gerçekleştirmedir:
 *      wait(S):   S.value--; if (S.value < 0) { listeye ekle; block(); }
 *      signal(S): S.value++; if (S.value <= 0) { listeden P'yi çıkar; wakeup(P); }
 *    Değer negatifse |S.value| bekleyen işlem sayısıdır. wait/signal'ın kendisi atomiktir.
 *  - Mutex burada engellemeli (sleeping) bir kilittir: kilit doluysa işlem bekleme kuyruğuna
 *    girer, release() kilidi kuyruktaki ilk işleme FIFO sırasıyla devreder.
 *    (Kitaptaki acquire() tanımı spinlock'tur, yani busy waiting yapar. Fark teori panelinde anlatılıyor.)
 */
(function (OSLab) {
  'use strict';

  class Semaphore {
    constructor(name, value) {
      this.name = name;
      this.initial = value;
      this.value = value;
      this.queue = [];
    }

    /** @returns {boolean} çağıran işlem bloklandıysa true */
    wait(pid) {
      this.value--;
      if (this.value < 0) {
        this.queue.push(pid);
        return true;
      }
      return false;
    }

    /** @returns {string|null} uyandırılan işlem */
    signal() {
      this.value++;
      return this.value <= 0 ? this.queue.shift() : null;
    }
  }

  class MutexLock {
    constructor() {
      this.owner = null;
      this.queue = [];
    }

    /** @returns {boolean} çağıran işlem bloklandıysa true */
    acquire(pid) {
      if (this.owner === null) {
        this.owner = pid;
        return false;
      }
      this.queue.push(pid);
      return true;
    }

    /** Kilidi bekleyen ilk işleme devreder; @returns {string|null} yeni sahip */
    release(pid) {
      if (this.owner !== pid) throw new Error(`${pid} sahibi olmadığı kilidi bırakamaz.`);
      this.owner = this.queue.length ? this.queue.shift() : null;
      return this.owner;
    }
  }

  /* ====================================================================
   * 1–2) Kritik bölge: yarış durumu, mutex ve semafor
   * ==================================================================== */

  const RACE_MODES = {
    none: { id: 'none', label: 'Senkronizasyon Yok' },
    mutex: { id: 'mutex', label: 'Mutex Kilidi' },
    semaphore: { id: 'semaphore', label: 'Semafor' }
  };

  const POSS = { A: "A'nın", B: "B'nin" };
  const DAT = { A: "A'ya", B: "B'ye" };

  function raceProgram(id, delta, mode) {
    const R = id === 'A' ? 'R1' : 'R2';
    const cs = [
      { op: 'load', text: `${R} = counter;`, section: 'cs' },
      { op: 'calc', text: `${R} = ${R} ${delta > 0 ? '+' : '-'} 1;`, section: 'cs' },
      { op: 'store', text: `counter = ${R};`, section: 'cs' }
    ];
    if (mode === 'mutex') {
      return [{ op: 'acquire', text: 'acquire(&lock);', section: 'entry' }, ...cs, { op: 'release', text: 'release(&lock);', section: 'exit' }];
    }
    if (mode === 'semaphore') {
      return [{ op: 'wait', text: 'wait(&S);', section: 'entry' }, ...cs, { op: 'signal', text: 'signal(&S);', section: 'exit' }];
    }
    return cs;
  }

  /**
   * @param {{mode:'none'|'mutex'|'semaphore', initial:number, iterations:number, opB:'dec'|'inc', semValue:number}} cfg
   */
  function createRaceSim(cfg) {
    const mode = cfg.mode;
    const iterations = cfg.iterations;
    const deltaB = cfg.opB === 'inc' ? 1 : -1;
    const counter = { value: cfg.initial, version: 0, writer: null };
    const lock = mode === 'mutex' ? new MutexLock() : mode === 'semaphore' ? new Semaphore('S', cfg.semValue) : null;

    const makeProc = (id, delta) => ({
      id,
      regName: id === 'A' ? 'R1' : 'R2',
      delta,
      program: raceProgram(id, delta, mode),
      pc: 0,
      iter: 0,
      state: 'ready',   // ready | running | blocked | done
      reg: null,
      loadVersion: -1,  // okuma anındaki counter sürümü (bayat yazma tespiti için)
      inCS: false
    });
    const procs = { A: makeProc('A', 1), B: makeProc('B', deltaB) };

    const sim = {
      mode,
      iterations,
      counter,
      lock,
      procs,
      expected: cfg.initial + iterations * (1 + deltaB),
      current: null,
      steps: 0,
      finished: false,
      stats: { switches: 0, staleWrites: 0, violations: 0, blocks: 0 },
      runnable: () => ['A', 'B'].filter((id) => procs[id].state === 'ready' || procs[id].state === 'running'),
      step
    };

    function enterCS(p, other, ev) {
      if (other.inCS) {
        sim.stats.violations++;
        ev.kind = 'violation';
        ev.note = `Karşılıklı dışlama ihlali: ${p.id} kritik bölgeye girdi, oysa ${other.id} hâlâ içeride.`;
      }
      p.inCS = true;
    }

    function block(p, ev, result) {
      p.state = 'blocked';
      sim.stats.blocks++;
      ev.kind = 'block';
      ev.result = result;
    }

    // Uyandırılan işlem entry komutunu tamamlamış sayılır ve doğrudan kritik bölgeye geçer
    function wake(id, ev) {
      const q = procs[id];
      q.state = 'ready';
      q.pc++;
      q.inCS = true;
      ev.kind = 'wake';
      ev.woken = id;
    }

    function step(pid) {
      if (sim.finished || !sim.runnable().includes(pid)) throw new Error(`${pid} şu an çalıştırılamaz.`);
      const p = procs[pid];
      const other = procs[pid === 'A' ? 'B' : 'A'];
      const ins = p.program[p.pc];
      const ev = { t: sim.steps, pid, line: p.pc, op: ins.op, text: ins.text, kind: 'normal', result: '', note: '' };

      if (sim.current !== null && sim.current !== pid) {
        const prev = procs[sim.current];
        sim.stats.switches++;
        ev.switchFrom = prev.id;
        ev.switchNote = `Bağlam değişimi ${prev.id} → ${pid}: ${POSS[prev.id]} ${prev.regName} = ${prev.reg === null ? '—' : prev.reg} değeri PCB'ye kaydedildi`
          + (prev.state === 'blocked' ? ` (${prev.id} bloklandığı için)` : '');
        if (prev.state === 'running') prev.state = 'ready';
      }
      sim.current = pid;
      p.state = 'running';

      let advance = true;
      switch (ins.op) {
        case 'acquire':
          if (lock.acquire(pid)) {
            advance = false;
            block(p, ev, `kilit ${lock.owner} işleminde → ${pid} bekleme kuyruğuna girdi`);
          } else {
            ev.kind = 'enter';
            ev.result = `kilit alındı (sahibi ${pid})`;
            enterCS(p, other, ev);
          }
          break;

        case 'wait':
          if (lock.wait(pid)) {
            advance = false;
            block(p, ev, `S = ${lock.value} < 0 → ${pid} bloklandı, S kuyruğuna eklendi`);
          } else {
            ev.kind = 'enter';
            ev.result = `S = ${lock.value} → kritik bölgeye girdi`;
            enterCS(p, other, ev);
          }
          break;

        case 'load':
          if (mode === 'none') enterCS(p, other, ev);
          p.reg = counter.value;
          p.loadVersion = counter.version;
          ev.result = `${p.regName} = ${p.reg}`;
          break;

        case 'calc':
          p.reg += p.delta;
          ev.result = `${p.regName} = ${p.reg}`;
          break;

        case 'store': {
          const stale = counter.version !== p.loadVersion;
          const old = counter.value;
          const oldWriter = counter.writer;
          counter.value = p.reg;
          counter.version++;
          counter.writer = pid;
          ev.result = `counter = ${p.reg}`;
          if (stale) {
            sim.stats.staleWrites++;
            ev.kind = 'conflict';
            ev.overwritten = old;
            ev.note = `Kayıp güncelleme (lost update): ${pid}, ${POSS[oldWriter]} yazdığı ${old} değerini bayat ${p.regName} = ${p.reg} ile ezdi.`;
          }
          if (mode === 'none') p.inCS = false;
          break;
        }

        case 'release': {
          p.inCS = false;
          const next = lock.release(pid);
          ev.kind = 'release';
          ev.result = next ? `kilit ${DAT[next]} devredildi` : 'kilit serbest';
          if (next) wake(next, ev);
          break;
        }

        case 'signal': {
          p.inCS = false;
          const next = lock.signal();
          ev.kind = 'release';
          ev.result = `S = ${lock.value}` + (next ? ` → ${next} uyandırıldı` : '');
          if (next) wake(next, ev);
          break;
        }
      }

      if (advance) {
        p.pc++;
        if (p.pc === p.program.length) {
          p.pc = 0;
          p.iter++;
          if (p.iter === iterations) p.state = 'done';
        }
      }
      ev.counter = counter.value;
      sim.steps++;
      sim.finished = procs.A.state === 'done' && procs.B.state === 'done';
      return ev;
    }

    return sim;
  }

  // Silberschatz'daki T0–T5 tablosunun sırası: A, A, B, B, A, B
  const TEXTBOOK_PATTERN = ['A', 'A', 'B', 'B', 'A', 'B'];
  const SWITCH_PROBABILITY = 0.45;

  /** 'textbook' | 'random' zamanlayıcısı: sıradaki komutu hangi işlemin çalıştıracağını seçer */
  function createRacePicker(policy) {
    let i = 0;
    return function pick(sim) {
      const ready = sim.runnable();
      if (!ready.length) return null;
      if (policy === 'textbook') {
        const want = TEXTBOOK_PATTERN[i++ % TEXTBOOK_PATTERN.length];
        return ready.includes(want) ? want : ready[0];
      }
      const cur = sim.current;
      if (cur && ready.includes(cur)) {
        const others = ready.filter((id) => id !== cur);
        return others.length && Math.random() < SWITCH_PROBABILITY ? others[0] : cur;
      }
      return ready[Math.floor(Math.random() * ready.length)];
    };
  }

  /* ====================================================================
   * 3) Üretici–Tüketici (bounded buffer), semaforlarla
   * ==================================================================== */

  // Not: empty/full yuvaları "sayar". Tüketici remove yaptıktan sonra signal(empty) yapana kadar
  // yuva fiziksel olarak boş olsa da empty henüz artmamıştır. Bu yüzden nedenler semafor üzerinden ifade edilir.
  const WAIT_REASON = {
    empty: 'boş yuva kalmadı (tampon dolu)',
    full: 'alınacak ürün kalmadı (tampon boş)',
    mutex: 'mutex diğer işlemde'
  };

  function producerProgram(buggy) {
    const waitEmpty = { op: 'wait', sem: 'empty', text: 'wait(empty);' };
    const waitMutex = { op: 'wait', sem: 'mutex', text: 'wait(mutex);', section: 'entry' };
    return [
      { op: 'produce', text: 'next_produced = produce_item();' },
      ...(buggy ? [waitMutex, waitEmpty] : [waitEmpty, waitMutex]),
      { op: 'add', text: 'buffer[in] = next_produced;\nin = (in + 1) % n;', section: 'cs' },
      { op: 'signal', sem: 'mutex', text: 'signal(mutex);', section: 'exit' },
      { op: 'signal', sem: 'full', text: 'signal(full);' }
    ];
  }

  function consumerProgram() {
    return [
      { op: 'wait', sem: 'full', text: 'wait(full);' },
      { op: 'wait', sem: 'mutex', text: 'wait(mutex);', section: 'entry' },
      { op: 'remove', text: 'next_consumed = buffer[out];\nout = (out + 1) % n;', section: 'cs' },
      { op: 'signal', sem: 'mutex', text: 'signal(mutex);', section: 'exit' },
      { op: 'signal', sem: 'empty', text: 'signal(empty);' },
      { op: 'consume', text: 'consume_item(next_consumed);' }
    ];
  }

  /**
   * @param {{size:number, buggy:boolean}} cfg  buggy: üreticide wait(mutex) ile wait(empty) yer değiştirir
   */
  function createBoundedBuffer(cfg) {
    const size = cfg.size;
    const sems = {
      mutex: new Semaphore('mutex', 1),
      empty: new Semaphore('empty', size),
      full: new Semaphore('full', 0)
    };
    const makeProc = (id, name, program) => ({ id, name, program, pc: 0, state: 'ready', item: null, blockedOn: null, blocks: 0 });
    const procs = {
      P: makeProc('P', 'Üretici', producerProgram(cfg.buggy)),
      C: makeProc('C', 'Tüketici', consumerProgram())
    };

    const sim = {
      size,
      buggy: cfg.buggy,
      buffer: new Array(size).fill(null),
      in: 0,
      out: 0,
      count: 0,
      nextId: 1,
      sems,
      procs,
      mutexHolder: null,
      current: null,
      steps: 0,
      deadlock: false,
      stats: { produced: 0, consumed: 0, switches: 0 },
      runnable: () => ['P', 'C'].filter((id) => procs[id].state !== 'blocked'),
      step
    };

    function step(pid) {
      if (sim.deadlock || !sim.runnable().includes(pid)) throw new Error(`${pid} şu an çalıştırılamaz.`);
      const p = procs[pid];
      const ins = p.program[p.pc];
      const ev = { t: sim.steps, pid, line: p.pc, op: ins.op, text: ins.text.replace('\n', ' '), kind: 'normal', result: '' };

      if (sim.current !== null && sim.current !== pid) {
        sim.stats.switches++;
        ev.switchFrom = sim.current;
        if (procs[sim.current].state === 'running') procs[sim.current].state = 'ready';
      }
      sim.current = pid;
      p.state = 'running';

      let advance = true;
      switch (ins.op) {
        case 'produce':
          p.item = sim.nextId++;
          ev.item = p.item;
          ev.result = `next_produced = #${p.item}`;
          break;

        case 'wait': {
          const s = sems[ins.sem];
          if (s.wait(pid)) {
            advance = false;
            p.state = 'blocked';
            p.blockedOn = ins.sem;
            p.blocks++;
            ev.kind = 'block';
            ev.sem = ins.sem;
            ev.result = `${ins.sem} = ${s.value} < 0 → ${p.name} BLOCKED (${WAIT_REASON[ins.sem]})`;
          } else {
            if (ins.sem === 'mutex') sim.mutexHolder = pid;
            ev.result = `${ins.sem} = ${s.value}`;
          }
          break;
        }

        case 'signal': {
          const s = sems[ins.sem];
          const woken = s.signal();
          if (ins.sem === 'mutex') sim.mutexHolder = woken || null;
          ev.result = `${ins.sem} = ${s.value}`;
          if (woken) {
            const q = procs[woken];
            q.state = 'ready';
            q.blockedOn = null;
            q.pc = (q.pc + 1) % q.program.length; // uyanan işlem wait() komutunu tamamlamış sayılır
            ev.kind = 'wakeup';
            ev.woken = woken;
            ev.result += ` → ${q.name} uyandırıldı (wakeup)`;
          }
          break;
        }

        case 'add':
          ev.slot = sim.in;
          ev.item = p.item;
          sim.buffer[sim.in] = p.item;
          sim.in = (sim.in + 1) % size;
          sim.count++;
          sim.stats.produced++;
          p.item = null;
          ev.result = `buffer[${ev.slot}] = #${ev.item}, in = ${sim.in}`;
          break;

        case 'remove':
          ev.slot = sim.out;
          p.item = sim.buffer[sim.out];
          ev.item = p.item;
          sim.buffer[sim.out] = null;
          sim.out = (sim.out + 1) % size;
          sim.count--;
          ev.result = `next_consumed = #${p.item}, out = ${sim.out}`;
          break;

        case 'consume':
          ev.item = p.item;
          sim.stats.consumed++;
          ev.result = `#${p.item} tüketildi`;
          p.item = null;
          break;
      }

      if (advance) p.pc = (p.pc + 1) % p.program.length;
      sim.steps++;
      if (!sim.runnable().length) {
        sim.deadlock = true;
        ev.kind = 'deadlock';
      }
      return ev;
    }

    return sim;
  }

  /** Göreli hızlara göre ağırlıklı seçim (ör. üretici 4, tüketici 1 → üretici ~%80 CPU alır) */
  function pickWeighted(sim, weights) {
    const ready = sim.runnable();
    if (ready.length <= 1) return ready[0] || null;
    const total = ready.reduce((s, id) => s + weights[id], 0);
    let x = Math.random() * total;
    for (const id of ready) {
      x -= weights[id];
      if (x < 0) return id;
    }
    return ready[ready.length - 1];
  }

  OSLab.sync = {
    Semaphore,
    MutexLock,
    RACE_MODES,
    WAIT_REASON,
    createRaceSim,
    createRacePicker,
    createBoundedBuffer,
    pickWeighted
  };
})(window.OSLab = window.OSLab || {});
