## 목표
관리자의 수동 클릭 없이 좌표가 자동 채워지고, Properties 페이지에서 카드 클릭 시 지도가 해당 위치로 확대되도록 합니다.

## 1. 자동 지오코딩 (관리자 작업 흐름)

**AdminProperties 저장 로직 (`handleSave`)**
- 저장 직전, 위/경도 입력값이 비어있고 주소가 변경되었거나 신규일 경우 `geocode-address` Edge Function 자동 호출.
- 결과 좌표를 payload에 병합한 뒤 insert/update 실행.
- 실패해도 저장 자체는 진행 (좌표만 null 유지, 토스트로 알림).
- 기존 "주소로 좌표 자동 채우기" 버튼은 제거(수동 보정이 필요한 경우를 위해 남길지는 선택사항 — 기본은 제거).

**Excel 업로드 (`importAssetsFromExcel`)**
- 행 처리 시 주소가 있고 위/경도가 비어 있으면 `geocode-address` 호출하여 좌표 자동 채우기.
- API 부하 방지를 위해 행 간 ~120ms 지연.
- 실패한 행은 좌표 없이 그대로 진행.

**"좌표 일괄 변환" 버튼**: 유지 (과거 데이터 보정용).

## 2. Properties 카드 클릭 → 지도 확대

**상태 관리 변경**
- 현재 `setSelectedAsset`는 setter만 사용되고 값은 버려지고 있음. 이를 활용.
- `selectedAssetId` 상태 추가.

**NaverMap 컴포넌트 확장**
- 새 prop `focusedMarker?: { lat: number; lng: number }` 추가.
- `focusedMarker`가 변경되면 `panTo(latlng)` + `setZoom(16)` 호출.
- 선택된 마커는 시각적으로 강조 (다른 아이콘 또는 z-index/animation).

**Properties 페이지 인터랙션**
- AssetCard 클릭 → `selectedAssetId` 설정 → 좌표가 있으면 지도가 해당 위치로 부드럽게 줌인.
- 마커 클릭 → 동일하게 selectedAssetId 설정 (선택 상태 동기화) + 리스트에서 해당 카드로 scrollIntoView.
- 선택된 카드는 ring/border로 강조.

## 3. 사용자 경험 개선 사항

- 자동 지오코딩 중에는 저장 버튼에 "좌표 조회 중..." 표시.
- 좌표 없는 자산은 카드 클릭 시 토스트로 "이 자산은 좌표 정보가 없습니다" 안내.
- Excel 업로드 결과 토스트에 "좌표 자동 추가 N건" 표기.

## 기술 세부 (영향 파일)

- `src/pages/admin/AdminProperties.tsx`: `handleSave` 안에서 geocode 호출, 폼 내 자동 채우기 버튼 제거.
- `src/lib/assetExcel.ts`: 행별 geocode 호출 추가, ImportResult에 `geocoded` 필드 추가.
- `src/components/map/NaverMap.tsx`: `focusedMarker` prop, panTo + 강조 마커 처리.
- `src/pages/Properties.tsx`: `selectedAssetId` 상태, 카드 클릭→focus, 마커 클릭→카드 스크롤/하이라이트.

## 비용/제약 메모

네이버 Geocoding API는 일일 무료 한도가 있으므로(보통 25,000건/일) 일반 운영에서는 충분합니다. Excel 대량 업로드 시 API 한도 초과를 방지하기 위해 행간 지연을 둡니다.