# 자산 등급 불일치 문제 해결 계획

## 원인 분석

같은 자산이 Admin에서는 **B / 53.6점**, Analysis에서는 **C / 48.9점**으로 표시됩니다. 두 페이지가 서로 다른 입력으로 점수를 계산하기 때문입니다.

### 1) Admin (저장 시)
`AdminProperties.tsx` → `handleSave` → `calculateScoringFields(payload)`
- 내부적으로 `buildScoringInput` → `extractROI(a.irr_result)`로 ROI를 뽑습니다.
- 그러나 `payload.irr_result`는 이번 저장에서 갱신되지 않은 **이전 값(또는 null)** 입니다. null이면 기본 7%로 고정됩니다.
- 결국 D2(사업성) 점수에 옛 ROI가 반영된 grade가 DB에 저장됩니다.

### 2) Analysis (조회 시)
`Analysis.tsx` → `analyzeAsset()`이 IRR을 **실시간 재계산**한 뒤 그 IRR로 scoring을 다시 매깁니다(`assetInputBase`에서 preliminaryROI를 제거하므로 analyzeAsset 내부의 계산값이 사용).
- 따라서 land_value, loan_rates(system_config), projectYears, residualValueRatio 중 어느 하나라도 저장 시점과 달라지면 점수가 달라집니다.

### 3) algoConfig 차이
Admin `handleSave`는 `{ pf: 5.5, collateral: 4.8 }`, `projectYears: 10`, `residualValueRatio: 0.4`로 하드코딩.
Analysis는 `useAlgorithmConfig()`로 DB의 `loan_rates`/`system_config`를 읽음 → 두 경로의 파라미터가 다릅니다.

이 세 가지가 겹쳐 같은 자산의 score/grade가 어긋납니다.

## 해결 방향

**“알고리즘이 계산한 등급”을 단일 함수에서 산출하고, 저장 시 그 결과를 그대로 DB에 박아 Admin이 보여주는 값과 Analysis가 보여주는 값이 동일하도록** 만듭니다.

### 단계

**A. 공용 헬퍼 신설: `src/lib/assetScoring.ts`**
- `computeAssetAnalysis(asset, algoConfig)` 추가.
  - 내부에서 `buildScoringInput`로 input 생성 → `preliminaryROI` 제외 → `analyzeAsset(...)` 호출.
  - 반환: `{ scoring: ScoreResult, recommendation, irr }`.
- `calculateScoringFields`를 이 헬퍼 기반으로 재작성하여, `scoring_grade / scoring_total / scoring_detail / grade / irr_result / recommended_use_type / recommended_dev_direction`을 한 번에 계산.
  - 즉, 저장 시 D2에 사용되는 ROI = analyzeAsset이 방금 계산한 ROI. 더 이상 옛 `irr_result`에 의존하지 않음.

**B. Admin 저장 흐름 정리: `AdminProperties.tsx` `handleSave`**
- 현재 두 번 호출되는 `calculateScoringFields` + 추천용 `analyzeAsset` 블록을 `computeAssetAnalysis(payload, algoConfig)` **한 번**으로 합침.
- `algoConfig`는 `useAlgorithmConfig()`를 Admin에서도 사용하여 Analysis와 동일 파라미터 사용 (loan rates, projectYears, residualValueRatio).
- 결과를 그대로 payload에 머지 후 insert/update.

**C. Analysis 흐름도 같은 헬퍼로**
- `Analysis.tsx`의 `analysis = useMemo(...)`도 `computeAssetAnalysis(asset, algoConfig)`를 호출하도록 교체. 입력/파라미터/계산 경로가 Admin과 100% 동일해짐.

**D. 기존 자산(이미 저장된 row) 일관성 복구**
- 저장 시점 이후 알고리즘/요율이 바뀌면 DB의 `scoring_*`이 stale이 될 수 있음.
- AdminProperties 툴바에 **“등급 일괄 재계산”** 버튼 추가:
  - 모든 자산을 순회하며 `computeAssetAnalysis`로 다시 채점, `scoring_grade/scoring_total/scoring_detail/irr_result/recommended_*`를 update.
  - 진행 표시 + 완료 토스트(성공/실패 건수).
- 단건 수정 시에는 B로 자동 갱신되므로 추가 액션 불필요.

**E. 표시 측 정합성 점검**
- Admin 테이블/AssetCard에서 보여주는 `scoring_total`, `grade`/`scoring_grade`는 그대로 DB 값을 사용 → 이제 알고리즘 계산값과 동일.
- Analysis 상단 `GradeMeter`는 `scoringResult.grade / totalScore`를 사용 → 동일 헬퍼이므로 동일 값.

## 영향 파일

- `src/lib/assetScoring.ts` — `computeAssetAnalysis` 추가, `calculateScoringFields` 리팩터.
- `src/pages/admin/AdminProperties.tsx` — `handleSave` 단순화, `useAlgorithmConfig` 사용, “등급 일괄 재계산” 버튼 추가.
- `src/pages/Analysis.tsx` — `analysis` useMemo를 새 헬퍼로 교체(결과 동일성 보장).

## 검증

1. Admin에서 “서울 강서구 가양동 1492 (염강초)” 자산을 한 번 저장 → 토스트의 등급/점수가 Analysis 상단 미터의 등급/점수와 일치하는지 확인.
2. “등급 일괄 재계산” 실행 후 목록의 등급/점수 = Analysis 미터 값.
3. `loan_rates` 또는 `system_config` 변경 후 재계산 버튼을 누르면 양쪽 모두 동일하게 갱신.
