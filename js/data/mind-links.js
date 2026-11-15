/*
 * mind-links.js — Zihin haritasındaki konu ilişkileri. a ve b ders anahtarlarıdır ('<bölüm>/<ders>');
 * ilişki iki yönlüdür. why: iki konuyu bağlayan tek cümle (haritada çizginin açıklaması).
 */
(function (OSLab) {
  'use strict';

  OSLab.mindLinks = [
    // Bölüm 1 içinde
    { a: 'ch1/kesme', b: 'ch1/islemler', why: 'Sistem çağrısı trap ile çekirdeğe girer; trap anında donanım mod bitini 0 yapar, çekirdek moduna geçilir.' },
    { a: 'ch1/organizasyon', b: 'ch1/kesme', why: 'Aygıt denetleyicisi işin bittiğini CPU\'ya veri yolu üzerinden bir kesmeyle bildirir.' },
    { a: 'ch1/depolama', b: 'ch1/depolama-yonetimi', why: 'Ana bellek uçucu ve küçük olduğu için veri kalıcı ikincil depolamada tutulur ve yönetilir.' },

    // Bölüm 1 → diğer bölümler
    { a: 'ch1/koruma-guvenlik', b: 'ch2/shell-izin', why: 'Her dosya bir kullanıcı ve grup kimliğiyle ilişkilidir; ls -l izinleri sahip, grup ve diğerleri için ayrı gösterir.' },
    { a: 'ch1/nedir', b: 'ch2/servisler', why: 'İşletim sistemi kaynak ayırıcıdır; kaynak paylaşımı servisi kaynakları kullanıcılar ve işler arasında dağıtır.' },
    { a: 'ch1/organizasyon', b: 'ch2/boot', why: 'Açılışta ROM/EEPROM\'daki önyükleme programı çekirdeği bulur, belleğe yükler ve başlatır.' },
    { a: 'ch1/kesme', b: 'ch2/sistem-cagrisi', why: 'Sistem çağrısı yazılım kesmesi (trap) üretir; program işletim sistemi servislerine bu yolla ulaşır.' },
    { a: 'ch1/islemler', b: 'ch2/tasarim', why: 'Zamanlayıcı bir mekanizmadır; kaç saniyede bir kesme üretileceği ise politikadır ve ayrı tutulur.' },
    { a: 'ch1/islemler', b: 'ch5/rr', why: 'RR dilimi biten işlemi keser; çekirdeğin CPU\'yu geri almasını zamanlayıcının ürettiği kesme sağlar.' },
    { a: 'ch1/coklu-program', b: 'ch5/rr', why: 'Round Robin zaman paylaşımı için tasarlanmıştır: CPU işler arasında sık geçerek etkileşim sağlar.' },
    { a: 'ch1/islemler', b: 'ch5/temel', why: 'Dağıtıcı çekirdek modunda çalışır; CPU\'yu seçilen işleme vermeden önce mod bitini kullanıcı moduna çeker.' },
    { a: 'ch1/islemler', b: 'ch6/kritik-bolum', why: 'Kesmeleri kapatınca zamanlayıcı kesmesi de işlenmez; kritik bölüm uzarsa kontrol işletim sistemine dönmez.' },
    { a: 'ch1/bilesenler', b: 'ch6/canlilik', why: 'İşlem yönetimi kilitlenmeyle başa çıkma mekanizmaları sağlar; kilitlenmede işlemler birbirini süresiz bekler.' },
    { a: 'ch1/io', b: 'ch3/mesaj', why: 'Bloklayan = senkron, bloklamayan = asenkron ayrımı G/Ç\'de de mesaj geçişinde de aynı anlamdadır.' },
    { a: 'ch1/mimari', b: 'ch5/coklu-islemci', why: 'SMP\'de her işlemci tüm görevleri yapar; planlamada da her işlemci kendi kendini planlar.' },
    { a: 'ch1/ortamlar', b: 'ch5/os-planlama', why: 'Linux CFS çalışabilir görevleri dengeli kırmızı-siyah ağaçta tutar; bu bir çekirdek veri yapısıdır.' },
    { a: 'ch1/kesme', b: 'ch5/gercek-zamanli', why: 'Kesme gecikmesi, kesmenin gelişinden kesme servis rutininin başlamasına kadar geçen süredir.' },

    // Bölüm 2 içinde
    { a: 'ch2/arayuz', b: 'ch2/shell-temel', why: 'bash bir kabuktur (CLI); UNIX\'te rm gibi bir komut, aynı adlı programın bulunup çalıştırılmasıdır.' },
    { a: 'ch2/shell-metin', b: 'ch2/shell-pipe', why: 'uniq -c yalnızca yan yana aynı satırları sayar; bu yüzden pipe\'ta önce sort gelmelidir.' },
    { a: 'ch2/shell-awk', b: 'ch2/shell-pipe', why: 'Ayırıcı \';\' ise cut\'a -d\';\', sort\'a -t\';\', awk\'a -F \';\' verilir; yoksa satır doğru bölünmez.' },
    { a: 'ch2/shell-akis', b: 'ch2/shell-script', why: 'Değişkenin değeri $ ile okunur; if [ $sayi -gt 5 ] koşulu betikteki bu değeri karşılaştırır.' },
    { a: 'ch2/sistem-cagrisi', b: 'ch2/abi', why: 'API sistem çağrılarına kaynak kodu düzeyinde erişimi tanımlar; ABI bunun ikili düzeydeki karşılığıdır.' },
    { a: 'ch2/sistem-cagrisi', b: 'ch2/debug', why: 'strace, bir işlemin çağırdığı sistem çağrılarını izleyen bir izleme (tracing) aracıdır.' },
    { a: 'ch2/sistem-programlari', b: 'ch2/baglayici', why: 'Bağlayıcı ve yükleyici, program yükleme ve yürütme için sunulan sistem programlarıdır.' },

    // Bölüm 2 → diğer bölümler
    { a: 'ch2/shell-pipe', b: 'ch3/ipc-ornek', why: 'Kabuktaki | sıradan pipe\'tır: her komut ayrı bir işlemdir, biri yazar, diğeri okur; tek yönlüdür.' },
    { a: 'ch2/baglayici', b: 'ch3/kavram', why: 'Yükleyici çalıştırılabilir dosyayı belleğe getirir; belleğe yüklenen program işleme dönüşür.' },
    { a: 'ch2/yapilar', b: 'ch3/mesaj', why: 'Mikroçekirdekte servisler kullanıcı alanında çalışır ve birbirleriyle mesaj geçişiyle haberleşir.' },
    { a: 'ch2/parametre', b: 'ch3/olusturma', why: 'fork(), exit(), wait() işlem kontrolü çağrılarıdır; kabuk fork() ile işlem açıp exec() ile program yükler.' },
    { a: 'ch2/servisler', b: 'ch3/ipc', why: 'İletişim servisi iki modelle sunulur: paylaşılan bellek ve mesaj geçişi.' },

    // Bölüm 3 içinde
    { a: 'ch3/durumlar', b: 'ch3/planlama', why: 'Hazır durumdaki işlemler hazır kuyruğunda, bir G/Ç\'yi bekleyenler aygıt kuyruklarında durur.' },
    { a: 'ch3/pcb', b: 'ch3/planlama', why: 'Zamanlama kuyrukları PCB\'lerin bağlı listesi olarak tutulur; her işlem kuyrukta PCB\'siyle temsil edilir.' },
    { a: 'ch3/olusturma', b: 'ch3/ipc-ornek', why: 'Sıradan pipe ebeveyn–çocuk ilişkisi gerektirir; bu ilişki ebeveynin çocuk işlem oluşturmasıyla kurulur.' },

    // Bölüm 3 → diğer bölümler
    { a: 'ch3/pcb', b: 'ch5/temel', why: 'Dağıtıcı bağlam değişiminde eski işlemin durumunu PCB\'sine kaydeder, yenisininkini PCB\'sinden yükler.' },
    { a: 'ch3/pcb', b: 'ch4/kavram', why: 'Thread\'ler işlemin kaynaklarını paylaşır; iş parçacığı değiştirmenin yükü bağlam değişiminden düşüktür.' },
    { a: 'ch3/olusturma', b: 'ch6/kritik-bolum', why: 'İki işlem aynı anda fork() yapınca next_available_pid yarışa girer; aynı pid iki işleme verilebilir.' },
    { a: 'ch3/paylasilan-bellek', b: 'ch6/kritik-bolum', why: 'Üretici ve tüketicinin ortak counter\'ı güncellediği kod kritik bölümdür; denetlenmezse yarış durumu oluşur.' },
    { a: 'ch3/paylasilan-bellek', b: 'ch6/donanim', why: 'counter++ makine dilinde üç komut olduğu için araya girilebilir; atomik değişken artırmayı kesintisiz yapar.' },
    { a: 'ch3/istemci-sunucu', b: 'ch4/kavram', why: 'Sunucu bir portu dinler; çok iş parçacıklı sunucu her istek için yeni thread açıp dinlemeye devam eder.' },

    // Bölüm 4 → Bölüm 5
    { a: 'ch4/modeller', b: 'ch5/thread-planlama', why: 'Çoktan-bire ve çoktan-çoğa modellerde kullanıcı thread\'leri aynı işlem içinde yarışır (PCS).' },
    { a: 'ch4/kutuphaneler', b: 'ch5/thread-planlama', why: 'Pthreads API\'si iş parçacığı oluşturulurken çekişme alanını (PCS ya da SCS) seçtirir.' },
    { a: 'ch4/cok-cekirdek', b: 'ch5/coklu-islemci', why: 'Gerçek paralellik birden çok çekirdek ister; yük dengeleme iş yükünü bu CPU\'lara eşit dağıtmaya çalışır.' },

    // Bölüm 5 içinde
    { a: 'ch5/fcfs', b: 'ch5/rr', why: 'RR, FCFS\'e zaman dilimi eklenmiş hâlidir; kuantum çok büyükse hiçbir iş kesilmez ve RR FCFS gibi davranır.' },
    { a: 'ch5/sjf', b: 'ch5/srtf', why: 'SRTF, SJF\'in kesmeli sürümüdür: kalan süresi daha kısa bir işlem gelince çalışan işlem kesilir.' },
    { a: 'ch5/sjf', b: 'ch5/oncelik', why: 'SJF özel bir öncelikli planlamadır: öncelik, tahmini sonraki burst\'ün tersidir; ikisinde de açlık olur.' },
    { a: 'ch5/oncelik', b: 'ch5/coklu-kuyruk', why: 'Öncelikli planlamadaki açlığı yaşlandırma çözer; geri bildirimli kuyruk yaşlandırmayı uygulayabilir.' },
    { a: 'ch5/karsilastirma', b: 'ch5/odev', why: 'Gantt şeması, turnaround = bitiş − geliş ve bekleme = turnaround − burst ödev sorularında uygulanır.' },
    { a: 'ch5/gercek-zamanli', b: 'ch5/os-planlama', why: 'Linux\'ta gerçek zamanlı görevler POSIX.1b\'ye göre statik önceliklidir; SCHED_FIFO ve SCHED_RR onun sınıflarıdır.' },
    { a: 'ch5/os-planlama', b: 'ch5/coklu-kuyruk', why: 'Solaris\'in zaman paylaşımlı sınıfı, çok düzeyli geri bildirimli kuyruk olarak çalışır.' },
    { a: 'ch5/degerlendirme', b: 'ch5/karsilastirma', why: 'Deterministik modelleme, verilen iş yükünde algoritmaların ortalama beklemesini hesaplayıp karşılaştırır.' },

    // Bölüm 5 → Bölüm 6
    { a: 'ch5/oncelik', b: 'ch6/canlilik', why: 'Önceliğe dayalı planlamada düşük öncelikli işlem kilit tutarsa yüksek öncelikli bekler: öncelik tersinmesi.' },
    { a: 'ch5/gercek-zamanli', b: 'ch6/canlilik', why: 'Düşük öncelikli işlemin yüksek önceliklinin beklediği kaynağı tutması gönderim gecikmesini uzatır.' },
    { a: 'ch5/temel', b: 'ch6/kritik-bolum', why: 'Kesmeli planlamada işlem paylaşılan veriyi güncellerken kesilebilir; bu yarış koşulunu kritik bölüm çözümleri önler.' },
    { a: 'ch6/monitor', b: 'ch5/sjf', why: 'ResourceAllocator kaynağı en kısa süre kullanacak işleme önce verir; bu SJF\'e benzer bir seçimdir.' },

    // Bölüm 6 içinde
    { a: 'ch6/kritik-bolum', b: 'ch6/peterson', why: 'Peterson çözümü kritik bölümün üç gereksinimini karşılar: karşılıklı dışlama, ilerleme, sınırlı bekleme.' },
    { a: 'ch6/peterson', b: 'ch6/bellek-bariyeri', why: 'İşlemci yazmaların sırasını değiştirebildiği için Peterson modern mimaride bozulabilir; çözüm bellek bariyeridir.' },
    { a: 'ch6/kritik-bolum', b: 'ch6/donanim', why: 'Kesmeleri kapatmak çok işlemcili sistemde yetmez; kritik bölüm için atomik donanım komutları kullanılır.' },
    { a: 'ch6/donanim', b: 'ch6/mutex', why: 'Mutex\'in acquire() ve release() çağrıları atomik olmalıdır; compare_and_swap gibi komutlarla gerçekleştirilir.' },
    { a: 'ch6/semafor', b: 'ch6/donanim', why: 'wait() ve signal() atomik olmalıdır; kendileri bir kritik bölüm problemidir, atomik komutlarla korunabilir.' },
    { a: 'ch6/mutex', b: 'ch6/semafor', why: 'İkili semafor mutex gibi davranır; bekleme kuyruklu semafor ise spinlock\'taki meşgul beklemeden kaçınır.' },
    { a: 'ch6/semafor', b: 'ch6/monitor', why: 'Semaforun yanlış kullanımı monitörleri doğurdu; derleyici de monitörü semaforlarla gerçekleştirebilir.' },
    { a: 'ch6/semafor', b: 'ch6/canlilik', why: 'S ve Q semaforlarını ters sırada wait() eden iki işlem birbirinin tuttuğunu bekler ve kilitlenir.' }
  ];
})(window.OSLab = window.OSLab || {});
