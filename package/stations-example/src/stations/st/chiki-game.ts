// Chiki station: the rules of the little board, with no drawing in them.
//
// A block slides until a wall stops it. It goes straight through other blocks,
// and every block it passes through is knocked one step back the way it came.
// The board is quiet when every block sits in its own bed.

export type Dir = 0 | 1 | 2 | 3; // up, right, down, left
export const DX = [0, 1, 0, -1];
export const DY = [-1, 0, 1, 0];
export const DIR_NAME = ["up", "right", "down", "left"];

export type XY = [number, number];

export type Level = {
  name: string;
  w: number;
  h: number;
  walls: Set<number>;
  start: XY[];
  beds: XY[];
};

export type Result = {
  /** positions after the move */
  pos: XY[];
  /** cells the mover travelled through, in order (not including its start) */
  path: XY[];
  /** blocks knocked back, with the step along the path where the mover reached them */
  knocked: { j: number; step: number }[];
};

// Rows: # wall, . floor, a-c blocks, A-C their beds.
// Every board was checked with a breadth-first solver: each has exactly one
// shortest solution, and none can be solved without knocking.
const BOARDS: { name: string; rows: string[] }[] = [
  // b right, b down
  { name: "Through", rows: ["......", "......", "b...Aa", "......", "......", ".....B"] },
  // a right, b up, a left, b down
  { name: "Trade", rows: ["..a...", ".#A...", "......", "......", "....#b", ".....B"] },
  // b up, b right, b down, c down, a right
  { name: "Chain", rows: ["#....#", "...b..", "..#...", "...#c.", "....B.", "#.aCA#"] },
];

export const LEVELS: Level[] = BOARDS.map(({ name, rows }) => {
  const h = rows.length;
  const w = rows[0].length;
  const walls = new Set<number>();
  const start: XY[] = [];
  const beds: XY[] = [];
  rows.forEach((r, y) =>
    [...r].forEach((ch, x) => {
      if (ch === "#") walls.add(y * w + x);
      else if (ch >= "a" && ch <= "z") start[ch.charCodeAt(0) - 97] = [x, y];
      else if (ch >= "A" && ch <= "Z") beds[ch.charCodeAt(0) - 65] = [x, y];
    }),
  );
  return { name, w, h, walls, start, beds };
});

export const isWall = (L: Level, x: number, y: number) => x < 0 || y < 0 || x >= L.w || y >= L.h || L.walls.has(y * L.w + x);

export function slide(L: Level, pos: XY[], i: number, d: Dir): Result | null {
  const dx = DX[d];
  const dy = DY[d];
  let [x, y] = pos[i];
  const path: XY[] = [];
  while (!isWall(L, x + dx, y + dy)) {
    x += dx;
    y += dy;
    path.push([x, y]);
  }
  if (!path.length) return null;
  const out = pos.map((p) => [p[0], p[1]] as XY);
  out[i] = [x, y];
  const knocked: Result["knocked"] = [];
  pos.forEach((p, j) => {
    if (j === i) return;
    const step = path.findIndex((c) => c[0] === p[0] && c[1] === p[1]);
    if (step < 0) return;
    // the cell behind is always free: the mover just left it
    out[j] = [p[0] - dx, p[1] - dy];
    knocked.push({ j, step });
  });
  return { pos: out, path, knocked };
}

export const home = (L: Level, pos: XY[], i: number) => pos[i][0] === L.beds[i][0] && pos[i][1] === L.beds[i][1];
export const awake = (L: Level, pos: XY[]) => pos.reduce((n, _, i) => n + (home(L, pos, i) ? 0 : 1), 0);
