/*
 * lessons-ch1.js — Bölüm 1: Giriş (ch01_TR.pdf, Silberschatz 10. baskı).
 * Ders sırası slayt sırasını izler. Blok türleri için learn-view.js'e bakınız.
 */
(function (OSLab) {
  'use strict';

  OSLab.lessons = OSLab.lessons || { chapters: [] };

  OSLab.lessons.chapters.push({
    id: 'ch1',
    num: 1,
    title: 'Giriş',
    en: 'Introduction',
    source: 'ch01_TR.pdf',
    objectives: [
      'Bir bilgisayar sisteminin genel organizasyonunu ve kesmelerin (interrupts) rolünü tanımlamak',
      'Modern, çok işlemcili (multiprocessor) bir sistemin bileşenlerini tanımlamak',
      'Kullanıcı modundan çekirdek moduna geçişi göstermek',
      'İşletim sistemlerinin farklı bilgi işlem ortamlarında nasıl kullanıldığını tartışmak',
      'Ücretsiz ve açık kaynaklı işletim sistemi örnekleri vermek'
    ],
    lessons: [
      {
        id: 'nedir',
        title: 'İşletim Sistemi Nedir?',
        en: 'What Is an Operating System?',
        slides: '1.13 – 1.20',
        minutes: 7,
        blocks: [
          { t: 'def', term: 'İşletim sistemi', en: 'Operating System', html: 'Bilgisayar <b>donanımı</b> ile <b>kullanıcı</b> arasında aracı olarak görev yapan programdır.' },
          { t: 'h', text: 'Amaçları' },
          { t: 'list', items: [
            'Kullanıcı programlarını çalıştırmak ve kullanıcı sorunlarının çözümünü kolaylaştırmak',
            'Bilgisayar sisteminin <b>kullanımını kolaylaştırmak</b> (convenience)',
            'Bilgisayar donanımını <b>verimli</b> kullanmak (efficiency)'
          ] },
          { t: 'h', text: 'Bilgisayar sisteminin dört bileşeni' },
          { t: 'p', html: 'Bir bilgisayar sistemi dört bileşene ayrılır. Şekildeki katmanlara tıklayarak her birinin görevini incele:' },
          { t: 'dg', id: 'sys4' },
          { t: 'h', text: 'İşletim sistemi ne yapar?' },
          { t: 'list', items: [
            'Kullanımı kolay ve kaynakları verimli kullanan bir ortam sağlar.',
            '<b>Mainframe / minicomputer</b> gibi paylaşılan sistemlerde tüm kullanıcıların memnun kalmasını sağlar.',
            '<b>İş istasyonu ve sunucularda</b> kaynakları ayırıp verimli kullanılmasını sağlar.',
            '<b>El bilgisayarı (handheld)</b> gibi kaynakları kısıtlı sistemlerde kullanılabilirliği ve <b>pil ömrünü</b> optimize eder.',
            'Arayüzü az olan ya da hiç olmayan <b>gömülü sistemlerin</b> çalışmasını sağlar.'
          ] },
          { t: 'h', text: 'İki temel bakış açısı' },
          { t: 'compare', cols: [
            { title: 'Kaynak ayırıcı (resource allocator)', items: ['CPU zamanı, bellek, G/Ç aygıtları gibi kaynakları yönetir', 'Çakışan istekler arasında verimli ve adil karar verir'] },
            { title: 'Kontrol programı (control program)', items: ['Kullanıcı programlarının ve G/Ç aygıtlarının yürütülmesini denetler', 'Hatalı ve yanlış kullanımı önler'] }
          ] },
          { t: 'def', term: 'Çekirdek', en: 'Kernel', html: '"Bilgisayarda <b>her an çalışan tek program</b>." İşletim sisteminin geri kalanı (sistem programları, uygulamalar) bunun dışında kalır.' },
          { t: 'note', kind: 'exam', html: 'İşletim sistemi tek bir evrensel tanıma sahip değildir; ekmek kızartma makinesinden uzay aracına kadar çok farklı cihazlarda bulunur. Sınavda en çok sorulan tanımlar: <b>aracı program</b>, <b>kaynak ayırıcı</b>, <b>kontrol programı</b>, <b>kernel</b>.' }
        ],
        checks: [
          { q: 'Bir bilgisayar sisteminin dört bileşeni nelerdir? Sırasıyla say.', a: 'Donanım (CPU, bellek, G/Ç) → İşletim sistemi → Uygulama/sistem programları → Kullanıcılar (insan, makine, diğer bilgisayarlar).' },
          { q: 'İşletim sistemine neden "kaynak ayırıcı" denir?', a: 'CPU zamanı, bellek ve G/Ç aygıtları gibi sınırlı kaynakları programlar ve kullanıcılar arasında ihtiyaca göre dağıttığı, çakışan istekler arasında karar verdiği için.' },
          { q: 'Kernel tanımını yap.', a: 'Bilgisayarda her an çalışan tek program; işletim sisteminin çekirdeği.' }
        ]
      },
      {
        id: 'organizasyon',
        title: 'Başlatma ve Sistem Organizasyonu',
        en: 'Computer Startup & System Organization',
        slides: '1.21 – 1.24',
        minutes: 5,
        blocks: [
          { t: 'h', text: 'Bilgisayarın başlatılması' },
          { t: 'def', term: 'Ön yükleme programı', en: 'Bootstrap program', html: 'Açılışta veya yeniden başlatmada yüklenen ilk program. <b>ROM</b> ya da <b>EEPROM</b> içinde bulunur ve <b>firmware (üretici yazılımı)</b> olarak adlandırılır. Sistemi tüm yönleriyle başlatır, <b>işletim sistemi çekirdeğini yükler</b> ve yürütmeyi başlatır.' },
          { t: 'h', text: 'Sistem organizasyonu' },
          { t: 'p', html: 'Bir veya daha fazla CPU ve aygıt denetleyicileri, <b>ortak bir veri yolu (system bus)</b> üzerinden paylaşılan belleğe erişir. CPU ve aygıtlar <b>eşzamanlı</b> çalışır ve <b>bellek döngüleri (memory cycles) için yarışır</b>. Bileşenlere tıkla:' },
          { t: 'dg', id: 'bus' },
          { t: 'h', text: 'Bilgisayar sistem işlemleri' },
          { t: 'list', items: [
            'G/Ç aygıtları ve CPU <b>aynı anda</b> çalışabilir.',
            'Her <b>aygıt denetleyicisi (device controller)</b> belirli bir aygıt türünden sorumludur.',
            'Her aygıt denetleyicisinin bir <b>yerel tamponu (local buffer)</b> vardır.',
            'CPU, veriyi ana bellek ile yerel tampon arasında taşır.',
            'G/Ç: aygıt → denetleyicinin yerel tamponu → ana bellek.',
            'Denetleyici işin bittiğini CPU\'ya bir <b>kesme (interrupt)</b> ile bildirir.'
          ] },
          { t: 'note', kind: 'extra', html: 'Her aygıt denetleyicisi için işletim sisteminde bir <b>aygıt sürücüsü (device driver)</b> bulunur. Sürücü denetleyiciyi tanır ve işletim sisteminin geri kalanına tek tip bir arayüz sunar.' }
        ],
        checks: [
          { q: 'Bootstrap programı nerede saklanır ve görevi nedir?', a: 'ROM veya EEPROM\'da (firmware). Sistemi başlatır, işletim sistemi çekirdeğini belleğe yükleyip çalıştırır.' },
          { q: 'Bir aygıt denetleyicisi işini bitirdiğini CPU\'ya nasıl bildirir?', a: 'Bir kesme (interrupt) üreterek.' }
        ]
      },
      {
        id: 'kesme',
        title: 'Kesmeler (Interrupts)',
        en: 'Interrupts',
        slides: '1.25 – 1.31',
        minutes: 8,
        blocks: [
          { t: 'p', html: 'İşletim sistemi çalışmaya başladıktan sonra <b>olayların oluşmasını bekler</b>. Bir olayın oluştuğu sisteme <b>kesme</b> ile bildirilir.' },
          { t: 'compare', cols: [
            { title: 'Donanım kesmesi', items: ['Aygıtlar istediği an sistem veri yolu üzerinden CPU\'ya sinyal gönderir', 'Örnek: disk okuması bitti, klavyeye basıldı'] },
            { title: 'Yazılım kesmesi: trap / exception', items: ['Bir <b>hata</b> (sıfıra bölme, geçersiz bellek erişimi) ya da <b>kullanıcı isteği</b> (sistem çağrısı) sonucu yazılım tarafından üretilir'] }
          ] },
          { t: 'h', text: 'Bir kesme geldiğinde ne olur?' },
          { t: 'list', ordered: true, items: [
            'CPU o anki işini bırakır.',
            'Kesilen işin adresi (ve yazmaçları) <b>kaydedilir</b>; yeni sistemler bunu yığına (stack) yazar.',
            'Kontrol, <b>kesme vektörü (interrupt vector)</b> aracılığıyla ilgili <b>kesme servis rutinine (ISR)</b> aktarılır.',
            'Servis rutini çalışır.',
            'Kaydedilen adres program sayacına geri yüklenir; yarım kalan iş kaldığı yerden devam eder.'
          ] },
          { t: 'def', term: 'Kesme vektörü', en: 'Interrupt vector', html: 'Düşük bellek alanında tutulan, aygıtların <b>kesme servis rutinlerinin adreslerini</b> içeren işaret (pointer) tablosu. Kesmeyi hızlıca doğru rutine yönlendirir.' },
          { t: 'def', term: 'Kesme servis rutini', en: 'Interrupt service routine', html: 'Bir kesme oluştuğunda yapılması gereken işlemleri içeren komutların bütünü. Her kesme türünün kendi rutini vardır.' },
          { t: 'h', text: 'Kesme tabanlı G/Ç döngüsü' },
          { t: 'p', html: 'Slayt 1.31\'deki döngüyü adım adım ilerlet:' },
          { t: 'dg', id: 'intcycle' },
          { t: 'h', text: 'Kesmenin türünü belirlemek' },
          { t: 'compare', cols: [
            { title: 'Polling (yoklama)', items: ['İşletim sistemi aygıtları tek tek sorgulayarak kesmeyi kimin ürettiğini bulur', 'Basit ama yavaş'] },
            { title: 'Vectored interrupt', items: ['Kesme, kesme vektöründeki bir numarayla doğrudan doğru rutine gider', 'Hızlı'] }
          ] },
          { t: 'list', items: [
            'Bir kesme işlenirken diğer kesmeler <b>devre dışı bırakılabilir</b> (maskelenir).',
            'Kesmelerin <b>öncelikleri</b> vardır: aynı anda birden çok kesme gelirse yüksek öncelikli olan önce işlenir, diğerleri maskelenir.',
            'İşletim sistemi <b>kesmelerle yönetilen (interrupt driven)</b> bir yapıdadır.'
          ] },
          { t: 'note', kind: 'exam', html: '<b>Trap = exception</b>: yazılımın ürettiği kesme. Sistem çağrıları da trap ile çekirdeğe girer. Bu, Bölüm 2\'deki sistem çağrıları ve çift modlu çalışma konusunun temelidir.' }
        ],
        checks: [
          { q: 'Trap ile donanım kesmesi arasındaki fark nedir?', a: 'Donanım kesmesi bir aygıttan sinyal olarak gelir. Trap (exception) ise yazılım tarafından üretilir: bir hata (sıfıra bölme, geçersiz bellek erişimi) ya da kullanıcı programının isteği (sistem çağrısı).' },
          { q: 'Kesme vektörü nedir, nerede tutulur?', a: 'Kesme servis rutinlerinin adreslerini tutan işaret tablosu; düşük bellek alanında tutulur.' },
          { q: 'Kesme işlendikten sonra kesilen program kaldığı yerden nasıl devam eder?', a: 'Kesme anında adresi (ve yazmaçları) kaydedilmiştir; rutin bitince bu adres program sayacına geri yüklenir.' }
        ]
      },
      {
        id: 'io',
        title: 'G/Ç Yapısı ve DMA',
        en: 'I/O Structure & Direct Memory Access',
        slides: '1.32 – 1.37',
        minutes: 6,
        blocks: [
          { t: 'compare', cols: [
            { title: 'Senkron (bloklayıcı) G/Ç', items: ['G/Ç başladıktan sonra kontrol, <b>G/Ç tamamlanınca</b> kullanıcı programına döner', 'Wait komutu CPU\'yu bir sonraki kesmeye kadar boşta bırakır', 'Aynı anda en fazla bir G/Ç isteği karşılanır'] },
            { title: 'Asenkron (bloklamayan) G/Ç', items: ['Kontrol, G/Ç\'nin bitmesini <b>beklemeden</b> programa döner', 'Program isterse sistem çağrısıyla bitmesini bekleyebilir', '<b>Aygıt durum tablosu (device-status table)</b>: her aygıtın tipi, adresi ve durumu'] }
          ] },
          { t: 'h', text: 'Uygulamadan aygıta' },
          { t: 'p', html: 'Uygulamalar G/Ç\'yi doğrudan değil, <b>işletim sistemi üzerinden</b> yapar:' },
          { t: 'dg', id: 'iochain' },
          { t: 'def', term: 'Doğrudan bellek erişimi', en: 'Direct Memory Access (DMA)', html: 'Aygıt denetleyicisi veri bloklarını <b>CPU müdahalesi olmadan</b> doğrudan aygıt tamponundan ana belleğe aktarır. <b>Bayt başına bir kesme yerine blok başına yalnızca bir kesme</b> üretilir.' },
          { t: 'list', items: [
            'CPU, G/Ç modülünü belleğe yazma/okuma ile <b>yetkilendirir</b>.',
            'Aktarım sırasında sorumluluğu devreder ve <b>başka işler yapabilir</b>.',
            'Yüksek hızlı aygıtlar (disk, ağ) için kesme yükünü büyük ölçüde azaltır.'
          ] },
          { t: 'table', head: ['', 'DMA\'sız', 'DMA ile'], rows: [
            ['4 KB blok aktarımı', '≈ 4096 kesme (bayt başına)', '1 kesme (blok başına)'],
            ['CPU aktarım sırasında', 'Her baytla meşgul', 'Başka işleri yürütür']
          ] }
        ],
        checks: [
          { q: 'DMA neden kullanılır?', a: 'Yüksek hızlı aygıtlarda bayt başına kesme CPU\'yu boğar. DMA ile denetleyici bloğu doğrudan belleğe aktarır, blok başına tek kesme üretir; CPU bu sırada başka iş yapar.' },
          { q: 'Senkron ve asenkron G/Ç arasındaki fark nedir?', a: 'Senkronda kontrol G/Ç bitince programa döner (program bloklanır). Asenkronda beklemeden döner; bitiş kesme ve aygıt durum tablosuyla izlenir.' }
        ]
      },
      {
        id: 'depolama',
        title: 'Depolama Yapısı ve Hiyerarşisi',
        en: 'Storage Structure & Hierarchy',
        slides: '1.38 – 1.45, 1.70 – 1.72',
        minutes: 8,
        blocks: [
          { t: 'def', term: 'Ana bellek', en: 'Main memory', html: 'CPU\'nun <b>doğrudan erişebildiği</b> tek büyük depolama. <b>Rastgele erişimli</b> (random access) ve <b>uçucudur</b> (volatile: elektrik kesilince içerik kaybolur). Genellikle <b>DRAM</b>.' },
          { t: 'def', term: 'İkincil depolama', en: 'Secondary storage', html: 'Büyük ve <b>kalıcı</b> (nonvolatile) depolama sağlayan ana bellek uzantısı: HDD, SSD, NVMe.' },
          { t: 'table', head: ['Aygıt', 'Özellik'], rows: [
            ['HDD', 'Mekanik, manyetik plakalar; büyük kapasite ama yavaş'],
            ['SSD', 'Hareketli parça yok, flash bellek; HDD\'den çok daha hızlı'],
            ['NVMe M.2 SSD', 'PCIe hattını kullanır; GB/s seviyesinde hız, düşük gecikme']
          ] },
          { t: 'h', text: 'Birimler' },
          { t: 'p', html: '<b>bit</b> (0/1) → <b>byte</b> = 8 bit (çoğu bilgisayarda en küçük kullanışlı birim) → <b>word</b>: mimarinin doğal veri birimi (64-bit mimaride 8 bayt). KB = 1024 B, MB = 1024² B, GB = 1024³ B, TB = 1024⁴ B, PB = 1024⁵ B. Ağ hızları ise <b>bit</b> cinsinden verilir.' },
          { t: 'h', text: 'Depolama hiyerarşisi' },
          { t: 'p', html: 'Depolama sistemleri <b>hız</b>, <b>maliyet</b> ve <b>uçuculuk</b> bakımından hiyerarşik düzenlenir. Yukarı çıktıkça hız artar, kapasite azalır. Katmanlara tıkla:' },
          { t: 'dg', id: 'pyramid' },
          { t: 'def', term: 'Önbellekleme', en: 'Caching', html: 'Kullanımdaki bilgiyi geçici olarak <b>daha yavaş depolamadan daha hızlı depolamaya kopyalamak</b>. Önce hızlı depolamaya bakılır: veri oradaysa doğrudan kullanılır, yoksa kopyalanıp oradan kullanılır. Önbellek, önbelleğe alınan depolamadan küçüktür; <b>boyut</b> ve <b>değiştirme politikası</b> önemli tasarım sorunlarıdır.' },
          { t: 'p', html: 'Ana bellek de ikincil depolama için bir önbellek gibi düşünülebilir: diskteki veri kullanılmadan önce ana belleğe kopyalanmalıdır.' },
          { t: 'h', text: 'Verinin hiyerarşide taşınması' },
          { t: 'dg', id: 'migration' },
          { t: 'list', items: [
            '<b>Çoklu görev</b> ortamlarında, veri hiyerarşide nerede olursa olsun <b>en son değer</b> kullanılmalıdır.',
            '<b>Çok işlemcili</b> ortamda tüm CPU\'ların önbelleklerinde en yeni değerin olması donanımdaki <b>önbellek tutarlılığı (cache coherency)</b> ile sağlanır.',
            '<b>Dağıtık</b> ortamda verinin birden fazla kopyası olabileceği için durum daha karmaşıktır.'
          ] },
          { t: 'note', kind: 'warn', html: 'Slayt 1.71\'deki tabloda ana belleğin teknolojisi "CMOS SRAM" yazıyor; ana bellek pratikte <b>DRAM</b>\'dir (slayt 1.40 da böyle söyler). Tablodaki erişim süresi sıralaması ise doğrudur: yazmaç &lt; önbellek &lt; ana bellek &lt; SSD &lt; manyetik disk.' }
        ],
        checks: [
          { q: 'Ana bellek neden tek başına yeterli değildir?', a: 'Hem tüm programlar ve veriler için çok küçüktür hem de uçucudur (elektrik kesilince içerik kaybolur). Bu yüzden kalıcı ve büyük ikincil depolama gerekir.' },
          { q: 'Caching nedir ve neden çalışır?', a: 'Kullanılan veriyi yavaş depolamadan hızlı depolamaya kopyalamak. Programlar aynı veriye kısa sürede tekrar eriştiği için sonraki erişimler hızlı katmandan karşılanır.' },
          { q: 'Cache coherency hangi ortamda ve neden gerekir?', a: 'Çok işlemcili ortamda; her CPU\'nun önbelleğinde aynı verinin kopyası olabilir, birinin güncellemesi diğerlerine yansımalıdır ki hepsi en yeni değeri görsün.' }
        ]
      },
      {
        id: 'mimari',
        title: 'Bilgisayar Sistem Mimarisi',
        en: 'Computer System Architecture',
        slides: '1.46 – 1.53',
        minutes: 6,
        blocks: [
          { t: 'p', html: 'Çoğu sistem bir genel amaçlı işlemci kullanır; ayrıca özel amaçlı işlemciler de bulunur. <b>Çok işlemcili (multiprocessor)</b> sistemlerin önemi giderek artmaktadır. Bunlara <b>paralel sistemler</b> ya da <b>sıkı bağlı (tightly-coupled) sistemler</b> da denir.' },
          { t: 'h', text: 'Çok işlemcili sistemlerin üç avantajı' },
          { t: 'list', ordered: true, items: [
            '<b>Artan iş hacmi</b> (increased throughput)',
            '<b>Ölçek ekonomisi</b> (economy of scale): birden çok bilgisayardan daha ucuz, çevre birimleri paylaşılır',
            '<b>Artan güvenilirlik</b> (increased reliability): hata toleransı'
          ] },
          { t: 'compare', cols: [
            { title: 'Asimetrik çoklu işlem', items: ['Her işlemciye <b>özel bir görev</b> atanır'] },
            { title: 'Simetrik çoklu işlem (SMP)', items: ['Her işlemci <b>tüm görevleri</b> yerine getirir', 'Her CPU\'nun kendi yazmaçları ve önbelleği, ortak ana bellek'] }
          ] },
          { t: 'p', html: 'Mimari türlerini sekmelerden karşılaştır:' },
          { t: 'dg', id: 'arch' },
          { t: 'def', term: 'Kümelenmiş sistemler', en: 'Clustered systems', html: 'Birlikte çalışan <b>birden çok sistem</b>. Genellikle <b>depolama alanı ağı (SAN)</b> üzerinden depolamayı paylaşır ve hatalardan kurtulan <b>yüksek kullanılabilirlik</b> sağlar.' },
          { t: 'list', items: [
            '<b>Asimetrik kümeleme:</b> bir makine bekleme (hot-standby) modundadır, diğeri çalışırken onu izler.',
            '<b>Simetrik kümeleme:</b> birden çok düğüm uygulamaları çalıştırır ve birbirini izler.',
            '<b>Yüksek performanslı bilgi işlem (HPC)</b> kümelerinde uygulamalar paralelleştirmeye uygun yazılmalıdır.',
            'Çakışan işlemleri önlemek için <b>dağıtık kilit yöneticisi (DLM)</b> kullanılabilir.'
          ] }
        ],
        checks: [
          { q: 'Çok işlemcili sistemlerin üç avantajı nelerdir?', a: 'Artan iş hacmi, ölçek ekonomisi, artan güvenilirlik (hata toleransı).' },
          { q: 'Asimetrik ve simetrik çoklu işlem arasındaki fark?', a: 'Asimetrikte her işlemciye özel bir görev atanır; simetrikte (SMP) her işlemci tüm görevleri yapabilir.' },
          { q: 'NUMA nedir?', a: 'Tek tip olmayan bellek erişimi: her CPU\'nun kendine yakın bir yerel belleği vardır; yerel belleğe erişim hızlı, başka CPU\'nun belleğine bağlantı (interconnect) üzerinden erişim yavaştır.' }
        ]
      },
      {
        id: 'coklu-program',
        title: 'Çoklu Programlama ve Çoklu Görev',
        en: 'Multiprogramming & Multitasking',
        slides: '1.54 – 1.56',
        minutes: 5,
        blocks: [
          { t: 'def', term: 'Çoklu programlama', en: 'Multiprogramming', html: 'Birden çok iş (job) aynı anda bellekte tutulur. Bir iş beklemek zorunda kaldığında (örneğin G/Ç için) <b>CPU başka bir işe devredilir</b>. Amaç: tek bir kullanıcının CPU\'yu ve G/Ç aygıtlarını sürekli meşgul tutamamasına karşı <b>CPU\'yu hiç boşta bırakmamak</b>. Hangi işin çalışacağına <b>iş planlaması (job scheduling)</b> ile karar verilir.' },
          { t: 'dg', id: 'multiprog' },
          { t: 'def', term: 'Çoklu görev / zaman paylaşımı', en: 'Multitasking / Timesharing', html: 'Çoklu programlamanın mantıksal uzantısı: CPU işler arasında <b>o kadar sık geçiş yapar ki</b> kullanıcılar her işle etkileşimli çalışabilir. <b>Yanıt süresi &lt; 1 saniye</b> olmalıdır.' },
          { t: 'list', items: [
            'Her kullanıcının bellekte yürütülen en az bir programı vardır → <b>process</b> (işlem)',
            'Birden çok iş aynı anda çalışmaya hazırsa → <b>CPU scheduling</b>',
            'İşlemler belleğe sığmazsa → <b>swapping</b> onları bellek ile disk arasında taşır',
            'Tamamen bellekte olmayan işlemlerin yürütülmesi → <b>sanal bellek (virtual memory)</b>'
          ] },
          { t: 'note', kind: 'exam', html: 'Fark sorusu sık gelir: çoklu programlamanın hedefi <b>CPU kullanımı</b>, çoklu görevin hedefi <b>kısa yanıt süresi / etkileşim</b>tir. CPU scheduling laboratuvarındaki Round Robin, zaman paylaşımının nasıl yapıldığını gösterir.' }
        ],
        lab: { label: 'CPU Scheduling laboratuvarında zaman paylaşımını (Round Robin) izle', preset: { algorithm: 'RR', quantum: 2, processes: [['P1', 0, 5], ['P2', 1, 3], ['P3', 2, 4]] } },
        checks: [
          { q: 'Çoklu programlama hangi sorunu çözer?', a: 'Tek bir iş G/Ç beklerken CPU\'nun boşta kalmasını. Bellekte birden çok iş tutulur; biri beklediğinde CPU diğerine geçer.' },
          { q: 'Swapping ile sanal bellek arasındaki fark nedir?', a: 'Swapping tüm işlemi bellek ile disk arasında taşır. Sanal bellek, işlemin tamamı bellekte olmadan yürütülmesine izin verir.' }
        ]
      },
      {
        id: 'islemler',
        title: 'İşletim Sistemi İşlemleri: Çift Mod ve Zamanlayıcı',
        en: 'Operating-System Operations: Dual Mode & Timer',
        slides: '1.57 – 1.60',
        minutes: 7,
        blocks: [
          { t: 'list', ordered: true, items: [
            '<b>Bootstrap programı</b> sistemi başlatır, çekirdeğin yüklenmesinden sorumludur.',
            '<b>Çekirdek</b> yüklenir.',
            'Çekirdek dışında hizmet veren arka plan programları başlatılır: <b>system daemons</b>.',
            'Bundan sonra çekirdek <b>kesmelerle yönetilir</b> (donanım ve yazılım kesmeleri).'
          ] },
          { t: 'p', html: 'Yazılım kesmesi (exception / trap) şu durumlarda oluşur: yazılım hatası (sıfıra bölme), işletim sistemi servisi isteği (<b>sistem çağrısı</b>), sonsuz döngü ya da işlemlerin birbirini veya işletim sistemini değiştirmeye çalışması gibi sorunlar.' },
          { t: 'def', term: 'Çift modlu çalışma', en: 'Dual-mode operation', html: 'İşletim sistemi kendisini ve diğer bileşenleri korumak için iki mod kullanır: <b>kullanıcı modu</b> ve <b>çekirdek modu</b>. Donanımdaki <b>mod biti</b> hangisinde olunduğunu gösterir: <b>çekirdek = 0</b>, <b>kullanıcı = 1</b>.' },
          { t: 'dg', id: 'dualmode' },
          { t: 'list', items: [
            '<b>Ayrıcalıklı komutlar (privileged instructions)</b> yalnızca çekirdek modunda çalıştırılabilir. Örnek: donanım kontrol yazmacına veri yazmak.',
            'Kullanıcı mod bitini kendisi "kernel" yapamaz: çekirdeğe giriş yalnızca <b>sistem çağrısı (trap)</b> ile olur; dönüşte mod tekrar kullanıcıya ayarlanır.'
          ] },
          { t: 'def', term: 'Zamanlayıcı', en: 'Timer', html: 'Bir işlemin kaynakları tüketmesini (örneğin <b>sonsuz döngü</b>) önler. Fiziksel saatle azalan bir sayaç tutulur; işletim sistemi sayacı ayarlar (<b>ayrıcalıklı komut</b>). Sayaç sıfıra inince <b>kesme</b> oluşur ve kontrol işletim sistemine döner; süreyi aşan program sonlandırılabilir.' },
          { t: 'note', kind: 'exam', html: 'Sıra sorusu: kullanıcı modunda <b>trap</b> → donanım <b>mod bitini 0</b> yapar → sistem çağrısı yürütülür → <b>return</b> ile mod biti 1 → kullanıcıya dönüş (slayt 1.59).' }
        ],
        lab: { label: 'System & Architecture laboratuvarında read() sistem çağrısını adım adım izle', preset: { module: 'system', lab: 'mode', syscall: 'read' } },
        checks: [
          { q: 'Mod bitinin değerleri neyi gösterir?', a: '0 = çekirdek (kernel) modu, 1 = kullanıcı (user) modu.' },
          { q: 'Kullanıcı programı neden mod bitini doğrudan 0 yapamaz?', a: 'Modu değiştirmek ayrıcalıklıdır. Çekirdeğe yalnızca trap (sistem çağrısı) ile, işletim sisteminin belirlediği giriş noktasından girilebilir.' },
          { q: 'Zamanlayıcı neden gerekir ve ayarlanması neden ayrıcalıklıdır?', a: 'Bir programın sonsuz döngüye girip CPU\'yu geri vermemesini önlemek için kontrolü düzenli aralıklarla işletim sistemine döndürür. Kullanıcı ayarlayabilseydi bu korumayı devre dışı bırakabilirdi.' }
        ]
      },
      {
        id: 'bilesenler',
        title: 'İşletim Sisteminin Temel Bileşenleri',
        en: 'Major OS Components',
        slides: '1.61 – 1.74',
        minutes: 9,
        blocks: [
          { t: 'p', html: 'İşletim sisteminin temel görevleri: <b>işlem yönetimi</b> (CPU scheduling), <b>bellek yönetimi</b> (sanal bellek), <b>dosya sistemi yönetimi</b>, <b>depolama yönetimi</b>, <b>G/Ç kontrolü</b> ve <b>koruma</b>.' },
          { t: 'h', text: 'İşlem yönetimi' },
          { t: 'def', term: 'İşlem', en: 'Process', html: 'Yürütülmekte olan program; sistemdeki çalışma birimi. <b>Program pasif</b>, <b>işlem aktif</b> bir varlıktır.' },
          { t: 'list', items: [
            'İşlem, görevi için kaynaklara ihtiyaç duyar: CPU, bellek, G/Ç, dosyalar, başlatma verileri.',
            'İşlem sonlandığında yeniden kullanılabilir kaynaklar <b>geri alınır</b>.',
            'Tek iş parçacıklı işlemin, yürütülecek sonraki komutu gösteren bir <b>program sayacı</b> vardır; çok iş parçacıklı işlemde <b>iş parçacığı başına bir program sayacı</b> bulunur.',
            '<b>Eşzamanlılık (concurrency)</b>, CPU\'nun işlemler/iş parçacıkları arasında çoklanmasıyla sağlanır.'
          ] },
          { t: 'p', html: 'İşletim sisteminin işlem yönetimindeki sorumlulukları: işlem <b>oluşturma ve silme</b>, <b>askıya alma ve devam ettirme</b>, <b>senkronizasyon</b>, <b>iletişim</b> ve <b>kilitlenme (deadlock)</b> ile başa çıkma mekanizmaları sağlamak.' },
          { t: 'h', text: 'Bellek yönetimi' },
          { t: 'list', items: [
            'Program çalışması için komutlarının ve verilerinin (tamamı veya bir kısmı) bellekte olmalıdır.',
            'Bellek yönetimi, CPU kullanımını optimize etmek için bellekte neyin ne zaman olacağını belirler.',
            'Etkinlikler: belleğin hangi kısımlarını kimin kullandığını izlemek; hangi işlemlerin/verilerin belleğe girip çıkacağına karar vermek; gerektikçe bellek <b>ayırmak ve serbest bırakmak</b>.',
            'Her işlemin bir <b>adres uzayı</b> vardır (0\'dan max\'a mantıksal adresler: komutlar, veri, yığın); işletim sistemi bunu fiziksel belleğe <b>eşler (mapping)</b>.'
          ] },
          { t: 'h', text: 'Depolama ve dosya yönetimi' },
          { t: 'def', term: 'Dosya', en: 'File', html: 'Birbiriyle ilişkili bilgilerin, yaratıcısının belirlediği anlamla bir araya getirildiği mantıksal depolama birimi. Genellikle program ve veriyi temsil eder.' },
          { t: 'list', items: [
            'Dosya yönetimi: dosya/dizin <b>oluşturma ve silme</b>, bunları değiştirmek için temel işlemler, dosyaları ikincil depolamaya <b>eşleme</b>, kalıcı ortama <b>yedekleme</b>.',
            'Kütle depolama yönetimi: <b>boş alan yönetimi</b>, <b>depolama tahsisi</b>, <b>disk planlaması</b>.'
          ] },
          { t: 'h', text: 'G/Ç alt sistemi' },
          { t: 'p', html: 'Amaç, donanım aygıtlarının ayrıntılarını kullanıcıdan <b>gizlemek</b>tir. İçerir: <b>buffering</b> (aktarım sırasında geçici depolama), <b>caching</b> (verinin bir kısmını hızlı bellekte tutma), <b>spooling</b> (bir işin çıktısının diğer işlerin girdisiyle örtüşmesi), genel aygıt sürücüsü arayüzü ve belirli aygıtlar için sürücüler.' },
          { t: 'h', text: 'Koruma ve güvenlik' },
          { t: 'compare', cols: [
            { title: 'Koruma (protection)', items: ['İşlemlerin/kullanıcıların işletim sistemi kaynaklarına <b>erişimini denetleyen</b> mekanizma'] },
            { title: 'Güvenlik (security)', items: ['Sistemin <b>iç ve dış saldırılara</b> karşı savunması', 'DoS, solucan, virüs, kimlik hırsızlığı, hizmet hırsızlığı'] }
          ] },
          { t: 'p', html: 'Sistemler kullanıcıları <b>kullanıcı kimliği (user ID)</b> ve <b>grup kimliği (group ID)</b> ile ayırt eder; bunlar her dosya ve işlemle ilişkilendirilir. <b>Ayrıcalık yükseltme (privilege escalation)</b>, kullanıcının daha fazla hakla etkin bir kimliğe geçmesini sağlar.' }
        ],
        checks: [
          { q: 'Program ile işlem arasındaki fark nedir?', a: 'Program diskte duran pasif bir varlıktır (komutlar). İşlem ise yürütülmekte olan programdır: aktiftir, program sayacı, yazmaçları ve kaynakları vardır.' },
          { q: 'İşletim sisteminin işlem yönetimindeki beş sorumluluğunu say.', a: 'Oluşturma/silme, askıya alma/devam ettirme, senkronizasyon mekanizmaları, iletişim mekanizmaları, kilitlenme (deadlock) ile başa çıkma mekanizmaları.' },
          { q: 'Koruma ile güvenlik arasındaki fark nedir?', a: 'Koruma, kaynaklara erişimi denetleyen içsel mekanizmadır. Güvenlik, sistemi iç ve dış saldırılara (virüs, DoS vb.) karşı savunmaktır.' }
        ]
      },
      {
        id: 'ortamlar',
        title: 'Sanallaştırma, Dağıtık Sistemler ve Bilgi İşlem Ortamları',
        en: 'Virtualization, Distributed Systems, Computing Environments',
        slides: '1.75 – 1.90',
        minutes: 8,
        blocks: [
          { t: 'h', text: 'Sanallaştırma' },
          { t: 'compare', cols: [
            { title: 'Emülasyon (emulation)', items: ['Kaynak CPU türü hedeften <b>farklı</b> olduğunda (ör. PowerPC → Intel x86)', 'Genellikle <b>en yavaş</b> yöntem', 'Dil yerel koda derlenmiyorsa: <b>yorumlama (interpretation)</b>'] },
            { title: 'Sanallaştırma (virtualization)', items: ['İşletim sistemi CPU için <b>yerel derlenmiş</b>; konuk (guest) işletim sistemleri de yerel derlenmiş', '<b>VMM</b> (sanal makine yöneticisi) sanallaştırma hizmetlerini sağlar', 'Konak (host) üzerinde birden çok konuk çalışır'] }
          ] },
          { t: 'dg', id: 'vm' },
          { t: 'p', html: 'Kullanım alanları: bir dizüstünde birden çok işletim sistemi (macOS konak, Windows konuk), birden çok sistem olmadan farklı işletim sistemleri için uygulama geliştirme ve test, veri merkezlerinde hesaplama ortamlarını yönetme. VMM doğrudan donanım üzerinde de çalışabilir; o zaman genel amaçlı bir konak yoktur (VMware ESX, Citrix XenServer).' },
          { t: 'h', text: 'Dağıtık sistemler' },
          { t: 'p', html: 'Ağ ile birbirine bağlı, ayrı ve muhtemelen heterojen sistemler topluluğu. Ağ bir iletişim yoludur (en yaygını <b>TCP/IP</b>): <b>LAN</b> (yerel), <b>WAN</b> (geniş), <b>MAN</b> (kentsel), <b>PAN</b> (kişisel). <b>Ağ işletim sistemi</b> sistemler arasında mesaj alışverişi sağlar ve <b>tek bir sistem yanılsaması</b> oluşturur.' },
          { t: 'h', text: 'Bilgi işlem ortamları' },
          { t: 'table', head: ['Ortam', 'Özellik'], rows: [
            ['Geleneksel', 'Bağımsız genel amaçlı makineler; portallar, ince istemciler (thin client), kablosuz ağlar, evde bile güvenlik duvarı'],
            ['Mobil', 'Akıllı telefon, tablet; GPS, jiroskop gibi ek özellikler, artırılmış gerçeklik; IEEE 802.11 / hücresel ağ; iOS ve Android'],
            ['İstemci–sunucu', 'Sunucular istemci isteklerine yanıt verir: <b>hesaplama sunucusu</b> (ör. veritabanı) ve <b>dosya sunucusu</b>'],
            ['Eşler arası (P2P)', 'İstemci–sunucu ayrımı yok; her düğüm istemci, sunucu veya ikisi; merkezi arama servisi ya da <b>keşif protokolü</b> (Napster, Gnutella, Skype/VoIP)'],
            ['Bulut bilişim', 'Hesaplama, depolama ve uygulamaları ağ üzerinden hizmet olarak sunar; sanallaştırmanın mantıksal uzantısı (Amazon EC2)'],
            ['Gerçek zamanlı gömülü', 'En yaygın bilgisayar türü; <b>kesin zaman kısıtları</b> vardır, işlem bu süre içinde bitmelidir, yoksa çalışma doğru sayılmaz']
          ] },
          { t: 'table', head: ['Bulut türü', 'Açıklama'], rows: [
            ['Public / Private / Hybrid', 'Herkese açık (ücretli) / şirketin kendi kullanımı / ikisinin birleşimi'],
            ['SaaS', 'Yazılım hizmeti: internet üzerinden uygulama (ör. kelime işlemci)'],
            ['PaaS', 'Platform hizmeti: uygulamaya hazır yazılım yığını (ör. veritabanı sunucusu)'],
            ['IaaS', 'Altyapı hizmeti: sunucu veya depolama (ör. yedekleme alanı)']
          ] },
          { t: 'h', text: 'Ücretsiz ve açık kaynak işletim sistemleri' },
          { t: 'p', html: 'Yalnızca ikili değil <b>kaynak kodu</b> ile dağıtılır; kapalı kaynak ve <b>DRM</b> hareketine karşıdır. <b>Free Software Foundation (FSF)</b> "copyleft" <b>GNU GPL</b> lisansıyla başlatmıştır. Örnekler: <b>GNU/Linux</b>, <b>BSD UNIX</b> (macOS çekirdeğinin temeli). VirtualBox gibi VMM\'lerle bunlar konuk olarak denenebilir.' },
          { t: 'h', text: 'Çekirdek veri yapıları' },
          { t: 'p', html: 'Tekli, çift yönlü ve dairesel <b>bağlı listeler</b>; <b>ikili arama ağacı</b> (arama O(n), dengeli ağaçta O(lg n)); <b>hash map</b>; <b>bitmap</b> (n öğenin durumunu gösteren n bitlik dizi). Linux\'ta &lt;linux/list.h&gt;, &lt;linux/kfifo.h&gt;, &lt;linux/rbtree.h&gt; içinde tanımlıdır.' }
        ],
        checks: [
          { q: 'Emülasyon ile sanallaştırma arasındaki fark nedir?', a: 'Emülasyon, kaynak CPU türü hedeften farklıyken kullanılır ve en yavaş yöntemdir. Sanallaştırmada konuk işletim sistemleri aynı CPU için yerel derlenmiştir ve VMM üzerinde doğrudan çalışır.' },
          { q: 'SaaS, PaaS ve IaaS\'a birer örnek ver.', a: 'SaaS: internetten kelime işlemci. PaaS: kullanıma hazır veritabanı sunucusu. IaaS: yedekleme için depolama alanı veya sanal sunucu.' },
          { q: 'Gerçek zamanlı sistemde "doğru çalışma" ne demektir?', a: 'İşlem tanımlı zaman kısıtı içinde bitirilmelidir; sonuç doğru olsa bile geç gelirse çalışma doğru sayılmaz.' }
        ]
      }
    ]
  });
})(window.OSLab = window.OSLab || {});
