/*
 * app.js — Uygulama kabuğu: hash tabanlı yönlendirme, kenar menü, durum göstergesi
 * ve "Bilgi & Sınav Paneli".
 */
(function (OSLab) {
  'use strict';

  const DEFAULT_ROUTE = 'scheduling';
  const STATUS = {
    ready: { text: 'SIM READY', cls: 'ok' },
    running: { text: 'RUNNING', cls: 'busy' },
    done: { text: 'COMPLETED', cls: 'done' },
    paused: { text: 'PAUSED', cls: 'paused' },
    alert: { text: 'DATA CORRUPTED', cls: 'alert' },
    deadlock: { text: 'DEADLOCK', cls: 'alert' },
    fault: { text: 'PROCESS KILLED', cls: 'alert' },
    panic: { text: 'KERNEL PANIC', cls: 'alert' },
    standby: { text: 'STANDBY', cls: '' }
  };

  const els = {};
  let current = null;

  /* ------------------------------------------------------------ yönlendirme */

  function parseRoute() {
    const id = location.hash.replace(/^#\/?/, '');
    return OSLab.modules[id] ? id : DEFAULT_ROUTE;
  }

  function route() {
    const id = parseRoute();
    if (id === current) return;
    if (current) OSLab.modules[current].unmount();
    current = id;

    const mod = OSLab.modules[id];
    document.querySelectorAll('.nav-item').forEach((a) => {
      const active = a.dataset.route === id;
      a.classList.toggle('active', active);
      if (active) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    });
    els.num.textContent = mod.num;
    els.title.textContent = mod.title;
    els.sub.textContent = mod.subtitle;
    document.title = `${mod.title} · OS Interactive Lab`;
    setStatus('standby');

    Info.render(id, mod);
    els.view.scrollTop = 0;
    mod.mount(els.view);
    toggleSidebar(false);
  }

  function setStatus(key) {
    const s = STATUS[key] || STATUS.standby;
    els.status.className = `status ${s.cls}`;
    els.statusText.textContent = s.text;
  }

  function toggleSidebar(open) {
    els.sidebar.classList.toggle('open', open);
    els.scrim.classList.toggle('show', open);
    els.menuBtn.setAttribute('aria-expanded', String(open));
  }

  /* ------------------------------------------------------------ bilgi & sınav paneli */

  const Info = {
    data: null,

    render(id, mod) {
      const data = this.data = OSLab.info[id] || { theory: [], exam: [] };
      els.infoModule.textContent = `${mod.num} · ${mod.title}`;
      els.examCount.textContent = data.exam.length;

      els.theory.innerHTML = data.theory.map((sec, i) => `
        <details class="theory" data-section="${sec.id}" data-kind="${sec.kind || ''}"${i === 0 ? ' open' : ''}>
          <summary>${sec.title}</summary>
          <div class="theory-body">${sec.html}</div>
        </details>`).join('');

      els.exam.innerHTML = data.exam.length
        ? data.exam.map((q, i) => `
          <article class="q-card">
            <div class="q-meta"><span class="q-num">S${i + 1}</span><span class="q-topic">${q.topic}</span></div>
            <div class="q-text">${q.q}</div>
            <div class="q-actions">
              <button class="btn btn-sm" type="button" data-action="answer" aria-expanded="false">Cevabı Göster</button>
              ${q.preset ? `<button class="btn btn-sm btn-ghost" type="button" data-action="try" data-index="${i}">▶ Simülatörde Dene</button>` : ''}
            </div>
            <div class="q-answer" hidden>${q.a}</div>
          </article>`).join('')
        : '<p class="empty">Bu modülün sınav soruları modülle birlikte eklenecek.</p>';
    },

    // Seçili algoritmanın/konunun teori bölümünü açıp vurgular; diğer odak bölümlerini kapatır
    focus(sectionId) {
      els.theory.querySelectorAll('details.theory').forEach((d) => {
        const match = d.dataset.section === sectionId;
        d.classList.toggle('focus', match);
        if (match) d.open = true;
        else if (d.dataset.kind === 'algo') d.open = false;
      });
    },

    setTab(tab) {
      els.tabs.forEach((t) => {
        const active = t.dataset.tab === tab;
        t.classList.toggle('active', active);
        t.setAttribute('aria-selected', String(active));
      });
      els.theory.hidden = tab !== 'theory';
      els.exam.hidden = tab !== 'exam';
    },

    toggle(open) {
      const isOpen = open === undefined ? !els.panel.classList.contains('open') : open;
      els.panel.classList.toggle('open', isOpen);
      els.panel.setAttribute('aria-hidden', String(!isOpen));
      els.fab.setAttribute('aria-expanded', String(isOpen));
      if (isOpen) els.panel.querySelector('.info-close').focus({ preventScroll: true });
    }
  };

  function onExamClick(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    if (btn.dataset.action === 'answer') {
      const answer = btn.closest('.q-card').querySelector('.q-answer');
      answer.hidden = !answer.hidden;
      btn.textContent = answer.hidden ? 'Cevabı Göster' : 'Cevabı Gizle';
      btn.setAttribute('aria-expanded', String(!answer.hidden));
    } else if (btn.dataset.action === 'try') {
      loadPreset(Info.data.exam[Number(btn.dataset.index)].preset);
    }
  }

  // preset.module belirtilmezse CPU Scheduling varsayılır
  function loadPreset(preset) {
    const target = preset.module || 'scheduling';
    if (current !== target) {
      location.hash = '#/' + target;
      route();
    }
    Info.toggle(false);
    OSLab.modules[target].loadPreset(preset);
  }

  /* ------------------------------------------------------------ başlatma */

  function init() {
    const byId = (id) => document.getElementById(id);
    Object.assign(els, {
      view: byId('view'),
      sidebar: byId('sidebar'),
      scrim: byId('scrim'),
      menuBtn: byId('menu-btn'),
      num: byId('page-num'),
      title: byId('page-title'),
      sub: byId('page-sub'),
      status: byId('status'),
      statusText: byId('status-text'),
      fab: byId('info-fab'),
      panel: byId('info-panel'),
      infoModule: byId('info-module'),
      examCount: byId('exam-count'),
      theory: byId('info-theory'),
      exam: byId('info-exam'),
      tabs: document.querySelectorAll('.info-tab')
    });

    els.menuBtn.addEventListener('click', () => toggleSidebar(!els.sidebar.classList.contains('open')));
    els.scrim.addEventListener('click', () => toggleSidebar(false));
    els.fab.addEventListener('click', () => Info.toggle());
    els.panel.querySelector('.info-close').addEventListener('click', () => Info.toggle(false));
    els.tabs.forEach((t) => t.addEventListener('click', () => Info.setTab(t.dataset.tab)));
    els.exam.addEventListener('click', onExamClick);

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        Info.toggle(false);
        toggleSidebar(false);
      }
      const typing = /^(INPUT|SELECT|TEXTAREA)$/.test(document.activeElement.tagName);
      if (!typing && !e.ctrlKey && !e.metaKey && !e.altKey && e.key.toLowerCase() === 'i') Info.toggle();
    });

    window.addEventListener('hashchange', route);
    Info.setTab('theory');
    route();
  }

  OSLab.app = { setStatus, focusInfo: (id) => Info.focus(id), loadPreset };

  init();
})(window.OSLab = window.OSLab || {});
