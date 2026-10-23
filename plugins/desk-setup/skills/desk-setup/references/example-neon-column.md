# Example: a neon column on a black second screen

Made-up data throughout. Shows the OLED path, a single-screen layout, a gradient checked against 3:1 and
a companion as the finish.

## What get_desk said (trimmed)

- Monitors: `DISPLAY1` (main, 2560x1440) and `DISPLAY2` (1920x1080, right of it).
- Wallpaper summary: DISPLAY1 brightness 0.42, a bright city photo, busyness 0.5 to 0.7 at most anchors.
  DISPLAY2 brightness 0.01, dominant color `#050505` at 97 percent, busyness 0.0 everywhere.
- Layout: clock, claude and meters at `bl` on all monitors; nowPlaying at `bc`; plate off; ink `auto`.
- Fonts include JetBrains Mono and the bundled EsteFont Pro. `direct` is false.

## Opening

> Two screens: a bright city photo on the main one, near-black on the second. Everything sits bottom
> left on both right now.
>
> 1. Put the Desk on the second screen only?
> 2. What do you want to see: the clock, your usage meters, now playing?
> 3. A look, in a few words?
> 4. That second screen reads black. Is it an OLED panel?

User: "1 yes 2 all three 3 neon, synthwave-ish 4 yes it's OLED"

## First proposal

Middle left is the quietest anchor and reads first for a screen to the right of the main one; a column
there leaves the rest of the black alone.

```json
{
  "name": "Neon column",
  "note": "Clock, meters and now playing in one neon column on the black screen; plate off for OLED.",
  "design": {
    "layout": {
      "clock":      { "anchor": "ml", "size": 1.4, "monitor": "DISPLAY2" },
      "meters":     { "anchor": "ml", "size": 1.0, "monitor": "DISPLAY2" },
      "nowPlaying": { "anchor": "ml", "size": 1.0, "monitor": "DISPLAY2" },
      "claude":     { "hidden": true }
    },
    "font": "JetBrains Mono",
    "ink": ["#22d3ee", "#a855f7"],
    "plate": false
  }
}
```

In chat:

```text
- clock, meters and now playing stacked at ml on the second screen: the quietest spot, one column.
- the usage card hidden: the meters already show it, and less lit area is kinder to OLED.
- JetBrains Mono: thin strokes, a terminal feel that fits synthwave.
- ink #22d3ee to #a855f7: neon cyan to violet; the violet end reads 3.8:1 on that black.
- plate off: on black it adds no contrast.
Also: turn on OLED care in Settings > Desk. It drifts the pieces, dims them when you're away and holds
nothing at pure white.
```

Answer: `previewing`. Wait.

## Feedback round

User: "clock is huge. and can the gradient go pink at the end"

Two changes, nothing else:

```json
{
  "note": "Clock down a step, and the gradient now ends in hot pink.",
  "design": {
    "layout": { "clock": { "anchor": "ml", "size": 1.2, "monitor": "DISPLAY2" } },
    "ink": ["#22d3ee", "#a855f7", "#ec4899"]
  }
}
```

```text
- clock 1.4 to 1.2.
- third stop #ec4899: pink at 4.3:1 on black, still passes.
```

User presses Apply. Answer: `applied`. Say it's saved and Put my Desk back returns the old look.

## The finish

> Want a little companion for that screen? I can draw a 12-pixel neon creature in the same cyan, violet
> and pink that hops along the bottom edge. It installs only if you press Apply.

User: "yes"

Send the Neon bit pack from [pixel-sprites.md](pixel-sprites.md) with `propose_widget`. After Apply, if
the answer doesn't say it became the companion, place it:

```json
{ "note": "The companion on the black screen, bottom left under the column.",
  "design": { "layout": { "companion": { "anchor": "bl", "size": 1.0, "monitor": "DISPLAY2" } } } }
```
