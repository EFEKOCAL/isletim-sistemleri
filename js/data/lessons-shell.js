/*
 * lessons-shell.js — Shell Programlama dersleri (Shell Programlama.pdf, Labuygulaması.pdf).
 * Kabuk kavramını anlatan "Kullanıcı ve İşletim Sistemi Arayüzü" dersinin arkasına eklenir.
 * Komut çıktıları bash ve awk ile çalıştırılarak alınmıştır.
 */
(function (OSLab) {
  'use strict';

  const SRC = 'Shell Programlama (Lab)';

  const lessons = [
    {
      id: 'shell-temel',
      title: 'Shell ve Temel Komutlar',
      en: 'Shell & Basic Commands',
      src: `${SRC}, s. 2–3`,
      minutes: 6,
      blocks: [
        { t: 'compare', cols: [
          { title: 'Çekirdek (kernel)', items: ['İşletim sisteminin çekirdeğini oluşturan program', 'Dosya, işlem, G/Ç, bellek ve aygıt yönetimi yapar'] },
          { title: 'Kabuk (shell)', items: ['İşletim sistemi servislerine erişmek için kullanılan program', 'Örnekler: <b>bash</b>, <b>csh</b> (C Shell), <b>ksh</b> (Korn Shell)'] }
        ] },
        { t: 'h', text: 'Dizinlerde gezinme' },
        { t: 'table', head: ['Komut', 'Görevi'], rows: [
          ['<code>ls</code>', 'Dizindeki dosyaları listeler'],
          ['<code>ls -l</code>', 'Ayrıntılı listeler (izin, sahip, boyut, tarih)'],
          ['<code>ls *.txt</code>', 'Yalnızca .txt ile bitenleri listeler'],
          ['<code>cd dizin</code>', 'Dizine girer'],
          ['<code>cd ..</code>', 'Bir üst dizine çıkar']
        ] },
        { t: 'h', text: 'Dosya ve dizin işlemleri' },
        { t: 'table', head: ['Komut', 'Görevi'], rows: [
          ['<code>mkdir dizin</code>', 'Dizin oluşturur'],
          ['<code>rmdir dizin</code>', 'Yalnızca <b>boş</b> dizini siler'],
          ['<code>rm -r dizin</code>', 'Dizini içeriğiyle birlikte siler'],
          ['<code>touch dosya</code>', 'Boş dosya oluşturur'],
          ['<code>rm dosya</code>', 'Dosyayı siler'],
          ['<code>cp kaynak hedef</code>', 'Kopyalar'],
          ['<code>mv kaynak hedef</code>', 'Taşır; aynı dizinde yeniden adlandırır']
        ] },
        { t: 'h', text: 'İçerik ve yardım' },
        { t: 'table', head: ['Komut', 'Görevi'], rows: [
          ['<code>cat dosya</code>', 'İçeriği ekrana yazar'],
          ['<code>nano dosya</code>', 'Metin düzenleyicide açar'],
          ['<code>man ls</code>', 'Komutun kullanım kılavuzunu gösterir']
        ] }
      ],
      checks: [
        { q: 'Kernel ile shell arasındaki fark nedir?', a: 'Kernel, kaynakları yöneten işletim sistemi çekirdeğidir. Shell ise kullanıcının komutlarını alıp işletim sistemi servislerine ulaştıran programdır.' },
        { q: 'İçi dolu bir dizini hangi komutla silersin? rmdir neden yetmez?', a: 'rm -r dizin. rmdir yalnızca boş dizini siler.' }
      ]
    },
    {
      id: 'shell-izin',
      title: 'Dosya İzinleri ve chmod',
      en: 'File Permissions',
      src: `${SRC}, s. 4–5`,
      minutes: 6,
      blocks: [
        { t: 'h', text: 'ls -l çıktısını okumak' },
        { t: 'dg', id: 'lsl' },
        { t: 'p', html: 'İlk karakter <b>dosya türüdür</b>: <code>-</code> normal dosya, <code>d</code> dizin (directory), <code>l</code> sembolik bağ. Aynı klasörde bir dizin şöyle görünür: <code><b>d</b>rwxr-xr-x 2 ali ogr 4096 Oct 9 14:20 odevler</code>. Burada <code>d</code> girdinin dizin olduğunu, kalan dokuz karakter yine sahip, grup ve diğerlerinin izinlerini gösterir.' },
        { t: 'h', text: 'İzin sayıları' },
        { t: 'p', html: 'Her izinin bir değeri vardır: <b>r (okuma) = 4</b>, <b>w (yazma) = 2</b>, <b>x (çalıştırma) = 1</b>. Değerler toplanır ve sırasıyla sahip, grup, diğerleri için üç rakam oluşur. Kutuları değiştirip dene:' },
        { t: 'dg', id: 'chmod' },
        { t: 'h', text: 'Sembolik kullanım' },
        { t: 'table', head: ['Komut', 'Anlamı'], rows: [
          ['<code>chmod u+x dosya</code>', 'Sahibe çalıştırma izni ekler'],
          ['<code>chmod g-w dosya</code>', 'Grubun yazma iznini kaldırır'],
          ['<code>chmod o+r dosya</code>', 'Diğerlerine okuma izni ekler'],
          ['<code>chmod u=rwx,g=rx,o= dosya</code>', 'Sayısal karşılığı 750: <code>-rwxr-x---</code>']
        ] },
        { t: 'note', kind: 'exam', html: '<b>u</b> sahip (user), <b>g</b> grup, <b>o</b> diğerleri (others), <b>a</b> herkes (all). Sembolik yazımda virgülden sonra <b>boşluk bırakılmaz</b>. Örnek: 765 = sahip rwx, grup rw-, diğerleri r-x.' }
      ],
      checks: [
        { q: 'chmod 644 dosya ne anlama gelir?', a: 'Sahip okur ve yazar (6 = rw-), grup yalnızca okur (4 = r--), diğerleri yalnızca okur (4 = r--).' },
        { q: '-rwxr-x--- izninin sayısal karşılığı nedir?', a: '750. rwx = 7, r-x = 5, --- = 0.' },
        { q: 'Bir ls -l satırı drwxr-xr-x ile başlıyorsa baştaki d ne demektir?', a: 'Girdinin bir dizin (directory) olduğunu gösterir. Normal dosyada bu alan - olur (ör. -rwxr-x---).' }
      ]
    },
    {
      id: 'shell-script',
      title: 'Betik Yazmak: Değişken, echo, read',
      en: 'Writing Scripts',
      src: `${SRC}, s. 6–10`,
      minutes: 7,
      blocks: [
        { t: 'h', text: 'İlk betik' },
        { t: 'code', text: '#!/bin/bash\necho "Merhaba, Dünya!"' },
        { t: 'p', html: 'İlk satır (<b>shebang</b>) betiği hangi kabuğun çalıştıracağını söyler. Çalıştırmak için önce izin verilir: <code>chmod +x test.sh</code>, sonra <code>./test.sh</code>.' },
        { t: 'h', text: 'Değişkenler' },
        { t: 'code', text: 'isim="Ahmet"\nyas=30\nbos_degisken=\nikinci_sayi=$yas\ntarih=$(date)            # komutun çıktısını alır\nkullanici=$USER          # hazır ortam değişkeni\nmeyveler=("elma" "armut" "kiraz")\nunset yas                # değişkeni tamamen kaldırır' },
        { t: 'note', kind: 'exam', html: '<code>=</code> işaretinin iki yanında <b>boşluk olmaz</b>. <code>yas = 30</code> yazarsan kabuk <code>yas</code> adlı bir komut arar ve hata verir. Değeri okurken <code>$</code> kullanılır, atarken kullanılmaz.' },
        { t: 'h', text: 'echo ve tırnaklar' },
        { t: 'table', head: ['Komut', 'Çıktı veya etki'], rows: [
          ['<code>echo "Merhaba $isim"</code>', 'Merhaba Ahmet (çift tırnakta değişken açılır)'],
          ['<code>echo \'Merhaba $isim\'</code>', 'Merhaba $isim (tek tırnakta açılmaz)'],
          ['<code>echo -e "a\\nb"</code>', 'İki satır yazar: <code>-e</code> kaçış dizilerini işler'],
          ['<code>echo "metin" &gt; dosya</code>', 'Dosyanın <b>üzerine yazar</b>'],
          ['<code>echo "metin" &gt;&gt; dosya</code>', 'Dosyanın <b>sonuna ekler</b>']
        ] },
        { t: 'h', text: 'Aritmetik işlemler' },
        { t: 'code', text: 'a=5; b=3\necho $((a + b))     # 8\necho $((a * b))     # 15\necho $((a / b))     # 1  (tam sayı bölmesi)\necho $((a % b))     # 2\n\nsonuc=$(expr 5 \\* 3)   # 15, * işareti kaçırılır\nlet s=5+3              # 8' },
        { t: 'h', text: 'Kullanıcıdan bilgi almak' },
        { t: 'code', text: '#!/bin/bash\necho "Adınızı girin: "\nread isim\necho "Merhaba, $isim!"' }
      ],
      checks: [
        { q: 'echo "$isim" ile echo \'$isim\' arasındaki fark nedir?', a: 'Çift tırnakta değişkenin değeri yazılır. Tek tırnakta $isim metni olduğu gibi yazılır.' },
        { q: '> ile >> arasındaki fark nedir?', a: '> dosyanın üzerine yazar, >> sonuna ekler.' },
        { q: 'x = 5 satırı neden hata verir?', a: 'Atamada = işaretinin yanında boşluk olmaz. Kabuk x\'i komut sanar. Doğrusu x=5.' }
      ]
    },
    {
      id: 'shell-akis',
      title: 'Betikte Akış: if, Döngü, case, Fonksiyon',
      en: 'Control Flow',
      src: `${SRC}, s. 12–13, 16–19`,
      minutes: 7,
      blocks: [
        { t: 'h', text: 'Koşul: if' },
        { t: 'code', text: '#!/bin/bash\nsayi=10\nif [ $sayi -gt 5 ]; then\n    echo "Sayı 5\'ten büyük."\nelse\n    echo "Sayı 5\'ten küçük veya eşit."\nfi' },
        { t: 'p', html: 'Köşeli parantezlerin içinde <b>boşluk zorunludur</b>: <code>[ $sayi -gt 5 ]</code>.' },
        { t: 'h', text: 'Karşılaştırma işleçleri' },
        { t: 'table', head: ['Sayılar', 'Metinler', 'Dosyalar ve mantık'], rows: [
          ['<code>-eq</code> eşit', '<code>==</code> eşit', '<code>-e dosya</code> dosya var'],
          ['<code>-ne</code> eşit değil', '<code>!=</code> eşit değil', '<code>&amp;&amp;</code> ve'],
          ['<code>-lt</code>, <code>-le</code> küçük, küçük eşit', '<code>-z</code> boş', '<code>||</code> veya'],
          ['<code>-gt</code>, <code>-ge</code> büyük, büyük eşit', '<code>-n</code> boş değil', '<code>[ a ] &amp;&amp; [ b ]</code> birleştirme']
        ] },
        { t: 'h', text: 'Döngüler' },
        { t: 'code', text: 'for i in {1..5}\ndo\n    echo "Döngü adımı $i"\ndone\n\nwhile true\ndo\n    read sayi\n    if [ $sayi -eq 0 ]; then\n        echo "Çıkılıyor..."\n        break\n    fi\n    echo "Girdiğiniz sayı: $sayi"\ndone' },
        { t: 'h', text: 'Çoklu seçim: case' },
        { t: 'code', text: 'read -p "Bir meyve adı girin: " meyve\ncase $meyve in\n    "elma")  echo "Elma seçildi." ;;\n    "armut") echo "Armut seçildi." ;;\n    *)       echo "Tanınmayan meyve." ;;\nesac' },
        { t: 'p', html: '<code>;;</code> seçeneği bitirir, <code>*)</code> hiçbiri uymazsa çalışır, <code>esac</code> ise <code>case</code>\'i kapatır.' },
        { t: 'h', text: 'Fonksiyonlar' },
        { t: 'code', text: 'merhaba() {\n    echo "Merhaba, dünya!"\n}\nmerhaba     # parantezsiz çağrılır' },
        { t: 'h', text: 'Dosya var mı?' },
        { t: 'code', text: 'dosya="ornek.txt"\nif [ -e "$dosya" ]; then\n    echo "$dosya mevcut."\nelse\n    echo "$dosya mevcut değil."\nfi' }
      ],
      checks: [
        { q: 'Bash\'te iki sayının büyüklüğü hangi işleçle karşılaştırılır?', a: '-gt (büyük), -ge (büyük eşit), -lt (küçük), -le (küçük eşit). Örnek: [ $a -gt $b ].' },
        { q: 'case yapısında ;; ve *) ne işe yarar?', a: ';; bir seçeneği bitirir. *) hiçbir seçenek uymadığında çalışan varsayılan durumdur.' }
      ]
    },
    {
      id: 'shell-metin',
      title: 'Pipe ve Metin Araçları',
      en: 'Pipes & Text Tools',
      src: `${SRC}, s. 11, 13–14`,
      minutes: 6,
      blocks: [
        { t: 'def', term: 'Pipe', en: '|', html: 'Soldaki komutun <b>çıktısını</b> sağdaki komutun <b>girdisine</b> bağlar. Küçük komutlar birleşerek büyük işler yapar.' },
        { t: 'h', text: 'Örnek: kelime saymak' },
        { t: 'dg', id: 'pipe' },
        { t: 'h', text: 'Sık kullanılan araçlar' },
        { t: 'table', head: ['Komut', 'Görevi'], rows: [
          ['<code>grep \'kalıp\' dosya</code>', 'Kalıbı içeren satırları bulur (<code>^A</code>: A ile başlayan)'],
          ['<code>grep -c \'kalıp\' dosya</code>', 'Eşleşen <b>satır</b> sayısını verir'],
          ['<code>grep -o \'kalıp\' dosya</code>', 'Yalnızca eşleşen kısmı yazar'],
          ['<code>wc -l</code>', 'Satır sayar'],
          ['<code>ps aux | egrep root</code>', 'root\'un işlemlerini listeler']
        ] },
        { t: 'h', text: 'tr ile karakter dönüştürme' },
        { t: 'table', head: ['Komut (girdi: col1;col2)', 'Çıktı'], rows: [
          ['<code>tr a-z A-Z</code>', 'COL1;COL2'],
          ['<code>tr \';\' \',\'</code>', 'col1,col2'],
          ['<code>tr -d \';\'</code>', 'col1col2']
        ] },
        { t: 'h', text: 'sort ve uniq' },
        { t: 'p', html: '<code>sort</code> varsayılan olarak metin gibi sıralar: 10, 9\'dan önce gelir. Sayısal sıralama için <code>sort -n</code> kullanılır. <code>uniq -c</code> yan yana aynı satırları sayar; bu yüzden önce <code>sort</code> gerekir:' },
        { t: 'code', text: '$ cut -d\' \' -f1 ogrenciler.txt | sort | uniq -c\n      2 Ali\n      1 Ayse\n      1 Mehmet\n      1 Mert\n      1 Selin' }
      ],
      checks: [
        { q: 'Bir dosyada bir kelimenin kaç kez geçtiğini nasıl bulursun? Neden grep -c yetmez?', a: 'grep -o \'kelime\' dosya | wc -l. grep -c eşleşen satırları sayar; aynı satırdaki iki eşleşme tek sayılır.' },
        { q: 'uniq kullanmadan önce neden sort gerekir?', a: 'uniq yalnızca yan yana duran aynı satırları birleştirir.' }
      ]
    },
    {
      id: 'shell-pipe',
      title: 'Pipe ile Soru Çözme',
      en: 'Building Pipelines Step by Step',
      src: `${SRC} · Quiz 1 tipi`,
      minutes: 14,
      blocks: [
        { t: 'p', html: 'Bu konu <b>shell programlamadır</b> (Linux komut satırı); hocanın laboratuvar dokümanlarından gelir ve 10 Kasım quizinde soruldu: bir veri dosyası verilir, <code>cat</code> ve diğer komutları <code>|</code> ile bağlayıp istenen çıktıyı üretmen beklenir. Kavram olarak Bölüm 3\'teki <b>sıradan pipe\'ın (ordinary pipe)</b> kabuktaki karşılığıdır: her komut ayrı bir işlemdir ve pipe birinin çıktısını diğerinin girdisine bağlar.' },
        { t: 'h', text: 'Yöntem: soruyu adımlara çevir' },
        { t: 'list', ordered: true, items: [
          '<b>Veriye bak:</b> Ayırıcı ne (<code>;</code>, <code>,</code>, boşluk)? Hangi bilgi kaçıncı sütunda?',
          '<b>Süz:</b> Soru belli satırları mı istiyor? <code>grep \'kalıp\'</code> (içerenler) ya da <code>grep -v</code> (içermeyenler).',
          '<b>Sırala:</b> En yüksek / en düşük / alfabetik mi? <code>sort</code>, sayıysa <code>-n</code>, tersten <code>-r</code>, sütun <code>-t</code> ve <code>-k</code> ile.',
          '<b>Say veya kes:</b> Kaç tane? <code>wc -l</code>. Gruplara göre kaç tane? <code>sort | uniq -c</code>. İlk / son N? <code>head -N</code>, <code>tail -N</code>.',
          '<b>Biçimle:</b> Yalnızca bazı sütunlar mı? <code>cut -d\';\' -f1,4</code>. Ayırıcıyı değiştirmek? <code>tr \';\' \' \'</code>.'
        ] },
        { t: 'note', kind: 'exam', attach: true, html: 'Her adımı ayrı düşün ve <b>bir önceki adımın çıktısının neye benzediğini</b> kafanda yaz. Takılırsan pipe\'ı ortasından kes: <code>cat dosya | grep X</code> ne verir? Sonra bir komut daha ekle. <code>cat dosya | grep X</code> ile <code>grep X dosya</code> aynı sonucu verir.' },
        { t: 'h', text: 'Araç kutusu' },
        { t: 'table', head: ['Komut', 'Ne yapar', 'Örnek'], rows: [
          ['<code>cat</code>', 'Dosyayı akıtır', '<code>cat ogrenci.txt</code>'],
          ['<code>grep</code> / <code>grep -v</code>', 'Kalıbı içeren / içermeyen satırları bırakır', '<code>grep \'Ankara\'</code>'],
          ['<code>cut -d\'X\' -f</code>', 'X ile böler, istenen sütunları alır', '<code>cut -d\';\' -f1,4</code>'],
          ['<code>sort</code>', 'Sıralar. <code>-n</code> sayısal, <code>-r</code> ters, <code>-t</code> ayırıcı, <code>-k</code> sütun, <code>-u</code> tekrarsız', '<code>sort -t\';\' -k4 -nr</code>'],
          ['<code>uniq</code> / <code>uniq -c</code>', 'Yan yana aynıları birleştirir / sayar (önce sort!)', '<code>sort | uniq -c</code>'],
          ['<code>head -N</code> / <code>tail -N</code>', 'İlk / son N satır', '<code>head -3</code>'],
          ['<code>wc -l</code>', 'Satır sayar', '<code>grep X | wc -l</code>'],
          ['<code>tr \'a\' \'b\'</code>', 'Karakter değiştirir', '<code>tr \';\' \' \'</code>']
        ] },
        { t: 'h', text: 'Veri: ogrenci.txt' },
        { t: 'codex', title: 'Her satır bir öğrenci; sütunlar ";" ile ayrılmış', rows: [
          ['Ahmet;Istanbul;Bilgisayar;85\nZeynep;Ankara;Elektrik;72\nMehmet;Istanbul;Bilgisayar;64\nAyse;Izmir;Makine;91\nCan;Ankara;Bilgisayar;58\nElif;Istanbul;Elektrik;77\nBurak;Izmir;Bilgisayar;69', '<b>1. sütun</b> ad, <b>2.</b> şehir, <b>3.</b> bölüm, <b>4.</b> not. Ayırıcı ";" olduğu için <code>cut</code> ve <code>sort</code>\'a bunu söylemek gerekir: <code>-d\';\'</code> ve <code>-t\';\'</code>.']
        ] },
        { t: 'h', text: 'Alıştırmalar: önce kendin yaz, sonra çözümü aç' },
        { t: 'solve', title: 'Alıştırma 1', q: 'Dosyada kaç öğrenci var?', dg: 'px-say', a: '<code>cat ogrenci.txt | wc -l</code> → <b>7</b>' },
        { t: 'solve', title: 'Alıştırma 2', q: 'Ankara\'daki öğrencilerin yalnızca adlarını yazdır.', dg: 'px-ankara', a: '<code>cat ogrenci.txt | grep \'Ankara\' | cut -d\';\' -f1</code>' },
        { t: 'solve', title: 'Alıştırma 3 · quizdeki tip', q: 'Her şehirden kaç öğrenci olduğunu çoktan aza listele.', dg: 'px-sehir', a: '<code>cat ogrenci.txt | cut -d\';\' -f2 | sort | uniq -c | sort -nr</code>' },
        { t: 'h', text: 'En sık hata: sort olmadan uniq' },
        { t: 'dg', id: 'px-uniq-hata' },
        { t: 'solve', title: 'Alıştırma 4', q: 'Notu en düşük 2 öğrencinin adını ve notunu yazdır.', dg: 'px-dusuk', a: '<code>cat ogrenci.txt | sort -t\';\' -k4 -n | head -2 | cut -d\';\' -f1,4</code>' },
        { t: 'solve', title: 'Alıştırma 5', q: 'Bilgisayar bölümündeki öğrencileri nota göre büyükten küçüğe, "ad not" biçiminde yazdır.', dg: 'px-bilg', a: '<code>cat ogrenci.txt | grep \'Bilgisayar\' | sort -t\';\' -k4 -nr | cut -d\';\' -f1,4 | tr \';\' \' \'</code>' },
        { t: 'solve', title: 'Alıştırma 6', q: 'İstanbul dışındaki öğrenci sayısı kaç?', dg: 'px-haric', a: '<code>cat ogrenci.txt | grep -v \'Istanbul\' | wc -l</code> → <b>4</b>' }
      ],
      checks: [
        { q: 'uniq -c\'den önce neden sort gerekir?', a: 'uniq yalnızca yan yana duran aynı satırları birleştirir. sort aynıları yan yana getirmezse her satır ayrı sayılır.' },
        { q: 'sort -t\';\' -k4 -nr ne yapar?', a: 'Satırları ";" ile ayrılmış 4. sütuna göre sayısal olarak büyükten küçüğe sıralar.' },
        { q: 'Bir sütuna göre "en yüksek 3" istenirse pipe\'ın sonu nasıl olur?', a: 'O sütuna göre sort -nr (ayırıcı için -t, sütun için -k) ve ardından head -3.' }
      ]
    },
    {
      id: 'shell-awk',
      title: 'awk ile Sütun İşleme',
      en: 'Column Processing with awk',
      src: `${SRC}, s. 15 ve Lab Uygulaması`,
      minutes: 9,
      blocks: [
        { t: 'def', term: 'awk', en: 'desen { eylem }', html: 'Dosyayı <b>satır satır</b> okur ve her satırı sütunlara böler. <b>Desen</b> doğruysa <b>eylemi</b> çalıştırır. Eylem yazılmazsa satırı olduğu gibi yazar.' },
        { t: 'h', text: 'Temel yapı taşları' },
        { t: 'table', head: ['Yapı', 'Anlamı'], rows: [
          ['<code>$1</code>, <code>$2</code>, <code>$0</code>', 'Birinci ve ikinci sütun, satırın tamamı'],
          ['<code>-F \';\'</code>', 'Sütun ayırıcı (varsayılan: boşluk)'],
          ['<code>NR</code>', 'Okunan satırın numarası'],
          ['<code>/^A/</code>', 'A ile başlayan satırlar'],
          ['<code>END { }</code>', 'Tüm satırlar bittikten sonra bir kez çalışır'],
          ['<code>&amp;&amp;</code>, <code>||</code>', 'Koşulları birleştirir: ve, veya']
        ] },
        { t: 'h', text: 'Örnek veri: ogrenciler.txt' },
        { t: 'code', text: 'Ali 12 8\nAyse 25 9\nMehmet 18 11\nSelin 7 22\nAli 5 11\nMert 30 4' },
        { t: 'h', text: 'Sütunları yazdırmak ve hesaplamak' },
        { t: 'code', text: '$ awk \'{print $1, $2+$3}\' ogrenciler.txt\nAli 20\nAyse 34\nMehmet 29\nSelin 29\nAli 16\nMert 34\n\n$ awk \'{print $1": "$2+$3}\' ogrenciler.txt\nAli: 20\nAyse: 34\n...' },
        { t: 'h', text: 'Koşulla süzmek' },
        { t: 'code', text: '$ awk \'$2>=20 {print $1, $2}\' ogrenciler.txt\nAyse 25\nMert 30\n\n$ awk \'$3==11 {print $1}\' ogrenciler.txt\nMehmet\nAli\n\n$ awk \'$2>=10 && $2<=15 {print $1}\' ogrenciler.txt\nAli\n\n$ awk \'$2+$3>20\' ogrenciler.txt\nAyse 25 9\nMehmet 18 11\nSelin 7 22\nMert 30 4' },
        { t: 'h', text: 'Toplam, ortalama ve en küçük değer' },
        { t: 'p', html: 'Değişkenler ilk kullanımda 0 kabul edilir ve satırlar boyunca değerini korur. Sonuç <code>END</code> içinde yazdırılır:' },
        { t: 'code', text: '$ awk \'{t+=$2} END {print t, t/NR}\' ogrenciler.txt\n97 16.1667\n\n$ awk \'NR==1 || $2<min {min=$2; ad=$1} END {print ad, min}\' ogrenciler.txt\nAli 5' },
        { t: 'h', text: 'Saymak: diziler' },
        { t: 'p', html: 'awk dizilerinin indisi metin olabilir. <code>say[$1]++</code> her ismin kaç kez geçtiğini tutar:' },
        { t: 'code', text: '$ awk \'{say[$1]++} END {for (ad in say) if (say[ad]==2) print ad, say[ad]}\' ogrenciler.txt\nAli 2' },
        { t: 'h', text: 'Sonucu dosyaya yazmak ve saymak' },
        { t: 'p', html: 'Çıktı <code>&gt;</code> ile dosyaya yönlendirilir, satır sayısı <code>wc -l</code> ile bulunur:' },
        { t: 'code', text: '$ awk \'/^A/ && $2>3 && $3<10\' ogrenciler.txt > sonuc.txt\n$ cat sonuc.txt\nAli 12 8\nAyse 25 9\n$ wc -l < sonuc.txt\n2\n\n$ awk \'/^M/ && $2+$3<30 {n++; print} END {print "Toplam:", n+0}\' ogrenciler.txt\nMehmet 18 11\nToplam: 1' },
        { t: 'note', kind: 'exam', html: 'Sütunlar noktalı virgülle ayrılmışsa <code>-F \';\'</code> şarttır, yoksa tüm satır tek sütun olur. Laboratuvar slaytındaki <code>int($2)&gt;3</code> kullanımı metni tam sayıya çevirir; saf sayısal sütunlarda <code>$2&gt;3</code> de aynı sonucu verir. <code>n+0</code>, hiç eşleşme yoksa boş yerine 0 yazdırır.' }
      ],
      checks: [
        { q: 'awk\'ta $0, $1 ve NR neyi ifade eder?', a: '$0 satırın tamamı, $1 birinci sütun, NR o anki satır numarasıdır.' },
        { q: 'Tüm satırları okuduktan sonra toplamı yazdırmak için hangi blok kullanılır?', a: 'END bloğu. Örnek: awk \'{t+=$2} END {print t}\' dosya' },
        { q: 'A ile başlayan ve ikinci sütunu 3\'ten büyük satırları dosyaya nasıl yazarsın?', a: 'awk \'/^A/ && $2>3\' veri.txt > sonuc.txt' }
      ]
    }
  ];

  const ch2 = OSLab.lessons.chapters.find((c) => c.id === 'ch2');
  const after = ch2.lessons.findIndex((l) => l.id === 'arayuz');
  ch2.lessons.splice(after + 1, 0, ...lessons);
  ch2.objectives.push('Temel shell komutlarını, dosya izinlerini ve awk ile metin işlemeyi kullanmak');
})(window.OSLab = window.OSLab || {});
