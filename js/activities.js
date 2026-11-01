/* Hands-on activities, drawing step, number rows, squared-paper marking. */
(function (g) {
  'use strict';

  /* ---------- small shared pieces ---------- */
  const script = (text, auto) => {
    if (auto) Speak.say(text);
    return h('div', { class: 'script' },
      h('button', { class: 'say', 'aria-label': 'Read this aloud', title: 'Read aloud', onclick: () => Speak.say(text, true) }, '🔊'),
      h('div', null, text));
  };
  const nextBtn = (cb, label) => h('button', { class: 'btn big', onclick: cb }, label || 'Next ▶');
  const unitClass = (u) => (/^sq/.test(u) ? 'cover' : /^(m|cm|units)$/.test(u) ? 'walk' : '');
  g.script = script; g.nextBtn = nextBtn;

  /* ---------- number input row (one number at a time) ---------- */
  g.numRow = function (o) {
    const inp = h('input', { type: 'text', inputmode: 'decimal', class: 'num', autocomplete: 'off', 'aria-label': o.label, enterkeyhint: 'done' });
    const fb = h('div', { class: 'fb', role: 'status' });
    const unit = o.unit ? h('span', { class: 'unit ' + unitClass(o.unit) }, o.unit) : null;
    const btn = h('button', { class: 'btn', onclick: check }, 'Check ✓');
    const help = h('span');
    let wrong = 0, done = false, helped = false;
    const row = h('div', null,
      h('div', { class: 'row' },
        h('span', { class: 'lbl' }, o.label),
        o.expr && o.showExpr ? h('span', { class: 'expr' }, o.expr + ' =') : null,
        inp, unit, btn, help),
      fb);
    function ok(auto) {
      done = true; inp.classList.remove('bad'); inp.classList.add('ok'); inp.disabled = true; btn.disabled = true; help.textContent = '';
      fb.className = 'fb ok'; fb.textContent = auto ? 'Here is the answer. Say it with me.' : 'Yes. ✓';
      if (!auto) Chime();
      o.onOk && o.onOk(wrong === 0 && !helped);
    }
    function check() {
      if (done) return;
      const v = parseNum(inp.value);
      if (v == null) { fb.className = 'fb try'; fb.textContent = 'Type a number first.'; return; }
      if (Math.abs(v - o.ans) < 1e-9) return ok(false);
      wrong++;
      o.onWrong && o.onWrong(v);
      inp.classList.add('bad');
      fb.className = 'fb try';
      let msg = o.hints && o.hints[String(v)];
      if (!msg) msg = SCRIPT.oops + ' Look at the picture, then do only this step.';
      if (wrong >= 2 && o.expr) msg += ` Try: ${o.expr}`;
      fb.textContent = msg;
      Speak.say(msg);
      if (wrong >= (o.helpAfter || 2) && !help.firstChild) {
        help.appendChild(h('button', { class: 'btn ghost small', onclick: () => { helped = true; inp.value = o.ans; ok(true); } }, 'Show me'));
      }
    }
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') check(); });
    if (o.demo) { inp.value = o.ans; inp.disabled = true; inp.classList.add('ok'); btn.style.display = 'none'; if (o.expr && !o.showExpr) row.firstChild.insertBefore(h('span', { class: 'expr' }, o.expr + ' ='), inp); }
    else setTimeout(() => { if (inp.isConnected && o.focus !== false) inp.focus({ preventScroll: true }); }, 50);
    return row;
  };

  /* ---------- card sorting: walk or cover ---------- */
  g.sortCards = function (root, cards, o) {
    o = o || {};
    let i = 0, missed = false;
    const dots = h('div', { class: 'dots' }, cards.map(() => h('i')));
    const card = h('div', { class: 'sortcard' });
    const fb = h('div', { class: 'fb', style: 'text-align:center' });
    const btns = h('div', { class: 'big-choice' },
      h('button', { class: 'btn walk', onclick: () => pick('walk') }, 'WALK', h('span', { class: 'gesture' }, '☝️ trace the border')),
      h('button', { class: 'btn cover', onclick: () => pick('cover') }, 'COVER', h('span', { class: 'gesture' }, '✋ sweep the inside')));
    root.append(script(SCRIPT.keystone, true), dots, card, fb, btns);
    function show() {
      clear(card).append(h('div', { class: 'em' }, cards[i].em), h('div', { class: 'nm' }, cards[i].name));
      fb.textContent = ''; fb.className = 'fb'; missed = false; btns.style.visibility = 'visible';
      Speak.say(cards[i].name + '. Walk or cover?');
    }
    function pick(m) {
      const c = cards[i];
      if (m === c.mode) {
        if (!missed) { o.onCard && o.onCard(true); }
        dots.children[i].classList.add('on');
        fb.className = 'fb ok';
        fb.textContent = c.mode === 'walk' ? 'Yes. We walk it. Blue.' : 'Yes. We cover it. Orange.';
        Chime(); btns.style.visibility = 'hidden';
        i++;
        setTimeout(() => { if (!root.isConnected) return; if (i >= cards.length) { o.onDone && o.onDone(); } else show(); }, 1100);
      } else {
        if (!missed) { missed = true; o.onCard && o.onCard(false); Store.logError({ sid: o.sid || 0, pid: 'sort', type: 'SORT', step: c.name, got: m, expected: c.mode }); }
        fb.className = 'fb try';
        fb.textContent = `${SCRIPT.oops} Show me with your finger. Walk the border, or sweep the inside? Then choose.`;
      }
    }
    show();
  };

  /* ---------- painting squares (cover) ---------- */
  function paintLayer(fig, cols, rows, onChange) {
    const geo = fig.geo, layer = s('g'), cells = [];
    let count = 0, down = false;
    fig.gSides.style.pointerEvents = 'none';
    fig.svg.style.touchAction = 'none';
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const el = s('rect', { x: geo.x0 + c * geo.k + 1, y: geo.y0 + r * geo.k + 1, width: geo.k - 2, height: geo.k - 2, fill: 'transparent', style: 'cursor:pointer', 'data-cell': r * cols + c });
      cells.push({ el, on: false, r, c }); layer.appendChild(el);
    }
    fig.svg.insertBefore(layer, fig.gSides);
    const paint = (cell) => {
      if (!cell || cell.on) return;
      cell.on = true; cell.el.setAttribute('fill', 'var(--cover)'); cell.el.setAttribute('fill-opacity', '.6'); count++;
      onChange(count, cell);
    };
    const hit = (e) => { const el = document.elementFromPoint(e.clientX, e.clientY); const id = el && el.getAttribute && el.getAttribute('data-cell'); return id != null ? cells[+id] : null; };
    fig.svg.addEventListener('pointerdown', (e) => { down = true; paint(hit(e)); });
    fig.svg.addEventListener('pointermove', (e) => { if (down) paint(hit(e)); });
    window.addEventListener('pointerup', () => { down = false; });
    return {
      total: cols * rows, cells,
      async fillAll() { for (const c of cells) { if (!c.on) { paint(c); await sleep(35); } } },
    };
  }

  /* ---------- S1: walk ---------- */
  function walk(root, cfg, next) {
    const fig = makeFigure({ kind: 'rect', l: 5, b: 3, unit: 'm' }, { mode: 'walk' });
    const msg = h('div', { class: 'fb', style: 'text-align:center;font-size:1.1rem' }, 'Tap the glowing corner. The dinosaur will walk to it.');
    const token = s('g'); token.appendChild(dinoGroup({ scale: 0.42 }));
    const pts = fig.sides.map((x) => x.a);
    const place = (x, y) => token.setAttribute('transform', `translate(${x} ${y - 14})`);
    place(pts[0][0], pts[0][1]);
    const target = s('circle', { r: 17, fill: 'none', stroke: '#111', 'stroke-width': 4, class: 'pulse', style: 'cursor:pointer' });
    const start = s('circle', { cx: pts[0][0], cy: pts[0][1], r: 7, fill: '#111' });
    fig.svg.append(start, target, token);
    let step = 0, busy = false, pos = pts[0];
    const setTarget = () => { const p = pts[(step + 1) % 4]; target.setAttribute('cx', p[0]); target.setAttribute('cy', p[1]); };
    setTarget();
    const btn = h('button', { class: 'btn walk big', onclick: go }, 'Walk to the next corner ▶');
    async function go() {
      if (busy || step >= 4) return; busy = true;
      const from = pos, to = pts[(step + 1) % 4];
      await tween(900, (e) => place(from[0] + (to[0] - from[0]) * e, from[1] + (to[1] - from[1]) * e));
      fig.sides[step].trace(); pos = to; step++; busy = false;
      if (step < 4) { setTarget(); msg.textContent = `${step} of 4 sides walked.`; }
      else {
        target.remove(); btn.remove();
        msg.className = 'fb ok'; msg.style.fontSize = '1.2rem';
        msg.innerHTML = 'You came back to the start. That is <span class="walk-word">perimeter</span>. Blue.';
        Chime(); Speak.say('You came back to the start. That is perimeter. Blue.');
        root.append(nextBtn(next));
      }
    }
    target.addEventListener('click', go);
    root.append(script('Walk the edge. ' + SCRIPT.walkGesture + ' Use your own finger on the screen too.'), fig.svg, msg, h('div', { style: 'text-align:center;margin:10px 0' }, btn));
  }

  /* ---------- S1: cover ---------- */
  function cover(root, cfg, next) {
    const fig = makeFigure({ kind: 'rect', l: 5, b: 3, unit: 'm', grid: true }, { mode: 'cover' });
    fig.geo = rectGeo(fig);
    const msg = h('div', { class: 'fb', style: 'text-align:center;font-size:1.1rem' }, 'Squares covered: 0 of 15');
    let finished = false;
    const pl = paintLayer(fig, 5, 3, (n) => {
      msg.textContent = `Squares covered: ${n} of 15`;
      if (n === 15 && !finished) {
        finished = true; msg.className = 'fb ok';
        msg.innerHTML = 'No gaps. That is <span class="cover-word">area</span>. Orange.';
        Chime(); Speak.say('No gaps. That is area. Orange.'); root.append(nextBtn(next));
      }
    });
    root.append(script('Cover the inside. ' + SCRIPT.coverGesture + ' Tap or drag across the squares to colour them orange.'), fig.svg, msg,
      h('div', { style: 'text-align:center;margin:10px 0' }, h('button', { class: 'btn ghost', onclick: () => pl.fillAll() }, '✋ Sweep it for me')));
  }
  function rectGeo(fig) {
    // recover x0,y0,k of the rect figure from its side coordinates
    const a = fig.sides[0].a, b = fig.sides[0].b, d = fig.sides[2].a;
    const l = fig.spec.l;
    return { x0: a[0], y0: a[1], k: (b[0] - a[0]) / l, h: d[1] - a[1] };
  }

  /* ---------- S1 / daily warm-up ---------- */
  function sort(root, cfg, next) {
    sortCards(root, CARDS, { sid: cfg.sid, onCard: (ok) => { if (cfg.record) Store.recordTry(cfg.sid, ok); }, onDone: next });
  }

  /* ---------- S2-S4: tick each side, add as you go ---------- */
  function tick(root, cfg, next) {
    const fig = makeFigure(cfg.fig, { mode: 'walk' });
    const vals = [];
    const sum = h('div', { class: 'sum-line', 'aria-live': 'polite' }, '');
    const area = h('div');
    const unit = cfg.fig.unit;
    makeInteractive(fig, 'walk', {
      progress: (sd) => { vals.push(sd.value); sum.textContent = vals.join(' + '); },
      complete: () => {
        const total = vals.reduce((a, b) => a + b, 0);
        sum.innerHTML = vals.join(' + ') + ' <span class="eq">=</span> ' + total + ' ' + unit;
        Chime();
        const nodes = [];
        if (cfg.mode === 'rect') {
          const pairs = h('div');
          nodes.push(h('p', null, 'You walked all the way around and added every side.'), h('button', { class: 'btn', onclick: () => {
            pairs.append(
              script('Look: 12 came twice. 8 came twice. Opposite sides are equal. So we can do it faster.'),
              h('div', { class: 'card' }, h('div', { class: 'hint' }, 'Perimeter of a rectangle ='), h('div', { style: 'font-size:1.6rem;font-weight:800' }, h('span', { class: 'walk-word' }, '2 × (length + breadth)'))),
              script('First add length and breadth, one corner to the next. Then double it, because the same walk happens on the other side too.'),
              nextBtn(next));
            pairs.previousSibling && pairs.previousSibling.remove();
          } }, 'Look for pairs'), pairs);
        } else if (cfg.mode === 'square') {
          nodes.push(script('All four sides are the same. Adding the same number four times is multiplying by 4.'),
            h('div', { class: 'card' }, h('div', { class: 'hint' }, 'Perimeter of a square ='), h('div', { style: 'font-size:1.6rem;font-weight:800' }, h('span', { class: 'walk-word' }, '4 × side'))), nextBtn(next));
        } else {
          nodes.push(script('No new formula. Three sides. Add all three. Point, write, tick.'),
            h('div', { class: 'card' }, h('div', { class: 'hint' }, 'Perimeter of a triangle ='), h('div', { style: 'font-size:1.6rem;font-weight:800' }, h('span', { class: 'walk-word' }, 'side 1 + side 2 + side 3'))), nextBtn(next));
        }
        area.append(...nodes);
      },
    });
    root.append(script('Tap each side to walk it. Point, write, tick. Optional: do this first with real string.'), fig.svg, sum, area);
  }

  /* ---------- S5: the same string, new shapes ---------- */
  function string(root, cfg, next) {
    const stage = h('div'), msg = h('div', { class: 'sum-line' }), seen = new Set();
    const cont = h('div');
    const show = (n) => {
      const sd = 36 / n, f = makeFigure({ kind: 'poly', n, s: sd, unit: 'cm' }, { mode: 'walk' });
      f.traceAll(); clear(stage).append(f.svg);
      msg.innerHTML = `36 <span class="eq">÷</span> ${n} <span class="eq">=</span> ${sd} cm each side`;
      seen.add(n);
      if (seen.size === 3 && !cont.firstChild) {
        cont.append(script('Same string. Same walk: 36 cm. Different shape. This is "same perimeter, different shape".'), nextBtn(next));
      }
    };
    root.append(script('A string 36 cm long makes the walk. Bend it into three different shapes. A regular shape has all sides equal AND all angles equal.'),
      h('div', { class: 'pills' },
        h('button', { class: 'btn ghost', onclick: () => show(3) }, '🔺 Triangle (3 sides)'),
        h('button', { class: 'btn ghost', onclick: () => show(4) }, '🟦 Square (4 sides)'),
        h('button', { class: 'btn ghost', onclick: () => show(6) }, '⬢ Hexagon (6 sides)')),
      stage, msg, cont);
    show(6); seen.clear();
  }

  /* ---------- S6: tile it ---------- */
  function tile(root, cfg, next) {
    const l = cfg.l, b = cfg.b;
    const fig = makeFigure({ kind: 'rect', l, b, unit: 'm', grid: true }, { mode: 'cover' });
    fig.geo = rectGeo(fig);
    const msg = h('div', { class: 'fb', style: 'text-align:center;font-size:1.1rem' }, `Squares covered: 0 of ${l * b}`);
    const after = h('div'); let finished = false;
    const rowLabels = s('g'); fig.svg.appendChild(rowLabels);
    const pl = paintLayer(fig, l, b, (n) => {
      msg.textContent = `Squares covered: ${n} of ${l * b}`;
      if (n === l * b && !finished) {
        finished = true; Chime();
        after.append(h('button', { class: 'btn', id: 'cnt', onclick: countRows }, 'Count in rows'));
      }
    });
    async function countRows() {
      after.innerHTML = '';
      for (let r = 0; r < b; r++) {
        rowLabels.appendChild(s('text', { x: fig.geo.x0 + l * fig.geo.k + 22, y: fig.geo.y0 + r * fig.geo.k + fig.geo.k / 2 + 5, 'text-anchor': 'middle' }, `${l}`));
        msg.textContent = `${r + 1} row${r ? 's' : ''} of ${l}`; await sleep(600);
      }
      msg.innerHTML = `${l} squares in a row. ${b} rows. <b>${l} × ${b} = ${l * b} squares</b>`;
      after.append(
        script('Length tells us how many squares fit in one row. Breadth tells us how many rows. Multiply: rows of squares. That is why the answer is in square units: sq cm, sq m. We counted squares, so we say squares.', false),
        h('div', { class: 'card' },
          h('div', { class: 'hint' }, 'Area of a rectangle ='), h('div', { style: 'font-size:1.5rem;font-weight:800' }, h('span', { class: 'cover-word' }, 'length × breadth')),
          h('div', { class: 'hint', style: 'margin-top:8px' }, 'Area of a square ='), h('div', { style: 'font-size:1.5rem;font-weight:800' }, h('span', { class: 'cover-word' }, 'side × side'))),
        h('div', { class: 'card' },
          h('b', null, 'Why squares?'),
          h('div', { style: 'display:flex;gap:14px;align-items:center;flex-wrap:wrap' },
            s('svg', { viewBox: '0 0 120 70', width: 150, 'aria-hidden': 'true' }, [0, 1, 2].flatMap((c) => [0, 1].map((r) => s('circle', { cx: 20 + c * 40, cy: 18 + r * 36, r: 16, fill: '#fff3e6', stroke: '#c9742c', 'stroke-width': 2 }))), ),
            h('span', null, 'Circles leave gaps, and two people can pack them differently. Squares have no gaps, so everyone gets the same answer. Rules that give everyone the same answer are our friends.'))),
        nextBtn(next));
    }
    root.append(script(`Cover the rectangle with squares. No gaps, no overlaps. It is ${l} squares long and ${b} squares wide. Tap or drag.`), fig.svg, msg,
      h('div', { style: 'text-align:center;margin:10px 0' }, h('button', { class: 'btn ghost', onclick: () => pl.fillAll() }, '✋ Sweep it for me')), after);
  }

  /* ---------- S7: choose where to cut ---------- */
  function split(root, cfg, next) {
    const pts = [[0, 0], [2, 0], [2, 2], [6, 2], [6, 6], [0, 6]];
    const fig = makeFigure({ kind: 'lshape', pts, unit: 'm' }, { mode: 'cover' });
    const overlay = s('g'); fig.svg.appendChild(overlay);
    const out = h('div'), tried = new Set(), cont = h('div');
    const cuts = {
      v: { line: [[2, 2], [2, 6]], pieces: [{ x: 0, y: 0, w: 2, h: 6, n: 'piece 1' }, { x: 2, y: 2, w: 4, h: 4, n: 'piece 2' }] },
      hz: { line: [[0, 2], [6, 2]], pieces: [{ x: 0, y: 0, w: 2, h: 2, n: 'piece 1' }, { x: 0, y: 2, w: 6, h: 4, n: 'piece 2' }] },
    };
    function doCut(key) {
      const c = cuts[key]; clear(overlay); tried.add(key);
      const m = fig.map, k = fig.k;
      c.pieces.forEach((p, i) => {
        const a = m(p.x, p.y);
        overlay.appendChild(s('rect', { x: a[0] + 1.5, y: a[1] + 1.5, width: p.w * k - 3, height: p.h * k - 3, fill: 'var(--cover)', 'fill-opacity': i ? 0.38 : 0.62, stroke: '#7a3300', 'stroke-width': 1.5 }));
        overlay.appendChild(s('text', { x: a[0] + p.w * k / 2, y: a[1] + p.h * k / 2 + 5, 'text-anchor': 'middle' }, p.n));
      });
      const a = m(...c.line[0]), b = m(...c.line[1]);
      overlay.appendChild(s('line', { class: 'cutline', x1: a[0], y1: a[1], x2: b[0], y2: b[1] }));
      const A = c.pieces.map((p) => p.w * p.h);
      clear(out).append(
        h('div', { class: 'sum-line', style: 'color:var(--cover)' }, `${c.pieces[0].w} × ${c.pieces[0].h} = ${A[0]}   and   ${c.pieces[1].w} × ${c.pieces[1].h} = ${A[1]}`),
        h('div', { class: 'celebrate' }, `${A[0]} + ${A[1]} = ${A[0] + A[1]} sq m. The pieces cover the whole shape. Nothing is counted twice. Count the squares one by one: also 28.`));
      Chime();
      if (tried.size === 2) { clear(cont).append(script('Two different cuts. The same total. Rules that give the same answer are our friends.'), nextBtn(next)); }
      else clear(cont).append(h('p', { class: 'hint' }, 'Try the other cut too. Does the total change?'), h('button', { class: 'btn ghost', onclick: next }, 'Skip the other cut ▶'));
    }
    root.append(script('This hall is an L-shape. Draw ONE line to cut it into rectangles you already know. You choose where.'), fig.svg,
      h('div', { class: 'pills', style: 'justify-content:center' },
        h('button', { class: 'btn', onclick: () => doCut('v') }, 'Cut straight down ┃'),
        h('button', { class: 'btn', onclick: () => doCut('hz') }, 'Cut straight across ━')),
      out, cont);
  }

  /* ---------- S8: the four rules (one example square each) ---------- */
  function gridrules(root, cfg, next) {
    const defs = [
      { t: 'Completely inside', count: '1', say: 'Completely inside counts as 1.', draw: () => s('rect', { x: 0, y: 0, width: 100, height: 100 }) },
      { t: 'More than half inside', count: '1', say: 'More than half inside counts as 1.', draw: () => s('rect', { x: 0, y: 0, width: 100, height: 72 }) },
      { t: 'Less than half inside', count: '0', say: 'Less than half inside counts as 0. Ignore it.', draw: () => s('rect', { x: 0, y: 0, width: 100, height: 24 }) },
      { t: 'Exactly half inside', count: '½', say: 'Exactly half inside counts as one half.', draw: () => s('polygon', { points: '0,0 100,0 0,100' }) },
    ];
    const seen = new Set(), cont = h('div'), say = h('div', { class: 'fb', style: 'text-align:center;font-size:1.1rem' }, 'Tap each square to see how it counts.');
    const cards = defs.map((d, i) => {
      const shape = d.draw(); shape.setAttribute('fill', 'rgba(47,125,91,.45)'); shape.setAttribute('stroke', '#374151'); shape.setAttribute('stroke-width', 3);
      const ans = h('div', { style: 'font-size:1.6rem;font-weight:800;min-height:2.2rem' }, '?');
      return h('button', { class: 'card', style: 'text-align:center;cursor:pointer;flex:1 1 150px', onclick: () => {
        ans.textContent = 'counts ' + d.count; say.textContent = d.say; Speak.say(d.say); seen.add(i);
        if (seen.size === 4 && !cont.firstChild) cont.append(
          script('The ritual, always in this order: 1. Write 1 in every full square. 2. Circle every more-than-half square. 3. Cross every less-than-half square. 4. Pair the halves: two halves make one.'),
          script('Here the answer is allowed to be "about". The perfect-answer rule from other lessons does not apply here. That exception has a name: estimate.'), nextBtn(next));
      } },
        s('svg', { viewBox: '-4 -4 108 108', width: 100, 'aria-label': d.t }, s('rect', { x: 0, y: 0, width: 100, height: 100, fill: '#fff', stroke: '#8a8576', 'stroke-width': 2 }), shape),
        h('div', { style: 'font-weight:700' }, d.t), ans);
    });
    root.append(script('The edge of a shape cuts through some squares. Four fixed rules decide how each one counts.'), h('div', { style: 'display:flex;gap:12px;flex-wrap:wrap' }, cards), say, cont);
  }

  /* ---------- S9: cut a rectangle on its diagonal ---------- */
  function tricut(root, cfg, next) {
    function round(l, b, last) {
      const k = Math.min(280 / l, 200 / b), x0 = 66, y0 = 30, w = l * k, hh = b * k, cx = x0 + w / 2, cy = y0 + hh / 2;
      const svg = s('svg', { viewBox: '0 0 400 280', class: 'fig', role: 'img', 'aria-label': 'rectangle cut on its diagonal' });
      const T1 = s('polygon', { points: `${x0},${y0} ${x0 + w},${y0} ${x0 + w},${y0 + hh}`, fill: 'var(--cover)', 'fill-opacity': 0.42, stroke: '#7a3300', 'stroke-width': 2.5 });
      const T2 = s('polygon', { points: `${x0},${y0} ${x0 + w},${y0 + hh} ${x0},${y0 + hh}`, fill: 'var(--cover)', 'fill-opacity': 0.42, stroke: '#7a3300', 'stroke-width': 2.5 });
      const outline = s('polygon', { class: 'ghost', points: `${x0},${y0} ${x0 + w},${y0} ${x0 + w},${y0 + hh} ${x0},${y0 + hh}` });
      const diag = s('line', { class: 'cutline', x1: x0, y1: y0, x2: x0 + w, y2: y0 + hh, style: 'visibility:hidden' });
      const lab = [s('text', { x: cx, y: y0 + hh + 24, 'text-anchor': 'middle' }, `${l} cm`), s('text', { x: x0 - 10, y: cy + 5, 'text-anchor': 'end' }, `${b} cm`)];
      svg.append(outline, T2, T1, diag, ...lab);
      const place = (tx, ty, a) => T1.setAttribute('transform', `translate(${tx} ${ty}) rotate(${a} ${cx} ${cy})`);
      const msg = h('div', { class: 'fb', style: 'text-align:center;font-size:1.1rem' }, 'Step 1: draw one diagonal.');
      const btn = h('button', { class: 'btn big' });
      const wrap = h('div');
      let stage = 0;
      btn.textContent = '1. Draw the diagonal';
      btn.onclick = async () => {
        btn.disabled = true;
        if (stage === 0) {
          diag.style.visibility = 'visible'; msg.textContent = 'A diagonal goes from one corner to the opposite corner.'; stage = 1; btn.textContent = '2. Cut along it'; btn.disabled = false;
        } else if (stage === 1) {
          await tween(700, (e) => place(44 * e, -22 * e, 0)); diag.style.visibility = 'hidden';
          msg.textContent = 'Two triangles.'; stage = 2; btn.textContent = '3. Put one on top of the other'; btn.disabled = false;
        } else if (stage === 2) {
          await tween(1300, (e) => place(44 * (1 - e), -22 * (1 - e), 180 * e));
          Chime(); stage = 3; btn.remove();
          msg.innerHTML = `They match exactly. Same area. <b>Each triangle is half of the rectangle.</b><br>${l} × ${b} = ${l * b} sq cm. Half of it: ${l * b} ÷ 2 = ${l * b / 2} sq cm.`;
          Speak.say('They match exactly. The triangle is half of the rectangle.');
          wrap.append(...(last ? [script('Repeated with a square and a different-sized rectangle: it still works. A rule that always works is our friend.'), nextBtn(next)]
            : [h('button', { class: 'btn', onclick: () => { clear(root); root.append(...roundEls(4, 4, true)); } }, 'Try again with a square 4 × 4'), ' ', h('button', { class: 'btn ghost', onclick: next }, 'Skip ▶')]));
        }
      };
      return [script(`Take a paper rectangle ${l} cm by ${b} cm. We will cut it and look.`), svg, msg, h('div', { style: 'text-align:center;margin:10px 0' }, btn), wrap];
    }
    const roundEls = (l, b, last) => round(l, b, last);
    root.append(...roundEls(8, 6, false));
  }

  /* ---------- S9: slide the top corner ---------- */
  function apex(root, cfg, next) {
    const l = 10, b = 6, k = 30, x0 = 70, y0 = 40, w = l * k, hh = b * k;
    const svg = s('svg', { viewBox: '0 0 400 280', class: 'fig', role: 'img', 'aria-label': 'triangle with a sliding top corner' });
    const tri = s('polygon', { class: 'region shaded', style: 'fill-opacity:.6' });
    const set = (f) => tri.setAttribute('points', `${x0},${y0 + hh} ${x0 + w},${y0 + hh} ${x0 + f * w},${y0}`);
    set(0.3);
    svg.append(s('polygon', { class: 'ghost', points: `${x0},${y0} ${x0 + w},${y0} ${x0 + w},${y0 + hh} ${x0},${y0 + hh}` }), tri,
      s('text', { x: x0 + w / 2, y: y0 + hh + 24, 'text-anchor': 'middle' }, '10 cm'), s('text', { x: x0 - 10, y: y0 + hh / 2 + 5, 'text-anchor': 'end' }, '6 cm'));
    const cont = h('div'); let moved = false;
    const slider = h('input', { type: 'range', min: 0, max: 100, value: 30, 'aria-label': 'Slide the top corner', style: 'width:min(420px,90%)', oninput: (e) => { set(e.target.value / 100); if (!moved) { moved = true; cont.append(script('The triangle looks different, but its area stays 30 sq cm. Two triangles can look very different and still have the same area, because both are half of the same rectangle.'), nextBtn(next)); } } });
    root.append(script('Same base. Same height. Slide the top corner and watch the triangle.'), svg,
      h('div', { class: 'sum-line', style: 'color:var(--cover)' }, 'Rectangle 10 × 6 = 60 sq cm. Triangle = 30 sq cm.'), h('div', { style: 'text-align:center' }, slider), cont);
  }

  /* ---------- S10: nine squares ---------- */
  function nine(root, cfg, next) {
    const cols = 10, rows = 6, k = 36, ox = 20, oy = 14;
    const on = new Set(), found = new Set();
    const svg = s('svg', { viewBox: '0 0 400 244', class: 'fig nine', role: 'img', 'aria-label': 'building board for nine squares' });
    const cells = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const el = s('rect', { class: 'cellb', x: ox + c * k, y: oy + r * k, width: k, height: k, onclick: () => toggle(r, c) });
      cells.push(el); svg.appendChild(el);
    }
    const key = (r, c) => r + ',' + c;
    const sCount = h('b', null, '0'), sArea = h('b', null, '0'), sPer = h('b', null, '0');
    const msg = h('div', { class: 'fb', style: 'text-align:center;min-height:2.4rem;font-weight:700' });
    const goalsEl = h('ul', { class: 'goals' });
    const goals = [
      { p: 12, t: 'Build the smallest walk: perimeter 12' },
      { p: 20, t: 'Build the longest walk: perimeter 20' },
      { p: 18, t: 'Hunt: can you make perimeter 18?' },
    ];
    const cont = h('div');
    function metrics() {
      let per = 0;
      on.forEach((kk) => { const [r, c] = kk.split(',').map(Number); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => { if (!on.has(key(r + dr, c + dc))) per++; }); });
      return per;
    }
    function connected() {
      if (!on.size) return false;
      const start = on.values().next().value, seen = new Set([start]), q = [start];
      while (q.length) { const [r, c] = q.pop().split(',').map(Number); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => { const kk = key(r + dr, c + dc); if (on.has(kk) && !seen.has(kk)) { seen.add(kk); q.push(kk); } }); }
      return seen.size === on.size;
    }
    function hasHole() {
      const R = rows + 2, C = cols + 2, out = new Set(['-1,-1']), q = [[-1, -1]];
      while (q.length) { const [r, c] = q.pop(); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => { const rr = r + dr, cc = c + dc; if (rr < -1 || cc < -1 || rr > rows || cc > cols) return; const kk = key(rr, cc); if (!on.has(kk) && !out.has(kk)) { out.add(kk); q.push([rr, cc]); } }); }
      return out.size + on.size < R * C;
    }
    function refresh() {
      cells.forEach((el, i) => el.classList.toggle('on', on.has(key(Math.floor(i / cols), i % cols))));
      const per = metrics();
      sCount.textContent = on.size + ' of 9'; sArea.textContent = on.size; sPer.textContent = on.size ? per : 0;
      if (on.size < 9) msg.textContent = `Place ${9 - on.size} more square${9 - on.size === 1 ? '' : 's'}.`;
      else if (!connected()) msg.textContent = 'Squares must touch fully on a side. One connected shape.';
      else if (hasHole()) msg.textContent = 'No holes inside the shape.';
      else {
        msg.textContent = `Area is 9. The walk is ${per}.`;
        if (!found.has(per)) { found.add(per); Chime(); }
        goals.forEach((gl) => { if (gl.p === per) gl.done = true; });
        drawGoals();
      }
    }
    function drawGoals() {
      clear(goalsEl).append(...goals.map((gl) => h('li', { class: gl.done ? 'ok' : '' }, gl.t)), h('li', null, 'Walks you found: ' + ([...found].sort((a, b) => a - b).join(', ') || 'none yet')));
      if (goals.every((x) => x.done) && !cont.firstChild) cont.append(
        script('The inside did not change: still 9 squares. The walk changed. Cover stayed the same. Walk got longer. Both can be true.', true),
        h('p', { class: 'hint' }, 'Long and thin means a long walk. Close to a square means a short walk. Say it in your own words and write your sentence in the notebook.'), nextBtn(next));
    }
    function toggle(r, c) {
      const kk = key(r, c);
      if (on.has(kk)) on.delete(kk);
      else if (on.size >= 9) { msg.textContent = 'You have 9 squares. Take one away first.'; return; }
      else on.add(kk);
      refresh();
    }
    const demo = (shape) => { on.clear(); shape.forEach(([r, c]) => on.add(key(r, c))); refresh(); };
    const ex = {
      12: [[1, 1], [1, 2], [1, 3], [2, 1], [2, 2], [2, 3], [3, 1], [3, 2], [3, 3]],
      20: [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [2, 5], [2, 6], [2, 7], [2, 8]],
      18: [[2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [2, 5], [2, 6], [1, 0], [1, 1]],
    };
    root.append(script('You have 9 squares. Tap the board to build a shape. Rules: squares must touch fully on a side. One connected shape. No holes.'),
      svg, msg,
      h('div', { class: 'stats' }, h('div', { class: 'box' }, 'Squares', sCount), h('div', { class: 'box c' }, 'Area (cover)', sArea), h('div', { class: 'box w' }, 'Perimeter (walk)', sPer)),
      h('div', { style: 'text-align:center' }, h('button', { class: 'btn ghost small', onclick: () => demo([]) }, 'Clear the board'), ' ',
        h('span', { class: 'hint' }, 'Stuck? Show me: '), ...[12, 20, 18].map((p) => h('button', { class: 'btn ghost small', onclick: () => demo(ex[p]) }, 'perimeter ' + p))),
      goalsEl, cont);
    drawGoals(); refresh();
  }

  /* ---------- S10: a house plan as a map ---------- */
  function plan(root, cfg, next) {
    const rooms = [
      { n: 'Hall', x: 0, y: 0, w: 6, h: 4 }, { n: 'Bedroom', x: 0, y: 4, w: 6, h: 2 },
      { n: 'Kitchen', x: 6, y: 0, w: 4, h: 3 }, { n: 'Dino room', x: 6, y: 3, w: 4, h: 3 },
    ];
    const k = 36, ox = 20, oy = 30;
    const svg = s('svg', { viewBox: '0 0 400 270', class: 'fig', role: 'img', 'aria-label': 'house plan' });
    const polys = rooms.map((r) => {
      const p = s('rect', { x: ox + r.x * k, y: oy + r.y * k, width: r.w * k, height: r.h * k, fill: '#fffdf6', stroke: '#9ca3af', 'stroke-width': 2 });
      const t = s('text', { x: ox + (r.x + r.w / 2) * k, y: oy + (r.y + r.h / 2) * k + 5, 'text-anchor': 'middle' }, '');
      svg.append(p, t); return { p, t };
    });
    svg.append(s('text', { x: ox + 5 * k, y: oy - 8, 'text-anchor': 'middle' }, 'House plan (all lengths in m)'));
    const work = h('div'); let ri = 0, sum = 0;
    function roomStep() {
      clear(work);
      const r = rooms[ri], pl = polys[ri];
      polys.forEach((q, i) => { q.p.setAttribute('stroke', '#9ca3af'); q.p.setAttribute('stroke-width', 2); if (i > ri) { q.p.setAttribute('fill', '#ece8da'); q.t.textContent = ''; } });
      pl.p.setAttribute('fill', '#fffdf6'); pl.p.setAttribute('stroke', '#111'); pl.p.setAttribute('stroke-width', 4);
      work.append(
        script(`One room at a time. ${r.n}: length ${r.w} m, breadth ${r.h} m. Trace its border with a finger (walk). Sweep its floor with your palm (cover).`),
        h('div', { class: 'pills' },
          h('button', { class: 'btn walk small', onclick: () => { pl.p.setAttribute('stroke', 'var(--walk)'); pl.p.setAttribute('stroke-width', 7); } }, '☝️ Walk its border'),
          h('button', { class: 'btn cover small', onclick: () => { pl.p.setAttribute('fill', 'var(--cover)'); pl.p.setAttribute('fill-opacity', .55); } }, '✋ Cover its floor')),
        numRow({ label: `Area of the ${r.n}`, expr: `${r.w} × ${r.h}`, showExpr: false, unit: 'sq m', ans: r.w * r.h, hints: { [2 * (r.w + r.h)]: 'That is the walk. We want the cover: multiply.' }, onOk: () => {
          pl.t.textContent = `${r.n}: ${r.w * r.h}`; sum += r.w * r.h; ri++;
          work.append(ri < rooms.length ? h('button', { class: 'btn big', onclick: roomStep }, 'Next room ▶') : h('button', { class: 'btn big', onclick: totals }, 'Check the whole house ▶'));
        } }));
    }
    function totals() {
      clear(work);
      polys.forEach((q) => { q.p.setAttribute('stroke', '#9ca3af'); q.p.setAttribute('stroke-width', 2); q.p.removeAttribute('fill-opacity'); q.p.setAttribute('fill', '#fffdf6'); });
      let a = false;
      work.append(
        script('Two ways to the same total. Way one: add the rooms.'),
        numRow({ label: 'Rooms added: 24 + 12 + 12 + 12', unit: 'sq m', ans: sum, onOk: () => {
          work.append(script('Way two: the whole house is one big rectangle, 10 m by 6 m.'),
            numRow({ label: 'Whole house: 10 × 6', unit: 'sq m', ans: 60, onOk: () => { polys.forEach((q) => { q.p.setAttribute('fill', 'var(--cover)'); q.p.setAttribute('fill-opacity', .45); }); work.append(script('The same total two ways: 60 sq m. A rule-based check. Same wall, same length.'), nextBtn(next)); } }));
        } }));
    }
    root.append(script('A plan is a map. Find the Hall. Find the Kitchen. Only one room is open at a time.'), svg, work);
    roomStep();
  }

  g.HANDS = { walk, cover, sort, tick, string, tile, split, gridrules, tricut, apex, nine, plan };

  /* =====================================================================
     Squared paper marking ritual (used for S8 problems and drawing)
     ===================================================================== */
  g.gridMarker = function (info, o) {
    o = o || {};
    const cols = 10, rows = 8, k = 36, ox = 20, oy = 10;
    const svg = s('svg', { viewBox: '0 0 400 310', class: 'gridsvg', role: 'img', 'aria-label': 'squared paper with a shape: ' + info.name });
    const gc = s('g'), gm = s('g');
    const marks = {}; // 'r,c' -> stamp
    const order = [
      { t: 'full', name: 'Full: write 1', say: 'Step 1. Write 1 in every square that is completely inside.', ico: '1' },
      { t: 'more', name: 'More than half: circle', say: 'Step 2. Circle every square that is more than half inside.', ico: '◯' },
      { t: 'less', name: 'Less than half: cross', say: 'Step 3. Cross every square that is less than half inside.', ico: '✕' },
      { t: 'half', name: 'Exactly half: ½', say: 'Step 4. Mark every square that is exactly half inside. Then pair the halves: two halves make one.', ico: '½' },
    ];
    let phase = 0;
    const cellEls = {};
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const el = s('rect', { class: 'cell', x: ox + c * k, y: oy + r * k, width: k, height: k, onclick: () => tap(r, c) });
      cellEls[r + ',' + c] = el; gc.appendChild(el);
    }
    const shape = s('polygon', { class: 'shape', points: info.poly.map((p) => `${ox + p[0] * k},${oy + p[1] * k}`).join(' ') });
    svg.append(gc, shape, gm);
    const msg = h('div', { class: 'fb', style: 'text-align:center;min-height:3.2rem;font-weight:700' });
    const bar = h('div', { class: 'stamps' });
    const checkBtn = h('button', { class: 'btn', onclick: check }, 'Check this step ✓');
    const wrap = h('div', { class: 'grid-wrap' }, svg, msg, bar, h('div', { style: 'text-align:center' }, checkBtn));

    function drawMark(r, c, t) {
      const x = ox + c * k + k / 2, y = oy + r * k + k / 2, g1 = s('g', { 'data-k': r + ',' + c });
      if (t === 'full') g1.append(s('rect', { class: 'mk-full', x: ox + c * k + 2, y: oy + r * k + 2, width: k - 4, height: k - 4 }), s('text', { x, y }, '1'));
      if (t === 'more') g1.append(s('circle', { cx: x, cy: y, r: 14, fill: 'rgba(249,115,22,.25)', stroke: '#7a3300', 'stroke-width': 2.5 }), s('text', { x, y }, '1'));
      if (t === 'less') g1.append(s('text', { x, y, style: 'font-size:22px' }, '✕'));
      if (t === 'half') g1.append(s('text', { x, y, style: 'font-size:20px;fill:#7a3300' }, '½'));
      return g1;
    }
    function render() {
      clear(gm);
      Object.keys(marks).forEach((kk) => { const [r, c] = kk.split(',').map(Number); gm.appendChild(drawMark(r, c, marks[kk])); });
    }
    function tap(r, c) {
      if (o.demo || phase >= 4) return;
      const kk = r + ',' + c, t = order[phase].t;
      // earlier phases are locked
      if (marks[kk] && marks[kk] !== t) return;
      if (marks[kk]) delete marks[kk]; else marks[kk] = t;
      render();
    }
    function barRender() {
      clear(bar).append(...order.map((p, i) => h('button', { class: 'btn small ' + (i === phase ? '' : 'ghost') + (i === phase ? ' on' : ''), disabled: i !== phase && !(o.demo), 'aria-pressed': i === phase }, `${i + 1}. ${p.name}`)));
    }
    function say(t) { msg.className = 'fb'; msg.textContent = t; Speak.say(t); }
    function flash(keys) { keys.forEach((kk) => { const el = cellEls[kk]; el.classList.remove('flash'); void el.getBoundingClientRect(); el.classList.add('flash'); }); }
    function check() {
      if (phase >= 4) return;
      const t = order[phase].t;
      const actual = info.cells.filter((c) => c.t === t).map((c) => c.r + ',' + c.c);
      const mine = Object.keys(marks).filter((kk) => marks[kk] === t);
      const missing = actual.filter((kk) => !mine.includes(kk)), extra = mine.filter((kk) => !actual.includes(kk));
      if (missing.length || extra.length) {
        o.onWrong && o.onWrong(t, mine.length, actual.length);
        flash(missing.concat(extra)); msg.className = 'fb try';
        msg.textContent = `${SCRIPT.oops} ` + (missing.length && !extra.length ? `${missing.length} square${missing.length > 1 ? 's' : ''} still need${missing.length > 1 ? '' : 's'} this mark. Look at the flashing squares.` : extra.length && !missing.length ? `${extra.length} of your marks belong to a different rule. Look at the flashing squares.` : 'Some squares are missing a mark and some have the wrong one. Look at the flashing squares.');
        return;
      }
      Chime(); phase++;
      if (phase < 4) { barRender(); say(order[phase].say); }
      else {
        barRender(); checkBtn.style.display = 'none';
        msg.className = 'fb ok'; msg.textContent = `Done. Full ${info.full}, more than half ${info.more}, exactly half ${info.half} (two halves make one), less than half ${info.less} (counts 0).`;
        o.onComplete && o.onComplete();
      }
    }
    if (o.demo) {
      checkBtn.style.display = 'none'; barRender();
      (async () => {
        for (let i = 0; i < 4; i++) {
          if (!wrap.isConnected && i > 0) return;
          say(order[i].say);
          info.cells.filter((c) => c.t === order[i].t).forEach((c) => { marks[c.r + ',' + c.c] = order[i].t; });
          render(); await sleep(1400);
        }
        msg.className = 'fb ok'; msg.textContent = 'All marked. Now we count.'; o.onComplete && o.onComplete();
      })();
    } else { barRender(); say(order[0].say); }
    return wrap;
  };

  /* The finished, marked-up squared paper (stays in view while he counts) */
  g.gridStatic = function (info) {
    const cols = 10, rows = 8, k = 36, ox = 20, oy = 10;
    const svg = s('svg', { viewBox: '0 0 400 310', class: 'gridsvg', role: 'img', 'aria-label': 'squared paper with ' + info.name + ', all squares marked' });
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) svg.appendChild(s('rect', { x: ox + c * k, y: oy + r * k, width: k, height: k, fill: 'none', stroke: '#b7b19d', 'stroke-width': 1 }));
    svg.appendChild(s('polygon', { class: 'shape', points: info.poly.map((p) => `${ox + p[0] * k},${oy + p[1] * k}`).join(' ') }));
    info.cells.forEach((cl) => {
      if (!cl.t) return;
      const x = ox + cl.c * k + k / 2, y = oy + cl.r * k + k / 2;
      if (cl.t === 'full') svg.append(s('rect', { class: 'mk-full', x: ox + cl.c * k + 2, y: oy + cl.r * k + 2, width: k - 4, height: k - 4 }), s('text', { x, y }, '1'));
      if (cl.t === 'more') svg.append(s('circle', { cx: x, cy: y, r: 14, fill: 'rgba(249,115,22,.25)', stroke: '#7a3300', 'stroke-width': 2.5 }), s('text', { x, y }, '1'));
      if (cl.t === 'less') svg.append(s('text', { x, y, style: 'font-size:22px' }, '✕'));
      if (cl.t === 'half') svg.append(s('text', { x, y, style: 'font-size:20px;fill:#7a3300' }, '½'));
    });
    return svg;
  };

  /* A static grid with the shape; tap to shade it orange (Drawing step for S8) */
  g.gridShade = function (key, onDone) {
    const info = gridInfo(key, 10, 8), cols = 10, rows = 8, k = 36, ox = 20, oy = 10;
    const svg = s('svg', { viewBox: '0 0 400 310', class: 'gridsvg', role: 'img', 'aria-label': 'squared paper with ' + info.name });
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) svg.appendChild(s('rect', { x: ox + c * k, y: oy + r * k, width: k, height: k, fill: 'none', stroke: '#b7b19d', 'stroke-width': 1 }));
    const shape = s('polygon', { points: info.poly.map((p) => `${ox + p[0] * k},${oy + p[1] * k}`).join(' '), fill: '#fffdf6', stroke: '#374151', 'stroke-width': 3, 'stroke-linejoin': 'round', style: 'cursor:pointer;transition:fill .6s', 'fill-opacity': 0.6 });
    let done = false;
    shape.addEventListener('click', () => { if (done) return; done = true; shape.setAttribute('fill', 'var(--cover)'); onDone && onDone(); });
    svg.appendChild(shape);
    return svg;
  };

  /* =====================================================================
     DRAWING step: blue border on walk pictures, orange inside on cover pictures
     ===================================================================== */
  g.runDrawing = function (root, items, next) {
    let i = 0;
    function show() {
      clear(root);
      const it = items[i], walkMode = it.mode === 'walk';
      root.append(h('div', { class: 'hint' }, `Picture ${i + 1} of ${items.length}`),
        script(walkMode ? 'Walk picture. Blue border. ' + SCRIPT.walkGesture + ' Tap every side.' : 'Cover picture. Orange inside. ' + SCRIPT.coverGesture + ' Tap the shape.', true));
      const done = h('div'), sum = h('div', { class: 'sum-line' });
      const complete = () => {
        Chime();
        done.append(h('div', { class: 'celebrate' }, walkMode ? 'Blue border. That is a walk: perimeter.' : 'Orange inside. That is a cover: area.'),
          h('div', { style: 'margin-top:10px' }, i + 1 < items.length ? nextBtn(() => { i++; show(); }, 'Next picture ▶') : nextBtn(next)));
      };
      if (it.fig.kind === 'grid') {
        root.append(h('div', { class: 'grid-wrap' }, gridShade(it.fig.key, complete)), done);
      } else {
        const f = makeFigure(it.fig, { mode: it.mode });
        const vals = [];
        makeInteractive(f, it.mode, {
          progress: (sd) => { if (walkMode && sd.value != null && typeof sd.value === 'number') { vals.push(sd.value); sum.textContent = vals.join(' + '); } },
          complete: () => { if (walkMode) sum.innerHTML = vals.join(' + ') + ' <span class="eq">=</span> ' + vals.reduce((a, b) => a + b, 0) + ' ' + (it.fig.unit || ''); complete(); },
        });
        root.append(f.svg, sum, done);
      }
    }
    show();
  };
})(window);
