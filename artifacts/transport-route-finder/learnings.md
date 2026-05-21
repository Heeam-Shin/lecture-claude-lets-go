# learnings — transport-route-finder

---
category: tooling
applied: rule
---
## lucide-react 아이콘 사용 전 런타임 가용성 확인 필요 → `.claude/rules/lucide-icons.md`에 승격

**상황**: Step 3, Task 5 구현 중. `MapXIcon`을 wireframe 기반으로 추측해 사용했으나 해당 버전(1.16.0)에 존재하지 않아 런타임 오류 발생.
**판단**: `MapPinXIcon`으로 교체. 사전에 `node -e "const l = require('./node_modules/lucide-react'); console.log(l.MapXIcon)"` 로 확인했다면 방지 가능했다.
**다시 마주칠 가능성**: 높음 — lucide-react는 버전마다 아이콘명이 다르고, 아이콘명 추측은 모든 feature에서 발생 가능.

---
category: tooling
applied: not-yet
---
## vitest.config.ts에서 e2e 디렉토리가 기본 제외되지 않음

**상황**: Checkpoint bun run test 실행 시 e2e/smoke.spec.ts가 Vitest에 잡혀 실패.
**판단**: vitest.config.ts의 exclude 배열에 "e2e/**" 추가로 해결. 프로젝트 초기 설정 문제.
**다시 마주칠 가능성**: 중간 — 신규 프로젝트 초기화 시 재발 가능.

---
category: code-review
applied: not-yet
---
## InputGroup/InputGroupAddon이 있는데 absolute 포지셔닝으로 아이콘을 직접 구현

**상황**: Step 4, code-reviewer가 Important로 지적. SearchForm에서 아이콘 오버레이를 직접 구현했으나 프로젝트에 InputGroup 컴포넌트가 이미 있었음.
**판단**: InputGroup으로 리팩터링. components/ui/ 디렉토리의 컴포넌트를 먼저 탐색하는 습관이 필요.
**다시 마주칠 가능성**: 높음 — 신규 feature마다 shadcn 컴포넌트 목록을 확인하지 않으면 재발.

---
category: code-review
applied: not-yet
---
## getByText로 텍스트 매칭 시 diagram + segment-list 중복으로 반복 실패

**상황**: Step 3, Task 4 및 Task 5 테스트 작성. "1호선", "20분" 등 텍스트가 RouteDiagram과 segment list 두 군데 렌더되어 `getByText`가 "multiple elements found" 오류.
**판단**: `data-testid` 패턴으로 해결. 컴포넌트가 같은 데이터를 여러 UI 영역에 표시할 경우 텍스트 기반 쿼리는 취약하다.
**다시 마주칠 가능성**: 높음 — 카드형 컴포넌트(다이어그램 + 목록 조합)에서 반복 발생 가능.

---
category: task-ordering
applied: not-yet
---
## useRouteSearch 훅의 sorting을 서버에 맡기면서 훅 테스트 실패

**상황**: Step 3, useRouteSearch 테스트에서 "routes sorted ascending" 기준 실패. 서버(routeCalculator)가 정렬하므로 훅은 정렬하지 않았으나, 테스트는 mock fetch가 비정렬 데이터를 반환할 때 훅이 정렬해주길 기대.
**판단**: 훅에 방어적 정렬 추가. 서버 계약을 신뢰할 경우 테스트가 서버 계약을 강제하도록 설계해야 함 — 또는 훅이 방어적으로 정렬해야 함.
**다시 마주칠 가능성**: 중간 — 서버/클라이언트 책임 분리 시 계약 위치가 불분명할 때 재발.
