// Guard: patrols waypoints, grows suspicious when it glimpses the player,
// investigates, chases when sure, and calms down when the trail goes cold.
// States: 'patrol' -> 'suspicious' -> 'alarmed' -> 'suspicious' -> 'patrol'.
import { BASE_VIEW_RANGE, guardSeesPlayer, angleDifference } from './vision.js';

export const PATROL_SPEED = 62;
export const CHASE_SPEED = 132;
export const INVESTIGATE_SPEED = 92;

export class Guard {
  constructor(route, index) {
    this.route = route.waypoints;
    this.pauseTime = route.pause;
    this.x = this.route[0].x;
    this.y = this.route[0].y;
    this.waypointIndex = 1 % this.route.length;
    this.facing = 0;
    this.state = 'patrol';
    this.suspicion = 0; // 0..100, the detection meter
    this.pauseLeft = 0;
    this.lastSeen = null;
    this.loseSightTimer = 0;
    this.investigateTimer = 0;
    this.scanTimer = 0;
    this.stepPhase = Math.random() * Math.PI * 2;
    this.stepTimer = 0;
    this.id = index;
    this.viewRange = BASE_VIEW_RANGE;
    this.faceWaypoint();
  }

  faceWaypoint() {
    const wp = this.route[this.waypointIndex];
    this.facing = Math.atan2(wp.y - this.y, wp.x - this.x);
  }

  // Sneaking shrinks the cone; sprinting stretches it.
  updateViewRange(player) {
    let range = BASE_VIEW_RANGE;
    if (player.sneaking) range *= 0.62;
    if (player.running) range *= 1.18;
    this.viewRange = range;
  }

  update(dt, player, level, audio, onCaught) {
    this.updateViewRange(player);
    const sight = guardSeesPlayer(this, player, level);
    const wasAlarmed = this.state === 'alarmed';

    if (sight.seen) {
      // Closer + faster player = faster suspicion. A far glimpse gives
      // the player a real chance to duck away before the alarm trips.
      const rate = 26 + sight.closeness * 95 + (player.running ? 22 : 0);
      this.suspicion = Math.min(100, this.suspicion + rate * dt);
      this.lastSeen = { x: player.x, y: player.y };
      this.loseSightTimer = 0;
      if (this.suspicion >= 100 && !wasAlarmed) {
        this.state = 'alarmed';
        audio.alertSting();
      } else if (this.suspicion >= 35 && this.state === 'patrol') {
        this.state = 'suspicious';
      }
    } else {
      this.suspicion = Math.max(0, this.suspicion - (this.state === 'alarmed' ? 7 : 17) * dt);
      this.loseSightTimer += dt;
      if (this.state === 'alarmed' && this.loseSightTimer > 4) {
        this.state = 'suspicious';
        this.investigateTimer = 5;
      } else if (this.state === 'suspicious' && this.suspicion <= 0) {
        this.state = 'patrol';
        this.investigateTimer = 0;
      }
    }

    if (this.state === 'alarmed' && this.lastSeen) {
      this.moveToward(this.lastSeen, CHASE_SPEED, dt, level);
      this.facing = Math.atan2(this.lastSeen.y - this.y, this.lastSeen.x - this.x);
      if (Math.hypot(player.x - this.x, player.y - this.y) < 22) onCaught(this);
    } else if (this.state === 'suspicious' && this.lastSeen) {
      const arrived = this.moveToward(this.lastSeen, INVESTIGATE_SPEED, dt, level);
      if (arrived) {
        // Look around the spot where the player was last glimpsed.
        this.investigateTimer -= dt;
        this.scanTimer += dt;
        this.facing += Math.sin(this.scanTimer * 1.6) * dt * 1.4;
        if (this.investigateTimer <= 0) {
          this.state = 'patrol';
          this.lastSeen = null;
        }
      }
    } else {
      this.patrol(dt, level);
    }

    // Footstep ticks so the player can hear a guard coming.
    this.stepTimer -= dt;
    if (this.stepTimer <= 0 && this.isMoving) {
      this.stepTimer = 0.62;
      audio.guardStep(this.x, this.y, player.x, player.y);
    }
  }

  patrol(dt, level) {
    if (this.pauseLeft > 0) {
      this.pauseLeft -= dt;
      this.isMoving = false;
      // Glance around while paused, like a real watchman.
      this.facing += Math.sin((this.pauseTime - this.pauseLeft) * 2.2) * dt * 0.5;
      if (this.pauseLeft <= 0) this.faceWaypoint();
      return;
    }
    const wp = this.route[this.waypointIndex];
    const arrived = this.moveToward(wp, PATROL_SPEED, dt, level);
    if (arrived) {
      this.waypointIndex = (this.waypointIndex + 1) % this.route.length;
      this.pauseLeft = this.pauseTime;
    }
  }

  // Move toward a point, sliding along walls. Returns true on arrival.
  moveToward(target, speed, dt, level) {
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 4) {
      this.isMoving = false;
      return true;
    }
    const step = Math.min(speed * dt, dist);
    const nx = this.x + (dx / dist) * step;
    const ny = this.y + (dy / dist) * step;
    this.facing = Math.atan2(dy, dx);
    this.isMoving = true;
    if (!this.hitsSolid(nx, this.y, level)) this.x = nx;
    if (!this.hitsSolid(this.x, ny, level)) this.y = ny;
    return false;
  }

  hitsSolid(x, y, level) {
    const r = 13;
    for (const rect of level.solids) {
      if (x + r > rect.x && x - r < rect.x + rect.w && y + r > rect.y && y - r < rect.y + rect.h) return true;
    }
    return false;
  }

  alertLabel() {
    if (this.state === 'alarmed') return 'ALARMED';
    if (this.state === 'suspicious') return 'SUSPICIOUS';
    return 'CALM';
  }
}
