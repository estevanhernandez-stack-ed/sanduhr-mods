---
name: desk-setup
description: Set up a person's Sanduhr Desk with them as a short conversation, from reading the screen to a finishing widget. Use when the user asks to set up, design, redo or tidy their Desk or desktop, wants Sanduhr widgets on a screen, mentions moving off Rainmeter, asks for a desk pet, companion or sprite to match their setup, or says something like "make my second monitor look good". Needs the Sanduhr MCP tools (get_desk, propose_desk); without them, say what is missing and stop.
---

# Desk setup

Set up the user's Sanduhr Desk as a conversation: read the screen, ask a few short questions, propose
a small look, adjust it on the live preview until the user likes it, then offer the one widget that
finishes it. The user presses Apply on every change. Your job is good proposals and one-line reasons.

## Before anything

- **Find the tools.** This skill drives the Sanduhr MCP server (`mcp__sanduhr__*`): `get_desk`,
  `propose_desk`, and for the finish `propose_widget`, `propose_now_playing_looks`, `propose_theme`,
  `propose_desk_messages`. If `get_desk` is missing, tell the user the Desk tools come with Sanduhr for
  Windows 3.7 or later (with its Claude Code integration installed) and stop. If `propose_widget` is
  missing, skip the widget step; it arrived in 3.8.
- **Call `get_desk` first, every session.** Design from what it returns, never from memory. If it
  answers `no_data` with reason `missing`, Sanduhr isn't running or its integration isn't installed:
  say so and stop.
- **Read the tool descriptions.** They are the contract (fields, ranges, the pixel-sheet grammar).
  When this file and a tool description disagree, the tool description wins.

## Rules that do not bend

1. **Nothing lands without the user's Apply.** Every proposal previews live with an Apply / Dismiss bar.
   `previewing` means the user is looking at it now: wait for their word, and don't send the same look
   again. `applied` means they allow direct changes for designs; say what changed and that Put my Desk
   back undoes it. Widgets always wait for Apply, whatever that switch says.
2. **You never supply images.** No PNGs, no image links, no Launcher button images. Sprites are pixel
   sheets written as data; anything else is the user's own art, added in Settings, Widgets, Use my
   own art.
3. **No Anthropic marks in widget packs.** No "claude" or "anthropic" anywhere and no "opus", "sonnet",
   "haiku" or "fable" as words in any id, name, description, author, file name or string. The author is
   "Made here" unless the user names themselves. Original art only: no studio or game characters.
4. **Keep each proposal small.** One idea per call: a layout pass, then ink, then the Launcher. Send
   only the fields that change. Each change gets one line of why, in the `note` and in chat.
5. **Respect 3:1.** Every placed piece's ink must reach a WCAG contrast of 3:1 against the wallpaper
   under its anchor, on every monitor it shows on. Check before you send (below); a `rejected` answer
   names the field to fix, so fix that field and call again.
6. **OLED screens get OLED care.** See the OLED section; say it once, plainly, then respect it.

## The conversation

### 1. Read the room (no questions yet)

From `get_desk`, note for yourself:

- **Monitors**: ids, which is main, and per monitor the brightness and busyness behind each of the
  eight anchors (`tl tc tr ml mr bl bc br`) in `wallpaper.summary`.
- **OLED-ish screens**: a monitor whose overall brightness is under about 0.05 with a near-black
  dominant color is almost certainly a black wallpaper, often on an OLED panel. Ask, don't assume.
- **Quiet anchors**: low busyness and a steady brightness. Text sits best there. Busy anchors want the
  plate or a different spot.
- **What's already placed** in `design.layout`, the font and ink in use, saved `designs`, and `direct`.
- **Fonts** installed, plus the bundled EsteFont Pro and EsteFont 26.
- **`start_menu_apps`**: the only apps a Launcher button may open. Absent means Sanduhr hasn't read the
  Start menu yet; offer links instead, or wait.

Open with one or two sentences of what you saw ("Two screens: a bright photo on the main one, near-black
on the second. The clock and usage sit top left on both."), then the questions.

### 2. Ask a few short questions

Ask at most four, in one message, numbered so the user can answer in one line:

1. **Which screen** gets the Desk: main, the second one, or all? (Skip with one monitor.)
2. **What to see**: clock, usage, weather, the message, now playing, the Launcher, watchers, the companion.
   Offer the two or three that fit what they told you, not the whole list.
3. **The look**, in a few words: "neon", "quiet", "newspaper", "terminal green". A song or a game is a
   fine answer.
4. **OLED or not** (ask only when a screen reads OLED-ish), and **a fold** (ask only when they mention
   Rainmeter, a corner suite or "two sides"): a slant on the left and right stacks like two faces of a cube.

Don't ask what `get_desk` already told you. If they answer half, design with defaults for the rest and say
which defaults you picked.

### 3. Propose the first look

One `propose_desk` call, small: the pieces they asked for, placed on quiet anchors of the chosen monitor,
the font and ink that fit the vibe. Name it (`name`, up to 40 characters) and give the `note` one
sentence. In chat, one line per change:

```text
- clock and usage at ml on the second screen: the quietest spot, and it reads first.
- ink #22d3ee to #a855f7: the neon you asked for; the violet end still reads 3.8:1 on that black.
- plate off: the wallpaper is already black, so it adds nothing.
```

Field notes:

- **layout**: `{piece: {anchor, size, hidden, monitor, tilt}}`. Piece keys come from `get_desk pieces`
  (in 3.8: `message`, `clock`, `claude`, `meters`, `nowPlaying`, `telemetry`, `weather`, `watchers`,
  `launcher`, `meetings`, `glow`, `companion`); use the list the user's build returns;
  sizes 0.6 to 1.6 (1.0 to 1.2 reads well; a hero clock can go 1.4). Put a piece on one monitor by id
  instead of `all` when the user picked a screen.
- **tilt (the fold)**: -20 to 20 degrees, and it slants the whole stack at that anchor, so every piece at
  one anchor takes the same tilt (two tilts in one stack are refused). For a fold, the left stack around
  -15 to -18 and the right stack at the same number positive. Upright everything else.
- **weather.nickname**: up to 24 characters ("home", "the lake"). Offer it when the weather piece shows a
  long or private place name. It stays on the PC; the forecast keeps the real city.
- **font**: a family from `fonts.installed` or a bundled EsteFont. A font they lack goes as
  `{family, link}` with an https link; the answer is then `needs_font` and Apply waits for the install.
- **ink**: `auto`, `light`, `dark`, `theme`, one `#rrggbb`, or 2 to 4 for a left-to-right gradient. Keep
  gradients to 2 or 3 neighbouring hues.
- **plate**: a soft panel behind each stack (black at 30 percent behind light ink, white behind dark
  ink). Turn it on for busy wallpaper; leave it off on black screens.
- **launcher**: up to 8 buttons, `{kind: app, target: <id from start_menu_apps>, label, glow}` or
  `{kind: link, target: https://..., label}`. No command lines. Pick the apps they named or the obvious
  ones they use; never guess an id.
- **style (meter styles)**: `layout.<piece>.style` is one of `bar`, `slim` (4 px bars), `ring` or
  `ticks`, for the pieces that draw bars (such as `meters`, `claude`, `telemetry`; trust what `get_desk`
  says over this list). It lands in 3.8, so check
  first: send `style` only when `get_desk` shows it (a style in `design.layout`, or styles in `limits`).
  When it doesn't, leave the field out, propose the rest, and tell the user in one line that slim bars
  arrive with a Sanduhr update. Slim suits minimal and Rainmeter-style looks, ring a corner badge, ticks
  a gauge feel. If a proposal with `style` comes back `rejected` on that field, drop it and send again.

### Checking 3:1 before you send

`wallpaper.summary` brightness is relative luminance, 0 to 1. Contrast is
`(lighter + 0.05) / (darker + 0.05)` with the ink's relative luminance. So light ink needs a luminance of
at least `3 x (brightness + 0.05) - 0.05`, and dark ink at most `(brightness + 0.05) / 3 - 0.05`. Quick guide:

| Background brightness | Ink that passes |
|---|---|
| under 0.03 (black, OLED) | most saturated colors (luminance 0.10 or more); deep blues and purples fail |
| 0.03 to 0.10 | bright ink, luminance 0.19 to 0.40 or more |
| 0.10 to 0.30 | hard either way: turn the plate on, move the piece, or pick a quieter anchor |
| over 0.30 | dark ink (luminance 0.07 or less at 0.30), or the plate with light ink |

Reference luminances: `#22d3ee` 0.53, `#a855f7` 0.22, `#ec4899` 0.25, `#ffd08a` 0.68, `#f0f0f0` 0.87,
`#111111` 0.01. Check every gradient stop, not just the first; the darkest stop decides. `auto` ink picks its own and isn't judged. The message,
glow and companion are skipped by the check; the Launcher only when its buttons have labels.

### 4. Iterate on the live preview

The user sees the design on the desktop while you talk. Take their feedback literally and change only
what they named: "clock bigger" is one `layout.clock.size`, not a new design. Before a new proposal,
say what you will change in one line. If they Dismiss, ask what missed instead of guessing again. Two or
three rounds is normal; past five, offer to save what works and stop.

When they Apply, say it's saved and Settings ▸ Desk ▸ designs (or Put my Desk back) returns them to the
previous look.

### 5. Offer the finish

Once the look is applied, offer one thing that would finish it, the one that fits best:

- **A companion** (`propose_widget`, kind `sprite`): a small pixel-art creature in the design's palette
  that lives on the chosen screen. Read [references/pixel-sprites.md](references/pixel-sprites.md) before
  drawing one. Then place it with `propose_desk` (`layout.companion`) after they Apply the pack, if it
  isn't the companion already.
- **Song looks** (`propose_now_playing_looks`): when now playing is on the Desk and they named songs or
  artists. Each color keeps 3:1 against the wallpaper under the now playing piece. If the answer says
  `style_on` false, tell them Settings, Now playing, Looks.
- **A palette pack** (`propose_widget`, kind `palette`): the design's gradients saved as named inks they
  can pick later.
- **A Desk message** (`propose_desk_messages`, mode `add`): one short handwritten line in their voice,
  when the message piece is placed.
- **A widget theme** (`propose_theme`): when the Sanduhr widget itself clashes with the new Desk.
- **A Claude Code mod**: when what they want lives in Claude Code (a band, a status line), point them at
  the `plugin-authoring` skill or a mod in this marketplace rather than building it here.

Offer one, maybe two. Don't run the list.

## Coming from Rainmeter

When the user mentions Rainmeter (or a suite by name), offer to carry over **the look**, not the skin:

- Ask them to describe it or share a screenshot: fonts, colors, the slant, what sits where. Reading a
  screenshot they paste is fine; reading their skin folder is not needed and not offered.
- Translate the look into Sanduhr's own pieces: the palette into `propose_theme` (and the Desk ink),
  the slant into a fold of two stacks (one tilt per stack, so a fold is a left stack at about -17 and a
  right one at about +17), bars into `slim` meters when the build has styles, a logo button into a
  Launcher button, a weather or now-playing skin into the `weather` and `nowPlaying` pieces.
- Say what doesn't carry: audio visualisers (the Desk draws no system audio), per-letter gradients
  and inline shadows (the Desk inks a whole piece), glowing lines and shapes, GPU and process readouts.
  One line, then move on.
- **Never parse or run skin code**: no `.ini` measures, plugins, Lua or bangs, and no skin's program
  paths as Launcher targets. Launcher targets come from `start_menu_apps` or https links only.
- **Fonts and art only when they are the user's.** Their own hand-drawn font, installed, is fine to
  name in `font`. Someone else's skin art or fonts aren't yours or theirs to import: suggest an
  installed font that's close. A logo image goes on a Launcher button only through the Launcher's own
  image picker, by the user.
- Coordinates, monitor positions, latitude and longitude in a skin are the home's numbers, not the
  look. Don't carry them; place by anchor and pick the weather place in Sanduhr.

See [references/example-knighthawk-fold.md](references/example-knighthawk-fold.md).

## OLED screens

When the user says yes to OLED (or the screen is black and they haven't said no), say this once, short:

- Turn on **OLED care** in Settings ▸ Desk: it drifts the pieces a few pixels over time, dims them when
  you're away, and holds nothing at pure white.
- Keep ink saturated and off white (`#f0f0f0` at most, colors preferred), thin fonts over heavy ones,
  sizes near 1.
- Plate off: on black it adds no contrast, and a white plate behind dark ink lights a block of pixels.
- A roaming companion and `{shimmer}` or `{sweep}` effects used sparingly are fine; a static bright block
  in one place all day is what burns.

Design to it without lecturing: pick colors that pass on black, leave the plate off, and mention the care
setting in the first proposal's notes only.

## When something goes wrong

- **`rejected`**: read each `{field, message}`, fix exactly those fields, call again, and tell the user
  in one line what you changed. Don't argue with the validator.
- **`needs_font`**: give them the link and wait; nothing applies until the font is installed.
- **`queued`**: Sanduhr didn't answer, so it isn't running. Ask them to start it; the proposal shows when
  it does.
- **The user wants an image** (a logo button, a photo sprite): say you can't supply images, and point
  them at Settings ▸ Widgets ▸ Use my own art (sprites) or the Launcher's image picker (buttons).

## Worked examples

- [references/example-neon-column.md](references/example-neon-column.md): a neon column on a black
  second screen, OLED, with a companion.
- [references/example-minimal-launcher.md](references/example-minimal-launcher.md): a minimal clock and
  Launcher on a busy photo wallpaper.
- [references/example-knighthawk-fold.md](references/example-knighthawk-fold.md): a Rainmeter-style
  fold, like a Knighthawk suite, on a black second screen: slim meters, a launcher for the logo.
- [references/example-sunset-fold.md](references/example-sunset-fold.md): a fold on a dark wallpaper
  with a weather nickname and song looks.
