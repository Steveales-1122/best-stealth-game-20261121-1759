// Level definitions for Lantern Heist: tile maps plus guard patrol routes.
// Legend: '#' wall, 'C' crate (blocks sight + movement), 'B' bush (hides you),
// '.' floor, 'S' lantern seal, 'E' exit door, 'P' player start.
// Guard waypoints are tile coordinates; guards walk them in order and pause.
export const TILE = 32;
export const COLS = 30;
export const ROWS = 20;

function buildLevel(name, sub, rows, guards) {
  return { name, sub, rows, guards };
}

export const LEVELS = [
  buildLevel(
    'The Quiet Archive',
    'Learn the patrols. Three seals, then slip out the green door.',
    [
      '##############################',
      '#P....B.....#........B.......#',
      '#.....##....#....C...........#',
      '#.....##....#....C....S......#',
      '#.....##....#....C...........#',
      '#..B..##....#.........##.....#',
      '#.....##....#....B....##..S..#',
      '#.....##....#.........##.....#',
      '#..C.......C......C...##.....#',
      '#..C.......C......C...##..B..#',
      '#..C....B..C......C...##.....#',
      '#............................#',
      '#....####......#####....C....#',
      '#....####..S...#####....C....#',
      '#....####......#####.........B',
      '#.........B..........C.......#',
      '#....C.........B.............#',
      '#....C....B........####......#',
      '#....C.............####...E..#',
      '##############################',
    ],
    [
      { waypoints: [[2, 1], [5, 1], [5, 7], [2, 7]], pause: 1.2 },
      { waypoints: [[14, 1], [16, 1], [16, 9], [14, 9]], pause: 1.0 },
      { waypoints: [[24, 1], [28, 1], [28, 7], [24, 7]], pause: 1.4 },
      { waypoints: [[2, 12], [4, 12], [4, 18], [2, 18]], pause: 0.8 },
      { waypoints: [[10, 12], [14, 12], [14, 18], [10, 18]], pause: 1.1 },
      { waypoints: [[25, 13], [27, 13], [27, 17], [25, 17]], pause: 0.9 },
    ],
  ),
  buildLevel(
    'The Lantern Gallery',
    'Long sightlines down the gallery. Bushes are your only friends.',
    [
      '##############################',
      '#P..B........##......B.......#',
      '#....C.......##.......C......#',
      '#....C.......##.......C..S...#',
      '#....C.......##..............#',
      '#.....B......##...B......C...#',
      '#............##..........C...#',
      '#..S.........##......B.......#',
      '#............##..............#',
      '#....####....##....####......#',
      '#....####....##....####...B..#',
      '#....####....##....####......#',
      '#............##..............#',
      '#..B.........##.....C....S...#',
      '#............##.....C........#',
      '#....C.......##..........B...#',
      '#....C...B...##......C.......#',
      '#....C.......##......C....E..#',
      '#............................#',
      '##############################',
    ],
    [
      { waypoints: [[2, 1], [12, 1], [12, 7], [2, 7]], pause: 0.9 },
      { waypoints: [[17, 1], [27, 1], [27, 7], [17, 7]], pause: 1.1 },
      { waypoints: [[2, 8], [12, 8], [12, 12], [2, 12]], pause: 1.3 },
      { waypoints: [[17, 8], [27, 8], [27, 12], [17, 12]], pause: 0.7 },
      { waypoints: [[2, 18], [12, 18], [12, 13], [2, 13]], pause: 0.5 },
      { waypoints: [[17, 15], [20, 15], [20, 17], [17, 17]], pause: 1.0 },
    ],
  ),
  buildLevel(
    'The Vault of Embers',
    'Six watchmen, one way out. Patience wins; sprinting gets you caught.',
    [
      '##############################',
      '#P....B...#.....B.....#......#',
      '#....C....#.....C.....#..S...#',
      '#....C....#.....C.....#......#',
      '#....C....#.....C.....#..C...#',
      '#..B......#..B........#..C...#',
      '#.........#...........#......#',
      '#....####.#....####...#..B...#',
      '#....####.#....####...#......#',
      '#....####.#....####...#......#',
      '#.........#...........#......#',
      '#..S......#..B....C...#..S...#',
      '#.........#.......C...#......#',
      '#....C....#....B......#..C...#',
      '#....C....#...........#..C...#',
      '#....C....#..B....C...#......#',
      '#....B....#.......C...#..B...#',
      '#.........#...........#...E..#',
      '#............................#',
      '##############################',
    ],
    [
      { waypoints: [[2, 1], [8, 1], [8, 6], [2, 6]], pause: 0.8 },
      { waypoints: [[12, 1], [19, 1], [19, 6], [12, 6]], pause: 1.0 },
      { waypoints: [[23, 1], [27, 1], [27, 6], [23, 6]], pause: 0.9 },
      { waypoints: [[2, 11], [8, 11], [8, 17], [2, 17]], pause: 1.2 },
      { waypoints: [[12, 12], [16, 12], [16, 17], [12, 17]], pause: 0.7 },
      { waypoints: [[23, 11], [27, 11], [27, 16], [23, 16]], pause: 1.1 },
    ],
  ),
];

// Parse a level's rows into colliders, bushes, seals, exit and player start.
export function parseLevel(def) {
  const walls = [];
  const crates = [];
  const bushes = [];
  const seals = [];
  let exit = null;
  let playerStart = { x: TILE * 1.5, y: TILE * 1.5 };
  def.rows.forEach((row, r) => {
    [...row].forEach((ch, c) => {
      const x = c * TILE;
      const y = r * TILE;
      if (ch === '#') walls.push({ x, y, w: TILE, h: TILE });
      else if (ch === 'C') crates.push({ x, y, w: TILE, h: TILE });
      else if (ch === 'B') bushes.push({ x: x + TILE / 2, y: y + TILE / 2, r: 26 });
      else if (ch === 'S') seals.push({ x: x + TILE / 2, y: y + TILE / 2, taken: false });
      else if (ch === 'E') exit = { x, y, w: TILE, h: TILE };
      else if (ch === 'P') playerStart = { x: x + TILE / 2, y: y + TILE / 2 };
    });
  });
  const guards = def.guards.map((g) => ({
    waypoints: g.waypoints.map(([c, r]) => ({ x: c * TILE + TILE / 2, y: r * TILE + TILE / 2 })),
    pause: g.pause,
  }));
  return { name: def.name, sub: def.sub, walls, crates, bushes, seals, exit, playerStart, guards };
}

// Every solid rectangle: walls and crates both block movement and sight.
export function solidRects(level) {
  return [...level.walls, ...level.crates];
}
