/*
 * teacher-questions.js — Hocanın paylaştığı sınav soruları.
 *
 * YENİ SORU EKLEMEK İÇİN listenin sonuna şu biçimde bir nesne ekleyin:
 *   {
 *     id: 'h27',                       // benzersiz kimlik (ilerleme kaydı buna bağlı, değiştirmeyin)
 *     set: 'Liste 2',                  // hangi duyurudan geldiği
 *     lesson: 'ch3/olusturma',         // ilgili ders: '<bölüm>/<ders id>'
 *     q: 'Soru metni',
 *     a: '<p>Model cevap (HTML)</p>',
 *     keys: ['cevapta olması gereken nokta 1', 'nokta 2'],
 *     lab: { label: '...', preset: { ... } }   // isteğe bağlı
 *   }
 * "(Ek)" ile işaretli bilgiler slaytlarda yok; kitaptan ya da genel bilgiden eklendi.
 */
(function (OSLab) {
  'use strict';

  const BUILD = (stage, libc) => ({ module: 'system', lab: 'build', stage, libc: libc || 'dynamic' });

  OSLab.teacherQuestions = [
    {
      id: 'h1', set: 'Liste 1', lesson: 'ch2/baglayici',
      q: 'Derleme sürecinde linker ve loader\'ın görevleri nelerdir? Aralarındaki farkı örnekle açıklayın.',
      a: `<p><b>Linker (bağlayıcı):</b> Derleyicinin ürettiği yeniden konumlandırılabilir nesne dosyalarını (<code>main.o</code>) ve gereken kütüphaneleri <b>tek bir çalıştırılabilir dosyada</b> birleştirir. Bunu yaparken dış sembolleri (<code>printf</code>, <code>sqrt</code>) çözümler ve komutlardaki adres başvurularını düzeltir.</p>
<p><b>Loader (yükleyici):</b> İkincil depolamadaki çalıştırılabilir dosyayı yürütülmek üzere <b>belleğe yükler</b>. Bu sırada <b>relocation</b> yapar (program parçalarına son adresleri atar), gerekirse dinamik kütüphaneleri (DLL / .so) yükler ve programı başlatır.</p>
<p><b>Fark:</b> Linker <b>derleme sonrasında</b> dosyalar üzerinde çalışır ve çıktısı bir dosyadır. Loader <b>çalıştırma anında</b> çalışır ve çıktısı bellekteki bir işlemdir.</p>
<div class="formula">gcc -c main.c           → derleyici: main.o
gcc -o main main.o -lm  → linker: main (libm bağlandı)
./main                  → loader: belleğe yükle, relocation, başlat</div>`,
      keys: ['Derleyici yeniden konumlandırılabilir nesne dosyası (.o) üretir', 'Linker nesne dosyalarını ve kütüphaneleri tek çalıştırılabilir dosyada birleştirir', 'Linker sembolleri çözümler', 'Loader dosyayı ikincil depolamadan belleğe yükler', 'Loader relocation yapar / DLL\'leri yükler', 'Zaman farkı: linker derleme sonrası, loader çalıştırma anı', 'Somut örnek (gcc -c, gcc -o ... -lm, ./main)'],
      lab: { label: 'Bağlayıcı adımını laboratuvarda incele', preset: BUILD('linker') }
    },
    {
      id: 'h2', set: 'Liste 1', lesson: 'ch2/baglayici',
      q: 'Relocation işlemi neyi ifade eder? Bu işlem yapılmazsa ne tür bir hata oluşur?',
      a: `<p><b>Relocation:</b> Program parçalarına <b>son (fiziksel) adresleri atamak</b> ve programdaki kodu ve veriyi bu adreslere uyacak şekilde <b>düzeltmektir</b>. Derleyici adresleri 0'dan başlıyormuş gibi üretir. Program belleğe başka bir tabana yüklendiğinde, ör. taban 14000 ise mantıksal 346 → fiziksel 14346 olmalıdır.</p>
<p><b>Yapılmazsa:</b> Program, adreslerinin 0'dan başladığını varsayarak çalışır. Değişkenlere ve fonksiyonlara yaptığı başvurular yanlış fiziksel konumlara gider:</p>
<ul><li>Yanlış veri okunur veya yazılır; atlamalar (jump/call) yanlış koda gider ve program çöker.</li><li>İşletim sisteminin veya başka bir işlemin belleğine erişmeye çalışır. Koruma (base/limit, MMU) varsa <b>adresleme hatası / trap</b> oluşur ve işlem sonlandırılır (Linux'ta <b>segmentation fault</b>).</li><li>Program yalnızca derlendiği adrese yüklenebilir hale gelir; birden çok program aynı yeri isteyemez.</li></ul>`,
      keys: ['Tanım: son adresleri atamak', 'Kod ve veriyi bu adreslere göre düzeltmek', 'Derleyici adresleri 0 tabanlı / mantıksal üretir', 'Örnek hesap: taban + mantıksal = fiziksel', 'Yapılmazsa yanlış bellek konumuna erişim / yanlış veri / yanlış atlama', 'Koruma hatası: trap / segmentation fault, işlem sonlandırılır'],
      lab: { label: 'Yükleyicide 14000 + 346 = 14346 hesabını gör', preset: Object.assign(BUILD('loader'), { base: 14000 }) }
    },
    {
      id: 'h3', set: 'Liste 1', lesson: 'ch2/baglayici',
      q: 'Dinamik bağlama (dynamic linking) ve statik bağlama (static linking) kavramlarını açıklayın. Günümüz işletim sistemlerinde neden dinamik bağlama tercih edilir?',
      a: `<p><b>Statik bağlama:</b> Linker, kütüphane kodunu çalıştırılabilir dosyanın <b>içine kopyalar</b>. Dosya büyür, her program kütüphanenin kendi kopyasını taşır, ama çalışma anında kütüphaneye bağımlılık yoktur.</p>
<p><b>Dinamik bağlama:</b> Kütüphane dosyaya kopyalanmaz; yalnızca bir başvuru (stub) eklenir. Kütüphane (Windows'ta <b>DLL</b>, Linux'ta <b>.so</b>) <b>yükleme veya çalışma anında</b> bağlanır.</p>
<p><b>Neden tercih edilir (slayt 2.35):</b> Kütüphaneler <b>gerektiğinde yüklenir</b> ve aynı sürümü kullanan tüm işlemler tarafından <b>paylaşılır</b>: bellekte <b>yalnızca bir kez</b> bulunur. Ayrıca:</p>
<ul><li>Çalıştırılabilir dosyalar küçük kalır, disk ve bellekte yer kazanılır.</li><li>Kütüphane güncellendiğinde (ör. güvenlik yaması) programları yeniden bağlamak gerekmez; düzeltme tüm programlara yansır.</li></ul>
<p>Dezavantajı: kütüphane eksikse veya uyumsuz bir sürümse program çalışmaz.</p>`,
      keys: ['Statik: kütüphane kodu çalıştırılabilire kopyalanır', 'Statik: büyük dosya, bağımlılık yok', 'Dinamik: yükleme/çalışma anında bağlanır (DLL/.so)', 'Bellekte tek kopya, işlemler arasında paylaşılır', 'Küçük dosya, daha az disk/bellek', 'Güncelleme yeniden bağlama gerektirmez'],
      lab: { label: 'Statik/dinamik geçişini ve dosya boyutunu karşılaştır', preset: BUILD('linker', 'static') }
    },
    {
      id: 'h4', set: 'Liste 1', lesson: 'ch2/baglayici',
      q: 'Windows\'ta kullanılan DLL dosyaları hangi avantajları sağlar? Bir örnek veriniz.',
      a: `<p><b>DLL (Dynamically Linked Library)</b>, Windows'taki dinamik bağlı kütüphanedir. Avantajları:</p>
<ul><li><b>Bellek paylaşımı:</b> Kütüphane bellekte bir kez yüklenir, onu kullanan tüm işlemler paylaşır.</li><li><b>Küçük çalıştırılabilir dosyalar:</b> Kod her .exe'ye kopyalanmaz.</li><li><b>Kolay güncelleme:</b> DLL değiştirilince onu kullanan tüm programlar yeniden derlenmeden düzeltmeyi alır.</li><li><b>Modülerlik ve isteğe bağlı yükleme:</b> Gerektiğinde yüklenir; (Ek) eklentiler <code>LoadLibrary</code> ile çalışma anında yüklenebilir.</li></ul>
<p><b>Örnek:</b> <code>kernel32.dll</code>, <code>CreateFile</code>, <code>ReadFile</code>, <code>CreateProcess</code> gibi Win32 API fonksiyonlarını içerir. Notepad, Word ve tarayıcı aynı kopyayı kullanır. <code>user32.dll</code> pencere işlemlerini sağlar.</p>`,
      keys: ['Bellekte tek kopya, işlemler arasında paylaşım', 'Daha küçük .exe dosyaları', 'Güncelleme tüm programlara yansır, yeniden derleme yok', 'Gerektiğinde yükleme / modülerlik', 'Somut örnek (kernel32.dll, user32.dll vb.)']
    },
    {
      id: 'h5', set: 'Liste 1', lesson: 'ch2/baglayici',
      q: 'Linux\'ta ldd komutu ne işe yarar ve bu komutla hangi bilgileri elde ederiz?',
      a: `<p><code>ldd</code> (list dynamic dependencies), bir çalıştırılabilir dosyanın veya paylaşılan kütüphanenin <b>hangi paylaşılan kütüphanelere (.so) ihtiyaç duyduğunu</b> listeler.</p>
<div class="formula">$ ldd /bin/ls
    linux-vdso.so.1 (0x00007ffc...)
    libselinux.so.1 => /lib/x86_64-linux-gnu/libselinux.so.1 (0x00007f...)
    libc.so.6 => /lib/x86_64-linux-gnu/libc.so.6 (0x00007f...)
    /lib64/ld-linux-x86-64.so.2 (0x00007f...)</div>
<p>Elde edilen bilgiler:</p>
<ul><li>Programın bağımlı olduğu kütüphanelerin <b>adları</b></li><li>Her birinin diskte çözümlendiği <b>yol</b> (<code>=&gt;</code> sonrası)</li><li>Belleğe <b>yüklenecekleri adres</b></li><li>Bulunamayan kütüphaneler: <code>not found</code>. "Program açılmıyor" sorunlarını teşhis etmekte kullanılır.</li><li>Statik bağlı dosyada: <code>not a dynamic executable</code></li></ul>
<p>(Ek) Güvenilmeyen dosyalarda ldd yerine <code>readelf -d</code> veya <code>objdump -p</code> kullanılır, çünkü ldd bazı durumlarda programın kodunu çalıştırabilir.</p>`,
      keys: ['Dinamik (paylaşılan) kütüphane bağımlılıklarını listeler', 'Kütüphane adları (.so)', 'Diskteki yolları', 'Yükleme adresleri', 'Eksik kütüphaneleri (not found) gösterir / sorun teşhisi', 'Statik dosyada "not a dynamic executable"']
    },
    {
      id: 'h6', set: 'Liste 1', lesson: 'ch2/abi',
      q: 'Neden bir işletim sisteminde derlenen uygulama genellikle başka bir işletim sisteminde çalışmaz?',
      a: `<p>Slayt 2.37: Her işletim sistemi kendine özgü <b>sistem çağrılarını</b> ve <b>dosya biçimlerini</b> sunar. Ayrıntılı olarak:</p>
<ul><li><b>Farklı sistem çağrıları:</b> Linux'taki <code>read()</code> çağrısının numarası ve davranışı Windows'taki <code>ReadFile()</code> ile aynı değildir.</li><li><b>Farklı çalıştırılabilir dosya biçimi:</b> Linux ELF, Windows PE, macOS Mach-O. Yükleyici yabancı biçimi tanımaz.</li><li><b>Farklı ABI:</b> Parametrelerin hangi yazmaçlarla geçirildiği, yığın düzeni, veri türü boyutları farklıdır.</li><li><b>Farklı kütüphaneler/API'ler:</b> POSIX ve Win32.</li><li>Hedef sistemin CPU <b>komut kümesi</b> farklı olabilir (x86 ve ARM).</li></ul>`,
      keys: ['Her OS\'in kendine özgü sistem çağrıları', 'Farklı dosya biçimleri (ELF / PE / Mach-O)', 'Farklı ABI', 'Farklı kütüphane/API (POSIX / Win32)', 'Farklı CPU komut kümesi olabilir']
    },
    {
      id: 'h7', set: 'Liste 1', lesson: 'ch2/abi',
      q: '"Application Binary Interface (ABI)" nedir? Bir işletim sisteminde API\'ye kıyasla neyi tanımlar?',
      a: `<p><b>ABI</b>, API'nin <b>mimari düzeyindeki karşılığıdır</b>. Belirli bir işletim sisteminde, belirli bir mimari ve CPU üzerinde <b>ikili kodun farklı bileşenlerinin nasıl arayüz kuracağını</b> tanımlar (slayt 2.37).</p>
<p><b>API</b> kaynak kodu düzeyindedir: hangi fonksiyonların hangi parametre ve dönüş türleriyle çağrılacağı.</p>
<p><b>ABI</b> ise ikili düzeydedir ve şunları tanımlar:</p>
<ul><li>Parametrelerin sistem çağrılarına ve fonksiyonlara nasıl geçirildiği (hangi yazmaçlar, hangi sırayla). Ör. x86-64 Linux'ta çağrı numarası <code>rax</code>, parametreler <code>rdi, rsi, rdx</code></li><li>Yığının düzeni</li><li>Sistem kütüphanelerinin ikili biçimi</li><li>Veri türlerinin boyutu ve hizalaması</li></ul>
<p>Sonuç: Aynı API'ye uyan <b>kaynak kodu</b> başka sistemde yeniden derlenebilir. Aynı ABI'ye uyan <b>ikili dosya</b> ise yeniden derlenmeden çalışır.</p>`,
      keys: ['ABI = API\'nin mimari/ikili düzeydeki karşılığı', 'Belirli OS + mimari + CPU için tanımlanır', 'Parametre geçişi (yazmaçlar)', 'Yığın düzeni / ikili kütüphane biçimi / veri türü boyutları', 'API kaynak kodu düzeyinde fonksiyon arayüzü', 'API uyumu → yeniden derleme, ABI uyumu → ikili doğrudan çalışır']
    },
    {
      id: 'h8', set: 'Liste 1', lesson: 'ch2/abi',
      q: 'Java veya Python gibi dillerin farklı işletim sistemlerinde çalışabilmesini sağlayan mekanizmalar nelerdir?',
      a: `<ul><li><b>Python (yorumlanan dil):</b> Program makine koduna değil, <b>yorumlayıcı</b> tarafından çalıştırılır. Yorumlayıcı birçok işletim sistemi için ayrı derlenmiştir; aynı <code>.py</code> dosyası her yorumlayıcıda çalışır.</li><li><b>Java (sanal makine):</b> Kaynak kod platformdan bağımsız <b>bytecode</b>'a derlenir. Bytecode, her işletim sistemi için yazılmış <b>Java Sanal Makinesi (JVM)</b> içinde çalışır. "Bir kez yaz, her yerde çalıştır."</li><li>Her iki durumda da işletim sistemine özgü kısım (sistem çağrıları, ABI) yorumlayıcı/JVM içinde gizlenir. Program yalnızca <b>standart API</b>'yi (Java API, Python standart kütüphanesi) görür.</li></ul>
<p>Slayttaki üçüncü yol bu dillere ait değildir: C gibi standart bir dille yazıp her işletim sisteminde ayrı derlemek.</p>`,
      keys: ['Python: yorumlayıcı her OS için mevcut', 'Java: bytecode\'a derlenir', 'JVM her OS için ayrı, bytecode\'u çalıştırır', 'OS\'e özgü ayrıntılar yorumlayıcı/VM\'de gizlenir, program standart API kullanır']
    },
    {
      id: 'h9', set: 'Liste 1', lesson: 'ch2/abi',
      q: 'Derlenmiş bir C programının Linux ve Windows üzerinde çalışabilmesi için neler yapılması gerekir?',
      a: `<p>Derlenmiş ikili dosya taşınamaz, çünkü ELF ve PE biçimleri, sistem çağrıları ve ABI farklıdır. Bu yüzden yapılması gerekenler:</p>
<ol><li>Kodu <b>standart/taşınabilir</b> yazmak: ISO C standart kütüphanesi (<code>printf</code>, <code>fopen</code>…). İşletim sistemine özgü çağrılar (POSIX <code>fork()</code> ve Win32 <code>CreateProcess()</code>) gerekiyorsa <code>#ifdef _WIN32</code> ile ayırmak veya platformlar arası bir kütüphane kullanmak.</li><li>Programı <b>her işletim sisteminde ayrı derlemek</b> (slayt 2.37): Linux'ta gcc → ELF; Windows'ta MSVC veya MinGW → PE (.exe). Ya da bir <b>çapraz derleyici</b> kullanmak.</li><li>Her sistemde gereken <b>kütüphanelerin</b> (DLL/.so) bulunmasını sağlamak veya statik bağlamak.</li><li>(Ek) Alternatif olarak uyumluluk katmanları: Windows'ta WSL, Linux'ta Wine. Bunlar sistem çağrılarını ve dosya biçimini çevirir.</li></ol>`,
      keys: ['İkili dosya doğrudan taşınamaz (ELF/PE, ABI)', 'Taşınabilir / standart C ile yazmak, OS\'e özgü kodu ayırmak (#ifdef)', 'Her OS için ayrı derlemek (gcc / MSVC-MinGW) veya çapraz derleme', 'Gereken kütüphaneleri sağlamak', 'Alternatif: uyumluluk katmanı (WSL, Wine)']
    },
    {
      id: 'h10', set: 'Liste 1', lesson: 'ch2/tasarim',
      q: '"Policy" ve "Mechanism" ayrımı neden önemlidir? Bu ayrımın sağlanmadığı bir sistemde ne tür problemler ortaya çıkabilir?',
      a: `<p><b>Policy (politika):</b> <i>Ne</i> yapılacak? Ör. "her 100 saniyede bir kesme". <b>Mechanism (mekanizma):</b> <i>Nasıl</i> yapılacak? Ör. zamanlayıcı (timer).</p>
<p><b>Neden önemli:</b> Politikalar yerden yere ve zamanla değişir. Ayrı tutulursa politika değişikliği <b>yalnızca bir parametre değişikliği</b> olur (100 → 200), mekanizmaya dokunulmaz: <b>maksimum esneklik</b> sağlanır (slayt 2.39). Aynı mekanizma farklı politikalarla kullanılabilir. Ör. aynı öncelik mekanizması etkileşimli işleri ya da CPU yoğun işleri kayıracak şekilde ayarlanabilir.</p>
<p><b>Ayrılmazsa ortaya çıkan problemler:</b></p>
<ul><li>Her politika değişikliği mekanizma kodunun (çoğunlukla çekirdeğin) değiştirilmesini, yeniden derlenmesini ve test edilmesini gerektirir.</li><li>Sistem farklı iş yüklerine veya kullanıcılara uyarlanamaz; esneklik kaybolur.</li><li>Kod değiştikçe yeni hata riski artar; bakım zorlaşır.</li><li>Aynı mekanizma başka amaçlar için yeniden kullanılamaz.</li></ul>`,
      keys: ['Policy = ne yapılacak', 'Mechanism = nasıl yapılacak', 'Timer örneği (100 → 200 saniye)', 'Ayrım esneklik sağlar: politika değişince yalnızca parametre değişir', 'Ayrılmazsa: her değişiklikte mekanizma/çekirdek kodu değişir, yeniden derleme', 'Ayrılmazsa: esneklik kaybı, hata riski, bakım zorluğu']
    },
    {
      id: 'h11', set: 'Liste 1', lesson: 'ch2/tasarim',
      q: 'İşletim sistemlerinin geliştirilmesinde kullanılan dillerin (Assembly, C, C++) farklı seviyelerde kullanılmasının nedeni nedir?',
      a: `<p>Slayt 2.40: Pratikte diller karışık kullanılır: <b>en alt seviyeler assembly</b>, <b>ana gövde C</b>, <b>sistem programları C, C++</b> ve PERL, Python, shell gibi betik diller.</p>
<ul><li><b>Assembly:</b> Donanıma doğrudan dokunan kısımlar (önyükleme kodu, kesme/trap giriş noktaları, bağlam değişiminde yazmaçları kaydetme/yükleme, ayrıcalıklı komutlar). Bunlar yüksek seviyeli dille ifade edilemez veya en yüksek verim gerekir. Bedeli: donanıma bağımlıdır, taşınamaz, yazması zordur.</li><li><b>C:</b> İşaretçilerle düşük seviyeli bellek erişimi sağlar, verimlidir; aynı zamanda yüksek seviyeli olduğu için <b>taşınabilir</b> ve okunabilirdir. Çekirdeğin büyük kısmı için idealdir.</li><li><b>C++ ve betik diller:</b> Sistem programlarında geliştirme hızı ve soyutlama daha önemlidir.</li></ul>
<p>Genel ilke: yüksek seviyeli dil başka donanıma <b>taşımayı kolaylaştırır</b> ama daha yavaş olabilir. Bu yüzden assembly yalnızca gerçekten gereken en alt katmanda tutulur.</p>`,
      keys: ['En alt seviye assembly: donanıma doğrudan erişim (boot, kesme, bağlam değişimi)', 'Assembly hızlı ama donanıma bağımlı / taşınamaz', 'Ana gövde C: verimli + taşınabilir', 'Sistem programları C/C++/betik diller: geliştirme kolaylığı', 'Yüksek seviyeli dil → kolay taşıma ama daha yavaş (ödünleşim)']
    },
    {
      id: 'h12', set: 'Liste 1', lesson: 'ch2/tasarim',
      q: 'Bir işletim sisteminin taşınabilirliği (portability) hangi etkenlerle ilişkilidir?',
      a: `<p>Taşınabilirlik, işletim sisteminin farklı bir donanıma (CPU, mimari) ne kadar kolay aktarılabileceğidir. İlişkili etkenler:</p>
<ul><li><b>Gerçekleştirme dili:</b> Ne kadar çok kod yüksek seviyeli dille (C) yazılmışsa o kadar kolay taşınır. Assembly kod her mimari için yeniden yazılmalıdır (slayt 2.40).</li><li><b>Donanıma bağımlı kodun ayrılması:</b> Mimariye özgü kısım küçük ve ayrı bir katmanda tutulursa yalnızca o kısım yeniden yazılır. (Ek) Ör. donanım soyutlama katmanı (HAL).</li><li><b>Yapı/tasarım:</b> Mikroçekirdekte çekirdek küçüktür; işletim sistemini yeni mimarilere taşımak kolaydır (slayt 2.48). Katmanlı ve modüler yapılar da donanım ayrıntılarını gizler.</li><li><b>Aygıt sürücüleri ve modüller:</b> Yeni donanım için yalnızca sürücü/modül eklemek gerekir.</li><li><b>Standart arayüzler:</b> POSIX gibi standart API'ler.</li><li><b>Emülasyon:</b> Bir işletim sistemini yerel olmayan donanımda çalıştırabilir, ama yavaştır.</li></ul>`,
      keys: ['Yüksek seviyeli dil (C) kullanımı oranı', 'Donanıma bağımlı (assembly) kodun az ve ayrı olması', 'Mikroçekirdek / katmanlı / modüler yapı taşımayı kolaylaştırır', 'Aygıt sürücüleri / modüller', 'Standart arayüzler (POSIX)', 'Emülasyon']
    },
    {
      id: 'h13', set: 'Liste 1', lesson: 'ch2/yapilar',
      q: 'Aşağıdaki yapıların temel farklarını açıklayınız ve her biri için örnek bir işletim sistemi belirtiniz: Simple Structure, Layered Structure, Microkernel Structure, Modular Structure, Hybrid Structure.',
      a: `<table class="mini-table"><tr><td><b>Simple</b></td><td>Küçük bellekte çok işlev sağlamak için yazılmıştır. <b>Modüllere bölünmez</b>, arayüzler ve işlev seviyeleri kesin ayrılmaz; uygulama programları donanıma (ROM BIOS sürücülerine) doğrudan erişebilir. Bir hata tüm sistemi çökertebilir.</td><td><b>MS-DOS</b></td></tr>
<tr><td><b>Layered</b></td><td>Sistem katmanlara ayrılır: katman 0 donanım, katman N kullanıcı arayüzü. Her katman <b>yalnızca alt katmanların</b> sağladığı işlemleri kullanır ve ayrıntılarını üst katmanlardan gizler. Hata ayıklaması kolaydır, ama katman tanımlamak zordur ve performans düşer.</td><td>(Ek) THE (Dijkstra); kavramsal model</td></tr>
<tr><td><b>Microkernel</b></td><td>Çekirdekte yalnızca en temel işlevler kalır (IPC, temel bellek ve CPU yönetimi). Dosya sistemi ve sürücüler <b>kullanıcı alanına</b> taşınır; iletişim <b>mesaj geçişiyle</b> olur. Güvenilir ve genişletilebilir, ama mesaj yükü yüzünden daha yavaştır.</td><td>Mach, QNX, MINIX 3</td></tr>
<tr><td><b>Modular</b></td><td>Temel çekirdek + gerektikçe çalışma anında yüklenen <b>çekirdek modülleri (LKM)</b>. Nesne yönelimli, arayüzlerle haberleşir. Katmanlıya benzer ama daha esnektir: modüller birbirini doğrudan çağırabilir, mesaj gerekmez.</td><td>Linux, Solaris</td></tr>
<tr><td><b>Hybrid</b></td><td>Performans, güvenlik ve kullanılabilirlik için <b>birden çok yaklaşımın birleşimi</b>.</td><td>Windows, macOS (Mach + BSD), Linux</td></tr></table>
<p>Ayrıca <b>monolitik</b> yapı: orijinal UNIX. Sistem çağrısı arayüzü ile donanım arasındaki her şey tek çekirdektedir.</p>`,
      keys: ['Simple: modül yok, seviyeler ayrılmamış — MS-DOS', 'Layered: katman 0 donanım … N arayüz, yalnızca alt katmanı kullanır', 'Microkernel: minimum çekirdek, servisler kullanıcı alanında, mesaj geçişi — Mach/QNX', 'Modular: LKM, çalışma anında yükleme — Linux/Solaris', 'Hybrid: yaklaşımların birleşimi — Windows/macOS'],
      lab: { label: 'Monolitik ve mikroçekirdek akışını karşılaştır', preset: { module: 'system', lab: 'arch', action: 'request' } }
    },
    {
      id: 'h14', set: 'Liste 1', lesson: 'ch2/yapilar',
      q: 'Mikro çekirdek mimarisinin avantajları ve dezavantajlarını tartışın.',
      a: `<p>Mikroçekirdekte çekirdeğe yalnızca en önemli işlevler kalır; diğer servisler <b>kullanıcı alanına</b> taşınır ve <b>mesaj geçişiyle</b> iletişim kurar.</p>
<p><b>Avantajlar (slayt 2.48):</b></p>
<ul><li>İşletim sistemini <b>yeni mimarilere taşımak</b> kolaydır (çekirdek küçük).</li><li>Mikroçekirdeği <b>genişletmek</b> kolaydır: yeni servis kullanıcı alanına eklenir, çekirdek değişmez.</li><li><b>Daha güvenilir ve güvenli:</b> Çekirdek modunda daha az kod çalışır. Bir servis (ör. disk sürücüsü) çökerse yalnızca o kullanıcı işlemi çöker ve yeniden başlatılabilir; sistemin geri kalanı çalışır.</li></ul>
<p><b>Dezavantaj:</b> Kullanıcı alanı ile çekirdek alanı arasındaki iletişimin <b>performans yükü</b>. Her istek birden çok mesaj, mesaj kopyalama ve işlem/mod geçişi gerektirir. Monolitikte aynı iş doğrudan fonksiyon çağrılarıyla yapılır. (Ek) Windows NT'nin ilk sürümü bu yüzden yavaştı.</p>`,
      keys: ['Tanım: minimum çekirdek, servisler kullanıcı alanında, mesaj geçişi', 'Yeni mimarilere taşıma kolay', 'Genişletme kolay', 'Güvenilirlik/güvenlik: daha az kod çekirdek modunda, servis çökse sistem çalışır', 'Dezavantaj: mesaj geçişi ve mod geçişlerinin performans yükü'],
      lab: { label: 'Sürücü çökmesini iki mimaride izle', preset: { module: 'system', lab: 'arch', action: 'crash' } }
    },
    {
      id: 'h15', set: 'Liste 1', lesson: 'ch2/yapilar',
      q: 'Linux çekirdeği neden "monolithic + modular" olarak tanımlanır?',
      a: `<ul><li><b>Monolitik:</b> Dosya sistemleri, CPU zamanlayıcı, bellek yöneticisi, ağ (TCP/IP), aygıt sürücüleri gibi çekirdek işlevlerinin tamamı <b>tek bir adres alanında, çekirdek modunda</b> çalışır. Bileşenler birbirini doğrudan fonksiyon çağrısıyla kullanır. Bu, sistem çağrısı arayüzünde ve çekirdek içi iletişimde ek yükü azaltır; bu yüzden hızlıdır (slayt 2.47).</li><li><b>Modüler:</b> Linux <b>yüklenebilir çekirdek modüllerini (LKM)</b> destekler. Aygıt sürücüleri ve dosya sistemleri gibi işlevler, çekirdeği yeniden derlemeden ve sistemi yeniden başlatmadan <b>çalışma anında yüklenip kaldırılabilir</b> (slayt 2.50, 2.51). (Ek) <code>insmod</code>, <code>rmmod</code>, <code>modprobe</code>.</li></ul>
<p>Yani monolitik yapının performansı ile modüler yapının esnekliği birleştirilmiştir. Bu da Linux'u bir <b>hibrit</b> örnek yapar.</p>`,
      keys: ['Tüm çekirdek işlevleri tek adres alanında, çekirdek modunda', 'Doğrudan fonksiyon çağrıları → yüksek performans', 'Yüklenebilir çekirdek modülleri (LKM)', 'Modüller çalışma anında yüklenip kaldırılabilir, yeniden derleme yok', 'Performans + esneklik birleşimi']
    },
    {
      id: 'h16', set: 'Liste 1', lesson: 'ch2/yapilar',
      q: 'Apple macOS veya Windows mimarisi hangi yapı türlerine örnektir?',
      a: `<p>İkisi de <b>hibrit</b> sistemlerdir (slayt 2.51).</p>
<ul><li><b>macOS (ve iOS):</b> Hibrit ve <b>katmanlı</b>. Katmanlar: uygulamalar → kullanıcı deneyimi → uygulama çerçeveleri → çekirdek çerçeveleri → çekirdek ortamı (<b>Darwin</b>). Darwin, <b>Mach mikroçekirdeği</b> (zamanlama, IPC, bellek yönetimi, Mach trap'leri) ile <b>BSD UNIX</b>'i (POSIX sistem çağrıları) birleştirir. Ayrıca <b>iokit</b> ve yüklenebilir <b>çekirdek uzantıları (kexts)</b> ile modüler özellik taşır.</li><li><b>Windows:</b> Büyük ölçüde <b>monolitik</b> (performans için çekirdek tek adres alanında). Farklı alt sistemler (kişilikler) için <b>mikroçekirdek özellikleri</b> taşır; bu alt sistemler kullanıcı modunda çalışır. Ayrıca dinamik yüklenen sürücüler/modüller vardır.</li></ul>`,
      keys: ['İkisi de hibrit', 'macOS: katmanlı (uygulama → … → Darwin)', 'Darwin = Mach mikroçekirdeği + BSD UNIX', 'macOS: kexts/iokit ile modüler', 'Windows: çoğunlukla monolitik + alt sistemler için mikroçekirdek özellikleri']
    },
    {
      id: 'h17', set: 'Liste 1', lesson: 'ch2/yapilar',
      q: 'Katmanlı yapı (layered approach) işletim sistemine hangi tasarım avantajlarını sağlar?',
      a: `<p>Katmanlı yaklaşımda katman 0 donanım, katman N kullanıcı arayüzüdür; her katman yalnızca alt katmanların sağladığı işlemleri kullanır (slayt 2.44).</p>
<ul><li><b>İnşa ve hata ayıklama kolaylığı:</b> İlk katman yalnızca donanımı kullanır ve önce o test edilir. Sonra bir üst katman eklenir; hata çıkarsa altındakiler doğrulandığı için hata o katmandadır. Sistem katman katman doğrulanır.</li><li><b>Soyutlama / bilgi gizleme:</b> Bir katmanın, alttaki işlemlerin <i>nasıl</i> yapıldığını bilmesi gerekmez. Her katman veri yapılarını, işlemlerini ve donanımı üst katmanlardan gizler.</li><li><b>Modülerlik ve bakım:</b> Bir katmanın gerçekleştirmesi, arayüzü korunduğu sürece diğerlerini etkilemeden değiştirilebilir.</li><li><b>Taşınabilirlik:</b> Donanıma bağımlı kısım alt katmanlarda toplanır.</li></ul>
<p>Bedeli: Katmanları doğru tanımlamak zordur (her katman yalnızca alttakini kullanabilir) ve bir isteğin birçok katmandan geçmesi <b>performansı düşürür</b>.</p>`,
      keys: ['Katman 0 donanım … N kullanıcı arayüzü, her katman yalnızca alttakini kullanır', 'Kolay hata ayıklama / doğrulama: katman katman test', 'Soyutlama / bilgi gizleme', 'Modülerlik: bir katman diğerlerini etkilemeden değişebilir', 'Dezavantaj: katman tanımlamak zor, performans kaybı']
    },
    {
      id: 'h18', set: 'Liste 1', lesson: 'ch2/debug',
      q: 'Bir işletim sistemi neden "log" dosyaları üretir?',
      a: `<p>Slayt 2.62: İşletim sistemi <b>hata bilgisi içeren log dosyaları</b> üretir. Amaçları:</p>
<ul><li><b>Hata ayıklama (debugging):</b> Bir hata veya çökme sonrasında ne olduğunu sonradan incelemek. Hata anında sistem geliştiriciyi bekleyemez; bilgi kaydedilir.</li><li><b>Arıza analizi:</b> Hatanın sırasını ve nedenini (hangi işlem, hangi sürücü, ne zaman) bulmak. Core dump ve crash dump ile birlikte kullanılır.</li><li><b>Performans ayarlama:</b> Olayların kaydı (trace listings) analiz edilerek darboğazlar bulunur.</li><li>(Ek) <b>Güvenlik ve denetim:</b> Giriş denemeleri, yetki kullanımı gibi olayların izlenmesi.</li><li>(Ek) <b>Hesap tutma (accounting):</b> Kaynak kullanım istatistikleri.</li></ul>`,
      keys: ['Hata bilgisini kaydetmek', 'Sonradan hata ayıklama / arıza analizi', 'Olayların sırasını ve nedenini bulmak', 'Performans analizi', 'Güvenlik / denetim kaydı']
    },
    {
      id: 'h19', set: 'Liste 1', lesson: 'ch2/debug',
      q: 'Core dump ve crash dump kavramlarını açıklayın. Aralarındaki fark nedir?',
      a: `<ul><li><b>Core dump:</b> Bir <b>uygulamanın (kullanıcı işleminin)</b> hatası sonucu üretilen ve <b>işlemin belleğini</b> yakalayan dosyadır (slayt 2.62). Programcı daha sonra bir hata ayıklayıcıyla (gdb) hatanın anındaki durumu inceler.</li><li><b>Crash dump:</b> <b>İşletim sisteminin</b> hatası (çekirdek çökmesi, crash) sonucu üretilen ve <b>çekirdek belleğini</b> içeren dosyadır.</li></ul>
<p><b>Fark:</b> Kimin çöktüğü (kullanıcı işlemi ve çekirdek) ve hangi belleğin kaydedildiği (işlemin belleği ve çekirdek belleği). Core dump'ta sistem çalışmaya devam eder, yalnızca işlem sonlanır. Crash dump'ta tüm sistem durur ve yeniden başlatılmalıdır.</p>
<p>(Ek) Çekirdek çöktüğünde dosya sistemi kodunun kendisi bozulmuş olabilir. Bu yüzden crash dump diskin <b>dosya sistemi içermeyen ayrılmış bir alanına</b> yazılır, yeniden başlatmada dosyaya dönüştürülür.</p>`,
      keys: ['Core dump: kullanıcı işleminin/uygulamanın hatası', 'Core dump: işlemin belleği kaydedilir', 'Crash dump: işletim sistemi/çekirdek hatası', 'Crash dump: çekirdek belleği kaydedilir', 'Core dump\'ta sistem çalışmaya devam eder, crash dump\'ta sistem durur', 'Crash dump ayrılmış disk alanına yazılır (Ek)'],
      lab: { label: 'Core dump (ayrıcalıklı komut) ve crash dump (kernel panic) senaryoları', preset: { module: 'system', lab: 'mode', illegal: true } }
    },
    {
      id: 'h20', set: 'Liste 1', lesson: 'ch2/debug',
      q: 'Performans izleme (performance tuning) neden gereklidir? Linux\'ta kullanılan araçlara örnek veriniz (top, perf, strace, tcpdump, bcc).',
      a: `<p><b>Neden gerekli:</b> Sistem çalışıyor olsa bile yavaş olabilir. Performans ayarlamanın amacı <b>darboğazları (bottlenecks) bulup kaldırarak</b> performansı artırmaktır. Bunun için işletim sistemi sistem davranışının ölçümlerini hesaplayan ve gösteren araçlar sağlamalıdır (slayt 2.63). Yöntemler: etkinliklerin kaydı (trace listings) ve <b>profiling</b> (komut göstericisinin periyodik örneklenmesi).</p>
<table class="mini-table"><tr><td><code>top</code></td><td>İşlemlerin CPU ve bellek kullanımını gerçek zamanlı gösterir (Windows'ta Görev Yöneticisi)</td></tr>
<tr><td><code>perf</code></td><td>Linux performans araçları koleksiyonu: profiling, donanım sayaçları</td></tr>
<tr><td><code>strace</code></td><td>Bir işlemin çağırdığı sistem çağrılarını izler</td></tr>
<tr><td><code>tcpdump</code></td><td>Ağ paketlerini toplar</td></tr>
<tr><td><code>bcc</code></td><td>BPF Compiler Collection: kullanıcı ve çekirdek kodunu birlikte izleyen araçlar. Ör. <code>disksnoop.py</code> disk G/Ç'sini, <code>opensnoop</code> dosya açılışlarını, <code>execsnoop</code> yeni işlemleri izler</td></tr>
<tr><td><code>gdb</code></td><td>Kaynak kodu düzeyinde hata ayıklayıcı</td></tr></table>`,
      keys: ['Amaç: darboğazları bulup kaldırmak', 'OS ölçüm araçları sağlamalı', 'top: gerçek zamanlı CPU/bellek kullanımı', 'perf: performans/profiling', 'strace: sistem çağrısı izleme', 'tcpdump: ağ paketleri', 'bcc: BPF tabanlı çekirdek+kullanıcı izleme (disksnoop vb.)']
    },
    {
      id: 'h21', set: 'Liste 1', lesson: 'ch2/debug',
      q: 'Kernighan\'s Law ifadesi neyi anlatır ve yazılım geliştirmede neden önemlidir?',
      a: `<p><b>Kernighan Yasası:</b> "Hata ayıklamak, kodu ilk baştan yazmaktan <b>iki kat daha zordur</b>. Bu nedenle kodu olabildiğince zekice yazarsanız, tanım gereği onu ayıklayacak kadar zeki değilsinizdir." (slayt 2.62)</p>
<p><b>Anlatmak istediği:</b> Aşırı karmaşık, "akıllıca" kod yazmak, hataları bulmayı yazan kişinin yeteneğinin ötesine taşır.</p>
<p><b>Neden önemli:</b></p>
<ul><li><b>Basit, okunabilir ve anlaşılır</b> kod yazmayı teşvik eder.</li><li>Bakım ve hata ayıklama maliyetini düşürür.</li><li>İşletim sistemlerinde özellikle kritiktir: çekirdek hatası tüm sistemi çökertir (crash), çekirdek hata ayıklaması zordur ve eşzamanlılık hataları tekrar üretilmesi zor hatalardır.</li></ul>`,
      keys: ['Alıntı: hata ayıklamak yazmaktan iki kat zor', 'Zekice yazılan kodu ayıklayacak kadar zeki olunmaz', 'Sonuç: basit, okunabilir kod yaz', 'Bakım/hata ayıklama maliyeti düşer', 'İşletim sistemlerinde kritik (çekirdek hatası tüm sistemi etkiler)']
    },
    {
      id: 'h22', set: 'Liste 1', lesson: 'ch2/debug',
      q: 'Modern işletim sistemlerinde izleme (tracing) araçları hangi durumlarda kullanılır?',
      a: `<p><b>Tracing</b>, belirli bir olay için veri toplar; örneğin bir sistem çağrısı çağrısındaki adımlar (slayt 2.64). Kullanıldığı durumlar:</p>
<ul><li><b>Bir programın işletim sistemiyle etkileşimini anlamak:</b> Hangi sistem çağrılarını yaptığı, hangisinin hata döndürdüğü (<code>strace</code>). Ör. "dosya bulunamadı" hatasının hangi yolu aradığını bulmak.</li><li><b>Kullanıcı ve çekirdek kodu arasındaki etkileşimlerde hata ayıklama:</b> Bu, her ikisini anlayan bir araç seti olmadan neredeyse imkansızdır (slayt 2.65: BCC, DTrace).</li><li><b>Performans sorunları:</b> Disk G/Ç gecikmesi (<code>disksnoop</code>, <code>biolatency</code>), zamanlayıcı gecikmesi, yavaş dosya sistemi işlemleri.</li><li><b>Ağ sorunları:</b> Paketleri yakalamak (<code>tcpdump</code>), TCP bağlantılarını izlemek (<code>tcpconnect</code>).</li><li>(Ek) <b>Çalışan üretim sistemlerinde</b> düşük ek yükle, sistemi durdurmadan sorun teşhisi (BPF/DTrace).</li></ul>`,
      keys: ['Tanım: belirli bir olay için veri toplama (ör. sistem çağrısı adımları)', 'Sistem çağrılarını izleme (strace)', 'Kullanıcı–çekirdek etkileşiminde hata ayıklama (BCC/DTrace)', 'Performans sorunları (disk G/Ç gecikmesi vb.)', 'Ağ sorunları (tcpdump)']
    },
    {
      id: 'h23', set: 'Liste 1', lesson: 'ch2/boot',
      q: '"Bootstrap Loader" ne işe yarar? BIOS ve UEFI arasındaki farkları açıklayın.',
      a: `<p><b>Bootstrap loader:</b> Güç verildiğinde yürütme sabit bir bellek konumunda başlar. Orada <b>ROM veya EEPROM'da</b> saklanan küçük bir kod parçası olan bootstrap loader bulunur. Görevi <b>çekirdeği bulmak, belleğe yüklemek ve başlatmaktır</b> (slayt 2.61). Bazen süreç iki adımlıdır: ROM kodu sabit konumdaki <b>boot block</b>'u yükler, o da diskten asıl önyükleyiciyi (ör. GRUB) yükler.</p>
<table class="mini-table"><tr><td></td><td><b>BIOS</b></td><td><b>UEFI</b></td></tr>
<tr><td>Konum</td><td>Eski firmware, ROM/EEPROM</td><td>BIOS'un modern yerine geçeni</td></tr>
<tr><td>Önyükleme</td><td>Diskin ilk sektöründeki boot block'u (MBR, 512 bayt) yükler, o da sonraki aşamayı yükler</td><td>(Ek) Kendi önyükleme yöneticisi vardır; EFI sistem bölümündeki önyükleyici dosyasını doğrudan yükler</td></tr>
<tr><td>Disk</td><td>(Ek) MBR bölümleme: en fazla 2 TB, 4 birincil bölüm</td><td>(Ek) GPT: çok büyük diskler, çok sayıda bölüm</td></tr>
<tr><td>Diğer</td><td>(Ek) 16-bit gerçek mod, sınırlı</td><td>(Ek) 32/64-bit, daha hızlı açılış, <b>Secure Boot</b> (imzasız önyükleyiciyi reddeder), ağdan önyükleme</td></tr></table>`,
      keys: ['Güç verilince sabit adreste çalışır, ROM/EEPROM\'da (firmware)', 'Çekirdeği bulur, belleğe yükler, başlatır', 'İki adımlı olabilir: boot block → önyükleyici', 'BIOS: eski, MBR boot block, sınırlı', 'UEFI: modern yerine geçen; GPT, Secure Boot, hızlı']
    },
    {
      id: 'h24', set: 'Liste 1', lesson: 'ch2/boot',
      q: 'İşletim sistemi kaynak kodunun derlenmesi, yapılandırılması ve yüklenmesi sürecinde hangi aşamalar izlenir? (örnek: Linux kernel build süreci)',
      a: `<p><b>Genel aşamalar (slayt 2.59):</b> (1) İşletim sistemi kaynak kodunu yaz/edin → (2) çalışacağı sistem için <b>yapılandır</b> → (3) <b>derle</b> → (4) <b>kur</b> → (5) bilgisayarı yeni işletim sistemiyle <b>önyükle</b>.</p>
<p><b>Linux örneği (slayt 2.60):</b></p>
<div class="formula">1. Kaynak kodu indir      http://www.kernel.org
2. Yapılandır            make menuconfig   (.config dosyası: hangi özellik/sürücü)
3. Derle                 make              → vmlinuz (çekirdek imajı)
4. Modülleri derle       make modules
5. Modülleri kur         make modules_install
6. Çekirdeği kur         make install      (/boot'a kopyalar, önyükleyiciyi günceller)
7. Yeniden başlat        GRUB'dan yeni çekirdeği seç</div>`,
      keys: ['Genel: kaynak → yapılandır → derle → kur → önyükle', 'Kaynağı kernel.org\'dan indir', 'make menuconfig ile yapılandırma', 'make → vmlinuz', 'make modules / make modules_install', 'make install', 'Yeniden başlatıp yeni çekirdekle önyükleme']
    },
    {
      id: 'h25', set: 'Liste 1', lesson: 'ch2/boot',
      q: 'GRUB (GNU GRand Unified Bootloader) ne işe yarar ve neden çok çekirdekli sistemlerde kullanışlıdır?',
      a: `<p><b>GRUB</b>, yaygın bir bootstrap loader'dır (önyükleyici). Firmware'den (BIOS/UEFI) sonra çalışır, seçilen çekirdeği belleğe yükler ve başlatır. Slayt 2.61'e göre <b>birden çok diskten, sürümden ve çekirdek seçeneğiyle çekirdek seçmeye</b> izin verir. Ayrıca <b>tek kullanıcı modu</b> (single user mode) gibi farklı başlatma durumlarını destekler.</p>
<p><b>Dikkat:</b> Buradaki "çok çekirdekli" ifadesi çok çekirdekli <i>işlemci</i> (multicore) anlamında değil, sistemde <b>birden fazla işletim sistemi çekirdeği (kernel) bulunması</b> anlamındadır. GRUB'un işlemci çekirdek sayısıyla ilgisi yoktur.</p>
<p><b>Neden kullanışlı:</b></p>
<ul><li>Birden çok <b>çekirdek sürümü</b> kurulu olabilir. Yeni çekirdek açılmazsa menüden <b>eski çekirdek seçilerek</b> sistem kurtarılır.</li><li>Farklı <b>işletim sistemleri</b> arasında seçim yapılabilir (dual boot: Linux ve Windows).</li><li><b>Çekirdek seçenekleri/parametreleri</b> açılışta değiştirilebilir; kurtarma ve tek kullanıcı modu sağlanır.</li></ul>`,
      keys: ['GRUB bir önyükleyici (bootstrap loader); çekirdeği yükleyip başlatır', 'Birden çok disk/sürüm/çekirdek seçeneği arasından seçim', 'Single user mode gibi başlatma durumları', '"Çok çekirdekli" = birden çok kernel (multicore CPU değil)', 'Eski çekirdeğe dönüş / dual boot / çekirdek parametreleri']
    },
    {
      id: 'h26', set: 'Liste 1', lesson: 'ch2/boot',
      q: 'vmlinuz dosyası Linux sistemlerinde neyi temsil eder?',
      a: `<p><code>vmlinuz</code>, <b>Linux çekirdek imajıdır</b>. Çekirdek kaynak kodu <code>make</code> ile derlendiğinde üretilir (slayt 2.60) ve önyükleyicinin (GRUB) belleğe yükleyip başlattığı çalıştırılabilir çekirdektir.</p>
<ul><li>(Ek) Genellikle <code>/boot/vmlinuz-&lt;sürüm&gt;</code> yolunda bulunur; sistemde birden çok sürüm olabilir.</li><li>(Ek) Adı: "vm" <b>sanal bellek</b> desteğini, sondaki "z" ise imajın <b>sıkıştırılmış</b> olduğunu belirtir. Önyüklemede kendi kendini açar.</li><li>Çekirdek modülleri (<code>make modules_install</code>) ayrı dosyalardır ve gerektiğinde bu çekirdeğe yüklenir.</li></ul>`,
      keys: ['Linux çekirdek imajı', 'make ile derleme sonucu üretilir', 'Önyükleyicinin yüklediği çalıştırılabilir çekirdek', '/boot altında, sürüm adıyla (Ek)', 'z = sıkıştırılmış, vm = sanal bellek (Ek)']
    }
  ];
})(window.OSLab = window.OSLab || {});
