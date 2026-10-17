# sanduhr-mods

Claude Code plugins, published from Sanduhr.

Add the marketplace once, then install any plugin in it by name:

```
claude plugin marketplace add estevanhernandez-stack-ed/sanduhr-mods
claude plugin install <plugin>@sanduhr-mods
```

## Plugins

<!-- sanduhr:plugins -->

- **now-playing** 0.2.0: A live now-playing line above the prompt: artist, title and a moving progress bar. On Windows from the media session (YouTube Music in Chrome included); on a Mac from every player through Sanduhr's adapter, or Music and Spotify without it.

  ```
  claude plugin install now-playing --marketplace estevanhernandez-stack-ed/sanduhr-mods
  ```

- **finish-line** 0.1.0: When a turn creates a tag (git tag, gh release create), a Claude sprite runs across the band above the prompt and crosses a checkered finish line, and the tag's name lands beside it. /finish-line [tag] replays it. Reads nothing, writes nothing, no network.

  ```
  claude plugin install finish-line --marketplace estevanhernandez-stack-ed/sanduhr-mods
  ```

- **agent-comms** 0.2.0: A band above the prompt showing every message to another agent that is still waiting on a reply.

  ```
  claude plugin install agent-comms --marketplace estevanhernandez-stack-ed/sanduhr-mods
  ```

<!-- /sanduhr:plugins -->
