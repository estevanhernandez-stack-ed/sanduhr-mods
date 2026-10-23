# Pixel sprites for propose_widget

A companion is a pack of kind `sprite`: `sprite.json` (schema_version 2) plus one or more pixel sheets,
all as data. The `propose_widget` description is the contract; this file is the short version and one
example that passes the catalog's validator.

## The grammar

- **sheet**: `{palette, frame_w, frame_h, frames}`.
  - `palette`: 1 to 16 `#rrggbb` colors. Never `#ffffff`; use `#f0f0f0` for the lightest.
  - `frame_w`, `frame_h`: 8 to 32, equal to the sprite's (or the stage's) frame size.
  - `frames`: 1 to 256 frames. Each frame is exactly `frame_h` strings of exactly `frame_w` characters,
    top row first. `.` is transparent; `0`-`9` and `a`-`f` (lowercase) index the palette, and the
    index must be inside it.
- **sprite.json**: `schema_version: 2`, `frame_w`, `frame_h`, `scale` 1 to 4, `fps` 1 to 24, and
  either `sheet` (one `.json` path) or `stages` (1 to 6 growth stages, each with its own sheet).
  - `animations`: all nine are required: `walk`, `sit`, `nap`, `pop`, `cheer`, `worry`, `focus`,
    `sleep`, `celebrate`, each a list of 1 to 64 frame indexes. Frames can be shared.
  - `moods`: `content`, `focused`, `worried`, `exhausted`, `celebrate`, each naming an animation.
  - `triggers`: `needs_you`, `job_passed`, `near_limit`, `idle`, each naming an animation.
  - `roam`: `edges` from `bottom`, `left`, `right`, and `speed_px_s` 5 to 120.
- **pack**: `id` (kebab-case, Sanduhr prefixes `my-`), `name` 1 to 40, `description` 1 to 200,
  optional `version`, `author` (default "Made here"), `license` (default CC0-1.0).
- Every sheet needs a frame for the highest index any animation uses.

## Drawing that reads

- **Draw from the design's palette.** Two or three of the Desk's ink colors, one dark for eyes and
  outline, one accent. Four colors is plenty.
- **Small and chunky.** 12 to 16 pixels square at scale 2 or 3. One-pixel details vanish; eyes are a
  pixel or two of the darkest color.
- **A silhouette first.** An outline color around the body keeps it readable on any wallpaper; the
  companion isn't checked for contrast, so make sure it reads on the screen it lives on.
- **Few frames, reused.** Four frames cover all nine animations: standing, a step (walk needs two or
  more frames), eyes closed (nap, sleep, worry), arms up (pop, cheer, celebrate).
- **Original only.** No look-alikes of game or studio characters, no logos, no marks. Plain names:
  "Neon bit", "Pocket moth", "Desk sprout".
- **Stages are optional.** Use them when the user wants it to grow (with coding days, never tokens);
  each stage's `min_growth` starts at 0 and strictly increases up to 1.

Before sending, count: every row the same length, every frame the same number of rows, every
character `.` or a valid index. The validator rejects a single wrong row, so it's faster to count first.

## Example: Neon bit

A 12 by 12 companion for the neon column example: cyan outline, violet body, dark eyes, pink cheeks
and feet. Four frames: stand, step, eyes closed, arms up. This pack passes `validate.py --strict` in
the sanduhr-widgets catalog.

```json
{
  "kind": "sprite",
  "pack": {
    "id": "neon-bit",
    "name": "Neon bit",
    "description": "A small cyan and violet companion that hops along the bottom edge.",
    "license": "MIT"
  },
  "sprite": {
    "schema_version": 2,
    "frame_w": 12,
    "frame_h": 12,
    "scale": 3,
    "fps": 6,
    "sheet": "sheet.json",
    "animations": {
      "walk": [0, 1],
      "sit": [0],
      "nap": [2],
      "pop": [3, 0],
      "cheer": [3, 0, 3, 0],
      "worry": [2, 0],
      "focus": [0],
      "sleep": [2],
      "celebrate": [3, 0, 3, 0, 3]
    },
    "moods": {
      "content": "sit",
      "focused": "focus",
      "worried": "worry",
      "exhausted": "sleep",
      "celebrate": "celebrate"
    },
    "triggers": {
      "needs_you": "pop",
      "job_passed": "cheer",
      "near_limit": "worry",
      "idle": "nap"
    },
    "roam": {
      "edges": ["bottom"],
      "speed_px_s": 20
    }
  },
  "sheets": {
    "sheet.json": {
      "palette": ["#22d3ee", "#a855f7", "#0b0b14", "#ec4899"],
      "frame_w": 12,
      "frame_h": 12,
      "frames": [
        [
          "....0000....",
          "..00111100..",
          ".0111111110.",
          ".0112112110.",
          ".0112112110.",
          ".0111111110.",
          ".0311111130.",
          ".0111111110.",
          "..01111110..",
          "...000000...",
          "...3....3...",
          "..33....33.."
        ],
        [
          "....0000....",
          "..00111100..",
          ".0111111110.",
          ".0112112110.",
          ".0112112110.",
          ".0111111110.",
          ".0311111130.",
          ".0111111110.",
          "..01111110..",
          "...000000...",
          "....3..3....",
          "...33..33..."
        ],
        [
          "............",
          "....0000....",
          "..00111100..",
          ".0111111110.",
          ".0111111110.",
          ".0122122110.",
          ".0311111130.",
          ".0111111110.",
          "..01111110..",
          "...000000...",
          "...3....3...",
          "..33....33.."
        ],
        [
          "3...0000...3",
          "3.00111100.3",
          "301111111103",
          ".0112112110.",
          ".0112112110.",
          ".0111111110.",
          ".0311111130.",
          ".0111111110.",
          "..01111110..",
          "...000000...",
          "..3......3..",
          "............"
        ]
      ]
    }
  },
  "note": "A 12-pixel companion in the Desk's cyan and violet, sized to sit under the column."
}

```

After the user presses Apply, the answer says whether it became the companion. If it didn't, or the
companion piece isn't placed, place it with `propose_desk`: `layout.companion` at a bottom anchor of the
screen they picked.
