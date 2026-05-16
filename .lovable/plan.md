## 목표

답변 기반으로 다음 4가지를 구현합니다.
1. Pro/Enterprise 권한 판정 통일 (Critical 버그)
2. 결제 완료 후 UI 자동 갱신 (Realtime + redirect refetch)
3. 마이페이지에 구독 관리 카드 + Paddle Customer Portal 연동
4. Pricing의 Enterprise 월/연 토글

## 작업 항목

### A. Entitlement 헬퍼 통일 (Critical 버그 수정)
- 신규 `src/lib/entitlements.ts`에 `hasProAccess(tier)` (= `tier !== 'free'`) 헬퍼 추가
- 사용처 일괄 교체:
  - `src/pages/Analysis.tsx` — `isPro` → `hasProAccess(subscriptionTier)`
  - `src/pages/Mypage.tsx` — 동일. 플랜 뱃지는 `subscriptionTier` 그대로 노출 (Free / Pro / Enterprise)
  - `src/components/cards/AssetCard.tsx` — 기존 free 체크 유지 (이미 OK)
- AuthContext에 `hasProAccess` 파생값을 함께 export해서 호출부 단순화

### B. 결제 후 실시간 갱신
1. DB 마이그레이션: `alter publication supabase_realtime add table public.subscriptions;` (RLS는 이미 user 본인만 SELECT 허용)
2. AuthContext에 다음 로직 추가:
   - 로그인 상태에서 `subscriptions` 채널 구독 (`filter: user_id=eq.{user.id}`)
   - 이벤트 수신 시 `profiles.subscription_tier` 재조회 → `setSubscriptionTier()` 갱신
3. `Mypage.tsx` 마운트 시 `?checkout=success` 쿼리 감지하면:
   - 토스트 "구독이 활성화되었습니다"
   - 강제 profile + subscription refetch (Realtime 누락 보장)
   - URL 정리 (`?` 제거)

### C. 마이페이지 구독 관리 카드
- 새 컴포넌트 `src/components/mypage/SubscriptionCard.tsx`
  - `subscriptions` 테이블 조회 (`environment` 필터 포함, `created_at desc limit 1`)
  - 표시: 플랜 이름 / 상태 배지 / 다음 결제일 / `cancel_at_period_end`면 "기간 종료 시 해지 예정"
  - 버튼:
    - "구독 관리" → 엣지 함수 호출 후 받은 URL을 새 탭으로 오픈
    - Free 사용자에게는 "업그레이드" → `/pricing`
- 신규 엣지 함수 `supabase/functions/paddle-customer-portal/index.ts`
  - JWT 검증 (`getClaims`)
  - 사용자의 최신 `subscriptions` 행에서 `paddle_customer_id`, `paddle_subscription_id`, `environment` 조회
  - `getPaddleClient(env).customerPortalSessions.create(customerId, [subscriptionId])`
  - `urls.general.overview` 반환
  - `verify_jwt = false` 유지 (in-code 검증)

### D. Pricing — Enterprise 월/연 토글
- `src/pages/Pricing.tsx`의 Enterprise 카드에 상단 토글(월간 ₩300,000 / 연간 ₩3,000,000) 추가
- 선택 값에 따라 `openCheckout({ priceId: 'enterprise_monthly' | 'enterprise_yearly' })`
- 연간 선택 시 "약 17% 절약" 보조 문구

### E. 보안 권고 (사용자 액션)
- Leaked Password Protection 활성: Lovable Cloud → Users → Auth Settings → Password HIBP Check ON
  - 본 작업의 일부로 자동 적용은 하지 않습니다 (정책 결정 사안)

## 기술 메모

- Customer Portal URL은 일회용이므로 절대 캐시하지 말 것 (매 클릭마다 생성)
- 새 탭(`window.open(url, '_blank', 'noopener')`)으로 열기 — iframe 불가
- Realtime `filter`는 단일 컬럼만 지원하므로 `user_id`로만 필터, env 필터는 콜백 내 refetch에서 적용
- `subscriptions.environment` 필터: 클라이언트는 `getPaddleEnvironment()` 사용 (이미 `src/lib/paddle.ts`에 있음)
- 신규 엣지 함수 deploy 후 클라이언트는 `supabase.functions.invoke('paddle-customer-portal')`로 호출

## 테스트 가이드 (구현 후)

미리보기에서 다음 시나리오로 점검:

1. **Pro 구독 신청**
   - 로그인 → `/pricing` → "Pro 구독 시작하기"
   - Paddle 오버레이에서 테스트 카드 `4242 4242 4242 4242`, CVC `123`, 미래 만료일, 임의 이름·이메일·국가
   - 결제 완료 → 자동으로 `/mypage?checkout=success` 이동
   - 토스트 표시 + 5초 내 플랜이 "Pro"로 갱신되어야 함 (Realtime)

2. **Enterprise 연간 결제**
   - `/pricing` → Enterprise 카드 "연간" 선택 → "구독 시작하기"
   - 결제 완료 → 마이페이지 플랜 "Enterprise" + 다음 결제일이 1년 뒤로 표시

3. **권한 확인 (Critical 버그)**
   - Enterprise 사용자로 `/analysis?id=...` 진입 → 재무 시나리오·Pro 콘텐츠가 잠금 없이 보여야 함 (이전엔 잠겼음)

4. **구독 취소 (Customer Portal)**
   - 마이페이지 → "구독 관리" → 새 탭에서 Paddle 포털 → 구독 취소
   - 마이페이지에 "기간 종료 시 해지 예정" 표시 (Realtime 반영)
   - 기간 종료일까지는 Pro 콘텐츠 접근 유지 (`has_active_subscription` grace period)

5. **결제 실패 시뮬레이션** (선택)
   - 카드 `4000 0000 0000 0002`로 결제 → 즉시 실패 토스트
   - 카드 `4000 0027 6000 3184`로 결제 → 성공, 이후 갱신은 실패 (long-term 테스트는 별도)

테스트 카드 참고: https://developer.paddle.com/concepts/payment-methods/credit-debit-card

## 산출물

- 신규: `src/lib/entitlements.ts`, `src/components/mypage/SubscriptionCard.tsx`, `supabase/functions/paddle-customer-portal/index.ts`, 마이그레이션 1건
- 수정: `AuthContext.tsx`, `Analysis.tsx`, `Mypage.tsx`, `Pricing.tsx`, `supabase/config.toml`

승인하시면 위 순서대로 진행합니다.
