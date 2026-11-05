/*
 * lessons-ch6.js — Bölüm 6: Senkronizasyon (ch06_TR.pdf, Silberschatz 10. baskı).
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
          { t: 'p', html: 'İşlemler eşzamanlı yürütülür ve herhangi bir anda kesilebilir. <b>Paylaşılan veriye eşzamanlı erişim veri tutarsızlığına yol açabilir.</b> Tutarlılığı korumak için işbirlikçi işlemlerin düzenli yürütülmesini sağlayan mekanizmalar gerekir. Sınırlı tampondaki <code>counter</code> örneğini Bölüm 3\'te gördük.' },
          { t: 'note', kind: 'exam', attach: true, html: '<b>Örnek:</b> P0 ve P1 <code>fork()</code> ile çocuk oluşturuyor. <code>next_available_pid</code> üzerinde yarış oluşur; erişim denetlenmezse <b>aynı pid iki işleme atanabilir</b>.' },
          { t: 'def', term: 'Kritik bölüm', en: 'Critical section', html: 'İşlemin ortak değişkenleri değiştirdiği, tablo güncellediği veya dosya yazdığı kod bölümü. <b>Bir işlem kritik bölümdeyken başka hiçbir işlem kritik bölümde olmamalıdır.</b> Problem, bunu sağlayan protokolü tasarlamaktır.' },
          { t: 'code', text: 'while (true) {\n    entry section      /* giriş izni iste */\n        critical section\n    exit section       /* çıkışı bildir */\n        remainder section\n}' },
          { t: 'h', text: 'Çözümün üç gereksinimi' },
          { t: 'table', head: ['Gereksinim', 'Anlamı'], rows: [
            ['Karşılıklı dışlama (mutual exclusion)', 'Pi kritik bölümdeyse başka hiçbir işlem kritik bölümde olamaz'],
            ['İlerleme (progress)', 'Kritik bölüm boşsa ve girmek isteyen varsa, sıradakinin seçimi süresiz ertelenemez'],
            ['Sınırlı bekleme (bounded waiting)', 'Bir işlem istekte bulunduktan sonra, diğerlerinin kritik bölüme girme sayısının bir sınırı vardır']
          ] },
          { t: 'p', html: 'Her işlemin sıfır olmayan bir hızla yürüdüğü varsayılır; N işlemin göreli hızı hakkında varsayım yapılmaz.' },
          { t: 'h', text: 'Kesme tabanlı çözüm yeterli mi?' },
          { t: 'p', html: 'Giriş bölümünde kesmeleri kapat, çıkışta aç. Sorunlar: kritik bölüm <b>bir saat sürerse</b> ne olur? Bazı işlemler <b>açlık</b> yaşayabilir. <b>İki CPU varsa</b> diğer CPU\'daki işlem durdurulmaz.' }
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
        minutes: 8,
        blocks: [
          { t: 'h', text: 'Yazılım çözümü 1: turn' },
          { t: 'p', html: 'İki işlem <code>int turn</code> değişkenini paylaşır; sıranın kimde olduğunu gösterir. LOAD ve STORE komutlarının <b>atomik</b> olduğu varsayılır.' },
          { t: 'code', text: 'while (true) {\n    while (turn == j)\n        ;\n    /* critical section */\n    turn = j;\n    /* remainder section */\n}' },
          { t: 'note', kind: 'info', attach: true, html: 'Karşılıklı dışlama sağlanır ama <b>ilerleme sağlanmaz</b>: sıra j\'deyken j kritik bölüme girmek istemezse, kritik bölüm boş olsa bile i giremez.' },
          { t: 'h', text: 'Peterson çözümü' },
          { t: 'def', term: 'Peterson çözümü', en: 'Peterson\'s Solution', html: 'İki işlem için yazılım tabanlı çözüm. İki değişken paylaşılır: <code>int turn</code> sıranın kimde olduğunu, <code>boolean flag[2]</code> işlemin girmeye hazır olduğunu gösterir.' },
          { t: 'code', text: 'while (true) {\n    flag[i] = true;\n    turn = j;\n    while (flag[j] && turn == j)\n        ;\n    /* critical section */\n    flag[i] = false;\n    /* remainder section */\n}' },
          { t: 'dg', id: 'peterson' },
          { t: 'h', text: 'Üç gereksinim karşılanır' },
          { t: 'list', ordered: true, items: [
            '<b>Karşılıklı dışlama:</b> Pi yalnızca <code>flag[j] == false</code> veya <code>turn == i</code> ise girer.',
            '<b>İlerleme:</b> diğer işlem girmek istemiyorsa Pi beklemez.',
            '<b>Sınırlı bekleme:</b> Pi, Pj\'nin en fazla bir girişinden sonra kritik bölüme girer.'
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
        minutes: 6,
        blocks: [
          { t: 'p', html: 'Peterson çözümü algoritmayı göstermek için yararlıdır ama <b>modern mimarilerde çalışması garanti değildir</b>. İşlemciler ve derleyiciler performans için <b>bağımlılığı olmayan işlemlerin sırasını değiştirebilir</b>. Tek iş parçacığında sonuç aynıdır; çok iş parçacığında tutarsız sonuç çıkabilir.' },
          { t: 'code', text: 'boolean flag = false;  int x = 0;\n\n/* İş parçacığı 1 */          /* İş parçacığı 2 */\nwhile (!flag)                 x = 100;\n    ;                         flag = true;\nprint x\n\n/* Beklenen çıktı: 100 */\n/* flag ve x bağımsız olduğu için 2. iş parçacığında sıra\n   değişirse (flag önce yazılırsa) çıktı 0 olabilir! */' },
          { t: 'p', html: 'Peterson\'da <code>flag[i] = true</code> ve <code>turn = j</code> yer değiştirirse <b>iki işlem aynı anda kritik bölümde olabilir</b>. Çözüm <b>bellek bariyeridir</b>.' },
          { t: 'h', text: 'Bellek modelleri' },
          { t: 'compare', cols: [
            { title: 'Güçlü sıralı (strongly ordered)', items: ['Bir işlemcinin bellek değişikliği diğerlerine <b>hemen görünür</b>'] },
            { title: 'Zayıf sıralı (weakly ordered)', items: ['Değişiklik diğer işlemcilere <b>hemen görünmeyebilir</b>'] }
          ] },
          { t: 'def', term: 'Bellek bariyeri', en: 'Memory barrier', html: 'Bellekteki her değişikliğin diğer işlemcilere görünür olmasını zorlayan komut. Bariyerden önceki tüm yüklemeler ve saklamalar, sonraki işlemlerden <b>önce tamamlanır</b>.' },
          { t: 'code', text: '/* İş parçacığı 1 */            /* İş parçacığı 2 */\nwhile (!flag)                   x = 100;\n    memory_barrier();           memory_barrier();\nprint x                         flag = true;\n\n/* 1: flag, x\'ten önce okunur. 2: x, flag\'den önce yazılır. Çıktı 100. */' }
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
        minutes: 9,
        blocks: [
          { t: 'p', html: 'Çoğu sistem kritik bölüm için donanım desteği sağlar. Kesmeleri kapatmak çok işlemcili sistemde uygun değildir. Kalan yol <b>özel makine komutları</b> ve <b>kilit değişkenleridir</b>: bir kelimeyi test edip değiştirmeyi veya iki kelimeyi değiş tokuş etmeyi <b>atomik</b> yaparlar.' },
          { t: 'code', text: 'do {\n    acquire_lock(lock);\n        critical section\n    release_lock(lock);\n        remainder section\n} while (TRUE);' },
          { t: 'h', text: 'test_and_set' },
          { t: 'code', text: 'boolean test_and_set(boolean *target) {\n    boolean rv = *target;\n    *target = true;\n    return rv;           /* eski değer */\n}\n\n/* lock başlangıçta false */\ndo {\n    while (test_and_set(&lock))\n        ;\n    /* critical section */\n    lock = false;\n    /* remainder section */\n} while (true);' },
          { t: 'h', text: 'compare_and_swap' },
          { t: 'code', text: 'int compare_and_swap(int *value, int expected, int new_value) {\n    int temp = *value;\n    if (*value == expected)\n        *value = new_value;\n    return temp;         /* eski değer */\n}\n\n/* lock başlangıçta 0 */\nwhile (true) {\n    while (compare_and_swap(&lock, 0, 1) != 0)\n        ;\n    /* critical section */\n    lock = 0;\n    /* remainder section */\n}' },
          { t: 'note', kind: 'exam', html: 'İki komut da <b>atomik</b> yürür ve parametrenin <b>orijinal değerini</b> döndürür. test_and_set her zaman true yazar; compare_and_swap yalnızca <code>*value == expected</code> ise yazar. Intel x86\'da karşılığı EXCH komutudur.' },
          { t: 'h', text: 'Sınırlı bekleme' },
          { t: 'p', html: 'Yukarıdaki çözümler karşılıklı dışlamayı sağlar ama sınırlı beklemeyi sağlamaz. <code>waiting[]</code> dizisiyle işlem çıkarken sıradaki bekleyeni dairesel olarak arar:' },
          { t: 'code', text: 'while (true) {\n    waiting[i] = true;\n    key = 1;\n    while (waiting[i] && key == 1)\n        key = compare_and_swap(&lock, 0, 1);\n    waiting[i] = false;\n    /* critical section */\n    j = (i + 1) % n;\n    while ((j != i) && !waiting[j])\n        j = (j + 1) % n;\n    if (j == i)\n        lock = 0;\n    else\n        waiting[j] = false;\n    /* remainder section */\n}' },
          { t: 'h', text: 'Atomik değişkenler' },
          { t: 'p', html: 'compare_and_swap gibi komutlar başka araçların yapı taşıdır. <b>Atomik değişken</b>, tamsayı ve mantıksal türlerde kesintisiz güncelleme sağlar:' },
          { t: 'code', text: 'void increment(atomic_int *v) {\n    int temp;\n    do {\n        temp = *v;\n    } while (temp != compare_and_swap(v, temp, temp + 1));\n}' }
        ],
        checks: [
          { q: 'test_and_set ne yapar?', a: 'Atomik olarak hedefin eski değerini döndürür ve hedefi true yapar.' },
          { q: 'compare_and_swap ile test_and_set arasındaki fark nedir?', a: 'test_and_set her zaman true yazar. compare_and_swap yalnızca değer beklenene eşitse yeni değeri yazar. İkisi de eski değeri döndürür.' },
          { q: 'Bounded-waiting sürümünde waiting[] dizisi ne işe yarar?', a: 'Çıkan işlem sıradaki bekleyeni dairesel arar ve ona izin verir. Böylece her işlem en fazla n−1 giriş bekler.' }
        ]
      },
      {
        id: 'mutex',
        title: 'Mutex Kilitleri',
        en: 'Mutex Locks',
        slides: '6.32 – 6.33',
        minutes: 3,
        blocks: [
          { t: 'def', term: 'Mutex kilidi', en: 'Mutex lock', html: 'Önceki çözümler karmaşıktır ve uygulama programcısına kapalıdır. Mutex en basit yazılım aracıdır: kilidin müsait olup olmadığını gösteren <b>mantıksal değişken</b>. Kritik bölüm önce <code>acquire()</code>, sonra <code>release()</code> ile korunur.' },
          { t: 'code', text: 'while (true) {\n    acquire lock\n        critical section\n    release lock\n        remainder section\n}' },
          { t: 'list', items: [
            '<code>acquire()</code> ve <code>release()</code> <b>atomik</b> olmalıdır; genellikle compare_and_swap ile gerçekleştirilir.',
            'Bu çözüm <b>meşgul bekleme (busy waiting)</b> gerektirir; bu nedenle bu kilide <b>spinlock</b> denir.'
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
        minutes: 10,
        blocks: [
          { t: 'def', term: 'Semafor', en: 'Semaphore', html: 'Mutex\'ten daha gelişmiş senkronizasyon aracı. <b>S tamsayı değişkenine</b> yalnızca iki atomik işlemle erişilir: <code>wait()</code> ve <code>signal()</code> (ilk adları P ve V).' },
          { t: 'code', text: 'wait(S) {\n    while (S <= 0)\n        ;    // meşgul bekleme\n    S--;\n}\n\nsignal(S) {\n    S++;\n}' },
          { t: 'compare', cols: [
            { title: 'Sayan semafor (counting)', items: ['Değer sınırsız bir aralıkta değişir', 'Sayan semafor ikili semaforla gerçekleştirilebilir'] },
            { title: 'İkili semafor (binary)', items: ['Değer yalnızca 0 veya 1', 'Mutex kilidi gibi davranır'] }
          ] },
          { t: 'h', text: 'Kullanım örnekleri' },
          { t: 'code', text: '/* Kritik bölüm: mutex = 1 */\nwait(mutex);\n    CS\nsignal(mutex);\n\n/* S1, S2\'den önce çalışsın: synch = 0 */\nP1:  S1;                 P2:  wait(synch);\n     signal(synch);           S2;' },
          { t: 'h', text: 'Meşgul beklemeden gerçekleştirme' },
          { t: 'p', html: 'wait ve signal aynı semaforda aynı anda çalışmamalıdır, bu yüzden kendileri bir kritik bölüm problemidir. Kod kısa olduğu için orada meşgul bekleme azdır; ama uygulamalar kritik bölümde uzun kalabildiğinden <b>meşgul bekleme iyi çözüm değildir</b>. Bu yüzden her semaforun bir <b>bekleme kuyruğu</b> vardır. <b>block</b> işlemi kuyruğa koyar, <b>wakeup</b> kuyruktan alıp hazır kuyruğuna taşır.' },
          { t: 'code', text: 'typedef struct {\n    int value;\n    struct process *list;\n} semaphore;\n\nwait(semaphore *S) {\n    S->value--;\n    if (S->value < 0) {\n        add this process to S->list;\n        block();\n    }\n}\n\nsignal(semaphore *S) {\n    S->value++;\n    if (S->value <= 0) {\n        remove a process P from S->list;\n        wakeup(P);\n    }\n}' },
          { t: 'dg', id: 'semtrace' },
          { t: 'h', text: 'Yanlış kullanım' },
          { t: 'list', items: [
            '<code>signal(mutex) … wait(mutex)</code>: karşılıklı dışlama bozulur.',
            '<code>wait(mutex) … wait(mutex)</code>: işlem kendini kilitler.',
            '<code>wait</code> veya <code>signal</code>\'in unutulması da benzer sorunlar yaratır.'
          ] }
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
        slides: '6.43 – 6.56',
        minutes: 10,
        blocks: [
          { t: 'def', term: 'Monitör', en: 'Monitor', html: 'Senkronizasyon için <b>yüksek seviyeli soyutlama</b>. Soyut veri türüdür: iç değişkenlerine yalnızca içindeki kod erişebilir. <b>Aynı anda monitör içinde yalnızca bir işlem aktif olabilir.</b>' },
          { t: 'code', text: 'monitor monitor-name {\n    // paylaşılan değişken bildirimleri\n    procedure P1 (...) { ... }\n    procedure P2 (...) { ... }\n    procedure Pn (...) { ... }\n    initialization code (...) { ... }\n}' },
          { t: 'def', term: 'Koşul değişkeni', en: 'Condition variable', html: '<code>condition x, y;</code> iki işleme izin verir. <code>x.wait()</code> çağıran işlemi askıya alır. <code>x.signal()</code> bekleyen işlemlerden birini uyandırır; <b>bekleyen yoksa etkisi yoktur</b> (semafordaki signal\'in aksine).' },
          { t: 'p', html: 'Örnek: S1, S2\'den önce çalışsın. Monitörde F1 ve F2 yordamları, x koşulu ve <code>done</code> değişkeni olur:' },
          { t: 'code', text: 'F1:  S1;                     F2:  if (done == false)\n     done = true;                     x.wait();\n     x.signal();                 S2;' },
          { t: 'h', text: 'Semaforlarla gerçekleştirme' },
          { t: 'code', text: 'semaphore mutex = 1;  semaphore next = 0;\nint next_count = 0;   /* monitör içinde bekleyen */\n\n/* Her P yordamı */\nwait(mutex);\n    ... body of P ...\nif (next_count > 0) signal(next);\nelse                signal(mutex);\n\n/* Her x için */\nsemaphore x_sem = 0;  int x_count = 0;\n\n/* x.wait() */                  /* x.signal() */\nx_count++;                      if (x_count > 0) {\nif (next_count > 0)                 next_count++;\n    signal(next);                   signal(x_sem);\nelse                                wait(next);\n    signal(mutex);                  next_count--;\nwait(x_sem);                    }\nx_count--;' },
          { t: 'h', text: 'Hangi işlem uyandırılır?' },
          { t: 'p', html: 'FCFS çoğu zaman yeterli değildir. <code>x.wait(c)</code> ile <b>öncelik numarası</b> verilir; <b>en küçük numaralı</b> işlem uyandırılır. Tek kaynak ayırma örneğinde c, işlemin kaynağı kullanmayı planladığı en uzun süredir; en kısa süreli işlem kaynağı önce alır.' },
          { t: 'code', text: 'monitor ResourceAllocator {\n    boolean busy;\n    condition x;\n    void acquire(int time) {\n        if (busy)\n            x.wait(time);\n        busy = true;\n    }\n    void release() {\n        busy = false;\n        x.signal();\n    }\n    initialization code() {\n        busy = false;\n    }\n}\n\n/* Kullanım */\nR.acquire(t);\n    ... kaynağa eriş ...\nR.release();' },
          { t: 'note', kind: 'exam', html: 'Monitörler de yanlış kullanılabilir: <code>release() … acquire()</code>, <code>acquire() … acquire()</code> ya da birinin unutulması.' }
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
        minutes: 6,
        blocks: [
          { t: 'def', term: 'Canlılık', en: 'Liveness', html: 'İşlemlerin ilerlemesini sağlamak için sistemin karşılaması gereken özellikler. Bir kilit veya semafor için <b>süresiz beklemek</b>, ilerleme ve sınırlı bekleme ölçütlerini ihlal eder ve bir <b>canlılık hatasıdır</b>.' },
          { t: 'def', term: 'Kilitlenme', en: 'Deadlock', html: 'İki veya daha fazla işlemin, yalnızca bekleyen işlemlerden birinin yapabileceği bir olayı <b>süresiz beklemesi</b>.' },
          { t: 'code', text: 'P0                P1\nwait(S);          wait(Q);\nwait(Q);          wait(S);\n ...               ...\nsignal(S);        signal(Q);\nsignal(Q);        signal(S);' },
          { t: 'dg', id: 'deadlock' },
          { t: 'def', term: 'Açlık', en: 'Starvation', html: 'Süresiz engellenme: işlem askıda olduğu semafor kuyruğundan hiç çıkarılmayabilir.' },
          { t: 'def', term: 'Öncelik tersinmesi', en: 'Priority inversion', html: 'Yüksek öncelikli işlemin ihtiyaç duyduğu kilidi düşük öncelikli işlemin tutması. <b>Öncelik kalıtımı protokolüyle</b> çözülür.' },
          { t: 'h', text: 'Öncelik kalıtımı' },
          { t: 'list', ordered: true, items: [
            'Öncelik sırası P1 &gt; P2 &gt; P3. P3, S semaforunu tutuyor; P1, S\'yi bekliyor.',
            'P2 CPU\'yu alıp P3\'ü keser. P3 S\'yi bırakamaz, P1 beklemeye devam eder.',
            'Böylece P1\'den düşük öncelikli P2, P1\'in beklemesini dolaylı olarak uzatır.',
            '<b>Çözüm:</b> Kaynağı tutan işlem, kaynağı bekleyenlerin <b>en yüksek önceliğini devralır</b>. P3 kısa sürede biter ve S\'yi bırakır.'
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
