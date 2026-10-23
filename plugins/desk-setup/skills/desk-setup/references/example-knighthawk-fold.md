# Example: a Rainmeter-style fold, like a Knighthawk suite

Made-up data throughout. Shows carrying a Rainmeter suite's look (not its code) onto the Desk: a fold of
two stacks on a black second screen, slim meters, a theme from the suite's palette, the weather
nickname, and a Launcher button where the suite had a logo.

User: "I'm moving off Rainmeter. Can you rebuild my Knighthawk setup on the second screen?"

## What get_desk said (trimmed)

- Monitors: `DISPLAY1` (main) and `DISPLAY2` (2560x1440, left of it).
- DISPLAY2 wallpaper: brightness 0.01, dominant `#020203` at 98 percent, busyness 0.0. Black.
- Layout: the default spread on all monitors, no tilt.
- `limits` lists piece styles `bar`, `slim`, `ring`, `ticks`. (If it didn't, see the end.)
- Fonts installed include the user's own hand-drawn face, "Hawk Hand", and the bundled EsteFont Pro.
- `start_menu_apps` includes `{id: "Chrome", name: "Google Chrome"}` and
  `{id: "Spotify", name: "Spotify"}`.

## Opening: the look, not the skin

> I can carry over how Knighthawk looks: its colors, fonts, the fold and what sits where. I don't read
> or run the skin itself. Paste a screenshot or describe it, whichever is quicker.
>
> 1. Is "Hawk Hand" the suite's font, and is it yours?
> 2. Is the second screen an OLED panel?
> 3. The weather in Knighthawk showed which place? I can give it a short nickname here.

User (with a screenshot): "yes my own font. not OLED. it's a fold, clock date weather and music on the
right, cpu ram and my claude bars on the left, blue on black, little logo button that opens my
dashboard in chrome. call the weather home"

From the screenshot: ink a mid blue near `#3c6ed2`, a brighter `#0050ff` glow, a navy base `#000a28`,
thin bars, the left face rising toward a spine and the right face falling away from it.

Say what doesn't carry, once:

```text
Carries: the palette, your font, the fold, the pieces, thin bars, a button for the logo.
Doesn't: the audio visualiser bars (the Desk draws no system audio), the glowing spine line, the
per-letter gradients, and the GPU and top-process readouts. The logo's own target was a program path;
on the Desk the button opens Chrome from your Start menu instead, and you can add the logo image to it
yourself in the Launcher's image picker.
```

## First proposal: the theme

The suite's palette as a widget theme, so the Sanduhr widget matches the Desk:

```json
{
  "theme": {
    "name": "Night Blue",
    "bg": "#000a28", "glass": "#06123a", "glass_on_mica": "#030c2e", "title_bg": "#000a28",
    "border": "#1c2c5c", "footer_bg": "#000a28", "bar_bg": "#0c1a48",
    "text": "#dfe8ff", "text_secondary": "#a8bdf0", "text_dim": "#7d93c8", "text_muted": "#5c70a0",
    "accent": "#0050ff", "pace_marker": "#ffb020", "sparkline": "#0050ff",
    "border_tint": "#0050ff"
  },
  "save_as": "night-blue"
}
```

```text
- base #000a28 and accent #0050ff straight from the suite; text a pale blue of the same hue.
- pace marker #ffb020: orange, so it shows on every bar fill.
```

If the lint rejects a field, fix that field and send again.

## Second proposal: the fold

An import is one look the user already knows, so the whole fold goes in one call; tweaks after it
stay small.

```json
{
  "name": "Night fold",
  "note": "Your fold on the black screen: bars rising on the left, clock and weather falling on the right.",
  "design": {
    "layout": {
      "telemetry":  { "anchor": "ml", "size": 1.0, "monitor": "DISPLAY2", "tilt": -17, "style": "slim" },
      "meters":     { "anchor": "ml", "size": 1.0, "monitor": "DISPLAY2", "tilt": -17, "style": "slim" },
      "launcher":   { "anchor": "ml", "size": 0.8, "monitor": "DISPLAY2", "tilt": -17 },
      "clock":      { "anchor": "mr", "size": 1.4, "monitor": "DISPLAY2", "tilt": 17 },
      "weather":    { "anchor": "mr", "size": 1.0, "monitor": "DISPLAY2", "tilt": 17 },
      "nowPlaying": { "anchor": "mr", "size": 1.0, "monitor": "DISPLAY2", "tilt": 17 }
    },
    "font": "Hawk Hand",
    "ink": ["#a8c4ff", "#5b8def"],
    "plate": false,
    "weather": { "nickname": "home" },
    "launcher": {
      "orientation": "row",
      "buttons": [ { "kind": "app", "target": "Chrome", "label": "dash", "glow": "#0050ff" } ]
    }
  }
}
```

In chat:

```text
- left face at ml, tilt -17: telemetry and your usage meters as slim 4 px bars, and the logo's button.
- right face at mr, tilt +17: clock, weather and now playing. One slant per stack, so each face is a stack.
- Hawk Hand, your own font, everywhere.
- ink #a8c4ff to #5b8def: the suite's blue lifted so thin handwriting strokes hold up. The original
  #3c6ed2 would pass at 3.6:1, but these read at 10:1 and 5.4:1 on black.
- #0050ff kept as the button's glow, where it isn't text.
- plate off: on black it adds nothing.
- weather shows "home"; the forecast still uses the place you picked in Sanduhr.
```

Answer: `previewing`. Then iterate as usual. Moving the date: `propose_desk` has no date field. If
their clock shows a date, it rides the clock on the right face.

## If the build has no meter styles yet

If `get_desk` shows no styles, send the same proposal without the two `style` fields, and say:

```text
Your bars will be the standard ones for now; slim 4 px bars come with a Sanduhr update, and I can
switch them then.
```

## The finish

The fold is the finish here. If they want more, offer song looks for the right face (the songs they
play, each stop 3:1 or better on black), not a sprite; a companion would crowd the fold.
