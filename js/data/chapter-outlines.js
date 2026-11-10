/*
 * chapter-outlines.js — Bölümlerin giriş sayfası: hocanın PDF'inin ilk sayfasındaki konu listesi
 * (aynı sırayla) ve bölümde öğrenilecek temel kavramlar. Her konu, onu anlatan derslere bağlanır.
 * slide: konu listesinin bulunduğu slayt. note: konunun sitede nasıl karşılandığı.
 */
(function (OSLab) {
  'use strict';

  OSLab.chapterOutlines = {
    ch1: {
      slide: '1.11',
      topics: [
        ['İşletim sistemi ne yapar?', ['nedir']],
        ['Bilgisayar sistem organizasyonu', ['organizasyon', 'kesme', 'io', 'depolama']],
        ['Bilgisayar sistem mimarisi', ['mimari']],
        ['İşletim sistemi yapısı ve operasyonları', ['coklu-program', 'islemler']],
        ['Kaynak, işlem, bellek ve depolama yönetimi', ['bilesenler', 'depolama-yonetimi']],
        ['Koruma ve güvenlik', ['koruma-guvenlik']],
        ['Dağıtık sistemler', ['ortamlar']],
        ['Bilgi işlem ortamları (Computing Environments)', ['ortamlar']],
        ['Ücretsiz ve açık kaynak işletim sistemleri', ['ortamlar']]
      ],
      concepts: ['işletim sistemi', 'çekirdek (kernel)', 'bootstrap', 'kesme ve kesme vektörü', 'trap / exception', 'DMA', 'depolama hiyerarşisi', 'önbellekleme', 'SMP ve NUMA', 'çoklu programlama', 'çoklu görev', 'çift mod ve mod biti', 'zamanlayıcı (timer)', 'sanallaştırma', 'bulut: SaaS, PaaS, IaaS']
    },
    ch2: {
      slide: '2.2',
      topics: [
        ['İşletim sistemi servisleri', ['servisler']],
        ['Kullanıcı ve işletim sistemi arayüzü', ['arayuz']],
        ['Shell programlama (lab dokümanı)', ['shell-temel', 'shell-izin', 'shell-script', 'shell-akis', 'shell-metin', 'shell-pipe', 'shell-awk']],
        ['Sistem çağrıları', ['sistem-cagrisi', 'parametre']],
        ['Sistem servisleri', ['sistem-programlari']],
        ['Bağlayıcılar ve yükleyiciler (Linkers and Loaders)', ['baglayici']],
        ['Uygulamalar neden işletim sistemine özgüdür?', ['abi']],
        ['Tasarım ve uygulama', ['tasarim']],
        ['İşletim sistemi yapısı', ['yapilar']],
        ['Bir işletim sisteminin oluşturulması ve önyüklenmesi', ['boot']],
        ['İşletim sistemi hata ayıklama', ['debug']]
      ],
      concepts: ['CLI, GUI ve kabuk', 'sistem çağrısı', 'API', 'parametre geçişi', 'sistem programları', 'linker ve loader', 'relocation', 'DLL / dinamik bağlama', 'ABI', 'policy ve mechanism', 'monolitik, katmanlı, mikroçekirdek', 'modüler ve hibrit yapı', 'GRUB, BIOS, UEFI', 'core dump ve crash dump', 'strace, perf, BCC', 'chmod ve izinler', 'pipe', 'awk']
    },
    ch3: {
      slide: '3.2',
      topics: [
        ['İşlem kavramı', ['kavram', 'durumlar', 'pcb']],
        ['İşlem planlama (Scheduling)', ['planlama']],
        ['İşlemlerle ilgili işlemler', ['olusturma']],
        ['İşlemler arası iletişim (IPC)', ['ipc']],
        ['Paylaşımlı bellek sistemlerinde IPC', ['paylasilan-bellek']],
        ['Mesaj geçiş sistemlerinde IPC', ['mesaj']],
        ['IPC sistemlerine örnekler', ['ipc-ornek']],
        ['İstemci-sunucu sistemlerinde iletişim', ['istemci-sunucu']]
      ],
      concepts: ['işlem ve program', 'işlem durumları', 'PCB', 'bağlam değişimi', 'hazır ve bekleme kuyrukları', 'fork, exec, wait', 'zombie ve orphan', 'IPC', 'paylaşılan bellek', 'üretici-tüketici', 'yarış durumu', 'mesaj geçişi', 'posta kutusu', 'pipe', 'soket', 'RPC']
    },
    ch4: {
      slide: '4.2',
      topics: [
        ['Overview (genel bakış)', ['kavram']],
        ['Multicore Programming (çok çekirdekli programlama)', ['cok-cekirdek']],
        ['Multithreading Models (modeller)', ['modeller']],
        ['Thread Libraries (kütüphaneler)', ['kutuphaneler']],
        ['Implicit Threading (örtük iş parçacığı)', ['ortuk']],
        ['Threading Issues (sorunlar)', ['sorunlar']],
        ['Operating System Examples (örnekler)', ['os-thread']]
      ],
      concepts: ['iş parçacığı', 'eşzamanlılık ve paralellik', 'veri ve görev paralelliği', 'Amdahl yasası', 'kullanıcı ve çekirdek iş parçacığı', 'çoktan-bire, bire-bir, çoktan-çoğa', 'Pthreads', 'Java Executor', 'iş parçacığı havuzu', 'fork-join', 'OpenMP ve GCD', 'iş parçacığı iptali', 'TLS', 'LWP']
    },
    ch5: {
      slide: '5.2',
      topics: [
        ['Temel kavramlar', ['temel']],
        ['Planlama kriterleri', ['temel']],
        ['Planlama algoritmaları', ['fcfs', 'sjf', 'srtf', 'oncelik', 'rr', 'coklu-kuyruk', 'karsilastirma', 'odev']],
        ['Thread planlama', ['thread-planlama']],
        ['Multiple-processor planlama', ['coklu-islemci']],
        ['Gerçek zamanlı planlama (slaytlarda, listede yok)', ['gercek-zamanli']],
        ['İşletim sistemi örnekleri', ['os-planlama']],
        ['Algoritma değerlendirilmesi', ['degerlendirme']]
      ],
      concepts: ['CPU burst', 'zamanlayıcı ve dağıtıcı', 'kesmeli ve kesmesiz', 'bekleme, turnaround, yanıt süresi', 'FCFS ve konvoy etkisi', 'SJF ve SRTF', 'öncelik, açlık, yaşlandırma', 'Round Robin ve kuantum', 'çok düzeyli kuyruk', 'PCS ve SCS', 'yük dengeleme ve yakınlık', 'Rate Monotonic ve EDF', 'CFS', 'Little formülü']
    },
    ch6: {
      slide: '6.2',
      topics: [
        ['Background (arka plan)', ['kritik-bolum']],
        ['The Critical-Section Problem (kritik bölüm problemi)', ['kritik-bolum']],
        ['Peterson\'s Solution (Peterson çözümü)', ['peterson', 'bellek-bariyeri']],
        ['Hardware Support for Synchronization (donanım desteği)', ['donanim']],
        ['Mutex Locks', ['mutex']],
        ['Semaphores (semaforlar)', ['semafor']],
        ['Monitors (monitörler)', ['monitor']],
        ['Liveness (canlılık)', ['canlilik']],
        ['Evaluation (değerlendirme: slaytlarda içeriği yok)', []]
      ],
      concepts: ['yarış durumu', 'kritik bölüm', 'karşılıklı dışlama, ilerleme, sınırlı bekleme', 'Peterson çözümü', 'bellek bariyeri', 'test_and_set', 'compare_and_swap', 'atomik değişken', 'mutex ve spinlock', 'semafor: wait ve signal', 'monitör', 'koşul değişkeni', 'kilitlenme', 'açlık', 'öncelik tersinmesi ve kalıtımı']
    },
    ch7: {
      slide: '7.2',
      topics: [
        ['Sınırlı tampon problemi (bounded-buffer)', ['sinirli-tampon']],
        ['Okuyucular-yazarlar problemi (readers-writers)', ['okuyucu-yazar']],
        ['Yemek yiyen filozoflar (dining-philosophers)', ['filozoflar']],
        ['Linux ve Windows\'un senkronizasyon araçları', ['cekirdek-sync']],
        ['POSIX ve Java ile senkronizasyon', ['posix-sync', 'java-sync']],
        ['Alternatif yaklaşımlar (slaytlarda, listede yok)', ['alternatif']]
      ],
      concepts: ['sınırlı tampon: mutex, empty, full', 'okuyucu-yazar ve read_count', 'filozoflar ve kilitlenme', 'dispatcher nesnesi', 'atomic_t', 'POSIX mutex ve semafor', 'POSIX koşul değişkeni', 'Java synchronized', 'wait ve notify', 'ReentrantLock', 'işlemsel bellek']
    }
  };
})(window.OSLab = window.OSLab || {});
