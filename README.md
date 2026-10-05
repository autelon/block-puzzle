# block-puzzle — a lightweight 8×8 block puzzle game (plain HTML + JS, no build step).

## 실행

module script 를 쓰므로 `file://` 로는 열리지 않는다. 저장소 폴더에서 정적 서버를 띄운다.

```bash
python3 -m http.server 8123
```

그다음 브라우저에서 `http://localhost:8123` 을 연다.

## 테스트

```bash
node --test
```

## 파일

- `game.js` 게임 규칙(판·블록·놓기·줄 지우기·점수·끝 판정). 화면을 모른다.
- `best-score.js` 최고 점수 저장(이 기기 localStorage).
- `index.html`·`style.css`·`ui.js` 화면.
- Git 규칙: [docs/git-rules.md](docs/git-rules.md)
