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
  nextId: 24,
};

// Templates: satellite notes ordered so low-pitched notes land at the bottom
// and high-pitched notes land at the top (bottom_angles starts lower-right,
// goes counter-clockwise, so the middle indices end up near the top).
const TEMPLATES = [
  {
    name: 'D3 Kurd 18',
    state: DEFAULT_STATE,
  },
  {
    name: 'F#2 Nordlys 15',
    state: {
      pan: {"cx":500,"cy":500,"r":320},
      notes: [
        {"id":"n1", "x":508,"y":488,"r":102,"label":"F#2"},
        {"id":"n2", "x":500,"y":710,"r":56, "label":"F#3"},
        {"id":"n3", "x":352,"y":648,"r":55, "label":"G#3"},
        {"id":"n4", "x":648,"y":648,"r":54, "label":"Bb3"},
        {"id":"n5", "x":290,"y":500,"r":52, "label":"C4"},
        {"id":"n6", "x":710,"y":500,"r":52, "label":"C#4"},
        {"id":"n7", "x":352,"y":352,"r":49, "label":"F4"},
        {"id":"n8", "x":648,"y":352,"r":48, "label":"G#4"},
        {"id":"n9", "x":500,"y":290,"r":45, "label":"C5"},
        {"id":"n10","x":821,"y":795,"r":95, "label":"Bb2"},
        {"id":"n11","x":180,"y":788,"r":84, "label":"C#3"},
        {"id":"n12","x":297,"y":156,"r":46, "label":"F5"},
        {"id":"n13","x":598,"y":128,"r":43, "label":"G#5"},
        {"id":"n14","x":826,"y":276,"r":49, "label":"C#5"},
        {"id":"n15","x":91, "y":508,"r":67, "label":"F3"},
      ],
      nextId: 16,
    },
  },
  {
    name: 'D3 Aegean 20',
    state: {
      pan: {"cx":500,"cy":500,"r":320},
      notes: [
        {"id":"n1", "x":500,"y":500,"r":80,"label":"D3"},
        {"id":"n2", "x":500,"y":710,"r":56,"label":"F#3"},
        {"id":"n3", "x":365,"y":661,"r":54,"label":"A3"},
        {"id":"n4", "x":635,"y":661,"r":52,"label":"C#4"},
        {"id":"n5", "x":293,"y":536,"r":51,"label":"D4"},
        {"id":"n6", "x":707,"y":536,"r":49,"label":"F#4"},
        {"id":"n7", "x":318,"y":395,"r":48,"label":"G#4"},
        {"id":"n8", "x":682,"y":395,"r":47,"label":"A4"},
        {"id":"n9", "x":428,"y":303,"r":45,"label":"C#5"},
        {"id":"n10","x":572,"y":303,"r":44,"label":"D5"},
        {"id":"n11","x":500,"y":372,"r":26,"label":"F#5"},
        {"id":"n12","x":582,"y":402,"r":25,"label":"G#5"},
        {"id":"n13","x":418,"y":402,"r":25,"label":"A5"},
        {"id":"n14","x":819,"y":741,"r":62,"label":"G#3"},
        {"id":"n15","x":900,"y":500,"r":56,"label":"E4"},
        {"id":"n16","x":819,"y":259,"r":50,"label":"B4"},
        {"id":"n17","x":500,"y":100,"r":70,"label":"B2"},
        {"id":"n18","x":181,"y":259,"r":46,"label":"E5"},
        {"id":"n19","x":100,"y":500,"r":60,"label":"B3"},
        {"id":"n20","x":181,"y":741,"r":66,"label":"E3"},
      ],
      nextId: 21,
    },
  },
  {
    name: 'E3 Amara 20',
    state: {
      pan: {"cx":500,"cy":500,"r":320},
      notes: [
        {"id":"n1", "x":500,"y":500,"r":80,"label":"E3"},
        {"id":"n2", "x":500,"y":710,"r":53,"label":"B3"},
        {"id":"n3", "x":352,"y":648,"r":51,"label":"D4"},
        {"id":"n4", "x":648,"y":648,"r":50,"label":"E4"},
        {"id":"n5", "x":290,"y":500,"r":49,"label":"F#4"},
        {"id":"n6", "x":710,"y":500,"r":48,"label":"G4"},
        {"id":"n7", "x":352,"y":352,"r":47,"label":"A4"},
        {"id":"n8", "x":648,"y":352,"r":44,"label":"D5"},
        {"id":"n9", "x":500,"y":290,"r":43,"label":"E5"},
        {"id":"n10","x":549,"y":382,"r":26,"label":"F#5"},
        {"id":"n11","x":451,"y":382,"r":26,"label":"G5"},
        {"id":"n12","x":618,"y":451,"r":25,"label":"A5"},
        {"id":"n13","x":819,"y":741,"r":67,"label":"D3"},
        {"id":"n14","x":900,"y":500,"r":59,"label":"C4"},
        {"id":"n15","x":846,"y":300,"r":62,"label":"A3"},
        {"id":"n16","x":688,"y":147,"r":50,"label":"B4"},
        {"id":"n17","x":500,"y":100,"r":50,"label":"C5"},
        {"id":"n18","x":243,"y":194,"r":63,"label":"G3"},
        {"id":"n19","x":102,"y":535,"r":64,"label":"F#3"},
        {"id":"n20","x":181,"y":741,"r":69,"label":"C3"},
      ],
      nextId: 21,
    },
  },
  {
    name: 'F# Low Pygmy 21',
    state: {
      pan: {"cx":500,"cy":500,"r":320},
      notes: [
        {"id":"n1", "x":500,"y":561,"r":78,"label":"F#3"},
        {"id":"n2", "x":405,"y":713,"r":55,"label":"A3"},
        {"id":"n3", "x":584,"y":720,"r":54,"label":"G#3"},
        {"id":"n4", "x":287,"y":591,"r":54,"label":"E4"},
        {"id":"n5", "x":709,"y":603,"r":51,"label":"C#4"},
        {"id":"n6", "x":287,"y":435,"r":50,"label":"G#4"},
        {"id":"n7", "x":709,"y":458,"r":49,"label":"F#4"},
        {"id":"n8", "x":359,"y":325,"r":45,"label":"C#5"},
        {"id":"n9", "x":641,"y":325,"r":47,"label":"A4"},
        {"id":"n10","x":500,"y":264,"r":43,"label":"E5"},
        {"id":"n11","x":447,"y":409,"r":26,"label":"F#5"},
        {"id":"n12","x":549,"y":409,"r":26,"label":"G#5"},
        {"id":"n13","x":390,"y":477,"r":25,"label":"A5"},
        {"id":"n14","x":603,"y":477,"r":24,"label":"B5"},
        {"id":"n15","x":500,"y":100,"r":70,"label":"B2"},
        {"id":"n16","x":855,"y":720,"r":64,"label":"D3"},
        {"id":"n17","x":140,"y":720,"r":62,"label":"E3"},
        {"id":"n18","x":95, "y":470,"r":58,"label":"D4"},
        {"id":"n19","x":895,"y":495,"r":56,"label":"B3"},
        {"id":"n20","x":215,"y":270,"r":50,"label":"B4"},
        {"id":"n21","x":790,"y":280,"r":44,"label":"D5"},
      ],
      nextId: 22,
    },
  },
];

