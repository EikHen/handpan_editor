# Handpan Explorer

A browser-based toolkit for designing handpan layouts and exploring the music theory behind them — chords, progressions, and rhythms, all matched to your instrument.

No install, no account, no build step. Just open `index.html` and start exploring.

---

## What it does

**Build your pan** — pick a template or start from scratch. Add, move, resize and label notes on a visual canvas. Export layouts as JSON, SVG or PNG.

**Explore harmony** — switch to Explore mode and instantly see which chords and progressions your scale supports. Filter by mood, root note, or chord type. Click any tile to hear it and see the notes light up on your pan.

**Practice rhythms** — the built-in HAT (Handpan Arrangement Tablature) editor lets you write, play back and share tablatures. Drag the resize handle to give it more room, or go full-screen.

**Transpose & tweak** — shift your entire scale up or down by semitone. Toggle note numbers, swap number/label focus, choose enharmonic spelling, customise note colours.

---

## Quick start

1. Open `index.html` in any modern browser
2. Pick a template from the sidebar (or click **Add** to place notes manually)
3. Double-click a note to change its label
4. Switch to **Explore** to browse chords and progressions
5. Switch to **Rhythm** to write tablatures

---

## Project structure

```
index.html              redirect to src/editor.html
src/
  editor.html           app shell
  editor.css            all styles
  js/
    constants.js        colours, chord types, progressions, templates
    theory.js           pitch parsing, MIDI, transpose, enharmonics
    state.js            app state and localStorage keys
    audio.js            tone playback and settings persistence
    render.js           SVG rendering (pan, notes, highlights)
    interaction.js      drag, click, selection, inline editors
    export.js           SVG/PNG/ZIP export, toast notifications
    explore.js          chords & progressions panels, custom builder
    hat-bridge.js       postMessage bridge to the HAT iframe
    ui.js               sidebar wiring, keyboard, resize, init
vendor/
  hat_spec/             HAT editor (submodule)
```

Vanilla JavaScript, no framework, no build step. Every function is global — scripts load in dependency order via `<script>` tags.

---

## License

[GNU AGPL-3.0](LICENSE)
