## 목표
플랫폼을 완전 무료로 전환. 구독 3단계(Free/Pro/Enterprise) 및 상세 보고서 건별 결제 시스템을 전부 제거하고, 모든 사용자에게 상세 분석 접근 권한 부여.

## 제거 대상

### 1. 페이지 & 라우트 (`src/App.tsx`)
- `/pricing` (Pricing 페이지)
- `/checkout/toss`, `/checkout/toss/success`, `/checkout/toss/fail`, `/checkout/toss/demo`
- `/checkout/toss/unlock`, `/checkout/toss/unlock/success`
- 관련 파일 삭제: `src/pages/Pricing.tsx`, `src/pages/checkout/*` 전체
- `PaymentTestModeBanner` 제거

### 2. 결제 관련 컴포넌트/훅/라이브러리
- `src/components/payments/` (PaymentMethodModal, UnlockReportModal)
- `src/components/common/UnlockOverlay.tsx`, `ProLockOverlay.tsx`
- `src/components/common/PaymentTestModeBanner.tsx`
- `src/components/mypage/SubscriptionCard.tsx`
- `src/hooks/usePaddleCheckout.ts`, `src/hooks/useAssetUnlock.ts`
- `src/lib/paddle.ts`, `src/lib/toss.ts`, `src/lib/entitlements.ts`
- `src/assets/paddle-logo*`, `src/assets/toss-payments-logo*`

### 3. Edge Functions (`supabase/functions/`)
- `payments-webhook`, `get-paddle-price`, `paddle-customer-portal`
- `toss-confirm-unlock`, `toss-issue-billing-key`, `toss-cancel-subscription`
- `_shared/paddle.ts`

### 4. AuthContext 정리 (`src/contexts/AuthContext.tsx`)
- `subscriptionTier`, `hasProAccess`, `refreshTier` 제거 또는 모두 무료/full access로 고정
- 안전한 방식: `hasProAccess`를 항상 `true` 반환하도록 하고 `subscriptionTier`를 `'pro'` 고정으로 유지 → 다른 컴포넌트 파급 최소화
- 그러나 요청이 "완전 제거"이므로, 사용처를 모두 제거하는 방향 선호

### 5. 네비게이션 & 링크 정리
- `Navbar` 에서 요금제 링크 제거
- `Home`, `Bridge`, `Mypage` 등에서 `/pricing`, `Pro 잠금 오버레이`, `구독 카드` 참조 제거
- `Analysis.tsx`에서 상세 보고서 잠금(UnlockOverlay/ProLockOverlay) 제거 → 모든 사용자에게 전체 분석 노출
- `Properties.tsx`, `AssetCard.tsx` 등의 잠금 UI 제거
- `AuthModal`의 결제 관련 문구 정리

### 6. DB & 마이그레이션
- 기존 `subscriptions`, `asset_unlocks`(있다면) 테이블은 그대로 두되 코드 참조만 제거 (데이터 보존).
- 신규 마이그레이션은 만들지 않음 (요청 범위 밖의 파괴적 변경 회피).

### 7. 환경 변수 / 시크릿
- `.env*` 에서 `VITE_TOSS_CLIENT_KEY`, `VITE_PADDLE_*` 관련 항목 제거
- Supabase 시크릿(Paddle/Toss)은 사용자에게 안내만 하고 직접 삭제하지 않음

### 8. 문서 / 메모리
- `mem://index.md`에서 결제 관련 Core 항목(`hasProAccess`, 카카오 로그인 관련 등) 정리
- `mem://features/payments`, `mem://features/pro-lock` 메모리 항목 제거 (index에서도 삭제)

## 기술 세부

### AuthContext 처리 방안
두 가지 선택:
- **A. 완전 삭제**: `subscriptionTier`, `hasProAccess`, `refreshTier`, `isAdmin` 중 결제 관련만 제거. 모든 사용처(수십 곳 예상)를 수정.
- **B. 스텁 유지**: 하위호환 위해 `hasProAccess: true` 고정, `subscriptionTier: 'pro'` 고정으로 유지. 사용처 수정 최소화.

→ **A(완전 삭제)** 권장: 사용자 요청이 "완전 제거"이며 장기 유지보수 관점에서 깔끔.

### 잠금 UI가 있는 곳 처리
- `<UnlockOverlay>`, `<ProLockOverlay>` 래퍼 제거 → 자식 컴포넌트를 그대로 노출
- `hasProAccess` 조건 분기 제거 → 조건 없는 렌더링

## 확인 필요 사항
1. **Mypage의 구독 카드**를 완전히 제거해도 되는지 (사용자 계정 정보 카드는 유지)
2. **결제 관련 시크릿/DB 테이블**은 그대로 두는 방향이 맞는지 (나중에 되돌릴 여지 확보)
3. **Bridge Solution 페이지**(`/bridge`)는 유지하는지 — 이는 프로젝트 단위 유료 실행 지원이라 구독과는 별개인데, 함께 없앨지 유지할지

## 산출물
- 삭제/수정된 파일 목록
- 빌드 & 타입체크 통과
- 앱 전역에서 요금제/결제/잠금 UI 완전 부재 확인
