// Game: state machine (title -> playing -> levelClear -> caught -> won),
// the frame loop, keyboard + mouse input, HUD updates and level flow.
import { LEVELS, parseLevel, solidRects } from './level.js';
import { Player } from './player.js';
import { Guard } from './guard.js';
import { SoundBank } from './audio.js';
import { drawScene } from './render.js';

const SAVE_KEY = 'lantern-heist-best-time';

export class Game {
  constructor(canvas, overlay, hud, toast, statusEl) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.overlay = overlay;
    this.hud = hud;
    this.toastEl = toast;
    this.statusEl = statusEl;
    this.audio = new SoundBank();
    this.keys = new Set();
    this.state = 'title'; // title | playing | levelClear | caught | won
    this.levelIndex = 0;
    this.level = null;
    this.player = null;
    this.guards = [];
    this.sealsGot = 0;
    this.sealsTotal = 0;
    this.time = 0;
    this.levelTime = 0;
    this.lastTs = 0;
    this.toastTimer = null;
    this.bestTime = Number(localStorage.getItem(SAVE_KEY) || 0);
    this.bindInput();
  }

  bindInput() {
    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
      if (k === 'enter' && (this.state === 'title' || this.state === 'caught' || this.state === 'won' || this.state === 'levelclear')) {
        this.startLevel(this.state === 'levelclear' ? this.levelIndex + 1 : this.levelIndex);
        return;
      }
      if (k === 'r' && (this.state === 'caught' || this.state === 'playing')) {
        this.startLevel(this.levelIndex);
        return;
      }
      if (k === 'm') {
        const on = this.audio.toggle();
        this.hud.sound.textContent = `Sound: ${on ? 'on' : 'off'}`;
        return;
      }
      this.keys.add(k);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    this.canvas.addEventListener('mousedown', (e) => {
      this.audio.ensure();
      if (this.state !== 'playing') return;
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      this.player.moveTarget = {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    });
    this.hud.sound.addEventListener('click', () => {
      this.audio.ensure();
      const on = this.audio.toggle();
      this.hud.sound.textContent = `Sound: ${on ? 'on' : 'off'}`;
    });
    this.overlay.addEventListener('click', (e) => {
      if (e.target.tagName === 'BUTTON') {
        this.audio.ensure();
        const next = this.state === 'levelclear' ? this.levelIndex + 1 : this.levelIndex;
        this.startLevel(next);
      }
    });
  }

  startLevel(index) {
    if (index >= LEVELS.length) {
      this.winGame();
      return;
    }
    this.levelIndex = index;
    const def = LEVELS[index];
    this.level = parseLevel(def);
    this.level.solids = solidRects(this.level);
    this.player = new Player(this.level.playerStart);
    this.guards = this.level.guards.map((g, i) => new Guard(g, i));
    this.sealsGot = 0;
    this.sealsTotal = this.level.seals.length;
    this.levelTime = 0;
    this.state = 'playing';
    this.overlay.classList.add('hidden');
    this.updateHud();
    this.showToast(`${def.name} — ${def.sub}`);
    this.announce(`${def.name}. Collect ${this.sealsTotal} lantern seals, then reach the green exit unseen.`);
  }

  showTitle() {
    this.state = 'title';
    // A live level behind the title so the first screenshot frame is rich.
    this.levelIndex = 0;
    this.level = parseLevel(LEVELS[0]);
    this.level.solids = solidRects(this.level);
    this.player = new Player(this.level.playerStart);
    this.guards = this.level.guards.map((g, i) => new Guard(g, i));
    this.sealsTotal = this.level.seals.length;
    this.overlay.innerHTML = `
      <h1>LANTERN HEIST</h1>
      <h2>The Quiet Archive</h2>
      <p>You are Wren, a courier with light fingers. The Ember Archive keeps three
      stolen lantern seals behind its night watch. Gather every seal, then slip
      out the green exit — unseen.</p>
      <p class="keys"><b>WASD / arrows</b> move &nbsp;·&nbsp; <b>Shift / C</b> sneak &nbsp;·&nbsp; <b>Space</b> run (loud!) &nbsp;·&nbsp; <b>Click</b> walk to a spot &nbsp;·&nbsp; <b>R</b> retry &nbsp;·&nbsp; <b>M</b> mute</p>
      <p class="keys">Bushes hide you. Crates and walls block a guard's sight. A glimpse only
      raises suspicion — break line of sight and it fades. A full alarm means a chase.</p>
      <button type="button">Begin the heist</button>
      ${this.bestTime ? `<p class="keys">Best full run: ${formatTime(this.bestTime)}</p>` : ''}`;
    this.overlay.classList.remove('hidden');
    this.updateHud();
  }

  winGame() {
    this.state = 'won';
    this.audio.win();
    if (!this.bestTime || this.time < this.bestTime) {
      this.bestTime = this.time;
      localStorage.setItem(SAVE_KEY, String(Math.round(this.time * 1000) / 1000));
    }
    this.overlay.innerHTML = `
      <h1>GHOST OF THE ARCHIVE</h1>
      <h2>You stole every seal and were never seen</h2>
      <p>All three vaults emptied in ${formatTime(this.time)}. The watchmen will swear
      the lanterns walked out on their own.</p>
      <button type="button">Play again</button>`;
    this.overlay.classList.remove('hidden');
    this.announce(`You won. Total time ${formatTime(this.time)}.`);
  }

  onCaught(guard) {
    if (this.state !== 'playing') return;
    this.state = 'caught';
    this.audio.caught();
    this.overlay.innerHTML = `
      <h1>CAUGHT</h1>
      <h2>Watchman ${guard.id + 1} grabbed your cloak</h2>
      <p>You had ${this.sealsGot} of ${this.sealsTotal} seals on ${this.level.name}.
      Next time: watch the cones, sneak through the bushes, and never sprint in the open.</p>
      <button type="button">Try this level again (R)</button>`;
    this.overlay.classList.remove('hidden');
    this.announce('Caught by a guard. Press R to retry the level.');
  }

  onLevelClear() {
    this.state = 'levelclear';
    this.audio.levelClear();
    const last = this.levelIndex === LEVELS.length - 1;
    this.overlay.innerHTML = `
      <h1>${last ? 'LAST VAULT EMPTIED' : 'VAULT EMPTIED'}</h1>
      <h2>${this.level.name} — ${formatTime(this.levelTime)}</h2>
      <p>${last ? 'One last door stands between you and the night.' : 'The next vault is darker, and its watch is thicker.'}</p>
      <button type="button">${last ? 'Slip into the night' : 'Next level'}</button>`;
    this.overlay.classList.remove('hidden');
    this.announce(`${this.level.name} cleared in ${formatTime(this.levelTime)}.`);
  }

  update(dt) {
    if (this.state !== 'playing') return;
    this.time += dt;
    this.levelTime += dt;
    this.player.update(dt, this.keys, this.level, this.audio);
    const caught = (g) => this.onCaught(g);
    for (const guard of this.guards) guard.update(dt, this.player, this.level, this.audio, caught);
    if (this.state !== 'playing') return; // a catch ended the level

    // Running noise draws nearby guards toward the sound.
    if (this.player.noiseRadius >= 130) {
      for (const guard of this.guards) {
        if (guard.state === 'patrol' && Math.hypot(guard.x - this.player.x, guard.y - this.player.y) < 150) {
          guard.state = 'suspicious';
          guard.suspicion = Math.max(guard.suspicion, 40);
          guard.lastSeen = { x: this.player.x, y: this.player.y };
          guard.investigateTimer = 4;
        }
      }
    }

    const seal = this.player.collectSeals(this.level, this.audio);
    if (seal) {
      this.sealsGot++;
      this.updateHud();
      this.showToast(`Seal ${this.sealsGot}/${this.sealsTotal} — ${this.sealsGot === this.sealsTotal ? 'now reach the green exit!' : 'keep going, stay low'}`);
      this.announce(`Seal ${this.sealsGot} of ${this.sealsTotal} collected.`);
    }

    // Exit opens only once every seal is taken.
    if (this.sealsGot === this.sealsTotal && this.level.exit) {
      const e = this.level.exit;
      if (
        this.player.x > e.x - 6 && this.player.x < e.x + e.w + 6 &&
        this.player.y > e.y - 6 && this.player.y < e.y + e.h + 6
      ) {
        this.onLevelClear();
      }
    }
    this.updateHud();
  }

  updateHud() {
    this.hud.level.textContent = `Level ${this.levelIndex + 1} — ${this.level ? this.level.name : ''}`;
    this.hud.seals.textContent = `Seals ${this.sealsGot}/${this.sealsTotal}`;
    this.hud.time.textContent = formatTime(this.time);
    let worst = 0;
    let label = 'CALM';
    for (const g of this.guards || []) {
      worst = Math.max(worst, g.suspicion);
      if (g.state === 'alarmed') label = 'ALARMED';
      else if (g.state === 'suspicious' && label !== 'ALARMED') label = 'SUSPICIOUS';
    }
    this.hud.alertLabel.textContent = label;
    this.hud.alertFill.style.width = `${worst}%`;
    this.hud.alertFill.style.background = label === 'ALARMED' ? '#ef4444' : label === 'SUSPICIOUS' ? '#f59e0b' : '#e8c33c';
    this.hud.alertLabel.style.color = label === 'CALM' ? '#e8e4d8' : this.hud.alertFill.style.background;
  }

  showToast(text) {
    this.toastEl.textContent = text;
    this.toastEl.classList.add('show');
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastEl.classList.remove('show'), 3600);
  }

  announce(text) {
    if (this.statusEl) this.statusEl.textContent = text;
  }

  frame(ts) {
    const dt = Math.min(0.05, (ts - this.lastTs) / 1000 || 0.016);
    this.lastTs = ts;
    if (this.state === 'title') {
      // Idle patrols drift behind the title screen.
      for (const guard of this.guards) guard.patrol(dt, this.level);
    } else {
      this.update(dt);
    }
    drawScene(this.ctx, this);
    requestAnimationFrame((t) => this.frame(t));
  }

  start() {
    // ?auto=1 skips the title so screenshots capture live play at once.
    // ?level=N starts at that level (1-based), for play-testing later vaults.
    const params = new URLSearchParams(location.search);
    const levelParam = Number.parseInt(params.get('level') || '1', 10);
    const startAt = Number.isFinite(levelParam) ? Math.min(Math.max(levelParam, 1), LEVELS.length) - 1 : 0;
    if (params.get('auto') === '1') {
      this.startLevel(startAt);
    } else {
      this.showTitle();
    }
    requestAnimationFrame((t) => this.frame(t));
  }
}

export function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
