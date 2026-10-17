// Trimmed copy of the live 626labs.dev site.json, one product per link branch.
export const fixture = {
  "products": [
    {
      "id": "celestia-3",
      "title": "Celestia 3",
      "tagline": "NASA-grade astrology AI.",
      "description": "An AI technomancer that reads the actual sky. The Swiss Ephemeris engine was rebuilt to astronomical precision — not the second-rate math most astrology apps ship — so every chart is observatory-accurate. Converse with the Athanor, an AI oracle grounded in your real natal chart, across the Natal Compass, Aura Cam, Arithmancy, Tarot, Rituals, Chronos forecasts, Celebrity Match, Synastry, and the Grimoire. The full tarot library is live and editorially reviewed card by card, a free birth-chart calculator needs no login, and a /learn library of placement readings keeps growing toward full coverage. Synastry readings now save to your Grimoire instead of re-running the AI every time you revisit a past match.",
      "tags": [
        {
          "label": "Web app",
          "tone": "cyan"
        },
        {
          "label": "AI astrology",
          "tone": "magenta"
        },
        {
          "label": "Freemium",
          "tone": "cyan"
        },
        {
          "label": "Live",
          "tone": "live"
        }
      ],
      "status": "live",
      "repo": "estevanhernandez-stack-ed/Celestia3",
      "npm": null,
      "claudeCode": false,
      "liveUrl": "https://celestia.626labs.dev",
      "liveCtaLabel": "Start free",
      "demoUrl": "https://www.youtube.com/watch?v=HV8dUMReNgI",
      "banner": "assets/thumb-celestia.png",
      "meta": "Free to explore · ascend from $3.99/mo · cancel anytime"
    },
    {
      "id": "vibe-cartographer",
      "flagship": true,
      "title": "Vibe Cartographer",
      "tagline": "Vibe coding with a map.",
      "description": "{{fact:cmd_vibe-cartographer_word}} slash commands walk you from first idea to shipped app — onboard, scope, PRD, spec, checklist, build, iterate, reflect. Each step reads what the last one wrote, so the plan compounds instead of drifting, and it remembers where you left off between sessions. Pick a builder persona, keep a living architecture doc, run autonomous or step-by-step. Structure for vibe coding that doesn't kill the vibe.",
      "tags": [
        {
          "label": "Flagship",
          "tone": "magenta"
        },
        {
          "label": "Live",
          "tone": "live"
        },
        {
          "label": "Claude Code plugin",
          "tone": "cyan"
        }
      ],
      "status": "live",
      "repo": "estevanhernandez-stack-ed/vibe-cartographer",
      "npm": "@esthernandez/vibe-cartographer",
      "claudeCode": true,
      "anthropicApproved": true,
      "productPage": "/vibe-cartographer/"
    },
    {
      "id": "vibe-iterate",
      "title": "Vibe Iterate",
      "tagline": "Maintain your Atlas.",
      "description": "What to build next, after the app ships. Pick a banner mode — feature-add, competitive, ux-polish, bug-bash — and it scans competitors, framework releases, and your own feedback, scores the candidates, and ships one regression-aware PR. Sidecars (:radar, :spy, :scan-releases, :rate, :ship, :upgrade) cover the in-between. Every iteration logs to an Atlas — what won, what didn't, and why — so the next call starts where the last one ended.",
      "tags": [
        {
          "label": "Plugin",
          "tone": "cyan"
        },
        {
          "label": "post-ship",
          "tone": "magenta"
        },
        {
          "label": "Live",
          "tone": "live"
        }
      ],
      "status": "live",
      "repo": "estevanhernandez-stack-ed/vibe-iterate",
      "npm": null,
      "claudeCode": true,
      "anthropicApproved": true,
      "meta": "<code>/vibe-iterate</code> · post-ship iteration",
      "productPage": "/vibe-iterate/"
    },
    {
      "id": "snapsnip",
      "title": "SnapSnip",
      "description": "Automatically renames full-window snips based on metadata. Reads the active app and window title at capture time, writes a context-rich filename, and embeds structured XMP — turns 'Screenshot 2026-04-29 142301.png' into 'Outlook — Q3 forecast — 2026-04-29 142301.png'. Three on-device redaction presets (Strict / Balanced / Permissive). Privacy by default — no network calls.",
      "tags": [
        {
          "label": "Windows",
          "tone": "cyan"
        },
        {
          "label": "native",
          "tone": "magenta"
        },
        {
          "label": "privacy",
          "tone": "cyan"
        },
        {
          "label": "Live",
          "tone": "live"
        }
      ],
      "status": "live",
      "repo": null,
      "npm": null,
      "storeUrl": "https://apps.microsoft.com/detail/9PBX8F5TR0VR?cid=site-home",
      "banner": "assets/thumb-snapsnip.png",
      "meta": "Windows native · context-aware screenshots"
    },
    {
      "id": "rororo",
      "title": "RORORO",
      "description": "Multi-launcher for Windows — run multiple Roblox clients side by side, each signed in as a different saved account. Native .NET 10 / WPF, DPAPI-encrypted account vault tied to your Windows user, embedded WebView2 login so your password never touches the app process. System-tray UX with state-coloured ring, per-game launch routing, Velopack auto-update. A hardened plugin host — sideload-only, https-only installs, named-pipe IPC with per-capability consent — with an in-app marketplace to browse, install, and update the Ur family in one click. Watches every client's memory and offers a one-click Recycle before a memory leak takes the window down, alongside stray-process cleanup, tray-residence recovery, Limited-account detection, idle-awareness that warns before Roblox's AFK kick, and a signed roblox-compat feed published on every release. Alerts reach your desktop, a Discord webhook, or your phone through Pushover or ntfy — with an every-two-hours all-good mark while your accounts run — and a History tab keeps score: most alts at once, total hours, per-alt login streaks. Trust-aware Squad Launch lands a group in the same server together, streamer mode swaps in fake names and avatars when you're live, and four themes plus a builder let you tune the app and share the result as a file. Mac-native sibling, and a three-plugin family: Ur Task (portable, window-aware macros), Ur OCR (screen triggers that fire keybinds or Ur Task macros), and Ur AFK (one-tap keep-alive). Speaks six languages — French, German, Russian, Portuguese, Polish, Spanish — following your Windows language or pinned in Settings. Free on the Microsoft Store. Independent third-party tool — not affiliated with Roblox Corporation.",
      "tags": [
        {
          "label": "Windows",
          "tone": "cyan"
        },
        {
          "label": "native",
          "tone": "magenta"
        },
        {
          "label": "Roblox tooling",
          "tone": "cyan"
        },
        {
          "label": "Live",
          "tone": "live"
        }
      ],
      "status": "live",
      "repo": "estevanhernandez-stack-ed/ROROROblox",
      "npm": null,
      "storeUrl": "https://apps.microsoft.com/detail/9NMJCS390KWB?cid=site-home",
      "productPage": "rororo.html",
      "banner": "assets/thumb-rororo.png",
      "meta": "Free · Windows + macOS · plugin-extensible"
    },
    {
      "id": "pod-pipeline",
      "title": "626 POD Pipeline",
      "tagline": "Concept to live Etsy listing — nine stages, one human gate.",
      "description": "The open-source engine behind Conundrum by Este: a Python script library that takes a concept to a live Etsy listing in nine stages. Gemini art generation, an AI-slop QA gate, classical-CV background removal, PIL type compositing, and a variant matrix that fans one artwork into a full product line before Printify upload and Etsy publish. No app server, no build step, a JSON-backed catalog — and a human go gates every publish.",
      "tags": [
        {
          "label": "Python",
          "tone": "cyan"
        },
        {
          "label": "open source",
          "tone": "magenta"
        },
        {
          "label": "AI pipeline",
          "tone": "cyan"
        },
        {
          "label": "Live",
          "tone": "live"
        }
      ],
      "status": "live",
      "repo": "626Labs-LLC/626labs-pod-pipeline",
      "npm": null,
      "storeUrl": null,
      "productPage": null,
      "banner": null,
      "meta": "Open source · Python · Gemini + Printify"
    }
  ]
}

export const versionsFixture = {
  "vibe-cartographer": "v1.12.0",
  "vibe-iterate": "v1.4.0"
}
