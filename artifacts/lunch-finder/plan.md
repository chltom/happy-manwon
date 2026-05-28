# lunch-finder 구현 계획

## 아키텍처 결정

| 결정 | 선택 | 이유 |
|---|---|---|
| 라우팅 | Next.js App Router multi-page | 표준 패턴, URL 공유 가능 |
| 데이터 저장 | localStorage (JSON) | 서버 불필요, 개인 도구 |
| 상태 관리 | Custom React hooks + localStorage | 외부 라이브러리 없이 충분 |
| Kakao API 호출 | Next.js Route Handler (서버) | API 키 클라이언트 노출 방지 |
| ID 생성 | `crypto.randomUUID()` | 브라우저 내장, 라이브러리 불필요 |
| 앱 진입점 | `/` = 추천 화면 (기존 `app/page.tsx` 교체) | 개인 도구, 추천이 메인 |
| 식당 추가 단계 | 단일 페이지 2단계 state | 별도 라우트보다 선택 데이터 전달 단순 |

## 인프라 리소스

| 리소스 | 유형 | 선언 위치 | 생성 Task |
|---|---|---|---|
| KAKAO_API_KEY | Env var (서버 전용) | `.env.local` | Task 4 |

## 데이터 모델

### Restaurant
- `id`: string (required, `crypto.randomUUID()`)
- `name`: string (required)
- `category`: string (required)
- `address`: string (required)
- `menus`: Menu[] (required)
- `createdAt`: number (timestamp ms, required)

### Menu
- `id`: string (required, `crypto.randomUUID()`)
- `name`: string (required)
- `price`: number (원 정수, required)

### VisitRecord
- `restaurantId`: string (required)
- `date`: string (YYYY-MM-DD, required)

localStorage 키: `lf_restaurants` → `Restaurant[]`, `lf_visits` → `VisitRecord[]`

## 필요 스킬

| 스킬 | 적용 Task | 용도 |
|---|---|---|
| shadcn | Task 3, 5, 6, 7 | Button, Card, Badge, Input |
| next-best-practices | Task 4, 5, 6, 7 | async params, RSC 경계, Route Handler |

## 영향 받는 파일

| 파일 경로 | 변경 유형 | 관련 Task |
|---|---|---|
| `types/restaurant.ts` | New | Task 1 |
| `lib/storage.ts` | New | Task 1 |
| `lib/storage.test.ts` | New | Task 1 |
| `lib/recommend.ts` | New | Task 2 |
| `lib/recommend.test.ts` | New | Task 2 |
| `components/lunch-finder/restaurant-card.tsx` | New | Task 3 |
| `components/lunch-finder/recommendation-screen.tsx` | New | Task 3 |
| `components/lunch-finder/recommendation-screen.test.tsx` | New | Task 3 |
| `app/page.tsx` | Modify | Task 3 |
| `app/layout.tsx` | Modify | Task 3 |
| `lib/kakao.ts` | New | Task 4 |
| `app/api/kakao-search/route.ts` | New | Task 4 |
| `app/api/kakao-search/route.test.ts` | New | Task 4 |
| `hooks/use-restaurants.ts` | New | Task 5 |
| `components/lunch-finder/add-restaurant-search.tsx` | New | Task 5 |
| `components/lunch-finder/restaurant-form.tsx` | New | Task 5 |
| `components/lunch-finder/add-restaurant-search.test.tsx` | New | Task 5 |
| `components/lunch-finder/restaurant-form.test.tsx` | New | Task 5 |
| `app/restaurants/add/page.tsx` | New | Task 5 |
| `hooks/use-visits.ts` | New | Task 6 |
| `components/lunch-finder/restaurant-detail.tsx` | New | Task 6 |
| `components/lunch-finder/restaurant-detail.test.tsx` | New | Task 6 |
| `app/restaurants/[id]/page.tsx` | New | Task 6 |
| `components/lunch-finder/bottom-nav.tsx` | New | Task 7 |
| `components/lunch-finder/restaurant-list.tsx` | New | Task 7 |
| `components/lunch-finder/restaurant-list.test.tsx` | New | Task 7 |
| `app/restaurants/page.tsx` | New | Task 7 |

---

## Tasks

### Task 1: 타입 정의 + localStorage 스토리지

- **담당 시나리오**: 기반 레이어 (모든 시나리오 전제)
- **크기**: S (2 파일 + 테스트)
- **의존성**: None
- **구현 대상**:
  - `types/restaurant.ts`
  - `lib/storage.ts`
  - `lib/storage.test.ts`
- **수용 기준**:
  - [x] `loadRestaurants()` — 저장된 적 없으면 `[]` 반환
  - [x] `saveRestaurants([r])` → `loadRestaurants()` 재호출 시 동일 배열 반환
  - [x] `loadVisits()` — 저장된 적 없으면 `[]` 반환
  - [x] `saveVisits([v])` → `loadVisits()` 재호출 시 동일 배열 반환
- **검증**: `bun run test -- storage`

---

### Task 2: 추천 알고리즘

- **담당 시나리오**: Scenario 1 (logic), Scenario 4 (fallback logic)
- **크기**: S (1 파일 + 테스트)
- **의존성**: Task 1 (Restaurant, VisitRecord 타입)
- **구현 대상**:
  - `lib/recommend.ts`
  - `lib/recommend.test.ts`
- **수용 기준**:
  - [x] 1만원 이하 메뉴가 없는 식당 → 결과 목록에서 제외
  - [x] 메뉴가 0개인 식당 → 결과 목록에서 제외
  - [x] 3일 이내 방문 식당 → 정상 후보에서 제외
  - [x] 정상 후보 0개(모두 최근 방문) → 방문일 가장 오래된 순으로 반환 (폴백)
  - [x] 식당 0개 입력 → 빈 배열 반환
- **검증**: `bun run test -- recommend`

---

### Task 3: 추천 화면 (3가지 상태)

- **담당 시나리오**: Scenario 1 (full), Scenario 3 (full), Scenario 4 (full), Scenario 5 (full)
- **크기**: M (4 파일 + 테스트 + 기존 파일 2개 수정)
- **의존성**: Task 1, Task 2
- **참조**:
  - shadcn — Card, Badge, Button
  - wireframe: Screen 0 (추천 정상), Screen 1 (빈 상태), Screen 2 (폴백)
- **구현 대상**:
  - `components/lunch-finder/restaurant-card.tsx`
  - `components/lunch-finder/recommendation-screen.tsx` (`'use client'`, `loadRestaurants()` + `loadVisits()` + `recommend()` 직접 호출)
  - `components/lunch-finder/recommendation-screen.test.tsx`
  - `app/page.tsx` (기존 ComponentExample 교체 → `<RecommendationScreen />`)
  - `app/layout.tsx` (title → "오늘 점심")
- **수용 기준**:
  - [x] 1만원 이하 메뉴 보유 식당 3개 존재 시 → 카드 3개, 각 카드에 식당 이름·카테고리·최저 메뉴명·가격 표시
  - [x] 3일 이내 방문 식당 → 추천 카드 목록에 미포함
  - [x] "다음 추천" 클릭 → 이전 카드 목록과 다른 식당으로 교체
  - [x] "다음 추천" 클릭 시 정상 후보 부족 → 폴백 배너 + 방문일 오래된 순 카드 표시
  - [x] 등록 식당 0개 → "아직 등록된 식당이 없어요" 문구 + 식당 추가 버튼 표시
  - [x] 모든 식당 3일 이내 방문 → "최근 방문한 곳만 있어요…" 배너 + 카드 표시
- **검증**: `bun run test -- recommendation-screen`

---

### Checkpoint: Tasks 1–3 이후
- [ ] 모든 테스트 통과: `bun run test`
- [ ] 빌드 성공: `bun run build`
- [ ] 브라우저에서 `localhost:3000` 진입 시 추천 화면(빈 상태) 정상 렌더링

---

### Task 4: Kakao 검색 API 연동 [고위험 — 외부 의존성 검증 먼저]

- **담당 시나리오**: Scenario 6 (검색 부분), Scenario 10 (partial)
- **크기**: S (2 파일 + 테스트)
- **의존성**: None (독립적 서버 레이어)
- **참조**:
  - [Kakao Local API 문서](https://developers.kakao.com/docs/latest/ko/local/dev-guide#search-by-keyword)
  - next-best-practices — Route Handler
- **구현 대상**:
  - `lib/kakao.ts` (Kakao API 응답 타입 정의)
  - `app/api/kakao-search/route.ts` (`GET ?q=검색어&lat=위도&lng=경도`)
  - `app/api/kakao-search/route.test.ts` (fetch mock)
- **수용 기준**:
  - [ ] `GET /api/kakao-search?q=청국장` → `{ places: [{ name, address, category }] }` 형태 JSON 반환
  - [ ] `lat`, `lng` 쿼리 포함 시 → 카카오 API에 위치 파라미터 포함하여 요청
  - [ ] `KAKAO_API_KEY` 미설정 시 → 500 응답
- **검증**: `bun run test -- kakao-search`

---

### Task 5: 식당 추가 플로우 (검색 → 메뉴 입력 → 저장)

- **담당 시나리오**: Scenario 6 (full), Scenario 7 (full), Scenario 10 (full)
- **크기**: M (5 파일 + 테스트 2개)
- **의존성**: Task 1 (storage), Task 4 (kakao API)
- **참조**:
  - shadcn — Input, Button, Badge
  - wireframe: Screen 5 (추가·검색), Screen 6 (추가·메뉴)
- **구현 대상**:
  - `hooks/use-restaurants.ts` (CRUD: loadAll, add, updateMenus, remove)
  - `components/lunch-finder/add-restaurant-search.tsx` (`'use client'`)
  - `components/lunch-finder/restaurant-form.tsx` (`'use client'`)
  - `components/lunch-finder/add-restaurant-search.test.tsx`
  - `components/lunch-finder/restaurant-form.test.tsx`
  - `app/restaurants/add/page.tsx` (2단계 state: `search` → `form`)
- **수용 기준**:
  - [ ] 검색어 입력 시 `/api/kakao-search` 결과 목록 표시
  - [ ] 결과 항목 선택 시 이름·주소·카테고리 필드 자동 채워짐
  - [ ] 자동 채워진 이름·주소·카테고리 필드 직접 수정 가능
  - [ ] 메뉴명 비어 있으면 "추가" 버튼 비활성
  - [ ] 가격 0 이하이면 "추가" 버튼 비활성
  - [ ] 메뉴명 "된장찌개", 가격 "8500" 추가 → 목록에 "된장찌개 8,500원" 표시
  - [ ] 저장 후 `/restaurants`로 이동, 목록에 새 식당 이름 표시
  - [ ] 위치 권한 없음 → "위치 권한 없음 · 이름으로만 검색합니다" 안내 표시
- **검증**: `bun run test -- add-restaurant` + `bun run test -- restaurant-form`

---

### Checkpoint: Tasks 4–5 이후
- [ ] 모든 테스트 통과: `bun run test`
- [ ] 빌드 성공: `bun run build`
- [ ] 식당 추가 플로우 end-to-end: 검색 → 선택 → 메뉴 2개 입력 → 저장 → 추천 화면에서 카드 표시 확인

---

### Task 6: 식당 상세 + 방문 기록 자동 저장 + 상세 내 삭제

- **담당 시나리오**: Scenario 2 (full), Scenario 8 (full), Scenario 9 (partial — 상세 화면 진입점)
- **크기**: M (4 파일 + 테스트)
- **의존성**: Task 1, Task 5 (`use-restaurants`)
- **참조**:
  - shadcn — Button, Input
  - next-best-practices — async params (`params: Promise<{ id: string }>`)
  - wireframe: Screen 3 (식당 상세)
- **구현 대상**:
  - `hooks/use-visits.ts` (addVisit, isRecentVisit, dedup 동일 날짜)
  - `components/lunch-finder/restaurant-detail.tsx` (`'use client'`, 진입 시 `addVisit()` 호출, 우상단 삭제 버튼 + 인라인 확인 포함)
  - `components/lunch-finder/restaurant-detail.test.tsx`
  - `app/restaurants/[id]/page.tsx`
- **수용 기준**:
  - [ ] 상세 화면 진입 시 전체 메뉴(이름·가격) 목록 표시
  - [ ] 상세 진입 → 뒤로가기 → 추천 화면 새로 열기 → 해당 식당 카드 미포함
  - [ ] 같은 날 같은 식당 두 번 진입해도 방문 기록 1건만 생성
  - [ ] 메뉴 × 클릭 → 해당 메뉴 삭제, 목록 1개 감소
  - [ ] 마지막 메뉴 삭제 → "메뉴 없음" 안내 표시
  - [ ] 우상단 삭제 버튼 클릭 → 화면 내 인라인 확인 UI 표시
  - [ ] 인라인 확인 후 삭제 → `/restaurants`로 이동, 목록에서 해당 식당 미포함
- **검증**: `bun run test -- restaurant-detail`

---

### Task 7: 식당 목록 + 목록 내 삭제 + 하단 네비게이션

- **담당 시나리오**: Scenario 9 (full — 목록 삭제 경로 완결)
- **크기**: M (4 파일 + 테스트)
- **의존성**: Task 1, Task 5 (`use-restaurants`), Task 6 (삭제 로직 재사용)
- **참조**:
  - shadcn — Card, Badge, Button
  - wireframe: Screen 4 (식당 목록 — 인라인 카드 확인 패턴)
- **구현 대상**:
  - `components/lunch-finder/bottom-nav.tsx` (`'use client'`, `usePathname()` 활성 탭 표시)
  - `components/lunch-finder/restaurant-list.tsx` (`'use client'`, 인라인 삭제 확인: 행 클릭 → 카드 확인 상태 전환)
  - `components/lunch-finder/restaurant-list.test.tsx`
  - `app/restaurants/page.tsx`
- **수용 기준**:
  - [ ] 식당 목록에 이름·카테고리·메뉴 수·최저가 표시
  - [ ] 식당 삭제 트리거 → 해당 행이 인라인 확인 상태로 전환 (삭제 / 취소 버튼 노출)
  - [ ] 확인 후 → 해당 식당 목록·추천 화면 양쪽에서 사라짐
  - [ ] 하단 "추천" 탭 → `/` 이동
  - [ ] 하단 "식당" 탭 → `/restaurants` 이동
- **검증**: `bun run test -- restaurant-list`

---

### Checkpoint: Tasks 6–7 이후 (최종)
- [ ] 모든 테스트 통과: `bun run test`
- [ ] 빌드 성공: `bun run build`
- [ ] 전체 시나리오 end-to-end: 식당 추가 → 추천 카드 확인 → 카드 탭(방문 기록) → 뒤로가기(추천에서 제거) → 식당 삭제 → 추천 화면 반영

---

## 미결정 항목

없음
