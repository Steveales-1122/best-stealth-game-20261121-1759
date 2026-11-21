// Render: all art is drawn programmatically on canvas — floor tiles, stone
// walls, wooden crates, leafy bushes, glowing seals, the exit door, guards
// with their vision cones, and the hooded courier. No image files.
import { TILE, COLS, ROWS } from './level.js';
import { conePolygon } from './vision.js';

const FLOOR_A = '#1a1e2c';
const FLOOR_B = '#171b28';
const WALL_TOP = '#3a4157';
const WALL_FACE = '#232839';

export function drawScene(ctx, game) {
  const { level, player, guards } = game;
  drawFloor(ctx);
  drawBushesUnder(ctx, level);
  drawExit(ctx, level);
  drawSeals(ctx, level);
  drawCrates(ctx, level);
  drawWalls(ctx, level);
  drawPatrolRoutes(ctx, guards);
  drawCones(ctx, guards, level);
  drawGuards(ctx, guards);
  drawPlayer(ctx, player, game.time);
  drawNoiseRing(ctx, player);
  drawVignette(ctx);
}

function drawFloor(ctx) {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      ctx.fillStyle = (r + c) % 2 === 0 ? FLOOR_A : FLOOR_B;
      ctx.fillRect(c * TILE, r * TILE, TILE, TILE);
    }
  }
  // Faint carpet runner down the middle halls, for readable cover.
  ctx.fillStyle = 'rgba(120, 40, 48, 0.16)';
  ctx.fillRect(0, 11 * TILE, COLS * TILE, TILE);
  ctx.fillStyle = 'rgba(120, 40, 48, 0.10)';
  ctx.fillRect(15 * TILE, 0, TILE, ROWS * TILE);
}

function drawWalls(ctx, level) {
  for (const w of level.walls) {
    ctx.fillStyle = WALL_FACE;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.fillStyle = WALL_TOP;
    ctx.fillRect(w.x, w.y, w.w, 5);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(w.x, w.y + 5, w.w, 2);
  }
}

function drawCrates(ctx, level) {
  for (const c of level.crates) {
    ctx.fillStyle = '#6b4a26';
    ctx.fillRect(c.x + 2, c.y + 2, c.w - 4, c.h - 4);
    ctx.strokeStyle = '#4a3016';
    ctx.lineWidth = 2;
    ctx.strokeRect(c.x + 3, c.y + 3, c.w - 6, c.h - 6);
    ctx.beginPath();
    ctx.moveTo(c.x + 3, c.y + 3);
    ctx.lineTo(c.x + c.w - 3, c.y + c.h - 3);
    ctx.moveTo(c.x + c.w - 3, c.y + 3);
    ctx.lineTo(c.x + 3, c.y + c.h - 3);
    ctx.stroke();
    ctx.fillStyle = '#8a6238';
    ctx.fillRect(c.x + 5, c.y + 5, c.w - 10, 4);
  }
}

function drawBushesUnder(ctx, level) {
  for (const b of level.bushes) {
    ctx.fillStyle = 'rgba(24, 68, 34, 0.55)';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.r + 4, 0, Math.PI * 2);
    ctx.fill();
  }
  for (const b of level.bushes) {
    ctx.fillStyle = '#2c6b34';
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * Math.PI * 2 + b.x * 0.01;
      const rr = b.r * 0.55;
      ctx.beginPath();
      ctx.arc(b.x + Math.cos(a) * rr, b.y + Math.sin(a) * rr, 10, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#3d8a46';
    ctx.beginPath();
    ctx.arc(b.x - 4, b.y - 5, 9, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawSeals(ctx, level) {
  for (const s of level.seals) {
    if (s.taken) continue;
    const pulse = 0.55 + Math.sin(Date.now() / 300 + s.x) * 0.2;
    const glow = ctx.createRadialGradient(s.x, s.y, 2, s.x, s.y, 30);
    glow.addColorStop(0, `rgba(242, 201, 76, ${pulse})`);
    glow.addColorStop(1, 'rgba(242, 201, 76, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(s.x, s.y, 30, 0, Math.PI * 2);
    ctx.fill();
    // A little lantern: brass cap, glowing glass, hanging ring.
    ctx.strokeStyle = '#c9a227';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(s.x, s.y - 9, 4, Math.PI, 0);
    ctx.stroke();
    ctx.fillStyle = '#8a6d1f';
    ctx.fillRect(s.x - 7, s.y - 8, 14, 4);
    ctx.fillStyle = '#ffe27a';
    ctx.fillRect(s.x - 6, s.y - 4, 12, 14);
    ctx.fillStyle = '#8a6d1f';
    ctx.fillRect(s.x - 7, s.y + 10, 14, 3);
    ctx.fillStyle = '#fff6c0';
    ctx.fillRect(s.x - 2, s.y - 1, 4, 8);
  }
}

function drawExit(ctx, level) {
  const e = level.exit;
  if (!e) return;
  const glow = ctx.createRadialGradient(
    e.x + e.w / 2, e.y + e.h / 2, 4, e.x + e.w / 2, e.y + e.h / 2, 52,
  );
  glow.addColorStop(0, 'rgba(74, 222, 128, 0.5)');
  glow.addColorStop(1, 'rgba(74, 222, 128, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(e.x + e.w / 2, e.y + e.h / 2, 52, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#14532d';
  ctx.fillRect(e.x - 2, e.y - 2, e.w + 4, e.h + 4);
  ctx.fillStyle = '#4ade80';
  ctx.fillRect(e.x + 4, e.y + 4, e.w - 8, e.h - 8);
  ctx.fillStyle = '#14532d';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', e.x + e.w / 2, e.y + e.h / 2 + 4);
}

function drawPatrolRoutes(ctx, guards) {
  ctx.strokeStyle = 'rgba(180, 190, 220, 0.14)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 6]);
  for (const g of guards) {
    ctx.beginPath();
    g.route.forEach((wp, i) => {
      if (i === 0) ctx.moveTo(wp.x, wp.y);
      else ctx.lineTo(wp.x, wp.y);
    });
    ctx.closePath();
    ctx.stroke();
  }
  ctx.setLineDash([]);
}

function drawCones(ctx, guards, level) {
  for (const g of guards) {
    const poly = conePolygon(g, level.solids, g.viewRange);
    const alarmed = g.state === 'alarmed';
    const suspicious = g.state === 'suspicious';
    ctx.fillStyle = alarmed
      ? 'rgba(239, 68, 68, 0.34)'
      : suspicious
        ? 'rgba(245, 158, 11, 0.28)'
        : 'rgba(250, 204, 21, 0.22)';
    ctx.beginPath();
    poly.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = alarmed
      ? 'rgba(239, 68, 68, 0.5)'
      : suspicious
        ? 'rgba(245, 158, 11, 0.45)'
        : 'rgba(250, 204, 21, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}

function drawGuards(ctx, guards) {
  for (const g of guards) {
    // Body: watchman in a dark blue coat with a brass lantern at the hip.
    ctx.fillStyle = '#1e2a4a';
    ctx.beginPath();
    ctx.arc(g.x, g.y, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = g.state === 'alarmed' ? '#ef4444' : g.state === 'suspicious' ? '#f59e0b' : '#5b6b8c';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Facing tick + lantern dot.
    ctx.strokeStyle = '#d7dce8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + Math.cos(g.facing) * 18, g.y + Math.sin(g.facing) * 18);
    ctx.stroke();
    ctx.fillStyle = '#f2c94c';
    ctx.beginPath();
    ctx.arc(g.x + Math.cos(g.facing + 1.2) * 10, g.y + Math.sin(g.facing + 1.2) * 10, 3, 0, Math.PI * 2);
    ctx.fill();
    // Suspicion meter above the head.
    if (g.suspicion > 1) {
      const w = 30;
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(g.x - w / 2, g.y - 26, w, 5);
      ctx.fillStyle = g.suspicion >= 100 ? '#ef4444' : g.suspicion >= 35 ? '#f59e0b' : '#e8c33c';
      ctx.fillRect(g.x - w / 2, g.y - 26, (w * g.suspicion) / 100, 5);
    }
    if (g.state === 'alarmed') {
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', g.x, g.y - 30);
    } else if (g.state === 'suspicious') {
      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', g.x, g.y - 30);
    }
  }
}

function drawPlayer(ctx, player, time) {
  const bob = player.moving ? Math.sin(time * 14) * 1.5 : 0;
  // Soft shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(player.x, player.y + 10, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  // Hooded cloak: deep teal, lighter when hidden in a bush.
  ctx.fillStyle = player.hidden ? '#2f7d5b' : '#0f766e';
  ctx.beginPath();
  ctx.arc(player.x, player.y + bob, player.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#5eead4';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Hood point in the facing direction.
  ctx.fillStyle = '#14b8a6';
  ctx.beginPath();
  ctx.arc(
    player.x + Math.cos(player.facing) * 7,
    player.y + bob + Math.sin(player.facing) * 7,
    5, 0, Math.PI * 2,
  );
  ctx.fill();
  // Sneak indicator: a small eye-slash ring when crouched.
  if (player.sneaking) {
    ctx.strokeStyle = 'rgba(94, 234, 212, 0.8)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(player.x, player.y + bob, player.radius + 5, 0, Math.PI * 2);
    ctx.stroke();
  }
  if (player.hidden) {
    ctx.fillStyle = '#bbf7d0';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HIDDEN', player.x, player.y - 20);
  }
}

function drawNoiseRing(ctx, player) {
  if (player.noiseRadius <= 0) return;
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 5]);
  ctx.beginPath();
  ctx.arc(player.x, player.y, player.noiseRadius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawVignette(ctx) {
  const g = ctx.createRadialGradient(480, 320, 260, 480, 320, 720);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 960, 640);
}
