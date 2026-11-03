# RAKYAT: LAST STAND

## Project Brief & VS Code Coding-Agent Instructions

**Project type:** Browser-based 2D arcade fighting game\
**Genre:** 1v1 fighting, political satire\
**Visual direction:** Custom pixel art\
**Perspective:** Pseudo-2.5D arena (X movement + Y depth)\
**Internal resolution:** 960 × 540\
**Technology:** HTML, CSS, vanilla JavaScript, HTML5 Canvas\
**Game modes:** Campaign + Arcade\
**Current milestone:** MVP Stage 1 --- movement prototype

------------------------------------------------------------------------

# 1. Instructions for the coding agent

You are the senior gameplay engineer working on **RAKYAT: LAST STAND**.

Your job is to implement the game incrementally using the existing
project structure. Prioritize maintainable architecture, playable feel,
deterministic game logic, and clear separation of responsibilities.

## Non-negotiable engineering rules

1.  Use **vanilla JavaScript ES modules**. Do not introduce React, Vue,
    Phaser, Pixi, TypeScript, bundlers, or other frameworks unless
    explicitly requested.
2.  Use **HTML5 Canvas 2D** for the game world. Use HTML/CSS for menus,
    settings, HUD overlays, and accessibility.
3.  Keep the internal game resolution at **960 × 540**. Scale the canvas
    responsively while preserving the 16:9 aspect ratio.
4.  Keep pixel art crisp: disable image smoothing when rendering pixel
    assets.
5.  Use a fixed-timestep update loop (target 60 updates per second) with
    `requestAnimationFrame` for rendering.
6.  Separate `update()` from `render()`. Rendering must not mutate
    gameplay state.
7.  Do not put the entire game in one file. Follow the modular folder
    structure below.
8.  Prefer data-driven character, boss, and level configuration. Avoid
    duplicating combat logic for each character.
9.  Use original placeholder shapes or clearly licensed assets until
    custom sprite sheets are supplied. Do not use copyrighted
    characters, sprites, music, or ripped assets.
10. Do not add backend services, accounts, analytics, or network
    dependencies to the MVP. Save local progress with `localStorage`
    when that milestone is reached.
11. All gameplay must work with keyboard input. Prevent browser
    scrolling for game control keys while the game is focused.
12. Handle tab blur safely: clear held keys so a character does not keep
    moving after the player switches tabs.
13. Keep code readable and comment non-obvious gameplay calculations.
14. Do not silently change the agreed design. If a requested change
    conflicts with the architecture, explain the trade-off before
    implementing it.
15. After each milestone, provide: files changed, features completed,
    how to run, manual test checklist, known limitations, and
    recommended next task.

## Agent workflow

Before editing: - Inspect the current repository and read its README. -
Identify which milestone is already implemented. - Reuse working code;
do not replace functioning modules unnecessarily. - Make a short
implementation plan.

While editing: - Implement only the requested milestone. - Keep imports
and exports consistent. - Avoid placeholder functions that claim to work
but do nothing. - Add basic error handling for missing
canvas/context/assets. - Keep the project runnable after each meaningful
change.

After editing: - Check for syntax/import errors. - If possible, run the
app through a local static server. - Report any tests that could not be
run; do not claim unperformed tests passed.

------------------------------------------------------------------------

# 2. Game concept

## Premise

A political-satire fighting game inspired by social tensions, public
demonstrations, and the feeling that ordinary citizens are not being
heard.

The player controls an ordinary citizen --- such as an office worker,
university student, mother, or street vendor --- and faces a sequence of
increasingly influential opponents.

The game is fictional satire, not a documentary or a claim about real
individuals. Real public figures may be represented as stylized
caricatures and fictional boss characters. Their combat abilities should
be framed as gameplay metaphors or satire, not fabricated factual
allegations.

## Creative pillars

1.  **Ordinary people as protagonists:** playable characters are
    recognizable everyday citizens, not superheroes.
2.  **Arcade readability:** attacks, damage, movement, and boss patterns
    must be easy to understand.
3.  **Satirical personality:** humor appears in character skills, stage
    details, dialogue, headlines, and victory screens.
4.  **Fair combat:** every enemy attack needs readable telegraphs,
    recovery windows, and counterplay.
5.  **Expandable content:** new fighters and bosses should be addable
    through data/configuration and assets, not rewrites of the engine.

## Tone

-   Satirical, witty, occasionally absurd.
-   Critique institutions, policies, public discourse, and power
    dynamics.
-   Avoid presenting fictional combat as a real-world instruction or
    endorsement of violence.
-   Keep the tone humorous during combat, with room for more serious
    story moments.

------------------------------------------------------------------------

# 3. Locked design decisions

These decisions are approved and should be treated as the current source
of truth.

  Decision              Locked value
  --------------------- -----------------------------------------------
  Game title            RAKYAT: LAST STAND
  Visual style          Custom pixel art
  Combat                Arcade 1v1
  Perspective           Pseudo-2.5D
  Internal resolution   960 × 540
  Rendering             HTML5 Canvas 2D
  UI                    HTML + CSS
  Programming           full javascript
  Game modes            Campaign + Arcade
  Platform              mobile 
  Persistence           LocalStorage, when progression is implemented
  Multiplayer           Out of scope for MVP

## What pseudo-2.5D means here

The arena is rendered as a 2D scene with a perspective floor. Fighters
can move: - Horizontally on the X axis. - Forward/backward on the arena
depth axis (Y).

Depth affects: - Character scale. - Ground/shadow position. - Draw order
(the fighter closer to the camera should appear in front). - Potential
attack alignment and hitbox overlap.

This is not a 3D engine. Do not introduce WebGL or a 3D framework.

------------------------------------------------------------------------

# 4. Playable characters

Initial planned roster:

  -----------------------------------------------------------------------
  Character         Archetype         Personality /     Signature skill
                                      gameplay identity 
  ----------------- ----------------- ----------------- -----------------
  Office worker     Balanced          Practical,        Deadline Rage
                                      adaptable, tired  
                                      after work        

  University        Combo             Fast, mobile,     Mimbar Bebas
  student                             high combo        
                                      potential         

  Mother            Heavy             Tough, strong     Sandal Terbang
                                      hits, slower      
                                      movement          

  Street vendor     Defensive         High endurance,   Wajan Strike
                                      controls space    
  -----------------------------------------------------------------------

Suggested initial stats are balancing placeholders, not final values:

  Character               HP   Attack   Defense   Speed
  -------------------- ----- -------- --------- -------
  Office worker          100        8         6       7
  University student      85        7         4      10
  Mother                 110       10         7       5
  Street vendor          120        7         9       5

Use a shared Fighter base class and data-driven configuration. Unique
skills may use separate skill handlers, but common movement, damage,
collision, and state logic must remain shared.

------------------------------------------------------------------------

# 5. Boss progression

The planned campaign progression is:

  -----------------------------------------------------------------------
  Stage                   Boss                    Gameplay theme
  ----------------------- ----------------------- -----------------------
  1                       Buzzer                  Distraction,
                                                  misinformation-themed
                                                  projectiles, quick
                                                  pressure

  2                       Police                  Defensive stance,
                                                  shield pressure,
                                                  controlled spacing

  3                       Military                Tactical movement,
                                                  heavy attacks, counters

  4                       DPR                     Interruptions, zoning,
                                                  unpredictable patterns

  5                       Bahlil                  Power/energy-themed
                                                  attacks and resource
                                                  pressure

  6                       Hashim Djojohadikusumo  Strategic spacing and
                                                  economic-power satire

  7A                      Teddy                   Fast defense, counters,
                                                  support/guard phase

  7B                      Prabowo                 Final boss with
                                                  multiple phases
  -----------------------------------------------------------------------

Bosses based on real public figures must remain clearly fictionalized
satire. Do not invent real-world criminal conduct, private facts, or
factual accusations. Boss skills should be fictional metaphors and game
mechanics.

For the MVP, implement only two simple bosses (Buzzer and Police) after
the combat engine is stable. The complete roster is not part of Stage 1.

------------------------------------------------------------------------

# 6. Combat design

## Planned keyboard controls

  -----------------------------------------------------------------------
  Key                                 Action
  ----------------------------------- -----------------------------------
  A / D                               Move left / right

  W / S                               Move up / down arena depth

  Shift                               Run

  J                                   Punch

  K                                   Kick

  S                                   Block (when combat input mapping is
                                      active; resolve conflict with depth
                                      movement using a modifier or remap
                                      before combat implementation)

  Space                               Dodge

  L                                   Special

  Esc                                 Pause

  R                                   Reset prototype position
                                      (development only)
  -----------------------------------------------------------------------

**Important input design note:** W/S are currently reserved for arena
depth movement, while S was also proposed for block. Do not implement
both actions on the same key without resolving the conflict. For combat,
use a clear mapping such as: - W/S = depth movement - J = punch - K =
kick - L = special - Shift = block - Space = dodge

Alternatively, propose a remappable control scheme and document it.

## Planned combat mechanics

-   Basic punch: fast startup, low damage, short recovery.
-   Kick: slower startup, higher damage and knockback.
-   Block: reduces incoming damage; should not make the player
    invulnerable.
-   Dodge: short movement with a brief evasion window and stamina cost.
-   Combo: input sequences with timing windows.
-   Special: character-specific ability.
-   Ultimate: meter-based cinematic attack.

## Planned resource model

-   HP: health.
-   Stamina: consumed by dodge and selected defensive actions.
-   Special meter: builds through combat interactions.
-   Ultimate meter: fills to 100% before ultimate can be activated.

## Round rules (post-MVP)

-   Best of 3 rounds.
-   60 seconds per round.
-   KO when HP reaches zero.
-   If time expires, higher remaining HP wins.
-   MVP may initially use one round to simplify testing.

------------------------------------------------------------------------

# 7. Arena and visual direction

Initial arena: fictional urban street / demonstration-adjacent city
block.

Visual elements: - Distant city silhouettes. - Road and sidewalk with
perspective. - Barriers and street props. - Satirical signs and
environmental details. - Parallax layers can be added later.

The first stage may use code-drawn placeholder pixel art. Replace it
with custom sprite sheets only after movement and combat feel stable.

## Pixel-art rules

-   Keep a consistent pixel scale and palette.
-   Avoid blurry scaling.
-   Prefer sprite sheets with documented frame dimensions.
-   Store animation metadata in configuration rather than scattering
    frame coordinates across gameplay code.
-   Keep character feet aligned to a consistent ground anchor.
-   Use the feet/ground position for depth sorting, not the top of the
    sprite.

------------------------------------------------------------------------

# 8. Technical architecture

## Runtime flow

``` text
index.html
   |
   +-- CSS UI / responsive shell
   |
   +-- js/main.js
          |
          +-- Game
          |     +-- GameLoop (fixed timestep)
          |     +-- InputManager
          |     +-- SceneManager
          |
          +-- Scenes
          |     +-- MenuScene
          |     +-- CharacterSelectScene
          |     +-- ArenaScene
          |     +-- BattleScene
          |     +-- ResultScene
          |
          +-- Entities
          |     +-- Fighter
          |     +-- Player
          |     +-- Boss
          |
          +-- Systems
                +-- Physics
                +-- Collision
                +-- Combat
                +-- Animation
                +-- AI
                +-- Audio
                +-- Save
```

## Required coding principles

### Game loop

-   Use `requestAnimationFrame`.
-   Use a fixed update step of 1/60 second.
-   Clamp unusually large frame deltas after tab suspension.
-   Update gameplay with fixed timestep.
-   Render separately, optionally using interpolation.

### Coordinates

-   Internal canvas: 960 × 540.
-   X: horizontal position.
-   Y: depth position on arena floor.
-   Define arena bounds centrally in configuration.
-   Normalize diagonal movement.
-   Character visual scale may vary with depth.
-   Sort entities by their ground Y coordinate before drawing.

### Rendering

-   Use Canvas 2D.
-   Set `imageSmoothingEnabled = false`.
-   Draw the arena, shadows, entities, effects, and HUD in a predictable
    order.
-   Do not update animation timers or gameplay state from render
    functions.

### Collision

Use separate concepts: - Physics body: movement and arena constraints. -
Hurtbox: area that can receive an attack. - Hitbox: active attack area.

Do not use the visible sprite rectangle as the only collision
representation.

### State machines

Fighter states planned: - idle - walk - run - jump - fall - attack -
kick - block - dodge - special - hit - ko - victory

Only implement states needed by the current milestone.

### Data-driven configuration

Character and boss stats, sprite metadata, skills, and arena settings
should live in separate configuration modules or JSON-like JavaScript
objects.

------------------------------------------------------------------------

# 9. Recommended folder structure

``` text
rakyat-last-stand/
├── index.html
├── README.md
├── css/
│   ├── main.css
│   ├── menu.css
│   └── hud.css
├── js/
│   ├── main.js
│   ├── core/
│   │   ├── Game.js
│   │   ├── GameLoop.js
│   │   ├── InputManager.js
│   │   └── SceneManager.js
│   ├── scenes/
│   │   ├── MenuScene.js
│   │   ├── CharacterSelectScene.js
│   │   ├── ArenaScene.js
│   │   ├── BattleScene.js
│   │   └── ResultScene.js
│   ├── entities/
│   │   ├── Fighter.js
│   │   ├── Player.js
│   │   └── Boss.js
│   ├── systems/
│   │   ├── PhysicsSystem.js
│   │   ├── CollisionSystem.js
│   │   ├── CombatSystem.js
│   │   ├── AnimationSystem.js
│   │   ├── AISystem.js
│   │   └── AudioManager.js
│   ├── data/
│   │   ├── characters.js
│   │   ├── bosses.js
│   │   └── levels.js
│   └── utils/
│       ├── AssetLoader.js
│       └── SaveManager.js
└── assets/
    ├── sprites/
    ├── backgrounds/
    ├── effects/
    ├── audio/
    └── fonts/
```

Do not create empty modules merely to match this tree. Add files when
their responsibilities are needed.

------------------------------------------------------------------------

# 10. Milestone plan

## Stage 1 --- Movement prototype (current task)

Goal: prove that the game can render a pseudo-2.5D arena and move one
character around it.

Must have: - 960 × 540 internal canvas. - Responsive 16:9
presentation. - Fixed-timestep loop at 60 updates per second. -
Pseudo-2.5D floor with depth axis. - Character movement on X and depth
Y. - Normalized diagonal movement. - Walk/run speed. - Arena
boundaries. - Character scale changes with depth. - Shadow follows
ground position. - Depth-aware rendering foundation. - Debug overlay
with coordinates and collision/body bounds. - Reset key. - Grid toggle.

Not included: - Combat. - Hitboxes / hurtboxes. - HP / stamina. - Boss
AI. - Character selection. - Campaign / arcade menus. - Final custom
sprite sheets. - Audio.

## Stage 2 --- Combat foundation

-   Shared Fighter class.
-   Idle/walk/run/attack/block/dodge/hit states.
-   Punch and kick.
-   Attack startup, active, recovery frames.
-   Hitbox/hurtbox collision.
-   HP and damage.
-   Knockback and hit reaction.
-   Combat test dummy.
-   Basic HUD.

## Stage 3 --- First boss encounter

-   Boss entity and AI state machine.
-   Buzzer as first boss.
-   Telegraphs and attack recovery.
-   Victory / defeat.
-   One complete playable encounter.

## Stage 4 --- Character system

-   Office worker and university student playable.
-   Character selection screen.
-   Data-driven stats and skill configuration.
-   Character-specific special move hooks.

## Stage 5 --- Game modes

-   Campaign progression.
-   Arcade opponent selection.
-   Result screen.
-   Local save data.

## Stage 6 --- Art, audio, polish

-   Replace placeholder shapes with custom sprite sheets.
-   Character animation polish.
-   Arena art and effects.
-   Music and sound effects.
-   Balance and performance testing.

------------------------------------------------------------------------

# 11. Stage 1 acceptance criteria

Stage 1 is complete only when all checks below pass:

-   [ ] App loads through a local static server without module/import
    errors.
-   [ ] Canvas internal resolution is exactly 960 × 540.
-   [ ] Canvas scales responsively and retains 16:9 aspect ratio.
-   [ ] A/D moves the player horizontally.
-   [ ] W/S moves the player along arena depth.
-   [ ] Shift increases movement speed.
-   [ ] Diagonal movement is not faster than straight movement.
-   [ ] Player cannot leave the defined arena bounds.
-   [ ] Player visual scale changes smoothly with depth.
-   [ ] Shadow remains aligned with the player's ground position.
-   [ ] Debug toggle displays coordinates and physics bounds.
-   [ ] Grid toggle works.
-   [ ] R resets the player to spawn.
-   [ ] Losing browser focus clears held keys.
-   [ ] Rendering does not mutate gameplay state.
-   [ ] Movement speed is consistent on 60 Hz and high-refresh displays.

------------------------------------------------------------------------

# 12. Current Stage 1 control mapping

  Key     Action
  ------- ------------------------
  A       Move left
  D       Move right
  W       Move deeper into arena
  S       Move toward camera
  Shift   Run
  R       Reset position

Combat controls are intentionally not active in Stage 1. Resolve the
future block/depth key conflict before implementing combat.

------------------------------------------------------------------------

# 13. Run locally

Because the project uses JavaScript ES modules, run it through a local
HTTP server rather than opening `index.html` with `file://`.

Python:

``` bash
python -m http.server 8000
```

Open:

``` text
http://localhost:8000
```

Or use VS Code Live Server.

------------------------------------------------------------------------

# 14. First task prompt for the VS Code agent

Copy the prompt below into your VS Code coding agent after opening the
project folder:

> Read this entire project brief first. Inspect the current repository
> before changing files.
>
> Implement **Stage 1 --- Movement prototype only**.
>
> Use vanilla JavaScript ES modules, HTML5 Canvas 2D, CSS, internal
> resolution 960×540, responsive 16:9 scaling, pixelated rendering, and
> a fixed 60 Hz update timestep.
>
> Implement a pseudo-2.5D arena where the player moves horizontally
> using A/D and along arena depth using W/S. Add normalized diagonal
> movement, Shift to run, arena bounds, depth-based character scale, a
> ground-aligned shadow, a debug overlay, a grid toggle, and R to reset
> the spawn position.
>
> Use an original code-drawn placeholder office-worker sprite. Do not
> download or copy third-party sprites.
>
> Keep the architecture modular. Separate game loop, input, player
> entity, and arena scene. Keep update and render separate. Clear held
> keys when the browser tab loses focus.
>
> Do not implement combat, boss AI, menus, campaign, or arcade mode yet.
>
> After implementation, run or inspect the project for syntax and import
> errors. Report all changed files, how to run it, a manual acceptance
> checklist, and any known limitations. Do not claim a test passed
> unless it was actually run.

------------------------------------------------------------------------

# 15. Future agent handoff rules

When asking the coding agent to continue in a later session: 1. Tell it
the milestone to implement. 2. Ask it to inspect the current code and
README first. 3. Ask it to preserve working behavior. 4. Ask it to
implement only that milestone. 5. Ask it to update README and acceptance
criteria. 6. Ask it to report exact files changed and tests performed.

**Current source of truth:** this document. If implementation and
document disagree, identify the discrepancy and ask before making a
major architectural change.
