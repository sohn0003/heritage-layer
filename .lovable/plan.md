# Analysis 페이지 사용자 입력 확장 + 알고리즘 모듈 업데이트

## 1. 알고리즘 모듈 교체

업로드된 v2 파일을 기존 모듈에 그대로 덮어쓰기.

- `src/algorithm/financial/irr-calculator.ts` ← `user-uploads://irr-calculator-5.ts`
- `src/algorithm/recommend/recommend-scenarios.ts` ← `user-uploads://recommend-scenarios-2.ts`

신규 노출 필드:
- `AnalyzeAssetInput.overrideAnnualRevenue`, `overrideOperatingMargin`
- `IRRResult.recommendedAnnualRevenue`, `totalInvestmentPaybackYears`, `paybackYears`
- `UseTypeMix.presaleRatio` (분양 가능 용도에만 적용)

## 2. Analysis 페이지 (`src/pages/Analysis.tsx`) UI 추가

각 시나리오 탭 안의 "자기자본 비율 슬라이더" 옆에 새 입력 블록을 둠. 시나리오별로 독립 상태 관리.

### 2-1. 상태
시나리오 rank 별로 보관:
```ts
const [presaleByRank, setPresaleByRank]   = useState<Record<number, number>>({});      // 0~100, 10 단위
const [revenueByRank, setRevenueByRank]   = useState<Record<number, number | undefined>>({});
const [marginByRank,  setMarginByRank]    = useState<Record<number, number>>({});      // 10~70, 기본 40
```
자산 변경 시 초기화.

### 2-2. 입력 컴포넌트

**(a) 분양 비율 슬라이더** — `useTypeMix`에 분양 가능 용도(`residential`, `mixed_use_residential`, `knowledge_industry`, `office`, `accommodation`)가 1개 이상 포함된 시나리오에서만 표시. 0~100%, step 10. 기본값 0.

**(b) 연간 매출 입력** — `<Input type="number">`. 단위: 억원으로 표시(내부는 원). 초기값 = `scenario.irrResult.base.recommendedAnnualRevenue`. 빈 값/0이면 override 미적용(권장값 자동 사용). "권장값으로 되돌리기" 버튼.

**(c) 영업이익률 입력** — `<Input type="number">` 또는 슬라이더, 10~70%, 기본 40. 범위 외 값은 clamp.

### 2-3. 재계산 (`displayScenarios` 확장)

기존 `analyzeAsset` 호출에 override 필드 추가:
```ts
analyzeAsset({
  ...,
  overrideEquityRatio:    equityByRank[base.rank],
  overrideAnnualRevenue:  revenueByRank[base.rank],     // 원 단위
  overrideOperatingMargin: marginByRank[base.rank],
  // presale: useTypeMix 깊은 복사 후 분양 가능 용도에 presaleRatio 주입
});
```
`useTypeMix`에 슬라이더 값 주입은 `analyzeAsset` 호출 전 별도 매핑(현재는 추천 엔진이 mix를 결정 → presale을 IRR 단계에 반영하려면 추천 엔진 내부 사용 mix에 적용해야 함). 가장 간단한 방법: `recommend-scenarios.ts`가 mix를 결정해 IRR을 계산하므로, Analysis 단에서 분양율 적용을 위해 `analyzeAsset`에 `overridePresaleRatio?: number` 같은 옵션을 추가하면 좋겠지만, 업로드 본 알고리즘에는 해당 옵션이 없음 → **현 구현 범위 내에서는 분양율 슬라이더 UI는 노출하되, "분양 시나리오 적용"은 백엔드 알고리즘에서 추후 지원**으로 가거나, IRR 단계 후 표시값(연간매출/회수기간) 보정을 위해 단순 비율 가공만 적용.

→ **권장**: 분양율 슬라이더는 사용자 입력 UI까지만 추가하고, `presale*` 알고리즘 반영은 알고리즘 본인이 직접 작성하는 영역(`algorithm/`)에 후속 패치. 본 작업에서는 슬라이더 값을 state로만 보관·표시.

(원치 않으시면, recommend-scenarios.ts에 `overridePresaleRatio` 옵션을 추가하는 식으로 확장 가능 — 알고리즘 폴더는 사용자 영역이므로 사전 확인 필요.)

### 2-4. 회수기간 표시 분리

기존 단일 "투자회수기간 (년)" 행을 두 행으로 분리:
- `운영투자비 회수기간 (무차입 기준)` → `totalInvestmentPaybackYears`
- `자기자본 회수기간 (대출상환 후 실제값)` → `paybackYears`

보수/기본/낙관 3컬럼 모두 표시. 값 0 또는 비유한일 때 `--`.

## 3. 확인 사항

1. **분양 비율 슬라이더의 실제 알고리즘 반영을 이번에 함께 처리할까요?** algorithm 폴더는 사용자 직접 작성 영역이라 원칙적으로 건드리지 않습니다. 두 옵션:
   - A. UI만 추가(state 보관·표시). 알고리즘 반영은 추후 직접 작성.
   - B. `analyzeAsset`/`recommend-scenarios`에 `overridePresaleRatio` 옵션을 새로 추가(알고리즘 파일도 함께 수정).

2. **연간 매출 입력 단위**: 억원(권장, 사용성 우수) vs 원. 어느 쪽을 표시할까요?
