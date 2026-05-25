// Source-derived data for the editor UI kit.
// Subsets of the arrays defined in _source/editor.html.

window.PC_COLORS = [
  '#e74c3c', '#e67e22', '#f1c40f', '#a8b820',
  '#27ae60', '#16a085', '#2980b9', '#6c5ce7',
  '#a855f7', '#e91e8c', '#c0392b', '#795548',
];

window.PC_NAMES   = ['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
window.SHARP_NAMES= ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];

window.CHORD_TYPES = {
  'Major':    [0, 4, 7],
  'Minor':    [0, 3, 7],
  'Dim':      [0, 3, 6],
  'Aug':      [0, 4, 8],
  'Sus2':     [0, 2, 7],
  'Sus4':     [0, 5, 7],
  'Maj7':     [0, 4, 7, 11],
  'Min7':     [0, 3, 7, 10],
  'Dom7':     [0, 4, 7, 10],
  'Dim7':     [0, 3, 6,  9],
  'HalfDim7': [0, 3, 6, 10],
  'MinMaj7':  [0, 3, 7, 11],
};

window.CHORD_SYMBOLS = {
  'Major':    '△',
  'Minor':    '−',
  'Dim':      '°',
  'Aug':      '+',
  'Sus2':     'sus²',
  'Sus4':     'sus⁴',
  'Maj7':     '△⁷',
  'Min7':     '−⁷',
  'Dom7':     '⁷',
  'Dim7':     '°⁷',
  'HalfDim7': 'ø⁷',
  'MinMaj7':  '−△⁷',
};

window.MOODS = [
  { id: 'happy',    label: 'Happy',       icon: '☀' },
  { id: 'sad',      label: 'Melancholic', icon: '♩' },
  { id: 'jazz',     label: 'Jazz',        icon: '♪' },
  { id: 'epic',     label: 'Epic',        icon: '⚡' },
  { id: 'dark',     label: 'Dark',        icon: '◆' },
  { id: 'peaceful', label: 'Peaceful',    icon: '◌' },
];

window.PROGRESSIONS = [
  { name:'Classic Major',      moods:['happy'],           chords:[{s:0,t:'Major'},{s:5,t:'Major'},{s:7,t:'Major'},{s:0,t:'Major'}] },
  { name:'Pop Anthem',         moods:['happy','epic'],    chords:[{s:0,t:'Major'},{s:7,t:'Major'},{s:9,t:'Minor'},{s:5,t:'Major'}] },
  { name:'50s Doo-Wop',        moods:['happy'],           chords:[{s:0,t:'Major'},{s:9,t:'Minor'},{s:5,t:'Major'},{s:7,t:'Major'}] },
  { name:'Aeolian Loop',       moods:['sad'],             chords:[{s:0,t:'Minor'},{s:10,t:'Major'},{s:8,t:'Major'},{s:10,t:'Major'}] },
  { name:'Harmonic Minor',     moods:['sad','dark'],      chords:[{s:0,t:'Minor'},{s:5,t:'Minor'},{s:7,t:'Major'},{s:0,t:'Minor'}] },
  { name:'Andalusian Descent', moods:['sad','dark'],      chords:[{s:0,t:'Minor'},{s:10,t:'Major'},{s:8,t:'Major'},{s:7,t:'Major'}] },
  { name:'ii–V–I',             moods:['jazz'],            chords:[{s:2,t:'Min7'},{s:7,t:'Dom7'},{s:0,t:'Maj7'}] },
  { name:'Rhythm Changes',     moods:['jazz'],            chords:[{s:0,t:'Maj7'},{s:9,t:'Min7'},{s:2,t:'Min7'},{s:7,t:'Dom7'}] },
  { name:'Bossa Groove',       moods:['jazz','peaceful'], chords:[{s:0,t:'Maj7'},{s:5,t:'Maj7'},{s:2,t:'Min7'},{s:7,t:'Dom7'}] },
  { name:'Cinematic Minor',    moods:['epic','sad'],      chords:[{s:0,t:'Minor'},{s:8,t:'Major'},{s:3,t:'Major'},{s:10,t:'Major'}] },
  { name:'Mixolydian Rock',    moods:['epic','happy'],    chords:[{s:0,t:'Major'},{s:7,t:'Major'},{s:10,t:'Major'},{s:5,t:'Major'}] },
  { name:'Phrygian Gate',      moods:['dark'],            chords:[{s:0,t:'Minor'},{s:1,t:'Major'},{s:10,t:'Major'},{s:0,t:'Minor'}] },
  { name:'Dim Tension',        moods:['dark'],            chords:[{s:0,t:'Minor'},{s:2,t:'Dim'},{s:7,t:'Major'},{s:0,t:'Minor'}] },
  { name:'Ascending Steps',    moods:['peaceful'],        chords:[{s:0,t:'Major'},{s:2,t:'Minor'},{s:4,t:'Minor'},{s:5,t:'Major'}] },
  { name:'Simple Loop',        moods:['peaceful','happy'],chords:[{s:0,t:'Major'},{s:5,t:'Major'},{s:0,t:'Major'},{s:7,t:'Major'}] },
];

// Function classification (T/S/D) for an interval in major key.
// Quick heuristic: 0/9 = T, 5/2 = S, 7/11 = D, fallback T.
window.fnFor = function(s) {
  if (s === 0 || s === 9 || s === 4)  return 'T';
  if (s === 5 || s === 2)             return 'S';
  if (s === 7 || s === 11 || s === 10 || s === 1) return 'D';
  return 'T';
};

window.ROMAN_FOR = function(s, type) {
  const minor = /Minor|Min7|Dim|HalfDim7|MinMaj7|Min6/.test(type);
  const base = {0:'I',1:'♭II',2:'ii',3:'♭III',4:'iii',5:'IV',6:'♭V',7:'V',8:'♭VI',9:'vi',10:'♭VII',11:'vii'}[s] || '?';
  return minor ? base.toLowerCase() : base;
};

window.RHYTHM_CATS = [
  { id: 'all',          label: 'All'            },
  { id: 'arabic',       label: 'Arabic/Turkish' },
  { id: 'persian',      label: 'Persian'        },
  { id: 'greek',        label: 'Greek'          },
  { id: 'flamenco',     label: 'Flamenco'       },
  { id: 'brazilian',    label: 'Brazilian'      },
  { id: 'odd',          label: 'Odd Metre'      },
  { id: 'poly',         label: 'Polyrhythm'     },
];

window.RHYTHM_PATTERNS = [
  { id: 'maqsoum',   cat: 'arabic',   title: 'Maqsoum',         time:'4/4', tempo: 90,  tuning:'D Kurd',
    R: ['D','-','T','-','D','-','T','-'], L: ['•','T','•','T','•','T','•','T'] },
  { id: 'baladi',    cat: 'arabic',   title: 'Baladi',          time:'4/4', tempo: 96,  tuning:'D Kurd',
    R: ['D','D','-','T','-','-','T','-'], L: ['•','•','T','•','T','T','•','T'] },
  { id: 'chiftetelli',cat: 'arabic',  title: 'Chiftetelli',     time:'8/4', tempo: 80,  tuning:'D Kurd',
    R: ['D','-','-','-','D','-','-','-'], L: ['•','T','T','•','•','T','T','•'] },
  { id: 'kalamatianos', cat: 'greek', title: 'Kalamatianos',    time:'7/8', tempo: 110, tuning:'D Kurd',
    R: ['D','-','-','T','-','T','-'],     L: ['•','T','•','•','T','•','T'] },
  { id: 'zorba',     cat: 'greek',    title: 'Hasapiko',        time:'4/4', tempo: 130, tuning:'D Kurd',
    R: ['D','-','T','-','D','-','T','-'], L: ['T','•','T','•','T','•','T','•'] },
  { id: 'chacarera', cat: 'flamenco', title: 'Bulería',         time:'12/8',tempo: 200, tuning:'D Kurd',
    R: ['D','-','T','-','T','-','D','-','T','-','T','-'],
    L: ['•','T','•','T','•','T','•','T','•','T','•','T'] },
  { id: 'bossa',     cat: 'brazilian',title: 'Bossa Nova',      time:'4/4', tempo: 80,  tuning:'D Kurd',
    R: ['D','-','-','T','-','-','D','-'], L: ['•','T','•','•','T','•','•','T'] },
  { id: 'samba',     cat: 'brazilian',title: 'Samba',           time:'4/4', tempo: 104, tuning:'D Kurd',
    R: ['D','-','T','D','-','T','D','-'], L: ['•','T','•','•','T','•','•','T'] },
  { id: 'shesh',     cat: 'odd',      title: 'Shesh (6/8)',     time:'6/8', tempo: 90,  tuning:'D Kurd',
    R: ['D','-','-','T','-','-'],         L: ['•','T','•','•','T','•'] },
  { id: 'cinq',      cat: 'odd',      title: 'Five (5/4)',      time:'5/4', tempo: 100, tuning:'D Kurd',
    R: ['D','-','T','-','T','-','D','-','T','-'], L: ['•','T','•','T','•','T','•','T','•','T'] },
  { id: 'persian',   cat: 'persian',  title: 'Reng',            time:'6/8', tempo: 84,  tuning:'D Kurd',
    R: ['D','-','-','T','T','-'],         L: ['•','T','T','•','•','T'] },
  { id: 'three-two', cat: 'poly',     title: '3 over 2',        time:'4/4', tempo: 80,  tuning:'D Kurd',
    R: ['D','-','-','-','D','-','-','-','D','-','-','-'],
    L: ['D','-','•','D','-','•','D','-','•','D','-','•'] },
];

// Templates are tiny — one polished default and two alternates.
window.TEMPLATES = [
  {
    name: 'D3 Kurd 18',
    pan: { cx: 500, cy: 500, r: 324 },
    notes: [
      { id:'n1', x:502,y:510,r:80, label:'D3'  },
      { id:'n2', x:585,y:652,r:62, label:'A3'  },
      { id:'n3', x:417,y:658,r:62, label:'B♭3' },
      { id:'n4', x:688,y:553,r:50, label:'C4'  },
      { id:'n5', x:305,y:548,r:50, label:'D4'  },
      { id:'n6', x:695,y:439,r:50, label:'E4'  },
      { id:'n7', x:309,y:421,r:50, label:'F4'  },
      { id:'n8', x:635,y:339,r:50, label:'G4'  },
      { id:'n9', x:388,y:327,r:50, label:'A4'  },
      { id:'n10',x:506,y:295,r:50, label:'C5'  },
      { id:'n17',x:180,y:774,r:71, label:'E3'  },
      { id:'n18',x:842,y:753,r:77, label:'B♭2' },
      { id:'n21',x:84, y:531,r:77, label:'C3'  },
      { id:'n22',x:909,y:531,r:71, label:'F3'  },
      { id:'n23',x:193,y:206,r:71, label:'G3'  },
    ],
  },
  {
    name: 'F♯2 Nordlys 15',
    pan: { cx: 500, cy: 500, r: 320 },
    notes: [
      { id:'n1', x:508,y:488,r:102,label:'F♯2' },
      { id:'n2', x:500,y:710,r:56, label:'F♯3' },
      { id:'n3', x:352,y:648,r:55, label:'G♯3' },
      { id:'n4', x:648,y:648,r:54, label:'B♭3' },
      { id:'n5', x:290,y:500,r:52, label:'C4'  },
      { id:'n6', x:710,y:500,r:52, label:'C♯4' },
      { id:'n7', x:352,y:352,r:49, label:'F4'  },
      { id:'n8', x:648,y:352,r:48, label:'G♯4' },
      { id:'n9', x:500,y:290,r:45, label:'C5'  },
      { id:'n12',x:297,y:156,r:46, label:'F5'  },
      { id:'n13',x:598,y:128,r:43, label:'G♯5' },
      { id:'n10',x:821,y:795,r:95, label:'B♭2' },
      { id:'n11',x:180,y:788,r:84, label:'C♯3' },
      { id:'n15',x:91, y:508,r:67, label:'F3'  },
      { id:'n14',x:826,y:276,r:49, label:'C♯5' },
    ],
  },
  {
    name: 'D3 Aegean 9',
    pan: { cx: 500, cy: 500, r: 320 },
    notes: [
      { id:'n1', x:500,y:500,r:80,label:'D3'  },
      { id:'n2', x:500,y:710,r:56,label:'F♯3' },
      { id:'n3', x:365,y:661,r:54,label:'A3'  },
      { id:'n4', x:635,y:661,r:52,label:'C♯4' },
      { id:'n5', x:290,y:500,r:50,label:'D4'  },
      { id:'n6', x:710,y:500,r:50,label:'E4'  },
      { id:'n7', x:365,y:339,r:48,label:'F♯4' },
      { id:'n8', x:635,y:339,r:46,label:'A4'  },
      { id:'n9', x:500,y:290,r:44,label:'C♯5' },
    ],
  },
];

// Helpers
window.parsePitchClass = function(label) {
  if (!label) return -1;
  const m = label.match(/^([A-Ga-g])([#♯b♭]?)/);
  if (!m) return -1;
  const base = { C:0, D:2, E:4, F:5, G:7, A:9, B:11 }[m[1].toUpperCase()];
  if (base == null) return -1;
  let pc = base;
  if (m[2] === '#' || m[2] === '♯') pc = (pc + 1) % 12;
  if (m[2] === 'b' || m[2] === '♭') pc = (pc + 11) % 12;
  return pc;
};

window.fmtLabel = function(label) {
  return String(label || '').replace(/#/g,'♯').replace(/b/g,'♭');
};
