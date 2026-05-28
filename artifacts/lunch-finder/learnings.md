# lunch-finder Learnings

## 실행 순서

Task 1 → 2 → 3 → Checkpoint → 4 → 5 → Checkpoint → 6 → 7 → Checkpoint → Review → Fixes

의존성: 타입(1) → 알고리즘(2) → UI(3) → API(4) → 추가 플로우(5) → 상세(6) → 목록·네비(7)

---

---
category: tooling
applied: rule
---
## React 19 StrictMode + vi.mock: clearAllMocks 필수

**상황**: Task 6, restaurant-detail 테스트. "같은 날 중복 방문 안 함" 테스트가 `saveVisits`가 2번 호출된다고 실패. saveVisits 호출 기록이 이전 테스트에서 넘어옴.

**판단**: `beforeEach`에 `vi.clearAllMocks()` 추가. React 19 StrictMode는 effects를 2회 실행하므로, 이전 테스트의 mock 호출 기록이 남으면 격리 테스트가 깨진다.

**다시 마주칠 가능성**: 높음 — React 19 + Vitest 조합에서 모든 컴포넌트 테스트에 적용.

---

---
category: tooling
applied: rule
---
## saveVisits mock은 loadVisits를 업데이트해야 StrictMode dedup이 동작

**상황**: Task 6, 방문 중복 dedup 테스트. `addVisit`이 `loadVisits()`를 직접 호출하므로, StrictMode 2차 마운트 시 이전 저장이 반영되지 않으면 dedup이 실패.

**판단**: `saveVisits.mockImplementation((visits) => { loadVisits.mockReturnValue([...visits]) })` 패턴으로 두 mock을 연동. 이후 모든 visits 관련 테스트에 동일 패턴 적용.

**다시 마주칠 가능성**: 높음 — localStorage 기반 hook 테스트마다 발생.

---

---
category: code-review
applied: not-yet
---
## hooks의 useState 초기화에서 localStorage 직접 호출

**상황**: Step 4, code-reviewer가 SSR crash 위험 지적. `useState(() => loadRestaurants())` 패턴이 Next.js SSR 환경에서 localStorage를 접근해 빈 배열 반환 후 클라이언트에 하이드레이션 불일치 발생 가능.

**판단**: `useState([])` + `useEffect(() => { setRestaurants(loadRestaurants()) }, [])` 로 전환. `RecommendationScreen`이 이미 사용하던 정석 패턴을 hook에도 일관 적용.

**다시 마주칠 가능성**: 높음 — Next.js + localStorage hook을 작성할 때마다 재발.

---

---
category: task-ordering
applied: not-yet
---
## recommend 함수의 단일 식당 엣지 케이스

**상황**: Task 2, recommend.test.ts. "3일 이내 방문 → 제외" 테스트에서 단일 식당이 최근 방문됐을 때 폴백으로 반환됨. 테스트가 빈 배열을 기대했으나 실패.

**판단**: 테스트를 2개 식당으로 변경 — 한쪽은 최근 방문, 한쪽은 미방문. 폴백 로직(모든 후보 소진 시 가장 오래된 순 반환)을 명확히 분리하여 테스트.

**다시 마주칠 가능성**: 중간 — 폴백이 있는 알고리즘 테스트에서 재발.

---

---
category: code-review
applied: not-yet
---
## daysBetween 경계: > RECENT_DAYS (strictly greater)

**상황**: Step 4, code-reviewer 지적. 정확히 3일 전 방문한 식당은 정상 후보에 포함됨 ("4일 전"은 포함, "1일 전"은 제외, "3일 전"은 미테스트).

**판단**: 현재 spec이 명확하지 않아 현행 유지. 경계 테스트(`daysAgo = 3`) 추가는 미완. 다음 spec 개정 시 반영 권장.

**다시 마주칠 가능성**: 낮음 — 해당 앱 특수 케이스.

---

## 잘 된 것

- `lib/recommend.ts`를 순수 함수로 분리 → 컴포넌트 테스트 없이 완전 단위 테스트 가능
- Kakao API 키를 Route Handler로 보호 → 클라이언트 번들 노출 없음
- TDD RED→GREEN 순서가 잘못된 구현을 즉시 드러냄 (recommend 엣지 케이스, RestaurantCard 텍스트 노드 이슈)

## 안 된 것

- React 19 StrictMode의 effect 2회 실행을 초기에 인지하지 못해 Task 6에서 디버깅 시간 소요
- hooks SSR 문제를 구현 후 코드 리뷰에서 발견 (plan 단계에서 Next.js SSR 특성을 task 수용 기준에 포함했어야 함)

## 다음에도 쓸 인사이트

1. Next.js + localStorage hook: 항상 `useEffect` 로드 패턴 사용, lazy initializer 금지
2. Vitest + React 19: `beforeEach`에 `vi.clearAllMocks()` 기본 추가
3. localStorage mock 연동: `saveX.mockImplementation((data) => { loadX.mockReturnValue(data) })` 패턴으로 StrictMode 2차 마운트 대응
