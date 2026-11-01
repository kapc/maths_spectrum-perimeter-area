/* Developer-only smoke test. Not loaded by the game.
   In the browser console on index.html:
     const s=document.createElement('script');s.src='dev/autoplay.js';document.head.appendChild(s);
     await autoplayAll();   // plays all ten sessions with correct answers and reports errors */
(function (S) {
  const w = (ms) => new Promise((r) => setTimeout(r, ms));
  S.__errs = [];
  addEventListener('error', (e) => S.__errs.push(e.message + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno));
  const $btn = (t) => [...document.querySelectorAll('button')].find((b) => !b.disabled && b.offsetParent !== null && b.textContent.includes(t));
  const $click = (t) => { const b = $btn(t); if (!b) throw new Error('no button "' + t + '" | ' + ((document.querySelector('#stage') || document.body).innerText.slice(0, 200))); b.click(); };
  const $has = (t) => !!$btn(t);
  const $fire = (el) => el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  const nextB = () => [...document.querySelectorAll('#stage button')].find((b) => !b.disabled && /^(Next|Finish)/.test(b.textContent.trim()));

  async function sortAll() {
    for (let i = 0; i < 6; i++) {
      await w(60);
      const nm = document.querySelector('.sortcard .nm').textContent;
      $click(CARDS.find((x) => x.name === nm).mode === 'walk' ? 'WALK' : 'COVER');
      await w(1250);
    }
  }

  async function solveNumbers(sid, stop) {
    const sess = SESSIONS[sid - 1];
    for (let guard = 0; guard < 600; guard++) {
      await w(60);
      const st = document.querySelector('#stage');
      const h2 = st.querySelector('h2');
      if (h2 && h2.textContent.includes('Check')) return 'numbers done';
      const m = st.innerText.match(/Problem (\d+) of/); if (!m) continue;
      const P = sess.problems[+m[1] - 1];
      const work = st.querySelector('.cols .card:not(.stepcard)'); if (!work) continue;
      const wt = work.innerText, ht = (work.querySelector('h3') || {}).textContent || '';
      if (stop && +m[1] === stop.prob && ht.startsWith(stop.step)) return 'stopped at problem ' + stop.prob + ' step ' + stop.step;
      if (wt.includes('Problem done')) { $click(wt.includes('Finish numbers') ? 'Finish numbers' : 'Next problem'); continue; }
      const nb = [...work.querySelectorAll('button')].find((b) => !b.disabled && /^Next/.test(b.textContent.trim()));
      if (nb) { nb.click(); continue; }
      if ($has('Finish this problem')) { $click('Finish this problem'); continue; }
      if (P.level === 'worked' || (P.level === 'together' && /^[123]\./.test(ht))) { await w(250); continue; }
      if (ht.startsWith('1.')) { $click(P.mode === 'walk' ? 'WALK' : 'COVER'); continue; }
      if (ht.startsWith('2.')) {
        if (P.fig.kind === 'grid') {
          const info = gridInfo(P.fig.key, 10, 8), cells = [...work.querySelectorAll('.gridsvg .cell')];
          for (const t of ['full', 'more', 'less', 'half']) { info.cells.filter((x) => x.t === t).forEach((c) => $fire(cells[c.r * 10 + c.c])); $click('Check this step'); await w(30); }
          continue;
        }
        if (P.mode === 'walk') work.querySelectorAll('.side').forEach($fire); else work.querySelectorAll('polygon.region').forEach($fire);
        continue;
      }
      if (ht.startsWith('3.')) { const b = [...work.querySelectorAll('.rulecard')].find((x) => x.textContent.includes(RULES[P.rule].text) && !x.disabled); if (b) b.click(); continue; }
      if (ht.startsWith('4.')) {
        const ops = work.querySelectorAll('input.opbox');
        if (ops.length && !ops[0].disabled) { P.calc[0].operands.forEach((v, i) => { ops[i].value = v; }); $click('Numbers are in'); continue; }
        const inp = [...work.querySelectorAll('input.num')].find((i) => !i.disabled);
        if (inp) { const lbl = inp.closest('.row').querySelector('.lbl').textContent; inp.value = P.calc.find((x) => x.label === lbl).ans; $click('Check \u2713'); }
        continue;
      }
      if (ht.startsWith('5.')) { const inp = [...work.querySelectorAll('input.num')].find((i) => !i.disabled); if (inp) { inp.value = P.calc[P.calc.length - 1].ans; $click('Check \u2713'); } continue; }
      if (ht.startsWith('6.')) { const u = P.calc[P.calc.length - 1].unit || P.unit; $click((/^sq/.test(u) ? 'cover' : /^(m|cm|units)$/.test(u) ? 'walk' : P.mode) === 'walk' ? 'WALK' : 'COVER'); continue; }
    }
    return 'numbers: guard hit';
  }

  const handsFor = {
    walk: async () => { for (let i = 0; i < 4; i++) { $click('Walk to the next'); await w(1100); } },
    cover: async () => { $click('Sweep it for me'); await w(1500); },
    sort: sortAll,
    tick: async () => { document.querySelectorAll('.side').forEach($fire); await w(100); if ($has('Look for pairs')) { $click('Look for pairs'); await w(100); } },
    string: async () => { $click('Triangle'); await w(50); $click('Square'); await w(50); $click('Hexagon'); },
    tile: async () => { $click('Sweep it for me'); await w(2300); $click('Count in rows'); await w(4500); },
    split: async () => { $click('Cut straight down'); await w(50); $click('Cut straight across'); },
    gridrules: async () => { document.querySelectorAll('#stage button.card').forEach((b) => b.click()); },
    tricut: async () => { for (let r = 0; r < 2; r++) { $click('1. Draw'); await w(50); $click('2. Cut'); await w(900); $click('3. Put'); await w(1600); if (r === 0) $click('Try again'); } },
    apex: async () => { const s = document.querySelector('input[type=range]'); s.value = 70; s.dispatchEvent(new Event('input', { bubbles: true })); },
    nine: async () => { for (const p of [12, 20, 18]) { $click('perimeter ' + p); await w(50); } },
    plan: async () => {
      const rooms = [24, 12, 12, 12];
      for (let i = 0; i < 4; i++) { const inp = [...document.querySelectorAll('input.num')].find((x) => !x.disabled); inp.value = rooms[i]; $click('Check \u2713'); await w(50); $click(i < 3 ? 'Next room' : 'Check the whole house'); await w(50); }
      for (let k = 0; k < 2; k++) { const inp = [...document.querySelectorAll('input.num')].find((x) => !x.disabled); inp.value = k ? 60 : 60; $click('Check \u2713'); await w(50); }
    },
  };

  async function drawAll() {
    for (let g = 0; g < 4; g++) {
      await w(80);
      const st = document.querySelector('#stage'), poly = st.querySelector('.gridsvg polygon');
      if (poly) $fire(poly); else { st.querySelectorAll('.side').forEach($fire); st.querySelectorAll('polygon.region').forEach($fire); }
      await w(80);
      const nb = nextB(); if (!nb) throw new Error('no next in drawing');
      const t = nb.textContent; nb.click();
      if (!/picture/.test(t)) return;
    }
  }

  async function play(sid, stop) {
    const sess = SESSIONS[sid - 1], log = [];
    $click('SESSION ' + sid); await w(120); $click('Start'); await w(120);
    if (sid > 1) await sortAll();
    await w(120); $click('Next'); await w(120);
    for (const hd of sess.hands) {
      await handsFor[hd.t](); await w(100);
      if (hd.t === 'sort') { log.push('hands:sort (auto-advances)'); await w(1300); continue; }
      const nb = nextB(); if (!nb) throw new Error('hands ' + hd.t + ' no next: ' + document.querySelector('#stage').innerText.slice(-200));
      log.push('hands:' + hd.t); nb.click(); await w(150);
    }
    await drawAll(); log.push('drawing'); await w(100);
    if (sess.problems.length) log.push(await solveNumbers(sid, stop));
    if (stop) return log;
    const wr = sess.wrong;
    $click(wr.options[wr.right].slice(0, 25)); await w(80); $click('Next'); await w(80); $click('I said it'); await w(80); $click('Finish'); await w(100);
    log.push('finished:' + /Finished\./.test(document.querySelector('#stage').innerText));
    return log;
  }

  S.autoplay = play;
  S.autoplayAll = async function (ids) {
    Store.data.settings.openAll = true; Store.save();
    const res = {};
    for (const sid of ids || [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
      try {
        if (!document.querySelector('.map')) $click('Back to the park');
        await w(200);
        res[sid] = await play(sid);
      } catch (e) { res[sid] = 'ERR ' + e.message; break; }
    }
    res.errors = S.__errs;
    return res;
  };
})(window);
