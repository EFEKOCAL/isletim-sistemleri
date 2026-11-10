/*
 * teacher-questions.js — Hocanın paylaştığı sınav soruları.
 *
 * YENİ SORU EKLEMEK İÇİN listenin sonuna şu biçimde bir nesne ekleyin:
 *   {
 *     id: 'h27',                       // benzersiz kimlik (ilerleme kaydı buna bağlı, değiştirmeyin)
 *     set: 'Liste 2',                  // hangi duyurudan geldiği
 *     lesson: 'ch3/olusturma',         // ilgili ders: '<bölüm>/<ders id>'
 *     focus: 'fork|exec',              // isteğe bağlı: dersin hangi kartlarında uyarı çıksın (düzenli ifade)
 *     focusH: 'Başlık',                // isteğe bağlı: yalnızca bu başlıklı kartlarda uyarı çıksın
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
      id: 'h1', set: 'Liste 1', lesson: 'ch2/baglayici', focus: 'linker|loader|bağlayıcı|yükleyici',
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
      id: 'h2', set: 'Liste 1', lesson: 'ch2/baglayici', focus: 'relocation|yeniden konumlandır',
      q: 'Relocation işlemi neyi ifade eder? Bu işlem yapılmazsa ne tür bir hata oluşur?',
      a: `<p><b>Relocation:</b> Program parçalarına <b>son (fiziksel) adresleri atamak</b> ve programdaki kodu ve veriyi bu adreslere uyacak şekilde <b>düzeltmektir</b>. Derleyici adresleri 0'dan başlıyormuş gibi üretir. Program belleğe başka bir tabana yüklendiğinde, ör. taban 14000 ise mantıksal 346 → fiziksel 14346 olmalıdır.</p>
<p><b>Yapılmazsa:</b> Program, adreslerinin 0'dan başladığını varsayarak çalışır. Değişkenlere ve fonksiyonlara yaptığı başvurular yanlış fiziksel konumlara gider:</p>
<ul><li>Yanlış veri okunur veya yazılır; atlamalar (jump/call) yanlış koda gider ve program çöker.</li><li>İşletim sisteminin veya başka bir işlemin belleğine erişmeye çalışır. Koruma (base/limit, MMU) varsa <b>adresleme hatası / trap</b> oluşur ve işlem sonlandırılır (Linux'ta <b>segmentation fault</b>).</li><li>Program yalnızca derlendiği adrese yüklenebilir hale gelir; birden çok program aynı yeri isteyemez.</li></ul>`,
      keys: ['Tanım: son adresleri atamak', 'Kod ve veriyi bu adreslere göre düzeltmek', 'Derleyici adresleri 0 tabanlı / mantıksal üretir', 'Örnek hesap: taban + mantıksal = fiziksel', 'Yapılmazsa yanlış bellek konumuna erişim / yanlış veri / yanlış atlama', 'Koruma hatası: trap / segmentation fault, işlem sonlandırılır'],
      lab: { label: 'Yükleyicide 14000 + 346 = 14346 hesabını gör', preset: Object.assign(BUILD('loader'), { base: 14000 }) }
    },
    {
      id: 'h3', set: 'Liste 1', lesson: 'ch2/baglayici', focus: 'dinamik bağla|statik bağla|dynamic link|static link',
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
      id: 'h4', set: 'Liste 1', lesson: 'ch2/baglayici', focus: 'DLL',
      q: 'Windows\'ta kullanılan DLL dosyaları hangi avantajları sağlar? Bir örnek veriniz.',
      a: `<p><b>DLL (Dynamically Linked Library)</b>, Windows'taki dinamik bağlı kütüphanedir. Avantajları:</p>
<ul><li><b>Bellek paylaşımı:</b> Kütüphane bellekte bir kez yüklenir, onu kullanan tüm işlemler paylaşır.</li><li><b>Küçük çalıştırılabilir dosyalar:</b> Kod her .exe'ye kopyalanmaz.</li><li><b>Kolay güncelleme:</b> DLL değiştirilince onu kullanan tüm programlar yeniden derlenmeden düzeltmeyi alır.</li><li><b>Modülerlik ve isteğe bağlı yükleme:</b> Gerektiğinde yüklenir; (Ek) eklentiler <code>LoadLibrary</code> ile çalışma anında yüklenebilir.</li></ul>
<p><b>Örnek:</b> <code>kernel32.dll</code>, <code>CreateFile</code>, <code>ReadFile</code>, <code>CreateProcess</code> gibi Win32 API fonksiyonlarını içerir. Notepad, Word ve tarayıcı aynı kopyayı kullanır. <code>user32.dll</code> pencere işlemlerini sağlar.</p>`,
      keys: ['Bellekte tek kopya, işlemler arasında paylaşım', 'Daha küçük .exe dosyaları', 'Güncelleme tüm programlara yansır, yeniden derleme yok', 'Gerektiğinde yükleme / modülerlik', 'Somut örnek (kernel32.dll, user32.dll vb.)']
    },
    {
      id: 'h5', set: 'Liste 1', lesson: 'ch2/baglayici', focus: 'ldd',
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
      id: 'h6', set: 'Liste 1', lesson: 'ch2/abi', focus: 'ABI|başka bir işletim sistem|farklı işletim sistem',
      q: 'Neden bir işletim sisteminde derlenen uygulama genellikle başka bir işletim sisteminde çalışmaz?',
      a: `<p>Slayt 2.37: Her işletim sistemi kendine özgü <b>sistem çağrılarını</b> ve <b>dosya biçimlerini</b> sunar. Ayrıntılı olarak:</p>
<ul><li><b>Farklı sistem çağrıları:</b> Linux'taki <code>read()</code> çağrısının numarası ve davranışı Windows'taki <code>ReadFile()</code> ile aynı değildir.</li><li><b>Farklı çalıştırılabilir dosya biçimi:</b> Linux ELF, Windows PE, macOS Mach-O. Yükleyici yabancı biçimi tanımaz.</li><li><b>Farklı ABI:</b> Parametrelerin hangi yazmaçlarla geçirildiği, yığın düzeni, veri türü boyutları farklıdır.</li><li><b>Farklı kütüphaneler/API'ler:</b> POSIX ve Win32.</li><li>Hedef sistemin CPU <b>komut kümesi</b> farklı olabilir (x86 ve ARM).</li></ul>`,
      keys: ['Her OS\'in kendine özgü sistem çağrıları', 'Farklı dosya biçimleri (ELF / PE / Mach-O)', 'Farklı ABI', 'Farklı kütüphane/API (POSIX / Win32)', 'Farklı CPU komut kümesi olabilir']
    },
    {
      id: 'h7', set: 'Liste 1', lesson: 'ch2/abi', focus: 'ABI',
      q: '"Application Binary Interface (ABI)" nedir? Bir işletim sisteminde API\'ye kıyasla neyi tanımlar?',
      a: `<p><b>ABI</b>, API'nin <b>mimari düzeyindeki karşılığıdır</b>. Belirli bir işletim sisteminde, belirli bir mimari ve CPU üzerinde <b>ikili kodun farklı bileşenlerinin nasıl arayüz kuracağını</b> tanımlar (slayt 2.37).</p>
<p><b>API</b> kaynak kodu düzeyindedir: hangi fonksiyonların hangi parametre ve dönüş türleriyle çağrılacağı.</p>
<p><b>ABI</b> ise ikili düzeydedir ve şunları tanımlar:</p>
<ul><li>Parametrelerin sistem çağrılarına ve fonksiyonlara nasıl geçirildiği (hangi yazmaçlar, hangi sırayla). Ör. x86-64 Linux'ta çağrı numarası <code>rax</code>, parametreler <code>rdi, rsi, rdx</code></li><li>Yığının düzeni</li><li>Sistem kütüphanelerinin ikili biçimi</li><li>Veri türlerinin boyutu ve hizalaması</li></ul>
<p>Sonuç: Aynı API'ye uyan <b>kaynak kodu</b> başka sistemde yeniden derlenebilir. Aynı ABI'ye uyan <b>ikili dosya</b> ise yeniden derlenmeden çalışır.</p>`,
      keys: ['ABI = API\'nin mimari/ikili düzeydeki karşılığı', 'Belirli OS + mimari + CPU için tanımlanır', 'Parametre geçişi (yazmaçlar)', 'Yığın düzeni / ikili kütüphane biçimi / veri türü boyutları', 'API kaynak kodu düzeyinde fonksiyon arayüzü', 'API uyumu → yeniden derleme, ABI uyumu → ikili doğrudan çalışır']
    },
    {
      id: 'h8', set: 'Liste 1', lesson: 'ch2/abi', focus: 'Java|Python|yorumlay|JVM|sanal makine',
      q: 'Java veya Python gibi dillerin farklı işletim sistemlerinde çalışabilmesini sağlayan mekanizmalar nelerdir?',
      a: `<ul><li><b>Python (yorumlanan dil):</b> Program makine koduna değil, <b>yorumlayıcı</b> tarafından çalıştırılır. Yorumlayıcı birçok işletim sistemi için ayrı derlenmiştir; aynı <code>.py</code> dosyası her yorumlayıcıda çalışır.</li><li><b>Java (sanal makine):</b> Kaynak kod platformdan bağımsız <b>bytecode</b>'a derlenir. Bytecode, her işletim sistemi için yazılmış <b>Java Sanal Makinesi (JVM)</b> içinde çalışır. "Bir kez yaz, her yerde çalıştır."</li><li>Her iki durumda da işletim sistemine özgü kısım (sistem çağrıları, ABI) yorumlayıcı/JVM içinde gizlenir. Program yalnızca <b>standart API</b>'yi (Java API, Python standart kütüphanesi) görür.</li></ul>
<p>Slayttaki üçüncü yol bu dillere ait değildir: C gibi standart bir dille yazıp her işletim sisteminde ayrı derlemek.</p>`,
      keys: ['Python: yorumlayıcı her OS için mevcut', 'Java: bytecode\'a derlenir', 'JVM her OS için ayrı, bytecode\'u çalıştırır', 'OS\'e özgü ayrıntılar yorumlayıcı/VM\'de gizlenir, program standart API kullanır']
    },
    {
      id: 'h9', set: 'Liste 1', lesson: 'ch2/abi', focus: 'ABI|yeniden derle|çok platformlu',
      q: 'Derlenmiş bir C programının Linux ve Windows üzerinde çalışabilmesi için neler yapılması gerekir?',
      a: `<p>Derlenmiş ikili dosya taşınamaz, çünkü ELF ve PE biçimleri, sistem çağrıları ve ABI farklıdır. Bu yüzden yapılması gerekenler:</p>
<ol><li>Kodu <b>standart/taşınabilir</b> yazmak: ISO C standart kütüphanesi (<code>printf</code>, <code>fopen</code>…). İşletim sistemine özgü çağrılar (POSIX <code>fork()</code> ve Win32 <code>CreateProcess()</code>) gerekiyorsa <code>#ifdef _WIN32</code> ile ayırmak veya platformlar arası bir kütüphane kullanmak.</li><li>Programı <b>her işletim sisteminde ayrı derlemek</b> (slayt 2.37): Linux'ta gcc → ELF; Windows'ta MSVC veya MinGW → PE (.exe). Ya da bir <b>çapraz derleyici</b> kullanmak.</li><li>Her sistemde gereken <b>kütüphanelerin</b> (DLL/.so) bulunmasını sağlamak veya statik bağlamak.</li><li>(Ek) Alternatif olarak uyumluluk katmanları: Windows'ta WSL, Linux'ta Wine. Bunlar sistem çağrılarını ve dosya biçimini çevirir.</li></ol>`,
      keys: ['İkili dosya doğrudan taşınamaz (ELF/PE, ABI)', 'Taşınabilir / standart C ile yazmak, OS\'e özgü kodu ayırmak (#ifdef)', 'Her OS için ayrı derlemek (gcc / MSVC-MinGW) veya çapraz derleme', 'Gereken kütüphaneleri sağlamak', 'Alternatif: uyumluluk katmanı (WSL, Wine)']
    },
    {
      id: 'h10', set: 'Liste 1', lesson: 'ch2/tasarim', focus: 'policy|mechanism',
      q: '"Policy" ve "Mechanism" ayrımı neden önemlidir? Bu ayrımın sağlanmadığı bir sistemde ne tür problemler ortaya çıkabilir?',
      a: `<p><b>Policy (politika):</b> <i>Ne</i> yapılacak? Ör. "her 100 saniyede bir kesme". <b>Mechanism (mekanizma):</b> <i>Nasıl</i> yapılacak? Ör. zamanlayıcı (timer).</p>
<p><b>Neden önemli:</b> Politikalar yerden yere ve zamanla değişir. Ayrı tutulursa politika değişikliği <b>yalnızca bir parametre değişikliği</b> olur (100 → 200), mekanizmaya dokunulmaz: <b>maksimum esneklik</b> sağlanır (slayt 2.39). Aynı mekanizma farklı politikalarla kullanılabilir. Ör. aynı öncelik mekanizması etkileşimli işleri ya da CPU yoğun işleri kayıracak şekilde ayarlanabilir.</p>
<p><b>Ayrılmazsa ortaya çıkan problemler:</b></p>
<ul><li>Her politika değişikliği mekanizma kodunun (çoğunlukla çekirdeğin) değiştirilmesini, yeniden derlenmesini ve test edilmesini gerektirir.</li><li>Sistem farklı iş yüklerine veya kullanıcılara uyarlanamaz; esneklik kaybolur.</li><li>Kod değiştikçe yeni hata riski artar; bakım zorlaşır.</li><li>Aynı mekanizma başka amaçlar için yeniden kullanılamaz.</li></ul>`,
      keys: ['Policy = ne yapılacak', 'Mechanism = nasıl yapılacak', 'Timer örneği (100 → 200 saniye)', 'Ayrım esneklik sağlar: politika değişince yalnızca parametre değişir', 'Ayrılmazsa: her değişiklikte mekanizma/çekirdek kodu değişir, yeniden derleme', 'Ayrılmazsa: esneklik kaybı, hata riski, bakım zorluğu']
    },
    {
      id: 'h11', set: 'Liste 1', lesson: 'ch2/tasarim', focus: 'assembly',
      q: 'İşletim sistemlerinin geliştirilmesinde kullanılan dillerin (Assembly, C, C++) farklı seviyelerde kullanılmasının nedeni nedir?',
      a: `<p>Slayt 2.40: Pratikte diller karışık kullanılır: <b>en alt seviyeler assembly</b>, <b>ana gövde C</b>, <b>sistem programları C, C++</b> ve PERL, Python, shell gibi betik diller.</p>
<ul><li><b>Assembly:</b> Donanıma doğrudan dokunan kısımlar (önyükleme kodu, kesme/trap giriş noktaları, bağlam değişiminde yazmaçları kaydetme/yükleme, ayrıcalıklı komutlar). Bunlar yüksek seviyeli dille ifade edilemez veya en yüksek verim gerekir. Bedeli: donanıma bağımlıdır, taşınamaz, yazması zordur.</li><li><b>C:</b> İşaretçilerle düşük seviyeli bellek erişimi sağlar, verimlidir; aynı zamanda yüksek seviyeli olduğu için <b>taşınabilir</b> ve okunabilirdir. Çekirdeğin büyük kısmı için idealdir.</li><li><b>C++ ve betik diller:</b> Sistem programlarında geliştirme hızı ve soyutlama daha önemlidir.</li></ul>
<p>Genel ilke: yüksek seviyeli dil başka donanıma <b>taşımayı kolaylaştırır</b> ama daha yavaş olabilir. Bu yüzden assembly yalnızca gerçekten gereken en alt katmanda tutulur.</p>`,
      keys: ['En alt seviye assembly: donanıma doğrudan erişim (boot, kesme, bağlam değişimi)', 'Assembly hızlı ama donanıma bağımlı / taşınamaz', 'Ana gövde C: verimli + taşınabilir', 'Sistem programları C/C++/betik diller: geliştirme kolaylığı', 'Yüksek seviyeli dil → kolay taşıma ama daha yavaş (ödünleşim)']
    },
    {
      id: 'h12', set: 'Liste 1', lesson: 'ch2/tasarim', focus: 'taşın|portab',
      q: 'Bir işletim sisteminin taşınabilirliği (portability) hangi etkenlerle ilişkilidir?',
      a: `<p>Taşınabilirlik, işletim sisteminin farklı bir donanıma (CPU, mimari) ne kadar kolay aktarılabileceğidir. İlişkili etkenler:</p>
<ul><li><b>Gerçekleştirme dili:</b> Ne kadar çok kod yüksek seviyeli dille (C) yazılmışsa o kadar kolay taşınır. Assembly kod her mimari için yeniden yazılmalıdır (slayt 2.40).</li><li><b>Donanıma bağımlı kodun ayrılması:</b> Mimariye özgü kısım küçük ve ayrı bir katmanda tutulursa yalnızca o kısım yeniden yazılır. (Ek) Ör. donanım soyutlama katmanı (HAL).</li><li><b>Yapı/tasarım:</b> Mikroçekirdekte çekirdek küçüktür; işletim sistemini yeni mimarilere taşımak kolaydır (slayt 2.48). Katmanlı ve modüler yapılar da donanım ayrıntılarını gizler.</li><li><b>Aygıt sürücüleri ve modüller:</b> Yeni donanım için yalnızca sürücü/modül eklemek gerekir.</li><li><b>Standart arayüzler:</b> POSIX gibi standart API'ler.</li><li><b>Emülasyon:</b> Bir işletim sistemini yerel olmayan donanımda çalıştırabilir, ama yavaştır.</li></ul>`,
      keys: ['Yüksek seviyeli dil (C) kullanımı oranı', 'Donanıma bağımlı (assembly) kodun az ve ayrı olması', 'Mikroçekirdek / katmanlı / modüler yapı taşımayı kolaylaştırır', 'Aygıt sürücüleri / modüller', 'Standart arayüzler (POSIX)', 'Emülasyon']
    },
    {
      id: 'h13', set: 'Liste 1', lesson: 'ch2/yapilar', focus: 'basit yapı|simple|katmanlı|layered|mikro ?çekirdek|microkernel|modüler|modular|hibrit|hybrid',
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
      id: 'h14', set: 'Liste 1', lesson: 'ch2/yapilar', focus: 'mikro ?çekirdek|microkernel',
      q: 'Mikro çekirdek mimarisinin avantajları ve dezavantajlarını tartışın.',
      a: `<p>Mikroçekirdekte çekirdeğe yalnızca en önemli işlevler kalır; diğer servisler <b>kullanıcı alanına</b> taşınır ve <b>mesaj geçişiyle</b> iletişim kurar.</p>
<p><b>Avantajlar (slayt 2.48):</b></p>
<ul><li>İşletim sistemini <b>yeni mimarilere taşımak</b> kolaydır (çekirdek küçük).</li><li>Mikroçekirdeği <b>genişletmek</b> kolaydır: yeni servis kullanıcı alanına eklenir, çekirdek değişmez.</li><li><b>Daha güvenilir ve güvenli:</b> Çekirdek modunda daha az kod çalışır. Bir servis (ör. disk sürücüsü) çökerse yalnızca o kullanıcı işlemi çöker ve yeniden başlatılabilir; sistemin geri kalanı çalışır.</li></ul>
<p><b>Dezavantaj:</b> Kullanıcı alanı ile çekirdek alanı arasındaki iletişimin <b>performans yükü</b>. Her istek birden çok mesaj, mesaj kopyalama ve işlem/mod geçişi gerektirir. Monolitikte aynı iş doğrudan fonksiyon çağrılarıyla yapılır. (Ek) Windows NT'nin ilk sürümü bu yüzden yavaştı.</p>`,
      keys: ['Tanım: minimum çekirdek, servisler kullanıcı alanında, mesaj geçişi', 'Yeni mimarilere taşıma kolay', 'Genişletme kolay', 'Güvenilirlik/güvenlik: daha az kod çekirdek modunda, servis çökse sistem çalışır', 'Dezavantaj: mesaj geçişi ve mod geçişlerinin performans yükü'],
      lab: { label: 'Sürücü çökmesini iki mimaride izle', preset: { module: 'system', lab: 'arch', action: 'crash' } }
    },
    {
      id: 'h15', set: 'Liste 1', lesson: 'ch2/yapilar', focus: 'monolitik|monolithic|yüklenebilir çekirdek modül|LKM',
      q: 'Linux çekirdeği neden "monolithic + modular" olarak tanımlanır?',
      a: `<ul><li><b>Monolitik:</b> Dosya sistemleri, CPU zamanlayıcı, bellek yöneticisi, ağ (TCP/IP), aygıt sürücüleri gibi çekirdek işlevlerinin tamamı <b>tek bir adres alanında, çekirdek modunda</b> çalışır. Bileşenler birbirini doğrudan fonksiyon çağrısıyla kullanır. Bu, sistem çağrısı arayüzünde ve çekirdek içi iletişimde ek yükü azaltır; bu yüzden hızlıdır (slayt 2.47).</li><li><b>Modüler:</b> Linux <b>yüklenebilir çekirdek modüllerini (LKM)</b> destekler. Aygıt sürücüleri ve dosya sistemleri gibi işlevler, çekirdeği yeniden derlemeden ve sistemi yeniden başlatmadan <b>çalışma anında yüklenip kaldırılabilir</b> (slayt 2.50, 2.51). (Ek) <code>insmod</code>, <code>rmmod</code>, <code>modprobe</code>.</li></ul>
<p>Yani monolitik yapının performansı ile modüler yapının esnekliği birleştirilmiştir. Bu da Linux'u bir <b>hibrit</b> örnek yapar.</p>`,
      keys: ['Tüm çekirdek işlevleri tek adres alanında, çekirdek modunda', 'Doğrudan fonksiyon çağrıları → yüksek performans', 'Yüklenebilir çekirdek modülleri (LKM)', 'Modüller çalışma anında yüklenip kaldırılabilir, yeniden derleme yok', 'Performans + esneklik birleşimi']
    },
    {
      id: 'h16', set: 'Liste 1', lesson: 'ch2/yapilar', focus: 'macOS|Darwin|Windows',
      q: 'Apple macOS veya Windows mimarisi hangi yapı türlerine örnektir?',
      a: `<p>İkisi de <b>hibrit</b> sistemlerdir (slayt 2.51).</p>
<ul><li><b>macOS (ve iOS):</b> Hibrit ve <b>katmanlı</b>. Katmanlar: uygulamalar → kullanıcı deneyimi → uygulama çerçeveleri → çekirdek çerçeveleri → çekirdek ortamı (<b>Darwin</b>). Darwin, <b>Mach mikroçekirdeği</b> (zamanlama, IPC, bellek yönetimi, Mach trap'leri) ile <b>BSD UNIX</b>'i (POSIX sistem çağrıları) birleştirir. Ayrıca <b>iokit</b> ve yüklenebilir <b>çekirdek uzantıları (kexts)</b> ile modüler özellik taşır.</li><li><b>Windows:</b> Büyük ölçüde <b>monolitik</b> (performans için çekirdek tek adres alanında). Farklı alt sistemler (kişilikler) için <b>mikroçekirdek özellikleri</b> taşır; bu alt sistemler kullanıcı modunda çalışır. Ayrıca dinamik yüklenen sürücüler/modüller vardır.</li></ul>`,
      keys: ['İkisi de hibrit', 'macOS: katmanlı (uygulama → … → Darwin)', 'Darwin = Mach mikroçekirdeği + BSD UNIX', 'macOS: kexts/iokit ile modüler', 'Windows: çoğunlukla monolitik + alt sistemler için mikroçekirdek özellikleri']
    },
    {
      id: 'h17', set: 'Liste 1', lesson: 'ch2/yapilar', focus: 'katmanlı|layered',
      q: 'Katmanlı yapı (layered approach) işletim sistemine hangi tasarım avantajlarını sağlar?',
      a: `<p>Katmanlı yaklaşımda katman 0 donanım, katman N kullanıcı arayüzüdür; her katman yalnızca alt katmanların sağladığı işlemleri kullanır (slayt 2.44).</p>
<ul><li><b>İnşa ve hata ayıklama kolaylığı:</b> İlk katman yalnızca donanımı kullanır ve önce o test edilir. Sonra bir üst katman eklenir; hata çıkarsa altındakiler doğrulandığı için hata o katmandadır. Sistem katman katman doğrulanır.</li><li><b>Soyutlama / bilgi gizleme:</b> Bir katmanın, alttaki işlemlerin <i>nasıl</i> yapıldığını bilmesi gerekmez. Her katman veri yapılarını, işlemlerini ve donanımı üst katmanlardan gizler.</li><li><b>Modülerlik ve bakım:</b> Bir katmanın gerçekleştirmesi, arayüzü korunduğu sürece diğerlerini etkilemeden değiştirilebilir.</li><li><b>Taşınabilirlik:</b> Donanıma bağımlı kısım alt katmanlarda toplanır.</li></ul>
<p>Bedeli: Katmanları doğru tanımlamak zordur (her katman yalnızca alttakini kullanabilir) ve bir isteğin birçok katmandan geçmesi <b>performansı düşürür</b>.</p>`,
      keys: ['Katman 0 donanım … N kullanıcı arayüzü, her katman yalnızca alttakini kullanır', 'Kolay hata ayıklama / doğrulama: katman katman test', 'Soyutlama / bilgi gizleme', 'Modülerlik: bir katman diğerlerini etkilemeden değişebilir', 'Dezavantaj: katman tanımlamak zor, performans kaybı']
    },
    {
      id: 'h18', set: 'Liste 1', lesson: 'ch2/debug', focus: 'log',
      q: 'Bir işletim sistemi neden "log" dosyaları üretir?',
      a: `<p>Slayt 2.62: İşletim sistemi <b>hata bilgisi içeren log dosyaları</b> üretir. Amaçları:</p>
<ul><li><b>Hata ayıklama (debugging):</b> Bir hata veya çökme sonrasında ne olduğunu sonradan incelemek. Hata anında sistem geliştiriciyi bekleyemez; bilgi kaydedilir.</li><li><b>Arıza analizi:</b> Hatanın sırasını ve nedenini (hangi işlem, hangi sürücü, ne zaman) bulmak. Core dump ve crash dump ile birlikte kullanılır.</li><li><b>Performans ayarlama:</b> Olayların kaydı (trace listings) analiz edilerek darboğazlar bulunur.</li><li>(Ek) <b>Güvenlik ve denetim:</b> Giriş denemeleri, yetki kullanımı gibi olayların izlenmesi.</li><li>(Ek) <b>Hesap tutma (accounting):</b> Kaynak kullanım istatistikleri.</li></ul>`,
      keys: ['Hata bilgisini kaydetmek', 'Sonradan hata ayıklama / arıza analizi', 'Olayların sırasını ve nedenini bulmak', 'Performans analizi', 'Güvenlik / denetim kaydı']
    },
    {
      id: 'h19', set: 'Liste 1', lesson: 'ch2/debug', focus: 'core dump|crash dump',
      q: 'Core dump ve crash dump kavramlarını açıklayın. Aralarındaki fark nedir?',
      a: `<ul><li><b>Core dump:</b> Bir <b>uygulamanın (kullanıcı işleminin)</b> hatası sonucu üretilen ve <b>işlemin belleğini</b> yakalayan dosyadır (slayt 2.62). Programcı daha sonra bir hata ayıklayıcıyla (gdb) hatanın anındaki durumu inceler.</li><li><b>Crash dump:</b> <b>İşletim sisteminin</b> hatası (çekirdek çökmesi, crash) sonucu üretilen ve <b>çekirdek belleğini</b> içeren dosyadır.</li></ul>
<p><b>Fark:</b> Kimin çöktüğü (kullanıcı işlemi ve çekirdek) ve hangi belleğin kaydedildiği (işlemin belleği ve çekirdek belleği). Core dump'ta sistem çalışmaya devam eder, yalnızca işlem sonlanır. Crash dump'ta tüm sistem durur ve yeniden başlatılmalıdır.</p>
<p>(Ek) Çekirdek çöktüğünde dosya sistemi kodunun kendisi bozulmuş olabilir. Bu yüzden crash dump diskin <b>dosya sistemi içermeyen ayrılmış bir alanına</b> yazılır, yeniden başlatmada dosyaya dönüştürülür.</p>`,
      keys: ['Core dump: kullanıcı işleminin/uygulamanın hatası', 'Core dump: işlemin belleği kaydedilir', 'Crash dump: işletim sistemi/çekirdek hatası', 'Crash dump: çekirdek belleği kaydedilir', 'Core dump\'ta sistem çalışmaya devam eder, crash dump\'ta sistem durur', 'Crash dump ayrılmış disk alanına yazılır (Ek)'],
      lab: { label: 'Core dump (ayrıcalıklı komut) ve crash dump (kernel panic) senaryoları', preset: { module: 'system', lab: 'mode', illegal: true } }
    },
    {
      id: 'h20', set: 'Liste 1', lesson: 'ch2/debug', focus: 'performans|perf|strace|tcpdump',
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
      id: 'h21', set: 'Liste 1', lesson: 'ch2/debug', focus: 'Kernighan',
      q: 'Kernighan\'s Law ifadesi neyi anlatır ve yazılım geliştirmede neden önemlidir?',
      a: `<p><b>Kernighan Yasası:</b> "Hata ayıklamak, kodu ilk baştan yazmaktan <b>iki kat daha zordur</b>. Bu nedenle kodu olabildiğince zekice yazarsanız, tanım gereği onu ayıklayacak kadar zeki değilsinizdir." (slayt 2.62)</p>
<p><b>Anlatmak istediği:</b> Aşırı karmaşık, "akıllıca" kod yazmak, hataları bulmayı yazan kişinin yeteneğinin ötesine taşır.</p>
<p><b>Neden önemli:</b></p>
<ul><li><b>Basit, okunabilir ve anlaşılır</b> kod yazmayı teşvik eder.</li><li>Bakım ve hata ayıklama maliyetini düşürür.</li><li>İşletim sistemlerinde özellikle kritiktir: çekirdek hatası tüm sistemi çökertir (crash), çekirdek hata ayıklaması zordur ve eşzamanlılık hataları tekrar üretilmesi zor hatalardır.</li></ul>`,
      keys: ['Alıntı: hata ayıklamak yazmaktan iki kat zor', 'Zekice yazılan kodu ayıklayacak kadar zeki olunmaz', 'Sonuç: basit, okunabilir kod yaz', 'Bakım/hata ayıklama maliyeti düşer', 'İşletim sistemlerinde kritik (çekirdek hatası tüm sistemi etkiler)']
    },
    {
      id: 'h22', set: 'Liste 1', lesson: 'ch2/debug', focus: 'tracing|izleme|BCC',
      q: 'Modern işletim sistemlerinde izleme (tracing) araçları hangi durumlarda kullanılır?',
      a: `<p><b>Tracing</b>, belirli bir olay için veri toplar; örneğin bir sistem çağrısı çağrısındaki adımlar (slayt 2.64). Kullanıldığı durumlar:</p>
<ul><li><b>Bir programın işletim sistemiyle etkileşimini anlamak:</b> Hangi sistem çağrılarını yaptığı, hangisinin hata döndürdüğü (<code>strace</code>). Ör. "dosya bulunamadı" hatasının hangi yolu aradığını bulmak.</li><li><b>Kullanıcı ve çekirdek kodu arasındaki etkileşimlerde hata ayıklama:</b> Bu, her ikisini anlayan bir araç seti olmadan neredeyse imkansızdır (slayt 2.65: BCC, DTrace).</li><li><b>Performans sorunları:</b> Disk G/Ç gecikmesi (<code>disksnoop</code>, <code>biolatency</code>), zamanlayıcı gecikmesi, yavaş dosya sistemi işlemleri.</li><li><b>Ağ sorunları:</b> Paketleri yakalamak (<code>tcpdump</code>), TCP bağlantılarını izlemek (<code>tcpconnect</code>).</li><li>(Ek) <b>Çalışan üretim sistemlerinde</b> düşük ek yükle, sistemi durdurmadan sorun teşhisi (BPF/DTrace).</li></ul>`,
      keys: ['Tanım: belirli bir olay için veri toplama (ör. sistem çağrısı adımları)', 'Sistem çağrılarını izleme (strace)', 'Kullanıcı–çekirdek etkileşiminde hata ayıklama (BCC/DTrace)', 'Performans sorunları (disk G/Ç gecikmesi vb.)', 'Ağ sorunları (tcpdump)']
    },
    {
      id: 'h23', set: 'Liste 1', lesson: 'ch2/boot', focus: 'bootstrap|BIOS|UEFI',
      q: '"Bootstrap Loader" ne işe yarar? BIOS ve UEFI arasındaki farkları açıklayın.',
      a: `<p><b>Bootstrap loader:</b> Güç verildiğinde yürütme sabit bir bellek konumunda başlar. Orada <b>anakart üzerindeki ROM veya EEPROM'da</b> saklanan küçük bir kod parçası olan bootstrap loader bulunur. Görevi <b>çekirdeği bulmak, belleğe yüklemek ve başlatmaktır</b> (slayt 2.61; anakart ayrıntısı Ek). Bazen süreç iki adımlıdır: ROM kodu sabit konumdaki <b>boot block</b>'u yükler, o da diskten asıl önyükleyiciyi (ör. GRUB) yükler.</p>
<table class="mini-table"><tr><td></td><td><b>BIOS</b></td><td><b>UEFI</b></td></tr>
<tr><td>Konum</td><td>Eski firmware, anakart üzerindeki ROM/EEPROM</td><td>BIOS'un modern yerine geçeni</td></tr>
<tr><td>Önyükleme</td><td>Diskin ilk sektöründeki boot block'u (MBR, 512 bayt) yükler, o da sonraki aşamayı yükler</td><td>(Ek) Kendi önyükleme yöneticisi vardır; EFI sistem bölümündeki önyükleyici dosyasını doğrudan yükler</td></tr>
<tr><td>Disk</td><td>(Ek) MBR bölümleme: en fazla 2 TB, 4 birincil bölüm</td><td>(Ek) GPT: çok büyük diskler, çok sayıda bölüm</td></tr>
<tr><td>Diğer</td><td>(Ek) 16-bit gerçek mod, sınırlı</td><td>(Ek) 32/64-bit, daha hızlı açılış, <b>Secure Boot</b> (imzasız önyükleyiciyi reddeder), ağdan önyükleme</td></tr></table>`,
      keys: ['Güç verilince sabit adreste çalışır, anakart üzerindeki ROM/EEPROM\'da (firmware)', 'Çekirdeği bulur, belleğe yükler, başlatır', 'İki adımlı olabilir: boot block → önyükleyici', 'BIOS: eski, MBR boot block, sınırlı', 'UEFI: modern yerine geçen; GPT, Secure Boot, hızlı']
    },
    {
      id: 'h24', set: 'Liste 1', lesson: 'ch2/boot', focus: 'make|derle|vmlinuz|kaynak kod',
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
      id: 'h25', set: 'Liste 1', lesson: 'ch2/boot', focus: 'GRUB',
      q: 'GRUB (GNU GRand Unified Bootloader) ne işe yarar ve neden çok çekirdekli sistemlerde kullanışlıdır?',
      a: `<p><b>GRUB</b>, yaygın bir bootstrap loader'dır (önyükleyici). Firmware'den (BIOS/UEFI) sonra çalışır, seçilen çekirdeği belleğe yükler ve başlatır. Slayt 2.61'e göre <b>birden çok diskten, sürümden ve çekirdek seçeneğiyle çekirdek seçmeye</b> izin verir. Ayrıca <b>tek kullanıcı modu</b> (single user mode) gibi farklı başlatma durumlarını destekler.</p>
<p><b>Dikkat:</b> Buradaki "çok çekirdekli" ifadesi çok çekirdekli <i>işlemci</i> (multicore) anlamında değil, sistemde <b>birden fazla işletim sistemi çekirdeği (kernel) bulunması</b> anlamındadır. GRUB'un işlemci çekirdek sayısıyla ilgisi yoktur.</p>
<p><b>Neden kullanışlı:</b></p>
<ul><li>Birden çok <b>çekirdek sürümü</b> kurulu olabilir. Yeni çekirdek açılmazsa menüden <b>eski çekirdek seçilerek</b> sistem kurtarılır.</li><li>Farklı <b>işletim sistemleri</b> arasında seçim yapılabilir (dual boot: Linux ve Windows).</li><li><b>Çekirdek seçenekleri/parametreleri</b> açılışta değiştirilebilir; kurtarma ve tek kullanıcı modu sağlanır.</li></ul>`,
      keys: ['GRUB bir önyükleyici (bootstrap loader); çekirdeği yükleyip başlatır', 'Birden çok disk/sürüm/çekirdek seçeneği arasından seçim', 'Single user mode gibi başlatma durumları', '"Çok çekirdekli" = birden çok kernel (multicore CPU değil)', 'Eski çekirdeğe dönüş / dual boot / çekirdek parametreleri']
    },
    {
      id: 'h26', set: 'Liste 1', lesson: 'ch2/boot', focus: 'vmlinuz',
      q: 'vmlinuz dosyası Linux sistemlerinde neyi temsil eder?',
      a: `<p><code>vmlinuz</code>, <b>Linux çekirdek imajıdır</b>. Çekirdek kaynak kodu <code>make</code> ile derlendiğinde üretilir (slayt 2.60) ve önyükleyicinin (GRUB) belleğe yükleyip başlattığı çalıştırılabilir çekirdektir.</p>
<ul><li>(Ek) Genellikle <code>/boot/vmlinuz-&lt;sürüm&gt;</code> yolunda bulunur; sistemde birden çok sürüm olabilir.</li><li>(Ek) Adı: "vm" <b>sanal bellek</b> desteğini, sondaki "z" ise imajın <b>sıkıştırılmış</b> olduğunu belirtir. Önyüklemede kendi kendini açar.</li><li>Çekirdek modülleri (<code>make modules_install</code>) ayrı dosyalardır ve gerektiğinde bu çekirdeğe yüklenir.</li></ul>`,
      keys: ['Linux çekirdek imajı', 'make ile derleme sonucu üretilir', 'Önyükleyicinin yüklediği çalıştırılabilir çekirdek', '/boot altında, sürüm adıyla (Ek)', 'z = sıkıştırılmış, vm = sanal bellek (Ek)']
    },
    {
      id: 'h27', set: 'Lab Uygulaması', lesson: 'ch3/olusturma', focus: 'Chrome',
      q: 'Chrome tarayıcısının yapısını açıklayın. Tarayıcının tek işlem veya birden fazla işlem olarak çalışmasını avantaj ve dezavantajlarıyla karşılaştırın.',
      a: `<p><b>Chrome çok işlemlidir:</b> <b>Browser</b> işlemi arayüzü, disk ve ağ G/Ç'sini yönetir. Her site için ayrı <b>Renderer</b> işlemi HTML ve JavaScript'i işler ve kısıtlı bir korumalı alanda (sandbox) çalışır. Eklentiler ayrı <b>Plug-in</b> işlemlerinde çalışır.</p>
<table class="mini-table"><tr><th></th><th>Tek işlem</th><th>Çok işlem</th></tr>
<tr><td>Hata yalıtımı</td><td>Bir sekme çökerse tüm tarayıcı çöker</td><td>Yalnızca o sekmenin işlemi çöker</td></tr>
<tr><td>Güvenlik</td><td>Tüm siteler aynı adres alanında</td><td>Her renderer ayrı adres alanında ve sandbox içinde</td></tr>
<tr><td>Bellek</td><td>Az bellek kullanır</td><td>Her işlemin kendi belleği olduğu için çok bellek kullanır</td></tr>
<tr><td>Oluşturma ve geçiş</td><td>Maliyet düşük</td><td>İşlem oluşturma ve bağlam değişimi daha pahalı</td></tr>
<tr><td>İletişim</td><td>Aynı bellek üzerinden, hızlı</td><td>IPC gerekir, daha yavaş ve karmaşık</td></tr>
<tr><td>Paralellik</td><td>Ağır bir sayfa arayüzü dondurabilir</td><td>Sayfalar çok çekirdekte ayrı çalışır, arayüz yanıt verir</td></tr></table>
<p><b>Sonuç:</b> Çok işlem, daha fazla kaynak harcama pahasına <b>kararlılık, güvenlik ve yanıt verebilirlik</b> sağlar.</p>`,
      keys: ['Browser, Renderer ve Plug-in işlemleri', 'Renderer sandbox içinde çalışır', 'Çok işlemde bir sekme çökünce tarayıcı çökmez', 'Adres alanı ayrımı güvenlik sağlar', 'Dezavantaj: daha fazla bellek', 'Dezavantaj: IPC ve bağlam değişimi maliyeti', 'Tek işlemin avantajı: az kaynak, hızlı iletişim']
    },
    {
      id: 'h28', set: 'Lab Uygulaması', lesson: 'ch1/coklu-program', focus: 'çoklu programlama|multiprogramming|çoklu görev|multitasking|çoklu işlem|multiprocess|multithread',
      q: 'Non-multi-programming, multi-programming, multi-processing, multi-tasking ve multi-threading yapılarını açıklayın.',
      a: `<table class="mini-table"><tr><th>Yapı</th><th>Anlamı</th><th>Temel özellik</th></tr>
<tr><td><b>Non-multi-programming</b></td><td>Bellekte aynı anda <b>tek program</b> bulunur</td><td>Program G/Ç beklerken CPU boşta kalır</td></tr>
<tr><td><b>Multi-programming</b></td><td>Bellekte <b>birden çok program</b> bulunur; biri G/Ç beklerken CPU diğerine geçer</td><td>Amaç: <b>CPU kullanımını</b> artırmak</td></tr>
<tr><td><b>Multi-tasking</b></td><td>CPU görevler arasında <b>zaman dilimleriyle</b> çok sık geçiş yapar</td><td>Amaç: <b>kısa yanıt süresi</b>; görevler aynı anda çalışıyor gibi görünür</td></tr>
<tr><td><b>Multi-processing</b></td><td>Sistemde <b>birden çok CPU veya çekirdek</b> bulunur</td><td>İşler <b>gerçekten aynı anda</b> (paralel) çalışır</td></tr>
<tr><td><b>Multi-threading</b></td><td>Bir işlem içinde <b>birden çok iş parçacığı</b> çalışır</td><td>İş parçacıkları kodu, veriyi ve kaynakları paylaşır; her birinin kendi yazmaç ve yığını vardır</td></tr></table>
<p><b>Ayrım:</b> Multi-programming ve multi-tasking tek CPU'da da olur (eşzamanlılık). Multi-processing donanım gerektirir (paralellik). Multi-threading ise bir işlemin içindeki yapıdır.</p>`,
      keys: ['Non-multi: bellekte tek program, G/Ç sırasında CPU boşta', 'Multi-programming: birden çok program, hedef CPU kullanımı', 'Multi-tasking: zaman dilimleri, hedef yanıt süresi', 'Multi-processing: birden çok CPU/çekirdek, gerçek paralellik', 'Multi-threading: işlem içinde birden çok iş parçacığı, kaynak paylaşımı', 'Eşzamanlılık ve paralellik ayrımı']
    },
    {
      id: 'h29', set: 'Lab Uygulaması', lesson: 'ch1/ortamlar', focusH: 'Sanallaştırma',
      q: 'Virtualization (sanallaştırma) kavramını, donanım kaynakları ve işletim sistemi açısından oluşan farkları belirterek açıklayın.',
      a: `<p><b>Sanallaştırma:</b> Tek bir fiziksel makinenin donanımını soyutlayarak birden çok <b>sanal makine</b> gibi kullanılmasını sağlar. Bu işi <b>VMM</b> (hypervisor) yapar.</p>
<table class="mini-table"><tr><th>Açı</th><th>Sanallaştırma olmadan</th><th>Sanallaştırma ile</th></tr>
<tr><td><b>Donanım kaynakları</b></td><td>CPU, bellek, disk ve ağ tek işletim sistemine aittir; kullanılmayan kapasite boşa gider</td><td>VMM kaynakları sanal makineler arasında paylaştırır: sanal CPU, sanal bellek, sanal disk. Kullanım oranı artar</td></tr>
<tr><td><b>İşletim sistemi</b></td><td>Donanımda aynı anda doğrudan tek işletim sistemi çalışır</td><td>Birden çok <b>konuk (guest)</b> işletim sistemi aynı anda çalışır; her biri kendine ait bir makinesi varmış gibi davranır</td></tr>
<tr><td><b>Yalıtım</b></td><td>Çöken işletim sistemi tüm makineyi durdurur</td><td>Çöken konuk diğer konukları etkilemez</td></tr></table>
<p><b>Emülasyondan farkı:</b> Sanallaştırmada konuk, aynı CPU türü için derlenmiştir ve komutları büyük ölçüde doğrudan çalışır. Emülasyonda CPU türü farklıdır ve komutlar çevrilir; bu yüzden daha yavaştır.</p>
<p><b>Bedeli:</b> (Ek) VMM ek yük getirir ve sanal makineler aynı donanımı paylaştığı için birbirinin başarımını etkileyebilir.</p>`,
      keys: ['Tanım: donanımı soyutlayıp birden çok sanal makine oluşturmak', 'VMM / hypervisor', 'Donanım: CPU, bellek, disk paylaştırılır, kullanım artar', 'İşletim sistemi: birden çok konuk aynı anda çalışır', 'Konuklar birbirinden yalıtılmıştır', 'Emülasyondan farkı', 'Ek yük / başarım maliyeti']
    },

    /* ---- Quiz 1 (10 Kasım 2026). Soru tipleri quizdekiyle aynı; quizdeki cümleler ve
            sayılar elimizde olmadığı için içerik aynı tipte yeniden kuruldu. ---- */
    {
      id: 'h30', set: 'Quiz 1', lesson: 'ch1/ortamlar', focusH: 'Sanallaştırma',
      q: 'Sanallaştırma ile ilgili aşağıdaki cümleler doğru mu, yanlış mı? (1) Sanallaştırma, tek bir fiziksel makinede birden çok işletim sisteminin aynı anda çalışmasını sağlar. (2) Sanallaştırmada konuk işletim sistemi, konak CPU\'sundan farklı bir CPU türü için derlenmiş olabilir. (3) Konuk işletim sistemlerini VMM (sanal makine yöneticisi) çalıştırır. (4) VMM her zaman genel amaçlı bir konak işletim sisteminin üzerinde çalışmak zorundadır. (5) Emülasyon, genellikle sanallaştırmadan daha yavaştır.',
      a: `<p><i>Quizdeki cümleler hatırlanmadığı için aynı konuyu yoklayan beş cümle kuruldu.</i></p>
<table class="mini-table"><tr><th>#</th><th>Cevap</th><th>Neden</th></tr>
<tr><td>1</td><td><b>Doğru</b></td><td>Sanallaştırmanın amacı budur: ör. macOS konak üzerinde Windows konuk.</td></tr>
<tr><td>2</td><td><b>Yanlış</b></td><td>Farklı CPU türü <b>emülasyondur</b>. Sanallaştırmada konuk da aynı CPU için yerel derlenmiştir.</td></tr>
<tr><td>3</td><td><b>Doğru</b></td><td>VMM konukları çalıştırır ve donanımı onlara paylaştırır.</td></tr>
<tr><td>4</td><td><b>Yanlış</b></td><td>VMM doğrudan donanım üzerinde de çalışabilir; o zaman genel amaçlı konak yoktur (VMware ESX, Citrix XenServer).</td></tr>
<tr><td>5</td><td><b>Doğru</b></td><td>Emülasyon komutları çevirdiği için genellikle en yavaş yöntemdir.</td></tr></table>`,
      keys: ['Birden çok işletim sistemi aynı anda: doğru', 'Farklı CPU türü emülasyondur: yanlış', 'Konukları VMM çalıştırır: doğru', 'VMM doğrudan donanımda da çalışabilir: yanlış', 'Emülasyon daha yavaş: doğru']
    },
    {
      id: 'h31', set: 'Quiz 1', lesson: 'ch5/os-planlama', focusH: 'Windows',
      q: 'Windows CPU planlamasında aşağıdakilerden hangileri kullanılır? Öncelikli planlama (priority), Round Robin, çok düzeyli kuyruk (multilevel queue), çok düzeyli geri bildirimli kuyruk (multilevel feedback queue), FCFS, SJF.',
      a: `<p><b>Kullanılanlar:</b></p>
<ul><li><b>Öncelikli ve kesmeli planlama:</b> en yüksek öncelikli hazır iş parçacığı çalışır; daha yüksek öncelikli biri gelirse çalışanı keser (slayt 5.65).</li>
<li><b>Çok düzeyli kuyruk:</b> 32 öncelik seviyesinin <b>her biri için ayrı kuyruk</b> vardır.</li>
<li><b>Round Robin:</b> aynı öncelikteki iş parçacıkları zaman dilimiyle (time slice) sırayla çalışır.</li>
<li><b>Geri bildirim:</b> değişken sınıfta (1–15) dilimi biten iş parçacığının önceliği düşürülür (tabanın altına inmez), bekleyip uyanan iş parçacığının önceliği yükseltilir. Öncelik davranışa göre değiştiği için bu, <b>çok düzeyli geri bildirimli kuyruğa</b> benzer.</li></ul>
<p><b>Kullanılmayanlar:</b> saf <b>FCFS</b> ve <b>SJF</b>. Windows burst süresini tahmin etmez; seçim önceliğe göredir.</p>`,
      keys: ['Öncelikli ve kesmeli', 'Her öncelik için ayrı kuyruk (32 seviye)', 'Aynı öncelikte zaman dilimi / RR', 'Öncelik düşürme ve yükseltme: geri bildirim', 'FCFS ve SJF kullanılmaz']
    },
    {
      id: 'h32', set: 'Quiz 1', lesson: 'ch2/shell-metin', focus: 'Pipe|sort|uniq',
      q: 'Aşağıdaki ogrenci.txt verisi için pipe (|) kullanarak: (a) her şehirden kaç öğrenci olduğunu çoktan aza listeleyin, (b) Bilgisayar bölümündeki öğrenci sayısını bulun, (c) notu en yüksek 3 öğrenciyi yazdırın, (d) İstanbul\'daki öğrencilerin adını ve notunu yazdırın. Veri (ad;şehir;bölüm;not): Ahmet;Istanbul;Bilgisayar;85 · Zeynep;Ankara;Elektrik;72 · Mehmet;Istanbul;Bilgisayar;64 · Ayse;Izmir;Makine;91 · Can;Ankara;Bilgisayar;58 · Elif;Istanbul;Elektrik;77 · Burak;Izmir;Bilgisayar;69',
      a: `<p><i>Quizdeki veri seti elimizde olmadığı için aynı tipte bir veri kullanıldı. Çıktılar bash'te çalıştırılarak alındı.</i></p>
<p><b>Mantık:</b> <code>|</code> soldaki komutun çıktısını sağdakinin girdisi yapar. Önce <code>cat</code> dosyayı akıtır, sonraki her komut bu akışı bir adım işler.</p>
<div class="formula">(a) cat ogrenci.txt | cut -d';' -f2 | sort | uniq -c | sort -nr
      3 Istanbul
      2 Izmir
      2 Ankara</div>
<p><code>cut -d';' -f2</code>: ";" ile ayrılmış 2. sütunu (şehir) al. <code>sort</code>: aynı şehirleri yan yana getir. <code>uniq -c</code>: yan yana aynıları say. <code>sort -nr</code>: sayıya göre büyükten küçüğe diz.</p>
<div class="formula">(b) cat ogrenci.txt | grep 'Bilgisayar' | wc -l
4</div>
<p><code>grep</code>: içinde "Bilgisayar" geçen satırları süz. <code>wc -l</code>: satırları say.</p>
<div class="formula">(c) cat ogrenci.txt | sort -t';' -k4 -nr | head -3
Ayse;Izmir;Makine;91
Ahmet;Istanbul;Bilgisayar;85
Elif;Istanbul;Elektrik;77</div>
<p><code>sort -t';' -k4 -nr</code>: ayırıcı ";", 4. sütuna (not) göre sayısal (-n), ters (-r) sırala. <code>head -3</code>: ilk 3 satırı al.</p>
<div class="formula">(d) cat ogrenci.txt | grep 'Istanbul' | cut -d';' -f1,4 | tr ';' ' '
Ahmet 85
Mehmet 64
Elif 77</div>
<p><code>cut -f1,4</code>: 1. ve 4. sütunu al. <code>tr ';' ' '</code>: ";" karakterini boşluğa çevir.</p>
<p><b>Ek:</b> ortalama not için <code>cat ogrenci.txt | awk -F';' '{t+=$4} END {print t/NR}'</code> → 73.7143.</p>`,
      keys: ['| çıktıyı sonraki komutun girdisi yapar', 'cut -d ile ayırıcı, -f ile sütun', 'uniq -c öncesi sort gerekir', 'sort -n sayısal, -r ters, -t ayırıcı, -k sütun', 'grep ile süzme, wc -l ile sayma', 'head ile ilk satırlar']
    },
    {
      id: 'h33', set: 'Quiz 1', lesson: 'ch1/mimari', focus: 'Kümelenmiş',
      q: 'Boşlukları doldurun (kavramlar: kümelenmiş sistem, dağıtık sistem, donanım kesmesi, yazılım kesmesi, toplu iş sistemi, zaman paylaşımı). (1) Birlikte çalışan ve genellikle depolamayı SAN üzerinden paylaşan, bir düğüm çökünce hizmetin sürmesini sağlayan sistemlere ____ denir. (2) Ağ ile bağlanmış, ayrı ve çoğu zaman farklı türden bilgisayarların kaynaklarını paylaştığı sisteme ____ denir. (3) Disk okumasının bittiğini bildirmek için aygıtın veri yolu üzerinden CPU\'ya gönderdiği sinyal ____\'dir. (4) Sıfıra bölme hatası ya da sistem çağrısı sonucu yazılımın ürettiği kesmeye ____ (trap/exception) denir. (5) İşlerin kullanıcıyla etkileşim olmadan sıraya konup toplu halde çalıştırıldığı, CPU\'yu boşta bırakmamayı hedefleyen sisteme ____ denir. (6) CPU\'nun işler arasında çok sık geçiş yapıp her kullanıcıya etkileşimli çalışma ve kısa yanıt süresi sağladığı sisteme ____ denir.',
      a: `<p><i>Quizdeki açıklamalar hatırlanmadığı için kavramların slayttaki tanımları kullanıldı. Quizde başka kavramlar da vardı; aynı yöntemle çalışılabilir.</i></p>
<table class="mini-table"><tr><th>#</th><th>Cevap</th><th>Ayırt edici ipucu</th><th>Ders</th></tr>
<tr><td>1</td><td><b>Kümelenmiş sistem</b> (clustered)</td><td>SAN, yüksek kullanılabilirlik, asimetrik/simetrik</td><td>Bölüm 1 · Mimari</td></tr>
<tr><td>2</td><td><b>Dağıtık sistem</b> (distributed)</td><td>Ağ ile bağlı ayrı bilgisayarlar, kaynak paylaşımı</td><td>Bölüm 1 · Ortamlar</td></tr>
<tr><td>3</td><td><b>Donanım kesmesi</b></td><td>Aygıt üretir, veri yolu üzerinden</td><td>Bölüm 1 · Kesmeler</td></tr>
<tr><td>4</td><td><b>Yazılım kesmesi</b></td><td>Hata ya da sistem çağrısı, yazılım üretir</td><td>Bölüm 1 · Kesmeler</td></tr>
<tr><td>5</td><td><b>Toplu iş sistemi</b> (batch / multiprogramming)</td><td>Etkileşim yok, hedef CPU kullanımı</td><td>Bölüm 1 · Çoklu programlama</td></tr>
<tr><td>6</td><td><b>Zaman paylaşımı</b> (timesharing / multitasking)</td><td>Sık geçiş, etkileşim, yanıt &lt; 1 sn</td><td>Bölüm 1 · Çoklu programlama</td></tr></table>
<p><b>Karıştırılan çift:</b> toplu iş sistemi CPU kullanımını, zaman paylaşımı yanıt süresini hedefler.</p>`,
      keys: ['Kümelenmiş: SAN, yüksek kullanılabilirlik', 'Dağıtık: ağ ile bağlı ayrı bilgisayarlar', 'Donanım kesmesi: aygıt üretir', 'Yazılım kesmesi: trap, hata veya sistem çağrısı', 'Toplu iş: etkileşimsiz, CPU kullanımı', 'Zaman paylaşımı: etkileşimli, kısa yanıt']
    },
    {
      id: 'h34', set: 'Quiz 1', lesson: 'ch5/odev', focus: 'dört algoritma aynı veriyle',
      q: 'Geliş ve burst süreleri: P1 (0, 7), P2 (2, 4), P3 (4, 1), P4 (5, 4), P5 (6, 3). FCFS, SJF, SRTF ve RR (q=2) için Gantt şemalarını çizin; her biri için ortalama bekleme ve ortalama turnaround sürelerini bulun.',
      a: `<p><i>Quizdeki sayılar elimizde olmadığı için aynı tipte bir veri çözüldü. Adım adım Gantt şemaları: Bölüm 5 · Çözümlü Ödev Soruları, "Quiz tipi" kartları.</i></p>
<div class="formula">FCFS  P1 0–7 | P2 7–11 | P3 11–12 | P4 12–16 | P5 16–19
SJF   P1 0–7 | P3 7–8 | P5 8–11 | P2 11–15 | P4 15–19
SRTF  P1 0–2 | P2 2–4 | P3 4–5 | P2 5–7 | P5 7–10 | P4 10–14 | P1 14–19
RR    P1 0–2 | P2 2–4 | P1 4–6 | P3 6–7 | P2 7–9 | P4 9–11 | P5 11–13 | P1 13–15 | P4 15–17 | P5 17–18 | P1 18–19</div>
<table class="mini-table"><tr><th>Algoritma</th><th>Bekleme (P1…P5)</th><th>Ort. bekleme</th><th>Ort. turnaround</th></tr>
<tr><td>FCFS</td><td>0, 5, 7, 7, 10</td><td>5.8</td><td>9.6</td></tr>
<tr><td>SJF</td><td>0, 9, 3, 10, 2</td><td>4.8</td><td>8.6</td></tr>
<tr><td>SRTF</td><td>12, 1, 0, 5, 1</td><td><b>3.8</b></td><td><b>7.6</b></td></tr>
<tr><td>RR (q=2)</td><td>12, 3, 2, 8, 9</td><td>6.8</td><td>10.6</td></tr></table>
<p><b>Formüller:</b> turnaround = bitiş − geliş, bekleme = turnaround − burst. <b>Kurallar:</b> SJF\'te eşitlikte önce gelen seçilir; RR\'de kuantumu biten işlemle aynı anda gelen yeni işlem kuyruğa önce girer.</p>`,
      keys: ['Doğru Gantt şemaları', 'Turnaround = bitiş − geliş', 'Bekleme = turnaround − burst', 'SRTF en düşük ortalamayı verir', 'RR eşitlik kuralı: yeni gelen önce girer']
    }
  ];
})(window.OSLab = window.OSLab || {});
