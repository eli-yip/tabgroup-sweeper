# AGENTS.md

`tabgroup-sweeper` is a small Chromium (Manifest V3) browser extension with one
job: **close every tab that belongs to a tab group, and leave ungrouped tabs
open.** It is a toolbar action with a popup that lists the current tab groups and
a button to sweep them.

Keep it simple. It is a single-purpose extension; resist scope creep.

## Related project

There is a sibling project, **[tabgroups](https://github.com/eli-yip/tabgroups)**
(a Python CLI, the `tabgroups-export` repo), typically checked out next to this
one (`../tabgroups-export`). The two are **orthogonal**, and the split is
deliberate:

- **tabgroups (CLI)** is read-only: it parses the on-disk SNSS session file and
  **exports** tab groups (tree / md / json / html / csv), and can LLM-classify
  them. It never touches the running browser.
- **This extension** acts on the *live* browser, reading tab-group membership
  directly via `chrome.tabGroups` / `chrome.tabs` (exact — no URL matching, no
  heuristics) and closing those tabs.

So **do not add SNSS parsing or export/classify features here**, and do not add
live-browser control to the CLI. Closing grouped tabs was considered as a CLI
subcommand and rejected in favour of this extension, because only an extension
can read tab-group membership exactly. See `docs/specs/` in both repos.

## Stack & layout

- **Runtime/build:** [Bun](https://bun.sh) bundles `src/*.ts` → `public/*.js`
  (`build.ts`). The extension is loaded unpacked from `public/`.
- **Language:** TypeScript, strict. Types from `@types/chrome` + `@types/bun`.
- **Lint/format:** [Biome](https://biomejs.dev) (`biome.jsonc`).
- `public/manifest.json` and `public/popup.html` are committed; the built
  `public/*.js` are generated artifacts (gitignored).

```
src/            TypeScript sources (popup, background)
public/         manifest.json + popup.html (committed); built *.js (gitignored)
build.ts        Bun.build entry
docs/           specs / plans / lessons / PROGRESS.md
```

## Conventions

- Before writing a commit message, read the recent commit history. Use the
  Conventional Commit style and write commit messages in English.
- **Prefer mature, modern tooling** over hand-rolled code — Bun for build, Biome
  for lint/format, the official `chrome.*` extension APIs over scraping or
  automation hacks. Don't reinvent what a well-maintained tool does well.
- **Request the minimum permissions.** Closing grouped tabs needs only the
  `tabGroups` permission (querying tabs and removing them by id needs no `tabs`
  permission, and reading group title/color comes from `tabGroups`). Add a
  permission only when a feature genuinely requires it.
- Manifest V3 only. Keep the service worker minimal; do user-gesture work in the
  popup context.

## Development workflow

For any non-trivial change, follow a spec-first process:

1. **SPEC → PLAN → implement + LESSON.** Agree on the SPEC (what to build and
   why) before planning; break it into a PLAN (concrete, small steps) before
   writing code; capture experience in a LESSON while implementing. Keep
   `docs/PROGRESS.md` current throughout.
2. **Work on a dedicated branch with small commits.** Branch off `master` named
   `feat-<topic>` (short kebab-case); commit in small, focused steps rather than
   one large commit.
3. **Request review before merging.** When the work is complete, ask the author
   to review it. After approval, squash-merge into `master` and delete the
   branch.

Trivial one-liners (a typo, a doc tweak) don't need a SPEC — use judgment.

### Documentation layout

Docs live under `docs/`. `NO` is a zero-padded same-day sequence number (`01`,
`02`, …) disambiguating documents created on one date; `<topic>` is a short
kebab-case slug.

- **SPECs** — `docs/specs/YYYY-MM-DD-NO-<topic>.md`: what to build and why.
- **PLANs** — `docs/plans/YYYY-MM-DD-NO-<topic>.md`: a SPEC broken into steps.
- **LESSONs** — `docs/lessons/YYYY-MM-DD-NO-<topic>.md`: experience while
  executing a PLAN.
- **`docs/PROGRESS.md`** — a table tracking SPEC / PLAN / status across all work.

## Before committing

Run the lint pipeline and make sure it is clean:

```sh
just build       # bun bundles src -> public
just lint        # biome lint --fix
just fmt         # biome format --fix
```

There is no automated test suite; verify changes by **loading the unpacked
extension** (`public/`) in a Chromium browser and exercising the popup against
real tab groups. Add targeted tests only if a piece of logic becomes hard to
verify by hand.

## Notes

- A window whose tabs are *all* grouped will be closed when its tabs are swept
  (Chromium closes a window with no remaining tabs). This is expected; the job
  is to remove grouped tabs.
- Tab-group membership is read live and exactly via `chrome.tabs` (`groupId`) and
  `chrome.tabGroups` — never inferred from URLs or titles.
