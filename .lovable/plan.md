## 목표
Pricing 페이지에서 Pro / Enterprise 구독 버튼을 클릭하면, 바로 Paddle 체크아웃이 열리는 대신 **결제수단 선택 모달**이 먼저 뜨도록 합니다. 사용자가 Paddle을 선택하면 기존 Paddle 체크아웃이 열리고, 토스페이먼츠를 선택하면 "준비 중" 안내가 표시됩니다.

## 구현 범위

### 1. 신규 컴포넌트: `src/components/payments/PaymentMethodModal.tsx`
- shadcn `Dialog` 기반 모달
- 두 개의 결제수단 카드 버튼:
  - **Paddle** — 공식 로고 + "해외 카드 / 글로벌 결제" 보조 텍스트 + "사용 가능" 배지
  - **토스페이먼츠** — 공식 로고 + "국내 카드 · 계좌이체 · 간편결제" 보조 텍스트 + "준비 중" 비활성 배지
- Props: `open`, `onOpenChange`, `onSelectPaddle`, `planLabel`(예: "Pro 월간")
- 토스 버튼은 `disabled` + 클릭 시 `toast.info("토스페이먼츠 결제는 곧 지원될 예정입니다.")`

### 2. 로고 에셋 (`src/assets/`)
공식 SVG 로고를 다운로드해 `lovable-assets`로 CDN 업로드 후 컴포넌트에서 import:
- `paddle-logo.svg.asset.json`
- `toss-payments-logo.svg.asset.json`

브랜드 로고 다운로드 실패 시 대안: 워드마크 텍스트 + 브랜드 컬러(Paddle `#FDDD35` 배경, Toss `#0064FF` 텍스트)로 폴백.

### 3. `src/pages/Pricing.tsx` 수정
- `useState`로 선택된 `priceId` / 모달 open 상태 관리
- 기존 `startCheckout(priceId)` 호출을 `openPaymentMethodModal(priceId)`로 교체
- 모달의 Paddle 선택 콜백에서 기존 `openCheckout(...)` 흐름 실행
- 다른 로직(인증 체크, customData, successUrl)은 그대로 유지

### 4. 변경 없음
- `usePaddleCheckout`, `paddle.ts`, 웹훅, DB, 구독 갱신 로직 — 손대지 않음
- algorithm/ 폴더 — 손대지 않음
- 기타 페이지(Bridge, Mypage 등) — 손대지 않음

## 기술 세부사항

```
[유저: 'Pro 구독 시작하기' 클릭]
        ↓
[로그인 체크] → 미로그인 시 AuthModal
        ↓
[PaymentMethodModal 오픈] ─── planLabel="Pro 월간"
   ├── Paddle 선택 → openCheckout({priceId, ...})  (기존 흐름)
   └── 토스 선택 → toast.info("준비 중")  (모달 유지)
```

- 모달은 Pricing 페이지 레벨에 단 하나만 두고, 어떤 priceId가 선택됐는지 state에 보관
- 향후 토스 연동 시 `onSelectToss` 콜백만 추가하면 되도록 인터페이스 분리

## 향후 작업 (이번 작업에는 포함 안 됨)
- 토스페이먼츠 가맹점 등록 + API 키(`TOSS_CLIENT_KEY`, `TOSS_SECRET_KEY`) 발급
- 토스 결제 위젯 SDK 통합 + Edge Function 결제 승인 처리
- 구독형 결제(빌링키) 처리 — 토스는 정기결제 구조가 Paddle과 달라 별도 설계 필요
- `subscriptions` 테이블에 `provider` 컬럼 추가 ('paddle' | 'toss')

진행해도 될까요?