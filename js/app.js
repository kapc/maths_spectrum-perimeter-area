/* App shell: home map, the fixed session shape, break screen, desk mat, grown-up panel. */
(function () {
  'use strict';
  const app = document.getElementById('app');
  const overlay = document.getElementById('overlay');
  let cur = null;      // current session {sess, steps, i}
  let lastFocus = null;

  Store.apply();

  /* ---------- overlays ---------- */
  function openOverlay(content) {
    lastFocus = document.activeElement;
    clear(overlay).append(h('div', { class: 'sheet' }, content));
    overlay.hidden = false; overlay.scrollTop = 0;
  }
  function closeOverlay() { overlay.hidden = true; clear(overlay); Speak.stop(); if (lastFocus && lastFocus.focus) lastFocus.focus(); }
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !overlay.hidden) closeOverlay(); });

  /* ---------- chrome ---------- */
  function topbar(title, onHome) {
    return h('div', { class: 'top' },
      onHome ? h('button', { class: 'btn ghost small', onclick: onHome, 'aria-label': 'Back to the park' }, '← Park') : null,
      h('h1', null, title),
      h('button', { class: 'btn ghost small', onclick: showMat }, '📋 Desk mat'),
      h('button', { class: 'btn ghost small', onclick: showBreak }, '🧊 Break'),
      h('button', { class: 'btn ghost small', onclick: showGrownUp }, '🔒 Grown-up'));
  }
  const need = (sid) => SESSIONS[sid - 1].need;
  const available = (sid) => Store.data.settings.openAll || sid === 1 || Store.isSecure(sid - 1, need(sid - 1));

  /* ---------- HOME ---------- */
  function home() {
    cur = null; Speak.stop(); clear(app);
    const nextSid = (SESSIONS.find((x) => available(x.id) && !Store.isSecure(x.id, x.need)) || SESSIONS[SESSIONS.length - 1]).id;
    const nx = SESSIONS[nextSid - 1];
    const map = h('div', { class: 'map' }, SESSIONS.map((x) => {
      const ok = available(x.id), sec = Store.isSecure(x.id, x.need), p = Store.prog(x.id);
      const days = Object.keys(p.days).length + 0, doneN = p.doneDays.length;
      const st = sec ? '⭐ Secure' : !ok ? `Later: after session ${x.id - 1} is secure` : doneN ? `Done ${doneN} time${doneN > 1 ? 's' : ''}` : x.id === nextSid ? 'Start here' : 'Ready';
      return h('button', { class: 'stone' + (x.id === nextSid ? ' next' : '') + (ok ? '' : ' locked'), disabled: !ok, 'aria-label': `Session ${x.id}: ${x.title}. ${st}`, onclick: () => startSession(x.id) },
        h('span', { class: 'no' }, 'SESSION ' + x.id),
        (doneN || sec) ? parkDino(x.id, 54) : h('span', { style: 'font-size:2rem' }, x.icon),
        h('span', { class: 'tt' }, x.title),
        h('span', { class: 'hint' }, x.blurb),
        h('span', { class: 'st' }, st));
    }));
    app.append(h('div', { class: 'wrap' },
      topbar('🦖 Furfuri Nagar Dino Park'),
      h('div', { class: 'hero' },
        h('div', { class: 'scene' }, sceneSVG()),
        h('div', { style: 'flex:1 1 320px' },
          h('h2', null, 'Walk or Cover?'),
          h('div', { class: 'two' },
            h('div', { class: 'w' }, h('span', { class: 'walk-word' }, 'Perimeter is a walk.'), h('br'), 'Walk around the edge and come back to the start. cm or m.'),
            h('div', { class: 'c' }, h('span', { class: 'cover-word' }, 'Area is a cover.'), h('br'), 'Cover the inside with squares, no gaps. sq cm or sq m.')),
          h('button', { class: 'btn big', onclick: () => startSession(nextSid) }, `▶ Session ${nx.id}: ${nx.title}`),
          h('p', { class: 'hint' }, '20 to 30 minutes, then stop. No timers. No tests. Mistakes tell us what to fix.'))),
      h('h3', null, 'The ten sessions, in order'), map));
  }

  /* ---------- SESSION: the same shape every time ---------- */
  function startSession(sid) {
    const sess = SESSIONS[sid - 1];
    const steps = ['schedule'].concat(sid > 1 ? ['warmup'] : [], ['story', 'hands', 'drawing'], sess.problems.length ? ['numbers'] : [], ['check', 'finished']);
    cur = { sess, steps, i: 0 };
    render();
  }
  const stripKeys = () => cur.steps.filter((k) => k !== 'schedule');
  function strip(big) {
    const keys = stripKeys(), nowKey = cur.steps[cur.i];
    const nowIdx = keys.indexOf(nowKey);
    return h('div', { class: 'strip' + (big ? ' big' : ''), role: 'list', 'aria-label': 'Today in order' }, keys.map((k, n) => {
      const it = STRIP.find((x) => x.key === k);
      return h('div', { class: 'pic' + (nowKey !== 'schedule' && n === nowIdx ? ' now' : '') + (n < nowIdx ? ' done' : ''), role: 'listitem' }, h('span', { class: 'ico' }, it.ico), it.name);
    }));
  }
  function advance() { cur.i++; render(); window.scrollTo(0, 0); }

  function render() {
    const { sess } = cur, key = cur.steps[cur.i];
    clear(app);
    const stage = h('div', { id: 'stage' });
    app.append(h('div', { class: 'wrap' }, topbar(`Session ${sess.id}: ${sess.title}`, home), key === 'schedule' ? null : strip(false), stage));
    Speak.stop();
    ({ schedule, warmup, story, hands, drawing, numbers, check, finished })[key](stage, sess);
  }

  function schedule(root, sess) {
    root.append(h('div', { class: 'card' },
      h('h2', { style: 'margin-top:0' }, 'Today, in order'),
      strip(true),
      h('p', { style: 'font-size:1.15rem' }, 'First this, then this. No surprises.'),
      h('p', { class: 'hint' }, 'Today is about 20 to 30 minutes. Then we stop. Finished means finished. You can press the Break button at any time, and your place is saved.'),
      script(SCRIPT.keystone),
      h('button', { class: 'btn big', onclick: advance }, 'Start ▶')));
  }

  function warmup(root) {
    root.append(h('h2', null, 'Warm-up: walk or cover?'), h('p', { class: 'hint' }, 'Six cards. Sort each one. No numbers.'));
    sortCards(root, CARDS, { sid: cur.sess.id, onDone: advance });
  }

  function story(root, sess) {
    const all = sess.story.join(' ') + ' ' + sess.plain;
    root.append(h('div', { class: 'card' },
      h('div', { style: 'max-width:340px;margin:0 auto' }, sceneSVG()),
      h('div', { style: 'font-size:1.25rem;margin:10px 0' }, sess.story.map((l) => h('p', { style: 'margin:6px 0' }, l))),
      h('button', { class: 'btn ghost', onclick: () => Speak.say(all, true) }, '🔊 Read the story to me'),
      h('div', { class: 'script', style: 'margin-top:14px;font-size:1.2rem' }, h('div', null, h('b', null, 'Today in one plain sentence: '), sess.plain)),
      h('div', { class: 'pills' }, h('span', { class: 'tag-walk' }, 'WALK = blue = perimeter'), h('span', { class: 'tag-cover' }, 'COVER = orange = area')),
      h('div', { style: 'margin-top:12px' }, nextBtn(advance))));
    Speak.say(all);
  }

  function hands(root, sess) {
    let k = 0; const n = sess.hands.length;
    (function go() {
      clear(root);
      root.append(h('h2', { style: 'margin:0 0 4px' }, '✋ Hands'), h('div', { class: 'hint' }, `Touch the idea first. Part ${k + 1} of ${n}.`));
      HANDS[sess.hands[k].t](root, Object.assign({ sid: sess.id }, sess.hands[k]), () => { k++; if (k < n) { window.scrollTo(0, 0); go(); } else advance(); });
    })();
  }
  function drawing(root, sess) {
    root.append(h('h2', { style: 'margin:0 0 4px' }, '✏️ Drawing'));
    const box = h('div'); root.append(box);
    runDrawing(box, sess.drawing, advance);
  }
  function numbers(root, sess) {
    root.append(h('h2', { style: 'margin:0 0 4px' }, '🔢 Numbers'));
    const box = h('div'); root.append(box);
    runNumbers(box, sess, advance);
  }

  /* ---------- CHECK: spot the broken rule, say the sentence, teach the dinosaur ---------- */
  function check(root, sess) {
    root.append(h('h2', { style: 'margin:0 0 4px' }, '✅ Check'));
    const box = h('div'); root.append(box);
    const w = sess.wrong;
    function stage1() {
      clear(box);
      const msg = h('div', { class: 'fb' }), after = h('div');
      const opts = shuffle(w.options.map((t, i) => ({ t, ok: i === w.right })), hash('wrong' + sess.id));
      box.append(h('div', { class: 'card' }, h('h3', { style: 'margin-top:0' }, "Patlu's homework"),
        h('p', null, w.text), h('div', { class: 'sum-line', style: 'color:var(--ink)' }, w.working), h('b', null, w.q),
        h('div', { style: 'display:grid;gap:10px;margin-top:10px' }, opts.map((o) => h('button', { class: 'btn ghost', style: 'text-align:left;white-space:normal', onclick: (e) => {
          if (o.ok) { e.currentTarget.classList.add('right'); msg.className = 'fb ok'; msg.textContent = 'Yes. You found the broken rule. Checking a rule is a real skill.'; Chime(); box.querySelectorAll('button').forEach((b) => { b.disabled = true; }); after.append(nextBtn(stage2)); }
          else { Store.logError({ sid: sess.id, pid: 'spot', type: 'SPOT', step: 'Patlu homework', got: o.t, expected: w.options[w.right] }); msg.className = 'fb try'; msg.textContent = 'Not yet. Look at Patlu\'s working line, step by step. Which rule did he break?'; }
        } }, o.t))), msg, after));
    }
    function stage2() {
      clear(box);
      box.append(h('div', { class: 'card' }, h('h3', { style: 'margin-top:0' }, 'Say it out loud'),
        h('p', { style: 'font-size:1.4rem;font-weight:700' }, sess.closing),
        h('button', { class: 'btn ghost', onclick: () => Speak.say(sess.closing, true) }, '🔊 Hear it'), ' ',
        h('button', { class: 'btn', onclick: stage3 }, 'I said it ✓')));
    }
    function stage3() {
      clear(box);
      const ta = h('textarea', { rows: 2, style: 'width:100%;font-size:1.1rem;border:3px solid #4b5563;border-radius:12px;padding:8px', placeholder: 'In my own words, I learned...', 'aria-label': 'my sentence' });
      box.append(h('div', { class: 'card' }, h('h3', { style: 'margin-top:0' }, 'Teach-back'),
        h('p', { style: 'font-size:1.2rem' }, sess.teach),
        h('p', { class: 'hint' }, 'Teaching shows what a worksheet hides. He can explain with words, pointing, building, or typing. Grown-up: write his sentence exactly as he says it.'),
        ta, h('div', { style: 'margin-top:12px' }, nextBtn(() => { if (ta.value.trim()) Store.addNote(sess.id, ta.value.trim()); advance(); }, 'Finish ▶'))));
    }
    stage1();
  }

  function finished(root, sess) {
    Store.markDone(sess.id);
    const out = h('div');
    const choice = (label, text) => h('button', { class: 'btn ghost', onclick: () => { clear(out).append(h('div', { class: 'card' }, text)); Speak.say(text); } }, label);
    root.append(h('div', { class: 'card', style: 'text-align:center' },
      h('div', { style: 'display:flex;justify-content:center' }, parkDino(sess.id, 140)),
      h('h2', null, 'Finished.'),
      h('p', { style: 'font-size:1.2rem' }, `A new dinosaur joins the park. Session ${sess.id} is finished. Finished means finished.`),
      h('div', { class: 'pills', style: 'justify-content:center' }, STRIP.filter((x) => stripKeys().indexOf(x.key) >= 0 && x.key !== 'finished').map((x) => h('span', { class: 'tag-walk', style: 'background:var(--good)' }, '✓ ' + x.name))),
      h('h3', null, 'Choose your break'),
      h('div', { class: 'pills', style: 'justify-content:center' },
        choice('🦖 A dinosaur fact', DINO_FACTS[Math.floor(Math.random() * DINO_FACTS.length)]),
        choice('🤸 Move', 'Reach up high like Brachiosaurus. Now stomp like Triceratops. Three times.'),
        choice('💧 Water', 'Drink some water. Take your time.')),
      out,
      h('div', { style: 'margin-top:14px' }, h('button', { class: 'btn big', onclick: home }, 'Back to the park'))));
  }

  /* ---------- BREAK ---------- */
  function showBreak() {
    openOverlay(h('div', { class: 'breakwrap' },
      h('div', { style: 'display:flex;justify-content:center' }, dinoSVG({ w: 150 })),
      h('h1', null, 'Break'),
      h('p', { style: 'font-size:1.25rem' }, 'Take your time. Your place is saved. Nothing is waiting for you.'),
      h('div', { class: 'breathe', 'aria-hidden': 'true' }),
      h('p', { class: 'hint' }, 'Breathe in as the circle grows. Breathe out as it shrinks.'),
      h('p', { id: 'fact', style: 'min-height:2rem;font-weight:700' }),
      h('div', { class: 'pills', style: 'justify-content:center' },
        h('button', { class: 'btn ghost', onclick: () => { const f = DINO_FACTS[Math.floor(Math.random() * DINO_FACTS.length)]; document.getElementById('fact').textContent = f; Speak.say(f); } }, '🦖 A dinosaur fact'),
        h('button', { class: 'btn big', onclick: closeOverlay }, cur ? 'Back to where I was' : 'Back'))));
  }

  /* ---------- DESK MAT ---------- */
  function showMat() {
    openOverlay(h('div', null,
      h('div', { class: 'top' }, h('h1', null, '📋 Desk mat'), h('button', { class: 'btn', onclick: closeOverlay }, 'Close')),
      h('div', { class: 'matgrid' },
        h('div', { class: 'mat w' }, h('h3', null, 'WALK: perimeter (blue)'), h('p', null, '☝️ Trace the border. Answer in cm or m.'),
          h('ul', null, h('li', null, 'Rectangle: 2 × (length + breadth)'), h('li', null, 'Square: 4 × side'), h('li', null, 'Triangle: add 3 sides'), h('li', null, 'Regular shape: sides × one side'))),
        h('div', { class: 'mat c' }, h('h3', null, 'COVER: area (orange)'), h('p', null, '✋ Sweep the inside. Answer in sq cm or sq m.'),
          h('ul', null, h('li', null, 'Rectangle: length × breadth'), h('li', null, 'Square: side × side'), h('li', null, 'Triangle: half of its rectangle')))),
      h('div', { class: 'card' }, h('h3', { style: 'margin-top:0' }, 'Step card: every problem'),
        h('ol', null, STEPS.map((x) => h('li', null, x.title)))),
      script(SCRIPT.keystone)));
  }

  /* ---------- GROWN-UP ---------- */
  function showGrownUp(tabName) {
    const tabs = ['Tips', 'Progress', 'Where it breaks', 'His sentences', 'Settings'];
    let tab = typeof tabName === 'string' ? tabName : 'Tips';
    const body = h('div');
    const bar = h('div', { class: 'tabs' });
    function draw() {
      clear(bar).append(...tabs.map((t) => h('button', { class: 'btn small ' + (t === tab ? 'on' : 'ghost'), onclick: () => { tab = t; draw(); } }, t)));
      clear(body).append(({ Tips: tips, Progress: progress, 'Where it breaks': errorsTab, 'His sentences': notesTab, Settings: settingsTab })[tab](draw));
    }
    openOverlay(h('div', null, h('div', { class: 'top' }, h('h1', null, '🔒 Grown-up corner'), h('button', { class: 'btn', onclick: () => { closeOverlay(); if (!cur) home(); } }, 'Close')), bar, body));
    draw();
  }

  function tips() {
    return h('div', null,
      h('div', { class: 'card' }, h('h3', { style: 'margin-top:0' }, 'The five promises'),
        h('ol', null,
          h('li', null, 'One new idea per session. Never perimeter and area on the same day until both are secure separately.'),
          h('li', null, 'Hands first, pictures second, symbols last. Do the string, tiles and paper cut-outs with real objects when you can. The screen is the picture, not the hands.'),
          h('li', null, 'Same words every time. The scripts are fixed on purpose.'),
          h('li', null, 'No timers, no races, no surprise tests. Accuracy with a calm body is the goal.'),
          h('li', null, 'Dinosaurs and Furfuri Nagar are the road from the start. Never hold them back as a prize.'))),
      h('div', { class: 'card' }, h('h3', { style: 'margin-top:0' }, 'While he works'),
        h('ul', null,
          h('li', null, 'Say one instruction, then wait a full 10 seconds. Processing time is help, not silence to fill.'),
          h('li', null, 'Use the book\'s words: length, breadth, side. Avoid idioms.'),
          h('li', null, 'Praise the process: "You ticked every side before adding. That is why it worked."'),
          h('li', null, 'Any answer mode is valid: pointing, typing, writing, building, speaking.'),
          h('li', null, 'If he melts down: stop the maths, keep the dignity. Offer the Break button, water, movement. Resume at the LAST SUCCESSFUL step, smaller.'),
          h('li', null, 'Stuck script (same words): ' + SCRIPT.stuck))),
      h('div', { class: 'card' }, h('h3', { style: 'margin-top:0' }, 'Moving on'),
        h('p', null, 'A session is secure when he does the idea with the step card and gets 3 in a row right on two different days. Repeating a session is progress, not falling behind. The app tracks this on the Progress tab. If you disagree with it, mark a session secure yourself.')),
      h('div', { class: 'card' }, h('h3', { style: 'margin-top:0' }, 'About this app'),
        h('p', null, 'It follows the teaching guide chapter by chapter, with the guide\'s numbers, scripts and error fixes. Mistakes are logged for you, never shown as a score to him. The colour pairing is fixed: blue means walk, orange means cover, and no other part of the app uses those two colours. The artwork is original, inspired by his interests, and not taken from the show.')));
  }

  function progress(redraw) {
    return h('div', { class: 'card' }, h('p', { class: 'hint' }, 'Counted only on independent problems (the "On my own" ones), right first time with no help.'),
      h('table', null,
        h('thead', null, h('tr', null, ['Session', 'Days practised', 'Best in a row (today)', 'Days at target', 'Status', ''].map((t) => h('th', null, t)))),
        h('tbody', null, SESSIONS.map((x) => {
          const p = Store.prog(x.id), days = Object.keys(p.days), td = p.days[Store.today()];
          const good = Store.goodDays(x.id, x.need), sec = Store.isSecure(x.id, x.need);
          return h('tr', null, h('td', null, `${x.id}. ${x.title}`), h('td', null, days.length), h('td', null, td ? `${td.best} (needs ${x.need})` : '-'), h('td', null, `${good} of 2`),
            h('td', null, sec ? '⭐ Secure' : 'Practising'),
            h('td', null, h('button', { class: 'btn ghost small', onclick: () => { p.secure = !p.secure; Store.save(); redraw(); } }, p.secure ? 'Unmark' : 'Mark secure')));
        }))));
  }

  function errorsTab(redraw) {
    const errs = Store.data.errors;
    const by = {}; errs.forEach((e) => { const k = `${e.type}: ${e.step}`; by[k] = (by[k] || 0) + 1; });
    const top = Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const text = errs.map((e) => `${e.date} ${e.time} | S${e.sid} | ${e.pid} | ${e.type} | ${e.step} | got ${e.got} expected ${e.expected}`).join('\n');
    return h('div', null,
      h('div', { class: 'card' }, h('h3', { style: 'margin-top:0' }, 'Where it breaks most'),
        top.length ? h('table', null, top.map(([k, n]) => h('tr', null, h('td', null, k), h('td', null, n)))) : h('p', null, 'Nothing logged yet.'),
        h('p', { class: 'hint' }, 'Do not do more drill. Match the fix to the cause: unit wrong, go back to pre-printed units. Adds when should multiply, back to the sorting game. Loses place, point-write-tick with a finger covering finished sides.')),
      h('div', { class: 'card' }, h('h3', { style: 'margin-top:0' }, 'Error log (newest last)'),
        h('pre', { style: 'white-space:pre-wrap;font-size:.8rem;max-height:260px;overflow:auto;background:var(--note);padding:8px;border-radius:8px' }, text || 'Empty.'),
        h('button', { class: 'btn ghost small', onclick: () => { navigator.clipboard && navigator.clipboard.writeText(text); } }, 'Copy for his school'), ' ',
        h('button', { class: 'btn ghost small', onclick: () => { if (confirm('Clear the error log?')) { Store.data.errors = []; Store.save(); redraw(); } } }, 'Clear')));
  }

  function notesTab() {
    const n = Store.data.notes;
    return h('div', { class: 'card' }, h('h3', { style: 'margin-top:0' }, 'His own sentences, verbatim'),
      n.length ? h('table', null, n.slice().reverse().map((x) => h('tr', null, h('td', null, x.date), h('td', null, 'S' + x.sid), h('td', null, x.text)))) : h('p', null, 'Nothing yet. His sentences from the Check step will appear here.'));
  }

  function settingsTab(redraw) {
    const st = Store.data.settings;
    const sw = (label, key, extra) => h('label', { class: 'sw' }, h('input', { type: 'checkbox', checked: st[key] ? 'checked' : null, onchange: (e) => { st[key] = e.target.checked; Store.save(); Store.apply(); extra && extra(); } }), label);
    const col = (label, key) => h('label', { class: 'sw' }, h('input', { type: 'color', value: st[key], style: 'width:56px;height:40px', onchange: (e) => { st[key] = e.target.value; Store.save(); Store.apply(); } }), label);
    return h('div', { class: 'card' },
      sw('Soft chime when an answer is right (off by default)', 'sound'),
      sw('Read prompts and hints aloud automatically (the 🔊 buttons always work)', 'read'),
      sw('Reduce motion (no animation)', 'reduceMotion'),
      sw('Open all sessions (otherwise each opens when the one before is secure)', 'openAll', () => {}),
      col('Walk colour (default blue)', 'walk'), col('Cover colour (default orange)', 'cover'),
      h('p', { class: 'hint' }, 'If he prefers other colours, change them here. Keep the pairing absolute: one colour is always walk, the other always cover.'),
      h('label', { class: 'sw' }, h('input', { type: 'range', min: 0.9, max: 1.5, step: 0.05, value: st.size, onchange: (e) => { st.size = +e.target.value; Store.save(); Store.apply(); } }), 'Text size'),
      h('div', { class: 'pills' },
        h('button', { class: 'btn ghost small', onclick: () => { st.walk = '#2563eb'; st.cover = '#f97316'; Store.save(); Store.apply(); redraw(); } }, 'Reset colours'),
        h('button', { class: 'btn ghost small', onclick: () => { if (confirm('Erase all progress, errors and notes on this device?')) Store.reset(); } }, 'Erase everything')));
  }

  home();
})();
