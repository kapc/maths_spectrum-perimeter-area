/* Tiny helpers: DOM builders, storage, settings, speech, soft sound, animation. */
(function (g) {
  'use strict';
  const SVGNS = 'http://www.w3.org/2000/svg';

  function build(el, attrs, kids) {
    if (attrs) {
      for (const k in attrs) {
        const v = attrs[k];
        if (v == null || v === false) continue;
        if (k === 'class') el.setAttribute('class', v);
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else if (k === 'html') el.innerHTML = v;
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    (function add(list) {
      for (const c of list) {
        if (c == null || c === false) continue;
        if (Array.isArray(c)) add(c);
        else el.appendChild(c.nodeType ? c : document.createTextNode(String(c)));
      }
    })(kids);
    return el;
  }
  g.h = (tag, attrs, ...kids) => build(document.createElement(tag), attrs, kids);
  g.s = (tag, attrs, ...kids) => build(document.createElementNS(SVGNS, tag), attrs, kids);
  g.clear = (el) => { while (el.firstChild) el.removeChild(el.firstChild); return el; };

  /* ---------- storage ---------- */
  const KEY = 'dino-pa-v1';
  const DEF = () => ({
    settings: { sound: false, read: false, reduceMotion: false, walk: '#2563eb', cover: '#f97316', size: 1, openAll: false },
    progress: {},   // sid -> { days: {date: {streak, best, tries, ok}}, secure: bool, doneDays: [] }
    errors: [],     // {date,time,sid,pid,type,step,got,expected}
    notes: [],      // {date,sid,text}
  });
  let data;
  try {
    data = Object.assign(DEF(), JSON.parse(localStorage.getItem(KEY) || '{}'));
    data.settings = Object.assign(DEF().settings, data.settings);
  } catch (e) { data = DEF(); }

  const Store = {
    data,
    save() { try { localStorage.setItem(KEY, JSON.stringify(data)); } catch (e) { /* private mode: ignore */ } },
    today() { return new Date().toLocaleDateString('en-CA'); },
    prog(sid) {
      if (!data.progress[sid]) data.progress[sid] = { days: {}, secure: false, doneDays: [] };
      return data.progress[sid];
    },
    /* one independent try: ok = right first time, no help */
    recordTry(sid, ok) {
      const p = Store.prog(sid);
      const d = Store.today();
      const day = p.days[d] || (p.days[d] = { streak: 0, best: 0, tries: 0, ok: 0 });
      day.tries++;
      if (ok) { day.ok++; day.streak++; day.best = Math.max(day.best, day.streak); } else day.streak = 0;
      Store.save();
    },
    goodDays(sid, need) {
      const p = Store.prog(sid);
      return Object.keys(p.days).filter((k) => p.days[k].best >= need).length;
    },
    isSecure(sid, need) { return Store.prog(sid).secure || Store.goodDays(sid, need) >= 2; },
    markDone(sid) {
      const p = Store.prog(sid), d = Store.today();
      if (p.doneDays.indexOf(d) < 0) p.doneDays.push(d);
      Store.save();
    },
    logError(e) {
      e.date = Store.today(); e.time = new Date().toLocaleTimeString('en-GB').slice(0, 5);
      data.errors.push(e);
      if (data.errors.length > 400) data.errors.shift();
      Store.save();
    },
    addNote(sid, text) { data.notes.push({ date: Store.today(), sid, text }); Store.save(); },
    apply() {
      const st = data.settings, r = document.documentElement.style;
      r.setProperty('--walk', st.walk);
      r.setProperty('--cover', st.cover);
      r.setProperty('--size', st.size);
      document.body.classList.toggle('reduce-motion', !!st.reduceMotion);
    },
    reset() { localStorage.removeItem(KEY); location.reload(); },
  };
  g.Store = Store;

  /* ---------- speech (only when asked, slow and clear) ---------- */
  g.Speak = {
    say(text, force) {
      if (!('speechSynthesis' in window)) return;
      if (!force && !data.settings.read) return;
      try {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(String(text).replace(/[×]/g, ' times ').replace(/[−]/g, ' minus ').replace(/÷/g, ' divided by '));
        u.rate = 0.85;
        speechSynthesis.speak(u);
      } catch (e) { /* ignore */ }
    },
    stop() { try { speechSynthesis.cancel(); } catch (e) { /* ignore */ } },
  };

  /* ---------- sound: one soft chime for success only. Never a buzzer. ---------- */
  let ctx;
  g.Chime = function () {
    if (!data.settings.sound) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      const t = ctx.currentTime;
      [523.25, 659.25].forEach((f, i) => {
        const o = ctx.createOscillator(), gn = ctx.createGain();
        o.type = 'sine'; o.frequency.value = f;
        gn.gain.setValueAtTime(0.0001, t + i * 0.14);
        gn.gain.exponentialRampToValueAtTime(0.08, t + i * 0.14 + 0.04);
        gn.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.14 + 0.5);
        o.connect(gn); gn.connect(ctx.destination);
        o.start(t + i * 0.14); o.stop(t + i * 0.14 + 0.55);
      });
    } catch (e) { /* ignore */ }
  };

  /* ---------- animation ---------- */
  g.tween = function (ms, fn) {
    return new Promise((res) => {
      if (data.settings.reduceMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { fn(1); res(); return; }
      const t0 = performance.now();
      (function step(now) {
        let t = Math.min(1, (now - t0) / ms);
        const e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        fn(e);
        if (t < 1) requestAnimationFrame(step); else res();
      })(t0);
    });
  };
  g.sleep = (ms) => new Promise((r) => setTimeout(r, (data.settings.reduceMotion ? Math.min(ms, 80) : ms)));

  g.parseNum = function (str) {
    const t = String(str).replace(/,/g, '').trim();
    if (t === '' || !/^-?\d*\.?\d+$/.test(t)) return null;
    return parseFloat(t);
  };
  g.fmt = (n) => Number.isInteger(n) ? n.toLocaleString('en-IN') : String(n);
  g.shuffle = (arr, seed) => {
    const a = arr.slice(); let x = seed || 7;
    for (let i = a.length - 1; i > 0; i--) { x = (x * 9301 + 49297) % 233280; const j = Math.floor((x / 233280) * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  g.hash = (str) => { let x = 0; for (let i = 0; i < str.length; i++) x = (x * 31 + str.charCodeAt(i)) >>> 0; return x; };
})(window);
