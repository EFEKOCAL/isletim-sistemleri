/*
 * scheduler.js — CPU zamanlama algoritmalarının saf (DOM'dan bağımsız) çekirdeği.
 *
 * Varsayımlar (ders kitabı modeli, Silberschatz "Operating System Concepts"):
 *  - Her işlemin tek bir CPU burst'ü vardır, I/O yoktur.
 *  - Bağlam değişimi (context switch) maliyeti 0 kabul edilir.
 *  - Zaman birimleri tam sayıdır.
 *
 * Eşitlik (tie-break) kuralları:
 *  - FCFS: aynı anda gelenlerde işlem tablosundaki ekleme sırası.
 *  - SJF : eşit burst'te önce gelen; o da eşitse ekleme sırası.
 *  - RR  : kuantumu dolan işlemle aynı anda gelen yeni işlem kuyruğa ÖNCE girer,
 *          kesilen işlem onun arkasına eklenir.
 */
(function (OSLab) {
  'use strict';

  const ALGORITHMS = {
    FCFS: { id: 'FCFS', label: 'FCFS (First-Come, First-Served)', short: 'FCFS', preemptive: false },
    SJF: { id: 'SJF', label: 'SJF (Shortest-Job-First – Non-preemptive)', short: 'SJF', preemptive: false },
    RR: { id: 'RR', label: 'Round Robin (RR)', short: 'RR', preemptive: true }
  };

  // Aynı zaman anındaki olayların mantıksal sırası (günlükte okunurluk için)
  const EVENT_ORDER = { complete: 0, preempt: 0, arrival: 1, requeue: 2, idle: 3, dispatch: 3 };

  const byArrival = (a, b) => a.arrival - b.arrival || a.index - b.index;
  const byBurst = (a, b) => a.burst - b.burst || byArrival(a, b);

  function dispatchText(algorithm, p, left, run, competitors, quantum) {
    if (algorithm === 'FCFS') {
      return `${p.pid} CPU'ya atandı — kuyruğun başındaki (en erken gelen) işlem, ${run} birim çalışacak`;
    }
    if (algorithm === 'SJF') {
      return competitors > 1
        ? `${p.pid} seçildi — hazırdaki ${competitors} işlem arasında en kısa burst (BT=${p.burst})`
        : `${p.pid} CPU'ya atandı — hazırdaki tek işlem (BT=${p.burst})`;
    }
    return run < left
      ? `${p.pid} CPU'ya atandı — kalan ${left}, q=${quantum} birim çalışacak`
      : `${p.pid} CPU'ya atandı — kalan ${left} ≤ q, son dilimini çalışacak`;
  }

  /**
   * @param {{pid:string, arrival:number, burst:number}[]} input
   * @param {'FCFS'|'SJF'|'RR'} algorithm
   * @param {{quantum?:number}} [options]
   */
  function simulate(input, algorithm, options) {
    if (!ALGORITHMS[algorithm]) throw new Error('Bilinmeyen algoritma: ' + algorithm);
    if (!input.length) throw new Error('Simülasyon için en az bir işlem gerekli.');
    const quantum = algorithm === 'RR' ? Number(options && options.quantum) : Infinity;
    if (algorithm === 'RR' && !(Number.isInteger(quantum) && quantum > 0)) {
      throw new Error('Time Quantum pozitif bir tam sayı olmalı.');
    }

    const procs = input.map((p, index) => ({ pid: p.pid, arrival: p.arrival, burst: p.burst, index }));
    const arrivals = procs.slice().sort(byArrival);
    const remaining = new Map(procs.map((p) => [p.pid, p.burst]));
    const firstStart = new Map();
    const completion = new Map();
    const ready = [];
    const segments = [];   // Gantt: { pid|null, start, end }
    const snapshots = [];  // Hazır kuyruğunun zaman içindeki hali: { time, queue:[pid] }
    const events = [];     // Dispatcher günlüğü
    let time = 0;
    let nextArrival = 0;
    let seq = 0;

    function snapshot(at) {
      const queue = ready.map((p) => p.pid);
      const last = snapshots[snapshots.length - 1];
      if (last && last.time === at) last.queue = queue;
      else snapshots.push({ time: at, queue });
    }

    function log(at, type, pid, text) {
      events.push({ time: at, type, pid, text, seq: seq++ });
    }

    function enqueue(p) {
      if (algorithm === 'SJF') {
        // Hazır kuyruğu burst süresine göre sıralı tutulur (baştaki = en kısa iş)
        const i = ready.findIndex((q) => byBurst(p, q) < 0);
        ready.splice(i === -1 ? ready.length : i, 0, p);
      } else {
        ready.push(p);
      }
    }

    function admitUntil(limit) {
      while (nextArrival < arrivals.length && arrivals[nextArrival].arrival <= limit) {
        const p = arrivals[nextArrival++];
        enqueue(p);
        log(p.arrival, 'arrival', p.pid, `${p.pid} geldi (BT=${p.burst}) → hazır kuyruğuna eklendi`);
        snapshot(p.arrival);
      }
    }

    admitUntil(0);
    snapshot(0);

    while (completion.size < procs.length) {
      if (!ready.length) {
        const next = arrivals[nextArrival].arrival;
        segments.push({ pid: null, start: time, end: next });
        log(time, 'idle', null, `Hazır kuyruğu boş → CPU boşta (idle) ${time}–${next}`);
        time = next;
        admitUntil(time);
        continue;
      }

      const competitors = ready.length;
      const p = ready.shift();
      const left = remaining.get(p.pid);
      const run = Math.min(quantum, left);
      const end = time + run;

      if (!firstStart.has(p.pid)) firstStart.set(p.pid, time);
      log(time, 'dispatch', p.pid, dispatchText(algorithm, p, left, run, competitors, quantum));
      snapshot(time);
      segments.push({ pid: p.pid, start: time, end });
      remaining.set(p.pid, left - run);

      if (left - run === 0) {
        completion.set(p.pid, end);
        log(end, 'complete', p.pid, `${p.pid} tamamlandı (CT=${end})`);
        admitUntil(end);
      } else {
        log(end, 'preempt', p.pid, `${p.pid}: q=${quantum} doldu → zamanlayıcı kesmesi (kalan ${left - run})`);
        admitUntil(end);
        ready.push(p);
        log(end, 'requeue', p.pid, `${p.pid} hazır kuyruğunun sonuna eklendi`);
        snapshot(end);
      }
      time = end;
    }
    snapshot(time);

    events.sort((a, b) => a.time - b.time || EVENT_ORDER[a.type] - EVENT_ORDER[b.type] || a.seq - b.seq);

    const rows = procs.map((p) => {
      const ct = completion.get(p.pid);
      const start = firstStart.get(p.pid);
      const turnaround = ct - p.arrival;      // TAT = CT − AT
      const waiting = turnaround - p.burst;   // WT  = TAT − BT
      const response = start - p.arrival;     // RT  = ilk çalışma − AT
      return { pid: p.pid, arrival: p.arrival, burst: p.burst, start, completion: ct, turnaround, waiting, response };
    });

    const n = rows.length;
    const avg = (key) => rows.reduce((s, r) => s + r[key], 0) / n;
    const busyTime = procs.reduce((s, p) => s + p.burst, 0);

    let contextSwitches = 0;
    let prev = null;
    for (const s of segments) {
      if (s.pid === null) continue;
      if (prev !== null && prev !== s.pid) contextSwitches++;
      prev = s.pid;
    }

    return {
      algorithm,
      quantum: algorithm === 'RR' ? quantum : null,
      segments,
      snapshots,
      events,
      rows,
      averages: { waiting: avg('waiting'), turnaround: avg('turnaround'), response: avg('response') },
      makespan: time,
      busyTime,
      utilization: busyTime / time,
      throughput: n / time,
      contextSwitches
    };
  }

  OSLab.scheduler = { ALGORITHMS, simulate };
})(window.OSLab = window.OSLab || {});
