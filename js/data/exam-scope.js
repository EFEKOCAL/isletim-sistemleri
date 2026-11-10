/*
 * exam-scope.js — Yaklaşan sınavın kapsamı.
 * Hocanın işlemediği ve sınava girmeyen dersler burada işaretlenir; site bu derslere,
 * kartlarına, sorularına ve üstteki ilerleme çubuğuna "vize dışı" uyarısı koyar.
 * Sınavdan sonra "active: false" yapmak tüm uyarıları kaldırır.
 *
 *   lessons:  '<bölüm>/<ders>': true                → dersin tamamı kapsam dışı
 *             '<bölüm>/<ders>': { from: 'Başlık' }  → o başlıktan sonraki kısım kapsam dışı
 *   chapters: '<bölüm>': true                       → bölümün tamamı kapsam dışı
 */
(function (OSLab) {
  'use strict';

  OSLab.examScope = {
    active: true,
    exam: 'Vize',
    label: 'Vize dışı',
    updated: '10 Kasım 2026',
    reason: {
      ch4: 'Hoca 4. bölümü slayt 4.26\'ya kadar işledi; sonrası vizeye dahil değil.',
      ch7: 'Hoca 7. PDF\'e (Senkronizasyon Örnekleri) başlamadı; vizeye dahil değil.'
    },
    lessons: {
      // from: bu başlıktan itibaren dışarıda; partial: bu başlıklı kartta yalnızca bir kısım dışarıda;
      // checks: dışarıda kalan "Kendini yokla" sorularının sırası (0'dan)
      'ch4/kutuphaneler': {
        from: 'Java',
        partial: 'Windows',
        partialNote: 'Hoca bu örneğin ilk yarısını (slayt 4.26, Summation fonksiyonu) işledi; <b>main kısmı (slayt 4.27) vize dışı</b>.',
        summary: 'Java ve Java Executor kısımları (slayt 4.27 – 4.32) vize dışı.',
        checks: [1]
      },
      'ch4/ortuk': true,
      'ch4/sorunlar': true,
      'ch4/os-thread': true
    },
    chapters: {
      ch7: true
    }
  };
})(window.OSLab = window.OSLab || {});
