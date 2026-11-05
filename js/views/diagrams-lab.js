/*
 * diagrams-lab.js — Bölüm 4–7 ve Shell derslerinin şekilleri.
 * Gantt şekilleri scheduler-trace.js ile hesaplanır, metin ve sayılar elle yazılmaz;
 * her biri diagrams.js'teki "stepper" türünü kullanır.
 */
(function (OSLab) {
  'use strict';

  const reg = OSLab.diagrams.register;

  /* ------------------------------------------------------------ Gantt */

  function gantt(id, rows, opt, intro) {
    const procs = rows.map(([pid, at, bt, pri]) => ({ pid, at, bt, pri }));
    const r = OSLab.schedTrace(procs, opt);
    const total = r.slices[r.slices.length - 1].e;
    const colorOf = (pid) => procs.findIndex((p) => p.pid === pid);
    const hasPri = rows[0][3] !== undefined;
    const keys = r.slices.map((_, i) => `s${i}`);

    const segs = r.slices.map((s, i) => `<div class="gt-seg ${s.pid ? `gt-c${colorOf(s.pid)}` : 'gt-idle'} ${(s.e - s.s) / total < 0.05 ? ' gt-narrow' : ''}" data-k="s${i}" style="left:${(s.s / total) * 100}%;width:${((s.e - s.s) / total) * 100}%">${s.pid || ''}</div>`).join('');
    const ticks = r.slices.map((s, i) => `<span class="gt-tick" data-k="s${i}" style="left:${(s.e / total) * 100}%">${s.e}</span>`).join('');

    const initSet = {};
    r.results.forEach((x) => { ['f', 'w', 't'].forEach((c) => { initSet[`${c}-${x.pid}`] = '–'; }); });

    const steps = r.slices.map((s, i) => {
      const done = r.results.find((x) => x.pid === s.pid && x.finish === s.e);
      const set = done ? { [`f-${s.pid}`]: done.finish, [`w-${s.pid}`]: done.wt, [`t-${s.pid}`]: done.tat } : {};
      const run = s.pid ? ` ${s.e - s.s} birim çalışır${done ? ` ve t=${s.e}'de biter: bekleme ${done.finish} − ${done.at} − ${done.bt} = <b>${done.wt}</b>.` : ` (t=${s.e}'ye kadar).`}` : '';
      return { on: [`s${i}`], hide: keys.slice(i + 1), set, text: `<b>t=${s.s}.</b> ${s.reason}${run}` };
    });
    const sum = (key) => r.results.map((x) => x[key]).join(' + ');
    steps.push({
      on: [],
      hide: [],
      text: `<b>Ortalama bekleme</b> = (${sum('wt')}) / ${r.results.length} = <b>${r.avgWt}</b> ms. <b>Ortalama turnaround</b> = (${sum('tat')}) / ${r.results.length} = <b>${r.avgTat}</b> ms.`
    });

    reg(id, {
      kind: 'stepper',
      intro: intro || 'İleri ile çizelgeyi adım adım kur.',
      initSet,
      initHide: keys,
      steps,
      html: `<div class="gt"><div class="gt-track">${segs}</div><div class="gt-axis"><span class="gt-tick" style="left:0">0</span>${ticks}</div></div>
        <div class="table-wrap l-table gt-table"><table><thead><tr><th>İşlem</th><th>Geliş</th><th>Burst</th>${hasPri ? '<th>Öncelik</th>' : ''}<th>Bitiş</th><th><span class="gt-long">Bekleme</span><span class="gt-short">WT</span></th><th><span class="gt-long">Turnaround</span><span class="gt-short">TAT</span></th></tr></thead><tbody>
        ${r.results.map((x) => `<tr><td><b>${x.pid}</b></td><td>${x.at}</td><td>${x.bt}</td>${hasPri ? `<td>${x.pri}</td>` : ''}<td data-v="f-${x.pid}">–</td><td data-v="w-${x.pid}">–</td><td data-v="t-${x.pid}">–</td></tr>`).join('')}
        </tbody></table></div>`
    });
  }

  const LAB_FCFS = [['P1', 0, 24], ['P2', 0, 3], ['P3', 0, 3]];
  const LAB_PRIO = [['P1', 0, 10, 3], ['P2', 1, 1, 1], ['P3', 2, 2, 4], ['P4', 3, 1, 5], ['P5', 4, 5, 2]];
  const HW1 = [['P1', 0, 10], ['P2', 0, 8], ['P3', 0, 6], ['P4', 0, 4]];
  const HW5 = [['P1', 0, 16], ['P2', 0, 10], ['P3', 0, 1], ['P4', 0, 5]];

  gantt('g-fcfs1', LAB_FCFS, { algo: 'FCFS' }, 'Sıra P1, P2, P3. Uzun iş önde.');
  gantt('g-fcfs2', [['P2', 0, 3], ['P3', 0, 3], ['P1', 0, 24]], { algo: 'FCFS' }, 'Aynı işler, sıra P2, P3, P1. Uzun iş sonda.');
  gantt('g-sjf', [['P1', 0, 6], ['P2', 0, 8], ['P3', 0, 7], ['P4', 0, 3]], { algo: 'SJF' }, 'Hepsi t=0\'da hazır. En kısa iş önce çalışır.');
  gantt('g-srtf', [['P1', 0, 8], ['P2', 1, 4], ['P3', 2, 9], ['P4', 3, 5]], { algo: 'SRTF' }, 'İşler farklı anlarda gelir. Her gelişte kalan süreler karşılaştırılır.');
  gantt('g-prio-p', LAB_PRIO, { algo: 'PRIO_P' }, 'Kesmeli: daha yüksek öncelikli iş gelince CPU hemen ona geçer.');
  gantt('g-prio-n', LAB_PRIO, { algo: 'PRIO' }, 'Kesmesiz: çalışan iş bitmeden CPU bırakılmaz; seçim ancak iş bitince yapılır.');
  gantt('g-rr4', LAB_FCFS, { algo: 'RR', q: 4 }, 'q=4. Her iş en fazla 4 birim çalışır, bitmediyse kuyruğun sonuna döner.');
  gantt('g-prio-slide', [['P1', 0, 10, 3], ['P2', 0, 1, 1], ['P3', 0, 2, 4], ['P4', 0, 1, 5], ['P5', 0, 5, 2]], { algo: 'PRIO' }, 'Slayt 5.26: hepsi t=0\'da hazır. Küçük numara yüksek önceliktir.');

  gantt('hw1a', HW1, { algo: 'FCFS' });
  gantt('hw1b', HW1, { algo: 'SJF' });
  gantt('hw2', [['P1', 0, 10], ['P2', 0, 5], ['P3', 0, 8], ['P4', 0, 12]], { algo: 'RR', q: 2 });
  gantt('hw3', [['P1', 5, 6], ['P2', 0, 8], ['P3', 1, 7], ['P4', 6, 3]], { algo: 'SRTF' });
  gantt('hw4p', LAB_PRIO, { algo: 'PRIO_P' }, 'Kesmeli çözüm.');
  gantt('hw4n', LAB_PRIO, { algo: 'PRIO' }, 'Kesmesiz çözüm.');
  gantt('hw5q3', HW5, { algo: 'RR', q: 3 }, 'q=3');
  gantt('hw5q4', HW5, { algo: 'RR', q: 4 }, 'q=4');
  gantt('hw5q5', HW5, { algo: 'RR', q: 5 }, 'q=5');
  gantt('hw6', [['P1', 0, 8, 2], ['P2', 1, 3, 1], ['P3', 2, 6, 3], ['P4', 3, 1, 2], ['P5', 2, 4, 1], ['P6', 4, 5, 3]], { algo: 'PRIO_P', tie: 'sjf' });

  /* ------------------------------------------------------------ ölçütler */

  const TL = [['w1', 2, 4, 'gt-wait', 'bekler'], ['r1', 4, 6, 'gt-c0', 'çalışır'], ['w2', 6, 9, 'gt-wait', 'bekler'], ['r2', 9, 12, 'gt-c0', 'çalışır']];
  reg('metrics', {
    kind: 'explorer',
    hint: 'Bir ölçüte tıkla. Örnek işlem t=2\'de gelir, burst süresi 5\'tir, t=12\'de biter.',
    html: `<div class="gt"><div class="gt-track">${TL.map(([k, s, e, c, t]) => `<div class="gt-seg ${c}" data-k="${k}" style="left:${(s / 12) * 100}%;width:${((e - s) / 12) * 100}%">${t}</div>`).join('')}</div>
      <div class="gt-axis">${[0, 2, 4, 6, 9, 12].map((x) => `<span class="gt-tick" style="left:${(x / 12) * 100}%">${x}</span>`).join('')}</div></div>
      <div class="dg-row gt-metrics">
        <div class="dg-b" data-k="tat"><b>Turnaround</b><small>12 − 2 = 10</small></div>
        <div class="dg-b" data-k="wt"><b>Bekleme</b><small>10 − 5 = 5</small></div>
        <div class="dg-b" data-k="rt"><b>Yanıt</b><small>4 − 2 = 2</small></div>
      </div>`,
    info: {
      tat: { text: '<b>Turnaround</b> = bitiş − geliş. İşlemin sistemde geçirdiği toplam süre: 12 − 2 = 10.', hl: ['w1', 'r1', 'w2', 'r2'] },
      wt: { text: '<b>Bekleme</b> = turnaround − burst. Hazır kuyruğunda geçen toplam süre: 2 + 3 = 5, yani 10 − 5.', hl: ['w1', 'w2'] },
      rt: { text: '<b>Yanıt</b> = ilk çalışma − geliş. İlk kez CPU alana kadar geçen süre: 4 − 2 = 2.', hl: ['w1'] }
    }
  });

  /* ------------------------------------------------------------ ls -l alanları */

  const LS = [
    ['type', '-', 'Dosya türü: <code>-</code> normal dosya, <code>d</code> dizin, <code>l</code> sembolik bağ, <code>c</code> karakter aygıtı, <code>b</code> blok aygıtı, <code>p</code> adlandırılmış pipe, <code>s</code> soket.'],
    ['owner', 'rwx', 'Dosya <b>sahibinin</b> izinleri: okuma, yazma, çalıştırma.'],
    ['group', 'r-x', 'Dosya <b>grubunun</b> izinleri: okuma ve çalıştırma var, yazma yok.'],
    ['other', '---', '<b>Diğer kullanıcıların</b> izinleri: hiç izin yok.'],
    ['links', '1', 'Dosyaya bağlı sabit bağ (hard link) sayısı.'],
    ['user', 'ali', 'Dosyanın sahibi (owner).'],
    ['grp', 'ogr', 'Dosyanın grubu (group).'],
    ['size', '19', 'Bayt cinsinden boyut.'],
    ['date', 'Oct 9 14:14', 'Son değiştirme ayı, günü ve saati.'],
    ['name', 'test.sh', 'Dosya adı.']
  ];
  reg('lsl', {
    kind: 'explorer',
    hint: '<code>ls -l</code> çıktısının bir alanına tıkla.',
    html: `<div class="dg-ls">${LS.map(([k, t]) => `<span class="dg-b dg-mini" data-k="${k}"><b>${t}</b></span>`).join('')}</div>`,
    info: Object.fromEntries(LS.map(([k, , d]) => [k, d]))
  });

  /* ------------------------------------------------------------ chmod hesaplayıcı */

  const WHO = [['u', 'Sahip (u)'], ['g', 'Grup (g)'], ['o', 'Diğer (o)']];
  const PERM = [['r', 4, 'okuma'], ['w', 2, 'yazma'], ['x', 1, 'çalıştırma']];
  reg('chmod', {
    kind: 'custom',
    render() {
      return `<figure class="dg dg-chmod" data-dg="chmod">
        <div class="table-wrap"><table class="chmod-t"><thead><tr><th></th>${PERM.map(([p, v, d]) => `<th>${p} <small>${d} = ${v}</small></th>`).join('')}<th>Toplam</th></tr></thead><tbody>
        ${WHO.map(([w, l]) => `<tr><th>${l}</th>${PERM.map(([p, v]) => `<td><input type="checkbox" aria-label="${l} ${p}" data-w="${w}" data-v="${v}"></td>`).join('')}<td class="chmod-sum" data-sum="${w}">0</td></tr>`).join('')}
        </tbody></table></div>
        <figcaption class="dg-caption chmod-out"></figcaption>
      </figure>`;
    },
    init(el) {
      const boxes = [...el.querySelectorAll('input')];
      const start = { u: 7, g: 5, o: 0 };
      boxes.forEach((b) => { b.checked = (start[b.dataset.w] & Number(b.dataset.v)) !== 0; });
      const draw = () => {
        let digits = '';
        let text = '-';
        WHO.forEach(([w]) => {
          const row = boxes.filter((b) => b.dataset.w === w);
          const sum = row.filter((b) => b.checked).reduce((s, b) => s + Number(b.dataset.v), 0);
          el.querySelector(`[data-sum="${w}"]`).textContent = sum;
          digits += sum;
          text += PERM.map(([p, v]) => (sum & v ? p : '-')).join('');
        });
        el.querySelector('.chmod-out').innerHTML = `<code>chmod ${digits} dosya</code> → <code>ls -l</code> çıktısında <code>${text}</code>`;
      };
      el.addEventListener('change', draw);
      draw();
    }
  });

  /* ------------------------------------------------------------ Bölüm 4–7 yardımcıları */

  const box = (k, title, sub, cls) => `<div class="dg-b${cls ? ' ' + cls : ''}" data-k="${k}"><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</div>`;
  const rowOf = (...xs) => `<div class="dg-row">${xs.join('')}</div>`;
  const colOf = (...xs) => `<div class="dg-col">${xs.join('')}</div>`;
  const vars = (items) => `<div class="dg-row dg-vars">${items.map(([k, label]) => `<div class="dg-b dg-mini"><small>${label}</small><b data-v="${k}"></b></div>`).join('')}</div>`;

  reg('mlfq', {
    kind: 'stepper',
    intro: 'Slayt 5.32: 30 ms\'lik yeni bir iş bu üç kuyrukta nasıl ilerler?',
    html: colOf(
      box('q0', 'Q0 · RR, q = 8 ms', 'yeni işler buraya girer'),
      box('q1', 'Q1 · RR, q = 16 ms', 'Q0\'da bitmeyenler'),
      box('q2', 'Q2 · FCFS', 'Q1\'de bitmeyenler')
    ) + vars([['left', 'kalan süre']]),
    initSet: { left: '30 ms' },
    steps: [
      { on: ['q0'], set: { left: '30 ms' }, text: 'Yeni iş <b>Q0</b>\'a girer ve CPU\'yu alınca en fazla 8 ms çalışır.' },
      { on: ['q0'], set: { left: '22 ms' }, text: '8 ms içinde bitmedi: kalan 22 ms. İş <b>Q1</b>\'e indirgenir.' },
      { on: ['q1'], set: { left: '6 ms' }, text: 'Q1\'de 16 ms daha çalışır, kalan 6 ms. Hâlâ bitmedi, <b>Q2</b>\'ye iner.' },
      { on: ['q2'], set: { left: '0 ms' }, text: 'Q2\'de FCFS ile çalışır ve biter. Kısa işler üst kuyruklarda çabuk biter; uzun işler alta iner.' }
    ]
  });

  const threadRow = (n, cls) => Array.from({ length: n }, (_, i) => `<div class="dg-b dg-mini${cls ? ' ' + cls : ''}"><b>${cls ? 'çekirdek' : 'kullanıcı'} ${i + 1}</b></div>`).join('');
  reg('tmodels', {
    kind: 'tabs',
    panes: [
      { label: 'Çoktan-bire', html: colOf(rowOf(threadRow(4)), '<div class="dg-ar dg-ar-down">↓</div>', rowOf(threadRow(1, 'dg-os')), '<p class="hint">Bir iş parçacığı bloklanırsa hepsi bloklanır. Aynı anda yalnızca biri çekirdekte olabilir, paralel çalışamazlar.</p>') },
      { label: 'Bire-bir', html: colOf(rowOf(threadRow(4)), '<div class="dg-ar dg-ar-down">↓ ↓ ↓ ↓</div>', rowOf(threadRow(4, 'dg-os')), '<p class="hint">Her kullanıcı iş parçacığı için çekirdek iş parçacığı oluşur. Eşzamanlılık iyidir; ek yük yüzünden sayı sınırlanabilir.</p>') },
      { label: 'Çoktan-çoğa', html: colOf(rowOf(threadRow(4)), '<div class="dg-ar dg-ar-down">⇣ çoklanır ⇣</div>', rowOf(threadRow(3, 'dg-os')), '<p class="hint">İşletim sistemi yeterli sayıda çekirdek iş parçacığı oluşturabilir.</p>') },
      { label: 'İki seviyeli', html: colOf(rowOf(threadRow(4)), '<div class="dg-ar dg-ar-down">⇣ çoklanır, biri bağlı ⇣</div>', rowOf(threadRow(3, 'dg-os')), '<p class="hint">Çoktan-çoğa gibidir, ayrıca bir kullanıcı iş parçacığı bir çekirdek iş parçacığına bağlanabilir.</p>') }
    ]
  });

  reg('amdahl', {
    kind: 'custom',
    render() {
      return `<figure class="dg dg-amdahl" data-dg="amdahl">
        <label class="dg-range">Seri kısım S: <b data-a="s">%25</b><input type="range" min="0" max="90" step="5" value="25" data-i="s" aria-label="Seri kısım yüzdesi"></label>
        <label class="dg-range">Çekirdek sayısı N: <b data-a="n">2</b><input type="range" min="1" max="64" step="1" value="2" data-i="n" aria-label="Çekirdek sayısı"></label>
        <p class="chmod-out" data-a="out"></p>
      </figure>`;
    },
    init(el) {
      const draw = () => {
        const s = Number(el.querySelector('[data-i="s"]').value) / 100;
        const n = Number(el.querySelector('[data-i="n"]').value);
        const speed = 1 / (s + (1 - s) / n);
        const limit = s ? (1 / s).toFixed(2) : 'sınırsız';
        el.querySelector('[data-a="s"]').textContent = `%${Math.round(s * 100)}`;
        el.querySelector('[data-a="n"]').textContent = n;
        el.querySelector('[data-a="out"]').innerHTML = `Hızlanma = 1 / (${s.toFixed(2)} + ${(1 - s).toFixed(2)} / ${n}) = <b>${speed.toFixed(2)} kat</b>. N sonsuza giderken üst sınır: <b>${limit}</b>.`;
      };
      el.addEventListener('input', draw);
      draw();
    }
  });

  reg('peterson', {
    kind: 'stepper',
    intro: 'Peterson çözümü: P0 ve P1 aynı anda girmeye çalışıyor. Son yazılan turn kimi bekletiyor?',
    html: rowOf(box('p0', 'P0'), box('cs', 'Kritik bölüm', '', 'dg-os'), box('p1', 'P1')) + vars([['f0', 'flag[0]'], ['f1', 'flag[1]'], ['turn', 'turn']]),
    initSet: { f0: 'false', f1: 'false', turn: '–' },
    steps: [
      { on: ['p0'], set: { f0: 'true', f1: 'false', turn: '–' }, text: 'P0 hazır olduğunu bildirir: <code>flag[0] = true</code>.' },
      { on: ['p1'], set: { f0: 'true', f1: 'true', turn: '–' }, text: 'P1 de hazır: <code>flag[1] = true</code>.' },
      { on: ['p0'], set: { f0: 'true', f1: 'true', turn: '1' }, text: 'P0 sırayı karşı tarafa verir: <code>turn = 1</code>.' },
      { on: ['p1'], set: { f0: 'true', f1: 'true', turn: '0' }, text: 'P1 de verir: <code>turn = 0</code>. <b>Son yazan sırayı kaybeder.</b> turn yalnızca bir değer tutabildiği için ikisi birden giremez.' },
      { on: ['p0', 'cs'], set: { f0: 'true', f1: 'true', turn: '0' }, text: 'P0\'ın koşulu <code>flag[1] &amp;&amp; turn == 1</code> yanlış: P0 kritik bölüme girer. P1 döngüde bekler.' },
      { on: ['p0'], set: { f0: 'false', f1: 'true', turn: '0' }, text: 'P0 çıkar: <code>flag[0] = false</code>.' },
      { on: ['p1', 'cs'], set: { f0: 'false', f1: 'true', turn: '0' }, text: 'P1\'in koşulu artık yanlış: P1 girer. P0 tekrar istese bile en fazla bir giriş bekler; <b>sınırlı bekleme</b> sağlanır.' }
    ]
  });

  reg('semtrace', {
    kind: 'stepper',
    intro: 'Meşgul beklemesiz semafor. S = 1 ile P1, P2 ve P3 aynı kaynağı istiyor.',
    html: rowOf(box('p1', 'P1'), box('p2', 'P2'), box('p3', 'P3')) + vars([['v', 'S->value'], ['q', 'bekleme kuyruğu'], ['cs', 'kritik bölümde']]),
    initSet: { v: '1', q: 'boş', cs: 'kimse' },
    steps: [
      { on: ['p1'], set: { v: '0', q: 'boş', cs: 'P1' }, text: 'P1 <code>wait</code>: value 1 → 0. Negatif değil, P1 girer.' },
      { on: ['p2'], set: { v: '-1', q: 'P2', cs: 'P1' }, text: 'P2 <code>wait</code>: value −1. Negatif olduğu için P2 kuyruğa eklenir ve <b>block()</b> ile uyur; CPU harcamaz.' },
      { on: ['p3'], set: { v: '-2', q: 'P2, P3', cs: 'P1' }, text: 'P3 <code>wait</code>: value −2. <b>Negatif değerin mutlak değeri bekleyen işlem sayısıdır.</b>' },
      { on: ['p1', 'p2'], set: { v: '-1', q: 'P3', cs: 'P2' }, text: 'P1 <code>signal</code>: value −1. Hâlâ ≤ 0, yani bekleyen var: <b>wakeup(P2)</b>.' },
      { on: ['p2', 'p3'], set: { v: '0', q: 'boş', cs: 'P3' }, text: 'P2 <code>signal</code>: value 0 ve wakeup(P3).' },
      { on: ['p3'], set: { v: '1', q: 'boş', cs: 'kimse' }, text: 'P3 <code>signal</code>: value 1. Kuyruk boş, semafor başlangıç değerine döndü.' }
    ]
  });

  reg('deadlock', {
    kind: 'stepper',
    intro: 'S ve Q semaforları 1. P0 önce S, P1 önce Q istiyor (slayt 6.58).',
    html: rowOf(box('p0', 'P0', 'wait(S); wait(Q);'), box('p1', 'P1', 'wait(Q); wait(S);')) + vars([['s', 'S'], ['q', 'Q'], ['st', 'durum']]),
    initSet: { s: '1', q: '1', st: 'çalışıyor' },
    steps: [
      { on: ['p0'], set: { s: '0', q: '1', st: 'P0, S\'yi aldı' }, text: 'P0 <code>wait(S)</code> ile S\'yi alır. Tam bu sırada P1\'e geçilir.' },
      { on: ['p1'], set: { s: '0', q: '0', st: 'P1, Q\'yu aldı' }, text: 'P1 <code>wait(Q)</code> ile Q\'yu alır.' },
      { on: ['p0'], set: { s: '0', q: '0', st: 'P0, Q\'yu bekliyor' }, text: 'P0 <code>wait(Q)</code>: Q\'yu ancak P1 bırakabilir, P0 bekler.' },
      { on: ['p0', 'p1'], set: { s: '0', q: '0', st: 'KİLİTLENME' }, text: 'P1 <code>wait(S)</code>: S\'yi ancak P0 bırakabilir. İki taraf da <code>signal</code>\'e ulaşamaz: <b>kilitlenme</b>.' }
    ]
  });

  reg('philosophers', {
    kind: 'stepper',
    intro: 'Semafor çözümü: her filozof önce solundaki, sonra sağındaki çubuğu alır.',
    html: rowOf(...[0, 1, 2, 3, 4].map((i) => box(`f${i}`, `F${i}`, `çubuk ${i} ve ${(i + 1) % 5}`))) + vars([['free', 'boştaki çubuk'], ['st', 'durum']]),
    initSet: { free: '5', st: 'hepsi düşünüyor' },
    steps: [
      { on: ['f0'], set: { free: '4', st: 'F0 çubuk 0\'ı aldı' }, text: 'F0 acıkır, <code>wait(chopstick[0])</code>. Tam bu sırada bağlam değişir.' },
      { on: ['f0', 'f1'], set: { free: '3', st: 'F1 çubuk 1\'i aldı' }, text: 'F1 de sol çubuğunu alır.' },
      { on: ['f0', 'f1', 'f2', 'f3'], set: { free: '1', st: 'F2 ve F3 de aldı' }, text: 'F2 ve F3 aynı şekilde alır. Tek çubuk kaldı.' },
      { on: ['f0', 'f1', 'f2', 'f3', 'f4'], set: { free: '0', st: 'KİLİTLENME' }, text: 'F4 çubuk 4\'ü alır. Şimdi herkes sağındaki çubuğu bekliyor ve kimse bırakmıyor: <b>kilitlenme</b>.' }
    ]
  });

  reg('rwtrace', {
    kind: 'stepper',
    intro: 'İlk okuyucu yazarı kilitler, son okuyucu kilidi bırakır.',
    html: rowOf(box('r1', 'Okuyucu 1'), box('r2', 'Okuyucu 2'), box('w', 'Yazar')) + vars([['c', 'read_count'], ['rw', 'rw_mutex'], ['st', 'durum']]),
    initSet: { c: '0', rw: '1', st: 'boşta' },
    steps: [
      { on: ['r1'], set: { c: '1', rw: '0', st: 'R1 okuyor' }, text: 'R1 geldi: read_count 1 oldu. <b>İlk okuyucu</b> olduğu için <code>wait(rw_mutex)</code> yapar.' },
      { on: ['r2'], set: { c: '2', rw: '0', st: 'R1 ve R2 okuyor' }, text: 'R2 geldi: read_count 2. rw_mutex\'e dokunmaz; okuyucular <b>birlikte</b> okuyabilir.' },
      { on: ['w'], set: { c: '2', rw: '0', st: 'yazar bekliyor' }, text: 'Yazar <code>wait(rw_mutex)</code> yapar ve bekler. Yeni okuyucular gelmeye devam ederse yazar hiç yazamayabilir.' },
      { on: ['r1'], set: { c: '1', rw: '0', st: 'R2 okuyor' }, text: 'R1 çıktı: read_count 1. Son okuyucu değil, kilit durur.' },
      { on: ['r2', 'w'], set: { c: '0', rw: '0', st: 'yazar yazıyor' }, text: 'R2 çıktı: read_count 0. <b>Son okuyucu</b> <code>signal(rw_mutex)</code> yapar, bekleyen yazar uyanır.' },
      { on: ['w'], set: { c: '0', rw: '1', st: 'boşta' }, text: 'Yazar bitince <code>signal(rw_mutex)</code> yapar.' }
    ]
  });

  /* ------------------------------------------------------------ pipe */

  reg('pipe', {
    kind: 'stepper',
    intro: 'Soru: <code>notlar.txt</code> içinde "elma" kelimesi kaç kez geçiyor?',
    html: `<div class="dg-row dg-pipe">
        <div class="dg-b" data-k="cat"><b>cat notlar.txt</b><small>dosyayı akıtır</small></div><div class="dg-ar">→</div>
        <div class="dg-b" data-k="grep"><b>grep -o 'elma'</b><small>eşleşmeleri ayıklar</small></div><div class="dg-ar">→</div>
        <div class="dg-b" data-k="wc"><b>wc -l</b><small>satır sayar</small></div>
      </div>
      <pre class="l-code dg-pipe-out" data-v="out"></pre>`,
    initSet: { out: 'elma ve armut\nkiraz\nelma elma' },
    steps: [
      { on: ['cat'], set: { out: 'elma ve armut\nkiraz\nelma elma' }, text: '<code>cat</code> dosyanın üç satırını standart çıktıya yazar. Pipe (<code>|</code>) bu çıktıyı ekran yerine bir sonraki komutun girdisine bağlar.' },
      { on: ['grep'], set: { out: 'elma\nelma\nelma' }, text: '<code>grep -o</code> satırın tamamını değil, yalnızca eşleşen kelimeyi yazar; her eşleşme ayrı satır olur. Bu yüzden aynı satırdaki iki "elma" da sayılabilir.' },
      { on: ['wc'], set: { out: '3' }, text: '<code>wc -l</code> gelen satırları sayar: sonuç <b>3</b>. Komutlar ayrı işlemlerdir; pipe, Bölüm 3\'te gördüğün işlemler arası iletişimin (IPC) kabuktaki karşılığıdır.' }
    ]
  });
})(window.OSLab = window.OSLab || {});
