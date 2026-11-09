/*
 * scheduler-trace.js — Ders notlarındaki Gantt şekilleri için çizelge hesabı (DOM'dan bağımsız).
 * Laboratuvarın scheduler.js çekirdeğinden ayrıdır; SRTF ve öncelikli planlamayı da kapsar.
 *
 * Eşitlik kuralları:
 *  - Kesmeli algoritmalarda eşitlikte çalışan işlem CPU'da kalır.
 *  - Sonra önce gelen, o da eşitse tablo sırası.
 *  - tie: 'sjf' verilirse aynı öncelikte kalan süresi kısa olan seçilir.
 *  - RR: kuantumu dolan işlemle aynı anda gelen yeni işlem kuyruğa önce girer.
 *  - PRIO_RR: en yüksek öncelikli grup çalışır; grupta birden çok işlem varsa aralarında RR uygulanır.
 */
(function (OSLab) {
  'use strict';

  const round = (x) => Math.round(x * 100) / 100;

  /**
   * @param {{pid:string, at:number, bt:number, pri?:number}[]} input
   * @param {{algo:'FCFS'|'SJF'|'SRTF'|'PRIO'|'PRIO_P'|'RR'|'PRIO_RR', q?:number, tie?:'sjf'}} opt
   */
  function trace(input, opt) {
    const procs = input.map((p, index) => Object.assign({ index, rem: p.bt, finish: null }, p));
    const { algo, q, tie } = opt;
    const preemptive = algo === 'SRTF' || algo === 'PRIO_P';
    const slices = [];
    const queue = [];
    let admitted = 0;
    let t = 0;
    let current = null;

    const byArrival = procs.slice().sort((a, b) => a.at - b.at || a.index - b.index);
    const admit = (until) => {
      while (admitted < byArrival.length && byArrival[admitted].at <= until) queue.push(byArrival[admitted++]);
    };
    const prefer = (a, b) => {
      const key = (p) => {
        if (algo === 'SJF') return [p.bt];
        if (algo === 'SRTF') return [p.rem];
        if (algo === 'PRIO' || algo === 'PRIO_P') return tie === 'sjf' ? [p.pri, p.rem] : [p.pri];
        return [];
      };
      const ka = key(a);
      const kb = key(b);
      for (let i = 0; i < ka.length; i++) if (ka[i] !== kb[i]) return ka[i] - kb[i];
      if (preemptive && a === current) return -1;
      if (preemptive && b === current) return 1;
      return a.at - b.at || a.index - b.index;
    };
    const describe = (ready, p) => {
      const names = (fn) => ready.map(fn).join(', ');
      switch (algo) {
        case 'FCFS': return `Hazır: ${names((x) => x.pid)}. En erken gelen seçilir: <b>${p.pid}</b>.`;
        case 'SJF': return `Hazır (burst): ${names((x) => `${x.pid}=${x.bt}`)}. En kısa iş seçilir: <b>${p.pid}</b>.`;
        case 'SRTF': return `Kalan süreler: ${names((x) => `${x.pid}=${x.rem}`)}. En kısa kalan seçilir: <b>${p.pid}</b>.`;
        case 'RR': return `Kuyruk: ${names((x) => x.pid)}. Baştaki <b>${p.pid}</b> en fazla q=${q} çalışır.`;
        case 'PRIO_RR': {
          const top = Math.min(...ready.map((x) => x.pri));
          const peers = ready.filter((x) => x.pri === top);
          return `Hazır (öncelik no): ${names((x) => `${x.pid}=${x.pri}`)}. En yüksek öncelik ${top}: ${peers.length > 1 ? `${peers.map((x) => x.pid).join(', ')} aralarında RR yapar, sıradaki <b>${p.pid}</b> en fazla q=${q} çalışır.` : `bu öncelikte tek işlem <b>${p.pid}</b> var, bitene kadar çalışır.`}`;
        }
        default: return `Hazır (öncelik no): ${names((x) => `${x.pid}=${x.pri}`)}. En küçük numara en yüksek önceliktir: <b>${p.pid}</b>.`;
      }
    };

    while (procs.some((p) => p.finish === null)) {
      admit(t);
      if (!queue.length) {
        const next = byArrival[admitted].at;
        slices.push({ pid: null, s: t, e: next, reason: 'Hazır işlem yok, CPU boşta.' });
        t = next;
        current = null;
        continue;
      }

      let p;
      if (algo === 'RR') p = queue[0];
      else if (algo === 'PRIO_RR') { const top = Math.min(...queue.map((x) => x.pri)); p = queue.find((x) => x.pri === top); }
      else p = queue.slice().sort(prefer)[0];
      const reason = describe(queue, p);
      const preempted = preemptive && current && current !== p && current.finish === null ? current.pid : null;

      let run = p.rem;
      if (algo === 'RR') run = Math.min(q, p.rem);
      if (algo === 'PRIO_RR' && queue.some((x) => x !== p && x.pri === p.pri)) run = Math.min(q, p.rem);
      if (algo === 'PRIO_RR' && admitted < byArrival.length) run = Math.min(run, q);
      if (preemptive && admitted < byArrival.length) run = Math.min(run, byArrival[admitted].at - t);

      queue.splice(queue.indexOf(p), 1);
      const last = slices[slices.length - 1];
      if (preemptive && last && last.pid === p.pid) {
        last.e = t + run;
      } else {
        slices.push({ pid: p.pid, s: t, e: t + run, reason: preempted ? `${reason} ${preempted} kesilir.` : reason });
      }
      t += run;
      p.rem -= run;
      admit(t);
      if (p.rem === 0) p.finish = t;
      else queue.push(p);
      current = p;
    }

    const results = procs.map((p) => ({
      pid: p.pid, at: p.at, bt: p.bt, pri: p.pri,
      finish: p.finish,
      tat: p.finish - p.at,
      wt: p.finish - p.at - p.bt
    }));
    const avg = (key) => round(results.reduce((s, r) => s + r[key], 0) / results.length);
    return { slices, results, avgWt: avg('wt'), avgTat: avg('tat') };
  }

  OSLab.schedTrace = trace;
  if (typeof module !== 'undefined') module.exports = trace;
})(typeof window !== 'undefined' ? (window.OSLab = window.OSLab || {}) : {});
