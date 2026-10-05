# Git 규칙

이 저장소는 조직 표준 [`autelon/.github` 의 `git-workflow.md`](https://github.com/autelon/.github/blob/main/git-workflow.md)를 따른다. 브랜치 전략, main 보호, PR·리뷰·머지 절차는 그 문서가 기준이다. 여기에는 이 프로젝트의 값만 적는다.

| 항목 | 값 |
| ---- | -- |
| 병합 방식 | merge commit (이것만 허용) |
| 필수 검사 | `check`(이 저장소 CI), `git-policy / merge-commits`(조직 공용) |
| 최신화 보장 | 머지 큐 (public 저장소) |
| 머지 명령 | `gh pr merge <PR> --match-head-commit <리뷰한 sha>` (`--admin` 쓰지 않음) |

표준과 다르게 가는 부분은 없다.

현재 값 확인: `gh api repos/autelon/block-puzzle`, `gh api repos/autelon/block-puzzle/rulesets`
