// 손으로 재현하기 어려운 규칙만 검사한다: 판 밖·찬 칸 거절, 동시 지우기, 점수, 3개 보충, 끝 판정.
import test from 'node:test';
import assert from 'node:assert/strict';
import { SIZE, SHAPES, createBoard, canPlace, placeShape, newGame, playPiece } from './game.js';

const shape = (id) => SHAPES.find((s) => s.id === id);
// 항상 같은 모양을 주는 random
const always = (id) => () => SHAPES.indexOf(shape(id)) / SHAPES.length;

test('판 밖과 찬 칸에는 안 놓인다', () => {
  const board = createBoard();
  assert.equal(canPlace(board, shape('i3h'), 0, SIZE - 2), false);
  assert.equal(canPlace(board, shape('i3v'), -1, 0), false);
  board[2][2] = true;
  assert.equal(canPlace(board, shape('o2'), 1, 1), false);
  assert.equal(canPlace(board, shape('o2'), 3, 3), true);
  assert.equal(placeShape(board, shape('dot'), 2, 2), null);
});

test('가로 한 줄이 차면 지우고 칸당 1점 + 줄당 10점', () => {
  const board = createBoard();
  for (let c = 0; c < SIZE - 1; c++) board[4][c] = true;
  const r = placeShape(board, shape('dot'), 4, SIZE - 1);
  assert.deepEqual(r.rows, [4]);
  assert.deepEqual(r.cols, []);
  assert.ok(r.board[4].every((v) => !v));
  assert.equal(r.gained, 1 + 10);
});

test('세로 한 줄이 차면 지운다', () => {
  const board = createBoard();
  for (let r = 1; r < SIZE; r++) board[r][6] = true;
  const r = placeShape(board, shape('dot'), 0, 6);
  assert.deepEqual(r.cols, [6]);
  assert.ok(r.board.every((line) => !line[6]));
});

test('가로·세로가 동시에 차면 둘 다 지운다', () => {
  const board = createBoard();
  for (let c = 0; c < SIZE; c++) if (c !== 3) board[5][c] = true;
  for (let r = 0; r < SIZE; r++) if (r !== 5) board[r][3] = true;
  const r = placeShape(board, shape('dot'), 5, 3);
  assert.deepEqual(r.rows, [5]);
  assert.deepEqual(r.cols, [3]);
  assert.ok(r.board.flat().every((v) => !v));
  assert.equal(r.gained, 1 + 20);
});

test('3개를 다 쓰면 새로 3개', () => {
  let s = newGame(always('dot'));
  s = playPiece(s, 0, 0, 0, always('dot'));
  s = playPiece(s, 1, 0, 1, always('dot'));
  assert.deepEqual(s.pieces.map((p) => p && p.id), [null, null, 'dot']);
  s = playPiece(s, 2, 0, 2, always('o2'));
  assert.deepEqual(s.pieces.map((p) => p.id), ['o2', 'o2', 'o2']);
  assert.equal(s.score, 3);
});

test('쓴 블록과 못 놓는 자리는 거절한다', () => {
  let s = newGame(always('dot'));
  s = playPiece(s, 0, 0, 0);
  assert.equal(playPiece(s, 0, 1, 1), null);
  assert.equal(playPiece(s, 1, 0, 0), null);
});

test('남은 블록을 하나도 놓을 수 없으면 끝', () => {
  // 3×3 이 들어갈 자리가 없는 판: 3칸 간격으로 대각선을 채운다.
  const board = createBoard();
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if ((r + c) % 3 === 0) board[r][c] = true;
  const state = { board, pieces: [shape('o3'), shape('dot'), null], score: 0, over: false };
  const free = (() => {
    for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (!board[r][c]) return [r, c];
  })();
  const s = playPiece(state, 1, free[0], free[1]);
  assert.equal(s.over, true);
  assert.equal(playPiece(s, 0, 0, 0), null);
});

test('놓을 곳이 남아 있으면 끝이 아니다', () => {
  const s = playPiece(newGame(always('o3')), 0, 0, 0, always('o3'));
  assert.equal(s.over, false);
});
