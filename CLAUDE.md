# sanduhr-mods

> **Persona:** inherits The Architect from the seat's global CLAUDE.md. Project gotchas only below.

Claude Code plugins (mods) published as the `sanduhr-mods` marketplace. `main` is what users install.
The process lives in `CONTRIBUTING.md`; these are the lines that cost something when missed.

## Gotchas

- **This repo is the only source of truth.** Develop in a clone and load with `claude --plugin-dir`.
  Never edit in `~/.claude-personal/plugins/marketplaces/sanduhr-mods/`: a marketplace refresh replaces
  that cache and has wiped unpushed commits. `~/.claude-personal/mods/` is only for mods that never ship.
- **PRs only on `main`.** Merging publishes. CI must be green on Windows and macOS.
- **Version lockstep is three places:** `plugin.json`, `.claude-plugin/marketplace.json`, the README list.
  Any change under `plugins/<name>/` bumps that plugin (tests ship too); `[no-bump]` in the PR title
  only for changes that ship nothing. `python -I tools/check.py --base origin/main` checks all of it.
- **`metadata.requires_sanduhr` in plugin.json** marks a plugin that needs a Sanduhr version. Such a PR is
  labelled `hold-for-release` and merges on that Sanduhr's release day, after the release is live.
  A top-level field fails `claude plugin validate --strict`.
- `claude plugin validate --strict` fails on a missing `author` in plugin.json. Every plugin has one.
- Test fakes see host-resolved paths: on Windows `/System/...` arrives as `C:\System\...`. Compare
  without the drive letter, never skip the test on one OS.
- CRLF working tree, LF index on Windows. Rewrite JSON with the Edit tool or Python, not `sed -i`.
- CI pins the Claude Code CLI (`CLAUDE_CODE_VERSION` in `ci.yml`). Raise it in its own PR, after running
  validate and test locally on the new version.
