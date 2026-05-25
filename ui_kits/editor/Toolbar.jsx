/* eslint-disable no-undef */
// Top toolbar — wordmark + Rhythm/Progressions/Chords toggles + status.

function Toolbar({ panelOpen, onTogglePanel, status }) {
  return (
    <div className="kit-toolbar">
      <h1 className="kit-wordmark">♩ Handpan Editor</h1>
      <div className="kit-sep" />
      <Button
        active={panelOpen === 'rhythm'}
        onClick={() => onTogglePanel('rhythm')}
        title="Rhythm Mode"
      >
        ♩ Rhythm<sup className="kit-beta-sup">β</sup>
      </Button>
      <Button
        active={panelOpen === 'progressions'}
        onClick={() => onTogglePanel('progressions')}
        title="Chord Progressions"
      >
        ♬ Progressions
      </Button>
      <Button
        active={panelOpen === 'chords'}
        onClick={() => onTogglePanel('chords')}
        title="Chords"
      >
        ♩ Chords
      </Button>
      <div className="kit-sep" />
      <span className="kit-status">{status}</span>
    </div>
  );
}

Object.assign(window, { Toolbar });
