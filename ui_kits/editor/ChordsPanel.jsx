/* eslint-disable no-undef */
// Right-side panel: chord-type pills + list of every chord of that type,
// each shown with playability against the current pan.

function ChordsPanel({ onClose, panNotes, onSpotlight, hlChordRoot, hlChordType, hlMode }) {
  const [chordType, setChordType] = React.useState('all');

  const panPcs = React.useMemo(
    () => new Set(panNotes.map(n => window.parsePitchClass(n.label)).filter(p => p >= 0)),
    [panNotes]
  );

  const typesToShow = chordType === 'all' ? Object.keys(window.CHORD_TYPES) : [chordType];

  return (
    <aside className="kit-side-panel">
      <header className="kit-side-head">
        <span className="kit-side-title">♩ Chords</span>
        <Button sm onClick={onClose}>✕</Button>
      </header>

      <div className="kit-side-section">
        <SectionTitle>Type</SectionTitle>
        <div className="kit-pills">
          <Pill active={chordType === 'all'} onClick={() => setChordType('all')}>All</Pill>
          {Object.keys(window.CHORD_TYPES).map(t => (
            <Pill key={t} active={chordType === t} onClick={() => setChordType(t)}>
              {window.CHORD_SYMBOLS[t]} {t}
            </Pill>
          ))}
        </div>
      </div>

      <PlayLegend />

      <div className="kit-prog-list">
        {typesToShow.map(type => (
          <ChordsByTypeCard key={type} type={type} panPcs={panPcs}
            onSpotlight={onSpotlight} hlChordRoot={hlChordRoot} hlChordType={hlChordType} hlMode={hlMode} />
        ))}
      </div>
    </aside>
  );
}

function ChordsByTypeCard({ type, panPcs, onSpotlight, hlChordRoot, hlChordType, hlMode }) {
  const ivs = window.CHORD_TYPES[type];
  const sym = window.CHORD_SYMBOLS[type];
  return (
    <div className="kit-prog-card">
      <div className="kit-prog-card-head">
        <span className="kit-prog-card-title">
          <span className="ct-sym">{sym}</span> {type}
        </span>
      </div>
      <div className="kit-chord-row kit-chord-row--grid4">
        {window.PC_NAMES.map((rootName, rootPc) => {
          const missing = ivs.map(j => (rootPc + j) % 12).filter(p => !panPcs.has(p)).length;
          const play = missing === 0 ? 'full' : missing === 1 ? 'partial' : missing >= ivs.length ? 'none' : 'incomplete';
          const lit = hlMode === 'chord' && hlChordRoot === rootPc && hlChordType === type;
          return (
            <div key={rootPc}
                 className={'kit-chord-tile' + (lit ? ' is-active' : '')}
                 onClick={() => {
                   onSpotlight && onSpotlight(rootPc, type);
                   window.playChord && window.playChord(rootPc, type);
                 }}>
              <span className="kit-t-root">{rootName}</span>
              <span className="kit-t-sym">{sym}</span>
              <span className={'kit-play-dot play-' + play}>
                {play === 'full' ? '●' : play === 'partial' ? '◕' : play === 'incomplete' ? '◔' : '○'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

Object.assign(window, { ChordsPanel });
