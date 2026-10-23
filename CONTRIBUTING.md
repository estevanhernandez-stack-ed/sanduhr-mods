# Contributing

This repository is the only source of truth for every plugin in the `sanduhr-mods` marketplace.
Every change reaches `main` through a pull request with green CI.

## Where to work

- **Develop in a clone of this repo**, on a branch, and load the plugin from it:

  ```
  claude --plugin-dir ./plugins/<name>
  ```

- **Never edit under `~/.claude-personal/plugins/marketplaces/sanduhr-mods/`** (or `~/.claude/plugins/marketplaces/...`).
  That folder is Claude Code's marketplace cache. A marketplace refresh replaces it wholesale, and it has
  already wiped unpushed commits once.
- `~/.claude-personal/mods/` is for mods that will never ship. A mod that might be published starts here,
  in a clone, not there; copying files in by hand is how versions drifted.

## Versions

Each plugin carries its version in three places, and they must agree:

1. `plugins/<name>/.claude-plugin/plugin.json` `version`
2. its entry in `.claude-plugin/marketplace.json`
3. its line in the README's generated list (between `<!-- sanduhr:plugins -->` markers)

Rules, enforced by `tools/check.py`:

- Versions are [semver](https://semver.org). Patch for fixes (tests included: they ship in the plugin
  folder), minor for new behaviour, major for anything that breaks a user's setup or options.
- **A PR that changes any file under `plugins/<name>/` must raise that plugin's version** above the base
  branch's. A change that ships nothing to users (a typo in a comment, say) can skip this with
  `[no-bump]` in the PR title. Use it sparingly: installs only update when the version moves.
- A new plugin needs a folder, a marketplace entry and a README line in the same PR.
- Every `skills/*/SKILL.md` has frontmatter with `name` and `description`.

## Plugins that need a newer Sanduhr

When a plugin depends on a Sanduhr feature, declare the minimum version in `plugin.json` metadata:

```json
{
  "name": "desk-setup",
  "version": "0.1.0",
  "metadata": {
    "requires_sanduhr": "3.8.0"
  }
}
```

`requires_sanduhr` is a full semver string meaning "needs Sanduhr at this version or later". It lives
under `metadata` because `claude plugin validate --strict` accepts that without a warning; a top-level
field or one in the marketplace entry is flagged as unknown, and `tools/check.py` rejects both. Say the
same thing in the plugin's description so people see it before installing.

**Held for a release.** A PR whose plugin needs an unreleased Sanduhr gets the `hold-for-release` label
and stays open with green CI. Merging is the publish: the marketplace serves `main`. On the Sanduhr
release day, after the Sanduhr release is live, update the branch from `main`, let CI go green again and
merge. CI prints a notice for every plugin that declares `requires_sanduhr`, as a reminder.

## Run the checks locally

From the repo root, with the Claude Code CLI on your PATH:

```
python -I tools/check.py --base origin/main     # structure, versions, README, skills, bump
claude plugin validate --strict .               # the marketplace
claude plugin validate --strict plugins/<name>  # one plugin
claude plugin test plugins/<name>               # its *.test.ts(x), if it has any
```

CI (`.github/workflows/ci.yml`) runs the same on `windows-latest` and `macos-latest` for every pull
request and every push to `main`. Tests must pass on both: a fake filesystem path in a test goes through
the host's path resolution, so a Mac path like `/System/...` arrives as `C:\System\...` on Windows.
Compare paths without the drive letter (see `samePath` in `plugins/now-playing/hooks/register.test.tsx`).
