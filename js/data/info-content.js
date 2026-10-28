/*
 * info-content.js — "Bilgi & Sınav Paneli" içeriği (modül başına teori + sınav soruları).
 * preset: soruyu simülatörde çalıştırmak için { algorithm, quantum?, processes: [[pid, AT, BT], ...] }
 */
(function (OSLab) {
  'use strict';

  const EX_D = [['P1', 0, 8], ['P2', 1, 4], ['P3', 2, 9], ['P4', 3, 5]];

  OSLab.info = {
    scheduling: {
      theory: [
        {
          id: 'basics',
          title: 'Temel Kavramlar',
          html: `
            <p><b>CPU zamanlayıcı (short-term scheduler)</b>, CPU boşaldığında <b>hazır kuyruğundaki (ready queue)</b> işlemlerden birini seçer. Seçilen işlemi CPU'ya <b>dispatcher</b> yerleştirir:</p>
            <ul>
              <li>Bağlam değişimi (context switch): eski işlemin durumu PCB'ye kaydedilir, yeninin durumu yüklenir</li>
              <li>Kullanıcı moduna (user mode) geçilir</li>
              <li>Programın kaldığı adrese atlanır</li>
            </ul>
            <p>Dispatcher'ın bir işlemi durdurup diğerini başlatması için geçen süreye <b>dispatch latency</b> denir. Bu sürede CPU yararlı iş yapmaz.</p>
            <p>İşlemler <b>CPU burst</b> ve <b>I/O burst</b> evreleri arasında gidip gelir (CPU–I/O burst döngüsü). I/O-bound işlemlerde çok sayıda kısa CPU burst'ü, CPU-bound işlemlerde az sayıda uzun burst görülür.</p>
            <p class="note"><b>Simülatör modeli:</b> Her işlemin tek bir CPU burst'ü vardır, I/O yoktur, bağlam değişimi maliyeti 0 kabul edilir.</p>`
        },
        {
          id: 'preemption',
          title: 'Kesmeli / Kesmesiz Zamanlama',
          html: `
            <p>Zamanlama kararı şu dört durumda verilebilir:</p>
            <ol>
              <li>İşlem <b>running → waiting</b> geçer (ör. I/O isteği, <code>wait()</code>)</li>
              <li>İşlem <b>running → ready</b> geçer (ör. zamanlayıcı kesmesi)</li>
              <li>İşlem <b>waiting → ready</b> geçer (ör. I/O tamamlandı)</li>
              <li>İşlem <b>sonlanır</b></li>
            </ol>
            <p>Karar yalnızca <b>1 ve 4</b>'te veriliyorsa zamanlama <b>kesmesizdir (nonpreemptive / cooperative)</b>: işlem CPU'yu kendisi bırakana kadar tutar. Aksi halde <b>kesmelidir (preemptive)</b>.</p>
            <p>Kesmeli zamanlama, paylaşılan veriye erişen işlemler arasında <b>yarış durumlarına (race condition)</b> yol açabilir; bu, Senkronizasyon modülünün konusudur.</p>
            <div class="formula">Kesmesiz : FCFS, SJF (non-preemptive)
Kesmeli  : RR, SRTF</div>`
        },
        {
          id: 'metrics',
          title: 'Değerlendirme Ölçütleri ve Formüller',
          html: `
            <div class="formula">CT  (Completion)  = işlemin bittiği an
TAT (Turnaround)  = CT − AT
WT  (Waiting)     = TAT − BT
RT  (Response)    = ilk kez CPU'ya çıktığı an − AT

CPU Kullanımı = Σ BT / toplam süre
Throughput    = n / toplam süre</div>
            <ul>
              <li><b>Maksimize:</b> CPU kullanımı, throughput</li>
              <li><b>Minimize:</b> turnaround, bekleme, yanıt süresi</li>
            </ul>
            <p><b>Bekleme süresi</b>, işlemin <i>hazır kuyruğunda</i> geçirdiği toplam süredir. Zamanlama algoritması burst süresini değiştiremez, yalnızca bekleme süresini etkiler.</p>
            <p>Kesmesiz algoritmalarda işlem bir kez başlayınca bitene kadar çalıştığı için <b>RT = WT</b> olur.</p>`
        },
        {
          id: 'FCFS',
          kind: 'algo',
          title: 'FCFS — First-Come, First-Served',
          html: `
            <p>İlk gelen ilk hizmet alır. Hazır kuyruğu bir <b>FIFO</b> kuyruğudur: gelen işlemin PCB'si kuyruğun sonuna bağlanır, CPU boşalınca baştaki işlem seçilir. <b>Kesmesizdir</b>.</p>
            <p><b>Konvoy etkisi (convoy effect):</b> Uzun bir CPU-bound işlem öndeyken kısa işlemler onun arkasında birikir. CPU ve aygıt kullanımı düşer.</p>
            <div class="formula">P1=24, P2=3, P3=3 (hepsi t=0)
Sıra P1,P2,P3 → WT: 0, 24, 27 → ort. 17
Sıra P2,P3,P1 → WT: 6, 0, 3  → ort. 3</div>
            <ul>
              <li>Artısı: basit, starvation yok</li>
              <li>Eksisi: ortalama bekleme süresi genellikle yüksek ve varış sırasına çok duyarlı</li>
              <li>Etkileşimli (time-sharing) sistemler için uygun değildir</li>
            </ul>`
        },
        {
          id: 'SJF',
          kind: 'algo',
          title: 'SJF — Shortest-Job-First',
          html: `
            <p>CPU boşaldığında hazırdaki işlemler arasından <b>bir sonraki CPU burst'ü en kısa</b> olan seçilir, eşitlikte FCFS uygulanır. Bu sürüm <b>kesmesizdir</b>: daha kısa bir iş gelse bile çalışan işlem burst'ünü bitirir.</p>
            <p><b>Optimallik:</b> Verilen bir işlem kümesi için (tümü aynı anda hazırken) <b>minimum ortalama bekleme süresini</b> verir. Kısa bir işi uzun bir işin önüne almak, kısanın beklemesini uzunun beklemesinin arttığından daha çok azaltır.</p>
            <p><b>Sorun:</b> Bir sonraki CPU burst'ün uzunluğu önceden bilinemez. Kısa vadeli zamanlamada bu değer <b>üstel ortalama (exponential averaging)</b> ile tahmin edilir:</p>
            <div class="formula">τ(n+1) = α · t(n) + (1 − α) · τ(n)     0 ≤ α ≤ 1

t(n) : n'inci burst'ün gerçek uzunluğu
τ(n) : n'inci burst için yapılan tahmin
α = 0 → τ(n+1) = τ(n)   (son ölçüm etkisiz)
α = 1 → τ(n+1) = t(n)   (yalnızca son burst)
Genelde α = 1/2</div>
            <p><b>Starvation (açlık):</b> Sürekli kısa işler gelirse uzun işlem hiç çalışamayabilir. Çözüm: <b>aging</b>, yani bekledikçe işlemin önceliğini artırmak.</p>
            <p>Kesmeli sürümüne <b>SRTF (Shortest-Remaining-Time-First)</b> denir: yeni gelen işlemin burst'ü çalışan işlemin <i>kalan</i> süresinden kısaysa CPU ondan alınır.</p>`
        },
        {
          id: 'RR',
          kind: 'algo',
          title: 'RR — Round Robin',
          html: `
            <p>Zaman paylaşımlı (time-sharing) sistemler için tasarlanmıştır: <b>FCFS + kesme (preemption)</b>. Hazır kuyruğu dairesel bir FIFO kuyruğudur. Her işlem en fazla <b>q</b> (time quantum / time slice) birim çalışır. q dolunca zamanlayıcı kesmesi oluşur ve işlem kuyruğun sonuna eklenir.</p>
            <ul>
              <li>Kalan burst ≤ q ise işlem CPU'yu kendisi bırakır, sıradaki hemen seçilir.</li>
              <li>n işlem varken her işlem CPU zamanının 1/n'ini alır. Hiçbir işlem bir sonraki kuantumu için <b>(n − 1) · q</b>'dan fazla beklemez.</li>
            </ul>
            <p><b>q seçimi:</b> q çok büyükse RR, FCFS'e dönüşür. q çok küçükse bağlam değişimi yükü baskın hale gelir. Pratik kural: CPU burst'lerinin yaklaşık <b>%80'i q'dan kısa</b> olmalı. Tipik q 10–100 ms, bağlam değişimi ise 10 µs'den kısadır.</p>
            <p>Ortalama turnaround genellikle SJF'den yüksektir, ancak <b>yanıt süresi</b> daha iyidir. Starvation yoktur.</p>
            <p class="note"><b>Simülatör kuralı:</b> Bir işlemin kuantumu dolduğu anda yeni bir işlem de gelirse, yeni gelen kuyruğa <b>önce</b> eklenir, kesilen işlem onun arkasına girer (yaygın ders kitabı varsayımı). Sınavda farklı bir varsayım verilmişse ona uyun.</p>`
        }
      ],
      exam: [
        {
          topic: 'Kavram',
          q: 'FCFS, kesmesiz SJF, RR ve SRTF algoritmalarından hangileri <b>kesmelidir (preemptive)</b>? Gerekçelendirin.',
          a: '<p><b>RR ve SRTF.</b> RR kuantum dolunca zamanlayıcı kesmesiyle, SRTF ise daha kısa kalan süreli bir işlem geldiğinde CPU\'yu çalışan işlemden alır. FCFS ve kesmesiz SJF kararı yalnızca işlem bitince ya da beklemeye geçince verir (durum 1 ve 4).</p>'
        },
        {
          topic: 'FCFS',
          q: 'P1=24, P2=3, P3=3 işlemleri t=0\'da bu sırayla geliyor. <b>FCFS</b> için ortalama bekleme süresi nedir?',
          a: '<div class="formula">P1 [0–24] → P2 [24–27] → P3 [27–30]\nWT: P1=0, P2=24, P3=27\nOrt. WT = 51 / 3 = 17</div>',
          preset: { algorithm: 'FCFS', processes: [['P1', 0, 24], ['P2', 0, 3], ['P3', 0, 3]] }
        },
        {
          topic: 'FCFS',
          q: 'Aynı işlemler <b>P2, P3, P1</b> sırasıyla gelseydi ortalama bekleme süresi ne olurdu? Bu fark hangi olguyu gösterir?',
          a: '<div class="formula">P2 [0–3] → P3 [3–6] → P1 [6–30]\nWT: P1=6, P2=0, P3=3\nOrt. WT = 9 / 3 = 3</div><p>17\'den 3\'e düşüş <b>konvoy etkisini</b> gösterir: uzun bir işin arkasında bekleyen kısa işler ortalamayı şişirir.</p>',
          preset: { algorithm: 'FCFS', processes: [['P2', 0, 3], ['P3', 0, 3], ['P1', 0, 24]] }
        },
        {
          topic: 'SJF',
          q: 'P1=6, P2=8, P3=7, P4=3 (hepsi t=0). <b>SJF</b> ile ortalama bekleme süresini bulun ve FCFS ile karşılaştırın.',
          a: '<div class="formula">SJF : P4 [0–3] → P1 [3–9] → P3 [9–16] → P2 [16–24]\nWT  : P1=3, P2=16, P3=9, P4=0 → 28/4 = 7\n\nFCFS: WT = 0, 6, 14, 21 → 41/4 = 10.25</div><p>SJF, aynı anda hazır işlemler için optimaldir.</p>',
          preset: { algorithm: 'SJF', processes: [['P1', 0, 6], ['P2', 0, 8], ['P3', 0, 7], ['P4', 0, 3]] }
        },
        {
          topic: 'SJF',
          q: 'P1(AT=0, BT=8), P2(1, 4), P3(2, 9), P4(3, 5). <b>Kesmesiz SJF</b> ile Gantt şemasını çizin ve ortalama bekleme süresini bulun.',
          a: '<p>t=0\'da yalnızca P1 hazır olduğu için o seçilir ve kesilmeden bitirir. t=8\'de P2(4), P3(9), P4(5) hazırdır.</p><div class="formula">P1 [0–8] → P2 [8–12] → P4 [12–17] → P3 [17–26]\nWT: P1=0, P2=8−1=7, P3=17−2=15, P4=12−3=9\nOrt. WT = 31 / 4 = 7.75</div><p>Aynı küme <b>SRTF</b> (kesmeli) ile 26/4 = 6.5 olur.</p>',
          preset: { algorithm: 'SJF', processes: EX_D }
        },
        {
          topic: 'RR',
          q: 'P1=24, P2=3, P3=3 (hepsi t=0), <b>RR, q=4</b>. Ortalama bekleme süresi nedir?',
          a: '<div class="formula">P1 [0–4] → P2 [4–7] → P3 [7–10] → P1 [10–30]\nWT: P1 = 30−24 = 6, P2 = 4, P3 = 7\nOrt. WT = 17 / 3 ≈ 5.67</div>',
          preset: { algorithm: 'RR', quantum: 4, processes: [['P1', 0, 24], ['P2', 0, 3], ['P3', 0, 3]] }
        },
        {
          topic: 'RR',
          q: 'P1(0, 8), P2(1, 4), P3(2, 9), P4(3, 5), <b>RR, q=4</b>. Tamamlanma zamanlarını, ortalama TAT ve WT değerlerini bulun.',
          a: '<div class="formula">P1[0–4] P2[4–8] P3[8–12] P4[12–16] P1[16–20] P3[20–24] P4[24–25] P3[25–26]\n\nCT : P1=20, P2=8, P3=26, P4=25\nTAT: 20, 7, 24, 22 → 73/4 = 18.25\nWT : 12, 3, 15, 17 → 47/4 = 11.75</div><p>t=4\'te P1 kesildiğinde kuyrukta P2, P3, P4 vardır, bu yüzden P1 onların arkasına girer.</p>',
          preset: { algorithm: 'RR', quantum: 4, processes: EX_D }
        },
        {
          topic: 'SJF',
          q: 'Üstel ortalama ile α = 0.5, τ₀ = 10. Ölçülen ilk burst t₀ = 6, ikinci burst t₁ = 4. <b>τ₁</b> ve <b>τ₂</b> nedir?',
          a: '<div class="formula">τ₁ = 0.5·6 + 0.5·10 = 8\nτ₂ = 0.5·4 + 0.5·8  = 6</div>'
        },
        {
          topic: 'RR',
          q: 'Round Robin\'de time quantum <b>çok büyük</b> ve <b>çok küçük</b> seçilirse ne olur?',
          a: '<p><b>Çok büyük:</b> Her işlem tek kuantumda biter ve RR, FCFS\'e dönüşür (yanıt süresi kötüleşir).<br><b>Çok küçük:</b> Bağlam değişimi sayısı artar, CPU zamanının büyük kısmı dispatcher yüküne gider. Pratik kural: burst\'lerin ~%80\'i q\'dan kısa olmalı.</p>'
        },
        {
          topic: 'RR',
          q: '5 işlemin çalıştığı bir RR sisteminde q = 20 ms. Bir işlem bir sonraki kuantumunu <b>en fazla</b> ne kadar bekler?',
          a: '<div class="formula">(n − 1) · q = 4 · 20 = 80 ms</div><p>Bağlam değişimi süresi ihmal edilmiştir.</p>'
        },
        {
          topic: 'Kavram',
          q: 'Hangi algoritmalarda <b>starvation (açlık)</b> görülebilir? Nasıl önlenir?',
          a: '<p><b>SJF / SRTF</b> (ve genel olarak öncelik tabanlı zamanlama): kısa işler gelmeye devam ederse uzun iş hiç seçilmeyebilir. FCFS ve RR\'de görülmez, çünkü her işleme sırayla CPU verilir. Çözüm <b>aging</b>: bekleme süresi uzadıkça önceliği kademeli olarak artırmak.</p>'
        },
        {
          topic: 'Kavram',
          q: 'Kesmesiz algoritmalarda <b>yanıt süresi</b> neden bekleme süresine eşittir?',
          a: '<p>İşlem CPU\'ya bir kez çıktığında bitene kadar kesilmez. Hazır kuyruğundaki tüm beklemesi ilk çalışmasından önce gerçekleşir, bu yüzden RT = ilk başlama − AT = WT olur.</p>'
        }
      ]
    },

    system: {
      theory: [
        {
          id: 'dual',
          kind: 'algo',
          title: 'Çift Modlu Çalışma (Dual-Mode)',
          html: `
            <p>İşletim sistemi, hatalı veya kötü niyetli bir programın diğer programlara ve kendisine zarar vermesini engellemek için donanım desteğine ihtiyaç duyar. Donanımdaki <b>mode bit</b> hangi modda çalışıldığını gösterir:</p>
            <div class="formula">mode bit = 0  →  kernel mode (supervisor / system / privileged mode)
mode bit = 1  →  user mode</div>
            <p><b>Ayrıcalıklı komutlar (privileged instructions)</b> yalnızca çekirdek modunda çalıştırılabilir: G/Ç kontrolü, zamanlayıcı (timer) yönetimi, kesme yönetimi, kullanıcı moduna geçiş komutu. Kullanıcı modunda denenirse donanım komutu <b>çalıştırmaz</b>, OS'e trap üretir.</p>
            <div class="formula">user process çalışıyor        (mode bit = 1)
   → sistem çağrısı → trap     (mode bit = 0)
   → çekirdek çağrıyı yürütür
   → return                    (mode bit = 1)
user process devam eder</div>
            <p>Sistem açılırken donanım çekirdek modundadır. OS yüklenir, kullanıcı programları kullanıcı modunda başlatılır. Bir trap veya kesme oluştuğunda donanım çekirdek moduna geçer.</p>
            <p><b>Timer:</b> Bir kullanıcı programının sonsuz döngüye girip CPU'yu hiç geri vermemesini önler. Belirli bir süre sonra kesme üretir ve kontrol OS'e döner. Timer'ı ayarlamak ayrıcalıklı bir komuttur.</p>
            <p>İkiden fazla mod da olabilir: Intel'de 4 koruma halkası (ring 0–3) vardır. Sanallaştırma destekli CPU'larda VMM için ayrı bir mod bulunur.</p>`
        },
        {
          id: 'syscall',
          title: 'Sistem Çağrıları ve API',
          html: `
            <p><b>Sistem çağrısı</b>, OS servislerine erişen programlama arayüzüdür. Programcılar genellikle doğrudan sistem çağrısı yapmaz, bir <b>API</b> kullanır: Windows API, POSIX API (UNIX, Linux, macOS), Java API. Ör. libc'deki <code>read()</code> fonksiyonu <code>sys_read</code> sistem çağrısını sarar.</p>
            <p>API kullanmanın nedenleri: <b>taşınabilirlik</b> (aynı API'yi destekleyen her sistemde derlenir) ve gerçek sistem çağrılarının daha ayrıntılı ve zor kullanılır olması.</p>
            <p><b>Sistem çağrısı arayüzü</b>, her çağrıya bir numara atar ve bu numaralarla indekslenen bir tablo tutar. Çağıranın, çağrının nasıl gerçekleştirildiğini bilmesi gerekmez.</p>
            <p><b>Parametre aktarmanın üç yolu:</b></p>
            <ol>
              <li><b>Yazmaçlar:</b> En hızlısı, ama sayı sınırlıdır.</li>
              <li><b>Bellekte blok / tablo:</b> Bloğun adresi bir yazmaçla aktarılır (Linux 5'ten fazla parametrede).</li>
              <li><b>Yığın (stack):</b> Program parametreleri yığına iter (push), OS yığından alır (pop).</li>
            </ol>
            <p>Blok ve yığın yöntemleri parametre sayısını ve uzunluğunu sınırlamaz.</p>
            <p><b>Sistem çağrısı türleri:</b> işlem kontrolü (fork, exit, wait), dosya yönetimi (open, read, write, close), aygıt yönetimi (ioctl), bilgi bakımı (getpid, time), iletişim (pipe, shm_open, mmap), koruma (chmod, chown).</p>`
        },
        {
          id: 'abi',
          title: 'ABI: Application Binary Interface',
          html: `
            <p><b>API</b> kaynak kodu düzeyinde bir sözleşmedir: hangi fonksiyonların hangi parametrelerle çağrılabileceğini tanımlar. <b>ABI</b> ise aynı sözleşmenin <b>ikili (makine kodu) düzeyindeki</b> karşılığıdır. Belirli bir mimari için şunları tanımlar:</p>
            <ul>
              <li>Parametrelerin sistem çağrılarına ve fonksiyonlara nasıl aktarılacağı (hangi yazmaçlar, hangi sıra)</li>
              <li>Yığının düzeni</li>
              <li>Sistem kütüphanelerinin ikili biçimi</li>
              <li>Veri türlerinin boyutu ve hizalanması</li>
            </ul>
            <div class="formula">x86-64 Linux ABI (simülatörde kullanılan):
  rax      = sistem çağrısı numarası (read = 0)
  rdi, rsi, rdx, r10, r8, r9 = parametreler
  syscall  = trap komutu, dönüş değeri rax'te</div>
            <p><b>Uygulamalar neden OS'e özgüdür?</b> Her OS'in kendi sistem çağrıları, kendi çalıştırılabilir dosya biçimi (Linux: <b>ELF</b>, Windows: <b>PE</b>, macOS: <b>Mach-O</b>) ve kendi ABI'si vardır. CPU'nun komut kümesi (ISA) de farklı olabilir. Bu yüzden Linux için derlenmiş bir ikili dosya Windows'ta doğrudan çalışmaz.</p>
            <p>Çözümler: yorumlanan diller (Python), sanal makine üzerinde çalışan diller (Java JVM), standart API'ye yazıp her hedef için yeniden derlemek, ya da uyumluluk katmanları (ör. Wine).</p>`
        },
        {
          id: 'linkload',
          kind: 'algo',
          title: 'Derleme, Bağlama ve Yükleme',
          html: `
            <div class="formula">main.c ──derleyici──▶ main.o ──bağlayıcı──▶ main ──yükleyici──▶ bellekteki işlem
                        (relocatable)   + kütüphaneler  (executable)   + DLL'ler</div>
            <ul>
              <li><b>Derleyici</b>, kaynak kodu fiziksel bellekte herhangi bir yere yüklenebilecek <b>yeniden konumlandırılabilir nesne dosyasına (relocatable object file)</b> çevirir.</li>
              <li><b>Bağlayıcı (linker)</b>, nesne dosyalarını ve kütüphaneleri tek bir <b>çalıştırılabilir dosyada</b> birleştirir, sembolleri çözümler.</li>
              <li><b>Yükleyici (loader)</b>, çalıştırılabilir dosyayı belleğe yükler. Bu sırada <b>relocation</b> yapılır: program parçalarına son adresler atanır, kod ve veri bu adreslere göre düzeltilir.</li>
            </ul>
            <p><b>Dinamik bağlama (DLL / .so):</b> Kütüphane çalıştırılabilir dosyaya kopyalanmaz. Program yüklendiğinde (veya ilk çağrıda) bağlanır. Birden fazla işlem aynı kütüphane kopyasını bellekte paylaşır.</p>
            <p><b>Adres bağlama (address binding) zamanları:</b></p>
            <ul>
              <li><b>Derleme zamanı:</b> Bellekteki yer önceden biliniyorsa mutlak kod üretilir.</li>
              <li><b>Yükleme zamanı:</b> Derleyici yeniden konumlandırılabilir kod üretir, son bağlama yüklemede yapılır.</li>
              <li><b>Çalışma zamanı:</b> İşlem çalışırken taşınabiliyorsa bağlama ertelenir. MMU gerekir; modern sistemlerin çoğu böyledir.</li>
            </ul>
            <div class="formula">fiziksel adres = relocation register + mantıksal adres
14346          = 14000               + 346</div>`
        },
        {
          id: 'policy',
          title: 'Policy ve Mechanism Ayrımı',
          html: `
            <p>OS tasarımının temel ilkelerinden biri:</p>
            <div class="formula">Mechanism (mekanizma) → bir şeyin NASIL yapılacağı
Policy    (politika)  → NE yapılacağı</div>
            <p><b>Örnek:</b> Timer, CPU'nun korunmasını sağlayan bir <b>mekanizmadır</b>. Timer'ın belirli bir kullanıcı için ne kadar süreye ayarlanacağına karar vermek ise bir <b>politikadır</b>.</p>
            <p>Politikalar yerden yere ve zamanla değişir. İkisi ayrılırsa, politika değiştiğinde yalnızca birkaç parametreyi değiştirmek yeterli olur, mekanizmanın yeniden yazılması gerekmez. Örneğin aynı öncelik mekanizması, etkileşimli programları veya CPU-yoğun programları kayıracak şekilde ayarlanabilir.</p>
            <ul>
              <li><b>Mikroçekirdek</b> bu ayrımın uç bir örneğidir: çekirdek yalnızca temel mekanizmaları sağlar, politikalar kullanıcı alanındaki servislere bırakılır.</li>
              <li><b>Windows ve macOS</b> ise mekanizmayı ve politikayı birlikte sisteme gömer, böylece tüm sistemde aynı görünüm ve davranış sağlanır.</li>
            </ul>
            <p>CPU Scheduling modülünde: bağlam değişimi ve dispatcher <b>mekanizmadır</b>, FCFS / SJF / RR seçimi <b>politikadır</b>.</p>`
        },
        {
          id: 'structures',
          kind: 'algo',
          title: 'OS Yapıları: Monolitik, Katmanlı, Mikroçekirdek, Modüler',
          html: `
            <p><b>Monolitik yapı:</b> Çekirdeğin tüm işlevselliği tek bir statik ikili dosyada, tek bir adres alanında çalışır (geleneksel UNIX, Linux). Sistem çağrısı arayüzünde ve çekirdek içi iletişimde ek yük azdır, bu yüzden <b>hızlıdır</b>. Ancak gerçekleştirmesi ve genişletmesi zordur, bir hata tüm sistemi çökertebilir.</p>
            <p><b>Katmanlı yaklaşım:</b> OS katmanlara ayrılır. Katman 0 donanım, en üst katman kullanıcı arayüzüdür. Her katman yalnızca alt katmanların servislerini kullanır. Hata ayıklaması ve doğrulaması kolaydır, ama katmanları doğru tanımlamak zordur ve katman geçişleri performansı düşürür.</p>
            <p><b>Mikroçekirdek:</b> Gerekli olmayan bileşenler çekirdekten çıkarılıp kullanıcı düzeyi programlar olarak gerçekleştirilir (Mach, QNX, MINIX 3). Çekirdekte genellikle minimum işlem ve bellek yönetimi ile <b>iletişim (IPC)</b> kalır. İstemci ve servisler doğrudan etkileşmez, <b>mikroçekirdek üzerinden mesaj geçirerek</b> haberleşir.</p>
            <ul>
              <li>Artıları: genişletmesi kolay, yeni donanıma taşınması kolay, daha güvenli ve güvenilir (bir servis çökse de OS çalışmaya devam eder).</li>
              <li>Eksisi: mesajların kopyalanması ve işlemler arası geçişler nedeniyle <b>performans ek yükü</b>. Windows NT'nin ilk sürümü bu yüzden yavaştı.</li>
            </ul>
            <p><b>Yüklenebilir çekirdek modülleri (LKM):</b> Çekirdeğin çekirdek bileşenleri sabittir, ek servisler çalışma anında bağlanır. Her modül tanımlı bir arayüze sahiptir, ama modüller birbirini mesaj geçirmeden doğrudan çağırabilir. Linux, macOS ve Solaris bu yaklaşımı kullanır.</p>
            <p><b>Hibrit sistemler:</b> Modern OS'lerin çoğu tek bir modele uymaz. Linux monolitik ama modülerdir. Windows büyük ölçüde monolitik olup mikroçekirdek özellikleri taşır. macOS / iOS'un <b>XNU</b> (Darwin) çekirdeği Mach mikroçekirdeği ile BSD UNIX'i birleştirir.</p>`
        },
        {
          id: 'dumps',
          title: 'Core Dump ve Crash Dump',
          html: `
            <p>Hata ayıklama (debugging) için OS, hata anındaki bilgiyi saklar:</p>
            <div class="formula">İŞLEM hatası   → hata bilgisi log dosyasına
                 + işlemin belleği → CORE DUMP
ÇEKİRDEK hatası (crash) → hata bilgisi log dosyasına
                 + çekirdeğin bellek durumu → CRASH DUMP</div>
            <ul>
              <li><b>Core dump:</b> Bir <b>kullanıcı işlemi</b> hata verdiğinde (ör. geçersiz bellek erişimi, ayrıcalıklı komut) işlemin bellek görüntüsü bir dosyaya yazılır. Adı, belleğin "core" olarak anıldığı ilk dönemlerden gelir. Programcı bu dosyayı daha sonra hata ayıklayıcıyla inceler (ör. <code>gdb ./main core</code>).</li>
              <li><b>Crash dump:</b> <b>Çekirdekte</b> oluşan hataya <b>crash</b> denir. Hata bilgisi log'a, bellek durumu crash dump'a yazılır. Çekirdek hata ayıklaması daha zordur: dosya sistemi kodunun kendisi bozulmuş olabileceğinden, bellek durumu genellikle diskin <b>dosya sistemi içermeyen ayrılmış bir bölümüne</b> yazılır. Sistem yeniden başladığında bir işlem bu alandaki veriyi okuyup crash dump dosyasına dönüştürür.</li>
            </ul>
            <p>Simülatörde: <b>Lab A</b>'daki ayrıcalıklı komut ihlali bir <b>core dump</b> üretir, <b>Lab C</b>'deki monolitik çekirdekte sürücü çökmesi bir <b>crash dump</b> (kernel panic) üretir.</p>`
        }
      ],
      exam: [
        {
          topic: 'Dual-Mode',
          q: 'Mode bit\'in değerleri neyi gösterir? Bir sistem çağrısında mode bit hangi sırayla değişir?',
          a: '<p><b>0 = kernel mode, 1 = user mode.</b> Program kullanıcı modunda (1) bir trap komutu çalıştırır. Donanım trap\'i işlerken mode bit\'i <b>0</b> yapar, çekirdek çağrıyı yürütür ve return-from-trap komutu mode bit\'i tekrar <b>1</b> yapar.</p>',
          preset: { module: 'system', lab: 'mode', syscall: 'read' }
        },
        {
          topic: 'Dual-Mode',
          q: 'Bir kullanıcı programı ayrıcalıklı bir komut (ör. kesmeleri kapatma) çalıştırmaya çalışırsa ne olur?',
          a: '<p>Donanım komutu <b>çalıştırmaz</b>, bunu yasak sayar ve OS\'e <b>trap</b> üretir. OS bunu programın hatası olarak ele alır, genellikle işlemi sonlandırır (Linux\'ta SIGSEGV) ve bir <b>core dump</b> yazabilir. Sistemin geri kalanı etkilenmez.</p>',
          preset: { module: 'system', lab: 'mode', illegal: true }
        },
        {
          topic: 'Dual-Mode',
          q: 'Aşağıdakilerden hangileri ayrıcalıklı olmalıdır? (a) timer değerini ayarlamak (b) saati okumak (c) belleği temizlemek (d) kesmeleri kapatmak (e) kullanıcı modundan çekirdek moduna geçmek',
          a: '<p><b>(a), (c), (d)</b> ayrıcalıklıdır. <b>(b)</b> saati okumak zararsızdır. <b>(e)</b> ayrıcalıklı değildir: kullanıcı modundan çekirdeğe geçiş <b>trap</b> komutuyla yapılır ve trap kullanıcı modunda çalıştırılabilir. Güvenlik, girişin yalnızca OS\'in belirlediği noktadan yapılmasıyla sağlanır. Tersi, yani çekirdekten <b>kullanıcı moduna geçiş komutu ise ayrıcalıklıdır</b>.</p>'
        },
        {
          topic: 'Dual-Mode',
          q: 'Timer neden gereklidir? Timer\'ı ayarlayan komut neden ayrıcalıklıdır?',
          a: '<p>Timer, bir kullanıcı programının sonsuz döngüye girerek veya OS\'i çağırmayarak CPU\'yu hiç geri vermemesini önler: belirlenen süre dolunca kesme üretir ve kontrol OS\'e döner. Kullanıcı timer\'ı değiştirebilseydi bu koruma etkisiz kalırdı.</p>'
        },
        {
          topic: 'Syscall',
          q: 'Sistem çağrılarına parametre aktarmanın üç genel yöntemi nedir?',
          a: '<p>(1) <b>Yazmaçlar</b>, (2) bellekte bir <b>blok/tablo</b> ve adresinin yazmaçla aktarılması, (3) <b>yığın</b> (program push eder, OS pop eder). Linux, 5 veya daha az parametrede yazmaçları, daha fazlasında blok yöntemini kullanır. Blok ve yığın yöntemleri parametre sayısını sınırlamaz.</p>'
        },
        {
          topic: 'ABI',
          q: '<b>API</b> ile <b>ABI</b> arasındaki fark nedir? Linux için derlenmiş bir program neden Windows\'ta doğrudan çalışmaz?',
          a: '<p><b>API</b> kaynak kodu düzeyindedir (hangi fonksiyonlar, hangi parametreler). <b>ABI</b> ikili düzeydedir: parametrelerin hangi yazmaçlarla aktarıldığı, yığın düzeni, kütüphanelerin ikili biçimi ve veri türü boyutları. Linux ve Windows\'un sistem çağrıları, dosya biçimleri (ELF ve PE) ve ABI\'leri farklıdır. Bu yüzden ikili dosya taşınamaz, kaynak kodu ise yeniden derlenebilir.</p>'
        },
        {
          topic: 'Link/Load',
          q: 'Derleyici, bağlayıcı ve yükleyicinin görevlerini sırayla açıklayın. Derleyicinin ürettiği dosyaya neden "yeniden konumlandırılabilir" denir?',
          a: '<p><b>Derleyici</b> kaynak kodu nesne dosyasına çevirir. <b>Bağlayıcı</b> nesne dosyalarını ve kütüphaneleri birleştirip sembolleri çözümler, çalıştırılabilir dosyayı üretir. <b>Yükleyici</b> dosyayı belleğe yerleştirir ve relocation yapar. Nesne dosyasının adresleri 0\'dan başladığı ve son yeri bilinmediği için kod, fiziksel bellekte herhangi bir yere yüklenebilecek şekilde düzeltme bilgileriyle (relocation entries) üretilir.</p>',
          preset: { module: 'system', lab: 'build', stage: 'object', libc: 'dynamic' }
        },
        {
          topic: 'Link/Load',
          q: 'Statik ve dinamik bağlamayı karşılaştırın. DLL kullanmanın avantajları nelerdir?',
          a: '<p><b>Statik:</b> kütüphane kodu çalıştırılabilire kopyalanır. Dosya büyür, her program kendi kopyasını taşır, çalışma anında bağımlılık yoktur. <b>Dinamik:</b> yalnızca bir saplama eklenir, kütüphane yükleme veya çalışma anında bağlanır. Avantajları: daha küçük dosyalar, kütüphanenin bellekte <b>tek kopyasının işlemler arasında paylaşılması</b>, kütüphane güncellendiğinde programların yeniden bağlanmasına gerek olmaması.</p>',
          preset: { module: 'system', lab: 'build', stage: 'linker', libc: 'dynamic' }
        },
        {
          topic: 'Link/Load',
          q: 'Relocation register = 14000, mantıksal adres = 346. Fiziksel adres nedir? Limit = 4000 ise mantıksal adres 4200 için ne olur?',
          a: '<div class="formula">346 &lt; 4000  → fiziksel = 14000 + 346 = 14346\n4200 ≥ 4000 → adresleme hatası: OS\'e trap</div><p>Limit yazmacı, işlemin kendi alanı dışına erişmesini engeller.</p>',
          preset: { module: 'system', lab: 'build', stage: 'loader', libc: 'dynamic', base: 14000 }
        },
        {
          topic: 'Yapılar',
          q: 'Mikroçekirdek yaklaşımının avantajları ve temel dezavantajı nedir? Bileşenler nasıl iletişim kurar?',
          a: '<p>Bileşenler mikroçekirdek üzerinden <b>mesaj geçirerek (IPC)</b> iletişim kurar. Avantajları: genişletme ve taşıma kolaylığı, daha yüksek güvenlik ve güvenilirlik (servisler kullanıcı işlemi olarak çalışır, biri çökse de sistem ayakta kalır). Dezavantajı: mesaj kopyalama ve işlem/mod geçişleri nedeniyle <b>performans ek yükü</b>. Simülasyonda aynı read() isteği monolitikte 2, mikroçekirdekte 8 mod geçişi gerektirir.</p>',
          preset: { module: 'system', lab: 'arch', action: 'request' }
        },
        {
          topic: 'Yapılar',
          q: 'Bir disk sürücüsü hata verip çökerse monolitik ve mikroçekirdek sistemlerde ne olur?',
          a: '<p><b>Monolitik:</b> Sürücü çekirdek adres alanında çalıştığı için hata tüm çekirdeği bozabilir. Sonuç <b>kernel panic</b> olur, bellek durumu <b>crash dump</b>\'a yazılır ve sistem yeniden başlatılmalıdır. <b>Mikroçekirdek:</b> Sürücü ayrı bir kullanıcı işlemidir. Yalnızca o işlem çöker, çekirdek ve diğer servisler çalışmaya devam eder ve sürücü yeniden başlatılabilir (MINIX 3).</p>',
          preset: { module: 'system', lab: 'arch', action: 'crash' }
        },
        {
          topic: 'Tasarım',
          q: '<b>Policy</b> ile <b>mechanism</b> arasındaki farkı bir örnekle açıklayın. Neden ayrılmaları istenir?',
          a: '<p><b>Mekanizma nasıl</b>, <b>politika ne</b> yapılacağını belirler. Timer, CPU korumasını sağlayan bir mekanizmadır. Belirli bir kullanıcı için timer\'ın ne kadar süreye kurulacağı ise bir politikadır. Ayrıldıklarında politika değişikliği yalnızca parametre değişikliği gerektirir, mekanizmanın yeniden yazılması gerekmez. Bu esneklik sağlar.</p>'
        },
        {
          topic: 'Debug',
          q: '<b>Core dump</b> ile <b>crash dump</b> arasındaki fark nedir? Crash dump neden dosya sistemi olmayan bir disk alanına yazılır?',
          a: '<p><b>Core dump</b> bir <b>kullanıcı işleminin</b> hatası sonucunda o işlemin bellek görüntüsüdür. <b>Crash dump</b> ise <b>çekirdek hatasında</b> (crash) çekirdeğin bellek durumudur. Çekirdek çöktüğünde dosya sistemi kodunun kendisi bozulmuş olabileceğinden ona güvenilemez. Bu yüzden döküm diskin ayrılmış, dosya sistemi içermeyen bir bölümüne yazılır ve yeniden başlatmada dosyaya dönüştürülür.</p>'
        }
      ]
    },

    sync: {
      theory: [
        {
          id: 'race',
          kind: 'algo',
          title: 'Yarış Durumu (Race Condition)',
          html: `
            <p>Birden fazla işlem aynı veriye eşzamanlı eriştiğinde, sonuç erişimlerin <b>hangi sırayla</b> gerçekleştiğine bağlıysa buna <b>yarış durumu</b> denir.</p>
            <p><code>counter++</code> yüksek seviyede tek satırdır, ancak makine dilinde üç komuttur:</p>
            <div class="formula">register1 = counter          register2 = counter
register1 = register1 + 1    register2 = register2 − 1
counter = register1          counter = register2</div>
            <p>Bağlam değişimi bu komutların arasına düşebilir. counter = 5 iken ders kitabındaki sıralama:</p>
            <div class="formula">T0  üretici  register1 = counter        {register1 = 5}
T1  üretici  register1 = register1 + 1  {register1 = 6}
T2  tüketici register2 = counter        {register2 = 5}
T3  tüketici register2 = register2 − 1  {register2 = 4}
T4  üretici  counter = register1        {counter = 6}
T5  tüketici counter = register2        {counter = 4}</div>
            <p>Doğru sonuç 5 iken 4 elde edilir. T4 ile T5 yer değiştirirse sonuç 6 olur. Yazmaçlar işleme özeldir ve bağlam değişiminde PCB'ye kaydedilir; sorun, ikisinin de aynı <i>eski</i> değeri okumasıdır.</p>
            <p class="note"><b>Simülatör:</b> "Ders kitabı senaryosu" bu T0–T5 sırasını birebir uygular. "Kayıp güncelleme", bir işlemin kendi okumasından sonra değişmiş olan değeri bayat yazmaçla ezmesidir.</p>`
        },
        {
          id: 'cs',
          title: 'Kritik Bölge Problemi',
          html: `
            <p>Paylaşılan veriye erişen kod parçasına <b>kritik bölge (critical section)</b> denir. Her işlemin yapısı:</p>
            <div class="formula">while (true) {
    entry section       ← izin iste
        critical section
    exit section        ← izni bırak
        remainder section
}</div>
            <p>Bir çözüm şu <b>üç koşulu</b> sağlamalıdır:</p>
            <ol>
              <li><b>Karşılıklı dışlama (mutual exclusion):</b> Bir işlem kritik bölgedeyken başka hiçbir işlem kendi kritik bölgesine giremez.</li>
              <li><b>İlerleme (progress):</b> Kritik bölgede kimse yoksa ve girmek isteyenler varsa, kimin gireceği kararına yalnızca remainder bölümünde olmayan işlemler katılır ve bu karar süresiz ertelenemez.</li>
              <li><b>Sınırlı bekleme (bounded waiting):</b> Bir işlem giriş isteğinde bulunduktan sonra, diğer işlemlerin kritik bölgeye girme sayısının bir üst sınırı vardır (açlık yoktur).</li>
            </ol>
            <p><b>Peterson çözümü</b> (iki işlem, i ve j):</p>
            <div class="formula">flag[i] = true;
turn = j;
while (flag[j] && turn == j)
    ;   /* busy wait */
    /* critical section */
flag[i] = false;</div>
            <p>Peterson çözümü üç koşulu da sağlar. Ancak modern mimariler komutları yeniden sıralayabildiği için (instruction reordering) bellek bariyerleri olmadan doğru çalışacağı garanti değildir.</p>
            <p>Tek işlemcide kesmeleri kapatmak bir çözümdür, ama çok işlemcili sistemlerde uygulanabilir değildir: mesajın tüm işlemcilere iletilmesi zaman alır ve sistem verimi düşer.</p>`
        },
        {
          id: 'hardware',
          title: 'Donanım Desteği: Atomik Komutlar',
          html: `
            <p>Modern işlemciler, bir kelimeyi <b>kesilemez (atomik)</b> bir adımda okuyup değiştiren komutlar sunar:</p>
            <div class="formula">boolean test_and_set(boolean *target) {
    boolean rv = *target;
    *target = true;
    return rv;          // tümü atomik
}

int compare_and_swap(int *value, int expected, int new_value) {
    int temp = *value;
    if (*value == expected) *value = new_value;
    return temp;        // tümü atomik
}</div>
            <p>Mutex ve semafor gibi üst seviye araçlar bu komutlar üzerine kurulur. <b>Atomik değişkenler</b> (ör. <code>increment(&amp;counter)</code>) tek bir değişkenin güncellenmesindeki yarışı çözer, ancak genel kritik bölge problemini çözmez.</p>`
        },
        {
          id: 'mutex',
          kind: 'algo',
          title: 'Mutex Kilitleri',
          html: `
            <p>En basit senkronizasyon aracıdır: kritik bölgeye girmeden önce <code>acquire()</code>, çıkarken <code>release()</code> çağrılır. Her iki çağrı da <b>atomik</b> olmalıdır.</p>
            <div class="formula">acquire() {
    while (!available)
        ;   /* busy wait */
    available = false;
}
release() {
    available = true;
}</div>
            <p>Silberschatz'daki bu tanım bir <b>spinlock</b>'tur: kilit doluysa işlem döngüde CPU harcayarak bekler (<b>busy waiting</b>).</p>
            <ul>
              <li><b>Spinlock artısı:</b> Bağlam değişimi gerektirmez. Çok çekirdekli sistemlerde kilit kısa süre (iki bağlam değişiminden az) tutulacaksa tercih edilir.</li>
              <li><b>Eksisi:</b> Tek işlemcide bekleyen işlem, kilidi tutan işlemin çalışmasına engel olarak CPU'yu boşa harcar.</li>
            </ul>
            <p>Bunun alternatifi <b>engellemeli (sleeping) kilittir</b>: kilit doluysa işlem bekleme kuyruğuna alınır ve bloklanır.</p>
            <p class="note"><b>Simülatör:</b> Buradaki mutex engellemelidir. Kilit doluysa işlem BLOCKED olur ve kuyruğa girer. release(), kilidi kuyruktaki ilk işleme (FIFO) devreder. Bir mutex'i yalnızca sahibi bırakabilir.</p>`
        },
        {
          id: 'semaphore',
          kind: 'algo',
          title: 'Semaforlar (Dijkstra)',
          html: `
            <p>Semafor S, yalnızca iki atomik işlemle erişilen bir tam sayıdır: <code>wait()</code> (P, <i>proberen</i>: test et) ve <code>signal()</code> (V, <i>verhogen</i>: artır).</p>
            <ul>
              <li><b>Binary semafor:</b> 0 ile 1 arasında değer alır, mutex gibi davranır.</li>
              <li><b>Counting semafor:</b> Sınırsız aralık. Başlangıç değeri kaynak sayısıdır (ör. n özdeş kaynak).</li>
            </ul>
            <p><b>Busy waiting olmadan gerçekleştirme:</b></p>
            <div class="formula">typedef struct {
    int value;
    struct process *list;
} semaphore;

wait(semaphore *S) {
    S->value--;
    if (S->value < 0) {
        add this process to S->list;
        sleep();            // block
    }
}

signal(semaphore *S) {
    S->value++;
    if (S->value <= 0) {
        remove a process P from S->list;
        wakeup(P);
    }
}</div>
            <p>Değer negatifse <b>|S| = bekleyen işlem sayısıdır</b>. wait() ve signal() aynı semafor üzerinde aynı anda çalışmamalıdır; bu ikisi de birer kritik bölgedir.</p>
            <p>Semaforlar sıralama için de kullanılır. S2'den önce S1 çalışsın isteniyorsa <code>synch = 0</code> ile başlanır: P1 → <code>S1; signal(synch);</code>, P2 → <code>wait(synch); S2;</code></p>`
        },
        {
          id: 'pc',
          kind: 'algo',
          title: 'Üretici–Tüketici (Bounded Buffer)',
          html: `
            <p>n yuvalı paylaşılan bir tampon. Üretici ürün koyar, tüketici ürün alır. Üç semafor kullanılır:</p>
            <div class="formula">int n;
semaphore mutex = 1;   // tampona karşılıklı dışlama
semaphore empty = n;   // boş yuva sayısı
semaphore full  = 0;   // dolu yuva sayısı</div>
            <div class="formula">/* Üretici */                    /* Tüketici */
while (true) {                   while (true) {
  /* produce next_produced */      wait(full);
  wait(empty);                     wait(mutex);
  wait(mutex);                     /* remove → next_consumed */
  /* add next_produced */          signal(mutex);
  signal(mutex);                   signal(empty);
  signal(full);                    /* consume next_consumed */
}                                }</div>
            <ul>
              <li>Tampon doluyken (<code>empty = 0</code>) üretici <b>wait(empty)</b>'de bloklanır.</li>
              <li>Tampon boşken (<code>full = 0</code>) tüketici <b>wait(full)</b>'da bloklanır.</li>
              <li>Tampon dairesel dizidir: <code>in = (in + 1) % n</code>, <code>out = (out + 1) % n</code>.</li>
            </ul>
            <p class="note"><b>wait sırası kritiktir:</b> Üretici önce wait(mutex) sonra wait(empty) yaparsa, tampon doluyken mutex'i tutarak uyur. Tüketici de mutex'i alamaz → <b>deadlock</b>. signal sırasının değişmesi ise doğruluğu bozmaz, çünkü signal hiçbir zaman bloklamaz.</p>`
        },
        {
          id: 'deadlock',
          kind: 'algo',
          title: 'Deadlock ve Starvation',
          html: `
            <p><b>Deadlock (kilitlenme):</b> Bir işlem kümesindeki her işlem, yalnızca kümedeki başka bir işlemin tetikleyebileceği bir olayı beklemektedir. Klasik semafor örneği (S = Q = 1):</p>
            <div class="formula">P0              P1
wait(S);        wait(Q);
wait(Q);        wait(S);    ← ikisi de sonsuza dek bekler
...             ...
signal(S);      signal(Q);
signal(Q);      signal(S);</div>
            <p>Deadlock için <b>dört koşulun aynı anda</b> sağlanması gerekir (Coffman):</p>
            <ol>
              <li><b>Mutual exclusion:</b> En az bir kaynak paylaşılamaz.</li>
              <li><b>Hold and wait:</b> İşlem bir kaynağı tutarken başka kaynak bekler.</li>
              <li><b>No preemption:</b> Kaynak, tutan işlemden zorla alınamaz.</li>
              <li><b>Circular wait:</b> P0 → P1 → … → Pn → P0 şeklinde döngüsel bekleme vardır.</li>
            </ol>
            <p><b>Starvation (süresiz bloklanma):</b> Bir işlemin semafor kuyruğundan hiç çıkarılamaması. Örneğin kuyruk LIFO sırayla işlenirse oluşabilir.</p>
            <p><b>Öncelik terslemesi (priority inversion):</b> Yüksek öncelikli bir işlem, düşük öncelikli bir işlemin tuttuğu kilidi beklerken orta öncelikli işlemler araya girer. Çözüm: <b>priority inheritance</b> protokolü (Mars Pathfinder vakası).</p>`
        }
      ],
      exam: [
        {
          topic: 'Race',
          q: 'counter = 5. Üretici <code>counter++</code>, tüketici <code>counter--</code> işlemini eşzamanlı yürütüyor. counter\'ın alabileceği son değerler nelerdir? Hangi sıralama 4 verir?',
          a: '<p><b>4, 5 veya 6.</b> T0–T5 sıralamasında (üretici okur ve artırır, tüketici okur ve azaltır, önce üretici sonra tüketici yazar) sonuç <b>4</b> olur. Son iki yazma yer değiştirirse <b>6</b>, iç içe geçme olmazsa <b>5</b> olur.</p>',
          preset: { module: 'sync', lab: 'cs', cfg: { mode: 'none', policy: 'textbook', initial: 5, iterations: 1, opB: 'dec', semValue: 1 } }
        },
        {
          topic: 'Kavram',
          q: 'Kritik bölge probleminin çözümü hangi <b>üç koşulu</b> sağlamalıdır?',
          a: '<p><b>Mutual exclusion</b> (aynı anda tek işlem), <b>progress</b> (kritik bölge boşsa giriş kararı süresiz ertelenemez), <b>bounded waiting</b> (istekten sonra diğerlerinin girme sayısı sınırlıdır, açlık yoktur).</p>'
        },
        {
          topic: 'Mutex',
          q: 'Aynı senaryo bir <b>mutex</b> ile korunursa ne değişir? Process B kilit doluyken acquire() çağırırsa ne olur?',
          a: '<p>B bekleme kuyruğuna girer ve BLOCKED olur. A kritik bölgeyi bitirip release() yapınca kilit B\'ye devredilir ve B uyanır. Okuma-değiştirme-yazma dizileri artık iç içe geçemez; sonuç her zaman 5\'tir.</p><p class="note">Kitaptaki spinlock tanımında B uyumak yerine <code>while (!available);</code> döngüsünde CPU harcayarak bekler.</p>',
          preset: { module: 'sync', lab: 'cs', cfg: { mode: 'mutex', policy: 'textbook', initial: 5, iterations: 1, opB: 'dec', semValue: 1 } }
        },
        {
          topic: 'Mutex',
          q: 'Spinlock (busy waiting) hangi durumda engellemeli kilitten <b>daha verimlidir</b>?',
          a: '<p><b>Çok çekirdekli</b> sistemlerde ve kilit <b>kısa süre</b> (iki bağlam değişiminden az) tutulacaksa. Bekleyen işlem başka çekirdekte döner, bağlam değişimi maliyeti ödenmez. Tek işlemcide spinlock CPU\'yu boşa harcar.</p>'
        },
        {
          topic: 'Semafor',
          q: 'S = 1 olan bir semaforda sırayla P1 wait(S), P2 wait(S), P3 wait(S) ve ardından P1 signal(S) çağrılıyor. Her adımdan sonra S ve kuyruk ne olur?',
          a: '<div class="formula">P1 wait   → S =  0   kuyruk: —          (P1 girer)\nP2 wait   → S = −1   kuyruk: [P2]       (P2 bloklanır)\nP3 wait   → S = −2   kuyruk: [P2, P3]   (P3 bloklanır)\nP1 signal → S = −1   kuyruk: [P3]       (P2 uyandırılır)</div><p>Negatif değerin mutlak değeri bekleyen işlem sayısıdır.</p>'
        },
        {
          topic: 'Semafor',
          q: 'İki işlemli kritik bölge, <b>başlangıç değeri 2</b> olan bir counting semaforla korunursa karşılıklı dışlama sağlanır mı?',
          a: '<p><b>Hayır.</b> İlk iki wait() çağrısı da S\'yi 1 ve 0\'a düşürerek geçer, yani iki işlem aynı anda kritik bölgeye girer. Karşılıklı dışlama için semafor <b>1 ile başlatılmalıdır</b> (binary semafor). Counting semaforun başlangıç değeri, aynı anda izin verilen kullanıcı sayısını belirler.</p>',
          preset: { module: 'sync', lab: 'cs', cfg: { mode: 'semaphore', policy: 'random', initial: 5, iterations: 3, opB: 'dec', semValue: 2 } }
        },
        {
          topic: 'Semafor',
          q: 'wait() ve signal() işlemleri neden <b>atomik</b> olmak zorundadır?',
          a: '<p>Her ikisi de S.value üzerinde okuma-değiştirme-yazma yapar. Atomik olmazlarsa semaforun kendisinde yarış durumu oluşur: iki işlem aynı değeri okuyup ikisi de geçebilir ya da bir uyandırma kaybolabilir. Tek işlemcide kesmeler kapatılarak, çok işlemcide compare_and_swap veya spinlock ile atomiklik sağlanır.</p>'
        },
        {
          topic: 'Bounded Buffer',
          q: 'Bounded buffer çözümünde <b>mutex, empty, full</b> semaforlarının başlangıç değerleri nedir ve neyi sayarlar?',
          a: '<div class="formula">mutex = 1   tampona karşılıklı dışlama\nempty = n   boş yuva sayısı\nfull  = 0   dolu yuva sayısı</div>'
        },
        {
          topic: 'Bounded Buffer',
          q: 'Üretici kodunda <b>wait(empty)</b> ile <b>wait(mutex)</b> yer değiştirirse ne olur?',
          a: '<p>Tampon doluyken üretici önce mutex\'i alır, sonra wait(empty)\'de bloklanır ve <b>mutex\'i tutarak uyur</b>. Tüketici wait(full)\'u geçer ama wait(mutex)\'te bloklanır. Kimse signal(empty) yapamaz → <b>deadlock</b> (hold and wait + circular wait).</p>',
          preset: { module: 'sync', lab: 'pc', cfg: { size: 3, prod: 5, cons: 1, policy: 'auto', buggy: true } }
        },
        {
          topic: 'Bounded Buffer',
          q: 'Üretici kodunda <b>signal(mutex)</b> ile <b>signal(full)</b> yer değiştirirse deadlock oluşur mu?',
          a: '<p><b>Hayır.</b> signal() hiçbir zaman bloklamaz. Sıranın değişmesi yalnızca tüketicinin biraz daha erken uyanıp hemen mutex\'te beklemesine yol açabilir, yani küçük bir verim farkı olur. Doğruluk etkilenmez.</p>'
        },
        {
          topic: 'Bounded Buffer',
          q: 'Üretici, tüketiciden çok daha hızlıysa sistemde ne gözlenir? Üretici CPU\'yu boşa harcar mı?',
          a: '<p>Tampon dolar, empty 0\'a iner ve bir sonraki wait(empty) değeri −1 yaparak üreticiyi <b>bloklar</b>. Üretici semafor kuyruğunda <b>uyur</b>, CPU\'yu harcamaz (busy waiting yok). Tüketici signal(empty) yapınca uyandırılır.</p>',
          preset: { module: 'sync', lab: 'pc', cfg: { size: 4, prod: 5, cons: 1, policy: 'auto', buggy: false } }
        },
        {
          topic: 'Deadlock',
          q: 'Deadlock\'un oluşması için aynı anda sağlanması gereken <b>dört koşul</b> nedir?',
          a: '<p><b>Mutual exclusion, hold and wait, no preemption, circular wait</b> (Coffman koşulları). Biri bile engellenirse deadlock oluşamaz.</p>'
        },
        {
          topic: 'Deadlock',
          q: 'S = Q = 1. P0: <code>wait(S); wait(Q);</code>, P1: <code>wait(Q); wait(S);</code>. Hangi sıralama kilitlenmeye yol açar?',
          a: '<p>P0 wait(S) → S = 0, P1 wait(Q) → Q = 0, P0 wait(Q) → bloklanır, P1 wait(S) → bloklanır. Her biri diğerinin tuttuğu semaforu bekler → <b>deadlock</b>. Çözüm: tüm işlemlerde semaforları <b>aynı sırayla</b> almak (circular wait\'i önlemek).</p>'
        }
      ]
    }
  };
})(window.OSLab = window.OSLab || {});
