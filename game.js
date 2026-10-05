// 게임 로직. 화면(DOM)을 모른다. 화면 코드는 이 모듈의 상태를 읽고 함수를 불러 다음 상태를 받는다.
//
// 상태 { board, pieces, score, over }
//   board  : SIZE×SIZE 2차원 배열. true 면 찬 칸.
//   pieces : 길이 3. 아직 안 쓴 블록은 모양 객체, 쓴 자리는 null.
//   score  : 이번 판 점수.
//   over   : 남은 블록을 하나도 놓을 수 없으면 true.
// 상태는 고치지 않고 새로 만들어 돌려준다.
//
// 바꿀 자리(계획의 미루는 정책): 모양 종류는 SHAPES, 뽑는 확률은 dealPiece, 점수 숫자는 SCORE, 판 크기는 SIZE.

export const SIZE = 8;

// 점수 숫자는 임시(계획): 놓은 칸당 1점, 지운 줄당 10점.
export const SCORE = { perCell: 1, perLine: 10 };

// 모양: cells 는 [행, 열] 목록. 회전이 없으므로 방향마다 따로 둔다.
export const SHAPES = [
  { id: 'dot', cells: [[0, 0]] },
  { id: 'i2h', cells: [[0, 0], [0, 1]] },
  { id: 'i2v', cells: [[0, 0], [1, 0]] },
  { id: 'i3h', cells: [[0, 0], [0, 1], [0, 2]] },
  { id: 'i3v', cells: [[0, 0], [1, 0], [2, 0]] },
  { id: 'i4h', cells: [[0, 0], [0, 1], [0, 2], [0, 3]] },
  { id: 'i4v', cells: [[0, 0], [1, 0], [2, 0], [3, 0]] },
  { id: 'i5h', cells: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]] },
  { id: 'i5v', cells: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]] },
  { id: 'o2', cells: [[0, 0], [0, 1], [1, 0], [1, 1]] },
  { id: 'o3', cells: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]] },
  { id: 'c1', cells: [[0, 0], [0, 1], [1, 0]] },
  { id: 'c2', cells: [[0, 0], [0, 1], [1, 1]] },
  { id: 'c3', cells: [[0, 0], [1, 0], [1, 1]] },
  { id: 'c4', cells: [[0, 1], [1, 0], [1, 1]] },
  { id: 'l1', cells: [[0, 0], [1, 0], [2, 0], [2, 1]] },
  { id: 'l2', cells: [[0, 0], [0, 1], [0, 2], [1, 0]] },
  { id: 'l3', cells: [[0, 0], [0, 1], [1, 1], [2, 1]] },
  { id: 'l4', cells: [[0, 2], [1, 0], [1, 1], [1, 2]] },
  { id: 't1', cells: [[0, 0], [0, 1], [0, 2], [1, 1]] },
  { id: 't2', cells: [[0, 1], [1, 0], [1, 1], [1, 2]] },
];

export function createBoard() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(false));
}

// 모양마다 같은 확률. random 은 [0, 1) 을 돌려주는 함수(테스트에서 바꿔 넣는다).
export function dealPiece(random = Math.random) {
  return SHAPES[Math.floor(random() * SHAPES.length)];
}

function dealThree(random) {
  return [dealPiece(random), dealPiece(random), dealPiece(random)];
}

// (row, col) 은 모양의 [0, 0] 이 놓일 칸.
export function canPlace(board, shape, row, col) {
  return shape.cells.every(([dr, dc]) => {
    const r = row + dr;
    const c = col + dc;
    return r >= 0 && r < SIZE && c >= 0 && c < SIZE && !board[r][c];
  });
}

export function canPlaceAnywhere(board, shape) {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (canPlace(board, shape, r, c)) return true;
    }
  }
  return false;
}

// 블록을 놓고 찬 가로·세로 줄을 함께 지운다. 놓을 수 없으면 null.
export function placeShape(board, shape, row, col) {
  if (!canPlace(board, shape, row, col)) return null;
  const next = board.map((line) => line.slice());
  for (const [dr, dc] of shape.cells) next[row + dr][col + dc] = true;

  // 지우기 전에 찬 줄을 모두 찾아야 가로·세로가 동시에 찼을 때 둘 다 지운다.
  const rows = [];
  const cols = [];
  for (let i = 0; i < SIZE; i++) {
    if (next[i].every(Boolean)) rows.push(i);
    if (next.every((line) => line[i])) cols.push(i);
  }
  for (const r of rows) next[r].fill(false);
  for (const c of cols) for (const line of next) line[c] = false;

  const gained = shape.cells.length * SCORE.perCell + (rows.length + cols.length) * SCORE.perLine;
  return { board: next, rows, cols, gained };
}

function isOver(board, pieces) {
  return pieces.every((p) => p === null || !canPlaceAnywhere(board, p));
}

export function newGame(random = Math.random) {
  const board = createBoard();
  const pieces = dealThree(random);
  return { board, pieces, score: 0, over: isOver(board, pieces) };
}

// pieces[index] 를 (row, col) 에 놓는다. 놓을 수 없으면 null(상태 그대로).
// 3개를 다 쓰면 새로 3개를 받고, 남은 블록을 하나도 놓을 수 없으면 over.
export function playPiece(state, index, row, col, random = Math.random) {
  if (state.over) return null;
  const shape = state.pieces[index];
  if (!shape) return null;
  const result = placeShape(state.board, shape, row, col);
  if (!result) return null;

  let pieces = state.pieces.map((p, i) => (i === index ? null : p));
  if (pieces.every((p) => p === null)) pieces = dealThree(random);

  return {
    board: result.board,
    pieces,
    score: state.score + result.gained,
    over: isOver(result.board, pieces),
    cleared: { rows: result.rows, cols: result.cols },
  };
}
