// Vision: line-of-sight and cone tests for guards.
// A guard sees the player only inside its cone, within range, with a clear
// line of sight (walls and crates block it), and never inside a bush unless
// the guard is almost on top of the player.
import { TILE } from './level.js';

export const CONE_HALF_ANGLE = Math.PI / 5.2; // ~35 degrees each side
export const BASE_VIEW_RANGE = 235;

function segmentHitsRect(x1, y1, x2, y2, rect) {
  // Slab test: does segment (x1,y1)-(x2,y2) cross the rectangle?
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tMin = 0;
  let tMax = 1;
  for (const [p, d, lo, hi] of [
    [x1, dx, rect.x, rect.x + rect.w],
    [y1, dy, rect.y, rect.y + rect.h],
  ]) {
    if (Math.abs(d) < 1e-9) {
      if (p < lo || p > hi) return false;
    } else {
      let t1 = (lo - p) / d;
      let t2 = (hi - p) / d;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tMin = Math.max(tMin, t1);
      tMax = Math.min(tMax, t2);
      if (tMin > tMax) return false;
    }
  }
  return true;
}

export function hasLineOfSight(from, to, solids) {
  for (const rect of solids) {
    if (segmentHitsRect(from.x, from.y, to.x, to.y, rect)) return false;
  }
  return true;
}

export function angleDifference(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function isHiddenInBush(player, bushes) {
  for (const bush of bushes) {
    const dx = player.x - bush.x;
    const dy = player.y - bush.y;
    if (dx * dx + dy * dy < bush.r * bush.r) return true;
  }
  return false;
}

// Returns { seen: boolean, distance, closeness } where closeness 0..1
// (1 = right in front of the guard) drives how fast suspicion rises.
export function guardSeesPlayer(guard, player, level) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const distance = Math.hypot(dx, dy);
  const range = guard.viewRange;
  if (distance > range) return { seen: false, distance, closeness: 0 };
  const angleToPlayer = Math.atan2(dy, dx);
  if (Math.abs(angleDifference(angleToPlayer, guard.facing)) > CONE_HALF_ANGLE) {
    return { seen: false, distance, closeness: 0 };
  }
  if (isHiddenInBush(player, level.bushes) && distance > 46) {
    return { seen: false, distance, closeness: 0 };
  }
  if (!hasLineOfSight(guard, player, level.solids)) {
    return { seen: false, distance, closeness: 0 };
  }
  const closeness = 1 - distance / range;
  return { seen: true, distance, closeness };
}

// Build the cone polygon for rendering: a fan of rays clipped by walls.
export function conePolygon(guard, solids, range) {
  const points = [{ x: guard.x, y: guard.y }];
  const steps = 26;
  for (let i = 0; i <= steps; i++) {
    const a = guard.facing - CONE_HALF_ANGLE + (2 * CONE_HALF_ANGLE * i) / steps;
    const dirX = Math.cos(a);
    const dirY = Math.sin(a);
    let hit = range;
    for (const rect of solids) {
      const t = rayHitsRect(guard.x, guard.y, dirX, dirY, rect);
      if (t !== null && t < hit) hit = t;
    }
    points.push({ x: guard.x + dirX * hit, y: guard.y + dirY * hit });
  }
  return points;
}

function rayHitsRect(ox, oy, dx, dy, rect) {
  let tMin = 0;
  let tMax = Infinity;
  for (const [o, d, lo, hi] of [
    [ox, dx, rect.x, rect.x + rect.w],
    [oy, dy, rect.y, rect.y + rect.h],
  ]) {
    if (Math.abs(d) < 1e-9) {
      if (o < lo || o > hi) return null;
    } else {
      let t1 = (lo - o) / d;
      let t2 = (hi - o) / d;
      if (t1 > t2) [t1, t2] = [t2, t1];
      tMin = Math.max(tMin, t1);
      tMax = Math.min(tMax, t2);
      if (tMin > tMax) return null;
    }
  }
  return tMin;
}

export function tileOf(x, y) {
  return { c: Math.floor(x / TILE), r: Math.floor(y / TILE) };
}
