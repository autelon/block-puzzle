// 화면 코드. 게임 규칙은 game.js 에 있고, 여기서는 상태를 그리고 입력을 game.js 함수로 넘긴다.
import { SIZE, newGame, playPiece, canPlace } from './game.js';

const $ = (id) => document.getElementById(id);
const startScreen = $('start-screen');
const playScreen = $('play-screen');
const boardEl = $('board');
const trayEl = $('tray');
const scoreEl = $('score');
const overDialog = $('over-dialog');
const pauseDialog = $('pause-dialog');

let state = null;

// 판 칸 SIZE×SIZE 개를 한 번 만든다.
const cellEls = [];
for (let r = 0; r < SIZE; r++) {
  cellEls.push([]);
  for (let c = 0; c < SIZE; c++) {
    const el = document.createElement('div');
    el.className = 'cell';
    boardEl.appendChild(el);
    cellEls[r].push(el);
  }
}

function showScreen(screen) {
  for (const s of [startScreen, playScreen]) s.hidden = s !== screen;
}

function startGame() {
  state = newGame();
  closeDialogs();
  showScreen(playScreen);
  render();
}

function quitGame() {
  state = null;
  closeDialogs();
  showScreen(startScreen);
}

function closeDialogs() {
  overDialog.hidden = true;
  pauseDialog.hidden = true;
}

// 일시 중지에서 재시작·종료하면 그 판은 끝나지 않은 채 버려진다(점수 기록 대상이 아님).
function pause() {
  if (!state || state.over) return;
  pauseDialog.hidden = false;
}

function showOver() {
  $('final-score').textContent = state.score;
  overDialog.hidden = false;
}

// 모양을 칸 격자로 만든다. 빈 자리는 blank 칸으로 채운다.
function shapeEl(shape, className) {
  const rows = Math.max(...shape.cells.map(([r]) => r)) + 1;
  const cols = Math.max(...shape.cells.map(([, c]) => c)) + 1;
  const el = document.createElement('div');
  el.className = className;
  el.style.gridTemplateColumns = `repeat(${cols}, auto)`;
  const filled = new Set(shape.cells.map(([r, c]) => `${r},${c}`));
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = document.createElement('div');
      cell.className = filled.has(`${r},${c}`) ? 'cell filled' : 'cell blank';
      el.appendChild(cell);
    }
  }
  return el;
}

function render() {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      cellEls[r][c].className = state.board[r][c] ? 'cell filled' : 'cell';
    }
  }
  scoreEl.textContent = state.score;

  trayEl.replaceChildren();
  state.pieces.forEach((shape, index) => {
    const slot = document.createElement('div');
    slot.className = 'slot';
    if (shape) {
      const piece = shapeEl(shape, 'piece');
      piece.addEventListener('pointerdown', (e) => startDrag(e, index, piece));
      slot.appendChild(piece);
    }
    trayEl.appendChild(slot);
  });
}

// ---- 끌어 놓기 ----
// 받침의 블록을 누르면 판 크기의 그림자가 손가락을 따라오고, 그림자의 왼쪽 위 칸이 놓일 자리다.

let drag = null;

function pitch(a, b) {
  return b.getBoundingClientRect().left - a.getBoundingClientRect().left;
}

function startDrag(e, index, piece) {
  // 끌기는 한 번에 하나, 마우스는 왼쪽 버튼만.
  if (!state || state.over || drag || e.button !== 0) return;
  e.preventDefault();
  const shape = state.pieces[index];
  const pieceRect = piece.getBoundingClientRect();
  // 받침 칸 간격(칸 크기 + gap). 한 칸 폭 블록도 맞게 칸 너비와 gap 으로 구한다.
  const trayPitch = piece.children[0].getBoundingClientRect().width + parseFloat(getComputedStyle(piece).columnGap);
  const boardPitch = pitch(cellEls[0][0], cellEls[0][1]);
  const scale = boardPitch / trayPitch;

  const ghost = shapeEl(shape, 'ghost');
  document.body.appendChild(ghost);
  piece.classList.add('dragging-source');

  drag = {
    pointerId: e.pointerId,
    index,
    shape,
    piece,
    ghost,
    boardPitch,
    // 누른 지점을 판 크기로 늘린 위치. 터치는 손가락에 가리지 않게 위로 올린다.
    offsetX: (e.clientX - pieceRect.left) * scale,
    offsetY: (e.clientY - pieceRect.top) * scale + (e.pointerType === 'touch' ? boardPitch * 2 : 0),
    target: null,
  };
  moveDrag(e);
}

function clearPreview() {
  for (const line of cellEls) for (const el of line) el.classList.remove('preview');
}

function moveDrag(e) {
  if (!drag || e.pointerId !== drag.pointerId) return;
  const x = e.clientX - drag.offsetX;
  const y = e.clientY - drag.offsetY;
  drag.ghost.style.transform = `translate(${x}px, ${y}px)`;

  const origin = cellEls[0][0].getBoundingClientRect();
  const row = Math.round((y - origin.top) / drag.boardPitch);
  const col = Math.round((x - origin.left) / drag.boardPitch);
  clearPreview();
  if (canPlace(state.board, drag.shape, row, col)) {
    drag.target = { row, col };
    for (const [dr, dc] of drag.shape.cells) cellEls[row + dr][col + dc].classList.add('preview');
  } else {
    drag.target = null;
  }
}

// drop 이 false 면(pointercancel) 놓지 않고 되돌리기만 한다.
function endDrag(e, drop) {
  if (!drag || e.pointerId !== drag.pointerId) return;
  const { index, target, ghost, piece } = drag;
  drag = null;
  ghost.remove();
  piece.classList.remove('dragging-source');
  clearPreview();
  if (!drop || !target) return;
  const next = playPiece(state, index, target.row, target.col);
  if (next) {
    state = next;
    render();
    if (state.over) showOver();
  }
}

window.addEventListener('pointermove', moveDrag);
window.addEventListener('pointerup', (e) => endDrag(e, true));
window.addEventListener('pointercancel', (e) => endDrag(e, false));

$('start-button').addEventListener('click', startGame);
$('pause-button').addEventListener('click', pause);
$('pause-resume').addEventListener('click', () => { pauseDialog.hidden = true; });
$('pause-restart').addEventListener('click', startGame);
$('pause-quit').addEventListener('click', quitGame);
$('over-restart').addEventListener('click', startGame);
$('over-quit').addEventListener('click', quitGame);
