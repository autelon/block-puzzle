// 최고 점수 저장. 지금은 이 기기(localStorage)에 하나.
// 바꿀 자리(계획의 미루는 정책): 계정별 저장·앱인토스 연동은 이 두 함수만 바꾼다.
const KEY = 'block-puzzle.best-score';

// 저장할 수 없는 환경(사생활 보호 모드 등)에서도 이번 실행 동안은 보여 준다.
let memoryBest = 0;

export function loadBest() {
  let stored = 0;
  try {
    stored = Number(localStorage.getItem(KEY)) || 0;
  } catch {
    // 읽을 수 없으면 메모리 값만 쓴다.
  }
  return Math.max(stored, memoryBest);
}

// 끝까지 한 판의 점수만 넘긴다. 최고 점수를 넘었으면 저장하고 true.
export function recordFinished(score) {
  if (score <= loadBest()) return false;
  memoryBest = score;
  try {
    localStorage.setItem(KEY, String(score));
  } catch {
    // 저장 실패는 메모리 값으로 대신한다.
  }
  return true;
}
