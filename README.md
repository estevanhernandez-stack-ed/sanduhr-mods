# sanduhr-mods

Claude Code plugins, published from Sanduhr.

Add the marketplace once, then install any plugin in it by name:

```
claude plugin marketplace add estevanhernandez-stack-ed/sanduhr-mods
claude plugin install <plugin>@sanduhr-mods
```

## Plugins

<!-- sanduhr:plugins -->

- **now-playing** 0.3.1: A live now-playing line above the prompt: artist, title and a moving progress bar. On Windows from the media session (YouTube Music in Chrome included); on a Mac from every player through Sanduhr's adapter, or Music and Spotify without it.

  ```
  claude plugin install now-playing --marketplace estevanhernandez-stack-ed/sanduhr-mods
  ```

- **finish-line** 0.1.1: When a turn creates a tag (git tag, gh release create), a Claude sprite runs across the band above the prompt and crosses a checkered finish line, and the tag's name lands beside it. /finish-line [tag] replays it. Reads nothing, writes nothing, no network.

  ```
  claude plugin install finish-line --marketplace estevanhernandez-stack-ed/sanduhr-mods
  ```

- **agent-comms** 0.2.1: A band above the prompt showing every message to another agent that is still waiting on a reply.

  ```
  claude plugin install agent-comms --marketplace estevanhernandez-stack-ed/sanduhr-mods
  ```

- **decision-logger** 0.1.1: Pushes the dashboard decision log hard: a standing instruction, a nudge after commits and edit-heavy turns, and a running count.

  ```
  claude plugin install decision-logger --marketplace estevanhernandez-stack-ed/sanduhr-mods
  ```

- **page-pane** 0.1.1: /page <project> opens a side pane with that project's 626labs.dev portfolio card: summary, banner and link.

  ```
  claude plugin install page-pane --marketplace estevanhernandez-stack-ed/sanduhr-mods
  ```

- **desk-setup** 0.1.0: A Claude Code skill that sets up your Sanduhr Desk as a conversation: it reads the screen and wallpaper, asks a few short questions, proposes a small look you Apply on the live preview, then offers a finishing widget such as a pixel companion or song looks. Windows, Sanduhr 3.7 or later; widgets need 3.8.

  ```
  claude plugin install desk-setup --marketplace estevanhernandez-stack-ed/sanduhr-mods
  ```

  Then ask Claude Code to set up your Desk ("set up my Desk on the second screen"). Every change previews on the desktop and waits for your Apply.

<!-- /sanduhr:plugins -->

## Mods to build for your own setup

Some mods are tied to one person's machines: a home server, a media box, a dashboard. Those aren't published here as code, because the code would carry someone else's hosts. What travels instead is the idea and a prompt. Paste a prompt into Claude Code (the `plugin-authoring` skill ships with it), fill in the parts in angle brackets, and Claude builds the mod for your setup; Sanduhr's **New Mod** page then keeps it, checks it and turns it on per folder.

### Home lab pulse

A status-line glyph and a toast when something at home goes down or comes back, read from whatever already knows (an Uptime Kuma instance, a Tailscale tailnet, a Home Assistant), polled slowly over SSH or HTTP. `/lab` lists every monitor and peer on demand.

```
Build me a Claude Code mod called homelab-pulse with the plugin-authoring skill.
It polls my home lab every 60 seconds and shows a short status-line entry: a
check mark when everything is up, the count of what is down otherwise, and
"lab ?" when the source can't be reached. It toasts once when a monitor drops
and once when it recovers, never on every poll. A /lab command prints every
monitor and peer with its state.
Source of truth: <how to read your monitors, e.g. `ssh <host> …` printing JSON,
an HTTP endpoint, or `tailscale status --json`>. Run it with $.process.run with
a 20 s timeout, or $.http.fetch; parse only the fields you show.
Keep all state in an atom; no files, no network beyond that one source; no
credentials in the mod (use an SSH host alias or a local-network URL).
Add register.test.ts covering: all up, one down, source unreachable, recovery.
```

### A quiet pip for a media server

Two characters in the status line while a media server answers, nothing otherwise. No alerts, slow polling, no token.

```
Build me a Claude Code mod called plex-pip with the plugin-authoring skill.
Every <5> minutes it fetches <your server's unauthenticated health URL, e.g.
http://<host>:32400/identity for Plex, or /System/Ping for Jellyfin> with
$.http.fetch. While the response is ok it shows "🎬🎵" in the status line via
$.ui.status; on any error or non-2xx it shows nothing. Read the URL and the
interval from plugin options (plexUrl, pollMinutes) so the mod ships without my
address in it; do nothing when the URL option is empty. No toasts, no commands,
no state beyond the last result. Add register.test.ts for ok, non-2xx, a thrown
fetch and an empty option.
```

If you build one, publish it to your own marketplace from Sanduhr (New Mod, a kept mod's menu, **Publish to Marketplace…**).
