## assets 테이블 컬럼 추가

기존 `assets` 테이블에 이미 존재하는 컬럼: `building_coverage`, `floor_area_ratio` (이름이 다르므로 사용자가 추가 요청한 `current_*` / `legal_max_*`는 별도로 추가). 나머지는 모두 신규.

### 마이그레이션 SQL (요약)

`ALTER TABLE public.assets ADD COLUMN IF NOT EXISTS ...` 형태로 28개 컬럼을 한 번에 추가:

| 컬럼명 | 타입 |
|---|---|
| current_building_coverage | numeric |
| legal_max_building_coverage | numeric |
| current_floor_area_ratio | numeric |
| legal_max_floor_area_ratio | numeric |
| current_floor_area | numeric |
| land_value_per_sqm | numeric |
| asset_use_type | text |
| population_trend | text |
| commercial_density | text |
| distance_to_center | numeric |
| historical_value | text |
| natural_scenery | text |
| building_condition | text |
| is_private_negotiation | boolean (default false) |
| is_citizen_proposal | boolean (default false) |
| is_waterfront_environmental | boolean (default false) |
| is_military_heritage_zone | boolean (default false) |
| is_urban_facility_conflict | boolean (default false) |
| zoning_upgrade_gain | text |
| use_change_expansion | text |
| has_conversion_precedent | boolean (default false) |
| is_urban_regeneration_area | boolean (default false) |
| is_abandoned_school_budget | boolean (default false) |
| is_balanced_dev_budget | boolean (default false) |
| scoring_grade | text |
| scoring_total | numeric |
| scoring_detail | jsonb |
| irr_result | jsonb |

### 영향 범위

- 스키마 변경만 수행. RLS 정책은 기존 정책이 그대로 적용되므로 변경 불필요.
- 마이그레이션 승인 후 `src/integrations/supabase/types.ts`가 자동 갱신됨.
- 기존 코드(AssetCard, Properties, Analysis, AdminProperties 등)는 그대로 동작 — 신규 컬럼은 nullable이라 기존 INSERT/SELECT에 영향 없음.
- 관리자 입력 폼/분석 페이지에 신규 필드를 노출하는 작업은 **이번 계획에 포함하지 않음** (요청 시 후속 작업).

### 기존 컬럼 처리

`building_coverage`, `floor_area_ratio`는 기존에 존재하지만 이름이 다르므로 **삭제하지 않음**. 사용자가 "법정 vs 현재" 구분을 명확히 하려는 의도이므로 신규 `current_*` / `legal_max_*` 컬럼을 별도로 추가. 추후 정리가 필요하면 별도 요청 바람.
