# WowQuickRef

Retail desktop overlay only (no Lua addon). English UI and content. Midnight 12.1 / Season 2.

## Layout

- `overlay/` — Electron + vanilla HTML/CSS/JS (no React)
- `data/` — JSON content; overlay reads this at runtime
- Do not invent a second schema. Do not copy full third-party guides.

## Overlay

Portable `.exe`. Hotkey F8 (rebindable in the panel) toggles visibility. Spec comes from the picker; last `classId`/`specId` is saved locally. No memory reading, no inject, no sockets into WoW, no writes to `Interface\AddOns`.

## Overlay UX

- Always-on-top, frameless, ~30% of primary display width, right side
- Borderless-windowed WoW required
- Click-through when hidden; interactive when open
- Tabs: BIS Crafts | BIS Drops (Raid / M+) | Talents (Single Target / M+ / Delves, one loadout per hero tree) | Boss cheat sheets | Trinket tier list
- Local search over `data/`
- Spec picker
- Overlay position lock
- Source links open in the system browser

## Content rules

- Summaries only: max 6 bullets per section, 5 lines per boss
- Every fact needs `sources[]` with `{ name, url }`
- Unknown specs: placeholder + source links, do not fabricate BIS
- Patch fields: `"12.1"`, season `2`
- Boss cheat sheets are fight tactics (tank position, soak, swap, grip/AMZ/AMS), never loot bands or Glory
- If a written hub is loot-only, widen search: per-boss pages, YouTube (specific videos), Reddit (specific threads)

## Sources

Primary for BIS and talents: Icy Veins, Wowhead, Method (`data/sources.md` picks).
For tactics: per-boss written pages first, then YouTube and Reddit. Community sources may be the primary cite for tactics. They must not be the sole cite for BIS numbers.
YouTube: named raid/tank/M+ creators, specific video URLs, summarize (no transcripts).
Reddit: specific threads in r/competitivewow, r/wow, r/wownoob, class subs. No random comments.

## Worker bounds

- Overlay worker: only `overlay/` (may read `data/` + `data/schema.json`)
- Sources worker: only `data/sources.md`
- Curation worker: only `data/specs/` and `data/encounters/`
- Research agents: read-only web; do not write files
- Curation: one spec JSON file per agent
