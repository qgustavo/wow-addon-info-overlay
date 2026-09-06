# WowQuickRef

Retail World of Warcraft overlay plus a small Lua addon. English UI. Midnight 12.1 / Season 2. v1 content is Blood DK only.

## Layout

- `WowQuickRef/` — Lua addon (copies spec IPC to the clipboard)
- `overlay/` — Electron desktop panel
- `data/` — JSON guides the overlay reads at runtime

## Setup (friends)

Send this file (or the GitHub Release after a push to `main`):

`https://github.com/qgustavo/wow-addon-info-overlay/releases/latest/download/WowQuickRef-Overlay.exe`

1. Double-click `WowQuickRef-Overlay.exe` and leave it running.
2. Play WoW in **borderless windowed**.

The overlay copies `WowQuickRef/` into `_retail_\Interface\AddOns` on launch. If it cannot find WoW, it asks for the `_retail_` folder once.

If Windows says the app is unrecognized: **More info → Run anyway**.

F8 toggles the panel. In-game, the addon button copies `WQR|6|250|open` for Blood DK; the overlay polls the clipboard and opens that spec.

The download link only works for people who can see this repo. Make the repo **public** (or add friends as collaborators) so they can download without extra accounts.

## Pack locally

`pack-release.cmd` builds `release\WowQuickRef-Overlay.exe`. A push to `main` builds the same exe and attaches it to the Latest GitHub Release.

## Setup (developers)

1. In `overlay/`, run `npm install` then `npm start` (or double-click `start-overlay.vbs`).
2. Play WoW in **borderless windowed**.

The overlay copies the Lua addon into AddOns on launch.

No memory reading, no injection, no sockets into WoW.
