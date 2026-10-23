"""Repository checks for the sanduhr-mods marketplace. Standard library only; run with `python -I`.

    python -I tools/check.py                      # structure, versions, README, skills
    python -I tools/check.py --base origin/main   # also: every changed plugin bumped its version

The bump check is skipped when the PR title (--title, or the PR_TITLE environment variable)
contains [no-bump]. Exit 1 on any error; warnings and notices never fail.
"""

from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MARKETPLACE = ROOT / ".claude-plugin" / "marketplace.json"
PLUGINS = ROOT / "plugins"
README = ROOT / "README.md"
README_START = "<!-- sanduhr:plugins -->"
README_END = "<!-- /sanduhr:plugins -->"
NO_BUMP = "[no-bump]"

# Semantic Versioning 2.0.0, the regex from semver.org.
SEMVER = re.compile(
    r"^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)"
    r"(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?"
    r"(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$"
)

IN_ACTIONS = os.environ.get("GITHUB_ACTIONS") == "true"
errors: list[str] = []


def error(msg: str, file: Path | None = None) -> None:
    errors.append(msg)
    if IN_ACTIONS:
        where = f" file={file.relative_to(ROOT).as_posix()}" if file else ""
        print(f"::error{where}::{msg}")
    else:
        print(f"error: {msg}")


def notice(msg: str) -> None:
    print(f"::notice::{msg}" if IN_ACTIONS else f"note: {msg}")


def load_json(path: Path) -> dict | None:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        error(f"{path.relative_to(ROOT).as_posix()}: cannot read JSON ({exc})", path)
        return None


def semver_key(v: str) -> tuple:
    """Precedence key per semver 2.0: a release outranks its pre-releases; build metadata is ignored."""
    m = SEMVER.match(v)
    assert m
    core = tuple(int(x) for x in m.group(1, 2, 3))
    pre = m.group(4)
    if pre is None:
        return core + ((1,),)
    ids = tuple((0, int(p), "") if p.isdigit() else (1, 0, p) for p in pre.split("."))
    return core + ((0,) + ids,)


def check_structure() -> dict[str, dict]:
    """Marketplace entries and plugin folders match one to one; versions agree and are semver."""
    market = load_json(MARKETPLACE)
    if market is None:
        return {}
    entries = {e.get("name"): e for e in market.get("plugins", [])}
    dirs = {p.name for p in PLUGINS.iterdir() if p.is_dir()} if PLUGINS.is_dir() else set()
    manifests: dict[str, dict] = {}

    for name in sorted(set(entries) - dirs):
        error(f"marketplace lists '{name}' but plugins/{name}/ does not exist", MARKETPLACE)
    for name in sorted(dirs - set(entries)):
        error(f"plugins/{name}/ is not listed in .claude-plugin/marketplace.json", MARKETPLACE)

    for name in sorted(set(entries) & dirs):
        entry = entries[name]
        if entry.get("source") not in (f"./plugins/{name}", f"plugins/{name}"):
            error(f"marketplace entry '{name}' has source {entry.get('source')!r}, expected './plugins/{name}'", MARKETPLACE)
        if "requires_sanduhr" in json.dumps(entry):
            error(f"marketplace entry '{name}': requires_sanduhr belongs in plugins/{name}/.claude-plugin/plugin.json under metadata", MARKETPLACE)

        path = PLUGINS / name / ".claude-plugin" / "plugin.json"
        if not path.is_file():
            error(f"plugins/{name}/.claude-plugin/plugin.json is missing", path)
            continue
        manifest = load_json(path)
        if manifest is None:
            continue
        manifests[name] = manifest

        if manifest.get("name") != name:
            error(f"plugins/{name}: plugin.json name is {manifest.get('name')!r}, expected '{name}'", path)
        version = manifest.get("version")
        if not isinstance(version, str) or not SEMVER.match(version):
            error(f"plugins/{name}: plugin.json version {version!r} is not semver", path)
        if entry.get("version") != version:
            error(f"plugins/{name}: plugin.json version {version!r} != marketplace version {entry.get('version')!r}", MARKETPLACE)

        meta = manifest.get("metadata", {})
        if "requires_sanduhr" in manifest:
            error(f"plugins/{name}: requires_sanduhr goes under metadata, not at the top of plugin.json", path)
        req = meta.get("requires_sanduhr") if isinstance(meta, dict) else None
        if req is not None:
            if not isinstance(req, str) or not SEMVER.match(req):
                error(f"plugins/{name}: metadata.requires_sanduhr {req!r} is not semver (e.g. \"3.8.0\")", path)
            else:
                notice(f"{name} {version} needs Sanduhr >= {req}: merge on that Sanduhr's release day, not before")

    return manifests


def check_readme(manifests: dict[str, dict]) -> None:
    text = README.read_text(encoding="utf-8")
    if README_START not in text:
        return
    if README_END not in text:
        error(f"README.md has {README_START} but no {README_END}", README)
        return
    section = text.split(README_START, 1)[1].split(README_END, 1)[0]
    listed = dict(re.findall(r"^- \*\*([\w.-]+)\*\* (\S+?):", section, flags=re.M))
    for name, manifest in sorted(manifests.items()):
        if name not in listed:
            error(f"README.md plugin list is missing '{name}'", README)
        elif listed[name] != manifest.get("version"):
            error(f"README.md lists {name} {listed[name]}, plugin.json says {manifest.get('version')}", README)
    for name in sorted(set(listed) - set(manifests)):
        error(f"README.md lists '{name}', which is not a plugin here", README)


def check_skills() -> None:
    for skill in sorted(PLUGINS.glob("*/skills/*/SKILL.md")):
        rel = skill.relative_to(ROOT).as_posix()
        text = skill.read_text(encoding="utf-8").replace("\r\n", "\n")
        m = re.match(r"^---\n(.*?)\n---\n", text, flags=re.S)
        if not m:
            error(f"{rel}: no YAML frontmatter", skill)
            continue
        keys = {k: v.strip() for k, v in re.findall(r"^([\w-]+):(.*)$", m.group(1), flags=re.M)}
        for key in ("name", "description"):
            if not keys.get(key):
                error(f"{rel}: frontmatter has no '{key}'", skill)
    for folder in sorted(PLUGINS.glob("*/skills/*")):
        if folder.is_dir() and not (folder / "SKILL.md").is_file():
            error(f"{folder.relative_to(ROOT).as_posix()}: skill folder without SKILL.md", folder)


def git(*args: str) -> str:
    return subprocess.run(["git", "-C", str(ROOT), *args], check=True, capture_output=True, text=True, encoding="utf-8").stdout


def check_bumps(base: str, manifests: dict[str, dict], title: str) -> None:
    if NO_BUMP in title:
        notice(f"PR title has {NO_BUMP}: version bump check skipped")
        return
    try:
        merge_base = git("merge-base", base, "HEAD").strip()
        changed = git("diff", "--name-only", f"{merge_base}..HEAD", "--", "plugins/").splitlines()
    except subprocess.CalledProcessError as exc:
        error(f"cannot diff against {base}: {exc.stderr.strip()} (fetch the base branch with full history)")
        return

    touched = sorted({p.split("/")[1] for p in changed if p.count("/") >= 2})
    for name in touched:
        if name not in manifests:
            continue
        try:
            old = json.loads(git("show", f"{merge_base}:plugins/{name}/.claude-plugin/plugin.json")).get("version")
        except (subprocess.CalledProcessError, ValueError):
            notice(f"{name} is new in this branch")
            continue
        new = manifests[name].get("version")
        if not (isinstance(old, str) and SEMVER.match(old) and isinstance(new, str) and SEMVER.match(new)):
            continue
        if semver_key(new) <= semver_key(old):
            error(
                f"plugins/{name} changed but its version did not go up ({old} -> {new}). Bump plugin.json, "
                f"marketplace.json and README.md, or put {NO_BUMP} in the PR title for a change that ships nothing",
                PLUGINS / name / ".claude-plugin" / "plugin.json",
            )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--base", help="git ref of the PR's base branch; enables the version bump check")
    parser.add_argument("--title", default=os.environ.get("PR_TITLE", ""), help="PR title (default: $PR_TITLE)")
    args = parser.parse_args()

    manifests = check_structure()
    check_readme(manifests)
    check_skills()
    if args.base:
        check_bumps(args.base, manifests, args.title)

    if errors:
        print(f"\n{len(errors)} problem(s).")
        return 1
    print(f"ok: {len(manifests)} plugin(s) checked.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
