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
