/*
 * lessons-ch3.js — Bölüm 3: İşlemler (ch03_TR.pdf).
 */
(function (OSLab) {
  'use strict';

  OSLab.lessons = OSLab.lessons || { chapters: [] };

  OSLab.lessons.chapters.push({
    id: 'ch3',
    num: 3,
    title: 'İşlemler',
    en: 'Processes',
    source: 'ch03_TR.pdf',
    objectives: [
      'Bir işlemin bileşenlerini, işletim sisteminde nasıl temsil edildiğini ve planlandığını göstermek',
      'İşlemlerin nasıl oluşturulup sonlandırıldığını ve ilgili sistem çağrılarını açıklamak',
      'Paylaşılan bellek ile mesaj geçişini karşılaştırmak',
      'Pipe ve POSIX paylaşılan belleğini kullanan programları anlamak',
      'Soket ve uzaktan yordam çağrısı (RPC) ile istemci–sunucu iletişimini açıklamak'
    ],
    lessons: [
      {
        id: 'kavram',
        title: 'İşlem Kavramı ve Bellekteki İşlem',
        en: 'Process Concept',
        slides: '3.4 – 3.8',
        minutes: 7,
        blocks: [
          { t: 'def', term: 'İşlem', en: 'Process', html: '<b>Yürütülmekte olan program</b>. İşlemin yürütülmesi <b>sıralı</b> ilerlemelidir. "İş (job)" ve "işlem (process)" aynı anlamda kullanılır.' },
          { t: 'compare', cols: [
            { title: 'Program', items: ['Diskte duran <b>pasif</b> varlık', 'Çalıştırılabilir dosya (executable file)'] },
            { title: 'İşlem', items: ['<b>Aktif</b> varlık', 'Çalıştırılabilir dosya <b>belleğe yüklendiğinde</b> program işleme dönüşür', 'Bir program <b>birden fazla işlem</b> olarak yürütülebilir (aynı programı çalıştıran birden çok kullanıcı)'] }
          ] },
          { t: 'h', text: 'Bir işlem neleri içerir?' },
          { t: 'list', items: [
            '<b>Program kodu</b> (text section)',
            '<b>Program sayacı</b> (program counter): bir sonraki yürütülecek komutun adresini tutan yazmaç; ve diğer yazmaçlar',
            '<b>Yığın</b> (stack): alt program değişkenleri, parametreler, dönüş adresleri',
            '<b>Veri</b> (data): global değişkenler',
            '<b>Heap</b>: çalışma anında dinamik olarak ayrılan bellek (nesneler)'
          ] },
          { t: 'p', html: 'Bir C programının bellek yerleşimi (slayt 3.8). Kodda bir satıra tıkla, değişkenin hangi bölümde tutulduğunu gör:' },
          { t: 'dg', id: 'procmem' },
          { t: 'note', kind: 'exam', html: 'Stack yüksek adreslerden <b>aşağı</b>, heap düşük adreslerden <b>yukarı</b> doğru büyür; aradaki boşluğu paylaşırlar. Başlangıç değeri <b>verilmiş</b> global (<code>int y = 15;</code>) → initialized data; <b>verilmemiş</b> global (<code>int x;</code>) → uninitialized data (BSS).' }
        ],
        checks: [
          { q: 'Program ile işlem arasındaki fark nedir?', a: 'Program diskte duran pasif bir dosyadır. İşlem, o programın belleğe yüklenmiş ve yürütülmekte olan aktif halidir; program sayacı, yazmaçları, yığını, heap\'i vardır.' },
          { q: 'malloc ile ayrılan bellek ve fonksiyonun yerel değişkenleri nerede tutulur?', a: 'malloc → heap; yerel değişkenler → stack.' },
          { q: 'İşlemin bellek yerleşimindeki bölümleri düşük adresten yükseğe say.', a: 'text → initialized data → uninitialized data → heap (yukarı büyür) → boşluk → stack (aşağı büyür) → argc, argv.' }
        ]
      },
      {
        id: 'durumlar',
        title: 'İşlem Durumları',
        en: 'Process State',
        slides: '3.9 – 3.10',
        minutes: 6,
        blocks: [
          { t: 'p', html: 'Bir işlem, ömrü boyunca durum değiştirir:' },
          { t: 'table', head: ['Durum', 'Anlamı'], rows: [
            ['Yeni (new)', 'İşlem oluşturuluyor'],
            ['Hazır (ready)', 'Bir işlemciye atanmayı bekliyor'],
            ['Çalışıyor (running)', 'Komutları yürütülüyor'],
            ['Bekliyor (waiting)', 'Bir olayın gerçekleşmesini bekliyor (ör. G/Ç tamamlanması)'],
            ['Bitti (terminated)', 'Yürütmesini bitirdi']
          ] },
          { t: 'p', html: 'Durum diyagramını kendin sür: işlem şu an hangi durumdaysa, yalnızca o durumdan geçerli olan olaylar etkin olur.' },
          { t: 'dg', id: 'states' },
          { t: 'note', kind: 'exam', html: 'Sık sorulan tuzak: <b>waiting → running</b> doğrudan geçiş <b>yoktur</b>. G/Ç biten işlem önce <b>ready</b> olur, CPU\'yu ancak zamanlayıcı seçince alır. Tek çekirdekte aynı anda yalnızca <b>bir</b> işlem running olabilir; ready ve waiting durumunda ise çok sayıda işlem olabilir.' }
        ],
        lab: { label: 'CPU Scheduling laboratuvarında ready kuyruğu ve running işlemi canlı izle', preset: { algorithm: 'FCFS', processes: [['P1', 0, 4], ['P2', 1, 3], ['P3', 2, 2]] } },
        checks: [
          { q: 'Running durumundaki bir işlem hangi üç duruma geçebilir? Her biri için tetikleyici olay?', a: 'Ready (kesme / zaman dilimi doldu), Waiting (G/Ç veya olay beklemesi), Terminated (exit).' },
          { q: 'G/Ç tamamlanan bir işlem hangi duruma geçer?', a: 'Waiting → Ready. Doğrudan running olmaz; zamanlayıcının seçmesini bekler.' }
        ]
      },
      {
        id: 'pcb',
        title: 'PCB, Bağlam Değişimi ve İş Parçacıkları',
        en: 'Process Control Block & Context Switch',
        slides: '3.11 – 3.15, 3.20',
        minutes: 7,
        blocks: [
          { t: 'def', term: 'İşlem kontrol bloğu', en: 'Process Control Block (PCB)', html: 'İşletim sisteminde <b>her işlem bir PCB ile temsil edilir</b>. İşlemle ilgili tüm bilgileri tutar. Alanlara tıkla:' },
          { t: 'dg', id: 'pcb' },
          { t: 'def', term: 'Bağlam değişimi', en: 'Context switch', html: 'CPU başka bir işleme geçtiğinde sistem <b>eski işlemin durumunu kaydetmeli</b> ve yeni işlemin <b>kaydedilmiş durumunu yüklemelidir</b>. İşlemin bağlamı (context) <b>PCB</b>\'de tutulur.' },
          { t: 'dg', id: 'ctxswitch' },
          { t: 'list', items: [
            'Bağlam değişimi süresi <b>tamamen ek yüktür (overhead)</b>: sistem geçiş sırasında yararlı iş yapmaz.',
            'İşletim sistemi ve PCB ne kadar karmaşıksa bağlam değişimi o kadar uzun sürer.',
            'Süre <b>donanım desteğine</b> bağlıdır: bazı donanımlar CPU başına <b>birden çok yazmaç seti</b> sağlar, böylece aynı anda birden çok bağlam yüklü kalabilir.'
          ] },
          { t: 'h', text: 'İş parçacığı (thread)' },
          { t: 'p', html: 'İş parçacığı, işlemin <b>eşzamanlı yürütülen her bir bölümü</b>dür; çoğunlukla işlemlerin içinde yer alır. <b>İşlemler</b> belleği birbirleriyle <b>paylaşmaz</b>; <b>aynı işlem içindeki thread\'ler</b> ise aynı kaynakları paylaşabilir. Her thread\'in kendi program sayacı vardır. (Ayrıntılar Bölüm 4\'te.)' }
        ],
        lab: { label: 'Bağlam değişimlerini Round Robin\'de say (CPU Scheduling → Bağlam Değişimi ölçütü)', preset: { algorithm: 'RR', quantum: 1, processes: [['P1', 0, 3], ['P2', 0, 3]] } },
        checks: [
          { q: 'PCB\'de bulunan en az beş alanı say.', a: 'İşlem durumu, işlem numarası (PID), program sayacı, CPU yazmaçları, CPU zamanlama bilgisi (öncelik, kuyruk işaretçileri), bellek yönetimi bilgisi (base/limit, sayfa tabloları), hesap tutma bilgisi, G/Ç durum bilgisi (açık dosyalar, ayrılmış aygıtlar).' },
          { q: 'Bağlam değişimi neden "saf ek yük"tür?', a: 'Geçiş sırasında CPU hiçbir kullanıcı işinin komutunu yürütmez; yalnızca durum kaydedip yükler.' },
          { q: 'Bağlam değişimi süresini kısaltan bir donanım özelliği?', a: 'CPU başına birden çok yazmaç seti: bağlam değişimi yalnızca hangi setin kullanılacağını gösteren işaretçiyi değiştirmeye indirgenir.' }
        ]
      },
      {
        id: 'planlama',
        title: 'İşlem Planlama ve Kuyruklar',
        en: 'Process Scheduling',
        slides: '3.16 – 3.21',
        minutes: 6,
        blocks: [
          { t: 'p', html: '<b>Çoklu programlamanın</b> amacı CPU kullanımını en üst düzeye çıkarmak için her zaman çalışan bir işlem bulunmasını sağlamaktır. <b>İşlem zamanlayıcısı (process scheduler)</b>, CPU çekirdeğinde bir sonraki yürütme için mevcut işlemler arasından seçim yapar ve <b>zamanlama kuyruklarını</b> tutar.' },
          { t: 'table', head: ['Kuyruk', 'İçerik'], rows: [
            ['İş (job) kuyruğu', 'Sistemdeki tüm işlemler'],
            ['Hazır (ready) kuyruğu', 'Ana bellekte, hazır ve CPU\'yu bekleyen işlemler'],
            ['Aygıt (device) / bekleme kuyrukları', 'Bir G/Ç aygıtını veya olayı bekleyen işlemler']
          ] },
          { t: 'p', html: 'Kuyruklar, <b>PCB\'lerin bağlı listesi</b> olarak tutulur (baş ve kuyruk işaretçili). İşlemler bu kuyruklar arasında hareket eder. Bir işlemin yolculuğunu izle:' },
          { t: 'dg', id: 'queues' },
          { t: 'h', text: 'Mobil sistemlerde çoklu görev' },
          { t: 'compare', cols: [
            { title: 'iOS', items: ['İlk sürümler: yalnızca bir işlem çalışır, diğerleri askıda', 'Tek <b>ön plan (foreground)</b> işlemi + sınırlı <b>arka plan (background)</b> işlemleri', 'Sınırlar: kısa tek görev, olay bildirimi, ses çalma gibi uzun görevler'] },
            { title: 'Android', items: ['Ön ve arka plan, daha az sınır', 'Arka plan işlemi bir <b>servis (service)</b> kullanır', 'Servis, arka plan işlemi askıya alınsa bile çalışabilir; arayüzü yoktur, az bellek kullanır'] }
          ] }
        ],
        lab: { label: 'Hazır kuyruğunun FIFO davranışını FCFS ile izle', preset: { algorithm: 'FCFS', processes: [['P1', 0, 5], ['P2', 1, 2], ['P3', 2, 3]] } },
        checks: [
          { q: 'Ready kuyruğu ile wait (aygıt) kuyruğu arasındaki fark nedir?', a: 'Ready kuyruğunda çalışmaya hazır, yalnızca CPU\'yu bekleyen işlemler vardır. Wait kuyruğunda bir G/Ç aygıtını veya olayı bekleyen, CPU verilse bile ilerleyemeyecek işlemler vardır.' },
          { q: 'Bir işlemin zaman dilimi (time slice) dolarsa hangi kuyruğa gider?', a: 'Ready kuyruğuna.' }
        ]
      },
      {
        id: 'olusturma',
        title: 'İşlem Oluşturma ve Sonlandırma',
        en: 'Operations on Processes',
        slides: '3.22 – 3.31',
        minutes: 10,
        blocks: [
          { t: 'p', html: '<b>Ana (parent)</b> işlem <b>çocuk (child)</b> işlemler oluşturur; onlar da başka işlemler oluşturarak bir <b>işlem ağacı</b> meydana getirir. İşlemler <b>işlem tanımlayıcısı (pid)</b> ile tanımlanır ve yönetilir.' },
          { t: 'table', head: ['Seçenek', 'Olasılıklar'], rows: [
            ['Kaynak paylaşımı', 'Tüm kaynakları paylaşırlar / çocuk, ebeveynin kaynaklarının alt kümesini paylaşır / hiçbir kaynağı paylaşmazlar'],
            ['Yürütme', 'Eşzamanlı (concurrently) yürütülürler / ebeveyn, çocuk sonlanana kadar bekler'],
            ['Adres alanı', 'Çocuk ebeveynin kopyasıdır / çocuğa yeni bir program yüklenir']
          ] },
          { t: 'h', text: 'UNIX: fork() – exec() – wait()' },
          { t: 'list', items: [
            '<code>fork()</code> yeni bir işlem oluşturur; çocuk, ebeveynin adres alanının kopyasıdır.',
            '<code>fork()</code> <b>iki kez döner</b>: ebeveynde çocuğun pid\'i (&gt; 0), çocukta <b>0</b>, hata olursa &lt; 0.',
            '<code>exec()</code>, işlemin bellek alanını yeni bir programla değiştirir.',
            'Ebeveyn, çocuğun bitmesini beklemek için <code>wait()</code> çağırır.'
          ] },
          { t: 'p', html: 'Slayt 3.26\'daki programı adım adım çalıştır:' },
          { t: 'dg', id: 'fork' },
          { t: 'p', html: 'Windows karşılığı: <code>CreateProcess()</code> (yeni programı doğrudan yükler) ve <code>WaitForSingleObject()</code>.' },
          { t: 'h', text: 'İşlem sonlandırma' },
          { t: 'list', items: [
            'İşlem işi bitince <code>exit()</code> sistem çağrısıyla işletim sistemine bildirir. Durum verisi <code>wait()</code> ile ebeveyne döner; kaynaklar işletim sistemince geri alınır.',
            'Ebeveyn <code>abort()</code> ile çocuğu sonlandırabilir: çocuk ayrılan kaynakları aştıysa, görevine artık ihtiyaç yoksa, ebeveyn sonlanıyorsa ve işletim sistemi çocuğun devam etmesine izin vermiyorsa.',
            '<b>Basamaklı sonlandırma (cascading termination)</b>: bazı sistemlerde ebeveyn sonlanınca tüm çocuklar, torunlar vb. sonlandırılır; bunu işletim sistemi başlatır.',
            '<code>pid = wait(&amp;status);</code> sonlanan çocuğun durum bilgisini ve pid\'ini döndürür.'
          ] },
          { t: 'dg', id: 'ptree' },
          { t: 'compare', cols: [
            { title: 'Zombie', items: ['Çocuk sonlandı ama ebeveyn henüz <code>wait()</code> çağırmadı', 'İşlem tablosundaki girdisi (çıkış durumu) duruyor'] },
            { title: 'Orphan (öksüz)', items: ['Ebeveyn <code>wait()</code> çağırmadan sonlandı', 'Çocuk ebeveynsiz kaldı; (Ek) Linux\'ta init/systemd çocuğu sahiplenip wait() çağırır'] }
          ] },
          { t: 'h', text: 'Örnekler' },
          { t: 'list', items: [
            '<b>Android önem hiyerarşisi</b> (en önemliden en aza): ön plan → görünür → servis → arka plan → boş işlemler. Bellek gerektiğinde <b>en az önemliden başlayarak</b> sonlandırır.',
            '<b>Chrome çok işlemli mimari</b>: <b>Browser</b> işlemi (arayüz, disk ve ağ G/Ç), her web sitesi için ayrı <b>Renderer</b> işlemi (HTML, JavaScript; disk ve ağ G/Ç\'si kısıtlı bir korumalı alanda (sandbox) çalışır), her eklenti türü için <b>Plug-in</b> işlemi. Bir site çökse bile tarayıcının tamamı çökmez.'
          ] }
        ],
        checks: [
          { q: 'fork() ebeveynde ve çocukta ne döndürür?', a: 'Ebeveynde çocuğun pid\'ini (> 0), çocukta 0. Hata durumunda negatif değer.' },
          { q: 'exec() ne yapar? fork() ile farkı nedir?', a: 'exec(), çağıran işlemin bellek alanını yeni bir programla değiştirir; yeni işlem oluşturmaz. fork() ise yeni bir işlem (kopya) oluşturur.' },
          { q: 'Zombie ve orphan işlem arasındaki fark nedir?', a: 'Zombie: sonlanmış ama ebeveyni wait() çağırmamış çocuk. Orphan: ebeveyni wait() çağırmadan sonlanmış, hâlâ çalışan çocuk.' }
        ]
      },
      {
        id: 'ipc',
        title: 'İşlemler Arası İletişim (IPC)',
        en: 'Interprocess Communication',
        slides: '3.32 – 3.33',
        minutes: 4,
        blocks: [
          { t: 'compare', cols: [
            { title: 'Bağımsız (independent)', items: ['Başka bir işlemin yürütülmesini etkileyemez ve ondan etkilenemez'] },
            { title: 'İşbirlikçi (cooperating)', items: ['Veri paylaşımı dahil diğer işlemleri etkileyebilir veya onlardan etkilenebilir', '<b>IPC</b> mekanizmasına ihtiyaç duyar'] }
          ] },
          { t: 'p', html: 'İşbirlikçi işlemlerin dört nedeni: <b>bilgi paylaşımı</b>, <b>hesaplama hızlandırma</b>, <b>modülerlik</b>, <b>rahatlık</b>.' },
          { t: 'p', html: 'IPC\'nin iki modeli vardır (slayt 3.33):' },
          { t: 'dg', id: 'ipc' },
          { t: 'note', kind: 'extra', html: 'Paylaşılan bellek kurulduktan sonra erişimler normal bellek erişimidir, çekirdek araya girmez; bu yüzden <b>hızlıdır</b> ama senkronizasyon programcıya kalır. Mesaj geçişinde her mesaj sistem çağrısıyla çekirdekten geçer; <b>daha yavaştır</b> ama küçük veri ve dağıtık sistemler için kolaydır.' }
        ],
        checks: [
          { q: 'İşbirlikçi işlemlerin dört nedeni nedir?', a: 'Bilgi paylaşımı, hesaplama hızlandırma, modülerlik, rahatlık.' },
          { q: 'IPC\'nin iki modeli nedir?', a: 'Paylaşılan bellek (shared memory) ve mesaj geçişi (message passing).' }
        ]
      },
      {
        id: 'paylasilan-bellek',
        title: 'Paylaşılan Bellek ve Üretici–Tüketici',
        en: 'Shared Memory & Producer–Consumer',
        slides: '3.34 – 3.45',
        minutes: 10,
        blocks: [
          { t: 'p', html: '<b>Üretici–tüketici</b>, işbirlikçi işlemler için bir paradigmadır: <b>üretici</b> işlem bilgi üretir, <b>tüketici</b> işlem onu tüketir.' },
          { t: 'compare', cols: [
            { title: 'Sınırsız tampon (unbounded)', items: ['Tampon boyutuna pratik bir sınır yok', 'Üretici <b>asla beklemez</b>', 'Tüketici, tüketilecek öğe yoksa bekler'] },
            { title: 'Sınırlı tampon (bounded)', items: ['Sabit tampon boyutu', 'Üretici, <b>tampon doluysa</b> bekler', 'Tüketici, tüketilecek öğe yoksa bekler'] }
          ] },
          { t: 'h', text: 'Paylaşılan bellek çözümü' },
          { t: 'code', text: '#define BUFFER_SIZE 10\nitem buffer[BUFFER_SIZE];\nint in = 0;    // bir sonraki boş yuva\nint out = 0;   // ilk dolu yuva\n\n/* Üretici */\nwhile (true) {\n    while (((in + 1) % BUFFER_SIZE) == out)\n        ; /* dolu: bekle */\n    buffer[in] = next_produced;\n    in = (in + 1) % BUFFER_SIZE;\n}\n\n/* Tüketici */\nwhile (true) {\n    while (in == out)\n        ; /* boş: bekle */\n    next_consumed = buffer[out];\n    out = (out + 1) % BUFFER_SIZE;\n}' },
          { t: 'p', html: 'Dairesel tamponu kendin doldur ve boşalt. Neden yalnızca <b>BUFFER_SIZE − 1</b> öğe saklanabildiğini gör:' },
          { t: 'dg', id: 'ringbuf' },
          { t: 'table', head: ['Koşul', 'Anlamı'], rows: [
            ['in == out', 'Tampon <b>boş</b>'],
            ['(in + 1) % BUFFER_SIZE == out', 'Tampon <b>dolu</b> sayılır (bir yuva hep boş kalır)']
          ] },
          { t: 'h', text: 'Tüm tamponları kullanmak: sayaç ekle' },
          { t: 'p', html: 'Dolu yuva sayısını tutan bir <code>counter</code> (başlangıç 0) eklenirse tüm N yuva kullanılabilir: üretici yeni öğe koyunca <code>counter++</code>, tüketici alınca <code>counter--</code>. Bekleme koşulları <code>counter == BUFFER_SIZE</code> ve <code>counter == 0</code> olur.' },
          { t: 'h', text: 'Ama yarış durumu ortaya çıkar' },
          { t: 'p', html: '<code>counter++</code> ve <code>counter--</code> makine dilinde üçer komuttur ve araya bağlam değişimi girebilir:' },
          { t: 'code', text: 'register1 = counter          register2 = counter\nregister1 = register1 + 1    register2 = register2 - 1\ncounter = register1          counter = register2\n\ncount = 5 iken:\nS0: üretici  register1 = counter        {register1 = 5}\nS1: üretici  register1 = register1 + 1  {register1 = 6}\nS2: tüketici register2 = counter        {register2 = 5}\nS3: tüketici register2 = register2 - 1  {register2 = 4}\nS4: üretici  counter = register1        {counter = 6}\nS5: tüketici counter = register2        {counter = 4}   ← doğrusu 5' },
          { t: 'note', kind: 'exam', html: 'Slayt 3.45\'in sorusu: <b>N−1 çözümünde neden yarış durumu yoktur?</b> Çünkü <code>in</code> değişkenine <b>yalnızca üretici</b>, <code>out</code> değişkenine <b>yalnızca tüketici</b> yazar; her paylaşılan değişkenin tek yazanı vardır. Sayaç çözümünde ise <code>counter</code>\'a <b>ikisi birden yazar</b> ve okuma-değiştirme-yazma dizileri iç içe geçebilir.' }
        ],
        lab: { label: 'Synchronization laboratuvarında bu S0–S5 sıralamasını birebir çalıştır', preset: { module: 'sync', lab: 'cs', cfg: { mode: 'none', policy: 'textbook', initial: 5, iterations: 1, opB: 'dec', semValue: 1 } } },
        checks: [
          { q: 'Paylaşılan bellek çözümünde tampon ne zaman boş, ne zaman dolu sayılır?', a: 'Boş: in == out. Dolu: (in + 1) % BUFFER_SIZE == out.' },
          { q: 'Bu çözüm neden en fazla BUFFER_SIZE − 1 öğe tutabilir?', a: 'Tamamen dolu tamponda in == out olurdu; bu boş tamponla ayırt edilemez. Bu yüzden bir yuva hep boş bırakılır.' },
          { q: 'counter = 5 iken counter++ ve counter-- eşzamanlı çalışırsa hangi sonuçlar çıkabilir?', a: '4, 5 veya 6. Doğru sonuç 5\'tir; yarış durumu yüzünden 4 veya 6 çıkabilir.' }
        ]
      },
      {
        id: 'mesaj',
        title: 'Mesaj Geçişi',
        en: 'Message Passing',
        slides: '3.46 – 3.55',
        minutes: 8,
        blocks: [
          { t: 'p', html: 'İşlemler arasında mesaj gönderip almak için iki işlem vardır: <code>send(message)</code> ve <code>receive(message)</code>. Mesaj boyutu <b>sabit</b> ya da <b>değişken</b> olabilir. P ve Q iletişim kurmak isterse aralarında bir <b>iletişim bağlantısı (link)</b> kurulmalı ve send/receive ile mesaj alışverişi yapılmalıdır.' },
          { t: 'p', html: 'Gerçekleştirme soruları: Bağlantı nasıl kurulur? İkiden fazla işlemle ilişkilendirilebilir mi? Her çift arasında kaç bağlantı olabilir? Kapasitesi nedir? Mesaj boyutu sabit mi değişken mi? Tek yönlü mü çift yönlü mü?' },
          { t: 'compare', cols: [
            { title: 'Doğrudan (direct)', items: ['İşlemler birbirini <b>açıkça adlandırır</b>: <code>send(P, msg)</code>, <code>receive(Q, msg)</code>', 'Bağlantılar otomatik kurulur', 'Bir bağlantı tam olarak <b>bir çift</b> işlemle ilişkilidir', 'Her çift arasında tam olarak <b>bir</b> bağlantı', 'Tek yönlü olabilir, genellikle çift yönlü'] },
            { title: 'Dolaylı (indirect)', items: ['Mesajlar <b>posta kutularına (mailbox / port)</b> gönderilir: <code>send(A, msg)</code>, <code>receive(A, msg)</code>', 'Her posta kutusunun benzersiz kimliği var; ancak ortak kutu paylaşanlar iletişim kurar', 'Bir bağlantı <b>birçok işlemle</b> ilişkilendirilebilir', 'Her çift <b>birkaç</b> bağlantı paylaşabilir', 'Tek veya çift yönlü'] }
          ] },
          { t: 'p', html: 'Posta kutusu işlemleri: yeni kutu oluşturma, kutu üzerinden gönderme ve alma, kutuyu silme.' },
          { t: 'note', kind: 'exam', html: '<b>Posta kutusu paylaşım problemi</b>: P1, P2, P3 A kutusunu paylaşıyor; P1 gönderdi, P2 ve P3 alabilir. Mesajı kim alacak? Çözümler: (1) bir bağlantıyı <b>en fazla iki işlemle</b> sınırlamak, (2) aynı anda <b>yalnızca bir işlemin</b> receive yapmasına izin vermek, (3) sistemin alıcıyı <b>rastgele seçip</b> göndericiye kimin aldığını bildirmesi.' },
          { t: 'h', text: 'Senkronizasyon: bloklayan ve bloklamayan' },
          { t: 'table', head: ['', 'Bloklayan (blocking) = senkron', 'Bloklamayan (non-blocking) = asenkron'], rows: [
            ['send', 'Gönderen, mesaj alınana kadar bloklanır', 'Gönderen mesajı gönderir ve devam eder'],
            ['receive', 'Alıcı, mesaj gelene kadar bloklanır', 'Alıcı ya geçerli bir mesaj ya da <b>null</b> alır']
          ] },
          { t: 'p', html: 'Farklı kombinasyonlar mümkündür. <b>Hem send hem receive bloklayansa</b> buna <b>randevu (rendezvous)</b> denir.' },
          { t: 'h', text: 'Tamponlama (buffering)' },
          { t: 'table', head: ['Kapasite', 'Davranış'], rows: [
            ['Sıfır (zero)', 'Bağlantıda mesaj kuyruğa alınmaz; gönderen alıcıyı beklemelidir (randevu)'],
            ['Sınırlı (bounded)', 'En fazla n mesaj; bağlantı doluysa gönderen bekler'],
            ['Sınırsız (unbounded)', 'Sonsuz uzunluk; gönderen asla beklemez']
          ] },
          { t: 'code', text: '/* Üretici */                  /* Tüketici */\nwhile (true) {                 while (true) {\n    /* üret */                     receive(next_consumed);\n    send(next_produced);           /* tüket */\n}                              }' }
        ],
        checks: [
          { q: 'Doğrudan ve dolaylı iletişim arasındaki temel fark nedir?', a: 'Doğrudan iletişimde işlemler birbirini adıyla belirtir ve bağlantı tam bir çifte aittir. Dolaylıda mesajlar posta kutularına gönderilir; bir kutu birçok işlemce paylaşılabilir.' },
          { q: 'Randevu (rendezvous) nedir?', a: 'Hem send hem receive\'in bloklayan olduğu durum; gönderen ve alıcı mesaj alışverişinde buluşur. Sıfır kapasiteli tamponlamada da gönderen alıcıyı beklemek zorundadır.' },
          { q: 'Non-blocking receive mesaj yoksa ne döndürür?', a: 'Null (boş) mesaj.' }
        ]
      },
      {
        id: 'ipc-ornek',
        title: 'IPC Sistemlerine Örnekler: POSIX, Mach, Windows, Pipe',
        en: 'Examples of IPC Systems',
        slides: '3.56 – 3.67',
        minutes: 8,
        blocks: [
          { t: 'h', text: 'POSIX paylaşılan bellek' },
          { t: 'table', head: ['Çağrı', 'Görevi'], rows: [
            ['shm_open(name, O_CREAT | O_RDWR, 0666)', 'Paylaşılan bellek nesnesi oluşturur veya var olanı açar; dosya tanımlayıcısı döner'],
            ['ftruncate(shm_fd, 4096)', 'Nesnenin boyutunu ayarlar'],
            ['mmap(...)', 'Nesneyi işlemin adres alanına eşler; dönen işaretçiyle okunur/yazılır'],
            ['shm_unlink(name)', 'Paylaşılan bellek nesnesini kaldırır']
          ] },
          { t: 'p', html: 'Slayttaki örnekte üretici "OS" adlı nesneyi oluşturup "Hello" ve "World!" yazar; tüketici aynı adla açıp (<code>O_RDONLY</code>) okur ve <code>shm_unlink</code> ile kaldırır.' },
          { t: 'h', text: 'Mach' },
          { t: 'list', items: [
            'İletişim <b>mesaj tabanlıdır</b>: <b>sistem çağrıları bile mesajdır</b>.',
            'Her görev oluşturulurken iki port alır: <b>Kernel</b> ve <b>Notify</b>.',
            'Mesajlar <code>mach_msg()</code> ile gönderilir ve alınır; portlar <code>mach_port_allocate()</code> ile oluşturulur.',
            'Posta kutusu doluysa dört seçenek: <b>süresiz bekle</b>, <b>en fazla n ms bekle</b>, <b>hemen dön</b>, <b>mesajı geçici olarak önbelleğe al</b>.'
          ] },
          { t: 'h', text: 'Windows: ALPC (advanced local procedure call)' },
          { t: 'list', items: [
            'Mesaj geçişi merkezli; yalnızca <b>aynı sistemdeki</b> işlemler arasında çalışır.',
            'Portları (posta kutusu gibi) kullanır: istemci alt sistemin <b>bağlantı portuna (connection port)</b> bir tutamaç açar ve bağlantı isteği gönderir.',
            'Sunucu iki özel <b>iletişim portu</b> oluşturur, birinin tutamacını istemciye verir; mesajlar bu portlar üzerinden gider.',
            'Büyük mesajlar (&gt; 256 bayt) için <b>paylaşılan bölüm nesnesi</b> (shared section object) kullanılır.'
          ] },
          { t: 'h', text: 'Pipe\'lar' },
          { t: 'p', html: 'Pipe, iki işlemin iletişim kurmasını sağlayan bir kanaldır. Sorular: tek yönlü mü çift yönlü mü? Çift yönlüyse half- mı full-duplex mi? Ebeveyn–çocuk ilişkisi gerekli mi? Ağ üzerinden kullanılabilir mi?' },
          { t: 'dg', id: 'pipe' },
          { t: 'compare', cols: [
            { title: 'Sıradan pipe (ordinary)', items: ['Standart üretici–tüketici tarzı', 'Üretici <b>yazma ucuna</b> (fd[1]) yazar, tüketici <b>okuma ucundan</b> (fd[0]) okur', '<b>Tek yönlü</b>', '<b>Ebeveyn–çocuk ilişkisi gerekir</b>; oluşturan işlemin dışından erişilemez', 'Windows: <b>anonymous pipe</b>'] },
            { title: 'Adlandırılmış pipe (named)', items: ['Daha güçlü', '<b>Çift yönlü</b>', 'Ebeveyn–çocuk ilişkisi <b>gerekmez</b>', '<b>Birden çok işlem</b> kullanabilir', 'UNIX ve Windows\'ta var'] }
          ] }
        ],
        checks: [
          { q: 'POSIX paylaşılan bellek oluşturmanın üç adımı nedir?', a: 'shm_open ile nesneyi oluştur/aç, ftruncate ile boyutunu ayarla, mmap ile adres alanına eşle (sonra işaretçiyle oku/yaz; işin bitince shm_unlink).' },
          { q: 'Sıradan pipe ile adlandırılmış pipe arasındaki farklar?', a: 'Sıradan: tek yönlü, ebeveyn–çocuk ilişkisi gerekir, oluşturan işlem dışından erişilemez. Adlandırılmış: çift yönlü, ilişki gerekmez, birden çok işlem kullanabilir.' },
          { q: 'Pipe\'ta fd[0] ve fd[1] neyi gösterir?', a: 'fd[0] okuma ucu, fd[1] yazma ucu.' }
        ]
      },
      {
        id: 'istemci-sunucu',
        title: 'İstemci–Sunucu İletişimi: Soketler ve RPC',
        en: 'Communication in Client–Server Systems',
        slides: '3.68 – 3.75',
        minutes: 8,
        blocks: [
          { t: 'def', term: 'Soket', en: 'Socket', html: 'İletişim için bir <b>uç nokta</b>. <b>IP adresi ve port numarasının birleşimidir</b>; port, bir ana bilgisayardaki ağ servislerini ayırt etmek için mesaj paketinin başına eklenen sayıdır. İletişim <b>bir çift soket</b> arasında gerçekleşir.' },
          { t: 'dg', id: 'socket' },
          { t: 'list', items: [
            '<code>161.25.19.8:1625</code>, 161.25.19.8 adresli bilgisayardaki 1625 numaralı porta başvurur.',
            '<b>1024\'ün altındaki portlar</b> iyi bilinir ve standart servisler için kullanılır (ör. 80 web).',
            '<b>127.0.0.1 (loopback)</b>, işlemin çalıştığı sistemin kendisini ifade eder.',
            'Java\'da üç soket türü: <b>bağlantı yönelimli (TCP)</b>, <b>bağlantısız (UDP)</b>, <b>MulticastSocket</b> (veriyi birden çok alıcıya gönderir). Slayttaki Date sunucusu 6013 portunu dinler, istemci <code>new Socket("127.0.0.1", 6013)</code> ile bağlanır.'
          ] },
          { t: 'def', term: 'Uzaktan yordam çağrısı', en: 'Remote Procedure Call (RPC)', html: 'Ağa bağlı sistemlerdeki işlemler arasında <b>yordam çağrısını soyutlar</b>; servisleri ayırt etmek için yine portlar kullanılır.' },
          { t: 'list', items: [
            '<b>Stub</b>: sunucudaki gerçek yordam için <b>istemci tarafındaki vekil (proxy)</b>.',
            'İstemci tarafı stub sunucuyu bulur ve parametreleri <b>düzenler (marshalling)</b>.',
            'Sunucu tarafı stub mesajı alır, parametreleri paketten çıkarır ve yordamı sunucuda yürütür.',
            'Windows\'ta stub kodu <b>MIDL</b> (Microsoft Interface Definition Language) belirtimlerinden derlenir.',
            'Farklı mimariler için veri <b>XDR</b> (External Data Representation) biçimine çevrilir: <b>big-endian</b> ve <b>little-endian</b> farkı.',
            'Uzaktan iletişimde yerelden daha fazla hata senaryosu vardır.',
            'İşletim sistemi istemci ile sunucuyu buluşturmak için genellikle bir <b>buluşma (matchmaker)</b> servisi sağlar.'
          ] },
          { t: 'note', kind: 'warn', html: 'Slayt 3.74\'te iki hata var: (1) "XDL" yazıyor, doğrusu <b>XDR</b> (External Data Representation). (2) "Mesajlar en fazla bir kez değil, tam olarak bir kez teslim edilebilir" çevirisi kitabın anlamını karıştırıyor. Kitabın söylediği: ağ hataları yüzünden RPC\'nin <b>"en fazla bir kez" (at most once)</b> yerine <b>"tam olarak bir kez" (exactly once)</b> çalıştığından emin olmak gerekir. Bir mesaj kaybolup tekrar gönderilirse yordam iki kez çalışmamalıdır.' },
          { t: 'p', html: 'RPC\'nin yürütülmesi (slayt 3.75), matchmaker ile port bulma dahil:' },
          { t: 'dg', id: 'rpc' }
        ],
        checks: [
          { q: 'Soket nedir? 146.86.5.20:1625 ifadesini açıkla.', a: 'İletişim uç noktası: IP adresi + port. 146.86.5.20 adresli bilgisayardaki 1625 numaralı port.' },
          { q: 'RPC\'de stub ne işe yarar?', a: 'İstemci tarafında sunucudaki yordam için vekil olur: sunucuyu bulur, parametreleri paketler (marshalling) ve gönderir. Sunucu tarafındaki stub paketi açar ve yordamı çağırır.' },
          { q: 'XDR neden gereklidir?', a: 'İstemci ve sunucu farklı mimarilerde olabilir (big-endian ve little-endian); veri mimariden bağımsız ortak bir gösterime çevrilmelidir.' }
        ]
      }
    ]
  });
})(window.OSLab = window.OSLab || {});
