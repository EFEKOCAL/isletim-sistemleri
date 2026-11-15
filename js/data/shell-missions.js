/*
 * shell-missions.js — Shell Atölyesi görevleri (Shell Programlama.pdf, LAB 115 sırasıyla).
 *
 * Her görev: kısa bilgi (learn) + örnek (example) + görev (task). Türler:
 *   cmd      Terminalde komut yazılır. Denetim:
 *              solution  çözüm aynı anda bir kopyada çalıştırılır; çıktılar aynı olmalı
 *              expect    beklenen çıktı (birebir) · match: çıktıda aranacak düzenli ifade
 *              state     (sh) => bool, dosya sistemi / dizin durumu
 *              file      { path, solution }: çözümün oluşturduğu dosyayla aynı içerik
 *            must: komutta bulunması gereken yapı · clean: hata çıktısı olmamalı
 *            tips: komut (cmd) ya da çıktı (out) belli bir hatayı gösteriyorsa verilecek ipucu
 *   predict  Çıktıyı tahmin et (boşluk ve satır sonu farkı önemsenmez)
 *   choice   Çoktan seçmeli; her seçeneğin açıklaması var
 * dir: çözüm hangi dizinde çalışır (varsayılan ev dizini). setup: görev açılınca sessizce çalışır.
 */
(function (OSLab) {
  'use strict';

  const H = '/home/ogrenci/';
  const is = (sh, p, type) => { const s = sh.statPath(H + p); return !!s && (!type || s.type === type); };

  const stages = [
    {
      id: 'gezinme',
      title: 'Gezinme ve dosyalar',
      short: 'ls, cd, mkdir, cp, rm',
      src: 's. 2–3',
      intro: 'Terminal her zaman bir dizinin içinde açılır. Önce nerede olduğuna bakmayı, dizinler arasında gezmeyi ve dosya oluşturup silmeyi öğreneceksin.',
      missions: [
        {
          id: 'ls', kind: 'cmd', title: 'Etrafına bak',
          learn: '<b>ls</b> bulunduğun dizindeki dosya ve dizinleri listeler. Komut istemindeki <code>~</code> işareti ev dizinin (<code>/home/ogrenci</code>) demektir.',
          example: 'ls',
          task: 'Bulunduğun dizinde neler olduğunu listele.',
          solution: 'ls',
          hints: ['Komutun adı iki harf: "list" sözcüğünün kısaltması.'],
          why: 'Burada 7 dosya ve 2 dizin (<code>betikler</code>, <code>notlar</code>) var. Düz <code>ls</code> hangisinin dizin olduğunu söylemez; bunun için bir sonraki görevdeki <code>ls -l</code> kullanılır.'
        },
        {
          id: 'lsl', kind: 'cmd', title: 'Ayrıntılı ve süzülmüş liste',
          learn: '<code>ls -l</code> her girdiyi bir satırda ayrıntılı gösterir: izinler, sahip, boyut, tarih. <code>*</code> joker karakteri "herhangi bir şey" demektir: <code>*.txt</code>, .txt ile biten bütün adlar.',
          example: 'ls -l',
          task: 'Yalnızca <b>.txt</b> ile biten dosyaları <b>ayrıntılı</b> listele.',
          solution: 'ls -l *.txt',
          hints: ['İki şeyi birleştir: ayrıntı seçeneği ve joker kalıbı.', '<code>ls -l</code> komutunun arkasına <code>*.txt</code> ekle.'],
          why: 'Satırların ilk karakteri dosya türüdür: <code>-</code> normal dosya, <code>d</code> dizin. <code>*.txt</code> kalıbını ls değil, <b>kabuk</b> genişletir: ls\'e eşleşen dosyaların adları tek tek verilir.'
        },
        {
          id: 'cat', kind: 'cmd', title: 'Dosyanın içine bak',
          learn: '<b>cat</b> bir dosyanın içeriğini ekrana yazar. Tab tuşu dosya adını tamamlar: <code>cat og</code> yazıp Tab\'a bas.',
          example: 'cat metin.txt',
          task: '<code>ogrenci.txt</code> dosyasının içeriğini ekrana yazdır.',
          solution: 'cat ogrenci.txt',
          hints: ['<code>cat</code> ve dosyanın adı.'],
          why: 'Her satır bir öğrenci: <b>ad;şehir;bölüm;not</b>. Sütunlar <code>;</code> ile ayrılmış. Bu dosyayı pipe ve awk aşamalarında çok kullanacaksın.'
        },
        {
          id: 'cd', kind: 'cmd', title: 'Bir dizine gir',
          learn: '<b>cd dizin</b> o dizine girer. Komut istemi yeni yeri gösterir; <code>pwd</code> tam yolu yazar.',
          example: 'cd betikler',
          task: '<code>notlar</code> dizinine gir.',
          state: (sh) => sh.cwdPath() === H + 'notlar',
          hints: ['<code>cd</code> ve dizinin adı.'],
          why: 'Komut istemi artık <code>~/notlar</code> diyor. İçindekileri görmek için <code>ls</code> yazabilirsin.'
        },
        {
          id: 'cdup', kind: 'cmd', title: 'Bir üst dizine çık',
          learn: '<code>..</code> her zaman "bir üst dizin" demektir. <code>cd ..</code> bir üst dizine çıkar. Tek başına <code>cd</code> ise nerede olursan ol ev dizinine döner.',
          task: '<code>cd ..</code> ile ev dizinine geri dön.',
          setup: 'cd ~/notlar',
          state: (sh) => sh.cwdPath() === H.slice(0, -1),
          must: { re: /\.\./, msg: 'Doğru yerdesin, ama bu görevde <code>..</code> kullanmayı dene: <code>cd notlar</code> ile geri girip <code>cd ..</code> yaz.' },
          hints: ['İki nokta: <code>..</code>'],
          why: '<code>cd ..</code> bir üst dizine çıkar. <code>cd ../..</code> iki üst dizine çıkar.'
        },
        {
          id: 'mkdir', kind: 'cmd', title: 'Dizin ve dosya oluştur',
          learn: '<b>mkdir ad</b> yeni bir dizin, <b>touch ad</b> boş bir dosya oluşturur. Yol yazarak başka bir dizinin içinde de oluşturabilirsin: <code>touch notlar/yeni.txt</code>.',
          task: '<code>deneme</code> adında bir dizin oluştur ve içine <code>a.txt</code> adında boş bir dosya koy.',
          setup: 'rm -rf ~/deneme',
          state: (sh) => is(sh, 'deneme/a.txt', 'f'),
          hints: ['İki komut gerekir: önce dizin, sonra dosya.', '<code>mkdir deneme</code>, ardından <code>touch deneme/a.txt</code>. İki komutu <code>;</code> ile tek satıra da yazabilirsin.'],
          why: 'Dizinin içine girmeden <code>deneme/a.txt</code> yoluyla dosya oluşturdun. Bir satıra <code>;</code> ile birden çok komut yazılabilir.'
        },
        {
          id: 'cpmv', kind: 'cmd', title: 'Kopyala ve taşı',
          learn: '<b>cp kaynak hedef</b> kopyalar. <b>mv kaynak hedef</b> taşır; hedef aynı dizinde yeni bir adsa yeniden adlandırır. Hedef bir dizinse dosya o dizinin içine gider.',
          task: '<code>ogrenci.txt</code>\'nin <code>yedek.txt</code> adında bir kopyasını oluştur, sonra <code>yedek.txt</code>\'yi <code>deneme</code> dizinine taşı.',
          setup: 'mkdir -p ~/deneme; rm -f ~/yedek.txt ~/deneme/yedek.txt',
          state: (sh) => is(sh, 'deneme/yedek.txt', 'f') && !is(sh, 'yedek.txt') && is(sh, 'ogrenci.txt', 'f'),
          hints: ['Önce <code>cp</code>, sonra <code>mv</code>.', '<code>cp ogrenci.txt yedek.txt</code> ve <code>mv yedek.txt deneme</code>'],
          why: '<code>mv</code> dosyayı kopyalamadı, taşıdı: ev dizininde artık <code>yedek.txt</code> yok. <code>ls deneme</code> ile bakabilirsin.'
        },
        {
          id: 'rm', kind: 'cmd', title: 'Dizini sil',
          learn: '<b>rmdir</b> yalnızca <b>boş</b> dizini siler. İçi dolu bir dizini <b>rm -r</b> siler. Terminalde çöp kutusu yoktur: silinen geri gelmez.',
          task: '<code>deneme</code> dizinini içindekilerle birlikte sil. Önce <code>rmdir deneme</code> deneyip hatayı gör.',
          setup: 'mkdir -p ~/deneme; touch ~/deneme/a.txt',
          state: (sh) => !is(sh, 'deneme'),
          tips: [{ out: /Directory not empty/, msg: '"Directory not empty": <code>rmdir</code> dolu dizini silmez. İçindekilerle silmek için <code>-r</code> seçeneği gerekir.' }],
          hints: ['<code>rm</code> komutuna "recursive" (içindekilerle) seçeneğini ver.', '<code>rm -r deneme</code>'],
          why: '<code>-r</code> (recursive) dizinin içindekileri de siler. <code>rm deneme</code> tek başına "Is a directory" hatası verir.'
        }
      ]
    },
    {
      id: 'izin',
      title: 'Dosya izinleri',
      short: 'ls -l, chmod',
      src: 's. 4–5',
      intro: 'Her dosyanın sahibi (u), grubu (g) ve diğerleri (o) için ayrı okuma, yazma ve çalıştırma izni vardır. ls -l satırını okumayı ve chmod ile izin değiştirmeyi öğreneceksin.',
      missions: [
        {
          id: 'okuma', kind: 'choice', title: 'ls -l satırını oku',
          learn: 'İlk karakterden sonraki 9 karakter üçerli gruplardır: <b>sahip</b> (u), <b>grup</b> (g), <b>diğerleri</b> (o). Her grupta sıra hep <b>r w x</b>\'tir; <code>-</code> o iznin olmadığını gösterir.',
          code: '-rwxr-x--- 1 ogrenci ogrenci 35 Nov 15 14:20 rapor.txt',
          task: 'Bu dosyada <b>grup</b> üyeleri ne yapabilir?',
          options: [
            { t: 'Okuyabilir ve çalıştırabilir', ok: true, why: 'Grup üçlüsü <code>r-x</code>: okuma ve çalıştırma var, yazma yok.' },
            { t: 'Okuyabilir, yazabilir ve çalıştırabilir', why: '<code>rwx</code> sahibin üçlüsü. Grup ikinci üçlüdür: <code>r-x</code>.' },
            { t: 'Hiçbir şey yapamaz', why: '<code>---</code> son üçlü, yani diğerleri. Grup ikinci üçlüdür: <code>r-x</code>.' },
            { t: 'Yalnızca okuyabilir', why: 'Grup üçlüsü <code>r-x</code>; ortadaki <code>-</code> yazma iznidir, x ise vardır.' }
          ],
          why: '<code>-</code> normal dosya · <code>rwx</code> sahip · <code>r-x</code> grup · <code>---</code> diğerleri.'
        },
        {
          id: 'sayi', kind: 'predict', title: 'Sayıdan izne',
          learn: 'Sayısal yazımda her iznin değeri vardır: <b>r = 4, w = 2, x = 1</b>. Her grup için değerler toplanır: 7 = rwx, 6 = rw-, 5 = r-x, 4 = r--, 0 = ---.',
          code: 'chmod 765 dosya.txt\nls -l dosya.txt',
          task: '<code>ls -l</code> satırının ilk 10 karakteri ne olur?',
          answer: '-rwxrw-r-x',
          run: 'touch dosya.txt; chmod 765 dosya.txt; ls -l dosya.txt',
          why: '7 = 4+2+1 = <code>rwx</code> (sahip), 6 = 4+2 = <code>rw-</code> (grup), 5 = 4+1 = <code>r-x</code> (diğerleri).'
        },
        {
          id: 'chmod750', kind: 'cmd', title: 'Sayısal chmod',
          learn: '<b>chmod SAYI dosya</b> üç grubun iznini birden ayarlar.',
          example: 'chmod 644 dosya.txt',
          task: '<code>rapor.txt</code>\'nin iznini <b>sayısal yöntemle</b> şöyle yap: sahip her şeyi yapabilsin, grup okuyup çalıştırabilsin, diğerlerinin hiçbir izni olmasın. Sonra <code>ls -l rapor.txt</code> ile bak.',
          setup: 'chmod 644 ~/rapor.txt',
          state: (sh) => sh.modeOf(H + 'rapor.txt') === 0o750,
          must: { re: /chmod\s+0?[0-7]{3}\b/, msg: 'İzin doğru, ama bu görevde sayısal yöntemi (üç rakam) kullan.' },
          hints: ['Her grubun toplamını bul: rwx = ?, r-x = ?, --- = ?', 'rwx = 7, r-x = 5, --- = 0 → <code>chmod 750 rapor.txt</code>'],
          why: '750 → <code>-rwxr-x---</code>. PDF\'teki sembolik karşılığı: <code>chmod u=rwx,g=rx,o= rapor.txt</code>.'
        },
        {
          id: 'sembolik', kind: 'cmd', title: 'Sembolik chmod',
          learn: 'Sembolik yazımda <b>kim</b> (u, g, o, a), <b>işlem</b> (+ ekle, - kaldır, = ayarla) ve <b>izin</b> (r, w, x) yazılır. Birden çok değişiklik <b>virgülle ve boşluksuz</b> birleşir: <code>chmod u+x,g-w dosya</code>.',
          example: 'chmod o+r dosya.txt',
          task: '<code>paylas.txt</code> şu an <code>-rw-rw----</code>. Tek bir chmod komutuyla <b>grubun yazma iznini kaldır</b> ve <b>diğerlerine okuma izni ver</b>. Sembolik yöntemi kullan.',
          setup: 'chmod 660 ~/paylas.txt',
          state: (sh) => sh.modeOf(H + 'paylas.txt') === 0o644,
          must: { re: /chmod\s+[ugoa]*[-+=]/, msg: 'İzin doğru, ama bu görevde sembolik yöntemi (g-w gibi) kullan.' },
          tips: [{ cmd: /chmod\s+\S+,\s/, msg: 'Virgülden sonra boşluk bırakınca kabuk ikinci kısmı ayrı bir argüman, yani dosya adı sanır. Boşluksuz yaz: <code>g-w,o+r</code>' }],
          hints: ['Grup için <code>g-w</code>, diğerleri için <code>o+r</code>.', '<code>chmod g-w,o+r paylas.txt</code>'],
          why: 'Sonuç <code>-rw-r--r--</code>, yani 644. PDF\'teki <code>chmod u=rwx, g=rx, o= dosya.txt</code> yazımında virgülden sonraki boşluklar yüzünden gerçek terminal "invalid mode" hatası verir; boşluksuz yazılmalıdır.'
        },
        {
          id: 'calistir', kind: 'cmd', title: 'Çalıştırma izni',
          learn: 'Bir betiği <code>./betik.sh</code> diye çalıştırmak için <b>x</b> izni gerekir. Yoksa kabuk "Permission denied" der. <code>chmod +x</code> ya da <code>chmod u+x</code> bu izni ekler.',
          task: '<code>betik.sh</code>\'yi <code>./betik.sh</code> yazarak çalıştır. Hata alırsan izni düzelt ve yeniden dene.',
          setup: 'chmod 644 ~/betik.sh',
          expect: 'Merhaba, Dünya!\n',
          must: { re: /\.\/betik\.sh/, msg: 'Çıktı doğru, ama bu görevde betiği <code>./betik.sh</code> diye çalıştır.' },
          tips: [{ out: /Permission denied/, msg: '"Permission denied": dosyanın x (çalıştırma) izni yok. <code>ls -l betik.sh</code> ile bak, sonra <code>chmod u+x betik.sh</code>.' }],
          hints: ['Önce <code>ls -l betik.sh</code> ile izinlere bak: x var mı?', '<code>chmod u+x betik.sh</code>, sonra <code>./betik.sh</code>'],
          why: '<code>./</code> "bu dizindeki" demektir. Kabuk, dosyayı program olarak çalıştırmadan önce x iznine bakar. <code>bash betik.sh</code> yazsaydın x izni gerekmezdi; o zaman betiği bash programı okur.'
        },
        {
          id: 'izinsayi', kind: 'predict', title: 'İzinden sayıya',
          learn: 'Tersini de yapabilmelisin: her üçlüdeki harflerin değerlerini topla.',
          code: '-rw-r-----',
          task: 'Bu iznin sayısal karşılığı nedir?',
          answer: '640',
          why: '<code>rw-</code> = 4+2 = 6, <code>r--</code> = 4, <code>---</code> = 0.'
        }
      ]
    },
    {
      id: 'degisken',
      title: 'Değişken, echo ve aritmetik',
      short: 'echo, > >>, $(( )), $( )',
      src: 's. 6–10',
      intro: 'Kabuk bir programlama dilidir: değişken tutar, hesap yapar, komutların çıktısını değişkene alır. Bu aşamadaki her şey betiklerde de aynen çalışır.',
      missions: [
        {
          id: 'degisken', kind: 'cmd', title: 'Değişken tanımla',
          learn: 'Atama <code>isim="Ahmet"</code> biçimindedir: <b>= işaretinin iki yanında boşluk olmaz</b>. Değeri okurken başına <code>$</code> konur: <code>echo "$isim"</code>.',
          example: 'sehir="Ankara"; echo "Şehir: $sehir"',
          task: '<code>isim</code> değişkenine <code>Ahmet</code> ata, sonra değişkeni kullanarak <code>Merhaba, Ahmet!</code> yazdır.',
          expect: 'Merhaba, Ahmet!\n',
          must: { re: /\$\{?isim/, msg: 'Çıktı doğru, ama adı elle yazdın. <code>$isim</code> kullan.' },
          tips: [{ cmd: /^\s*isim\s+=|^\s*isim=\s+\S/, msg: '<code>isim = "Ahmet"</code> yazınca kabuk <code>isim</code> adlı bir komut arar. = işaretinin yanında boşluk olmamalı: <code>isim="Ahmet"</code>' }],
          hints: ['Önce atama, sonra echo. İkisini ayrı satırlarda ya da <code>;</code> ile yazabilirsin.', '<code>isim="Ahmet"</code> ve <code>echo "Merhaba, $isim!"</code>'],
          why: 'Değişken kabukta kaldı: <code>echo $isim</code> yazarsan yine Ahmet gelir. Silmek için <code>unset isim</code>.'
        },
        {
          id: 'tirnak', kind: 'choice', title: 'Tek tırnak, çift tırnak',
          learn: '<b>Çift tırnak</b> içinde <code>$değişken</code> değeriyle değiştirilir. <b>Tek tırnak</b> içindeki her şey olduğu gibi kalır.',
          code: 'isim="Ahmet"\necho \'Merhaba, $isim!\'',
          task: 'Bu komut ne yazar?',
          options: [
            { t: 'Merhaba, $isim!', ok: true, why: 'Tek tırnak içinde $ özel değildir; metin olduğu gibi yazılır.' },
            { t: 'Merhaba, Ahmet!', why: 'Bu çift tırnakla olurdu. Tek tırnak değişkeni açmaz.' },
            { t: 'Merhaba, !', why: 'Değişken tanımlı olmasaydı ve çift tırnak kullanılsaydı böyle olurdu.' },
            { t: 'Hata verir', why: 'Tek tırnak geçerli bir yazım; yalnızca değişken açılmaz.' }
          ],
          why: 'PDF\'teki "değişkeni tanımadan yazdırma" örneği budur: <code>echo \'$isim\'</code> → <code>$isim</code>.'
        },
        {
          id: 'yonlendir', kind: 'predict', title: '> ve >>',
          learn: '<code>&gt;</code> çıktıyı dosyaya yazar ve <b>önceki içeriği siler</b>. <code>&gt;&gt;</code> dosyanın <b>sonuna ekler</b>.',
          code: 'echo "1" > deneme2\necho "3" > deneme2\necho "1" >> deneme2\necho "5" >> deneme2\ncat deneme2',
          task: 'Son satırdaki <code>cat deneme2</code> ne yazar? Satırları sırayla yaz.',
          answer: '3\n1\n5',
          run: 'echo "1" > deneme2; echo "3" > deneme2; echo "1" >> deneme2; echo "5" >> deneme2; cat deneme2',
          why: 'İkinci <code>&gt;</code> ilk "1"i sildi. PDF\'teki örnekte ardından <code>sort deneme2</code> gelir ve 1, 3, 5 yazar.'
        },
        {
          id: 'ekle', kind: 'cmd', title: 'Dosyaya yaz ve ekle',
          learn: 'echo\'nun çıktısını dosyaya yönlendirebilirsin: <code>echo "metin" &gt; dosya</code>. Dosya yoksa oluşur.',
          task: '<code>liste.txt</code> adında bir dosyanın ilk satırı <code>elma</code>, ikinci satırı <code>armut</code> olsun. İki ayrı echo komutu kullan.',
          setup: 'rm -f ~/liste.txt',
          state: (sh) => { const s = sh.statPath(H + 'liste.txt'); return !!s && s.data === 'elma\narmut\n'; },
          tips: [{ cmd: /echo\s+"?armut"?\s*>(?!>)/, msg: 'İkinci satırda <code>&gt;</code> kullanınca dosyanın üzerine yazılır ve "elma" silinir. Eklemek için <code>&gt;&gt;</code>.' }],
          hints: ['Birinci echo dosyayı oluşturur, ikincisi eklemeli.', '<code>echo "elma" &gt; liste.txt</code> ve <code>echo "armut" &gt;&gt; liste.txt</code>'],
          why: '<code>cat liste.txt</code> ile kontrol edebilirsin. Hata yapınca baştan <code>&gt;</code> ile yazmak dosyayı sıfırlar.'
        },
        {
          id: 'aritmetik', kind: 'cmd', title: 'Aritmetik',
          learn: 'Kabukta hesap <code>$(( ))</code> içinde yapılır. İçeride değişkenlerin başına $ koymak gerekmez. Bölme <b>tam sayı</b> bölmesidir: 5/3 = 1.',
          example: 'a=5; b=3; echo $((a + b))',
          task: '<code>a=5</code> ve <code>b=3</code> iken <code>a * b</code> sonucunu <code>$(( ))</code> ile yazdır.',
          expect: '15\n',
          must: { re: /\$\(\(/, msg: 'Sonuç doğru, ama bu görevde <code>$(( ))</code> kullan.' },
          tips: [{ out: /^a \* b$|^5 \* 3$|^\$\(\(/m, msg: 'echo metni hesaplamaz. Hesabı <code>$(( ))</code> içine koy: <code>echo $((a * b))</code>' }],
          hints: ['Önce iki atama, sonra echo.', '<code>a=5; b=3; echo $((a * b))</code>'],
          why: 'Diğer işlemler: <code>$((a - b))</code> = 2, <code>$((a / b))</code> = 1, <code>$((a % b))</code> = 2 (kalan).'
        },
        {
          id: 'expr', kind: 'choice', title: 'expr ve yıldız',
          learn: 'PDF iki eski yöntem daha gösterir: <code>expr 5 + 3</code> (her parça ayrı argüman, aralarda boşluk şart) ve <code>let sonuc=5+3</code>.',
          code: 'sonuc=$(expr 5 * 3)',
          task: 'Bu satır neden 15 vermez? (Terminalde deneyebilirsin.)',
          options: [
            { t: '* kabukta joker karakterdir; expr\'e dosya adları gider', ok: true, why: 'Doğru. Kabuk * işaretini bulunduğun dizindeki dosya adlarıyla değiştirir. Çözüm: <code>expr 5 \\* 3</code>' },
            { t: 'expr çarpma yapamaz', why: 'Yapar; sorun * işaretinin expr\'e hiç ulaşmaması.' },
            { t: 'Sayıların arasında boşluk olmamalı', why: 'Tersine: expr\'de boşluk şarttır. <code>expr 5+3</code> hesaplamaz, "5+3" yazar.' },
            { t: '$( ) yerine " " kullanılmalı', why: '$( ) doğru: komutun çıktısını değişkene alır.' }
          ],
          why: '<code>\\*</code> ters eğik çizgiyle kaçırılmış yıldızdır; kabuk ona dokunmaz. <code>$((5 * 3))</code> içinde ise kaçırmak gerekmez.'
        },
        {
          id: 'komutcikti', kind: 'cmd', title: 'Komutun çıktısını değişkene al',
          learn: '<code>$(komut)</code> komutu çalıştırır ve yerine çıktısını koyar: <code>tarih=$(date)</code>. Böylece bir hesabın sonucunu sonra kullanabilirsin.',
          example: 'tarih=$(date); echo "Bugün: $tarih"',
          task: '<code>ogrenci.txt</code>\'deki satır sayısını <code>$( )</code> ile <code>sayi</code> değişkenine ata ve <code>Toplam: 7</code> yazdır.',
          expect: 'Toplam: 7\n',
          must: { re: /\$\(/, msg: 'Çıktı doğru, ama sayıyı <code>$( )</code> ile hesaplatman gerekiyor.' },
          tips: [{ out: /Toplam: 7 ogrenci\.txt/, msg: '<code>wc -l dosya</code> sayının yanına dosya adını da yazar. Yalnızca sayı için girdiyi pipe ile ver: <code>cat ogrenci.txt | wc -l</code> ya da <code>wc -l &lt; ogrenci.txt</code>' }],
          hints: ['Satır saymak için <code>wc -l</code> kullan.', '<code>sayi=$(cat ogrenci.txt | wc -l); echo "Toplam: $sayi"</code>'],
          why: 'PDF\'teki <code>sistem_bilgisi=$(uname -a)</code> ve <code>tarih=$(date)</code> aynı yapıdır.'
        }
      ]
    },
    {
      id: 'pipe',
      title: 'Pipe ve metin araçları',
      short: 'grep, wc, tr, cut, sort, uniq',
      src: 's. 11, 13–14 · Quiz 1',
      intro: 'Pipe (|) soldaki komutun çıktısını sağdakinin girdisine bağlar. Küçük araçları uç uca ekleyerek bir dosyadan istediğin bilgiyi çıkarırsın. Quiz 1\'deki soru tipi budur.',
      missions: [
        {
          id: 'grep', kind: 'cmd', title: 'Satır süz: grep',
          learn: '<b>grep \'kalıp\' dosya</b> kalıbı içeren satırları yazar. <code>-v</code> içermeyenleri, <code>-i</code> büyük/küçük harf ayırmadan, <code>^</code> ise satır başını arar.',
          example: "grep 'Izmir' ogrenci.txt",
          task: '<code>ogrenci.txt</code>\'de Ankara\'daki öğrencilerin satırlarını göster.',
          solution: "grep 'Ankara' ogrenci.txt",
          hints: ["<code>grep 'Ankara' ogrenci.txt</code>"],
          why: 'Aynı sonucu pipe ile de alırsın: <code>cat ogrenci.txt | grep \'Ankara\'</code>. Quiz sorularında çoğu zaman böyle yazılır.'
        },
        {
          id: 'kelime', kind: 'cmd', title: 'Bir kelime kaç kez geçiyor?',
          learn: '<code>grep -o</code> her eşleşmeyi <b>ayrı bir satıra</b> yazar. <code>wc -l</code> satır sayar. PDF\'teki kalıp: <code>cat dosya | grep -o \'kelime\' | wc -l</code>',
          task: '<code>metin.txt</code>\'de <b>kabuk</b> kelimesinin toplam kaç kez geçtiğini bul.',
          solution: "grep -o 'kabuk' metin.txt | wc -l",
          must: { re: /\|/, msg: 'Sonuç doğru; bu görevde pipe (|) ile iki komutu birleştir.' },
          tips: [{ cmd: /grep\s+(-\w*c|.*\s-c)/, msg: '<code>grep -c</code> eşleşen <b>satırları</b> sayar: 3. satırda "kabuk" iki kez geçtiği için 4 der. Her eşleşmeyi saymak için <code>-o</code> ile ayır, <code>wc -l</code> ile say.' }],
          hints: ['Önce <code>grep -o \'kabuk\' metin.txt</code> yazıp çıktıya bak.', "<code>grep -o 'kabuk' metin.txt | wc -l</code>"],
          why: 'Cevap 5. <code>grep -c</code> 4 verir, çünkü aynı satırdaki iki eşleşmeyi bir sayar. Bu fark sınavda sorulur.'
        },
        {
          id: 'ps', kind: 'cmd', title: 'İşlemler arasında ara',
          learn: '<code>ps aux</code> sistemde çalışan bütün işlemleri listeler; ilk sütun işlemin sahibidir. <code>egrep</code>, <code>grep -E</code> ile aynıdır.',
          task: 'Çalışan işlemlerden <b>root</b> ile ilgili satırları listele (PDF\'teki örnek).',
          solution: 'ps aux | egrep root',
          hints: ['<code>ps aux</code> çıktısını egrep\'e bağla.', '<code>ps aux | egrep root</code>'],
          why: 'Pipe\'ın iki ucundaki komutlar ayrı işlemlerdir: kabuk ikisini aynı anda başlatır ve aralarına bir pipe kurar (Bölüm 3\'teki sıradan pipe).'
        },
        {
          id: 'tr', kind: 'cmd', title: 'Karakter değiştir: tr',
          learn: '<b>tr küme1 küme2</b> girdideki karakterleri dönüştürür; <code>tr -d küme</code> siler. tr <b>yalnızca girdiyi okur</b>, dosya adı almaz; dosyayı pipe ile verirsin.',
          example: 'echo "col1;col2;col3;col4" | tr a-z A-Z',
          task: '<code>birdosya.txt</code>\'deki noktalı virgülleri virgüle çevirerek yazdır.',
          solution: "cat birdosya.txt | tr ';' ','",
          tips: [{ out: /extra operand/, msg: 'tr dosya adı almaz. Dosyayı pipe ile ver: <code>cat birdosya.txt | tr ...</code>' }, { out: /command not found/, msg: 'Noktalı virgül kabukta komut ayırıcıdır. tr\'ye karakter olarak vermek için tırnak içine al: <code>\';\'</code>' }],
          hints: ['Girdiyi <code>cat</code> ile ver.', "<code>cat birdosya.txt | tr ';' ','</code>"],
          why: 'PDF\'te tırnaklar <code>`;\'</code> diye görünür; terminale normal tek tırnak yazılmalıdır: <code>\';\'</code>. <code>tr -d \';\'</code> ise noktalı virgülleri siler.'
        },
        {
          id: 'cut', kind: 'cmd', title: 'Sütun kes: cut',
          learn: '<b>cut -d\'X\' -f N</b> her satırı X karakterinden böler ve N. parçayı alır. Birden çok sütun: <code>-f1,4</code>, aralık: <code>-f2-4</code>.',
          example: "cut -d';' -f2 ogrenci.txt",
          task: '<code>ogrenci.txt</code>\'den yalnızca öğrenci <b>adlarını</b> yazdır.',
          solution: "cut -d';' -f1 ogrenci.txt",
          tips: [{ cmd: /cut\s+-f/, msg: 'Ayırıcıyı söylemezsen cut sekme karakterine göre böler. Bu dosyada ayırıcı <code>;</code>: <code>-d\';\'</code>' }],
          hints: ['Ad 1. sütun, ayırıcı <code>;</code>', "<code>cut -d';' -f1 ogrenci.txt</code>"],
          why: 'Ayırıcı her zaman tırnak içinde yazılır; yoksa kabuk <code>;</code> işaretini komut sonu sanar.'
        },
        {
          id: 'grepcut', kind: 'cmd', title: 'Süz, sonra kes',
          learn: 'Soruyu adımlara böl: önce hangi <b>satırlar</b> (grep), sonra hangi <b>sütunlar</b> (cut). Her adımın çıktısı bir sonrakinin girdisidir.',
          task: 'Ankara\'daki öğrencilerin <b>yalnızca adlarını</b> yazdır.',
          solution: "grep 'Ankara' ogrenci.txt | cut -d';' -f1",
          hints: ['Önceki iki görevi birleştir.', "<code>grep 'Ankara' ogrenci.txt | cut -d';' -f1</code>"],
          why: 'Takılırsan pipe\'ı ortasından kes: önce <code>grep \'Ankara\' ogrenci.txt</code> neyi veriyor, bak; sonra bir komut ekle.'
        },
        {
          id: 'sort', kind: 'cmd', title: 'Sırala: sort',
          learn: '<code>sort</code> satırları <b>metin gibi</b> sıralar: 10, 9\'dan önce gelir. <code>-n</code> sayısal, <code>-r</code> ters sıralar. Sütuna göre sıralamak için ayırıcı <code>-t\';\'</code>, sütun <code>-k4</code>.',
          example: "sort -t';' -k2 ogrenci.txt",
          task: 'Öğrencileri <b>notlarına göre büyükten küçüğe</b> sırala.',
          solution: "sort -t';' -k4 -nr ogrenci.txt",
          tips: [{ cmd: /sort(?!.*-\w*n)/, msg: 'Notlar sayı; <code>-n</code> olmadan sort metin gibi karşılaştırır. Bu dosyada sonuç aynı görünebilir ama 100 ve 9 gibi değerlerde yanlış sıralar.' }],
          hints: ['Not 4. sütun; sayısal ve ters sıralama gerekiyor.', "<code>sort -t';' -k4 -nr ogrenci.txt</code>"],
          why: '<code>-nr</code>, <code>-n -r</code> ile aynıdır. En yüksek 3 not istenseydi sona <code>| head -3</code> eklerdin.'
        },
        {
          id: 'uniqc', kind: 'cmd', title: 'Grupla ve say (quiz tipi)',
          learn: '<code>uniq -c</code> <b>yan yana</b> duran aynı satırları birleştirip sayar. Aynı değerler dağınıksa önce <code>sort</code> ile yan yana getirilir. Kalıp: <code>... | sort | uniq -c | sort -nr</code>',
          task: 'Her şehirden kaç öğrenci olduğunu <b>çoktan aza</b> listele.',
          solution: "cut -d';' -f2 ogrenci.txt | sort | uniq -c | sort -nr",
          tips: [{ cmd: /f2[^|]*\|\s*uniq/, msg: 'sort olmadan uniq yalnızca art arda gelen aynı satırları birleştirir; dağınık Istanbul\'lar ayrı ayrı sayılır. Araya <code>sort</code> koy.' }],
          hints: ['Adımlar: şehir sütununu kes → sırala → say → sayıya göre ters sırala.', "<code>cut -d';' -f2 ogrenci.txt | sort | uniq -c | sort -nr</code>"],
          why: 'Bu, 10 Kasım quizindeki soru tipidir. Sonuç: Istanbul 3, Izmir 2, Ankara 2.'
        },
        {
          id: 'enDusuk', kind: 'cmd', title: 'En düşük ikisi',
          learn: '<code>head -N</code> ilk N satırı, <code>tail -N</code> son N satırı alır. Sıraladıktan sonra kullanınca "en yüksek / en düşük N" sorularını çözer.',
          task: 'Notu <b>en düşük 2</b> öğrencinin <b>adını ve notunu</b> yazdır.',
          solution: "sort -t';' -k4 -n ogrenci.txt | head -2 | cut -d';' -f1,4",
          hints: ['Sırala → ilk 2 → sütunları kes.', "<code>sort -t';' -k4 -n ogrenci.txt | head -2 | cut -d';' -f1,4</code>"],
          why: 'Çıktı <code>Can;58</code> ve <code>Mehmet;64</code>. "ad not" biçimi istenseydi sona <code>| tr \';\' \' \'</code> eklerdin.'
        },
        {
          id: 'haric', kind: 'cmd', title: 'Dışındakileri say',
          learn: '<code>grep -v</code> kalıbı <b>içermeyen</b> satırları bırakır.',
          task: 'İstanbul <b>dışındaki</b> öğrencilerin sayısını bul.',
          solution: "grep -v 'Istanbul' ogrenci.txt | wc -l",
          hints: ["<code>grep -v 'Istanbul' ogrenci.txt | wc -l</code>"],
          why: 'Cevap 4. <code>grep -vc \'Istanbul\' ogrenci.txt</code> de aynı sayıyı verir.'
        }
      ]
    },
    {
      id: 'awk',
      title: 'awk ile sütun işleme',
      short: "awk 'desen {eylem}'",
      src: 's. 15 · Lab uygulaması',
      intro: 'awk dosyayı satır satır okur, her satırı sütunlara böler ($1, $2 ...). Desen doğruysa eylemi yapar. Sütunlarla hesap yapmak gerektiğinde cut ve sort\'tan daha güçlüdür.',
      missions: [
        {
          id: 'awkint', kind: 'cmd', title: 'Sütun değerine göre süz',
          learn: '<code>awk -F \';\' \'int($2)&gt;3\' dosya</code>: ayırıcı <code>;</code>, desen "2. sütun 3\'ten büyük". Eylem yazılmazsa eşleşen satır olduğu gibi yazılır. <code>int()</code> değeri tam sayıya çevirir.',
          task: '<code>birdosya.txt</code>\'de (PDF\'teki dosya) <b>2. sütunu 3\'ten büyük</b> olan satırları yazdır.',
          solution: "awk -F ';' 'int($2)>3' birdosya.txt",
          must: { re: /awk/, msg: 'Çıktı doğru; bu aşamada awk kullan.' },
          tips: [{ cmd: /awk\s+'/, msg: 'Ayırıcıyı belirtmezsen awk boşluklara göre böler ve satırın tamamı $1 olur. Önce <code>-F \';\'</code> yaz.' }],
          hints: ["<code>awk -F ';' 'int($2)>3' birdosya.txt</code>"],
          why: 'Program tek tırnak içinde yazılır; yoksa kabuk <code>$2</code> ve <code>&gt;</code> işaretlerini kendisi yorumlar (> dosyaya yönlendirme olur!).'
        },
        {
          id: 'awkle', kind: 'cmd', title: 'Küçük eşit',
          learn: 'Karşılaştırma işleçleri: <code>&lt; &lt;= &gt; &gt;= == !=</code>',
          task: 'Aynı dosyada <b>3. sütunu 4\'ten küçük veya eşit</b> olan satırları yazdır.',
          solution: "awk -F ';' 'int($3)<=4' birdosya.txt",
          must: { re: /awk/, msg: 'Çıktı doğru; bu aşamada awk kullan.' },
          hints: ["<code>awk -F ';' 'int($3)<=4' birdosya.txt</code>"],
          why: 'PDF\'teki ikinci örnek. Dört satır gelir: 3. sütunu 1, 2, 3, 4 olanlar.'
        },
        {
          id: 'awkprint', kind: 'cmd', title: 'Sütun yazdır, hesapla',
          learn: '<code>{print $1, $2}</code> sütunları aralarında boşlukla yazar. Sütunlarla hesap yapılabilir: <code>$2+$3</code>. <code>ogrenciler.txt</code> boşlukla ayrılmış; <code>-F</code> gerekmez.',
          example: "awk '{print $1}' ogrenciler.txt",
          task: '<code>ogrenciler.txt</code>\'de her satır için adı ve <b>iki puanın toplamını</b> yazdır.',
          solution: "awk '{print $1, $2+$3}' ogrenciler.txt",
          must: { re: /awk/, msg: 'Çıktı doğru; bu aşamada awk kullan.' },
          tips: [{ out: /^\w+\d/m, msg: 'Virgül unutulmuş: <code>print $1 $2</code> sütunları bitiştirir. Aralarına virgül koy: <code>print $1, $2+$3</code>' }],
          hints: ['Önce <code>cat ogrenciler.txt</code> ile sütunlara bak.', "<code>awk '{print $1, $2+$3}' ogrenciler.txt</code>"],
          why: 'Virgül çıktıda bir boşluk olur. <code>print $1": "$2+$3</code> yazarsan araya ": " girer.'
        },
        {
          id: 'awkfiltre', kind: 'cmd', title: 'Desen + eylem',
          learn: 'Desen ve eylem birlikte: <code>awk \'$2&gt;=20 {print $1}\'</code>, yalnızca koşulu sağlayan satırlar için eylemi yapar.',
          task: '2. sütunu <b>20 veya daha büyük</b> olanların <b>adını ve 2. sütununu</b> yazdır.',
          solution: "awk '$2>=20 {print $1, $2}' ogrenciler.txt",
          must: { re: /awk/, msg: 'Çıktı doğru; bu aşamada awk kullan.' },
          hints: ["<code>awk '$2>=20 {print $1, $2}' ogrenciler.txt</code>"],
          why: 'Çıktı Ayse 25 ve Mert 30. Bunu grep ile yapamazsın: grep sayıları karşılaştıramaz.'
        },
        {
          id: 'awkve', kind: 'cmd', title: 'İki koşul: &&',
          learn: 'Koşullar <code>&amp;&amp;</code> (ve) ile <code>||</code> (veya) ile birleşir.',
          task: '2. sütunu <b>10 ile 15 arasında</b> (ikisi dahil) olanların adını yazdır.',
          solution: "awk '$2>=10 && $2<=15 {print $1}' ogrenciler.txt",
          must: { re: /awk/, msg: 'Çıktı doğru; bu aşamada awk kullan.' },
          hints: ['<code>$2&gt;=10</code> ve <code>$2&lt;=15</code>', "<code>awk '$2>=10 && $2<=15 {print $1}' ogrenciler.txt</code>"],
          why: 'Yalnızca Ali (12) bu aralıkta.'
        },
        {
          id: 'awkend', kind: 'cmd', title: 'Toplam ve ortalama: END',
          learn: 'awk değişkenleri ilk kullanımda 0\'dır ve satırlar boyunca değerini korur. <code>END { }</code> bütün satırlar okunduktan sonra bir kez çalışır. <code>NR</code> okunan satır sayısıdır.',
          example: "awk '{n++} END {print n}' ogrenciler.txt",
          task: '2. sütunun <b>toplamını ve ortalamasını</b> yazdır.',
          solution: "awk '{t+=$2} END {print t, t/NR}' ogrenciler.txt",
          must: { re: /awk/, msg: 'Çıktı doğru; bu aşamada awk kullan.' },
          hints: ['Her satırda <code>t+=$2</code>, sonda yazdır.', "<code>awk '{t+=$2} END {print t, t/NR}' ogrenciler.txt</code>"],
          why: 'Çıktı <code>97 16.1667</code>. END olmadan print her satırda çalışır ve ara toplamları yazardı.'
        },
        {
          id: 'awkdosya', kind: 'cmd', title: 'Sonucu dosyaya yaz',
          learn: '<code>/^A/</code> deseni "A ile başlayan satır" demektir. awk\'ın çıktısı da <code>&gt;</code> ile dosyaya yönlendirilir.',
          task: '<b>A ile başlayan</b>, 2. sütunu <b>3\'ten büyük</b> ve 3. sütunu <b>10\'dan küçük</b> satırları <code>sonuc.txt</code> dosyasına yaz.',
          setup: 'rm -f ~/sonuc.txt',
          file: { path: 'sonuc.txt', solution: "awk '/^A/ && $2>3 && $3<10' ogrenciler.txt > sonuc.txt" },
          hints: ['Üç koşulu && ile birleştir, sonra <code>&gt; sonuc.txt</code>', "<code>awk '/^A/ && $2>3 && $3<10' ogrenciler.txt > sonuc.txt</code>"],
          why: '<code>cat sonuc.txt</code> iki satır gösterir: Ali 12 8 ve Ayse 25 9. Satır sayısı için <code>wc -l &lt; sonuc.txt</code>.'
        },
        {
          id: 'awkort', kind: 'cmd', title: 'Lab sorusu: bölüm ortalaması',
          learn: 'Metin karşılaştırması <code>==</code> ile ve tırnakla yapılır: <code>$3=="Bilgisayar"</code>. Toplam ve sayaç birlikte tutulur, ortalama END\'de hesaplanır.',
          task: '<code>ogrenci.txt</code>\'de <b>Bilgisayar</b> bölümündeki öğrencilerin not ortalamasını yazdır.',
          solution: "awk -F';' '$3==\"Bilgisayar\" {t+=$4; n++} END {print t/n}' ogrenci.txt",
          must: { re: /awk/, msg: 'Çıktı doğru; bu aşamada awk kullan.' },
          hints: ['Ayırıcı <code>;</code>, bölüm 3. sütun, not 4. sütun.', 'Desen <code>$3=="Bilgisayar"</code>, eylem <code>{t+=$4; n++}</code>, sonda <code>END {print t/n}</code>'],
          why: '(85 + 64 + 58 + 69) / 4 = 69. NR yerine n kullandın, çünkü NR süzülmemiş bütün satırları sayar.'
        }
      ]
    },
    {
      id: 'betik',
      title: 'Betikler: if, döngü, case',
      short: 'nano, read, if, for, while, case',
      src: 's. 6–7, 9, 12–13, 16–19',
      intro: 'Betik, bir dosyaya yazılmış kabuk komutlarıdır. Terminale yazdığın her şey betikte de çalışır; üstüne read ile girdi alır, if ile karar verir, döngüyle tekrar edersin.',
      missions: [
        {
          id: 'ilkbetik', kind: 'cmd', title: 'İlk betiğin',
          learn: 'Betiğin ilk satırı <b>shebang</b>dir: <code>#!/bin/bash</code>, betiği hangi kabuğun çalıştıracağını söyler. <code>nano dosya</code> düzenleyiciyi açar; <b>Ctrl+O</b> kaydeder, <b>Ctrl+X</b> çıkar.',
          task: '<code>nano selam.sh</code> ile iki satırlık bir betik yaz: <code>#!/bin/bash</code> ve <code>echo "Merhaba, Dünya!"</code>. Sonra çalıştırma izni ver ve <code>./selam.sh</code> ile çalıştır.',
          setup: 'rm -f ~/selam.sh ~/betikler/selam.sh',
          expect: 'Merhaba, Dünya!\n',
          must: { re: /selam\.sh/, msg: 'Çıktı doğru; ama betiğini (selam.sh) çalıştırarak al.' },
          tips: [{ out: /Permission denied/, msg: 'Yeni dosyalar x izni olmadan oluşur: <code>chmod +x selam.sh</code>' }],
          hints: ['Sıra: <code>nano selam.sh</code> → yaz → Ctrl+O → Ctrl+X → <code>chmod +x selam.sh</code> → <code>./selam.sh</code>'],
          why: 'Bir betik yazıp çalıştırmanın bütün adımlarını yaptın: düzenle, izin ver, çalıştır.'
        },
        {
          id: 'read', kind: 'cmd', title: 'Kullanıcıdan girdi: read',
          learn: '<code>read isim</code> klavyeden bir satır okur ve <code>isim</code> değişkenine koyar. Betikler <code>~/betikler</code> dizininde.',
          code: '#!/bin/bash\necho "Adınızı girin: "\nread isim\necho "Merhaba, $isim!"',
          task: '<code>betikler</code> dizinine gir ve <code>ad.sh</code>\'yi çalıştır. Betik adını sorunca yaz ve Enter\'a bas.',
          dir: 'betikler',
          match: /Merhaba, \S.*!/,
          must: { re: /ad\.sh/, msg: 'Bu görevde ad.sh betiğini çalıştır.' },
          hints: ['<code>cd betikler</code>, sonra <code>./ad.sh</code>'],
          why: 'Girdiyi pipe ile de verebilirsin: <code>echo Ayse | ./ad.sh</code>. Bu durumda read satırı klavyeden değil pipe\'tan okur.'
        },
        {
          id: 'hata', kind: 'cmd', title: 'Hatayı bul: kontrol.sh',
          learn: 'Koşulun köşeli parantezlerinin içinde <b>boşluk zorunludur</b>: <code>[ $sayi -gt 5 ]</code>. <code>[</code> aslında bir komuttur; boşluksuz yazınca kabuk <code>[10</code> adlı bir komut arar. Bash hatanın satır numarasını yazar.',
          task: '<code>betikler/kontrol.sh</code> sayi=10 için "Sayı 5\'ten büyük." yazmalı ama yazmıyor. <code>bash kontrol.sh</code> ile çalıştır, hata iletisini oku, <code>nano</code> ile düzelt ve yeniden çalıştır.',
          dir: 'betikler',
          restore: 'betikler/kontrol.sh',
          expect: 'Sayı 5\'ten büyük.\n',
          clean: true,
          must: { re: /kontrol\.sh/, msg: 'Betiği (kontrol.sh) çalıştırarak doğrula.' },
          tips: [{ out: /\[10: command not found/, msg: 'Satır 3: <code>[$sayi</code> birleşik yazılmış. Kabuk <code>[10</code> adında bir komut arıyor; bulamayınca koşul yanlış sayılıp else çalışıyor. Köşeli parantezlerin iç kenarlarına boşluk koy.' }],
          hints: ['<code>bash kontrol.sh</code> çıktısındaki "line 3" hangi satırı gösteriyor?', 'Doğrusu: <code>if [ $sayi -gt 5 ]; then</code>'],
          why: 'Sinsi bir hata: betik çökmedi, yanlış dala girdi. Hata iletisini okumak bu yüzden önemli. PDF\'teki karşılaştırma işleçleri: <code>-eq -ne -lt -le -gt -ge</code>.'
        },
        {
          id: 'for', kind: 'predict', title: 'for döngüsü',
          learn: '<code>for i in liste</code> listenin her elemanı için gövdeyi çalıştırır. <code>{1..5}</code> kabukta 1 2 3 4 5 diye açılır. Gövde <code>do</code> ile <code>done</code> arasındadır.',
          code: 'for i in {1..5}\ndo\n    echo "Döngü adımı $i"\ndone',
          task: 'Bu döngü ne yazar? (Kaç satır, hangi sayılar?)',
          answer: 'Döngü adımı 1\nDöngü adımı 2\nDöngü adımı 3\nDöngü adımı 4\nDöngü adımı 5',
          run: 'bash ~/betikler/dongu.sh',
          why: 'Beş satır. <code>{1..5}</code> yerine <code>1 2 3 4 5</code> ya da <code>*.txt</code> da yazılabilir.'
        },
        {
          id: 'while', kind: 'cmd', title: 'while ve break',
          learn: '<code>while true</code> sonsuza dek döner; <code>break</code> döngüden çıkar. <code>sayac.sh</code> her turda bir sayı okur, 0 gelirse çıkar.',
          code: 'while true\ndo\n    read sayi\n    if [ $sayi -eq 0 ]; then\n        echo "Çıkılıyor..."\n        break\n    fi\n    echo "Girdiğiniz sayı: $sayi"\ndone',
          task: '<code>betikler/sayac.sh</code>\'yi çalıştır, birkaç sayı gir ve 0 ile çık.',
          dir: 'betikler',
          match: /Girdiğiniz sayı: [\s\S]*Çıkılıyor\.\.\./,
          must: { re: /sayac\.sh/, msg: 'Bu görevde sayac.sh betiğini çalıştır.' },
          hints: ['<code>cd ~/betikler</code>, <code>./sayac.sh</code>; sonra örneğin 4, 7, 0 gir.'],
          why: 'Sayı yerine boş Enter girersen <code>[ -eq 0 ]</code> olur ve "unary operator expected" hatası gelir: değişken tırnaksız ve boş. <code>[ "$sayi" -eq 0 ]</code> yazmak daha güvenlidir.'
        },
        {
          id: 'case', kind: 'predict', title: 'case',
          learn: '<code>case $değişken in</code> değeri sırayla kalıplarla karşılaştırır. <code>;;</code> seçeneği bitirir, <code>*)</code> hiçbiri uymazsa çalışır, <code>esac</code> case\'i kapatır.',
          code: 'read -p "Bir meyve adı girin: " meyve\ncase $meyve in\n    "elma")  echo "Elma seçildi." ;;\n    "armut") echo "Armut seçildi." ;;\n    *)       echo "Tanınmayan meyve." ;;\nesac',
          task: 'Kullanıcı <b>muz</b> yazarsa betik ne yazar?',
          answer: 'Tanınmayan meyve.',
          run: 'echo muz | bash ~/betikler/meyve.sh',
          why: '"muz" elma ya da armut değil, <code>*)</code> her şeye uyar. Terminalde <code>./meyve.sh</code> ile başka meyveler dene.'
        },
        {
          id: 'varmi', kind: 'cmd', title: 'Dosya var mı: -e',
          learn: '<code>[ -e dosya ]</code> dosya varsa doğrudur. <code>betikler/varmi.sh</code>, bulunduğun dizinde <code>ornek.txt</code> olup olmadığına bakar.',
          code: 'dosya="ornek.txt"\nif [ -e "$dosya" ]; then\n    echo "$dosya mevcut."\nelse\n    echo "$dosya mevcut değil."\nfi',
          task: 'Betiği değiştirmeden, <code>varmi.sh</code>\'nin <b>"ornek.txt mevcut."</b> yazmasını sağla.',
          dir: 'betikler',
          setup: 'rm -f ~/ornek.txt ~/betikler/ornek.txt',
          expect: 'ornek.txt mevcut.\n',
          must: { re: /varmi\.sh/, msg: 'varmi.sh betiğini çalıştırarak doğrula.' },
          hints: ['Betiğin aradığı dosyayı oluşturman yeter.', '<code>touch ornek.txt</code>, sonra betiği aynı dizinde çalıştır.'],
          why: 'Göreli yol (<code>ornek.txt</code>) betiğin bulunduğu dizine değil, <b>senin bulunduğun</b> dizine göre aranır.'
        },
        {
          id: 'fonksiyon', kind: 'cmd', title: 'Fonksiyon',
          learn: 'Fonksiyon <code>ad() { komutlar; }</code> ile tanımlanır, <b>parantezsiz</b> çağrılır: <code>ad</code>. Tek satırda yazarken <code>}</code>\'den önce <code>;</code> gerekir.',
          example: 'merhaba() { echo "Merhaba, dünya!"; }',
          task: 'Terminalde <code>selamla</code> adında, <code>Merhaba, dünya!</code> yazan bir fonksiyon tanımla ve çağır.',
          expect: 'Merhaba, dünya!\n',
          must: { re: /selamla/, msg: 'Fonksiyonun adı <code>selamla</code> olmalı.' },
          tips: [{ out: /unexpected end of file/, msg: 'Kapanış <code>}</code> echo\'nun argümanı sanıldı. Tek satırda <code>}</code>\'den önce <code>;</code> koy: <code>{ echo "..."; }</code>' }],
          hints: ['Önce tanım, sonra çağrı: iki komut.', '<code>selamla() { echo "Merhaba, dünya!"; }</code> ve ardından <code>selamla</code>'],
          why: 'PDF\'teki <code>echo "Merhaba, dünya!" }</code> yazımı, <code>}</code> ayrı satırda değilse sözdizimi hatası verir. Doğrusu <code>; }</code> ya da <code>}</code>\'yi yeni satıra yazmaktır.'
        }
      ]
    }
  ];

  OSLab.shellLab = { stages };

  /* ------------------------------------------------------------ Bilgi & Sınav paneli */

  OSLab.info = OSLab.info || {};
  OSLab.info.shell = {
    theory: [
      {
        id: 'nav', title: 'Temel komutlar (s. 2–3)',
        html: `<p><b>Kernel</b> dosya, işlem, G/Ç, bellek ve aygıt yönetimini yapan çekirdektir. <b>Shell</b> bu servislere erişmek için kullanılan programdır: bash, csh, ksh.</p>
          <table class="ref"><tbody>
            <tr><td><code>ls</code> · <code>ls -l</code> · <code>ls *.txt</code></td><td>listele · ayrıntılı · süzerek</td></tr>
            <tr><td><code>cd dizin</code> · <code>cd ..</code></td><td>dizine gir · bir üste çık</td></tr>
            <tr><td><code>mkdir</code> · <code>rmdir</code> · <code>rm -r</code></td><td>dizin oluştur · boş dizini sil · içindekilerle sil</td></tr>
            <tr><td><code>touch</code> · <code>rm</code></td><td>dosya oluştur · sil</td></tr>
            <tr><td><code>cp</code> · <code>mv</code></td><td>kopyala · taşı / yeniden adlandır</td></tr>
            <tr><td><code>cat</code> · <code>nano</code> · <code>man</code></td><td>içeriği göster · düzenle · kılavuz</td></tr>
          </tbody></table>`
      },
      {
        id: 'perm', title: 'İzinler ve chmod (s. 4–5)',
        html: `<p><code>ls -l</code>: <b>tür</b> (<code>-</code> dosya, <code>d</code> dizin, <code>l</code> bağ, <code>c</code>/<code>b</code> aygıt, <code>p</code> adlı pipe, <code>s</code> soket) + <b>sahip / grup / diğerleri</b> için rwx, sonra sahip, grup, boyut, tarih, ad.</p>
          <p><b>r = 4, w = 2, x = 1</b>. 7 rwx · 6 rw- · 5 r-x · 4 r-- · 3 -wx · 2 -w- · 1 --x · 0 ---</p>
          <p><code>chmod 765 dosya</code> → <code>-rwxrw-r-x</code> · <code>chmod u=rwx,g=rx,o= dosya</code> → 750 → <code>-rwxr-x---</code></p>
          <p><code>u+x</code> sahibe çalıştırma ekle · <code>g-w</code> grubun yazmasını kaldır · <code>o+r</code> diğerlerine okuma ver · <code>a</code> herkes. Virgülden sonra boşluk yok.</p>`
      },
      {
        id: 'var', title: 'echo, değişken, aritmetik (s. 6–10)',
        html: `<ul>
            <li><code>isim="Ahmet"</code>: = yanında boşluk yok · okurken <code>$isim</code> · <code>unset isim</code></li>
            <li><code>"..."</code> değişkeni açar, <code>'...'</code> açmaz · <code>echo -e "a\\nb"</code> kaçış dizileri</li>
            <li><code>&gt;</code> üzerine yazar · <code>&gt;&gt;</code> sona ekler</li>
            <li><code>tarih=$(date)</code> komutun çıktısı · <code>$USER</code>, <code>$HOME</code> hazır değişkenler</li>
            <li><code>$((a + b))</code> · <code>expr 5 \\* 3</code> · <code>let s=5+3</code> · bölme tam sayıdır, <code>%</code> kalan</li>
            <li><code>meyveler=("elma" "armut")</code> dizi · <code>\${meyveler[0]}</code></li>
          </ul>`
      },
      {
        id: 'flow', title: 'if, döngü, case, fonksiyon (s. 12–19)',
        html: `<pre class="ref-code">if [ $sayi -gt 5 ]; then
    echo "büyük"
else
    echo "küçük veya eşit"
fi</pre>
          <p>Sayı: <code>-eq -ne -lt -le -gt -ge</code> · Metin: <code>== != -z -n</code> · Dosya: <code>-e</code> · Mantık: <code>[ a ] &amp;&amp; [ b ]</code>, <code>||</code>. Köşeli parantezin içinde boşluk şart.</p>
          <pre class="ref-code">for i in {1..5}; do echo $i; done
while true; do read s; [ $s -eq 0 ] &amp;&amp; break; done
case $m in "elma") echo E ;; *) echo ? ;; esac
merhaba() { echo "Merhaba"; }; merhaba</pre>`
      },
      {
        id: 'pipe', title: 'Pipe ve metin araçları (s. 11, 13–14)',
        html: `<p><code>|</code> soldakinin çıktısını sağdakinin girdisine bağlar. Yöntem: <b>süz</b> (grep) → <b>sırala</b> (sort) → <b>say / kes</b> (uniq -c, wc -l, head) → <b>biçimle</b> (cut, tr).</p>
          <table class="ref"><tbody>
            <tr><td><code>grep -o 'k' f | wc -l</code></td><td>k kaç kez geçiyor (<code>-c</code> satır sayar)</td></tr>
            <tr><td><code>grep -v</code> · <code>-i</code> · <code>^A</code></td><td>içermeyen · harf duyarsız · A ile başlayan</td></tr>
            <tr><td><code>cut -d';' -f1,4</code></td><td>; ile böl, 1. ve 4. sütun</td></tr>
            <tr><td><code>sort -t';' -k4 -nr</code></td><td>4. sütuna göre sayısal, büyükten küçüğe</td></tr>
            <tr><td><code>sort | uniq -c | sort -nr</code></td><td>grupla, say, çoktan aza</td></tr>
            <tr><td><code>tr a-z A-Z</code> · <code>tr ';' ','</code> · <code>tr -d ';'</code></td><td>büyüt · değiştir · sil (yalnızca girdiden okur)</td></tr>
            <tr><td><code>ps aux | egrep root</code></td><td>root'un işlemleri</td></tr>
          </tbody></table>`
      },
      {
        id: 'awk', title: 'awk (s. 15, Lab)',
        html: `<p><code>awk -F ';' 'desen { eylem }' dosya</code> · <code>$1 $2</code> sütunlar, <code>$0</code> satır, <code>NR</code> satır no, <code>NF</code> sütun sayısı.</p>
          <pre class="ref-code">awk -F ';' 'int($2)>3' birdosya.txt
awk '{print $1, $2+$3}' ogrenciler.txt
awk '$2>=10 &amp;&amp; $2<=15 {print $1}' ogrenciler.txt
awk '{t+=$2} END {print t, t/NR}' ogrenciler.txt
awk '/^A/ &amp;&amp; $2>3' ogrenciler.txt > sonuc.txt</pre>`
      }
    ],
    exam: [
      { topic: 'Pipe', q: 'Bir dosyada bir kelimenin kaç kez geçtiğini nasıl bulursun? Neden <code>grep -c</code> yetmez?', a: '<code>cat dosya | grep -o \'kelime\' | wc -l</code>. <code>grep -c</code> eşleşen satırları sayar; aynı satırdaki iki eşleşme bir sayılır.' },
      { topic: 'Pipe', q: 'Her şehirden kaç öğrenci olduğunu çoktan aza listele (ogrenci.txt, ayırıcı ;, şehir 2. sütun).', a: '<code>cut -d\';\' -f2 ogrenci.txt | sort | uniq -c | sort -nr</code>. uniq yalnızca yan yana aynı satırları birleştirdiği için önce sort gerekir.' },
      { topic: 'İzin', q: '<code>chmod 644 dosya</code> ne anlama gelir? <code>-rwxr-x---</code> kaçtır?', a: '644: sahip rw-, grup r--, diğerleri r--. <code>-rwxr-x---</code> = 750.' },
      { topic: 'Değişken', q: '<code>x = 5</code> satırı neden hata verir? <code>echo \'$x\'</code> ne yazar?', a: '= yanında boşluk olunca kabuk x\'i komut sanar; doğrusu <code>x=5</code>. Tek tırnak değişkeni açmaz: <code>$x</code> yazar.' },
      { topic: 'Betik', q: '<code>if [$a -gt 5]</code> neden çalışmaz?', a: '<code>[</code> bir komuttur, arkasından boşluk gelmeli. Boşluksuz yazınca kabuk <code>[10</code> gibi bir komut arar. Doğrusu <code>if [ $a -gt 5 ]</code>.' },
      { topic: 'awk', q: 'ogrenciler.txt\'de 2. sütunun toplamını ve ortalamasını awk ile yazdır.', a: '<code>awk \'{t+=$2} END {print t, t/NR}\' ogrenciler.txt</code>. END tüm satırlar okunduktan sonra bir kez çalışır.' },
      { topic: 'awk', q: 'birdosya.txt\'de (; ile ayrılmış) 2. sütunu 3\'ten büyük olan satırlar?', a: '<code>awk -F \';\' \'int($2)&gt;3\' birdosya.txt</code>' }
    ]
  };
})(window.OSLab = window.OSLab || {});
