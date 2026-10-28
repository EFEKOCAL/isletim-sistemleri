/*
 * diagrams.js — Ders notlarındaki şekiller (slaytlardaki şekillerin etkileşimli karşılıkları).
 *
 * Şekil türleri:
 *   explorer → öğelere tıklanınca açıklama gösterir (info[k] metin ya da {text, hl:[ek vurgu]})
 *   stepper  → adım adım ilerler; her adım data-k anahtarlarını vurgular, data-v metinlerini değiştirir
 *   tabs     → sekmeli karşılaştırma
 *   custom   → kendi render/init fonksiyonu olan özel etkileşim
 */
(function (OSLab) {
  'use strict';

  const b = (k, title, sub, cls) => `<div class="dg-b${cls ? ' ' + cls : ''}" data-k="${k}"><b>${title}</b>${sub ? `<small>${sub}</small>` : ''}</div>`;
  const ar = (d) => `<div class="dg-ar dg-ar-${d || 'right'}">${{ down: '↓', up: '↑', left: '←', both: '⇅' }[d] || '→'}</div>`;
  const row = (...xs) => `<div class="dg-row">${xs.join('')}</div>`;
  const col = (...xs) => `<div class="dg-col">${xs.join('')}</div>`;
  const band = (label, cls, inner) => `<div class="dg-band ${cls}"><span class="dg-band-label">${label}</span>${inner}</div>`;

  const D = {};

  /* =============================================================== BÖLÜM 1 */

  D.sys4 = {
    kind: 'explorer',
    hint: 'Bir katmana tıkla.',
    html: col(
      `<div class="dg-row dg-users">${['kullanıcı 1', 'kullanıcı 2', 'kullanıcı 3', '…', 'kullanıcı n'].map((u) => `<div class="dg-b dg-mini" data-k="users"><b>${u}</b></div>`).join('')}</div>`,
      ar('both'),
      b('apps', 'Sistem ve uygulama programları', 'derleyici · assembler · metin editörü · … · veritabanı', 'dg-w100'),
      b('os', 'İşletim sistemi', '', 'dg-w70 dg-os'),
      b('hw', 'Bilgisayar donanımı', 'CPU · bellek · G/Ç aygıtları', 'dg-w40 dg-hw')
    ),
    info: {
      users: '<b>Kullanıcılar</b>: insanlar, makineler ve diğer bilgisayarlar. Sistemi uygulama programları aracılığıyla kullanırlar.',
      apps: '<b>Uygulama programları</b>: sistem kaynaklarını kullanıcıların hesaplama problemlerini çözmek için kullanır. Kelime işlemciler, derleyiciler, web tarayıcıları, veritabanı sistemleri, video oyunları.',
      os: '<b>İşletim sistemi</b>: çeşitli uygulamalar ve kullanıcılar arasında <b>donanım kullanımını kontrol ve koordine eder</b>. Uygulamalar donanıma doğrudan değil, onun üzerinden erişir.',
      hw: '<b>Donanım</b>: temel hesaplama kaynaklarını sağlar: CPU, bellek, G/Ç aygıtları.'
    }
  };

  D.bus = {
    kind: 'explorer',
    hint: 'Bir bileşene tıkla.',
    html: `<div class="dg-grid4">
        <div></div>${b('disks', 'diskler', '', 'dg-dev')}${b('usbdev', 'fare · klavye · yazıcı', '', 'dg-dev')}${b('monitor', 'monitör', '', 'dg-dev')}
        ${b('cpu', 'CPU', '', 'dg-cpu')}${b('diskc', 'disk denetleyicisi')}${b('usbc', 'USB denetleyicisi')}${b('gfx', 'grafik adaptörü')}
      </div>
      <div class="dg-busline" data-k="bus"><span>sistem veri yolu (system bus)</span></div>
      <div class="dg-row dg-center">${b('mem', 'bellek', '', 'dg-mem')}</div>`,
    info: {
      cpu: '<b>CPU</b>: komutları yürütür. Bellek döngüleri için aygıt denetleyicileriyle yarışır.',
      disks: '<b>Diskler</b>: disk denetleyicisi tarafından yönetilen aygıtlar.',
      usbdev: 'Fare, klavye, yazıcı: hepsi tek bir <b>USB denetleyicisine</b> bağlı aygıtlar.',
      monitor: '<b>Monitör</b>: grafik adaptörü tarafından sürülür.',
      diskc: '<b>Aygıt denetleyicisi</b>: belirli bir aygıt türünden sorumludur ve bir <b>yerel tamponu (local buffer)</b> vardır. Veri önce aygıttan bu tampona gelir.',
      usbc: '<b>USB denetleyicisi</b>: birden çok aygıtı yönetebilen bir aygıt denetleyicisi.',
      gfx: '<b>Grafik adaptörü</b>: görüntü aygıtının denetleyicisi.',
      bus: '<b>Sistem veri yolu</b>: CPU ve aygıt denetleyicileri bu ortak yol üzerinden paylaşılan belleğe erişir. Hepsi <b>eşzamanlı</b> çalışabilir.',
      mem: '<b>Paylaşılan ana bellek</b>: CPU ve denetleyiciler veri yolu üzerinden erişir. Denetleyiciler veriyi yerel tampon ile bellek arasında taşır (ya da DMA ile doğrudan aktarır).'
    }
  };

  D.intcycle = {
    kind: 'stepper',
    intro: 'Kesme tabanlı G/Ç döngüsü: sol sütun CPU, sağ sütun G/Ç denetleyicisi. "İleri" ile başla.',
    html: `<div class="dg-grid2">
        <div class="dg-colhead">CPU</div><div class="dg-colhead">G/Ç denetleyicisi</div>
        ${b('c1', '1 · Aygıt sürücüsü G/Ç\'yi başlatır')}${b('c2', '2 · Denetleyici G/Ç\'yi başlatır')}
        ${b('chk', 'CPU yürütmeye devam eder, her komut arasında kesme var mı diye bakar', '', 'dg-dashed')}<div></div>
        ${b('c4', '4 · CPU kesmeyi alır, kontrolü kesme işleyicisine aktarır')}${b('c3', '3 · Girdi hazır / çıktı tamam / hata → kesme sinyali üretir')}
        ${b('c5', '5 · Kesme işleyicisi veriyi işler, kesmeden döner')}<div></div>
        ${b('c6', '6 · CPU kesilen görevi kaldığı yerden sürdürür')}<div></div>
      </div>`,
    steps: [
      { on: ['c1'], text: '<b>1.</b> CPU üzerinde çalışan aygıt sürücüsü, denetleyicinin yazmaçlarına komut yazarak G/Ç\'yi başlatır.' },
      { on: ['c2'], text: '<b>2.</b> Denetleyici G/Ç işlemini başlatır: aygıttan veriyi kendi yerel tamponuna aktarır.' },
      { on: ['chk'], text: 'Bu sırada CPU <b>beklemez</b>: başka bir işlemin komutlarını yürütür ve her komuttan sonra kesme satırını kontrol eder.' },
      { on: ['c3'], text: '<b>3.</b> İşlem bitince (girdi hazır, çıktı tamamlandı ya da hata) denetleyici bir <b>kesme sinyali</b> üretir.' },
      { on: ['c4'], text: '<b>4.</b> CPU kesmeyi görür: mevcut durumu kaydeder ve <b>kesme vektöründen</b> bulduğu kesme işleyicisine atlar.' },
      { on: ['c5'], text: '<b>5.</b> Kesme işleyicisi (servis rutini) veriyi işler, ör. tampondan belleğe kopyalar, ve kesmeden döner.' },
      { on: ['c6'], text: '<b>6.</b> Kaydedilen durum geri yüklenir; CPU kesilen görevi kaldığı yerden sürdürür.' },
      { on: ['c1'], text: '<b>7.</b> Döngü bir sonraki G/Ç isteğiyle yeniden başlar.' }
    ]
  };

  D.iochain = {
    kind: 'stepper',
    intro: 'Bir read() isteğinin uygulamadan aygıta gidişi ve dönüşü.',
    html: col(
      b('app', 'Uygulama', 'n = read(fd, buf, 128);'),
      ar('both'),
      `<div class="dg-kernelbox">${b('sc', 'Sistem çağrısı rutinleri', 'çekirdek')}${ar('both')}${b('drv', 'Aygıt sürücüsü', 'çekirdek')}<span class="dg-band-label">Kernel</span></div>`,
      ar('both'),
      b('ctl', 'Aygıt denetleyicisi', 'yerel tampon'),
      ar('both'),
      b('dev', 'Aygıt', 'ör. disk', 'dg-dev')
    ),
    steps: [
      { on: ['app'], text: 'Uygulama G/Ç\'yi doğrudan yapamaz; bir <b>sistem çağrısı</b> ister (read).' },
      { on: ['sc'], text: 'Trap ile çekirdeğe girilir; <b>sistem çağrısı rutini</b> isteği doğrular.' },
      { on: ['drv'], text: '<b>Aygıt sürücüsü</b>, denetleyicinin yazmaçlarına komut yazar.' },
      { on: ['ctl', 'dev'], text: 'Denetleyici aygıtı çalıştırır, veriyi <b>yerel tamponuna</b> alır; büyük bloklarda <b>DMA</b> ile doğrudan belleğe aktarır.' },
      { on: ['ctl'], text: 'İş bitince denetleyici CPU\'ya <b>kesme</b> gönderir (DMA\'da blok başına bir kesme).' },
      { on: ['drv', 'sc'], text: 'Sürücünün kesme işleyicisi işi tamamlar; sistem çağrısı durum ve dönüş değeriyle döner.' },
      { on: ['app'], text: '<b>Bloklayan</b> çağrıda uygulama bu ana kadar beklemiştir; <b>bloklamayan</b> çağrıda ise o sırada başka işler yapabilmiştir.' }
    ]
  };

  D.pyramid = {
    kind: 'explorer',
    hint: 'Bir katmana tıkla. Kesik çizgi uçucu ve kalıcı depolamayı ayırır.',
    html: `<div class="dg-pyr">
        ${[['reg', 'yazmaçlar (registers)', 30], ['cache', 'önbellek (cache)', 40], ['mem', 'ana bellek', 50]].map(([k, t, w]) => `<div class="dg-b dg-pyr-l dg-volatile" data-k="${k}" style="width:${w}%"><b>${t}</b></div>`).join('')}
        <div class="dg-divider"><span>↑ uçucu (volatile) · kalıcı (nonvolatile) ↓</span></div>
        ${[['nvm', 'kalıcı bellek (SSD / NVM)', 62], ['hdd', 'sabit disk (HDD)', 74], ['opt', 'optik disk', 86], ['tape', 'manyetik teyp', 98]].map(([k, t, w]) => `<div class="dg-b dg-pyr-l" data-k="${k}" style="width:${w}%"><b>${t}</b></div>`).join('')}
      </div>
      <div class="dg-axis"><span>▲ daha hızlı, daha küçük, daha pahalı</span><span>▼ daha yavaş, daha büyük, daha ucuz</span></div>`,
    info: {
      reg: '<b>Yazmaçlar</b> · birincil depolama · &lt; 1 KB · erişim 0.25–0.5 ns · <b>derleyici</b> yönetir · uçucu.',
      cache: '<b>Önbellek</b> · birincil depolama · &lt; 16 MB · 0.5–25 ns · <b>donanım</b> yönetir · uçucu. Ana belleğin sık kullanılan kısmının kopyası.',
      mem: '<b>Ana bellek (DRAM)</b> · birincil depolama · &lt; 64 GB · 80–250 ns · <b>işletim sistemi</b> yönetir · uçucu. CPU\'nun doğrudan erişebildiği en büyük depolama.',
      nvm: '<b>Kalıcı bellek / SSD</b> · ikincil depolama · flash bellek · 25.000–50.000 ns · işletim sistemi yönetir · <b>kalıcı</b>.',
      hdd: '<b>Sabit disk</b> · ikincil depolama · manyetik · ≈ 5.000.000 ns · işletim sistemi yönetir · kalıcı. Büyük kapasite, mekanik ve yavaş.',
      opt: '<b>Optik disk</b> · üçüncül depolama · yavaş, çıkarılabilir.',
      tape: '<b>Manyetik teyp</b> · üçüncül depolama · en yavaş, en büyük, en ucuz; yedekleme ve arşiv.'
    }
  };

  D.migration = {
    kind: 'stepper',
    intro: '"A" tamsayısının diskten yazmaca taşınması (slayt 1.72).',
    html: row(b('d', 'manyetik disk', 'A'), ar(), b('m', 'ana bellek', 'A'), ar(), b('c', 'önbellek', 'A'), ar(), b('r', 'donanım yazmacı', 'A')),
    steps: [
      { on: ['d'], text: 'A önce kalıcı depolamada, diskte durur.' },
      { on: ['m'], text: 'Kullanılmak için önce <b>ana belleğe</b> kopyalanır (işletim sistemi yönetir).' },
      { on: ['c'], text: 'Erişildikçe <b>önbelleğe</b> kopyalanır (donanım yönetir).' },
      { on: ['r'], text: 'İşlem için <b>yazmaca</b> yüklenir. Artık A\'nın dört kopyası var. Yazmaçtaki A değişirse, diğer kopyalar güncellenene kadar <b>eskidir</b>.' },
      { on: ['c', 'r'], text: 'Çoklu görevde herkes <b>en son değeri</b> görmelidir. Çok işlemcide her CPU\'nun kendi önbelleğinde A olabilir; donanım <b>önbellek tutarlılığı (cache coherency)</b> sağlamalıdır.' }
    ]
  };

  const cpuBox = (n, l1) => `<div class="dg-b dg-nest" data-k="core${n}"><b>CPU${n}</b><div class="dg-b dg-mini">yazmaçlar</div><div class="dg-b dg-mini">${l1 ? 'L1 önbellek' : 'önbellek'}</div></div>`;
  D.arch = {
    kind: 'tabs',
    panes: [
      { label: 'SMP', html: col(row(`<div class="dg-b dg-nest"><b>işlemci₀</b>${cpuBox(0)}</div>`, `<div class="dg-b dg-nest"><b>işlemci₁</b>${cpuBox(1)}</div>`), ar('down'), b('m', 'ana bellek', 'ortak', 'dg-mem dg-w100')), text: '<b>Simetrik çoklu işlem</b>: her işlemcinin kendi yazmaçları ve önbelleği var, ana belleği paylaşırlar. Her işlemci tüm görevleri yapabilir.' },
      { label: 'Çok çekirdekli', html: col(`<div class="dg-b dg-nest dg-w100"><b>işlemci₀ (tek çip)</b>${row(cpuBox(0, true), cpuBox(1, true))}<div class="dg-b dg-mini">L2 önbellek (paylaşılan)</div></div>`, ar('down'), b('m', 'ana bellek', '', 'dg-mem dg-w100')), text: '<b>Çok çekirdekli (multicore)</b>: birden çok çekirdek <b>tek bir çip</b> üzerindedir. Çekirdek içi iletişim çipler arası iletişimden hızlıdır ve daha az güç harcar. Her çekirdeğin L1 önbelleği vardır, L2 paylaşılır.' },
      { label: 'NUMA', html: `<div class="dg-grid2">${[0, 1, 2, 3].map((i) => col(i < 2 ? b('m' + i, 'bellek' + i, '', 'dg-mem') : '', b('c' + i, 'CPU' + i, '', 'dg-cpu'), i >= 2 ? b('m' + i, 'bellek' + i, '', 'dg-mem') : '')).join('')}</div><p class="dg-note">CPU\'lar birbirine <b>interconnect</b> ile bağlı</p>`, text: '<b>Tek tip olmayan bellek erişimi (NUMA)</b>: her CPU\'nun kendine yakın bir yerel belleği vardır. Yerel belleğe erişim hızlıdır; başka CPU\'nun belleğine bağlantı üzerinden erişim yavaştır. Daha fazla CPU eklendikçe ölçeklenir.' },
      { label: 'Küme (cluster)', html: col(row(b('p1', 'bilgisayar'), ar('both'), b('p2', 'bilgisayar'), ar('both'), b('p3', 'bilgisayar')), ar('down'), b('san', 'depolama alanı ağı (SAN)', 'paylaşılan disk', 'dg-mem dg-w100')), text: '<b>Kümelenmiş sistem</b>: ağ ile bağlı birden çok bağımsız sistem. Depolamayı SAN üzerinden paylaşır. Biri çökerse diğeri devralır: yüksek kullanılabilirlik.' }
    ]
  };

  D.multiprog = {
    kind: 'stepper',
    intro: 'Çoklu programlama: bellekte birden çok iş var. CPU\'nun hiç boş kalmadığını izle.',
    html: row(
      col(`<div class="dg-colhead">Ana bellek</div>`, b('os', 'İşletim sistemi', '', 'dg-os'), b('j1', 'İş 1'), b('j2', 'İş 2'), b('j3', 'İş 3')),
      col(`<div class="dg-colhead">CPU</div>`, `<div class="dg-b dg-cpu" data-k="cpu"><b data-v="cpu">boşta</b></div>`, `<div class="dg-colhead">G/Ç aygıtı</div>`, `<div class="dg-b dg-dev" data-k="io"><b data-v="io">boşta</b></div>`)
    ),
    steps: [
      { on: ['j1', 'cpu'], set: { cpu: 'İş 1 çalışıyor', io: 'boşta' }, text: 'İşletim sistemi İş 1\'i seçer (iş planlaması), CPU onu yürütür.' },
      { on: ['j1', 'io', 'os'], set: { cpu: 'karar veriliyor…', io: 'İş 1 için okuyor' }, text: 'İş 1 G/Ç istedi ve <b>beklemek zorunda</b>. Tek programlı bir sistemde CPU burada boşta kalırdı.' },
      { on: ['j2', 'cpu'], set: { cpu: 'İş 2 çalışıyor', io: 'İş 1 için okuyor' }, text: 'Bunun yerine CPU <b>İş 2\'ye devredilir</b>. CPU ve G/Ç aygıtı aynı anda çalışıyor.' },
      { on: ['j2', 'io'], set: { cpu: 'İş 3 çalışıyor', io: 'İş 1 bitti → İş 2 için okuyor' }, text: 'İş 1\'in G/Ç\'si bitti (kesme). İş 2 de G/Ç istedi; CPU İş 3\'e geçer.' },
      { on: ['j1', 'cpu'], set: { cpu: 'İş 1 çalışıyor', io: 'İş 2 için okuyor' }, text: 'İş 3 bitince İş 1 tekrar çalışabilir. Sonuç: <b>CPU kullanımı en üst düzeyde</b>. Çoklu görevde bu geçişler o kadar sık olur ki her kullanıcı etkileşimli çalışabilir.' }
    ]
  };

  D.dualmode = {
    kind: 'stepper',
    intro: 'Kullanıcı modundan çekirdek moduna geçiş (slayt 1.59).',
    html: `<div class="dg-modebit">mode bit = <b data-v="mode">1</b></div>
      ${band('kullanıcı modu (mode bit = 1)', 'dg-user', row(b('u1', 'kullanıcı işlemi yürütülüyor'), ar(), b('u2', 'sistem çağrısı yapar'), '<div class="dg-spacer"></div>', b('u3', 'sistem çağrısından döner')))}
      ${band('çekirdek modu (mode bit = 0)', 'dg-kernel', row(b('k1', 'trap', 'mode bit = 0'), ar(), b('k2', 'sistem çağrısını yürüt'), ar(), b('k3', 'return', 'mode bit = 1')))}`,
    steps: [
      { on: ['u1'], set: { mode: '1' }, text: 'Kullanıcı işlemi <b>kullanıcı modunda</b> çalışıyor. Ayrıcalıklı komutları çalıştıramaz.' },
      { on: ['u2'], set: { mode: '1' }, text: 'Bir işletim sistemi servisine ihtiyaç var: işlem <b>sistem çağrısı</b> yapar. Trap komutu hâlâ kullanıcı modunda çalışır.' },
      { on: ['k1'], set: { mode: '0' }, text: '<b>Trap</b>: donanım <b>mod bitini 0</b> yapar ve işletim sisteminin belirlediği giriş noktasına atlar.' },
      { on: ['k2'], set: { mode: '0' }, text: 'Çekirdek, sistem çağrısını <b>çekirdek modunda</b> yürütür; ayrıcalıklı komutlar kullanılabilir.' },
      { on: ['k3'], set: { mode: '1' }, text: '<b>Return</b>: dönmeden önce mod biti tekrar <b>1</b> yapılır.' },
      { on: ['u3'], set: { mode: '1' }, text: 'Kullanıcı işlemi kaldığı yerden devam eder. Kullanıcı hiçbir zaman mod bitini kendisi değiştiremez.' }
    ]
  };

  D.vm = {
    kind: 'tabs',
    panes: [
      { label: '(a) Sanallaştırma yok', html: col(b('p', 'işlemler', '', 'dg-w100'), ar('down'), b('k', 'çekirdek', 'programlama arayüzü', 'dg-os dg-w100'), b('h', 'donanım', '', 'dg-hw dg-w100')), text: 'Tek bir çekirdek donanımı doğrudan yönetir; işlemler onun programlama arayüzünü kullanır.' },
      { label: '(b) Sanal makineler', html: col(row(...[1, 2, 3].map((i) => col(b('p' + i, 'işlemler'), b('k' + i, 'çekirdek', '', 'dg-os'), b('v' + i, 'VM' + i, '', 'dg-mini')))), b('vmm', 'sanal makine yöneticisi (VMM)', '', 'dg-kernel-b dg-w100'), b('h', 'donanım', '', 'dg-hw dg-w100')), text: 'VMM üzerinde birden çok sanal makine çalışır. Her biri kendi konuk (guest) çekirdeğini çalıştırır ve kendine ait bir donanım varmış gibi davranır.' }
    ]
  };

  /* =============================================================== BÖLÜM 2 */

  const svc = (k, t) => b(k, t, '', 'dg-svc');
  D.services = {
    kind: 'explorer',
    hint: 'Bir servise tıkla. Mavi: kullanıcıya yönelik, mor: sistemin verimliliğine yönelik.',
    html: col(
      b('progs', 'kullanıcı ve diğer sistem programları', '', 'dg-w100'),
      `<div class="dg-b dg-nest dg-w70" data-k="ui"><b>kullanıcı arayüzleri</b>${row(b('gui', 'GUI', '', 'dg-mini'), b('touch', 'dokunmatik ekran', '', 'dg-mini'), b('cli', 'komut satırı', '', 'dg-mini'))}</div>`,
      b('calls', 'sistem çağrıları', '', 'dg-w100 dg-iface'),
      `<div class="dg-b dg-nest dg-w100"><b>servisler</b><div class="dg-grid4">${svc('exec', 'program yürütme')}${svc('io', 'G/Ç işlemleri')}${svc('fs', 'dosya sistemleri')}${svc('comm', 'iletişim')}${b('alloc', 'kaynak paylaşımı', '', 'dg-svc dg-sys')}${b('acct', 'hesap tutma', '', 'dg-svc dg-sys')}${svc('err', 'hata algılama')}${b('prot', 'koruma ve güvenlik', '', 'dg-svc dg-sys')}</div></div>`,
      b('os', 'işletim sistemi', '', 'dg-os dg-w100'),
      b('hw', 'donanım', '', 'dg-hw dg-w100')
    ),
    info: {
      progs: 'Servisleri kullanan kullanıcı programları ve sistem programları.',
      ui: '<b>Kullanıcı arayüzü</b>: neredeyse tüm işletim sistemlerinde vardır.',
      gui: '<b>GUI</b>: fare, klavye, monitör; simgeler, pencereler.',
      touch: '<b>Dokunmatik ekran</b>: hareketler (gesture), sanal klavye.',
      cli: '<b>Komut satırı (CLI)</b>: metin komutları, kabuk.',
      calls: '<b>Sistem çağrıları</b>: programların servislere eriştiği programlama arayüzü.',
      exec: '<b>Program yürütme</b>: programı belleğe yükle, çalıştır, normal ya da hatalı sonlandır. (Kullanıcıya yönelik)',
      io: '<b>G/Ç işlemleri</b>: kullanıcı aygıtları doğrudan kontrol edemez, işletim sistemi sağlar. (Kullanıcıya yönelik)',
      fs: '<b>Dosya sistemi</b>: dosya oku, yaz, oluştur, sil, ara; izinleri yönet. (Kullanıcıya yönelik)',
      comm: '<b>İletişim</b>: aynı bilgisayarda ya da ağdaki işlemler arasında; paylaşılan bellek veya mesaj geçişi. (Kullanıcıya yönelik)',
      err: '<b>Hata algılama</b>: CPU, bellek, donanım ve programlardaki hataları sürekli izleyip uygun işlemi yapmak. (Kullanıcıya yönelik)',
      alloc: '<b>Kaynak paylaşımı</b>: çok kullanıcılı / çok işli sistemde kaynakları her kullanıcı ve işe ayırmak. (Sistemin verimliliği)',
      acct: '<b>Hesap tutma (accounting)</b>: hangi kullanıcının hangi kaynağı ne kadar kullandığını izlemek; istatistik, sistem geliştirme. (Sistemin verimliliği)',
      prot: '<b>Koruma ve güvenlik</b>: işlemler birbirine karışmamalı, tüm kaynaklara erişim denetlenmeli, kullanıcılar kimlik doğrulamalı. (Sistemin verimliliği)',
      os: 'Servisleri sağlayan işletim sistemi.',
      hw: 'Donanım.'
    }
  };

  D.syscall = {
    kind: 'stepper',
    intro: 'Bir open() çağrısının yolu (slayt 2.15 ve 2.19).',
    html: `${band('kullanıcı modu', 'dg-user', col(b('prog', 'Senin programın', 'fd = open("notlar.txt", O_RDONLY);'), ar('down'), b('api', 'API: standart C kütüphanesi', 'open(…) { … }   ·   fopen(…) de buraya iner')))}
      <div class="dg-iface-line" data-k="iface">sistem çağrısı arayüzü</div>
      ${band('çekirdek modu', 'dg-kernel', row(`<div class="dg-b dg-table" data-k="table"><b>sistem çağrısı tablosu</b><small>…</small><small class="dg-hl-row">i → sys_open</small><small>…</small></div>`, ar(), b('impl', 'open() gerçekleştirmesi', 'sys_open(…) { … } · return')))}`,
    steps: [
      { on: ['prog'], text: 'Program <b>API</b> fonksiyonunu çağırır; sistem çağrısının ayrıntılarını bilmesi gerekmez.' },
      { on: ['api'], text: 'C kütüphanesi (sarmalayıcı), sistem çağrısının <b>numarasını (i)</b> ve parametreleri yazmaçlara koyar, <b>trap</b> komutunu çalıştırır.' },
      { on: ['iface'], text: 'Kullanıcı modundan çekirdek moduna geçilir: <b>sistem çağrısı arayüzü</b> devreye girer.' },
      { on: ['table'], text: 'Arayüz, numaralarla indekslenen <b>tablodan</b> i numaralı girdiyi bulur: sys_open.' },
      { on: ['impl'], text: 'Çekirdekteki <b>open() gerçekleştirmesi</b> çalışır: dosyayı bulur, izinleri denetler, dosya tanımlayıcısı oluşturur.' },
      { on: ['iface', 'api'], text: 'Sistem çağrısının <b>durumu ve dönüş değeri</b> (fd ya da -1) döner; mod tekrar kullanıcı moduna geçer.' },
      { on: ['prog'], text: 'Program dönen fd ile çalışmaya devam eder. Aynı şekilde <code>printf()</code> kütüphanede çalışır ve içeride <code>write()</code> sistem çağrısını yapar.' }
    ]
  };

  D.params = {
    kind: 'tabs',
    panes: [
      { label: 'Yazmaçlar', html: row(b('prog', 'kullanıcı programı', 'parametreleri yazmaçlara yazar'), ar(), `<div class="dg-b dg-nest"><b>yazmaçlar</b>${b('r0', 'rax = çağrı no', '', 'dg-mini')}${b('r1', 'rdi = param 1', '', 'dg-mini')}${b('r2', 'rsi = param 2', '', 'dg-mini')}${b('r3', 'rdx = param 3', '', 'dg-mini')}</div>`, ar(), b('os', 'işletim sistemi', 'yazmaçlardan okur', 'dg-os')), text: '<b>En basit ve en hızlı yöntem.</b> Ama yazmaç sayısı sınırlıdır; bazı durumlarda yazmaçlardan fazla parametre olabilir.' },
      { label: 'Blok / tablo', html: row(`<div class="dg-b dg-nest"><b>kullanıcı programı</b>${b('x', 'X: çağrı parametreleri', '', 'dg-mini')}${b('l', 'load address X', '', 'dg-mini')}${b('s', 'system call 13', '', 'dg-mini')}</div>`, ar(), b('reg', 'yazmaç', 'X'), ar(), `<div class="dg-b dg-nest dg-os"><b>işletim sistemi</b>${b('c', 'sistem çağrısı 13 kodu', 'parametreleri X tablosundan kullan', 'dg-mini')}</div>`), text: 'Parametreler <b>bellekte bir blokta (tablo)</b> saklanır; bloğun <b>adresi</b> bir yazmaçla geçirilir (slayt 2.23). <b>Linux ve Solaris</b> bu yaklaşımı kullanır. Sayı ve uzunluk sınırı yoktur.' },
      { label: 'Yığın (stack)', html: row(b('prog', 'kullanıcı programı', 'push p3 · push p2 · push p1'), ar(), `<div class="dg-b dg-nest"><b>yığın</b>${b('p1', 'p1', '', 'dg-mini')}${b('p2', 'p2', '', 'dg-mini')}${b('p3', 'p3', '', 'dg-mini')}</div>`, ar(), b('os', 'işletim sistemi', 'pop ile alır', 'dg-os')), text: 'Program parametreleri yığına <b>iter (push)</b>, işletim sistemi yığından <b>çeker (pop)</b>. Sayı ve uzunluk sınırı yoktur.' }
    ]
  };

  D.linkload = {
    kind: 'stepper',
    intro: 'Kaynak koddan bellekteki programa (slayt 2.36).',
    html: `<div class="dg-pipe">
        ${b('src', 'kaynak program', 'main.c', 'dg-file')}
        ${ar('down')}${b('comp', 'derleyici', 'gcc -c main.c', 'dg-tool')}${ar('down')}
        ${row(b('obj', 'nesne dosyası', 'main.o (yeniden konumlandırılabilir)', 'dg-file'), b('other', 'diğer nesne dosyaları + kütüphaneler', '', 'dg-side'))}
        ${ar('down')}${b('link', 'bağlayıcı (linker)', 'gcc -o main main.o -lm', 'dg-tool')}${ar('down')}
        ${b('exe', 'çalıştırılabilir dosya', 'main (diskte, ikili)', 'dg-file')}
        ${ar('down')}${b('load', 'yükleyici (loader)', './main', 'dg-tool')}${ar('down')}
        ${row(b('mem', 'bellekteki program', 'çalışan işlem', 'dg-mem'), b('dll', 'dinamik bağlı kütüphaneler', 'DLL / .so', 'dg-side'))}
      </div>`,
    steps: [
      { on: ['src'], text: 'İnsanın okuyabildiği <b>kaynak kod</b>.' },
      { on: ['comp'], text: '<b>Derleyici</b> kaynak kodu makine koduna çevirir.' },
      { on: ['obj'], text: 'Çıktı <b>yeniden konumlandırılabilir nesne dosyası</b>dır: fiziksel bellekte herhangi bir yere yüklenebilecek şekilde tasarlanmıştır. Dış semboller (printf, sqrt) henüz çözülmemiştir.' },
      { on: ['other', 'link'], text: '<b>Bağlayıcı</b>, nesne dosyalarını ve kütüphaneleri (<code>-lm</code> = matematik kütüphanesi) <b>tek bir ikili çalıştırılabilir dosyada</b> birleştirir, sembolleri çözümler.' },
      { on: ['exe'], text: '<b>Çalıştırılabilir dosya</b> ikincil depolamada durur. Standart bir biçimi vardır (Linux: ELF), böylece işletim sistemi onu nasıl yükleyeceğini bilir.' },
      { on: ['load'], text: '<b>Yükleyici</b> dosyayı belleğe getirir. <b>Relocation</b>: program parçalarına son adresleri atar, kod ve veriyi bu adreslere göre düzeltir.' },
      { on: ['dll', 'mem'], text: '<b>Dinamik bağlı kütüphaneler</b> gerektiğinde yüklenir; bellekte bir kez bulunur ve aynı sürümü kullanan herkesçe paylaşılır. Program artık bellekte çalışan bir işlemdir.' }
    ]
  };

  const stack = (items) => col(...items.map(([k, t, s, c]) => b(k, t, s, (c || '') + ' dg-w100')));
  D.structures = {
    kind: 'tabs',
    panes: [
      { label: 'Basit (MS-DOS)', html: row(stack([['a', 'uygulama programı'], ['r', 'yerleşik sistem programı'], ['d', 'MS-DOS aygıt sürücüleri', '', 'dg-os'], ['b', 'ROM BIOS aygıt sürücüleri', '', 'dg-hw']]), `<div class="dg-bypass">uygulamalar katmanları <b>atlayıp</b> doğrudan BIOS\'a erişebilir ↓</div>`), text: '<b>Basit yapı</b>: küçük bellekte çok işlev sağlamak için yazıldı. Modüllere bölünmez; arayüzler ve işlev seviyeleri kesin ayrılmaz. Uygulama programları donanıma doğrudan erişebildiği için hatalı bir program tüm sistemi çökertebilir.' },
      { label: 'Katmanlı', html: `<svg class="dg-rings" viewBox="0 0 260 260" role="img" aria-label="katmanlar"><circle cx="130" cy="130" r="122" class="r3"/><circle cx="130" cy="130" r="88" class="r2"/><circle cx="130" cy="130" r="58" class="r1"/><circle cx="130" cy="130" r="30" class="r0"/><text x="130" y="128" text-anchor="middle">katman 0</text><text x="130" y="142" text-anchor="middle" class="s">donanım</text><text x="130" y="88" text-anchor="middle">katman 1</text><text x="130" y="60" text-anchor="middle">⋮</text><text x="130" y="26" text-anchor="middle">katman N</text><text x="130" y="40" text-anchor="middle" class="s">kullanıcı arayüzü</text></svg>`, text: '<b>Katmanlı yaklaşım</b>: katman 0 donanım, katman N kullanıcı arayüzü. Her katman <b>yalnızca alt katmanların</b> sağladığı işlemleri kullanır ve bunların nasıl yapıldığını bilmez; her katman ayrıntılarını üst katmanlardan gizler. Artı: inşa ve hata ayıklama kolay. Eksi: katmanları tanımlamak zor, performans kaybı.' },
      { label: 'Monolitik (UNIX)', html: col(b('u', '(kullanıcılar)', '', 'dg-w100'), b('s', 'kabuklar ve komutlar · derleyiciler ve yorumlayıcılar · sistem kütüphaneleri', '', 'dg-w100'), b('i', 'çekirdeğe sistem çağrısı arayüzü', '', 'dg-iface dg-w100'), `<div class="dg-b dg-nest dg-os dg-w100"><b>çekirdek (kernel)</b>${row(b('k1', 'sinyaller, terminal', 'karakter G/Ç, terminal sürücüleri', 'dg-mini'), b('k2', 'dosya sistemi', 'takas, blok G/Ç, disk ve teyp sürücüleri', 'dg-mini'), b('k3', 'CPU zamanlama', 'sayfa değiştirme, sanal bellek', 'dg-mini'))}</div>`, b('h', 'çekirdeğin donanım arayüzü', '', 'dg-iface dg-w100'), b('hw', 'terminal · aygıt · bellek denetleyicileri', '', 'dg-hw dg-w100')), text: '<b>Orijinal UNIX (monolitik)</b>: iki ayrılabilir parça vardır: sistem programları ve çekirdek. Çekirdek, sistem çağrısı arayüzünün altında ve donanımın üstünde kalan <b>her şeyi</b> içerir: dosya sistemi, CPU zamanlama, bellek yönetimi… "Basitin ötesinde ama tamamen katmanlı değil."' },
      { label: 'Linux', html: col(row(b('a', 'uygulamalar'), b('g', 'glibc standart C kütüphanesi')), b('i', 'sistem çağrısı arayüzü', '', 'dg-iface dg-w100'), `<div class="dg-b dg-nest dg-os dg-w100"><b>çekirdek</b><div class="dg-grid2">${b('fs', 'dosya sistemleri', '', 'dg-mini')}${b('cs', 'CPU zamanlayıcı', '', 'dg-mini')}${b('net', 'ağlar (TCP/IP)', '', 'dg-mini')}${b('mm', 'bellek yöneticisi', '', 'dg-mini')}${b('bd', 'blok aygıtlar', '', 'dg-mini')}${b('cd', 'karakter aygıtlar', '', 'dg-mini')}</div></div>`, b('dd', 'aygıt sürücüleri', '', 'dg-w100'), b('hw', 'donanım', '', 'dg-hw dg-w100')), text: '<b>Linux: monolitik + modüler</b>. Çekirdeğin tamamı tek adres alanında, çekirdek modunda çalışır (performans). Ama sürücüler ve dosya sistemleri gibi işlevler <b>yüklenebilir çekirdek modülleri</b> olarak çalışma anında eklenip çıkarılabilir.' },
      { label: 'Mikroçekirdek', html: col(band('kullanıcı modu', 'dg-user', row(b('app', 'uygulama programı'), b('fs', 'dosya sistemi'), b('dd', 'aygıt sürücüsü'))), `<div class="dg-msgline">⇅ mesajlar ⇅</div>`, band('çekirdek modu', 'dg-kernel', `<div class="dg-b dg-nest dg-os dg-w100"><b>mikroçekirdek</b>${row(b('ipc', 'işlemler arası iletişim', '', 'dg-mini'), b('mm', 'bellek yönetimi', '', 'dg-mini'), b('cpu', 'CPU zamanlama', '', 'dg-mini'))}</div>`), b('hw', 'donanım', '', 'dg-hw dg-w100')), text: '<b>Mikroçekirdek</b>: çekirdekte yalnızca en temel işlevler kalır. Dosya sistemi ve sürücüler <b>kullanıcı alanına</b> taşınır. Uygulama ile dosya sistemi doğrudan konuşmaz; <b>mikroçekirdek üzerinden mesaj geçirir</b>. Artı: taşıma ve genişletme kolay, daha güvenilir. Eksi: mesaj geçişinin performans yükü.' },
      { label: 'Modüler (LKM)', html: `<div class="dg-lkm">${b('core', 'çekirdek (core kernel)', '', 'dg-os dg-lkm-core')}${['zamanlama sınıfları', 'dosya sistemleri', 'yüklenebilir sistem çağrıları', 'çalıştırılabilir biçimler', 'STREAMS modülleri', 'aygıt ve veri yolu sürücüleri', 'diğer modüller'].map((t, i) => b('m' + i, t, '', 'dg-mini dg-lkm-m')).join('')}</div>`, text: '<b>Yüklenebilir çekirdek modülleri (LKM)</b>: temel bileşenler ayrıdır, nesne yönelimli yaklaşım kullanılır, haberleşme arayüzler üzerinden olur ve modüller gerektikçe çekirdeğe yüklenir. Katmanlıya benzer ama daha esnektir: her modül diğerini çağırabilir, mesaj geçişi gerekmez (Linux, Solaris).' },
      { label: 'Hibrit (macOS)', html: col(b('a', 'uygulamalar', '', 'dg-w100'), b('ux', 'kullanıcı deneyimi', '', 'dg-w100'), b('af', 'uygulama çerçeveleri', '', 'dg-w100'), b('cf', 'çekirdek çerçeveleri', '', 'dg-w100'), `<div class="dg-b dg-nest dg-os dg-w100"><b>çekirdek ortamı: Darwin</b>${row(b('mach', 'Mach trap\'leri', 'zamanlama · IPC · bellek', 'dg-mini'), b('bsd', 'BSD (POSIX) sistem çağrıları', '', 'dg-mini'), b('kx', 'iokit · kexts', 'modüller', 'dg-mini'))}</div>`), text: '<b>Hibrit</b>: birden çok yaklaşımın birleşimi. macOS/iOS katmanlıdır; çekirdeği <b>Darwin</b>, <b>Mach mikroçekirdeği</b> ile <b>BSD UNIX</b>\'i birleştirir ve kexts ile modülerdir. Windows çoğunlukla monolitik olup alt sistemler için mikroçekirdek özellikleri taşır. Linux da monolitik + modülerdir.' }
    ]
  };

  D.boot = {
    kind: 'stepper',
    intro: 'Güç düğmesinden çalışan sisteme.',
    html: col(
      b('pw', 'Güç verilir', 'yürütme sabit bir bellek adresinde başlar'),
      ar('down'),
      b('fw', 'Firmware: BIOS veya UEFI', 'ROM / EEPROM · bootstrap loader', 'dg-hw'),
      ar('down'),
      b('bb', 'Boot block / önyükleyici (GRUB)', 'menü: hangi çekirdek, hangi seçenekler?', 'dg-tool'),
      ar('down'),
      b('k', 'Çekirdek belleğe yüklenir', '/boot/vmlinuz-<sürüm>', 'dg-os'),
      ar('down'),
      b('init', 'Çekirdek başlar', 'donanımı tanır, kök dosya sistemini bağlar, ilk işlemi başlatır'),
      ar('down'),
      b('run', 'Sistem çalışıyor (running)', 'daemon\'lar, giriş ekranı', 'dg-mem')
    ),
    steps: [
      { on: ['pw'], text: 'Güç verildiğinde CPU, yürütmeye <b>sabit bir bellek konumunda</b> başlar. Orada kalıcı bellekte duran kod vardır.' },
      { on: ['fw'], text: '<b>Bootstrap loader</b> (BIOS): ROM veya EEPROM\'da saklanan küçük kod. Donanımı sınar ve çekirdeği ya da onu yükleyecek kodu bulur. Modern sistemlerde BIOS\'un yerini <b>UEFI</b> almıştır.' },
      { on: ['bb'], text: 'Çoğu zaman <b>iki adımlıdır</b>: ROM kodu diskteki sabit konumdan <b>boot block</b>\'u yükler, o da asıl önyükleyiciyi yükler. <b>GRUB</b>, birden çok diskten, çekirdek sürümünden ve seçenekten seçim yapmaya izin verir.' },
      { on: ['k'], text: 'Seçilen çekirdek imajı (<b>vmlinuz</b>) belleğe yüklenir ve kontrol ona verilir.' },
      { on: ['init'], text: 'Çekirdek donanımı tanır, kök dosya sistemini bağlar ve ilk kullanıcı işlemini (Linux\'ta <b>systemd</b>, pid 1) başlatır. Önyükleyici <b>tek kullanıcı modu</b> gibi başlatma durumlarına da izin verebilir.' },
      { on: ['run'], text: 'Arka plan servisleri (<b>daemon</b>\'lar) başlar; sistem artık <b>çalışıyor</b> ve kesmelerle yönetiliyor.' }
    ]
  };

  D.debugtools = {
    kind: 'explorer',
    hint: 'Bir katmana tıkla: o katmanı izleyen araçlar (slayt 2.66).',
    html: col(
      b('app', 'Uygulamalar', '', 'dg-w100'),
      b('lib', 'Sistem kütüphaneleri', '', 'dg-w100'),
      b('sci', 'Sistem çağrısı arayüzü', '', 'dg-w100 dg-iface'),
      row(
        col(b('vfs', 'VFS · dosya sistemleri', '', 'dg-w100'), b('blk', 'hacim yöneticisi · blok aygıt arayüzü', '', 'dg-w100')),
        col(b('net', 'soketler · TCP/UDP · IP · Ethernet', '', 'dg-w100')),
        col(b('sched', 'zamanlayıcı', '', 'dg-w100'), b('vm', 'sanal bellek', '', 'dg-w100'))
      ),
      b('drv', 'Aygıt sürücüleri', '', 'dg-w100'),
      b('hw', 'CPU · DRAM', '', 'dg-w100 dg-hw')
    ),
    info: {
      app: '<b>gdb</b> (kaynak düzeyinde hata ayıklayıcı), <b>perf</b>; dil izleyicileri (java*, python*, node*), ucalls, uflow, uobjnew, uthreads.',
      lib: 'bashreadline, gethostlatency, <b>memleak</b> (bellek sızıntısı), sslsniff.',
      sci: '<b>strace</b> (işlemin sistem çağrılarını izler), syscount, <b>opensnoop</b> (açılan dosyalar), statsnoop, <b>execsnoop</b> (yeni işlemler), killsnoop.',
      vfs: 'filetop, fileslower, vfscount, vfsstat, cachestat, ext4slower, xfsslower.',
      blk: 'biotop, biosnoop, <b>biolatency</b>, bitesize, <b>disksnoop.py</b> (disk G/Ç etkinliği).',
      net: '<b>tcpdump</b> (ağ paketlerini toplar), tcptop, tcplife, tcpconnect, tcpaccept, tcpretrans.',
      sched: 'runqlat, runqlen, cpudist, offcputime, deadlock_detector.',
      vm: 'memleak, oomkill, slabratetop.',
      drv: 'hardirqs, softirqs, ttysnoop.',
      hw: '<b>profile</b> (komut göstericisini periyodik örnekler: profiling), llcstat, <b>perf</b>. Ayrıca sistem geneli için <b>top</b> / Görev Yöneticisi.'
    }
  };

  /* =============================================================== BÖLÜM 3 */

  D.procmem = {
    kind: 'explorer',
    stageCls: 'dg-split',
    hint: 'Soldaki koddan bir satıra tıkla.',
    html: `<pre class="dg-code">${[
      ['', '#include &lt;stdio.h&gt;'],
      ['', '#include &lt;stdlib.h&gt;'],
      ['', ''],
      ['x', 'int x;'],
      ['y', 'int y = 15;'],
      ['', ''],
      ['main', 'int main(int argc, char *argv[])'],
      ['', '{'],
      ['vals', '    int *values;'],
      ['i', '    int i;'],
      ['', ''],
      ['mal', '    values = (int *)malloc(sizeof(int)*5);'],
      ['', ''],
      ['loop', '    for(i = 0; i &lt; 5; i++)'],
      ['loop', '        values[i] = i;'],
      ['', ''],
      ['ret', '    return 0;'],
      ['', '}']
    ].map(([k, t]) => `<span class="dg-cl${k ? ' dg-hit' : ''}"${k ? ` data-k="${k}"` : ''}>${t || ' '}</span>`).join('')}</pre>
      <div class="dg-memmap">
        <div class="dg-addr">yüksek bellek</div>
        ${b('s-args', 'argc, argv', '', 'dg-seg')}
        ${b('s-stack', 'stack', '↓ aşağı büyür', 'dg-seg')}
        <div class="dg-gap">boş alan</div>
        ${b('s-heap', 'heap', '↑ yukarı büyür', 'dg-seg')}
        ${b('s-bss', 'uninitialized data', '', 'dg-seg')}
        ${b('s-data', 'initialized data', '', 'dg-seg')}
        ${b('s-text', 'text', '', 'dg-seg')}
        <div class="dg-addr">düşük bellek</div>
      </div>`,
    info: {
      x: { text: '<code>int x;</code> başlangıç değeri <b>verilmemiş</b> global değişken → <b>uninitialized data</b> (BSS).', hl: ['s-bss'] },
      y: { text: '<code>int y = 15;</code> başlangıç değeri <b>verilmiş</b> global değişken → <b>initialized data</b>.', hl: ['s-data'] },
      main: { text: 'Komut satırı argümanları <b>argc, argv</b> en yüksek adreslerde, stack\'in üstünde tutulur. main\'in makine kodu ise <b>text</b> bölümündedir.', hl: ['s-args', 's-text'] },
      vals: { text: '<code>int *values;</code> fonksiyonun <b>yerel değişkeni</b> → <b>stack</b>. Fonksiyon dönünce yok olur.', hl: ['s-stack'] },
      i: { text: '<code>int i;</code> yerel değişken → <b>stack</b>.', hl: ['s-stack'] },
      mal: { text: '<code>malloc</code> çalışma anında <b>heap</b>\'ten 5 tamsayılık yer ayırır. Dikkat: işaretçinin kendisi (values) stack\'te, gösterdiği blok heap\'tedir.', hl: ['s-heap', 's-stack'] },
      loop: { text: 'Döngünün <b>komutları</b> text bölümünde; yazdığı veriler (values[i]) heap\'te.', hl: ['s-text', 's-heap'] },
      ret: { text: '<code>return 0;</code> derlenmiş komut olarak <b>text</b> bölümünde. Dönüşte main\'in stack çerçevesi kaldırılır.', hl: ['s-text'] },
      's-args': 'Komut satırı argümanları ve ortam değişkenleri.',
      's-stack': '<b>Stack</b>: fonksiyon çağrılarının geçici verileri: parametreler, dönüş adresleri, yerel değişkenler. Yüksek adresten aşağı büyür.',
      's-heap': '<b>Heap</b>: çalışma anında dinamik olarak ayrılan bellek (malloc / new). Yukarı büyür.',
      's-bss': 'Başlangıç değeri verilmemiş global/statik değişkenler.',
      's-data': 'Başlangıç değeri verilmiş global/statik değişkenler.',
      's-text': '<b>Text</b>: programın çalıştırılabilir kodu.'
    }
  };

  D.pcb = {
    kind: 'explorer',
    hint: 'Bir PCB alanına tıkla.',
    html: `<div class="dg-pcb">${[
      ['st', 'işlem durumu (process state)'], ['pid', 'işlem numarası (process number)'], ['pc', 'program sayacı (program counter)'],
      ['reg', 'yazmaçlar (registers)'], ['sch', 'CPU zamanlama bilgisi'], ['mem', 'bellek sınırları (memory limits)'],
      ['files', 'açık dosyalar listesi'], ['acct', 'hesap tutma bilgisi'], ['more', '• • •']
    ].map(([k, t]) => b(k, t, '', 'dg-w100')).join('')}</div>`,
    info: {
      st: '<b>İşlem durumu</b>: new, ready, running, waiting, terminated.',
      pid: '<b>İşlem numarası</b>: her işlemin benzersiz kimliği (PID).',
      pc: '<b>Program sayacı</b>: işlem için yürütülmesi gereken bir sonraki komutun adresi. Bağlam değişiminde kaydedilmezse işlem kaldığı yerden devam edemez.',
      reg: '<b>CPU yazmaçları</b>: sayısı ve türü mimariye göre değişir (akümülatör, indeks, yığın işaretçisi, genel amaçlı yazmaçlar, durum kodları).',
      sch: '<b>CPU zamanlama bilgisi</b>: işlem önceliği, zamanlama kuyruklarına işaretçiler ve diğer zamanlama parametreleri.',
      mem: '<b>Bellek yönetimi bilgisi</b>: taban (base) ve sınır (limit) yazmaçlarının değerleri, sayfa tabloları veya segment tabloları.',
      files: '<b>G/Ç durum bilgisi</b>: işleme ayrılmış G/Ç aygıtları ve açık dosyaların listesi.',
      acct: '<b>Hesap tutma bilgisi</b>: kullanılan CPU ve gerçek zaman, zaman sınırları, hesap numaraları, iş/işlem numaraları.',
      more: 'İşletim sistemine göre başka alanlar.'
    }
  };

  D.ctxswitch = {
    kind: 'stepper',
    intro: 'CPU\'nun P₀\'dan P₁\'e ve geri geçişi (slayt 3.13).',
    html: `<div class="dg-grid3">
        <div class="dg-colhead">işlem P₀</div><div class="dg-colhead">işletim sistemi</div><div class="dg-colhead">işlem P₁</div>
        ${b('p0a', 'yürütülüyor', '', 'dg-run')}<div></div>${b('p1i1', 'boşta', '', 'dg-idle')}
        <div></div>${b('os1', 'kesme veya sistem çağrısı')}<div></div>
        ${b('p0i', 'boşta', '', 'dg-idle')}${b('s0', 'durumu PCB₀\'a kaydet')}<div></div>
        <div></div>${b('l1', 'durumu PCB₁\'den yükle')}<div></div>
        <div></div><div></div>${b('p1a', 'yürütülüyor', '', 'dg-run')}
        <div></div>${b('os2', 'kesme veya sistem çağrısı')}<div></div>
        <div></div>${b('s1', 'durumu PCB₁\'e kaydet')}${b('p1i2', 'boşta', '', 'dg-idle')}
        <div></div>${b('l0', 'durumu PCB₀\'dan yükle')}<div></div>
        ${b('p0b', 'yürütülüyor', '', 'dg-run')}<div></div><div></div>
      </div>`,
    steps: [
      { on: ['p0a', 'p1i1'], text: 'P₀ CPU\'da çalışıyor, P₁ bekliyor.' },
      { on: ['os1'], text: 'Bir <b>kesme</b> (ör. zaman dilimi doldu) veya P₀\'ın <b>sistem çağrısı</b> kontrolü işletim sistemine verir.' },
      { on: ['s0', 'p0i'], text: 'İşletim sistemi P₀\'ın bağlamını (program sayacı, yazmaçlar, durum) <b>PCB₀\'a kaydeder</b>.' },
      { on: ['l1'], text: 'P₁\'in kaydedilmiş bağlamını <b>PCB₁\'den yükler</b>. Bu iki adım boyunca hiçbir işlem çalışmaz: <b>saf ek yük</b>.' },
      { on: ['p1a'], text: 'P₁ kaldığı yerden yürütülür.' },
      { on: ['os2'], text: 'Yine bir kesme veya sistem çağrısı.' },
      { on: ['s1', 'p1i2'], text: 'P₁\'in durumu PCB₁\'e kaydedilir.' },
      { on: ['l0'], text: 'P₀\'ın durumu PCB₀\'dan yüklenir.' },
      { on: ['p0b'], text: 'P₀, ilk durdurulduğu komuttan devam eder; kesildiğini fark etmez.' }
    ]
  };

  D.queues = {
    kind: 'stepper',
    intro: 'Bir işlemin (P₇) kuyruklar arasındaki yolculuğu (slayt 3.19).',
    html: `<div class="dg-qd">
        ${row(b('rq', 'hazır kuyruğu', '', 'dg-q'), ar(), b('cpu', 'CPU', '', 'dg-cpu'), ar(), b('exit', 'sonlandı'))}
        ${row(b('io', 'G/Ç'), ar('left'), b('ioq', 'G/Ç bekleme kuyruğu', '', 'dg-q'), ar('left'), b('ioreq', 'G/Ç isteği'))}
        ${row(b('ts', 'zaman dilimi doldu', '→ hazır kuyruğuna'))}
        ${row(b('ct', 'çocuk sonlanır'), ar('left'), b('ctq', 'çocuk sonlanma bekleme kuyruğu', '', 'dg-q'), ar('left'), b('fork', 'çocuk işlem oluştur'))}
        ${row(b('int', 'kesme olur'), ar('left'), b('intq', 'kesme bekleme kuyruğu', '', 'dg-q'), ar('left'), b('wint', 'kesme bekle'))}
      </div><p class="dg-note">Sol sütundaki her olayın sonunda işlem <b>hazır kuyruğuna</b> geri döner.</p>`,
    steps: [
      { on: ['rq'], text: 'P₇ oluşturuldu ve <b>hazır kuyruğuna</b> eklendi (PCB\'si bağlı listenin sonuna).' },
      { on: ['cpu'], text: 'Zamanlayıcı P₇\'yi seçti (<b>dispatch</b>): CPU\'da çalışıyor.' },
      { on: ['ioreq', 'ioq'], text: 'P₇ bir <b>G/Ç isteği</b> yaptı → <b>G/Ç bekleme kuyruğuna</b> girdi (waiting).' },
      { on: ['io', 'rq'], text: 'G/Ç tamamlandı → P₇ tekrar <b>hazır kuyruğunda</b>.' },
      { on: ['cpu'], text: 'Tekrar CPU\'da.' },
      { on: ['ts', 'rq'], text: '<b>Zaman dilimi doldu</b> (zamanlayıcı kesmesi) → doğrudan hazır kuyruğuna döner.' },
      { on: ['cpu', 'fork', 'ctq'], text: 'Tekrar çalışırken bir <b>çocuk işlem oluşturdu</b> ve onun bitmesini bekliyor → çocuk sonlanma bekleme kuyruğu.' },
      { on: ['ct', 'rq'], text: 'Çocuk sonlandı → P₇ hazır kuyruğuna döner.' },
      { on: ['cpu', 'exit'], text: 'Son kez CPU\'yu alır ve işini bitirip <b>sonlanır</b>: PCB\'si ve kaynakları geri alınır.' }
    ]
  };

  D.fork = {
    kind: 'stepper',
    stageCls: 'dg-split',
    intro: 'fork() – exec() – wait() (slayt 3.24 ve 3.26).',
    html: `<pre class="dg-code">${[
      ['c1', 'pid_t pid;'],
      ['c2', 'pid = fork();          /* çocuk oluştur */'],
      ['c3', 'if (pid &lt; 0) {        /* hata */'],
      ['', '    fprintf(stderr, "Fork Failed"); return 1;'],
      ['c4', '} else if (pid == 0) { /* çocuk */'],
      ['c5', '    execlp("/bin/ls", "ls", NULL);'],
      ['c6', '} else {               /* ebeveyn */'],
      ['c7', '    wait(NULL);'],
      ['c8', '    printf("Child Complete");'],
      ['', '}'],
      ['c9', 'return 0;']
    ].map(([k, t]) => `<span class="dg-cl"${k ? ` data-k="${k}"` : ''}>${t}</span>`).join('')}</pre>
      <div class="dg-col">
        <div class="dg-b dg-proc" data-k="par"><b>Ebeveyn · pid = x</b><small data-v="pn">pid değişkeni = ?</small><small data-v="ps">çalışıyor</small></div>
        <div class="dg-b dg-proc dg-child" data-k="chi"><b>Çocuk · pid = y</b><small data-v="cn">pid değişkeni = 0</small><small data-v="cs">ebeveynin kopyası</small></div>
      </div>`,
    initSet: { pn: 'pid değişkeni = ?', ps: 'çalışıyor' },
    initHide: ['chi'],
    steps: [
      { on: ['c1', 'par'], hide: ['chi'], text: 'Tek bir işlem var: ebeveyn (pid = x).' },
      { on: ['c2', 'par', 'chi'], hide: [], set: { pn: 'pid değişkeni = y', cn: 'pid değişkeni = 0', cs: 'ebeveynin kopyası (aynı kod, aynı noktada)' }, text: '<b>fork()</b> ebeveynin adres alanının kopyası olan bir çocuk oluşturur ve <b>iki kez döner</b>: ebeveynde çocuğun pid\'i (<b>y &gt; 0</b>), çocukta <b>0</b>. İkisi de bir sonraki satırdan devam eder.' },
      { on: ['c6', 'c7', 'par'], set: { ps: 'wait(): çocuğu bekliyor (waiting)' }, text: 'Ebeveynde pid = y &gt; 0 → else dalı. <b>wait()</b> ile çocuk bitene kadar bekler.' },
      { on: ['c4', 'c5', 'chi'], set: { cs: 'exec → artık /bin/ls programı' }, text: 'Çocukta pid == 0 → <b>execlp()</b>: çocuğun bellek alanı <b>ls programıyla değiştirilir</b>. Yeni işlem oluşmaz; aynı pid (y) artık ls\'i çalıştırır.' },
      { on: ['chi'], set: { cs: 'ls bitti → exit()' }, text: 'ls çıktısını verir ve <b>exit()</b> ile sonlanır; çıkış durumu ebeveyne iletilecek.' },
      { on: ['c8', 'par'], hide: ['chi'], set: { ps: 'wait() döndü → çalışıyor' }, text: 'Ebeveynin <b>wait()</b> çağrısı döner, "Child Complete" yazılır. Ebeveyn wait() çağırmasaydı çocuk bir süre <b>zombie</b> kalırdı.' },
      { on: ['c9', 'par'], set: { ps: 'sonlanıyor' }, text: 'Ebeveyn de return 0 ile sonlanır.' }
    ]
  };

  const tree = (n) => `<li><span class="dg-node${n.cls ? ' ' + n.cls : ''}">${n.t}<small>pid = ${n.pid}</small></span>${n.c && n.c.length ? `<ul>${n.c.map(tree).join('')}</ul>` : ''}</li>`;
  const ptree = (mod) => {
    const base = { t: 'systemd', pid: 1, c: [
      { t: 'logind', pid: 8415, c: [{ t: 'bash', pid: 8416, c: [{ t: 'ps', pid: 9298 }, { t: 'vim', pid: 9204 }] }] },
      { t: 'python', pid: 2808 },
      { t: 'sshd', pid: 3028, c: [{ t: 'sshd', pid: 3610, c: [{ t: 'tcsh', pid: 4005 }] }] }
    ] };
    mod(base);
    return `<ul class="dg-tree">${tree(base)}</ul>`;
  };
  D.ptree = {
    kind: 'tabs',
    panes: [
      { label: 'İşlem ağacı', html: ptree(() => {}), text: 'Linux\'ta işlem ağacı (slayt 3.25). Kök <b>systemd (pid 1)</b>, tüm kullanıcı işlemlerinin atasıdır. Her işlemin bir ebeveyni ve pid\'i vardır.' },
      { label: 'Zombie', html: ptree((t) => { t.c[0].c[0].c[1] = { t: 'vim &lt;defunct&gt;', pid: 9204, cls: 'dg-zombie' }; }), text: '<b>Zombie</b>: vim sonlandı, ama ebeveyni bash henüz <code>wait()</code> çağırmadı. İşlem tablosunda girdisi (çıkış durumu) durur. Ebeveyn wait() çağırınca kaldırılır.' },
      { label: 'Orphan', html: ptree((t) => { t.c[0].c[0].cls = 'dg-dead'; t.c[0].c[0].t = 'bash (sonlandı)'; t.c.push({ t: 'vim', pid: 9204, cls: 'dg-orphan' }); t.c[0].c[0].c = [{ t: 'ps', pid: 9298 }]; }), text: '<b>Orphan (öksüz)</b>: ebeveyn bash, wait() çağırmadan sonlandı; vim ebeveynsiz kaldı. (Ek) Linux\'ta öksüz işlemleri <b>systemd/init</b> sahiplenir ve düzenli olarak wait() çağırarak temizler.' },
      { label: 'Basamaklı sonlandırma', html: ptree((t) => { const s = t.c[2]; s.cls = 'dg-dead'; s.c[0].cls = 'dg-dead'; s.c[0].c[0].cls = 'dg-dead'; }), text: '<b>Cascading termination</b>: bazı işletim sistemleri ebeveyn sonlanınca çocukların yaşamasına izin vermez. sshd (3028) sonlanırsa çocukları ve torunları da (3610, 4005) işletim sistemi tarafından sonlandırılır.' }
    ]
  };

  D.ipc = {
    kind: 'tabs',
    panes: [
      { label: '(a) Paylaşılan bellek', html: `<div class="dg-memcol">${b('a', 'işlem A')}${b('sh', 'paylaşılan bellek', 'A yazar ⇅ B okur', 'dg-shared')}${b('b2', 'işlem B')}<div class="dg-gap">…</div>${b('k', 'çekirdek', '', 'dg-os')}</div>`, text: '<b>Paylaşılan bellek</b>: iletişim kurmak isteyen işlemler arasında paylaşılan bir bellek bölgesi kurulur. İletişim işletim sisteminin değil, <b>kullanıcı işlemlerinin kontrolündedir</b>; çekirdek yalnızca bölgeyi kurarken devreye girer. Sorun: işlemler erişimlerini kendileri <b>senkronize</b> etmelidir (Bölüm 6–7).' },
      { label: '(b) Mesaj geçişi', html: `<div class="dg-memcol">${b('a', 'işlem A', 'send(m)')}${b('b2', 'işlem B', 'receive(m)')}<div class="dg-gap">…</div><div class="dg-b dg-nest dg-os"><b>çekirdek</b><div class="dg-row dg-msgq">${['m₀', 'm₁', 'm₂', 'm₃', '…', 'mₙ'].map((m) => `<span>${m}</span>`).join('')}</div><small>mesaj kuyruğu</small></div></div>`, text: '<b>Mesaj geçişi</b>: işlemler bellek paylaşmadan <code>send</code> ve <code>receive</code> ile haberleşir. Mesajlar <b>çekirdekteki mesaj kuyruğundan</b> geçer. Senkronizasyon daha kolaydır, dağıtık sistemlerde de çalışır; ama her mesaj sistem çağrısı gerektirdiği için daha yavaştır.' }
    ]
  };

  D.pipe = {
    kind: 'explorer',
    hint: 'Bir uca tıkla.',
    html: row(
      `<div class="dg-b dg-nest"><b>Ebeveyn</b>${b('pr', 'fd[0]', 'okuma ucu', 'dg-mini')}${b('pw', 'fd[1]', 'yazma ucu', 'dg-mini')}</div>`,
      `<div class="dg-pipe-tube" data-k="tube"><span>pipe</span><small>fd[1] → → → fd[0]</small></div>`,
      `<div class="dg-b dg-nest"><b>Çocuk</b>${b('cr', 'fd[0]', 'okuma ucu', 'dg-mini')}${b('cw', 'fd[1]', 'yazma ucu', 'dg-mini')}</div>`
    ),
    info: {
      pw: { text: '<b>fd[1] = yazma ucu (write-end)</b>. Üretici (burada ebeveyn) buraya yazar.', hl: ['tube', 'cr'] },
      pr: 'Ebeveynin okuma ucu. Ebeveyn yalnızca yazıyorsa bu uç kapatılmalıdır (Ek).',
      cr: { text: '<b>fd[0] = okuma ucu (read-end)</b>. Tüketici (çocuk) buradan okur.', hl: ['tube', 'pw'] },
      cw: 'Çocuğun yazma ucu. Çocuk yalnızca okuyorsa kapatılmalıdır (Ek).',
      tube: '<b>Sıradan pipe</b>: tek yönlüdür. Ebeveyn <code>pipe(fd)</code> ile oluşturur, sonra <code>fork()</code> yapar; çocuk açık dosya tanımlayıcılarını <b>miras alır</b>. Bu yüzden ebeveyn–çocuk ilişkisi gerekir. Windows\'ta <b>anonymous pipe</b> denir.'
    }
  };

  D.socket = {
    kind: 'explorer',
    hint: 'Bir sokete tıkla.',
    html: row(
      `<div class="dg-b dg-nest dg-cloud"><b>host X (146.86.5.20)</b>${b('cs', 'soket', '146.86.5.20:1625', 'dg-mini')}</div>`,
      `<div class="dg-pipe-tube" data-k="conn"><span>bağlantı</span></div>`,
      `<div class="dg-b dg-nest dg-cloud"><b>web sunucusu (161.25.19.8)</b>${b('ss', 'soket', '161.25.19.8:80', 'dg-mini')}</div>`
    ),
    info: {
      cs: 'İstemci soketi. Port <b>1625</b>, istemcinin işletim sistemi tarafından keyfi olarak atanmış ve 1024\'ten büyüktür.',
      ss: 'Sunucu soketi. Port <b>80</b> (&lt; 1024): web (HTTP) için <b>iyi bilinen</b> standart port.',
      conn: 'İletişim <b>bir çift soket</b> arasında gerçekleşir. Her bağlantı (istemci IP:port, sunucu IP:port) çiftiyle benzersizdir.'
    }
  };

  D.rpc = {
    kind: 'stepper',
    intro: 'RPC\'nin yürütülmesi: istemci, X yordamının hangi porttan sunulduğunu bilmiyor (slayt 3.75).',
    html: `<div class="dg-grid3 dg-rpc">
        <div class="dg-colhead">istemci</div><div class="dg-colhead">mesajlar</div><div class="dg-colhead">sunucu</div>
        ${b('c1', 'kullanıcı, X yordamına RPC mesajı göndermek için çekirdeği çağırır')}<div></div><div></div>
        ${b('c2', 'çekirdek, port numarasını bulmak için matchmaker\'a mesaj gönderir')}${b('m1', 'From: client · To: server', 'Port: matchmaker · Re: RPC X\'in adresi', 'dg-msg')}${b('s1', 'matchmaker mesajı alır, cevabı arar')}
        ${b('c3', 'çekirdek, P portunu kullanıcının RPC mesajına koyar')}${b('m2', 'From: server · To: client', 'Port: kernel · Re: RPC X · Port: P', 'dg-msg')}${b('s2', 'matchmaker istemciye P portuyla yanıt verir')}
        ${b('c4', 'çekirdek RPC\'yi gönderir')}${b('m3', 'From: client · To: server', 'Port: P · &lt;içerik&gt;', 'dg-msg')}${b('s3', 'P portunu dinleyen daemon mesajı alır')}
        ${b('c5', 'çekirdek yanıtı alır, kullanıcıya iletir')}${b('m4', 'From: RPC · Port: P', 'To: client · Port: kernel · &lt;çıktı&gt;', 'dg-msg')}${b('s4', 'daemon isteği işler ve çıktıyı gönderir')}
      </div>`,
    steps: [
      { on: ['c1'], text: 'Kullanıcı programı uzak X yordamını yerel bir fonksiyon gibi çağırır; istemci <b>stub</b>\'ı parametreleri paketler (marshalling) ve çekirdeğe verir.' },
      { on: ['c2', 'm1', 's1'], text: 'İstemci çekirdeği X\'in portunu bilmiyor. Sunucudaki <b>matchmaker</b> (buluşma servisi) bilinen sabit bir porttan dinler; ona sorulur.' },
      { on: ['s2', 'm2', 'c3'], text: 'Matchmaker, X\'in <b>P portunda</b> çalıştığını bildirir; çekirdek P\'yi mesaja yerleştirir.' },
      { on: ['c4', 'm3', 's3'], text: 'Asıl RPC mesajı (parametrelerle) P portuna gönderilir; orayı dinleyen <b>daemon</b> alır ve sunucu stub\'ı parametreleri açar.' },
      { on: ['s4', 'm4', 'c5'], text: 'Daemon yordamı yürütür, çıktıyı geri gönderir; istemci çekirdeği yanıtı kullanıcıya iletir. Kullanıcı için bu sıradan bir fonksiyon dönüşü gibidir.' }
    ]
  };

  /* =============================================================== özel etkileşimler */

  // İşlem durum diyagramı: yalnızca mevcut durumdan geçerli olaylar etkin
  const STATES = {
    new: { x: 100, y: 52, label: 'new', tr: 'yeni' },
    ready: { x: 200, y: 150, label: 'ready', tr: 'hazır' },
    running: { x: 460, y: 150, label: 'running', tr: 'çalışıyor' },
    waiting: { x: 330, y: 250, label: 'waiting', tr: 'bekliyor' },
    terminated: { x: 560, y: 52, label: 'terminated', tr: 'bitti' }
  };
  const EDGES = [
    { id: 'admitted', from: 'new', to: 'ready', d: 'M 140 72 Q 170 100 178 124', lx: 182, ly: 92, label: 'admitted', tr: 'işlem kabul edildi' },
    { id: 'dispatch', from: 'ready', to: 'running', d: 'M 250 168 Q 330 205 410 168', lx: 330, ly: 203, label: 'scheduler dispatch', tr: 'zamanlayıcı seçti' },
    { id: 'interrupt', from: 'running', to: 'ready', d: 'M 410 132 Q 330 96 250 132', lx: 330, ly: 103, label: 'interrupt', tr: 'kesme / zaman dilimi doldu' },
    { id: 'exit', from: 'running', to: 'terminated', d: 'M 492 126 Q 520 92 534 76', lx: 548, ly: 104, label: 'exit', tr: 'çıkış' },
    { id: 'iowait', from: 'running', to: 'waiting', d: 'M 448 176 Q 428 228 392 244', lx: 500, ly: 222, label: 'I/O or event wait', tr: 'G/Ç veya olay bekleme' },
    { id: 'iodone', from: 'waiting', to: 'ready', d: 'M 268 244 Q 222 228 206 176', lx: 158, ly: 222, label: 'I/O or event completion', tr: 'G/Ç veya olay tamamlandı' }
  ];
  const EXPLAIN = {
    admitted: 'İşletim sistemi yeni işlemi kabul etti; PCB\'si hazır kuyruğuna eklendi.',
    dispatch: 'Kısa vadeli zamanlayıcı bu işlemi seçti; dispatcher bağlamını yükledi, CPU\'yu verdi.',
    interrupt: 'Bir kesme geldi (ör. zaman dilimi doldu). İşlem CPU\'yu bıraktı ama hâlâ çalışmaya hazır: hazır kuyruğuna döner.',
    iowait: 'İşlem G/Ç veya bir olay istedi; tamamlanana kadar ilerleyemez → bekleme (aygıt) kuyruğu.',
    iodone: 'Beklenen olay gerçekleşti. İşlem doğrudan çalışmaz, önce <b>hazır</b> olur.',
    exit: 'İşlem son komutunu yürüttü ve exit() çağırdı; kaynakları geri alınır.'
  };

  D.states = {
    kind: 'custom',
    render() {
      const ell = Object.entries(STATES).map(([k, s]) => `<g class="st-node" data-state="${k}"><ellipse cx="${s.x}" cy="${s.y}" rx="68" ry="25"/><text x="${s.x}" y="${s.y - 1}" text-anchor="middle">${s.label}</text><text class="s" x="${s.x}" y="${s.y + 13}" text-anchor="middle">${s.tr}</text></g>`).join('');
      const edges = EDGES.map((e) => `<g class="st-edge" data-edge="${e.id}"><path d="${e.d}" marker-end="url(#st-arrow)"/><text x="${e.lx}" y="${e.ly}" text-anchor="middle">${e.label}</text></g>`).join('');
      return `<figure class="dg dg-states" data-dg="states">
        <svg viewBox="0 0 640 290" role="img" aria-label="İşlem durum diyagramı"><defs><marker id="st-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z"/></marker></defs>${edges}${ell}</svg>
        <div class="dg-ctrl st-buttons">${EDGES.map((e) => `<button class="btn btn-sm" type="button" data-ev="${e.id}">${e.tr}</button>`).join('')}<button class="btn btn-sm btn-ghost" type="button" data-ev="reset">↺ Yeni işlem</button></div>
        <figcaption class="dg-caption"></figcaption>
        <ol class="st-history"></ol>
      </figure>`;
    },
    init(el) {
      let cur = 'new';
      const history = [];
      const cap = el.querySelector('.dg-caption');
      const hist = el.querySelector('.st-history');
      const draw = (msg) => {
        el.querySelectorAll('.st-node').forEach((n) => n.classList.toggle('on', n.dataset.state === cur));
        el.querySelectorAll('.st-edge').forEach((g) => {
          const e = EDGES.find((x) => x.id === g.dataset.edge);
          g.classList.toggle('avail', e.from === cur);
        });
        el.querySelectorAll('[data-ev]').forEach((btn) => {
          const e = EDGES.find((x) => x.id === btn.dataset.ev);
          btn.disabled = !!e && e.from !== cur;
        });
        cap.innerHTML = msg || `İşlem şu an <b>${STATES[cur].label}</b> (${STATES[cur].tr}) durumunda. ${cur === 'terminated' ? 'Ömrünü tamamladı.' : 'Etkin olaylardan birini seç.'}`;
        hist.innerHTML = history.map((h) => `<li>${h}</li>`).join('');
      };
      el.addEventListener('click', (ev) => {
        const btn = ev.target.closest('[data-ev]');
        if (!btn || btn.disabled) return;
        if (btn.dataset.ev === 'reset') {
          cur = 'new';
          history.length = 0;
          draw();
          return;
        }
        const e = EDGES.find((x) => x.id === btn.dataset.ev);
        history.push(`${STATES[e.from].label} → ${STATES[e.to].label} <small>(${e.tr})</small>`);
        cur = e.to;
        draw(`<b>${STATES[e.from].label} → ${STATES[e.to].label}</b>: ${EXPLAIN[e.id]}`);
        const g = el.querySelector(`[data-edge="${e.id}"]`);
        g.classList.remove('fire');
        void g.getBoundingClientRect();
        g.classList.add('fire');
      });
      draw();
    }
  };

  // Dairesel tampon: N−1 çözümü ile sayaç (counter) çözümünü karşılaştırır
  D.ringbuf = {
    kind: 'custom',
    render() {
      return `<figure class="dg dg-ring" data-dg="ringbuf">
        <div class="ring-mode"><label class="toggle"><input type="checkbox" data-act="mode"><span class="toggle-ui"></span><span><b>counter çözümü</b><small>Kapalı: (in+1)%N==out çözümü · Açık: tüm yuvalar sayaçla kullanılır</small></span></label></div>
        <div class="ring-slots"></div>
        <div class="ring-ptrs"></div>
        <div class="dg-ctrl"><button class="btn btn-sm btn-primary" type="button" data-act="produce">+ Üret (üretici)</button><button class="btn btn-sm" type="button" data-act="consume">− Tüket (tüketici)</button><button class="btn btn-sm btn-ghost" type="button" data-act="reset">↺</button></div>
        <div class="ring-conds"></div>
        <figcaption class="dg-caption"></figcaption>
      </figure>`;
    },
    init(el) {
      const N = 8;
      let buf, inP, outP, count, next, counterMode = false;
      const reset = () => { buf = new Array(N).fill(null); inP = 0; outP = 0; count = 0; next = 1; };
      reset();
      const slots = el.querySelector('.ring-slots');
      const ptrs = el.querySelector('.ring-ptrs');
      const conds = el.querySelector('.ring-conds');
      const cap = el.querySelector('.dg-caption');
      const isFull = () => (counterMode ? count === N : (inP + 1) % N === outP);
      const isEmpty = () => (counterMode ? count === 0 : inP === outP);
      const draw = (msg, tone) => {
        slots.innerHTML = buf.map((v, i) => `<div class="ring-slot${v !== null ? ' full' : ''}${!counterMode && i === inP && isFull() ? ' reserved' : ''}"><small>${i}</small>${v !== null ? `<span>#${v}</span>` : ''}</div>`).join('');
        ptrs.innerHTML = Array.from({ length: N }, (_, i) => `<div>${i === inP ? '<b class="p-in">in</b>' : ''}${i === outP ? '<b class="p-out">out</b>' : ''}</div>`).join('');
        const used = buf.filter((v) => v !== null).length;
        conds.innerHTML = counterMode
          ? `<span class="${count === 0 ? 'hit' : ''}">counter == 0 → BOŞ</span><span class="${count === N ? 'hit' : ''}">counter == ${N} → DOLU</span><span>counter = <b>${count}</b></span><span>kapasite: <b>${N}</b></span>`
          : `<span class="${inP === outP ? 'hit' : ''}">in == out → BOŞ</span><span class="${(inP + 1) % N === outP ? 'hit' : ''}">(in+1) % ${N} == out → DOLU</span><span>dolu yuva: <b>${used}</b></span><span>kapasite: <b>${N - 1}</b> (BUFFER_SIZE − 1)</span>`;
        cap.className = `dg-caption${tone ? ' ' + tone : ''}`;
        cap.innerHTML = msg || 'Üretici <code>buffer[in]</code>\'e yazar ve in\'i ilerletir; tüketici <code>buffer[out]</code>\'tan okur ve out\'u ilerletir. İkisi de mod N ile başa sarar.';
      };
      el.addEventListener('click', (ev) => {
        const btn = ev.target.closest('[data-act]');
        if (!btn || btn.dataset.act === 'mode') return;
        const a = btn.dataset.act;
        if (a === 'reset') { reset(); draw(); return; }
        if (a === 'produce') {
          if (isFull()) {
            draw(counterMode ? `DOLU (counter == ${N}): üretici <code>while</code> döngüsünde bekler.` : `DOLU sayılır: (in+1) % ${N} == out. Bir yuva boş olsa da üretici bekler. Yazsaydı in == out olur, bu da "boş" ile karıştırılırdı.`, 'warn');
            return;
          }
          buf[inP] = next++;
          inP = (inP + 1) % N;
          count++;
          draw(`Üretici #${next - 1} öğesini yazdı, in → ${inP}.${counterMode ? ' counter++' : ''}`);
        } else {
          if (isEmpty()) { draw(counterMode ? 'BOŞ (counter == 0): tüketici bekler.' : 'BOŞ (in == out): tüketici bekler.', 'warn'); return; }
          const v = buf[outP];
          buf[outP] = null;
          outP = (outP + 1) % N;
          count--;
          draw(`Tüketici #${v} öğesini aldı, out → ${outP}.${counterMode ? ' counter--' : ''}`);
        }
      });
      el.querySelector('[data-act="mode"]').addEventListener('change', (ev) => {
        counterMode = ev.target.checked;
        reset();
        draw(counterMode ? 'Sayaç çözümü: tüm 8 yuva kullanılabilir. Ama counter\'a <b>iki işlem birden yazar</b> → yarış durumu riski (Synchronization laboratuvarı).' : null);
      });
      draw();
    }
  };

  /* =============================================================== render / init */

  function render(id) {
    const d = D[id];
    if (!d) return `<p class="empty">Şekil bulunamadı: ${id}</p>`;
    if (d.kind === 'custom') return d.render();
    const stage = d.kind === 'tabs'
      ? `<div class="dg-tabs">${d.panes.map((p, i) => `<button type="button" class="dg-tab${i === 0 ? ' active' : ''}" data-tab="${i}">${p.label}</button>`).join('')}</div><div class="dg-stage">${d.panes[0].html}</div>`
      : `<div class="dg-stage${d.stageCls ? ' ' + d.stageCls : ''}">${d.html}</div>`;
    const ctrl = d.kind === 'stepper'
      ? `<div class="dg-ctrl"><button class="btn btn-sm" type="button" data-act="prev">◀ Geri</button><span class="dg-count"></span><button class="btn btn-sm btn-primary" type="button" data-act="next">İleri ▶</button><button class="btn btn-sm btn-ghost" type="button" data-act="play">⏵ Otomatik</button><button class="btn btn-sm btn-ghost" type="button" data-act="reset" title="Başa al">↺</button></div>`
      : '';
    const cap = d.kind === 'tabs' ? d.panes[0].text : d.kind === 'stepper' ? d.intro : d.hint;
    return `<figure class="dg dg-k-${d.kind}" data-dg="${id}">${stage}${ctrl}<figcaption class="dg-caption">${cap}</figcaption></figure>`;
  }

  function initExplorer(el, d) {
    const cap = el.querySelector('.dg-caption');
    el.querySelector('.dg-stage').addEventListener('click', (ev) => {
      const t = ev.target.closest('[data-k]');
      if (!t || !(t.dataset.k in d.info)) return;
      const info = d.info[t.dataset.k];
      const hl = [t.dataset.k].concat(typeof info === 'object' ? info.hl || [] : []);
      el.querySelectorAll('[data-k]').forEach((n) => n.classList.toggle('on', hl.includes(n.dataset.k)));
      cap.innerHTML = typeof info === 'object' ? info.text : info;
    });
  }

  function initStepper(el, d) {
    let i = -1;
    let timer = 0;
    const cap = el.querySelector('.dg-caption');
    const count = el.querySelector('.dg-count');
    const playBtn = el.querySelector('[data-act="play"]');
    const apply = () => {
      const on = i >= 0 ? d.steps[i].on : [];
      const done = new Set();
      const vals = Object.assign({}, d.initSet || {});
      let hide = d.initHide || [];
      for (let j = 0; j <= i; j++) {
        if (j < i) d.steps[j].on.forEach((k) => done.add(k));
        Object.assign(vals, d.steps[j].set || {});
        if (d.steps[j].hide) hide = d.steps[j].hide;
      }
      el.querySelectorAll('[data-k]').forEach((n) => {
        const k = n.dataset.k;
        n.classList.toggle('on', on.includes(k));
        n.classList.toggle('done', !on.includes(k) && done.has(k));
        n.classList.toggle('dg-hidden', hide.includes(k));
      });
      Object.entries(vals).forEach(([k, v]) => el.querySelectorAll(`[data-v="${k}"]`).forEach((n) => { n.textContent = v; }));
      cap.innerHTML = i < 0 ? d.intro : d.steps[i].text;
      count.textContent = `${i + 1} / ${d.steps.length}`;
      el.querySelector('[data-act="prev"]').disabled = i < 0;
      el.querySelector('[data-act="next"]').disabled = i >= d.steps.length - 1;
    };
    const stop = () => { clearInterval(timer); timer = 0; playBtn.textContent = '⏵ Otomatik'; };
    el.querySelector('.dg-ctrl').addEventListener('click', (ev) => {
      const a = ev.target.closest('[data-act]');
      if (!a) return;
      if (a.dataset.act === 'next' && i < d.steps.length - 1) { i++; stop(); }
      if (a.dataset.act === 'prev' && i >= 0) { i--; stop(); }
      if (a.dataset.act === 'reset') { i = -1; stop(); }
      if (a.dataset.act === 'play') {
        if (timer) { stop(); } else {
          if (i >= d.steps.length - 1) i = -1;
          playBtn.textContent = '⏸ Durdur';
          timer = setInterval(() => {
            if (!el.isConnected || i >= d.steps.length - 1) { stop(); return; }
            i++;
            apply();
          }, 2200);
          i++;
        }
      }
      apply();
    });
    apply();
  }

  function initTabs(el, d) {
    const stage = el.querySelector('.dg-stage');
    const cap = el.querySelector('.dg-caption');
    el.querySelector('.dg-tabs').addEventListener('click', (ev) => {
      const t = ev.target.closest('[data-tab]');
      if (!t) return;
      const p = d.panes[Number(t.dataset.tab)];
      el.querySelectorAll('.dg-tab').forEach((x) => x.classList.toggle('active', x === t));
      stage.innerHTML = p.html;
      cap.innerHTML = p.text;
    });
  }

  function init(root) {
    root.querySelectorAll('[data-dg]').forEach((el) => {
      if (el.dataset.ready) return;
      el.dataset.ready = '1';
      const d = D[el.dataset.dg];
      if (!d) return;
      if (d.kind === 'explorer') initExplorer(el, d);
      else if (d.kind === 'stepper') initStepper(el, d);
      else if (d.kind === 'tabs') initTabs(el, d);
      else d.init(el);
    });
  }

  OSLab.diagrams = { render, init, has: (id) => id in D, ids: () => Object.keys(D) };
})(window.OSLab = window.OSLab || {});
