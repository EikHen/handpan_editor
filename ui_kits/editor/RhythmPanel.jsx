/* eslint-disable no-undef */
// Bottom panel: rhythm browser + 2-row HAT grid + transport.
// Supports an "edit" mode — when on, clicking a cell cycles its glyph through
// D → T → d → t → • → −. Also plays a tone-click on cell click.

function RhythmPanel({ onClose }) {
  const [category, setCategory] = React.useState('all');
  const [query, setQuery] = React.useState('');
  const [activeId, setActiveId] = React.useState(window.RHYTHM_PATTERNS[0].id);
  const [playing, setPlaying] = React.useState(false);
  const [tick, setTick] = React.useState(-1);
  const [editMode, setEditMode] = React.useState(false);

  // Locally edited patterns — keyed by original id. Original RHYTHM_PATTERNS
  // is the source of truth; edits override.
  const [edits, setEdits] = React.useState({});

  const patternBase = window.RHYTHM_PATTERNS.find(p => p.id === activeId) || window.RHYTHM_PATTERNS[0];
  const active = edits[activeId] ? { ...patternBase, ...edits[activeId] } : patternBase;
  const isEdited = !!edits[activeId];

  const patterns = window.RHYTHM_PATTERNS.filter(p => {
    if (category !== 'all' && p.cat !== category) return false;
    if (query && !p.title.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  React.useEffect(() => {
    if (!playing || !active) return;
    const id = setInterval(() => setTick(t => {
      const next = (t + 1) % active.R.length;
      // Play hit-sounds as the playhead lands.
      const r = active.R[next];
      const l = active.L[next];
      window.playClick && window.playClick('r', r);
      window.playClick && window.playClick('l', l);
      return next;
    }), 60000 / active.tempo / 2);
    return () => clearInterval(id);
  }, [playing, active]);

  const CYCLE = ['D', 'T', 'd', 't', '•', '-'];
  const cycleGlyph = (g) => {
    const idx = CYCLE.indexOf(g);
    return CYCLE[(idx + 1) % CYCLE.length];
  };

  const onCell = (hand, i) => {
    const row = hand === 'r' ? active.R : active.L;
    const glyph = row[i];
    if (editMode) {
      const newGlyph = cycleGlyph(glyph);
      const nextRow = row.slice();
      nextRow[i] = newGlyph;
      setEdits(prev => ({
        ...prev,
        [activeId]: {
          ...(prev[activeId] || {}),
          [hand === 'r' ? 'R' : 'L']: nextRow,
        },
      }));
      window.playClick && window.playClick(hand, newGlyph);
    } else {
      window.playClick && window.playClick(hand, glyph);
    }
  };

  const revertEdit = () => {
    if (!isEdited) return;
    setEdits(prev => {
      const next = { ...prev };
      delete next[activeId];
      return next;
    });
  };

  return (
    <section className="kit-rhythm-panel">

      <aside className="kit-rhy-browser">
        <header className="kit-rhy-browser-head">
          <span className="kit-rhy-browser-title">Patterns</span>
        </header>
        <div className="kit-rhy-cat-pills">
          {window.RHYTHM_CATS.map(c => (
            <Pill key={c.id} active={category === c.id} onClick={() => setCategory(c.id)}>{c.label}</Pill>
          ))}
        </div>
        <input className="kit-rhy-search" type="search"
               placeholder="Search rhythms…" value={query}
               onChange={e => setQuery(e.target.value)} />
        <div className="kit-rhy-list">
          {patterns.length === 0 && <div className="kit-rhy-empty">No matches.</div>}
          {patterns.map(p => (
            <div key={p.id}
                 className={'kit-rhy-bcard ' + (activeId === p.id ? 'is-active' : '')}
                 onClick={() => { setActiveId(p.id); setTick(-1); }}>
              <span className="kit-rhy-bcard-title">{p.title}</span>
              {edits[p.id] && <span className="kit-bcard-badge kit-bcard-badge-edited">edited</span>}
              <span className="kit-bcard-badge">{p.time}</span>
            </div>
          ))}
        </div>
      </aside>

      <div className="kit-rhy-editor">
        <div className="kit-rhy-editor-content">
          <div className="kit-hat-head">
            <span className="kit-hat-title">{active?.title}</span>
            <span className="kit-bcard-badge">{active?.time} · ♩{active?.tempo} · {active?.tuning}</span>
            {isEdited && <span className="kit-bcard-badge kit-bcard-badge-edited">edited</span>}
          </div>

          {editMode && (
            <div className="kit-hat-edit-toolbar">
              <span className="kit-hat-edit-msg">Click a cell to cycle&nbsp;<b>D → T → d → t → • → −</b></span>
              {isEdited && <button className="kit-hat-edit-btn revert" onClick={revertEdit}>↶ Revert</button>}
            </div>
          )}

          <HatGrid R={active.R} L={active.L} tick={playing ? tick : -1}
                   editMode={editMode} onCell={onCell} />
        </div>

        <div className="kit-rhy-transport">
          <span className="kit-tempo-label">♩ =</span>
          <input className="kit-bpm" type="number" value={active?.tempo} readOnly />
          <Button sm>Tap</Button>
          <Button sm active={playing} onClick={() => setPlaying(p => !p)}>
            {playing ? '■ Stop' : '▶ Play'}
          </Button>
          <Button sm active={editMode} onClick={() => setEditMode(v => !v)}>
            ✎ Edit
          </Button>
          <span className="kit-transport-spacer" />
          <Button sm icon onClick={onClose}>✕</Button>
        </div>
      </div>
    </section>
  );
}

function HatGrid({ R, L, tick, editMode, onCell }) {
  return (
    <div className="kit-hat-grid-wrap">
      <div className="kit-hat-grid" style={{gridTemplateColumns: `22px repeat(${R.length}, 30px)`}}>
        <span className="kit-rowlbl r">R</span>
        {R.map((g, i) => <HatCell key={'r'+i} hand="r" glyph={g} active={tick === i}
                                  editMode={editMode} onClick={() => onCell('r', i)} />)}
        <span className="kit-rowlbl l">L</span>
        {L.map((g, i) => <HatCell key={'l'+i} hand="l" glyph={g} active={tick === i}
                                  editMode={editMode} onClick={() => onCell('l', i)} />)}
      </div>
    </div>
  );
}

function HatCell({ hand, glyph, active, editMode, onClick }) {
  let kind = 'rest';
  if (glyph === 'D' || glyph === 'T') kind = 'hit';
  else if (glyph === 'd' || glyph === 't') kind = 'mute';
  else if (glyph === '•') kind = 'ghost';
  else if (glyph === '-') kind = 'rest';
  return (
    <div className={'kit-hat-cell ' + hand + '-' + kind
                    + (active ? ' is-active' : '')
                    + (editMode ? ' is-editable' : '')}
         onClick={onClick}>
      {glyph}
    </div>
  );
}

Object.assign(window, { RhythmPanel });
