# Maths Spectrum: Perimeter & Area (Dino edition) 🦖

A small, calm learning game that teaches **perimeter** and **area** (NCERT Ganita Prakash, Grade 6, Chapter 6) using dinosaurs and Motu Patlu-style stories. It was designed for an autistic learner, following an autism-informed teaching guide.

All artwork is original. It is not taken from the TV show.

## Run it locally

There is nothing to install. It is plain HTML, CSS and JavaScript, with no build step and no dependencies.

### Option 1: open the file

1. Clone or download this repo.
2. Double-click `index.html`, or drag it into Chrome, Safari, Edge or Firefox.

### Option 2: tiny local server

```bash
git clone https://github.com/kapc/maths_spectrum-perimeter-area.git
cd maths_spectrum-perimeter-area
python3 -m http.server 8765
```

Then open <http://127.0.0.1:8765/index.html>.

Progress is saved in the browser's `localStorage` (key `dino-pa-v1`). It stays on that device and browser. Use a different browser or clear site data to start fresh.

## How the game works

| Idea | What it means in the game |
| --- | --- |
| **Walk = perimeter = blue** | Trace the border with a finger. |
| **Cover = area = orange** | Sweep or fill the inside. |
| Fixed session shape | Schedule, warm-up, story, hands-on, drawing, numbers, check, finished. |
| Six-step card | Walk or cover, draw and label, write the rule, put the numbers in, answer with the unit, check the unit. |
| Gradual release | Problem 1 is shown fully, problem 2 is done together, the rest he does alone. |
| Same words every time | Fixed scripted sentences for "stuck" and "oops". |
| No timers or scores | A wrong answer gives a specific, gentle hint, never red. |
| Mastery gate | 3 right first time in a row on 2 different days (session 8 needs 2). The next session then unlocks. |

Blue and orange are used for nothing else in the app.

There are 10 sessions, from tracing and covering shapes up to rectangles, squares, triangles, L-shapes, squared paper, and word problems (fence, tiles, carpet, cost, rounds).

## Grown-up corner

Open it from the top bar. It has:

- **Tips** for teaching sessions.
- **Progress**, where you can mark a session as secure.
- **Where it breaks**, a log of mistakes by step, which can be copied.
- **His sentences**, for teach-back notes.
- **Settings**: sound, read-aloud, reduced motion, open all sessions, the two colours, text size, and erase progress.

There is also a break screen (breathing circle and a dinosaur fact), a desk-mat overlay, and an "I'm stuck" button.

Read-aloud and the soft chime are off by default.

## Tips for the grown-up

- Do the "hands" parts with real objects too (string, floor tiles, paper squares). The screen version supports that and does not replace it.
- Keep sessions short and predictable. Stop on a success.
- Use the same words the game uses.

## Project layout

```
index.html        page shell
styles.css        styles
js/util.js        DOM helpers, storage, speech, chime
js/figures.js     original SVG art and shape/label geometry
js/content.js     scripts, rules, problems, the 10 sessions
js/activities.js  hands-on activities and drawing step
js/runner.js      six-step numbers card
js/app.js         home map, sessions, grown-up corner
dev/autoplay.js   developer-only smoke test (not loaded by the game)
```

### Developer smoke test

With the page open, run this in the browser console:

```js
const s = document.createElement('script');
s.src = 'dev/autoplay.js';
document.head.appendChild(s);
// then:
Store.data.settings.openAll = true;
await autoplayAll([1, 2, 3]); // plays those sessions and checks the answers
```

## License

Personal and educational use.
