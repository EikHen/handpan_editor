// ─── Music theory constants ───────────────────────────────────────────────────

// One colour per pitch class (C … B), designed to be distinct on white background
const PC_COLORS = [
  '#e74c3c', // 0  C   red
  '#e67e22', // 1  C♯  orange
  '#f1c40f', // 2  D   yellow
  '#a8b820', // 3  E♭  yellow-green
  '#27ae60', // 4  E   green
  '#16a085', // 5  F   teal
  '#2980b9', // 6  F♯  blue
  '#6c5ce7', // 7  G   indigo
  '#a855f7', // 8  A♭  violet
  '#e91e8c', // 9  A   pink
  '#c0392b', // 10 B♭  dark-red
  '#795548', // 11 B   brown
];

const PC_NAMES   = ['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'];
const SHARP_NAMES= ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'];
const FLAT_NAMES = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'];
// 12 major keys: diatonic PC sets + accidental direction for 'proper' mode
const MAJOR_KEYS = [
  { pcs: new Set([0,2,4,5,7,9,11]), acc: ''  }, // C  major
  { pcs: new Set([0,2,4,6,7,9,11]), acc: '#' }, // G  major
  { pcs: new Set([1,2,4,6,7,9,11]), acc: '#' }, // D  major
  { pcs: new Set([1,2,4,6,8,9,11]), acc: '#' }, // A  major
  { pcs: new Set([1,3,4,6,8,9,11]), acc: '#' }, // E  major
  { pcs: new Set([1,3,4,6,8,10,11]),acc: '#' }, // B  major
  { pcs: new Set([1,3,5,6,8,10,11]),acc: '#' }, // F# major
  { pcs: new Set([0,2,4,5,7,9,10]), acc: 'b' }, // F  major
  { pcs: new Set([0,2,3,5,7,9,10]), acc: 'b' }, // Bb major
  { pcs: new Set([0,2,3,5,7,8,10]), acc: 'b' }, // Eb major
  { pcs: new Set([0,1,3,5,7,8,10]), acc: 'b' }, // Ab major
  { pcs: new Set([0,1,3,5,6,8,10]), acc: 'b' }, // Db major
];
const ROOT_FILE = ['C','Cs','D','Eb','E','F','Fs','G','Ab','A','Bb','B']; // filename-safe

const CHORD_TYPES = {
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
  'Maj6':     [0, 4, 7,  9],
  'Min6':     [0, 3, 7,  9],
};

const CHORD_SYMBOLS = {
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
  'Maj6':     '⁶',
  'Min6':     '−⁶',
};

const ACCENT = '#5b8db8';

const MOODS = [
  { id: 'happy',    label: 'Happy',       icon: '☀' },
  { id: 'sad',      label: 'Melancholic', icon: '♩' },
  { id: 'jazz',     label: 'Jazz',        icon: '♪' },
  { id: 'epic',     label: 'Epic',        icon: '⚡' },
  { id: 'dark',     label: 'Dark',        icon: '◆' },
  { id: 'peaceful', label: 'Peaceful',    icon: '◌' },
];

// s = semitone offset from tonic (I), t = chord type from CHORD_TYPES
const PROGRESSIONS = [
  // Happy
  { name:'Classic Major',      moods:['happy'],           chords:[{s:0,t:'Major'},{s:5,t:'Major'},{s:7,t:'Major'},{s:0,t:'Major'}] },
  { name:'Pop Anthem',         moods:['happy','epic'],    chords:[{s:0,t:'Major'},{s:7,t:'Major'},{s:9,t:'Minor'},{s:5,t:'Major'}] },
  { name:'50s Doo-Wop',        moods:['happy'],           chords:[{s:0,t:'Major'},{s:9,t:'Minor'},{s:5,t:'Major'},{s:7,t:'Major'}] },
  { name:'Bright Pop',         moods:['happy'],           chords:[{s:0,t:'Major'},{s:2,t:'Minor'},{s:5,t:'Major'},{s:7,t:'Major'}] },
  // Melancholic
  { name:'Aeolian Loop',       moods:['sad'],             chords:[{s:0,t:'Minor'},{s:10,t:'Major'},{s:8,t:'Major'},{s:10,t:'Major'}] },
  { name:'Harmonic Minor',     moods:['sad','dark'],      chords:[{s:0,t:'Minor'},{s:5,t:'Minor'},{s:7,t:'Major'},{s:0,t:'Minor'}] },
  { name:'Andalusian Descent', moods:['sad','dark'],      chords:[{s:0,t:'Minor'},{s:10,t:'Major'},{s:8,t:'Major'},{s:7,t:'Major'}] },
  { name:'Minor Waltz',        moods:['sad'],             chords:[{s:0,t:'Minor'},{s:5,t:'Minor'},{s:10,t:'Major'},{s:3,t:'Major'}] },
  // Jazz
  { name:'ii–V–I',             moods:['jazz'],            chords:[{s:2,t:'Min7'},{s:7,t:'Dom7'},{s:0,t:'Maj7'}] },
  { name:'Rhythm Changes',     moods:['jazz'],            chords:[{s:0,t:'Maj7'},{s:9,t:'Min7'},{s:2,t:'Min7'},{s:7,t:'Dom7'}] },
  { name:'Jazz Turnaround',    moods:['jazz'],            chords:[{s:0,t:'Maj7'},{s:9,t:'Dom7'},{s:2,t:'Min7'},{s:7,t:'Dom7'}] },
  { name:'Harm. Min. ii–V–i',  moods:['jazz','dark'],    chords:[{s:2,t:'HalfDim7'},{s:7,t:'Dom7'},{s:0,t:'Minor'}] },
  { name:'Bossa Groove',       moods:['jazz','peaceful'], chords:[{s:0,t:'Maj7'},{s:5,t:'Maj7'},{s:2,t:'Min7'},{s:7,t:'Dom7'}] },
  // Epic
  { name:'Cinematic Minor',    moods:['epic','sad'],      chords:[{s:0,t:'Minor'},{s:8,t:'Major'},{s:3,t:'Major'},{s:10,t:'Major'}] },
  { name:'Mixolydian Rock',    moods:['epic','happy'],    chords:[{s:0,t:'Major'},{s:7,t:'Major'},{s:10,t:'Major'},{s:5,t:'Major'}] },
  { name:'Power Ascent',       moods:['epic'],            chords:[{s:0,t:'Major'},{s:5,t:'Major'},{s:9,t:'Minor'},{s:7,t:'Major'},{s:0,t:'Major'}] },
  // Dark
  { name:'Phrygian Gate',      moods:['dark'],            chords:[{s:0,t:'Minor'},{s:1,t:'Major'},{s:10,t:'Major'},{s:0,t:'Minor'}] },
  { name:'Dim Tension',        moods:['dark'],            chords:[{s:0,t:'Minor'},{s:2,t:'Dim'},{s:7,t:'Major'},{s:0,t:'Minor'}] },
  { name:'Dark Ostinato',      moods:['dark'],            chords:[{s:0,t:'Minor'},{s:8,t:'Major'},{s:10,t:'Major'},{s:0,t:'Minor'}] },
  // Peaceful
  { name:'Ascending Steps',    moods:['peaceful'],        chords:[{s:0,t:'Major'},{s:2,t:'Minor'},{s:4,t:'Minor'},{s:5,t:'Major'}] },
  { name:'Simple Loop',        moods:['peaceful','happy'],chords:[{s:0,t:'Major'},{s:5,t:'Major'},{s:0,t:'Major'},{s:7,t:'Major'}] },
  { name:'Mixolydian Flow',    moods:['peaceful'],        chords:[{s:0,t:'Major'},{s:10,t:'Major'},{s:5,t:'Major'},{s:0,t:'Major'}] },
];

const PALETTE = [
  '#e74c3c','#c0392b','#e91e63','#f06292',
  '#e67e22','#f39c12','#f1c40f','#a8b820',
  '#27ae60','#2ecc71','#16a085','#80cbc4',
  '#3498db','#2980b9','#6c5ce7','#a855f7',
  '#9c27b0','#e91e8c','#795548','#607d8b',
];

// ─── Default startup layout (D3 Kurd 18, hand-tuned positions) ───────────────
const DEFAULT_STATE = {
  pan: {"cx":500,"cy":500,"r":324,"name":""},
  notes: [
    {"id":"n1", "x":502,"y":510,"r":80,"label":"D3"},
    {"id":"n2", "x":585,"y":652,"r":62,"label":"A3"},
    {"id":"n3", "x":417,"y":658,"r":62,"label":"Bb3"},
    {"id":"n4", "x":688,"y":553,"r":50,"label":"C4"},
    {"id":"n5", "x":305,"y":548,"r":50,"label":"D4"},
    {"id":"n6", "x":695,"y":439,"r":50,"label":"E4"},
    {"id":"n7", "x":309,"y":421,"r":50,"label":"F4"},
    {"id":"n8", "x":635,"y":339,"r":50,"label":"G4"},
    {"id":"n9", "x":388,"y":327,"r":50,"label":"A4"},
    {"id":"n10","x":506,"y":295,"r":50,"label":"C5"},
    {"id":"n15","x":647,"y":134,"r":43,"label":"F5"},
    {"id":"n17","x":180,"y":774,"r":71,"label":"E3"},
    {"id":"n18","x":842,"y":753,"r":77,"label":"Bb2"},
    {"id":"n19","x":456,"y":386,"r":32,"label":"D5"},
    {"id":"n20","x":548,"y":385,"r":32,"label":"E5"},
    {"id":"n21","x":84, "y":531,"r":77,"label":"C3"},
    {"id":"n22","x":909,"y":531,"r":71,"label":"F3"},
    {"id":"n23","x":193,"y":206,"r":71,"label":"G3"},
  ],
};


