# OS Interactive Lab

İşletim Sistemleri dersinin teorisini **interaktif simülasyonlarla** görselleştiren tek sayfalık bir web uygulaması. Saf HTML, CSS ve JavaScript ile yazıldı; hiçbir dış kütüphane veya kurulum gerektirmez.

**Canlı site:** https://efekocal.github.io/isletim-sistemleri/

## Önce teori: Ders Notları

Site açıldığında **Ders Notları** bölümüyle başlar. Ders PDF'leri (Silberschatz, 10. baskı) slayt sırasıyla 31 kısa derse bölünmüştür:

| Bölüm | Kaynak | Dersler |
|---|---|---|
| 1 · Giriş | ch01_TR.pdf | İşletim sistemi nedir, organizasyon, kesmeler, G/Ç ve DMA, depolama hiyerarşisi, mimari, çoklu programlama, çift mod ve zamanlayıcı, bileşenler, bilgi işlem ortamları |
| 2 · İşletim Sistemi Yapıları | ch02_TR.pdf | Servisler, arayüz, sistem çağrıları, parametre geçişi, sistem programları, linker/loader, ABI, policy/mechanism, yapılar, önyükleme, hata ayıklama |
| 3 · İşlemler | ch03_TR.pdf | İşlem kavramı, durumlar, PCB ve bağlam değişimi, planlama, fork/exec/wait, IPC, paylaşılan bellek, mesaj geçişi, POSIX/Mach/pipe, soket ve RPC |

Her ders aynı öğrenme döngüsünü izler:

1. **Okumadan önce düşün** (ön test): Konuyu okumadan bir soruyu tahmin etmeye çalış.
2. **Oku:** Tanım kartları, karşılaştırmalar, slayt numaraları. Slaytlardaki hatalar ayrıca işaretlenir.
3. **Gör:** 29 etkileşimli şekil var. Bazılarına tıklanır, bazıları adım adım ilerler. Örnekler: kesme döngüsü, depolama piramidi, işlem durum makinesi, fork, dairesel tampon.
4. **Kendini yokla** (geri çağırma pratiği): Ders sonundaki soruları cevaba bakmadan cevapla.
5. **Laboratuvarda dene:** Kavramı ilgili simülatörde canlı çalıştır.

**Hocanın Soruları** sayfasında her sorunun model cevabı ve cevapta bulunması gereken anahtar noktalar vardır. Sorular aralıklı tekrarla çalışılır: bir soru ancak farklı günlerde iki kez bilinirse "Öğrenildi" sayılır. Kart modu ise soruları karışık sırayla sorar. İlerleme yalnızca kendi tarayıcında saklanır.

### Hocanın yeni sorularını eklemek

`js/data/teacher-questions.js` dosyasında, listenin sonuna yeni bir nesne eklemek yeterli. Dosyanın başında örnek bir şablon bulunuyor.

## Laboratuvarlar

| # | Modül | Laboratuvarlar |
|---|---|---|
| 01 | **System & Architecture** | User ⇄ Kernel mode geçişi (sistem çağrısı, ayrıcalıklı komut ihlali) · Derle → Bağla → Yükle hattı (relocation, statik/dinamik bağlama) · Monolitik ve mikroçekirdek karşılaştırması (IPC paket animasyonu, çökme senaryosu) |
| 02 | **CPU Scheduling** | FCFS, SJF (non-preemptive), Round Robin · canlı Gantt şeması · WT / TAT / RT hesapları · algoritma karşılaştırması |
| 03 | **Synchronization** | Race condition (Silberschatz T0–T5 senaryosu) · Mutex ve semafor ile çözüm · Üretici–Tüketici (bounded buffer) ve deadlock gösterimi |

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
  data/lessons-ch1..3.js    ders notları (bölüm başına bir dosya)
  data/teacher-questions.js hocanın soruları, model cevaplar, anahtar noktalar
  views/learn-view.js       Ders Notları: ana sayfa, dersler, soru tekrarı
  views/diagrams.js         ders notlarındaki etkileşimli şekiller
  views/                    her laboratuvarın arayüz ve animasyon katmanı
```

Hesaplama dosyaları (`scheduler.js`, `synchronization.js`, `architecture.js`) arayüzden ayrıdır ve Node.js ile tek başına test edilebilir.

## Geliştirme talimatları

Proje üç aşamada, aşağıdaki gereksinimlerle geliştirildi:

1. **İskelet + CPU Scheduling:** Koyu tema, sol menü, sağ altta açılır Bilgi & Sınav paneli. İşlem ekleme (form / rastgele), FCFS · SJF · RR seçimi (RR için time quantum), CSS geçişleriyle canlı Gantt şeması, ortalama bekleme ve devir süresi tablosu.
2. **Synchronization:** Paylaşılan sayaç üzerinde iki işlemle yarış durumu (kırmızı çakışma efektleri), mutex / semafor ile düzeltme (bekleme kuyruğu, yeşil tutarlı akış), sınırlı tamponlu üretici–tüketici ve bloklanma / uyandırma görselleştirmesi.
3. **System & Architecture:** User / kernel mode geçişi (trap, context save/restore, mode bit), derleme → bağlama → yükleme hattı (dinamik bağlama, relocation), monolitik ve mikroçekirdek karşılaştırması (IPC mesaj animasyonu). Teori panelinde ABI, core dump / crash dump ve policy / mechanism konuları.

Ortak kurallar: dış kütüphane yok, mevcut tasarım dili korunur, ders kitabıyla tam akademik doğruluk.
