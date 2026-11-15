# OS Interactive Lab

İşletim Sistemleri dersinin teorisini **interaktif simülasyonlarla** görselleştiren tek sayfalık bir web uygulaması. Saf HTML, CSS ve JavaScript ile yazıldı; hiçbir dış kütüphane veya kurulum gerektirmez.

**Canlı site:** https://efekocal.github.io/isletim-sistemleri/

## Önce teori: Ders Notları

Site, ortasında büyük bir **Başla** düğmesi ve tepesinde konu konu dolan bir ilerleme çubuğu olan sade bir ekranla açılır. Dersler tek ekranlık kartlar halinde, kısa video akışı gibi dikey olarak ilerler: kaydır, ok tuşlarını veya **Devam** düğmesini kullan. Kartlar, ders verisindeki bloklardan otomatik üretilir. Menü (☰) laboratuvarları, Hocanın Sorularını ve dönem planını açar.

Ders PDF'leri (Silberschatz, 10. baskı) slayt sırasıyla kısa derslere bölünmüştür:

| Bölüm | Kaynak | Dersler |
|---|---|---|
| 1 · Giriş | ch01_TR.pdf | İşletim sistemi nedir, organizasyon, kesmeler, G/Ç ve DMA, depolama hiyerarşisi, mimari, çoklu programlama, çift mod ve zamanlayıcı, bileşenler, bilgi işlem ortamları |
| 2 · İşletim Sistemi Yapıları | ch02_TR.pdf, Shell Programlama | Servisler, arayüz, **shell (komutlar, izinler, betik, pipe, awk)**, sistem çağrıları, parametre geçişi, sistem programları, linker/loader, ABI, policy/mechanism, yapılar, önyükleme, hata ayıklama |
| 3 · İşlemler | ch03_TR.pdf | İşlem kavramı, durumlar, PCB ve bağlam değişimi, planlama, fork/exec/wait, IPC, paylaşılan bellek, mesaj geçişi, POSIX/Mach/pipe, soket ve RPC |
| 4 · İş Parçacıkları | ch04_TR.pdf | Thread kavramı, çok çekirdek ve Amdahl, modeller, kütüphaneler, örtük iş parçacığı, sorunlar, Windows ve Linux |
| 5 · CPU Zamanlama | ch05_TR.pdf, CPU Scheduling LAB ve Ödev | Temel kavramlar, FCFS, SJF, SRTF, öncelikli planlama, Round Robin, çok düzeyli kuyruklar, çözümlü ödev, thread ve çok işlemcili planlama, gerçek zamanlı planlama, Linux/Windows/Solaris, değerlendirme |
| 6 · Senkronizasyon | ch06_TR.pdf | Kritik bölüm, Peterson, bellek bariyeri, donanım komutları, mutex, semafor, monitör, canlılık |
| 7 · Senkronizasyon Örnekleri | ch07.pdf | Sınırlı tampon, okuyucu-yazar, filozoflar, Windows ve Linux, POSIX, Java, alternatif yaklaşımlar |

Her bölümün sonunda bir **bölüm tekrarı** gelir: önce o bölümün soruları, ardından önceki bölümlerden karışık sorular. Her sorunun üstünde kaynağı yazar: **Hocanın sorusu**, **İnternetten** (Operating System Concepts 10. baskının resmi sitesindeki çözümlü alıştırmalar, [os-book.com](https://os-book.com/OS10/practice-exercises/index-solu.html)) ya da **Ders sorusu** (derslerdeki kendini yoklama soruları). Bilinemeyen sorular sonraki tekrarlarda önce gelir.

Her ders aynı öğrenme döngüsünü izler:

1. **Okumadan önce düşün** (ön test): Konuyu okumadan bir soruyu tahmin etmeye çalış.
2. **Oku:** Tanım kartları, karşılaştırmalar, slayt numaraları. Slaytlardaki hatalar ayrıca işaretlenir.
3. **Gör:** 29 etkileşimli şekil var. Bazılarına tıklanır, bazıları adım adım ilerler. Örnekler: kesme döngüsü, depolama piramidi, işlem durum makinesi, fork, dairesel tampon.
4. **Kendini yokla** (geri çağırma pratiği): Ders sonundaki soruları cevaba bakmadan cevapla.
5. **Laboratuvarda dene:** Kavramı ilgili simülatörde canlı çalıştır.

### Hızlı Tekrar (öğrendikten sonra)

Başlangıç ekranındaki **Hızlı Tekrar** düğmesi (ya da ☰ menüdeki aynı adlı öğe) dersleri kart kart değil, **konu konu tek sayfada** gösterir. Bir sayfada yalnızca aynı dersin birbiriyle ilgili başlıkları olur ve sayfa kaydırmadan bütünüyle görünür: içerik sütunlara dökülür, yazı ekrana sığana kadar küçülür. Sayfalar doğrudan ders verisinden üretilir, hiçbir tanım, tablo, şekil veya not atlanmaz; sığmayan dersler `review-pages.js`teki plana göre anlamlı başlık sınırlarından bölünür. Üstteki iki düğme iki aşamayı seçer: **Bütün** (her şey açık) ve **Başlıklar** (yalnızca başlıklar, terimler ve kalın anahtar sözcükler okunur; konuyu kendin anlatırsın, sonra bloğa tıklayıp kontrol edersin). `B` tuşu aşamalar arasında geçer; ok tuşları ve tekerlek sayfa değiştirir. Kapsam `exam-scope.js`'den okunur.

### Zihin Haritası

Menüdeki **Zihin Haritası** konuların birbiriyle ilgisini kaydırmasız tek ekranda gösterir. Genel haritada ortada ders, çevresinde bölümler, uçlarda dersler; bölüm haritasında ortada bölüm, çevresinde dersler, uçlarda başlıkları vardır. Bir derse tıklayınca başka konularla ilişkileri çizilir ve alttaki şeritte nedenleriyle listelenir (`mind-links.js`, her ilişki iki dersin metnine dayanır). "Tüm ilişkiler" genel haritada hepsini birden çizer; "Alt başlıklar: gizli" başlıkları saklar, kendin hatırlayıp tıklayarak açarsın. Hızlı Tekrar sayfalarındaki **Haritada gör** o konunun haritasını açar.

**Hocanın Soruları** sayfasında her sorunun model cevabı ve cevapta bulunması gereken anahtar noktalar vardır. Sorular aralıklı tekrarla çalışılır: bir soru ancak farklı günlerde iki kez bilinirse "Öğrenildi" sayılır. Kart modu ise soruları karışık sırayla sorar. İlerleme yalnızca kendi tarayıcında saklanır.

### Hocanın yeni sorularını eklemek

`js/data/teacher-questions.js` dosyasında, listenin sonuna yeni bir nesne eklemek yeterli. Dosyanın başında örnek bir şablon bulunuyor.

## Laboratuvarlar

| # | Modül | Laboratuvarlar |
|---|---|---|
| 01 | **System & Architecture** | User ⇄ Kernel mode geçişi (sistem çağrısı, ayrıcalıklı komut ihlali) · Derle → Bağla → Yükle hattı (relocation, statik/dinamik bağlama) · Monolitik ve mikroçekirdek karşılaştırması (IPC paket animasyonu, çökme senaryosu) |
| 02 | **CPU Scheduling** | FCFS, SJF (non-preemptive), Round Robin · canlı Gantt şeması · WT / TAT / RT hesapları · algoritma karşılaştırması |
| 03 | **Synchronization** | Race condition (Silberschatz T0–T5 senaryosu) · Mutex ve semafor ile çözüm · Üretici–Tüketici (bounded buffer) ve deadlock gösterimi |
| 04 | **Shell Atölyesi** | Tarayıcıda çalışan bir terminalde, Shell Programlama PDF'inin sırasıyla 6 aşamada 47 görev: gezinme ve dosyalar, izinler, değişken ve aritmetik, pipe ve metin araçları, awk, betikler · Karışık tekrar |

### Shell Atölyesi

Shell Programlama PDF'ini okumak yerine terminalde **yaparak** öğrenmek için. Solda görev kartı, sağda gerçek bir bash gibi davranan terminal var. Terminal tamamen tarayıcıda çalışır, bilgisayara dokunmaz.

- **Her görev kısa:** 1–3 cümlelik bilgi ve bir örnek, ardından komutu öğrencinin kendisinin yazdığı bir görev. Görev türleri: terminalde komut yazmak, çıktıyı tahmin etmek, seçmeli soru.
- **Anında geri bildirim:** Her komuttan sonra görev denetlenir. Çıktı görevlerinde doğru çözüm terminalin bir kopyasında çalıştırılır ve iki çıktı karşılaştırılır; aynı sonucu veren her doğru komut kabul edilir. Yaygın hatalarda neyin yanlış olduğu söylenir: `grep -c` ile `grep -o | wc -l` farkı, virgülden sonra boşluklu `chmod`, `[$sayi`, `>` yerine `>>`, sort olmadan uniq.
- **Basamaklı yardım:** hedef çıktı → ipuçları → çözüm. Çözümüne bakılan görev "tekrar edilecek" (sarı) sayılır.
- **Karışık tekrar:** Aşamalardan 8 görev karışık sırayla gelir, önce tekrar bekleyenler. Bilgi kartı kapalıdır: önce hatırlamaya çalışılır.
- **Gerçek terminal davranışı:** Hata iletileri bash ve GNU araçlarınınkiyle aynıdır. `read` girdi bekler, `nano` düzenleyici açılır (Ctrl+O kaydet, Ctrl+X çık), izin yoksa `./betik.sh` "Permission denied" der. `man KOMUT` kısa bir Türkçe özet verir. `help` desteklenen komutları listeler.
- PDF'teki üç yazım hatası görevlerde doğru haliyle öğretilir: `chmod u=rwx, g=rx, o=` (boşluklar yüzünden geçersiz), `tr` örneklerindeki ters tırnak ve `echo "..." }` (kapanış süslü parantezinden önce `;` gerekir).

İlerleme tarayıcıda (localStorage) saklanır. Terminaldeki dosyalar sayfa yenilenince ilk haline döner; **Sıfırla** düğmesi de aynısını yapar.

Her modülün sağ alt köşesinde, o konunun **teorisini** ve **sınav sorularını** (cevaplı) içeren bir **Bilgi & Sınav paneli** bulunur. Hesaplama gerektiren sorular "▶ Simülatörde Dene" butonuyla doğrudan simülatöre yüklenip çalıştırılabilir.

## Kullanım

- **Online:** Yukarıdaki canlı site bağlantısını aç.
- **Yerelde:** Depoyu indir ve `index.html` dosyasına çift tıkla. Sunucu gerekmez.

```bash
git clone https://github.com/EFEKOCAL/isletim-sistemleri.git
cd isletim-sistemleri
start index.html        # Windows  (macOS: open index.html)
```

### Kısayollar

| Tuş | İşlev |
|---|---|
| `I` | Bilgi & Sınav panelini aç/kapat |
| `Esc` | Paneli kapat |
| `↓` `↑` `Boşluk` | Ders akışında sonraki / önceki kart |

### Çalışma önerisi

1. Bir modülde önce **Bilgi & Sınav → Teori** sekmesini oku.
2. Simülasyonu **Tek Adım** ile ilerlet; her adımın açıklamasını ve olay günlüğünü takip et.
3. **Sınav Soruları** sekmesinde cevabı görmeden önce kendin çöz, sonra "Simülatörde Dene" ile kontrol et.

## Akademik model

Simülasyonlar Silberschatz, Galvin, Gagne — *Operating System Concepts* kitabındaki modele göre kurulmuştur. Kitaptaki örnek sonuçlar birebir üretilir:

- **CPU Scheduling:** FCFS 24/3/3 örneğinde ortalama WT 17, RR (q = 4) örneğinde 5.67.
- **Synchronization:** `counter = 5` için T0–T5 sıralaması sonucu 4 (yarış durumu).
- **Yükleme:** relocation register 14000 + mantıksal adres 346 = fiziksel adres 14346.

Simülatörün kullandığı varsayımlar arayüzde ve teori panelinde belirtilir. Örnekler: bağlam değişimi maliyeti 0, RR'de aynı anda gelen yeni işlem kesilen işlemden önce kuyruğa girer, mutex engellemeli (sleeping) bir kilittir.

## Dosya yapısı

```
index.html                  uygulama kabuğu (menü, üst bar, bilgi paneli)
style.css                   koyu tema "control center" arayüzü
js/
  app.js                    yönlendirme, bilgi & sınav paneli
  scheduler.js              CPU zamanlama algoritmaları (DOM'dan bağımsız)
  synchronization.js        semafor, mutex, yarış durumu, bounded buffer
  architecture.js           sistem çağrısı adımları, bağlama/yükleme, mimari yolları
  data/info-content.js      laboratuvarların Bilgi & Sınav paneli içerikleri
  data/lessons-ch1..7.js    ders notları (bölüm başına bir dosya)
  data/lessons-shell.js     shell dersleri (Bölüm 2'ye, arayüz dersinin arkasına eklenir)
  scheduler-trace.js        ders Gantt şekillerinin çizelge hesabı (SRTF ve öncelik dahil)
  data/teacher-questions.js hocanın soruları, model cevaplar, anahtar noktalar
  data/web-questions.js     bölüm tekrarları için internetten sorular (kaynak bağlantılı)
  data/review-pages.js      Hızlı Tekrar sayfa planı: hangi başlıklar aynı ekranda (sığmayan dersler nereden bölünür)
  views/review-view.js      Hızlı Tekrar: konu sayfaları, ekrana sığdırma, Bütün / Başlıklar aşamaları
  data/mind-links.js        Zihin haritasındaki konu ilişkileri (iki ders ve nedeni)
  views/mindmap-view.js     Zihin Haritası: genel ve bölüm haritaları, ilişki çizgileri
  data/exam-scope.js        yaklaşan sınavın kapsamı: hocanın işlemediği dersler "vize dışı" işaretlenir (active: false ile kapanır)
  views/learn-view.js       Ders Notları: ana sayfa, dersler, soru tekrarı
  views/diagrams.js         ders notlarındaki etkileşimli şekiller
  views/diagrams-lab.js     Bölüm 4–7 şekilleri (Gantt, Amdahl, Peterson, semafor), chmod, ls -l, pipe
  shell-engine.js           Shell Atölyesi motoru: sanal dosya sistemi, bash ayrıştırıcı ve yorumlayıcı, grep/sort/cut/tr/awk...
  data/shell-missions.js    Shell Atölyesi görevleri, denetimleri ve Bilgi & Sınav paneli içeriği
  views/shell-view.js       Shell Atölyesi: görev kartı, terminal, nano düzenleyici, karışık tekrar
  views/                    her laboratuvarın arayüz ve animasyon katmanı
```

Hesaplama dosyaları (`scheduler.js`, `synchronization.js`, `architecture.js`, `shell-engine.js`) arayüzden ayrıdır ve Node.js ile tek başına test edilebilir.

## Geliştirme talimatları

Proje üç aşamada, aşağıdaki gereksinimlerle geliştirildi:

1. **İskelet + CPU Scheduling:** Koyu tema, sol menü, sağ altta açılır Bilgi & Sınav paneli. İşlem ekleme (form / rastgele), FCFS · SJF · RR seçimi (RR için time quantum), CSS geçişleriyle canlı Gantt şeması, ortalama bekleme ve devir süresi tablosu.
2. **Synchronization:** Paylaşılan sayaç üzerinde iki işlemle yarış durumu (kırmızı çakışma efektleri), mutex / semafor ile düzeltme (bekleme kuyruğu, yeşil tutarlı akış), sınırlı tamponlu üretici–tüketici ve bloklanma / uyandırma görselleştirmesi.
3. **System & Architecture:** User / kernel mode geçişi (trap, context save/restore, mode bit), derleme → bağlama → yükleme hattı (dinamik bağlama, relocation), monolitik ve mikroçekirdek karşılaştırması (IPC mesaj animasyonu). Teori panelinde ABI, core dump / crash dump ve policy / mechanism konuları.

Ortak kurallar: dış kütüphane yok, mevcut tasarım dili korunur, ders kitabıyla tam akademik doğruluk.
