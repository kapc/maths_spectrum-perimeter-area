/* All lesson content. Numbers and examples come from the teaching guide (NCERT Ganita Prakash, Grade 6, Ch. 6).
   Wording is deliberately fixed: the same words every time. */
(function (g) {
  'use strict';

  g.SCRIPT = {
    keystone: 'If we walk it, it is perimeter. Blue. If we cover it, it is area. Orange. First decide: walk or cover? Then we do the maths.',
    stuck: 'Stop. Pencils down. Show me with your finger: walk or cover? Good. What is step 1 on the card? Do only step 1. I will wait.',
    oops: 'Not yet. That tells us exactly what to fix.',
    walkGesture: 'Trace the border with one finger, all the way back to the start.',
    coverGesture: 'Sweep an open palm across the whole inside.',
  };

  g.STEPS = [
    { key: 'sort', title: 'Walk or cover?' },
    { key: 'draw', title: 'Draw and label' },
    { key: 'rule', title: 'Write the rule' },
    { key: 'num', title: 'Put the numbers in' },
    { key: 'ans', title: 'Answer + unit' },
    { key: 'chk', title: 'Check: does the unit match?' },
  ];

  g.STRIP = [
    { key: 'warmup', ico: '🃏', name: 'Warm-up' },
    { key: 'story', ico: '📖', name: 'Story' },
    { key: 'hands', ico: '✋', name: 'Hands' },
    { key: 'drawing', ico: '✏️', name: 'Drawing' },
    { key: 'numbers', ico: '🔢', name: 'Numbers' },
    { key: 'check', ico: '✅', name: 'Check' },
    { key: 'finished', ico: '🏁', name: 'Finished' },
  ];

  g.CARDS = [
    { em: '🚧', name: 'A fence for the dinosaur park', mode: 'walk' },
    { em: '🟫', name: 'Tiles for its floor', mode: 'cover' },
    { em: '🧵', name: "Lace for Chaiwala's tablecloth", mode: 'walk' },
    { em: '🎨', name: 'Paint for a wall', mode: 'cover' },
    { em: '🖼️', name: 'Tape for a photo frame', mode: 'walk' },
    { em: '🌱', name: 'Grass seed for a garden', mode: 'cover' },
  ];

  g.CUES = {
    walk: ['all around', 'fencing', 'fence', 'lace', 'tape', 'border', 'one round', 'rounds', 'rope', 'bent into', 'walks once around', 'perimeter'],
    cover: ['not carpeted', 'remaining', 'left for', 'tile', 'carpet', 'paint', 'grass', 'floor', 'land', 'area', 'covers', 'cut in half', 'squared paper'],
  };

  g.DINO_FACTS = [
    'Triceratops had three horns on its face.',
    "Tyrannosaurus rex had very short arms, but strong legs.",
    'Stegosaurus had big plates along its back.',
    'Brachiosaurus had a very long neck, so it could reach the tallest trees.',
    'Some dinosaurs had feathers.',
    'Many dinosaurs hatched from eggs.',
    'A dinosaur footprint is a fossil that tells us how big the dinosaur was.',
  ];

  /* ---------- rules (the formula mat) ---------- */
  const R = {
    rectP: { mode: 'walk', text: '2 × (length + breadth)' },
    sqP: { mode: 'walk', text: '4 × side' },
    triP: { mode: 'walk', text: 'side 1 + side 2 + side 3' },
    polyP: { mode: 'walk', text: 'number of sides × one side' },
    rectA: { mode: 'cover', text: 'length × breadth' },
    sqA: { mode: 'cover', text: 'side × side' },
    triA: { mode: 'cover', text: '½ × area of its rectangle' },
    left: { mode: 'cover', text: 'big area − small area' },
    split: { mode: 'cover', text: 'area of piece 1 + area of piece 2' },
    missRect: { mode: 'walk', text: '(perimeter ÷ 2) − breadth' },
    missTri: { mode: 'walk', text: 'perimeter − the two known sides' },
    missPoly: { mode: 'walk', text: 'perimeter ÷ number of sides' },
    areaBack: { mode: 'cover', text: 'area ÷ length' },
    cost: { mode: 'walk', text: 'perimeter × cost for one metre' },
    rounds: { mode: 'walk', text: 'perimeter × number of rounds' },
    trees: { mode: 'cover', text: 'area ÷ area for one tree' },
    grid: { mode: 'cover', text: 'full + more than half + (halves ÷ 2)' },
  };
  g.RULES = R;
  g.RULE_DISTRACT = {
    rectP: ['rectA', 'sqP'], sqP: ['sqA', 'rectP'], triP: ['triA', 'polyP'], polyP: ['sqA', 'triP'],
    rectA: ['rectP', 'sqA'], sqA: ['sqP', 'rectA'], triA: ['rectA', 'triP'], left: ['split', 'rectA'], split: ['left', 'rectA'],
    missRect: ['rectP', 'missPoly'], missTri: ['triP', 'missRect'], missPoly: ['polyP', 'missTri'], areaBack: ['rectA', 'left'],
    cost: ['rounds', 'rectP'], rounds: ['cost', 'rectP'], trees: ['areaBack', 'rectA'], grid: ['rectA', 'sqA'],
  };

  /* ---------- problem builders ---------- */
  const COVER_X = 'That multiplied. Multiplying is for covering (area). We are walking, so we add.';
  const WALK_X = 'That is the walk (perimeter). We are covering, so we multiply: rows of squares.';
  const sqU = (u) => 'sq ' + u;

  const rectP = (id, story, plain, l, b, u, o) => Object.assign({
    id, type: 'FENCE', mode: 'walk', story, plain, fig: { kind: 'rect', l, b, unit: u }, rule: 'rectP', unit: u,
    calc: [
      { label: 'length + breadth', expr: `${l} + ${b}`, ans: l + b, hints: { [l * b]: COVER_X } },
      { label: 'doubled (× 2)', expr: `${l + b} × 2`, ans: 2 * (l + b), hints: { [l + b]: 'That is half the walk. The same walk happens on the other side too. Double it.', [l * b]: COVER_X } },
    ],
  }, o);
  const sqP = (id, story, plain, s_, u, o) => Object.assign({
    id, type: 'FENCE', mode: 'walk', story, plain, fig: { kind: 'rect', l: s_, b: s_, unit: u }, rule: 'sqP', unit: u,
    calc: [{ label: '4 × side', expr: `4 × ${s_}`, ans: 4 * s_, operands: [4, s_], op: '×', hints: { [s_ * s_]: 'That multiplied the side by itself. That is cover. For the walk, a square has four sides: 4 × side.', [2 * s_]: 'That is only two sides. A square has four.' } }],
  }, o);
  const triP = (id, story, plain, a, b, c, u, o) => Object.assign({
    id, type: 'FENCE', mode: 'walk', story, plain, fig: { kind: 'tri', a, b, c, unit: u }, rule: 'triP', unit: u,
    calc: [{ label: 'side 1 + side 2 + side 3', expr: `${a} + ${b} + ${c}`, ans: a + b + c, operands: [a, b, c], op: '+', hints: { [a + b]: 'There are three sides. One side is missing from your sum.', [b + c]: 'There are three sides. One side is missing from your sum.', [a + c]: 'There are three sides. One side is missing from your sum.' } }],
  }, o);
  const polyP = (id, story, plain, n, s_, u, o) => Object.assign({
    id, type: 'FENCE', mode: 'walk', story, plain, fig: { kind: 'poly', n, s: s_, unit: u }, rule: 'polyP', unit: u,
    calc: [{ label: 'number of sides × one side', expr: `${n} × ${s_}`, ans: n * s_, operands: [n, s_], op: '×', hints: { [s_ * s_]: 'That multiplied the side by itself. Count the sides: how many sides does the shape have?', [n + s_]: 'That added. All sides are equal, so adding the same number again and again is multiplying.' } }],
  }, o);
  const rectA = (id, story, plain, l, b, u, o) => Object.assign({
    id, type: 'COVER', mode: 'cover', story, plain, fig: { kind: 'rect', l, b, unit: u, grid: Math.max(l, b) <= 12 }, rule: 'rectA', unit: sqU(u),
    calc: [{ label: 'length × breadth', expr: `${l} × ${b}`, ans: l * b, operands: [l, b], op: '×', hints: { [2 * (l + b)]: WALK_X, [l + b]: WALK_X } }],
  }, o);
  const sqA = (id, story, plain, s_, u, o) => Object.assign({
    id, type: 'COVER', mode: 'cover', story, plain, fig: { kind: 'rect', l: s_, b: s_, unit: u, grid: s_ <= 12 }, rule: 'sqA', unit: sqU(u),
    calc: [{ label: 'side × side', expr: `${s_} × ${s_}`, ans: s_ * s_, operands: [s_, s_], op: '×', hints: { [4 * s_]: WALK_X } }],
  }, o);
  const triA = (id, story, plain, fig, l, b, u, o) => Object.assign({
    id, type: 'COVER', mode: 'cover', story, plain, fig: Object.assign({ unit: u }, fig), rule: 'triA', unit: sqU(u),
    calc: [
      { label: 'area of the rectangle', expr: `${l} × ${b}`, ans: l * b, unit: sqU(u), hints: { [2 * (l + b)]: WALK_X } },
      { label: 'half of it (÷ 2)', expr: `${l * b} ÷ 2`, ans: l * b / 2, hints: { [l * b]: 'That is the whole rectangle. The triangle is only half of it.' } },
    ],
  }, o);
  const gridP = (id, key, story, o) => {
    const gi = gridInfo(key, 10, 8);
    return Object.assign({
      id, type: 'COVER', mode: 'cover', story, plain: `We need about how many squares the ${gi.name} covers.`, fig: { kind: 'grid', key }, rule: 'grid', unit: 'sq units',
      calc: [
        { label: 'full squares (each counts 1)', ans: gi.full, unit: 'squares' },
        { label: 'more than half (each counts 1)', ans: gi.more, unit: 'squares' },
        { label: 'exactly half: how many squares?', ans: gi.half, unit: 'squares' },
        { label: 'total = full + more than half + (halves ÷ 2)', expr: `${gi.full} + ${gi.more} + ${gi.half} ÷ 2`, ans: gi.total, hints: { [gi.full + gi.more + gi.half]: 'Two halves make one. Take the halves ÷ 2.', [gi.full]: 'That is only the full squares. Add the more-than-half squares and the halves.' } },
      ],
    }, o);
  };

  /* ---------- the ten sessions ---------- */
  const S = [];

  S.push({
    id: 1, icon: '🚶', title: 'Walk or Cover?', blurb: 'The keystone. Sort cards, walk, cover. No formulas.',
    story: ['Motu and Patlu are at the dinosaur park in Furfuri Nagar.', 'A baby dinosaur walks all the way around the edge of the park.', 'Then workers put grass over the whole inside.', 'Two different jobs. One is a walk. One is a cover.'],
    plain: 'Today we learn one question: do we walk it, or do we cover it?',
    hands: [{ t: 'walk' }, { t: 'cover' }, { t: 'sort', record: true }],
    drawing: [
      { fig: { kind: 'rect', l: 5, b: 3, unit: 'm', grid: true }, mode: 'cover' },
      { fig: { kind: 'tri', a: 3, b: 4, c: 5, unit: 'cm' }, mode: 'walk' },
    ],
    problems: [],
    wrong: { text: 'Patlu put "tiles for the floor" in the WALK tray.', working: 'Tiles → WALK', q: 'What is the broken rule?', options: ['Tiles cover the inside. They go in COVER.', 'Tiles go in WALK because tiles are on the edge.', 'Patlu is right.'], right: 0 },
    closing: 'If we walk it, it is perimeter. If we cover it, it is area.',
    teach: 'Show the dinosaur toy: what is a walk? What is a cover?',
    need: 3,
  });

  S.push({
    id: 2, icon: '🧵', title: 'Perimeter of a rectangle', blurb: 'String around Chaiwala\'s tablecloth and the dinosaur park fence.',
    story: ["Chaiwala has a rectangular tablecloth.", 'He wants lace all around the edge.', 'The Triceratops park is also a rectangle. It needs a fence all around.', 'Same maths, new story.'],
    plain: 'Today: how long is the walk around a rectangle?',
    hands: [{ t: 'tick', fig: { kind: 'rect', l: 12, b: 8, unit: 'cm' }, mode: 'rect' }],
    drawing: [{ fig: { kind: 'rect', l: 12, b: 8, unit: 'cm' }, mode: 'walk' }, { fig: { kind: 'rect', l: 3, b: 2, unit: 'm' }, mode: 'walk' }],
    problems: [
      rectP('s2a', "Chaiwala's tablecloth is 3 m long and 2 m wide. Lace goes all around it.", 'We need the lace for a 3 by 2 tablecloth.', 3, 2, 'm'),
      rectP('s2b', 'The Triceratops park is 12 m long and 8 m wide. How much fence does it need?', 'We need the fence for a 12 by 8 park.', 12, 8, 'm'),
      rectP('s2c', "Ghasitaram puts a fence around his vegetable patch. It is 9 m long and 4 m wide.", 'We need the fence for a 9 by 4 patch.', 9, 4, 'm'),
      rectP('s2d', 'A Triceratops enclosure is 14 m long and 9 m wide. How much fence is needed?', 'We need the fence for a 14 by 9 enclosure.', 14, 9, 'm'),
      rectP('s2e', "Dr. Jhatka puts tape all around his photo. The photo is 10 cm long and 6 cm wide.", 'We need the tape for a 10 by 6 photo.', 10, 6, 'cm'),
    ],
    wrong: { text: 'Patlu found the perimeter of a 12 cm by 8 cm rectangle.', working: '12 + 8 = 20 cm', q: 'What did Patlu forget?', options: ['He forgot to double. 12 + 8 is only half the walk.', 'He should have multiplied 12 × 8.', 'Patlu is right.'], right: 0 },
    closing: 'Perimeter means walk all the way around. Rectangle: add length and breadth, then double it.',
    teach: 'Teach the dinosaur: how do we find a fence length for a rectangle?',
    need: 3,
  });

  S.push({
    id: 3, icon: '🖼️', title: 'Perimeter of a square', blurb: "Tape around Dr. Jhatka's square frame. One side does all the work.",
    story: ["Dr. Jhatka has a square photo frame.", 'He puts tape all around it.', 'All four sides are the same.', 'Adding the same number four times is the same as times 4.'],
    plain: 'Today: how long is the walk around a square?',
    hands: [{ t: 'tick', fig: { kind: 'rect', l: 1, b: 1, unit: 'm' }, mode: 'square' }],
    drawing: [{ fig: { kind: 'rect', l: 5, b: 5, unit: 'cm' }, mode: 'walk' }],
    problems: [
      sqP('s3a', "Dr. Jhatka puts tape around a square photo frame. One side is 1 m.", 'We need the tape for a frame with side 1 m.', 1, 'm'),
      sqP('s3b', "Motu wants lace all around Chaiwala's square tray. One side is 5 cm.", 'We need the lace for a square tray with side 5 cm.', 5, 'cm'),
      sqP('s3c', 'A baby Stegosaurus walks once around its square pen. One side is 6 m. How far does it walk?', 'We need the walk around a square pen with side 6 m.', 6, 'm'),
      sqP('s3d', 'Inspector Chingam runs one round of a square park. One side is 75 m. How far does he run?', 'We need one round of a square park with side 75 m.', 75, 'm'),
      sqP('s3e', 'A square Brachiosaurus paddock has side 11 m. How much fence does it need?', 'We need the fence for a square paddock with side 11 m.', 11, 'm'),
    ],
    wrong: { text: 'Patlu found the perimeter of a square with side 5 cm.', working: '5 × 5 = 25 cm', q: 'What is the broken rule?', options: ['He multiplied the side by itself. That is cover. A walk is 4 × side = 20 cm.', 'He should have added 5 + 5 only.', 'Patlu is right.'], right: 0 },
    closing: 'A square has four equal sides. Perimeter is 4 times one side.',
    teach: 'Teach the dinosaur: why do we multiply by 4 for a square?',
    need: 3,
  });

  S.push({
    id: 4, icon: '🥟', title: 'Perimeter of a triangle', blurb: 'A samosa is a triangle. Three sides, add them all.',
    story: ['Patlu looks at a samosa from the side.', 'It is a triangle. A triangle has three sides.', 'A triangular road sign and a triangular dinosaur enclosure are the same.', 'Point, write, tick. Point, write, tick.'],
    plain: 'Today: how long is the walk around a triangle?',
    hands: [{ t: 'tick', fig: { kind: 'tri', a: 4, b: 5, c: 7, unit: 'cm' }, mode: 'tri' }],
    drawing: [{ fig: { kind: 'tri', a: 4, b: 5, c: 7, unit: 'cm' }, mode: 'walk' }, { fig: { kind: 'tri', a: 3, b: 4, c: 5, unit: 'cm' }, mode: 'walk' }],
    problems: [
      triP('s4a', 'Patlu puts a border all around a triangular samosa sign. Its sides are 3 cm, 4 cm and 5 cm.', 'We need the walk around a triangle with sides 3, 4 and 5.', 4, 3, 5, 'cm'),
      triP('s4b', 'A triangular dinosaur enclosure has sides 6 m, 8 m and 9 m. How much fence does it need?', 'We need the fence for a triangle with sides 6, 8 and 9.', 6, 8, 9, 'm', { fig: { kind: 'tri', a: 6, b: 8, c: 9, unit: 'm' } }),
      triP('s4c', 'A triangular road sign has sides 5 cm, 12 cm and 13 cm. How long is the border?', 'We need the border of a triangle with sides 5, 12 and 13.', 5, 12, 13, 'cm', { fig: { kind: 'tri', a: 5, b: 12, c: 13, unit: 'cm' } }),
      {
        id: 's4d', type: 'MISSING', mode: 'walk', story: 'A triangle has perimeter 55 cm. Two sides are 20 cm and 14 cm. How long is the third side?',
        plain: 'We know the whole walk. We know two sides. The missing side is what is left.',
        fig: { kind: 'tri', a: 20, b: 14, c: 21, unit: 'cm', labels: ['?', '14 cm', '20 cm'] }, note: 'The whole walk (perimeter) = 55 cm', rule: 'missTri', unit: 'cm',
        calc: [
          { label: 'the two known sides added', expr: '20 + 14', ans: 34 },
          { label: 'perimeter − the two known sides', expr: '55 − 34', ans: 21, hints: { 89: 'We know the whole walk. The missing side is what is left, so we take away.', 55: 'That is the whole walk. Take away the two known sides.' } },
        ],
      },
      triP('s4e', 'A triangular flower bed has sides 7 m, 8 m and 10 m. Lace goes all around it.', 'We need the lace for a triangle with sides 7, 8 and 10.', 7, 8, 10, 'm', { fig: { kind: 'tri', a: 7, b: 8, c: 10, unit: 'm' } }),
    ],
    wrong: { text: 'Patlu found the perimeter of a triangle with sides 4 cm, 5 cm and 7 cm.', working: '4 + 5 = 9 cm', q: 'What did Patlu forget?', options: ['He left out a side. A triangle has three sides: 4 + 5 + 7 = 16 cm.', 'He should have multiplied.', 'Patlu is right.'], right: 0 },
    closing: 'Triangle: add all three sides. Point, write, tick.',
    teach: 'Teach the dinosaur: how do we walk around a triangle?',
    need: 3,
  });

  S.push({
    id: 5, icon: '🔄', title: 'Regular shapes, rounds and cost', blurb: 'Equal sides, extra rounds, and the cost of fencing.',
    story: ['Some dinosaur enclosures have equal sides and equal angles.', 'A shape like that is called regular.', 'Sometimes Inspector Chingam walks three rounds, not one.', 'And a fence costs money for every metre.', 'Perimeter first. Then rounds or cost.'],
    plain: 'Today: regular shapes, then rounds and cost. Perimeter always comes first.',
    hands: [{ t: 'string' }],
    drawing: [{ fig: { kind: 'poly', n: 5, s: 8, unit: 'm' }, mode: 'walk' }, { fig: { kind: 'poly', n: 6, s: 6, unit: 'm' }, mode: 'walk' }],
    problems: [
      polyP('s5a', 'A regular pentagon dinosaur enclosure has all sides 8 m. How much fence does it need?', 'We need the fence for 5 equal sides of 8 m.', 5, 8, 'm'),
      polyP('s5b', 'A regular hexagon enclosure has all sides 6 m. How much fence does it need?', 'We need the fence for 6 equal sides of 6 m.', 6, 6, 'm'),
      {
        id: 's5c', type: 'COST', mode: 'walk', story: "John's rectangular hideout plot is 150 m long and 120 m wide. Fencing costs Rs 40 per metre. What is the total cost?",
        plain: 'We need the cost of a fence for a 150 by 120 plot at Rs 40 for each metre.',
        fig: { kind: 'rect', l: 150, b: 120, unit: 'm' }, rule: 'cost', unit: 'Rs', checkText: 'The cost came from the fence. Fence is a walk or a cover?',
        calc: [
          { label: 'length + breadth', expr: '150 + 120', ans: 270, unit: 'm' },
          { label: 'doubled (× 2): the perimeter', expr: '270 × 2', ans: 540, unit: 'm', hints: { 270: 'That is half the walk. Double it.' } },
          { label: 'perimeter × Rs 40 for one metre', expr: '540 × 40', ans: 21600, unit: 'Rs', hints: { 540: 'That is the perimeter. Now multiply by the cost for one metre.' } },
        ],
      },
      {
        id: 's5d', type: 'COST', mode: 'walk', story: "A farmer's field is 230 m long and 160 m wide. He fences it with 3 rounds of rope. How much rope does he need in total?",
        plain: 'We need the rope for 3 rounds of a 230 by 160 field.',
        fig: { kind: 'rect', l: 230, b: 160, unit: 'm' }, rule: 'rounds', unit: 'm',
        calc: [
          { label: 'length + breadth', expr: '230 + 160', ans: 390 },
          { label: 'doubled (× 2): one round', expr: '390 × 2', ans: 780, hints: { 390: 'That is half the walk. Double it.' } },
          { label: 'one round × 3 rounds', expr: '780 × 3', ans: 2340, hints: { 780: 'That is one round. The farmer walks 3 rounds.' } },
        ],
      },
      {
        id: 's5e', type: 'MISSING', mode: 'walk', story: 'A 36 cm string is bent into a regular hexagon with all sides equal. How long is each side?',
        plain: 'The whole walk is 36 cm. A hexagon has 6 equal sides. How long is one side?',
        fig: { kind: 'poly', n: 6, s: 6, unit: 'cm', labels: ['?', '?', '?', '?', '?', '?'] }, note: 'The string (perimeter) = 36 cm', rule: 'missPoly', unit: 'cm',
        calc: [{ label: 'perimeter ÷ number of sides', expr: '36 ÷ 6', ans: 6, operands: [36, 6], op: '÷', hints: { 216: 'That multiplied. We know the whole walk. To find one side we share it: divide.' } }],
      },
      {
        id: 's5f', type: 'MISSING', mode: 'walk', story: 'A rectangle has perimeter 14 cm. Its breadth is 2 cm. How long is its length?',
        plain: 'We know the whole walk and the breadth. The length is what is left.',
        fig: { kind: 'rect', l: 5, b: 2, unit: 'cm', labels: ['?', '2 cm', '?', '2 cm'] }, note: 'The whole walk (perimeter) = 14 cm', rule: 'missRect', unit: 'cm',
        calc: [
          { label: 'half the walk (perimeter ÷ 2)', expr: '14 ÷ 2', ans: 7, hints: { 28: 'That doubled. We know the whole walk, so we halve it.' } },
          { label: 'half the walk − breadth', expr: '7 − 2', ans: 5, hints: { 7: 'That is half the walk: length + breadth. Take away the breadth.' } },
        ],
      },
    ],
    wrong: { text: "Patlu found the cost of fencing a 150 m by 120 m plot at Rs 40 per metre.", working: '2 × (150 + 120) = 540. Cost = Rs 540', q: 'What did Patlu forget?', options: ['He stopped at the perimeter. Cost needs another step: 540 × 40.', 'The perimeter is wrong.', 'Patlu is right.'], right: 0 },
    closing: 'Regular shape: number of sides times one side. Perimeter first. Then rounds, or cost.',
    teach: 'Teach the dinosaur: what is a regular shape? What do we do for three rounds?',
    need: 3,
  });

  S.push({
    id: 6, icon: '🟫', title: 'Area of a rectangle and a square', blurb: 'Tile the dinosaur hall with squares. Rows times columns.',
    story: ["The dinosaur hall needs a new rug.", 'The rug is made of small squares.', 'Length tells us how many squares in one row. Breadth tells us how many rows.', 'We count squares, so the answer says squares: sq cm or sq m.'],
    plain: 'Today: how many squares cover the inside?',
    hands: [{ t: 'tile', l: 5, b: 4 }],
    drawing: [{ fig: { kind: 'rect', l: 5, b: 3, unit: 'm', grid: true }, mode: 'cover' }, { fig: { kind: 'rect', l: 4, b: 4, unit: 'cm', grid: true }, mode: 'cover' }],
    problems: [
      rectA('s6a', 'The dinosaur hall rug is 5 m long and 3 m wide. What is its area?', 'We need the area of a 5 by 3 rug.', 5, 3, 'm'),
      rectA('s6b', "Dr. Jhatka's rectangular photo is 10 cm long and 6 cm wide. What is the area of the photo?", 'We need the area of a 10 by 6 photo.', 10, 6, 'cm'),
      sqA('s6c', 'A square dinosaur sticker has side 4 cm. What is its area?', 'We need the area of a square with side 4.', 4, 'cm'),
      rectA('s6d', 'A Triceratops enclosure is 14 m long and 9 m wide. How much grass covers the inside?', 'We need the grass for a 14 by 9 enclosure.', 14, 9, 'm'),
      sqA('s6e', 'A square Brachiosaurus paddock has side 11 m. How much land is in the paddock?', 'We need the land in a square with side 11.', 11, 'm'),
    ],
    wrong: { text: 'Patlu found the area of a rug 5 m long and 3 m wide.', working: '2 × (5 + 3) = 16 m', q: 'What is the broken rule?', options: ['He walked the edge. Area covers: 5 × 3 = 15 sq m.', 'He should add 5 + 3.', 'Patlu is right.'], right: 0 },
    closing: 'Area means cover. Length is squares in a row. Breadth is rows. Multiply.',
    teach: 'Teach the dinosaur: why is area in square units?',
    need: 3,
  });

  S.push({
    id: 7, icon: '🧩', title: 'Left over, and odd shapes', blurb: 'Floor minus carpet. Cut an L-shape into rectangles.',
    story: ['A floor is 5 m long and 4 m wide.', 'A square carpet covers part of the floor.', 'How much floor has no carpet? That is the part left over.', 'An L-shaped hall is odd. Draw ONE line and it becomes two rectangles.'],
    plain: 'Today: the part left over, and cutting an odd shape.',
    hands: [{ t: 'split' }],
    drawing: [
      { fig: { kind: 'floor', l: 5, b: 4, c: 3, unit: 'm', grid: true }, mode: 'cover' },
      { fig: { kind: 'lshape', pts: [[0, 0], [2, 0], [2, 2], [6, 2], [6, 6], [0, 6]], unit: 'm' }, mode: 'cover' },
    ],
    problems: [
      {
        id: 's7a', type: 'LEFT', mode: 'cover', story: 'A floor is 5 m long and 4 m wide. A square carpet of side 3 m is placed on it. How much floor is not carpeted?',
        plain: 'We need the floor that has no carpet.', fig: { kind: 'floor', l: 5, b: 4, c: 3, unit: 'm', grid: true }, rule: 'left', unit: 'sq m',
        calc: [
          { label: 'BIG area first: the floor', expr: '5 × 4', ans: 20 },
          { label: 'SMALL area second: the carpet', expr: '3 × 3', ans: 9 },
          { label: 'big area − small area', expr: '20 − 9', ans: 11, hints: { 29: 'That added. Left over means take away: big − small.', 9: 'That is only the carpet. Take it away from the floor.' } },
        ],
      },
      {
        id: 's7b', type: 'COVER', mode: 'cover', story: "Patlu's dinosaur hall is shaped like an L. One line cuts it into two rectangles. How much floor does the hall have?",
        plain: 'We need the area of the L-shaped hall: piece 1 plus piece 2.',
        fig: { kind: 'lshape', pts: [[0, 0], [2, 0], [2, 2], [6, 2], [6, 6], [0, 6]], cut: [[2, 2], [2, 6]], unit: 'm' }, rule: 'split', unit: 'sq m',
        calc: [
          { label: 'piece 1 (left): 2 × 6', expr: '2 × 6', ans: 12 },
          { label: 'piece 2 (right): 4 × 4', expr: '4 × 4', ans: 16 },
          { label: 'piece 1 + piece 2', expr: '12 + 16', ans: 28, hints: { 192: 'That multiplied the pieces. The pieces sit side by side. Add them.' } },
        ],
      },
      {
        id: 's7c', type: 'COVER', mode: 'cover', story: 'A step-shaped patio is made of two rectangles. One line is drawn. How much area does the patio have?',
        plain: 'We need the area of the step-shaped patio: piece 1 plus piece 2.',
        fig: { kind: 'lshape', pts: [[0, 0], [1, 0], [1, 3], [3, 3], [3, 5], [0, 5]], cut: [[1, 3], [1, 5]], unit: 'm' }, rule: 'split', unit: 'sq m',
        calc: [
          { label: 'piece 1 (left): 1 × 5', expr: '1 × 5', ans: 5 },
          { label: 'piece 2 (right): 2 × 2', expr: '2 × 2', ans: 4 },
          { label: 'piece 1 + piece 2', expr: '5 + 4', ans: 9 },
        ],
      },
      {
        id: 's7d', type: 'MISSING', mode: 'cover', story: 'A rectangular garden is 25 m long. Its area is 300 sq m. What is its width?',
        plain: 'We know the whole cover and the length. The width is what is left.',
        fig: { kind: 'rect', l: 25, b: 12, unit: 'm', labels: ['25 m', null, null, '?'] }, note: 'The whole cover (area) = 300 sq m', rule: 'areaBack', unit: 'm',
        calc: [{ label: 'area ÷ length', expr: '300 ÷ 25', ans: 12, operands: [300, 25], op: '÷', hints: { 7500: 'That multiplied. We know the whole cover. To find one side, divide.' } }],
      },
      {
        id: 's7e', type: 'LEFT', mode: 'cover', story: 'A plot of land is 12 m long and 10 m wide. Four square flower beds, each 4 m by 4 m, are in it. How much land is left?',
        plain: 'We need the land left after the four flower beds.', fig: { kind: 'plot', l: 12, b: 10, bed: 4, unit: 'm' }, rule: 'left', unit: 'sq m',
        calc: [
          { label: 'BIG area first: the plot', expr: '12 × 10', ans: 120 },
          { label: 'area of one bed', expr: '4 × 4', ans: 16, unit: 'sq m' },
          { label: 'area of 4 beds', expr: '4 × 16', ans: 64 },
          { label: 'big area − small areas', expr: '120 − 64', ans: 56, hints: { 184: 'That added. Left over means take away.', 64: 'That is the beds. Take them away from the plot.' } },
        ],
      },
      {
        id: 's7f', type: 'COST', mode: 'cover', story: 'A coconut grove is 100 m long and 50 m wide. Each tree needs 25 sq m. How many trees fit?',
        plain: 'We need how many trees fit in the grove.', fig: { kind: 'rect', l: 100, b: 50, unit: 'm' }, rule: 'trees', unit: 'trees', cue: 'sq m', checkText: 'The tree count came from the area. Area is a walk or a cover?',
        calc: [
          { label: 'area of the grove', expr: '100 × 50', ans: 5000, unit: 'sq m' },
          { label: 'area ÷ area for one tree', expr: '5000 ÷ 25', ans: 200, unit: 'trees', hints: { 125000: 'That multiplied. We share the area between trees: divide.' } },
        ],
      },
    ],
    wrong: { text: 'Patlu found the floor with no carpet. The floor is 5 m by 4 m. The carpet is 3 m by 3 m.', working: '20 + 9 = 29 sq m', q: 'What is the broken rule?', options: ['He added. Left over is BIG − SMALL: 20 − 9 = 11 sq m.', 'He should have used only the carpet.', 'Patlu is right.'], right: 0 },
    closing: 'Left over: big area first, small area second, then take away. Odd shape: cut it into rectangles and add.',
    teach: 'Teach the dinosaur: what do we do with an L-shape?',
    need: 3,
  });

  S.push({
    id: 8, icon: '🦶', title: 'Area on squared paper', blurb: 'Trace a footprint. Full, more than half, less than half, half.',
    story: ['A dinosaur left a footprint in the clay.', 'We trace it on squared paper.', 'The edge goes through some squares. We use four fixed rules for them.', 'Here the answer is allowed to be about. That is the one exception.'],
    plain: 'Today: about how many squares does a curvy shape cover?',
    hands: [{ t: 'gridrules' }],
    drawing: [{ fig: { kind: 'grid', key: 'leaf' }, mode: 'cover' }],
    problems: [
      gridP('s8a', 'foot', 'A dinosaur left a footprint in wet clay. It is traced on squared paper. Each square is 1 sq cm. About how much area is the footprint?'),
      gridP('s8b', 'leaf', 'Patlu traced a leaf on squared paper. Each square is 1 sq cm. About how much area is the leaf?'),
      gridP('s8c', 'egg', 'Motu traced a dinosaur egg on squared paper. Each square is 1 sq cm. About how much area is the egg?'),
      gridP('s8d', 'fish', "Chaiwala's fish card is traced on squared paper. Each square is 1 sq cm. About how much area is the fish?"),
    ],
    wrong: { text: 'Patlu counted every square the leaf touched as 1.', working: 'touched = 1', q: 'What is the broken rule?', options: ['Less than half counts 0. Only full and more than half count 1.', 'Full squares should count 2.', 'Patlu is right.'], right: 0 },
    closing: 'On squared paper: full is 1. More than half is 1. Less than half is 0. Exactly half is one half.',
    teach: 'Teach the dinosaur: what are the four rules for squares on the edge?',
    need: 2,
  });

  S.push({
    id: 9, icon: '📐', title: 'Area of a triangle', blurb: 'Cut a rectangle on its diagonal. Each triangle is exactly half.',
    story: ['Patlu has a paper rectangle.', 'He draws a line from one corner to the opposite corner. This line is a diagonal.', 'He cuts along it. Two triangles.', 'Put one on top of the other. They match.'],
    plain: 'Today: how much area does a triangle cover?',
    hands: [{ t: 'tricut' }, { t: 'apex' }],
    drawing: [{ fig: { kind: 'rectTri', l: 8, b: 6, unit: 'cm' }, mode: 'cover' }, { fig: { kind: 'triApex', l: 10, b: 6, apex: 0.3, unit: 'cm' }, mode: 'cover' }],
    problems: [
      triA('s9a', 'A rectangular paper is 8 cm long and 6 cm wide. It is cut in half along its diagonal. What is the area of each triangle?', 'We need the area of each triangle: half of the 8 by 6 rectangle.', { kind: 'rectTri', l: 8, b: 6 }, 8, 6, 'cm'),
      triA('s9b', 'A square paper is 4 cm by 4 cm. It is cut along its diagonal. What is the area of each triangle?', 'We need the area of each triangle: half of the 4 by 4 square.', { kind: 'rectTri', l: 4, b: 4 }, 4, 4, 'cm'),
      triA('s9c', 'A triangular sail has a base of 10 cm and a height of 6 cm. What is its area?', 'We need the area of a triangle in a 10 by 6 rectangle.', { kind: 'triApex', l: 10, b: 6, apex: 0.3 }, 10, 6, 'cm'),
      triA('s9d', 'A triangular flag has a base of 14 cm and a height of 5 cm. What is its area?', 'We need the area of a triangle in a 14 by 5 rectangle.', { kind: 'triApex', l: 14, b: 5, apex: 0.72 }, 14, 5, 'cm'),
      triA('s9e', 'A triangular dinosaur warning sign has a base of 6 m and a height of 8 m. What is its area?', 'We need the area of a triangle in a 6 by 8 rectangle.', { kind: 'triApex', l: 6, b: 8, apex: 0.5 }, 6, 8, 'm'),
    ],
    wrong: { text: 'Patlu found the area of one triangle cut from an 8 cm by 6 cm rectangle.', working: '8 × 6 = 48 sq cm', q: 'What did Patlu forget?', options: ['He forgot to halve. The triangle is only half of the rectangle: 24 sq cm.', 'He should have added 8 + 6.', 'Patlu is right.'], right: 0 },
    closing: 'A triangle is half of its rectangle.',
    teach: 'Teach the dinosaur: why is a triangle half of a rectangle?',
    need: 3,
  });

  const rect24 = (id, l, b, p) => rectP(id, `A rectangle covers 24 sq units. It is ${l} by ${b}. What is its perimeter?`, `The cover is always 24. We need the walk around a ${l} by ${b} rectangle.`, l, b, 'units', { fig: { kind: 'rect', l, b, unit: 'units', grid: Math.max(l, b) <= 12 } });
  S.push({
    id: 10, icon: '🏠', title: 'Same cover, different walk', blurb: '9 squares challenge, and a house plan used like a map.',
    story: ['Motu has 9 squares.', 'He can build many shapes with them.', 'The inside is always 9 squares.', 'But does the walk around the edge stay the same? Let us find out.'],
    plain: 'Today is a discovery game: cover can stay the same while the walk changes.',
    hands: [{ t: 'nine' }, { t: 'plan' }],
    drawing: [{ fig: { kind: 'rect', l: 3, b: 3, unit: 'units', grid: true }, mode: 'walk' }, { fig: { kind: 'rect', l: 3, b: 3, unit: 'units', grid: true }, mode: 'cover' }],
    problems: [
      sqP('s10a', 'Motu builds a 3 by 3 block from 9 squares. What is the perimeter of the block?', 'We need the walk around a 3 by 3 block.', 3, 'units', { fig: { kind: 'rect', l: 3, b: 3, unit: 'units', grid: true } }),
      rectP('s10b', 'Now Motu builds a 1 by 9 line from the same 9 squares. What is the perimeter of the line?', 'We need the walk around a 1 by 9 line.', 1, 9, 'units', { fig: { kind: 'rect', l: 1, b: 9, unit: 'units', grid: true } }),
      rect24('s10c', 4, 6), rect24('s10d', 3, 8), rect24('s10e', 2, 12), rect24('s10f', 1, 24),
    ],
    wrong: { text: 'Patlu compared a 3 by 3 block and a 1 by 9 line, both made of 9 squares. The line has the longer walk (20 and 12).', working: 'Longer walk, so bigger area', q: 'What is the broken rule?', options: ['Both shapes have the same area, 9 squares. Cover stayed the same. Only the walk got longer.', 'The line has the bigger area.', 'Patlu is right.'], right: 0 },
    closing: 'The inside did not change. The walk changed. Cover stayed the same. Walk got longer. Both can be true.',
    teach: 'Teach the dinosaur: why can two shapes have the same cover and a different walk?',
    need: 3,
  });

  /* levels: 1 worked, 1 together, rest alone */
  S.forEach((sess) => sess.problems.forEach((p, i) => { p.level = i === 0 ? 'worked' : i === 1 ? 'together' : 'alone'; }));

  g.SESSIONS = S;
})(window);
