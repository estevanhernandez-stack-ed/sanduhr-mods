# desk-setup evals

`claude plugin eval` cases for the desk-setup skill. Each case is one prompt against a mocked Sanduhr MCP server and checks
one rule the skill states: read the Desk first, ask before designing, check 3:1 before sending, OLED care, no images, no
Anthropic marks in a pack, Launcher targets only from `start_menu_apps`, `style` only on a build that has it, and stopping
when Sanduhr isn't running.

Every case also runs `prose-guard`, a free regex grader on the final reply: the standard and conclusion patterns of
`/vibe-thesis:guard` (inflationary words, self-praise framings) plus the banned corporate phrases from the 626 voice rules.
Keep it in step with those two lists when they change.

```
claude plugin eval plugins/desk-setup --trust-plugin --no-publish -j 8 --max-cost-usd 15
```

The default runs each case 3 times with the plugin and 3 without it, and reports the difference. A full run takes about
7 minutes and cost about $9 on 2026-11-13. Not in CI: it needs a Claude login and spends real money.

## What the mocks are

- `mocks/sanduhr/_tools.json` is the real `tools/list` of the Windows Sanduhr MCP server (4.8.0), trimmed to the seven Desk
  tools, so the model sees the actual tool descriptions the skill calls "the contract". Refresh it when those tools change.
- `mocks/sanduhr/fixtures/two-screens.json` is a made-up `get_desk` answer: a bright, busy main screen and a near-black
  second one. Some cases swap in their own fixture (`missing`, `neon-applied`, `no-styles`).
- Every `propose_*` answers `previewing`.

A case is a single prompt: `claude plugin eval` doesn't script follow-up replies, so the multi-round parts of the skill
(iterate on the preview, Apply, then the finish) are each tested from a prompt that states where the conversation stands.

## The Mac suite

`../evals-mac/` holds the Mac Desk cases, run with their own mocks because the Mac server's tool descriptions differ:

```
claude plugin eval plugins/desk-setup --eval-dir evals-mac --trust-plugin --no-publish -j 6 --max-cost-usd 8
```

- `evals-mac/mocks/sanduhr/_tools.json` is the Mac Sanduhr MCP server's `tools/list` (2.43.2), the same seven Desk tools.
- `fixtures/mac-one-screen.json` is a made-up `desk-state.json` passed through the Mac server's own `get_desk`: no
  `monitors`, `wallpaper`, `start_menu_apps`, `designs` or `direct`, which is how the skill tells the Mac Desk apart.
- The cases check the Mac branch of the skill: ask about the wallpaper instead of which screen, send no `monitor`,
  `launcher`, `glow` or ink word, and put a message line through `propose_desk_messages`.

