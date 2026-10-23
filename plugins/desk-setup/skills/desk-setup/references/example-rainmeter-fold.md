# Example: a Rainmeter-style fold, with a weather nickname and song looks

Made-up data throughout. Shows tilt for a fold, a weather nickname, a gradient picked with margin, and
song looks as the finish.

## What get_desk said (trimmed)

- One monitor, `DISPLAY1`, 3440x1440 ultrawide.
- Wallpaper summary: a dark blue nebula, brightness 0.07 overall; `ml` 0.08, `mr` 0.08, `bc` 0.06,
  busyness under 0.3 everywhere. Dominant colors `#0b1026` 61 percent, `#1d2a5c` 22 percent. Dark, but
  not black: not OLED-ish.
- Layout: clock and claude at `bl`, weather at `mr`, meters at `bl`, nowPlaying at `bc`. No tilt anywhere.
- `design.weather.nickname` is `""`, so the weather piece shows the city's full name.

User: "set up my desk, I'm coming off Rainmeter"

## Opening

> An ultrawide with a dark blue nebula, quiet everywhere. Most pieces sit bottom left.
>
> 1. What do you want to see?
> 2. A look, in a few words?
> 3. Coming from Rainmeter: want the left and right stacks slanted like two faces of a fold?

User: "clock and usage on the left, weather and meters on the right, now playing bottom. warm sunset
colors. yes do the fold, like my old setup"

## First proposal

```json
{
  "name": "Sunset fold",
  "note": "Two slanted stacks facing each other across the nebula, in sunset ink.",
  "design": {
    "layout": {
      "clock":      { "anchor": "ml", "size": 1.3, "tilt": -18 },
      "claude":     { "anchor": "ml", "size": 1.0, "tilt": -18 },
      "weather":    { "anchor": "mr", "size": 1.0, "tilt": 18 },
      "meters":     { "anchor": "mr", "size": 1.0, "tilt": 18 },
      "nowPlaying": { "anchor": "bc", "size": 1.0 }
    },
    "ink": ["#ffd08a", "#ff9e7a"],
    "plate": false
  }
}
```

In chat:

```text
- left stack (clock, usage) at ml, slanted -18; right stack (weather, meters) at mr, +18: the fold.
- every piece in a stack gets the same tilt; the Desk slants the stack, not the piece.
- now playing upright at bc: the hinge between the two faces.
- ink #ffd08a to #ff9e7a: sunset gold to coral. Coral reads 4.0:1 on 0.08; the redder #ff7e5f would
  only reach 3.2, too close to the line.
```

Answer: `previewing`.

## Feedback round

User: "love it. weather says 'Springfield Regional Airport Weather Station' lol, call it home"

```json
{ "note": "The weather piece now says home; the forecast still uses your city.",
  "design": { "weather": { "nickname": "home" } } }
```

```text
- weather nickname "home": it stays on this PC, the forecast keeps the real place.
```

User: "slant is a bit much"

```json
{
  "note": "The fold eased from 18 to 12 degrees on both faces.",
  "design": {
    "layout": {
      "clock":   { "anchor": "ml", "size": 1.3, "tilt": -12 },
      "claude":  { "anchor": "ml", "size": 1.0, "tilt": -12 },
      "weather": { "anchor": "mr", "size": 1.0, "tilt": 12 },
      "meters":  { "anchor": "mr", "size": 1.0, "tilt": 12 }
    }
  }
}
```

Both faces change together, so the fold stays symmetric. They press Apply.

## The finish

Now playing sits at the hinge of the fold, so offer song looks:

> Want looks for a few songs you play? Name two or three and I'll give each one its own gradient on the
> now playing line.

User: "Nightcall by Kavinsky, Sunset by The Midnight"

The obvious Nightcall pair, hot pink `#ff2a6d` to cyan, fails here: the pink reads 2.6:1 on the 0.06
under `bc`. Lift the pink to `#f472b6` (3.6:1) and keep the cyan `#05d9e8` (5.5:1).

```json
{
  "looks": [
    { "title": "Nightcall", "artist": "Kavinsky", "ink": ["#f472b6", "#05d9e8"], "style": "smallcaps",
      "mood": "night drive" },
    { "title": "Sunset", "artist": "The Midnight", "ink": ["#fbbf24", "#ff9e7a"], "style": "italic",
      "mood": "last light" }
  ],
  "note": "Two looks in your fold's palette, each 3:1 or better on the nebula."
}
```

If the answer says `style_on` false, tell them: Settings, Now playing, Looks, Style what's playing.
