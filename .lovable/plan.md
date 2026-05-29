# 자산 엑셀 컬럼 ↔ 클라우드 DB 스키마 점검 결과

`src/lib/assetExcel.ts`의 `ASSET_COLUMNS`를 클라우드 `assets` 테이블 실제 스키마와 대조했습니다.

## 발견된 문제

### 🔴 1. 존재하지 않는 컬럼 포함 — `asset_use_type`
- 엑셀에 `{ key: 'asset_use_type', label: '자산 활용 용도' }`가 존재
- 그러나 DB `assets` 테이블에 **이 컬럼은 없음**
- `AdminProperties.tsx:89`에도 주석으로 명시: *"asset_use_type 제거됨 — 알고리즘이 자동 추천"*
- 영향:
  - **Import 시**: 엑셀로 이 값을 채워 업로드하면 Supabase가 `column "asset_use_type" of relation "assets" does not exist` 오류 반환 → 해당 행 실패
  - **Export 시**: 항상 빈 값으로 출력되어 사용자 혼란

### 🟡 2. 누락된 자동 계산 컬럼 (의도된 제외이지만 보강 권장)
편집 불가 필드는 의도적으로 제외되어 있으나, 다음은 **export에 읽기 전용으로 포함**되면 운영에 도움됩니다.
- `recommended_use_type` (추천 활용 용도) — 알고리즘 산출값
- `recommended_dev_direction` (추천 개발 방향) — 알고리즘 산출값
- `scoring_grade`, `scoring_total` (점수/등급) — 현재 export에서 보이지 않음

→ Import 시에는 무시(자동 재계산)하고, Export 시에만 노출하는 방식이 적절합니다.

### ✅ 정상 매핑 확인된 컬럼 (37개)
id, address, asset_type, is_published, gov_cooperation, zoning, building_coverage, floor_area_ratio, land_area, idle_years, ownership_type, latitude, longitude, admin_memo, current_building_coverage, legal_max_building_coverage, current_floor_area_ratio, legal_max_floor_area_ratio, current_floor_area, land_value_per_sqm, population_trend, commercial_density, distance_to_center, historical_value, natural_scenery, building_condition, is_private_negotiation, is_citizen_proposal, is_waterfront_environmental, is_military_heritage_zone, is_urban_facility_conflict, zoning_upgrade_gain, use_change_expansion, has_conversion_precedent, is_urban_regeneration_area, is_abandoned_school_budget, is_balanced_dev_budget

## 수정 계획

### Step 1 — 잘못된 컬럼 제거 (필수)
`src/lib/assetExcel.ts`의 `ASSET_COLUMNS`에서 `asset_use_type` 항목 삭제.

### Step 2 — 읽기 전용 export 컬럼 추가 (권장)
`ASSET_COLUMNS`를 `editable`/`readonly` 두 그룹으로 분리:
- **편집 가능 (import + export)**: 기존 37개
- **읽기 전용 (export only)**: `scoring_grade`, `scoring_total`, `recommended_use_type`, `recommended_dev_direction`

`exportAssetsToExcel`은 두 그룹 모두 출력, `importAssetsFromExcel`은 editable 그룹만 payload에 포함하도록 수정. 헤더 라벨에 "(읽기 전용 / 자동 계산)" 표기 추가하여 사용자 혼란 방지.

### Step 3 — 검증
- Export → 새 엑셀에 추천/점수 컬럼이 채워져 나오는지 확인
- 수정 후 재 import → 행이 정상 update 되는지, 자동 계산 필드가 알고리즘으로 재산출되는지 확인

## 기술 메모
- DB 스키마 변경은 없음 (코드 변경만)
- `calculateScoringFields`는 그대로 사용 — import 시 점수/등급은 자동 갱신
- `recommended_use_type/dev_direction`은 현재 엑셀 import 경로에서는 재계산되지 않음 (AdminProperties 단건 저장 시에만 계산). 필요하면 Step 2와 함께 엑셀 import에도 시나리오 재계산 호출을 추가할 수 있으나, 별도 작업으로 분리 가능.

Step 2와 시나리오 재계산 포함 여부는 선택 사항입니다 — Step 1만 적용할지, Step 2까지 적용할지 알려주세요.
