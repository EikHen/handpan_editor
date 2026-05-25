/* eslint-disable no-undef */
// Right-side panel: mood pills, root bar, list of progression cards.
// Active chord is tracked at panel level so only one chord across all
// progressions is highlighted at a time.

function ProgressionsPanel({ onClose, panNotes, onSpotlight, hlChordRoot, hlChordType, hlMode }) {
  const [mood, setMood] = React.useState('happy');
  const [rootPc, setRootPc] = React.useState(2); // D
  const [activeKey, setActiveKey] = React.useState(null); // "<progName>:<chordIdx>"

  const filteredProgs = React.useMemo(
    () => window.PROGRESSIONS.filter(p => p.moods.includes(mood)),
    [mood]
  );

  const panPcs = React.useMemo(
    () => new Set(panNotes.map(n => window.parsePitchClass(n.label)).filter(p => p >= 0)),
    [panNotes]
  );

  // When mood changes, the previously-active chord no longer makes sense.
  React.useEffect(() => { setActiveKey(null); }, [mood, rootPc]);

  return (
    <aside className="kit-side-panel">
      <header className="kit-side-head">
        <span className="kit-side-title">♬ Chord Progressions</span>
        <Button sm onClick={onClose}>✕</Button>
      </header>

      <div className="kit-side-section">
        <SectionTitle>Mood</SectionTitle>
        <div className="kit-pills">
          {window.MOODS.map(m => (
            <Pill key={m.id} active={mood === m.id} onClick={() => setMood(m.id)}>
              {m.icon} {m.label}
            </Pill>
          ))}
        </div>
      </div>

      <div className="kit-side-section">
        <SectionTitle>Root note</SectionTitle>
        <div className="kit-root-bar">
          {window.PC_NAMES.map((n, i) => {
            const onPan = panPcs.has(i);
            return (
              <button key={n}
                className={'kit-root-btn ' + (rootPc === i ? 'is-active ' : '') + (onPan ? 'on-pan' : '')}
                onClick={() => setRootPc(i)}>
                {n}
              </button>
            );
          })}
        </div>
      </div>

      <PlayLegend />
      <FunctionLegend />

      <div className="kit-prog-list">
        {filteredProgs.map(prog => (
          <ProgressionCard key={prog.name} prog={prog} rootPc={rootPc} panPcs={panPcs}
            activeKey={activeKey} setActiveKey={setActiveKey}
            onSpotlight={onSpotlight} hlChordRoot={hlChordRoot} hlChordType={hlChordType} hlMode={hlMode} />
        ))}
      </div>
    </aside>
  );
}

function ProgressionCard({ prog, rootPc, panPcs, activeKey, setActiveKey, onSpotlight, hlChordRoot, hlChordType, hlMode }) {
  return (
    <div className="kit-prog-card">
      <div className="kit-prog-card-head">
        <span className="kit-prog-card-title">{prog.name}</span>
      </div>
      <div className="kit-chord-row">
        {prog.chords.map((c, i) => {
          const chordRoot = (rootPc + c.s) % 12;
          const fn = window.fnFor(c.s);
          const roman = window.ROMAN_FOR(c.s, c.t);
          const sym = window.CHORD_SYMBOLS[c.t] ?? '';
          const ivs = window.CHORD_TYPES[c.t] ?? [];
          const missing = ivs.map(j => (chordRoot + j) % 12).filter(p => !panPcs.has(p)).length;
          const play = missing === 0 ? 'full' : missing === 1 ? 'partial' : missing >= ivs.length ? 'none' : 'incomplete';
          const myKey = prog.name + ':' + i;
          const litByHL = hlMode === 'chord' && hlChordRoot === chordRoot && hlChordType === c.t && activeKey === myKey;
          return (
            <div key={i}
              className={'kit-chord-tile fn-' + fn + ((activeKey === myKey || litByHL) ? ' is-active' : '')}
              onClick={(e) => {
                setActiveKey(myKey);
                onSpotlight && onSpotlight(chordRoot, c.t);
                if (e.altKey || true) window.playChord && window.playChord(chordRoot, c.t);
              }}>
              <span className="kit-roman">{roman}</span>
              <span className="kit-t-root">{window.PC_NAMES[chordRoot]}</span>
              <span className="kit-t-sym">{sym}</span>
              <span className={'kit-play-dot play-' + play}>
                {play === 'full' ? '●' : play === 'partial' ? '◕' : play === 'incomplete' ? '◔' : '○'}
              </span>
            </div>
          );
        })}
      </div>
      <div className="kit-roman-strip">
        {prog.chords.map(c => window.ROMAN_FOR(c.s, c.t)).join(' — ')}
      </div>
    </div>
  );
}

Object.assign(window, { ProgressionsPanel });
