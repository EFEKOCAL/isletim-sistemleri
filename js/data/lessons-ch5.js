/*
 * lessons-ch5.js — Bölüm 5: CPU Zamanlama (ch05_TR.pdf, CPU Scheduling LAB Uygulaması.pdf, CPUScheduling_Ödev.pdf).
 * Gantt şekilleri ve sonuçlar diagrams-lab.js içinde scheduler-trace.js ile hesaplanır.
 */
(function (OSLab) {
  'use strict';

  OSLab.lessons = OSLab.lessons || { chapters: [] };

  OSLab.lessons.chapters.push({
    id: 'ch5',
    num: 5,
    title: 'CPU Zamanlama',
    en: 'CPU Scheduling',
    source: 'ch05_TR.pdf, CPU Scheduling LAB ve Ödev',
    objectives: [
      'Bekleme, turnaround ve yanıt süresini tanımlamak ve hesaplamak',
      'Kesmeli ve kesmesiz zamanlamayı ayırt etmek',
      'FCFS, SJF, SRTF, öncelikli planlama ve Round Robin için Gantt şeması çizmek',
      'Algoritmaları ortalama bekleme süresi, açlık ve yanıt süresi açısından karşılaştırmak',
      'Kuantum seçiminin etkisini açıklamak',
      'Çok işlemcili ve gerçek zamanlı planlamanın sorunlarını açıklamak',
      'Linux, Windows ve Solaris planlayıcılarını tanımak',
      'Modelleme ve simülasyonla planlama algoritmalarını değerlendirmek'
    ],
    lessons: [
      {
        id: 'temel',
        title: 'CPU Zamanlama Neden Gerekli?',
        en: 'Basic Concepts',
        slides: '5.4 – 5.11',
        minutes: 8,
        blocks: [
          { t: 'h', text: 'CPU burst nedir?' },
          { t: 'p', html: 'Çoklu programlama CPU kullanımını en üst düzeye çıkarır. İşlemin yürütülmesi <b>CPU–G/Ç burst döngüsünden</b> oluşur: CPU\'da çalışma ile G/Ç bekleme sırayla değişir. İşlemin tek seferde CPU\'da çalışacağı süreye <b>CPU burst</b> denir. Sorulardaki "burst time" budur.' },
          { t: 'p', html: 'Histogramda (slayt 5.5) <b>çok sayıda kısa</b>, <b>az sayıda uzun</b> burst görülür. Planlama bu dağılımı hesaba katar.' },
          { t: 'h', text: 'CPU zamanlayıcı' },
          { t: 'def', term: 'CPU zamanlayıcı', en: 'CPU scheduler', html: 'Bellekte çalışmaya hazır bekleyen işlemlerden birini seçip CPU\'yu ona ayırır. Bölüm 3\'teki <b>kısa vadeli zamanlayıcıdır</b> (short-term scheduler). Hazır kuyruğu farklı şekillerde sıralanabilir.' },
          { t: 'h', text: 'Zamanlayıcı ne zaman karar verir?' },
          { t: 'list', ordered: true, items: [
            'İşlem <b>running → waiting</b> geçtiğinde',
            'İşlem <b>running → ready</b> geçtiğinde',
            'İşlem <b>waiting → ready</b> geçtiğinde',
            'İşlem <b>sonlandığında</b>'
          ] },
          { t: 'note', kind: 'exam', attach: true, html: '<b>1 ve 4. durumlarda seçim yoktur:</b> CPU boşalmıştır, yeni işlem seçilmelidir (nonpreemptive). <b>2 ve 3. durumlarda seçim vardır</b> (preemptive).' },
          { t: 'h', text: 'Kesmeli ve kesmesiz zamanlama' },
          { t: 'compare', cols: [
            { title: 'Kesmesiz (nonpreemptive)', items: ['İşlem CPU\'yu ancak <b>bitince</b> veya G/Ç için <b>kendisi bırakınca</b> verir', 'Örnekler: FCFS, SJF, kesmesiz öncelikli'] },
            { title: 'Kesmeli (preemptive)', items: ['İşletim sistemi çalışan işlemi <b>elinden alabilir</b>', 'Windows, macOS, Linux ve UNIX dahil hemen hemen tüm modern sistemler kullanır', 'Örnekler: SRTF, kesmeli öncelikli, Round Robin'] }
          ] },
          { t: 'note', kind: 'info', attach: true, html: '<b>Yarış koşulu riski:</b> Veri paylaşan iki işlemden biri veriyi güncellerken kesilirse, diğeri tutarsız veriyi okuyabilir. Bu sorun Bölüm 6\'da ele alınır.' },
          { t: 'h', text: 'Görev dağıtıcısı' },
          { t: 'def', keep: true, term: 'Görev dağıtıcısı', en: 'Dispatcher', html: 'Zamanlayıcı (CPU scheduler) <b>hangi</b> işlemin çalışacağına karar verir; dağıtıcı bu kararı <b>uygular</b> ve CPU\'nun kontrolünü seçilen işleme verir. Bunu üç adımda yapar.' },
          { t: 'list', ordered: true, items: [
            '<b>Bağlam değişimi (context switch):</b> İşlemin "bağlamı", CPU\'yu bıraktığı andaki durumudur (program sayacı, yazmaçlar) ve <b>PCB</b>\'sinde tutulur. Dağıtıcı eski işlemin durumunu PCB\'sine <b>kaydeder</b>, yeni işleminkini PCB\'sinden <b>geri yükler</b>.',
            '<b>Kullanıcı moduna geçiş (switching to user mode):</b> Dağıtıcı işletim sisteminin parçasıdır ve <b>çekirdek modunda</b> çalışır. Seçilen işlem sıradan bir program olduğu için CPU ona verilmeden önce mod biti <b>kullanıcı moduna</b> çekilir (Bölüm 1, çift mod).',
            '<b>Programda doğru konuma atlama:</b> İşlem baştan değil, <b>kaldığı komuttan</b> devam eder. Geri yüklenen program sayacı bu adresi gösterir; CPU oraya atlar.'
          ] },
          { t: 'note', kind: 'exam', attach: true, html: '<b>Gönderim gecikmesi (dispatch latency):</b> Bu üç adımın süresi, yani bir işlemi durdurup diğerini başlatmak için geçen zaman (slayt 5.9: P0 → PCB0\'a kaydet → PCB1\'den yükle → P1). Bu sırada hiçbir kullanıcı işlemi ilerlemez; kısa olması istenir.' },
          { t: 'h', text: 'Planlama kriterleri' },
          { t: 'table', head: ['Kriter', 'Anlamı', 'Hedef'], rows: [
            ['CPU kullanımı (utilization)', 'CPU\'yu olabildiğince meşgul tutmak', 'En yüksek'],
            ['Üretilen iş (throughput)', 'Birim zamanda biten işlem sayısı', 'En yüksek'],
            ['Devir zamanı (turnaround)', 'İşlemin gelişinden bitişine kadar geçen toplam süre', 'En düşük'],
            ['Bekleme süresi (waiting)', 'İşlemin hazır kuyruğunda geçirdiği toplam süre', 'En düşük'],
            ['Yanıt süresi (response)', 'İstek ile ilk yanıt arasında geçen süre', 'En düşük']
          ] },
          { t: 'h', text: 'Üç ölçüt' },
          { t: 'p', html: 'Sorularda istenen ölçütler bir işlemin zaman çizelgesi üzerinden şöyle görünür:' },
          { t: 'dg', id: 'metrics' },
          { t: 'note', kind: 'exam', html: 'Ezberle: <b>Turnaround = bitiş − geliş</b>. <b>Bekleme = turnaround − burst</b>. <b>Yanıt = ilk çalışma − geliş</b>. Bu iki eşitlik her algoritmada geçerlidir; kesmeli sorularda parça parça toplamaktan daha az hata yaptırır.' }
        ],
        checks: [
          { q: 'Kesmeli ve kesmesiz zamanlama arasındaki fark nedir?', a: 'Kesmesizde işlem CPU\'yu bitince veya G/Ç için kendisi bırakınca verir. Kesmelide işletim sistemi çalışan işlemi durdurup CPU\'yu başka işleme verebilir.' },
          { q: 'Bir işlem t=3\'te geldi, burst süresi 4, t=12\'de bitti. Turnaround ve bekleme süresi kaçtır?', a: 'Turnaround = 12 − 3 = 9. Bekleme = 9 − 4 = 5.' },
          { q: 'Dağıtıcı (dispatcher) hangi üç işi yapar?', a: 'Bağlam değişimi (context switch) yapar: eski işlemin durumunu PCB\'sine kaydeder, yenisininkini yükler. Kullanıcı moduna geçer. Programın kaldığı adrese atlar.' },
          { q: 'CPU zamanlayıcısı dört durumda karar verir: işlem (1) running → waiting, (2) running → ready, (3) waiting → ready geçtiğinde ve (4) sonlandığında. Bunlardan hangilerinde seçim yoktur, neden?', a: 'Running → waiting ve sonlanma durumlarında. CPU boşaldığı için yeni işlem seçilmelidir. Running → ready ve waiting → ready durumlarında seçim vardır.' }
        ]
      },
      {
        id: 'fcfs',
        title: 'FCFS: İlk Gelen İlk Çalışır',
        en: 'First-Come, First-Served',
        src: 'slayt 5.13 – 5.14, CPU Scheduling LAB s. 1–3',
        minutes: 5,
        blocks: [
          { t: 'def', term: 'FCFS', en: 'First-Come, First-Served', html: 'CPU, hazır kuyruğuna <b>ilk gelen</b> işleme verilir ve iş bitene kadar geri alınmaz. <b>Kesmesizdir</b>; FIFO kuyruğuyla kolayca gerçekleştirilir.' },
          { t: 'h', text: 'Örnek: uzun iş önde' },
          { t: 'dg', id: 'g-fcfs1' },
          { t: 'h', text: 'Aynı işler, farklı sıra' },
          { t: 'dg', id: 'g-fcfs2' },
          { t: 'h', text: 'Sonuç: konvoy etkisi' },
          { t: 'p', html: 'İşler aynı, yalnızca sıra değişti: ortalama bekleme <b>17 ms\'den 3 ms\'ye</b> düştü. Uzun bir işin arkasında kısa işlerin birikmesine <b>konvoy etkisi</b> (convoy effect) denir. FCFS\'in ana zayıflığı budur.' }
        ],
        lab: { label: 'CPU Scheduling laboratuvarında bu örneği çalıştır', preset: { algorithm: 'FCFS', processes: [['P1', 0, 24], ['P2', 0, 3], ['P3', 0, 3]] } },
        checks: [
          { q: 'FCFS kesmeli midir? Neden?', a: 'Hayır, kesmesizdir. İşlem CPU\'yu aldıktan sonra bitene kadar bırakmaz.' },
          { q: 'Konvoy etkisi nedir?', a: 'Uzun süren bir işlemin CPU\'yu tutması ve kısa işlemlerin arkasında birikip uzun süre beklemesi.' }
        ]
      },
      {
        id: 'sjf',
        title: 'SJF: En Kısa İş Önce',
        en: 'Shortest Job First',
        src: 'slayt 5.15 – 5.19, CPU Scheduling LAB s. 4–5',
        minutes: 8,
        blocks: [
          { t: 'def', term: 'SJF', en: 'Shortest Job First', html: 'CPU boşaldığında hazır işlemlerden <b>burst süresi en kısa</b> olan seçilir. Bu ders kesmesiz sürümü anlatır; kesmeli sürümü bir sonraki derste.' },
          { t: 'h', text: 'Örnek' },
          { t: 'dg', id: 'g-sjf' },
          { t: 'h', text: 'Güçlü ve zayıf yanları' },
          { t: 'compare', cols: [
            { title: 'Güçlü yanı', items: ['Verilen bir iş kümesi için <b>en küçük ortalama bekleme süresini</b> verir (optimaldir)', 'Kısa işi öne almak, arkasındaki herkesin beklemesini azaltır'] },
            { title: 'Zayıf yanları', items: ['Sonraki burst süresi önceden <b>bilinemez</b>, yalnızca tahmin edilir', 'Sürekli kısa iş gelirse uzun iş <b>açlık</b> (starvation) yaşayabilir'] }
          ] },
          { t: 'h', text: 'Sonraki burst nasıl tahmin edilir?' },
          { t: 'def', term: 'Üstel ortalama', en: 'Exponential averaging', html: 'τ<sub>n+1</sub> = α·t<sub>n</sub> + (1−α)·τ<sub>n</sub>. Burada t<sub>n</sub> n. burst\'ün gerçek uzunluğu, τ<sub>n+1</sub> sonraki burst tahmini, 0 ≤ α ≤ 1\'dir. Genellikle <b>α = ½</b> alınır. En kısa tahmini burst\'e sahip işlem seçilir.' },
          { t: 'table', head: ['α', 'Sonuç'], rows: [
            ['α = 0', 'τ<sub>n+1</sub> = τ<sub>n</sub>: yakın geçmiş dikkate alınmaz'],
            ['α = 1', 'τ<sub>n+1</sub> = t<sub>n</sub>: yalnızca son gerçek burst dikkate alınır'],
            ['0 &lt; α &lt; 1', 'Formül açılınca α ve (1−α) en fazla 1 olduğu için her eski terimin ağırlığı bir öncekinden azdır']
          ] },
          { t: 'p', html: 'Örnek (slayt 5.18, α = ½, τ₀ = 10):' },
          { t: 'table', head: ['n', '0', '1', '2', '3', '4', '5', '6'], rows: [
            ['Gerçek burst t', '6', '4', '6', '4', '13', '13', '13'],
            ['Tahmin τ', '10', '8', '6', '6', '5', '9', '11']
          ] }
        ],
        lab: { label: 'CPU Scheduling laboratuvarında bu örneği çalıştır', preset: { algorithm: 'SJF', processes: [['P1', 0, 6], ['P2', 0, 8], ['P3', 0, 7], ['P4', 0, 3]] } },
        checks: [
          { q: 'SJF neden optimal sayılır?', a: 'Kısa işi öne almak, arkasındaki tüm işlerin beklemesini azaltır; bu yüzden verilen iş kümesi için en küçük ortalama bekleme süresini verir.' },
          { q: 'SJF\'in gerçek sistemdeki temel sorunu nedir?', a: 'Sonraki CPU burst süresi önceden bilinemez, tahmin edilmesi gerekir. Ayrıca uzun işler açlık yaşayabilir.' },
          { q: 'Üstel ortalamada α = 0 ve α = 1 ne anlama gelir?', a: 'α = 0: yakın geçmiş dikkate alınmaz, tahmin değişmez. α = 1: yalnızca son gerçek burst dikkate alınır.' }
        ]
      },
      {
        id: 'srtf',
        title: 'SRTF: En Kısa Kalan Süre Önce',
        en: 'Shortest Remaining Time First',
        src: 'slayt 5.20, CPU Scheduling LAB s. 6–7',
        minutes: 6,
        blocks: [
          { t: 'def', term: 'SRTF', en: 'Shortest Remaining Time First (SRJF)', html: 'SJF\'in <b>kesmeli</b> sürümüdür. Yeni bir işlem geldiğinde, kalan süresi çalışan işlemin kalan süresinden kısaysa CPU ona geçer. Laboratuvar slaytında <b>SRJF</b> adıyla geçer; ikisi aynı algoritmadır.' },
          { t: 'h', text: 'Örnek' },
          { t: 'dg', id: 'g-srtf' },
          { t: 'h', text: 'Bekleme nasıl hesaplanır?' },
          { t: 'p', html: 'P1 iki parça halinde çalıştı. Parçalarla hesap: kesildiği t=1\'den yeniden başladığı t=10\'a kadar <b>10 − 1 = 9</b> bekledi. Formülle hesap: turnaround 17 − 0 = 17, bekleme <b>17 − 8 = 9</b>. İkisi de aynı sonucu verir.' },
          { t: 'note', kind: 'exam', html: 'Karar anları yalnızca <b>yeni işlem geldiğinde</b> ve <b>çalışan işlem bittiğinde</b> oluşur. Kalan süre eşitse çalışan işlem genellikle CPU\'da kalır; gereksiz bağlam değişimi yapılmaz.' }
        ],
        checks: [
          { q: 'SJF ile SRTF arasındaki fark nedir?', a: 'SJF kesmesizdir: seçilen iş bitene kadar çalışır. SRTF kesmelidir: daha kısa kalan süreli iş gelirse çalışan iş kesilir.' },
          { q: 'SRTF\'te hangi anlarda karar verilir?', a: 'Yeni bir işlem geldiğinde ve çalışan işlem bittiğinde.' }
        ]
      },
      {
        id: 'oncelik',
        title: 'Öncelikli Planlama',
        en: 'Priority Scheduling',
        src: 'slayt 5.21, 5.26 – 5.27, CPU Scheduling LAB s. 8–9',
        minutes: 9,
        blocks: [
          { t: 'def', term: 'Öncelikli planlama', en: 'Priority Scheduling', html: 'Her işleme bir öncelik sayısı atanır ve CPU en yüksek öncelikli işleme verilir. Kabul olarak <b>küçük sayı yüksek önceliktir</b>. Kesmeli ve kesmesiz sürümleri vardır. <b>SJF</b>, önceliğin tahmini sonraki burst\'ün tersi olduğu özel bir öncelikli planlamadır.' },
          { t: 'h', text: 'Hepsi aynı anda hazırsa' },
          { t: 'dg', id: 'g-prio-slide' },
          { t: 'h', text: 'Kesmeli sürüm' },
          { t: 'dg', id: 'g-prio-p' },
          { t: 'h', text: 'Kesmesiz sürüm' },
          { t: 'dg', id: 'g-prio-n' },
          { t: 'h', text: 'Fark nerede oluştu?' },
          { t: 'p', html: 'P2 (öncelik 1), t=1\'de geldi. Kesmeli sürümde P1\'i hemen kesti ve hiç beklemedi. Kesmesiz sürümde P1\'in bitmesini bekledi: <b>bekleme 0\'dan 9\'a</b> çıktı. Ortalama bekleme de <b>7\'den 9\'a</b> yükseldi.' },
          { t: 'h', text: 'Aynı önceliğe Round Robin' },
          { t: 'p', html: 'Slayt 5.27: İşlemler önceliğe göre çalışır, aynı öncelikte olanlara <b>RR</b> uygulanır. Burst/öncelik: P1 4/3, P2 5/2, P3 8/2, P4 7/1, P5 3/3; q = 2.' },
          { t: 'code', text: 'P4 | P2 | P3 | P2 | P3 | P2 | P3 | P1 | P5 | P1 | P5\n0  7    9   11   13   15   16   20   22   24   26   27' },
          { t: 'h', text: 'Açlık ve yaşlandırma' },
          { t: 'compare', cols: [
            { title: 'Sorun: açlık (starvation)', items: ['Sürekli yüksek öncelikli iş gelirse düşük öncelikli iş hiç CPU alamayabilir'] },
            { title: 'Çözüm: yaşlandırma (aging)', items: ['Bekleyen işlemin önceliği <b>zamanla yükseltilir</b>', 'Böylece her işlem eninde sonunda çalışır'] }
          ] }
        ],
        checks: [
          { q: 'Öncelikli planlamada açlık nedir, nasıl önlenir?', a: 'Düşük öncelikli işlemin yüksek öncelikli işler yüzünden hiç CPU alamamasıdır. Bekleyen işlemin önceliğini zamanla artıran yaşlandırma (aging) ile önlenir.' },
          { q: 'Kesmesiz öncelikli planlamada yüksek öncelikli iş geldiğinde ne olur?', a: 'Çalışan işlem kesilmez. Yeni iş hazır kuyruğunda bekler; çalışan iş bitince en yüksek öncelikli olan seçilir.' }
        ]
      },
      {
        id: 'rr',
        title: 'Round Robin: Sırayla Zaman Dilimi',
        en: 'Round Robin',
        src: 'slayt 5.22 – 5.25, CPU Scheduling LAB s. 10',
        minutes: 7,
        blocks: [
          { t: 'def', term: 'Round Robin', en: 'RR', html: 'FCFS\'e benzer ama her işlem en fazla bir <b>zaman dilimi</b> (time quantum, q) kadar çalışır. Bitmediyse kesilir ve hazır kuyruğunun <b>sonuna</b> döner. <b>Kesmelidir</b>; zaman paylaşımlı sistemler için tasarlanmıştır. Kuyrukta n işlem varsa her biri CPU zamanının <b>1/n</b>\'ini alır.' },
          { t: 'h', text: 'Örnek' },
          { t: 'dg', id: 'g-rr4' },
          { t: 'h', text: 'Kuantum nasıl seçilir?' },
          { t: 'table', head: ['Kuantum', 'Sonuç'], rows: [
            ['Çok büyük', 'Hiçbir iş kesilmez; RR, <b>FCFS gibi</b> davranır'],
            ['Çok küçük', 'Yanıt iyi olur ama sürekli <b>bağlam değişimi</b> (context switch) CPU zamanını harcar'],
            ['Dengeli', 'CPU burst\'lerinin yaklaşık <b>%80</b>\'i q\'dan kısa olmalıdır']
          ] },
          { t: 'p', html: 'Tipik değerler: <b>q = 10–100 ms</b>, bağlam değişimi <b>&lt; 10 µs</b>. q, bağlam değişimi süresine göre büyük olmalıdır.' },
          { t: 'table', head: ['10 birimlik işlem', 'q = 12', 'q = 6', 'q = 1'], rows: [
            ['Bağlam değişimi', '0', '1', '9']
          ] },
          { t: 'p', html: 'Devir zamanı q büyüdükçe düzenli olarak iyileşmez. Slayt 5.25\'te burst\'leri 6, 3, 1, 7 olan dört işlemde ortalama devir zamanı q = 1–7 için 11,0 ile 12,25 arasında iner çıkar; q = 6 ve 7\'de 10,5\'e düşer.' },
          { t: 'note', kind: 'exam', html: 'RR\'de ortalama bekleme genellikle SJF\'ten yüksektir ama <b>yanıt süresi</b> iyidir. n işlem varsa hiçbir işlem bir dilim için (n−1)·q süresinden fazla beklemez. Sorularda bağlam değişimi süresi aksi söylenmedikçe 0 alınır.' }
        ],
        lab: { label: 'CPU Scheduling laboratuvarında q değerini değiştirip sonucu izle', preset: { algorithm: 'RR', quantum: 4, processes: [['P1', 0, 24], ['P2', 0, 3], ['P3', 0, 3]] } },
        checks: [
          { q: 'Kuantum çok büyük seçilirse RR neye dönüşür?', a: 'FCFS\'e. İşler bir dilim içinde bittiği için kesilme olmaz.' },
          { q: 'Kuantum çok küçük seçilirse ne olur?', a: 'Yanıt süresi iyileşir ama sık bağlam değişimi yüzünden CPU zamanının büyük kısmı boşa gider.' },
          { q: 'Dilimi dolan işlem nereye gider?', a: 'Hazır kuyruğunun sonuna.' }
        ]
      },
      {
        id: 'coklu-kuyruk',
        title: 'Çok Düzeyli Kuyruklar',
        en: 'Multilevel & Multilevel Feedback Queues',
        slides: '5.28 – 5.32',
        minutes: 6,
        blocks: [
          { t: 'def', term: 'Çok düzeyli kuyruk', en: 'Multilevel Queue', html: 'Her öncelik için ayrı kuyruk tutulur; işlemler en yüksek öncelikli kuyruktan başlayarak planlanır. Hazır kuyruğu örneğin <b>ön plan</b> (etkileşimli) ve <b>arka plan</b> (toplu iş) olarak ayrılır; her kuyruğun kendi algoritması vardır: ön plan RR, arka plan FCFS.' },
          { t: 'h', text: 'Kuyruklar arasında planlama' },
          { t: 'compare', cols: [
            { title: 'Sabit öncelik', items: ['Önce ön plandakiler, sonra arka plandakiler', '<b>Açlık</b> oluşabilir'] },
            { title: 'Zaman dilimi', items: ['Her kuyruk CPU zamanından belli bir pay alır', 'Örnek: %80 ön plan (RR), %20 arka plan (FCFS)'] }
          ] },
          { t: 'p', html: 'İşlem türüne göre öncelik sırası (slayt 5.30): <b>gerçek zamanlı → sistem → etkileşimli → toplu iş</b>.' },
          { t: 'h', text: 'Geri bildirimli kuyruk' },
          { t: 'def', term: 'Çok düzeyli geri bildirimli kuyruk', en: 'Multilevel Feedback Queue', html: 'İşlem kuyruklar arasında <b>hareket edebilir</b>. Beş parametreyle tanımlanır: kuyruk sayısı, her kuyruğun algoritması, yükseltme yöntemi, indirgeme yöntemi ve işlemin hizmet gerektiğinde gireceği kuyruk. <b>Yaşlandırma</b> bu yapıyla uygulanabilir.' },
          { t: 'dg', id: 'mlfq' }
        ],
        checks: [
          { q: 'Çok düzeyli kuyruk ile geri bildirimli kuyruk arasındaki fark nedir?', a: 'Çok düzeyli kuyrukta işlem kendi kuyruğunda kalır. Geri bildirimli yapıda işlem davranışına göre kuyruklar arasında yükseltilip indirgenebilir.' },
          { q: 'Q0 (q=8), Q1 (q=16), Q2 (FCFS) sisteminde 30 ms\'lik iş nasıl ilerler?', a: 'Q0\'da 8 ms çalışır, bitmez ve Q1\'e iner. Q1\'de 16 ms daha çalışır, bitmez ve Q2\'ye iner. Kalan 6 ms\'yi Q2\'de FCFS ile tamamlar.' }
        ]
      },
      {
        id: 'karsilastirma',
        title: 'Algoritmaları Karşılaştırma ve Soru Çözme',
        en: 'Comparison & Exam Method',
        src: 'CPU Scheduling LAB',
        minutes: 5,
        blocks: [
          { t: 'h', text: 'Algoritmalar yan yana' },
          { t: 'table', head: ['Algoritma', 'Kesmeli mi?', 'Seçim ölçütü', 'Temel sorun'], rows: [
            ['FCFS', 'Hayır', 'Geliş sırası', 'Konvoy etkisi'],
            ['SJF', 'Hayır', 'En kısa burst', 'Burst bilinmez, açlık'],
            ['SRTF', 'Evet', 'En kısa kalan süre', 'Burst bilinmez, açlık, sık kesilme'],
            ['Öncelikli', 'İkisi de olur', 'En yüksek öncelik', 'Açlık (çözüm: yaşlandırma)'],
            ['Round Robin', 'Evet', 'Kuyruk sırası, q süre', 'Kuantum seçimi, bağlam değişimi'],
            ['Çok düzeyli kuyruk', 'Kuyruğa göre', 'Kuyruk önceliği', 'Sabit öncelikte açlık']
          ] },
          { t: 'h', text: 'Soru çözme yöntemi' },
          { t: 'list', ordered: true, items: [
            'Tabloyu oku: geliş, burst, öncelik ve q değerlerini not et. Geliş yoksa hepsini <b>t=0</b> al.',
            'Algoritma <b>kesmeli mi</b>, belirle. Kesmeliyse kararı her gelişte yeniden ver.',
            'Gantt şemasını çiz ve toplam süreyi burst toplamıyla kontrol et.',
            'Her işlem için: <b>turnaround = bitiş − geliş</b>, <b>bekleme = turnaround − burst</b>.',
            'Ortalamaları hesapla: toplamı işlem sayısına böl.'
          ] },
          { t: 'note', kind: 'exam', html: 'Sık yapılan hatalar: Bekleme hesabında geliş zamanını çıkarmayı unutmak. SRTF\'te toplam burst yerine <b>kalan süreyi</b> karşılaştırmak gerektiğini atlamak. RR\'de kesilen işlemi kuyruğun sonuna değil başına koymak.' }
        ],
        checks: [
          { q: 'FCFS, SJF, SRTF, öncelikli ve RR\'den hangileri kesin olarak kesmelidir?', a: 'SRTF ve Round Robin. Öncelikli planlamanın ise hem kesmeli hem kesmesiz sürümü vardır.' },
          { q: 'Hangi algoritmalar açlığa yol açabilir?', a: 'SJF, SRTF, öncelikli planlama ve sabit öncelikli çok düzeyli kuyruk. FCFS ve Round Robin\'de her iş eninde sonunda sıra alır.' }
        ]
      },
      {
        id: 'odev',
        title: 'Çözümlü Ödev Soruları',
        en: 'Solved Homework',
        src: 'CPUScheduling_Ödev.pdf',
        minutes: 25,
        blocks: [
          { t: 'p', html: 'Her soruyu önce kağıt üzerinde çöz, sonra <b>Çözümü göster</b> ile kontrol et. Çözümler adım adım ilerler ve hesap tablosu sen ilerledikçe dolar.' },
          { t: 'solve', title: 'Soru 1a · FCFS', q: 'P1, P2, P3, P4 sırasıyla 10, 8, 6, 4 ms sürer ve bu sırayla çalıştırılır. Her görevin ve ortalamanın bekleme süresini hesapla.', dg: 'hw1a', a: 'Sonuç: bekleme 0, 10, 18, 24. <b>Ortalama = 13 ms.</b>' },
          { t: 'solve', title: 'Soru 1b · SJF', q: 'Aynı görevler için SJF ile bekleme sürelerini ve ortalamayı hesapla.', dg: 'hw1b', a: 'Sıra P4, P3, P2, P1. Bekleme P1=18, P2=10, P3=4, P4=0. <b>Ortalama = 8 ms.</b>' },
          { t: 'solve', title: 'Soru 1c · Karşılaştırma', q: 'İki algoritmanın sonuçlarını karşılaştırıp açıkla.', a: 'SJF\'in ortalaması <b>8 ms</b>, FCFS\'in <b>13 ms</b>. Burada FCFS en uzun işi öne alır ve kısa işler onun arkasında birikir. SJF sırayı tersine çevirir; kısa işler önce biter ve daha az iş bekler. Bedeli, uzun işin (P1) beklemesinin 0\'dan 18\'e çıkmasıdır. SJF ortalamayı düşürür ama uzun iş açısından adil değildir.' },
          { t: 'solve', title: 'Soru 2 · Round Robin', q: 'P1, P2, P3, P4 sırasıyla 10, 5, 8, 12 ms sürer, q=2 ms. Her görevin bitiş süresini hesapla.', dg: 'hw2', a: 'Soruda geliş verilmediği için hepsi t=0 alındı. Bitiş: <b>P1=31, P2=19, P3=27, P4=35.</b>' },
          { t: 'solve', title: 'Soru 3 · SRTF', q: 'Geliş ve burst: P1 (5, 6), P2 (0, 8), P3 (1, 7), P4 (6, 3). Bekleme ve turnaround sürelerini hesapla.', dg: 'hw3', a: 'Bekleme P1=6, P2=0, P3=16, P4=2. Turnaround P1=12, P2=8, P3=23, P4=5. <b>Dikkat:</b> t=1\'de P2\'nin kalanı 7, P3\'ün burst\'ü de 7\'dir. Eşitlikte çalışan işlem kalır, bu yüzden kesilme olmaz.' },
          { t: 'solve', title: 'Soru 4 · Öncelikli planlama', q: 'Burst, geliş, öncelik: P1 (10, 0, 3), P2 (1, 1, 1), P3 (2, 2, 4), P4 (1, 3, 5), P5 (5, 4, 2). Her görevin bitiş süresini ve ortalama beklemeyi hesapla.', dg: 'hw4p', a: 'Soru kesmeli olup olmadığını belirtmiyor, laboratuvar slaytı ikisini de çözüyor. <b>Kesmeli:</b> bitiş P1=16, P2=2, P3=18, P4=19, P5=9; <b>ortalama bekleme 7 ms.</b> Kesmesiz sürüm için sonraki karta geç.' },
          { t: 'solve', title: 'Soru 4 · Kesmesiz sürüm', q: 'Aynı tablo, kesmesiz öncelikli planlama.', dg: 'hw4n', a: 'Bitiş P1=10, P2=11, P3=18, P4=19, P5=16. <b>Ortalama bekleme 9 ms.</b>' },
          { t: 'solve', title: 'Soru 5 · RR, q=3', q: 'P1, P2, P3, P4 sırasıyla 16, 10, 1, 5 ms sürer. q=3 için turnaround ve ortalama beklemeyi hesapla.', dg: 'hw5q3', a: 'Turnaround 32, 28, 7, 18. <b>Ortalama bekleme 13.25 ms.</b>' },
          { t: 'solve', title: 'Soru 5 · RR, q=4', q: 'Aynı görevler, q=4.', dg: 'hw5q4', a: 'Turnaround 32, 28, 9, 22. <b>Ortalama bekleme 14.75 ms.</b>' },
          { t: 'solve', title: 'Soru 5 · RR, q=5', q: 'Aynı görevler, q=5.', dg: 'hw5q5', a: 'Turnaround 32, 26, 11, 16. <b>Ortalama bekleme 13.25 ms.</b>' },
          { t: 'h', text: 'Soru 5 · Karşılaştırma' },
          { t: 'table', head: ['q', 'Ort. turnaround', 'Ort. bekleme', 'Bağlam değişimi', 'P3\'ün bitişi'], rows: [
            ['3', '21.25', '13.25', '11', '7'],
            ['4', '22.75', '14.75', '9', '9'],
            ['5', '21.25', '13.25', '6', '11']
          ] },
          { t: 'p', html: 'Ortalama, q büyüdükçe düzenli olarak iyileşmez: q=4 en kötü sonucu verdi, q=3 ve q=5 eşit çıktı. Düzenli değişen şeyler başkadır: q büyüdükçe <b>bağlam değişimi azalır</b>, ama 1 ms\'lik P3 gibi kısa işler <b>daha geç</b> biter. Yani asıl ödünleşim, yanıt süresi ile bağlam değişimi maliyeti arasındadır.' },
          { t: 'solve', title: 'Soru 6 · Kesmeli öncelik + SJF', q: 'Geliş, öncelik, burst: P1 (0, 2, 8), P2 (1, 1, 3), P3 (2, 3, 6), P4 (3, 2, 1), P5 (2, 1, 4), P6 (4, 3, 5). Aynı öncelikte kısa olan önce çalışır. Turnaround ve ortalama beklemeyi hesapla.', dg: 'hw6', a: 'Turnaround P1=16, P2=3, P3=25, P4=6, P5=6, P6=17. <b>Ortalama bekleme = 46 / 6 ≈ 7.67 ms.</b> t=2\'de P5 geldiğinde P2 ile öncelikleri eşittir; P2\'nin kalanı (2), P5\'ten (4) kısa olduğu için P2 devam eder.' }
        ]
      },
      {
        id: 'thread-planlama',
        title: 'İş Parçacığı Planlama',
        en: 'Thread Scheduling',
        slides: '5.33 – 5.36',
        minutes: 4,
        blocks: [
          { t: 'p', html: 'Kullanıcı seviyesi ve çekirdek seviyesi iş parçacıkları farklı alanlarda rekabet eder:' },
          { t: 'compare', cols: [
            { title: 'İşlem çekişme alanı (PCS)', items: ['Process-Contention Scope', 'Çoktan-bire ve çoktan-çoğa modellerde görülür', 'Kütüphane, kullanıcı iş parçacıklarını <b>LWP</b> üzerinde sırayla çalışacak şekilde zamanlar', 'Rekabet <b>aynı işlemin içindedir</b>'] },
            { title: 'Sistem çekişme alanı (SCS)', items: ['System-Contention Scope', 'Çekirdek seviyesi iş parçacıkları için', 'Rekabet <b>sistemdeki tüm iş parçacıklarıyladır</b>'] }
          ] },
          { t: 'p', html: 'Pthread API\'si oluşturma sırasında alanı seçtirir: <code>PTHREAD_SCOPE_PROCESS</code> (PCS), <code>PTHREAD_SCOPE_SYSTEM</code> (SCS). İşletim sistemi bunu sınırlayabilir: <b>Linux ve macOS yalnızca PTHREAD_SCOPE_SYSTEM</b>\'e izin verir.' },
          { t: 'code', text: 'pthread_attr_init(&attr);                  /* varsayılan öznitelikler */\npthread_attr_getscope(&attr, &scope);       /* mevcut alanı öğren */\npthread_attr_setscope(&attr, PTHREAD_SCOPE_SYSTEM);\nfor (i = 0; i < NUM_THREADS; i++)\n    pthread_create(&tid[i], &attr, runner, NULL);\nfor (i = 0; i < NUM_THREADS; i++)\n    pthread_join(tid[i], NULL);' }
        ],
        checks: [
          { q: 'PCS ile SCS arasındaki fark nedir?', a: 'PCS\'de kullanıcı iş parçacıkları aynı işlem içinde LWP için yarışır. SCS\'de çekirdek iş parçacıkları sistemdeki tüm iş parçacıklarıyla CPU için yarışır.' }
        ]
      },
      {
        id: 'coklu-islemci',
        title: 'Çok İşlemcili Planlama',
        en: 'Multiple-Processor Scheduling',
        slides: '5.37 – 5.45',
        minutes: 7,
        blocks: [
          { t: 'p', html: 'Birden fazla CPU varsa planlama daha karmaşıktır. Mimari şunlardan biri olabilir: <b>çok çekirdekli CPU</b>, <b>çok iş parçacıklı çekirdek</b>, <b>NUMA</b>, <b>heterojen çoklu işlem</b>.' },
          { t: 'p', html: '<b>SMP</b>\'de her işlemci kendi kendini planlar. İş parçacıkları <b>(a) ortak bir hazır kuyruğunda</b> ya da <b>(b) her işlemcinin kendi özel kuyruğunda</b> olabilir.' },
          { t: 'h', text: 'Çok iş parçacıklı çekirdekler' },
          { t: 'list', items: [
            'Birden çok çekirdeği aynı yongaya koymak daha hızlıdır ve daha az güç tüketir.',
            'Bir iş parçacığı <b>bellek duraklaması (memory stall)</b> yaşarken çekirdek başka bir donanım iş parçacığına geçerek ilerlemeyi sürdürür.',
            '<b>Chip-multithreading (CMT)</b> her çekirdeğe birden çok donanım iş parçacığı atar (Intel: <b>hyperthreading</b>). Çekirdek başına 2 iş parçacıklı 4 çekirdekli sistemde işletim sistemi <b>8 mantıksal işlemci</b> görür.'
          ] },
          { t: 'p', html: '<b>İki seviyeli planlama:</b> (1) İşletim sistemi hangi yazılım iş parçacığının mantıksal CPU\'da çalışacağına karar verir. (2) Her çekirdek hangi donanım iş parçacığını fiziksel çekirdekte çalıştıracağına karar verir.' },
          { t: 'h', text: 'Yük dengeleme ve işlemci yakınlığı' },
          { t: 'compare', cols: [
            { title: 'Yük dengeleme (load balancing)', items: ['İş yükünü CPU\'lara eşit dağıtmaya çalışır', '<b>Push migration:</b> periyodik görev yükü denetler, dolu CPU\'dan diğerlerine iş iter', '<b>Pull migration:</b> boştaki işlemci, meşgul işlemciden bekleyen işi çeker'] },
            { title: 'İşlemci yakınlığı (processor affinity)', items: ['İş parçacığının verileri çalıştığı işlemcinin önbelleğindedir', '<b>Soft affinity:</b> işletim sistemi aynı işlemcide tutmaya çalışır, garanti etmez', '<b>Hard affinity:</b> işlem, çalışabileceği işlemcileri belirtir'] }
          ] },
          { t: 'note', kind: 'exam', attach: true, html: 'İkisi çelişebilir: yük dengeleme bir iş parçacığını taşırsa eski işlemcinin önbelleğindeki verisini kaybeder. <b>NUMA farkındalığı</b> olan işletim sistemi, belleği iş parçacığının çalıştığı CPU\'ya yakın ayırır.' }
        ],
        checks: [
          { q: 'Push ve pull migration arasındaki fark nedir?', a: 'Push\'ta periyodik bir görev yükü denetler ve dolu CPU\'dan diğerlerine iş iter. Pull\'da boştaki işlemci meşgul işlemciden iş çeker.' },
          { q: 'Yük dengeleme işlemci yakınlığını neden bozabilir?', a: 'İş parçacığı başka işlemciye taşınınca önceki işlemcinin önbelleğindeki verilerden yararlanamaz.' },
          { q: 'Çekirdek başına 2 donanım iş parçacıklı 4 çekirdekli sistemde işletim sistemi kaç işlemci görür?', a: '8 mantıksal işlemci.' }
        ]
      },
      {
        id: 'gercek-zamanli',
        title: 'Gerçek Zamanlı CPU Planlama',
        en: 'Real-Time CPU Scheduling',
        slides: '5.46 – 5.57',
        minutes: 8,
        blocks: [
          { t: 'compare', cols: [
            { title: 'Yumuşak gerçek zamanlı (soft)', items: ['Kritik görevler en yüksek önceliği alır', 'Ne zaman planlanacağı <b>garanti edilmez</b>'] },
            { title: 'Katı gerçek zamanlı (hard)', items: ['Görev <b>son teslim süresine (deadline)</b> kadar tamamlanmalıdır'] }
          ] },
          { t: 'h', text: 'Olay gecikmesi' },
          { t: 'p', html: '<b>Olay gecikmesi (event latency)</b>, olayın oluşmasından hizmet görmesine kadar geçen süredir. Performansı iki gecikme etkiler:' },
          { t: 'table', head: ['Gecikme', 'Tanım'], rows: [
            ['Kesme gecikmesi (interrupt latency)', 'Kesmenin gelişinden, kesmeye hizmet eden rutinin başlamasına kadar geçen süre: kesme türünü belirleme ve bağlam değişimi bu süreye girer'],
            ['Gönderim gecikmesi (dispatch latency)', 'Zamanlayıcının mevcut işlemi CPU\'dan alıp başkasına geçmesi için gereken süre']
          ] },
          { t: 'p', html: 'Gönderim gecikmesinin <b>çatışma evresi</b>: (1) çekirdek modunda çalışan işlemin kesilmesi, (2) düşük öncelikli işlemin, yüksek öncelikli işlemin ihtiyaç duyduğu kaynakları bırakması.' },
          { t: 'h', text: 'Periyodik işlemler' },
          { t: 'p', html: 'Gerçek zamanlı planlayıcı <b>kesmeli ve öncelik tabanlı</b> olmalıdır; bu yalnızca yumuşak gerçek zamanı garanti eder. Katı sistemde deadline da karşılanmalıdır. Periyodik işlemin işlem süresi <b>t</b>, deadline\'ı <b>d</b>, periyodu <b>p</b> vardır: <b>0 ≤ t ≤ d ≤ p</b>; hızı <b>1/p</b>\'dir.' },
          { t: 'h', text: 'Algoritmalar' },
          { t: 'table', head: ['Algoritma', 'Kural', 'Not'], rows: [
            ['Rate Monotonic', 'Öncelik periyodun tersidir: <b>kısa periyot yüksek öncelik</b>', 'Deadline kaçabilir: slayt 5.52\'de P2, t=80\'deki deadline\'ını kaçırır'],
            ['Earliest Deadline First (EDF)', '<b>Deadline\'ı en yakın olan</b> en yüksek önceliği alır', 'Öncelikler deadline\'a göre belirlenir'],
            ['Proportional Share', 'Toplam T pay dağıtılır; N pay alan uygulama işlemci zamanının <b>N/T</b>\'sini alır', 'N &lt; T']
          ] },
          { t: 'h', text: 'POSIX gerçek zamanlı planlama' },
          { t: 'p', html: 'POSIX.1b standardı iki sınıf tanımlar. <b>SCHED_FIFO:</b> FIFO kuyruğuyla FCFS; aynı öncelikte zaman dilimi yoktur. <b>SCHED_RR:</b> aynı, ama eşit öncelikte zaman dilimi vardır.' },
          { t: 'code', text: 'pthread_attr_getschedpolicy(&attr, &policy);\n/* policy: SCHED_OTHER, SCHED_RR veya SCHED_FIFO */\npthread_attr_setschedpolicy(&attr, SCHED_FIFO);' }
        ],
        checks: [
          { q: 'Yumuşak ve katı gerçek zamanlı sistem arasındaki fark nedir?', a: 'Yumuşak sistemde kritik görev en yüksek önceliği alır ama süre garantisi yoktur. Katı sistemde görev deadline\'ına kadar tamamlanmalıdır.' },
          { q: 'Rate Monotonic ve EDF öncelikleri neye göre atar?', a: 'Rate Monotonic periyoda göre atar: kısa periyot yüksek önceliktir. EDF deadline\'a göre atar: en yakın deadline yüksek önceliktir.' },
          { q: 'Periyodik işlemde t, d, p arasındaki ilişki nedir?', a: '0 ≤ t ≤ d ≤ p. Hız 1/p\'dir.' }
        ]
      },
      {
        id: 'os-planlama',
        title: 'İşletim Sistemi Örnekleri: Linux, Windows, Solaris',
        en: 'Operating System Examples',
        slides: '5.58 – 5.72',
        minutes: 9,
        blocks: [
          { t: 'h', text: 'Linux: sürüm 2.5' },
          { t: 'list', items: [
            '2.5 öncesinde standart UNIX algoritmasının bir çeşidi kullanılıyordu; 2.5 ile <b>O(1)</b> planlamaya geçildi.',
            'Kesmeli ve öncelik tabanlı. İki aralık: gerçek zamanlı <b>0–99</b>, nice <b>100–140</b>. Küçük sayı yüksek önceliktir, yüksek öncelik daha büyük q alır.',
            'Dilimi biten görev tükenmiş (expired) sayılır. Her CPU\'nun runqueue yapısında <b>active ve expired</b> dizileri vardır; active boşalınca yer değiştirirler.',
            'İyi çalıştı ama etkileşimli işlemlerde yanıt süresi zayıftı.'
          ] },
          { t: 'h', text: 'Linux: Completely Fair Scheduler (2.6.23+)' },
          { t: 'list', items: [
            '<b>Planlama sınıfları:</b> varsayılan ve gerçek zamanlı; yenileri eklenebilir. En yüksek sınıftaki en yüksek öncelikli görev seçilir.',
            'Sabit süreli dilim yerine <b>CPU zamanının oranı</b> kullanılır; pay, <b>−20 ile +19</b> arasındaki nice değerine göre hesaplanır. Küçük değer yüksek önceliktir.',
            '<b>Hedef gecikme (target latency):</b> görevin en az bir kez çalışması gereken süre; aktif görev artınca büyüyebilir.'
          ] },
          { t: 'h', text: 'CFS: sonraki görev nasıl seçilir?' },
          { t: 'list', items: [
            'Her görev için <code>vruntime</code> tutulur. Düşük öncelikte azalma katsayısı yüksektir; varsayılan öncelikte sanal süre gerçek süreye eşittir. <b>En düşük vruntime\'a sahip görev</b> seçilir.',
            'Çalışabilir görevler, anahtarı vruntime olan dengeli bir <b>kırmızı-siyah ağaçta</b> tutulur. En küçük vruntime en soldaki düğümdür; bulmak O(lg N) sürer, ama Linux bu değeri <code>rb_leftmost</code> değişkeninde önbellekler. Bloklanan görev ağaçtan çıkarılır.',
            'Gerçek zamanlı görevler POSIX.1b\'ye göre statik önceliklidir. Küresel şemada nice −20 → <b>100</b>, nice +19 → <b>139</b>.',
            'Yük dengeler ve NUMA farkındadır. <b>Planlama alanı (scheduling domain)</b>, örneğin önbellek paylaşan çekirdeklerden oluşur; amaç iş parçacıklarının alanlar arasında göçünü önlemektir.'
          ] },
          { t: 'h', text: 'Windows' },
          { t: 'list', items: [
            '<b>Öncelik tabanlı ve kesmeli</b>; en yüksek öncelikli iş parçacığı çalışır. Planlayıcıya <b>dispatcher</b> denir.',
            'İş parçacığı bloklanana, dilimi bitene veya daha yüksek öncelikli iş parçacığınca kesilene kadar çalışır.',
            '<b>32 seviye:</b> değişken sınıf 1–15, gerçek zamanlı sınıf 16–31, 0 bellek yönetimi iş parçacığıdır. Her öncelik için kuyruk vardır; çalışacak iş yoksa <b>idle thread</b> çalışır.',
            'Dilim biterse öncelik düşer ama taban önceliğin altına inmez. Bekleme bitince önceliği artar. <b>Ön plan penceresi 3 kat</b> öncelik artışı alır.',
            'Windows 7 ile gelen <b>user-mode scheduling (UMS)</b>, uygulamaların iş parçacıklarını çekirdekten bağımsız yönetmesini sağlar (ör. C++ ConcRT).'
          ] },
          { t: 'p', html: 'Öncelik sınıfı (sütun) ile göreli öncelik (satır) birleşerek sayısal önceliği verir (slayt 5.68). Sütunlar: real-time, high, above normal, normal, below normal, idle.' },
          { t: 'table', head: ['', 'RT', 'H', 'AN', 'N', 'BN', 'I'], rows: [
            ['time-critical', '31', '15', '15', '15', '15', '15'],
            ['highest', '26', '15', '12', '10', '8', '6'],
            ['above normal', '25', '14', '11', '9', '7', '5'],
            ['normal', '24', '13', '10', '8', '6', '4'],
            ['below normal', '23', '12', '9', '7', '5', '3'],
            ['lowest', '22', '11', '8', '6', '4', '2'],
            ['idle', '16', '1', '1', '1', '1', '1']
          ] },
          { t: 'h', text: 'Solaris' },
          { t: 'list', items: [
            '<b>Altı sınıf:</b> zaman paylaşımlı (varsayılan), etkileşimli, gerçek zamanlı, sistem, adil paylaşım, sabit öncelik. İş parçacığı aynı anda tek sınıftadır ve her sınıfın kendi algoritması vardır.',
            'Zaman paylaşımı <b>çok düzeyli geri bildirimli kuyruktur</b>; tablosu sistem yöneticisince ayarlanabilir.',
            '<b>Dağıtım tablosu (slayt 5.70):</b> her öncelik için zaman dilimi, dilim dolunca inilecek öncelik ve uykudan dönünce çıkılacak öncelik tutulur. Örnek: öncelik 0 → dilim 200 ms; öncelik 59 → dilim 20 ms. Yüksek öncelik daha kısa dilim alır.',
            '<b>Küresel öncelik (slayt 5.71):</b> kesme iş parçacıkları 160–169, gerçek zamanlı 100–159, sistem 60–99; adil paylaşım, sabit öncelik, zaman paylaşımlı ve etkileşimli 0–59.',
            'Sınıf öncelikleri <b>küresel önceliğe</b> çevrilir. En yüksek öncelikli iş parçacığı bloklanana, dilimi bitene veya kesilene kadar çalışır; eşit öncelikte RR uygulanır.'
          ] }
        ],
        checks: [
          { q: 'CFS sonraki görevi nasıl seçer?', a: 'Her görevin sanal çalışma süresini (vruntime) tutar ve en düşük vruntime\'a sahip görevi seçer.' },
          { q: 'Windows\'ta normal sınıfının normal göreli önceliği kaçtır? Real-time sınıfında time-critical kaçtır?', a: 'Normal/normal: 8. Real-time/time-critical: 31.' },
          { q: 'Windows önceliğinde dilim bitince ve bekleme bitince ne olur?', a: 'Dilim bitince öncelik düşer ama taban önceliğin altına inmez. Bekleme bitince, neyi beklediğine göre öncelik artar.' }
        ]
      },
      {
        id: 'degerlendirme',
        title: 'Algoritma Değerlendirme',
        en: 'Algorithm Evaluation',
        slides: '5.73 – 5.79',
        minutes: 6,
        blocks: [
          { t: 'p', html: 'Bir işletim sistemi için algoritma seçerken önce <b>kriterler belirlenir</b>, sonra algoritmalar değerlendirilir. Dört yöntem:' },
          { t: 'h', text: 'Deterministik modelleme' },
          { t: 'def', term: 'Deterministik modelleme', en: 'Deterministic modeling', html: 'Önceden belirlenmiş bir iş yükü için her algoritmanın performansını hesaplar. <b>Basit ve hızlıdır</b> ama kesin sayılar gerektirir ve yalnızca o girdiler için geçerlidir.' },
          { t: 'p', html: 'Örnek: t=0\'da burst\'leri 10, 29, 3, 7, 12 olan beş işlem. Ortalama bekleme:' },
          { t: 'table', head: ['Algoritma', 'Ortalama bekleme'], rows: [
            ['FCFS', '28 ms'],
            ['SJF (kesmesiz)', '<b>13 ms</b>'],
            ['RR (q = 10)', '23 ms']
          ] },
          { t: 'h', text: 'Kuyruk modelleri ve Little formülü' },
          { t: 'def', term: 'Kuyruk modelleri', en: 'Queueing models', html: 'İşlem gelişlerini ve burst\'leri <b>olasılıkla</b> (genellikle üstel dağılım ve ortalama) tanımlar. Sistem, kuyruklu sunuculardan oluşan bir ağ gibi ele alınır; geliş ve servis hızlarından kullanım, ortalama kuyruk uzunluğu ve bekleme hesaplanır.' },
          { t: 'def', term: 'Little formülü', en: 'Little\'s law', html: '<b>n = λ × W</b>. n ortalama kuyruk uzunluğu, W ortalama bekleme, λ ortalama geliş hızıdır. Kararlı durumda kuyruğa giren kadar işlem çıkar. Her algoritma ve geliş dağılımı için geçerlidir. Örnek: saniyede 7 işlem gelir, kuyrukta 14 işlem varsa bekleme <b>2 saniyedir</b>.' },
          { t: 'code', text: 'FCFS (28 ms):  P1 0–10, P2 10–39, P3 39–42, P4 42–49, P5 49–61\nSJF  (13 ms):  P3 0–3, P4 3–10, P1 10–20, P5 20–32, P2 32–61\nRR   (23 ms):  P1 0–10, P2 10–20, P3 20–23, P4 23–30, P5 30–40,\n               P2 40–50, P5 50–52, P2 52–61' },
          { t: 'h', text: 'Simülasyon ve gerçekleştirme' },
          { t: 'def', term: 'Simülasyon', en: 'Simulation', html: 'Bilgisayar sisteminin programlanmış modelidir; saat bir değişkendir ve performans istatistikleri toplanır. Kuyruk modellerinden <b>daha doğrudur</b>. Veriler rastgele sayı üreteciyle, matematiksel veya deneysel dağılımlarla ya da gerçek olayları kaydeden <b>trace tape</b> ile sağlanır.' },
          { t: 'def', term: 'Gerçekleştirme', en: 'Implementation', html: 'Simülasyonların da doğruluğu sınırlıdır. Yeni planlayıcıyı gerçek sistemde denemek en doğru sonucu verir ama <b>maliyeti ve riski yüksektir</b>, ortamlar da değişir. Bu yüzden planlayıcılar değiştirilebilir yapılır veya öncelik değiştiren API\'ler sunulur.' }
        ],
        checks: [
          { q: 'Saniyede ortalama 7 işlem gelen, kuyrukta ortalama 14 işlem bulunan sistemde ortalama bekleme kaçtır?', a: 'W = n / λ = 14 / 7 = 2 saniye.' },
          { q: 'Deterministik modellemenin artısı ve eksisi nedir?', a: 'Basit ve hızlıdır. Ama kesin sayılar gerektirir ve sonuç yalnızca o girdiler için geçerlidir.' },
          { q: 'Değerlendirme yöntemlerini doğruluk ve maliyet açısından sırala.', a: 'Deterministik modelleme ve kuyruk modelleri ucuzdur. Simülasyon daha doğrudur. Gerçekleştirme en doğrudur ama maliyeti ve riski en yüksektir.' }
        ]
      }
    ]
  });
})(window.OSLab = window.OSLab || {});
