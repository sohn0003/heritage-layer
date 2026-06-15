## 목표
Free 고객이 상세분석에서 Pro 잠금 콘텐츠를 보려고 할 때, **건당 15,000원 결제** 또는 **Pro 구독** 중 선택할 수 있는 모달을 띄우고, 결제 완료 시 해당 자산 1건만 영구 열람 가능하도록 합니다.

## 구현 계획

### 1. DB: 건별 결제 기록 테이블
새 테이블 `asset_unlocks` 생성 (마이그레이션):
- `user_id`, `asset_id` (unique pair)
- `amount` (15000), `payment_method` ('toss' | 'paddle')
- `payment_id` (토스 paymentKey / Paddle transaction id)
- `status` ('paid'), `created_at`
- RLS: 본인 행만 SELECT, service_role만 INSERT
- GRANT 포함

### 2. 권한 헬퍼 확장
`src/lib/entitlements.ts` 또는 새 훅 `useAssetUnlock(assetId)`:
- `hasProAccess(tier) || unlockedAssets.includes(assetId)` 으로 잠금 판정
- Analysis 페이지에서 Pro 잠금 영역의 `locked` prop을 이 통합 판정으로 교체

### 3. UI: 결제 선택 모달
`src/components/payments/UnlockReportModal.tsx` 신규:
- 두 가지 옵션 카드
  - **이 보고서만 보기 — 15,000원** (1회 결제, 해당 자산 영구 열람)
  - **Pro 구독하기 — 월 39,000원** (모든 보고서 무제한 + 분석/관심자산 무제한 등)
- "건별 결제" 선택 → 결제수단(토스/Paddle) 선택 → 각각 체크아웃 라우트로 이동
- "Pro 구독" 선택 → `/pricing` 이동

### 4. 결제 흐름
**토스 (단건 결제)**:
- 새 라우트 `/checkout/toss/unlock?assetId=...` (`TossUnlockCheckout.tsx`)
- 토스 일반결제 (빌링키 X) `requestPayment({ method: 'CARD', amount: 15000, orderId, orderName })`
- 성공 시 `/checkout/toss/unlock/success` → edge function `toss-confirm-unlock` 호출
  - 토스 `/v1/payments/confirm` 으로 승인
  - 성공하면 `asset_unlocks` insert (service_role)
- 실패 시 기존 `/checkout/toss/fail` 재사용

**Paddle (단건 결제)**:
- `create_product`로 `report_unlock` 상품 + `report_unlock_one` 가격 (₩15,000 또는 USD 환산) 1회성 생성
- 체크아웃 시 `customData: { type: 'asset_unlock', assetId, userId }`
- `payments-webhook`의 `transaction.completed` 핸들러에서 `customData.type === 'asset_unlock'`이면 `asset_unlocks` insert

### 5. Analysis 페이지 통합
`src/pages/Analysis.tsx`:
- `useAssetUnlock(assetId)`로 잠금 여부 판정
- `ProLockOverlay` 대신 새 `UnlockOverlay` 사용 — 클릭 시 `UnlockReportModal` open
- Pro 구독자/이미 결제한 자산이면 잠금 해제

### 6. 기술 메모
- 통화: 토스는 KRW 정수 단위. Paddle은 KRW 직접 지원 안 하므로 USD ≈ $11.50 (15,000원) 또는 KRW 지원 시 그대로 — 일단 토스만 우선, Paddle은 환산가 또는 추후 옵션으로 표시.
- 보안: 잠금 해제 판정은 서버 RPC `is_asset_unlocked(uid, asset_id)`도 추가하면 좋지만, 1차에서는 클라이언트 쿼리 + RLS로 충분 (민감 데이터 SELECT 자체는 별도 컬럼 가드 필요시 후속).
- 환불 정책: Refund 페이지에 "건별 보고서 결제는 열람 전 24시간 내 환불 가능" 등 한 문장 추가 권장 (후속).

## 작업 순서
1. 마이그레이션: `asset_unlocks` 테이블
2. 훅: `useAssetUnlock`
3. 모달: `UnlockReportModal`
4. 토스 단건 결제 라우트 + edge function `toss-confirm-unlock`
5. Paddle 상품 생성 + 웹훅 분기
6. Analysis 페이지 잠금 로직 교체
7. App.tsx 라우트 등록

## 확인 필요
- **Paddle도 함께 지원**할까요, 아니면 **토스 단건 결제만** 먼저 붙일까요? (Paddle KRW 미지원이라 USD 환산이 됩니다)
- 가격은 **15,000원 고정 / 자산 1건 영구 열람**으로 진행해도 될까요?
