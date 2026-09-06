# WowQuickRef

Retail World of Warcraft overlay plus a small Lua addon. English UI. Midnight 12.1 / Season 2. v1 content is Blood DK only.

## Layout

- `WowQuickRef/` — Lua addon (copies spec IPC to the clipboard)
- `overlay/` — Electron desktop panel
- `data/` — JSON guides the overlay reads at runtime

## Setup

1. Copy `WowQuickRef/` into `World of Warcraft\_retail_\Interface\AddOns\`.
2. In `overlay/`, run `npm install` then `npm start` (or double-click `start-overlay.vbs`).
3. Play WoW in **borderless windowed**.

F8 toggles the panel. In-game, the addon button copies `WQR|6|250|open` for Blood DK; the overlay polls the clipboard and opens that spec.

No memory reading, no injection, no sockets into WoW.
