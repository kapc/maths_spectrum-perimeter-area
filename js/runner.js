/* The problem runner. Every problem follows the guide's step card, in the same order, every time:
   1 Walk or cover?  2 Draw and label.  3 Write the rule.  4 Put the numbers in.  5 Answer + unit.  6 Check the unit.
   Level "worked": the app shows all six steps.  "together": the app does 1-3, he does 4-6.  "alone": he does all six. */
(function (g) {
  'use strict';

  const LEVEL_TEXT = {
    worked: 'Worked example: watch and listen',
    together: 'Together: I show steps 1 to 3, you do steps 4 to 6',
    alone: 'On my own, with the step card',
  };
  const LEN_UNITS = /^(m|cm|units)$/;

  function highlightCues(P) {
    const cues = (g.CUES[P.mode] || []).slice().sort((a, b) => b.length - a.length);
    let html = P.story.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    let found = null;
    cues.forEach((c) => {
      const re = new RegExp('\\b(' + c + '\\w*)', 'ig');
      // only touch text that is not already inside a <mark>
      html = html.split(/(<mark class="cue">.*?<\/mark>)/).map((part) => {
        if (part.indexOf('<mark') === 0) return part;
        return part.replace(re, (m) => { if (!found) found = c; return '<mark class="cue">' + m + '</mark>'; });
      }).join('');
    });
    return { html, cue: P.cue || found };
  }

  g.runNumbers = function (root, sess, done) {
    let i = 0;
    const total = sess.problems.length;
    (function nextProblem() {
      if (i >= total) return done();
      clear(root);
      runProblem(root, sess, sess.problems[i], i, total, () => { i++; nextProblem(); });
    })();
  };

  function runProblem(root, sess, P, idx, total, finish) {
    const level = P.level;
    const demoUpTo = level === 'worked' ? 6 : level === 'together' ? 3 : 0;
    const unitFinal = P.calc[P.calc.length - 1].unit || P.unit;
    let step = 0, firstTry = true, praiseWalkTrace = false;

    const { html, cue } = highlightCues(P);
    const work = h('div', { class: 'card', style: 'min-height:260px' });
    const stuckBox = h('div');
    const list = h('ol');
    const lis = g.STEPS.map((st, n) => { const li = h('li', null, h('span', { class: 'n' }, h('span', null, n + 1)), st.title); list.appendChild(li); return li; });
    const gesture = h('div', { class: 'hint', style: 'margin-top:10px' }, '☝️ Walk: trace the border', h('br'), '✋ Cover: sweep the inside');
    const stepcard = h('div', { class: 'card stepcard' }, h('h3', null, 'Step card'), list, gesture);
    const storyEl = h('p', { style: 'font-size:1.15rem;margin:6px 0' });
    storyEl.innerHTML = html;

    root.append(
      h('div', { style: 'display:flex;gap:10px;align-items:center;flex-wrap:wrap' },
        h('b', null, `Problem ${idx + 1} of ${total}`),
        h('span', { class: 'hint' }, LEVEL_TEXT[level]),
        h('span', { style: 'flex:1' }),
        h('button', { class: 'btn ghost small', onclick: stuck }, "I'm stuck")),
      h('div', { class: 'hint' }, idx === 1 ? 'Same maths, new story. You already know this one.' : ''),
      h('div', { class: 'card', style: 'margin-top:8px' },
        h('div', { class: 'hint' }, 'Story: ' + P.type.replace('FENCE', 'FENCE / WALK').replace('COVER', 'COVER / TILE').replace('LEFT', 'LEFT OVER').replace('MISSING', 'MISSING SIDE').replace('COST', 'COST / ROUNDS') ),
        storyEl,
        h('div', null, h('b', null, 'In one plain sentence: '), P.plain),
        h('button', { class: 'btn ghost small', style: 'margin-top:8px', onclick: () => Speak.say(P.story + ' ' + P.plain, true) }, '🔊 Read to me')),
      stuckBox,
      h('div', { class: 'cols', style: 'margin-top:14px' }, stepcard, work));

    /* ---- bookkeeping ---- */
    function wrong(stepName, got, expected) {
      firstTry = false;
      Store.logError({ sid: sess.id, pid: P.id, type: P.type, step: stepName, got: String(got), expected: String(expected) });
    }
    function paintCard() {
      lis.forEach((li, n) => { li.className = n < step ? 'done' : n === step ? 'now' : ''; });
    }
    function advance() { step++; if (step >= 6) return complete(); paintCard(); renderStep(); window.scrollTo({ top: root.offsetTop, behavior: 'auto' }); }
    function stuck() {
      Store.logError({ sid: sess.id, pid: P.id, type: P.type, step: 'STUCK at ' + g.STEPS[Math.min(step, 5)].title, got: '', expected: '' });
      firstTry = false; Speak.say(SCRIPT.stuck, true);
      clear(stuckBox).append(h('div', { class: 'script' }, h('div', null, h('b', null, 'Stop. Pencils down.'), ' Show me with your finger: walk or cover? Good. What is step 1 on the card? Do only step 1. I will wait.'),
        h('button', { class: 'btn small', onclick: () => { clear(stuckBox); lis.forEach((l) => l.classList.remove('focus')); } }, 'OK, I will do step 1')));
      lis[0].classList.add('focus');
    }
    const demoBar = (text) => h('div', null, h('p', { class: 'hint' }, text), nextBtn(advance));

    /* ---- STEP 1: walk or cover ---- */
    function stepSort(demo) {
      const msg = h('div', { class: 'fb' });
      const mk = (m, label, gest) => h('button', { class: 'btn ' + m + (demo && P.mode === m ? ' pick' : ''), disabled: demo, onclick: () => {
        if (m === P.mode) { msg.className = 'fb ok'; msg.textContent = m === 'walk' ? 'Yes. We walk it. Blue.' : 'Yes. We cover it. Orange.'; Chime(); work.append(nextBtn(advance)); btns.querySelectorAll('button').forEach((b) => { b.disabled = true; }); }
        else { wrong('Walk or cover?', m, P.mode); msg.className = 'fb try'; msg.textContent = `${SCRIPT.oops} Look at the story again${cue ? ': "' + cue + '"' : ''}. Use your finger. Do we walk it, or cover it?`; Speak.say(msg.textContent); }
      } }, label, h('span', { class: 'gesture' }, gest));
      const btns = h('div', { class: 'big-choice' }, mk('walk', 'WALK', '☝️ trace the border'), mk('cover', 'COVER', '✋ sweep the inside'));
      work.append(h('h3', { style: 'margin-top:0' }, '1. Walk or cover?'), script('Read the story again. Find the word that tells us. Then decide.'), btns, msg);
      if (demo) {
        const word = cue ? `The story says "${cue}". ` : '';
        work.append(demoBar(`${word}${P.mode === 'walk' ? 'We walk it. Blue.' : 'We cover it. Orange.'}`));
      }
    }

    /* ---- STEP 2: draw and label ---- */
    function stepDraw(demo) {
      work.append(h('h3', { style: 'margin-top:0' }, '2. Draw and label'));
      const sum = h('div', { class: 'sum-line' });
      const after = h('div');
      const showSum = P.mode === 'walk' && P.type !== 'MISSING' && P.fig.kind !== 'grid';
      const finished = () => { after.append(h('div', { class: 'celebrate' }, P.mode === 'walk' ? 'Blue border on the whole picture. Point, write, tick: done.' : 'Orange inside. Cover shown.'), h('div', { style: 'margin-top:10px' }, nextBtn(advance))); Chime(); };
      if (P.fig.kind === 'grid') {
        const info = gridInfo(P.fig.key, 10, 8);
        work.append(script(P.mode === 'cover' ? 'Mark the squares with the ritual. Four steps, always in this order.' : ''),
          gridMarker(info, { demo, onComplete: finished, onWrong: (t, m, a) => wrong('Draw: mark ' + t, m, a) }), after);
        return;
      }
      const fig = makeFigure(P.fig, { mode: P.mode });
      const vals = [];
      work.append(script(P.mode === 'walk' ? 'Blue: tap every side, one at a time. Point, write, tick.' : 'Orange: tap the shape to shade the inside.'), fig.svg);
      if (P.note) work.append(h('div', { class: 'sum-line', style: 'font-size:1.15rem;color:var(--ink)' }, P.note));
      work.append(sum, after);
      const upd = (sd) => { if (showSum && typeof sd.value === 'number') { vals.push(sd.value); sum.textContent = vals.join(' + '); } };
      const fin = () => { if (showSum) sum.innerHTML = vals.join(' + ') + ' <span class="eq">=</span> ' + vals.reduce((a, b) => a + b, 0) + ' ' + (P.fig.unit || ''); finished(); };
      if (demo) {
        (async () => {
          if (P.mode === 'walk') { for (const sd of fig.sides) { await sleep(450); if (!work.isConnected) return; sd.trace(); upd(sd); } }
          else { for (const r of fig.regions) { await sleep(500); if (!work.isConnected) return; r.shade(r !== fig.regions[0]); } }
          fin();
        })();
      } else makeInteractive(fig, P.mode, { progress: upd, complete: fin });
    }

    /* ---- STEP 3: write the rule ---- */
    function stepRule(demo) {
      const rule = RULES[P.rule];
      const others = RULE_DISTRACT[P.rule];
      const keys = shuffle([P.rule].concat(others), hash(P.id));
      const msg = h('div', { class: 'fb' });
      const cards = h('div', { class: 'rules' }, keys.map((k) => {
        const r = RULES[k];
        return h('button', { class: 'rulecard' + (demo && k === P.rule ? ' right' : ''), disabled: demo, onclick: (e) => {
          if (k === P.rule) { e.currentTarget.classList.add('right'); msg.className = 'fb ok'; msg.textContent = 'Yes. That is the rule.'; Chime(); cards.querySelectorAll('button').forEach((b) => { b.disabled = true; }); work.append(nextBtn(advance)); }
          else {
            wrong('Write the rule', r.text, rule.text); e.currentTarget.classList.add('wrong'); msg.className = 'fb try';
            msg.textContent = r.mode !== P.mode ? `${SCRIPT.oops} That rule is the other colour. Our story is ${P.mode === 'walk' ? 'WALK (blue)' : 'COVER (orange)'}. Which rule belongs to our colour?` : `${SCRIPT.oops} That rule is for a different job. Look at the picture and the plain sentence.`;
            Speak.say(msg.textContent);
          }
        } }, h('span', { class: r.mode === 'walk' ? 'walk-word' : 'cover-word' }, r.mode === 'walk' ? 'WALK' : 'COVER'), h('br'), r.text);
      }));
      work.append(h('h3', { style: 'margin-top:0' }, '3. Write the rule'), script('Which rule fits our story? Pick one card.'), cards, msg);
      if (demo) work.append(demoBar(`The rule is: ${rule.text}.`));
    }

    /* ---- STEP 4: put the numbers in ---- */
    function stepNum(demo) {
      const cs = P.calc, pre = cs.slice(0, -1);
      work.append(h('h3', { style: 'margin-top:0' }, '4. Put the numbers in'));
      const helpAfter = level === 'together' ? 1 : 2;
      const showExpr = level !== 'alone';
      if (pre.length) {
        work.append(script('One number at a time. Do only this step.'));
        const holder = h('div'); work.append(holder);
        if (demo) {
          pre.forEach((c) => holder.append(numRow({ label: c.label, expr: c.expr, unit: c.unit || P.unit, ans: c.ans, demo: true })));
          work.append(demoBar('Each step is done on its own.'));
          return;
        }
        let k = 0;
        const addRow = () => {
          const c = pre[k];
          holder.append(numRow({ label: c.label, expr: c.expr, showExpr, unit: c.unit || P.unit, ans: c.ans, hints: c.hints, helpAfter,
            onWrong: (v) => wrong('Numbers: ' + c.label, v, c.ans),
            onOk: (ft) => { if (!ft) firstTry = false; k++; if (k < pre.length) addRow(); else work.append(nextBtn(advance)); } }));
        };
        addRow();
        return;
      }
      /* single-step problem: put the given numbers into the rule */
      const c = cs[0], ops = c.operands, op = c.op;
      work.append(script(`Rule: ${RULES[P.rule].text}. Read the numbers from the picture and the story. Put them in the boxes.`));
      const msg = h('div', { class: 'fb' });
      let wrongs = 0;
      const inputs = ops.map((v, n) => {
        const inp = h('input', { type: 'text', inputmode: 'decimal', class: 'num opbox', autocomplete: 'off', 'aria-label': 'number ' + (n + 1) });
        if (demo) { inp.value = v; inp.disabled = true; inp.classList.add('ok'); }
        return inp;
      });
      const line = h('div', { class: 'row', style: 'font-size:1.5rem;font-weight:800' });
      inputs.forEach((inp, n) => { if (n) line.append(h('span', null, op)); line.append(inp); });
      const help = h('span');
      const btn = h('button', { class: 'btn', style: demo ? 'display:none' : '', onclick: check }, 'Numbers are in ✓');
      line.append(btn, help);
      work.append(line, msg);
      function check() {
        const vals = inputs.map((x) => parseNum(x.value));
        if (vals.some((v) => v == null)) { msg.className = 'fb try'; msg.textContent = 'Fill every box with a number.'; return; }
        const okv = op === '÷' ? vals.every((v, n) => v === ops[n]) : vals.slice().sort((a, b) => a - b).join() === ops.slice().sort((a, b) => a - b).join();
        if (okv) { inputs.forEach((x) => { x.disabled = true; x.classList.add('ok'); }); btn.disabled = true; msg.className = 'fb ok'; msg.textContent = 'Yes. The numbers are in. ✓'; Chime(); help.textContent = ''; if (wrongs >= 2 && help.dataset.helped) firstTry = false; work.append(nextBtn(advance)); }
        else {
          wrongs++; wrong('Numbers in rule', vals.join(op), ops.join(op)); msg.className = 'fb try';
          msg.textContent = `${SCRIPT.oops} Look at the picture and the story. Which numbers does the rule need?` + (wrongs >= 2 ? ` Try: ${c.expr}` : '');
          if (wrongs >= 2 && !help.firstChild) help.appendChild(h('button', { class: 'btn ghost small', onclick: () => { help.dataset.helped = '1'; inputs.forEach((x, n) => { x.value = ops[n]; }); } }, 'Show me'));
        }
      }
      if (demo) work.append(demoBar('Look at the picture: these are the numbers the rule needs.'));
      else setTimeout(() => inputs[0].isConnected && inputs[0].focus({ preventScroll: true }), 50);
    }

    /* ---- STEP 5: answer + unit ---- */
    function stepAns(demo) {
      const cs = P.calc, c = cs[cs.length - 1];
      work.append(h('h3', { style: 'margin-top:0' }, '5. Answer + unit'));
      const earlier = cs.slice(0, -1);
      if (earlier.length) work.append(h('div', { class: 'card', style: 'background:var(--note)' }, h('b', null, 'Working so far: '), earlier.map((e) => h('div', null, `${e.label} = ${fmt(e.ans)} ${e.unit || P.unit}`))));
      work.append(script(`The unit is already printed for you: ${unitFinal}.`));
      work.append(numRow({ label: c.label, expr: c.expr, showExpr: level !== 'alone', unit: unitFinal, ans: c.ans, hints: c.hints, demo, helpAfter: level === 'together' ? 1 : 2, focus: !demo,
        onWrong: (v) => wrong('Answer: ' + c.label, v, c.ans),
        onOk: (ft) => { if (!ft) firstTry = false; work.append(nextBtn(advance)); } }));
      if (demo) work.append(demoBar(`The answer is ${fmt(c.ans)} ${unitFinal}.`));
    }

    /* ---- STEP 6: check the unit ---- */
    function stepCheck(demo) {
      const c = P.calc[P.calc.length - 1];
      const expect = /^sq/.test(unitFinal) ? 'cover' : LEN_UNITS.test(unitFinal) ? 'walk' : P.mode;
      const q = P.checkText || `Our answer is ${fmt(c.ans)} ${unitFinal}. ${/^sq/.test(unitFinal) ? 'Sq means squares.' : 'This is a length.'} Is that a walk or a cover?`;
      const msg = h('div', { class: 'fb' });
      const mk = (m, label) => h('button', { class: 'btn ' + m + (demo && expect === m ? ' pick' : ''), disabled: demo, onclick: () => {
        if (m === expect) { msg.className = 'fb ok'; msg.textContent = m === P.mode ? 'Yes. The unit matches our story. ✓' : 'Yes. ✓'; Chime(); btns.querySelectorAll('button').forEach((b) => { b.disabled = true; }); work.append(nextBtn(complete, 'Finish this problem ▶')); }
        else { wrong('Check the unit', m, expect); msg.className = 'fb try'; msg.textContent = `${SCRIPT.oops} cm and m are lengths: a walk. Sq cm and sq m are squares: a cover.`; Speak.say(msg.textContent); }
      } }, label);
      const btns = h('div', { class: 'big-choice' }, mk('walk', 'WALK'), mk('cover', 'COVER'));
      work.append(h('h3', { style: 'margin-top:0' }, '6. Check: does the unit match?'), script(q, true), btns, msg);
      if (demo) work.append(h('p', { class: 'hint' }, `${expect === 'walk' ? 'Walk' : 'Cover'} matches the unit.`), nextBtn(complete, 'Finish this problem ▶'));
    }

    /* ---- finish ---- */
    function complete() {
      lis.forEach((li) => { li.className = 'done'; });
      if (level === 'alone') Store.recordTry(sess.id, firstTry);
      const c = P.calc[P.calc.length - 1];
      clear(work);
      const praise = level !== 'alone' ? 'Good. That one was done together. Now you do it.'
        : firstTry ? (P.mode === 'walk' ? 'You decided walk or cover first and followed the card in order. That is why it worked.' : 'You decided walk or cover first and followed the card in order. That is why it worked.')
          : 'Good. That error tells us exactly what to fix. The error is saved for the grown-up. We try the next one with the card.';
      work.append(h('h3', { style: 'margin-top:0' }, 'Problem done'),
        h('div', { class: 'celebrate' }, `Answer: ${fmt(c.ans)} ${unitFinal}`), h('p', null, praise),
        nextBtn(finish, idx + 1 < total ? 'Next problem ▶' : 'Finish numbers ▶'));
      Speak.say(praise);
    }

    /* the labelled, coloured picture stays in view for steps 3-6: nothing important lives only in his head */
    function miniFigure() {
      if (P.fig.kind === 'grid') return h('div', { style: 'max-width:300px;margin:0 auto 6px' }, gridStatic(gridInfo(P.fig.key, 10, 8)));
      const f = makeFigure(P.fig, { mode: P.mode });
      if (P.mode === 'walk') f.traceAll(); else f.regions.forEach((r, i) => r.shade(i > 0));
      f.svg.style.maxWidth = '270px';
      return h('div', { style: 'margin-bottom:6px' }, f.svg, P.note ? h('div', { class: 'hint', style: 'text-align:center;font-weight:700' }, P.note) : null);
    }

    function renderStep() {
      clear(work);
      if (step >= 2) work.append(miniFigure());
      const demo = step < demoUpTo;
      [stepSort, stepDraw, stepRule, stepNum, stepAns, stepCheck][step](demo);
    }
    paintCard(); renderStep();
  }
})(window);
