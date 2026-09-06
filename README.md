# WowQuickRef

Retail World of Warcraft desktop overlay. English UI. Midnight 12.1 / Season 2. No in-game addon.

## Layout

- `overlay/` — Electron desktop panel
- `data/` — JSON guides the overlay reads at runtime

## Setup (friends)

Send this file (or the GitHub Release after a push to `main`):

`https://github.com/qgustavo/wow-addon-info-overlay/releases/latest/download/WowQuickRef-Overlay.exe`

1. Double-click `WowQuickRef-Overlay.exe` and leave it running.
2. Play WoW in **borderless windowed**.
3. Press **F8** to show the panel. Pick your spec in the dropdown.

If an older version installed `Interface\AddOns\WowQuickRef`, delete that folder. This app does not touch AddOns.

If Windows says the app is unrecognized: **More info → Run anyway**.

The download link only works for people who can see this repo. Make the repo **public** (or add friends as collaborators) so they can download without extra accounts.

## Pack locally

`pack-release.cmd` builds `release\WowQuickRef-Overlay.exe`. A push to `main` builds the same exe and attaches it to the Latest GitHub Release.

## Setup (developers)

1. In `overlay/`, run `npm install` then `npm start` (or double-click `start-overlay.vbs`).
2. Play WoW in **borderless windowed**.

No memory reading, no injection, no sockets into WoW.
