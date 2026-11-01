/* Original artwork + shape figures. All art here is drawn from scratch (not stills from any show). */
(function (g) {
  'use strict';
  const W = 400, H = 280;

  /* ---------- characters ---------- */
  function dinoShapes(c, d) {
    return [
      s('path', { d: 'M6 64 Q22 48 40 54 L40 72 Q22 74 6 64Z', fill: c }),
      s('ellipse', { cx: 60, cy: 54, rx: 31, ry: 20, fill: c }),
      s('path', { d: 'M38 38 l7 -15 l7 15Z M53 34 l8 -17 l8 17Z M68 36 l7 -15 l7 15Z', fill: d }),
      s('rect', { x: 42, y: 66, width: 10, height: 18, rx: 5, fill: d }),
      s('rect', { x: 70, y: 66, width: 10, height: 18, rx: 5, fill: d }),
      s('path', { d: 'M78 52 Q90 34 94 30 L104 32 Q112 36 108 48 Q100 58 84 60Z', fill: c }),
      s('circle', { cx: 100, cy: 36, r: 15, fill: c }),
      s('circle', { cx: 105, cy: 32, r: 3.2, fill: '#1f2937' }),
      s('circle', { cx: 106, cy: 31, r: 1, fill: '#fff' }),
      s('path', { d: 'M99 42 q7 5 13 0', fill: 'none', stroke: '#1f2937', 'stroke-width': 2.4, 'stroke-linecap': 'round' }),
      s('circle', { cx: 56, cy: 54, r: 5, fill: d, opacity: .25 }),
    ];
  }
  g.dinoSVG = function (o) {
    o = o || {};
    return s('svg', { viewBox: '0 0 120 90', class: 'dino', width: o.w || 120, 'aria-hidden': 'true' }, dinoShapes(o.color || '#58a373', o.dark || '#37805a'));
  };
  g.dinoGroup = function (o) { // for use inside another svg, centred on (0,0)
    o = o || {};
    const k = o.scale || 0.4;
    return s('g', { transform: `scale(${k}) translate(-60 -60)` }, dinoShapes(o.color || '#58a373', o.dark || '#37805a'));
  };
  const SESSION_DINOS = [['#58a373', '#37805a'], ['#d98c5f', '#a8603a'], ['#7a8fd6', '#4a5cab'], ['#d4a63a', '#a37a14'], ['#c279a0', '#8f4a73'], ['#58a8b8', '#357988'], ['#9bb85a', '#6c8a2c'], ['#d16a6a', '#9d3f3f'], ['#8a78c4', '#5d4a98'], ['#6fae94', '#3e7d63']];
  g.parkDino = (i, w) => g.dinoSVG({ color: SESSION_DINOS[(i - 1) % 10][0], dark: SESSION_DINOS[(i - 1) % 10][1], w: w || 54 });

  function person(x, o) {
    // simple friendly cartoon person: o.fat, o.body, o.hair, o.name
    const bw = o.fat ? 34 : 17, bh = o.fat ? 36 : 44;
    return s('g', { transform: `translate(${x} 0)` },
      s('ellipse', { cx: 0, cy: 118, rx: bw, ry: bh, fill: o.body }),
      s('rect', { x: -9, y: 150, width: 7, height: 16, rx: 3, fill: '#3b3b4f' }),
      s('rect', { x: 2, y: 150, width: 7, height: 16, rx: 3, fill: '#3b3b4f' }),
      s('circle', { cx: 0, cy: 72, r: 22, fill: '#f0c49a' }),
      s('path', { d: o.fat ? 'M-22 68 Q0 40 22 68 Q10 56 -22 68Z' : 'M-20 66 L-12 44 L-4 60 L4 42 L12 60 L20 46 L22 68 Q0 54 -20 66Z', fill: o.hair }),
      s('circle', { cx: -8, cy: 74, r: 2.6, fill: '#1f2937' }),
      s('circle', { cx: 8, cy: 74, r: 2.6, fill: '#1f2937' }),
      s('path', { d: 'M-7 83 q7 6 14 0', fill: 'none', stroke: '#1f2937', 'stroke-width': 2.2, 'stroke-linecap': 'round' }),
      s('text', { x: 0, y: 188, 'text-anchor': 'middle', style: 'font:700 14px sans-serif;fill:#1f2937' }, o.name)
    );
  }
  g.sceneSVG = function () {
    return s('svg', { viewBox: '0 0 300 200', role: 'img', 'aria-label': 'Motu, Patlu and a friendly dinosaur', style: 'width:100%;height:auto' },
      s('rect', { x: 0, y: 0, width: 300, height: 200, rx: 18, fill: '#e8f3ea' }),
      s('rect', { x: 0, y: 160, width: 300, height: 40, fill: '#cfe5d3' }),
      s('circle', { cx: 262, cy: 38, r: 18, fill: '#f5d97a' }),
      s('g', { transform: 'translate(0 -6)' },
        person(56, { fat: true, body: '#d9a43c', hair: '#2f2a28', name: 'Motu' }),
        person(116, { fat: false, body: '#6aa57c', hair: '#2f2a28', name: 'Patlu' })),
      s('g', { transform: 'translate(150 86) scale(1.15)' }, dinoShapes('#58a373', '#37805a'))
    );
  };

  /* ---------- geometry helpers ---------- */
  // side labels sit left and right of the shape, so horizontal padding is bigger than vertical
  const fit = (w, h, pad) => Math.min((W - 2 * (pad || 100)) / w, (H - 2 * 56) / h);
  const centroid = (pts) => [pts.reduce((a, p) => a + p[0], 0) / pts.length, pts.reduce((a, p) => a + p[1], 0) / pts.length];
  const ptsStr = (pts) => pts.map((p) => p.map((v) => +v.toFixed(2)).join(',')).join(' ');
  const labelText = (v, unit) => (v === '?' ? '?' : typeof v === 'number' ? `${fmt(v)} ${v === 1 && unit === 'units' ? 'unit' : unit || ''}`.trim() : String(v));

  /* Each side: invisible hit line, visible line (turns blue when traced), label, tick */
  function addSides(out, pts, values, unit, labels, only) {
    pts.forEach((p, i) => {
      const q = pts[(i + 1) % pts.length];
      const mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
      const ex = q[0] - p[0], ey = q[1] - p[1], el = Math.hypot(ex, ey) || 1;
      let nx = ey / el, ny = -ex / el;
      // outward = the side of the edge that is NOT inside the polygon (works for L-shapes too)
      if (inside(pts, mx + nx * 4, my + ny * 4)) { nx = -nx; ny = -ny; }
      const val = values[i];
      const lab = labels && labels[i] !== undefined ? labels[i] : labelText(val, unit);
      const show = lab !== null && (!only || only.indexOf(i) >= 0);
      const sideways = Math.abs(nx) > 0.65;          // label sits left or right of the side
      const tw = String(lab).length * 8.4;            // rough text width
      let lx, ly, anchor, tx, ty;
      if (sideways) {
        anchor = nx > 0 ? 'start' : 'end'; lx = mx + nx * 12; ly = my + 5;
        tx = lx + nx * (tw + 14); ty = my + 6;
      } else {
        anchor = 'middle'; lx = mx + nx * 17; ly = my + ny * 17 + 5;
        tx = mx + nx * 35; ty = my + ny * 35 + 6;
      }
      const hit = s('line', { class: 'side-hit', x1: p[0], y1: p[1], x2: q[0], y2: q[1] });
      const line = s('line', { class: 'side-line', x1: p[0], y1: p[1], x2: q[0], y2: q[1] });
      const text = show ? s('text', { x: lx, y: ly, 'text-anchor': anchor }, lab) : null;
      const tick = s('g', { class: 'tick' }, s('text', { x: tx, y: ty, 'text-anchor': 'middle' }, '✓'));
      const grp = s('g', { class: 'side', 'data-i': i }, hit, line, text, tick);
      const side = {
        i, value: val, el: grp, traced: false, a: p, b: q,
        trace() { if (side.traced) return; side.traced = true; line.classList.add('traced'); tick.classList.add('on'); },
      };
      out.sides.push(side);
      out.gSides.appendChild(grp);
    });
  }

  function gridLines(x0, y0, cols, rows, k, parent) {
    for (let i = 0; i <= cols; i++) parent.appendChild(s('line', { class: 'gridline', x1: x0 + i * k, y1: y0, x2: x0 + i * k, y2: y0 + rows * k }));
    for (let j = 0; j <= rows; j++) parent.appendChild(s('line', { class: 'gridline', x1: x0, y1: y0 + j * k, x2: x0 + cols * k, y2: y0 + j * k }));
  }

  /* spec.kind: rect | tri | poly | floor | plot | lshape | rectTri | triApex
     opts.mode: 'walk' | 'cover'  */
  g.makeFigure = function (spec, opts) {
    opts = opts || {};
    const mode = opts.mode || spec.mode || 'walk';
    const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'fig', role: 'img', 'aria-label': spec.alt || 'a shape' });
    const gReg = s('g'), gGrid = s('g'), gSides = s('g'), gTxt = s('g');
    svg.append(gReg, gGrid, gSides, gTxt);
    const out = { svg, sides: [], regions: [], gSides, spec };
    const unit = spec.unit || '';
    const addRegion = (pts, cls, label, lx, ly) => {
      const el = s('polygon', { class: 'region ' + (cls || ''), points: ptsStr(pts) });
      gReg.appendChild(el);
      if (label) gTxt.appendChild(s('text', { x: lx, y: ly, 'text-anchor': 'middle' }, label));
      const r = { el, shaded: false, shade(lite) { r.shaded = true; el.classList.add('shaded'); if (lite) el.classList.add('lite'); } };
      out.regions.push(r);
      return r;
    };
    const rectPts = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];

    switch (spec.kind) {
      case 'rect': {
        const l = spec.l, b = spec.b, k = fit(l, b), w = l * k, hh = b * k, x0 = (W - w) / 2, y0 = (H - hh) / 2;
        const pts = rectPts(x0, y0, w, hh);
        addRegion(pts, 'main');
        if (spec.grid) gridLines(x0, y0, l, b, k, gGrid);
        const only = mode === 'cover' ? [0, 3] : null;
        addSides(out, pts, [l, b, l, b], unit, spec.labels, only);
        if (spec.center) gTxt.appendChild(s('text', { x: W / 2, y: H / 2 + 5, 'text-anchor': 'middle', style: 'font-size:17px' }, spec.center));
        break;
      }
      case 'tri': {
        const a = spec.a, b = spec.b, c = spec.c;
        const x = (a * a + c * c - b * b) / (2 * c), y = Math.sqrt(Math.max(0.01, a * a - x * x));
        const minX = Math.min(0, x), maxX = Math.max(c, x), k = fit(maxX - minX, y, 76);
        const ox = (W - (maxX - minX) * k) / 2 - minX * k, oy = (H + y * k) / 2;
        const pts = [[ox, oy], [ox + c * k, oy], [ox + x * k, oy - y * k]];
        addRegion(pts, 'main');
        addSides(out, pts, [c, b, a], unit, spec.labels);
        break;
      }
      case 'poly': {
        const n = spec.n, R = 92, cx = W / 2, cy = H / 2 + 4;
        const st = n % 2 ? -Math.PI / 2 : -Math.PI / 2 + Math.PI / n;
        const pts = Array.from({ length: n }, (_, i) => [cx + R * Math.cos(st + i * 2 * Math.PI / n), cy + R * Math.sin(st + i * 2 * Math.PI / n)]);
        addRegion(pts, 'main');
        addSides(out, pts, Array(n).fill(spec.s), unit, spec.labels);
        if (spec.center) gTxt.appendChild(s('text', { x: cx, y: cy + 5, 'text-anchor': 'middle', style: 'font-size:17px' }, spec.center));
        break;
      }
      case 'floor': {
        const l = spec.l, b = spec.b, c = spec.c, k = fit(l, b), w = l * k, hh = b * k, x0 = (W - w) / 2, y0 = (H - hh) / 2;
        addRegion(rectPts(x0, y0, w, hh), 'main', spec.floorLabel || 'floor', x0 + w - 36, y0 + hh - 10);
        if (spec.grid) gridLines(x0, y0, l, b, k, gGrid);
        addRegion(rectPts(x0 + k * 0.5, y0 + k * 0.4, c * k, c * k), 'sub', 'carpet', x0 + k * 0.5 + c * k / 2, y0 + k * 0.4 + c * k / 2 + 5);
        addSides(out, rectPts(x0, y0, w, hh), [l, b, l, b], unit, [labelText(l, unit), labelText(b, unit), null, null], [0, 1]);
        gTxt.appendChild(s('text', { x: x0 + k * 0.5 + c * k / 2, y: y0 + k * 0.4 + c * k + 16, 'text-anchor': 'middle', style: 'font-size:13px' }, `${c} × ${c} ${unit}`));
        break;
      }
      case 'plot': {
        const l = spec.l, b = spec.b, bed = spec.bed, k = fit(l, b), w = l * k, hh = b * k, x0 = (W - w) / 2, y0 = (H - hh) / 2;
        addRegion(rectPts(x0, y0, w, hh), 'main');
        const ps = [[1, 0.7], [l - 1 - bed, 0.7], [1, b - 0.7 - bed], [l - 1 - bed, b - 0.7 - bed]];
        ps.forEach((p) => addRegion(rectPts(x0 + p[0] * k, y0 + p[1] * k, bed * k, bed * k), 'sub', 'bed', x0 + (p[0] + bed / 2) * k, y0 + (p[1] + bed / 2) * k + 5));
        addSides(out, rectPts(x0, y0, w, hh), [l, b, l, b], unit, [labelText(l, unit), labelText(b, unit), null, null], [0, 1]);
        gTxt.appendChild(s('text', { x: W / 2, y: H - 8, 'text-anchor': 'middle', style: 'font-size:13px' }, `4 flower beds, each ${bed} × ${bed} ${unit}`));
        break;
      }
      case 'lshape': {
        const P = spec.pts, mx = Math.max(...P.map((p) => p[0])), my = Math.max(...P.map((p) => p[1]));
        const k = fit(mx, my, 84), x0 = (W - mx * k) / 2, y0 = (H - my * k) / 2;
        const pts = P.map((p) => [x0 + p[0] * k, y0 + p[1] * k]);
        const clipId = 'clip' + Math.random().toString(36).slice(2, 7);
        const clip = s('clipPath', { id: clipId }, s('polygon', { points: ptsStr(pts) }));
        svg.insertBefore(s('defs', null, clip), svg.firstChild);
        addRegion(pts, 'main');
        const gg = s('g', { 'clip-path': `url(#${clipId})` }); gridLines(x0, y0, mx, my, k, gg); gGrid.appendChild(gg);
        const vals = P.map((p, i) => { const q = P[(i + 1) % P.length]; return Math.abs(q[0] - p[0]) + Math.abs(q[1] - p[1]); });
        addSides(out, pts, vals, unit, spec.labels);
        if (spec.cut) gTxt.appendChild(s('line', { class: 'cutline', x1: x0 + spec.cut[0][0] * k, y1: y0 + spec.cut[0][1] * k, x2: x0 + spec.cut[1][0] * k, y2: y0 + spec.cut[1][1] * k }));
        out.map = (x, y) => [x0 + x * k, y0 + y * k]; out.k = k;
        break;
      }
      case 'rectTri': {
        const l = spec.l, b = spec.b, k = fit(l, b), w = l * k, hh = b * k, x0 = (W - w) / 2, y0 = (H - hh) / 2;
        gReg.appendChild(s('polygon', { class: 'ghost', points: ptsStr(rectPts(x0, y0, w, hh)) }));
        addRegion([[x0, y0], [x0 + w, y0 + hh], [x0, y0 + hh]], 'main');
        gTxt.appendChild(s('line', { class: 'cutline', x1: x0, y1: y0, x2: x0 + w, y2: y0 + hh }));
        addSides(out, rectPts(x0, y0, w, hh), [l, b, l, b], unit, [labelText(l, unit), null, null, labelText(b, unit)], [0, 3]);
        break;
      }
      case 'triApex': {
        const l = spec.l, b = spec.b, f = spec.apex == null ? 0.3 : spec.apex, k = fit(l, b), w = l * k, hh = b * k, x0 = (W - w) / 2, y0 = (H - hh) / 2;
        gReg.appendChild(s('polygon', { class: 'ghost', points: ptsStr(rectPts(x0, y0, w, hh)) }));
        addRegion([[x0, y0 + hh], [x0 + w, y0 + hh], [x0 + f * w, y0]], 'main');
        addSides(out, rectPts(x0, y0, w, hh), [l, b, l, b], unit, [null, null, labelText(l, unit), labelText(b, unit)], [2, 3]);
        break;
      }
      default: throw new Error('unknown figure ' + spec.kind);
    }
    out.traceAll = () => out.sides.forEach((x) => x.trace());
    out.shadeAll = () => out.regions.forEach((r) => r.shade());
    return out;
  };

  /* Make a figure tappable for the "Draw and label" step.
     walk  -> every side must be traced (point, write, tick).  cover -> every region shaded. */
  g.makeInteractive = function (fig, mode, cb) {
    cb = cb || {};
    const check = () => {
      if (mode === 'walk' ? fig.sides.every((x) => x.traced) : fig.regions.every((r) => r.shaded)) cb.complete && cb.complete();
    };
    if (mode === 'walk') {
      fig.sides.forEach((sd) => {
        sd.el.addEventListener('click', () => { if (sd.traced) return; sd.trace(); cb.progress && cb.progress(sd); check(); });
      });
    } else {
      fig.regions.forEach((r) => {
        r.el.classList.add('tap');
        r.el.addEventListener('click', () => { if (r.shaded) return; r.shade(fig.regions.length > 1 && r !== fig.regions[0]); cb.progress && cb.progress(r); check(); });
      });
    }
  };

  /* ---------- squared-paper shapes (checked by script: no borderline squares) ---------- */
  const SHAPES = {
    foot: { name: 'dinosaur footprint', pts: [[2, 7], [1, 5], [2, 1], [4, 3], [5, 1], [6, 3], [8, 1], [9, 5], [8, 7]] },
    leaf: { name: 'leaf', pts: [[1, 5], [3, 2], [7, 1], [9, 3], [7, 6], [3, 7]] },
    egg: { name: 'dinosaur egg', pts: Array.from({ length: 32 }, (_, i) => [5 + 3.6 * Math.cos(i / 32 * 2 * Math.PI), 4 + 2.9 * Math.sin(i / 32 * 2 * Math.PI)]) },
    fish: { name: 'fish', pts: [[1, 4], [3, 2], [6, 2], [8, 1], [8, 7], [6, 6], [3, 6]] },
  };
  function inside(poly, x, y) {
    let c = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) c = !c;
    }
    return c;
  }
  g.gridInfo = function (key, cols, rows) {
    const poly = SHAPES[key].pts, N = 40, cells = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      let n = 0;
      for (let a = 0; a < N; a++) for (let b = 0; b < N; b++) if (inside(poly, c + (a + .5) / N, r + (b + .5) / N)) n++;
      const f = n / (N * N);
      let t = null;
      if (f > 0.97) t = 'full'; else if (f >= 0.03) t = Math.abs(f - 0.5) <= 0.04 ? 'half' : f > 0.5 ? 'more' : 'less';
      cells.push({ c, r, f, t });
    }
    const cnt = (t) => cells.filter((x) => x.t === t).length;
    const full = cnt('full'), more = cnt('more'), half = cnt('half');
    return { cells, full, more, half, less: cnt('less'), total: full + more + half / 2, poly, name: SHAPES[key].name };
  };
  g.SHAPES = SHAPES;
})(window);
