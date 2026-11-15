/*
 * quick-review.js — "Hızlı Tekrar": vize öncesi tüm kapsamın yüksek verimli özeti.
 *
 * Her bilgi sitedeki ders dosyalarından (lessons-ch1..6.js) ve hocanın soruları
 * (teacher-questions.js) dosyasından alınmıştır; yeni bilgi eklenmez.
 * Kapsam exam-scope.js'den okunur: kaynak derslerinin tamamı "vize dışı" olan kart,
 * vize dışı bölümler ve 7. bölüm gösterilmez.
 *
 * Kart alanları:
 *   h       başlık
 *   src     kaynak dersler ('<bölüm>/<ders>'); kapsam denetimi bunlarla yapılır
 *   slides  slayt aralığı (öğrenci PDF'te bulsun diye)
 *   tq      bu kartın cevapladığı hoca soruları (teacher-questions.js id'leri)
 *   blocks  ders bloklarıyla aynı türler (def, list, table, compare, note, code, p)
 * Her bölüm 3–5 hızlı yoklama sorusuyla (checks) biter.
 */
(function (OSLab) {
  'use strict';

  OSLab.quickReview = {
    title: 'Hızlı Tekrar',
    sub: 'Vize kapsamının en çok sorulan kısmı: tanımlar, karşılaştırmalar, formüller',
    chapters: [

      /* ================================================================ Bölüm 1 */
      {
        ch: 'ch1',
        cards: [
          {
            h: 'İşletim sistemi ve çekirdek',
            src: ['ch1/nedir'], slides: '1.13 – 1.20',
            blocks: [
              { t: 'def', term: 'İşletim sistemi', en: 'Operating System', html: 'Donanım ile kullanıcı arasında <b>aracı</b> program. Amaç: programları çalıştırmak, <b>kullanım kolaylığı</b> (convenience), donanımı <b>verimli</b> kullanmak (efficiency).' },
              { t: 'compare', cols: [
                { title: 'Kaynak ayırıcı (resource allocator)', items: ['CPU zamanı, bellek, G/Ç aygıtlarını yönetir', 'Çakışan istekler arasında verimli ve adil karar verir'] },
                { title: 'Kontrol programı (control program)', items: ['Programların ve G/Ç aygıtlarının yürütülmesini denetler', 'Hatalı ve yanlış kullanımı önler'] }
              ] },
              { t: 'def', term: 'Çekirdek', en: 'Kernel', html: 'Bilgisayarda <b>her an çalışan tek program</b>.' },
              { t: 'note', kind: 'exam', html: 'Dört bileşen (sırayla): <b>donanım → işletim sistemi → uygulama/sistem programları → kullanıcılar</b>.' }
            ]
          },
          {
            h: 'Kesmeler (interrupts)',
            src: ['ch1/kesme'], slides: '1.25 – 1.31', tq: ['h33'],
            blocks: [
              { t: 'compare', cols: [
                { title: 'Donanım kesmesi', items: ['Aygıt, veri yolu üzerinden CPU\'ya sinyal gönderir', 'Örnek: disk okuması bitti, klavyeye basıldı'] },
                { title: 'Yazılım kesmesi (trap / exception)', items: ['Yazılım üretir: hata (sıfıra bölme, geçersiz bellek erişimi)', 'ya da kullanıcı isteği: <b>sistem çağrısı</b>'] }
              ] },
              { t: 'list', ordered: true, items: [
                'CPU o anki işini bırakır',
                'Kesilen işin adresi (ve yazmaçları) kaydedilir (yığına)',
                '<b>Kesme vektörü</b> ile ilgili servis rutinine (ISR) geçilir',
                'Servis rutini çalışır',
                'Kaydedilen adres program sayacına yüklenir; iş kaldığı yerden sürer'
              ] },
              { t: 'def', term: 'Kesme vektörü', en: 'Interrupt vector', html: 'Düşük bellekte tutulan, servis rutinlerinin <b>başlangıç adreslerini</b> içeren işaret tablosu.' },
              { t: 'table', head: ['Polling (yoklama)', 'Vectored interrupt'], rows: [
                ['Aygıtlar tek tek sorgulanır', 'Kesmeyle bir numara gelir, tablodan doğrudan rutine gidilir'],
                ['Basit ama yavaş', 'Hızlı, donanım desteği gerekir']
              ] }
            ]
          },
          {
            h: 'G/Ç, DMA ve depolama',
            src: ['ch1/io', 'ch1/depolama'], slides: '1.32 – 1.45',
            blocks: [
              { t: 'table', head: ['', 'Senkron (bloklayıcı) G/Ç', 'Asenkron (bloklamayan) G/Ç'], rows: [
                ['Kontrol programa döner', 'G/Ç bitince', 'Beklemeden'],
                ['İzleme', 'Wait ile bir sonraki kesmeye kadar bekler', 'Aygıt durum tablosu + kesme']
              ] },
              { t: 'def', term: 'Doğrudan bellek erişimi', en: 'DMA', html: 'Denetleyici veri bloğunu CPU müdahalesi olmadan belleğe aktarır: bayt başına değil <b>blok başına tek kesme</b> (4 KB → ≈4096 yerine 1 kesme). CPU bu sırada başka iş yapar.' },
              { t: 'list', items: [
                'Ana bellek: CPU\'nun doğrudan eriştiği tek büyük depolama; <b>uçucu</b> (DRAM)',
                'Erişim süresi (hızlıdan yavaşa): <b>yazmaç &lt; önbellek &lt; ana bellek &lt; SSD &lt; manyetik disk</b>',
                '<b>Caching</b>: kullanılan veriyi yavaş depolamadan hızlıya kopyalamak',
                '<b>Cache coherency</b>: çok işlemcide tüm önbellekler en yeni değeri görmeli (donanım sağlar)'
              ] }
            ]
          },
          {
            h: 'Çoklu programlama, çoklu görev ve diğerleri',
            src: ['ch1/coklu-program'], slides: '1.54 – 1.56', tq: ['h28', 'h33'],
            blocks: [
              { t: 'table', head: ['Yapı', 'Anlamı', 'Hedef / özellik'], rows: [
                ['Non-multi-programming', 'Bellekte tek program', 'G/Ç sırasında CPU boşta'],
                ['Multi-programming (toplu iş / batch)', 'Bellekte birden çok iş; biri G/Ç beklerken CPU diğerine geçer; etkileşim yok', '<b>CPU kullanımı</b>'],
                ['Multi-tasking (zaman paylaşımı)', 'CPU işler arasında çok sık geçer, etkileşimli çalışma', '<b>Kısa yanıt süresi</b> (&lt; 1 sn)'],
                ['Multi-processing', 'Birden çok CPU / çekirdek', 'Gerçek <b>paralellik</b>'],
                ['Multi-threading', 'İşlem içinde birden çok iş parçacığı', 'Kod, veri, kaynak paylaşılır; yazmaç ve yığın ayrı']
              ] },
              { t: 'note', kind: 'exam', html: 'Multi-programming ve multi-tasking tek CPU\'da da olur (<b>eşzamanlılık</b>); multi-processing donanım ister (<b>paralellik</b>). Swapping tüm işlemi disk–bellek arasında taşır; sanal bellek işlem tamamen bellekte olmadan çalışmayı sağlar.' }
            ]
          },
          {
            h: 'Mimari: çok işlemcili, kümelenmiş, dağıtık',
            src: ['ch1/mimari', 'ch1/ortamlar'], slides: '1.46 – 1.53, 1.75 – 1.90', tq: ['h33'],
            blocks: [
              { t: 'list', items: [
                'Çok işlemcinin 3 avantajı: <b>iş hacmi</b>, <b>ölçek ekonomisi</b>, <b>güvenilirlik</b> (hata toleransı)',
                '<b>Asimetrik</b>: her işlemciye özel görev · <b>Simetrik (SMP)</b>: her işlemci tüm görevleri yapar',
                '<b>NUMA</b>: her CPU\'nun yerel belleği hızlı, başkasınınki yavaş'
              ] },
              { t: 'table', head: ['Sistem', 'Ana fikir'], rows: [
                ['Kümelenmiş (clustered)', 'Birlikte çalışan sistemler, depolamayı genellikle <b>SAN</b> ile paylaşır; <b>yüksek kullanılabilirlik</b>. Asimetrik: biri hot-standby; simetrik: hepsi çalışır, birbirini izler'],
                ['Dağıtık (distributed)', 'Ağ ile bağlı, ayrı ve muhtemelen heterojen sistemler; kaynak paylaşımı (TCP/IP; LAN, WAN, MAN, PAN)']
              ] }
            ]
          },
          {
            h: 'Çift mod ve zamanlayıcı',
            src: ['ch1/islemler'], slides: '1.57 – 1.60',
            blocks: [
              { t: 'def', term: 'Çift modlu çalışma', en: 'Dual-mode operation', html: 'Mod biti: <b>çekirdek = 0</b>, <b>kullanıcı = 1</b>. Ayrıcalıklı komutlar yalnızca çekirdek modunda çalışır. Kullanıcı modu kendisi değiştiremez; çekirdeğe giriş yalnızca <b>sistem çağrısı (trap)</b> ile.' },
              { t: 'note', kind: 'exam', html: 'Sıra (1.59): kullanıcı modunda trap → mod biti 0 → sistem çağrısı yürütülür → return ile mod biti 1 → kullanıcıya dönüş.' },
              { t: 'def', term: 'Zamanlayıcı', en: 'Timer', html: 'Sonsuz döngüdeki programın CPU\'yu tutmasını önler. Sayaç azalır, sıfırda <b>kesme</b> → kontrol işletim sistemine döner. Ayarlamak <b>ayrıcalıklı</b> komuttur.' }
            ]
          },
          {
            h: 'İşletim sisteminin görevleri, koruma ve güvenlik',
            src: ['ch1/bilesenler', 'ch1/depolama-yonetimi', 'ch1/koruma-guvenlik'], slides: '1.61 – 1.74',
            blocks: [
              { t: 'table', head: ['Kavram', 'Kısaca'], rows: [
                ['Program / işlem', 'Program diskte <b>pasif</b>; işlem yürütülen program, <b>aktif</b> (PC, yazmaçlar, kaynaklar)'],
                ['İşlem yönetimi', 'Oluştur/sil, askıya al/devam ettir, senkronizasyon, iletişim, deadlock ile başa çıkma'],
                ['Bellek yönetimi', 'Kim nereyi kullanıyor izle, kim girip çıkacak karar ver, ayır / serbest bırak'],
                ['Buffering · Caching · Spooling', 'Aktarımda geçici tutma · hızlı bellekte kopya · çıktının diğer işlerin girdisiyle örtüşmesi (yazıcı kuyruğu)'],
                ['Koruma / güvenlik', 'Koruma: kaynaklara erişimi denetleyen <b>iç</b> mekanizma · Güvenlik: iç ve dış <b>saldırılara</b> karşı savunma (DoS, virüs…)']
              ] }
            ]
          },
          {
            h: 'Sanallaştırma ve bilgi işlem ortamları',
            src: ['ch1/ortamlar'], slides: '1.75 – 1.90', tq: ['h29', 'h30'],
            blocks: [
              { t: 'compare', cols: [
                { title: 'Emülasyon', items: ['Kaynak CPU türü hedeften <b>farklı</b> (ör. PowerPC → x86)', 'Komutlar çevrilir: genellikle <b>en yavaş</b>'] },
                { title: 'Sanallaştırma', items: ['Konuklar <b>aynı CPU</b> için yerel derlenmiş', '<b>VMM</b> (hypervisor) CPU, bellek, diski paylaştırır, kullanım artar; konuklar <b>yalıtılmış</b>', 'VMM doğrudan donanımda da çalışabilir (VMware ESX)', '(Ek) VMM ek yük getirir'] }
              ] },
              { t: 'table', head: ['h30: doğru mu?', ''], rows: [
                ['Tek makinede birden çok OS aynı anda', '<b>Doğru</b>'],
                ['Konuk farklı CPU türü için derlenmiş olabilir', '<b>Yanlış</b> (o emülasyondur)'],
                ['Konukları VMM çalıştırır', '<b>Doğru</b>'],
                ['VMM her zaman konak OS üzerinde olmalı', '<b>Yanlış</b>'],
                ['Emülasyon sanallaştırmadan yavaştır', '<b>Doğru</b>']
              ] },
              { t: 'p', html: 'Bulut: <b>SaaS</b> uygulama (kelime işlemci) · <b>PaaS</b> platform (veritabanı sunucusu) · <b>IaaS</b> altyapı (depolama, sunucu).' }
            ]
          }
        ],
        checks: [
          { q: 'Mod bitinin 0 ve 1 değerleri neyi gösterir?', a: '0 = çekirdek (kernel) modu, 1 = kullanıcı (user) modu.' },
          { q: 'Trap ile donanım kesmesi arasındaki fark nedir?', a: 'Donanım kesmesi aygıttan sinyal olarak gelir. Trap yazılımın ürettiği kesmedir: hata (sıfıra bölme) ya da sistem çağrısı.' },
          { q: 'DMA neden kullanılır?', a: 'Bayt başına kesme CPU\'yu boğar; DMA ile blok doğrudan belleğe aktarılır, blok başına tek kesme üretilir, CPU başka iş yapar.' },
          { q: 'Çoklu programlama ile çoklu görevin hedefleri nedir?', a: 'Çoklu programlama: CPU kullanımı (CPU\'yu boşta bırakmamak). Çoklu görev (zaman paylaşımı): kısa yanıt süresi, etkileşim.' },
          { q: 'Emülasyon ile sanallaştırma arasındaki fark?', a: 'Emülasyonda kaynak CPU türü farklıdır, en yavaş yöntemdir. Sanallaştırmada konuklar aynı CPU için derlenmiştir, VMM üzerinde çalışır.' }
        ]
      },

      /* ================================================================ Bölüm 2 */
      {
        ch: 'ch2',
        cards: [
          {
            h: 'Servisler, sistem çağrısı ve API',
            src: ['ch2/servisler', 'ch2/sistem-cagrisi'], slides: '2.4 – 2.20',
            blocks: [
              { t: 'compare', cols: [
                { title: 'Kullanıcıya yardım eden servisler', items: ['Arayüz (CLI, GUI, dokunmatik), program yürütme, G/Ç', 'Dosya sistemi, iletişim (paylaşılan bellek / mesaj), hata algılama'] },
                { title: 'Sistemin verimliliği için', items: ['Kaynak paylaşımı (allocation)', 'Hesap tutma (accounting)', 'Koruma ve güvenlik'] }
              ] },
              { t: 'def', term: 'Sistem çağrısı', en: 'System call', html: 'OS servislerine erişmek için programlama arayüzü. Her çağrının <b>numarası</b> var; arayüz bu numarayla indekslenen tablodan çekirdekteki fonksiyonu bulur.' },
              { t: 'list', items: [
                'Programlar çoğunlukla <b>API</b> kullanır: Win32, POSIX, Java API → <b>taşınabilirlik</b> + kolaylık',
                '<code>printf()</code> kütüphane fonksiyonu (kullanıcı modu) → içeride <code>write()</code> sistem çağrısı (çekirdek modu)'
              ] }
            ]
          },
          {
            h: 'Parametre geçişi ve sistem çağrısı türleri',
            src: ['ch2/parametre'], slides: '2.21 – 2.30',
            blocks: [
              { t: 'p', html: 'Üç yöntem: <b>yazmaçlar</b> (sayı sınırlı) · <b>bellekte blok/tablo</b>, adresi yazmaçla (Linux, Solaris) · <b>yığın</b> (push/pop). Blok ve yığın sayı sınırı getirmez.' },
              { t: 'table', head: ['Tür', 'UNIX', 'Windows'], rows: [
                ['İşlem kontrolü', '<code>fork() exit() wait()</code>', '<code>CreateProcess() ExitProcess() WaitForSingleObject()</code>'],
                ['Dosya yönetimi', '<code>open() read() write() close()</code>', '<code>CreateFile() ReadFile() WriteFile() CloseHandle()</code>'],
                ['Aygıt yönetimi', '<code>ioctl() read() write()</code>', '<code>SetConsoleMode() ReadConsole()</code>'],
                ['Bilgi bakımı', '<code>getpid() alarm() sleep()</code>', '<code>GetCurrentProcessID() SetTimer() Sleep()</code>'],
                ['İletişim', '<code>pipe() shm_open() mmap()</code>', '<code>CreatePipe() CreateFileMapping()</code>'],
                ['Koruma', '<code>chmod() umask() chown()</code>', '<code>SetFileSecurity()</code>']
              ] }
            ]
          },
          {
            h: 'Linker, loader ve relocation',
            src: ['ch2/baglayici'], slides: '2.35 – 2.36', tq: ['h1', 'h2'],
            blocks: [
              { t: 'table', head: ['Terim', 'Görevi'], rows: [
                ['Derleyici', 'Yeniden konumlandırılabilir nesne dosyası üretir (<code>main.o</code>)'],
                ['<b>Linker</b> (bağlayıcı)', 'Nesne dosyalarını + kütüphaneleri <b>tek çalıştırılabilir</b> dosyada birleştirir, sembolleri çözümler · <b>derleme sonrası</b>'],
                ['<b>Loader</b> (yükleyici)', 'Çalıştırılabiliri ikincil depolamadan <b>belleğe</b> yükler, relocation yapar, DLL\'leri yükler · <b>çalıştırma anı</b>'],
                ['<b>Relocation</b>', 'Parçalara son adresleri atamak, kod ve veriyi bu adreslere göre düzeltmek']
              ] },
              { t: 'code', text: 'gcc -c main.c           → derleyici: main.o\ngcc -o main main.o -lm  → linker: main (libm bağlandı)\n./main                  → loader: belleğe yükle, relocation, başlat' },
              { t: 'note', kind: 'exam', html: 'Relocation örneği: taban 14000 + mantıksal 346 = fiziksel <b>14346</b>. Yapılmazsa: yanlış adrese erişim, yanlış veri / yanlış atlama; koruma varsa <b>trap</b> (Linux\'ta segmentation fault), işlem sonlandırılır.' }
            ]
          },
          {
            h: 'Statik / dinamik bağlama, DLL, ldd',
            src: ['ch2/baglayici'], slides: '2.35 – 2.36', tq: ['h3', 'h4', 'h5'],
            blocks: [
              { t: 'compare', cols: [
                { title: 'Statik bağlama', items: ['Kütüphane kodu çalıştırılabilire <b>kopyalanır</b>', 'Büyük dosya, çalışma anında bağımlılık yok', 'Kütüphane güncellenirse yeniden bağlamak gerekir'] },
                { title: 'Dinamik bağlama (DLL, .so)', items: ['Yükleme / çalışma anında bağlanır (stub)', 'Bellekte <b>tek kopya</b>, işlemler paylaşır', 'Küçük dosya; güncelleme tüm programlara yansır', 'Kütüphane eksikse program açılmaz'] }
              ] },
              { t: 'list', items: [
                '<b>DLL avantajları</b>: tek kopya paylaşım, küçük .exe, yeniden derlemeden güncelleme, gerektiğinde yükleme. Örnek: <code>kernel32.dll</code> (CreateFile, ReadFile…), <code>user32.dll</code>',
                '<b><code>ldd ./main</code></b>: paylaşılan kütüphaneleri (.so), diskteki yollarını, yükleme adreslerini listeler; eksikse <i>not found</i>; statik dosyada <i>not a dynamic executable</i>'
              ] }
            ]
          },
          {
            h: 'Uygulamalar neden OS\'e özgü? ABI ve API',
            src: ['ch2/abi'], slides: '2.37', tq: ['h6', 'h7', 'h8', 'h9'],
            blocks: [
              { t: 'p', html: 'Başka OS\'te çalışmaz çünkü: farklı <b>sistem çağrıları</b>, <b>dosya biçimleri</b> (Linux ELF, Windows PE, macOS Mach-O), <b>ABI</b>, kütüphane/API (POSIX / Win32), belki CPU komut kümesi.' },
              { t: 'compare', cols: [
                { title: 'API', items: ['Kaynak kodu düzeyi: fonksiyonlar, parametreler', 'Uyum → <b>yeniden derleyerek</b> çalışır'] },
                { title: 'ABI', items: ['API\'nin <b>ikili / mimari</b> düzeydeki karşılığı (OS + mimari + CPU)', 'Parametre yazmaçları, yığın düzeni, ikili biçim, tür boyutları', 'Uyum → ikili <b>doğrudan</b> çalışır'] }
              ] },
              { t: 'list', items: [
                'Çok platform: <b>Python</b> yorumlayıcısı her OS\'te · <b>Java</b> bytecode, her OS için ayrı <b>JVM</b> · <b>C</b> her OS\'te ayrı derlenir',
                'C programı iki OS\'te: standart C, OS\'e özgü kodu ayır (<code>#ifdef</code>), her OS için ayrı derle (gcc / MSVC-MinGW), kütüphaneleri sağla; alternatif WSL, Wine'
              ] }
            ]
          },
          {
            h: 'Policy / mechanism, diller, taşınabilirlik',
            src: ['ch2/tasarim'], slides: '2.38 – 2.40', tq: ['h10', 'h11', 'h12'],
            blocks: [
              { t: 'compare', cols: [
                { title: 'Policy: NE yapılacak?', items: ['"Her 100 saniyede bir kesme üret"'] },
                { title: 'Mechanism: NASIL yapılacak?', items: ['Zamanlayıcı (timer)'] }
              ] },
              { t: 'note', kind: 'exam', html: 'Ayırmak <b>esneklik</b> sağlar: 100 → 200 yalnızca parametre değişikliği. Ayrılmazsa her politika değişikliğinde mekanizma / çekirdek kodu değişir, yeniden derleme, hata riski, bakım zorluğu.' },
              { t: 'list', items: [
                '<b>Assembly</b>: en alt seviye (boot, kesme girişi, bağlam değişimi); hızlı ama donanıma bağlı',
                '<b>C</b>: ana gövde, verimli + taşınabilir · sistem programları C, C++, betik diller',
                'Ödünleşim: yüksek seviyeli dil → başka donanıma <b>kolay taşınır</b> ama daha yavaş olabilir',
                '<b>Taşınabilirlik</b>: yüksek seviyeli dil oranı, az ve ayrı donanım kodu, mikroçekirdek / katmanlı / modüler yapı, aygıt sürücüleri / modüller, standart arayüzler (POSIX), emülasyon'
              ] }
            ]
          },
          {
            h: 'İşletim sistemi yapıları',
            src: ['ch2/yapilar'], slides: '2.41 – 2.58', tq: ['h13'],
            blocks: [
              { t: 'table', head: ['Yapı', 'Ana fikir', 'Örnek'], rows: [
                ['Basit', 'Modüllere bölünmez, seviyeler ayrılmaz, uygulama donanıma doğrudan erişebilir', 'MS-DOS'],
                ['Monolitik', 'Sistem çağrısı arayüzünün altındaki her şey tek çekirdekte', 'Orijinal UNIX'],
                ['Katmanlı', 'Katman 0 donanım … N kullanıcı arayüzü; her katman yalnızca alttakini kullanır', 'Kavramsal model'],
                ['Mikroçekirdek', 'Çekirdekte en temel işlevler; servisler kullanıcı alanında, <b>mesaj geçişi</b>', 'Mach, QNX'],
                ['Modüler (LKM)', 'Temel çekirdek + çalışma anında yüklenen modüller', 'Linux, Solaris'],
                ['Hibrit', 'Birden çok yaklaşımın birleşimi', 'Windows, macOS']
              ] }
            ]
          },
          {
            h: 'Mikroçekirdek, Linux, macOS / Windows, katmanlı',
            src: ['ch2/yapilar'], slides: '2.41 – 2.58', tq: ['h14', 'h15', 'h16', 'h17'],
            blocks: [
              { t: 'compare', cols: [
                { title: 'Mikroçekirdek yararları', items: ['Yeni mimarilere taşıması kolay', 'Genişletmesi kolay', 'Güvenilir: çekirdek modunda daha az kod; servis çökse sistem çalışır'] },
                { title: 'Mikroçekirdek zararı', items: ['Mesaj geçişi ve mod geçişlerinin <b>performans yükü</b>'] }
              ] },
              { t: 'list', items: [
                '<b>Linux = monolitik + modüler</b>: tek adres alanı, çekirdek modu, doğrudan çağrı (hız) + yüklenebilir çekirdek modülleri (LKM) çalışma anında yüklenip kaldırılır → performans + esneklik',
                '<b>macOS</b>: hibrit + katmanlı; Darwin = <b>Mach</b> mikroçekirdeği + <b>BSD UNIX</b>; kexts / iokit ile modüler',
                '<b>Windows</b>: hibrit, çoğunlukla monolitik + alt sistemler için mikroçekirdek özellikleri',
                '<b>Katmanlı</b>: her katman yalnızca alttakini kullanır → katman katman test ve hata ayıklama kolay, soyutlama / bilgi gizleme, bir katman diğerlerini etkilemeden değişir; ama katman tanımlamak zor, performans kaybı'
              ] }
            ]
          },
          {
            h: 'Önyükleme ve çekirdek derleme',
            src: ['ch2/boot'], slides: '2.59 – 2.61', tq: ['h23', 'h24', 'h25', 'h26'],
            blocks: [
              { t: 'p', html: '<b>Bootstrap loader</b>: güç verilince sabit adreste çalışır, anakarttaki <b>ROM/EEPROM</b>\'da (firmware). Çekirdeği bulur, belleğe yükler, başlatır. İki adımlı olabilir: boot block → önyükleyici.' },
              { t: 'compare', cols: [
                { title: 'BIOS', items: ['Eski firmware', 'MBR boot block\'u yükler', '(Ek) 16-bit, 2 TB sınırı'] },
                { title: 'UEFI', items: ['BIOS\'un modern yerine geçeni', '(Ek) GPT, 64-bit, hızlı açılış, Secure Boot'] }
              ] },
              { t: 'list', items: [
                '<b>GRUB</b>: önyükleyici; hangi çekirdek (farklı disk/sürüm) ve hangi seçeneklerle; single user mode. "Çok çekirdekli" = birden çok <i>kernel</i>, çok çekirdekli CPU değil',
                'Linux derleme: kernel.org → <code>make menuconfig</code> → <code>make</code> (vmlinuz) → <code>make modules</code> → <code>make modules_install</code> → <code>make install</code> → yeniden başlat',
                '<b>vmlinuz</b>: <code>make</code> ile üretilen Linux çekirdek imajı, önyükleyicinin yüklediği dosya; (Ek) <code>/boot</code> altında, vm = sanal bellek, z = sıkıştırılmış'
              ] }
            ]
          },
          {
            h: 'Hata ayıklama: log, dump, Kernighan',
            src: ['ch2/debug'], slides: '2.62 – 2.66', tq: ['h18', 'h19', 'h21'],
            blocks: [
              { t: 'p', html: '<b>Log dosyaları</b>: hata bilgisini kaydeder → sonradan arıza analizi, olayların sırası ve nedeni, performans, güvenlik denetimi.' },
              { t: 'compare', cols: [
                { title: 'Core dump', items: ['<b>Kullanıcı işleminin</b> hatası', 'İşlemin belleği kaydedilir; sistem çalışmaya devam eder', 'Sonra hata ayıklayıcıyla (gdb) incelenir'] },
                { title: 'Crash dump', items: ['<b>Çekirdeğin</b> hatası (crash)', 'Çekirdek belleği kaydedilir; sistem durur', '(Ek) Diskin ayrılmış alanına yazılır'] }
              ] },
              { t: 'note', kind: 'exam', html: '<b>Kernighan Yasası</b>: hata ayıklamak, kodu yazmaktan iki kat zordur; kodu olabildiğince zekice yazarsan onu ayıklayacak kadar zeki değilsindir. Sonuç: <b>basit, anlaşılır kod</b> yaz; bakım kolaylaşır, çekirdekte hata tüm sistemi etkiler.' }
            ]
          },
          {
            h: 'Performans ayarlama ve izleme araçları',
            src: ['ch2/debug'], slides: '2.62 – 2.66', tq: ['h20', 'h22'],
            blocks: [
              { t: 'list', items: [
                '<b>Performans ayarlama</b>: darboğazları kaldırmak; OS ölçüm araçları sağlamalı (top, Görev Yöneticisi)',
                '<b>Tracing</b>: belirli bir olay için veri toplar (ör. sistem çağrısının adımları) · <b>Profiling</b>: komut göstericisini periyodik örnekler'
              ] },
              { t: 'table', head: ['Araç', 'Görevi'], rows: [
                ['top', 'Gerçek zamanlı CPU / bellek kullanımı'],
                ['strace', 'İşlemin sistem çağrılarını izler'],
                ['gdb', 'Kaynak kodu düzeyinde hata ayıklayıcı'],
                ['perf', 'Linux performans araçları (profiling)'],
                ['tcpdump', 'Ağ paketlerini toplar'],
                ['BCC', 'BPF tabanlı; kullanıcı + çekirdek etkileşimini izler (disksnoop.py: disk G/Ç)']
              ] }
            ]
          }
        ],
        checks: [
          { q: 'Linker ile loader arasındaki temel fark nedir?', a: 'Linker derleme sonrasında nesne dosyalarını ve kütüphaneleri tek çalıştırılabilir dosyada birleştirir. Loader çalıştırma anında dosyayı belleğe yükler ve relocation yapar.' },
          { q: 'Parametre geçirmenin üç yöntemi nedir? Hangisi sayı sınırı getirir?', a: 'Yazmaçlar, bellekte blok/tablo, yığın. Yalnızca yazmaç yöntemi sınırlıdır.' },
          { q: 'API ile ABI arasındaki fark nedir?', a: 'API kaynak kodu düzeyinde fonksiyon ve parametreleri tanımlar. ABI ikili düzeyde yazmaçları, yığın düzenini, ikili biçimi ve veri türü boyutlarını tanımlar.' },
          { q: 'Linux neden "monolitik + modüler" sayılır?', a: 'Çekirdek tek adres alanında çekirdek modunda çalışır (monolitik); sürücü ve dosya sistemi gibi işlevler çalışma anında LKM ile eklenip çıkarılır (modüler).' },
          { q: 'Core dump ile crash dump arasındaki fark?', a: 'Core dump kullanıcı işleminin hatasında işlemin belleğini kaydeder. Crash dump çekirdek çöktüğünde çekirdek belleğini kaydeder.' }
        ]
      },

      /* ================================================================ Bölüm 3 */
      {
        ch: 'ch3',
        cards: [
          {
            h: 'İşlem ve bellekteki yerleşimi',
            src: ['ch3/kavram'], slides: '3.4 – 3.8',
            blocks: [
              { t: 'compare', cols: [
                { title: 'Program', items: ['Diskte <b>pasif</b> varlık (executable)'] },
                { title: 'İşlem (process)', items: ['Yürütülen program, <b>aktif</b>', 'Bir program birden çok işlem olarak çalışabilir'] }
              ] },
              { t: 'table', head: ['Bölüm', 'İçerik'], rows: [
                ['text', 'Program kodu'],
                ['data', 'Global değişkenler: başlangıç değerli → initialized; değersiz → BSS'],
                ['heap', 'Dinamik bellek (<code>malloc</code>), <b>yukarı</b> büyür'],
                ['stack', 'Yerel değişkenler, parametreler, dönüş adresleri; <b>aşağı</b> büyür']
              ] },
              { t: 'note', kind: 'exam', html: 'Düşükten yükseğe: text → initialized data → uninitialized data → heap → boşluk → stack → argc, argv.' }
            ]
          },
          {
            h: 'İşlem durumları',
            src: ['ch3/durumlar'], slides: '3.9 – 3.10',
            blocks: [
              { t: 'table', head: ['Geçiş', 'Olay'], rows: [
                ['new → ready', 'admitted (kabul edildi)'],
                ['ready → running', 'scheduler dispatch (zamanlayıcı seçti)'],
                ['running → ready', 'interrupt (kesme / zaman dilimi doldu)'],
                ['running → waiting', 'G/Ç veya olay bekleme'],
                ['waiting → ready', 'G/Ç veya olay tamamlandı'],
                ['running → terminated', 'exit']
              ] },
              { t: 'note', kind: 'exam', html: 'Tuzak: <b>waiting → running doğrudan yok</b>; önce ready. Tek çekirdekte aynı anda <b>bir</b> işlem running; ready ve waiting\'de çok sayıda olabilir.' }
            ]
          },
          {
            h: 'PCB, bağlam değişimi, kuyruklar',
            src: ['ch3/pcb', 'ch3/planlama'], slides: '3.11 – 3.21',
            blocks: [
              { t: 'def', term: 'İşlem kontrol bloğu', en: 'PCB', html: 'Her işlemi temsil eder: durum, PID, program sayacı, CPU yazmaçları, zamanlama bilgisi, bellek yönetimi bilgisi, hesap tutma, G/Ç durum bilgisi.' },
              { t: 'def', term: 'Bağlam değişimi', en: 'Context switch', html: 'Eski işlemin durumu PCB\'sine kaydedilir, yenisininki yüklenir. Süresi <b>saf ek yük</b>; CPU başına birden çok yazmaç seti kısaltır.' },
              { t: 'table', head: ['Kuyruk', 'İçerik'], rows: [
                ['İş (job)', 'Sistemdeki tüm işlemler'],
                ['Hazır (ready)', 'Bellekte, yalnızca CPU\'yu bekleyenler'],
                ['Aygıt / bekleme', 'G/Ç veya olay bekleyenler']
              ] }
            ]
          },
          {
            h: 'fork(), exec(), wait() ve sonlandırma',
            src: ['ch3/olusturma'], slides: '3.22 – 3.31',
            blocks: [
              { t: 'list', items: [
                '<code>fork()</code>: yeni işlem; çocuk, ebeveynin adres alanının <b>kopyası</b>',
                '<code>fork()</code> iki kez döner: ebeveynde <b>çocuğun pid\'i (&gt; 0)</b>, çocukta <b>0</b>, hata <b>&lt; 0</b>',
                '<code>exec()</code>: bellek alanını yeni programla değiştirir, <b>yeni işlem oluşturmaz</b>',
                '<code>wait()</code>: ebeveyn çocuğu bekler; <code>pid = wait(&amp;status)</code> · <code>exit()</code>: işlem biter, kaynaklar geri alınır',
                'Windows: <code>CreateProcess()</code> + <code>WaitForSingleObject()</code>'
              ] },
              { t: 'compare', cols: [
                { title: 'Zombie', items: ['Çocuk bitti, ebeveyn henüz <code>wait()</code> çağırmadı', 'İşlem tablosu girdisi duruyor'] },
                { title: 'Orphan (öksüz)', items: ['Ebeveyn <code>wait()</code> çağırmadan bitti', '(Ek) Linux\'ta init/systemd sahiplenir'] }
              ] },
              { t: 'p', html: 'Basamaklı sonlandırma: bazı sistemlerde ebeveyn bitince tüm çocuklar da sonlandırılır.' }
            ]
          },
          {
            h: 'Chrome: tek işlem mi, çok işlem mi?',
            src: ['ch3/olusturma'], slides: '3.22 – 3.31', tq: ['h27'],
            blocks: [
              { t: 'p', html: '<b>Browser</b> işlemi (arayüz, disk ve ağ G/Ç) · site başına <b>Renderer</b> (HTML, JavaScript; <b>sandbox</b>) · eklenti başına <b>Plug-in</b> işlemi.' },
              { t: 'table', head: ['', 'Tek işlem', 'Çok işlem'], rows: [
                ['Hata yalıtımı', 'Bir sekme çökerse tarayıcı çöker', 'Yalnızca o sekme çöker'],
                ['Güvenlik', 'Tüm siteler aynı adres alanında', 'Ayrı adres alanı + sandbox'],
                ['Bellek', 'Az', 'Çok'],
                ['Oluşturma / geçiş', 'Ucuz', 'İşlem oluşturma ve bağlam değişimi pahalı'],
                ['İletişim', 'Aynı bellek, hızlı', 'IPC gerekir, yavaş']
              ] }
            ]
          },
          {
            h: 'IPC ve üretici–tüketici',
            src: ['ch3/ipc', 'ch3/paylasilan-bellek'], slides: '3.32 – 3.45',
            blocks: [
              { t: 'p', html: 'İşbirlikçi işlemlerin 4 nedeni: bilgi paylaşımı, hesaplama hızlandırma, modülerlik, rahatlık.' },
              { t: 'compare', cols: [
                { title: 'Paylaşılan bellek', items: ['Kurulunca normal bellek erişimi, çekirdek araya girmez → <b>hızlı</b>', 'Senkronizasyon programcıda'] },
                { title: 'Mesaj geçişi', items: ['Her mesaj sistem çağrısıyla çekirdekten geçer → daha yavaş', 'Küçük veri ve dağıtık sistemler için kolay'] }
              ] },
              { t: 'table', head: ['Dairesel tampon', 'Koşul'], rows: [
                ['Boş', '<code>in == out</code>'],
                ['Dolu', '<code>(in + 1) % BUFFER_SIZE == out</code> → en fazla <b>BUFFER_SIZE − 1</b> öğe'],
                ['counter ile', 'Tüm N yuva kullanılır ama <code>counter++ / --</code> yarış durumu: 5 yerine <b>4 veya 6</b>']
              ] }
            ]
          },
          {
            h: 'Mesaj geçişi',
            src: ['ch3/mesaj'], slides: '3.46 – 3.55',
            blocks: [
              { t: 'compare', cols: [
                { title: 'Doğrudan', items: ['<code>send(P, msg)</code>, <code>receive(Q, msg)</code>', 'Bağlantı tam bir çifte ait, çift başına bir bağlantı'] },
                { title: 'Dolaylı (posta kutusu / port)', items: ['<code>send(A, msg)</code>, <code>receive(A, msg)</code>', 'Bir bağlantı birçok işlemle; çift başına birden çok bağlantı'] }
              ] },
              { t: 'table', head: ['', 'Bloklayan (senkron)', 'Bloklamayan (asenkron)'], rows: [
                ['send', 'Mesaj alınana kadar bloklanır', 'Gönderip devam eder'],
                ['receive', 'Mesaj gelene kadar bloklanır', 'Geçerli mesaj ya da <b>null</b>']
              ] },
              { t: 'p', html: 'İkisi de bloklayansa: <b>randevu (rendezvous)</b>. Tampon kapasitesi: sıfır (gönderen bekler) · sınırlı n · sınırsız (gönderen hiç beklemez).' }
            ]
          },
          {
            h: 'Pipe, POSIX paylaşılan bellek, soket, RPC',
            src: ['ch3/ipc-ornek', 'ch3/istemci-sunucu'], slides: '3.56 – 3.75',
            blocks: [
              { t: 'compare', cols: [
                { title: 'Sıradan pipe', items: ['Tek yönlü; <code>fd[0]</code> okuma, <code>fd[1]</code> yazma', 'Ebeveyn–çocuk ilişkisi gerekir'] },
                { title: 'Adlandırılmış pipe', items: ['Çift yönlü', 'İlişki gerekmez, birden çok işlem kullanabilir'] }
              ] },
              { t: 'list', items: [
                'POSIX: <code>shm_open</code> → <code>ftruncate</code> → <code>mmap</code> → (bitince) <code>shm_unlink</code>',
                '<b>Soket</b>: IP + port; <code>161.25.19.8:1625</code>. 1024 altı portlar iyi bilinir (80 web); 127.0.0.1 loopback',
                '<b>RPC</b>: istemci <b>stub</b> sunucuyu bulur, parametreleri paketler (<b>marshalling</b>); <b>XDR</b> big/little-endian farkı için; hedef "exactly once"'
              ] }
            ]
          }
        ],
        checks: [
          { q: 'fork() ebeveynde ve çocukta ne döndürür?', a: 'Ebeveynde çocuğun pid\'ini (> 0), çocukta 0. Hata durumunda negatif değer.' },
          { q: 'G/Ç tamamlanan bir işlem hangi duruma geçer?', a: 'Waiting → Ready. Doğrudan running olmaz; zamanlayıcının seçmesini bekler.' },
          { q: 'Zombie ve orphan işlem arasındaki fark nedir?', a: 'Zombie: sonlanmış ama ebeveyni wait() çağırmamış çocuk. Orphan: ebeveyni wait() çağırmadan sonlanmış, hâlâ çalışan çocuk.' },
          { q: 'Dairesel tampon çözümü neden en fazla BUFFER_SIZE − 1 öğe tutar?', a: 'Tamamen dolu tamponda in == out olurdu; bu boş tamponla ayırt edilemez. Bu yüzden bir yuva hep boş bırakılır.' },
          { q: 'Bağlam değişimi neden "saf ek yük"tür?', a: 'Geçiş sırasında CPU hiçbir kullanıcı işinin komutunu yürütmez; yalnızca durum kaydedip yükler.' }
        ]
      },

      /* ================================================================ Bölüm 4 (slayt 4.26'ya kadar) */
      {
        ch: 'ch4',
        cards: [
          {
            h: 'İş parçacığı nedir, neden?',
            src: ['ch4/kavram'], slides: '4.4 – 4.8',
            blocks: [
              { t: 'compare', cols: [
                { title: 'Paylaşılan', items: ['Kod', 'Veri', 'Dosyalar'] },
                { title: 'Her iş parçacığında ayrı', items: ['Yazmaçlar', 'Yığın (stack)', 'Program sayacı (PC)'] }
              ] },
              { t: 'table', head: ['Fayda', 'Açıklama'], rows: [
                ['Cevap verebilirlik', 'Biri engellense de diğerleri çalışır (kullanıcı arayüzü)'],
                ['Kaynak paylaşımı', 'İşlem kaynaklarını paylaşır; paylaşılan bellek / mesajdan kolay'],
                ['Ekonomi', 'İşlem oluşturmaktan ucuz; geçiş ek yükü bağlam değişiminden düşük'],
                ['Ölçeklenebilirlik', 'Çok çekirdekten yararlanır']
              ] }
            ]
          },
          {
            h: 'Çok çekirdek ve Amdahl Yasası',
            src: ['ch4/cok-cekirdek'], slides: '4.7, 4.9 – 4.13',
            blocks: [
              { t: 'compare', cols: [
                { title: 'Eşzamanlılık (concurrency)', items: ['Birden çok görevin <b>ilerlemesi</b>', 'Tek çekirdekte zamanlayıcıyla sırayla'] },
                { title: 'Paralellik (parallelism)', items: ['Görevler <b>aynı anda</b> gerçekten yürür', 'Birden çok çekirdek gerekir'] }
              ] },
              { t: 'p', html: '<b>Veri</b> paralelleştirme: verinin alt kümeleri, her çekirdekte aynı işlem · <b>Görev</b> paralelleştirme: her iş parçacığı farklı işlem.' },
              { t: 'def', term: 'Amdahl Yasası', en: 'Amdahl\'s Law', html: '<b>hızlanma ≤ 1 / (S + (1 − S) / N)</b> · S seri kısım, N çekirdek. N → ∞ iken hızlanma → <b>1/S</b>.' },
              { t: 'note', kind: 'exam', html: '%25 seri, 2 çekirdek: 1 / (0,25 + 0,75 / 2) = <b>1,6 kat</b>. %25 seri varsa çekirdek sayısı ne olursa olsun hızlanma <b>4 katı</b> geçemez.' }
            ]
          },
          {
            h: 'Kullanıcı / çekirdek iş parçacıkları, modeller',
            src: ['ch4/modeller'], slides: '4.14 – 4.20',
            blocks: [
              { t: 'compare', cols: [
                { title: 'Kullanıcı iş parçacıkları', items: ['Kullanıcı seviyesi kütüphaneler yönetir', 'POSIX Pthreads, Windows threads, Java threads'] },
                { title: 'Çekirdek iş parçacıkları', items: ['Çekirdek destekler', 'Windows, Linux, Mac OS X, iOS, Android'] }
              ] },
              { t: 'table', head: ['Model', 'Özellik', 'Örnek'], rows: [
                ['Çoktan-bire', 'Biri bloklanınca <b>hepsi</b> bloklanır; paralel çalışmaz', 'Solaris Green Threads, GNU Portable Threads'],
                ['Bire-bir', 'Daha iyi eşzamanlılık; iş parçacığı sayısı kısıtlanabilir', '<b>Windows, Linux</b>'],
                ['Çoktan-çoğa', 'Yeterli çekirdek iş parçacığı oluşturulabilir; yaygın değil', 'Windows ThreadFiber'],
                ['İki seviyeli', 'Çoktan-çoğa + birini çekirdek iş parçacığına bağlama', '–']
              ] }
            ]
          },
          {
            h: 'İş parçacığı kütüphaneleri: Pthreads',
            src: ['ch4/kutuphaneler'], slides: '4.21 – 4.26',
            blocks: [
              { t: 'p', html: 'Kütüphane: tamamen <b>kullanıcı alanında</b> ya da OS destekli <b>çekirdek düzeyinde</b>. <b>Pthreads</b> = POSIX (IEEE 1003.1c) API\'si; uygulama değil <b>şartname</b>: davranışı belirtir, gerçekleştirme kütüphaneye bağlı.' },
              { t: 'code', text: 'pthread_attr_init(&attr);                     /* öznitelikler */\npthread_create(&tid, &attr, runner, argv[1]); /* oluştur */\npthread_join(tid, NULL);                      /* bitmesini bekle */\npthread_exit(0);                              /* runner içinde: bitir */\n\nfor (int i = 0; i < NUM_THREADS; i++)         /* çok iş parçacığını bekle */\n    pthread_join(workers[i], NULL);' },
              { t: 'note', kind: 'info', html: 'Vize sınırı: Windows örneğinin yalnızca Summation fonksiyonu (4.26) işlendi; main kısmı (4.27), Java, Executor ve sonraki konular (örtük iş parçacığı, sorunlar, Windows/Linux) vize dışı.' }
            ]
          }
        ],
        checks: [
          { q: 'Aynı işlemin iş parçacıkları neleri paylaşır, nelerde ayrıdır?', a: 'Kod, veri ve dosyaları paylaşır. Yazmaçları, yığını ve program sayacı ayrıdır.' },
          { q: '%25 seri uygulamada 1\'den 2 çekirdeğe geçiş kaç kat hızlandırır?', a: '1 / (0,25 + 0,75 / 2) = 1,6 kat.' },
          { q: 'Çoktan-bire modelin iki temel sorunu nedir?', a: 'Bir iş parçacığı bloklanınca tümü bloklanır. Aynı anda yalnızca biri çekirdekte olabildiği için çok çekirdekte paralel çalışamazlar.' },
          { q: 'Pthreads neden "şartname" olarak anılır?', a: 'API yalnızca kütüphanenin davranışını belirtir; nasıl gerçekleştirileceği kütüphaneyi geliştirenlere bağlıdır.' }
        ]
      },

      /* ================================================================ Bölüm 5 */
      {
        ch: 'ch5',
        cards: [
          {
            h: 'Zamanlayıcı, dağıtıcı, kesmeli / kesmesiz',
            src: ['ch5/temel'], slides: '5.4 – 5.11',
            blocks: [
              { t: 'p', html: '<b>CPU zamanlayıcı</b> (kısa vadeli): hazır işlemlerden birini seçer. <b>Dağıtıcı</b> (dispatcher) kararı uygular: <b>bağlam değişimi</b> → <b>kullanıcı moduna geçiş</b> → programda <b>doğru konuma atlama</b>. Bunun süresi: <b>dispatch latency</b>.' },
              { t: 'table', head: ['Karar anı', 'Tür'], rows: [
                ['1. running → waiting', 'Seçim yok (nonpreemptive)'],
                ['2. running → ready', 'Seçim var (preemptive)'],
                ['3. waiting → ready', 'Seçim var (preemptive)'],
                ['4. sonlanma', 'Seçim yok (nonpreemptive)']
              ] },
              { t: 'compare', cols: [
                { title: 'Kesmesiz', items: ['CPU\'yu ancak bitince / G/Ç için kendisi bırakır', 'FCFS, SJF, kesmesiz öncelikli'] },
                { title: 'Kesmeli', items: ['OS çalışan işlemi elinden alabilir (hemen hemen tüm modern sistemler)', 'SRTF, kesmeli öncelikli, RR'] }
              ] }
            ]
          },
          {
            h: 'Kriterler ve formüller',
            src: ['ch5/temel'], slides: '5.4 – 5.11',
            blocks: [
              { t: 'table', head: ['Kriter', 'Anlamı', 'Hedef'], rows: [
                ['CPU kullanımı', 'CPU\'yu meşgul tutmak', 'En yüksek'],
                ['Üretilen iş (throughput)', 'Birim zamanda biten işlem', 'En yüksek'],
                ['Devir (turnaround)', 'Gelişten bitişe toplam süre', 'En düşük'],
                ['Bekleme (waiting)', 'Hazır kuyruğunda geçen toplam süre', 'En düşük'],
                ['Yanıt (response)', 'İstekten ilk yanıta', 'En düşük']
              ] },
              { t: 'code', text: 'TAT (turnaround) = bitiş − geliş\nWT  (bekleme)    = TAT − burst\nRT  (yanıt)      = ilk çalışma − geliş' },
              { t: 'note', kind: 'exam', html: 'Örnek: geliş 3, burst 4, bitiş 12 → TAT = 9, WT = 5. Bağlam değişimi aksi söylenmedikçe 0.' }
            ]
          },
          {
            h: 'Algoritmalar yan yana',
            src: ['ch5/karsilastirma', 'ch5/fcfs', 'ch5/sjf', 'ch5/srtf', 'ch5/oncelik', 'ch5/rr'], slides: '5.13 – 5.27',
            blocks: [
              { t: 'table', head: ['Algoritma', 'Kesmeli?', 'Seçim ölçütü', 'Temel sorun'], rows: [
                ['FCFS', 'Hayır', 'Geliş sırası', '<b>Konvoy etkisi</b>'],
                ['SJF', 'Hayır', 'En kısa burst', 'Burst bilinmez, açlık'],
                ['SRTF', 'Evet', 'En kısa <b>kalan</b> süre', 'Burst bilinmez, açlık, sık kesilme'],
                ['Öncelikli', 'İkisi de', 'En yüksek öncelik (küçük sayı)', 'Açlık → <b>yaşlandırma (aging)</b>'],
                ['Round Robin', 'Evet', 'Kuyruk sırası, q süre', 'Kuantum seçimi, bağlam değişimi'],
                ['Çok düzeyli kuyruk', 'Kuyruğa göre', 'Kuyruk önceliği', 'Sabit öncelikte açlık']
              ] },
              { t: 'list', items: [
                '<b>SJF optimal</b>: en küçük ortalama bekleme. FCFS 24, 3, 3 → ort. bekleme 17; sıra değişince 3',
                'SRTF: karar yalnızca <b>yeni geliş</b> ve <b>bitişte</b>; kalan süre eşitse çalışan kalır',
                'Açlık: SJF, SRTF, öncelikli, sabit öncelikli çok düzeyli kuyruk. FCFS ve RR\'de yok'
              ] }
            ]
          },
          {
            h: 'SJF tahmini ve RR kuantumu',
            src: ['ch5/sjf', 'ch5/rr'], slides: '5.17 – 5.25',
            blocks: [
              { t: 'def', term: 'Üstel ortalama', en: 'Exponential averaging', html: '<b>τn+1 = α·tn + (1−α)·τn</b>, genellikle α = ½. α = 0: geçmiş dikkate alınmaz (τ değişmez) · α = 1: yalnızca son gerçek burst.' },
              { t: 'table', head: ['Kuantum (q)', 'Sonuç'], rows: [
                ['Çok büyük', 'Kesilme olmaz → RR, <b>FCFS</b> gibi'],
                ['Çok küçük', 'Yanıt iyi ama bağlam değişimi CPU\'yu harcar'],
                ['Dengeli', 'Burst\'lerin ≈ <b>%80</b>\'i q\'dan kısa']
              ] },
              { t: 'list', items: [
                'Dilimi biten işlem hazır kuyruğunun <b>sonuna</b>; n işlemde kimse <b>(n−1)·q</b>\'dan fazla beklemez',
                'RR: ortalama bekleme genellikle SJF\'ten yüksek, yanıt iyi. Tipik q = 10–100 ms, bağlam değişimi &lt; 10 µs'
              ] }
            ]
          },
          {
            h: 'Çok düzeyli kuyruklar ve Windows',
            src: ['ch5/coklu-kuyruk', 'ch5/os-planlama'], slides: '5.28 – 5.32, 5.58 – 5.72', tq: ['h31'],
            blocks: [
              { t: 'compare', cols: [
                { title: 'Çok düzeyli kuyruk', items: ['Her öncelik için ayrı kuyruk, işlem <b>kendi kuyruğunda kalır</b>', 'Ön plan RR, arka plan FCFS; sabit öncelik ya da zaman payı (%80 / %20)'] },
                { title: 'Geri bildirimli kuyruk (MLFQ)', items: ['İşlem kuyruklar arasında <b>yükseltilir / indirgenir</b>', '5 parametre: kuyruk sayısı, algoritmalar, yükseltme, indirgeme, giriş kuyruğu', 'Q0 (q=8) → Q1 (q=16) → Q2 (FCFS): 30 ms\'lik iş 8 + 16 + 6'] }
              ] },
              { t: 'note', kind: 'exam', html: '<b>Windows (h31)</b>: öncelikli ve <b>kesmeli</b> · <b>32 seviye</b>, her biri ayrı kuyruk · aynı öncelikte zaman dilimi (<b>RR</b>) · dilim bitince öncelik düşer (tabanın altına inmez), bekleme bitince artar → <b>geri bildirim</b>. <b>FCFS ve SJF kullanılmaz</b>.' }
            ]
          },
          {
            h: 'Quiz tipi: dört algoritma aynı veriyle',
            src: ['ch5/odev'], slides: 'CPUScheduling_Ödev.pdf', tq: ['h34'],
            blocks: [
              { t: 'p', html: 'Geliş / burst: P1 (0, 7), P2 (2, 4), P3 (4, 1), P4 (5, 4), P5 (6, 3).' },
              { t: 'table', head: ['Algoritma', 'Ort. bekleme', 'Ort. turnaround', 'Dikkat'], rows: [
                ['FCFS', '5.8', '9.6', 'Bekleme 0, 5, 7, 7, 10'],
                ['SJF', '4.8', '8.6', 't=7\'de P2 = P4 (4): önce gelen P2'],
                ['SRTF', '<b>3.8</b>', '<b>7.6</b>', 'P1 t=2\'de kesilir; en iyisi'],
                ['RR (q=2)', '6.8', '10.6', 'Dilimi biten ile aynı anda gelen <b>yeni işlem önce</b> girer']
              ] },
              { t: 'note', kind: 'exam', html: 'Sık hatalar: beklemede gelişi çıkarmamak · SRTF\'te toplam burst ile karşılaştırmak (kalan süre olmalı) · RR\'de kesileni kuyruğun başına koymak.' }
            ]
          },
          {
            h: 'Çok işlemci, gerçek zaman, değerlendirme',
            src: ['ch5/thread-planlama', 'ch5/coklu-islemci', 'ch5/gercek-zamanli', 'ch5/os-planlama', 'ch5/degerlendirme'], slides: '5.33 – 5.79',
            blocks: [
              { t: 'table', head: ['Kavram', 'Kısaca'], rows: [
                ['PCS / SCS', 'PCS: kullanıcı iş parçacıkları işlem içinde LWP için yarışır · SCS: çekirdek iş parçacıkları tüm sistemle'],
                ['Push / pull migration', 'Push: dolu CPU\'dan iş itilir · Pull: boştaki CPU iş çeker'],
                ['Soft / hard affinity', 'Aynı işlemcide tutmaya çalışır / çalışabileceği işlemcileri belirtir'],
                ['Soft / hard gerçek zaman', 'Kritik görev en yüksek öncelik, garanti yok / deadline\'a kadar bitmeli'],
                ['Rate Monotonic / EDF', 'Kısa periyot yüksek öncelik / en yakın deadline yüksek öncelik'],
                ['Linux CFS', 'En düşük <b>vruntime</b>\'lı görev; kırmızı-siyah ağaç'],
                ['Little formülü', '<b>n = λ × W</b> (7 işlem/sn, kuyrukta 14 → W = 2 sn)']
              ] }
            ]
          }
        ],
        checks: [
          { q: 'Turnaround, bekleme ve yanıt süresi formülleri?', a: 'Turnaround = bitiş − geliş. Bekleme = turnaround − burst. Yanıt = ilk çalışma − geliş.' },
          { q: 'FCFS, SJF, SRTF, öncelikli ve RR\'den hangileri kesin olarak kesmelidir?', a: 'SRTF ve Round Robin. Öncelikli planlamanın hem kesmeli hem kesmesiz sürümü vardır.' },
          { q: 'Kuantum çok büyük seçilirse RR neye dönüşür?', a: 'FCFS\'e. İşler bir dilim içinde bittiği için kesilme olmaz.' },
          { q: 'Öncelikli planlamada açlık nasıl önlenir?', a: 'Yaşlandırma (aging): bekleyen işlemin önceliği zamanla yükseltilir.' },
          { q: 'Dağıtıcı (dispatcher) hangi üç işi yapar?', a: 'Bağlam değişimi yapar, kullanıcı moduna geçer, programın kaldığı adrese atlar.' }
        ]
      },

      /* ================================================================ Bölüm 6 */
      {
        ch: 'ch6',
        cards: [
          {
            h: 'Yarış durumu ve kritik bölüm',
            src: ['ch6/kritik-bolum'], slides: '6.3 – 6.8',
            blocks: [
              { t: 'p', html: '<b>Yarış durumu</b>: paylaşılan veriye eşzamanlı erişim tutarsızlık yaratır. Örnek: iki işlem <code>next_available_pid</code>\'i (2615) aynı anda okur → aynı pid iki işleme.' },
              { t: 'p', html: 'Yapı: <b>giriş bölümü</b> → <b>kritik bölüm</b> → <b>çıkış bölümü</b> → <b>kalan bölüm</b>.' },
              { t: 'table', head: ['Gereksinim', 'Anlamı'], rows: [
                ['Karşılıklı dışlama (mutual exclusion)', 'Pi içerideyse başka kimse kritik bölümde olamaz'],
                ['İlerleme (progress)', 'Bölüm boşsa ve girmek isteyen varsa seçim süresiz ertelenemez'],
                ['Sınırlı bekleme (bounded waiting)', 'İstekten sonra diğerlerinin giriş sayısının üst sınırı var']
              ] },
              { t: 'note', kind: 'exam', html: 'Kesmeleri kapatmak genel çözüm değil: uzun kritik bölümde sistem donar, açlık olabilir, <b>çok CPU\'da</b> diğer CPU durmaz.' }
            ]
          },
          {
            h: 'Peterson çözümü',
            src: ['ch6/peterson'], slides: '6.9 – 6.14',
            blocks: [
              { t: 'code', text: 'while (true) {\n    flag[i] = true;          /* girmek istiyorum */\n    turn = j;                /* önce sen geç */\n    while (flag[j] && turn == j)\n        ;                    /* bekle */\n    /* critical section */\n    flag[i] = false;\n    /* remainder section */\n}' },
              { t: 'list', items: [
                '<b>flag</b>: girmeye hazır mı · <b>turn</b>: sıra kimde. Pi girer: <code>flag[j] == false</code> <b>veya</b> <code>turn == i</code>',
                'Karşılıklı dışlama: turn aynı anda i ve j olamaz · İlerleme: Pj istemiyorsa Pi beklemez · Sınırlı bekleme: en fazla Pj\'nin <b>bir</b> girişi'
              ] },
              { t: 'note', kind: 'warn', html: 'Yalnızca turn kullanan algoritma (slayt 6.9 "kilit değişkenleri" der; doğrusu <b>katı sıralama</b>, strict alternation): karşılıklı dışlama var, <b>ilerleme yok</b>.' }
            ]
          },
          {
            h: 'Bellek bariyeri ve donanım komutları',
            src: ['ch6/bellek-bariyeri', 'ch6/donanim'], slides: '6.15 – 6.31',
            blocks: [
              { t: 'p', html: 'Modern mimaride Peterson garanti değil: işlemci / derleyici bağımsız komutları <b>yeniden sıralayabilir</b>. <b>Bellek bariyeri</b>: önceki tüm load/store\'lar sonrakilerden önce tamamlanıp diğer CPU\'lara görünür olur.' },
              { t: 'compare', cols: [
                { title: 'test_and_set', items: ['Atomik: eski değeri döndür, hedefi <b>her zaman true</b> yap', 'false dönerse kilit alındı'] },
                { title: 'compare_and_swap', items: ['Atomik: yalnızca <code>*value == expected</code> ise yeni değeri yaz', 'Her durumda eski değeri döndür'] }
              ] },
              { t: 'list', items: [
                'Basit kilit çözümleri <b>sınırlı beklemeyi sağlamaz</b>; <code>waiting[n]</code> ile dairesel devir → en fazla n − 1 giriş',
                '<b>Atomik değişken</b>: <code>increment(&amp;sequence)</code> CAS döngüsüyle kesintisiz'
              ] },
              { t: 'note', kind: 'warn', html: 'Slayt 6.22 x86 karşılığını "EXCH" yazar; doğrusu <b>CMPXCHG</b> (lock önekiyle atomik).' }
            ]
          },
          {
            h: 'Mutex ve semafor',
            src: ['ch6/mutex', 'ch6/semafor'], slides: '6.32 – 6.42',
            blocks: [
              { t: 'table', head: ['', 'Mutex kilidi', 'Semafor'], rows: [
                ['Değer', 'Mantıksal: kilit müsait mi', 'Tamsayı S'],
                ['İşlemler', '<code>acquire()</code> / <code>release()</code> (atomik)', '<code>wait()</code> = P / <code>signal()</code> = V (atomik)'],
                ['Bekleme', 'Meşgul bekleme → <b>spinlock</b>', 'Klasik tanım meşgul bekler; kuyruklu sürüm: block (uyut) / wakeup'],
                ['Türler', '–', '<b>Sayan</b> (sınırsız aralık, ör. 5 kopya) · <b>ikili</b> (0/1, mutex gibi)']
              ] },
              { t: 'list', items: [
                'Kuyruklu sürüm: <code>wait</code> değeri azaltır, negatifse uyur; <b>value = −2 → 2 bekleyen</b>',
                'S1, S2\'den önce: <code>synch = 0</code> · P1: <code>S1; signal(synch);</code> · P2: <code>wait(synch); S2;</code>',
                'Yanlış kullanım: signal…wait (dışlama bozulur), wait…wait (kendini kilitler), unutmak'
              ] }
            ]
          },
          {
            h: 'Monitör ve koşul değişkenleri',
            src: ['ch6/monitor'], slides: '6.43 – 6.56',
            blocks: [
              { t: 'def', term: 'Monitör', en: 'Monitor', html: 'Yüksek seviyeli soyut veri türü: iç değişkenlere yalnızca kendi yordamları erişir; içeride aynı anda <b>tek işlem</b> aktif (bunu yapı sağlar). Derleyici semaforlarla gerçekleştirebilir.' },
              { t: 'compare', cols: [
                { title: 'x.signal() (koşul değişkeni)', items: ['x\'te bekleyenlerden birini devam ettirir', 'Bekleyen yoksa <b>etkisiz</b>'] },
                { title: 'signal() (semafor)', items: ['Değeri <b>her durumda</b> artırır'] }
              ] },
              { t: 'list', items: [
                '<code>x.wait(c)</code>: öncelik numarası; signal <b>en küçük c</b>\'yi uyandırır (ResourceAllocator: en kısa süreli önce)',
                'Monitör de yanlış kullanılabilir: release…acquire, acquire…acquire, unutmak'
              ] },
              { t: 'note', kind: 'warn', html: 'Slayt "x 0\'la başlatılır" der; koşul değişkeninin değeri yoktur, yalnızca bekleme kuyruğu vardır. Durum <code>done</code>\'da tutulur.' }
            ]
          },
          {
            h: 'Canlılık: kilitlenme, açlık, öncelik tersinmesi',
            src: ['ch6/canlilik'], slides: '6.57 – 6.61',
            blocks: [
              { t: 'table', head: ['Kavram', 'Anlamı'], rows: [
                ['Kilitlenme (deadlock)', 'İki+ işlem, yalnızca bekleyenlerden birinin tetikleyebileceği olayı süresiz bekler. S = Q = 1: P0 S\'yi, P1 Q\'yu alır, sonra her biri diğerininkini bekler'],
                ['Açlık (starvation)', 'Süresiz engellenme: semafor kuyruğundan hiç çıkamamak (ör. LIFO)'],
                ['Öncelik tersinmesi', 'Yüksek öncelikli işlemin istediği kilidi düşük öncelikli tutar; orta öncelikli araya girip beklemeyi uzatır']
              ] },
              { t: 'note', kind: 'exam', html: '<b>Öncelik kalıtımı</b>: kaynağı tutan işlem, bekleyenlerin en yüksek önceliğini geçici alır (P3 P1\'in önceliğiyle çalışır, P2 kesemez), kaynağı bırakınca eskisine döner.' }
            ]
          }
        ],
        checks: [
          { q: 'Kritik bölüm çözümünün üç gereksinimi nedir?', a: 'Karşılıklı dışlama, ilerleme ve sınırlı bekleme.' },
          { q: 'Peterson\'da Pi kritik bölüme hangi koşulda girer?', a: 'flag[j] == false veya turn == i ise.' },
          { q: 'compare_and_swap ile test_and_set arasındaki fark nedir?', a: 'test_and_set her zaman true yazar. compare_and_swap yalnızca değer beklenene eşitse yeni değeri yazar. İkisi de eski değeri döndürür.' },
          { q: 'Sayan ve ikili semafor arasındaki fark nedir?', a: 'Sayan semafor sınırsız aralıkta değişir. İkili semafor yalnızca 0 veya 1 olur ve mutex gibi davranır.' },
          { q: 'Kilitlenme ve açlık arasındaki fark nedir?', a: 'Kilitlenmede işlemler birbirinin yapacağı olayı bekler ve hiçbiri ilerleyemez. Açlıkta sistem ilerler ama bir işlem sürekli sırasını kaçırır.' }
        ]
      }
    ],

    // Son kart: shell burada özetlenmez, öğrenci asıl derslere geçer.
    // Shell dersleri ch2'de 'shell-' önekli derslerdir; h32 (pipe sorusu) o derslerde çözülür.
    next: { prefix: 'shell-', ch: 'ch2', tq: ['h32'] }
  };
})(window.OSLab = window.OSLab || {});
