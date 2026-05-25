/* eslint-disable no-undef */
// Left sidebar — Template, Pan Editing, Note properties, Highlight, Audio, Shortcuts

function Sidebar({
  templates, templateIdx, onTemplate,
  panRadius, onPanRadius,
  selectedNote, onNoteLabel, onNoteRadius,
  onAdd, onDup, onDelete, onUndo, onRedo,
  enharmonic, onEnharmonic,
  hlMode, onHlMode, hlChordType, onHlChordType, hlChordRoot, onHlChordRoot,
  pcColors, onPcColor, panNotes,
  volume, onVolume, sustain, onSustain,
  notify,
}) {
  return (
    <aside className="kit-sidebar">

      {/* Template */}
      <section className="kit-panel">
        <PanelTitle>Template</PanelTitle>
        <div className="kit-row">
          <select value={templateIdx} onChange={e => onTemplate(+e.target.value)}>
            <option value={-1}>— choose a template —</option>
            {templates.map((t, i) => (
              <option key={t.name} value={i}>{t.name}</option>
            ))}
          </select>
        </div>
      </section>

      {/* Pan Editing */}
      <section className="kit-panel">
        <PanelTitle>Pan Editing</PanelTitle>

        <SubLabel>Layout file</SubLabel>
        <div className="kit-btn-row">
          <Button onClick={() => notify('Layout exported as JSON')} title="Export layout as JSON">⬇ Export</Button>
          <Button onClick={() => notify('Import a JSON layout file')} title="Import layout from JSON">⬆ Import</Button>
        </div>
        <div className="kit-btn-row" style={{marginBottom: 8}}>
          <Button onClick={() => notify('Pan exported as SVG')} title="Export current view as SVG">⬇ SVG</Button>
          <Button onClick={() => notify('Pan exported as PNG')} title="Export current view as PNG">⬇ PNG</Button>
        </div>

        <SubLabel>Notes</SubLabel>
        <div className="kit-btn-row">
          <Button onClick={onAdd}>+ Add</Button>
          <Button onClick={onDup}>⧉ Dup</Button>
          <Button danger onClick={onDelete}>✕ Delete</Button>
        </div>

        <SubLabel>History</SubLabel>
        <div className="kit-btn-row">
          <Button icon onClick={onUndo} title="Ctrl+Z">↩ Undo</Button>
          <Button icon onClick={onRedo} title="Ctrl+Y">↪ Redo</Button>
        </div>

        <SubLabel>Enharmonics</SubLabel>
        <div className="kit-row">
          <select value={enharmonic} onChange={e => onEnharmonic(e.target.value)}>
            <option value="-">— default</option>
            <option value="proper">proper (auto key)</option>
            <option value="#"># sharps</option>
            <option value="b">♭ flats</option>
          </select>
        </div>

        <SubLabel>Pan body</SubLabel>
        <div className="kit-range-row">
          <div className="kit-range-meta">
            <span>Radius:</span><span><b>{panRadius}</b> px</span>
          </div>
          <input type="range" min="120" max="420" value={panRadius}
                 onChange={e => onPanRadius(+e.target.value)} />
        </div>
      </section>

      {/* Note properties */}
      <section className="kit-panel">
        <PanelTitle>Note</PanelTitle>
        {!selectedNote && (
          <div className="kit-empty">Select a note to edit.</div>
        )}
        {selectedNote && (
          <>
            <div className="kit-row">
              <label>Label</label>
              <input type="text" value={selectedNote.label}
                     onChange={e => onNoteLabel(e.target.value)}
                     placeholder="D3, B♭4, F♯5 …" maxLength={8}/>
            </div>
            <div className="kit-range-row">
              <div className="kit-range-meta">
                <span>Radius:</span><span><b>{selectedNote.r}</b> px</span>
              </div>
              <input type="range" min="14" max="130" value={selectedNote.r}
                     onChange={e => onNoteRadius(+e.target.value)} />
            </div>
          </>
        )}
      </section>

      {/* Highlight */}
      <section className="kit-panel">
        <PanelTitle>Highlight</PanelTitle>
        <div className="kit-row">
          <label>Mode</label>
          <select value={hlMode} onChange={e => onHlMode(e.target.value)}>
            <option value="none">None</option>
            <option value="note">By Note (pitch class)</option>
            <option value="chord">By Chord</option>
          </select>
        </div>
        {hlMode === 'note' && (
          <>
            <SubLabel>Tap a swatch to recolour</SubLabel>
            <NoteColorLegend pcColors={pcColors} onPcColor={onPcColor} panNotes={panNotes}/>
          </>
        )}
        {hlMode === 'chord' && (
          <>
            <div className="kit-row">
              <label>Chord type</label>
              <select value={hlChordType} onChange={e => onHlChordType(e.target.value)}>
                {Object.keys(window.CHORD_TYPES).map(t => (
                  <option key={t} value={t}>
                    {window.CHORD_SYMBOLS[t]} {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="kit-row">
              <label>Root</label>
              <select value={hlChordRoot} onChange={e => onHlChordRoot(+e.target.value)}>
                {window.PC_NAMES.map((n, i) => (
                  <option key={n} value={i}>{n}</option>
                ))}
              </select>
            </div>
          </>
        )}
      </section>

      {/* Audio */}
      <section className="kit-panel">
        <PanelTitle>Audio</PanelTitle>
        <div className="kit-hint">Alt+Click notes, chords or tiles to hear them</div>
        <div className="kit-range-row">
          <div className="kit-range-meta">
            <span>Volume:</span><span><b>{volume}</b>%</span>
          </div>
          <input type="range" min="0" max="100" step="5" value={volume}
                 onChange={e => onVolume(+e.target.value)} />
        </div>
        <div className="kit-range-row">
          <div className="kit-range-meta">
            <span>Sustain:</span><span><b>{sustain.toFixed(1)}</b>s</span>
          </div>
          <input type="range" min="0.2" max="4" step="0.1" value={sustain}
                 onChange={e => onSustain(+e.target.value)} />
        </div>
      </section>

      {/* Shortcuts */}
      <section className="kit-panel kit-panel-shortcuts">
        <PanelTitle>Shortcuts</PanelTitle>
        <div className="kit-kbd">
          <b>Click</b> — select<br/>
          <b>Shift+click</b> — multi-select<br/>
          <b>Drag note</b> — move<br/>
          <b>Drag canvas</b> — box select<br/>
          <b>⊙ handle</b> — resize<br/>
          <b>Dbl-click</b> — edit label<br/>
          <code>↑↓←→</code> — nudge 1 px<br/>
          <code>Shift+↑↓←→</code> — nudge 10 px<br/>
          <code>Del</code> — delete<br/>
          <code>Ctrl+A</code> — select all<br/>
          <code>Ctrl+D</code> — duplicate<br/>
          <code>Ctrl+Z/Y</code> — undo/redo<br/>
          <code>Esc</code> — deselect<br/>
          <b>Alt+Click</b> — play note/chord
        </div>
      </section>

    </aside>
  );
}

Object.assign(window, { Sidebar });
