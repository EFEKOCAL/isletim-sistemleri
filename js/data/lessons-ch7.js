/*
 * lessons-ch7.js — Bölüm 7: Senkronizasyon Örnekleri (ch07.pdf, Silberschatz 10. baskı).
 */
(function (OSLab) {
  'use strict';

  OSLab.lessons = OSLab.lessons || { chapters: [] };

  OSLab.lessons.chapters.push({
    id: 'ch7',
    num: 7,
    title: 'Senkronizasyon Örnekleri',
    en: 'Synchronization Examples',
    source: 'ch07.pdf',
    objectives: [
      'Sınırlı tampon, okuyucu-yazar ve yemek yiyen filozoflar problemlerini açıklamak',
      'Linux ve Windows\'un senkronizasyon araçlarını tanımak',
      'POSIX ve Java ile senkronizasyon problemlerini çözmek'
    ],
    lessons: [
      {
        id: 'sinirli-tampon',
        title: 'Sınırlı Tampon Problemi',
        en: 'The Bounded-Buffer Problem',
        slides: '7.3 – 7.6',
        minutes: 5,
        blocks: [
          { t: 'p', html: 'Yeni senkronizasyon yöntemlerini test etmek için üç klasik problem kullanılır: <b>sınırlı tampon</b>, <b>okuyucular-yazarlar</b>, <b>yemek yiyen filozoflar</b>.' },
          { t: 'table', head: ['Semafor', 'Başlangıç', 'Görevi'], rows: [
            ['mutex', '1', 'Tampona erişimde karşılıklı dışlama'],
            ['empty', 'n', 'Boş yuva sayısı'],
            ['full', '0', 'Dolu yuva sayısı']
          ] },
          { t: 'code', text: '/* Üretici */                /* Tüketici */\nwhile (true) {               while (true) {\n    /* üret */                   wait(full);\n    wait(empty);                 wait(mutex);\n    wait(mutex);                 /* tampondan al */\n    /* tampona koy */            signal(mutex);\n    signal(mutex);               signal(empty);\n    signal(full);                /* tüket */\n}                            }' },
          { t: 'note', kind: 'exam', html: 'Sıra önemlidir: <b>önce sayan semafor (empty/full), sonra mutex</b>. Üretici önce mutex alır ve tampon doluysa <code>wait(empty)</code>\'te uyursa, tüketici mutex\'i alamaz: kilitlenme.' }
        ],
        lab: { label: 'Synchronization laboratuvarında üretici-tüketiciyi çalıştır, hatalı sıralamayı dene', preset: { module: 'sync', lab: 'pc', cfg: { size: 3, prod: 5, cons: 1, policy: 'auto', buggy: true } } },
        checks: [
          { q: 'mutex, empty ve full başlangıç değerleri nedir?', a: 'mutex = 1, empty = n, full = 0.' },
          { q: 'Üretici wait(mutex)\'i wait(empty)\'den önce çağırırsa ne olur?', a: 'Tampon doluysa mutex\'i tutarak uyur. Tüketici mutex\'i alamaz ve kilitlenme oluşur.' }
        ]
      },
      {
        id: 'okuyucu-yazar',
        title: 'Okuyucular-Yazarlar Problemi',
        en: 'The Readers-Writers Problem',
        slides: '7.7 – 7.11',
        minutes: 6,
        blocks: [
          { t: 'p', html: 'Bir veri kümesi eşzamanlı işlemlerce paylaşılır. <b>Okuyucular</b> yalnızca okur, <b>yazarlar</b> okuyup yazabilir. İstek: <b>birden çok okuyucu aynı anda okuyabilsin</b>, ama veriye aynı anda <b>yalnızca bir yazar</b> erişebilsin.' },
          { t: 'p', html: 'Paylaşılan veriler: <code>rw_mutex = 1</code>, <code>mutex = 1</code>, <code>read_count = 0</code>.' },
          { t: 'code', text: '/* Yazar */                 /* Okuyucu */\nwhile (true) {              while (true) {\n    wait(rw_mutex);             wait(mutex);\n    /* yaz */                   read_count++;\n    signal(rw_mutex);           if (read_count == 1)   /* ilk okuyucu */\n}                                   wait(rw_mutex);\n                                signal(mutex);\n                                /* oku */\n                                wait(mutex);\n                                read_count--;\n                                if (read_count == 0)   /* son okuyucu */\n                                    signal(rw_mutex);\n                                signal(mutex);\n                            }' },
          { t: 'dg', id: 'rwtrace' },
          { t: 'h', text: 'Çeşitleri' },
          { t: 'compare', cols: [
            { title: 'Birinci problem', items: ['Yukarıdaki çözüm', 'Yazar <b>hiç yazamayabilir</b>'] },
            { title: 'İkinci problem', items: ['Yazar hazır olunca <b>yeni gelen okuyucu okuyamaz</b>', 'Okuyucular aç kalabilir'] }
          ] },
          { t: 'p', html: 'İkisi de açlığa yol açabildiği için başka çeşitleri de vardır. Bazı sistemlerde çekirdek <b>okuyucu-yazar kilitleri</b> sağlayarak problemi çözer.' }
        ],
        checks: [
          { q: 'rw_mutex\'i okuyucular arasında kim alır, kim bırakır?', a: 'İlk okuyucu alır, son okuyucu bırakır.' },
          { q: 'Birinci ve ikinci okuyucu-yazar problemi arasındaki fark nedir?', a: 'Birincide okuyucular öncelikli olduğu için yazar aç kalabilir. İkincide yazar hazırsa yeni okuyucu okuyamaz; okuyucular aç kalabilir.' }
        ]
      },
      {
        id: 'filozoflar',
        title: 'Yemek Yiyen Filozoflar',
        en: 'The Dining-Philosophers Problem',
        slides: '7.12 – 7.16',
        minutes: 7,
        blocks: [
          { t: 'p', html: 'N filozof yuvarlak masada oturur; ortada pirinç kasesi vardır. Düşünmek ve yemek arasında gidip gelirler, komşularıyla konuşmazlar. Yemek için <b>iki çubuğu teker teker</b> almaları gerekir, bitince ikisini de bırakırlar. Beş filozof için paylaşılan veri: <code>semaphore chopstick[5]</code>, hepsi 1.' },
          { t: 'code', text: 'while (true) {\n    wait(chopstick[i]);\n    wait(chopstick[(i + 1) % 5]);\n    /* bir süre ye */\n    signal(chopstick[i]);\n    signal(chopstick[(i + 1) % 5]);\n    /* bir süre düşün */\n}' },
          { t: 'p', html: 'Slaytın sorusu: bu algoritmanın sorunu nedir? Adım adım gör:' },
          { t: 'dg', id: 'philosophers' },
          { t: 'h', text: 'Monitör çözümü' },
          { t: 'code', text: 'monitor DiningPhilosophers {\n    enum { THINKING, HUNGRY, EATING } state[5];\n    condition self[5];\n\n    void pickup(int i) {\n        state[i] = HUNGRY;\n        test(i);\n        if (state[i] != EATING)\n            self[i].wait();\n    }\n    void putdown(int i) {\n        state[i] = THINKING;\n        test((i + 4) % 5);   /* sol komşu */\n        test((i + 1) % 5);   /* sağ komşu */\n    }\n    void test(int i) {\n        if ((state[(i + 4) % 5] != EATING) &&\n            (state[i] == HUNGRY) &&\n            (state[(i + 1) % 5] != EATING)) {\n            state[i] = EATING;\n            self[i].signal();\n        }\n    }\n    initialization_code() {\n        for (int i = 0; i < 5; i++)\n            state[i] = THINKING;\n    }\n}\n\n/* Kullanım */\nDiningPhilosophers.pickup(i);\n    /* YE */\nDiningPhilosophers.putdown(i);' },
          { t: 'note', kind: 'exam', html: 'Filozof ancak <b>iki komşusu da yemiyorsa</b> yer. Bu yüzden <b>kilitlenme olmaz, ama açlık olabilir</b>.' }
        ],
        checks: [
          { q: 'Semafor çözümünün sorunu nedir?', a: 'Beş filozof aynı anda sol çubuğunu alırsa herkes sağ çubuğu bekler ve kilitlenme olur.' },
          { q: 'Monitör çözümünde filozof ne zaman yer?', a: 'Acıkmışsa ve sağındaki ile solundaki komşular yemiyorsa. Kilitlenme olmaz, açlık olabilir.' }
        ]
      },
      {
        id: 'cekirdek-sync',
        title: 'Çekirdekte Senkronizasyon: Windows ve Linux',
        en: 'Kernel Synchronization',
        slides: '7.17 – 7.20',
        minutes: 4,
        blocks: [
          { t: 'h', text: 'Windows' },
          { t: 'list', items: [
            'Tek işlemcili sistemde küresel kaynaklara erişimi <b>kesme maskeleriyle</b> korur.',
            'Çok işlemcili sistemde <b>spinlock</b> kullanır; spinlock tutan iş parçacığı kesilmez.',
            'Kullanıcı alanında mutex, semafor, olay ve zamanlayıcı olarak davranabilen <b>dispatcher nesneleri</b> sağlar. <b>Olay</b>, koşul değişkeni gibidir; <b>zamanlayıcı</b> süre dolunca iş parçacıklarını uyarır.',
            'Dispatcher nesnesi <b>signaled</b> (müsait) ya da <b>non-signaled</b> (iş parçacığı bloklanır) durumundadır. Mutex: iş parçacığı alınca non-signaled olur, sahibi bırakınca signaled olur.'
          ] },
          { t: 'h', text: 'Linux' },
          { t: 'list', items: [
            'Sürüm 2.6 öncesinde kısa kritik bölümler için kesmeleri kapatırdı; <b>2.6 ve sonrası tamamen kesilebilirdir</b>.',
            'Sağladıkları: semaforlar, atomik tamsayılar, spinlock\'lar ve ikisinin okuyucu-yazar sürümleri.',
            'Tek CPU\'lu sistemde spinlock yerine çekirdek kesilebilirliği açılıp kapatılır.'
          ] },
          { t: 'code', text: 'atomic_t counter;\nint value;\n\natomic_set(&counter, 5);      /* counter = 5  */\natomic_add(10, &counter);     /* counter = 15 */\natomic_sub(4, &counter);      /* counter = 11 */\natomic_inc(&counter);         /* counter = 12 */\nvalue = atomic_read(&counter); /* value = 12  */' }
        ],
        checks: [
          { q: 'Windows tek ve çok işlemcili sistemde kaynakları nasıl korur?', a: 'Tek işlemcide kesme maskeleriyle, çok işlemcide spinlock\'larla.' },
          { q: 'Dispatcher nesnesinin iki durumu nedir?', a: 'Signaled: nesne müsait. Non-signaled: iş parçacığı bloklanır.' }
        ]
      },
      {
        id: 'posix-sync',
        title: 'POSIX Senkronizasyonu',
        en: 'POSIX Synchronization',
        slides: '7.21 – 7.27',
        minutes: 6,
        blocks: [
          { t: 'p', html: 'POSIX API <b>mutex kilitleri</b>, <b>semaforlar</b> ve <b>koşul değişkenleri</b> sağlar; UNIX, Linux ve macOS\'ta yaygındır.' },
          { t: 'h', text: 'Mutex kilitleri' },
          { t: 'code', text: 'pthread_mutex_t mutex;\npthread_mutex_init(&mutex, NULL);\n\npthread_mutex_lock(&mutex);\n/* critical section */\npthread_mutex_unlock(&mutex);' },
          { t: 'h', text: 'Semaforlar' },
          { t: 'compare', cols: [
            { title: 'Adlandırılmış (named)', items: ['İlgisiz işlemler <b>adıyla</b> kullanabilir', '<code>sem = sem_open("SEM", O_CREAT, 0666, 1);</code>', '<code>sem_wait(sem);</code> ve <code>sem_post(sem);</code>'] },
            { title: 'Adsız (unnamed)', items: ['İlgisiz işlemler kullanamaz', '<code>sem_init(&amp;sem, 0, 1);</code>', '<code>sem_wait(&amp;sem);</code> ve <code>sem_post(&amp;sem);</code>'] }
          ] },
          { t: 'h', text: 'Koşul değişkenleri' },
          { t: 'p', html: 'C/C++\'ta monitör olmadığı için koşul değişkeni, karşılıklı dışlama sağlayan bir <b>mutex ile birlikte</b> kullanılır.' },
          { t: 'code', text: 'pthread_mutex_t mutex;\npthread_cond_t cond_var;\npthread_mutex_init(&mutex, NULL);\npthread_cond_init(&cond_var, NULL);\n\n/* a == b olmasını bekleyen */\npthread_mutex_lock(&mutex);\nwhile (a != b)\n    pthread_cond_wait(&cond_var, &mutex);\npthread_mutex_unlock(&mutex);\n\n/* Haber veren */\npthread_mutex_lock(&mutex);\na = b;\npthread_cond_signal(&cond_var);\npthread_mutex_unlock(&mutex);' }
        ],
        checks: [
          { q: 'Adlandırılmış ve adsız POSIX semaforu arasındaki fark nedir?', a: 'Adlandırılmış semaforu ilgisiz işlemler adıyla kullanabilir. Adsız semaforu kullanamaz.' },
          { q: 'POSIX koşul değişkeni neden mutex ile kullanılır?', a: 'C/C++\'ta monitör yoktur; karşılıklı dışlamayı mutex sağlar.' }
        ]
      },
      {
        id: 'java-sync',
        title: 'Java Senkronizasyonu',
        en: 'Java Synchronization',
        slides: '7.28 – 7.40',
        minutes: 7,
        blocks: [
          { t: 'def', term: 'Java monitörü', en: 'Java monitors', html: 'Her Java nesnesinin <b>tek bir kilidi</b> vardır. Metot <code>synchronized</code> ise çağıran iş parçacığı kilide sahip olmalıdır; başkasındaysa bekler. Kilit, sahibi metottan çıkınca bırakılır.' },
          { t: 'compare', cols: [
            { title: 'Giriş kümesi (entry set)', items: ['Müsait olmayan kilidi almaya çalışan iş parçacığı buraya konur'] },
            { title: 'Bekleme kümesi (wait set)', items: ['<code>wait()</code> çağrısı kilidi bırakır, durumu <b>blocked</b> yapar ve iş parçacığını buraya koyar'] }
          ] },
          { t: 'p', html: '<code>notify()</code> çağrısı bekleme kümesinden rastgele bir T seçer, <b>giriş kümesine</b> taşır ve durumunu <b>runnable</b> yapar. T artık kilit için yarışıp koşulu yeniden kontrol edebilir.' },
          { t: 'h', text: 'Sınırlı tampon: Java' },
          { t: 'code', text: 'public class BoundedBuffer<E> {\n    private static final int BUFFER_SIZE = 5;\n    private int count, in, out;   /* hepsi 0 ile başlar */\n    private E[] buffer;\n\n    /* Üreticiler çağırır */\n    public synchronized void insert(E item) {\n        while (count == BUFFER_SIZE) {\n            try { wait(); }\n            catch (InterruptedException ie) { }\n        }\n        buffer[in] = item;\n        in = (in + 1) % BUFFER_SIZE;\n        count++;\n        notify();\n    }\n\n    /* Tüketiciler çağırır */\n    public synchronized E remove() {\n        E item;\n        while (count == 0) {\n            try { wait(); }\n            catch (InterruptedException ie) { }\n        }\n        item = buffer[out];\n        out = (out + 1) % BUFFER_SIZE;\n        count--;\n        notify();\n        return item;\n    }\n}' },
          { t: 'h', text: 'Reentrant lock, semafor, koşul değişkeni' },
          { t: 'code', text: 'Lock key = new ReentrantLock();\nkey.lock();\ntry {\n    /* critical section */\n} finally {\n    key.unlock();   /* istisna olsa da kilit bırakılır */\n}\n\nSemaphore sem = new Semaphore(1);    /* yapıcı: Semaphore(int value) */\ntry {\n    sem.acquire();\n    /* critical section */\n} catch (InterruptedException ie) { }\nfinally { sem.release(); }\n\nCondition condition = key.newCondition();\ncondition.await();    /* bekle */\ncondition.signal();   /* haber ver */' },
          { t: 'h', text: 'Örnek: sırayla çalışan beş iş parçacığı' },
          { t: 'p', html: 'Koşul değişkeni bir <code>ReentrantLock</code>\'a bağlıdır. Slayt 7.39 – 7.40: 0–4 numaralı beş iş parçacığı <code>turn</code> değişkenini paylaşır. <code>doWork()</code> çağıran iş parçacığı sırası değilse bekler, işi bitince sıradakine haber verir.' },
          { t: 'code', text: 'Lock lock = new ReentrantLock();\nCondition[] condVars = new Condition[5];\nfor (int i = 0; i < 5; i++)\n    condVars[i] = lock.newCondition();\n\npublic void doWork(int threadNumber) {\n    lock.lock();\n    try {\n        if (threadNumber != turn)          /* sıra bende değilse bekle */\n            condVars[threadNumber].await();\n        /* bir süre çalış ... */\n        turn = (turn + 1) % 5;             /* sırayı sonrakine ver */\n        condVars[turn].signal();\n    }\n    catch (InterruptedException ie) { }\n    finally { lock.unlock(); }\n}' }
        ],
        checks: [
          { q: 'Java\'da wait() çağrısı hangi üç şeyi yapar?', a: 'Nesnenin kilidini bırakır, iş parçacığını blocked yapar ve bekleme kümesine koyar.' },
          { q: 'notify() ne yapar?', a: 'Bekleme kümesinden rastgele bir iş parçacığını giriş kümesine taşır ve runnable yapar.' },
          { q: 'ReentrantLock kullanırken unlock neden finally içine yazılır?', a: 'try bloğunda istisna olsa da kilidin bırakılmasını garanti etmek için.' }
        ]
      },
      {
        id: 'alternatif',
        title: 'Alternatif Yaklaşımlar',
        en: 'Alternative Approaches',
        slides: '7.41 – 7.44',
        minutes: 3,
        blocks: [
          { t: 'h', text: 'İşlemsel bellek' },
          { t: 'def', term: 'İşlemsel bellek', en: 'Transactional memory', html: 'Bellek işlemi (memory transaction), <b>atomik yapılan</b> okuma-yazma dizisidir. <code>atomic{S}</code>, S içindeki ifadelerin atomik çalışmasını sağlar; kilit yönetimi gerekmez.' },
          { t: 'code', text: '/* Mutex ile */                  /* İşlemsel bellekle */\nvoid update() {                  void update() {\n    acquire();                       atomic {\n    /* veriyi değiştir */                /* veriyi değiştir */\n    release();                       }\n}                                }' },
          { t: 'h', text: 'OpenMP' },
          { t: 'def', term: 'OpenMP', en: 'OpenMP', html: 'Paralel programlama için derleyici yönergeleri ve API. <code>#pragma omp critical</code> içindeki kod <b>kritik bölüm</b> sayılır ve atomik yürütülür.' },
          { t: 'code', text: 'void update(int value) {\n    #pragma omp critical\n    {\n        count += value;\n    }\n}' },
          { t: 'h', text: 'Fonksiyonel diller' },
          { t: 'def', term: 'Fonksiyonel diller', en: 'Functional programming languages', html: 'Yordamsal dillerin aksine <b>durum tutmazlar</b>; değişkenler atandıktan sonra değişmez. Bu nedenle veri yarışlarına yaklaşımlarıyla ilgi görürler. Örnek: <b>Erlang</b>, <b>Scala</b>.' }
        ],
        checks: [
          { q: 'Fonksiyonel dillerde veri yarışı neden daha az sorun olur?', a: 'Değişkenler atandıktan sonra değişmez; paylaşılan durum değiştirilmez.' },
          { q: 'atomic{S} ne sağlar?', a: 'S içindeki bellek işlemlerinin tek bir atomik işlem olarak yürütülmesini sağlar.' }
        ]
      }
    ]
  });
})(window.OSLab = window.OSLab || {});
