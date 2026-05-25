/* eslint-disable no-undef */
// Root App: state, panel toggles, layout.

const { useState, useCallback, useRef, useEffect } = React;

function App() {
  const [templateIdx, setTemplateIdx] = useState(0);
  const [notes, setNotes] = useState(window.TEMPLATES[0].notes);
  const [pan, setPan] = useState(window.TEMPLATES[0].pan);
  const [selectedId, setSelectedId] = useState(null);

  const [enharmonic, setEnharmonic] = useState('-');
  const [hlMode, setHlMode] = useState('none');
  const [hlChordType, setHlChordType] = useState('Major');
  const [hlChordRoot, setHlChordRoot] = useState(2); // D
  const [volume, setVolume] = useState(50);
  const [sustain, setSustain] = useState(0.8);
  const [pcOverrides, setPcOverrides] = useState({}); // pc-index → hex string

  const pcColors = React.useMemo(() => {
    const a = window.PC_COLORS.slice();
    for (const [pc, c] of Object.entries(pcOverrides)) {
      if (c) a[+pc] = c;
    }
    return a;
  }, [pcOverrides]);

  const setPcColor = (pc, c) => {
    setPcOverrides(prev => {
      const next = { ...prev };
      if (c == null) delete next[pc];
      else next[pc] = c;
      return next;
    });
  };

  const [panelOpen, setPanelOpen] = useState('progressions');
  const [toast, setToast] = useState(null);

  const notify = useCallback((msg) => {
    setToast(msg);
    clearTimeout(notify._t);
    notify._t = setTimeout(() => setToast(null), 1800);
  }, []);

  const togglePanel = (id) => setPanelOpen(open => open === id ? null : id);

  const onTemplate = (i) => {
    if (i < 0) return;
    setTemplateIdx(i);
    setNotes(window.TEMPLATES[i].notes);
    setPan(window.TEMPLATES[i].pan);
    setSelectedId(null);
    notify('Loaded ' + window.TEMPLATES[i].name);
  };

  const selectedNote = notes.find(n => n.id === selectedId) || null;

  const updateNote = (id, patch) => {
    setNotes(prev => prev.map(n => n.id === id ? { ...n, ...patch } : n));
  };
  const updateSelected = (patch) => selectedId && updateNote(selectedId, patch);

  const addNote = () => {
    const id = 'n' + (Math.random() * 1e6 | 0);
    const cx = pan.cx + (Math.random() - 0.5) * 200;
    const cy = pan.cy + (Math.random() - 0.5) * 200;
    setNotes([...notes, { id, x: Math.round(cx), y: Math.round(cy), r: 50, label: 'C4' }]);
    setSelectedId(id);
  };
  const dupNote = () => {
    if (!selectedNote) return notify('Nothing selected to duplicate.');
    const id = 'n' + (Math.random() * 1e6 | 0);
    const copy = { ...selectedNote, id, x: selectedNote.x + 20, y: selectedNote.y + 20 };
    setNotes([...notes, copy]);
    setSelectedId(id);
  };
  const delNote = () => {
    if (!selectedId) return notify('Nothing selected to delete.');
    setNotes(notes.filter(n => n.id !== selectedId));
    setSelectedId(null);
  };

  // Spotlight a chord from the side-panels → drive pan highlight.
  const spotlightChord = (root, type) => {
    setHlMode('chord');
    setHlChordRoot(root);
    setHlChordType(type);
    if (panelOpen !== 'progressions' && panelOpen !== 'chords') {
      // keep it where it is
    }
  };

  // Keyboard: arrows to nudge selection, Del to delete, Esc to deselect.
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.matches('input, textarea, select')) return;
      if (e.key === 'Escape') { setSelectedId(null); return; }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) { delNote(); e.preventDefault(); }
        return;
      }
      const step = e.shiftKey ? 10 : 1;
      if (!selectedNote) return;
      let dx = 0, dy = 0;
      if (e.key === 'ArrowLeft')  dx = -step;
      if (e.key === 'ArrowRight') dx =  step;
      if (e.key === 'ArrowUp')    dy = -step;
      if (e.key === 'ArrowDown')  dy =  step;
      if (dx || dy) {
        updateNote(selectedNote.id, {
          x: Math.round(selectedNote.x + dx),
          y: Math.round(selectedNote.y + dy),
        });
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div className="kit-root">
      <Toolbar
        panelOpen={panelOpen}
        onTogglePanel={togglePanel}
        status={`${notes.length} notes  ·  ${window.TEMPLATES[templateIdx]?.name ?? '—'}`}
      />

      <div className="kit-workspace">
        <div className="kit-workspace-row">

          <Sidebar
            templates={window.TEMPLATES}
            templateIdx={templateIdx}
            onTemplate={onTemplate}
            panRadius={pan.r}
            onPanRadius={r => setPan({...pan, r})}
            selectedNote={selectedNote}
            onNoteLabel={(label) => updateSelected({ label })}
            onNoteRadius={(r) => updateSelected({ r })}
            onAdd={addNote}
            onDup={dupNote}
            onDelete={delNote}
            onUndo={() => notify('Undo (demo)')}
            onRedo={() => notify('Redo (demo)')}
            enharmonic={enharmonic}
            onEnharmonic={setEnharmonic}
            hlMode={hlMode} onHlMode={setHlMode}
            hlChordType={hlChordType} onHlChordType={setHlChordType}
            hlChordRoot={hlChordRoot} onHlChordRoot={setHlChordRoot}
            pcColors={pcColors} onPcColor={setPcColor} panNotes={notes}
            volume={volume} onVolume={setVolume}
            sustain={sustain} onSustain={setSustain}
            notify={notify}
          />

          <main className="kit-canvas-wrap-outer"
                onMouseDown={() => setSelectedId(null)}>
            <PanCanvas
              pan={pan} notes={notes}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onMove={(id, x, y) => updateNote(id, { x, y })}
              hlMode={hlMode}
              hlChordType={hlChordType}
              hlChordRoot={hlChordRoot}
              pcColors={pcColors}
            />
          </main>

          {panelOpen === 'progressions' &&
            <ProgressionsPanel
              onClose={() => setPanelOpen(null)}
              panNotes={notes}
              onSpotlight={spotlightChord}
              hlChordRoot={hlChordRoot} hlChordType={hlChordType} hlMode={hlMode}
            />}
          {panelOpen === 'chords' &&
            <ChordsPanel
              onClose={() => setPanelOpen(null)}
              panNotes={notes}
              onSpotlight={spotlightChord}
              hlChordRoot={hlChordRoot} hlChordType={hlChordType} hlMode={hlMode}
            />}

        </div>

        {panelOpen === 'rhythm' &&
          <RhythmPanel onClose={() => setPanelOpen(null)} />}
      </div>

      <Toast message={toast} />
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
