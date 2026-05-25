/* eslint-disable no-undef */
// White canvas — concentric pan body + draggable & clickable note bubbles.
// Notes can be moved (drag), selected (click), played (alt+click),
// and stroke-recoloured via the per-pitch-class palette override.

function PanCanvas({ pan, notes, selectedId, onSelect, onMove, hlMode, hlChordType, hlChordRoot, pcColors }) {
  const { cx, cy, r } = pan;
  const innerR = Math.max(r - 50, Math.round(r * 0.8));
  const svgRef = React.useRef(null);
  const dragRef = React.useRef(null);

  const highlightedPcs = computeHighlightedPcs(hlMode, hlChordType, hlChordRoot);
  const palette = pcColors || window.PC_COLORS;

  const pt = (e) => {
    const svg = svgRef.current;
    if (!svg) return { x: 0, y: 0 };
    const p = svg.createSVGPoint();
    p.x = e.clientX; p.y = e.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  };

  const onNoteDown = (e, note) => {
    e.stopPropagation();
    onSelect(note.id);
    if (e.altKey) {
      window.playNote && window.playNote(note.label);
      return;
    }
    const p0 = pt(e);
    dragRef.current = { id: note.id, x0: p0.x, y0: p0.y, ox: note.x, oy: note.y, moved: false };
  };

  React.useEffect(() => {
    const onMouseMove = (e) => {
      if (!dragRef.current) return;
      const p = pt(e);
      const { id, x0, y0, ox, oy } = dragRef.current;
      const x = Math.round(ox + (p.x - x0));
      const y = Math.round(oy + (p.y - y0));
      dragRef.current.moved = true;
      onMove(id, x, y);
    };
    const onMouseUp = () => { dragRef.current = null; };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [onMove]);

  return (
    <div className="kit-canvas-wrap">
      <svg id="kit-canvas" ref={svgRef}
           viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid meet">
        <rect width="1000" height="1000" fill="white" />
        <g>
          <circle cx={cx} cy={cy} r={r} fill="#f2f2f2" stroke="#c0c0c0" strokeWidth="5" />
          <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="#e0e0e0" strokeWidth="1.5" />
        </g>
        <g>
          {notes.map(note => {
            const pc = window.parsePitchClass(note.label);
            const selected = note.id === selectedId;
            const inHL = highlightedPcs === 'all' || (highlightedPcs && highlightedPcs.has(pc));
            const dim = highlightedPcs && highlightedPcs !== 'all' && !inHL;
            const stroke = selected
              ? '#f90'
              : (inHL && pc >= 0 ? palette[pc] : '#222');
            const strokeW = selected ? 3 : (inHL && pc >= 0 && highlightedPcs !== 'all' ? 3.5 : 2);
            const fs = Math.max(10, Math.min(Math.round(note.r * 0.46), 22));
            return (
              <g key={note.id} data-id={note.id} style={{cursor:'grab', opacity: dim ? 0.32 : 1}}
                 onMouseDown={(e) => onNoteDown(e, note)}>
                <circle cx={note.x} cy={note.y} r={note.r}
                        fill="white" stroke={stroke} strokeWidth={strokeW} />
                <text x={note.x} y={note.y}
                      textAnchor="middle" dominantBaseline="central"
                      fontFamily="Arial, sans-serif" fontSize={fs}
                      fill="#222" pointerEvents="none">
                  {window.fmtLabel(note.label)}
                </text>
                {selected && (
                  <circle cx={note.x + note.r} cy={note.y} r="7"
                          fill="#f90" stroke="white" strokeWidth="1.5"
                          style={{cursor: 'ew-resize'}}/>
                )}
              </g>
            );
          })}
        </g>
        {hlMode === 'chord' && (
          <text x="500" y={cy + r + 60}
                textAnchor="middle" dominantBaseline="middle"
                fontFamily="Arial, sans-serif" fontSize="30"
                fontWeight="bold" fill="#333">
            {(window.CHORD_SYMBOLS[hlChordType] ?? '') + ' ' + window.PC_NAMES[hlChordRoot] + ' ' + hlChordType}
          </text>
        )}
      </svg>
    </div>
  );
}

function computeHighlightedPcs(mode, type, root) {
  if (mode === 'note')  return 'all';
  if (mode === 'chord') {
    const ivs = window.CHORD_TYPES[type];
    if (!ivs) return null;
    return new Set(ivs.map(i => (root + i) % 12));
  }
  return null;
}

Object.assign(window, { PanCanvas });
