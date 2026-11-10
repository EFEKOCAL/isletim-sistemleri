/*
 * lessons-ch6.js — Bölüm 6: Senkronizasyon (ch06_TR.pdf, Silberschatz 10. baskı).
 * Kodlar "codex" bloğuyla verilir: her satır grubunun yanında ne yaptığı yazar.
 */
(function (OSLab) {
  'use strict';

  OSLab.lessons = OSLab.lessons || { chapters: [] };

  const LAB = (mode, label) => ({ label, preset: { module: 'sync', lab: 'cs', cfg: { mode, policy: 'textbook', initial: 5, iterations: 1, opB: 'dec', semValue: 1 } } });

  OSLab.lessons.chapters.push({
    id: 'ch6',
    num: 6,
    title: 'Senkronizasyon',
    en: 'Synchronization Tools',
    source: 'ch06_TR.pdf',
    objectives: [
      'Kritik bölüm problemini ve yarış durumunu açıklamak',
      'Çözümün üç gereksinimini saymak',
      'Peterson çözümünü ve modern mimarideki sınırını açıklamak',
      'Donanım komutlarını, mutex kilitlerini ve semaforları kullanmak',
      'Monitörleri ve koşul değişkenlerini açıklamak',
      'Kilitlenme, açlık ve öncelik tersinmesini tanımlamak'
    ],
    lessons: [
      {
        id: 'kritik-bolum',
        title: 'Yarış Durumu ve Kritik Bölüm Problemi',
        en: 'Race Condition & The Critical-Section Problem',
        slides: '6.3 – 6.8',
        minutes: 7,
        blocks: [
          { t: 'p', html: 'İşlemler <b>eşzamanlı (concurrently)</b> yürütülür ve herhangi bir anda kesilebilir; yürütme yarıda kalabilir. <b>Paylaşılan veriye eşzamanlı erişim veri tutarsızlığına yol açabilir.</b> Tutarlılığı korumak için işbirlikçi işlemlerin düzenli yürütülmesini sağlayan mekanizmalar gerekir. Sınırlı tampondaki <code>counter</code> örneğini Bölüm 3\'te gördük (slayt 6.3 "4. bölüm" der; doğrusu 3).' },
          { t: 'note', kind: 'exam', attach: true, html: '<b>Yarış durumu (race condition) örneği:</b> P0 ve P1 aynı anda <code>fork()</code> ile çocuk oluşturuyor. İkisi de sıradaki boş pid\'i tutan <code>next_available_pid</code> değişkenini okur (2615). Erişim denetlenmezse <b>aynı pid (2615) iki farklı işleme atanır</b>.' },
          { t: 'h', text: 'Kritik bölüm' },
          { t: 'def', term: 'Kritik bölüm', en: 'Critical section', html: 'İşlemin ortak değişkenleri değiştirdiği, tablo güncellediği veya dosya yazdığı kod bölümü. <b>Bir işlem kritik bölümdeyken başka hiçbir işlem kritik bölümde olmamalıdır.</b> Kritik bölüm problemi, bunu sağlayan protokolü tasarlamaktır.' },
          { t: 'codex', title: 'Pi işleminin genel yapısı (slayt 6.6)', rows: [
            ['while (true) {', 'İşlem sonsuza kadar bu dört bölümü sırayla dolaşır.'],
            ['    entry section', '<b>Giriş bölümü:</b> kritik bölüme girmek için izin ister. Başkası içerideyse burada bekler.'],
            ['        critical section', '<b>Kritik bölüm:</b> paylaşılan veriye dokunan kod. Aynı anda yalnızca bir işlem burada olabilir.'],
            ['    exit section', '<b>Çıkış bölümü:</b> işi bittiğini bildirir, bekleyen başka işlemin girmesine izin verir.'],
            ['        remainder section\n}', '<b>Kalan bölüm:</b> paylaşılan veriye dokunmayan geri kalan kod; sonra döngü başa döner.']
          ] },
          { t: 'h', text: 'Çözümün üç gereksinimi' },
          { t: 'table', head: ['Gereksinim', 'Anlamı'], rows: [
            ['Karşılıklı dışlama (mutual exclusion)', 'Pi kritik bölümdeyse başka hiçbir işlem kritik bölümde olamaz'],
            ['İlerleme (progress)', 'Kritik bölüm boşsa ve girmek isteyen varsa, sıradakinin seçimi süresiz ertelenemez'],
            ['Sınırlı bekleme (bounded waiting)', 'Bir işlem istekte bulunduktan sonra, o girene kadar diğerlerinin kritik bölüme girme sayısının bir üst sınırı vardır']
          ] },
          { t: 'p', html: 'Her işlemin sıfır olmayan bir hızla yürüdüğü varsayılır; N işlemin birbirine göre hızı hakkında varsayım yapılmaz.' },
          { t: 'h', text: 'Kesme tabanlı çözüm yeterli mi?' },
          { t: 'p', html: 'Giriş bölümünde kesmeleri kapat, çıkış bölümünde tekrar aç (slayt 6.8). Kesme yoksa zamanlayıcı işlemi kesemez, yani kimse araya giremez. Ama üç sorun var:' },
          { t: 'list', items: [
            'Kritik bölüm <b>bir saat sürerse</b> o süre boyunca saat kesmesi bile işlenmez, sistem donar.',
            'Bazı işlemler sıra hiç gelmediği için <b>açlık (starvation)</b> yaşayabilir.',
            '<b>İki CPU varsa</b> bir CPU\'nun kesmelerini kapatmak diğer CPU\'daki işlemi durdurmaz; o işlem kritik bölüme yine girebilir.'
          ] }
        ],
        lab: LAB('none', 'Synchronization laboratuvarında kilitsiz yarış durumunu çalıştır'),
        checks: [
          { q: 'Kritik bölüm çözümünün üç gereksinimi nedir?', a: 'Karşılıklı dışlama, ilerleme ve sınırlı bekleme.' },
          { q: 'Kesmeleri kapatmak neden genel çözüm değildir?', a: 'Kritik bölüm uzun sürerse sistem etkilenir, açlık oluşabilir, çok işlemcili sistemde diğer CPU\'daki işlem durdurulmaz.' },
          { q: 'next_available_pid örneğinde ne yanlış gidebilir?', a: 'İki işlem değişkeni aynı anda okursa aynı pid iki farklı işleme atanabilir.' }
        ]
      },
      {
        id: 'peterson',
        title: 'Yazılım Tabanlı Çözümler ve Peterson',
        en: 'Software Solutions & Peterson\'s Solution',
        slides: '6.9 – 6.14',
        minutes: 9,
        blocks: [
          { t: 'h', text: 'Yazılım çözümü 1: turn' },
          { t: 'p', html: 'İki işlem (Pi ve Pj) tek bir <code>int turn</code> değişkenini paylaşır; kritik bölüme girme sırasının kimde olduğunu gösterir. LOAD ve STORE komutlarının <b>atomik</b> (kesilemez) olduğu varsayılır.' },
          { t: 'codex', title: 'Pi için algoritma (slayt 6.10)', rows: [
            ['while (true) {', 'Pi sürekli tekrar kritik bölüme girmek ister.'],
            ['    while (turn == j)\n        ;', '<b>Giriş:</b> sıra Pj\'deyse boş döngüde dön (<code>;</code> = hiçbir şey yapma). Sıra i\'ye geçince döngüden çık.'],
            ['    /* critical section */', 'Kritik bölüm: artık yalnızca Pi içeride.'],
            ['    turn = j;', '<b>Çıkış:</b> sırayı Pj\'ye ver.'],
            ['    /* remainder section */\n}', 'Kalan kod, sonra başa dön.']
          ] },
          { t: 'note', kind: 'warn', attach: true, html: 'Bu algoritmanın adı <b>katı sıralama (strict alternation)</b>dır; slayt 6.9 onu "kilit değişkenleri" başlığıyla verir, ama kilit değişkeni 0/1 değerli ayrı bir yöntemdir (slayt 6.23). Karşılıklı dışlama sağlanır ama <b>ilerleme sağlanmaz</b>: sıra j\'deyken j kritik bölüme girmek istemezse, kritik bölüm boş olsa bile i giremez.' },
          { t: 'h', text: 'Peterson çözümü' },
          { t: 'def', term: 'Peterson çözümü', en: 'Peterson\'s Solution', html: 'İki işlem için yazılım tabanlı çözüm; LOAD ve STORE\'un atomik olduğunu varsayar. İki değişken paylaşılır: <code>int turn</code> sıranın kimde olduğunu, <code>boolean flag[2]</code> işlemin girmeye hazır olduğunu gösterir (<code>flag[i] = true</code>: Pi hazır).' },
          { t: 'codex', title: 'Pi için Peterson algoritması (slayt 6.12)', rows: [
            ['while (true) {', 'Pi sürekli tekrar kritik bölüme girmek ister.'],
            ['    flag[i] = true;', '"Ben girmek istiyorum" der.'],
            ['    turn = j;', 'Kibarlık: "ama önce sen geç" der, sırayı karşı tarafa verir.'],
            ['    while (flag[j] && turn == j)\n        ;', 'Pj de girmek istiyor <b>ve</b> sıra Pj\'deyse bekle. İkisinden biri yanlış olunca (Pj istemiyor ya da sıra i\'ye geldi) geç.'],
            ['    /* critical section */', 'Kritik bölüm.'],
            ['    flag[i] = false;', '<b>Çıkış:</b> "artık girmek istemiyorum" der; bekleyen Pj\'nin döngüsü biter.'],
            ['    /* remainder section */\n}', 'Kalan kod, sonra başa dön.']
          ] },
          { t: 'p', html: 'Slayt 6.13 aynı kodu i = 0, j = 1 koyarak iki işlem için yan yana yazar: P0 <code>turn = 1</code> der, P1 <code>turn = 0</code> der. İkisi aynı anda girmek isterse <code>turn</code>\'e <b>en son yazanın</b> değeri kalır ve <b>diğeri</b> içeri girer.' },
          { t: 'dg', id: 'peterson' },
          { t: 'h', text: 'Üç gereksinim karşılanır' },
          { t: 'list', ordered: true, items: [
            '<b>Karşılıklı dışlama:</b> Pi yalnızca <code>flag[j] == false</code> veya <code>turn == i</code> ise girer. <code>turn</code> aynı anda hem i hem j olamayacağı için ikisi birlikte giremez.',
            '<b>İlerleme:</b> Pj girmek istemiyorsa (<code>flag[j] == false</code>) Pi hiç beklemeden girer.',
            '<b>Sınırlı bekleme:</b> Pi, Pj\'nin en fazla <b>bir</b> girişinden sonra kritik bölüme girer; çünkü Pj tekrar girmek isterse <code>turn = i</code> yazar.'
          ] }
        ],
        checks: [
          { q: 'Peterson çözümünde turn ve flag ne işe yarar?', a: 'flag, işlemin girmeye hazır olduğunu; turn, sıranın kimde olduğunu gösterir.' },
          { q: 'Pi kritik bölüme hangi koşulda girer?', a: 'flag[j] == false veya turn == i ise.' },
          { q: 'Sadece turn kullanan çözümün eksiği nedir?', a: 'İlerleme sağlanmaz: sıra karşı taraftayken o işlem girmek istemezse kritik bölüm boş olsa da girilemez.' }
        ]
      },
      {
        id: 'bellek-bariyeri',
        title: 'Modern Mimari ve Bellek Bariyeri',
        en: 'Modern Architecture & Memory Barriers',
        slides: '6.15 – 6.21',
        minutes: 7,
        blocks: [
          { t: 'p', html: 'Peterson çözümü algoritmayı göstermek için yararlıdır ama <b>modern mimarilerde çalışması garanti değildir</b>. İşlemciler ve derleyiciler performans için <b>birbirine bağımlı olmayan işlemlerin sırasını değiştirebilir (reorder)</b>. Tek iş parçacığında sonuç değişmez; çok iş parçacığında tutarsız ya da beklenmedik sonuç çıkabilir. Bunun neden olduğunu anlamak yarış durumlarını anlamayı kolaylaştırır.' },
          { t: 'codex', title: 'Örnek (slayt 6.16 – 6.17): paylaşılan boolean flag = false; int x = 0;', rows: [
            ['/* İş parçacığı 1 */\nwhile (!flag)\n    ;', 'flag <b>true</b> olana kadar boş döngüde bekler.'],
            ['print x', 'Sonra x\'i yazdırır. <b>Beklenen çıktı: 100.</b>'],
            ['/* İş parçacığı 2 */\nx = 100;', 'Önce x\'e 100 yazar.'],
            ['flag = true;', 'Sonra "hazır" işaretini verir.'],
            ['/* Sıra değişirse: */\nflag = true;\nx = 100;', 'x ile flag birbirinden bağımsız olduğu için işlemci bu iki yazmanın <b>sırasını değiştirebilir</b>. İş parçacığı 1 flag\'i true görüp x\'i 100 olmadan okursa <b>çıktı 0</b> olur.']
          ] },
          { t: 'p', html: 'Peterson\'da da aynısı olur (slayt 6.18): P0\'ın <code>flag[0] = true</code> yazması <code>turn = 1</code>\'den sonraya kayarsa P1 içeri girerken P0\'ın girmek istediğini görmez ve <b>iki işlem aynı anda kritik bölümde olur</b>. Çözüm <b>bellek bariyeridir</b>.' },
          { t: 'h', text: 'Bellek modelleri' },
          { t: 'p', html: '<b>Bellek modeli (memory model)</b>, bir mimarinin uygulama programlarına verdiği bellek garantileridir:' },
          { t: 'compare', cols: [
            { title: 'Güçlü sıralı (strongly ordered)', items: ['Bir işlemcinin bellek değişikliği diğer tüm işlemcilere <b>hemen görünür</b>'] },
            { title: 'Zayıf sıralı (weakly ordered)', items: ['Bir işlemcinin değişikliği diğerlerine <b>hemen görünmeyebilir</b>'] }
          ] },
          { t: 'def', term: 'Bellek bariyeri', en: 'Memory barrier', html: 'Bellekteki her değişikliğin diğer işlemcilere <b>yayılmasını (görünür olmasını)</b> zorlayan komut. Çalıştığında, bariyerden önceki tüm yüklemeler (load) ve saklamalar (store), sonraki yükleme ve saklamalardan <b>önce tamamlanır</b>. Komutlar yeniden sıralansa bile saklamalar bellekte biter ve görünür olur (slayt 6.20).' },
          { t: 'codex', title: 'Bariyerle düzeltilmiş örnek (slayt 6.21)', rows: [
            ['/* İş parçacığı 1 */\nwhile (!flag)\n    memory_barrier();', 'Bekleme döngüsüne bariyer konur: <b>flag, x\'ten önce okunur</b>.'],
            ['print x', 'flag true görüldüğünde x de güncel okunur: çıktı 100.'],
            ['/* İş parçacığı 2 */\nx = 100;', 'x yazılır.'],
            ['memory_barrier();', 'Bariyer: x\'e yazma, sonraki yazmadan <b>önce tamamlanır</b> ve görünür olur.'],
            ['flag = true;', 'flag ancak bundan sonra yazılır; sıra artık değişemez.']
          ] }
        ],
        checks: [
          { q: 'Peterson çözümü modern mimarilerde neden garanti değildir?', a: 'İşlemci veya derleyici bağımlılığı olmayan komutların sırasını değiştirebilir; iki işlem aynı anda kritik bölüme girebilir.' },
          { q: 'Bellek bariyeri ne sağlar?', a: 'Bariyerden önceki yükleme ve saklamalar, sonraki işlemlerden önce tamamlanır ve diğer işlemcilere görünür olur.' }
        ]
      },
      {
        id: 'donanim',
        title: 'Donanım Desteği: test_and_set ve compare_and_swap',
        en: 'Hardware Support for Synchronization',
        slides: '6.22 – 6.31',
        minutes: 11,
        blocks: [
          { t: 'p', html: 'Çoğu sistem kritik bölüm için donanım desteği sağlar (slayt 6.22). Kesmeleri kapatmak çok işlemcili sistemde uygun değildir. Kalan yol <b>özel makine komutları</b> ve <b>kilit değişkenleridir</b>. Bu komutlar bir kelimeyi test edip değiştirmeyi ya da iki kelimenin içeriğini değiş tokuş etmeyi <b>atomik</b> (kesintisiz, tek adımda) yapar.' },
          { t: 'codex', title: 'Kilit değişkeniyle genel yapı (slayt 6.23): lock 0 veya 1 değerli paylaşılan tamsayı', rows: [
            ['do {', 'Döngü başı.'],
            ['    acquire_lock(lock);', 'Kilidi al: kilit 1 ise (başkası içeride) bekle, 0 ise 1 yap ve gir.'],
            ['        critical section', 'Kritik bölüm.'],
            ['    release_lock(lock);', 'Kilidi bırak: lock = 0.'],
            ['        remainder section\n} while (TRUE);', 'Kalan kod, sonra başa dön.']
          ] },
          { t: 'note', kind: 'info', attach: true, html: 'Asıl zorluk <code>acquire_lock</code>\'un içidir: "kilit 0 mı? öyleyse 1 yap" iki ayrı adımsa iki işlem aynı anda 0 görüp birlikte girer. Aşağıdaki donanım komutları bu iki adımı <b>tek atomik adımda</b> yapar.' },
          { t: 'h', text: 'test_and_set' },
          { t: 'codex', title: 'Tanım (slayt 6.25): donanım bunu tek atomik komut olarak yürütür', rows: [
            ['boolean test_and_set(boolean *target) {', 'Bir mantıksal değişkenin adresini alır.'],
            ['    boolean rv = *target;', 'Eski değeri sakla.'],
            ['    *target = true;', 'Değişkeni her durumda <b>true</b> yap.'],
            ['    return rv;\n}', '<b>Eski değeri</b> döndür.']
          ] },
          { t: 'codex', title: 'test_and_set ile çözüm (slayt 6.26): lock başlangıçta false', rows: [
            ['do {\n    while (test_and_set(&lock))\n        ; /* do nothing */', 'Eski değer <b>true</b> dönerse kilit zaten alınmıştı: tekrar dene. <b>false</b> dönerse kilit boştu ve bu çağrı onu true yaptı: içeri gir.'],
            ['    /* critical section */', 'Kritik bölüm.'],
            ['    lock = false;', 'Kilidi bırak.'],
            ['    /* remainder section */\n} while (true);', 'Kalan kod.']
          ] },
          { t: 'h', text: 'compare_and_swap' },
          { t: 'codex', title: 'Tanım (slayt 6.27): atomik yürür', rows: [
            ['int compare_and_swap(int *value,\n    int expected, int new_value) {', 'Değişkenin adresi, beklenen değer ve yazılacak yeni değer.'],
            ['    int temp = *value;', 'Eski değeri sakla.'],
            ['    if (*value == expected)\n        *value = new_value;', 'Değer <b>beklenene eşitse</b> yeni değeri yaz. Değilse hiçbir şey değiştirme.'],
            ['    return temp;\n}', 'Her durumda <b>eski değeri</b> döndür.']
          ] },
          { t: 'codex', title: 'compare_and_swap ile çözüm (slayt 6.28): lock başlangıçta 0', rows: [
            ['while (true) {\n    while (compare_and_swap(&lock, 0, 1) != 0)\n        ; /* do nothing */', '"lock 0 ise 1 yap." Dönen eski değer 0 ise kilidi biz aldık, döngüden çık. 0 değilse başkası tutuyor, tekrar dene.'],
            ['    /* critical section */', 'Kritik bölüm.'],
            ['    lock = 0;', 'Kilidi bırak.'],
            ['    /* remainder section */\n}', 'Kalan kod.']
          ] },
          { t: 'note', kind: 'exam', html: 'İki komut da <b>atomik</b> yürür ve parametrenin <b>orijinal değerini</b> döndürür. Fark: test_and_set her zaman true yazar; compare_and_swap yalnızca <code>*value == expected</code> ise yazar.' },
          { t: 'note', kind: 'warn', html: 'Slayt 6.22, compare_and_swap\'in Intel x86 karşılığını "EXCH" diye yazar. Doğrusu <b>CMPXCHG</b> (compare and exchange) komutudur; çok işlemcili sistemde <code>lock</code> önekiyle atomik olur. XCHG ise iki değeri koşulsuz değiş tokuş eder ve test_and_set\'e benzer.' },
          { t: 'h', text: 'Sınırlı bekleme' },
          { t: 'p', html: 'Yukarıdaki çözümler karşılıklı dışlamayı sağlar ama <b>sınırlı beklemeyi sağlamaz</b>: şanssız bir işlem kilidi hep kaçırabilir. Slayt 6.29\'daki sürüm, n işlemin paylaştığı <code>boolean waiting[n]</code> dizisini (hepsi başta false) ve <code>lock = 0</code>\'ı kullanır. İşlem çıkarken kilidi doğrudan sıradaki bekleyene devreder.' },
          { t: 'codex', title: 'Giriş kısmı (Pi)', rows: [
            ['while (true) {\n    waiting[i] = true;', 'Pi "bekliyorum" diye işaretlenir.'],
            ['    key = 1;', 'key yerel değişken; 1 "kilidi henüz alamadım" demektir.'],
            ['    while (waiting[i] && key == 1)\n        key = compare_and_swap(&lock,0,1);', 'İki yoldan biriyle çıkılır: kilit boşsa CAS 0 döndürür (key = 0) ya da çıkan bir işlem Pi\'ye sıra verip <code>waiting[i] = false</code> yapar.'],
            ['    waiting[i] = false;', 'Artık beklemiyor.'],
            ['    /* critical section */', 'Kritik bölüm.']
          ] },
          { t: 'codex', title: 'Çıkış kısmı (Pi): sıradakini bul', rows: [
            ['    j = (i + 1) % n;', 'Aramaya Pi\'den sonraki işlemden başla (<code>%</code> ile sona gelince başa sar).'],
            ['    while ((j != i) && !waiting[j])\n        j = (j + 1) % n;', 'Dairesel olarak dolaş: bekleyen ilk işlemi bul ya da tur tamamlanıp Pi\'ye geri gel.'],
            ['    if (j == i)\n        lock = 0;', 'Kimse beklemiyorsa kilidi serbest bırak.'],
            ['    else\n        waiting[j] = false;', 'Bekleyen Pj varsa kilidi açmadan <b>doğrudan ona devret</b>: Pj\'nin döngüsü biter ve girer.'],
            ['    /* remainder section */\n}', 'Kalan kod.']
          ] },
          { t: 'note', kind: 'exam', attach: true, html: 'Sıra dairesel verildiği için bekleyen her işlem en fazla <b>n − 1</b> giriş sonra içeri girer: sınırlı bekleme sağlanır.' },
          { t: 'h', text: 'Atomik değişkenler' },
          { t: 'p', html: 'compare_and_swap gibi komutlar genellikle başka senkronizasyon araçlarının yapı taşıdır. Bunlardan biri <b>atomik değişkendir (atomic variable)</b>: tamsayı ve mantıksal gibi temel türlerde kesintisiz güncelleme sağlar. <code>increment(&amp;sequence);</code> çağrısı <code>sequence</code>\'i araya kimse girmeden bir artırır (slayt 6.30).' },
          { t: 'codex', title: 'increment() nasıl yazılır (slayt 6.31)', rows: [
            ['void increment(atomic_int *v) {\n    int temp;', 'Atomik tamsayının adresini alır.'],
            ['    do {\n        temp = *v;', 'Mevcut değeri oku.'],
            ['    } while (temp != compare_and_swap(v, temp, temp + 1));\n}', '"Değer hâlâ okuduğum temp ise temp + 1 yap." Araya başka iş parçacığı girip değeri değiştirdiyse CAS farklı bir eski değer döndürür ve döngü baştan dener.']
          ] }
        ],
        checks: [
          { q: 'test_and_set ne yapar?', a: 'Atomik olarak hedefin eski değerini döndürür ve hedefi true yapar.' },
          { q: 'compare_and_swap ile test_and_set arasındaki fark nedir?', a: 'test_and_set her zaman true yazar. compare_and_swap yalnızca değer beklenene eşitse yeni değeri yazar. İkisi de eski değeri döndürür.' },
          { q: 'Bounded-waiting sürümünde waiting[] dizisi ne işe yarar?', a: 'Çıkan işlem sıradaki bekleyeni dairesel arar ve kilidi ona devreder. Böylece her işlem en fazla n−1 giriş bekler.' }
        ]
      },
      {
        id: 'mutex',
        title: 'Mutex Kilitleri',
        en: 'Mutex Locks',
        slides: '6.32 – 6.33',
        minutes: 4,
        blocks: [
          { t: 'def', term: 'Mutex kilidi', en: 'Mutex lock (mutual exclusion)', html: 'Önceki çözümler karmaşıktır ve uygulama programcısının doğrudan kullanamayacağı kadar alt seviyededir. Bu yüzden işletim sistemi tasarımcıları yazılım araçları sunar; en basiti mutex\'tir: kilidin <b>müsait olup olmadığını gösteren mantıksal değişken</b>.' },
          { t: 'codex', title: 'Mutex ile kritik bölüm (slayt 6.33)', rows: [
            ['while (true) {', 'Döngü başı.'],
            ['    acquire lock', '<code>acquire()</code>: kilit müsaitse al ve gir; değilse müsait olana kadar bekle.'],
            ['        critical section', 'Kritik bölüm.'],
            ['    release lock', '<code>release()</code>: kilidi müsait yap.'],
            ['    remainder section\n}', 'Kalan kod.']
          ] },
          { t: 'list', items: [
            '<code>acquire()</code> ve <code>release()</code> çağrıları <b>atomik</b> olmalıdır; genellikle compare_and_swap gibi donanım komutlarıyla gerçekleştirilir.',
            'Bu çözüm <b>meşgul bekleme (busy waiting)</b> gerektirir: bekleyen işlem döngüde dönüp CPU harcar. Bu yüzden bu kilide <b>spinlock</b> ("dönen kilit") denir.'
          ] }
        ],
        lab: LAB('mutex', 'Synchronization laboratuvarında mutex ile yarış durumunu engelle'),
        checks: [
          { q: 'Spinlock neden bu adı alır?', a: 'Kilidi bekleyen işlem döngüde dönerek meşgul bekler; CPU zamanı harcar.' },
          { q: 'acquire ve release neden atomik olmalıdır?', a: 'Atomik olmazlarsa iki işlem kilidi aynı anda müsait görüp kritik bölüme birlikte girebilir.' }
        ]
      },
      {
        id: 'semafor',
        title: 'Semaforlar',
        en: 'Semaphores',
        slides: '6.34 – 6.42',
        minutes: 12,
        blocks: [
          { t: 'def', term: 'Semafor', en: 'Semaphore', html: 'Mutex\'ten daha gelişmiş yollar sunan senkronizasyon aracı. <b>S tamsayı değişkenine</b> yalnızca iki bölünmez (atomik) işlemle erişilir: <code>wait()</code> ve <code>signal()</code>. İlk adları Dijkstra\'nın verdiği <b>P()</b> ve <b>V()</b>\'dir.' },
          { t: 'codex', title: 'Klasik tanım (slayt 6.34)', rows: [
            ['wait(S) {\n    while (S <= 0)\n        ; // busy wait', 'S sıfır veya negatifse kullanılabilir kaynak yok: döngüde bekle (meşgul bekleme).'],
            ['    S--;\n}', 'Kaynak var: S\'yi bir azalt (bir birimi al).'],
            ['signal(S) {\n    S++;\n}', 'Kaynağı geri ver: S\'yi bir artır.']
          ] },
          { t: 'p', html: 'Slayt 6.34 semaforun meşgul bekleme gerektirmediğini söyler; bu, aşağıdaki <b>bekleyerek uyuyan</b> sürüm için geçerlidir. Slayt 6.35 o davranışı sözle anlatır:' },
          { t: 'compare', cols: [
            { title: 'wait(S)', items: ['S pozitifse: S\'yi azalt ve devam et', 'Değilse: <b>bloklan</b>, biri seni uyandırana kadar bekle'] },
            { title: 'signal(S)', items: ['Bekleyen işlem varsa: <b>birini uyandır</b>', 'Yoksa: S\'yi artır'] }
          ] },
          { t: 'h', text: 'Sayan ve ikili semafor' },
          { t: 'compare', cols: [
            { title: 'Sayan semafor (counting)', items: ['Değer sınırsız bir aralıkta değişir', 'Örneğin 5 kopyalı bir kaynağı saymak için S = 5'] },
            { title: 'İkili semafor (binary)', items: ['Değer yalnızca 0 veya 1', 'Mutex kilidi gibi davranır'] }
          ] },
          { t: 'p', html: 'Sayan semafor ikili semaforlarla da gerçekleştirilebilir; semaforlarla çeşitli senkronizasyon problemleri çözülür.' },
          { t: 'h', text: 'Kullanım örnekleri' },
          { t: 'codex', title: 'Slayt 6.37', rows: [
            ['/* mutex = 1 */\nwait(mutex);', '<b>Kritik bölüm:</b> mutex 1\'den başlar. İlk gelen 0 yapıp girer; sonraki gelen bekler.'],
            ['    CS', 'Kritik bölüm.'],
            ['signal(mutex);', 'Çıkarken mutex\'i artır; bekleyen varsa o girer.'],
            ['/* synch = 0 */\nP1:  S1;\n     signal(synch);', '<b>Sıralama:</b> S1, S2\'den önce olmalı. P1, S1\'i bitirince synch\'i 1 yapar.'],
            ['P2:  wait(synch);\n     S2;', 'synch 0\'dan başladığı için P2, P1 signal yapana kadar bekler. Böylece S2 hep S1\'den sonra çalışır.']
          ] },
          { t: 'h', text: 'Meşgul beklemeden gerçekleştirme' },
          { t: 'p', html: 'İki işlem aynı semaforda wait ve signal\'i <b>aynı anda</b> çalıştırmamalıdır; yani wait/signal\'in kendisi bir kritik bölüm problemidir (slayt 6.38). Kod kısa olduğu için orada meşgul bekleme azdır. Ama uygulamalar kritik bölümde uzun kalabildiğinden semaforu beklerken dönmek iyi çözüm değildir. Bu yüzden her semaforun bir <b>bekleme kuyruğu</b> vardır (slayt 6.39):' },
          { t: 'list', items: [
            '<b>block:</b> işlemi semaforun bekleme kuyruğuna koyar ve uyutur (CPU harcamaz).',
            '<b>wakeup:</b> kuyruktan bir işlemi alıp hazır kuyruğuna taşır.'
          ] },
          { t: 'codex', title: 'Veri yapısı ve işlemler (slayt 6.40 – 6.41)', rows: [
            ['typedef struct {\n    int value;\n    struct process *list;\n} semaphore;', 'Semafor artık bir değer ve bekleyen işlemlerin listesinden oluşur.'],
            ['wait(semaphore *S) {\n    S->value--;', 'Önce değeri azalt.'],
            ['    if (S->value < 0) {\n        add this process to S->list;\n        block();\n    }\n}', 'Değer negatife düştüyse kaynak yok: işlemi listeye ekle ve uyut. Negatif değerin büyüklüğü <b>bekleyen işlem sayısıdır</b> (value = −2 → 2 bekleyen).'],
            ['signal(semaphore *S) {\n    S->value++;', 'Değeri artır.'],
            ['    if (S->value <= 0) {\n        remove a process P from S->list;\n        wakeup(P);\n    }\n}', 'Artırdıktan sonra hâlâ 0 veya negatifse listede bekleyen var demektir: birini çıkar ve uyandır.']
          ] },
          { t: 'dg', id: 'semtrace' },
          { t: 'h', text: 'Yanlış kullanım' },
          { t: 'list', items: [
            '<code>signal(mutex) … wait(mutex)</code>: sıra ters; birden çok işlem aynı anda kritik bölüme girer, karşılıklı dışlama bozulur.',
            '<code>wait(mutex) … wait(mutex)</code>: ikinci wait hiç geçilemez, işlem kendini sonsuza kadar kilitler.',
            '<code>wait</code> veya <code>signal</code>\'in unutulması: ya karşılıklı dışlama bozulur ya da diğerleri sonsuza kadar bekler.'
          ] },
          { t: 'note', kind: 'exam', attach: true, html: 'Bu hatalar semafor ve benzeri araçlar <b>yanlış kullanıldığında</b> ortaya çıkar (slayt 6.42). Daha üst seviyeli monitörler bu yüzden geliştirilmiştir.' }
        ],
        lab: LAB('semaphore', 'Synchronization laboratuvarında semaforla kritik bölümü koru'),
        checks: [
          { q: 'Sayan ve ikili semafor arasındaki fark nedir?', a: 'Sayan semafor sınırsız aralıkta değişir. İkili semafor yalnızca 0 veya 1 olur ve mutex gibi davranır.' },
          { q: 'S1\'in S2\'den önce çalışması semaforla nasıl sağlanır?', a: 'synch = 0 ile başlanır. P1: S1; signal(synch). P2: wait(synch); S2.' },
          { q: 'Meşgul beklemesiz gerçekleştirmede value = −2 ne demektir?', a: 'İki işlem semaforun bekleme kuyruğundadır.' }
        ]
      },
      {
        id: 'monitor',
        title: 'Monitörler ve Koşul Değişkenleri',
        en: 'Monitors & Condition Variables',
        slides: '6.43 – 6.56, 6.62',
        minutes: 13,
        blocks: [
          { t: 'def', term: 'Monitör', en: 'Monitor', html: 'İşlem senkronizasyonu için kullanışlı ve etkili <b>yüksek seviyeli soyutlama</b>. <b>Soyut veri türüdür (abstract data type)</b>: iç değişkenlerine yalnızca monitörün kendi yordamları erişebilir. <b>Aynı anda monitör içinde yalnızca bir işlem aktif olabilir</b>; bunu programcı değil monitör yapısı sağlar.' },
          { t: 'codex', title: 'Sözde kod (slayt 6.43)', rows: [
            ['monitor monitor-name {', 'Monitörün adı.'],
            ['    // shared variable declarations', 'Paylaşılan değişkenler: yalnızca içerideki yordamlar erişir.'],
            ['    procedure P1 (...) { ... }\n    procedure P2 (...) { ... }\n    procedure Pn (...) { ... }', 'Dışarıya açık işlemler (operations). Bir işlem bunlardan birini çağırarak monitöre girer.'],
            ['    initialization code (...) { ... }\n}', 'Başlangıç kodu: paylaşılan değişkenlere ilk değerlerini verir.']
          ] },
          { t: 'p', html: 'Şematik görünümde (slayt 6.44) monitör; paylaşılan veri, işlemler ve başlangıç kodundan oluşur. İçeride biri varken gelenler <b>giriş kuyruğunda (entry queue)</b> bekler. Koşul değişkenli monitörde (slayt 6.47) her koşulun da <b>kendi bekleme kuyruğu</b> vardır.' },
          { t: 'h', text: 'Koşul değişkenleri' },
          { t: 'def', term: 'Koşul değişkeni', en: 'Condition variable', html: '<code>condition x, y;</code> ile tanımlanır ve iki işleme izin verir. <code>x.wait()</code> çağıran işlemi, biri <code>x.signal()</code> yapana kadar askıya alır. <code>x.signal()</code> x\'te bekleyenlerden <b>birini</b> devam ettirir; <b>bekleyen yoksa hiçbir etkisi yoktur</b> (semafordaki signal ise değeri her durumda artırır).' },
          { t: 'codex', title: 'Örnek: S1, S2\'den önce çalışsın (slayt 6.48 ve 6.62)', rows: [
            ['/* monitör içinde */\ncondition x;\nboolean done = false;', 'P1 F1\'i, P2 F2\'yi çağırır. done, S1\'in bitip bitmediğini tutar.'],
            ['F1:  S1;', 'P1 S1\'i çalıştırır.'],
            ['     done = true;', 'S1\'in bittiğini kaydeder.'],
            ['     x.signal();', 'x\'te bekleyen (P2) varsa uyandırır; yoksa etkisiz.'],
            ['F2:  if (done == false)\n         x.wait();', 'S1 henüz bitmediyse P2 x\'te bekler. Bittiyse beklemeden geçer.'],
            ['     S2;', 'S2 her durumda S1\'den sonra çalışır.']
          ] },
          { t: 'note', kind: 'warn', attach: true, html: 'Slayt "x koşul değişkeni 0\'la başlatılır" der; ama koşul değişkeninin semafor gibi bir <b>değeri yoktur</b>, yalnızca bekleme kuyruğu vardır. Hatırlanması gereken durum <code>done</code>\'da tutulur. Slayttaki <code>if done = false</code> da sözde koddur; anlamı <code>done == false</code>\'dur. Slayt 6.62 bu örneğin tekrarıdır.' },
          { t: 'h', text: 'Semaforlarla gerçekleştirme' },
          { t: 'p', html: 'Monitör bir dil yapısıdır; derleyici onu semaforlarla gerçekleştirebilir. İlk sürüm (slayt 6.45) yalnızca <code>mutex = 1</code> kullanır ve her yordamı <code>wait(mutex) … signal(mutex)</code> arasına alır. Koşul değişkenleri eklenince (slayt 6.49 – 6.51) şu değişkenler gerekir:' },
          { t: 'codex', title: 'Monitörün kendisi', rows: [
            ['semaphore mutex;   // = 1', 'Monitöre giriş kilidi: içeride tek işlem.'],
            ['semaphore next;    // = 0', 'signal yapan işlemin kendini uyuttuğu yer.'],
            ['int next_count = 0;', 'next üzerinde bekleyen (monitör içinde askıda kalmış) işlem sayısı.'],
            ['wait(mutex);\n    ... body of P ...', 'Her yordam P: önce monitöre gir, sonra asıl işi yap.'],
            ['if (next_count > 0)\n    signal(next);\nelse\n    signal(mutex);', 'Çıkarken: içeride askıda bekleyen varsa önce <b>ona</b> devret; yoksa monitörü dışarıdakilere aç.']
          ] },
          { t: 'codex', title: 'Her koşul değişkeni x için', rows: [
            ['semaphore x_sem;   // = 0\nint x_count = 0;', 'x\'te bekleyenleri uyutan semafor ve bekleyen sayısı.'],
            ['/* x.wait() */\nx_count++;', 'Bekleyen sayısını artır.'],
            ['if (next_count > 0)\n    signal(next);\nelse\n    signal(mutex);', 'Uyumadan önce monitörü bırak (yoksa kimse giremez ve signal yapamaz).'],
            ['wait(x_sem);\nx_count--;', 'x_sem\'de uyu; uyandırılınca sayıyı azalt.'],
            ['/* x.signal() */\nif (x_count > 0) {', 'Yalnızca x\'te bekleyen varsa bir şey yap (yoksa etkisiz).'],
            ['    next_count++;\n    signal(x_sem);', 'Bekleyeni uyandır.'],
            ['    wait(next);\n    next_count--;\n}', 'Monitörde aynı anda tek işlem olabileceği için signal yapan, uyandırdığı işlem işini bitirene kadar next\'te bekler.']
          ] },
          { t: 'h', text: 'Hangi işlem uyandırılır?' },
          { t: 'p', html: 'x\'te birden çok işlem bekliyorsa ve <code>x.signal()</code> yapılırsa hangisi devam eder? FCFS çoğu zaman yeterli değildir (slayt 6.52). <b>Koşullu bekleme (conditional-wait)</b> <code>x.wait(c)</code> ile her bekleyene <b>öncelik numarası c</b> verilir; <b>en küçük numaralı</b> (en yüksek öncelikli) işlem uyandırılır.' },
          { t: 'p', html: '<b>Tek kaynak ayırma (slayt 6.53 – 6.55):</b> Bir kaynağı yarışan işlemler arasında paylaştırırken c, işlemin kaynağı kullanmayı planladığı <b>en uzun süredir</b>. En kısa süreli işlem kaynağı önce alır (SJF\'e benzer).' },
          { t: 'codex', title: 'ResourceAllocator monitörü', rows: [
            ['monitor ResourceAllocator {\n    boolean busy;\n    condition x;', 'busy: kaynak kullanımda mı? x: kaynağı bekleyenlerin kuyruğu.'],
            ['    void acquire(int time) {\n        if (busy)\n            x.wait(time);', 'Kaynak meşgulse, kullanacağı süreyi öncelik numarası yaparak bekle.'],
            ['        busy = true;\n    }', 'Kaynağı al.'],
            ['    void release() {\n        busy = false;\n        x.signal();\n    }', 'Kaynağı bırak ve bekleyenlerden <b>en kısa süreli</b> olanı uyandır.'],
            ['    initialization code() {\n        busy = false;\n    }\n}', 'Başlangıçta kaynak boş.']
          ] },
          { t: 'codex', title: 'Kullanım (slayt 6.54): R bir ResourceAllocator örneği', rows: [
            ['R.acquire(t);', 'Kaynağı iste; t, kaynağı en fazla ne kadar kullanacağın.'],
            ['    ... access the resource ...', 'Kaynağı kullan.'],
            ['R.release();', 'Kaynağı bırak; sıradaki en kısa süreli bekleyen alır.']
          ] },
          { t: 'note', kind: 'exam', html: 'Monitörler de yanlış kullanılabilir (slayt 6.56): <code>release() … acquire()</code>, <code>acquire() … acquire()</code> ya da birinin unutulması. Semafordaki hataların aynısı.' }
        ],
        checks: [
          { q: 'Monitör karşılıklı dışlamayı nasıl sağlar?', a: 'Aynı anda monitör içinde yalnızca bir işlem aktif olabilir; bunu monitör yapısı sağlar.' },
          { q: 'x.signal() ile semaforun signal() işlemi arasındaki fark nedir?', a: 'Bekleyen yoksa x.signal()\'in etkisi yoktur. Semaforda signal() değeri her zaman artırır.' },
          { q: 'x.wait(c) ne sağlar?', a: 'Bekleyenlere öncelik numarası verir. x.signal() en küçük numaralı işlemi uyandırır.' }
        ]
      },
      {
        id: 'canlilik',
        title: 'Canlılık: Kilitlenme, Açlık, Öncelik Tersinmesi',
        en: 'Liveness',
        slides: '6.57 – 6.61',
        minutes: 7,
        blocks: [
          { t: 'def', term: 'Canlılık', en: 'Liveness', html: 'İşlemlerin ilerlemesini sağlamak için sistemin karşılaması gereken özellikler. İşlemler mutex veya semafor gibi bir aracı alırken <b>süresiz beklemek</b> zorunda kalabilir; bu, bölüm başındaki ilerleme ve sınırlı bekleme ölçütlerini ihlal eder ve bir <b>canlılık hatasıdır (liveness failure)</b>.' },
          { t: 'h', text: 'Kilitlenme' },
          { t: 'def', term: 'Kilitlenme', en: 'Deadlock', html: 'İki veya daha fazla işlemin, <b>yalnızca bekleyen işlemlerden birinin</b> tetikleyebileceği bir olayı süresiz beklemesi. Asıl ayrıntısı bir sonraki bölümün konusudur; vizede bu tanım ve aşağıdaki örnek yeterlidir.' },
          { t: 'codex', title: 'Slayt 6.58: S ve Q semaforları 1\'den başlar', rows: [
            ['P0: wait(S);      P1: wait(Q);', 'P0 S\'yi, P1 Q\'yu alır. İki semafor da 0 olur.'],
            ['P0: wait(Q);      P1: wait(S);', 'P0, P1\'in tuttuğu Q\'yu bekler; P1, P0\'ın tuttuğu S\'yi bekler.'],
            ['    ...               ...', 'Buraya hiçbiri ulaşamaz.'],
            ['P0: signal(S);    P1: signal(Q);\nP0: signal(Q);    P1: signal(S);', 'Bu signal\'ler hiç çalışmayacağı için P0 ve P1 <b>kilitlenir (deadlock)</b>.']
          ] },
          { t: 'dg', id: 'deadlock' },
          { t: 'h', text: 'Açlık ve öncelik tersinmesi' },
          { t: 'def', term: 'Açlık', en: 'Starvation', html: 'Süresiz engellenme: işlem, askıya alındığı semafor kuyruğundan hiç çıkarılmayabilir (ör. kuyruk LIFO işletilirse).' },
          { t: 'def', term: 'Öncelik tersinmesi', en: 'Priority inversion', html: 'Yüksek öncelikli işlemin ihtiyaç duyduğu kilidi düşük öncelikli işlemin tutmasıyla ortaya çıkan planlama sorunu. <b>Öncelik kalıtımı protokolüyle (priority-inheritance protocol)</b> çözülür.' },
          { t: 'h', text: 'Öncelik kalıtımı' },
          { t: 'list', ordered: true, items: [
            'Öncelik sırası P1 &gt; P2 &gt; P3. P3, S semaforunu tutuyor; P1, S\'nin bırakılmasını bekliyor.',
            'P2 CPU\'yu alıp P3\'ü keser. P3 hâlâ S\'yi tutar, P1 hâlâ bekler.',
            'Böylece P1\'den düşük öncelikli P2, P3\'ün kaynağı bırakmasını engelleyerek P1\'in beklemesini dolaylı olarak uzatır.',
            '<b>Çözüm:</b> Kaynağı tutan işlem, o kaynağı bekleyenlerin <b>en yüksek önceliğini geçici olarak devralır</b>. P3 P1\'in önceliğiyle çalışır, P2 onu kesemez; P3 S\'yi bırakınca eski önceliğine döner ve P1 girer.'
          ] }
        ],
        checks: [
          { q: 'Kilitlenme ve açlık arasındaki fark nedir?', a: 'Kilitlenmede işlemler birbirinin yapacağı olayı bekler ve hiçbiri ilerleyemez. Açlıkta sistem ilerler ama bir işlem sürekli sırasını kaçırır.' },
          { q: 'Öncelik tersinmesi nasıl çözülür?', a: 'Öncelik kalıtımıyla: kaynağı tutan düşük öncelikli işlem, geçici olarak bekleyen en yüksek önceliği alır ve kesilmeden kaynağı bırakır.' },
          { q: 'Slayt 6.58\'de P0 ve P1 neden kilitlenir?', a: 'P0 S\'yi, P1 Q\'yu aldıktan sonra her biri diğerinin tuttuğunu bekler. signal\'lere hiç ulaşılamaz.' }
        ]
      }
    ]
  });
})(window.OSLab = window.OSLab || {});
