// Player: the courier Wren. Walk, sneak (slow, hard to spot) or run
// (fast, loud, easy to spot). Keyboard moves; mouse click sets a walk target.
import { isHiddenInBush } from './vision.js';

export const WALK_SPEED = 128;
export const SNEAK_SPEED = 68;
export const RUN_SPEED = 205;

export class Player {
  constructor(start) {
    this.x = start.x;
    this.y = start.y;
    this.radius = 13;
    this.facing = 0;
    this.sneaking = false;
    this.running = false;
    this.moving = false;
    this.moveTarget = null; // {x, y} from a mouse click
    this.stepTimer = 0;
    this.hidden = false;
    this.noiseRadius = 0;
  }

  get speed() {
    if (this.sneaking) return SNEAK_SPEED;
    if (this.running) return RUN_SPEED;
    return WALK_SPEED;
  }

  update(dt, keys, level, audio) {
    let dx = 0;
    let dy = 0;
    if (keys.has('arrowup') || keys.has('w')) dy -= 1;
    if (keys.has('arrowdown') || keys.has('s')) dy += 1;
    if (keys.has('arrowleft') || keys.has('a')) dx -= 1;
    if (keys.has('arrowright') || keys.has('d')) dx += 1;
    this.sneaking = keys.has('shift') || keys.has('c');
    this.running = keys.has(' ') && !this.sneaking;

    if (dx !== 0 || dy !== 0) {
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;
      this.moveTarget = null; // keyboard overrides click-to-move
    } else if (this.moveTarget) {
      const tx = this.moveTarget.x - this.x;
      const ty = this.moveTarget.y - this.y;
      const dist = Math.hypot(tx, ty);
      if (dist < 6) {
        this.moveTarget = null;
      } else {
        dx = tx / dist;
        dy = ty / dist;
      }
    }

    this.moving = dx !== 0 || dy !== 0;
    if (this.moving) {
      this.facing = Math.atan2(dy, dx);
      const step = this.speed * dt;
      const nx = this.x + dx * step;
      const ny = this.y + dy * step;
      if (!this.hitsSolid(nx, this.y, level)) this.x = nx;
      if (!this.hitsSolid(this.x, ny, level)) this.y = ny;
      this.stepTimer -= dt;
      if (this.stepTimer <= 0) {
        this.stepTimer = this.sneaking ? 0.55 : this.running ? 0.26 : 0.38;
        audio.playerStep(this.sneaking, this.running);
      }
    }

    this.hidden = isHiddenInBush(this, level.bushes);
    // Running is loud: nearby guards turn to investigate the noise.
    this.noiseRadius = this.moving && this.running ? 130 : this.moving && !this.sneaking ? 34 : 0;
  }

  hitsSolid(x, y, level) {
    const r = this.radius;
    for (const rect of level.solids) {
      if (x + r > rect.x && x - r < rect.x + rect.w && y + r > rect.y && y - r < rect.y + rect.h) return true;
    }
    return false;
  }

  collectSeals(level, audio) {
    for (const seal of level.seals) {
      if (!seal.taken && Math.hypot(seal.x - this.x, seal.y - this.y) < 26) {
        seal.taken = true;
        audio.pickup();
        return seal;
      }
    }
    return null;
  }
}
