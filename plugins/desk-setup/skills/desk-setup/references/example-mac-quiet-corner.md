# Example: the Mac Desk, a quiet corner on one screen

Made-up data throughout. Shows the Mac branch: no screen question, the wallpaper asked about instead of
read, slim meters, a hex ink in place of `auto`, and a Launcher request answered without a proposal.

## What get_desk said (trimmed)

- No `monitors`, no `wallpaper`, no `start_menu_apps`, no `designs`, no `direct`: the Mac Desk.
- Layout: clock and claude at `bl`, nowPlaying at `bc`, everything else hidden. Ink `#ffffff`, plate off.
- `limits.piece_style`: `claude`, `meters`, `telemetry` take `bar`, `slim`, `ring`, `ticks`.
- Fonts installed (trimmed): Helvetica Neue, Avenir Next, Menlo; bundled EsteFont Pro and EsteFont 26.

## Opening

> Your Desk shows the clock and usage bottom left in white EsteFont Pro, with now playing bottom center.
>
> 1. What's behind the Desk: dark, light, a busy photo?
> 2. What to keep: the clock, usage, now playing? Weather or the message?
> 3. A look, in a few words?

User: "dark mountains photo, a bit busy at the bottom. clock and usage only, and a launcher for my apps.
quiet, terminal-ish"

## First proposal

The bottom is busy, so move the stack to the top right, where photos are usually sky. The ink is a
pale green from the user's own description of the photo, with no ratio claimed.

```json
{
  "name": "Quiet corner",
  "note": "Clock and slim usage top right in Menlo, pale green on your dark photo.",
  "design": {
    "layout": {
      "clock":      { "anchor": "tr", "size": 1.1 },
      "claude":     { "anchor": "tr", "size": 1.0, "style": "slim" },
      "nowPlaying": { "hidden": true }
    },
    "font": "Menlo",
    "ink": "#a7f3d0",
    "plate": false
  }
}
```

In chat:

```text
- clock and usage moved top right: you said the bottom is busy, and the sky is usually quieter.
- usage slim: one line over a thin bar, the terminal feel.
- Menlo, ink #a7f3d0: a pale green that should read on a dark photo; tell me if it gets lost.
- plate off: the photo is dark, so light ink doesn't need it. If the corner turns out busy, I'll turn it on.
- no Launcher: the Mac Desk doesn't have one yet, so there's nothing to propose for it.
```

Answer: `previewing`. It waits for Apply, as every Mac design does.

## After Apply

> It's on. Settings ▸ Desk ▸ Put my Desk back undoes it if you change your mind.

## The finish

A terminal look with no message line is the opening for a Desk message. Offer one line through
`propose_desk_messages` (mode `add`), not as a `messages` field, which the Mac refuses:

```json
{ "mode": "add", "lines": ["ship it, then sleep"], "note": "One quiet line under the clock." }
```

Then place it with `propose_desk` (`layout.message` at `tr`) once they like the line.
