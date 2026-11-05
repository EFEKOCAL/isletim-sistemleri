/*
 * lessons-ch4.js — Bölüm 4: İş Parçacıkları (ch04_TR.pdf, Silberschatz 10. baskı).
 */
(function (OSLab) {
  'use strict';

  OSLab.lessons = OSLab.lessons || { chapters: [] };

  OSLab.lessons.chapters.push({
    id: 'ch4',
    num: 4,
    title: 'İş Parçacıkları',
    en: 'Threads & Concurrency',
    source: 'ch04_TR.pdf',
    objectives: [
      'İş parçacığının temel bileşenlerini tanımak, iş parçacığı ile işlemi karşılaştırmak',
      'Çok iş parçacıklı uygulama tasarlamanın yararlarını ve zorluklarını açıklamak',
      'İş parçacığı havuzu, fork-join ve GCD gibi örtük yöntemleri göstermek',
      'Windows ve Linux\'un iş parçacıklarını nasıl temsil ettiğini açıklamak',
      'Pthreads, Java ve Windows API ile iş parçacığı oluşturmak'
    ],
    lessons: [
      {
        id: 'kavram',
        title: 'İş Parçacığı Nedir, Neden Kullanılır?',
        en: 'Overview & Motivation',
        slides: '4.4 – 4.8',
        minutes: 5,
        blocks: [
          { t: 'p', html: 'Modern uygulamaların çoğu <b>çok iş parçacıklıdır</b>. Bir uygulamanın görevleri ayrı iş parçacıklarıyla yürütülebilir: ekranı güncellemek, veri getirmek, yazım denetimi yapmak, ağ isteğine yanıt vermek. Çekirdekler de genellikle çok iş parçacıklıdır.' },
          { t: 'compare', cols: [
            { title: 'İş parçacıkları neyi paylaşır?', items: ['Kod (code)', 'Veri (data)', 'Dosyalar (files)'] },
            { title: 'Her iş parçacığında ayrı olan', items: ['Yazmaçlar (registers)', 'Yığın (stack)', 'Program sayacı (PC)'] }
          ] },
          { t: 'p', html: '<b>İşlem oluşturmak ağır, iş parçacığı oluşturmak hafiftir.</b> Çok iş parçacığı kodu sadeleştirebilir ve verimi artırabilir.' },
          { t: 'h', text: 'Dört fayda' },
          { t: 'table', head: ['Fayda', 'Açıklama'], rows: [
            ['Cevap verebilirlik (responsiveness)', 'Bir parça engellense de diğerleri çalışır; kullanıcı arayüzleri için önemlidir'],
            ['Kaynak paylaşımı (resource sharing)', 'İş parçacıkları işlem kaynaklarını paylaşır; paylaşılan bellekten veya mesaj geçişinden daha kolaydır'],
            ['Ekonomi (economy)', 'İşlem oluşturmaktan ucuzdur; iş parçacığı değiştirmenin ek yükü bağlam değiştirmeden düşüktür'],
            ['Ölçeklenebilirlik (scalability)', 'İşlem, çok çekirdekli mimariden yararlanabilir']
          ] },
          { t: 'h', text: 'Çok iş parçacıklı sunucu' },
          { t: 'list', ordered: true, items: [
            'İstemci sunucuya istek gönderir.',
            'Sunucu, isteğe hizmet edecek yeni bir iş parçacığı oluşturur.',
            'Sunucu başka istekleri dinlemeye devam eder.'
          ] }
        ],
        checks: [
          { q: 'Aynı işlemin iş parçacıkları neleri paylaşır, nelerde ayrıdır?', a: 'Kod, veri ve dosyaları paylaşır. Yazmaçları, yığını ve program sayacı ayrıdır.' },
          { q: 'İş parçacığı kullanmanın dört faydası nedir?', a: 'Cevap verebilirlik, kaynak paylaşımı, ekonomi ve ölçeklenebilirlik.' }
        ]
      },
      {
        id: 'cok-cekirdek',
        title: 'Çok Çekirdekli Programlama ve Amdahl Yasası',
        en: 'Multicore Programming & Amdahl\'s Law',
        slides: '4.7, 4.9 – 4.13',
        minutes: 7,
        blocks: [
          { t: 'compare', cols: [
            { title: 'Paralellik (parallelism)', items: ['Sistem aynı anda birden fazla görevi <b>gerçekten yürütür</b>', 'Birden çok çekirdek gerekir'] },
            { title: 'Eşzamanlılık (concurrency)', items: ['Birden fazla görevin <b>ilerlemesini</b> destekler', 'Tek çekirdekte bunu zamanlayıcı sağlar: görevler sırayla çalışır'] }
          ] },
          { t: 'p', html: 'Programcının dikkat etmesi gereken beş konu: <b>faaliyetleri bölme</b>, <b>denge</b>, <b>veri bölme</b>, <b>veri bağımlılığı</b>, <b>test ve hata ayıklama</b>.' },
          { t: 'compare', cols: [
            { title: 'Veri paralelleştirme', items: ['Aynı verinin alt kümeleri çekirdeklere dağıtılır', 'Her çekirdekte <b>aynı işlem</b> yapılır'] },
            { title: 'Görev paralelleştirme', items: ['İş parçacıkları çekirdeklere dağıtılır', 'Her iş parçacığı <b>farklı bir işlem</b> yapar'] }
          ] },
          { t: 'h', text: 'Amdahl Yasası' },
          { t: 'def', term: 'Amdahl Yasası', en: 'Amdahl\'s Law', html: 'Seri ve paralel kısımları olan uygulamaya çekirdek eklemenin kazancını tanımlar: <b>hızlanma ≤ 1 / (S + (1 − S) / N)</b>. S seri kısım, N çekirdek sayısıdır. N sonsuza giderken hızlanma <b>1/S</b>\'ye yaklaşır. Slayt 4.13\'teki grafikte S = 0,05, 0,10 ve 0,50 eğrileri ideal doğrusal hızlanmanın altında kalır; S = 0,50\'de 16 çekirdekle bile hızlanma 2\'ye yaklaşır.' },
          { t: 'p', html: 'Değerleri değiştir. %25 seri ve 2 çekirdekte hızlanmanın <b>1,6 kat</b> olduğunu gör:' },
          { t: 'dg', id: 'amdahl' },
          { t: 'note', kind: 'exam', attach: true, html: 'Seri kısmın, çekirdek eklemeyle elde edilen kazanç üzerinde <b>orantısız etkisi</b> vardır: %25 seri kısım varsa çekirdek sayısı ne olursa olsun hızlanma 4 katı geçemez.' }
        ],
        checks: [
          { q: 'Eşzamanlılık ve paralellik arasındaki fark nedir?', a: 'Eşzamanlılık birden çok görevin ilerlemesini destekler; tek çekirdekte zamanlayıcıyla olur. Paralellik görevlerin aynı anda gerçekten yürütülmesidir; birden çok çekirdek gerekir.' },
          { q: '%25 seri uygulamada 1\'den 2 çekirdeğe geçiş kaç kat hızlandırır?', a: '1 / (0,25 + 0,75 / 2) = 1,6 kat.' },
          { q: 'Veri ve görev paralelleştirme arasındaki fark nedir?', a: 'Veride aynı işlem, verinin farklı alt kümelerinde yapılır. Görevde her iş parçacığı farklı bir işlem yapar.' }
        ]
      },
      {
        id: 'modeller',
        title: 'Kullanıcı ve Çekirdek İş Parçacıkları, Modeller',
        en: 'User & Kernel Threads, Multithreading Models',
        slides: '4.14 – 4.20',
        minutes: 6,
        blocks: [
          { t: 'compare', cols: [
            { title: 'Kullanıcı iş parçacıkları', items: ['Yönetim kullanıcı seviyesi kütüphanelerce yapılır', 'POSIX Pthreads, Windows threads, Java threads'] },
            { title: 'Çekirdek iş parçacıkları', items: ['Çekirdek tarafından desteklenir', 'Windows, Linux, Mac OS X, iOS, Android'] }
          ] },
          { t: 'p', html: 'Kullanıcı iş parçacıkları çekirdek iş parçacıklarına bir modelle eşlenir. Sekmeleri gez:' },
          { t: 'dg', id: 'tmodels' },
          { t: 'table', head: ['Model', 'Özellik', 'Örnek'], rows: [
            ['Çoktan-bire', 'Biri bloklanınca hepsi bloklanır; paralel çalışmaz. Çok az sistem kullanır', 'Solaris Green Threads, GNU Portable Threads'],
            ['Bire-bir', 'Daha iyi eşzamanlılık; işlem başına iş parçacığı sayısı kısıtlanabilir', 'Windows, Linux'],
            ['Çoktan-çoğa', 'Yeterli çekirdek iş parçacığı oluşturulabilir; çok yaygın değil', 'ThreadFiber paketiyle Windows'],
            ['İki seviyeli', 'Çoktan-çoğa + bir kullanıcı iş parçacığını çekirdek iş parçacığına bağlama', '–']
          ] }
        ],
        checks: [
          { q: 'Çoktan-bire modelin iki temel sorunu nedir?', a: 'Bir iş parçacığı bloklanınca tümü bloklanır. Aynı anda yalnızca biri çekirdekte olabildiği için çok çekirdekte paralel çalışamazlar.' },
          { q: 'Windows ve Linux hangi modeli kullanır?', a: 'Bire-bir (one-to-one).' }
        ]
      },
      {
        id: 'kutuphaneler',
        title: 'İş Parçacığı Kütüphaneleri',
        en: 'Thread Libraries: Pthreads, Windows, Java',
        slides: '4.21 – 4.32',
        minutes: 8,
        blocks: [
          { t: 'def', term: 'İş parçacığı kütüphanesi', en: 'Thread library', html: 'Programcıya iş parçacığı oluşturmak ve yönetmek için API sağlar. İki yolla gerçekleştirilir: tamamen <b>kullanıcı alanında</b> ya da işletim sistemince desteklenen <b>çekirdek düzeyinde</b>.' },
          { t: 'def', term: 'Pthreads', en: 'POSIX threads', html: 'İş parçacığı oluşturma ve senkronizasyon için POSIX standardı (IEEE 1003.1c) API\'sidir. <b>Uygulama değil, şartnamedir</b>: davranışı belirtir, gerçekleştirme kütüphaneye bağlıdır. Linux ve macOS gibi UNIX sistemlerinde yaygındır.' },
          { t: 'code', text: '#include <pthread.h>\n#include <stdio.h>\n#include <stdlib.h>\n\nint sum;                     /* iş parçacıklarının paylaştığı veri */\nvoid *runner(void *param);\n\nint main(int argc, char *argv[]) {\n    pthread_t tid;           /* iş parçacığı kimliği */\n    pthread_attr_t attr;     /* öznitelikler */\n    pthread_attr_init(&attr);\n    pthread_create(&tid, &attr, runner, argv[1]);\n    pthread_join(tid, NULL); /* bitmesini bekle */\n    printf("sum = %d\\n", sum);\n}\n\nvoid *runner(void *param) {\n    int i, upper = atoi(param);\n    sum = 0;\n    for (i = 1; i <= upper; i++)\n        sum += i;\n    pthread_exit(0);\n}' },
          { t: 'p', html: 'Birden çok iş parçacığını beklemek için <code>pthread_join</code> bir döngüde çağrılır (slayt 4.25):' },
          { t: 'code', text: '#define NUM_THREADS 10\npthread_t workers[NUM_THREADS];   /* beklenecek iş parçacıkları */\n\nfor (int i = 0; i < NUM_THREADS; i++)\n    pthread_join(workers[i], NULL);' },
          { t: 'h', text: 'Windows' },
          { t: 'p', html: 'Aynı toplama programının Windows sürümü (slayt 4.26 – 4.27). <code>CreateThread</code> iş parçacığını oluşturur, <code>WaitForSingleObject</code> bitmesini bekler, <code>CloseHandle</code> tutamacı kapatır.' },
          { t: 'code', text: '#include <windows.h>\n#include <stdio.h>\nDWORD Sum;                  /* iş parçacıklarının paylaştığı veri */\n\nDWORD WINAPI Summation(LPVOID Param) {\n    DWORD Upper = *(DWORD*)Param;\n    for (DWORD i = 1; i <= Upper; i++)\n        Sum += i;\n    return 0;\n}\n\nint main(int argc, char *argv[]) {\n    DWORD ThreadId;  HANDLE ThreadHandle;  int Param;\n    Param = atoi(argv[1]);\n    ThreadHandle = CreateThread(\n        NULL,        /* varsayılan güvenlik öznitelikleri */\n        0,           /* varsayılan yığın boyutu */\n        Summation,   /* iş parçacığı fonksiyonu */\n        &Param,      /* fonksiyonun parametresi */\n        0,           /* varsayılan oluşturma bayrakları */\n        &ThreadId);  /* iş parçacığı kimliği döner */\n    WaitForSingleObject(ThreadHandle, INFINITE);\n    CloseHandle(ThreadHandle);\n    printf("sum = %d\\n", Sum);\n}' },
          { t: 'h', text: 'Java' },
          { t: 'list', items: [
            'Java iş parçacıklarını <b>JVM</b> yönetir; genellikle alttaki işletim sisteminin modeliyle gerçekleştirilir.',
            'İki yol vardır: <code>Thread</code> sınıfını genişletmek ya da <code>Runnable</code> arayüzünü gerçekleştirmek. <b>Standart yöntem Runnable\'dır</b>.'
          ] },
          { t: 'code', text: 'class Task implements Runnable {\n    public void run() {\n        System.out.println("I am a thread.");\n    }\n}\n\nThread worker = new Thread(new Task());   /* oluştur */\nworker.start();                            /* başlat */\n\ntry { worker.join(); }                      /* bekle */\ncatch (InterruptedException ie) { }' },
          { t: 'h', text: 'Java Executor çerçevesi' },
          { t: 'p', html: 'İş parçacığını açıkça oluşturmak yerine iş <code>Executor</code> arayüzüne verilir: <code>void execute(Runnable command)</code>. Sonuç döndüren iş için <code>Callable</code> ve <code>Future</code> kullanılır (slayt 4.30 – 4.32).' },
          { t: 'code', text: 'class Summation implements Callable<Integer> {\n    private int upper;\n    public Summation(int upper) { this.upper = upper; }\n    public Integer call() {          /* iş parçacığı burada çalışır */\n        int sum = 0;\n        for (int i = 1; i <= upper; i++)\n            sum += i;\n        return new Integer(sum);\n    }\n}\n\nExecutorService pool = Executors.newSingleThreadExecutor();\nFuture<Integer> result = pool.submit(new Summation(upper));\nSystem.out.println("sum = " + result.get());' }
        ],
        checks: [
          { q: 'Pthreads neden "şartname" olarak anılır?', a: 'API yalnızca kütüphanenin davranışını belirtir; nasıl gerçekleştirileceği kütüphaneyi geliştirenlere bağlıdır.' },
          { q: 'Java\'da iş parçacığı oluşturmanın iki yolu nedir? Hangisi standarttır?', a: 'Thread sınıfını genişletmek ve Runnable arayüzünü gerçekleştirmek. Standart olan Runnable\'dır.' }
        ]
      },
      {
        id: 'ortuk',
        title: 'Örtük İş Parçacığı',
        en: 'Implicit Threading',
        slides: '4.33 – 4.48',
        minutes: 8,
        blocks: [
          { t: 'def', term: 'Örtük iş parçacığı', en: 'Implicit threading', html: 'İş parçacığı sayısı arttıkça programın doğruluğunu korumak zorlaşır. Bu yüzden oluşturma ve yönetim programcı yerine <b>derleyiciler ve çalışma zamanı kütüphanelerince</b> yapılır. Beş yöntem: iş parçacığı havuzu, fork-join, OpenMP, Grand Central Dispatch, Intel TBB.' },
          { t: 'h', text: 'İş parçacığı havuzu' },
          { t: 'p', html: 'Havuzda önceden iş parçacıkları oluşturulur ve iş bekler. <b>Avantajlar:</b> mevcut iş parçacığıyla hizmet vermek genellikle daha hızlıdır; iş parçacığı sayısı havuz boyutuyla sınırlanır; işi oluşturma mekanizmasından ayırmak farklı stratejilere izin verir (ör. periyodik çalıştırma).' },
          { t: 'p', html: 'Windows API de iş parçacığı havuzunu destekler. Java\'da <code>Executors</code> sınıfının üç fabrika metodu vardır; slayt 4.36\'daki örnek havuzla görevleri çalıştırıp havuzu kapatır:' },
          { t: 'code', text: 'static ExecutorService newSingleThreadExecutor()\nstatic ExecutorService newFixedThreadPool(int size)\nstatic ExecutorService newCachedThreadPool()\n\nExecutorService pool = Executors.newCachedThreadPool();\nfor (int i = 0; i < numTasks; i++)\n    pool.execute(new Task());   /* her görev havuzdaki bir iş parçacığıyla */\npool.shutdown();                /* hepsi bitince havuzu kapat */' },
          { t: 'h', text: 'Fork-Join' },
          { t: 'p', html: 'Birden çok görev <b>çatallanır (fork)</b>, sonra <b>birleştirilir (join)</b>. Java\'da <code>ForkJoinTask</code> soyut taban sınıftır: <code>RecursiveTask</code> <code>compute()</code> ile sonuç döndürür, <code>RecursiveAction</code> döndürmez.' },
          { t: 'code', text: 'Task(problem)\n    if (problem yeterince küçük)\n        doğrudan çöz\n    else\n        altgörev1 = fork(new Task(problemin alt kümesi))\n        altgörev2 = fork(new Task(problemin alt kümesi))\n        sonuç1 = join(altgörev1)\n        sonuç2 = join(altgörev2)\n        return sonuçları birleştir' },
          { t: 'p', html: 'Görevler özyinelemeli olarak bölünür ve bir ağaç oluşturur (slayt 4.39). Java örneği bir dizinin elemanlarını toplar; parça <code>THRESHOLD</code> (1000) değerinden küçükse doğrudan toplanır:' },
          { t: 'code', text: 'ForkJoinPool pool = new ForkJoinPool();\nint[] array = new int[SIZE];      /* toplanacak sayılar */\nSumTask task = new SumTask(0, SIZE - 1, array);\nint sum = pool.invoke(task);\n\nclass SumTask extends RecursiveTask<Integer> {\n    static final int THRESHOLD = 1000;\n    protected Integer compute() {\n        if (end - begin < THRESHOLD) {\n            int sum = 0;\n            for (int i = begin; i <= end; i++) sum += array[i];\n            return sum;\n        } else {\n            int mid = (begin + end) / 2;\n            SumTask leftTask = new SumTask(begin, mid, array);\n            SumTask rightTask = new SumTask(mid + 1, end, array);\n            leftTask.fork();\n            rightTask.fork();\n            return rightTask.join() + leftTask.join();\n        }\n    }\n}' },
          { t: 'h', text: 'OpenMP' },
          { t: 'p', html: 'C, C++ ve FORTRAN için derleyici yönergeleri ve API. <b>Paylaşılan bellek</b> ortamında paralel bölgeleri işaretler.' },
          { t: 'code', text: '#pragma omp parallel          /* çekirdek sayısı kadar iş parçacığı */\n{ printf("I am a parallel region."); }\n\n#pragma omp parallel for      /* for döngüsünü paralel çalıştır */\nfor (i = 0; i < N; i++)\n    c[i] = a[i] + b[i];' },
          { t: 'h', text: 'Grand Central Dispatch ve TBB' },
          { t: 'list', items: [
            '<b>GCD:</b> macOS ve iOS teknolojisi; C, C++ ve Objective-C uzantıları, API ve çalışma zamanı kütüphanesi. Paralel bölümler <code>^{ }</code> <b>bloğuyla</b> yazılır, gönderim kuyruğuna konur ve kuyruktan alınınca havuzdaki bir iş parçacığına atanır.',
            '<b>Seri kuyruk:</b> bloklar FIFO ile tek tek alınır; işlem başına bir tane vardır (main queue), programcı ek kuyruk oluşturabilir.',
            '<b>Eşzamanlı kuyruk:</b> FIFO ile alınır ama aynı anda birkaçı alınabilir. Hizmet kalitesine göre dört sistem kuyruğu: USER_INTERACTIVE, USER_INITIATED, UTILITY, BACKGROUND.',
            'Swift\'te görev <b>closure</b>\'dır (şapka işareti olmayan blok) ve <code>dispatch_async()</code> ile kuyruğa verilir.',
            '<b>Intel TBB:</b> paralel C++ programları için şablon kütüphanesi.'
          ] },
          { t: 'code', text: '/* GCD, Swift */\nlet queue = dispatch_get_global_queue(QOS_CLASS_USER_INITIATED, 0)\ndispatch_async(queue, { print("I am a closure.") })\n\n/* TBB: seri döngü ve parallel_for ile aynısı */\nfor (int i = 0; i < n; i++)\n    apply(v[i]);\nparallel_for(size_t(0), n, [=](size_t i) { apply(v[i]); });' }
        ],
        checks: [
          { q: 'İş parçacığı havuzunun üç avantajı nedir?', a: 'Mevcut iş parçacığıyla hizmet vermek genellikle daha hızlıdır, iş parçacığı sayısı havuz boyutuyla sınırlanır, iş oluşturma mekanizmasından ayrıldığı için farklı stratejiler uygulanabilir.' },
          { q: 'GCD\'de seri ve eşzamanlı kuyruk arasındaki fark nedir?', a: 'İkisi de FIFO ile alır. Seride bloklar tek tek alınır, eşzamanlıda aynı anda birkaçı alınabilir.' },
          { q: '#pragma omp parallel ne yapar?', a: 'Paralel bölgeyi işaretler ve çekirdek sayısı kadar iş parçacığı oluşturur.' }
        ]
      },
      {
        id: 'sorunlar',
        title: 'İş Parçacığı Sorunları',
        en: 'Threading Issues',
        slides: '4.49 – 4.57',
        minutes: 7,
        blocks: [
          { t: 'h', text: 'fork() ve exec()' },
          { t: 'p', html: '<code>fork()</code> yalnızca çağıran iş parçacığını mı, tümünü mü kopyalar? Bazı UNIX sistemlerinde <b>iki sürümü</b> vardır. <code>exec()</code> genellikle normal çalışır: tüm iş parçacıklarıyla birlikte işlemi değiştirir.' },
          { t: 'h', text: 'Sinyal işleme' },
          { t: 'p', html: 'Sinyal, UNIX\'te işleme bir olay oluştuğunu bildirir. Olay sinyali üretir, sinyal işleme iletilir ve <b>varsayılan</b> ya da <b>kullanıcı tanımlı</b> işleyiciyle işlenir. Kullanıcı tanımlı işleyici varsayılanı geçersiz kılabilir.' },
          { t: 'p', html: 'Çok iş parçacıklı işlemde sinyal nereye iletilir? Sinyalin ilgili olduğu iş parçacığına, tüm iş parçacıklarına, belirli iş parçacıklarına ya da tüm sinyalleri alacak özel bir iş parçacığına.' },
          { t: 'h', text: 'İş parçacığı iptali' },
          { t: 'compare', cols: [
            { title: 'Asenkron iptal', items: ['Hedef iş parçacığını <b>hemen</b> sonlandırır'] },
            { title: 'Ertelenmiş iptal (varsayılan)', items: ['Hedef, iptal edilmesi gerekip gerekmediğini <b>periyodik olarak kontrol eder</b>', 'İptal yalnızca <b>iptal noktasında</b> olur (ör. <code>pthread_testcancel()</code>), sonra temizlik işleyicisi çalışır'] }
          ] },
          { t: 'list', items: [
            '<code>pthread_cancel(tid)</code> yalnızca iptal <b>ister</b>; sonuç iş parçacığının durumuna bağlıdır. İptal kapalıysa etkinleşene kadar bekler.',
            'Linux\'ta iptal sinyallerle yapılır.',
            'Java\'da ertelenmiş iptal <code>interrupt()</code> ile yapılır; iş parçacığı <code>isInterrupted()</code> ile kontrol eder.'
          ] },
          { t: 'code', text: '/* Pthreads */\npthread_create(&tid, 0, worker, NULL);\npthread_cancel(tid);         /* iptal iste */\npthread_join(tid, NULL);     /* sonlanmasını bekle */\n\n/* Java */\nworker.interrupt();          /* kesilme durumunu ayarla */\nwhile (!Thread.currentThread().isInterrupted()) { ... }' },
          { t: 'h', text: 'Thread-local storage (TLS)' },
          { t: 'p', html: 'TLS, her iş parçacığına verinin <b>kendi kopyasını</b> verir. İş parçacığı oluşturmayı kontrol edemediğinde (ör. havuzda) kullanışlıdır. Yerel değişkenden farkı: yerel değişken tek fonksiyon çağrısında görünür, <b>TLS çağrılar arasında</b> görünür. Statik veriye benzer ama her iş parçacığına özeldir.' },
          { t: 'h', text: 'Scheduler activations' },
          { t: 'p', html: 'Çoktan-çoğa ve iki seviyeli modellerde uygulamaya doğru sayıda çekirdek iş parçacığı ayrılmalıdır. Araya genellikle <b>hafif işlem (LWP)</b> konur: sanal işlemci gibi görünür ve bir çekirdek iş parçacığına bağlıdır. <b>Upcall</b>, çekirdekten kütüphanedeki işleyiciye iletişim sağlar; böylece uygulama doğru sayıyı korur.' }
        ],
        checks: [
          { q: 'Asenkron ve ertelenmiş iptal arasındaki fark nedir?', a: 'Asenkron iptal hedefi hemen sonlandırır. Ertelenmişte hedef periyodik olarak kontrol eder ve iptal noktasında sonlanır; varsayılan budur.' },
          { q: 'TLS ile yerel değişkenin farkı nedir?', a: 'Yerel değişken yalnızca tek fonksiyon çağrısı boyunca görünür. TLS fonksiyon çağrıları arasında görünür ve her iş parçacığına özeldir.' },
          { q: 'LWP nedir?', a: 'Kullanıcı ve çekirdek iş parçacıkları arasındaki ara yapıdır. Kullanıcı iş parçacığına sanal işlemci gibi görünür ve bir çekirdek iş parçacığına bağlıdır.' }
        ]
      },
      {
        id: 'os-thread',
        title: 'İşletim Sistemi Örnekleri: Windows ve Linux',
        en: 'Operating System Examples',
        slides: '4.58 – 4.62',
        minutes: 4,
        blocks: [
          { t: 'h', text: 'Windows' },
          { t: 'p', html: 'Windows API birincil API\'dir ve <b>bire-bir, çekirdek düzeyinde</b> eşleme kullanır. Her iş parçacığının kimliği, yazmaç seti, kullanıcı ve çekirdek modu için ayrı yığınları, kütüphanelerin kullandığı özel veri alanı vardır. Yazmaç seti, yığınlar ve özel alan iş parçacığının <b>bağlamıdır</b>.' },
          { t: 'table', head: ['Yapı', 'İçerik', 'Bulunduğu alan'], rows: [
            ['ETHREAD', 'İş parçacığının başlangıç adresi, ait olduğu işleme ve KTHREAD\'e işaretçi', 'Çekirdek'],
            ['KTHREAD', 'Planlama ve senkronizasyon bilgisi, çekirdek yığını, TEB\'e işaretçi', 'Çekirdek'],
            ['TEB', 'İş parçacığı kimliği, kullanıcı yığını, thread-local storage', 'Kullanıcı']
          ] },
          { t: 'h', text: 'Linux' },
          { t: 'p', html: 'Linux iş parçacığı yerine <b>görev (task)</b> der. Görev <code>clone()</code> ile oluşturulur; bayraklar, çocuğun ebeveynin adres alanını paylaşıp paylaşmayacağını belirler. <code>struct task_struct</code>, paylaşılan veya özel işlem veri yapılarını gösterir.' }
        ],
        checks: [
          { q: 'ETHREAD, KTHREAD ve TEB hangi alanda bulunur?', a: 'ETHREAD ve KTHREAD çekirdek alanında, TEB kullanıcı alanındadır.' },
          { q: 'Linux\'ta iş parçacığı nasıl oluşturulur?', a: 'clone() sistem çağrısıyla. Bayraklar neyin paylaşılacağını belirler; Linux bunlara görev (task) der.' }
        ]
      }
    ]
  });
})(window.OSLab = window.OSLab || {});
