/*
 * shell-engine.js — Shell Atölyesi için tarayıcıda çalışan küçük bir bash.
 *
 * Sanal bir dosya sistemi üzerinde çalışır. Derste (Shell Programlama, LAB 115) geçen her şeyi
 * destekler: pipe ve yönlendirme, değişkenler, diziler, $(( )), $( ), tırnaklar, if / for /
 * while / case / fonksiyon, betik çalıştırma (./betik.sh, bash betik.sh) ve ls, cd, mkdir,
 * chmod, cat, echo, read, grep, wc, tr, sort, uniq, cut, head, tail, awk, ps gibi komutlar.
 * Hata iletileri gerçek bash ve GNU araçlarınınkiyle aynı tutulmuştur; öğrenci terminalde
 * gördüğü hatayı laboratuvarda da görür.
 *
 * Etkileşimli girdi (read, girdisiz cat): Motor eşzamanlı çalışır. Girdi gerektiğinde
 * NeedInput fırlatılır; arayüz durumu geri yükler, satırı kuyruğa ekler ve komutu baştan
 * çalıştırır. Motor belirlenimci olduğu için sonuç gerçek bir terminaldekiyle aynıdır.
 */
(function (OSLab) {
  'use strict';

  /* ================================================================ yardımcılar */

  class SyntaxErr extends Error { constructor(msg, line) { super(msg); this.line = line || 1; } }
  class RunErr extends Error {}
  class Flow { constructor(kind, n) { this.kind = kind; this.n = n; } }
  class NeedInput {}
  class Limit { constructor(what) { this.what = what; } }

  const USER = 'ogrenci';
  const HOST = 'oslab';
  const MAX_STEPS = 20000;
  const MAX_OUT = 200000;

  const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
  const utf8Len = (s) => new TextEncoder().encode(s).length;
  const collator = new Intl.Collator('en');
  const collate = (a, b) => collator.compare(a, b) || (a < b ? -1 : a > b ? 1 : 0);
  const isName = (s) => /^[A-Za-z_][A-Za-z0-9_]*$/.test(s);

  function splitLines(data) {
    if (!data) return [];
    const s = data.endsWith('\n') ? data.slice(0, -1) : data;
    return s.split('\n');
  }
  const joinLines = (lines) => (lines.length ? lines.join('\n') + '\n' : '');

  // ( ile başlayan bir yerin eşi olan ) indeksini bulur; tırnakları atlar
  function matchParen(src, i) {
    let depth = 0;
    for (let j = i; j < src.length; j++) {
      const c = src[j];
      if (c === '\\') { j++; continue; }
      if (c === "'") { const k = src.indexOf("'", j + 1); if (k < 0) break; j = k; continue; }
      if (c === '"') { j = skipDq(src, j + 1) - 1; continue; }
      if (c === '(') depth++;
      else if (c === ')' && --depth === 0) return j;
    }
    throw new SyntaxErr("unexpected EOF while looking for matching `)'");
  }

  // Çift tırnağın içinden geçer; kapanış tırnağından sonraki indeksi döndürür
  function skipDq(src, j) {
    for (; j < src.length; j++) {
      const c = src[j];
      if (c === '\\') { j++; continue; }
      if (c === '"') return j + 1;
      if (c === '$' && src[j + 1] === '(') { j = matchParen(src, j + 1); continue; }
      if (c === '`') { const k = src.indexOf('`', j + 1); if (k < 0) break; j = k; }
    }
    throw new SyntaxErr('unexpected EOF while looking for matching `"\'');
  }

  function processEscapes(s, stopAtC) {
    let out = '';
    for (let i = 0; i < s.length; i++) {
      const c = s[i];
      if (c !== '\\' || i === s.length - 1) { out += c; continue; }
      const d = s[++i];
      const map = { n: '\n', t: '\t', '\\': '\\', a: '\x07', b: '\b', e: '\x1b', f: '\f', r: '\r', v: '\v' };
      if (d in map) out += map[d];
      else if (d === 'c' && stopAtC) return { s: out, stop: true };
      else if (d === '0') { const m = /^[0-7]{0,3}/.exec(s.slice(i + 1))[0]; out += String.fromCharCode(parseInt(m || '0', 8)); i += m.length; }
      else if (d === 'x') { const m = /^[0-9a-fA-F]{1,2}/.exec(s.slice(i + 1)); if (m) { out += String.fromCharCode(parseInt(m[0], 16)); i += m[0].length; } else out += '\\x'; }
      else out += '\\' + d;
    }
    return stopAtC ? { s: out, stop: false } : out;
  }

  /* ---------------------------------------------------------- printf biçimlendirme */

  function gFormat(x, P, alt) {
    if (P === 0) P = 1;
    if (x === 0) return '0';
    const X = Number(x.toExponential(P - 1).split('e')[1]);
    let s;
    if (X < -4 || X >= P) {
      s = x.toExponential(P - 1);
      let [m, e] = s.split('e');
      if (!alt && m.includes('.')) m = m.replace(/\.?0+$/, '');
      const en = Number(e);
      s = m + 'e' + (en < 0 ? '-' : '+') + String(Math.abs(en)).padStart(2, '0');
    } else {
      s = x.toFixed(Math.max(0, P - 1 - X));
      if (!alt && s.includes('.')) s = s.replace(/\.?0+$/, '');
    }
    return s;
  }

  function formatf(f, args, toNum, toStr) {
    const re = /%([-+ 0#]*)(\*|\d+)?(?:\.(\*|\d*))?([diouxXeEfgGcs%])/g;
    let ai = 0; let out = ''; let last = 0; let m;
    while ((m = re.exec(f))) {
      out += f.slice(last, m.index); last = re.lastIndex;
      const [, flags, w0, p0, conv] = m;
      if (conv === '%') { out += '%'; continue; }
      let width = w0 === '*' ? Math.trunc(toNum(args[ai++])) : (w0 ? Number(w0) : 0);
      const prec = p0 === '*' ? Math.trunc(toNum(args[ai++])) : (p0 !== undefined ? Number(p0 || 0) : undefined);
      const arg = args[ai++];
      let left = flags.includes('-');
      if (width < 0) { left = true; width = -width; }
      let s; let numeric = true;
      const sign = (neg) => (neg ? '-' : flags.includes('+') ? '+' : flags.includes(' ') ? ' ' : '');
      switch (conv) {
        case 'd': case 'i': case 'u': {
          const n = Math.trunc(toNum(arg)) || 0;
          s = String(Math.abs(n)); if (prec !== undefined) s = s.padStart(prec, '0');
          s = sign(n < 0) + s; break;
        }
        case 'o': s = (Math.trunc(toNum(arg)) >>> 0).toString(8); break;
        case 'x': s = (Math.trunc(toNum(arg)) >>> 0).toString(16); break;
        case 'X': s = (Math.trunc(toNum(arg)) >>> 0).toString(16).toUpperCase(); break;
        case 'f': case 'e': case 'E': case 'g': case 'G': {
          const n = toNum(arg); const pr = prec === undefined ? 6 : prec; const a = Math.abs(n);
          if (conv === 'f') s = a.toFixed(pr);
          else if (conv === 'e' || conv === 'E') {
            const [mm, e] = a.toExponential(pr).split('e'); const en = Number(e);
            s = mm + 'e' + (en < 0 ? '-' : '+') + String(Math.abs(en)).padStart(2, '0');
          } else s = gFormat(a, pr, flags.includes('#'));
          if (conv === 'E' || conv === 'G') s = s.toUpperCase();
          s = sign(n < 0 || Object.is(n, -0)) + s; break;
        }
        case 'c': numeric = false; s = typeof arg === 'number' ? String.fromCharCode(arg) : (toStr(arg)[0] || ''); break;
        default: numeric = false; s = toStr(arg); if (prec !== undefined) s = s.slice(0, prec);
      }
      if (s.length < width) {
        if (left) s = s.padEnd(width);
        else if (numeric && flags.includes('0')) { const sg = /^[-+ ]/.test(s) ? s[0] : ''; s = sg + s.slice(sg.length).padStart(width - sg.length, '0'); }
        else s = s.padStart(width);
      }
      out += s;
    }
    return { out: out + f.slice(last), used: ai };
  }

  /* ---------------------------------------------------------- düzenli ifadeler */

  const CLASSES = { alpha: 'A-Za-z', digit: '0-9', alnum: 'A-Za-z0-9', upper: 'A-Z', lower: 'a-z', space: ' \\t\\n\\r\\f\\v', blank: ' \\t', punct: '!-\\/:-@\\[-`{-~', xdigit: '0-9A-Fa-f' };

  // [ ... ] köşeli ifadesinin bittiği indeksin bir sonrası
  function bracketEnd(p, i) {
    let j = i + 1;
    if (p[j] === '^') j++;
    if (p[j] === ']') j++;
    while (j < p.length && p[j] !== ']') {
      if (p[j] === '[' && p[j + 1] === ':') { const k = p.indexOf(':]', j + 2); j = k < 0 ? j + 1 : k + 2; continue; }
      j++;
    }
    return j < p.length ? j + 1 : -1;
  }
  function convertBracket(b) {
    let inner = b.slice(1, -1); let neg = '';
    if (inner[0] === '^') { neg = '^'; inner = inner.slice(1); }
    let out = '';
    for (let i = 0; i < inner.length; i++) {
      if (inner[i] === '[' && inner[i + 1] === ':') {
        const k = inner.indexOf(':]', i + 2);
        if (k > 0) { const name = inner.slice(i + 2, k); out += CLASSES[name] || ''; i = k + 1; continue; }
      }
      const c = inner[i];
      out += (c === '\\' || c === ']' || (c === '[')) ? '\\' + c : c;
    }
    return '[' + neg + out + ']';
  }
  // POSIX düzenli ifadesini (BRE veya ERE) JavaScript'e çevirir
  function posixRe(p, ere) {
    let o = '';
    for (let i = 0; i < p.length; i++) {
      const c = p[i];
      if (c === '\\' && i + 1 < p.length) {
        const d = p[++i];
        if (!ere && '(){}|+?'.includes(d)) o += d;
        else if (d === '<' || d === '>') o += '\\b';
        else o += '\\' + d;
        continue;
      }
      if (c === '[') {
        const j = bracketEnd(p, i);
        if (j < 0) throw new Error('Unmatched [, [^, [:, [., or [=');
        o += convertBracket(p.slice(i, j)); i = j - 1; continue;
      }
      if (!ere && '(){}|+?'.includes(c)) { o += '\\' + c; continue; }
      if (c === '/') { o += '\\/'; continue; }
      o += c;
    }
    return o;
  }

  /* ================================================================ dosya sistemi */

  function dirNode(mode, t) { return { t: 'd', kids: {}, mode: mode === undefined ? 0o755 : mode, mtime: t }; }
  function fileNode(data, mode, t) { return { t: 'f', data: data || '', mode: mode === undefined ? 0o644 : mode, mtime: t }; }

  const FILES = {
    'ogrenci.txt': 'Ahmet;Istanbul;Bilgisayar;85\nZeynep;Ankara;Elektrik;72\nMehmet;Istanbul;Bilgisayar;64\nAyse;Izmir;Makine;91\nCan;Ankara;Bilgisayar;58\nElif;Istanbul;Elektrik;77\nBurak;Izmir;Bilgisayar;69\n',
    'ogrenciler.txt': 'Ali 12 8\nAyse 25 9\nMehmet 18 11\nSelin 7 22\nAli 5 11\nMert 30 4\n',
    'birdosya.txt': 'ahmet;4;1\nahmet;3;2\nahmet;2;3\nahmet;1;4\nahmet;0;5\n',
    'metin.txt': 'kabuk kullanici ile cekirdek arasinda durur\nbash en yaygin kabuk programidir\nkabuk komutlari okur ve kabuk betiklerini calistirir\ncsh ve ksh de birer kabuk ornegidir\ncekirdek dosya ve islem yonetimi yapar\n',
    'rapor.txt': 'Haftalik rapor: tum testler gecti.\n',
    'paylas.txt': 'Grup calismasi notlari\n',
    'betik.sh': '#!/bin/bash\necho "Merhaba, Dünya!"\n'
  };
  const MODES = { 'paylas.txt': 0o660 };
  const NOTES = {
    'ders1.txt': 'Kernel: dosya, islem, bellek ve aygit yonetimi\n',
    'ders2.txt': 'Shell: bash, csh, ksh\n',
    'odev.md': '# Odev\nls -l ciktisini yorumla\n'
  };
  const SCRIPTS = {
    'ad.sh': '#!/bin/bash\necho "Adınızı girin: "\nread isim\necho "Merhaba, $isim!"\n',
    'kontrol.sh': '#!/bin/bash\nsayi=10\nif [$sayi -gt 5]; then\n    echo "Sayı 5\'ten büyük."\nelse\n    echo "Sayı 5\'ten küçük veya eşit."\nfi\n',
    'dongu.sh': '#!/bin/bash\nfor i in {1..5}\ndo\n    echo "Döngü adımı $i"\ndone\n',
    'sayac.sh': '#!/bin/bash\necho "Bir sayı girin (0 çıkış yapar):"\nwhile true\ndo\n    read sayi\n    if [ $sayi -eq 0 ]; then\n        echo "Çıkılıyor..."\n        break\n    fi\n    echo "Girdiğiniz sayı: $sayi"\ndone\n',
    'meyve.sh': '#!/bin/bash\nread -p "Bir meyve adı girin: " meyve\ncase $meyve in\n    "elma")\n        echo "Elma seçildi."\n        ;;\n    "armut")\n        echo "Armut seçildi."\n        ;;\n    *)\n        echo "Tanınmayan meyve."\n        ;;\nesac\n',
    'varmi.sh': '#!/bin/bash\ndosya="ornek.txt"\nif [ -e "$dosya" ]; then\n    echo "$dosya mevcut."\nelse\n    echo "$dosya mevcut değil."\nfi\n'
  };

  function defaultFs(t) {
    const root = dirNode(0o755, t);
    const mk = (parent, name, mode) => (parent.kids[name] = dirNode(mode, t));
    const home = mk(mk(root, 'home'), USER);
    mk(root, 'tmp', 0o777);
    const etc = mk(root, 'etc');
    etc.kids.hostname = fileNode(HOST + '\n', 0o644, t);
    etc.kids.passwd = fileNode('root:x:0:0:root:/root:/bin/bash\nogrenci:x:1000:1000:Ogrenci:/home/ogrenci:/bin/bash\n', 0o644, t);
    const bin = mk(root, 'bin');
    ['bash', 'ls', 'cat', 'grep', 'sort', 'awk'].forEach((n) => { bin.kids[n] = fileNode('', 0o755, t); });
    for (const [n, d] of Object.entries(FILES)) home.kids[n] = fileNode(d, MODES[n], t);
    const notlar = mk(home, 'notlar');
    for (const [n, d] of Object.entries(NOTES)) notlar.kids[n] = fileNode(d, 0o644, t);
    const bet = mk(home, 'betikler');
    for (const [n, d] of Object.entries(SCRIPTS)) bet.kids[n] = fileNode(d, 0o755, t);
    return root;
  }

  function cloneTree(n) {
    if (n.t === 'f') return { t: 'f', data: n.data, mode: n.mode, mtime: n.mtime };
    const d = { t: 'd', kids: {}, mode: n.mode, mtime: n.mtime };
    for (const k in n.kids) d.kids[k] = cloneTree(n.kids[k]);
    return d;
  }

  /* ================================================================ girdi akışları */

  class Stream {
    constructor(s) { this.s = s || ''; this.p = 0; }
    readLine() {
      if (this.p >= this.s.length) return null;
      const j = this.s.indexOf('\n', this.p);
      let line;
      if (j < 0) { line = this.s.slice(this.p); this.p = this.s.length; } else { line = this.s.slice(this.p, j); this.p = j + 1; }
      return line;
    }
    readAll() { const r = this.s.slice(this.p); this.p = this.s.length; return r; }
  }

  // Terminal: satırlar arayüzün kuyruğundan gelir; bittiğinde NeedInput (null = Ctrl+D)
  class TtyStream {
    constructor(ctx) { this.ctx = ctx; this.tty = true; }
    readLine() {
      const c = this.ctx;
      if (c.ttyPos >= c.tty.length) throw new NeedInput();
      const l = c.tty[c.ttyPos++];
      if (l === null) return null;
      c.push('in', l + '\n');
      return l;
    }
    readAll() {
      const lines = [];
      for (;;) { const l = this.readLine(); if (l === null) break; lines.push(l); }
      return joinLines(lines);
    }
  }

  /* ================================================================ sözcük ayırıcı */

  const OPS = ['2>&1', '&>>', '2>>', '&&', '||', ';;', '>>', '&>', '2>', '|', ';', '&', '>', '<', '(', ')', '\n'];
  const REDIR = new Set(['>', '>>', '<', '2>', '2>>', '&>', '&>>', '2>&1']);

  function lex(src) {
    const toks = []; let i = 0; let line = 1; const n = src.length;
    while (i < n) {
      const c = src[i];
      if (c === ' ' || c === '\t' || c === '\r') { i++; continue; }
      if (c === '\\' && src[i + 1] === '\n') { i += 2; line++; continue; }
      if (c === '#') { while (i < n && src[i] !== '\n') i++; continue; }
      let op = null;
      for (const o of OPS) if (src.startsWith(o, i)) { op = o; break; }
      if (op) { toks.push({ op, line }); if (op === '\n') line++; i += op.length; continue; }
      let j = i;
      try {
        while (j < n) {
          const d = src[j];
          if (d === ' ' || d === '\t' || d === '\n' || d === '\r') break;
          if ('|&;<>()'.includes(d)) {
            if (d === '(' && /^[A-Za-z_][A-Za-z0-9_]*(\[[^\]]*\])?\+?=$/.test(src.slice(i, j))) { j = matchParen(src, j) + 1; continue; }
            break;
          }
          if (d === '\\') { j += 2; continue; }
          if (d === "'") { const k = src.indexOf("'", j + 1); if (k < 0) throw new SyntaxErr("unexpected EOF while looking for matching `''"); j = k + 1; continue; }
          if (d === '"') { j = skipDq(src, j + 1); continue; }
          if (d === '`') { const k = src.indexOf('`', j + 1); if (k < 0) throw new SyntaxErr('unexpected EOF while looking for matching ``\''); j = k + 1; continue; }
          if (d === '$' && src[j + 1] === '(') { j = matchParen(src, j + 1) + 1; continue; }
          if (d === '$' && src[j + 1] === '{') { const k = src.indexOf('}', j); if (k < 0) throw new SyntaxErr('unexpected EOF while looking for matching `}\''); j = k + 1; continue; }
          j++;
        }
      } catch (e) { if (e instanceof SyntaxErr) e.line = line; throw e; }
      const w = src.slice(i, Math.min(j, n));
      toks.push({ w, line });
      line += (w.match(/\n/g) || []).length;
      i = j;
    }
    return toks;
  }

  /* ================================================================ ayrıştırıcı */

  class Parser {
    constructor(toks) { this.t = toks; this.i = 0; }
    peek(o) { return this.t[this.i + (o || 0)]; }
    op(o) { const k = this.peek(); return !!k && k.op === o; }
    word(w) { const k = this.peek(); return !!k && k.w === w; }
    err(tok) {
      if (!tok) { const l = this.t.length ? this.t[this.t.length - 1].line : 1; throw new SyntaxErr('syntax error: unexpected end of file', l); }
      const s = tok.op === '\n' ? 'newline' : (tok.op !== undefined ? tok.op : tok.w);
      throw new SyntaxErr(`syntax error near unexpected token \`${s}'`, tok.line);
    }
    eat(o) { if (!this.op(o)) this.err(this.peek()); this.i++; }
    eatW(w) { if (!this.word(w)) this.err(this.peek()); this.i++; }
    nl() { while (this.op('\n')) this.i++; }

    all() { const l = this.list([]); if (this.i < this.t.length) this.err(this.peek()); return l; }

    // Betikler satır satır çalışır: bir sonraki tam komut (yoksa null)
    next() {
      this.nl();
      if (this.i >= this.t.length) return null;
      const c = this.andOr();
      const k = this.peek();
      if (k && (k.op === ';' || k.op === '\n' || k.op === '&')) this.i++;
      else if (k) this.err(k);
      return c;
    }

    list(stops) {
      const items = [];
      for (;;) {
        this.nl();
        const k = this.peek();
        if (!k) break;
        if (k.w !== undefined && stops.includes(k.w)) break;
        if (k.op === ')' || k.op === ';;') break;
        items.push(this.andOr());
        const s = this.peek();
        if (!s) break;
        if (s.op === ';' || s.op === '\n' || s.op === '&') { this.i++; continue; }
        if (s.op === ')' || s.op === ';;') break;
        this.err(s);
      }
      return items;
    }
    body(stops) { const l = this.list(stops); if (!l.length) this.err(this.peek()); return l; }

    andOr() {
      const first = this.pipeline(); const rest = [];
      while (this.op('&&') || this.op('||')) { const op = this.peek().op; this.i++; this.nl(); rest.push({ op, p: this.pipeline() }); }
      return { first, rest };
    }
    pipeline() {
      let bang = false;
      if (this.word('!')) { bang = true; this.i++; }
      const cmds = [this.command()];
      while (this.op('|')) { this.i++; this.nl(); cmds.push(this.command()); }
      return { cmds, bang };
    }
    command() {
      const k = this.peek();
      if (!k) this.err(null);
      if (k.op === '(') { this.i++; const body = this.body([]); this.eat(')'); return this.redirs({ type: 'subshell', body }); }
      if (k.op !== undefined && !REDIR.has(k.op)) this.err(k);
      switch (k.w) {
        case 'if': return this.redirs(this.ifCmd());
        case 'for': return this.redirs(this.forCmd());
        case 'while': case 'until': return this.redirs(this.whileCmd());
        case 'case': return this.redirs(this.caseCmd());
        case '{': { this.i++; const body = this.body(['}']); this.eatW('}'); return this.redirs({ type: 'group', body }); }
        case 'function': {
          this.i++; const name = this.peek(); if (!name || name.w === undefined) this.err(name); this.i++;
          if (this.op('(')) { this.i++; this.eat(')'); }
          this.nl(); return { type: 'func', name: name.w, body: this.command() };
        }
        case 'then': case 'else': case 'elif': case 'fi': case 'do': case 'done': case 'esac': case '}': this.err(k);
      }
      const a = this.peek(1); const b = this.peek(2);
      if (k.w !== undefined && a && a.op === '(' && b && b.op === ')' && /^[A-Za-z_][\w-]*$/.test(k.w)) {
        this.i += 3; this.nl();
        return { type: 'func', name: k.w, body: this.command() };
      }
      return this.simple();
    }
    redirs(node) {
      node.redirs = [];
      while (this.peek() && REDIR.has(this.peek().op)) this.redir(node);
      return node;
    }
    redir(node) {
      const k = this.peek(); this.i++;
      if (k.op === '2>&1') { node.redirs.push({ op: k.op }); return; }
      const t = this.peek();
      if (!t || t.w === undefined) this.err(t);
      this.i++; node.redirs.push({ op: k.op, target: t.w });
    }
    simple() {
      const node = { type: 'simple', assigns: [], words: [], redirs: [], line: this.peek().line };
      for (;;) {
        const k = this.peek();
        if (!k) break;
        if (k.op !== undefined) { if (REDIR.has(k.op)) { this.redir(node); continue; } break; }
        if (!node.words.length && /^[A-Za-z_][A-Za-z0-9_]*(\[[^\]]*\])?\+?=/.test(k.w)) { node.assigns.push(k.w); this.i++; continue; }
        node.words.push(k.w); this.i++;
      }
      if (!node.words.length && !node.assigns.length && !node.redirs.length) this.err(this.peek());
      return node;
    }
    ifCmd() {
      this.eatW('if');
      const branches = [];
      const cond = this.body(['then']); this.eatW('then');
      branches.push({ cond, body: this.body(['elif', 'else', 'fi']) });
      let other = null;
      while (this.word('elif')) { this.i++; const c = this.body(['then']); this.eatW('then'); branches.push({ cond: c, body: this.body(['elif', 'else', 'fi']) }); }
      if (this.word('else')) { this.i++; other = this.body(['fi']); }
      this.eatW('fi');
      return { type: 'if', branches, other };
    }
    forCmd() {
      this.eatW('for');
      const v = this.peek();
      if (!v || v.w === undefined || !isName(v.w)) this.err(v);
      this.i++;
      let words = null;
      this.nl();
      if (this.op(';')) this.i++;
      this.nl();
      if (this.word('in')) {
        this.i++; words = [];
        while (this.peek() && this.peek().w !== undefined) { words.push(this.peek().w); this.i++; }
        if (this.op(';') || this.op('\n')) this.i++; else this.err(this.peek());
      }
      this.nl();
      this.eatW('do');
      const body = this.body(['done']); this.eatW('done');
      return { type: 'for', name: v.w, words, body };
    }
    whileCmd() {
      const until = this.peek().w === 'until'; this.i++;
      const cond = this.body(['do']); this.eatW('do');
      const body = this.body(['done']); this.eatW('done');
      return { type: 'while', until, cond, body };
    }
    caseCmd() {
      this.eatW('case');
      const w = this.peek(); if (!w || w.w === undefined) this.err(w); this.i++;
      this.nl(); this.eatW('in');
      const clauses = [];
      for (;;) {
        this.nl();
        if (this.word('esac')) break;
        if (this.op('(')) this.i++;
        const pats = [];
        const p0 = this.peek(); if (!p0 || p0.w === undefined) this.err(p0);
        pats.push(p0.w); this.i++;
        while (this.op('|')) { this.i++; const p = this.peek(); if (!p || p.w === undefined) this.err(p); pats.push(p.w); this.i++; }
        this.eat(')');
        const body = this.list(['esac']);
        clauses.push({ pats, body });
        if (this.op(';;')) { this.i++; continue; }
        this.nl();
        if (this.word('esac')) break;
        this.err(this.peek());
      }
      this.eatW('esac');
      return { type: 'case', word: w.w, clauses };
    }
  }

  function parse(src) { return new Parser(lex(src)).all(); }

  /* ================================================================ aritmetik */

  const AR_LEVELS = [['*', '/', '%'], ['+', '-'], ['<<', '>>'], ['<', '<=', '>', '>='], ['==', '!='], ['&'], ['^'], ['|'], ['&&'], ['||']];

  function arith(sh, src) {
    const toks = src.match(/0[xX][0-9a-fA-F]+|\d+|[A-Za-z_]\w*|\*\*|<<|>>|<=|>=|==|!=|&&|\|\||\+\+|--|[-+*/%]=|\S/g) || [];
    let p = 0;
    const bad = () => {
      const rest = toks.slice(p).join(' ');
      throw new RunErr(`${src.trim()}: syntax error: ${rest ? `invalid arithmetic operator (error token is "${rest}")` : 'operand expected (error token is "")'}`);
    };
    const peek = () => toks[p];
    const val = (name) => {
      const v = sh.getVar(name).trim();
      if (v === '') return 0;
      if (/^-?\d+$/.test(v)) return parseInt(v, 10);
      if (isName(v)) return val(v);
      return arith(sh, v);
    };
    const set = (name, v) => { sh.setVar(name, String(v)); return v; };
    const apply = (op, l, r) => {
      switch (op) {
        case '*': return l * r;
        case '/': if (r === 0) throw new RunErr('division by 0 (error token is "' + toks.slice(p - 1).join('') + '")'); return Math.trunc(l / r);
        case '%': if (r === 0) throw new RunErr('division by 0 (error token is "' + toks.slice(p - 1).join('') + '")'); return l % r;
        case '+': return l + r; case '-': return l - r;
        case '<<': return l << r; case '>>': return l >> r;
        case '<': return +(l < r); case '<=': return +(l <= r); case '>': return +(l > r); case '>=': return +(l >= r);
        case '==': return +(l === r); case '!=': return +(l !== r);
        case '&': return l & r; case '^': return l ^ r; case '|': return l | r;
        case '&&': return +(l !== 0 && r !== 0); case '||': return +(l !== 0 || r !== 0);
      }
      return 0;
    };
    function primary() {
      const t = toks[p++];
      if (t === undefined) { p--; bad(); }
      if (t === '(') { const v = assign(); if (toks[p++] !== ')') { p--; bad(); } return v; }
      if (/^0[xX]/.test(t)) return parseInt(t, 16);
      if (/^\d+$/.test(t)) return /^0\d/.test(t) ? parseInt(t, 8) : parseInt(t, 10);
      if (isName(t)) {
        if (peek() === '++' || peek() === '--') { const op = toks[p++]; const v = val(t); set(t, op === '++' ? v + 1 : v - 1); return v; }
        return val(t);
      }
      p--; bad();
    }
    function unary() {
      const t = peek();
      if (t === '-') { p++; return -unary(); }
      if (t === '+') { p++; return unary(); }
      if (t === '!') { p++; return unary() ? 0 : 1; }
      if (t === '~') { p++; return ~unary(); }
      if (t === '++' || t === '--') { p++; const name = toks[p++]; if (!isName(name || '')) { p--; bad(); } return set(name, val(name) + (t === '++' ? 1 : -1)); }
      return primary();
    }
    function pow() { const b = unary(); if (peek() === '**') { p++; return Math.pow(b, pow()); } return b; }
    function bin(level) {
      if (level < 0) return pow();
      let l = bin(level - 1);
      while (AR_LEVELS[level].includes(peek())) { const op = toks[p++]; const r = bin(level - 1); l = apply(op, l, r); }
      return l;
    }
    function ternary() {
      const c = bin(AR_LEVELS.length - 1);
      if (peek() === '?') { p++; const a = assign(); if (toks[p++] !== ':') { p--; bad(); } const b = assign(); return c ? a : b; }
      return c;
    }
    function assign() {
      if (isName(peek() || '') && ['=', '+=', '-=', '*=', '/=', '%='].includes(toks[p + 1])) {
        const name = toks[p]; const op = toks[p + 1]; p += 2;
        const r = assign();
        return set(name, op === '=' ? r : apply(op[0], val(name), r));
      }
      return ternary();
    }
    if (!toks.length) return 0;
    let v = assign();
    while (peek() === ',') { p++; v = assign(); }
    if (p < toks.length) bad();
    return v;
  }

  /* ================================================================ test / [ ] */

  const TEST_UN = new Set(['-e', '-f', '-d', '-r', '-w', '-x', '-s', '-z', '-n', '-L', '-h', '-a']);
  const TEST_BIN = new Set(['=', '==', '!=', '-eq', '-ne', '-lt', '-le', '-gt', '-ge', '<', '>']);

  function testCmd(sh, args, io, name) {
    const fail = (m) => { io.err(`${sh.errPrefix()}${name}: ${m}\n`); throw 2; };
    const int = (s) => { if (!/^\s*[-+]?\d+\s*$/.test(s)) fail(`${s}: integer expression expected`); return parseInt(s, 10); };
    const unary = (op, a) => {
      if (op === '-z') return a === '';
      if (op === '-n') return a !== '';
      const node = sh.lookup(a);
      if (!node) return false;
      switch (op) {
        case '-e': case '-a': return true;
        case '-f': return node.t === 'f';
        case '-d': return node.t === 'd';
        case '-r': return !!(node.mode & 0o400);
        case '-w': return !!(node.mode & 0o200);
        case '-x': return !!(node.mode & 0o100);
        case '-s': return node.t === 'd' || node.data.length > 0;
        default: return false;
      }
    };
    const binary = (a, op, b) => {
      switch (op) {
        case '=': case '==': return a === b;
        case '!=': return a !== b;
        case '<': return a < b; case '>': return a > b;
        case '-eq': return int(a) === int(b); case '-ne': return int(a) !== int(b);
        case '-lt': return int(a) < int(b); case '-le': return int(a) <= int(b);
        case '-gt': return int(a) > int(b); case '-ge': return int(a) >= int(b);
      }
      return false;
    };
    function evalN(a) {
      switch (a.length) {
        case 0: return false;
        case 1: return a[0] !== '';
        case 2:
          if (a[0] === '!') return a[1] === '';
          if (TEST_UN.has(a[0])) return unary(a[0], a[1]);
          return fail(`${a[0]}: unary operator expected`);
        case 3:
          if (TEST_BIN.has(a[1])) return binary(a[0], a[1], a[2]);
          if (a[1] === '-a') return a[0] !== '' && a[2] !== '';
          if (a[1] === '-o') return a[0] !== '' || a[2] !== '';
          if (a[0] === '!') return !evalN(a.slice(1));
          if (a[0] === '(' && a[2] === ')') return a[1] !== '';
          return fail(`${a[1]}: binary operator expected`);
        case 4:
          if (a[0] === '!') return !evalN(a.slice(1));
          if (a[0] === '(' && a[3] === ')') return evalN(a.slice(1, 3));
      }
      // genel durum: -o en düşük, sonra -a, sonra !
      let i = a.lastIndexOf('-o'); if (i > 0) return evalN(a.slice(0, i)) || evalN(a.slice(i + 1));
      i = a.lastIndexOf('-a'); if (i > 0) return evalN(a.slice(0, i)) && evalN(a.slice(i + 1));
      if (a[0] === '!') return !evalN(a.slice(1));
      return fail('too many arguments');
    }
    if (name === '[') {
      if (args[args.length - 1] !== ']') { io.err(`${sh.errPrefix()}[: missing \`]'\n`); return 2; }
      args = args.slice(0, -1);
    }
    try { return evalN(args) ? 0 : 1; } catch (e) { if (e === 2) return 2; throw e; }
  }

  /* ================================================================ awk */

  class AwkErr extends Error {}
  class SN { constructor(s) { this.s = s; } }
  const AWK_KW = new Set(['BEGIN', 'END', 'if', 'else', 'while', 'for', 'do', 'break', 'continue', 'next', 'exit', 'print', 'printf', 'delete', 'in', 'getline', 'function', 'return']);
  const AWK_FN = new Set(['length', 'substr', 'index', 'split', 'toupper', 'tolower', 'int', 'sqrt', 'exp', 'log', 'sin', 'cos', 'atan2', 'rand', 'srand', 'sprintf', 'sub', 'gsub', 'match', 'system']);
  const AWK_OPS = ['+=', '-=', '*=', '/=', '%=', '^=', '==', '<=', '>=', '!=', '++', '--', '&&', '||', '>>', '!~', '{', '}', '(', ')', '[', ']', ';', ',', '+', '-', '*', '/', '%', '^', '!', '>', '<', '|', '?', ':', '~', '$', '='];
  const AWK_ASSIGN = new Set(['=', '+=', '-=', '*=', '/=', '%=', '^=']);
  const NUMRE = /^\s*[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?\s*$/;

  function awkLex(src) {
    const toks = []; let i = 0;
    const operandEnd = () => {
      const t = toks[toks.length - 1];
      if (!t) return false;
      if (t.t === 'num' || t.t === 'str' || t.t === 'ere' || t.t === 'name') return true;
      return t.t === 'op' && (t.v === ')' || t.v === ']' || t.v === '$');
    };
    while (i < src.length) {
      const c = src[i];
      if (c === ' ' || c === '\t' || c === '\r') { i++; continue; }
      if (c === '\\' && src[i + 1] === '\n') { i += 2; continue; }
      if (c === '\n') { toks.push({ t: 'nl' }); i++; continue; }
      if (c === '#') { while (i < src.length && src[i] !== '\n') i++; continue; }
      if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(src[i + 1] || ''))) {
        const m = /^(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?/.exec(src.slice(i))[0];
        toks.push({ t: 'num', v: parseFloat(m) }); i += m.length; continue;
      }
      if (/[A-Za-z_]/.test(c)) {
        const m = /^[A-Za-z_]\w*/.exec(src.slice(i))[0]; i += m.length;
        toks.push({ t: AWK_KW.has(m) ? 'kw' : AWK_FN.has(m) ? 'fn' : 'name', v: m }); continue;
      }
      if (c === '"') {
        let s = ''; i++;
        while (i < src.length && src[i] !== '"') {
          if (src[i] === '\\' && i + 1 < src.length) {
            const d = src[++i];
            s += { n: '\n', t: '\t', '"': '"', '\\': '\\', '/': '/', r: '\r', a: '\x07', b: '\b', f: '\f', v: '\v' }[d] ?? '\\' + d;
            i++; continue;
          }
          if (src[i] === '\n') throw new AwkErr('newline in string');
          s += src[i++];
        }
        if (i >= src.length) throw new AwkErr('unterminated string');
        i++; toks.push({ t: 'str', v: s }); continue;
      }
      if (c === '/' && !operandEnd()) {
        let s = ''; i++; let inBr = false;
        while (i < src.length && (src[i] !== '/' || inBr)) {
          if (src[i] === '\\' && i + 1 < src.length) { s += src[i + 1] === '/' ? '/' : src[i] + src[i + 1]; i += 2; continue; }
          if (src[i] === '[') inBr = true; else if (src[i] === ']') inBr = false;
          if (src[i] === '\n') throw new AwkErr('newline in regex');
          s += src[i++];
        }
        if (i >= src.length) throw new AwkErr('unterminated regexp');
        i++; toks.push({ t: 'ere', v: s }); continue;
      }
      const op = AWK_OPS.find((o) => src.startsWith(o, i));
      if (!op) throw new AwkErr(`syntax error at source line 1 near ${c}`);
      toks.push({ t: 'op', v: op }); i += op.length;
    }
    toks.push({ t: 'eof' });
    return toks;
  }

  function awkParse(src) {
    const T = awkLex(src); let p = 0;
    const is = (t, v) => T[p].t === t && (v === undefined || T[p].v === v);
    const isOp = (v) => is('op', v);
    const next = () => T[p++];
    const fail = () => {
      const t = T[p];
      const near = t.t === 'eof' ? 'end of file' : t.t === 'nl' ? 'end of line' : t.t === 'str' ? `"${t.v}"` : t.t === 'ere' ? `/${t.v}/` : t.v;
      throw new AwkErr(`syntax error at or near ${near}`);
    };
    const expect = (v) => { if (!isOp(v)) fail(); p++; };
    const optNL = () => { while (is('nl')) p++; };
    const skipTerms = () => { while (is('nl') || isOp(';')) p++; };
    const isLval = (e) => e.k === 'var' || e.k === 'idx' || e.k === 'field';
    const atEnd = () => is('nl') || isOp(';') || isOp('}') || is('eof');

    function block() { expect('{'); const body = stmts(); expect('}'); return { k: 'block', body }; }
    function stmts() { const out = []; skipTerms(); while (!isOp('}')) { if (is('eof')) fail(); out.push(stmt()); skipTerms(); } return out; }
    function endStmt() { if (is('nl') || isOp(';')) { p++; return; } if (isOp('}') || is('eof')) return; fail(); }
    function sub() { optNL(); if (isOp(';')) { p++; return { k: 'block', body: [] }; } return stmt(); }
    function stmt() {
      const t = T[p];
      if (isOp('{')) return block();
      if (isOp(';')) { p++; return { k: 'block', body: [] }; }
      if (t.t === 'kw') {
        switch (t.v) {
          case 'if': {
            p++; expect('('); const c = expr(false); expect(')'); const a = sub();
            const save = p; skipTerms();
            if (is('kw', 'else')) { p++; return { k: 'if', c, a, b: sub() }; }
            p = save; return { k: 'if', c, a };
          }
          case 'while': { p++; expect('('); const c = expr(false); expect(')'); return { k: 'while', c, body: sub() }; }
          case 'do': {
            p++; const body = sub(); skipTerms();
            if (!is('kw', 'while')) fail(); p++; expect('('); const c = expr(false); expect(')'); endStmt();
            return { k: 'do', c, body };
          }
          case 'for': {
            p++; expect('(');
            if (is('name') && T[p + 1].t === 'kw' && T[p + 1].v === 'in' && T[p + 2].t === 'name' && T[p + 3].t === 'op' && T[p + 3].v === ')') {
              const v = T[p].v; const arr = T[p + 2].v; p += 4;
              return { k: 'forin', v, arr, body: sub() };
            }
            const init = isOp(';') ? null : expr(false); expect(';'); optNL();
            const c = isOp(';') ? null : expr(false); expect(';'); optNL();
            const step = isOp(')') ? null : expr(false); expect(')');
            return { k: 'for', init, c, step, body: sub() };
          }
          case 'break': case 'continue': case 'next': p++; endStmt(); return { k: t.v };
          case 'exit': { p++; const e = atEnd() ? null : expr(false); endStmt(); return { k: 'exit', e }; }
          case 'print': case 'printf': {
            p++;
            let args = [];
            if (!atEnd() && !isOp('>') && !isOp('>>') && !isOp('|')) args = exprList(true);
            let redir = null;
            if (isOp('>') || isOp('>>') || isOp('|')) { const op = next().v; redir = { op, e: concat(true) }; }
            endStmt();
            return { k: t.v, args, redir };
          }
          case 'delete': {
            p++; const name = next(); if (name.t !== 'name') { p--; fail(); }
            let idx = null; if (isOp('[')) { p++; idx = exprList(false); expect(']'); }
            endStmt(); return { k: 'delete', name: name.v, idx };
          }
          default: fail();
        }
      }
      const e = expr(false); endStmt(); return { k: 'expr', e };
    }
    function exprList(noGt) { const out = [expr(noGt)]; while (isOp(',')) { p++; optNL(); out.push(expr(noGt)); } return out; }
    function expr(n) { return ternary(n); }
    function ternary(n) {
      const c = or(n);
      if (isOp('?')) { p++; optNL(); const a = ternary(n); optNL(); expect(':'); optNL(); return { k: 'cond', c, a, b: ternary(n) }; }
      if (T[p].t === 'op' && AWK_ASSIGN.has(T[p].v) && isLval(c)) { const op = next().v; optNL(); return { k: 'assign', op, l: c, r: ternary(n) }; }
      return c;
    }
    function or(n) { let l = and(n); while (isOp('||')) { p++; optNL(); l = { k: 'or', l, r: and(n) }; } return l; }
    function and(n) { let l = inE(n); while (isOp('&&')) { p++; optNL(); l = { k: 'and', l, r: inE(n) }; } return l; }
    function inE(n) { let l = match(n); while (is('kw', 'in')) { p++; const a = next(); if (a.t !== 'name') { p--; fail(); } l = { k: 'in', key: l, arr: a.v }; } return l; }
    function match(n) { let l = cmp(n); while (isOp('~') || isOp('!~')) { const op = next().v; l = { k: 'match', neg: op === '!~', l, r: cmp(n) }; } return l; }
    function cmp(n) {
      const l = concat(n); const t = T[p];
      if (t.t === 'op' && ['<', '<=', '==', '!=', '>=', '>'].includes(t.v) && !(n && t.v === '>')) { p++; return { k: 'cmp', op: t.v, l, r: concat(n) }; }
      return l;
    }
    function startsPrimary() {
      const t = T[p];
      if (t.t === 'num' || t.t === 'str' || t.t === 'ere' || t.t === 'name' || t.t === 'fn') return true;
      return t.t === 'op' && (t.v === '$' || t.v === '(' || t.v === '++' || t.v === '--' || t.v === '!');
    }
    function concat(n) { let l = additive(n); while (startsPrimary() && !isOp('!')) l = { k: 'cat', l, r: additive(n) }; return l; }
    function additive(n) { let l = mul(n); while (isOp('+') || isOp('-')) { const op = next().v; l = { k: 'bin', op, l, r: mul(n) }; } return l; }
    function mul(n) { let l = unary(n); while (isOp('*') || isOp('/') || isOp('%')) { const op = next().v; l = { k: 'bin', op, l, r: unary(n) }; } return l; }
    function unary(n) {
      if (isOp('!')) { p++; return { k: 'not', e: unary(n) }; }
      if (isOp('-')) { p++; return { k: 'neg', e: unary(n) }; }
      if (isOp('+')) { p++; return { k: 'pos', e: unary(n) }; }
      return pow(n);
    }
    function pow(n) { const b = postfix(n); if (isOp('^')) { p++; return { k: 'bin', op: '^', l: b, r: unary(n) }; } return b; }
    function postfix(n) {
      if (isOp('++') || isOp('--')) { const op = next().v; const l = postfix(n); if (!isLval(l)) fail(); return { k: 'incr', op, pre: true, l }; }
      const e = primary(n);
      if (isLval(e) && (isOp('++') || isOp('--'))) { const op = next().v; return { k: 'incr', op, pre: false, l: e }; }
      return e;
    }
    function primary() {
      const t = next();
      switch (t.t) {
        case 'num': return { k: 'num', v: t.v };
        case 'str': return { k: 'str', v: t.v };
        case 'ere': return { k: 'ere', v: t.v };
        case 'name':
          if (isOp('[')) { p++; const idx = exprList(false); expect(']'); return { k: 'idx', name: t.v, idx }; }
          return { k: 'var', name: t.v };
        case 'fn': {
          if (t.v === 'length' && !isOp('(')) return { k: 'call', f: 'length', args: [] };
          expect('('); optNL();
          const args = isOp(')') ? [] : exprList(false);
          optNL(); expect(')');
          return { k: 'call', f: t.v, args };
        }
        case 'op':
          if (t.v === '$') {
            if (isOp('++') || isOp('--')) { const op = next().v; const l = primary(); return { k: 'field', e: { k: 'incr', op, pre: true, l } }; }
            if (isOp('-')) { p++; return { k: 'field', e: { k: 'neg', e: primary() } }; }
            return { k: 'field', e: primary() };
          }
          if (t.v === '(') {
            optNL(); const list = exprList(false); optNL(); expect(')');
            return list.length === 1 ? { k: 'group1', e: list[0] } : { k: 'group', list };
          }
      }
      p--; fail();
    }

    const prog = { begin: [], main: [], end: [] };
    skipTerms();
    while (!is('eof')) {
      if (is('kw', 'BEGIN')) { p++; optNL(); prog.begin.push(block()); }
      else if (is('kw', 'END')) { p++; optNL(); prog.end.push(block()); }
      else {
        let pat = null;
        if (!isOp('{')) {
          pat = expr(false);
          if (isOp(',')) { p++; optNL(); pat = { k: 'range', a: pat, b: expr(false) }; }
        }
        const act = isOp('{') ? block() : null;
        prog.main.push({ pat, act, on: false });
      }
      if (!(is('nl') || isOp(';') || is('eof'))) { if (!(T[p - 1].t === 'op' && T[p - 1].v === '}')) fail(); }
      skipTerms();
    }
    return prog;
  }

  const AWK_BRK = { awk: 'break' }; const AWK_CNT = { awk: 'continue' };
  const AWK_NEXT = { awk: 'next' }; const AWK_EXIT = { awk: 'exit' };

  function awkRun(prog, o) {
    const G = Object.create(null); const A = Object.create(null);
    G.FS = o.FS; G.OFS = ' '; G.ORS = '\n'; G.NR = 0; G.NF = 0; G.FNR = 0; G.SUBSEP = '\x1c';
    G.RSTART = 0; G.RLENGTH = -1; G.FILENAME = ''; G.CONVFMT = '%.6g'; G.OFMT = '%.6g';
    for (const [k, v] of Object.entries(o.vars)) G[k] = new SN(v);
    let fields = [''];
    const reCache = new Map();
    const opened = new Set();
    const pipes = new Map();
    let exitCode = 0;

    const fatal = (m) => { throw new AwkErr('fatal: ' + m); };
    const strtod = (s) => { const m = /^\s*[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?/.exec(s); return m ? parseFloat(m[0]) : 0; };
    const num = (v) => (typeof v === 'number' ? v : v === undefined ? 0 : strtod(v instanceof SN ? v.s : v));
    const fmtNum = (n) => (Number.isInteger(n) ? String(n) : Number.isFinite(n) ? formatf(String(G.CONVFMT instanceof SN ? G.CONVFMT.s : G.CONVFMT), [n], num, str).out : (n > 0 ? 'inf' : n < 0 ? '-inf' : 'nan'));
    const str = (v) => (v === undefined ? '' : typeof v === 'number' ? fmtNum(v) : v instanceof SN ? v.s : v);
    const isNum = (v) => typeof v === 'number' || v === undefined || (v instanceof SN && NUMRE.test(v.s));
    const truthy = (v) => (typeof v === 'number' ? v !== 0 : v === undefined ? false : v instanceof SN ? (NUMRE.test(v.s) ? strtod(v.s) !== 0 : v.s !== '') : v !== '');
    const compare = (op, a, b) => {
      let x; let y;
      if (isNum(a) && isNum(b)) { x = num(a); y = num(b); } else { x = str(a); y = str(b); }
      switch (op) { case '<': return x < y; case '<=': return x <= y; case '>': return x > y; case '>=': return x >= y; case '==': return x === y; default: return x !== y; }
    };
    const re = (src) => {
      if (!reCache.has(src)) {
        try { reCache.set(src, new RegExp(posixRe(src, true))); } catch (e) { fatal(`invalid regexp: /${src}/`); }
      }
      return reCache.get(src);
    };
    const regexOf = (e) => (e.k === 'ere' ? re(e.v) : re(str(evalE(e))));
    const arr = (name) => { if (G[name] !== undefined && !A[name]) fatal(`attempt to use scalar \`${name}' as array`); return A[name] || (A[name] = Object.create(null)); };

    function splitWith(s, fs) {
      if (fs === ' ') { const t = s.replace(/^[ \t\n]+|[ \t\n]+$/g, ''); return t === '' ? [] : t.split(/[ \t\n]+/); }
      if (s === '') return [];
      if (fs.length === 1 && fs !== '\\') return s.split(fs);
      return s.split(re(fs));
    }
    function setRecord(rec) { fields = [rec, ...splitWith(rec, str(G.FS))]; G.NF = fields.length - 1; }
    function rebuild() { fields[0] = fields.slice(1).join(str(G.OFS)); }
    function getField(i) {
      i = Math.trunc(i);
      if (i < 0) fatal(`attempt to access field ${i}`);
      return i < fields.length ? new SN(fields[i]) : undefined;
    }
    function setField(i, v) {
      i = Math.trunc(i);
      if (i < 0) fatal(`attempt to access field ${i}`);
      if (i === 0) { setRecord(str(v)); return; }
      while (fields.length <= i) fields.push('');
      fields[i] = str(v); G.NF = fields.length - 1; rebuild();
    }
    function setNF(n) { n = Math.trunc(num(n)); fields.length = Math.max(1, n + 1); for (let i = 1; i <= n; i++) if (fields[i] === undefined) fields[i] = ''; G.NF = n; rebuild(); }

    const keyOf = (list) => list.map((x) => str(evalE(x))).join(str(G.SUBSEP));
    function getL(l) { return evalE(l); }
    function setL(l, v) {
      if (l.k === 'var') {
        if (A[l.name]) fatal(`attempt to use array \`${l.name}' in a scalar context`);
        if (l.name === 'NF') setNF(v); else G[l.name] = v;
      } else if (l.k === 'idx') arr(l.name)[keyOf(l.idx)] = v;
      else setField(num(evalE(l.e)), v);
    }

    function call(f, args) {
      const a = (i) => evalE(args[i]);
      switch (f) {
        case 'length':
          if (!args.length) return [...fields[0]].length;
          if (args[0].k === 'var' && A[args[0].name]) return Object.keys(A[args[0].name]).length;
          return [...str(a(0))].length;
        case 'substr': {
          const s = [...str(a(0))]; const m = Math.round(num(a(1)));
          const n = args.length > 2 ? Math.round(num(a(2))) : Infinity;
          const start = Math.max(m, 1); let end = n === Infinity ? s.length + 1 : m + n;
          if (end > s.length + 1) end = s.length + 1;
          return end <= start ? '' : s.slice(start - 1, end - 1).join('');
        }
        case 'index': return str(a(0)).indexOf(str(a(1))) + 1;
        case 'split': {
          const s = str(a(0)); if (args[1].k !== 'var') fatal('split: second argument is not an array');
          const fs = args.length > 2 ? (args[2].k === 'ere' ? args[2].v : str(a(2))) : str(G.FS);
          const parts = splitWith(s, fs);
          const t = A[args[1].name] = Object.create(null);
          parts.forEach((x, i) => { t[String(i + 1)] = new SN(x); });
          return parts.length;
        }
        case 'toupper': return str(a(0)).toUpperCase();
        case 'tolower': return str(a(0)).toLowerCase();
        case 'int': return Math.trunc(num(a(0)));
        case 'sqrt': return Math.sqrt(num(a(0)));
        case 'exp': return Math.exp(num(a(0)));
        case 'log': return Math.log(num(a(0)));
        case 'sin': return Math.sin(num(a(0)));
        case 'cos': return Math.cos(num(a(0)));
        case 'atan2': return Math.atan2(num(a(0)), num(a(1)));
        case 'rand': return Math.random();
        case 'srand': return 0;
        case 'sprintf': { if (!args.length) fatal('sprintf: no arguments'); const v = args.map(evalE); return formatf(str(v[0]), v.slice(1), num, str).out; }
        case 'match': {
          const s = str(a(0)); const m = regexOf(args[1]).exec(s);
          G.RSTART = m ? m.index + 1 : 0; G.RLENGTH = m ? m[0].length : -1; return G.RSTART;
        }
        case 'sub': case 'gsub': {
          const r = regexOf(args[0]); const repl = str(a(1));
          const target = args[2] || { k: 'field', e: { k: 'num', v: 0 } };
          const s = str(getL(target)); let count = 0;
          const g = new RegExp(r.source, 'g');
          const out = s.replace(g, (m) => {
            if (f === 'sub' && count > 0) return m;
            count++;
            return repl.replace(/\\\\|\\&|&/g, (x) => (x === '&' ? m : x === '\\&' ? '&' : '\\'));
          });
          if (count) setL(target, out);
          return count;
        }
        case 'system': fatal('system() bu laboratuvarda desteklenmiyor');
      }
      return 0;
    }

    function evalE(e) {
      switch (e.k) {
        case 'num': return e.v;
        case 'str': return e.v;
        case 'ere': return re(e.v).test(fields[0]) ? 1 : 0;
        case 'var': if (A[e.name]) fatal(`attempt to use array \`${e.name}' in a scalar context`); return G[e.name];
        case 'idx': { const t = arr(e.name); const k = keyOf(e.idx); if (!(k in t)) t[k] = undefined; return t[k]; }
        case 'field': return getField(num(evalE(e.e)));
        case 'group1': return evalE(e.e);
        case 'group': return e.list.map((x) => str(evalE(x))).join(str(G.SUBSEP));
        case 'cat': { const l = str(evalE(e.l)); return l + str(evalE(e.r)); }
        case 'bin': {
          const x = num(evalE(e.l)); const y = num(evalE(e.r));
          switch (e.op) {
            case '+': return x + y; case '-': return x - y; case '*': return x * y;
            case '/': if (y === 0) fatal('division by zero attempted'); return x / y;
            case '%': if (y === 0) fatal('division by zero attempted in `%\''); return x % y;
            default: return Math.pow(x, y);
          }
        }
        case 'neg': return -num(evalE(e.e));
        case 'pos': return num(evalE(e.e));
        case 'not': return truthy(evalE(e.e)) ? 0 : 1;
        case 'and': return truthy(evalE(e.l)) && truthy(evalE(e.r)) ? 1 : 0;
        case 'or': return truthy(evalE(e.l)) || truthy(evalE(e.r)) ? 1 : 0;
        case 'cmp': { const l = evalE(e.l); return compare(e.op, l, evalE(e.r)) ? 1 : 0; }
        case 'match': { const s = str(evalE(e.l)); return regexOf(e.r).test(s) !== e.neg ? 1 : 0; }
        case 'in': { const k = e.key.k === 'group' ? keyOf(e.key.list) : str(evalE(e.key.k === 'group1' ? e.key.e : e.key)); return k in arr(e.arr) ? 1 : 0; }
        case 'cond': return truthy(evalE(e.c)) ? evalE(e.a) : evalE(e.b);
        case 'assign': {
          const r = evalE(e.r); let v;
          if (e.op === '=') v = r;
          else {
            const x = num(getL(e.l)); const y = num(r);
            switch (e.op) {
              case '+=': v = x + y; break; case '-=': v = x - y; break; case '*=': v = x * y; break;
              case '/=': if (y === 0) fatal('division by zero in /='); v = x / y; break;
              case '%=': if (y === 0) fatal('division by zero in %='); v = x % y; break;
              default: v = Math.pow(x, y);
            }
          }
          setL(e.l, v); return v;
        }
        case 'incr': { const old = num(getL(e.l)); const nv = e.op === '++' ? old + 1 : old - 1; setL(e.l, nv); return e.pre ? nv : old; }
        case 'call': return call(e.f, e.args);
      }
      return undefined;
    }

    function emit(text, redir) {
      if (!redir) { o.out(text); return; }
      const name = str(evalE(redir.e));
      if (redir.op === '|') { pipes.set(name, (pipes.get(name) || '') + text); return; }
      const append = redir.op === '>>' || opened.has(name);
      opened.add(name);
      o.write(name, text, append);
    }

    function exec(s) {
      o.tick();
      switch (s.k) {
        case 'block': for (const x of s.body) exec(x); return;
        case 'expr': evalE(s.e); return;
        case 'print': case 'printf': {
          let args = s.args;
          if (args.length === 1 && args[0].k === 'group') args = args[0].list;
          if (s.k === 'print') {
            const text = args.length ? args.map((x) => str(evalE(x))).join(str(G.OFS)) : fields[0];
            emit(text + str(G.ORS), s.redir);
          } else {
            if (!args.length) fatal('printf: no format');
            const v = args.map(evalE);
            emit(formatf(str(v[0]), v.slice(1), num, str).out, s.redir);
          }
          return;
        }
        case 'if': if (truthy(evalE(s.c))) exec(s.a); else if (s.b) exec(s.b); return;
        case 'while':
          while (truthy(evalE(s.c))) { o.tick(); try { exec(s.body); } catch (e) { if (e === AWK_BRK) break; if (e !== AWK_CNT) throw e; } }
          return;
        case 'do':
          do { o.tick(); try { exec(s.body); } catch (e) { if (e === AWK_BRK) break; if (e !== AWK_CNT) throw e; } } while (truthy(evalE(s.c)));
          return;
        case 'for':
          if (s.init) evalE(s.init);
          while (!s.c || truthy(evalE(s.c))) {
            o.tick();
            try { exec(s.body); } catch (e) { if (e === AWK_BRK) break; if (e !== AWK_CNT) throw e; }
            if (s.step) evalE(s.step);
          }
          return;
        case 'forin': {
          const t = arr(s.arr);
          for (const k of Object.keys(t)) {
            if (!(k in t)) continue;
            G[s.v] = new SN(k);
            try { exec(s.body); } catch (e) { if (e === AWK_BRK) break; if (e !== AWK_CNT) throw e; }
          }
          return;
        }
        case 'break': throw AWK_BRK;
        case 'continue': throw AWK_CNT;
        case 'next': throw AWK_NEXT;
        case 'exit': exitCode = s.e ? Math.trunc(num(evalE(s.e))) : exitCode; throw AWK_EXIT;
        case 'delete': if (s.idx) delete arr(s.name)[keyOf(s.idx)]; else A[s.name] = Object.create(null); return;
      }
    }

    function matches(r) {
      if (!r.pat) return true;
      if (r.pat.k === 'range') {
        if (!r.on) { if (truthy(evalE(r.pat.a))) { r.on = !truthy(evalE(r.pat.b)); return true; } return false; }
        if (truthy(evalE(r.pat.b))) r.on = false;
        return true;
      }
      return truthy(evalE(r.pat));
    }

    let exited = false;
    try {
      for (const b of prog.begin) exec(b);
      if (prog.main.length || prog.end.length) {
        for (const inp of o.inputs()) {
          G.FILENAME = inp.name; G.FNR = 0;
          for (const line of splitLines(inp.data)) {
            G.NR = num(G.NR) + 1; G.FNR = num(G.FNR) + 1; setRecord(line);
            try {
              for (const r of prog.main) {
                if (matches(r)) { if (r.act) exec(r.act); else emit(fields[0] + str(G.ORS), null); }
              }
            } catch (e) { if (e !== AWK_NEXT) throw e; }
          }
        }
      }
    } catch (e) {
      if (e === AWK_EXIT) exited = true;
      else if (e === AWK_BRK || e === AWK_CNT) throw new AwkErr('break/continue döngü dışında');
      else throw e;
    }
    try { for (const b of prog.end) exec(b); } catch (e) { if (e !== AWK_EXIT) throw e; }
    void exited;
    for (const [cmd, data] of pipes) o.pipe(cmd, data);
    return exitCode;
  }

  /* ================================================================ kabuk */

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const p2 = (n) => String(n).padStart(2, '0');

  function Shell(opts) {
    opts = opts || {};
    const t = opts.clock || Date.now();
    this.root = defaultFs(t);
    this.ctx = { clock: t, history: [] };
    this.home = ['home', USER];
    this.cwd = this.home.slice();
    this.vars = Object.create(null);
    Object.assign(this.vars, { USER, LOGNAME: USER, HOME: '/home/' + USER, SHELL: '/bin/bash', PATH: '/usr/local/bin:/usr/bin:/bin', HOSTNAME: HOST, LANG: 'tr_TR.UTF-8', IFS: ' \t\n' });
    this.exported = new Set(['USER', 'LOGNAME', 'HOME', 'SHELL', 'PATH', 'HOSTNAME', 'LANG', 'PWD']);
    this.funcs = Object.create(null);
    this.pos = [];
    this.status = 0;
    this.script = null;
    this.line = 0;
    this.locals = [];
    this.io = null;
  }

  const S = Shell.prototype;

  /* ---------------------------------------------------------- dosya sistemi erişimi */

  S.resolve = function (p) {
    const parts = p.startsWith('/') ? [] : this.cwd.slice();
    for (const seg of p.split('/')) {
      if (!seg || seg === '.') continue;
      if (seg === '..') parts.pop(); else parts.push(seg);
    }
    return parts;
  };
  S.nodeAt = function (parts) {
    let n = this.root;
    for (const seg of parts) { if (!n || n.t !== 'd') return null; n = n.kids[seg]; }
    return n || null;
  };
  S.lookup = function (p) { return p === '' ? null : this.nodeAt(this.resolve(p)); };
  S.parentOf = function (p) {
    const parts = this.resolve(p);
    if (!parts.length) return { dir: null, name: '' };
    const dir = this.nodeAt(parts.slice(0, -1));
    return { dir: dir && dir.t === 'd' ? dir : null, name: parts[parts.length - 1], parts };
  };
  S.now = function () { return this.ctx.clock; };
  S.touchNode = function (n) { n.mtime = this.now(); };
  S.pwd = function () { return '/' + this.cwd.join('/'); };
  S.promptPath = function () {
    const h = this.home.join('/'); const c = this.cwd.join('/');
    if (c === h) return '~';
    if (c.startsWith(h + '/')) return '~/' + c.slice(h.length + 1);
    return '/' + c;
  };
  S.readFile = function (p) { const n = this.lookup(p); return n && n.t === 'f' ? n.data : null; };

  // Komutların dosya okuması: hata iletisi GNU araçlarınınki gibi
  S.readFor = function (cmd, p, io) {
    if (p === '/dev/null') return '';
    const n = this.lookup(p);
    if (!n) { io.err(`${cmd}: ${p}: No such file or directory\n`); return null; }
    if (n.t === 'd') { io.err(`${cmd}: ${p}: Is a directory\n`); return null; }
    if (!(n.mode & 0o400)) { io.err(`${cmd}: ${p}: Permission denied\n`); return null; }
    return n.data;
  };
  // Dosya listesi yoksa ya da "-" ise standart girdi
  S.inputs = function (cmd, files, io) {
    const out = []; let bad = false;
    if (!files.length) files = ['-'];
    for (const f of files) {
      if (f === '-') { out.push({ name: '(standard input)', data: io.stdin.readAll() }); continue; }
      const d = this.readFor(cmd, f, io);
      if (d === null) bad = true; else out.push({ name: f, data: d });
    }
    return { list: out, bad };
  };
  S.writeFile = function (p, data, append, io, cmd) {
    if (p === '/dev/null') return true;
    const n = this.lookup(p);
    if (n && n.t === 'd') { io.err(`${cmd}: ${p}: Is a directory\n`); return false; }
    if (n) {
      if (!(n.mode & 0o200)) { io.err(`${cmd}: ${p}: Permission denied\n`); return false; }
      n.data = append ? n.data + data : data; this.touchNode(n); return true;
    }
    const { dir, name } = this.parentOf(p);
    if (!dir) { io.err(`${cmd}: ${p}: No such file or directory\n`); return false; }
    dir.kids[name] = fileNode(data, 0o644, this.now());
    return true;
  };

  /* ---------------------------------------------------------- değişkenler */

  S.getVar = function (name) {
    if (name === 'PWD') return this.pwd();
    if (name === 'RANDOM') return String(Math.floor(Math.random() * 32768));
    const v = this.vars[name];
    if (v === undefined) return '';
    return Array.isArray(v) ? (v[0] === undefined ? '' : v[0]) : v;
  };
  S.setVar = function (name, value) { this.vars[name] = value; };

  /* ---------------------------------------------------------- genişletme */

  function braceExpand(w) {
    // Tırnak ve $ dışındaki ilk { ... } grubunu bul
    let depth = 0; let start = -1;
    for (let i = 0; i < w.length; i++) {
      const c = w[i];
      if (c === '\\') { i++; continue; }
      if (c === "'") { i = w.indexOf("'", i + 1); if (i < 0) return [w]; continue; }
      if (c === '"') { try { i = skipDq(w, i + 1) - 1; } catch (e) { return [w]; } continue; }
      if (c === '$' && (w[i + 1] === '{' || w[i + 1] === '(')) {
        if (w[i + 1] === '(') { try { i = matchParen(w, i + 1); } catch (e) { return [w]; } } else { i = w.indexOf('}', i); if (i < 0) return [w]; }
        continue;
      }
      if (c === '{') { if (depth++ === 0) start = i; }
      else if (c === '}' && depth > 0 && --depth === 0) {
        const inner = w.slice(start + 1, i); const pre = w.slice(0, start); const post = w.slice(i + 1);
        let m = /^(-?\d+)\.\.(-?\d+)(?:\.\.(-?\d+))?$/.exec(inner);
        let items = null;
        if (m) {
          const a = +m[1]; const b = +m[2]; const st = Math.abs(+m[3] || 1); items = [];
          const width = (/^-?0\d/.test(m[1]) || /^-?0\d/.test(m[2])) ? Math.max(m[1].length, m[2].length) : 0;
          for (let x = a; a <= b ? x <= b : x >= b; x += a <= b ? st : -st) items.push(width ? String(x).padStart(width, '0') : String(x));
        } else if ((m = /^([A-Za-z])\.\.([A-Za-z])$/.exec(inner))) {
          const a = m[1].charCodeAt(0); const b = m[2].charCodeAt(0); items = [];
          for (let x = a; a <= b ? x <= b : x >= b; x += a <= b ? 1 : -1) items.push(String.fromCharCode(x));
        } else {
          const parts = []; let d = 0; let last = 0;
          for (let j = 0; j < inner.length; j++) {
            if (inner[j] === '{') d++; else if (inner[j] === '}') d--;
            else if (inner[j] === ',' && d === 0) { parts.push(inner.slice(last, j)); last = j + 1; }
          }
          if (parts.length) { parts.push(inner.slice(last)); items = parts; }
        }
        if (!items) { start = -1; continue; }
        const out = [];
        for (const it of items) for (const x of braceExpand(pre + it + post)) out.push(x);
        return out;
      }
    }
    return [w];
  }

  // mode: 'fields' (bölme + glob), 'str' (tek dize), 'pattern' (case kalıbı: glob karakterleri etkin)
  S.expandWord = function (w, mode) {
    const sh = this;
    const fields = []; let cur = null;
    const ensure = () => cur || (cur = { chars: [] });
    const lit = (t, quoted) => { const f = ensure(); for (const c of t) f.chars.push([c, !quoted && mode !== 'str' && (c === '*' || c === '?')]); };
    const exp = (t) => {
      if (mode !== 'fields') { lit(t, mode === 'str'); return; }
      const parts = t.split(/[ \t\n]+/);
      parts.forEach((p, idx) => {
        if (idx > 0 && cur) { fields.push(cur); cur = null; }
        if (p) lit(p, false);
      });
    };
    const list = (items, quoted) => {
      if (!quoted || mode !== 'fields') { exp(items.join(' ')); return; }
      items.forEach((x, idx) => { if (idx > 0) { fields.push(ensure()); cur = null; } lit(x, true); });
      if (!items.length && cur && !cur.chars.length) cur = cur.forced ? cur : null;
    };
    let i = 0; const n = w.length;
    if (w[0] === '~' && (n === 1 || w[1] === '/')) { lit(this.getVar('HOME'), true); i = 1; }
    while (i < n) {
      const c = w[i];
      if (c === '\\') { if (i + 1 < n) lit(w[i + 1], true); i += 2; continue; }
      if (c === "'") { const j = w.indexOf("'", i + 1); ensure().forced = true; lit(w.slice(i + 1, j), true); i = j + 1; continue; }
      if (c === '"') {
        ensure().forced = true; i++;
        while (i < n && w[i] !== '"') {
          const d = w[i];
          if (d === '\\' && i + 1 < n) {
            const e = w[i + 1];
            if ('$`"\\'.includes(e)) lit(e, true); else if (e === '\n') { /* satır devamı */ } else lit('\\' + e, true);
            i += 2; continue;
          }
          if (d === '$') {
            const r = this.dollar(w, i);
            if (r.list) list(r.list, true); else if (r.text === null) lit('$', true); else lit(r.text, true);
            i = r.end; continue;
          }
          if (d === '`') { const j = w.indexOf('`', i + 1); lit(this.cmdSubst(w.slice(i + 1, j)), true); i = j + 1; continue; }
          lit(d, true); i++;
        }
        i++; continue;
      }
      if (c === '$') {
        const r = this.dollar(w, i);
        if (r.list) list(r.list, false); else if (r.text === null) lit('$', true); else exp(r.text);
        i = r.end; continue;
      }
      if (c === '`') { const j = w.indexOf('`', i + 1); exp(this.cmdSubst(w.slice(i + 1, j))); i = j + 1; continue; }
      lit(c, false); i++;
    }
    if (cur) fields.push(cur);
    if (mode === 'pattern') {
      const f = fields[0] || { chars: [] };
      return '^' + f.chars.map(([ch, g]) => (g ? (ch === '*' ? '.*' : '.') : reEsc(ch))).join('') + '$';
    }
    if (mode === 'str') return fields.map((f) => f.chars.map((x) => x[0]).join('')).join(' ');
    const out = [];
    for (const f of fields) out.push(...sh.glob(f.chars));
    return out;
  };

  S.glob = function (chars) {
    const s = chars.map((x) => x[0]).join('');
    if (!chars.some((x) => x[1])) return [s];
    let k = -1;
    chars.forEach((x, i) => { if (x[0] === '/' && !x[1]) k = i; });
    if (chars.slice(0, k + 1).some((x) => x[1])) return [s];
    const dirStr = s.slice(0, k + 1);
    const pat = chars.slice(k + 1);
    const re = new RegExp('^' + pat.map(([ch, g]) => (g ? (ch === '*' ? '[^/]*' : '[^/]') : reEsc(ch))).join('') + '$');
    const dir = this.lookup(dirStr || '.') || (dirStr === '/' ? this.root : null);
    if (!dir || dir.t !== 'd') return [s];
    const dot = pat.length && pat[0][0] === '.';
    const names = Object.keys(dir.kids).filter((nm) => (dot || nm[0] !== '.') && re.test(nm)).sort(collate);
    return names.length ? names.map((nm) => dirStr + nm) : [s];
  };

  S.expand = function (raw) {
    const out = [];
    for (const w of braceExpand(raw)) out.push(...this.expandWord(w, 'fields'));
    return out;
  };
  S.expandStr = function (raw) { return this.expandWord(raw, 'str'); };

  S.dollar = function (w, i) {
    const d = w[i + 1];
    if (w.startsWith('$((', i)) {
      const j = matchParen(w, i + 1);
      const inner = w.slice(i + 3, j - 1);
      return { text: String(arith(this, this.expandStr(inner))), end: j + 1 };
    }
    if (d === '(') { const j = matchParen(w, i + 1); return { text: this.cmdSubst(w.slice(i + 2, j)), end: j + 1 }; }
    if (d === '{') {
      const j = w.indexOf('}', i + 2);
      return Object.assign(this.param(w.slice(i + 2, j)), { end: j + 1 });
    }
    if (d && /[A-Za-z_]/.test(d)) {
      const m = /^[A-Za-z_][A-Za-z0-9_]*/.exec(w.slice(i + 1))[0];
      return { text: this.getVar(m), end: i + 1 + m.length };
    }
    if (d && /[0-9?#@*$!-]/.test(d)) return Object.assign(this.special(d), { end: i + 2 });
    return { text: null, end: i + 1 };
  };
  S.special = function (d) {
    if (/[0-9]/.test(d)) return { text: d === '0' ? (this.script || 'bash') : (this.pos[+d - 1] || '') };
    switch (d) {
      case '?': return { text: String(this.status) };
      case '#': return { text: String(this.pos.length) };
      case '@': return { list: this.pos.slice() };
      case '*': return { text: this.pos.join(' ') };
      case '$': return { text: '1520' };
      case '!': return { text: '' };
      default: return { text: '' };
    }
  };
  S.param = function (inner) {
    let m;
    if ((m = /^#([A-Za-z_]\w*)\[[@*]\]$/.exec(inner))) { const v = this.vars[m[1]]; return { text: String(Array.isArray(v) ? v.filter((x) => x !== undefined).length : v === undefined ? 0 : 1) }; }
    if ((m = /^#([A-Za-z_]\w*)$/.exec(inner))) return { text: String([...this.getVar(m[1])].length) };
    if (inner === '#') return { text: String(this.pos.length) };
    if ((m = /^([A-Za-z_]\w*)\[([@*])\]$/.exec(inner))) {
      const v = this.vars[m[1]]; const items = Array.isArray(v) ? v.filter((x) => x !== undefined) : v === undefined ? [] : [v];
      return m[2] === '@' ? { list: items } : { text: items.join(' ') };
    }
    if ((m = /^([A-Za-z_]\w*)\[(.+)\]$/.exec(inner))) {
      const v = this.vars[m[1]]; const idx = arith(this, this.expandStr(m[2]));
      return { text: Array.isArray(v) ? (v[idx] === undefined ? '' : v[idx]) : (idx === 0 && v !== undefined ? v : '') };
    }
    if ((m = /^([A-Za-z_]\w*|[0-9]+)(:?)([-=+?])(.*)$/.exec(inner))) {
      const val = /^\d+$/.test(m[1]) ? (this.pos[+m[1] - 1] || '') : this.getVar(m[1]);
      const unset = /^\d+$/.test(m[1]) ? +m[1] > this.pos.length : this.vars[m[1]] === undefined;
      const empty = m[2] ? val === '' : unset;
      const word = () => this.expandStr(m[4]);
      switch (m[3]) {
        case '-': return { text: empty ? word() : val };
        case '=': if (empty) { const v = word(); this.setVar(m[1], v); return { text: v }; } return { text: val };
        case '+': return { text: empty ? '' : word() };
        default: if (empty) throw new RunErr(`${m[1]}: ${m[4] || 'parameter null or not set'}`); return { text: val };
      }
    }
    if ((m = /^([A-Za-z_]\w*):(-?\d+)(?::(\d+))?$/.exec(inner))) {
      const v = this.getVar(m[1]); let a = +m[2]; if (a < 0) a = Math.max(0, v.length + a);
      return { text: m[3] !== undefined ? v.substr(a, +m[3]) : v.slice(a) };
    }
    if (isName(inner)) return { text: this.getVar(inner) };
    if (/^[0-9]+$/.test(inner)) return { text: this.pos[+inner - 1] || '' };
    throw new RunErr(`\${${inner}}: bad substitution`);
  };

  S.cmdSubst = function (src) {
    const sub = this.sub(false);
    let buf = '';
    const parent = this.io || { stdin: new Stream(''), err: () => {} };
    const io = { stdin: parent.stdin, out: (s) => { buf += s; }, err: parent.err, tty: false };
    try {
      sub.execList(parse(src), io);
    } catch (e) {
      if (e instanceof SyntaxErr) { parent.err(`${this.errPrefix()}command substitution: line ${e.line}: ${e.message}\n`); sub.status = 2; }
      else if (e instanceof Flow && e.kind === 'exit') sub.status = e.n;
      else throw e;
    }
    this.lastSub = sub.status;
    return buf.replace(/\n+$/, '');
  };

  /* ---------------------------------------------------------- çalıştırma */

  S.errPrefix = function () { return this.script ? `${this.script}: line ${this.line}: ` : 'bash: '; };
  S.tick = function () { if (++this.ctx.steps > MAX_STEPS) throw new Limit('steps'); };

  S.sub = function (script) {
    const s = Object.create(S);
    s.root = this.root; s.ctx = this.ctx; s.home = this.home; s.cwd = this.cwd.slice();
    s.funcs = script ? Object.create(null) : Object.assign(Object.create(null), this.funcs);
    s.vars = Object.create(null);
    for (const k in this.vars) {
      if (script && !this.exported.has(k)) continue;
      const v = this.vars[k]; s.vars[k] = Array.isArray(v) ? v.slice() : v;
    }
    s.exported = new Set(this.exported);
    s.pos = this.pos.slice(); s.status = this.status;
    s.script = script ? null : this.script; s.line = this.line; s.locals = []; s.io = this.io;
    return s;
  };

  S.execList = function (items, io) { for (const it of items) this.execAndOr(it, io); };
  S.execAndOr = function (node, io) {
    this.execPipeline(node.first, io);
    for (const { op, p } of node.rest) {
      if ((op === '&&' && this.status === 0) || (op === '||' && this.status !== 0)) this.execPipeline(p, io);
    }
  };
  S.execPipeline = function (pl, io) {
    if (pl.cmds.length === 1) this.execCmd(pl.cmds[0], io);
    else {
      let input = io.stdin;
      pl.cmds.forEach((cmd, i) => {
        const last = i === pl.cmds.length - 1;
        let buf = '';
        const sub = this.sub(false);
        const cio = { stdin: input, out: last ? io.out : (s) => { buf += s; }, err: io.err, tty: last ? io.tty : false };
        try { sub.execCmd(cmd, cio); } catch (e) {
          if (e instanceof Flow && e.kind === 'exit') sub.status = e.n;
          // Sonsuz üretici (while true; do echo; done | head): gerçekte SIGPIPE ile durur
          else if (e instanceof Limit && e.what === 'steps' && !last) { sub.status = 141; this.ctx.steps = 0; }
          else throw e;
        }
        this.status = sub.status;
        input = new Stream(buf);
      });
    }
    if (pl.bang) this.status = this.status ? 0 : 1;
  };

  S.loop = function (fn) {
    try { fn(); } catch (e) {
      if (e instanceof Flow && (e.kind === 'break' || e.kind === 'continue')) {
        if (e.n > 1) { e.n--; throw e; }
        return e.kind;
      }
      throw e;
    }
    return null;
  };

  S.execCmd = function (node, io) {
    switch (node.type) {
      case 'simple': return this.execSimple(node, io);
      case 'func': this.funcs[node.name] = node.body; this.status = 0; return;
    }
    return this.withRedirs(node.redirs, io, (cio) => {
      switch (node.type) {
        case 'group': this.execList(node.body, cio); return;
        case 'subshell': {
          const sub = this.sub(false);
          try { sub.execList(node.body, cio); } catch (e) { if (e instanceof Flow && e.kind === 'exit') sub.status = e.n; else throw e; }
          this.status = sub.status; return;
        }
        case 'if': {
          for (const b of node.branches) {
            this.execList(b.cond, cio);
            if (this.status === 0) { this.execList(b.body, cio); return; }
          }
          if (node.other) this.execList(node.other, cio); else this.status = 0;
          return;
        }
        case 'for': {
          const items = node.words ? node.words.flatMap((w) => this.expand(w)) : this.pos.slice();
          this.status = 0;
          for (const it of items) {
            this.tick();
            this.setVar(node.name, it);
            if (this.loop(() => this.execList(node.body, cio)) === 'break') break;
          }
          return;
        }
        case 'while': {
          let st = 0;
          for (;;) {
            this.tick();
            this.execList(node.cond, cio);
            if ((this.status === 0) === node.until) break;
            const r = this.loop(() => this.execList(node.body, cio));
            st = this.status;
            if (r === 'break') { st = 0; break; }
          }
          this.status = st; return;
        }
        case 'case': {
          const w = this.expandStr(node.word);
          this.status = 0;
          for (const cl of node.clauses) {
            if (cl.pats.some((p) => new RegExp(this.expandWord(p, 'pattern'), 's').test(w))) { this.execList(cl.body, cio); return; }
          }
          return;
        }
      }
    });
  };

  S.assign = function (raw) {
    const m = /^([A-Za-z_][A-Za-z0-9_]*)(?:\[([^\]]*)\])?(\+?)=([\s\S]*)$/.exec(raw);
    const [, name, idx, plus, val] = m;
    if (val.startsWith('(') && val.endsWith(')') && idx === undefined) {
      const items = lex(val.slice(1, -1)).filter((t) => t.w !== undefined).flatMap((t) => this.expand(t.w));
      const prev = this.vars[name];
      this.setVar(name, plus ? (Array.isArray(prev) ? prev : prev === undefined ? [] : [prev]).concat(items) : items);
      return;
    }
    const v = this.expandStr(val);
    if (idx !== undefined) {
      const i = arith(this, this.expandStr(idx));
      let a = this.vars[name]; if (!Array.isArray(a)) a = a === undefined ? [] : [a];
      a[i] = plus ? (a[i] || '') + v : v; this.vars[name] = a; return;
    }
    this.setVar(name, plus ? this.getVar(name) + v : v);
  };

  S.execSimple = function (node, io) {
    this.tick();
    this.line = node.line;
    this.io = io;
    this.lastSub = null;
    let argv;
    try {
      argv = [];
      for (const w of node.words) argv.push(...this.expand(w));
      if (!argv.length) {
        for (const a of node.assigns) this.assign(a);
        const st = this.lastSub === null ? 0 : this.lastSub;
        if (node.redirs.length) this.withRedirs(node.redirs, io, () => {});
        this.status = st;
        return;
      }
    } catch (e) {
      if (e instanceof RunErr) { io.err(`${this.errPrefix()}${e.message}\n`); this.status = 1; return; }
      throw e;
    }
    this.withRedirs(node.redirs, io, (cio) => {
      const saved = {};
      for (const a of node.assigns) {
        const name = a.split(/\+?=/)[0];
        saved[name] = this.vars[name];
        this.assign(a);
      }
      try {
        this.status = this.invoke(argv, cio);
      } catch (e) {
        if (e instanceof RunErr) { cio.err(`${this.errPrefix()}${e.message}\n`); this.status = 1; } else throw e;
      } finally {
        for (const k in saved) { if (saved[k] === undefined) delete this.vars[k]; else this.vars[k] = saved[k]; }
      }
    });
  };

  S.withRedirs = function (redirs, io, fn) {
    if (!redirs || !redirs.length) return fn(io);
    const cio = Object.assign({}, io);
    for (const r of redirs) {
      if (r.op === '2>&1') { cio.err = cio.out; continue; }
      const fields = this.expand(r.target);
      if (fields.length !== 1) { io.err(`bash: ${r.target}: ambiguous redirect\n`); this.status = 1; return; }
      const target = fields[0];
      if (r.op === '<') {
        if (target === '/dev/null') { cio.stdin = new Stream(''); continue; }
        const n = this.lookup(target);
        if (!n) { io.err(`${this.errPrefix()}${target}: No such file or directory\n`); this.status = 1; return; }
        if (n.t === 'd') { io.err(`${this.errPrefix()}${target}: Is a directory\n`); this.status = 1; return; }
        if (!(n.mode & 0o400)) { io.err(`${this.errPrefix()}${target}: Permission denied\n`); this.status = 1; return; }
        cio.stdin = new Stream(n.data); continue;
      }
      let sink;
      if (target === '/dev/null') sink = () => {};
      else {
        let n = this.lookup(target);
        if (n && n.t === 'd') { io.err(`${this.errPrefix()}${target}: Is a directory\n`); this.status = 1; return; }
        if (n && !(n.mode & 0o200)) { io.err(`${this.errPrefix()}${target}: Permission denied\n`); this.status = 1; return; }
        if (!n) {
          const { dir, name } = this.parentOf(target);
          if (!dir) { io.err(`${this.errPrefix()}${target}: No such file or directory\n`); this.status = 1; return; }
          n = dir.kids[name] = fileNode('', 0o644, this.now());
        }
        if (!r.op.endsWith('>>')) n.data = '';
        this.touchNode(n);
        const node = n;
        sink = (s) => { node.data += s; };
      }
      if (r.op === '>' || r.op === '>>') { cio.out = sink; cio.tty = false; }
      else if (r.op === '2>' || r.op === '2>>') cio.err = sink;
      else { cio.out = sink; cio.err = sink; cio.tty = false; }
    }
    return fn(cio);
  };

  S.invoke = function (argv, io) {
    const name = argv[0];
    if (this.funcs[name]) return this.callFunc(name, argv.slice(1), io);
    if (BUILTINS[name]) return BUILTINS[name].call(this, argv, io);
    if (CMDS[name]) return CMDS[name].call(this, argv, io);
    if (name.includes('/')) return this.runPath(name, argv, io);
    if (name === '') { io.err(`${this.errPrefix()}: command not found\n`); return 127; }
    io.err(`${this.errPrefix()}${name}: command not found\n`);
    return 127;
  };

  S.callFunc = function (name, args, io) {
    const savedPos = this.pos;
    this.pos = args;
    const frame = {};
    this.locals.push(frame);
    try {
      this.execCmd(this.funcs[name], io);
    } catch (e) {
      if (!(e instanceof Flow && e.kind === 'return')) throw e;
      this.status = e.n === undefined ? this.status : e.n;
    } finally {
      this.pos = savedPos;
      this.locals.pop();
      for (const k in frame) { if (frame[k] === undefined) delete this.vars[k]; else this.vars[k] = frame[k]; }
    }
    return this.status;
  };

  S.runPath = function (path, argv, io) {
    const n = this.lookup(path);
    if (!n) { io.err(`${this.errPrefix()}${path}: No such file or directory\n`); return 127; }
    if (n.t === 'd') { io.err(`${this.errPrefix()}${path}: Is a directory\n`); return 126; }
    if (!(n.mode & 0o100) || !(n.mode & 0o400)) { io.err(`${this.errPrefix()}${path}: Permission denied\n`); return 126; }
    return this.runScript(n.data, path, argv.slice(1), io, false);
  };

  S.runScript = function (src, name, args, io, source) {
    const sh = source ? this : this.sub(true);
    const saved = { pos: this.pos, script: this.script, line: this.line };
    sh.script = name; sh.pos = args;
    let parser;
    try {
      try { parser = new Parser(lex(src)); } catch (e) {
        if (e instanceof SyntaxErr) { io.err(`${name}: line ${e.line}: ${e.message}\n`); sh.status = 2; return 2; }
        throw e;
      }
      for (;;) {
        let item;
        try { item = parser.next(); } catch (e) {
          if (e instanceof SyntaxErr) { io.err(`${name}: line ${e.line}: ${e.message}\n`); sh.status = 2; break; }
          throw e;
        }
        if (!item) break;
        sh.execAndOr(item, io);
      }
    } catch (e) {
      if (e instanceof Flow && e.kind === 'exit') sh.status = e.n;
      else if (e instanceof Flow && e.kind === 'return' && source) sh.status = e.n === undefined ? sh.status : e.n;
      else if (e instanceof Flow && !source) { /* betikte döngü dışı break */ }
      else throw e;
    } finally {
      if (source) { this.pos = saved.pos; this.script = saved.script; this.line = saved.line; }
    }
    return sh.status;
  };

  /* ================================================================ yerleşik komutlar */

  const BUILTINS = Object.create(null);

  BUILTINS.echo = function (argv, io) {
    let i = 1; let nl = true; let esc = false;
    while (i < argv.length && /^-[neE]+$/.test(argv[i])) {
      for (const c of argv[i].slice(1)) { if (c === 'n') nl = false; else if (c === 'e') esc = true; else esc = false; }
      i++;
    }
    let s = argv.slice(i).join(' ');
    if (esc) { const r = processEscapes(s, true); s = r.s; if (r.stop) nl = false; }
    io.out(s + (nl ? '\n' : ''));
    return 0;
  };

  BUILTINS.printf = function (argv, io) {
    if (argv.length < 2) { io.err(`${this.errPrefix()}printf: usage: printf [-v var] format [arguments]\n`); return 2; }
    const fmt = processEscapes(argv[1]);
    let args = argv.slice(2); let bad = false;
    const toNum = (v) => {
      if (v === undefined || v === '') return 0;
      const n = Number(v);
      if (Number.isNaN(n)) { io.err(`${this.errPrefix()}printf: ${v}: invalid number\n`); bad = true; return 0; }
      return n;
    };
    const toStr = (v) => (v === undefined ? '' : String(v));
    let out = '';
    do {
      const r = formatf(fmt, args, toNum, toStr);
      out += r.out;
      if (!r.used) break;
      args = args.slice(r.used);
    } while (args.length);
    io.out(out);
    return bad ? 1 : 0;
  };

  BUILTINS.read = function (argv, io) {
    let i = 1; let prompt = null; let raw = false;
    while (i < argv.length && argv[i][0] === '-') {
      const a = argv[i];
      if (a === '-p') { prompt = argv[i + 1] || ''; i += 2; continue; }
      if (a.startsWith('-p')) { prompt = a.slice(2); i++; continue; }
      if (a === '-r') { raw = true; i++; continue; }
      if (a === '-rp' || a === '-pr') { raw = true; prompt = argv[i + 1] || ''; i += 2; continue; }
      io.err(`${this.errPrefix()}read: ${a}: invalid option\n`); return 2;
    }
    const names = argv.slice(i);
    if (!names.length) names.push('REPLY');
    for (const nm of names) if (!isName(nm)) { io.err(`${this.errPrefix()}read: \`${nm}': not a valid identifier\n`); return 1; }
    if (prompt !== null && io.stdin.tty) io.err(prompt);
    let line = io.stdin.readLine();
    const eof = line === null;
    if (eof) line = '';
    if (!raw) line = line.replace(/\\(.)/g, '$1');
    if (names.length === 1) this.setVar(names[0], names[0] === 'REPLY' ? line : line.replace(/^[ \t]+|[ \t]+$/g, ''));
    else {
      let rest = line.replace(/^[ \t]+/, '');
      names.forEach((nm, k) => {
        if (k === names.length - 1) { this.setVar(nm, rest.replace(/[ \t]+$/, '')); return; }
        const m = /^(\S*)[ \t]*/.exec(rest); this.setVar(nm, m[1]); rest = rest.slice(m[0].length);
      });
    }
    return eof ? 1 : 0;
  };

  BUILTINS.cd = function (argv, io) {
    if (argv.length > 2) { io.err(`${this.errPrefix()}cd: too many arguments\n`); return 1; }
    const target = argv[1] === undefined || argv[1] === '~' ? this.getVar('HOME') : argv[1];
    const parts = this.resolve(target);
    const n = this.nodeAt(parts);
    if (!n) { io.err(`${this.errPrefix()}cd: ${argv[1]}: No such file or directory\n`); return 1; }
    if (n.t !== 'd') { io.err(`${this.errPrefix()}cd: ${argv[1]}: Not a directory\n`); return 1; }
    if (!(n.mode & 0o100)) { io.err(`${this.errPrefix()}cd: ${argv[1]}: Permission denied\n`); return 1; }
    this.cwd = parts;
    return 0;
  };
  BUILTINS.pwd = function (argv, io) { io.out(this.pwd() + '\n'); return 0; };
  BUILTINS.export = function (argv) {
    for (const a of argv.slice(1)) {
      const name = a.split('=')[0];
      if (a.includes('=')) this.assign(a);
      this.exported.add(name);
    }
    return 0;
  };
  BUILTINS.unset = function (argv) {
    let fn = false;
    for (const a of argv.slice(1)) {
      if (a === '-f') { fn = true; continue; }
      if (a === '-v') continue;
      if (fn) delete this.funcs[a]; else delete this.vars[a];
    }
    return 0;
  };
  BUILTINS.local = function (argv, io) {
    const frame = this.locals[this.locals.length - 1];
    if (!frame) { io.err(`${this.errPrefix()}local: can only be used in a function\n`); return 1; }
    for (const a of argv.slice(1)) {
      const name = a.split(/\+?=/)[0];
      if (!(name in frame)) frame[name] = this.vars[name];
      if (a.includes('=')) this.assign(a); else this.vars[name] = '';
    }
    return 0;
  };
  BUILTINS.let = function (argv, io) {
    if (argv.length < 2) { io.err(`${this.errPrefix()}let: expression expected\n`); return 1; }
    let v = 0;
    for (const a of argv.slice(1)) v = arith(this, a);
    return v ? 0 : 1;
  };
  BUILTINS.test = function (argv, io) { return testCmd(this, argv.slice(1), io, 'test'); };
  BUILTINS['['] = function (argv, io) { return testCmd(this, argv.slice(1), io, '['); };
  BUILTINS.true = () => 0;
  BUILTINS[':'] = () => 0;
  BUILTINS.false = () => 1;
  BUILTINS.exit = function (argv) { throw new Flow('exit', argv[1] !== undefined ? (parseInt(argv[1], 10) & 255) : this.status); };
  BUILTINS.return = function (argv, io) {
    if (!this.locals.length && !this.script) { io.err(`${this.errPrefix()}return: can only \`return' from a function or sourced script\n`); return 1; }
    throw new Flow('return', argv[1] !== undefined ? (parseInt(argv[1], 10) & 255) : undefined);
  };
  BUILTINS.break = function (argv) { throw new Flow('break', Math.max(1, parseInt(argv[1] || '1', 10))); };
  BUILTINS.continue = function (argv) { throw new Flow('continue', Math.max(1, parseInt(argv[1] || '1', 10))); };
  BUILTINS.shift = function (argv) { const n = parseInt(argv[1] || '1', 10); if (n > this.pos.length) return 1; this.pos = this.pos.slice(n); return 0; };
  BUILTINS.source = function (argv, io) {
    const f = argv[1];
    if (!f) { io.err(`${this.errPrefix()}${argv[0]}: filename argument required\n`); return 2; }
    const n = this.lookup(f);
    if (!n || n.t !== 'f') { io.err(`${this.errPrefix()}${f}: No such file or directory\n`); return 1; }
    return this.runScript(n.data, f, argv.slice(2), io, true);
  };
  BUILTINS['.'] = BUILTINS.source;
  BUILTINS.history = function (argv, io) {
    this.ctx.history.forEach((h, i) => io.out(`${String(i + 1).padStart(5)}  ${h}\n`));
    return 0;
  };
  BUILTINS.clear = function () { this.ctx.signals.clear = true; return 0; };
  BUILTINS.type = function (argv, io) {
    let st = 0;
    for (const a of argv.slice(1)) {
      if (this.funcs[a]) io.out(`${a} is a function\n`);
      else if (BUILTINS[a]) io.out(`${a} is a shell builtin\n`);
      else if (CMDS[a]) io.out(`${a} is /usr/bin/${a}\n`);
      else { io.err(`${this.errPrefix()}type: ${a}: not found\n`); st = 1; }
    }
    return st;
  };

  /* ================================================================ dış komutlar */

  const CMDS = Object.create(null);

  // -abc biçimli bayrak kümelerini ayırır; değer alan seçenekler bitişik ya da ayrı yazılabilir
  function getopts(argv, valued, io, cmd) {
    const flags = {}; const vals = {}; const rest = []; let bad = null;
    for (let i = 1; i < argv.length; i++) {
      const a = argv[i];
      if (a === '--') { rest.push(...argv.slice(i + 1)); break; }
      if (a[0] !== '-' || a === '-' || /^-\d+$/.test(a) && !valued.includes('#')) { rest.push(a); continue; }
      if (a.startsWith('--')) { flags[a] = true; continue; }
      for (let j = 1; j < a.length; j++) {
        const c = a[j];
        if (valued.includes(c)) {
          let v = a.slice(j + 1);
          if (!v) { v = argv[++i]; if (v === undefined) { bad = `option requires an argument -- '${c}'`; break; } }
          (vals[c] = vals[c] || []).push(v);
          break;
        }
        flags[c] = true;
      }
      if (bad) break;
    }
    if (bad) io.err(`${cmd}: ${bad}\n`);
    return { flags, vals, rest, bad };
  }

  const modeStr = (n) => {
    let s = n.t === 'd' ? 'd' : '-';
    const b = 'rwxrwxrwx';
    for (let i = 0; i < 9; i++) s += n.mode & (256 >> i) ? b[i] : '-';
    return s;
  };
  function lsDate(t) { const d = new Date(t); return `${MONTHS[d.getMonth()]} ${String(d.getDate()).padStart(2)} ${p2(d.getHours())}:${p2(d.getMinutes())}`; }
  const nodeSize = (n) => (n.t === 'd' ? 4096 : utf8Len(n.data));
  const nlinks = (n) => (n.t === 'd' ? 2 + Object.values(n.kids).filter((k) => k.t === 'd').length : 1);
  const lsSort = (a, b) => collate(a.replace(/^\./, ''), b.replace(/^\./, ''));

  CMDS.ls = function (argv, io) {
    const o = getopts(argv, '', io, 'ls');
    const long = o.flags.l; const all = o.flags.a || o.flags.A; const one = o.flags['1']; const dirOnly = o.flags.d;
    const targets = o.rest.length ? o.rest : ['.'];
    let st = 0;
    const files = []; const dirs = [];
    for (const t of targets) {
      const n = this.lookup(t) || (t === '/' ? this.root : null);
      if (!n) { io.err(`ls: cannot access '${t}': No such file or directory\n`); st = 2; continue; }
      if (n.t === 'd' && !dirOnly) dirs.push([t, n]); else files.push([t, n]);
    }
    const render = (entries) => {
      if (!entries.length) return '';
      if (long) {
        const sw = Math.max(...entries.map(([, n]) => String(nodeSize(n)).length));
        const lw = Math.max(...entries.map(([, n]) => String(nlinks(n)).length));
        return entries.map(([nm, n]) => `${modeStr(n)} ${String(nlinks(n)).padStart(lw)} ${USER} ${USER} ${String(nodeSize(n)).padStart(sw)} ${lsDate(n.mtime)} ${nm}\n`).join('');
      }
      if (one || !io.tty) return entries.map(([nm]) => nm + '\n').join('');
      const lines = []; let line = '';
      for (const [nm] of entries) {
        if (line && line.length + 2 + nm.length > 80) { lines.push(line); line = ''; }
        line += (line ? '  ' : '') + nm;
      }
      lines.push(line);
      return lines.join('\n') + '\n';
    };
    files.sort((a, b) => lsSort(a[0], b[0]));
    let out = render(files);
    dirs.sort((a, b) => lsSort(a[0], b[0])).forEach(([t, n], k) => {
      if (!(n.mode & 0o400)) { io.err(`ls: cannot open directory '${t}': Permission denied\n`); st = 2; return; }
      let names = Object.keys(n.kids).filter((nm) => all || nm[0] !== '.');
      names.sort(lsSort);
      const entries = names.map((nm) => [nm, n.kids[nm]]);
      if (o.flags.a) entries.unshift(['.', n], ['..', this.nodeAt(this.resolve(t + '/..')) || n]);
      if (targets.length > 1) out += (out || k > 0 ? '\n' : '') + `${t}:\n`;
      if (long) {
        const total = entries.reduce((s, [, x]) => s + (x.t === 'd' ? 4 : Math.ceil(nodeSize(x) / 4096) * 4), 0);
        out += `total ${total}\n`;
      }
      out += render(entries);
    });
    io.out(out);
    return st;
  };

  CMDS.cat = function (argv, io) {
    const o = getopts(argv, '', io, 'cat');
    const { list, bad } = this.inputs('cat', o.rest, io);
    let data = list.map((x) => x.data).join('');
    if (o.flags.n) { let k = 0; data = joinLines(splitLines(data).map((l) => `${String(++k).padStart(6)}\t${l}`)); }
    io.out(data);
    return bad ? 1 : 0;
  };

  CMDS.touch = function (argv, io) {
    const o = getopts(argv, '', io, 'touch');
    if (!o.rest.length) { io.err("touch: missing file operand\nTry 'touch --help' for more information.\n"); return 1; }
    let st = 0;
    for (const f of o.rest) {
      const n = this.lookup(f);
      if (n) { this.touchNode(n); continue; }
      const { dir, name } = this.parentOf(f);
      if (!dir) { io.err(`touch: cannot touch '${f}': No such file or directory\n`); st = 1; continue; }
      dir.kids[name] = fileNode('', 0o644, this.now());
    }
    return st;
  };

  CMDS.mkdir = function (argv, io) {
    const o = getopts(argv, '', io, 'mkdir');
    if (!o.rest.length) { io.err("mkdir: missing operand\nTry 'mkdir --help' for more information.\n"); return 1; }
    let st = 0;
    for (const f of o.rest) {
      if (o.flags.p) {
        let n = this.root;
        for (const seg of this.resolve(f)) {
          if (!n.kids[seg]) n.kids[seg] = dirNode(0o755, this.now());
          n = n.kids[seg];
          if (n.t !== 'd') { io.err(`mkdir: cannot create directory '${f}': Not a directory\n`); st = 1; break; }
        }
        continue;
      }
      if (this.lookup(f)) { io.err(`mkdir: cannot create directory '${f}': File exists\n`); st = 1; continue; }
      const { dir, name } = this.parentOf(f);
      if (!dir) { io.err(`mkdir: cannot create directory '${f}': No such file or directory\n`); st = 1; continue; }
      dir.kids[name] = dirNode(0o755, this.now());
    }
    return st;
  };

  CMDS.rmdir = function (argv, io) {
    const o = getopts(argv, '', io, 'rmdir');
    if (!o.rest.length) { io.err("rmdir: missing operand\nTry 'rmdir --help' for more information.\n"); return 1; }
    let st = 0;
    for (const f of o.rest) {
      const n = this.lookup(f);
      if (!n) { io.err(`rmdir: failed to remove '${f}': No such file or directory\n`); st = 1; continue; }
      if (n.t !== 'd') { io.err(`rmdir: failed to remove '${f}': Not a directory\n`); st = 1; continue; }
      if (Object.keys(n.kids).length) { io.err(`rmdir: failed to remove '${f}': Directory not empty\n`); st = 1; continue; }
      const { dir, name } = this.parentOf(f);
      delete dir.kids[name];
    }
    return st;
  };

  CMDS.rm = function (argv, io) {
    const o = getopts(argv, '', io, 'rm');
    const rec = o.flags.r || o.flags.R; const force = o.flags.f;
    if (!o.rest.length) { if (force) return 0; io.err("rm: missing operand\nTry 'rm --help' for more information.\n"); return 1; }
    let st = 0;
    for (const f of o.rest) {
      const n = this.lookup(f);
      if (!n) { if (!force) { io.err(`rm: cannot remove '${f}': No such file or directory\n`); st = 1; } continue; }
      if (n.t === 'd' && !rec) { io.err(`rm: cannot remove '${f}': Is a directory\n`); st = 1; continue; }
      const parts = this.resolve(f);
      if (!parts.length || this.cwd.join('/').startsWith(parts.join('/')) && n.t === 'd' && this.cwd.length >= parts.length) {
        io.err(`rm: refusing to remove '.' or '..' directory: skipping '${f}'\n`); st = 1; continue;
      }
      const { dir, name } = this.parentOf(f);
      delete dir.kids[name];
    }
    return st;
  };

  function copyInto(sh, src, dest, io, cmd, move, rec) {
    const sn = sh.lookup(src);
    if (!sn) { io.err(`${cmd}: cannot stat '${src}': No such file or directory\n`); return false; }
    if (sn.t === 'd' && !move && !rec) { io.err(`${cmd}: -r not specified; omitting directory '${src}'\n`); return false; }
    let dn = sh.lookup(dest);
    let dir; let name;
    if (dn && dn.t === 'd') { dir = dn; name = sh.resolve(src).pop(); }
    else { const p = sh.parentOf(dest); dir = p.dir; name = p.name; }
    if (!dir) { io.err(`${cmd}: cannot ${move ? 'move' : 'create regular file'} '${dest}': No such file or directory\n`); return false; }
    if (sn.t === 'd') {
      const sp = sh.resolve(src).join('/'); const dp = (sh.resolve(dest).join('/') + '/');
      if (dp.startsWith(sp + '/')) { io.err(`${cmd}: cannot ${move ? 'move' : 'copy'} '${src}' to a subdirectory of itself, '${dest}'\n`); return false; }
    }
    if (dir.kids[name] === sn) { io.err(`${cmd}: '${src}' and '${dest}' are the same file\n`); return false; }
    if (move) { const p = sh.parentOf(src); delete p.dir.kids[p.name]; dir.kids[name] = sn; }
    else { const c = cloneTree(sn); c.mtime = sh.now(); dir.kids[name] = c; }
    return true;
  }
  CMDS.cp = function (argv, io) {
    const o = getopts(argv, '', io, 'cp');
    if (o.rest.length < 2) { io.err(o.rest.length ? `cp: missing destination file operand after '${o.rest[0]}'\nTry 'cp --help' for more information.\n` : "cp: missing file operand\nTry 'cp --help' for more information.\n"); return 1; }
    const dest = o.rest[o.rest.length - 1]; const srcs = o.rest.slice(0, -1);
    if (srcs.length > 1) { const d = this.lookup(dest); if (!d || d.t !== 'd') { io.err(`cp: target '${dest}' is not a directory\n`); return 1; } }
    let st = 0;
    for (const s of srcs) if (!copyInto(this, s, dest, io, 'cp', false, o.flags.r || o.flags.R)) st = 1;
    return st;
  };
  CMDS.mv = function (argv, io) {
    const o = getopts(argv, '', io, 'mv');
    if (o.rest.length < 2) { io.err(o.rest.length ? `mv: missing destination file operand after '${o.rest[0]}'\nTry 'mv --help' for more information.\n` : "mv: missing file operand\nTry 'mv --help' for more information.\n"); return 1; }
    const dest = o.rest[o.rest.length - 1]; const srcs = o.rest.slice(0, -1);
    if (srcs.length > 1) { const d = this.lookup(dest); if (!d || d.t !== 'd') { io.err(`mv: target '${dest}' is not a directory\n`); return 1; } }
    let st = 0;
    for (const s of srcs) if (!copyInto(this, s, dest, io, 'mv', true)) st = 1;
    return st;
  };

  CMDS.chmod = function (argv, io) {
    const args = argv.slice(1);
    if (!args.length) { io.err("chmod: missing operand\nTry 'chmod --help' for more information.\n"); return 1; }
    const spec = args[0]; const files = args.slice(1);
    if (!files.length) { io.err(`chmod: missing operand after '${spec}'\nTry 'chmod --help' for more information.\n`); return 1; }
    let apply;
    if (/^[0-7]{1,4}$/.test(spec)) { const m = parseInt(spec, 8) & 0o777; apply = () => m; }
    else {
      const clauses = spec.split(',');
      const ok = clauses.every((c) => /^[ugoa]*([-+=][rwxX]*)+$/.test(c));
      if (!ok) { io.err(`chmod: invalid mode: ‘${spec}’\nTry 'chmod --help' for more information.\n`); return 1; }
      apply = (mode, isDir) => {
        for (const c of clauses) {
          const m = /^([ugoa]*)(.*)$/.exec(c);
          let who = m[1] || 'a'; if (who.includes('a')) who = 'ugo';
          const ops = m[2].match(/[-+=][rwxX]*/g);
          for (const op of ops) {
            let bits = 0;
            for (const ch of op.slice(1)) bits |= ch === 'r' ? 4 : ch === 'w' ? 2 : ch === 'x' || (ch === 'X' && (isDir || mode & 0o111)) ? 1 : 0;
            for (const w of who) {
              const sh = w === 'u' ? 6 : w === 'g' ? 3 : 0;
              if (op[0] === '+') mode |= bits << sh;
              else if (op[0] === '-') mode &= ~(bits << sh);
              else mode = (mode & ~(7 << sh)) | (bits << sh);
            }
          }
        }
        return mode & 0o777;
      };
    }
    let st = 0;
    for (const f of files) {
      const n = this.lookup(f);
      if (!n) { io.err(`chmod: cannot access '${f}': No such file or directory\n`); st = 1; continue; }
      n.mode = apply(n.mode, n.t === 'd');
    }
    return st;
  };

  CMDS.grep = function (argv, io, forceE) {
    const o = getopts(argv, 'e', io, 'grep');
    if (o.bad) return 2;
    const f = o.flags;
    let pats = o.vals.e || [];
    const rest = o.rest.slice();
    if (!pats.length) {
      if (!rest.length) { io.err("Usage: grep [OPTION]... PATTERNS [FILE]...\nTry 'grep --help' for more information.\n"); return 2; }
      pats = [rest.shift()];
    }
    const ere = forceE || f.E;
    let rx;
    try {
      const src = pats.flatMap((p) => p.split('\n')).map((p) => (f.F ? reEsc(p) : posixRe(p, ere))).map((s) => (f.w ? `(?<![A-Za-z0-9_])(?:${s})(?![A-Za-z0-9_])` : f.x ? `^(?:${s})$` : s)).join('|');
      rx = new RegExp(src, 'g' + (f.i ? 'i' : ''));
    } catch (e) { io.err(`grep: ${/\(/.test(pats.join('')) ? 'Unmatched ( or \\(' : /\[/.test(pats.join('')) ? 'Unmatched [, [^, [:, [., or [=' : 'Invalid regular expression'}\n`); return 2; }
    const { list, bad } = this.inputs('grep', rest, io);
    const multi = rest.length > 1 && !f.h;
    let any = false; let out = '';
    for (const inp of list) {
      let count = 0; const pre = multi ? inp.name + ':' : '';
      splitLines(inp.data).forEach((line, k) => {
        rx.lastIndex = 0;
        const hit = rx.test(line);
        const sel = f.v ? !hit : hit;
        if (!sel) return;
        count++; any = true;
        if (f.c || f.l || f.q) return;
        const ln = f.n ? `${k + 1}:` : '';
        if (f.o && !f.v) {
          rx.lastIndex = 0; let m;
          while ((m = rx.exec(line))) { if (m[0] === '') { rx.lastIndex++; continue; } out += pre + ln + m[0] + '\n'; }
        } else out += pre + ln + line + '\n';
      });
      if (f.c) out += pre + count + '\n';
      if (f.l && count) out += inp.name + '\n';
    }
    if (!f.q) io.out(out);
    return bad ? 2 : any ? 0 : 1;
  };
  CMDS.egrep = function (argv, io) { return CMDS.grep.call(this, argv, io, true); };

  CMDS.wc = function (argv, io) {
    const o = getopts(argv, '', io, 'wc');
    let sel = ['l', 'w', 'c'].filter((k) => o.flags[k] || (k === 'c' && o.flags.m));
    if (!sel.length) sel = ['l', 'w', 'c'];
    const { list, bad } = this.inputs('wc', o.rest, io);
    const rows = list.map((x) => ({
      name: o.rest.length ? x.name : '',
      l: (x.data.match(/\n/g) || []).length,
      w: x.data.split(/\s+/).filter(Boolean).length,
      c: o.flags.m ? [...x.data].length : utf8Len(x.data)
    }));
    if (rows.length > 1) rows.push({ name: 'total', l: rows.reduce((s, r) => s + r.l, 0), w: rows.reduce((s, r) => s + r.w, 0), c: rows.reduce((s, r) => s + r.c, 0) });
    let width;
    if (sel.length === 1 && rows.length === 1) width = 1;
    else if (!o.rest.length) width = 7;
    else width = Math.max(1, String(list.reduce((s, x) => s + utf8Len(x.data), 0)).length);
    io.out(rows.map((r) => sel.map((k) => String(r[k]).padStart(width)).join(' ') + (r.name ? ' ' + r.name : '') + '\n').join(''));
    return bad ? 1 : 0;
  };

  function parseKey(s) {
    const m = /^(\d+)(?:\.\d+)?([a-zA-Z]*)(?:,(\d+)(?:\.\d+)?([a-zA-Z]*))?$/.exec(s);
    if (!m) return null;
    const opts = (m[2] || '') + (m[4] || '');
    return { start: +m[1], end: m[3] ? +m[3] : null, n: opts.includes('n'), r: opts.includes('r'), f: opts.includes('f'), own: !!opts };
  }
  CMDS.sort = function (argv, io) {
    const o = getopts(argv, 'tko', io, 'sort');
    if (o.bad) return 2;
    const g = o.flags;
    const sep = o.vals.t ? o.vals.t[o.vals.t.length - 1] : null;
    if (sep !== null && [...sep].length !== 1) { io.err(`sort: multi-character tab '${sep}'\n`); return 2; }
    const keys = [];
    for (const k of o.vals.k || []) {
      const pk = parseKey(k);
      if (!pk || pk.start < 1) { io.err(`sort: invalid number at field start: invalid count at start of '${k}'\n`); return 2; }
      keys.push(pk);
    }
    const { list, bad } = this.inputs('sort', o.rest, io);
    const lines = list.flatMap((x) => splitLines(x.data));
    const keyText = (line, k) => {
      if (sep !== null) { const parts = line.split(sep); return parts.slice(k.start - 1, k.end ? k.end : undefined).join(sep); }
      const toks = line.match(/\s*\S+/g) || [];
      return toks.slice(k.start - 1, k.end ? k.end : undefined).join('');
    };
    const numOf = (s) => { const m = /^\s*(-?(\d+\.?\d*|\.\d+))/.exec(s); return m ? parseFloat(m[1]) : 0; };
    const cmpBy = (a, b, opt) => {
      if (opt.n) { const d = numOf(a) - numOf(b); return d < 0 ? -1 : d > 0 ? 1 : 0; }
      return opt.f ? collate(a.toUpperCase(), b.toUpperCase()) : collate(a, b);
    };
    const gopt = { n: g.n, r: g.r, f: g.f };
    const cmpKeys = (a, b) => {
      if (!keys.length) { const c = cmpBy(a, b, gopt); return gopt.r ? -c : c; }
      for (const k of keys) {
        const opt = k.own ? k : Object.assign({}, gopt, { start: k.start, end: k.end });
        const c = cmpBy(keyText(a, k), keyText(b, k), opt);
        if (c) return opt.r ? -c : c;
      }
      return 0;
    };
    const sorted = lines.slice().sort((a, b) => {
      const c = cmpKeys(a, b);
      if (c || g.u || g.s) return c;
      const d = a < b ? -1 : a > b ? 1 : 0;
      return g.r ? -d : d;
    });
    const out = g.u ? sorted.filter((l, i) => i === 0 || cmpKeys(sorted[i - 1], l) !== 0) : sorted;
    const text = joinLines(out);
    if (o.vals.o) { this.writeFile(o.vals.o[0], text, false, io, 'sort'); return bad ? 2 : 0; }
    io.out(text);
    return bad ? 2 : 0;
  };

  CMDS.uniq = function (argv, io) {
    const o = getopts(argv, '', io, 'uniq');
    const { list, bad } = this.inputs('uniq', o.rest.slice(0, 1), io);
    if (bad) return 1;
    const lines = splitLines(list[0] ? list[0].data : '');
    const eq = (a, b) => (o.flags.i ? a.toLowerCase() === b.toLowerCase() : a === b);
    const groups = [];
    for (const l of lines) {
      const last = groups[groups.length - 1];
      if (last && eq(last.line, l)) last.n++; else groups.push({ line: l, n: 1 });
    }
    const out = groups.filter((x) => (o.flags.d ? x.n > 1 : o.flags.u ? x.n === 1 : true))
      .map((x) => (o.flags.c ? `${String(x.n).padStart(7)} ${x.line}` : x.line));
    io.out(joinLines(out));
    return 0;
  };

  function parseList(s) {
    const ranges = [];
    for (const part of s.split(',')) {
      const m = /^(\d*)(-?)(\d*)$/.exec(part);
      if (!m || (!m[1] && !m[3])) return null;
      const a = m[1] ? +m[1] : 1; const b = m[2] ? (m[3] ? +m[3] : Infinity) : a;
      if (a < 1) return 0;
      ranges.push([a, b]);
    }
    return ranges;
  }
  CMDS.cut = function (argv, io) {
    const o = getopts(argv, 'dfcb', io, 'cut');
    if (o.bad) return 1;
    const delim = o.vals.d ? o.vals.d[o.vals.d.length - 1] : '\t';
    if ([...delim].length !== 1) { io.err("cut: the delimiter must be a single character\nTry 'cut --help' for more information.\n"); return 1; }
    const spec = o.vals.f || o.vals.c || o.vals.b;
    if (!spec) { io.err("cut: you must specify a list of bytes, characters, or fields\nTry 'cut --help' for more information.\n"); return 1; }
    const ranges = parseList(spec[0]);
    if (ranges === 0) { io.err(`cut: ${o.vals.f ? 'fields' : 'byte/character positions'} are numbered from 1\nTry 'cut --help' for more information.\n`); return 1; }
    if (!ranges) { io.err(`cut: invalid ${o.vals.f ? 'field' : 'byte/character position'} list\nTry 'cut --help' for more information.\n`); return 1; }
    const inR = (i) => ranges.some(([a, b]) => i >= a && i <= b);
    const { list, bad } = this.inputs('cut', o.rest, io);
    const out = [];
    for (const x of list) {
      for (const line of splitLines(x.data)) {
        if (o.vals.f) {
          if (!line.includes(delim)) { if (!o.flags.s) out.push(line); continue; }
          out.push(line.split(delim).filter((_, i) => inR(i + 1)).join(delim));
        } else out.push([...line].filter((_, i) => inR(i + 1)).join(''));
      }
    }
    io.out(joinLines(out));
    return bad ? 1 : 0;
  };

  function headTail(sh, argv, io, cmd) {
    const args = argv.slice(); let n = 10; let fromStart = false;
    for (let i = 1; i < args.length; i++) {
      const m = /^-(\d+)$/.exec(args[i]);
      if (m) { n = +m[1]; args.splice(i--, 1); }
    }
    const o = getopts(args, 'nc', io, cmd);
    if (o.bad) return 1;
    if (o.vals.n) {
      const v = o.vals.n[o.vals.n.length - 1];
      if (!/^[+-]?\d+$/.test(v)) { io.err(`${cmd}: invalid number of lines: '${v}'\n`); return 1; }
      fromStart = v[0] === '+'; n = Math.abs(parseInt(v, 10));
    }
    const { list, bad } = sh.inputs(cmd, o.rest, io);
    let out = '';
    list.forEach((x, k) => {
      if (list.length > 1) out += (k ? '\n' : '') + `==> ${x.name} <==\n`;
      const lines = splitLines(x.data);
      const sel = cmd === 'head' ? lines.slice(0, n) : fromStart ? lines.slice(Math.max(0, n - 1)) : (n ? lines.slice(-n) : []);
      out += joinLines(sel);
    });
    io.out(out);
    return bad ? 1 : 0;
  }
  CMDS.head = function (argv, io) { return headTail(this, argv, io, 'head'); };
  CMDS.tail = function (argv, io) { return headTail(this, argv, io, 'tail'); };

  function trSet(s, io) {
    const out = [];
    const chars = [...processEscapes(s)];
    for (let i = 0; i < chars.length; i++) {
      if (chars[i] === '[' && chars[i + 1] === ':') {
        const rest = chars.slice(i).join(''); const m = /^\[:([a-z]+):\]/.exec(rest);
        if (m) {
          const map = { lower: 'abcdefghijklmnopqrstuvwxyz', upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', digit: '0123456789', space: ' \t\n\r\f\v', blank: ' \t', punct: '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~' };
          map.alpha = map.lower + map.upper; map.alnum = map.alpha + map.digit;
          if (!map[m[1]]) { io.err(`tr: invalid character class '${m[1]}'\n`); return null; }
          out.push(...map[m[1]]); i += m[0].length - 1; continue;
        }
      }
      if (chars[i + 1] === '-' && i + 2 < chars.length) {
        const a = chars[i].codePointAt(0); const b = chars[i + 2].codePointAt(0);
        if (b < a) { io.err(`tr: range-endpoints of '${chars[i]}-${chars[i + 2]}' are in reverse collating sequence order\n`); return null; }
        for (let c = a; c <= b; c++) out.push(String.fromCodePoint(c));
        i += 2; continue;
      }
      out.push(chars[i]);
    }
    return out;
  }
  CMDS.tr = function (argv, io) {
    const o = getopts(argv, '', io, 'tr');
    const d = o.flags.d; const sq = o.flags.s;
    const need = d && !sq ? 1 : sq && !d && o.rest.length < 2 ? 1 : 2;
    if (o.rest.length < need) {
      io.err(o.rest.length ? `tr: missing operand after '${o.rest[o.rest.length - 1]}'\nTwo strings must be given when translating.\nTry 'tr --help' for more information.\n` : "tr: missing operand\nTry 'tr --help' for more information.\n");
      return 1;
    }
    if (o.rest.length > need) { io.err(`tr: extra operand ‘${o.rest[need]}’${d && need === 1 ? '\nOnly one string may be given when deleting without squeezing repeats.' : ''}\nTry 'tr --help' for more information.\n`); return 1; }
    const s1 = trSet(o.rest[0], io); if (!s1) return 1;
    const s2 = o.rest[1] !== undefined ? trSet(o.rest[1], io) : []; if (!s2) return 1;
    let input = [...io.stdin.readAll()];
    if (d) {
      const del = new Set(s1); input = input.filter((c) => !del.has(c));
      if (sq) { const sset = new Set(s2); input = input.filter((c, i) => !(sset.has(c) && input[i - 1] === c)); }
    } else {
      if (need === 2 && !s2.length) { io.err("tr: when not truncating set1, string2 must be non-empty\n"); return 1; }
      if (need === 2) {
        const map = new Map();
        s1.forEach((c, i) => map.set(c, s2[Math.min(i, s2.length - 1)]));
        input = input.map((c) => (map.has(c) ? map.get(c) : c));
      }
      if (sq) { const sset = new Set(need === 2 ? s2 : s1); input = input.filter((c, i) => !(sset.has(c) && input[i - 1] === c)); }
    }
    io.out(input.join(''));
    return 0;
  };

  CMDS.awk = function (argv, io) {
    let i = 1; let FS = ' '; const vars = {};
    while (i < argv.length) {
      const a = argv[i];
      if (a === '--') { i++; break; }
      if (a === '-F') { FS = argv[i + 1]; i += 2; continue; }
      if (a.startsWith('-F')) { FS = a.slice(2); i++; continue; }
      if (a === '-v' || a.startsWith('-v')) {
        const asg = a === '-v' ? argv[i + 1] : a.slice(2); i += a === '-v' ? 2 : 1;
        const m = /^([A-Za-z_]\w*)=([\s\S]*)$/.exec(asg || '');
        if (!m) { io.err(`awk: fatal: \`${asg}' is not a legal variable name\n`); return 2; }
        vars[m[1]] = processEscapes(m[2]); continue;
      }
      if (a[0] === '-' && a.length > 1) { io.err(`awk: not an option: ${a}\n`); return 2; }
      break;
    }
    if (FS === undefined) { io.err('awk: option requires an argument -- F\n'); return 2; }
    FS = FS === 't' ? '\t' : processEscapes(FS);
    const progSrc = argv[i++];
    if (progSrc === undefined) { io.err('Usage: awk [POSIX or GNU style options] -f progfile [--] file ...\nUsage: awk [POSIX or GNU style options] [--] \'program\' file ...\n'); return 2; }
    const files = argv.slice(i);
    let prog;
    try { prog = awkParse(progSrc); } catch (e) {
      if (e instanceof AwkErr) { io.err(`awk: cmd. line:1: ${progSrc.split('\n')[0]}\nawk: cmd. line:1: ${e.message}\n`); return 2; }
      throw e;
    }
    const sh = this; let out = '';
    try {
      const code = awkRun(prog, {
        FS, vars,
        out: (s) => { out += s; if (out.length > MAX_OUT) throw new Limit('output'); },
        tick: () => sh.tick(),
        inputs: function* () {
          if (!files.length) { yield { name: '', data: io.stdin.readAll() }; return; }
          for (const f of files) {
            if (f === '-') { yield { name: '', data: io.stdin.readAll() }; continue; }
            const n = sh.lookup(f);
            if (!n) throw new AwkErr(`fatal: cannot open file \`${f}' for reading: No such file or directory`);
            if (n.t === 'd') { io.err(`awk: warning: command line argument \`${f}' is a directory: skipped\n`); continue; }
            if (!(n.mode & 0o400)) throw new AwkErr(`fatal: cannot open file \`${f}' for reading: Permission denied`);
            yield { name: f, data: n.data };
          }
        },
        write: (name, text, append) => { if (!sh.writeFile(name, text, append, io, 'awk')) throw new AwkErr(`fatal: can't redirect to \`${name}'`); },
        pipe: (cmd, data) => {
          const sub = sh.sub(false);
          sub.execList(parse(cmd), { stdin: new Stream(data), out: (s) => { out += s; }, err: io.err, tty: false });
        }
      });
      io.out(out);
      return code;
    } catch (e) {
      if (e instanceof AwkErr) { io.out(out); io.err(`awk: cmd. line:1: ${e.message}\n`); return 2; }
      throw e;
    }
  };

  CMDS.expr = function (argv, io) {
    const a = argv.slice(1);
    const isInt = (s) => /^-?\d+$/.test(s);
    if (!a.length) { io.err("expr: missing operand\nTry 'expr --help' for more information.\n"); return 2; }
    let res;
    if (a.length === 1) res = a[0];
    else if (a.length === 3) {
      const [x, op, y] = a;
      if (['+', '-', '*', '/', '%'].includes(op)) {
        if (!isInt(x) || !isInt(y)) { io.err('expr: non-integer argument\n'); return 2; }
        const X = parseInt(x, 10); const Y = parseInt(y, 10);
        if ((op === '/' || op === '%') && Y === 0) { io.err('expr: division by zero\n'); return 2; }
        res = String(op === '+' ? X + Y : op === '-' ? X - Y : op === '*' ? X * Y : op === '/' ? Math.trunc(X / Y) : X % Y);
      } else if (['<', '<=', '=', '==', '!=', '>=', '>'].includes(op)) {
        const num = isInt(x) && isInt(y); const X = num ? +x : x; const Y = num ? +y : y;
        res = String(+({ '<': X < Y, '<=': X <= Y, '=': X === Y, '==': X === Y, '!=': X !== Y, '>=': X >= Y, '>': X > Y }[op]));
      } else if (x === 'length') { res = String(y.length); }
      else { io.err(`expr: syntax error: unexpected argument '${op}'\n`); return 2; }
    } else if (a.length === 2 && a[0] === 'length') res = String(a[1].length);
    else { io.err(`expr: syntax error: unexpected argument '${a[3] || a[1]}'\n`); return 2; }
    io.out(res + '\n');
    return res === '0' || res === '' ? 1 : 0;
  };

  CMDS.seq = function (argv, io) {
    const a = argv.slice(1).map(Number);
    if (!a.length || a.some(Number.isNaN)) { io.err("seq: missing operand\nTry 'seq --help' for more information.\n"); return 1; }
    const [first, step, last] = a.length === 1 ? [1, 1, a[0]] : a.length === 2 ? [a[0], 1, a[1]] : a;
    const out = [];
    if (step) for (let x = first; step > 0 ? x <= last : x >= last; x += step) { out.push(String(x)); if (out.length > 10000) break; }
    io.out(joinLines(out)); return 0;
  };
  CMDS.tee = function (argv, io) {
    const o = getopts(argv, '', io, 'tee');
    const data = io.stdin.readAll();
    let st = 0;
    for (const f of o.rest) if (!this.writeFile(f, data, o.flags.a, io, 'tee')) st = 1;
    io.out(data); return st;
  };
  CMDS.sleep = () => 0;
  CMDS.whoami = function (argv, io) { io.out(USER + '\n'); return 0; };
  CMDS.hostname = function (argv, io) { io.out(HOST + '\n'); return 0; };
  CMDS.id = function (argv, io) { io.out('uid=1000(ogrenci) gid=1000(ogrenci) groups=1000(ogrenci)\n'); return 0; };
  CMDS.uname = function (argv, io) {
    const o = getopts(argv, '', io, 'uname'); const f = o.flags;
    const parts = { s: 'Linux', n: HOST, r: '6.8.0-45-generic', v: '#45-Ubuntu SMP PREEMPT_DYNAMIC', m: 'x86_64', o: 'GNU/Linux' };
    const keys = f.a ? ['s', 'n', 'r', 'v', 'm', 'o'] : ['s', 'n', 'r', 'v', 'm', 'o'].filter((k) => f[k]);
    io.out((keys.length ? keys : ['s']).map((k) => parts[k]).join(' ') + '\n'); return 0;
  };
  CMDS.date = function (argv, io) {
    const d = new Date(this.now());
    const off = -d.getTimezoneOffset(); const tz = (off >= 0 ? '+' : '-') + p2(Math.floor(Math.abs(off) / 60)) + (Math.abs(off) % 60 ? p2(Math.abs(off) % 60) : '');
    const fmt = argv[1] && argv[1][0] === '+' ? argv[1].slice(1) : '%a %b %e %H:%M:%S %Z %Y';
    const map = {
      Y: d.getFullYear(), y: p2(d.getFullYear() % 100), m: p2(d.getMonth() + 1), d: p2(d.getDate()), e: String(d.getDate()).padStart(2),
      H: p2(d.getHours()), M: p2(d.getMinutes()), S: p2(d.getSeconds()), a: DAYS[d.getDay()], b: MONTHS[d.getMonth()],
      A: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d.getDay()],
      B: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][d.getMonth()],
      Z: tz, s: Math.floor(d.getTime() / 1000), n: '\n', t: '\t', '%': '%'
    };
    map.T = `${map.H}:${map.M}:${map.S}`; map.D = `${map.m}/${map.d}/${map.y}`; map.F = `${map.Y}-${map.m}-${map.d}`;
    io.out(fmt.replace(/%([A-Za-z%])/g, (m, k) => (k in map ? String(map[k]) : m)) + '\n');
    return 0;
  };
  const PS = [
    ['root', 1, '0.0', '0.1', 167744, 11420, '?', 'Ss', '09:12', '0:02', '/sbin/init'],
    ['root', 2, '0.0', '0.0', 0, 0, '?', 'S', '09:12', '0:00', '[kthreadd]'],
    ['root', 412, '0.0', '0.1', 48212, 7652, '?', 'Ss', '09:12', '0:00', '/lib/systemd/systemd-journald'],
    ['root', 733, '0.0', '0.0', 15420, 9128, '?', 'Ss', '09:12', '0:00', 'sshd: /usr/sbin/sshd -D'],
    ['syslog', 741, '0.0', '0.0', 222404, 5340, '?', 'Ssl', '09:12', '0:00', '/usr/sbin/rsyslogd -n'],
    ['root', 802, '0.0', '0.0', 9492, 2836, '?', 'Ss', '09:12', '0:00', '/usr/sbin/cron -f'],
    ['ogrenci', 1520, '0.0', '0.0', 10012, 5240, 'pts/0', 'Ss', '09:30', '0:00', '-bash'],
    ['ogrenci', 1688, '0.0', '0.0', 11484, 3260, 'pts/0', 'R+', '09:41', '0:00', 'ps aux']
  ];
  CMDS.ps = function (argv, io) {
    const full = argv.slice(1).some((a) => /a|u|x|e|f/.test(a));
    if (!full) { io.out('    PID TTY          TIME CMD\n   1520 pts/0    00:00:00 bash\n   1688 pts/0    00:00:00 ps\n'); return 0; }
    let out = 'USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND\n';
    for (const r of PS) {
      out += `${r[0].padEnd(8)} ${String(r[1]).padStart(7)} ${r[2].padStart(4)} ${r[3].padStart(4)} ${String(r[4]).padStart(6)} ${String(r[5]).padStart(5)} ${r[6].padEnd(8)} ${r[7].padEnd(4)} ${r[8]}   ${r[9]} ${r[10]}\n`;
    }
    io.out(out);
    return 0;
  };
  CMDS.env = function (argv, io) { io.out([...this.exported].filter((k) => this.vars[k] !== undefined || k === 'PWD').sort().map((k) => `${k}=${this.getVar(k)}\n`).join('')); return 0; };
  CMDS.printenv = CMDS.env;

  CMDS.bash = function (argv, io) {
    const f = argv[1];
    if (!f) { io.err('bash: bu laboratuvarda iç içe etkileşimli kabuk açılmaz; bir betik adı ver (bash betik.sh)\n'); return 1; }
    if (f === '-c') return this.sub(false).runScript(argv[2] || '', 'bash', argv.slice(3), io, true);
    const n = this.lookup(f);
    if (!n) { io.err(`bash: ${f}: No such file or directory\n`); return 127; }
    if (n.t === 'd') { io.err(`bash: ${f}: Is a directory\n`); return 126; }
    if (!(n.mode & 0o400)) { io.err(`bash: ${f}: Permission denied\n`); return 126; }
    return this.runScript(n.data, f, argv.slice(2), io, false);
  };
  CMDS.sh = CMDS.bash;

  // Düzenleyici: arayüz kendi penceresini açar
  function editor(argv, io) {
    const f = argv.slice(1).find((a) => a[0] !== '-');
    if (!f) { io.err(`${argv[0]}: bu laboratuvarda dosya adı vermelisin (ör. ${argv[0]} deneme.sh)\n`); return 1; }
    const n = this.lookup(f);
    if (n && n.t === 'd') { io.err(`${argv[0]}: ${f}: Is a directory\n`); return 1; }
    const { dir } = this.parentOf(f);
    if (!n && !dir) { io.err(`${argv[0]}: ${f}: No such file or directory\n`); return 1; }
    this.ctx.signals.editor = '/' + this.resolve(f).join('/');
    return 0;
  }
  CMDS.nano = editor; CMDS.vi = editor; CMDS.vim = editor; CMDS.pico = editor;

  const MAN = {
    ls: ['dizin içeriğini listeler', 'ls [SEÇENEK]... [DOSYA]...', [['-l', 'ayrıntılı liste: tür ve izinler, bağ sayısı, sahip, grup, boyut, tarih, ad'], ['-a', '. ile başlayan gizli girdileri de gösterir'], ['-1', 'her satıra bir ad']], 'ls -l *.txt'],
    cd: ['çalışma dizinini değiştirir (kabuğun yerleşik komutu)', 'cd [DİZİN]', [['cd ..', 'bir üst dizine çıkar'], ['cd', 'ev dizinine (~) döner']], 'cd notlar'],
    pwd: ['bulunduğun dizinin tam yolunu yazar', 'pwd', [], 'pwd'],
    mkdir: ['dizin oluşturur', 'mkdir [-p] DİZİN...', [['-p', 'ara dizinleri de oluşturur, varsa hata vermez']], 'mkdir deneme'],
    rmdir: ['yalnızca BOŞ dizini siler', 'rmdir DİZİN...', [], 'rmdir deneme'],
    rm: ['dosya ve dizin siler (çöp kutusu yoktur!)', 'rm [-rf] DOSYA...', [['-r', 'dizini içindekilerle birlikte siler'], ['-f', 'olmayan dosya için hata vermez']], 'rm -r deneme'],
    touch: ['boş dosya oluşturur; dosya varsa tarihini günceller', 'touch DOSYA...', [], 'touch notlar.txt'],
    cp: ['kopyalar', 'cp [-r] KAYNAK HEDEF', [['-r', 'dizinleri de kopyalar']], 'cp ogrenci.txt yedek.txt'],
    mv: ['taşır; aynı dizinde yeniden adlandırır', 'mv KAYNAK HEDEF', [], 'mv deneme deneme.sh'],
    cat: ['dosyaların içeriğini art arda yazar', 'cat [-n] [DOSYA]...', [['-n', 'satırları numaralar'], ['(dosyasız)', 'standart girdiyi okur']], 'cat ogrenci.txt'],
    nano: ['metin düzenleyici', 'nano DOSYA', [['Ctrl+O', 'kaydeder'], ['Ctrl+X', 'çıkar']], 'nano deneme.sh'],
    man: ['komutun kullanım kılavuzunu gösterir', 'man KOMUT', [], 'man ls'],
    chmod: ['dosya izinlerini değiştirir', 'chmod İZİN DOSYA...', [['sayısal', 'r=4, w=2, x=1; sahip, grup, diğerleri: chmod 750 dosya'], ['sembolik', 'u,g,o,a ile + - =: chmod u+x,g-w dosya (virgülden sonra boşluk yok)']], 'chmod 765 dosya.txt'],
    echo: ['metni yazar', 'echo [-n] [-e] METİN...', [['-e', '\\n, \\t gibi kaçış dizilerini işler'], ['-n', 'sona satır sonu eklemez'], ['> / >>', 'çıktıyı dosyaya yazar / dosyanın sonuna ekler']], 'echo "Merhaba, $isim!"'],
    read: ['standart girdiden bir satır okuyup değişkene koyar', 'read [-p İSTEM] DEĞİŞKEN...', [['-p', 'okumadan önce istem metnini yazar']], 'read -p "Adın: " isim'],
    grep: ['kalıbı içeren satırları süzer', 'grep [SEÇENEK] KALIP [DOSYA]...', [['-c', 'eşleşen SATIR sayısını yazar'], ['-o', 'yalnızca eşleşen parçayı, her birini ayrı satıra yazar'], ['-v', 'kalıbı İÇERMEYEN satırlar'], ['-i', 'büyük/küçük harf ayırmaz'], ['-n', 'satır numarasını da yazar'], ['^ / $', 'satır başı / satır sonu']], "grep -o 'kabuk' metin.txt | wc -l"],
    egrep: ['grep -E: genişletilmiş düzenli ifadeyle süzer', 'egrep KALIP [DOSYA]...', [['a|b', 'a veya b']], 'ps aux | egrep root'],
    wc: ['satır, sözcük ve bayt sayar', 'wc [-lwc] [DOSYA]...', [['-l', 'satır sayısı'], ['-w', 'sözcük sayısı'], ['-c', 'bayt sayısı']], 'wc -l ogrenci.txt'],
    tr: ['karakterleri dönüştürür ya da siler; YALNIZCA standart girdiyi okur', 'tr [-d] KÜME1 [KÜME2]', [['a-z A-Z', 'küçük harfleri büyütür'], ["';' ','", 'noktalı virgülleri virgüle çevirir'], ["-d ';'", 'noktalı virgülleri siler']], "cat birdosya.txt | tr ';' ','"],
    sort: ['satırları sıralar', 'sort [SEÇENEK] [DOSYA]...', [['-n', 'sayısal sıralama (yoksa 10, 9\'dan önce gelir)'], ['-r', 'ters sıra'], ["-t ';'", 'sütun ayırıcı'], ['-k 4', '4. sütuna göre'], ['-u', 'aynı satırları bir kez yazar']], "sort -t';' -k4 -nr ogrenci.txt"],
    uniq: ['YAN YANA duran aynı satırları birleştirir (önce sort!)', 'uniq [-c] [DOSYA]', [['-c', 'her satırın kaç kez tekrarlandığını yazar'], ['-d', 'yalnızca tekrarlananlar']], 'sort | uniq -c'],
    cut: ['her satırdan sütun ya da karakter keser', 'cut -d AYIRICI -f LİSTE [DOSYA]', [['-d', 'ayırıcı (varsayılan sekme)'], ['-f 1,3', '1. ve 3. sütun'], ['-f 2-4', '2. ile 4. arası']], "cut -d';' -f1 ogrenci.txt"],
    head: ['ilk satırları yazar', 'head [-n N] [DOSYA]', [['-n 3 / -3', 'ilk 3 satır']], 'head -3 ogrenci.txt'],
    tail: ['son satırları yazar', 'tail [-n N] [DOSYA]', [['-n 3 / -3', 'son 3 satır'], ['-n +2', '2. satırdan sonuna']], 'tail -2 ogrenci.txt'],
    awk: ['satır satır okur, sütunlara böler; desen doğruysa eylemi yapar', "awk [-F AYIRICI] 'desen { eylem }' [DOSYA]", [['$1, $2, $0', '1. sütun, 2. sütun, satırın tamamı'], ['NR, NF', 'satır numarası, sütun sayısı'], ["-F ';'", 'sütun ayırıcı'], ['END { }', 'tüm satırlardan sonra bir kez çalışır']], "awk -F ';' 'int($2)>3' birdosya.txt"],
    ps: ['çalışan işlemleri listeler', 'ps [aux]', [['aux', 'tüm kullanıcıların tüm işlemleri, ayrıntılı']], 'ps aux | egrep root'],
    expr: ['ifade hesaplar; her parça ayrı argümandır', 'expr SAYI İŞLEÇ SAYI', [['\\*', 'çarpma; * kabukta joker olduğu için kaçırılır'], ['boşluk', 'expr 5+3 hesaplamaz, "5+3" yazar']], 'expr 5 \\* 3'],
    test: ['koşul sınar; [ ifade ] ile aynıdır', '[ İFADE ]', [['-eq -ne -lt -le -gt -ge', 'sayı karşılaştırma'], ['== !=', 'metin karşılaştırma'], ['-z / -n', 'boş / boş değil'], ['-e', 'dosya var mı']], '[ $sayi -gt 5 ]'],
    bash: ['bir betiği yeni bir bash ile çalıştırır (çalıştırma izni gerekmez)', 'bash BETİK [ARGÜMAN]...', [], 'bash kontrol.sh']
  };
  CMDS.man = function (argv, io) {
    const c = argv[1];
    if (!c) { io.err('What manual page do you want?\nFor example, try \'man man\'.\n'); return 1; }
    const k = c === '[' ? 'test' : c;
    const m = MAN[k];
    if (!m) { io.err(`No manual entry for ${c}\n`); return 16; }
    let out = `${k.toUpperCase()}(1) — ${m[0]}\n\nKULLANIM\n    ${m[1]}\n`;
    if (m[2].length) { const w = Math.max(...m[2].map((x) => x[0].length)); out += '\nSEÇENEKLER\n' + m[2].map(([a, b]) => `    ${a.padEnd(w)}   ${b}\n`).join(''); }
    out += `\nÖRNEK\n    ${m[3]}\n\n(Laboratuvar özeti. Gerçek man sayfası İngilizcedir ve q ile kapanır.)\n`;
    io.out(out); return 0;
  };

  BUILTINS.help = function (argv, io) {
    io.out([
      'Bu terminalde çalışan komutlar:',
      '  gezinme   ls  cd  pwd',
      '  dosya     cat  touch  mkdir  rmdir  rm  cp  mv  chmod  nano',
      '  metin     echo  printf  grep  egrep  wc  tr  sort  uniq  cut  head  tail  awk  tee  seq',
      '  kabuk     read  test [ ]  let  expr  export  unset  source  bash  exit',
      '  sistem    ps  date  uname  whoami  hostname  id  history  clear  man',
      '  yapılar   if/then/elif/else/fi  for/while/until  case/esac  fonksiyon(){ }',
      'İpucu: man KOMUT kısa Türkçe özet verir. Yukarı ok önceki komutu getirir, Tab adı tamamlar.',
      ''
    ].join('\n'));
    return 0;
  };

  /* ================================================================ dışa açılan arayüz */

  S.run = function (src, opt) {
    opt = opt || {};
    const ctx = this.ctx;
    const res = { display: [], stdout: '', stderr: '', status: 0 };
    let size = 0;
    ctx.steps = 0; ctx.tty = opt.input || []; ctx.ttyPos = 0; ctx.signals = {};
    ctx.push = (kind, s) => {
      if (!s) return;
      size += s.length;
      if (size > MAX_OUT) throw new Limit('output');
      const last = res.display[res.display.length - 1];
      if (last && last.k === kind) last.s += s; else res.display.push({ k: kind, s });
    };
    const io = {
      stdin: new TtyStream(ctx),
      out: (s) => { res.stdout += s; ctx.push('out', s); },
      err: (s) => { res.stderr += s; ctx.push('err', s); },
      tty: true
    };
    try {
      const ast = parse(src);
      this.execList(ast, io);
    } catch (e) {
      if (e instanceof NeedInput) res.needInput = true;
      else if (e instanceof SyntaxErr) { io.err(`bash: ${e.message}\n`); this.status = 2; }
      else if (e instanceof Flow && e.kind === 'exit') { this.status = e.n; res.exit = true; }
      else if (e instanceof Flow) { this.status = 0; }
      else if (e instanceof Limit) {
        res.limit = e.what;
        const msg = e.what === 'output' ? 'çıktı çok uzadı, komut durduruldu' : `komut ${MAX_STEPS} adımı aştı (sonsuz döngü?), durduruldu`;
        res.display.push({ k: 'err', s: `^C\n[laboratuvar: ${msg}]\n` });
        this.status = 130;
      } else throw e;
    }
    res.status = this.status;
    Object.assign(res, ctx.signals);
    return res;
  };

  S.snapshot = function () {
    return { root: cloneTree(this.root), cwd: this.cwd.slice(), vars: JSON.parse(JSON.stringify(this.vars)), exported: [...this.exported], funcs: Object.assign({}, this.funcs), status: this.status };
  };
  S.restore = function (s) {
    this.root = cloneTree(s.root); this.cwd = s.cwd.slice();
    this.vars = Object.assign(Object.create(null), JSON.parse(JSON.stringify(s.vars)));
    this.exported = new Set(s.exported); this.funcs = Object.assign(Object.create(null), s.funcs); this.status = s.status;
  };
  // Çözümü denemek için bağımsız kopya
  S.clone = function () {
    const c = new Shell({ clock: this.ctx.clock });
    c.restore(this.snapshot());
    return c;
  };
  S.reset = function () {
    const fresh = new Shell({ clock: this.ctx.clock });
    this.root = fresh.root; this.cwd = fresh.cwd; this.vars = fresh.vars; this.exported = fresh.exported;
    this.funcs = fresh.funcs; this.status = 0;
  };
  S.writePath = function (abs, data) {
    const n = this.lookup(abs);
    if (n && n.t === 'f') { n.data = data; this.touchNode(n); return true; }
    const { dir, name } = this.parentOf(abs);
    if (!dir) return false;
    dir.kids[name] = fileNode(data, 0o644, this.now());
    return true;
  };
  S.statPath = function (p) { const n = this.lookup(p); return n ? { type: n.t, mode: n.mode, data: n.t === 'f' ? n.data : null, kids: n.t === 'd' ? Object.keys(n.kids) : null } : null; };
  S.modeOf = function (p) { const n = this.lookup(p); return n ? n.mode : null; };
  S.cwdPath = function () { return this.pwd(); };

  // Tab tamamlama: [ortak önek, adaylar]
  S.complete = function (line) {
    const m = /(\S*)$/.exec(line); const word = m[1];
    const first = !line.slice(0, line.length - word.length).trim() || /[|;&]\s*$/.test(line.slice(0, line.length - word.length));
    let cands;
    if (first && !word.includes('/')) {
      cands = [...new Set([...Object.keys(BUILTINS), ...Object.keys(CMDS), ...Object.keys(this.funcs)])].filter((c) => c.startsWith(word) && /^[a-z]/.test(c)).sort();
    } else {
      const k = word.lastIndexOf('/');
      const dirStr = word.slice(0, k + 1); const base = word.slice(k + 1);
      const dir = this.lookup(dirStr || '.') || (dirStr === '/' ? this.root : null);
      if (!dir || dir.t !== 'd') return { word, cands: [] };
      cands = Object.keys(dir.kids).filter((nm) => nm.startsWith(base) && (base[0] === '.' || nm[0] !== '.')).sort(collate)
        .map((nm) => dirStr + nm + (dir.kids[nm].t === 'd' ? '/' : ''));
    }
    return { word, cands };
  };

  OSLab.ShellEngine = {
    create: (opts) => new Shell(opts),
    files: () => Object.assign({}, FILES, SCRIPTS),
    commands: () => [...Object.keys(BUILTINS), ...Object.keys(CMDS)]
  };
})(typeof window !== 'undefined' ? (window.OSLab = window.OSLab || {}) : module.exports);
