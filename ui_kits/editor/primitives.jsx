/* eslint-disable no-undef */
// Tiny shared primitives used across the editor UI kit.

function Button({ children, active, danger, full, icon, sm, onClick, title, style }) {
  const cls = [
    'kit-btn',
    active && 'is-active',
    danger && 'is-danger',
    full && 'is-full',
    icon && 'is-icon',
    sm && 'is-sm',
  ].filter(Boolean).join(' ');
  return (
    <button type="button" className={cls} onClick={onClick} title={title} style={style}>
      {children}
    </button>
  );
}

function Pill({ children, active, onClick, title }) {
  return (
    <button
      type="button"
      className={'kit-pill ' + (active ? 'is-active' : '')}
      onClick={onClick}
      title={title}
    >
      {children}
    </button>
  );
}

function PanelTitle({ children }) {
  return <div className="kit-panel-title">{children}</div>;
}

function SubLabel({ children }) {
  return <div className="kit-sub-label">{children}</div>;
}

function SectionTitle({ children }) {
  return <div className="kit-section-title">{children}</div>;
}

function PlayLegend() {
  return (
    <div className="kit-play-legend">
      <span><span className="play-full">●</span> Complete</span>
      <span><span className="play-partial">◕</span> −1 note</span>
      <span><span className="play-incomplete">◔</span> −2+</span>
      <span><span className="play-none">○</span> None</span>
    </div>
  );
}

function FunctionLegend() {
  return (
    <div className="kit-fn-legend">
      <span className="fn-T">■ Tonic</span>
      <span className="fn-S">■ Subdominant</span>
      <span className="fn-D">■ Dominant</span>
    </div>
  );
}

function Toast({ message }) {
  if (!message) return null;
  return <div className="kit-toast">{message}</div>;
}

// ── Note-color legend with click-to-open palette ──────────────────────────
function NoteColorLegend({ pcColors, onPcColor, panNotes }) {
  const [openPc, setOpenPc] = React.useState(null);
  const palette = pcColors || window.PC_COLORS;

  // Only show pitch classes that exist on the pan, in pan order.
  const presentPcs = Array.from(new Set(
    panNotes.map(n => window.parsePitchClass(n.label)).filter(p => p >= 0)
  )).sort((a, b) => a - b);

  return (
    <div className="kit-note-legend">
      {presentPcs.map(pc => (
        <span key={pc} className="kit-legend-item">
          <span className="kit-color-swatch" style={{background: palette[pc]}}
                onClick={() => setOpenPc(openPc === pc ? null : pc)} />
          <span>{window.PC_NAMES[pc]}</span>
          {openPc === pc && (
            <ColorPopup pc={pc} current={palette[pc]}
              onPick={(c) => { onPcColor(pc, c); setOpenPc(null); }}
              onReset={() => { onPcColor(pc, null); setOpenPc(null); }}
              onClose={() => setOpenPc(null)} />
          )}
        </span>
      ))}
    </div>
  );
}

function ColorPopup({ pc, current, onPick, onReset, onClose }) {
  const PALETTE = [
    '#e74c3c','#c0392b','#e91e63','#f06292',
    '#e67e22','#f39c12','#f1c40f','#a8b820',
    '#27ae60','#2ecc71','#16a085','#80cbc4',
    '#3498db','#2980b9','#6c5ce7','#a855f7',
    '#9c27b0','#e91e8c','#795548','#607d8b',
  ];

  React.useEffect(() => {
    const h = (e) => { if (!e.target.closest('.kit-color-popup')) onClose(); };
    setTimeout(() => document.addEventListener('mousedown', h), 0);
    return () => document.removeEventListener('mousedown', h);
  }, [onClose]);

  return (
    <div className="kit-color-popup">
      <div className="kit-color-popup-title">{window.PC_NAMES[pc]} colour</div>
      <div className="kit-color-popup-grid">
        {PALETTE.map(c => (
          <span key={c}
                className={'kit-color-popup-swatch' + (c.toLowerCase() === String(current).toLowerCase() ? ' is-active' : '')}
                style={{background: c}}
                onClick={() => onPick(c)} />
        ))}
      </div>
      <button className="kit-color-popup-reset" onClick={onReset}>Reset to default</button>
    </div>
  );
}

Object.assign(window, {
  Button, Pill, PanelTitle, SubLabel, SectionTitle,
  PlayLegend, FunctionLegend, Toast,
  NoteColorLegend,
});
