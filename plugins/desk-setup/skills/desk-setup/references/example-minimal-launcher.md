# Example: a minimal clock and Launcher on a busy wallpaper

Made-up data throughout, ids included. Shows the plate on a busy photo, a Launcher built only from
`start_menu_apps`, and recovering from a `rejected` answer.

## What get_desk said (trimmed)

- One monitor, `DISPLAY1`, 1920x1080.
- Wallpaper summary: a forest photo, brightness 0.33 overall. Per anchor: `tl` 0.30 busy 0.80,
  `tc` 0.62 busy 0.35 (sky), `tr` 0.35 busy 0.70, `bl` 0.28 busy 0.75, `br` 0.31 busy 0.85.
- Layout: everything placed; clock, claude, meters, message, weather, nowPlaying all visible. Ink `auto`.
- `start_menu_apps` (trimmed): `{id: "Spotify", name: "Spotify"}`, `{id: "Terminal!App", name: "Terminal"}`,
  `{id: "Obsidian", name: "Obsidian"}`, `{id: "Steam", name: "Steam"}`.

## Opening

> One screen, a forest photo: mid-bright and busy almost everywhere except the sky at top center.
> Right now every piece is on.
>
> 1. What do you want to keep: just a clock? the usage meters too?
> 2. Any apps you'd like one click away? I see Spotify, Terminal, Obsidian and Steam in your Start menu.
> 3. A look, in a few words?

User: "just the clock and a launcher. terminal obsidian spotify. minimal, I like the photo"

## First proposal

The wallpaper sits around 0.30 to 0.35 under the corners: too bright for light ink and too dark for dark
ink at 3:1. The plate fixes that without hiding much of the photo.

```json
{
  "name": "Quiet forest",
  "note": "Just the clock and three apps, on a soft plate so they read over the trees.",
  "design": {
    "layout": {
      "clock":      { "anchor": "tr", "size": 1.2 },
      "launcher":   { "anchor": "tr", "size": 1.0 },
      "claude":     { "hidden": true },
      "meters":     { "hidden": true },
      "message":    { "hidden": true },
      "weather":    { "hidden": true },
      "nowPlaying": { "hidden": true }
    },
    "ink": "#f0f0f0",
    "plate": true,
    "launcher": {
      "orientation": "row",
      "buttons": [
        { "kind": "app", "target": "Terminal!App", "label": "term" },
        { "kind": "app", "target": "Obsidian",     "label": "notes" },
        { "kind": "app", "target": "Spotify",      "label": "music" }
      ]
    }
  }
}
```

In chat:

```text
- everything but the clock hidden: you asked for minimal, and the photo is the point.
- clock and Launcher stacked top right: one corner, so the forest keeps the rest.
- ink #f0f0f0 on the plate: 4.4:1 over the trees there; without the plate it would be 2.3:1.
- three buttons, row: Terminal, Obsidian, Spotify, straight from your Start menu.
```

Answer: `previewing`.

## Feedback round, with a rejection

User: "can the clock go top center, over the sky"

Send only the move:

```json
{ "design": { "layout": { "clock": { "anchor": "tc", "size": 1.2 } } } }
```

Answer: `rejected`, reason on `layout.clock`: the ink would read 2.8:1 against brightness 0.62 with the
plate on; choose a darker ink or move the piece.

Don't argue, and don't send the same thing again. Give the user the choice in one line each:

```text
The sky is too bright for light ink, even on the plate (2.8:1, needs 3). Two ways:
a) keep the clock top right as it is, or
b) top center with dark ink #1c1c1c and the plate off: 10.9:1 on the sky, and the Launcher
   still reads 6.5:1 at top right.
```

Ink and plate are one setting for the whole Desk, so check every placed piece against the new pair, not
just the one that moved. The user picks b), so ink, plate and the move go in one call:

```json
{
  "note": "Clock over the sky in dark ink; plate off, since dark ink reads on the bare photo.",
  "design": {
    "layout": { "clock": { "anchor": "tc", "size": 1.2 } },
    "ink": "#1c1c1c",
    "plate": false
  }
}
```

Answer: `previewing`. They press Apply.

## The finish

The Launcher already finishes a minimal look; a sprite would crowd it. Offer the smallest thing:

> Want a palette pack with both inks we tried, so you can switch back to the top-right look from
> Settings later without asking me?

If yes, `propose_widget` with kind `palette`:

```json
{
  "kind": "palette",
  "pack": { "id": "quiet-forest-inks", "name": "Quiet forest inks",
            "description": "Dark ink for the bare sky, light ink for the plate over the trees." },
  "palettes": [
    { "name": "sky-dark",    "colors": ["#1c1c1c"], "mood": "over the sky" },
    { "name": "plate-light", "colors": ["#f0f0f0"], "mood": "on the plate" }
  ],
  "note": "The two inks that pass over your forest, kept for later."
}
```
