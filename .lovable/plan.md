## 목표

관리자 페이지에서 매물 저장(신규/수정) 시 `calculateScore()`를 자동 실행하여 `scoring_grade`, `scoring_total`, `scoring_detail`을 계산·저장하고, 표시용 `grade`도 자동 동기화합니다. 수동 등급 입력 UI는 제거하고, 엑셀 업/다운로드에서도 등급 컬럼을 제외합니다.

## 작업 범위

### 1. 신규 파일: `src/lib/assetScoring.ts`
- 폼/DB 값 → `AssetInput`(scoring.ts) 매퍼
- `calculateScoringFields(asset)` → `{ scoring_grade, scoring_total, scoring_detail, grade }` 반환
- 저장 직전(insert/update/upsert) payload에 머지하는 헬퍼 제공

### 2. 값 매핑 (한글/단순값 → scoring enum)

```text
building_condition:
  양호 → remodel_possible
  보통 → partial_reinforcement
  노후 → major_repair
  심각 → demolish_rebuild

historical_value:
  상 → registered_heritage
  중 → architectural_art
  하 → ordinary

natural_scenery:
  상 → waterfront_view
  중 → good_nature
  하 → ordinary_urban

zoning_upgrade_gain / use_change_expansion:
  높음 → over_50 / major
  중간 → between_20_50 / minor
  낮음 → under_20 / minor
  없음 → impossible / none

zoning(자유 텍스트): 키워드 매칭
  포함 "중심상업"→commercial_central, "근린상업"→commercial_neighborhood,
  "일반상업"/"상업"→commercial_general, "준주거"→semi_residential,
  "2종"→residential_2nd, "3종"→residential_3rd, "1종"→residential_1st,
  "준공업"→semi_industrial, "자연녹지"→green_natural,
  "생산녹지"→green_production, "보전녹지"→green_conservation,
  "농림"→agricultural, "자연환경보전"→nature_conservation
  매칭 실패 시 residential_2nd 기본값
```

- 누락 숫자값(현재 건폐율/용적률 등)은 0 처리 또는 가능하면 `building_coverage`/`floor_area_ratio`로 대체
- `ownership_type === '사유'` → `isPrivateLand: true`, 그 외 `isPublicAsset: true`
- `estimatedROI`: 현재 폼/DB에 없음 → IRR 결과(`irr_result`)가 있으면 거기서 추출, 없으면 7로 기본 설정 (D2 중간점)

### 3. `src/pages/admin/AdminProperties.tsx` 수정
- `handleSave`에서 payload 구성 직후 `calculateScoringFields(payload)` 호출, 결과를 payload에 병합 후 insert/update
- 등급 Select UI 제거 (수동 입력 차단), `grade` 칼럼은 자동값
- 폼/`emptyForm`에서 `grade` 필드 제거
- 테이블의 "등급" 컬럼은 그대로 유지(자동 계산값 표시)
- 안내문 "점수 및 IRR은 알고리즘이 자동 계산합니다" 유지/강화

### 4. `src/lib/assetExcel.ts` 수정
- `ASSET_COLUMNS`에서 `grade`, `scoring_grade`, `scoring_total`, `scoring_detail`, `scoring_*` 자동계산 컬럼을 export 대상에서 제외 (이미 일부 제외돼 있으면 `grade`도 추가)
- 임포트 시에도 무시 (업서트 후 한 건씩 또는 일괄 재계산하여 `grade/scoring_*` 채움)
- 임포트 루프에서 각 행 업서트 직후 `calculateScoringFields` 적용

### 5. (선택) 일회성: 기존 데이터 재계산
- 추후 별도 요청 시 처리(이번 작업에서는 신규 저장/엑셀 업로드부터 적용)

## 영향 범위
- DB 스키마 변경 없음
- `src/algorithm/scoring/scoring.ts` 변경 없음(요청대로 유지)
- 변경 파일: `src/pages/admin/AdminProperties.tsx`, `src/lib/assetExcel.ts`, 신규 `src/lib/assetScoring.ts`
