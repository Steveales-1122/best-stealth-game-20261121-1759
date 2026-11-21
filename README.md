# Lantern Heist — The Quiet Archive

[![make.fun](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/c/best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/steveales-1122/best-stealth-game-20261121-1759/rank.svg)](https://make.fun/c/best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/steveales-1122/best-stealth-game-20261121-1759/reward.svg)](https://make.fun/c/best-stealth-game-20261121-1759)

An original top-down 2D stealth game for the [make.fun](https://make.fun/c/best-stealth-game-20261121-1759) "Make the best stealth game" bounty. You are **Wren**, a courier with light fingers, sneaking through the Ember Archive at night to recover three stolen lantern seals — then slipping out the green exit, unseen.

## How to play

Serve `game/` with any static server (for example `node serve.ts`, then open http://localhost:8080) and play in a desktop browser. No network, no build step, all art drawn in code.

- **WASD / arrow keys** — move. **Click** — walk to a spot.
- **Shift / C** — sneak: slow, hard to spot, quiet.
- **Space** — run: fast, but loud and easy to spot.
- **R** — retry the level. **M** — mute. **Enter** — start / continue.

## The stealth

- **Guards with vision cones** patrol fixed routes you can learn. Their cones are clipped by walls and crates, and turn amber, then red, as suspicion grows.
- **Detection with a chance to recover**: a far glimpse only raises suspicion, which fades when you break line of sight. A full alarm means a chase — lose the guard for four seconds and it falls back to searching, then returns to patrol.
- **Cover you can read at a glance**: crates and stone walls block sight, bushes hide you completely (unless a guard is almost on top of you), and a noise ring shows how far your running footsteps carry.
- **Three levels** — The Quiet Archive, The Lantern Gallery, The Vault of Embers — with more watchmen and tighter sightlines each time.
- **Sound, synthesized live** with WebAudio: your footsteps, guard steps that fade with distance, alert stings, pickup chimes, and win/lose phrases. No audio files.

## Structure

- `game/index.html` + `game/style.css` — page and HUD
- `game/main.js` — bootstrap
- `game/game.js` — state machine, frame loop, input, HUD, level flow
- `game/level.js` — the three level maps and patrol routes
- `game/vision.js` — line-of-sight, vision cones, bush hiding
- `game/guard.js` — patrol / suspicious / alarmed guard AI
- `game/player.js` — movement, sneak/run, noise, seal collection
- `game/audio.js` — synthesized WebAudio sounds
- `game/render.js` — all programmatic canvas art
- `main.ts` — the make.fun hand-in program; `vendor/makefun-game.ts` is the kit's copy, unchanged.

## License

MIT — see [LICENSE](LICENSE).
