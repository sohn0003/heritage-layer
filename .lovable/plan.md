# Bridge 페이지 수정

## 1. 네비게이션 메뉴 라벨 변경
- `src/components/common/Navbar.tsx`
- `navItems`의 `{ label: 'Bridge', href: '/bridge' }` → `{ label: 'Solution', href: '/bridge' }`
- 경로(`/bridge`)는 유지

## 2. 레벨별 금액 비노출
- `src/pages/Bridge.tsx`
- 3개 레벨 카드(`levels` 배열)에서 가격 표시 제거:
  - `price`, `priceNote` 필드 및 렌더링 부분 삭제
  - "+ 성공보수" 배지 및 하단 `successFee` 안내 박스도 함께 제거 (금액 관련 정보이므로)
- 카드 레이아웃은 아이콘 → 레벨명 → 타이틀 → 역할 설명 → 타깃 → 항목 리스트 순으로 정리

## 3. "누가 어느 레벨을 쓰는가" 섹션 삭제
- `src/pages/Bridge.tsx`
- 해당 섹션 전체 제거 (`customerMatrix` 데이터 배열 + Table 렌더 블록)
- 미사용된 `Table*` import도 정리

## 변경 파일
- `src/components/common/Navbar.tsx`
- `src/pages/Bridge.tsx`
