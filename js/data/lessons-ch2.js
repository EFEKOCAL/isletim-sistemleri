/*
 * lessons-ch2.js — Bölüm 2: İşletim Sistemi Yapıları (ch02_TR.pdf).
 */
(function (OSLab) {
  'use strict';

  OSLab.lessons = OSLab.lessons || { chapters: [] };

  OSLab.lessons.chapters.push({
    id: 'ch2',
    num: 2,
    title: 'İşletim Sistemi Yapıları',
    en: 'Operating-System Structures',
    source: 'ch02_TR.pdf',
    objectives: [
      'Bir işletim sisteminin sağladığı servisleri tanımlamak',
      'Servisleri sağlamak için sistem çağrılarının nasıl kullanıldığını göstermek',
      'Monolitik, katmanlı, mikroçekirdek, modüler ve hibrit tasarımları karşılaştırmak',
      'Bir işletim sisteminin önyükleme (boot) sürecini göstermek',
      'İşletim sistemi performansını izlemek için araçları tanımak'
    ],
    lessons: [
      {
        id: 'servisler',
        title: 'İşletim Sistemi Servisleri',
        en: 'Operating-System Services',
        slides: '2.4 – 2.7',
        minutes: 5,
        blocks: [
          { t: 'p', html: 'İşletim sistemi, programların ve servislerin yürütülebildiği bir <b>ortam</b> sağlar. Servisler iki gruba ayrılır. Şekildeki her kutuya tıkla:' },
          { t: 'dg', id: 'services' },
          { t: 'compare', cols: [
            { title: '1. Kullanıcıya yardım eden servisler', items: ['<b>Kullanıcı arayüzü</b>: CLI, GUI, dokunmatik ekran', '<b>Program yürütme</b>: belleğe yükle, çalıştır, sonlandır (normal ya da hatalı)', '<b>G/Ç işlemleri</b>: kullanıcı aygıtları doğrudan kontrol edemez', '<b>Dosya sistemi</b>: oku, yaz, oluştur, sil, ara, izinler', '<b>İletişim</b>: paylaşılan bellek ya da mesaj geçişi', '<b>Hata algılama</b>: CPU, bellek, G/Ç ve programdaki hatalara karşı uygun işlemi yapmak'] },
            { title: '2. Sistemin verimli çalışması için', items: ['<b>Kaynak paylaşımı (allocation)</b>: çok kullanıcılı / çok işli sistemde kaynakları dağıtmak', '<b>Hesap tutma (accounting)</b>: kim, hangi kaynağı, ne kadar kullandı (istatistik)', '<b>Koruma ve güvenlik</b>: işlemler birbirine karışmamalı; tüm kaynaklara erişim denetlenmeli; şifreyle kimlik doğrulama'] }
          ] }
        ],
        checks: [
          { q: 'İşletim sistemi servislerini iki gruba ayırarak say.', a: 'Kullanıcıya yönelik: kullanıcı arayüzü, program yürütme, G/Ç, dosya sistemi, iletişim, hata algılama. Sistemin verimliliğine yönelik: kaynak paylaşımı, hesap tutma (accounting), koruma ve güvenlik.' },
          { q: 'İletişim servisi hangi iki yöntemle sağlanır?', a: 'Paylaşılan bellek (shared memory) ve mesaj geçişi (message passing).' }
        ]
      },
      {
        id: 'arayuz',
        title: 'Kullanıcı ve İşletim Sistemi Arayüzü',
        en: 'User and Operating-System Interface',
        slides: '2.8 – 2.12',
        minutes: 4,
        blocks: [
          { t: 'def', term: 'Komut satırı yorumlayıcısı', en: 'Command-Line Interpreter (CLI)', html: 'Doğrudan komut girişine izin verir. Bazen çekirdekte, bazen bir sistem programı olarak gerçekleştirilir. Birden fazla seçeneği olabilir: <b>kabuklar (shells)</b>, ör. Bourne shell, bash. Temel görevi kullanıcıdan bir komut alıp çalıştırmaktır.' },
          { t: 'compare', cols: [
            { title: 'Yerleşik komutlar', items: ['Komutun kodu kabuğun içindedir', 'Yeni komut eklemek için kabuk değişmeli'] },
            { title: 'Program adları (UNIX yaklaşımı)', items: ['Kabuk, komutla aynı adlı programı bulup çalıştırır (ör. <code>rm file.txt</code> → <code>rm</code> programı)', 'Yeni özellik eklemek için <b>kabuğu değiştirmek gerekmez</b>'] }
          ] },
          { t: 'def', term: 'Grafik kullanıcı arayüzü', en: 'GUI', html: 'Fare, klavye ve monitörle kullanılan masaüstü arayüzü. Simgeler dosyaları, programları, eylemleri temsil eder. <b>Xerox PARC</b>\'ta icat edildi.' },
          { t: 'list', items: [
            'Microsoft Windows: GUI + CLI "command" kabuğu',
            'macOS: "Aqua" GUI, altında UNIX çekirdeği ve kabukları',
            'UNIX / Linux: CLI + isteğe bağlı GUI (CDE, KDE, GNOME)',
            '<b>Dokunmatik ekran</b>: fare yok; hareketlere (gesture) dayalı eylemler, sanal klavye, sesli komutlar'
          ] }
        ],
        checks: [
          { q: 'UNIX kabuğunda komutların program adı olarak gerçekleştirilmesinin avantajı nedir?', a: 'Yeni bir komut eklemek için kabuğu değiştirmek gerekmez; yeni bir program dosyası eklemek yeterlidir.' }
        ]
      },
      {
        id: 'sistem-cagrisi',
        title: 'Sistem Çağrıları ve API',
        en: 'System Calls & API',
        slides: '2.13 – 2.20',
        minutes: 8,
        blocks: [
          { t: 'def', term: 'Sistem çağrısı', en: 'System call', html: 'İşletim sisteminin sağladığı servislere erişmek için <b>programlama arayüzü</b>. Genellikle C veya C++ ile yazılır. Her birinin <b>adı, numarası ve parametre kümesi</b> vardır.' },
          { t: 'def', term: 'Uygulama programlama arayüzü', en: 'API', html: 'Programlar sistem çağrılarını çoğunlukla <b>doğrudan değil</b>, yüksek seviyeli bir API üzerinden kullanır. En yaygın üç API: <b>Win32 API</b> (Windows), <b>POSIX API</b> (UNIX, Linux, macOS), <b>Java API</b> (JVM).' },
          { t: 'p', html: 'Bir <code>open()</code> çağrısının yolunu adım adım izle:' },
          { t: 'dg', id: 'syscall' },
          { t: 'h', text: 'Gerçekleştirme' },
          { t: 'list', items: [
            'Her sistem çağrısı bir <b>numara</b> ile ilişkilendirilir; <b>sistem çağrısı arayüzü</b> bu numaralarla indekslenen bir tablo tutar.',
            'Arayüz, çekirdekteki asıl sistem çağrısını çağırır; <b>durumunu ve dönüş değerini</b> döndürür.',
            'Çağıranın çağrının nasıl gerçekleştirildiğini bilmesi gerekmez; yalnızca API\'ye uyar. Ayrıntıları derleyiciyle gelen <b>çalışma zamanı destek kitaplığı</b> gizler.'
          ] },
          { t: 'h', text: 'Örnek: read() API\'si' },
          { t: 'code', text: '#include <unistd.h>\n\nssize_t   read(int fd, void *buf, size_t count)\n// dönüş   ad    parametreler\n// fd: okunacak dosya tanımlayıcısı\n// buf: verinin okunacağı tampon\n// count: okunacak en fazla bayt\n// Başarı: okunan bayt sayısı, 0: dosya sonu, hata: -1' },
          { t: 'p', html: 'Basit bir dosya kopyalama bile çok sayıda sistem çağrısı gerektirir: dosya adlarını sor (ekrana yaz, girdi al), girdi dosyasını aç (yoksa iptal), çıktı dosyasını oluştur (varsa iptal), döngüde oku/yaz, kapat, tamamlandı mesajı yaz, normal sonlan.' },
          { t: 'note', kind: 'exam', html: '<code>printf()</code> bir C kütüphanesi fonksiyonudur (kullanıcı modu); içeride <code>write()</code> sistem çağrısını yapar (çekirdek modu). Aynı şekilde <code>fopen()</code> → <code>open()</code> → <code>sys_open</code>.' }
        ],
        lab: { label: 'Dual-Mode laboratuvarında sistem çağrısı tablosunu ve mod geçişini izle', preset: { module: 'system', lab: 'mode', syscall: 'open' } },
        checks: [
          { q: 'Programcılar neden sistem çağrıları yerine API kullanır?', a: 'Taşınabilirlik (aynı API\'yi destekleyen her sistemde derlenir) ve kullanım kolaylığı (asıl sistem çağrıları daha ayrıntılı ve zordur).' },
          { q: 'Sistem çağrısı arayüzü doğru çekirdek fonksiyonunu nasıl bulur?', a: 'Her çağrının bir numarası vardır; arayüz bu numarayla indekslenen tablodan ilgili fonksiyonun adresini bulur.' },
          { q: 'read() 0 döndürürse bu ne anlama gelir?', a: 'Dosya sonuna ulaşıldı (EOF). Hata durumunda -1 döner.' }
        ]
      },
      {
        id: 'parametre',
        title: 'Parametre Geçişi ve Sistem Çağrısı Türleri',
        en: 'Parameter Passing & Types of System Calls',
        slides: '2.21 – 2.30',
        minutes: 7,
        blocks: [
          { t: 'p', html: 'Sistem çağrısının kimliğinden fazlası gerekir: parametreler. Üç genel yöntem vardır, sekmelerden karşılaştır:' },
          { t: 'dg', id: 'params' },
          { t: 'note', kind: 'exam', html: '<b>Blok ve yığın</b> yöntemleri parametre sayısını veya uzunluğunu sınırlamaz. Linux ve Solaris blok (tablo) yaklaşımını benimser.' },
          { t: 'h', text: 'Sistem çağrısı türleri' },
          { t: 'table', head: ['Tür', 'Örnek işlemler', 'Windows', 'UNIX'], rows: [
            ['İşlem kontrolü', 'oluştur, sonlandır, yükle, çalıştır, bekle, bellek ayır, hata dökümü, kilitler', 'CreateProcess(), ExitProcess(), WaitForSingleObject()', 'fork(), exit(), wait()'],
            ['Dosya yönetimi', 'oluştur, sil, aç, kapat, oku, yaz, öznitelikler', 'CreateFile(), ReadFile(), WriteFile(), CloseHandle()', 'open(), read(), write(), close()'],
            ['Aygıt yönetimi', 'aygıt iste/bırak, oku, yaz, öznitelikler, bağla/ayır', 'SetConsoleMode(), ReadConsole(), WriteConsole()', 'ioctl(), read(), write()'],
            ['Bilgi bakımı', 'saat/tarih, sistem verisi, işlem öznitelikleri', 'GetCurrentProcessID(), SetTimer(), Sleep()', 'getpid(), alarm(), sleep()'],
            ['İletişim', 'bağlantı oluştur/sil, mesaj gönder/al, paylaşılan bellek', 'CreatePipe(), CreateFileMapping(), MapViewOfFile()', 'pipe(), shm_open(), mmap()'],
            ['Koruma', 'erişim denetimi, izinleri al/ayarla', 'SetFileSecurity(), InitializeSecurityDescriptor()', 'chmod(), umask(), chown()']
          ] },
          { t: 'h', text: 'İki örnek sistem' },
          { t: 'compare', cols: [
            { title: 'Arduino', items: ['Tek görev, işletim sistemi yok', 'Program (sketch) USB ile flash belleğe yüklenir', 'Tek bellek alanı; önyükleyici programı yükler', 'Program bitince kabuk yeniden yüklenir'] },
            { title: 'FreeBSD (UNIX türevi)', items: ['Çoklu görev', 'Giriş yapınca kullanıcının seçtiği kabuk açılır', 'Kabuk <code>fork()</code> ile işlem oluşturur, <code>exec()</code> ile programı yükler', 'Çıkış kodu: 0 = hata yok, &gt; 0 = hata kodu'] }
          ] }
        ],
        checks: [
          { q: 'Parametre geçirmenin üç yöntemi nedir? Hangisi sayı sınırı getirir?', a: 'Yazmaçlar, bellekte blok/tablo (adresi yazmaçla geçilir), yığın (push/pop). Yalnızca yazmaç yöntemi sınırlıdır; yazmaç sayısından fazla parametre olabilir.' },
          { q: 'UNIX\'teki fork(), exit(), wait() hangi sistem çağrısı türüne girer? Windows karşılıkları nedir?', a: 'İşlem kontrolü. Windows: CreateProcess(), ExitProcess(), WaitForSingleObject().' }
        ]
      },
      {
        id: 'sistem-programlari',
        title: 'Sistem Programları',
        en: 'System Programs / Services',
        slides: '2.31 – 2.34',
        minutes: 3,
        blocks: [
          { t: 'p', html: 'Sistem programları, program geliştirme ve yürütme için uygun bir ortam sağlar. Bazıları sistem çağrılarının basit kullanıcı arayüzleridir, bazıları çok daha karmaşıktır.' },
          { t: 'table', head: ['Kategori', 'Örnek'], rows: [
            ['Dosya işlemleri', 'Dosya/dizin oluştur, sil, kopyala, yeniden adlandır, yazdır, listele'],
            ['Durum bilgileri', 'Tarih, saat, boş bellek, disk alanı, kullanıcı sayısı; bazı sistemlerde yapılandırma için <b>kayıt defteri (registry)</b>'],
            ['Dosya değiştirme', 'Metin editörleri'],
            ['Programlama dili desteği', 'Derleyiciler, assembler\'lar, yorumlayıcılar'],
            ['Program yükleme ve yürütme', 'Yükleyiciler (loader), bağlantı editörleri (linker)'],
            ['İletişim', 'İşlemler, kullanıcılar ve bilgisayarlar arasında sanal bağlantı: mesaj, FTP, tarayıcı'],
            ['Arka plan servisleri', 'Daemon\'lar'],
            ['Uygulama programları', 'Tarayıcı, kelime işlemci vb.']
          ] },
          { t: 'note', kind: 'exam', html: 'Çoğu kullanıcının işletim sistemi algısı gerçek sistem çağrılarıyla değil, <b>sistem programlarıyla</b> belirlenir. İşletim sisteminin gözünde sistem programları da kullanıcı programları da birer <b>uygulamadır</b>.' }
        ],
        checks: [
          { q: 'Bir kullanıcının işletim sistemine bakışını çoğunlukla ne belirler?', a: 'Sistem çağrıları değil, sistem programları (kabuk, dosya yöneticisi, editörler vb.).' }
        ]
      },
      {
        id: 'baglayici',
        title: 'Bağlayıcılar ve Yükleyiciler',
        en: 'Linkers and Loaders',
        slides: '2.35 – 2.36',
        minutes: 8,
        blocks: [
          { t: 'p', html: 'Kaynak koddan bellekte çalışan programa giden yol (slayt 2.36). Adımları ilerlet:' },
          { t: 'dg', id: 'linkload' },
          { t: 'def', term: 'Yeniden konumlandırılabilir nesne dosyası', en: 'Relocatable object file', html: 'Derleyicinin ürettiği, fiziksel bellekte <b>herhangi bir yere yüklenebilecek</b> şekilde tasarlanmış dosya (ör. <code>main.o</code>).' },
          { t: 'def', term: 'Bağlayıcı', en: 'Linker', html: 'Nesne dosyalarını tek bir ikili <b>çalıştırılabilir (executable)</b> dosyada birleştirir; <b>kütüphaneleri de dahil eder</b>.' },
          { t: 'def', term: 'Yükleyici', en: 'Loader', html: 'İkincil depolamada duran çalıştırılabilir dosyayı yürütülmek üzere <b>belleğe getirir</b>.' },
          { t: 'def', term: 'Yeniden konumlandırma', en: 'Relocation', html: 'Program parçalarına <b>son adresleri atamak</b> ve programdaki kodu ve veriyi bu adreslere uyacak şekilde <b>düzeltmek</b>.' },
          { t: 'def', term: 'Dinamik bağlı kütüphaneler', en: 'Dynamically linked libraries (DLL, .so)', html: 'Modern genel amaçlı sistemler kütüphaneleri çalıştırılabilir dosyaya kopyalamaz. Kütüphaneler <b>gerektiğinde yüklenir</b> ve aynı sürümü kullanan herkes tarafından <b>paylaşılır</b>: bellekte <b>bir kez</b> bulunur.' },
          { t: 'p', html: 'Nesne ve çalıştırılabilir dosyaların <b>standart biçimleri</b> vardır (Linux\'ta <b>ELF</b>), böylece işletim sistemi onları nasıl yükleyip başlatacağını bilir.' },
          { t: 'compare', cols: [
            { title: 'Statik bağlama', items: ['Kütüphane kodu çalıştırılabilir dosyaya kopyalanır', 'Dosya büyür, her program kendi kopyasını taşır', 'Çalışma anında bağımlılık yok', 'Kütüphane güncellenirse yeniden bağlamak gerekir'] },
            { title: 'Dinamik bağlama', items: ['Dosyaya yalnızca bir başvuru/saplama (stub) eklenir', 'Kütüphane bellekte bir kez, işlemler arasında paylaşılır', 'Kütüphane güncellemesi tüm programlara yansır', 'Kütüphane eksikse program açılmaz'] }
          ] },
          { t: 'note', kind: 'extra', html: 'Linux\'ta <code>ldd ./main</code> komutu, bir programın hangi paylaşılan kütüphanelere (<code>.so</code>) ihtiyaç duyduğunu ve bunların diskteki yollarını listeler. <code>gcc -o main main.o -lm</code> komutundaki <code>-lm</code>, matematik kütüphanesini (libm) bağlamasını söyler.' }
        ],
        lab: { label: 'Derle → Bağla → Yükle laboratuvarında relocation ve dinamik bağlamayı canlı gör', preset: { module: 'system', lab: 'build', stage: 'source', libc: 'dynamic' } },
        checks: [
          { q: 'Linker ile loader arasındaki temel fark nedir?', a: 'Linker derleme sonrasında dosyalar üzerinde çalışır: nesne dosyalarını ve kütüphaneleri tek bir çalıştırılabilir dosyada birleştirir. Loader çalıştırma anında bu dosyayı belleğe yükler ve relocation yapar.' },
          { q: 'Relocation nedir?', a: 'Program parçalarına son adresleri atamak ve kod ile veriyi bu adreslere göre düzeltmek.' },
          { q: 'Dinamik bağlamanın bellek açısından avantajı nedir?', a: 'Kütüphane bellekte yalnızca bir kez bulunur ve onu kullanan tüm işlemler tarafından paylaşılır.' }
        ]
      },
      {
        id: 'abi',
        title: 'Uygulamalar Neden İşletim Sistemine Özgüdür? (ABI)',
        en: 'Why Applications Are OS Specific',
        slides: '2.37',
        minutes: 5,
        blocks: [
          { t: 'p', html: 'Bir sistemde derlenen uygulama genellikle başka bir işletim sisteminde <b>çalışmaz</b>, çünkü her işletim sistemi kendine özgü <b>sistem çağrıları</b>, <b>dosya biçimleri</b> ve benzeri öğeler sunar.' },
          { t: 'h', text: 'Çok platformlu uygulama yazmanın üç yolu' },
          { t: 'list', ordered: true, items: [
            '<b>Yorumlanan dil</b> (Python, Ruby): yorumlayıcı birçok işletim sisteminde mevcuttur.',
            '<b>Sanal makine içeren dil</b> (Java): uygulama, her işletim sistemi için yazılmış bir VM (JVM) içinde çalışır.',
            '<b>Standart dil</b> (C) ile yazıp <b>her işletim sisteminde ayrı derlemek</b>.'
          ] },
          { t: 'def', term: 'Uygulama ikili arayüzü', en: 'Application Binary Interface (ABI)', html: 'API\'nin <b>mimari düzeyindeki karşılığı</b>. Belirli bir mimaride, CPU\'da ve işletim sisteminde ikili kodun farklı bileşenlerinin <b>nasıl arayüz kuracağını</b> tanımlar: parametrelerin hangi yazmaçlarla geçirileceği, yığın düzeni, ikili kütüphane biçimi, veri türlerinin boyutu.' },
          { t: 'compare', cols: [
            { title: 'API', items: ['<b>Kaynak kodu</b> düzeyi', 'Hangi fonksiyonlar, hangi parametreler', 'Aynı API\'ye uyan kod farklı sistemde <b>yeniden derlenebilir</b>'] },
            { title: 'ABI', items: ['<b>İkili (makine kodu)</b> düzeyi', 'Yazmaçlar, yığın, ikili biçim, tür boyutları', 'Aynı ABI\'ye uyan ikili dosya <b>yeniden derlenmeden</b> çalışır'] }
          ] },
          { t: 'note', kind: 'extra', html: 'Çalıştırılabilir dosya biçimleri: Linux <b>ELF</b>, Windows <b>PE</b>, macOS <b>Mach-O</b>. x86-64 Linux ABI\'sinde sistem çağrısı numarası <code>rax</code>, parametreler <code>rdi, rsi, rdx…</code> yazmaçlarındadır.' }
        ],
        checks: [
          { q: 'Linux\'ta derlenmiş bir program neden Windows\'ta çalışmaz? Üç neden say.', a: 'Farklı sistem çağrıları, farklı çalıştırılabilir dosya biçimleri (ELF ve PE), farklı ABI (ve gerekiyorsa farklı CPU komut kümesi).' },
          { q: 'API ile ABI arasındaki fark nedir?', a: 'API kaynak kodu düzeyinde fonksiyon ve parametreleri tanımlar. ABI ikili düzeyde yazmaçları, yığın düzenini, ikili biçimi ve veri türü boyutlarını tanımlar.' }
        ]
      },
      {
        id: 'tasarim',
        title: 'Tasarım ve Uygulama: Policy ve Mechanism',
        en: 'Design & Implementation',
        slides: '2.38 – 2.40',
        minutes: 6,
        blocks: [
          { t: 'p', html: 'İşletim sistemi tasarımının "kesin bir çözümü" yoktur ama bazı yaklaşımlar başarılı olmuştur. Tasarım <b>hedefler ve gereksinimler</b> belirlenerek başlar; donanım ve sistem türü seçiminden etkilenir.' },
          { t: 'compare', cols: [
            { title: 'Kullanıcı hedefleri', items: ['Kullanımı rahat', 'Öğrenmesi kolay', 'Güvenilir, güvenli, hızlı'] },
            { title: 'Sistem hedefleri', items: ['Tasarlaması, gerçekleştirmesi ve bakımı kolay', 'Esnek, güvenilir, hatasız, verimli'] }
          ] },
          { t: 'h', text: 'Policy ve Mechanism' },
          { t: 'compare', cols: [
            { title: 'Policy (politika): NE yapılacak?', items: ['Örnek: "Her 100 saniyede bir kesme üret"'] },
            { title: 'Mechanism (mekanizma): NASIL yapılacak?', items: ['Örnek: zamanlayıcı (timer)'] }
          ] },
          { t: 'note', kind: 'exam', html: 'Önemli ilke: <b>politikayı mekanizmadan ayır</b>. Böylece politika kararları sonradan değişirse maksimum esneklik sağlanır. Örnek: 100\'ü 200 yapmak yalnızca bir parametre değişikliğidir, zamanlayıcı mekanizmasına dokunulmaz.' },
          { t: 'h', text: 'Gerçekleştirme (implementation)' },
          { t: 'list', items: [
            'İlk işletim sistemleri <b>assembly</b>; sonra Algol, PL/1 gibi sistem programlama dilleri; bugün <b>C, C++</b>.',
            'Pratikte dillerin <b>karışımı</b> kullanılır: en alt seviyeler <b>assembly</b>, ana gövde <b>C</b>, sistem programları C, C++ ve PERL, Python, shell gibi betik dilleri.',
            'Yüksek seviyeli dille yazılan sistem başka donanıma <b>taşınması (port) daha kolaydır</b>, ama daha yavaş olabilir.',
            '<b>Emülasyon</b>, bir işletim sisteminin kendi donanımı olmayan bir donanımda çalışmasını sağlayabilir.'
          ] }
        ],
        checks: [
          { q: 'Timer örneğinde policy ve mechanism hangileridir?', a: 'Mekanizma: timer\'ın kendisi (nasıl kesme üretileceği). Politika: timer\'ın kaç saniyeye ayarlanacağı (ne zaman/ne sıklıkla).' },
          { q: 'İşletim sistemlerinde neden en alt seviye assembly ile yazılır?', a: 'Donanıma özgü işler (yazmaç erişimi, kesme girişi, bağlam değişimi, ayrıcalıklı komutlar) yüksek seviyeli dille ifade edilemez veya yeterince verimli olmaz.' }
        ]
      },
      {
        id: 'yapilar',
        title: 'İşletim Sistemi Yapıları',
        en: 'Operating-System Structure',
        slides: '2.41 – 2.58',
        minutes: 10,
        blocks: [
          { t: 'p', html: 'Bir işletim sistemini düzenlemenin farklı yolları vardır. Sekmeleri sırayla gez, her yapının şeklini ve özelliklerini incele:' },
          { t: 'dg', id: 'structures' },
          { t: 'table', head: ['Yapı', 'Ana fikir', 'Örnek'], rows: [
            ['Basit (simple)', 'Küçük bellekte çok işlev; modüllere bölünmez, arayüzler ve seviyeler kesin ayrılmaz, uygulamalar donanıma doğrudan erişebilir', 'MS-DOS'],
            ['Monolitik', 'Sistem çağrısı arayüzünün altı ve donanımın üstündeki her şey tek çekirdekte; bir katmanda çok sayıda işlev', 'Orijinal UNIX'],
            ['Katmanlı (layered)', 'Katman 0 donanım, katman N kullanıcı arayüzü; her katman yalnızca alt katmanları kullanır ve ayrıntılarını üst katmanlardan gizler', '(Kavramsal model)'],
            ['Mikroçekirdek', 'Çekirdekte yalnızca en temel işlevler; servisler kullanıcı alanında, mesaj geçişiyle iletişim', 'Mach (macOS Darwin), QNX'],
            ['Modüler (LKM)', 'Temel çekirdek + gerektikçe yüklenen modüller; nesne yönelimli, arayüzlerle haberleşme; katmanlıya benzer ama daha esnek', 'Linux, Solaris'],
            ['Hibrit', 'Performans, güvenlik ve kullanılabilirlik için birden çok yaklaşımın birleşimi', 'Linux, Windows, macOS']
          ] },
          { t: 'compare', cols: [
            { title: 'Mikroçekirdek yararları', items: ['İşletim sistemini <b>yeni mimarilere taşımak</b> kolay', 'Mikroçekirdeği <b>genişletmek</b> kolay', '<b>Daha güvenilir</b>: çekirdek modunda daha az kod çalışır'] },
            { title: 'Mikroçekirdek zararı', items: ['Kullanıcı alanı ile çekirdek alanı arasındaki iletişimin <b>performans yükü</b> (mesaj kopyalama, mod geçişleri)'] }
          ] },
          { t: 'h', text: 'Gerçek sistemler' },
          { t: 'list', items: [
            '<b>Linux</b>: monolitik + modüler. Çekirdek tek adres alanında çalışır, işlevsellik çalışma anında modüllerle eklenir.',
            '<b>Windows</b>: çoğunlukla monolitik, farklı alt sistemler için mikroçekirdek özellikleri (hibrit).',
            '<b>macOS / iOS</b>: hibrit ve katmanlı. Katmanlar: uygulamalar → kullanıcı deneyimi → uygulama çerçeveleri → çekirdek çerçeveleri → çekirdek ortamı (<b>Darwin</b>). Darwin = <b>Mach mikroçekirdeği + BSD UNIX</b>; ayrıca iokit ve çekirdek uzantıları (kexts).',
            '<b>Android</b>: değiştirilmiş Linux çekirdeği (güç yönetimi eklenmiş); çalışma zamanı ortamı (ART/Dalvik VM), Java + Android API ile uygulamalar, Bionic (küçük libc), HAL, SQLite, OpenGL, webkit.'
          ] },
          { t: 'h', text: 'Temel katmanlı yapı (slayt 2.52 – 2.53)' },
          { t: 'list', items: [
            '<b>Uygulama katmanı</b>: kullanılan programlar (Word, Excel)',
            '<b>Kabuk (shell) katmanı</b>: kullanıcı ile bilgisayarın iletişimini sağlayan arabirim (MS-DOS\'ta <code>C:&gt;</code>, Linux\'ta root için <code>#</code>, kullanıcı için <code>$</code>)',
            '<b>Çekirdek katmanı</b>: kabuktan gelen komutlarla donanımla iletişim kurup işlemleri yürütür',
            '<b>Donanım katmanı</b>: donanım elemanları'
          ] }
        ],
        lab: { label: 'OS Mimarileri laboratuvarında monolitik ve mikroçekirdeği yarıştır, sürücü çökmesini dene', preset: { module: 'system', lab: 'arch', action: 'request' } },
        checks: [
          { q: 'Mikroçekirdekte servisler birbirleriyle nasıl iletişim kurar?', a: 'Doğrudan değil; mikroçekirdek üzerinden mesaj geçirerek (IPC).' },
          { q: 'Linux neden "monolitik + modüler" olarak tanımlanır?', a: 'Çekirdeğin tamamı tek adres alanında çekirdek modunda çalışır (monolitik), ama sürücüler ve dosya sistemleri gibi işlevler çalışma anında yüklenebilir çekirdek modülleriyle (LKM) eklenip çıkarılabilir (modüler).' },
          { q: 'Katmanlı yapının bir avantajı ve bir dezavantajı?', a: 'Avantaj: inşa etmek ve hata ayıklamak kolaydır, her katman yalnızca alttakini kullanır ve ayrıntıları gizler. Dezavantaj: katmanları doğru tanımlamak zordur ve katman geçişleri performansı düşürür.' }
        ]
      },
      {
        id: 'boot',
        title: 'İşletim Sistemini Oluşturma ve Önyükleme',
        en: 'Building and Booting an OS',
        slides: '2.59 – 2.61',
        minutes: 7,
        blocks: [
          { t: 'p', html: 'İşletim sistemleri genellikle çeşitli çevre birimlerine sahip bir <b>sistem sınıfı</b> için tasarlanır. Çoğunlukla satın alınan bilgisayarda kuruludur, ama başka sistemler de derlenip kurulabilir.' },
          { t: 'h', text: 'Sıfırdan bir işletim sistemi oluşturmak' },
          { t: 'list', ordered: true, items: [
            'İşletim sisteminin <b>kaynak kodunu yaz</b> (ya da edin)',
            'Çalışacağı sistem için <b>yapılandır</b> (configure)',
            '<b>Derle</b> (compile)',
            '<b>Kur</b> (install)',
            'Bilgisayarı yeni işletim sistemiyle <b>önyükle</b> (boot)'
          ] },
          { t: 'h', text: 'Linux örneği' },
          { t: 'code', text: '# 1. Kaynak kodu indir: http://www.kernel.org\nmake menuconfig        # 2. çekirdeği yapılandır (.config)\nmake                   # 3. derle → vmlinuz (çekirdek imajı)\nmake modules           # 4. çekirdek modüllerini derle\nmake modules_install   # 5. modülleri kur\nmake install           # 6. yeni çekirdeği sisteme kur\n# 7. yeniden başlat, önyükleyiciden yeni çekirdeği seç' },
          { t: 'def', term: 'vmlinuz', en: 'Linux kernel image', html: '<code>make</code> ile üretilen <b>Linux çekirdek imajı</b>; önyükleyicinin belleğe yüklediği dosya. Genellikle <code>/boot/vmlinuz-&lt;sürüm&gt;</code> yolundadır. (Ek: "vm" sanal bellek desteğini, "z" sıkıştırılmış olduğunu belirtir.)' },
          { t: 'h', text: 'Önyükleme (system boot)' },
          { t: 'dg', id: 'boot' },
          { t: 'list', items: [
            'Güç verildiğinde yürütme <b>sabit bir bellek konumunda</b> başlar.',
            '<b>Bootstrap loader</b>: ROM veya EEPROM\'da saklanan küçük kod parçası (BIOS). Çekirdeği bulur, belleğe yükler ve başlatır.',
            'Bazen <b>iki adımlıdır</b>: ROM kodu sabit konumdaki <b>boot block</b>\'u yükler, o da diskten asıl önyükleyiciyi yükler.',
            'Modern sistemler BIOS\'un yerine <b>UEFI</b> (Unified Extensible Firmware Interface) kullanır.',
            '<b>GRUB</b>: yaygın önyükleyici; birden çok diskten, sürümden ve çekirdek seçenekleriyle <b>çekirdek seçmeye</b> izin verir.',
            'Çekirdek yüklenir ve sistem <b>çalışır (running)</b> duruma gelir. Önyükleyiciler genellikle <b>tek kullanıcı modu (single user mode)</b> gibi farklı başlatma durumlarına izin verir.'
          ] },
          { t: 'compare', cols: [
            { title: 'BIOS', items: ['Eski firmware, ROM/EEPROM\'da', 'Diskin ilk sektöründeki <b>boot block</b>\'u (MBR) yükler, o da önyükleyiciyi yükler', '(Ek) 16-bit gerçek mod, MBR bölümleme (2 TB sınırı)'] },
            { title: 'UEFI', items: ['BIOS\'un modern yerine geçeni', '(Ek) Kendi önyükleme yöneticisi vardır, EFI sistem bölümündeki dosyayı doğrudan yükler', '(Ek) GPT diskler (&gt;2 TB), 64-bit, daha hızlı açılış, Secure Boot'] }
          ] }
        ],
        checks: [
          { q: 'Bootstrap loader nedir ve nerede saklanır?', a: 'Güç verildiğinde çalışan, çekirdeği bulup belleğe yükleyen ve başlatan küçük kod parçası. ROM veya EEPROM\'da (firmware) saklanır.' },
          { q: 'GRUB ne işe yarar?', a: 'Önyükleme sırasında birden çok disk, çekirdek sürümü ve çekirdek seçeneği arasından seçim yapmayı sağlar; tek kullanıcı modu gibi başlatma durumlarına izin verir.' },
          { q: 'Linux çekirdek derlemesinin adımlarını sırala.', a: 'kernel.org\'dan kaynak indir → make menuconfig → make (vmlinuz) → make modules → make modules_install → make install → yeniden başlat.' }
        ]
      },
      {
        id: 'debug',
        title: 'İşletim Sistemi Hata Ayıklama',
        en: 'Operating-System Debugging',
        slides: '2.62 – 2.66',
        minutes: 7,
        blocks: [
          { t: 'def', term: 'Hata ayıklama', en: 'Debugging', html: 'Hataları (<b>bugs</b>) bulma ve düzeltme. Ayrıca <b>performans ayarlamayı</b> (performance tuning) da kapsar.' },
          { t: 'list', items: [
            'İşletim sistemi hata bilgisi içeren <b>log dosyaları</b> üretir.',
            'Bir <b>uygulamanın</b> hatası, işlemin belleğini yakalayan bir <b>core dump</b> dosyası üretebilir.',
            '<b>İşletim sisteminin</b> hatası (crash), çekirdek belleğini içeren bir <b>crash dump</b> dosyası üretebilir.'
          ] },
          { t: 'compare', cols: [
            { title: 'Core dump', items: ['<b>Kullanıcı işleminin</b> hatası', 'İçerik: işlemin bellek görüntüsü', 'Sonra hata ayıklayıcıyla incelenir (gdb)'] },
            { title: 'Crash dump', items: ['<b>Çekirdeğin</b> hatası (crash)', 'İçerik: çekirdek belleği', '(Ek) Dosya sistemi kodu bozulmuş olabileceği için diskin ayrılmış bir alanına yazılır'] }
          ] },
          { t: 'h', text: 'Performans ayarlama' },
          { t: 'list', items: [
            'Amaç: <b>darboğazları (bottlenecks) kaldırarak</b> performansı artırmak.',
            'İşletim sistemi, sistem davranışının ölçümlerini hesaplamak ve göstermek için araçlar sağlamalıdır: <b>top</b> programı, Windows <b>Görev Yöneticisi</b>.',
            '<b>Trace listings</b>: etkinliklerin analiz için kaydedilmesi.',
            '<b>Profiling</b>: istatistiksel eğilimleri görmek için komut göstericisinin (instruction pointer) periyodik örneklenmesi.'
          ] },
          { t: 'h', text: 'İzleme (tracing) araçları' },
          { t: 'p', html: '<b>Tracing</b>, belirli bir olay için veri toplar; örneğin bir sistem çağrısı çağrısındaki adımlar. Aşağıdaki şekilde Linux yığınının katmanlarına tıklayarak hangi aracın nereyi izlediğini gör:' },
          { t: 'dg', id: 'debugtools' },
          { t: 'table', head: ['Araç', 'Görevi'], rows: [
            ['strace', 'Bir işlemin çağırdığı sistem çağrılarını izler'],
            ['gdb', 'Kaynak kodu düzeyinde hata ayıklayıcı'],
            ['perf', 'Linux performans araçları koleksiyonu'],
            ['tcpdump', 'Ağ paketlerini toplar'],
            ['BCC (BPF Compiler Collection)', 'Linux için zengin izleme araç seti; kullanıcı ve çekirdek kodu arasındaki etkileşimi izler (bkz. DTrace). Ör. <code>disksnoop.py</code> disk G/Ç etkinliğini izler']
          ] },
          { t: 'note', kind: 'exam', html: '<b>Kernighan Yasası</b>: "Hata ayıklamak, kodu ilk baştan yazmaktan iki kat daha zordur. Bu nedenle kodu olabildiğince zekice yazarsanız, tanım gereği onu ayıklayacak kadar zeki değilsinizdir." Ders: <b>basit ve anlaşılır kod yaz</b>.' }
        ],
        lab: { label: 'Dual-Mode laboratuvarında ayrıcalıklı komut hatası → core dump senaryosunu izle', preset: { module: 'system', lab: 'mode', illegal: true } },
        checks: [
          { q: 'Core dump ile crash dump arasındaki fark nedir?', a: 'Core dump bir kullanıcı işleminin hatasında o işlemin belleğini kaydeder. Crash dump işletim sistemi (çekirdek) çöktüğünde çekirdek belleğini kaydeder.' },
          { q: 'strace ne işe yarar?', a: 'Bir işlemin çağırdığı sistem çağrılarını (parametreleri ve dönüş değerleriyle) izler.' },
          { q: 'Profiling nedir?', a: 'İstatistiksel eğilimleri bulmak için komut göstericisinin (instruction pointer) periyodik olarak örneklenmesi; programın zamanını nerede harcadığını gösterir.' }
        ]
      }
    ]
  });
})(window.OSLab = window.OSLab || {});
