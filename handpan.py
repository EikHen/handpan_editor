#!/usr/bin/env python3
"""
Handpan layout SVG generator.

Input format (comma-separated):
  - First plain note  = ding (center)
  - Additional plain  = ring notes (top face, zigzag: bottom → right → left → ...)
  - *note             = mutant (inner secondary position between ring notes, near the top)
  - ~note             = bottom note (outer satellite around the perimeter)

Example – D Kurd 18:
  python3 handpan.py "D3,A3,Bb3,C4,D4,E4,F4,G4,A4,Bb4,~D2,~A2,~Bb2,~C3,~F3,~G3,~C5,~D5" out.svg
"""

import math
import sys


# ---------------------------------------------------------------------------
# Parsing
# ---------------------------------------------------------------------------

def parse_notes(s: str):
    tokens = [t.strip() for t in s.split(',') if t.strip()]
    ding = None
    ring, mutants, bottom = [], [], []
    for token in tokens:
        if token.startswith('~'):
            bottom.append(token[1:])
        elif token.startswith('*'):
            mutants.append(token[1:])
        else:
            if ding is None:
                ding = token
            else:
                ring.append(token)
    return ding, ring, mutants, bottom


def fmt(note: str) -> str:
    """Replace ASCII accidentals with Unicode."""
    return note.replace('#', '♯').replace('b', '♭')


# ---------------------------------------------------------------------------
# Angle helpers  (all angles in radians, SVG convention: 0=right, π/2=down)
# ---------------------------------------------------------------------------

def ring_angles(n: int) -> list:
    """
    Zigzag visit order over n evenly-spaced positions around a circle.
    Starts at bottom (π/2 = 6 o'clock), then alternates right/left going up.
      i=0 → bottom
      i=1 → lower-right   (first right)
      i=2 → lower-left    (first left)
      i=3 → right         (second right)
      …
    All notes land on evenly-spaced angular positions; only visit order differs.
    """
    if n == 0:
        return []
    step = 2 * math.pi / n
    return [math.pi / 2 + ((-1) ** i) * math.ceil(i / 2) * step for i in range(n)]


def mutant_angles(n_ring: int, n_mutants: int) -> list:
    """
    Place mutants at the midpoints of angular gaps between ring positions,
    choosing the gaps closest to the top (12 o'clock), preferring right-of-top.
    """
    if n_mutants == 0:
        return []
    if n_ring == 0:
        step = 2 * math.pi / max(n_mutants, 1)
        return [(3 * math.pi / 2 + i * step) for i in range(n_mutants)]
    step = 2 * math.pi / n_ring
    gaps = [(math.pi / 2 + (k + 0.5) * step) % (2 * math.pi) for k in range(n_ring)]
    top = 3 * math.pi / 2

    def key(a):
        d = abs(a - top) % (2 * math.pi)
        d = min(d, 2 * math.pi - d)
        return (d, 0 if a > top else 1)   # prefer right-of-top on ties

    gaps.sort(key=key)
    return gaps[:n_mutants]


def bottom_angles(n: int) -> list:
    """
    Distribute bottom notes evenly around the full perimeter, starting at
    lower-right (~4 o'clock, 60° in SVG), going counter-clockwise.
    This naturally spaces them around all sides with a loose gap at the bottom.
    """
    if n == 0:
        return []
    start = math.radians(60)           # ~4 o'clock (lower-right)
    step  = 2 * math.pi / n
    return [(start - i * step) % (2 * math.pi) for i in range(n)]


# ---------------------------------------------------------------------------
# SVG element
# ---------------------------------------------------------------------------

def note_el(x, y, r, label_text, font_size, accent, stroke_w=2.5) -> str:
    lbl = fmt(label_text)
    return (
        f'<circle cx="{x:.2f}" cy="{y:.2f}" r="{r}" '
        f'fill="white" stroke="{accent}" stroke-width="{stroke_w}"/>'
        f'\n<text x="{x:.2f}" y="{y:.2f}" '
        f'text-anchor="middle" dominant-baseline="central" '
        f'font-family="Arial, sans-serif" font-size="{font_size}" '
        f'fill="#222">{lbl}</text>'
    )


# ---------------------------------------------------------------------------
# Generator
# ---------------------------------------------------------------------------

def generate_svg(note_string: str) -> str:
    ding, ring, mutants, bottom = parse_notes(note_string)

    W = H = 1000
    cx = cy = 500

    # --- dimensions ---
    pan_r = 320

    ding_r = 80

    ring_orbit = 210   # center of ring-note circles from pan center
    ring_r     = 50    # radius of each ring-note circle
    # n=9 ring: chord = 2·210·sin(π/9) ≈ 143 px  >  diameter 100 → gap 43 ✓
    # n=8 ring: chord = 2·210·sin(π/8) ≈ 161 px  >  diameter 100 → gap 61 ✓
    # ding→ring inner gap: 210 − 50 − 80 = 80 ✓
    # ring outer→pan edge: 320 − 210 − 50 = 60 ✓

    # Mutant orbit: must clear ding AND clear nearest ring note.
    # Worst case: n=9 ring, half-step = 20°.
    # At orbit=128 and ring_orbit=210, θ=20°:
    #   d = sqrt(128²+210²−2·128·210·cos 20°) ≈ 103  >  32+50 = 82 ✓
    # ding→mutant inner gap: 128 − 32 − 80 = 16 ✓
    mutant_orbit = 128
    mutant_r     = 32

    bottom_orbit = 400
    bot_r        = 43
    # outermost pixel: 500 + 400 + 43 = 943 < 1000 ✓
    # leftmost pixel:  500 − 400 − 43 =  57 > 0    ✓

    accent = "#5b8db8"

    # Pan body subtle inner ring (visual reference for note area)
    inner_ring_r = pan_r - 45

    lines = [
        f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" '
        f'viewBox="0 0 {W} {H}">',
        f'<rect width="{W}" height="{H}" fill="white"/>',
        # Outer pan body
        f'<circle cx="{cx}" cy="{cy}" r="{pan_r}" '
        f'fill="#f2f2f2" stroke="#c0c0c0" stroke-width="5"/>',
        # Subtle inner ring to mark note area
        f'<circle cx="{cx}" cy="{cy}" r="{inner_ring_r}" '
        f'fill="none" stroke="#d8d8d8" stroke-width="1.5"/>',
    ]

    def add(el):
        lines.append(el)

    # Ding
    if ding:
        add(note_el(cx, cy, ding_r, ding, 22, accent, stroke_w=3.5))

    # Mutants — at angular gaps between ring notes, near the top
    for angle, note in zip(mutant_angles(len(ring), len(mutants)), mutants):
        x = cx + mutant_orbit * math.cos(angle)
        y = cy + mutant_orbit * math.sin(angle)
        add(note_el(x, y, mutant_r, note, 13, accent, stroke_w=2.0))

    # Ring notes — zigzag from bottom
    for angle, note in zip(ring_angles(len(ring)), ring):
        x = cx + ring_orbit * math.cos(angle)
        y = cy + ring_orbit * math.sin(angle)
        add(note_el(x, y, ring_r, note, 17, accent))

    # Bottom notes — evenly spaced around perimeter, starting lower-right
    for angle, note in zip(bottom_angles(len(bottom)), bottom):
        x = cx + bottom_orbit * math.cos(angle)
        y = cy + bottom_orbit * math.sin(angle)
        add(note_el(x, y, bot_r, note, 15, accent))

    lines.append('</svg>')
    return '\n'.join(lines)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    svg = generate_svg(sys.argv[1])

    if len(sys.argv) >= 3:
        with open(sys.argv[2], 'w') as f:
            f.write(svg)
        print(f"Saved → {sys.argv[2]}")
    else:
        print(svg)
