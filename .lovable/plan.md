# 예상 자산 매도가(토지 / 건물) 표시 및 재무 반영

## 목표
- Analysis 페이지의 COSMO-P 블록별 점수 카드 **바로 위**에 "예상 자산 매도가" 카드를 신설
- 카드 안에는 **토지 매도가**와 **건물 매도가** 두 항목을 각각 표시
- 관리자 페이지와 엑셀 업로드에서 두 값을 입력·수정할 수 있게 확장
- 매도가가 입력된 경우 재무 시나리오의 총 투자비에서 **토지 취득가**를 매도가 기준으로 대체하고, 매도가에 값이 없으면 기존 공시지가 × 대지면적 로직으로 폴백

## 기술 상세

### 1) 데이터베이스 (마이그레이션)
`public.assets` 테이블에 두 컬럼 추가 (nullable, 원 단위 정수):
- `asking_land_price` bigint (매도자 희망 토지 가격, 원)
- `asking_building_price` bigint (매도자 희망 건물 가격, 원)

컬럼만 추가하는 ALTER이므로 신규 GRANT/RLS 변경은 불필요.

### 2) 관리자 페이지 (`src/pages/admin/AdminProperties.tsx`)
- `PropertyForm` 타입, `initialForm`, `handleEdit`(row → form 매핑), `save`(form → payload)에 두 필드 추가
- 공시지가 입력 칸 근처(자산 정보 섹션)에 "예상 매도가 - 토지(원)", "예상 매도가 - 건물(원)" `Input type="number"` 두 개 추가

### 3) 엑셀 업로드 (`src/lib/assetExcel.ts`)
`ASSET_EXCEL_COLUMNS`에 두 항목 추가:
- `{ key: 'asking_land_price', label: '예상매도가-토지(원)', type: 'number' }`
- `{ key: 'asking_building_price', label: '예상매도가-건물(원)', type: 'number' }`

### 4) Analysis 페이지 (`src/pages/Analysis.tsx`)
**UI**: 372번 라인 "COSMO-P 블록별 점수" `Card` 위에 신규 카드 삽입.
```
[예상 자산 매도가]
  토지 매도가 : xxx,xxx,xxx원  (혹은 "매도자 미제시")
  건물 매도가 : xxx,xxx,xxx원
  합계        : xxx,xxx,xxx원
```
- 카드 스타일은 기존 `Card + CardHeader + CardContent` 패턴 유지, `grid sm:grid-cols-2` 로 두 칸 배치
- 값이 null인 경우 "매도자 미제시"로 표시

**재무 반영**: `Analysis.tsx`에서 `runFinancialAnalysis`/시나리오 계산에 넘기는 `landValuePerSqm` 산출 시 매도가 우선 사용:
```
effectiveLandValuePerSqm =
  asking_land_price && land_area
    ? asking_land_price / land_area
    : asset.land_value_per_sqm ?? 4_500_000
```
- 두 군데(106, 153번 라인)에 동일 적용
- 건물 매도가는 별도 취득가 항목이 없으므로 `irr-calculator`의 `softCost`나 별도 인풋에 더하지 않고, 향후 확장을 위해 우선 **표시 전용**으로 유지 → 단, 총 투자비 카드 아래에 "* 매도가 기준" 표기를 노출해 사용자에게 반영 여부를 명확히 안내

> 재무 로직에 토지+건물 합산을 한 번에 태우는 방식으로 갈 경우 `irr-calculator.ts`의 `landCost` 산식을 조정해야 하는데, 이는 알고리즘 담당(사용자) 영역이므로 이번 작업에서는 **토지 매도가만 landValuePerSqm으로 환산**해 반영하고, 건물 매도가는 표시 + 데이터 저장까지만 처리합니다. 이 정책에 대해 다른 처리 원하시면 알려주세요.

### 5) 타입
Supabase 마이그레이션 승인 시 `src/integrations/supabase/types.ts`가 재생성되므로 별도 수동 편집 불필요.

## 변경 파일 요약
- `supabase/migrations/<timestamp>_add_asking_prices.sql` (신규)
- `src/pages/admin/AdminProperties.tsx`
- `src/lib/assetExcel.ts`
- `src/pages/Analysis.tsx`
