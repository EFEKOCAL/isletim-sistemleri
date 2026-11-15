/*
 * review-pages.js — Hızlı Tekrar'ın sayfa planı: hangi başlıklar aynı ekranda gösterilir.
 *
 * Kural: bir sayfada yalnızca birbiriyle ilgili başlıklar olur; sayfa 17" dizüstü ve 24" monitörde
 * kaydırmadan bütünüyle görünür. Sığmayan konu, anlamlı bir yerden bölünür.
 *
 *   { l: '<bölüm>/<ders>', secs: ['Başlık 1', 'Başlık 2'] }      → bu başlıklar tek sayfada
 *   { l: '<bölüm>/<ders>', secs: ['Başlık'], range: [0, 4] }    → başlığın 0–3. blokları (bölme)
 *   { ..., title: 'Sayfa adı' }                                  → isteğe bağlı; yoksa ders adı
 *
 * '' adlı başlık, dersin ilk başlığından önceki bloklardır. Planda hiç geçmeyen ders tek sayfa olur;
 * planda unutulan bilgi review-view.js tarafından sona eklenir ve konsola uyarı yazılır.
 */
(function (OSLab) {
  'use strict';

  // Buraya yazılmayan dersler zaten tek ekrana rahatça sığar (1536×730'da ≥ 13,5 px) ve tek sayfadır.
  OSLab.reviewPages = {
    pages: [
      /* ---------------------------------------------------------- 1. bölüm */
      { l: 'ch1/nedir', secs: ['', 'Amaçları', 'Bilgisayar sisteminin dört bileşeni'] },
      { l: 'ch1/nedir', secs: ['İşletim sistemi ne yapar?', 'Nasıl ortaya çıktı?', 'İki temel bakış açısı'] },

      { l: 'ch1/kesme', secs: ['', 'Bir kesme geldiğinde ne olur?', 'Kesme tabanlı G/Ç döngüsü'] },
      { l: 'ch1/kesme', secs: ['Kesmenin türünü belirlemek', 'Maskeleme ve öncelik', 'Trap ve sistem çağrıları'] },

      { l: 'ch1/depolama', secs: ['', 'Birimler', 'Depolama hiyerarşisi'] },
      { l: 'ch1/depolama', secs: ['Verinin hiyerarşide taşınması', 'Depolama türlerinin özellikleri', 'Bellek teknolojisi ve erişim sırası'] },

      // sorun (kullanıcı programı denetlenmeli) → iki çözüm
      { l: 'ch1/islemler', secs: ['Açılıştan sonra kontrol kimde?', 'Çekirdeği hangi olaylar devreye sokar?', 'Kullanıcı programları neden denetlenmeli?'] },
      { l: 'ch1/islemler', secs: ['Çözüm 1: Çift modlu çalışma', 'Çözüm 2: Zamanlayıcı'] },

      { l: 'ch1/ortamlar', secs: ['Sanallaştırma', 'Dağıtık sistemler'] },
      { l: 'ch1/ortamlar', secs: ['Bilgi işlem ortamları', 'Ücretsiz ve açık kaynak işletim sistemleri', 'Çekirdek veri yapıları'] },

      /* ---------------------------------------------------------- 2. bölüm */
      // yöntem ve araçlar → veri ve alıştırmalar → sort/uniq hatası (iki parça)
      { l: 'ch2/shell-pipe', secs: ['', 'Yöntem: soruyu adımlara çevir', 'Araç kutusu'] },
      { l: 'ch2/shell-pipe', secs: ['Veri: ogrenci.txt', 'Alıştırmalar: önce kendin yaz, sonra çözümü aç'] },
      { l: 'ch2/shell-pipe', secs: ['En sık hata: sort olmadan uniq'], range: [0, 2] },
      { l: 'ch2/shell-pipe', secs: ['En sık hata: sort olmadan uniq'], range: [2, 4] },

      // temel yapı ve süzme → toplama, sayma, dosyaya yazma
      { l: 'ch2/shell-awk', secs: ['', 'Temel yapı taşları', 'Örnek veri: ogrenciler.txt', 'Sütunları yazdırmak ve hesaplamak', 'Koşulla süzmek'] },
      { l: 'ch2/shell-awk', secs: ['Toplam, ortalama ve en küçük değer', 'Saymak: diziler', 'Sonucu dosyaya yazmak ve saymak'] },

      { l: 'ch2/baglayici', secs: ['', 'Dört temel terim'] },
      { l: 'ch2/baglayici', secs: ['Statik ve dinamik bağlama'] },

      /* ---------------------------------------------------------- 3. bölüm */
      { l: 'ch3/pcb', secs: [''] },
      { l: 'ch3/pcb', secs: ['Bağlam değişimi', 'İş parçacığı (thread)'] },

      { l: 'ch3/olusturma', secs: ['', 'UNIX: fork() – exec() – wait()'] },
      { l: 'ch3/olusturma', secs: ['İşlem sonlandırma', 'Örnekler'] },

      { l: 'ch3/paylasilan-bellek', secs: ['', 'Paylaşılan bellek çözümü'] },
      { l: 'ch3/paylasilan-bellek', secs: ['Tüm tamponları kullanmak: sayaç ekle', 'Ama yarış durumu ortaya çıkar'] },

      { l: 'ch3/ipc-ornek', secs: ['POSIX paylaşılan bellek', 'Mach', 'Windows: ALPC (advanced local procedure call)'] },
      { l: 'ch3/ipc-ornek', secs: ["Pipe'lar"] },

      { l: 'ch3/istemci-sunucu', secs: ['Soketler'] },
      { l: 'ch3/istemci-sunucu', secs: ['Uzaktan yordam çağrısı (RPC)'] },

      /* ---------------------------------------------------------- 5. bölüm */
      // zamanlayıcı ve dağıtıcı → planlama kriterleri
      { l: 'ch5/temel', secs: ['CPU burst nedir?', 'CPU zamanlayıcı', 'Zamanlayıcı ne zaman karar verir?', 'Kesmeli ve kesmesiz zamanlama', 'Görev dağıtıcısı'] },
      { l: 'ch5/temel', secs: ['Planlama kriterleri', 'Üç ölçüt'] },

      // örnekler ve kesmeli/kesmesiz farkı → eşit öncelik ve açlık
      { l: 'ch5/oncelik', secs: ['', 'Hepsi aynı anda hazırsa', 'Kesmeli sürüm', 'Kesmesiz sürüm', 'Fark nerede oluştu?'] },
      { l: 'ch5/oncelik', secs: ['Aynı önceliğe Round Robin', 'Açlık ve yaşlandırma'] },

      // ödev: her sayfada bir soru (çözümler açık)
      { l: 'ch5/odev', secs: [''], range: [0, 4] },   // giriş + Soru 1a, 1b, 1c
      { l: 'ch5/odev', secs: [''], range: [4, 6] },   // Soru 2 (RR), Soru 3 (SRTF)
      { l: 'ch5/odev', secs: [''], range: [6, 8] },   // Soru 4 kesmeli + kesmesiz
      { l: 'ch5/odev', secs: [''], range: [8, 11] },  // Soru 5: q = 3, 4, 5
      { l: 'ch5/odev', secs: ['Soru 5 · Karşılaştırma'] },
      { l: 'ch5/odev', secs: ['Quiz tipi soru: dört algoritma aynı veriyle'], range: [0, 3] }, // FCFS, SJF
      { l: 'ch5/odev', secs: ['Quiz tipi soru: dört algoritma aynı veriyle'], range: [3, 5] }, // SRTF, RR

      { l: 'ch5/os-planlama', secs: ['Linux: sürüm 2.5', 'Linux: Completely Fair Scheduler (2.6.23+)', 'CFS: sonraki görev nasıl seçilir?'] },
      { l: 'ch5/os-planlama', secs: ['Windows', 'Solaris'] },

      /* ---------------------------------------------------------- 6. bölüm */
      { l: 'ch6/donanim', secs: ['', 'test_and_set'] },
      { l: 'ch6/donanim', secs: ['compare_and_swap'] },
      { l: 'ch6/donanim', secs: ['Sınırlı bekleme', 'Atomik değişkenler'] },

      { l: 'ch6/semafor', secs: ['', 'Sayan ve ikili semafor', 'Kullanım örnekleri'] },
      { l: 'ch6/semafor', secs: ['Meşgul beklemeden gerçekleştirme', 'Yanlış kullanım'] },

      { l: 'ch6/monitor', secs: ['', 'Koşul değişkenleri'] },
      { l: 'ch6/monitor', secs: ['Semaforlarla gerçekleştirme'] },
      { l: 'ch6/monitor', secs: ['Hangi işlem uyandırılır?'] }
    ]
  };
})(window.OSLab = window.OSLab || {});
