# RAKYAT: LAST STAND (web / mobile)

Vanilla JS ES modules + Canvas 2D, 960x540 internal, fixed 60 Hz update. No dependencies.

## Run
The `game/` folder is self-contained (assets in `game/assets`).

    GitHub Pages: just publish the folder. Local test: any static server (ES modules need http, not file://).


Dev shortcut: `index.html#fight=4` jumps into stage 5 with the office worker.

## Controls
| Action | Keyboard | Touch |
|---|---|---|
| Move (X + depth) | WASD / arrows | left joystick |
| A (punch) / B (kick) / Special | J / K / L | A Pukul / B Tendang / Spesial |
| Block (hold) | Shift | Tahan |
| Dodge | Space | Hindar |
| Pause | Esc | II |

Special costs 40 meter (filled by hitting and being hit). With a full meter the Special button fires the Ultimate. Dodge costs stamina.

## Modes & menus
Arcade lets you play as any fighter (tabs RAKYAT / PENGUASA) and fight any of the 18; nothing is locked and no campaign progress is saved.
New fighters (Windah Basudara, Ferry Irwandi playable; Jokowi, Kang Dedi Mulyadi arcade-only) show "SEGERA HADIR" until their art exists. See `ASSET_PROMPTS.md` + `tools/import-assets.ps1`.

Campaign, Arcade, Tutorial (4 pages + Training mode vs a dummy that never fights back), About.

## Combos
Chain A/B inputs (cancel on hit, or late in recovery); the last hit becomes a finisher with its own damage. Each character has four finisher styles (slam, launcher, multi-hit, wave/rush; see `js/data/characters.js`), listed in the pause menu and on the select cards.

## Fullscreen
Button on the menu and in the touch HUD (Android/desktop). iPhone Safari has no fullscreen API: use Share > Add to Home Screen.

## Layout
- `js/core` loop, input (keyboard + multi-touch), asset slicing
- `js/data` config/frame data, characters, bosses (add content here)
- `js/entities/Fighter.js` shared state machine; `js/systems` combat + boss AI; `js/scenes/Battle.js`

## Known limitations
- No dedicated idle/walk frames: idle reuses combat pose 0 with bob. Next: animation sheets.
- Rudy + Syarifah are two sequential fights, not the planned simultaneous double boss.
- No ultimate, best-of-3 rounds, or audio yet. Damage/timing numbers are placeholders.

Menu KONTEN has two tabs: PROFIL PENGUASA (satirical dossiers of the penguasa roster) and SIMBOL AKSI (protest symbols that appear in the arenas).

Arenas show a drifting orange haze (the 2026 forest-fire smoke) and banners with the current demands; KONTEN has a third tab, TUNTUTAN, listing them with sources.
