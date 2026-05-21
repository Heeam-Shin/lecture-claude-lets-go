# 서울 교통 최적 경로 탐색기 구현 계획

## 아키텍처 결정

| 결정 | 선택 | 이유 |
|---|---|---|
| 외부 API 호출 위치 | Next.js Route Handler (서버) | API 키 클라이언트 노출 방지 |
| 지오코딩 서비스 | Kakao Map REST API | 한국 주소 인식 정확도 최고, 무료 할당량 충분 |
| Mock 전략 | 서비스 레이어 경계 | services/*.ts가 mock → real 교체 지점; Route Handler/훅은 변경 없음 |
| API 키 준비 | mock으로 시작, Task 6에서 실제 API 연동 | API 키 미발급 상태 — UI·로직 먼저 완성 |
| 불변 규칙 적용 | Route Handler `Cache-Control: no-store` + 클라이언트 fetch `cache: 'no-store'` | 검색 시점 실시간 데이터 보장 (서버·클라이언트 양쪽) |
| 수정/다시검색 버튼 | v1 포함 | 와이어프레임 반영, 검색 폼 초기화 vs 값 유지 흐름 분리 |

## 인프라 리소스

| 리소스 | 유형 | 선언 위치 | 생성 Task |
|---|---|---|---|
| `KAKAO_REST_API_KEY` | Env var | `.env.local` / `.env.local.example` | Task 6 |
| `SEOUL_API_KEY` | Env var | `.env.local` / `.env.local.example` | Task 6 |

## 데이터 모델

### TransportMode
- `'walk' | 'subway' | 'bike'`

### Segment
- `type: TransportMode` (required)
- `minutes: number` (required)
- `label: string` — "도보", "1호선", "따릉이 서울역광장" 등 (required)
- `subLabel?: string` — 지하철: "서울역 → 강남역", 따릉이: "대여소명 → 대여소명"
- `bikeAvailable?: boolean` — `type === 'bike'`일 때만 사용; `false`이면 "대여 불가" 표시

### Route
- `totalMinutes: number`
- `segments: Segment[]`
- `isShortest: boolean` — 최단 경로 배지 표시 여부

### SearchState
- `status: 'idle' | 'loading' | 'success' | 'error' | 'empty'`
- `routes: Route[]`
- `error: string | null`

## 필요 스킬

| 스킬 | 적용 Task | 용도 |
|---|---|---|
| shadcn — styling.md | Task 2, 4, 5 | semantic token 사용, className은 레이아웃에만, cn() 활용 |
| shadcn — icons.md | Task 4 | lucide-react 아이콘, `data-icon` 속성, 버튼 내 아이콘 |
| next-best-practices — route-handlers.md | Task 3 | Route Handler 패턴, `Cache-Control: no-store` |
| next-best-practices — rsc-boundaries.md | Task 5 | `'use client'` 경계, RSC 페이지 + Client 컨테이너 분리 |

## 영향 받는 파일

| 파일 경로 | 변경 유형 | 관련 Task |
|---|---|---|
| `types/route.ts` | New | Task 1 |
| `services/routeCalculator.ts` | New | Task 1 |
| `services/routeCalculator.test.ts` | New | Task 1 |
| `components/transport-route-finder/SearchForm.tsx` | New | Task 2 |
| `components/transport-route-finder/SearchForm.test.tsx` | New | Task 2 |
| `app/api/routes/search/route.ts` | New | Task 3 |
| `hooks/useRouteSearch.ts` | New | Task 3 |
| `hooks/useRouteSearch.test.ts` | New | Task 3 |
| `components/transport-route-finder/RouteDiagram.tsx` | New | Task 4 |
| `components/transport-route-finder/RouteCard.tsx` | New | Task 4 |
| `components/transport-route-finder/RouteCard.test.tsx` | New | Task 4 |
| `components/transport-route-finder/TransportRouteFinder.tsx` | New | Task 5 |
| `components/transport-route-finder/TransportRouteFinder.test.tsx` | New | Task 5 |
| `app/transport-route-finder/page.tsx` | New | Task 5 |
| `services/geocodingService.ts` | New | Task 6 |
| `services/seoulTransitApi.ts` | New | Task 6 |
| `services/ddareungApi.ts` | New | Task 6 |
| `services/routeCalculator.ts` | Modify | Task 6 |
| `.env.local.example` | New | Task 6 |

## Tasks

### Task 1: 타입 정의 + mock 경로 계산 서비스

- **담당 시나리오**: 없음 (Task 3–5의 기반 인프라 — Scenario 1 정렬 기준 포함)
- **크기**: S (3 파일, 각각 소규모)
- **의존성**: None
- **참조**:
  - `artifacts/transport-route-finder/spec.md` — 데이터 모델, 경로 조합 규칙
- **구현 대상**:
  - `types/route.ts` — `TransportMode`, `Segment`, `Route`, `SearchState` 타입
  - `services/routeCalculator.ts` — `calculateRoutes(from, to): Promise<Route[]>` mock 구현 (고정 경로 3개 반환, totalMinutes 오름차순 정렬, bikeAvailable: false 케이스 포함)
  - `services/routeCalculator.test.ts`
- **수용 기준**:
  - [ ] `calculateRoutes('서울역', '강남역')` 호출 → `Route` 배열 3개가 반환된다
  - [ ] 반환된 배열은 `totalMinutes` 오름차순으로 정렬되어 있다
  - [ ] 각 `Route.segments`에 `walk`, `subway`, `bike` 타입 `Segment`가 포함된다
  - [ ] `bikeAvailable: false`인 `Segment`가 포함된 `Route`가 최소 1개 반환된다
- **검증**: `bun run test -- routeCalculator`

---

### Task 2: 검색 폼 UI (Scenario 3 부분, 4)

- **담당 시나리오**: Scenario 3 (지우기 — 폼 필드 초기화), Scenario 4 (입력 불완전)
- **크기**: S (2 파일)
- **의존성**: Task 1 (타입)
- **참조**:
  - shadcn — styling.md (semantic token, cn())
  - shadcn — icons.md (lucide-react, `data-icon`)
  - `artifacts/transport-route-finder/wireframe.html` — Screen 0 (s0-base, s0-sc4)
- **구현 대상**:
  - `components/transport-route-finder/SearchForm.tsx` — 출발지/목적지 Input, 경로 검색 Button, 지우기 Button, 인라인 validation error; Props: `initialValues?`, `onSearch(from, to)`, `onClear()`
  - `components/transport-route-finder/SearchForm.test.tsx`
- **수용 기준**:
  - [ ] 지우기 클릭 후 출발지 필드가 비어 있다
  - [ ] 지우기 클릭 후 목적지 필드가 비어 있다
  - [ ] 목적지 비어 있을 때 검색 버튼 클릭 → `onSearch`가 호출되지 않는다
  - [ ] 목적지 비어 있을 때 검색 버튼 클릭 → "목적지를 입력해 주세요" 문구가 표시된다
- **검증**: `bun run test -- SearchForm`

---

### Task 3: Route Handler + useRouteSearch 훅 (Scenario 1 happy path, 불변 규칙)

- **담당 시나리오**: Scenario 1 (happy path only — mock 데이터), 불변 규칙
- **크기**: M (3 파일)
- **의존성**: Task 1 (타입, routeCalculator)
- **참조**:
  - next-best-practices — route-handlers.md (Route Handler 패턴, Cache-Control)
- **구현 대상**:
  - `app/api/routes/search/route.ts` — POST handler: body `{ from, to }` → `calculateRoutes` 호출 → `{ routes }` 반환; `Cache-Control: no-store` 응답 헤더; 외부 API 오류 시 502 + `{ error: 'realtime_api_error' }`; 경로 없음 시 200 + `{ routes: [] }`
  - `hooks/useRouteSearch.ts` — `{ routes, status, error, search(from, to), reset() }` 반환; `status`는 `SearchState['status']`
  - `hooks/useRouteSearch.test.ts`
- **수용 기준**:
  - [ ] `POST /api/routes/search` `{ from: '서울역', to: '강남역' }` → 200 + `routes` 배열 3개
  - [ ] 응답 헤더에 `Cache-Control: no-store`가 포함된다 (불변 규칙)
  - [ ] `useRouteSearch`에서 `search('서울역', '강남역')` 호출 후 `status`가 `'success'`가 된다
  - [ ] `search()` 후 `routes`가 `totalMinutes` 오름차순으로 정렬되어 있다
  - [ ] `search()` 중 네트워크 실패 시 `status`가 `'error'`가 된다
  - [ ] `search()`를 연속 두 번 호출하면 매 호출마다 새 fetch 요청이 전송된다 (stale response 재사용 없음)
- **검증**: `bun run test -- useRouteSearch`, `bun run test -- routes/search`

---

### Checkpoint: Tasks 1–3 이후

- [ ] 모든 테스트 통과: `bun run test`
- [ ] 빌드 성공: `bun run build`
- [ ] mock 경로 데이터가 Route Handler → 훅 → 상태까지 end-to-end로 흐름

---

### Task 4: 경로 카드 + 다이어그램 (Scenario 1, 2, 7)

- **담당 시나리오**: Scenario 1 (경로 카드 렌더), Scenario 2 (다이어그램), Scenario 7 (따릉이 대여 불가)
- **크기**: M (3 파일)
- **의존성**: Task 1 (타입)
- **참조**:
  - shadcn — styling.md (semantic token, cn())
  - shadcn — icons.md (`FootprintsIcon`, `TrainIcon`, `BikeIcon` from lucide-react)
  - `artifacts/transport-route-finder/wireframe.html` — Screen 1 (s1-sc1 다이어그램, s1-sc7 대여 불가)
- **구현 대상**:
  - `components/transport-route-finder/RouteDiagram.tsx` — `segments: Segment[]` prop; 아이콘 원 + 화살표 + 레이블; 좌→우 방향
  - `components/transport-route-finder/RouteCard.tsx` — `route: Route` prop; 전체 이동시간, 최단 배지, RouteDiagram, 구간 목록(아이콘·레이블·이동시간), 따릉이 "대여 불가" 배지
  - `components/transport-route-finder/RouteCard.test.tsx`
- **수용 기준**:
  - [ ] 경로 카드에 전체 이동시간(분)이 표시된다
  - [ ] 경로 카드에 세부 구간(도보·지하철 노선명·따릉이)과 구간별 이동시간이 표시된다
  - [ ] 다이어그램에 각 구간 교통수단 아이콘(도보·지하철·따릉이)이 렌더된다
  - [ ] 지하철 구간에 노선명(예: "1호선")이 표시된다
  - [ ] 따릉이 구간에 대여소 이름이 표시된다
  - [ ] 다이어그램이 첫 Segment부터 마지막 Segment 순서로 좌→우로 렌더된다
  - [ ] `bikeAvailable: false`인 따릉이 구간이 포함된 경로 → 경로 카드가 표시된다
  - [ ] `bikeAvailable: false`인 따릉이 구간 → "대여 불가" 배지가 표시된다
- **검증**: `bun run test -- RouteCard`

---

### Task 5: 페이지 통합 (Scenario 3 완성, 5, 6, 수정/다시검색)

- **담당 시나리오**: Scenario 3 (지우기 후 결과 사라짐), Scenario 5 (API 오류), Scenario 6 (경로 없음), 수정 버튼, 다시 검색 버튼
- **크기**: M (3 파일)
- **의존성**: Task 2 (SearchForm), Task 3 (useRouteSearch), Task 4 (RouteCard)
- **참조**:
  - next-best-practices — rsc-boundaries.md (`'use client'` 경계)
  - `artifacts/transport-route-finder/wireframe.html` — Screen 1 수정/지우기 compact bar, Screen 2 오류·없음·다시검색
- **구현 대상**:
  - `components/transport-route-finder/TransportRouteFinder.tsx` — `'use client'`; `view: 'form' | 'results' | 'error' | 'empty'` 상태 기계; SearchForm (초기값 주입), RouteCard 목록, 오류/없음 메시지, compact search bar, 수정/지우기/다시검색 버튼 처리
  - `components/transport-route-finder/TransportRouteFinder.test.tsx`
  - `app/transport-route-finder/page.tsx` — RSC: `<TransportRouteFinder />` 렌더
- **수용 기준**:
  - [ ] 지우기 클릭 후 경로 결과 카드가 화면에 없다 (Scenario 3 완성)
  - [ ] API 오류 시 "실시간 데이터를 가져오지 못했습니다" 메시지가 표시된다
  - [ ] API 오류 시 이전 경로 결과가 화면에 남아 있지 않다
  - [ ] 경로 없음 응답 시 "경로를 찾을 수 없습니다" 메시지가 표시된다
  - [ ] 경로 없음 시 경로 카드가 나타나지 않는다
  - [ ] 결과/오류 화면에서 "수정" 클릭 → 검색 폼이 기존 입력값으로 표시된다
  - [ ] 오류 화면에서 "다시 검색" 클릭 → 동일 입력으로 재검색이 실행된다
  - [ ] '서울역' → '강남역' 검색 후 경로 카드가 최대 3개 렌더된다 (Scenario 1 통합)
- **검증**:
  - `bun run test -- TransportRouteFinder`
  - Browser MCP — `/transport-route-finder` 진입, 검색 → 결과 → 지우기/수정/다시검색 흐름 확인, 증거 `artifacts/transport-route-finder/evidence/task-5-flow.gif` 저장

---

### Checkpoint: Tasks 1–5 이후

- [ ] 모든 테스트 통과: `bun run test`
- [ ] 빌드 성공: `bun run build`
- [ ] `/transport-route-finder` 페이지에서 7개 시나리오 전체 흐름이 mock 데이터로 동작

---

### Task 6: 실제 외부 API 연동 (Kakao + 서울시 API)

> **전제 조건**: `KAKAO_REST_API_KEY`(Kakao Developers 발급)와 `SEOUL_API_KEY`(data.seoul.go.kr 발급)가 `.env.local`에 설정되어 있어야 한다. 키 없이 실행하면 이 Task는 검증 불가 — API 키 발급 후 진행.

- **담당 시나리오**: Scenario 1 (실시간 데이터), 불변 규칙 (캐시 금지 — Task 3에서 구현 완료, 이 Task에서 실제 API로 확인)
- **크기**: M (5 파일)
- **의존성**: Task 3 (Route Handler, routeCalculator 인터페이스), Task 5 (UI 통합 — Browser MCP 검증 전제)
- **참조**:
  - Kakao Map REST API: `https://developers.kakao.com/docs/latest/ko/local/dev-guide` — 로컬 텍스트 검색 (keyword 검색 또는 주소 검색)
  - 서울시 지하철 실시간 도착정보: `https://data.seoul.go.kr/dataList/OA-12764/A/1/datasetView.do`
  - 서울시 따릉이 실시간 대여정보: `https://data.seoul.go.kr/dataList/OA-15493/A/1/datasetView.do`
- **구현 대상**:
  - `services/geocodingService.ts` — Kakao REST API로 텍스트 → `{ lat, lng }` 변환
  - `services/seoulTransitApi.ts` — 서울시 지하철 실시간 도착정보 API 클라이언트 (역명 → 다음 도착 시간)
  - `services/ddareungApi.ts` — 따릉이 실시간 대여정보 API 클라이언트 (전체 대여소 목록 + 잔여 자전거 수)
  - `services/routeCalculator.ts` — Modify: mock → 실제 구현 (좌표 기반 가까운 역/대여소 탐색, 경로 시간 계산, 상위 3개 선택)
  - `.env.local.example` — 필요한 환경변수 목록과 발급처 주석
- **수용 기준**:
  - [ ] `.env.local` 설정 후 "서울역" 지오코딩 → 위경도 좌표가 반환된다
  - [ ] `.env.local` 설정 후 따릉이 API → 대여소 목록(잔여 자전거 수 포함)이 반환된다
  - [ ] "서울역" → "강남역" 실제 검색 → 경로 카드 최대 3개가 실시간 데이터 기반으로 렌더된다
- **검증**:
  - Browser MCP — API 키 설정 후 실제 검색, 증거 `artifacts/transport-route-finder/evidence/task-6-realapi.gif` 저장
  - Human review — 경로 카드의 소요시간이 현실적인 값인지(도보 속도 5 km/h, 자전거 15 km/h 기준) 확인

---

## 미결정 항목

- **경로 계산 알고리즘 세부**: 지하철 환승 계산 방식 (환승 시간 추정치 고정 vs API 기반), 도보/자전거 속도 상수 — Task 6 진입 시 결정
- **실제 API 없는 risk 내재**: mock-first 전략으로 실제 Kakao/서울시 API 응답 형식·인증·레이트 리밋은 Task 6 전까지 미검증. Task 5 완료 후 API 키 발급과 동시에 Task 6 진행 권장
