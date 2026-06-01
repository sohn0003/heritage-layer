## 보안 알림 (먼저 확인 필요)

**시크릿 키가 채팅에 평문으로 노출되었습니다.** 채팅 로그는 안전하지만, 만일을 위해 토스 대시보드에서 **시크릿 키 재발급**을 권장드립니다. 새 키를 받으면 Lovable Cloud 시크릿 매니저(`add_secret`)에 안전하게 저장합니다 — 채팅으로 다시 보내지 말고, 시크릿 입력 폼이 뜨면 거기에 붙여넣어 주세요.

- **클라이언트 키** (`test_ck_...`): 브라우저 노출용. `VITE_TOSS_CLIENT_KEY`로 `.env`에 저장 → 코드에서 import.
- **시크릿 키** (`test_sk_...`): 절대 프론트에 노출 금지. `TOSS_SECRET_KEY` 시크릿으로 저장 → Edge Function에서만 사용.

## 토스페이먼츠 결제 구조 (Paddle과 다른 점)

토스는 **정기결제(구독)**가 빌링키(billingKey) 방식이라 Paddle처럼 한 번에 끝나지 않습니다:

```
[1회차] 사용자가 카드 등록 → authKey 발급 → 빌링키 발급 API → 즉시 첫 결제 승인
[N회차] 매월 cron/스케줄러가 빌링키로 자동결제 호출
```

이번 작업 범위: **1회차 빌링키 발급 + 첫 결제 승인까지** (자동 갱신 cron은 다음 단계).

## 구현 범위

### 1. 패키지 설치
- `@tosspayments/tosspayments-sdk` (브라우저)

### 2. 환경변수
- `.env.development` / `.env.production`에 `VITE_TOSS_CLIENT_KEY=test_ck_...` 추가
- Lovable Cloud 시크릿: `TOSS_SECRET_KEY` (재발급 받은 키)

### 3. DB 마이그레이션
- `subscriptions` 테이블에 컬럼 추가:
  - `provider TEXT NOT NULL DEFAULT 'paddle'` ('paddle' | 'toss')
  - `toss_billing_key TEXT` (암호화 검토 필요, 우선 평문 저장)
  - `toss_customer_key TEXT` (사용자 식별용 UUID)

### 4. 신규 페이지/컴포넌트
- `src/pages/checkout/TossCheckout.tsx` — 토스 결제위젯 렌더링 (카드 등록)
- `src/pages/checkout/TossSuccess.tsx` — 결제 성공 콜백 (`authKey`, `customerKey` 수신 → 빌링키 발급 호출)
- `src/pages/checkout/TossFail.tsx` — 결제 실패 콜백

### 5. Edge Functions (신규 3개)
- `toss-issue-billing-key`: authKey → 빌링키 발급 (Toss API)
- `toss-charge-billing-key`: 빌링키로 결제 승인 + `subscriptions` row 생성 (provider='toss')
- `toss-cancel-subscription`: 빌링키 삭제 + `subscriptions.status='canceled'`

### 6. Pricing 페이지 수정
- `PaymentMethodModal`에 `onSelectToss` 콜백 추가
- 토스 선택 시 `/checkout/toss?priceId=...&plan=...`로 navigate
- "준비 중" 토스트 제거

### 7. Mypage 구독 카드
- provider가 'toss'인 경우 토스 해지 흐름으로 분기 (Paddle Customer Portal 대신 `toss-cancel-subscription` Edge Function 호출)

## 가격 매핑

토스는 KRW 정수 단위. Pricing 페이지의 가격을 그대로 사용:
- Pro 월간: 39,000원
- Enterprise 월간: 300,000원
- Enterprise 연간: 3,000,000원

(Paddle의 priceId → 토스의 amount/orderName 매핑 테이블을 `src/lib/toss.ts`에 정의)

## 변경 없음

- Paddle 흐름 (`usePaddleCheckout`, `paddle.ts`, 웹훅, Customer Portal) — 그대로 유지
- algorithm/ 폴더
- 기타 페이지

## 향후 작업 (이번 범위 밖)

- 정기결제 자동 갱신 (Supabase cron + `toss-charge-billing-key` 스케줄링)
- 결제 실패 dunning 처리
- 토스 웹훅 수신 (현재는 폴링/직접 호출 기반)
- 빌링키 암호화 저장 (pgcrypto)

## 진행 순서

1. 시크릿 키 **재발급 + `add_secret`으로 저장** (사용자 액션)
2. DB 마이그레이션
3. 패키지 설치 + 클라이언트 키 .env 등록
4. Edge Functions 3개 작성
5. 체크아웃 페이지 + 콜백 페이지
6. Pricing 모달 / Mypage 분기 연결
7. 테스트 카드(`4242 4242 4242 4242`)로 흐름 검증

이대로 진행할까요?
