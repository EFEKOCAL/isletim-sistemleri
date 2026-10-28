/*
 * architecture.js — "System & Architecture" modülünün saf (DOM'dan bağımsız) çekirdeği.
 *
 * 1) Çift modlu çalışma: bir sistem çağrısının (ve ayrıcalıklı komut ihlalinin) adım adım durumları.
 *    Sıra Silberschatz Şekil 1.13 ile aynıdır: kullanıcı modunda trap komutu → donanım mode bit'i 0 yapar
 *    → çekirdek işi yapar → return-from-trap mode bit'i 1 yapar. Kayıt adları x86-64 Linux ABI'sinden alınmıştır.
 * 2) Derleme → bağlama → yükleme: nesne dosyası, sembol çözümleme ve yükleme anı yeniden konumlandırması
 *    (load-time binding). Adresler, kitaptaki örnekle uyumlu olsun diye ondalıktır
 *    (yeniden konumlandırma yazmacı 14000 + mantıksal 346 = fiziksel 14346).
 * 3) Monolitik ve mikroçekirdek mimarilerinde bir read() isteğinin izlediği yol.
 */
(function (OSLab) {
  'use strict';

  /* ====================================================================
   * 1) User mode / Kernel mode
   * ==================================================================== */

  const SYSCALLS = {
    read: {
      nr: 0, call: 'n = read(fd, buf, 128);', args: { rdi: '3 (fd)', rsi: '&buf', rdx: '128' },
      ret: '128', retText: 'okunan bayt sayısı', service: 'sys_read', device: 'Disk',
      work: 'Dosya sistemi dosyanın disk bloklarını bulur, disk sürücüsü veriyi okur ve çekirdek veriyi kullanıcının buf alanına kopyalar. Veri hazır değilse işlem waiting durumuna alınır, CPU başka işleme verilir.'
    },
    write: {
      nr: 1, call: 'write(1, msg, 14);', args: { rdi: '1 (stdout)', rsi: '&msg', rdx: '14' },
      ret: '14', retText: 'yazılan bayt sayısı', service: 'sys_write', device: 'Terminal',
      work: 'Çekirdek msg tamponunu kullanıcı alanından güvenli biçimde kopyalar ve terminal sürücüsüne iletir.'
    },
    open: {
      nr: 2, call: 'fd = open("notlar.txt", O_RDONLY);', args: { rdi: '&"notlar.txt"', rsi: 'O_RDONLY', rdx: '—' },
      ret: '3', retText: 'yeni dosya tanımlayıcısı (fd)', service: 'sys_open', device: 'Disk',
      work: 'Dosya sistemi yol adını çözümler, erişim izinlerini denetler ve işlemin açık dosya tablosuna bir girdi ekler.'
    },
    fork: {
      nr: 57, call: 'pid = fork();', args: { rdi: '—', rsi: '—', rdx: '—' },
      ret: '4242', retText: 'ebeveynde çocuğun PID\'i (çocukta 0 döner)', service: 'sys_fork', device: null,
      work: 'Çekirdek yeni bir PCB oluşturur, ebeveynin adres alanını copy-on-write ile paylaştırır ve çocuğu hazır kuyruğuna ekler.'
    }
  };

  const USER_PC = 'main+0x2c';

  /**
   * Bir sistem çağrısının adımları. Her adım ekranın o andaki tam durumunu taşır:
   * mode, odaklanan düğüm, yazmaçlar, PCB içeriği, işlem durumu.
   */
  function syscallSteps(name) {
    const sc = SYSCALLS[name];
    if (!sc) throw new Error('Bilinmeyen sistem çağrısı: ' + name);
    const idle = { PC: USER_PC, rax: '?', rdi: '—', rsi: '—', rdx: '—' };
    const prepared = { PC: `${name}@libc+0x10`, rax: `${sc.nr} (${name})`, rdi: sc.args.rdi, rsi: sc.args.rsi, rdx: sc.args.rdx };
    const saved = Object.assign({}, prepared, { PC: `${name}@libc+0x12` }); // trap'ten sonraki komut
    const kernel = (PC, extra) => Object.assign({}, prepared, { PC }, extra || {});

    return [
      {
        mode: 1, node: 'app', regs: idle, pcb: null, proc: 'running',
        title: `Program ${name}() çağırır`,
        text: `<code>${sc.call}</code> Bu bir API (kütüphane) çağrısıdır, henüz sistem çağrısı değildir. Program kullanıcı modunda çalışıyor.`
      },
      {
        mode: 1, node: 'lib', regs: prepared, pcb: null, proc: 'running',
        title: 'libc sarmalayıcısı parametreleri hazırlar',
        text: `Sistem çağrısı numarası <b>rax = ${sc.nr}</b>, parametreler <b>rdi, rsi, rdx</b> yazmaçlarına yazılır (x86-64 Linux ABI). Parametre aktarımı yazmaçlarla, bellekteki bir blokla veya yığınla yapılabilir.`
      },
      {
        mode: 1, node: 'gate', regs: prepared, pcb: null, proc: 'running', cross: 'down',
        title: 'Trap: syscall komutu (yazılım kesmesi)',
        text: 'Kullanıcı modunda <code>syscall</code> komutu çalışır. Bu, kullanıcı programının çekirdeğe kontrollü biçimde girmesinin tek yoludur. Trap henüz kullanıcı modunda üretilir.'
      },
      {
        mode: 0, node: 'entry', regs: kernel('entry_SYSCALL_64'), pcb: null, proc: 'running',
        title: 'Donanım mode bit\'i 0 yapar',
        text: 'CPU trap\'i işlerken <b>çekirdek moduna geçer (mode bit = 0)</b> ve önceden ayarlanmış çekirdek giriş noktasına atlar. Artık ayrıcalıklı komutlar çalıştırılabilir.'
      },
      {
        mode: 0, node: 'pcb', regs: kernel('entry_SYSCALL_64+0x1e'), pcb: { state: 'saved', regs: saved }, proc: 'running',
        title: 'Bağlam kaydı (context save)',
        text: 'Kullanıcı programının PC\'si, yazmaçları ve işlemci durumu işlemin çekirdek yığınına / PCB\'sine kaydedilir. Böylece işlem daha sonra kaldığı yerden devam edebilir.'
      },
      {
        mode: 0, node: 'table', regs: kernel(`sys_call_table[${sc.nr}]`), pcb: { state: 'saved', regs: saved }, proc: 'running',
        title: 'Sistem çağrısı tablosu',
        text: `rax = ${sc.nr} → <code>sys_call_table[${sc.nr}] = ${sc.service}</code>. Çekirdek numarayı ve parametreleri doğrular (ör. işaretçiler gerçekten kullanıcı alanını mı gösteriyor?).`
      },
      {
        mode: 0, node: 'service', regs: kernel(sc.service), pcb: { state: 'saved', regs: saved }, proc: 'running', device: sc.device,
        title: `${sc.service}() çekirdek modunda çalışır`,
        text: sc.work
      },
      {
        mode: 0, node: 'service', regs: kernel(`${sc.service}+0x9c`, { rax: sc.ret }), pcb: { state: 'saved', regs: saved }, proc: 'running',
        title: 'Dönüş değeri hazırlanır',
        text: `Sonuç (<b>${sc.ret}</b>: ${sc.retText}) rax'e yazılır. Hata olsaydı negatif bir değer dönerdi; libc bunu −1 ve <code>errno</code> olarak programa iletir.`
      },
      {
        mode: 0, node: 'pcb', regs: Object.assign({}, saved, { rax: sc.ret }), pcb: { state: 'restored', regs: saved }, proc: 'running',
        title: 'Bağlam geri yüklenir (context restore)',
        text: 'PC ve yazmaçlar PCB\'deki kayıttan geri yüklenir. Yalnızca rax, dönüş değerini taşıdığı için yeni değerini korur.'
      },
      {
        mode: 1, node: 'gate', regs: Object.assign({}, saved, { rax: sc.ret }), pcb: { state: 'restored', regs: saved }, proc: 'running', cross: 'up',
        title: 'Return-from-trap: mode bit = 1',
        text: '<code>sysret</code> komutu <b>mode bit\'i 1 yapar</b> ve syscall\'dan hemen sonraki kullanıcı komutuna döner. Bu komut ayrıcalıklıdır, yalnızca çekirdek çalıştırabilir.'
      },
      {
        mode: 1, node: 'app', regs: { PC: 'main+0x31', rax: sc.ret, rdi: '—', rsi: '—', rdx: '—' }, pcb: null, proc: 'running',
        title: `${name}() ${sc.ret} döndürür`,
        text: `Sarmalayıcı dönüş değerini programa iletir (${sc.retText}). Program kullanıcı modunda kaldığı yerden devam eder.`
      }
    ];
  }

  /** Kullanıcı modunda ayrıcalıklı komut denemesi → istisna → işlem sonlandırılır */
  function illegalSteps() {
    const regs = { PC: 'main+0x40', rax: '?', rdi: '—', rsi: '—', rdx: '—' };
    const k = (PC) => Object.assign({}, regs, { PC });
    const saved = { state: 'saved', regs };
    return [
      {
        mode: 1, node: 'app', regs, pcb: null, proc: 'running', bad: true,
        title: 'Program ayrıcalıklı bir komut dener',
        text: '<code>cli</code> (kesmeleri kapat) gibi ayrıcalıklı bir komut kullanıcı modunda çalıştırılmak isteniyor. Kesmeleri kapatabilen bir program zamanlayıcıyı ve tüm sistemi kilitleyebilirdi.'
      },
      {
        mode: 0, node: 'entry', regs: k('exc_general_protection'), pcb: null, proc: 'running', cross: 'down', bad: true,
        title: 'Donanım komutu çalıştırmaz → istisna',
        text: 'Mode bit 1 iken ayrıcalıklı komut <b>donanım tarafından reddedilir</b>. Komut yürütülmez; bunun yerine bir istisna (trap / general protection fault) üretilir ve CPU çekirdek moduna geçer.'
      },
      {
        mode: 0, node: 'pcb', regs: k('exc_general_protection+0x12'), pcb: saved, proc: 'running', bad: true,
        title: 'Bağlam kaydedilir',
        text: 'Hatanın oluştuğu andaki PC ve yazmaçlar hata ayıklama için saklanır.'
      },
      {
        mode: 0, node: 'service', regs: k('force_sig(SIGSEGV)'), pcb: saved, proc: 'running', bad: true, handler: 'GP fault handler',
        title: 'Çekirdek işleme hata sinyali gönderir',
        text: 'İşletim sistemi bunu programın hatası sayar ve işleme sinyal gönderir (Linux\'ta bu durumda <b>SIGSEGV</b>). Programın sinyali yakalayan bir işleyicisi yoksa varsayılan eylem sonlandırmadır.'
      },
      {
        mode: 0, node: 'dump', regs: k('do_coredump'), pcb: saved, proc: 'terminated', bad: true,
        title: 'Core dump yazılır',
        text: 'Hata bilgisi log dosyasına yazılır ve işlemin bellek görüntüsü <b>core dump</b> dosyasına kaydedilir. Programcı bunu daha sonra hata ayıklayıcıyla inceleyebilir (ör. <code>gdb ./main core</code>).'
      },
      {
        mode: 1, node: 'app', regs: { PC: '—', rax: '—', rdi: '—', rsi: '—', rdx: '—' }, pcb: null, proc: 'terminated', cross: 'up', bad: true,
        title: 'İşlem sonlandırıldı',
        text: 'PCB serbest bırakılır, zamanlayıcı başka bir işlem seçer ve CPU o işlemle <b>kullanıcı moduna (mode bit = 1)</b> döner. Sistemin geri kalanı etkilenmez; çift modlu çalışmanın amacı tam olarak budur.'
      }
    ];
  }

  /* ====================================================================
   * 2) Derleme → Bağlama → Yükleme
   * ==================================================================== */

  const BUILD_STAGES = [
    { id: 'source', kind: 'file', label: 'main.c', sub: 'Kaynak kod' },
    { id: 'compiler', kind: 'tool', label: 'Derleyici', sub: 'gcc -c main.c' },
    { id: 'object', kind: 'file', label: 'main.o', sub: 'Nesne dosyası' },
    { id: 'linker', kind: 'tool', label: 'Bağlayıcı', sub: 'ld' },
    { id: 'exe', kind: 'file', label: 'main', sub: 'Çalıştırılabilir' },
    { id: 'loader', kind: 'tool', label: 'Yükleyici', sub: './main → exec()' }
  ];

  const SOURCE = [
    '#include <stdio.h>',
    '#include <math.h>',
    '',
    'int counter = 5;',
    '',
    'int main(void) {',
    '    double r = sqrt(16.0);',
    '    printf("%d %.1f\\n", counter, r);',
    '    return 0;',
    '}'
  ].join('\n');

  // main.o: adresler bölüm başına 0'dan başlar; dış semboller tanımsızdır (UND)
  const OBJECT = {
    sections: [
      { name: '.text', size: 60, note: 'main fonksiyonunun makine kodu' },
      { name: '.rodata', size: 24, note: '16.0 sabiti, "%d %.1f\\n" biçim dizgisi' },
      { name: '.data', size: 4, note: 'counter = 5' }
    ],
    symbols: [
      { name: 'main', section: '.text', value: 0, defined: true },
      { name: 'counter', section: '.data', value: 0, defined: true },
      { name: 'sqrt', section: 'UND', value: null, defined: false },
      { name: 'printf', section: 'UND', value: null, defined: false }
    ],
    relocations: [
      { offset: 12, symbol: 'sqrt', instr: 'call sqrt' },
      { offset: 17, symbol: 'counter', instr: 'mov esi, [counter]' },
      { offset: 23, symbol: 'printf', instr: 'call printf' }
    ]
  };

  const LIBC_SO_BASE = 30000;   // paylaşılan kütüphanenin eşlendiği bölge
  const LIBC_PRINTF_OFFSET = 512;
  const PROCESS_SIZE = 4000;    // text+data+heap+stack (limit yazmacı)
  const RAM_SIZE = 40000;
  const OS_END = 10000;         // işletim sistemi düşük bellekte
  const BASE_MIN = 12000;
  const BASE_MAX = LIBC_SO_BASE - PROCESS_SIZE;

  /**
   * Statik / dinamik bağlama sonucu çalıştırılabilir dosya (mantıksal adresler 0'dan başlar).
   * @param {{libc:'dynamic'|'static'}} opts  libm her durumda statik (libm.a) bağlanır
   */
  function link(opts) {
    const dynamic = opts.libc === 'dynamic';
    const printfAddr = dynamic ? 100 : 200;
    const text = [
      { name: 'main', start: 0, end: 59, from: 'main.o' },
      dynamic
        ? { name: 'printf@plt', start: 100, end: 115, from: 'bağlayıcı (PLT saplaması)' }
        : null,
      { name: 'sqrt', start: 120, end: 199, from: 'libm.a (kopyalandı)' },
      dynamic ? null : { name: 'printf', start: 200, end: 299, from: 'libc.a (kopyalandı)' }
    ].filter(Boolean);

    return {
      dynamic,
      sizeText: dynamic ? '≈ 16 KB' : '≈ 800 KB',
      needed: dynamic ? ['libc.so.6'] : [],
      segments: [
        { name: '.text', start: 0, end: 299, parts: text },
        { name: '.rodata', start: 300, end: 339, parts: [{ name: 'sabitler', start: 300, end: 323, from: 'main.o' }] },
        { name: '.data', start: 340, end: 399, parts: [{ name: 'counter', start: 346, end: 349, from: 'main.o' }] }
      ].concat(dynamic ? [{ name: '.got', start: 400, end: 415, parts: [{ name: 'GOT[printf] = ?', start: 400, end: 407, from: 'dinamik bağlayıcı dolduracak' }] }] : []),
      symbols: [
        { name: 'main', from: 'main.o', address: 0, how: 'Giriş noktası (entry point)' },
        { name: 'counter', from: 'main.o', address: 346, how: '.data bölümüne yerleştirildi' },
        { name: 'sqrt', from: 'libm.a', address: 120, how: 'Statik: kodu çalıştırılabilire kopyalandı', kind: 'static' },
        dynamic
          ? { name: 'printf', from: 'libc.so.6', address: 100, how: 'Dinamik: PLT saplaması eklendi, gerçek adres yüklemede/çalışmada çözülecek', kind: 'dynamic' }
          : { name: 'printf', from: 'libc.a', address: 200, how: 'Statik: kodu çalıştırılabilire kopyalandı', kind: 'static' }
      ],
      patched: [
        { offset: 12, before: 'call sqrt', after: 'call 120' },
        { offset: 17, before: 'mov esi, [counter]', after: 'mov esi, [346]' },
        { offset: 23, before: 'call printf', after: `call ${printfAddr}` + (dynamic ? '   ; printf@plt' : '') }
      ]
    };
  }

  /**
   * Yükleme anı yeniden konumlandırma: fiziksel = taban (relocation register) + mantıksal.
   * @param {ReturnType<typeof link>} exe
   * @param {number} base
   */
  function load(exe, base) {
    if (!Number.isInteger(base) || base < BASE_MIN || base > BASE_MAX) {
      throw new Error(`Taban adres ${BASE_MIN}–${BASE_MAX} arasında olmalı.`);
    }
    const refs = [
      { what: 'main (giriş noktası)', logical: 0 },
      { what: 'call sqrt', logical: 120 },
      { what: 'mov esi, [counter]', logical: 346 },
      { what: exe.dynamic ? 'call printf@plt' : 'call printf', logical: exe.dynamic ? 100 : 200 }
    ].map((r) => Object.assign(r, { physical: base + r.logical }));

    const regions = [
      { name: 'İşletim sistemi', start: 0, end: OS_END - 1, kind: 'os' },
      { name: 'text + data', start: base, end: base + 399, kind: 'code' },
      { name: 'heap ↓', start: base + 400, end: base + 1999, kind: 'heap' },
      { name: 'stack ↑', start: base + 2000, end: base + PROCESS_SIZE - 1, kind: 'stack' }
    ];
    if (exe.dynamic) regions.push({ name: 'libc.so.6 (paylaşılan)', start: LIBC_SO_BASE, end: LIBC_SO_BASE + 1999, kind: 'shared' });

    return {
      base,
      limit: PROCESS_SIZE,
      refs,
      regions,
      ramSize: RAM_SIZE,
      dynamicFix: exe.dynamic
        ? { symbol: 'printf', got: base + 400, value: LIBC_SO_BASE + LIBC_PRINTF_OFFSET }
        : null
    };
  }

  /** ASLR benzeri rastgele taban: BASE_MIN–BASE_MAX arası, 1000'in katı, mevcuttan farklı */
  function randomBase(current) {
    const slots = (BASE_MAX - BASE_MIN) / 1000 + 1;
    let b;
    do { b = BASE_MIN + 1000 * Math.floor(Math.random() * slots); } while (b === current);
    return b;
  }

  /* ====================================================================
   * 3) OS mimarileri: read() isteğinin yolu
   * ==================================================================== */

  // kind: syscall | call | ret | hw | msg     cross: kullanıcı/çekirdek sınırını geçiyor mu
  const ARCHS = {
    monolithic: {
      label: 'Monolitik Çekirdek',
      examples: 'Geleneksel UNIX, Linux',
      path: [
        { from: 'app', to: 'sci', kind: 'syscall', cross: true, label: 'trap: read()' },
        { from: 'sci', to: 'fs', kind: 'call', label: 'vfs_read()' },
        { from: 'fs', to: 'drv', kind: 'call', label: 'blok isteği' },
        { from: 'drv', to: 'disk', kind: 'hw', label: 'G/Ç komutu' },
        { from: 'disk', to: 'drv', kind: 'hw', label: 'kesme: veri hazır' },
        { from: 'drv', to: 'fs', kind: 'ret', label: 'return' },
        { from: 'fs', to: 'sci', kind: 'ret', label: 'return' },
        { from: 'sci', to: 'app', kind: 'ret', cross: true, label: 'return-from-trap' }
      ]
    },
    microkernel: {
      label: 'Mikroçekirdek',
      examples: 'Mach, QNX, MINIX 3',
      path: [
        { from: 'app', to: 'mk', kind: 'msg', cross: true, label: 'send(FS, read)' },
        { from: 'mk', to: 'fs', kind: 'msg', cross: true, label: 'mesaj teslim' },
        { from: 'fs', to: 'mk', kind: 'msg', cross: true, label: 'send(DRV, blok)' },
        { from: 'mk', to: 'drv', kind: 'msg', cross: true, label: 'mesaj teslim' },
        { from: 'drv', to: 'disk', kind: 'hw', label: 'G/Ç komutu' },
        { from: 'disk', to: 'drv', kind: 'hw', label: 'kesme: veri hazır' },
        { from: 'drv', to: 'mk', kind: 'msg', cross: true, label: 'reply(FS, veri)' },
        { from: 'mk', to: 'fs', kind: 'msg', cross: true, label: 'yanıt teslim' },
        { from: 'fs', to: 'mk', kind: 'msg', cross: true, label: 'reply(APP, veri)' },
        { from: 'mk', to: 'app', kind: 'msg', cross: true, label: 'yanıt teslim' }
      ]
    }
  };

  function pathStats(path) {
    return {
      hops: path.length,
      modeSwitches: path.filter((h) => h.cross).length,
      // Bir IPC mesajı: kullanıcı alanındaki bir işlemin mikroçekirdeğe gönderdiği her send/reply
      messages: path.filter((h) => h.kind === 'msg' && h.to === 'mk').length,
      calls: path.filter((h) => h.kind === 'call').length
    };
  }

  OSLab.arch = {
    SYSCALLS,
    syscallSteps,
    illegalSteps,
    BUILD_STAGES,
    SOURCE,
    OBJECT,
    BASE_MIN,
    BASE_MAX,
    link,
    load,
    randomBase,
    ARCHS,
    pathStats
  };
})(window.OSLab = window.OSLab || {});
